import { expect, it } from 'vitest';
import { begin, commit, createDrawing, move, type Drawing } from '../../src/lib/drawing/state';
import { undo, redo } from '../../src/lib/drawing/history';
const stroke = (state: Drawing, id: string) => commit(move(begin(state, 'draw', id, { x: 1, y: 2 }), { x: 3, y: 4 }));

it('uses one stroke per Undo step, clears Redo on new ink, and keeps old visible ink', () => {
  let drawing = createDrawing();
  for (let i = 0; i < 51; i++) drawing = stroke(drawing, String(i));
  for (let i = 0; i < 51; i++) drawing = undo(drawing);
  expect(drawing.strokes.map(item => item.id)).toEqual(['0']);
  expect(drawing.redo).toHaveLength(50);
  drawing = redo(drawing);
  expect(drawing.strokes.at(-1)?.id).toBe('1');
  expect(stroke(drawing, 'new').redo).toHaveLength(0);
});

it('rejects a 1001st retained stroke with a distinct drawing-limit notice', () => {
  const full = { ...createDrawing(), strokes: Array.from({ length: 1000 }, (_, i) => ({ id: String(i), points: [{ x: i, y: i }] })) };
  const rejected = stroke(full, 'overflow');
  expect(rejected.strokes).toEqual(full.strokes);
  expect(rejected.notice).toMatch(/drawing limit/i);
  expect(rejected.revision).toBe(full.revision);
});

it('rejects an overlong stroke without losing earlier ink', () => {
  let drawing = begin(stroke(createDrawing(), 'saved'), 'draw', 'too-long', { x: 0, y: 0 });
  for (let i = 0; i < 2000; i++) drawing = move(drawing, { x: i, y: i });
  const result = commit(drawing);
  expect(result.strokes.map(item => item.id)).toEqual(['saved']);
  expect(result.notice).toMatch(/shorter/i);
});
