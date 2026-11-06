import type { Drawing } from './state';
import { hasInk, renderSelection } from './render';
import { SketchError, type Snapshot, type CaptureRequest } from '../contracts/sketch';

export function newId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16)); bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map(x => x.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export async function capture(getDrawing: () => Drawing, request: CaptureRequest, signal: AbortSignal): Promise<Snapshot> {
  while (getDrawing().gesture) {
    signal.throwIfAborted();
    if (Date.now() >= request.deadline) throw new SketchError('CAPTURE_FAILED', 'Finish the drawing gesture and retry.');
    await new Promise(resolve => setTimeout(resolve, 16));
  }
  signal.throwIfAborted();
  const state = getDrawing(); const selection = state.selection;
  if (!selection) throw new SketchError('NO_SELECTION', 'Select a rectangle first.');
  if (Math.ceil(selection.width) > 1024 || Math.ceil(selection.height) > 768) throw new SketchError('PAYLOAD_TOO_LARGE', 'Select a smaller region.');
  // Synchronous freeze into a detached crop, before any asynchronous encoding or edits.
  const canvas = renderSelection(state.strokes, { ...selection });
  if (!hasInk(canvas)) throw new SketchError('EMPTY_SELECTION', 'Select a region containing ink.');
  const meta = { snapshotId: newId(), capturedAt: new Date().toISOString(), drawingRevision: state.revision, selectionRevision: state.selectionRevision };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const blob = await Promise.race([
    new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG encoding failed')), 'image/png')),
    new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new SketchError('CAPTURE_FAILED', 'Capture deadline reached.')), Math.max(1, request.deadline - Date.now())); }),
  ]).finally(() => clearTimeout(timer));
  signal.throwIfAborted();
  if (blob.size > 4 * 1024 * 1024) throw new SketchError('PAYLOAD_TOO_LARGE', 'Select a smaller region.');
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = ''; for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  return { ...meta, data: btoa(binary), width: canvas.width, height: canvas.height };
}
