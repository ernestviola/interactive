'use client';
import { clearSelection, type Drawing } from '../lib/drawing/state';
import { undo, redo, discardRedo } from '../lib/drawing/history';
export function DrawingToolbar({ drawing, mode, onMode, onChange }: { drawing: Drawing; mode: 'draw' | 'select'; onMode(mode: 'draw' | 'select'): void; onChange(state: Drawing): void }) {
  const active = !!drawing.gesture;
  return <div className="drawing-toolbar" aria-label="Drawing controls">
    <div className="mode-switch" aria-label="Canvas tools"><button aria-pressed={mode === 'draw'} disabled={active} onClick={() => onMode('draw')}>Draw</button><button aria-pressed={mode === 'select'} disabled={active} onClick={() => onMode('select')}>Select</button></div>
    <div className="history-controls"><button disabled={active || !drawing.selection} onClick={() => onChange(clearSelection(drawing))}>Clear selection</button><button disabled={active || !drawing.strokes.length} onClick={() => onChange(undo(drawing))}>Undo</button><button disabled={active || !drawing.redo.length} onClick={() => onChange(redo(drawing))}>Redo</button><button className="discard-history" disabled={active || !drawing.redo.length} onClick={() => { if (window.confirm('Discard redo history? Those undone strokes cannot be restored. Your visible drawing stays unchanged.')) onChange(discardRedo(drawing)); }}>Discard redo history</button></div>
  </div>;
}
