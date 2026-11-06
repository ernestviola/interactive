import { expect, it } from 'vitest';
import { frameWholeDrawing } from '../../src/lib/drawing/capture';

it('frames every stroke with padding and preserves relative geometry', () => {
  const frame = frameWholeDrawing([
    { id: 'a', points: [{ x: -500, y: 100 }, { x: -450, y: 110 }] },
    { id: 'b', points: [{ x: 800, y: 900 }] },
  ]);
  expect(frame.x).toBeLessThan(-500);
  expect(frame.y).toBeLessThan(100);
  expect(frame.x + frame.width).toBeGreaterThan(800);
  expect(frame.y + frame.height).toBeGreaterThan(900);
  expect(frame.outputWidth).toBeLessThanOrEqual(1024);
  expect(frame.outputHeight).toBeLessThanOrEqual(768);
  expect(frame.scale * 3).toBeGreaterThanOrEqual(1.5);
});

it('rejects empty and excessively spread drawings rather than returning partial or tiny ink', () => {
  expect(() => frameWholeDrawing([])).toThrowError(/NO_DRAWING/);
  expect(() => frameWholeDrawing([{ id: 'a', points: [{ x: 0, y: 0 }, { x: 100_000, y: 0 }] }])).toThrowError(/CAPTURE_UNREADABLE/);
});
