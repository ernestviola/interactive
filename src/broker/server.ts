import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { pathToFileURL } from 'node:url';
import { setTimeout as pause } from 'node:timers/promises';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { Sessions } from './sessions';
import { Captures, type Delivery } from './captures';
import { createSketchMcp, toolFailure } from './mcp';
import { allowedLocalRequest } from './http';
import { SketchError, type CapturePost } from '../lib/contracts/sketch';
import { LocalClient } from './local-client';
import { newCapability } from './capabilities';
import { loadLocalCapability } from '../../experiments/voice-mcp/local-config';

const empty = z.object({}).strict();
const openCanvas = z.object({ canvasId: z.string().uuid().optional(), tabId: z.string().uuid().optional() }).strict();
async function body(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []; let size = 0;
  for await (const chunk of req) { const bytes = Buffer.from(chunk); size += bytes.length; if (size > 6 * 1024 * 1024) throw new SketchError('PAYLOAD_TOO_LARGE', 'Use a smaller drawing image.', 413); chunks.push(bytes); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}

export function createBroker(trustedOrigins: string[] = [], bootstrap = newCapability(), options: { now?: () => number } = {}) {
  const sessions = new Sessions(options); const captures = new Captures(sessions);
  const localClient = new LocalClient(sessions, bootstrap);
  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
    const json = (status: number, data?: unknown) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(data === undefined ? undefined : JSON.stringify(data)); };
    const webPort = Number(process.env.SKETCH_WEB_PORT ?? 3000);
    const origins = [`http://localhost:${webPort}`, `http://127.0.0.1:${webPort}`, ...trustedOrigins];
    if (!allowedLocalRequest(req.headers.host ?? '', req.headers.origin, req.socket.localPort ?? 3001, origins)) return json(403);
    const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '';
    try {
      if (req.url === '/client-authorization' && req.method === 'GET') return json(200, localClient.headers(token));
      if (req.url === '/mcp') {
        sessions.read(token);
        if (req.method !== 'POST') return json(405);
        return await mcpRequest(req, res, token, captures);
      }
      if (req.headers['x-sketch-client'] !== '1') return json(403);
      const parts = new URL(req.url ?? '/', 'http://localhost').pathname.split('/').filter(Boolean);
      if (parts[0] !== 'sessions') return json(404);
      if (parts.length === 1 && req.method === 'POST') { const input = openCanvas.parse(await body(req)); return json(201, sessions.create(input.canvasId, input.tabId)); }
      const id = parts[1]; if (!id) return json(404);
      const session = sessions.owner(id, token);
      if (parts.length === 2 && req.method === 'DELETE') { sessions.end(id, token); return json(204); }
      if (parts.length === 4 && parts[2] === 'tabs' && req.method === 'DELETE') { sessions.leave(id, token, parts[3]); return json(204); }
      if (parts.length === 3 && parts[2] === 'heartbeat' && req.method === 'POST') {
        empty.parse(await body(req)); sessions.heartbeat(id, token);
        return json(200, { leaseExpiresAt: session.leaseExpiresAt, lastRead: session.lastRead, paired: !!session.readHash, reading: captures.busy(id) });
      }
      if (parts.length === 3 && parts[2] === 'capture' && req.method === 'GET') {
        const end = Date.now() + 5_000;
        while (!res.destroyed && Date.now() < end) {
          const request = captures.claim(id, token); if (request) return json(200, request);
          await pause(100);
        }
        if (!res.destroyed) return json(204);
        return;
      }
      if (parts.length === 4 && parts[2] === 'capture' && req.method === 'POST') {
        const post = await body(req) as CapturePost;
        if (!post || typeof post !== 'object') return json(400);
        captures.submit(id, token, parts[3], post); return json(204);
      }
      return json(404);
    } catch (error) {
      if (res.destroyed || res.headersSent) { res.destroy(); return; }
      if (error instanceof SketchError) { if (error.retryAfter) res.setHeader('Retry-After', String(error.retryAfter)); return json(error.status, { code: error.code, message: error.message }); }
      return json(400, { code: 'CAPTURE_FAILED', message: 'The request could not be accepted. Retry from the canvas.' });
    }
  });
  const sweep = setInterval(() => sessions.expire(), 1_000); sweep.unref(); server.once('close', () => clearInterval(sweep));
  return { server, sessions, captures };
}

async function mcpRequest(req: IncomingMessage, res: ServerResponse, token: string, captures: Captures) {
  const abort = new AbortController(); let delivery: Delivery | null = null;
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  const mcp = createSketchMcp(captures, token, abort.signal, result => { delivery = result; });
  const originalSend = transport.send.bind(transport);
  transport.send = async (message, options) => {
    if (delivery && 'result' in message) {
      try { delivery.assertCurrent(); }
      catch { delivery.discard(); delivery = null; message = { jsonrpc: '2.0', id: message.id, result: toolFailure('SESSION_UNAVAILABLE', 'Pair the canvas again and retry.') }; }
    }
    return originalSend(message, options);
  };
  res.once('finish', () => delivery?.markSent());
  res.once('close', () => { abort.abort(); delivery?.discard(); delivery = null; void mcp.close(); });
  await mcp.connect(transport);
  await transport.handleRequest(req, res, await body(req));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { server } = createBroker((process.env.SKETCH_TRUSTED_ORIGINS ?? '').split(',').filter(Boolean), loadLocalCapability());
  server.listen(3001, '127.0.0.1', () => console.info('Sketch broker listening on loopback port 3001.'));
  server.once('error', () => { console.error('Broker could not start. Stop the experiment server if port 3001 is in use.'); process.exitCode = 1; });
  const stop = () => { server.closeAllConnections(); server.close(); };
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
}
