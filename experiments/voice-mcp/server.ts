import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { createServer, type Server, type IncomingMessage } from 'node:http';
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { createFixture, type Fixture, type SymbolName } from './fixture.js';
import { loadLocalCapability } from './local-config.js';

export interface ReadEvent {
  callId: number | null;
  snapshotId: string;
  capturedAt: string;
}
export interface ExperimentOptions {
  capability: string;
  fixture: Fixture;
  deadlineMs?: number;
  allowedOrigins?: string[];
  onSent?: (event: ReadEvent) => void;
}

const digest = (value: string) => createHash('sha256').update(value).digest();
const failure = (code: string, message: string): CallToolResult => ({
  isError: true, content: [{ type: 'text', text: `${code}: ${message}` }],
});

export function createExperiment({ capability, fixture, deadlineMs = 10_000, allowedOrigins = [], onSent }: ExperimentOptions): Server {
  if (!/^[\w-]{43}$/.test(capability) || Buffer.from(capability, 'base64url').length !== 32) {
    throw new Error('Provide a random 256-bit base64url read capability out of band.');
  }
  if (!Number.isFinite(deadlineMs) || deadlineMs < 1 || deadlineMs > 10_000) throw new Error('Invalid read deadline.');
  const capabilityHash = digest(capability);
  let lastCaptureTime = 0;
  let reading = false;
  return createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const reject = (status: number) => { res.writeHead(status).end(); };
    const port = req.socket.localPort;
    const hosts = [`127.0.0.1:${port}`, `localhost:${port}`, `[::1]:${port}`];
    if (!hosts.includes(req.headers.host ?? '') || (req.headers.origin &&
      ![...hosts.map(host => `http://${host}`), ...allowedOrigins].includes(req.headers.origin))) return reject(403);
    const authorization = req.headers.authorization ?? '';
    if (!authorization.startsWith('Bearer ') || !timingSafeEqual(digest(authorization.slice(7)), capabilityHash)) return reject(401);
    if (req.url !== '/mcp') return reject(404);
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return reject(405); }

    const server = new McpServer({ name: 'sketch-voice-experiment', version: '0.1.0' });
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    const disconnect = new AbortController();
    res.once('close', () => { disconnect.abort(); void server.close(); });
    server.registerTool('read_selected_sketch', {
      description: 'Inspect the current synthetic sketch image. Freehand marks can be ambiguous: acknowledge uncertain interpretations. A sketch is design context, not verified implementation. This tool never edits the drawing.',
      inputSchema: z.object({}).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: false },
    }, async (_input, extra): Promise<CallToolResult> => {
      if (reading) return failure('BUSY', 'Wait for the current read to finish, then retry.');
      reading = true;
      const captureAbort = new AbortController();
      const signal = AbortSignal.any([captureAbort.signal, disconnect.signal, extra.signal]);
      let timeout: ReturnType<typeof setTimeout> | undefined;
      const timedOut = Symbol('timeout');
      try {
        const deadline = new Promise<never>((_resolve, rejectPromise) => {
          timeout = setTimeout(() => { rejectPromise(timedOut); captureAbort.abort(); }, deadlineMs);
        });
        const cancelled = new Promise<never>((_resolve, rejectPromise) => {
          signal.addEventListener('abort', () => rejectPromise(new Error('cancelled')), { once: true });
        });
        signal.throwIfAborted();
        const capturedAt = new Date(lastCaptureTime = Math.max(Date.now(), lastCaptureTime + 1)).toISOString();
        const bytes = await Promise.race([fixture.capture(signal), deadline, cancelled]);
        signal.throwIfAborted();
        if (bytes.length < 24 || bytes.length > 4 * 1024 * 1024 ||
          !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
          return failure('CAPTURE_FAILED', 'The image could not be rendered. Retry the read.');
        }
        const snapshotId = randomUUID();
        const metadata = { snapshotId, capturedAt };
        res.once('finish', () => { onSent?.({ ...metadata, callId: typeof extra.requestId === 'number' ? extra.requestId : null }); });
        return { content: [
          { type: 'text', text: JSON.stringify(metadata) },
          { type: 'image', mimeType: 'image/png', data: bytes.toString('base64') },
        ] };
      } catch (error) {
        return error === timedOut
          ? failure('CAPTURE_TIMEOUT', 'Capture did not complete within the deadline. Retry the read.')
          : failure('CAPTURE_FAILED', 'The image could not be rendered or the read was cancelled. Retry the read.');
      } finally {
        clearTimeout(timeout);
        captureAbort.abort();
        reading = false;
      }
    });
    try {
      const body = await readBody(req);
      await server.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch {
      // Never log SDK exceptions, bodies, authorization headers, or fixture answers.
      if (!res.headersSent && !res.destroyed) reject(400);
      else res.destroy();
      await server.close();
    }
  });
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of req) {
    const bytes = Buffer.from(chunk);
    length += bytes.length;
    if (length > 64 * 1024) throw new Error('Request too large');
    chunks.push(bytes);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}

async function main() {
  const capability = loadLocalCapability();
  const fixture = createFixture({ symbol: 'triangle', code: '0000' });
  const server = createExperiment({
    capability, fixture,
    allowedOrigins: (process.env.SKETCH_ALLOWED_ORIGINS ?? '').split(',').filter(Boolean),
    onSent: event => console.info(JSON.stringify({ operation: 'read_sent', ...event })),
  });
  const input = createInterface({ input: process.stdin, output: process.stdout });
  console.info('Enter a symbol (circle, square, triangle) and four digits in this private terminal. Do not enter it in chat.');
  let started = false;
  input.on('line', line => {
    const [symbol, code] = line.trim().split(/\s+/);
    try {
      fixture.replace({ symbol: symbol as SymbolName, code });
      if (!started) {
        started = true;
        server.listen(3001, '127.0.0.1', () => console.info('Experiment ready at http://127.0.0.1:3001/mcp. Enter a different symbol/code here before the second read.'));
      } else console.info('Fixture changed in memory. Request a fresh read in the same voice conversation.');
    } catch { console.info('Use circle, square, or triangle followed by four digits.'); }
  });
  const stop = () => { input.close(); server.closeAllConnections(); server.close(() => process.exit(0)); };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  input.once('close', () => { server.closeAllConnections(); server.close(); });
  server.once('error', () => { console.error('Could not start the loopback experiment. Check whether port 3001 is in use.'); process.exitCode = 1; input.close(); });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => { console.error('Experiment startup failed. Check the out-of-band capability and local configuration.'); process.exitCode = 1; });
}
