import type { Stroke } from '../../src/lib/contracts/sketch';
// Synthetic performance workload only. Never serialize it into MCP text metadata.
export function fixedWorkload(): Stroke[] {
  let seed = 0x51ec7;
  const next = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 0x100000000; };
  return Array.from({ length: 500 }, (_, stroke) => ({
    id: `workload-${stroke}`,
    points: Array.from({ length: 1000 }, () => ({ x: 8 + next() * 1008, y: 8 + next() * 752 })),
  }));
}
