import { expect, it } from 'vitest';
import { begin, commit, createDrawing, move, type Drawing } from '../../src/lib/drawing/state';
import { undo, redo, discardRedo } from '../../src/lib/drawing/history';
const stroke = (state: Drawing, id: string) => commit(move(begin(state, 'draw', id, { x: 10, y: 20 }), { x: 40, y: 50 }));

it('undo/redo preserve selection and monotonic revisions; accepted new ink clears redo', () => {
  const a = stroke(stroke(createDrawing(), 'a'), 'b');
  const b = undo(a); expect(b.strokes.map(s => s.id)).toEqual(['a']); expect(b.redo.map(s => s.id)).toEqual(['b']);
  expect(b.revision).toBe(a.revision + 1); expect(b.selection).toEqual(a.selection);
  const restored = redo(b); expect(restored.strokes.map(s => s.id)).toEqual(['a', 'b']); expect(restored.revision).toBe(b.revision + 1);
  expect(stroke(b, 'new').redo).toHaveLength(0); expect(a.strokes).toHaveLength(2);
});

it('enforces 1,000 strokes including redo history, 2,000 points per stroke, and 1,000,000 stored points without truncation', () => {
  const base = createDrawing();
  const full = { ...base, strokes: Array.from({ length: 1000 }, (_, i) => ({ id: String(i), points: [{ x: 1, y: 1 }] })) };
  const rejected = stroke(undo(full), 'overflow');
  expect(rejected.strokes).toHaveLength(999); expect(rejected.redo).toHaveLength(1); expect(rejected.notice.length > 0).toBe(true);
  expect(stroke(discardRedo(undo(full)), 'allowed').strokes).toHaveLength(1000);
  let active = begin(base, 'draw', 'too-long', { x: 1, y: 1 });
  for (let i = 0; i < 2000; i++) active = move(active, { x: 2, y: 2 });
  expect(active.gesture?.rejected !== undefined).toBe(true);
  const long = commit(active); expect(long.strokes).toHaveLength(0); expect(long.notice).toMatch(/shorter/i);
  const many = { ...base, strokes: Array.from({ length: 500 }, (_, i) => ({ id: String(i), points: Array.from({ length: 2000 }, () => ({ x: 1, y: 1 })) })) };
  const limited = stroke(many, 'million'); expect(limited.strokes.length === 500 && limited.notice.length > 0).toBe(true);
});

it('rejecting ink preserves redo, selection, and history; discard-redo is explicit and does not change visible ink', () => {
  const previous = undo(stroke(createDrawing(), 'saved'));
  let active = begin(previous, 'draw', 'overflow', { x: 1, y: 1 });
  for (let i = 0; i < 2000; i++) active = move(active, { x: 1, y: 1 });
  const rejected = commit(active);
  expect(rejected.redo).toEqual(previous.redo); expect(rejected.selection).toEqual(previous.selection); expect(rejected.revision).toBe(previous.revision);
  const cleared = discardRedo(previous); expect(cleared.redo).toHaveLength(0); expect(cleared.strokes).toEqual(previous.strokes);
});
