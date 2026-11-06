import type { Stroke } from '../contracts/sketch';
import type { Drawing } from './state';
import type { Viewport } from './viewport';

export function renderInk(context: CanvasRenderingContext2D, strokes: Stroke[]) {
  context.strokeStyle = '#141c24'; context.fillStyle = '#141c24'; context.lineWidth = 3;
  context.lineCap = 'round'; context.lineJoin = 'round';
  for (const stroke of strokes) {
    const first = stroke.points[0]; if (!first) continue;
    if (!stroke.points.some(point => point.x !== first.x || point.y !== first.y)) {
      context.beginPath(); context.arc(first.x, first.y, 1.5, 0, Math.PI * 2); context.fill(); continue;
    }
    context.beginPath(); context.moveTo(first.x, first.y);
    for (let i = 1; i < stroke.points.length; i++) context.lineTo(stroke.points[i].x, stroke.points[i].y);
    context.stroke();
  }
}

export function renderViewportCanvas(canvas: HTMLCanvasElement, drawing: Drawing, viewport: Viewport) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  const context = canvas.getContext('2d')!;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, width, height);
  context.setTransform(dpr * viewport.zoom, 0, 0, dpr * viewport.zoom, dpr * viewport.x, dpr * viewport.y);
  renderInk(context, drawing.strokes);
  if (drawing.gesture) renderInk(context, [{ id: drawing.gesture.id, points: drawing.gesture.points }]);
  context.setTransform(1, 0, 0, 1, 0, 0);
  const signature = `${drawing.revision}:${drawing.gesture?.points.length ?? 0}:${viewport.x}:${viewport.y}:${viewport.zoom}`;
  canvas.dataset.frameSignature = signature;
  requestAnimationFrame(time => canvas.dispatchEvent(new CustomEvent('interactive:frame', { detail: { time, signature } })));
}

export function renderWholeDrawing(strokes: Stroke[], frame: { x: number; y: number; scale: number; outputWidth: number; outputHeight: number }): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = frame.outputWidth; canvas.height = frame.outputHeight;
  const context = canvas.getContext('2d')!;
  context.fillStyle = 'white'; context.fillRect(0, 0, canvas.width, canvas.height);
  context.setTransform(frame.scale, 0, 0, frame.scale, -frame.x * frame.scale, -frame.y * frame.scale);
  renderInk(context, strokes);
  return canvas;
}
