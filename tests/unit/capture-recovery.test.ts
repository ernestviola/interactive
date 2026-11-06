import { afterEach, expect, it, vi } from 'vitest';
import { Sessions } from '../../src/broker/sessions';
import { Captures } from '../../src/broker/captures';
afterEach(() => vi.useRealTimers());
it('uses the 10s deadline and cancellation to release the single pending slot; late/duplicate responses cannot fulfill retries', async () => {
  vi.useFakeTimers(); const sessions = new Sessions(); const owner = sessions.create(); const read = sessions.pair(owner.id, owner.ownerCapability); const captures = new Captures(sessions);
  const pending = captures.read(read).catch(error => error); const first = captures.claim(owner.id, owner.ownerCapability)!;
  const parallel = await captures.read(read).catch(error => error); expect(parallel.code).toBe('BUSY');
  await vi.advanceTimersByTimeAsync(10_000); expect((await pending).code).toBe('CAPTURE_TIMEOUT'); expect(captures.busy(owner.id)).toBe(false);
  const controller = new AbortController(); const retry = captures.read(read, controller.signal).catch(error => error);
  const next = captures.claim(owner.id, owner.ownerCapability)!; expect(next.requestId !== first.requestId).toBe(true);
  expect(() => captures.submit(owner.id, owner.ownerCapability, first.requestId, { generation: first.generation, pairingEpoch: first.pairingEpoch, error: 'NO_DRAWING' })).toThrow();
  controller.abort(); expect((await retry).code).toBe('CAPTURE_FAILED'); expect(captures.busy(owner.id)).toBe(false);
});

it('5s heartbeats extend the 20s lease; expiry and pairing rotation revoke original admitting epochs', async () => {
  vi.useFakeTimers(); const sessions = new Sessions(); const owner = sessions.create(); let read = sessions.pair(owner.id, owner.ownerCapability); const captures = new Captures(sessions);
  await vi.advanceTimersByTimeAsync(5_000); sessions.heartbeat(owner.id, owner.ownerCapability);
  const pending = captures.read(read).catch(error => error); read = sessions.pair(owner.id, owner.ownerCapability);
  expect((await pending).code).toBe('SESSION_UNAVAILABLE'); expect(captures.busy(owner.id)).toBe(false);
  await vi.advanceTimersByTimeAsync(20_000); expect(() => sessions.read(read)).toThrow();
});
