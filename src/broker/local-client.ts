import type { Sessions } from './sessions';
import { hashCapability, matchesCapability } from './capabilities';
import { SketchError } from '../lib/contracts/sketch';
export class LocalClient {
  private bootstrapHash: string;
  constructor(private sessions: Sessions, bootstrap: string) {
    this.bootstrapHash = hashCapability(bootstrap);
  }
  headers(bootstrap: string): { Authorization: string } {
    if (!matchesCapability(bootstrap, this.bootstrapHash)) throw new SketchError('SESSION_UNAVAILABLE', 'Local helper authorization required.', 401);
    const active = this.sessions.active();
    if (active.length > 1) throw new SketchError('AMBIGUOUS_CANVAS', 'Ambiguous canvases: more than one drawing is open. Close the unrelated canvas and retry.', 409);
    const current = active[0];
    if (!current || !this.sessions.readToken(current)) throw new SketchError('SESSION_UNAVAILABLE', 'Open a canvas and retry.', 409);
    this.sessions.assertCurrent(current, current.pairingEpoch);
    return { Authorization: `Bearer ${this.sessions.readToken(current)}` };
  }
}
