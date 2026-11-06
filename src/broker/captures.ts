import { randomUUID } from 'node:crypto';
import { crc32, inflateSync } from 'node:zlib';
import { z } from 'zod';
import type { CapturePost, CaptureRequest, Snapshot, ErrorCode } from '../lib/contracts/sketch';
import { SketchError } from '../lib/contracts/sketch';
import type { Sessions } from './sessions';
export type Delivery = { snapshot: Snapshot; assertCurrent(): void; markSent(): void; discard(): void };
type Pending = CaptureRequest & { sessionId: string; claimed: boolean; fulfilled: boolean; resolve: ((snapshot: Snapshot) => void) | null; reject: ((error: SketchError) => void) | null; timer: ReturnType<typeof setTimeout>; cleanup: () => void };
const messages: Record<ErrorCode, string> = {
  NO_SELECTION: 'Select a rectangle in the canvas.', EMPTY_SELECTION: 'Select a region containing ink.',
  SESSION_UNAVAILABLE: 'Bring the canvas forward and explicitly pair again.', BUSY: 'Wait for the current read, then retry.',
  CAPTURE_TIMEOUT: 'Bring the canvas forward, finish your gesture, and retry.', CAPTURE_FAILED: 'Finish your gesture and retry the capture.',
  PAYLOAD_TOO_LARGE: 'Select a smaller region and retry.',
};
export const captureError = (code: ErrorCode, status = 400) => new SketchError(code, messages[code], status);
export class Captures {
  private pending = new Map<string, Pending>();
  constructor(private sessions: Sessions, private options: { deadlineMs?: number } = {}) {
    sessions.onRevoke.add(session => this.fail(session.id, captureError('SESSION_UNAVAILABLE', 409)));
  }
  private fail(id: string, error: SketchError, expected?: Pending) {
    const request = this.pending.get(id); if (!request) return;
    if (expected && request !== expected) return;
    this.pending.delete(id); clearTimeout(request.timer); request.cleanup();
    request.reject?.(error); request.resolve = null; request.reject = null;
  }
  async read(token: string, signal?: AbortSignal): Promise<Delivery> {
    const session = this.sessions.read(token);
    if (this.pending.has(session.id)) throw captureError('BUSY');
    if (signal?.aborted) throw captureError('CAPTURE_FAILED');
    const createdAt = this.sessions.now(); const epoch = session.pairingEpoch;
    const deadline = createdAt + (this.options.deadlineMs ?? 10_000);
    const cancelled = () => this.fail(session.id, captureError('CAPTURE_FAILED'));
    let request!: Pending;
    const result = new Promise<Snapshot>((resolve, reject) => {
      request = { requestId: randomUUID(), sessionId: session.id, generation: session.generation, pairingEpoch: epoch,
        createdAt, deadline, claimed: false, fulfilled: false, resolve, reject,
        timer: setTimeout(() => this.fail(session.id, captureError('CAPTURE_TIMEOUT')), deadline - createdAt),
        cleanup: () => signal?.removeEventListener('abort', cancelled) };
      this.pending.set(session.id, request); signal?.addEventListener('abort', cancelled, { once: true });
    });
    const snapshot = await result;
    const metadata = { snapshotId: snapshot.snapshotId, capturedAt: snapshot.capturedAt, drawingRevision: snapshot.drawingRevision, selectionRevision: snapshot.selectionRevision };
    const assertCurrent = () => {
      this.sessions.assertCurrent(session, epoch);
      if (this.pending.get(session.id) !== request || this.sessions.now() >= deadline) throw captureError('CAPTURE_TIMEOUT');
    };
    const discard = () => this.fail(session.id, captureError('CAPTURE_FAILED'), request);
    return { snapshot, assertCurrent, discard, markSent: () => {
      try {
        assertCurrent();
        if (!session.lastRead || Date.parse(metadata.capturedAt) >= Date.parse(session.lastRead.capturedAt)) session.lastRead = metadata;
      } catch { /* Revoked/aborted sends cannot update provenance. */ }
      finally { discard(); }
    } };
  }
  claim(id: string, owner: string): CaptureRequest | null {
    this.sessions.owner(id, owner);
    const request = this.pending.get(id);
    if (!request || request.claimed) return null;
    request.claimed = true;
    const { requestId, generation, pairingEpoch, createdAt, deadline } = request;
    return { requestId, generation, pairingEpoch, createdAt, deadline };
  }
  submit(id: string, owner: string, requestId: string, post: CapturePost): void {
    if (!post || typeof post !== 'object' || Object.keys(post).some(key => !['generation', 'pairingEpoch', 'snapshot', 'error'].includes(key)) ||
      typeof post.generation !== 'string' || !Number.isSafeInteger(post.pairingEpoch) || (!!post.snapshot === !!post.error)) throw captureError('CAPTURE_FAILED');
    const session = this.sessions.owner(id, owner); const request = this.pending.get(id);
    if (!request || request.requestId !== requestId || request.fulfilled || post.generation !== session.generation ||
      post.pairingEpoch !== request.pairingEpoch || session.pairingEpoch !== request.pairingEpoch || this.sessions.now() >= request.deadline) {
      throw captureError('SESSION_UNAVAILABLE', 409);
    }
    if (post.error) {
      if (!['NO_SELECTION', 'EMPTY_SELECTION', 'CAPTURE_FAILED', 'PAYLOAD_TOO_LARGE'].includes(post.error)) throw captureError('CAPTURE_FAILED');
      this.fail(id, captureError(post.error)); return;
    }
    const snapshot = post.snapshot;
    if (!snapshot || post.error || !validSnapshot(snapshot)) throw captureError('CAPTURE_FAILED');
    request.fulfilled = true; request.resolve?.(Object.freeze({ ...snapshot })); request.resolve = null; request.reject = null;
  }
  busy(id: string): boolean { return this.pending.has(id); }
}

function validSnapshot(snapshot: Snapshot): boolean {
  try {
    if (Object.keys(snapshot).sort().join(',') !== 'capturedAt,data,drawingRevision,height,selectionRevision,snapshotId,width' ||
      !z.uuid().safeParse(snapshot.snapshotId).success || !z.iso.datetime({ offset: true }).safeParse(snapshot.capturedAt).success ||
      !Number.isSafeInteger(snapshot.drawingRevision) || snapshot.drawingRevision < 0 ||
      !Number.isSafeInteger(snapshot.selectionRevision) || snapshot.selectionRevision < 0 ||
      !Number.isInteger(snapshot.width) || !Number.isInteger(snapshot.height) || snapshot.width < 1 || snapshot.height < 1 ||
      snapshot.width > 1024 || snapshot.height > 768 || snapshot.data.length > 5_592_408) return false;
    const bytes = Buffer.from(snapshot.data, 'base64');
    if (bytes.length > 4 * 1024 * 1024 || bytes.toString('base64') !== snapshot.data || bytes.length < 45 ||
      !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
      bytes.readUInt32BE(16) !== snapshot.width || bytes.readUInt32BE(20) !== snapshot.height) return false;
    const chunks: Buffer[] = []; let ended = false; let channels = 4;
    for (let offset = 8; offset < bytes.length;) {
      const size = bytes.readUInt32BE(offset); const end = offset + 12 + size;
      if (end > bytes.length) return false;
      const type = bytes.toString('ascii', offset + 4, offset + 8);
      if (crc32(bytes.subarray(offset + 4, offset + 8 + size)) !== bytes.readUInt32BE(offset + 8 + size)) return false;
      if (offset === 8 && (type !== 'IHDR' || size !== 13 || bytes[offset + 16] !== 8 || ![2, 6].includes(bytes[offset + 17]) || bytes[offset + 20] !== 0)) return false;
      if (type === 'IHDR') channels = bytes[offset + 17] === 2 ? 3 : 4;
      if (type === 'IDAT') chunks.push(bytes.subarray(offset + 8, offset + 8 + size));
      if (type === 'IEND') { if (size !== 0 || end !== bytes.length) return false; ended = true; }
      if (['tEXt', 'iTXt', 'zTXt'].includes(type)) return false;
      offset = end;
    }
    const expected = (snapshot.width * channels + 1) * snapshot.height;
    return ended && inflateSync(Buffer.concat(chunks), { maxOutputLength: expected }).length === expected;
  } catch { return false; }
}
