import type { Stroke } from './contracts/sketch';
import { begin, commit, createDrawing, move, type Drawing } from './drawing/state';
import { redo, undo } from './drawing/history';

const KEY = 'interactive:canvas-checkpoint:v1';
export type DocumentAction = { id: string; type: 'stroke'; stroke: Stroke } | { id: string; type: 'undo' } | { id: string; type: 'redo' };
type Checkpoint = { version: 1; sessionId: string; drawing: Drawing; appliedIds?: string[] };
const validStroke = (stroke: unknown): stroke is Stroke => {
  if (!stroke || typeof stroke !== 'object') return false;
  const item = stroke as Stroke;
  return typeof item.id === 'string' && item.id.length > 0 && Array.isArray(item.points) && item.points.length > 0 && item.points.length <= 2000 &&
    item.points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y));
};
export function recoverCheckpoint(raw: string | null, navigation: string, liveSibling: boolean): Checkpoint | null {
  if (!raw || (navigation !== 'reload' && !liveSibling)) return null;
  try {
    const value = JSON.parse(raw) as Checkpoint;
    const drawing = value.drawing;
    const allStrokes = drawing && Array.isArray(drawing.strokes) && Array.isArray(drawing.redo)
      ? [...drawing.strokes, ...drawing.redo] : [];
    if (value.version !== 1 || typeof value.sessionId !== 'string' || !value.sessionId || !drawing ||
      !Array.isArray(drawing.strokes) || !Array.isArray(drawing.redo) || drawing.strokes.length + drawing.redo.length > 1000 ||
      !allStrokes.every(validStroke) || allStrokes.reduce((count, stroke) => count + stroke.points.length, 0) > 1_000_000 ||
      new Set(allStrokes.map(stroke => stroke.id)).size !== allStrokes.length ||
      !Number.isSafeInteger(drawing.revision) || drawing.revision < 0 ||
      !Number.isSafeInteger(drawing.undoFloor) || drawing.undoFloor < 0 || drawing.undoFloor > drawing.strokes.length ||
      drawing.redo.length > 50 || (value.appliedIds !== undefined &&
      (!Array.isArray(value.appliedIds) || value.appliedIds.length > 200 || value.appliedIds.some(id => typeof id !== 'string')))) return null;
    return { version: 1, sessionId: value.sessionId, drawing: { ...drawing, gesture: null, notice: '' }, appliedIds: value.appliedIds ?? [] };
  } catch { return null; }
}
export function applyDocumentAction(drawing: Drawing, action: DocumentAction): Drawing {
  if (action.type === 'undo') return undo(drawing);
  if (action.type === 'redo') return redo(drawing);
  if (!validStroke(action.stroke) || [...drawing.strokes, ...drawing.redo].some(stroke => stroke.id === action.stroke.id)) return drawing;
  let next = begin(drawing, 'draw', action.stroke.id, action.stroke.points[0]);
  for (const point of action.stroke.points.slice(1)) next = move(next, point);
  return commit(next);
}
export function saveCheckpoint(storage: Pick<Storage, 'setItem'>, sessionId: string, next: Drawing, previous: Drawing, appliedIds: string[] = []): Drawing {
  if (next === previous) return previous;
  try {
    storage.setItem(KEY, JSON.stringify({ version: 1, sessionId, drawing: { ...next, gesture: null, notice: '' }, appliedIds: appliedIds.slice(-200) } satisfies Checkpoint));
    return next;
  } catch {
    return { ...previous, gesture: null, notice: 'This stroke was not saved. Browser session storage is full; earlier work is still here.' };
  }
}

type Message = { type: 'join'; from: string } | { type: 'state'; from: string; drawing: Drawing; revision: number; actionId?: string; appliedIds: string[] } |
  { type: 'action'; from: string; action: DocumentAction } | { type: 'gesture'; from: string; active: boolean } |
  { type: 'storage-rejected'; from: string; actionId: string; revision: number };

export class SessionDocument {
  readonly tabId = crypto.randomUUID();
  sessionId = crypto.randomUUID();
  drawing = createDrawing();
  private channel: BroadcastChannel | null = null;
  private leader = false;
  private stopped = false;
  private releaseLock: (() => void) | null = null;
  private electionTimer: ReturnType<typeof setInterval> | null = null;
  private seen = new Set<string>();
  private gotState = false;
  private activeGestures = new Map<string, number>();
  private waiting = new Map<string, (drawing: Drawing) => void>();
  private lastCommitted: { actionId: string; revision: number; previous: Drawing } | null = null;
  constructor(private onChange: (drawing: Drawing) => void) {}
  get isCoordinator() { return this.leader; }
  captureDrawing(local: Drawing): Drawing {
    for (const [tab, seenAt] of this.activeGestures) if (Date.now() - seenAt > 3_000) this.activeGestures.delete(tab);
    return this.activeGestures.size ? { ...this.drawing, gesture: local.gesture ?? { mode: 'draw', id: 'pending', points: [] } } : this.drawing;
  }
  beginGesture() { this.activeGestures.set(this.tabId, Date.now()); this.publish({ type: 'gesture', from: this.tabId, active: true }); }
  endGesture() { this.activeGestures.delete(this.tabId); this.publish({ type: 'gesture', from: this.tabId, active: false }); }
  private publish(message: Message) { this.channel?.postMessage(message); }
  private accept(drawing: Drawing, actionId?: string, appliedIds: string[] = []): boolean {
    if (drawing.revision < this.drawing.revision) return false;
    const candidate = { ...drawing, gesture: null };
    const stored = saveCheckpoint(sessionStorage, this.sessionId, candidate, this.drawing, [...this.seen, ...appliedIds, ...(actionId ? [actionId] : [])]);
    if (stored !== candidate) {
      this.drawing = stored;
      this.onChange(stored);
      if (actionId) {
        this.publish({ type: 'storage-rejected', from: this.tabId, actionId, revision: drawing.revision });
        this.waiting.get(actionId)?.(stored); this.waiting.delete(actionId);
      }
      return false;
    }
    for (const id of appliedIds.slice(-200)) this.seen.add(id);
    if (actionId) this.seen.add(actionId);
    this.drawing = candidate;
    this.onChange(this.drawing);
    if (actionId) { this.waiting.get(actionId)?.(this.drawing); this.waiting.delete(actionId); }
    return true;
  }
  private onMessage = (event: MessageEvent<Message>) => {
    const message = event.data;
    if (!message || message.from === this.tabId || this.stopped) return;
    if (message.type === 'join') {
      if (this.leader) this.publish({ type: 'state', from: this.tabId, drawing: this.drawing, revision: this.drawing.revision, appliedIds: [...this.seen].slice(-200) });
    } else if (message.type === 'state') {
      if (message.revision >= this.drawing.revision) this.gotState = this.accept(message.drawing, message.actionId, message.appliedIds) || this.gotState;
    } else if (message.type === 'action' && this.leader) {
      this.apply(message.action);
    } else if (message.type === 'storage-rejected' && this.leader) {
      const committed = this.lastCommitted;
      if (committed?.actionId === message.actionId && committed.revision === message.revision && this.drawing.revision === committed.revision) {
        const rollback = { ...committed.previous, revision: this.drawing.revision + 1,
          notice: 'This stroke was not saved in every open tab. Earlier work is still here.' };
        const stored = saveCheckpoint(sessionStorage, this.sessionId, rollback, this.drawing, [...this.seen]);
        this.lastCommitted = null;
        this.drawing = stored;
        this.onChange(stored);
        this.publish({ type: 'state', from: this.tabId, drawing: stored, revision: stored.revision, appliedIds: [...this.seen].slice(-200) });
      }
    } else if (message.type === 'gesture') {
      if (message.active) this.activeGestures.set(message.from, Date.now());
      else this.activeGestures.delete(message.from);
    }
  };
  private openChannel() {
    this.channel?.close();
    this.channel = new BroadcastChannel(`interactive:canvas:${this.sessionId}`);
    this.channel.onmessage = this.onMessage;
  }
  private async elect() {
    if (this.stopped || !navigator.locks || this.leader) return this.leader;
    return new Promise<boolean>(resolve => {
      void navigator.locks.request(`interactive:coordinator:${this.sessionId}`, { ifAvailable: true }, async lock => {
        if (!lock || this.stopped) { resolve(false); return; }
        this.leader = true; resolve(true);
        await new Promise<void>(done => { this.releaseLock = done; });
        this.leader = false;
      }).catch(() => resolve(false));
    });
  }
  async start() {
    const raw = sessionStorage.getItem(KEY);
    const navigation = performance.getEntriesByType('navigation').at(-1)?.toJSON().type ?? 'navigate';
    const candidate = recoverCheckpoint(raw, 'reload', false);
    if (candidate) {
      this.sessionId = candidate.sessionId;
      this.seen = new Set(candidate.appliedIds);
      this.openChannel();
      if (navigation === 'reload') this.accept(candidate.drawing);
      this.publish({ type: 'join', from: this.tabId });
      do {
        await new Promise(resolve => setTimeout(resolve, 150));
        if (navigation === 'reload' || this.gotState || this.stopped) break;
        const locks = await navigator.locks.query();
        if (!locks.held?.some(lock => lock.name === `interactive:coordinator:${this.sessionId}`)) break;
        this.publish({ type: 'join', from: this.tabId });
      } while (!this.gotState);
      if (this.stopped) return;
      if (navigation !== 'reload' && !this.gotState) {
        this.channel?.close(); this.channel = null;
        this.sessionId = crypto.randomUUID();
        this.seen.clear();
      }
    }
    if (this.stopped) return;
    if (!this.channel) this.openChannel();
    this.drawing = saveCheckpoint(sessionStorage, this.sessionId, this.drawing, createDrawing(), [...this.seen]);
    await this.elect();
    this.electionTimer = setInterval(() => {
      if (!this.leader) void this.elect();
      if (this.activeGestures.has(this.tabId)) this.beginGesture();
    }, 500);
    this.publish({ type: 'join', from: this.tabId });
    this.onChange(this.drawing);
  }
  private apply(action: DocumentAction): Drawing {
    if (this.seen.has(action.id)) return this.drawing;
    const previous = this.drawing;
    const next = applyDocumentAction(this.drawing, action);
    const stored = saveCheckpoint(sessionStorage, this.sessionId, next, this.drawing, [...this.seen, action.id]);
    this.seen.add(action.id);
    this.lastCommitted = stored.revision > previous.revision ? { actionId: action.id, revision: stored.revision, previous } : null;
    this.drawing = stored;
    this.onChange(stored);
    this.publish({ type: 'state', from: this.tabId, drawing: stored, revision: stored.revision, actionId: action.id, appliedIds: [...this.seen].slice(-200) });
    return stored;
  }
  async submit(action: DocumentAction): Promise<Drawing> {
    if (this.leader) return this.apply(action);
    const result = new Promise<Drawing>(resolve => this.waiting.set(action.id, resolve));
    this.publish({ type: 'action', from: this.tabId, action });
    const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 300));
    const answered = await Promise.race([result, timeout]);
    if (answered) return answered;
    await this.elect();
    if (this.leader) return this.apply(action);
    this.publish({ type: 'action', from: this.tabId, action });
    return Promise.race([result, new Promise<Drawing>(resolve => setTimeout(() => resolve({ ...this.drawing, notice: 'The drawing is syncing. Retry this stroke.' }), 500))]);
  }
  close() {
    this.endGesture();
    this.stopped = true; this.channel?.close(); this.channel = null;
    if (this.electionTimer) clearInterval(this.electionTimer);
    this.releaseLock?.(); this.releaseLock = null;
    this.waiting.clear();
  }
}
