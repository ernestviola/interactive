import { loadLocalCapability } from './local-config.ts';

// Invoked ONLY by the local MCP host. Stdout is its credential channel, not a log.
try {
  const bootstrap = loadLocalCapability(undefined, false);
  let headers = { Authorization: `Bearer ${bootstrap}` };
  try {
    const response = await fetch(`http://127.0.0.1:${Number(process.env.SKETCH_BROKER_PORT ?? 3001)}/client-authorization`, {
      headers, cache: 'no-store', signal: AbortSignal.timeout(2_000),
    });
    if (response.ok) {
      const candidate = await response.json() as { Authorization?: unknown };
      if (typeof candidate.Authorization === 'string' && /^Bearer [\w-]{43}$/.test(candidate.Authorization)) headers = { Authorization: candidate.Authorization };
    }
  } catch { /* Standalone experiment uses the original bootstrap capability. */ }
  process.stdout.write(JSON.stringify(headers));
} catch {
  console.error('Start the voice experiment before connecting its MCP server.');
  process.exitCode = 1;
}
