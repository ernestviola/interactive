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

// Spec 002 workload: 500 paths of 75 points across five distant starting views.
export function canvasWorkload(): Stroke[] {
  let seed = 0x002ca57;
  const next = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 0x100000000; };
  const views = [{ x: 0, y: 0 }, { x: 1600, y: 0 }, { x: -1500, y: 800 }, { x: 0, y: -1400 }, { x: 1900, y: 1600 }];
  return Array.from({ length: 500 }, (_, index) => {
    const view = views[index % views.length];
    const origin = { x: view.x + next() * 300, y: view.y + next() * 300 };
    return { id: `canvas-workload-${index}`, points: Array.from({ length: 75 }, (_, point) => ({
      x: origin.x + point * 1.4 + (next() - .5) * 12,
      y: origin.y + Math.sin(point / 7) * 18 + (next() - .5) * 12,
    })) };
  });
}
export const emptyDrawing: Stroke[] = [];
export const farApartDrawing: Stroke[] = [
  { id: 'near', points: [{ x: 0, y: 0 }, { x: 30, y: 30 }] },
  { id: 'far', points: [{ x: 100_000, y: 100_000 }, { x: 100_030, y: 100_030 }] },
];
