import { expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { Sessions } from '../../src/broker/sessions';
import { Captures } from '../../src/broker/captures';
import { createFixture } from '../../experiments/voice-mcp/fixture';
it('snapshot metadata is immutable after browser submission and aborted flush never sets last-sent', async () => {
  const sessions = new Sessions(); const session = sessions.create(); const read = sessions.pair(session.id, session.ownerCapability); const captures = new Captures(sessions);
  const png = await createFixture({ symbol: 'circle', code: '2468' }).capture(new AbortController().signal);
  const pending = captures.read(read); const req = captures.claim(session.id, session.ownerCapability)!;
  const snapshot = { snapshotId: randomUUID(), capturedAt: new Date().toISOString(), drawingRevision: 1, width: 640, height: 360, data: png.toString('base64') };
  captures.submit(session.id, session.ownerCapability, req.requestId, { generation: req.generation, pairingEpoch: req.pairingEpoch, snapshot });
  snapshot.drawingRevision = 99;
  const delivery = await pending; expect(delivery.snapshot.drawingRevision).toBe(1); delivery.discard();
  expect(sessions.owner(session.id, session.ownerCapability).lastRead).toBeNull();
});

it('late completion/discard from an earlier response cannot cancel a newer capture in the same session', async () => {
  const sessions = new Sessions(); const session = sessions.create(); const read = sessions.pair(session.id, session.ownerCapability); const captures = new Captures(sessions);
  const png = await createFixture({ symbol: 'square', code: '2468' }).capture(new AbortController().signal);
  const first = captures.read(read); const request = captures.claim(session.id, session.ownerCapability)!;
  captures.submit(session.id, session.ownerCapability, request.requestId, { generation: request.generation, pairingEpoch: request.pairingEpoch,
    snapshot: { snapshotId: randomUUID(), capturedAt: new Date().toISOString(), drawingRevision: 1, width: 640, height: 360, data: png.toString('base64') } });
  const delivery = await first; delivery.markSent();
  const next = captures.read(read).catch(error => error); const nextRequest = captures.claim(session.id, session.ownerCapability)!;
  try {
    delivery.discard(); delivery.markSent();
    expect(captures.busy(session.id)).toBe(true);
    captures.submit(session.id, session.ownerCapability, nextRequest.requestId, { generation: nextRequest.generation, pairingEpoch: nextRequest.pairingEpoch, error: 'NO_DRAWING' });
    expect((await next).code).toBe('NO_DRAWING');
  } finally { sessions.end(session.id, session.ownerCapability); await next; }
});
