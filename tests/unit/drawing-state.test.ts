import { expect, it } from 'vitest';
import { begin, cancel, commit, createDrawing, move, clearSelection } from '../../src/lib/drawing/state';
import { HEIGHT, WIDTH } from '../../src/lib/contracts/sketch';

it('uses fixed 1024 × 768 logical units and commits ordered, finite points with stable stroke IDs', () => {
  expect([WIDTH, HEIGHT]).toEqual([1024, 768]);
  const empty = createDrawing();
  const active = move(begin(empty, 'draw', 'stroke-a', { x: 3, y: 5 }), { x: 8, y: 10 });
  const result = commit(active);
  expect(result.strokes).toEqual([{ id: 'stroke-a', points: [{ x: 3, y: 5 }, { x: 8, y: 10 }] }]);
  expect(result.revision).toBe(1);
  expect(empty.strokes).toHaveLength(0);
  expect(active.strokes).toHaveLength(0);
  expect(() => begin(empty, 'draw', 'bad', { x: NaN, y: 1 })).toThrow();
  expect(() => move(active, { x: 1, y: Infinity })).toThrow();
});

it('discards a cancelled gesture without changing committed ink, selection, or revisions', () => {
  const original = commit(begin(createDrawing(), 'draw', 'saved', { x: 10, y: 10 }));
  const cancelled = cancel(move(begin(original, 'draw', 'unsaved', { x: 12, y: 12 }), { x: 13, y: 13 }));
  expect(cancelled).toEqual(original);
  expect(cancelled.gesture).toBeNull();
  expect(cancelled.strokes).toHaveLength(1);
});

it('Normalize reverse drags, clamp to drawing bounds, and reject zero area', () => {
  const initial = createDrawing();
  const selected = commit(move(begin(initial, 'select', 'selection', { x: 300, y: 200 }), { x: -50, y: -20 }));
  expect(selected.selection).toEqual({ x: 0, y: 0, width: 300, height: 200 });
  expect(selected.selectionRevision).toBe(1);
  expect(selected.revision).toBe(0);
  const replaced = commit(move(begin(selected, 'select', 'replacement', { x: 900, y: 700 }), { x: 2000, y: 1000 }));
  expect(replaced.selection).toEqual({ x: 900, y: 700, width: 124, height: 68 });
  expect(replaced.selectionRevision).toBe(2);
  expect(commit(begin(replaced, 'select', 'zero', { x: 10, y: 10 })).selection).toEqual(replaced.selection);
});

 it('clears only the selected region, preserving ink/history and advancing selection revision once', () => {
  const ink = commit(begin(createDrawing(), 'draw', 'saved', { x: 10, y: 10 }));
  const selected = commit(move(begin(ink, 'select', 'selection', { x: 5, y: 5 }), { x: 20, y: 20 }));
  const cleared = clearSelection(selected);
  expect(cleared.selection).toBeNull();
  expect(cleared.selectionRevision).toBe(2);
  expect(cleared.strokes).toBe(selected.strokes);
  expect(cleared.redo).toBe(selected.redo);
  expect(cleared.revision).toBe(selected.revision);
  expect(clearSelection(cleared)).toBe(cleared);
  const gesture = begin(selected, 'draw', 'unfinished', { x: 30, y: 30 });
  expect(clearSelection(gesture)).toBe(gesture);
});
