import type { Drawing } from './state';
import { renderWholeDrawing } from './render';
import { SketchError, type Snapshot, type CaptureRequest, type Stroke } from '../contracts/sketch';

export function frameWholeDrawing(strokes: Stroke[]) {
  if (!strokes.length) throw new SketchError('NO_DRAWING', 'NO_DRAWING: Draw something before asking ChatGPT to read it.');
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  for (const stroke of strokes) for (const point of stroke.points) {
    minX = Math.min(minX, point.x); minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x); maxY = Math.max(maxY, point.y);
  }
  if (!Number.isFinite(minX)) throw new SketchError('NO_DRAWING', 'NO_DRAWING: Draw something before asking ChatGPT to read it.');
  const x0 = minX - 25.5;
  const y0 = minY - 25.5;
  const x1 = maxX + 25.5;
  const y1 = maxY + 25.5;
  const width = x1 - x0; const height = y1 - y0;
  const scale = Math.min(1, 1024 / width, 768 / height);
  if (scale * 3 < 1.5) throw new SketchError('CAPTURE_UNREADABLE', 'CAPTURE_UNREADABLE: The drawing is too spread out for one legible image. Move related marks closer together and retry.');
  return { x: x0, y: y0, width, height, scale,
    outputWidth: Math.max(1, Math.min(1024, Math.ceil(width * scale))),
    outputHeight: Math.max(1, Math.min(768, Math.ceil(height * scale))) };
}

export function newId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16)); bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map(x => x.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export async function capture(getDrawing: () => Drawing, request: CaptureRequest, signal: AbortSignal): Promise<Snapshot> {
  while (getDrawing().gesture) {
    signal.throwIfAborted();
    if (Date.now() >= request.deadline) throw new SketchError('CAPTURE_TIMEOUT', 'Finish the drawing gesture and retry.');
    await new Promise(resolve => setTimeout(resolve, 16));
  }
  signal.throwIfAborted();
  const state = getDrawing();
  const strokes = state.strokes.map(stroke => ({ id: stroke.id, points: stroke.points.map(point => ({ ...point })) }));
  const frame = frameWholeDrawing(strokes);
  // Synchronous freeze into a detached canvas before asynchronous encoding or edits.
  const canvas = renderWholeDrawing(strokes, frame);
  const meta = { snapshotId: newId(), capturedAt: new Date().toISOString(), drawingRevision: state.revision };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const blob = await Promise.race([
    new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG encoding failed')), 'image/png')),
    new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new SketchError('CAPTURE_FAILED', 'Capture deadline reached.')), Math.max(1, request.deadline - Date.now())); }),
  ]).finally(() => clearTimeout(timer));
  signal.throwIfAborted();
  if (blob.size > 4 * 1024 * 1024) throw new SketchError('PAYLOAD_TOO_LARGE', 'The drawing image is too large. Simplify it and retry.');
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = ''; for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  return { ...meta, data: btoa(binary), width: canvas.width, height: canvas.height };
}
