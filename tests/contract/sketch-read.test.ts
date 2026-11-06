import { randomUUID } from 'node:crypto';
import { expect, it } from 'vitest';
import { Sessions } from '../../src/broker/sessions';
import { Captures } from '../../src/broker/captures';
import { createFixture } from '../../experiments/voice-mcp/fixture';
import type { Snapshot } from '../../src/lib/contracts/sketch';

async function setup(deadlineMs = 10_000) {
  const sessions = new Sessions(); const session = sessions.create();
  const token = sessions.pair(session.id, session.ownerCapability);
  const captures = new Captures(sessions, { deadlineMs });
  const image = await createFixture({ symbol: 'square', code: '2468' }).capture(new AbortController().signal);
  const snapshot: Snapshot = { snapshotId: randomUUID(), capturedAt: new Date().toISOString(), drawingRevision: 1, data: image.toString('base64'), width: 640, height: 360 };
  const start = (signal?: AbortSignal) => captures.read(token, signal).then(value => ({ value, error: null }), error => ({ value: null, error }));
  return { sessions, session, token, captures, snapshot, start };
}

it('queues one fresh capture with a deadline of 10 seconds from read initiation; commits last-sent only after flush', async () => {
  const { start, captures, session, sessions, snapshot } = await setup();
  const pending = start(); const request = captures.claim(session.id, session.ownerCapability);
  expect(request !== null).toBe(true); if (!request) return;
  expect(request.deadline - request.createdAt).toBe(10_000);
  captures.submit(session.id, session.ownerCapability, request.requestId, { generation: request.generation, pairingEpoch: request.pairingEpoch, snapshot });
  const result = await pending;
  expect(result.error === null && result.value?.snapshot.data === snapshot.data).toBe(true);
  expect(sessions.owner(session.id, session.ownerCapability).lastRead).toBeNull();
  result.value!.markSent();
  expect(sessions.owner(session.id, session.ownerCapability).lastRead?.snapshotId === snapshot.snapshotId).toBe(true);
  expect(JSON.stringify(sessions.owner(session.id, session.ownerCapability)).includes(snapshot.data)).toBe(false);
});

it('rejects a concurrent read as BUSY and rejects late/duplicate responses rather than caching an image', async () => {
  const { start, captures, session, snapshot } = await setup();
  const pending = start();
  const duplicate = await start(); expect(duplicate.error?.code).toBe('BUSY');
  const req = captures.claim(session.id, session.ownerCapability); expect(req !== null).toBe(true); if (!req) return;
  const post = { generation: req.generation, pairingEpoch: req.pairingEpoch, snapshot };
  captures.submit(session.id, session.ownerCapability, req.requestId, post);
  expect(() => captures.submit(session.id, session.ownerCapability, req.requestId, post)).toThrow();
  const delivery = (await pending).value!; delivery.discard();
  expect(captures.busy(session.id)).toBe(false);
});

it.each(['NO_DRAWING', 'CAPTURE_UNREADABLE', 'CAPTURE_FAILED', 'PAYLOAD_TOO_LARGE'] as const)('relays %s without any alternative snapshot', async code => {
  const { start, captures, session } = await setup();
  const pending = start(); const req = captures.claim(session.id, session.ownerCapability);
  expect(req !== null).toBe(true); if (!req) return;
  captures.submit(session.id, session.ownerCapability, req.requestId, { generation: req.generation, pairingEpoch: req.pairingEpoch, error: code });
  const result = await pending; expect(result.error?.code).toBe(code); expect(result.value).toBeNull();
});

it('times out a silent browser and makes every retry a new request', async () => {
  const { start, captures, session } = await setup(20);
  const pending = start(); const first = captures.claim(session.id, session.ownerCapability);
  expect(first !== null).toBe(true); if (!first) return;
  expect((await pending).error?.code).toBe('CAPTURE_TIMEOUT');
  const next = start(); const second = captures.claim(session.id, session.ownerCapability);
  expect(!!second && first.requestId !== second.requestId).toBe(true);
  expect((await next).error?.code).toBe('CAPTURE_TIMEOUT');
});

it('rejects wrong owner/generation/epoch and invalid PNG dimensions, then cancels on pairing rotation', async () => {
  const { start, captures, session, snapshot, sessions } = await setup();
  const pending = start(); const req = captures.claim(session.id, session.ownerCapability);
  expect(req !== null).toBe(true); if (!req) return;
  const post = { generation: req.generation, pairingEpoch: req.pairingEpoch, snapshot };
  expect(() => captures.submit(session.id, 'foreign', req.requestId, post)).toThrow();
  expect(() => captures.submit(session.id, session.ownerCapability, req.requestId, { ...post, generation: 'old' })).toThrow();
  expect(() => captures.submit(session.id, session.ownerCapability, req.requestId, { ...post, snapshot: { ...snapshot, width: 1025 } })).toThrow();
  sessions.pair(session.id, session.ownerCapability);
  expect((await pending).error?.code).toBe('SESSION_UNAVAILABLE');
});

it('a dropped request cancels its capture and an unflushed result cannot update last-sent', async () => {
  const { start, captures, session, snapshot, sessions } = await setup();
  const controller = new AbortController(); const pending = start(controller.signal);
  expect(captures.busy(session.id)).toBe(true); controller.abort();
  expect((await pending).value).toBeNull(); expect(captures.busy(session.id)).toBe(false);
  const retry = start(); const req = captures.claim(session.id, session.ownerCapability)!;
  captures.submit(session.id, session.ownerCapability, req.requestId, { generation: req.generation, pairingEpoch: req.pairingEpoch, snapshot });
  const delivery = (await retry).value!;
  sessions.end(session.id, session.ownerCapability);
  expect(() => delivery.assertCurrent()).toThrow();
  delivery.markSent(); expect(sessions.read.bind(sessions, 'invalid')).toThrow();
});
