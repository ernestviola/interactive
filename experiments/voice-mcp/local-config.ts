import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { closeSync, constants, fstatSync, openSync, readFileSync, writeFileSync } from 'node:fs';

export const localConfigPath = fileURLToPath(new URL('../../.env.voice.local', import.meta.url));

// Operator-only configuration, separate from drawings and test artifacts. It is ignored
// by Git, created exclusively with owner-only access, and never printed by the server.
export function loadLocalCapability(path = localConfigPath, create = true): string {
  if (create) {
    try {
      writeFileSync(path, `SKETCH_READ_TOKEN=${randomBytes(32).toString('base64url')}\n`, { mode: 0o600, flag: 'wx' });
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'EEXIST')) throw new Error('Could not create private experiment configuration.');
    }
  }
  let fd: number | undefined;
  try {
    fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.size > 1024 || (stat.mode & 0o077) !== 0 ||
      (process.getuid && stat.uid !== process.getuid())) throw new Error('Unsafe local configuration');
    const match = /^SKETCH_READ_TOKEN=([\w-]{43})\n?$/.exec(readFileSync(fd, 'utf8'));
    if (!match || Buffer.from(match[1], 'base64url').length !== 32) throw new Error('Malformed local configuration');
    return match[1];
  } catch {
    throw new Error('Private experiment configuration is missing or unusable. Start the voice experiment to create it, or check its owner-only permissions.');
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}
