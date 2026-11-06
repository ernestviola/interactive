import { afterEach, expect, it, vi } from 'vitest';
import { SessionClient, type Connection } from '../../src/lib/session-client';
import { createDrawing } from '../../src/lib/drawing/state';
afterEach(() => vi.unstubAllGlobals());
it('explicit Connect recovers an expired generation in one action, preserves local drawing, and clears prior provenance', async () => {
  const statuses: Connection[] = []; const drawing = createDrawing(); let created = 0; let expire = false;
  vi.stubGlobal('fetch', vi.fn(async (url: string, options?: RequestInit) => {
    if (url.endsWith('/sessions') && options?.method === 'POST') return Response.json({ id: `session-${++created}`, generation: `generation-${created}`, ownerCapability: 'owner', leaseExpiresAt: Date.now() + 20_000 });
    if (url.endsWith('/pair')) {
      if (expire && url.includes('session-1')) return new Response(null, { status: 401 });
      return Response.json({ readCapability: `read-${created}` });
    }
    if (options?.method === 'DELETE') return new Response(null, { status: 204 });
    return new Promise((_resolve, reject) => options?.signal?.addEventListener('abort', () => reject(new Error('cancelled')), { once: true }));
  }));
  const client = new SessionClient(() => drawing, status => statuses.push(status));
  try {
    await client.start(); expect(await client.pair()).toBe('read-1'); expire = true;
    expect(await client.pair()).toBe('read-2');
    expect(created).toBe(2); expect(drawing.strokes).toHaveLength(0);
    expect(statuses.some(status => status.lastRead === null)).toBe(true);
  } finally { client.close(); }
});
