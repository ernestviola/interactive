import { HEIGHT, WIDTH, type Rect, type Stroke } from '../contracts/sketch';
import type { Drawing } from './state';

export function renderInk(context: CanvasRenderingContext2D, strokes: Stroke[]) {
  context.strokeStyle = '#141c24'; context.fillStyle = '#141c24'; context.lineWidth = 3;
  context.lineCap = 'round'; context.lineJoin = 'round';
  for (const stroke of strokes) {
    const first = stroke.points[0]; if (!first) continue;
    if (!stroke.points.some(p => p.x !== first.x || p.y !== first.y)) { context.beginPath(); context.arc(first.x, first.y, 1.5, 0, Math.PI * 2); context.fill(); continue; }
    context.beginPath(); context.moveTo(first.x, first.y);
    for (const p of stroke.points.slice(1)) context.lineTo(p.x, p.y);
    context.stroke();
  }
}
export function renderCanvas(canvas: HTMLCanvasElement, drawing: Drawing) {
  canvas.width = WIDTH; canvas.height = HEIGHT;
  const context = canvas.getContext('2d')!; context.fillStyle = 'white'; context.fillRect(0, 0, WIDTH, HEIGHT);
  renderInk(context, drawing.strokes);
  if (drawing.gesture?.mode === 'draw') renderInk(context, [{ id: drawing.gesture.id, points: drawing.gesture.points }]);
  let selection = drawing.selection;
  if (drawing.gesture?.mode === 'select') {
    const a = drawing.gesture.points[0]; const b = drawing.gesture.points.at(-1)!;
    selection = { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y) };
  }
  if (selection) {
    context.fillStyle = '#386b6410'; context.fillRect(selection.x, selection.y, selection.width, selection.height);
    context.strokeStyle = '#386b64'; context.lineWidth = 1.5; context.setLineDash([7, 5]);
    context.strokeRect(selection.x, selection.y, selection.width, selection.height);
  }
}
export function renderSelection(strokes: Stroke[], selection: Rect): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(selection.width); canvas.height = Math.ceil(selection.height);
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  context.fillStyle = 'white'; context.fillRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.scale(canvas.width / selection.width, canvas.height / selection.height);
  context.translate(-selection.x, -selection.y); renderInk(context, strokes); context.restore();
  return canvas;
}
export function hasInk(canvas: HTMLCanvasElement): boolean {
  const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
  for (let i = 0; i < pixels.length; i += 4) if (pixels[i] < 250 || pixels[i + 1] < 250 || pixels[i + 2] < 250) return true;
  return false;
}
