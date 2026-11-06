import { expect, it } from 'vitest';
import { Sessions } from '../../src/broker/sessions';
import { allowedLocalRequest } from '../../src/broker/http';

it('separates random 256-bit owner/read capabilities, identities, and foreign sessions', () => {
  const sessions = new Sessions();
  const a = sessions.create(); const b = sessions.create();
  const token = sessions.pair(a.id, a.ownerCapability);
  expect(/^[\w-]{43}$/.test(a.ownerCapability) && /^[\w-]{43}$/.test(token)).toBe(true);
  expect(token !== a.ownerCapability && a.ownerCapability !== b.ownerCapability).toBe(true);
  expect(sessions.read(token).id === a.id).toBe(true);
  expect(() => sessions.owner(a.id, token)).toThrow();
  expect(() => sessions.read(a.ownerCapability)).toThrow();
  expect(() => sessions.owner(b.id, a.ownerCapability)).toThrow();
  expect(() => sessions.read(a.id)).toThrow();
  const record = sessions.owner(a.id, a.ownerCapability);
  const stored = JSON.stringify(record);
  expect(!stored.includes(token) && !stored.includes(a.ownerCapability)).toBe(true);
});

it('models active, expired, or ended state and a 5-second heartbeat / 20-second lease', () => {
  let now = 0;
  const sessions = new Sessions({ now: () => now });
  const a = sessions.create(); const token = sessions.pair(a.id, a.ownerCapability);
  const record = sessions.read(token);
  expect(record.state).toBe('active'); expect(record.leaseExpiresAt).toBe(20_000);
  now = 5_000; expect(sessions.heartbeat(a.id, a.ownerCapability).leaseExpiresAt).toBe(25_000);
  now = 25_000; expect(() => sessions.read(token)).toThrow(); expect(record.state).toBe('expired');
  const b = sessions.create(); const read = sessions.pair(b.id, b.ownerCapability);
  const ended = sessions.read(read); sessions.end(b.id, b.ownerCapability);
  expect(ended.state).toBe('ended'); expect(() => sessions.read(read)).toThrow();
  expect(() => sessions.owner(b.id, b.ownerCapability)).toThrow();
});

it('rotates pairing without restoring an earlier capability (at most one pending request is enforced by capture relay)', () => {
  const sessions = new Sessions(); const a = sessions.create();
  const first = sessions.pair(a.id, a.ownerCapability); const epoch = sessions.read(first).pairingEpoch;
  const next = sessions.pair(a.id, a.ownerCapability);
  expect(next !== first).toBe(true); expect(() => sessions.read(first)).toThrow();
  expect(sessions.read(next).pairingEpoch).toBe(epoch + 1);
});

it('enforces explicit Host and Origin rules without wildcard CORS', () => {
  expect(allowedLocalRequest('127.0.0.1:3001', undefined, 3001)).toBe(true);
  expect(allowedLocalRequest('evil.example', undefined, 3001)).toBe(false);
  expect(allowedLocalRequest('localhost:3001', 'https://evil.example', 3001)).toBe(false);
  expect(allowedLocalRequest('192.168.1.3:3000', 'http://192.168.1.3:3000', 3000, ['http://192.168.1.3:3000'])).toBe(true);
});
