import { expect, it } from 'vitest';
import { Sessions } from '../../src/broker/sessions';
import { LocalClient } from '../../src/broker/local-client';

it('automatically grants one live canvas to the helper and treats duplicate tabs as one target', () => {
  const sessions = new Sessions();
  const local = new LocalClient(sessions, 'bootstrap-secret');
  const first = sessions.create('canvas-a', 'tab-1');
  const second = sessions.create('canvas-a', 'tab-2');
  expect(second.id).toBe(first.id);
  const header = local.headers('bootstrap-secret');
  expect(sessions.read(header.Authorization.slice(7)).id).toBe(first.id);
  sessions.leave(first.id, first.ownerCapability, 'tab-1');
  expect(sessions.read(local.headers('bootstrap-secret').Authorization.slice(7)).id).toBe(first.id);
  sessions.leave(second.id, second.ownerCapability, 'tab-2');
  expect(() => local.headers('bootstrap-secret')).toThrow();
});

it('fails clearly when distinct canvases are active', () => {
  const sessions = new Sessions();
  const local = new LocalClient(sessions, 'bootstrap-secret');
  sessions.create('canvas-a', 'tab-1'); sessions.create('canvas-b', 'tab-2');
  expect(() => local.headers('bootstrap-secret')).toThrowError(/ambiguous/i);
});
