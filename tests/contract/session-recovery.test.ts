import { expect, it } from 'vitest';
import { Sessions } from '../../src/broker/sessions';
import { createBroker } from '../../src/broker/server';
import { once } from 'node:events';

it('limits four active sessions and ten creation attempts per minute with actionable retry intervals', () => {
  let now = 0; const sessions = new Sessions({ now: () => now });
  const active = Array.from({ length: 4 }, () => sessions.create());
  let capacity: unknown; try { sessions.create(); } catch (error) { capacity = error; }
  expect(capacity).toMatchObject({ status: 429, retryAfter: 20 });
  sessions.end(active[0].id, active[0].ownerCapability); expect(!!sessions.create().id).toBe(true);
  now = 20_000; expect(!!sessions.create().id).toBe(true);
  const rate = new Sessions({ now: () => now });
  for (let i = 0; i < 10; i++) { const a = rate.create(); rate.end(a.id, a.ownerCapability); }
  let limit: unknown; try { rate.create(); } catch (error) { limit = error; }
  expect(limit).toMatchObject({ status: 429, retryAfter: 60 });
  now += 60_000; expect(!!rate.create().id).toBe(true);
});

it('enforces 6 MiB request-body limit and returns no-store errors without logging request content', async () => {
  const { server } = createBroker(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('No test address');
  try {
    const url = `http://127.0.0.1:${address.port}/sessions`;
    for (let i = 0; i < 4; i++) { const created = await fetch(url, { method: 'POST', headers: { 'X-Sketch-Client': '1', 'Content-Type': 'application/json' }, body: '{}' }); expect(created.status).toBe(201); await created.body?.cancel(); }
    const capacity = await fetch(url, { method: 'POST', headers: { 'X-Sketch-Client': '1', 'Content-Type': 'application/json' }, body: '{}' });
    expect(capacity.status).toBe(429); expect(capacity.headers.get('retry-after')).toBe('20'); await capacity.body?.cancel();
    const response = await fetch(`http://127.0.0.1:${address.port}/sessions`, { method: 'POST', headers: { 'X-Sketch-Client': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ oversized: 'x'.repeat(6 * 1024 * 1024) }) });
    expect(response.status).toBe(413); expect(response.headers.get('cache-control')).toBe('no-store');
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
