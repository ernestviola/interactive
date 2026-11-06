import type { Point, Stroke } from '../contracts/sketch';

export type Viewport = { x: number; y: number; zoom: number };
export const createViewport = (): Viewport => ({ x: 0, y: 0, zoom: 1 });
const finite = (...values: number[]) => {
  if (values.some(value => !Number.isFinite(value))) throw new Error('Viewport values must be finite.');
};
export function worldToScreen(view: Viewport, point: Point): Point {
  finite(view.x, view.y, view.zoom, point.x, point.y);
  return { x: point.x * view.zoom + view.x, y: point.y * view.zoom + view.y };
}
export function screenToWorld(view: Viewport, point: Point): Point {
  finite(view.x, view.y, view.zoom, point.x, point.y);
  return { x: (point.x - view.x) / view.zoom, y: (point.y - view.y) / view.zoom };
}
export function pan(view: Viewport, dx: number, dy: number): Viewport {
  finite(dx, dy);
  return { ...view, x: view.x + dx, y: view.y + dy };
}
export function zoomAt(view: Viewport, factor: number, anchor: Point): Viewport {
  finite(factor, anchor.x, anchor.y);
  if (factor <= 0) throw new Error('Zoom factor must be positive.');
  const zoom = Math.max(0.1, Math.min(8, view.zoom * factor));
  const world = screenToWorld(view, anchor);
  return { x: anchor.x - world.x * zoom, y: anchor.y - world.y * zoom, zoom };
}
export function fitToDrawing(strokes: Stroke[], size: { width: number; height: number }): Viewport {
  finite(size.width, size.height);
  if (size.width <= 0 || size.height <= 0) throw new Error('Canvas dimensions must be positive.');
  if (!strokes.length) return createViewport();
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  for (const stroke of strokes) for (const point of stroke.points) {
    minX = Math.min(minX, point.x); minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x); maxY = Math.max(maxY, point.y);
  }
  if (!Number.isFinite(minX)) return createViewport();
  const zoom = Math.max(0.1, Math.min(8, (size.width - 80) / Math.max(1, maxX - minX), (size.height - 80) / Math.max(1, maxY - minY)));
  return { zoom, x: size.width / 2 - (minX + maxX) / 2 * zoom, y: size.height / 2 - (minY + maxY) / 2 * zoom };
}
