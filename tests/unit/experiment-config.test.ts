import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, expect, it } from 'vitest';
import { loadLocalCapability } from '../../experiments/voice-mcp/local-config.js';

const dirs: string[] = [];
afterEach(() => dirs.splice(0).forEach(dir => rmSync(dir, { recursive: true, force: true })));
function configPath() {
  const dir = mkdtempSync(join(tmpdir(), 'sketch-config-'));
  dirs.push(dir);
  return join(dir, '.env.voice.local');
}

it('creates one owner-only local credential and reuses it across starts without exports', () => {
  const path = configPath();
  const first = loadLocalCapability(path);
  expect(/^[\w-]{43}$/.test(first)).toBe(true);
  expect(loadLocalCapability(path) === first).toBe(true);
  expect(statSync(path).mode & 0o777).toBe(0o600);
  expect(readFileSync(path, 'utf8').includes(first)).toBe(true);
});

it('rejects malformed local configuration without replacing or exposing its contents', () => {
  const path = configPath();
  const content = 'SKETCH_READ_TOKEN=invalid\n';
  writeFileSync(path, content, { mode: 0o600 });
  let failed = false;
  try { loadLocalCapability(path); } catch (error) {
    failed = error instanceof Error && !error.message.includes('invalid');
  }
  expect(failed).toBe(true);
  expect(readFileSync(path, 'utf8') === content).toBe(true);
});
