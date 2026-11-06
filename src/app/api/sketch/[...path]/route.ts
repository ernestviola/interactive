import { allowedLocalRequest } from '../../../../broker/http';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const trusted = () => (process.env.SKETCH_TRUSTED_ORIGINS ?? '').split(',').filter(Boolean);
const BODY_LIMIT = 6 * 1024 * 1024;
async function boundedBody(request: Request): Promise<ArrayBuffer | undefined> {
  if (['GET', 'HEAD', 'DELETE'].includes(request.method)) return undefined;
  if (Number(request.headers.get('content-length')) > BODY_LIMIT) {
    await request.body?.cancel(); throw new RangeError('Request body limit exceeded');
  }
  if (!request.body) return undefined;
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > BODY_LIMIT) { await reader.cancel(); throw new RangeError('Request body limit exceeded'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes.buffer;
}
async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  if (!allowedLocalRequest(request.headers.get('host') ?? '', request.headers.get('origin') ?? undefined, Number(process.env.SKETCH_WEB_PORT ?? 3000), trusted()) || request.headers.get('x-sketch-client') !== '1') {
    return new Response(null, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  }
  if (path[0] !== 'sessions' || path.some(segment => !/^[\w-]+$/.test(segment))) return new Response(null, { status: 404 });
  const headers = new Headers({ 'X-Sketch-Client': '1' });
  for (const name of ['authorization', 'content-type', 'origin']) { const value = request.headers.get(name); if (value) headers.set(name, value); }
  try {
    const body = await boundedBody(request);
    const upstream = await fetch(`http://127.0.0.1:${Number(process.env.SKETCH_BROKER_PORT ?? 3001)}/${path.join('/')}`, { method: request.method, headers, body, signal: request.signal, cache: 'no-store' });
    const responseHeaders = new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    const retry = upstream.headers.get('retry-after'); if (retry) responseHeaders.set('Retry-After', retry);
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch (error) {
    if (error instanceof RangeError) return new Response(null, { status: 413, headers: { 'Cache-Control': 'no-store' } });
    return Response.json({ code: 'SESSION_UNAVAILABLE', message: 'Canvas connection unavailable. Keep drawing and reconnect.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
}
export { proxy as GET, proxy as POST, proxy as DELETE };
