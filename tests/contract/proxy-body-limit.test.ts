import { expect, it, vi } from 'vitest';
import { POST } from '../../src/app/api/sketch/[...path]/route';
const limit = 6 * 1024 * 1024;
const context = { params: Promise.resolve({ path: ['sessions'] }) };
function request(body: ReadableStream<Uint8Array>, length?: number) {
  return new Request('http://127.0.0.1:3000/api/sketch/sessions', {
    method: 'POST', duplex: 'half', body,
    headers: { host: '127.0.0.1:3000', 'x-sketch-client': '1', ...(length === undefined ? {} : { 'content-length': String(length) }) },
  } as RequestInit);
}
it('rejects and cancels a streamed oversized proxy body before reading its remaining chunks or contacting the broker', async () => {
  let pulls = 0; let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) { pulls++; controller.enqueue(new Uint8Array(pulls === 1 ? limit : 1)); if (pulls === 3) controller.close(); },
    cancel() { cancelled = true; },
  }, { highWaterMark: 0 });
  const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
  try {
    const response = await POST(request(stream), context);
    expect(response.status).toBe(413); expect(response.headers.get('cache-control')).toBe('no-store');
    expect(pulls).toBe(2); expect(cancelled).toBe(true); expect(fetchMock).not.toHaveBeenCalled();
  } finally { vi.unstubAllGlobals(); }
});
it('rejects an oversized declared proxy body without reading it', async () => {
  let pulls = 0; let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({ pull(controller) { pulls++; controller.close(); }, cancel() { cancelled = true; } }, { highWaterMark: 0 });
  const response = await POST(request(stream, limit + 1), context);
  expect(response.status).toBe(413); expect(pulls).toBe(0); expect(cancelled).toBe(true);
});
it('accepts a body exactly at the proxy limit and forwards only that body', async () => {
  const bytes = new Uint8Array(limit);
  const stream = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(bytes); controller.close(); } });
  const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 201 })); vi.stubGlobal('fetch', fetchMock);
  try {
    const response = await POST(request(stream, limit), context);
    expect(response.status).toBe(201); expect(response.headers.get('cache-control')).toBe('no-store');
    expect(fetchMock).toHaveBeenCalledOnce();
    const options = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Uint8Array(options.body as ArrayBuffer)).toHaveLength(limit);
  } finally { vi.unstubAllGlobals(); }
});
