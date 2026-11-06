import { expect, it } from 'vitest';
import { createViewport, fitToDrawing, pan, screenToWorld, worldToScreen, zoomAt } from '../../src/lib/drawing/viewport';

it('round-trips world points and pans without touching drawing state', () => {
  const start = createViewport();
  const moved = pan(start, 100, -50);
  expect(screenToWorld(moved, worldToScreen(moved, { x: -5000, y: 7200 }))).toEqual({ x: -5000, y: 7200 });
  expect(start).toEqual(createViewport());
});

it('fits all committed world points into the visible canvas', () => {
  const view = fitToDrawing([{ id: 'one', points: [{ x: -1200, y: -600 }, { x: 2000, y: 900 }] }], { width: 600, height: 400 });
  for (const point of [{ x: -1200, y: -600 }, { x: 2000, y: 900 }]) {
    const screen = worldToScreen(view, point);
    expect(screen.x).toBeGreaterThanOrEqual(0); expect(screen.x).toBeLessThanOrEqual(600);
    expect(screen.y).toBeGreaterThanOrEqual(0); expect(screen.y).toBeLessThanOrEqual(400);
  }
  expect(fitToDrawing([], { width: 600, height: 400 })).toEqual(createViewport());
});

it('anchors zoom at the pointer and clamps finite zoom bounds', () => {
  const start = pan(createViewport(), 80, 40);
  const before = screenToWorld(start, { x: 300, y: 200 });
  const zoomed = zoomAt(start, 2, { x: 300, y: 200 });
  expect(screenToWorld(zoomed, { x: 300, y: 200 })).toEqual(before);
  expect(zoomAt(start, 1e9, { x: 0, y: 0 }).zoom).toBeLessThanOrEqual(8);
  expect(zoomAt(start, 1e-9, { x: 0, y: 0 }).zoom).toBeGreaterThanOrEqual(0.1);
  expect(() => zoomAt(start, Infinity, { x: 0, y: 0 })).toThrow();
});
