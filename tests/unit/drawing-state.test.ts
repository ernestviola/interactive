import { expect, it } from 'vitest';
import { begin, cancel, commit, createDrawing, move } from '../../src/lib/drawing/state';

it('commits finite world-coordinate strokes without a page boundary', () => {
  const empty = createDrawing();
  const active = move(begin(empty, 'draw', 'far', { x: -20_000, y: 30_000 }), { x: 50_000, y: -40_000 });
  const saved = commit(active);
  expect(saved.strokes[0].points).toEqual([{ x: -20_000, y: 30_000 }, { x: 50_000, y: -40_000 }]);
  expect(saved.revision).toBe(1);
  expect(empty.strokes).toHaveLength(0);
  expect(() => begin(empty, 'draw', 'bad', { x: NaN, y: 0 })).toThrow();
  expect(() => move(active, { x: 0, y: Infinity })).toThrow();
});

it('cancels provisional ink without changing committed ink or history', () => {
  const saved = commit(begin(createDrawing(), 'draw', 'saved', { x: 1, y: 2 }));
  const cancelled = cancel(move(begin(saved, 'draw', 'partial', { x: 3, y: 4 }), { x: 5, y: 6 }));
  expect(cancelled.gesture).toBeNull();
  expect(cancelled.strokes).toEqual(saved.strokes);
  expect(cancelled.revision).toBe(saved.revision);
});
