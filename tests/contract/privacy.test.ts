import { randomUUID } from 'node:crypto';
import { expect, it } from 'vitest';
import { Sessions } from '../../src/broker/sessions';
import { Captures } from '../../src/broker/captures';
import { createFixture } from '../../experiments/voice-mcp/fixture';
import type { Snapshot } from '../../src/lib/contracts/sketch';
it('rejects extra snapshot fields so unrelated data or credentials cannot enter MCP text metadata', async () => {
  const sessions = new Sessions(); const a = sessions.create(); const token = sessions.pair(a.id, a.ownerCapability); const captures = new Captures(sessions);
  const pending = captures.read(token).catch(error => error); const req = captures.claim(a.id, a.ownerCapability)!;
  const png = await createFixture({ symbol: 'square', code: '2468' }).capture(new AbortController().signal);
  const snapshot = { snapshotId: randomUUID(), capturedAt: new Date().toISOString(), drawingRevision: 1, width: 640, height: 360, data: png.toString('base64'), outsideData: 'excluded' } as Snapshot;
  try {
    expect(() => captures.submit(a.id, a.ownerCapability, req.requestId, { generation: req.generation, pairingEpoch: req.pairingEpoch, snapshot })).toThrow();
  } finally { sessions.end(a.id, a.ownerCapability); await pending; }
});
