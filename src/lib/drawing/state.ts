import type { Point, Stroke } from '../contracts/sketch';
export type Gesture = { mode: 'draw'; id: string; points: Point[]; rejected?: string };
export type Drawing = { strokes: Stroke[]; redo: Stroke[]; undoFloor: number; revision: number; gesture: Gesture | null; notice: string };
export const createDrawing = (): Drawing => ({ strokes: [], redo: [], undoFloor: 0, revision: 0, gesture: null, notice: '' });
const point = (p: Point): Point => {
  if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) throw new Error('Drawing coordinates must be finite.');
  return { x: p.x, y: p.y };
};
export const begin = (state: Drawing, mode: Gesture['mode'], id: string, p: Point): Drawing =>
  ({ ...state, notice: '', gesture: { mode, id, points: [point(p)] } });
export const move = (state: Drawing, p: Point): Drawing => {
  const next = point(p);
  const gesture = state.gesture;
  if (!gesture || gesture.rejected) return state;
  if (gesture.points.length >= 2000) return { ...state, notice: 'This stroke was not saved. Draw a shorter stroke (up to 2,000 points).', gesture: { ...gesture, points: [], rejected: 'shorter' } };
  return { ...state, gesture: { ...gesture, points: [...gesture.points, next] } };
};
export const commit = (state: Drawing): Drawing => {
  const gesture = state.gesture;
  if (!gesture) return state;
  if (gesture.rejected) return { ...state, gesture: null };
  const stored = [...new Map([...state.strokes, ...state.redo].map(stroke => [stroke.id, stroke])).values()];
  const points = stored.reduce((count, stroke) => count + stroke.points.length, 0);
  if (stored.length >= 1000 || points + gesture.points.length > 1_000_000) return { ...state, gesture: null, notice: 'This stroke was not saved: drawing limit reached. Start a new session to keep drawing.' };
  return {
    ...state, gesture: null, redo: [], notice: '', revision: state.revision + 1, undoFloor: Math.max(state.undoFloor, state.strokes.length + 1 - 50),
    strokes: [...state.strokes, { id: gesture.id, points: gesture.points.map(p => ({ ...p })) }],
  };
};
export const cancel = (state: Drawing): Drawing => state.gesture ? { ...state, gesture: null } : state;
