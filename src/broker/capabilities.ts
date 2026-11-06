import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
export const newCapability = () => randomBytes(32).toString('base64url');
export const hashCapability = (token: string) => createHash('sha256').update(token).digest('hex');
export const matchesCapability = (token: string, hash: string | null) => !!hash &&
  timingSafeEqual(Buffer.from(hashCapability(token), 'hex'), Buffer.from(hash, 'hex'));
