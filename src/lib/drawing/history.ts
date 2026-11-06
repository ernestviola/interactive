import type { Drawing } from './state';
export const undo = (state: Drawing): Drawing => {
  const last = state.strokes.at(-1);
  return !last || state.gesture ? state : { ...state, notice: '', revision: state.revision + 1, strokes: state.strokes.slice(0, -1), redo: [...state.redo, last] };
};
export const redo = (state: Drawing): Drawing => {
  const last = state.redo.at(-1);
  return !last || state.gesture ? state : { ...state, notice: '', revision: state.revision + 1, strokes: [...state.strokes, last], redo: state.redo.slice(0, -1) };
};
export const discardRedo = (state: Drawing): Drawing => state.gesture ? state : { ...state, redo: [], notice: 'Redo history discarded. Your visible drawing is unchanged.' };
