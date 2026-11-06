import type { Point, Rect, Stroke } from '../contracts/sketch';
import { WIDTH, HEIGHT } from '../contracts/sketch';
export type Gesture = { mode: 'draw' | 'select'; id: string; points: Point[]; rejected?: string };
export type Drawing = { strokes: Stroke[]; redo: Stroke[]; selection: Rect | null; revision: number; selectionRevision: number; gesture: Gesture | null; notice: string };
export const createDrawing = (): Drawing => ({ strokes: [], redo: [], selection: null, revision: 0, selectionRevision: 0, gesture: null, notice: '' });
const point = (p: Point): Point => {
  if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) throw new Error('Drawing coordinates must be finite.');
  return { x: Math.max(0, Math.min(WIDTH, p.x)), y: Math.max(0, Math.min(HEIGHT, p.y)) };
};
export const begin = (state: Drawing, mode: Gesture['mode'], id: string, p: Point): Drawing =>
  ({ ...state, notice: '', gesture: { mode, id, points: [point(p)] } });
export const move = (state: Drawing, p: Point): Drawing => {
  const next = point(p);
  const gesture = state.gesture;
  if (!gesture || gesture.rejected) return state;
  if (gesture.mode === 'draw' && gesture.points.length >= 2000) return { ...state, notice: 'This stroke was not saved. Draw a shorter stroke (up to 2,000 points).', gesture: { ...gesture, points: [], rejected: 'shorter' } };
  return { ...state, gesture: { ...gesture, points: gesture.mode === 'select' ? [gesture.points[0], next] : [...gesture.points, next] } };
};
export const commit = (state: Drawing): Drawing => {
  const gesture = state.gesture;
  if (!gesture) return state;
  if (gesture.rejected) return { ...state, gesture: null };
  if (gesture.mode === 'draw') {
    const stored = [...new Map([...state.strokes, ...state.redo].map(stroke => [stroke.id, stroke])).values()];
    const points = stored.reduce((count, stroke) => count + stroke.points.length, 0);
    if (stored.length >= 1000 || points + gesture.points.length > 1_000_000) return { ...state, gesture: null, notice: 'This stroke was not saved: drawing limit reached. Discard redo history to free undone ink, or start a new session.' };
    return {
    ...state, gesture: null, redo: [], notice: '', revision: state.revision + 1,
    strokes: [...state.strokes, { id: gesture.id, points: gesture.points.map(p => ({ ...p })) }],
    };
  }
  const start = gesture.points[0]; const end = gesture.points.at(-1)!;
  const width = Math.abs(start.x - end.x); const height = Math.abs(start.y - end.y);
  if (!width || !height) return { ...state, gesture: null };
  return { ...state, gesture: null, selectionRevision: state.selectionRevision + 1,
    selection: { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), width, height } };
};
export const cancel = (state: Drawing): Drawing => state.gesture ? { ...state, gesture: null } : state;
export const clearSelection = (state: Drawing): Drawing => !state.selection || state.gesture ? state :
  { ...state, selection: null, selectionRevision: state.selectionRevision + 1 };
