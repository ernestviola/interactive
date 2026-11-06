import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { createFixture } from './fixture.js';
import { createExperiment } from './server.js';

// Independent Inspector CLI smoke check. Child output stays in memory and is never
// forwarded to logs: tools/call includes image bytes. The capability is disposable.
const capability = randomBytes(32).toString('base64url');
const fixture = createFixture({ symbol: 'triangle', code: '8427' });
const server = createExperiment({ capability, fixture });
try {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No loopback address');
  const url = `http://127.0.0.1:${address.port}/mcp`;
  async function read() {
    const child = spawn('pnpm', [
      'dlx', '@modelcontextprotocol/inspector@2.14.0', '--cli',
      '--server-url', url, '--transport', 'http',
      '--header', `Authorization: Bearer ${capability}`,
      '--method', 'tools/call', '--tool-name', 'read_selected_sketch',
      '--format', 'json', '--quiet', '--stored-auth-only',
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    let tooLarge = false;
    const timer = setTimeout(() => child.kill(), 30_000);
    child.stdout.on('data', chunk => {
      if (output.length + chunk.length > 1024 * 1024) { tooLarge = true; child.kill(); }
      else output += String(chunk);
    });
    child.stderr.resume(); // Intentionally discard: third-party diagnostics are not payload-safe.
    const [status] = await once(child, 'exit');
    clearTimeout(timer);
    if (status !== 0 || tooLarge) throw new Error('Inspector failed');
    // pnpm may append its completion banner; select the JSON object only.
    const start = output.indexOf('{');
    const end = output.lastIndexOf('}');
    const envelope = JSON.parse(output.slice(start, end + 1)) as { result?: unknown };
    return CallToolResultSchema.parse(envelope.result ?? envelope);
  }
  const first = await read();
  fixture.replace({ symbol: 'circle', code: '3956' });
  const second = await read();
  const imageA = first.content.find(c => c.type === 'image');
  const imageB = second.content.find(c => c.type === 'image');
  const textA = first.content.find(c => c.type === 'text');
  const textB = second.content.find(c => c.type === 'text');
  if (!imageA || !imageB || imageA.data === imageB.data || !textA || !textB || textA.text === textB.text) {
    throw new Error('Inspector freshness check failed');
  }
  console.info('Inspector 2.14.0: two fresh PNG tool responses verified; no payloads persisted. Live voice remains untested.');
} catch {
  console.error('Inspector smoke check failed. No response payload or capability has been logged.');
  process.exitCode = 1;
} finally {
  server.closeAllConnections();
  await new Promise<void>(resolve => server.close(() => resolve()));
}
