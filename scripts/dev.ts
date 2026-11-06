import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
if (existsSync('.env.local')) loadEnvFile('.env.local');
const production = process.argv.includes('--production');
const children: ChildProcess[] = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  process.exitCode = code;
}
for (const args of [['exec', 'tsx', 'src/broker/server.ts'], ['exec', 'next', production ? 'start' : 'dev', '--hostname', '0.0.0.0', '--port', '3000']]) {
  const child = spawn('pnpm', args, { stdio: 'inherit', env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' } });
  children.push(child);
  child.once('error', () => stop(1));
  child.once('exit', code => stop(code ?? 1));
}
process.once('SIGINT', () => stop());
process.once('SIGTERM', () => stop());
