import { expect, it } from 'vitest';
import { begin, commit, createDrawing } from '../../src/lib/drawing/state';
import { applyDocumentAction, recoverCheckpoint, saveCheckpoint } from '../../src/lib/session-document';

it('recovers a valid checkpoint only on a confirmed reload or with a live sibling', () => {
  const drawing = commit(begin(createDrawing(), 'draw', 'ink', { x: -100, y: 200 }));
  const checkpoint = JSON.stringify({ version: 1, sessionId: 'shared', drawing });
  expect(recoverCheckpoint(checkpoint, 'reload', false)?.drawing.strokes).toHaveLength(1);
  expect(recoverCheckpoint(checkpoint, 'navigate', true)?.drawing.strokes).toHaveLength(1);
  expect(recoverCheckpoint(checkpoint, 'navigate', false)).toBeNull();
  expect(recoverCheckpoint('{bad', 'reload', true)).toBeNull();
  expect(recoverCheckpoint(JSON.stringify({ version: 1, sessionId: 'shared', drawing: { ...drawing,
    strokes: [{ id: 'bad', points: [{ x: 'not-a-number', y: 0 }] }] } }), 'reload', false)).toBeNull();
  expect(recoverCheckpoint(JSON.stringify({ version: 1, sessionId: 'shared', drawing: { ...drawing,
    strokes: [drawing.strokes[0], drawing.strokes[0]] } }), 'reload', false)).toBeNull();
});

it('orders unique actions, preserves earlier ink when storage rejects a new stroke', () => {
  const previous = createDrawing();
  const action = { id: 'action-1', type: 'stroke' as const, stroke: { id: 'stroke-1', points: [{ x: 1, y: 2 }] } };
  const next = applyDocumentAction(previous, action);
  expect(next.strokes).toHaveLength(1);
  expect(applyDocumentAction(next, action)).toBe(next);
  const storage = { setItem: () => { throw new Error('QuotaExceededError'); } };
  const result = saveCheckpoint(storage, 'shared', next, previous);
  expect(result.strokes).toEqual(previous.strokes);
  expect(result.notice).toMatch(/not saved/i);
});
