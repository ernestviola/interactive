import { spawn } from 'node:child_process';
const stages = [
  ['install', '--frozen-lockfile'], ['test'], ['run', 'test:browser'],
  ['run', 'typecheck'], ['run', 'lint'], ['run', 'build'],
];
for (const args of stages) {
  console.info(`\nChecking: pnpm ${args.join(' ')}`);
  const child = spawn('pnpm', args, { stdio: 'inherit', env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' } });
  const code = await new Promise<number>(resolve => { child.once('exit', value => resolve(value ?? 1)); child.once('error', () => resolve(1)); });
  if (code !== 0) { process.exitCode = code; break; }
}
