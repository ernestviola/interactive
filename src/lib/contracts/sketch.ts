export const WIDTH = 1024;
export const HEIGHT = 768;
export type Point = { x: number; y: number };
export type Rect = Point & { width: number; height: number };
export type Stroke = { id: string; points: Point[] };
export type CaptureRequest = { requestId: string; generation: string; pairingEpoch: number; createdAt: number; deadline: number };
export type SnapshotMeta = { snapshotId: string; capturedAt: string; drawingRevision: number; selectionRevision: number };
export type Snapshot = SnapshotMeta & { data: string; width: number; height: number };
export type CapturePost = { generation: string; pairingEpoch: number; snapshot?: Snapshot; error?: ErrorCode };
export type ErrorCode = 'NO_SELECTION' | 'EMPTY_SELECTION' | 'SESSION_UNAVAILABLE' | 'BUSY' | 'CAPTURE_TIMEOUT' | 'CAPTURE_FAILED' | 'PAYLOAD_TOO_LARGE';
export class SketchError extends Error {
  constructor(public code: ErrorCode, message: string, public status = 400, public retryAfter?: number) { super(message); }
}
