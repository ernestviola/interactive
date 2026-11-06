import { capture } from './drawing/capture';
import type { Drawing } from './drawing/state';
import { SketchError, type CaptureRequest, type CapturePost, type SnapshotMeta } from './contracts/sketch';

export type Connection = { state: 'connecting' | 'unpaired' | 'paired' | 'reading' | 'unavailable'; message: string; lastRead?: SnapshotMeta | null; retryAfter?: number };
type Credentials = { id: string; generation: string; ownerCapability: string; leaseExpiresAt: number };

export class SessionClient {
  private credentials: Credentials | null = null;
  private abort = new AbortController();
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private reconnect: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  constructor(private getDrawing: () => Drawing, private update: (status: Connection) => void,
    private canvasId?: string, private tabId?: string, private canCapture: () => boolean = () => true) {}
  private async request(path: string, method = 'GET', body?: unknown) {
    const response = await fetch(`/api/sketch${path}`, {
      method, cache: 'no-store', signal: this.abort.signal,
      headers: { 'X-Sketch-Client': '1', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(this.credentials ? { Authorization: `Bearer ${this.credentials.ownerCapability}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      const problem = await response.json().catch(() => null) as { message?: string } | null;
      throw new Error(problem?.message ?? 'Canvas connection unavailable. Drawing remains available.');
    }
    return response.status === 204 ? null : response.json();
  }
  async start() {
    if (this.stopped) return;
    this.abort = new AbortController();
    this.update({ state: 'connecting', message: 'Connecting the drawing…' });
    try {
      const credentials = await this.request('/sessions', 'POST', { canvasId: this.canvasId, tabId: this.tabId }) as Credentials;
      if (this.stopped) return;
      this.credentials = credentials;
      this.update({ state: 'paired', message: 'The current drawing is available for on-demand reads.' });
      this.heartbeat = setInterval(() => { void this.pulse(); }, 5_000);
      void this.poll();
    } catch (error) { this.unavailable(error); }
  }
  private unavailable(error?: unknown) {
    if (this.stopped) return;
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = null; this.abort.abort(); this.credentials = null;
    this.update({ state: 'unavailable', message: error instanceof Error ? error.message : 'Canvas connection unavailable. Drawing remains available.' });
    if (this.reconnect) clearTimeout(this.reconnect);
    this.reconnect = setTimeout(() => { this.reconnect = null; void this.start(); }, 3_000);
  }
  private async pulse() {
    const credentials = this.credentials;
    if (!credentials || this.stopped) return;
    try {
      const status = await this.request(`/sessions/${credentials.id}/heartbeat`, 'POST', {});
      if (this.credentials === credentials) this.update({ state: status.reading ? 'reading' : 'paired',
        message: status.reading ? 'Reading the current drawing…' : 'The current drawing is available for on-demand reads.', lastRead: status.lastRead });
    } catch (error) { if (this.credentials === credentials) this.unavailable(error); }
  }
  private async poll() {
    while (!this.stopped && this.credentials && !this.abort.signal.aborted) {
      const credentials = this.credentials;
      if (!this.canCapture()) { await new Promise(resolve => setTimeout(resolve, 250)); continue; }
      try {
        const request = await this.request(`/sessions/${credentials.id}/capture`) as CaptureRequest | null;
        if (this.credentials !== credentials || !request) continue;
        let post: CapturePost;
        try {
          post = { generation: credentials.generation, pairingEpoch: request.pairingEpoch,
            snapshot: await capture(this.getDrawing, request, this.abort.signal) };
        } catch (error) {
          post = { generation: credentials.generation, pairingEpoch: request.pairingEpoch,
            error: error instanceof SketchError ? error.code : 'CAPTURE_FAILED' };
        }
        try { await this.request(`/sessions/${credentials.id}/capture/${request.requestId}`, 'POST', post); }
        catch { /* Revoked, timed-out, and interrupted responses cannot be reused. */ }
      } catch (error) { if (this.credentials === credentials) this.unavailable(error); break; }
    }
  }
  close() {
    this.stopped = true;
    if (this.heartbeat) clearInterval(this.heartbeat);
    if (this.reconnect) clearTimeout(this.reconnect);
    this.abort.abort();
    const credentials = this.credentials;
    this.credentials = null;
    if (credentials) {
      const path = this.tabId ? `/api/sketch/sessions/${credentials.id}/tabs/${this.tabId}` : `/api/sketch/sessions/${credentials.id}`;
      void fetch(path, { method: 'DELETE', cache: 'no-store', keepalive: true,
        headers: { 'X-Sketch-Client': '1', Authorization: `Bearer ${credentials.ownerCapability}` } }).catch(() => {});
    }
  }
}
