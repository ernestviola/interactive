import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { request, type Server } from 'node:http';
import { inflateSync } from 'node:zlib';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { afterEach, describe, expect, it } from 'vitest';
import { createFixture, type Fixture } from '../../experiments/voice-mcp/fixture.js';
import { createExperiment } from '../../experiments/voice-mcp/server.js';

const servers: Server[] = [];
const clients: Client[] = [];
afterEach(async () => {
  await Promise.all(clients.splice(0).map(client => client.close()));
  await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => {
    server.close(() => resolve());
    server.closeAllConnections();
  })));
});

async function setup(fixture = createFixture({ symbol: 'triangle', code: '8427' }), deadlineMs = 100) {
  const capability = randomBytes(32).toString('base64url');
  const server = createExperiment({ capability, fixture, deadlineMs });
  servers.push(server);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No test address');
  const url = new URL(`http://127.0.0.1:${address.port}/mcp`);
  const client = new Client({ name: 'controlled-contract-client', version: '1.0.0' });
  clients.push(client);
  await client.connect(new StreamableHTTPClientTransport(url, {
    requestInit: { headers: { Authorization: `Bearer ${capability}` } },
  }));
  const read = async (args: Record<string, unknown> = {}) => CallToolResultSchema.parse(await client.callTool({ name: 'read_selected_sketch', arguments: args }));
  return { client, read, fixture, url, capability };
}

// Only assert booleans/counts: failures must never print credentials or image bodies.
function pngPixels(data: string) {
  const png = Buffer.from(data, 'base64');
  if (!png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return null;
  const compressed: Buffer[] = [];
  for (let offset = 8; offset < png.length;) {
    const size = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') compressed.push(png.subarray(offset + 8, offset + 8 + size));
    offset += size + 12;
  }
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20), pixels: inflateSync(Buffer.concat(compressed)) };
}

describe('controlled-image MCP experiment', () => {
  it('returns an actual PNG with visible ink and no visual answer in text metadata', async () => {
    const { read } = await setup();
    const result = await read();
    const image = result.content.find(c => c.type === 'image');
    expect(Boolean(image && image.mimeType === 'image/png')).toBe(true);
    const png = image?.type === 'image' ? pngPixels(image.data) : null;
    expect(Boolean(png && png.width === 640 && png.height === 360)).toBe(true);
    expect(Boolean(png?.pixels.some((value, index) => index % (640 * 3 + 1) !== 0 && value === 0))).toBe(true);
    const text = result.content.filter(c => c.type === 'text').map(c => c.text).join('');
    const metadata = text ? JSON.parse(text) as Record<string, unknown> : {};
    expect(Object.keys(metadata).sort()).toEqual(['capturedAt', 'snapshotId']);
    expect(/triangle|8427/i.test(text)).toBe(false);
  });

  it('makes every read freshly identified and timed without changing the source image', async () => {
    const { read, fixture } = await setup();
    const before = fixture.answer();
    const a = await read();
    const b = await read();
    const textA = a.content.find(c => c.type === 'text');
    const textB = b.content.find(c => c.type === 'text');
    const first = textA?.type === 'text' ? JSON.parse(textA.text) : {};
    const second = textB?.type === 'text' ? JSON.parse(textB.text) : {};
    expect(typeof first.snapshotId === 'string' && first.snapshotId !== second.snapshotId).toBe(true);
    expect(Number.isFinite(Date.parse(first.capturedAt)) && Date.parse(second.capturedAt) > Date.parse(first.capturedAt)).toBe(true);
    expect(JSON.stringify(fixture.answer()) === JSON.stringify(before)).toBe(true);
  });

  it('observes a manually changed second image and leaves the earlier result immutable', async () => {
    const { read, fixture } = await setup();
    const a = await read();
    const first = a.content.find(c => c.type === 'image');
    const saved = first?.type === 'image' ? first.data : '';
    fixture.replace({ symbol: 'circle', code: '3956' });
    const b = await read();
    const second = b.content.find(c => c.type === 'image');
    expect(second?.type === 'image' && second.data !== saved).toBe(true);
    expect(first?.type === 'image' && first.data === saved).toBe(true);
  });

  it('exposes exactly one read-only tool and forbids additional model arguments', async () => {
    const { client, read } = await setup();
    const tools = (await client.listTools()).tools;
    expect(tools.map(t => t.name)).toEqual(['read_selected_sketch']);
    expect(tools[0].annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: false });
    expect(tools[0].inputSchema.additionalProperties).toBe(false);
    const result = await read({ sessionId: 'foreign' });
    expect(result.isError).toBe(true);
    expect(result.content.some(c => c.type === 'image')).toBe(false);
    const unknown = CallToolResultSchema.parse(await client.callTool({ name: 'clear_canvas', arguments: {} }));
    expect(unknown.isError === true && !unknown.content.some(c => c.type === 'image')).toBe(true);
  });

  it('rejects missing/incorrect capabilities without disclosing image or session data', async () => {
    const { url } = await setup();
    for (const authorization of [undefined, 'Bearer incorrect', `Bearer ${randomBytes(32).toString('base64url')}`]) {
      const response = await fetch(url, { headers: authorization ? { Authorization: authorization } : {} });
      expect(response.status).toBe(401);
      expect((await response.text()).includes('image')).toBe(false);
      expect(response.headers.get('cache-control')).toBe('no-store');
    }
  });

  it('rejects foreign origins and Host headers before handling MCP', async () => {
    const { url, capability } = await setup();
    const response = await fetch(url, { headers: { Origin: 'https://foreign.example', Authorization: `Bearer ${capability}` } });
    expect(response.status).toBe(403);
    // Node fetch rewrites Host; use a raw HTTP request to exercise the actual boundary.
    const status = await new Promise<number | undefined>((resolve, reject) => {
      const req = request(url, { headers: { Host: 'foreign.example', Authorization: `Bearer ${capability}` } }, res => {
        res.resume(); resolve(res.statusCode);
      });
      req.once('error', reject); req.end();
    });
    expect(status).toBe(403);
  });

  it('bounds a hung capture and returns an actionable failure without a cached image', async () => {
    let shouldHang = false;
    let cancelled = false;
    const source = createFixture({ symbol: 'square', code: '1234' });
    const fixture: Fixture = { ...source, capture: signal => shouldHang
      ? new Promise((_resolve, reject) => { signal.addEventListener('abort', () => { cancelled = true; reject(new Error('cancelled')); }, { once: true }); })
      : source.capture(signal) };
    const { read } = await setup(fixture, 30);
    await read();
    shouldHang = true;
    const start = performance.now();
    const result = await read();
    expect(performance.now() - start < 1_000).toBe(true);
    expect(result.isError === true && cancelled).toBe(true);
    expect(result.content.some(c => c.type === 'image')).toBe(false);
    expect(result.content.some(c => c.type === 'text' && c.text.includes('CAPTURE_TIMEOUT'))).toBe(true);
  }, 2_000);

  it('maps render failure to a safe error and permits a fresh retry', async () => {
    const source = createFixture({ symbol: 'square', code: '1234' });
    let failing = true;
    const fixture: Fixture = { ...source, capture: async signal => {
      if (failing) throw new Error('private renderer detail');
      return source.capture(signal);
    } };
    const { read } = await setup(fixture);
    const result = await read();
    expect(result.isError).toBe(true);
    expect(result.content.some(c => c.type === 'text' && c.text.includes('CAPTURE_FAILED') && !c.text.includes('private renderer detail'))).toBe(true);
    failing = false;
    expect((await read()).content.some(c => c.type === 'image')).toBe(true);
  });
});
