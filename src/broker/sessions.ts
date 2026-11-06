import { randomUUID } from 'node:crypto';
import { hashCapability, matchesCapability, newCapability } from './capabilities';
import { SketchError } from '../lib/contracts/sketch';
export type LastRead = { snapshotId: string; capturedAt: string; drawingRevision: number; selectionRevision: number };
export type Session = { id: string; generation: string; state: 'active' | 'expired' | 'ended'; pairingEpoch: number; leaseExpiresAt: number; ownerHash: string; readHash: string | null; lastRead: LastRead | null };
export class Sessions {
  private records = new Map<string, Session>();
  private attempts: number[] = [];
  readonly now: () => number;
  readonly onRevoke = new Set<(session: Session) => void>();
  constructor({ now = Date.now }: { now?: () => number } = {}) { this.now = now; }
  create() {
    this.expire();
    this.attempts = this.attempts.filter(time => time > this.now() - 60_000);
    if (this.attempts.length >= 10) throw new SketchError('SESSION_UNAVAILABLE', 'Too many session starts. Wait for the retry countdown; your drawing is preserved.', 429, Math.max(1, Math.ceil((this.attempts[0] + 60_000 - this.now()) / 1000)));
    this.attempts.push(this.now());
    if (this.records.size >= 4) throw new SketchError('SESSION_UNAVAILABLE', 'Four sessions are active. End another owned session or wait up to 20 seconds for a closed session to expire.', 429, 20);
    const id = randomUUID(); const generation = randomUUID(); const ownerCapability = newCapability();
    const leaseExpiresAt = this.now() + 20_000;
    this.records.set(id, { id, generation, ownerHash: hashCapability(ownerCapability), readHash: null, state: 'active', pairingEpoch: 0, leaseExpiresAt, lastRead: null });
    return { id, generation, ownerCapability, leaseExpiresAt };
  }
  private unavailable(): never { throw new SketchError('SESSION_UNAVAILABLE', 'Reconnect the canvas and explicitly pair again.', 401); }
  expire() {
    for (const session of this.records.values()) if (session.state === 'active' && session.leaseExpiresAt <= this.now()) this.revoke(session, 'expired');
  }
  private revoke(session: Session, state: Session['state']) {
    session.state = state; session.pairingEpoch++; session.readHash = null; session.ownerHash = ''; session.lastRead = null;
    this.records.delete(session.id);
    for (const listener of this.onRevoke) listener(session);
  }
  owner(id: string, token: string): Session {
    this.expire(); const session = this.records.get(id);
    if (!session || !matchesCapability(token, session.ownerHash)) return this.unavailable();
    return session;
  }
  pair(id: string, token: string): string {
    const session = this.owner(id, token); session.pairingEpoch++;
    for (const listener of this.onRevoke) listener(session);
    const read = newCapability(); session.readHash = hashCapability(read); return read;
  }
  read(token: string): Session {
    this.expire();
    for (const session of this.records.values()) if (matchesCapability(token, session.readHash)) return session;
    return this.unavailable();
  }
  assertCurrent(session: Session, epoch: number) {
    this.expire();
    if (this.records.get(session.id) !== session || session.state !== 'active' || session.pairingEpoch !== epoch || !session.readHash) this.unavailable();
  }
  unpair(session: Session) {
    if (this.records.get(session.id) !== session) return;
    session.pairingEpoch++; session.readHash = null;
    for (const listener of this.onRevoke) listener(session);
  }
  heartbeat(id: string, token: string): Session {
    const session = this.owner(id, token); session.leaseExpiresAt = this.now() + 20_000; return session;
  }
  end(id: string, token: string): void { this.revoke(this.owner(id, token), 'ended'); }
}
