import { afterEach, expect, it, vi } from 'vitest';
import { SessionClient, type Connection } from '../../src/lib/session-client';
import { createDrawing } from '../../src/lib/drawing/state';
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

it('registers a canvas automatically and never sends a manual pairing request or image while idle', async () => {
  const calls: string[] = []; const statuses: Connection[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, options?: RequestInit) => {
    calls.push(`${options?.method ?? 'GET'} ${url}`);
    if (url.endsWith('/sessions')) return Response.json({ id: 'canvas', generation: 'generation', ownerCapability: 'owner', leaseExpiresAt: Date.now() + 20_000 });
    return new Promise((_resolve, reject) => options?.signal?.addEventListener('abort', () => reject(new Error('cancelled')), { once: true }));
  }));
  const client = new SessionClient(createDrawing, status => statuses.push(status), 'canvas', 'tab', () => false);
  await client.start();
  expect(statuses.some(status => status.state === 'paired')).toBe(true);
  expect(calls).toEqual(['POST /api/sketch/sessions']);
  client.close();
});
