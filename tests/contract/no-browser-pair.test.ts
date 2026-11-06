import { once } from 'node:events';
import { expect, it } from 'vitest';
import { createBroker } from '../../src/broker/server';

it('does not return or rotate a read capability through browser owner authority', async () => {
  const broker = createBroker([], 'local-helper-bootstrap');
  broker.server.listen(0, '127.0.0.1');
  await once(broker.server, 'listening');
  try {
    const address = broker.server.address();
    if (!address || typeof address === 'string') throw new Error('Broker address unavailable');
    const base = `http://127.0.0.1:${address.port}`;
    const session = broker.sessions.create();
    const before = broker.sessions.readToken(broker.sessions.owner(session.id, session.ownerCapability));
    const response = await fetch(`${base}/sessions/${session.id}/pair`, {
      method: 'POST', headers: { 'X-Sketch-Client': '1', Authorization: `Bearer ${session.ownerCapability}`, 'Content-Type': 'application/json' }, body: '{}',
    });
    expect(response.status).toBe(404);
    expect((await response.text()).includes('readCapability')).toBe(false);
    expect(broker.sessions.readToken(broker.sessions.owner(session.id, session.ownerCapability))).toBe(before);
    const helper = await fetch(`${base}/client-authorization`, { headers: { Authorization: 'Bearer local-helper-bootstrap' } });
    expect(helper.status).toBe(200);
  } finally {
    broker.server.closeAllConnections();
    await new Promise<void>(resolve => broker.server.close(() => resolve()));
  }
});
