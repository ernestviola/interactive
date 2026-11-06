import type { Point } from '../contracts/sketch';

type Pointer = { type: string; point: Point };
export type GestureState = {
  mode: 'draw' | 'hand'; space: boolean; kind: 'idle' | 'ink' | 'navigate';
  pointers: Record<number, Pointer>; cancelInk: boolean; commitInk: boolean;
  navigation?: { dx: number; dy: number; scale: number; anchor: Point };
};
export const createGestureState = (mode: 'draw' | 'hand', space = false): GestureState =>
  ({ mode, space, kind: 'idle', pointers: {}, cancelInk: false, commitInk: false });
export function changeNavigation(state: GestureState, mode: 'draw' | 'hand', space: boolean): GestureState {
  const cancelInk = state.kind === 'ink' && (mode === 'hand' || space);
  return { ...state, mode, space, kind: cancelInk ? 'navigate' : state.kind,
    cancelInk, commitInk: false, navigation: undefined };
}
const points = (pointers: Record<number, Pointer>) => Object.values(pointers).map(pointer => pointer.point);
const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export function pointerDown(state: GestureState, id: number, type: string, point: Point): GestureState {
  const pointers = { ...state.pointers, [id]: { type, point } };
  const twoTouches = type === 'touch' && points(pointers).length >= 2;
  const kind = twoTouches || state.mode === 'hand' || state.space ? 'navigate' : state.kind === 'idle' ? 'ink' : state.kind;
  return { ...state, pointers, kind, cancelInk: state.kind === 'ink' && kind === 'navigate', commitInk: false, navigation: undefined };
}
export function pointerMove(state: GestureState, id: number, point: Point): GestureState {
  const previous = state.pointers[id];
  if (!previous) return state;
  const before = points(state.pointers);
  const pointers = { ...state.pointers, [id]: { ...previous, point } };
  const after = points(pointers);
  let navigation: GestureState['navigation'];
  if (state.kind === 'navigate') {
    const oldMid = before.length > 1 ? midpoint(before[0], before[1]) : before[0];
    const newMid = after.length > 1 ? midpoint(after[0], after[1]) : after[0];
    const oldDistance = before.length > 1 ? distance(before[0], before[1]) : 0;
    const newDistance = after.length > 1 ? distance(after[0], after[1]) : 0;
    navigation = { dx: newMid.x - oldMid.x, dy: newMid.y - oldMid.y,
      scale: oldDistance > 0 && newDistance > 0 ? newDistance / oldDistance : 1, anchor: newMid };
  }
  return { ...state, pointers, navigation, cancelInk: false, commitInk: false };
}
export function pointerUp(state: GestureState, id: number): GestureState {
  if (!state.pointers[id]) return state;
  const pointers = { ...state.pointers }; delete pointers[id];
  return { ...state, pointers, kind: Object.keys(pointers).length ? state.kind : 'idle',
    commitInk: state.kind === 'ink', cancelInk: false, navigation: undefined };
}
export function pointerCancel(state: GestureState, id: number): GestureState {
  const next = pointerUp(state, id);
  return { ...next, commitInk: false, cancelInk: state.kind === 'ink' };
}
