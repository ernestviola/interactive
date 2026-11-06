import { capture } from './drawing/capture';
import type { Drawing } from './drawing/state';
import { SketchError, type CaptureRequest, type CapturePost, type SnapshotMeta } from './contracts/sketch';
export type Connection = { state: 'connecting' | 'unpaired' | 'paired' | 'reading' | 'unavailable'; message: string; lastRead?: SnapshotMeta | null; retryAfter?: number };
class ClientRequestError extends Error { constructor(message: string, public status: number, public retryAfter = 0) { super(message); } }
type Credentials = { id: string; generation: string; ownerCapability: string; leaseExpiresAt: number };
export class SessionClient {
  private credentials: Credentials | null = null;
  private abort = new AbortController();
  private heartbeat: ReturnType<typeof setInterval> | undefined;
  private stopped = false;
  private reading = false;
  constructor(private getDrawing: () => Drawing, private update: (status: Connection) => void) {}
  private async request(path: string, method = 'GET', body?: unknown) {
    const response = await fetch(`/api/sketch${path}`, {
      method, cache: 'no-store', signal: this.abort.signal,
      headers: { 'X-Sketch-Client': '1', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(this.credentials ? { Authorization: `Bearer ${this.credentials.ownerCapability}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      const problem = await response.json().catch(() => null) as { message?: string } | null;
      throw new ClientRequestError(problem?.message ?? 'The canvas connection is unavailable. Reconnect to pair again; your drawing is still here.', response.status, Number(response.headers.get('Retry-After')) || 0);
    }
    return response.status === 204 ? null : response.json();
  }
  async start() {
    const operation = this.abort;
    this.stopped = false; this.update({ state: 'connecting', message: 'Starting a private drawing session…', lastRead: null, retryAfter: 0 });
    try {
      const session = await this.request('/sessions', 'POST', {}) as Credentials;
      if (this.stopped || this.abort !== operation) { void this.endSession(session); return; }
      this.credentials = session;
      this.update({ state: 'unpaired', message: 'Drawing stays in this tab. Connect when you want to share a selection.' });
      this.heartbeat = setInterval(() => { void this.pulse(); }, 5_000);
      void this.poll();
    } catch (error) { if (!this.stopped && this.abort === operation) this.unavailable(error); }
  }
  private unavailable(error?: unknown) {
    clearInterval(this.heartbeat); this.abort.abort();
    this.update({ state: 'unavailable', message: error instanceof ClientRequestError && error.status === 429 ? error.message : 'Connection unavailable. Keep drawing; use Connect to start a fresh pairing.', retryAfter: error instanceof ClientRequestError ? error.retryAfter : 0 });
    this.credentials = null;
  }
  private async pulse() {
    const credentials = this.credentials; const operation = this.abort; if (!credentials || this.stopped) return;
    try {
      const status = await this.request(`/sessions/${credentials.id}/heartbeat`, 'POST', {});
      if (this.credentials !== credentials || this.abort !== operation) return;
      this.update({ state: status.reading ? 'reading' : status.paired ? 'paired' : 'unpaired',
        message: status.reading ? 'Capturing only the selected region…' : status.paired ? 'Selection sharing is enabled for the paired client.' : 'Drawing stays in this tab until you connect.', lastRead: status.lastRead });
    } catch (error) { if (!this.stopped && this.credentials === credentials && this.abort === operation && !operation.signal.aborted) this.unavailable(error); }
  }
  private async poll() {
    while (!this.stopped && this.credentials && !this.abort.signal.aborted) {
      const session = this.credentials;
      const operation = this.abort;
      try {
        const request = await this.request(`/sessions/${session.id}/capture`) as CaptureRequest | null;
        if (this.credentials !== session || this.abort !== operation) break;
        if (!request) continue;
        this.reading = true; this.update({ state: 'reading', message: 'Capturing only your selected region…' });
        let post: CapturePost;
        try { post = { generation: session.generation, pairingEpoch: request.pairingEpoch, snapshot: await capture(this.getDrawing, request, this.abort.signal) }; }
        catch (error) { post = { generation: session.generation, pairingEpoch: request.pairingEpoch, error: error instanceof SketchError ? error.code : 'CAPTURE_FAILED' }; }
        try { await this.request(`/sessions/${session.id}/capture/${request.requestId}`, 'POST', post); }
        catch { /* A timed-out/rotated request cannot reuse these bytes. The next heartbeat checks presence. */ }
        this.reading = false; await this.pulse();
      } catch (error) { if (!this.stopped && this.credentials === session && this.abort === operation && !operation.signal.aborted) this.unavailable(error); break; }
    }
  }
  async pair(): Promise<string> {
    if (!this.credentials) { this.abort = new AbortController(); await this.start(); }
    const credentials = this.credentials;
    if (!credentials) throw new Error('The broker is unavailable. Your drawing is preserved.');
    let result;
    try { result = await this.request(`/sessions/${credentials.id}/pair`, 'POST', {}); }
    catch (error) {
      if (!(error instanceof ClientRequestError) || error.status !== 401) throw error;
      clearInterval(this.heartbeat); this.credentials = null; this.abort.abort();
      this.abort = new AbortController(); await this.start();
      if (!this.credentials) throw new Error('The broker is unavailable. Your drawing is preserved.');
      result = await this.request(`/sessions/${(this.credentials as Credentials).id}/pair`, 'POST', {});
    }
    this.update({ state: 'paired', message: 'Paired with this computer’s local MCP helper. Ask it to read your selection.' });
    return result.readCapability;
  }
  private endSession(session: Credentials) {
    return fetch(`/api/sketch/sessions/${session.id}`, { method: 'DELETE', cache: 'no-store', keepalive: true,
      headers: { 'X-Sketch-Client': '1', Authorization: `Bearer ${session.ownerCapability}` } }).catch(() => {});
  }
  close(end = true) {
    this.stopped = true; clearInterval(this.heartbeat); this.abort.abort();
    if (end && this.credentials) void this.endSession(this.credentials);
    this.credentials = null;
  }
}
