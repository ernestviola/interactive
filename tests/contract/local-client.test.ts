import { expect, it } from 'vitest';
import { Sessions } from '../../src/broker/sessions';
import { newCapability } from '../../src/broker/capabilities';
import { LocalClient } from '../../src/broker/local-client';

it('hands a session read key only to the local operator helper after explicit owner pairing', () => {
  const sessions = new Sessions(); const bootstrap = newCapability(); const client = new LocalClient(sessions, bootstrap);
  expect(() => client.headers(bootstrap)).toThrow();
  const a = sessions.create(); const read = sessions.pair(a.id, a.ownerCapability);
  client.pair(sessions.owner(a.id, a.ownerCapability), read);
  expect(client.headers(bootstrap).Authorization === `Bearer ${read}`).toBe(true);
  expect(() => client.headers(read)).toThrow(); expect(() => client.headers(a.ownerCapability)).toThrow();
  expect(() => client.headers('incorrect')).toThrow();
  sessions.end(a.id, a.ownerCapability); expect(() => client.headers(bootstrap)).toThrow();
});

it('never retargets an existing read capability and clears the volatile handoff on expiry', () => {
  let now = 0; const sessions = new Sessions({ now: () => now });
  const bootstrap = newCapability(); const client = new LocalClient(sessions, bootstrap);
  const a = sessions.create(); const first = sessions.pair(a.id, a.ownerCapability); client.pair(sessions.read(first), first);
  const b = sessions.create(); const second = sessions.pair(b.id, b.ownerCapability); client.pair(sessions.read(second), second);
  expect(() => sessions.read(first)).toThrow();
  expect(client.headers(bootstrap).Authorization === `Bearer ${second}`).toBe(true);
  now = 20_000; expect(() => client.headers(bootstrap)).toThrow();
  expect(() => sessions.read(second)).toThrow();
});
