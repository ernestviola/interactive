import type { Session, Sessions } from './sessions';
import { hashCapability, matchesCapability } from './capabilities';
import { SketchError } from '../lib/contracts/sketch';
export class LocalClient {
  private bootstrapHash: string;
  // One explicit transfer slot. Never persisted, enumerated, or used as an image cache.
  private current: { session: Session; epoch: number; token: string } | null = null;
  constructor(private sessions: Sessions, bootstrap: string) {
    this.bootstrapHash = hashCapability(bootstrap);
    sessions.onRevoke.add(session => { if (this.current?.session === session) this.current = null; });
  }
  pair(session: Session, token: string) {
    if (this.sessions.read(token) !== session) throw new SketchError('SESSION_UNAVAILABLE', 'Pair this session explicitly.', 401);
    if (this.current && this.current.session !== session) this.sessions.unpair(this.current.session);
    this.current = { session, epoch: session.pairingEpoch, token };
  }
  headers(bootstrap: string): { Authorization: string } {
    if (!matchesCapability(bootstrap, this.bootstrapHash)) throw new SketchError('SESSION_UNAVAILABLE', 'Local helper authorization required.', 401);
    const current = this.current;
    if (!current) throw new SketchError('SESSION_UNAVAILABLE', 'Use Connect in the canvas first.', 409);
    this.sessions.assertCurrent(current.session, current.epoch);
    return { Authorization: `Bearer ${current.token}` };
  }
}
