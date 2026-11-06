import { expect, it } from 'vitest';
import { createGestureState, pointerDown, pointerMove, pointerUp, pointerCancel } from '../../src/lib/drawing/gestures';

it('cancels provisional single-touch ink when a second finger lands', () => {
  let state = pointerDown(createGestureState('draw'), 1, 'touch', { x: 10, y: 10 });
  state = pointerMove(state, 1, { x: 20, y: 20 });
  expect(state.kind).toBe('ink');
  state = pointerDown(state, 2, 'touch', { x: 30, y: 30 });
  expect(state.kind).toBe('navigate');
  expect(state.cancelInk).toBe(true);
  state = pointerUp(state, 1);
  state = pointerUp(state, 2);
  expect(state.kind).toBe('idle');
  expect(state.commitInk).toBe(false);
});

it('uses hand and Space drag for navigation, and cancellation never commits', () => {
  expect(pointerDown(createGestureState('hand'), 1, 'mouse', { x: 0, y: 0 }).kind).toBe('navigate');
  expect(pointerDown(createGestureState('draw', true), 1, 'mouse', { x: 0, y: 0 }).kind).toBe('navigate');
  const ink = pointerDown(createGestureState('draw'), 1, 'pen', { x: 0, y: 0 });
  expect(pointerCancel(ink, 1).commitInk).toBe(false);
  expect(pointerUp(ink, 1).commitInk).toBe(true);
});
