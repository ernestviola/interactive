'use client';
import { useRef, useState, type PointerEvent } from 'react';
import Image from 'next/image';
import type { Drawing } from '../lib/drawing/state';

function ToolButton({ name, icon, selected, disabled, onActivate }: {
  name: string; icon: string; selected?: boolean; disabled?: boolean; onActivate(): void;
}) {
  const [showLabel, setShowLabel] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);
  const suppress = useRef(false);
  const start = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'touch') return;
    held.current = false;
    timer.current = setTimeout(() => { held.current = true; setShowLabel(true); }, 500);
  };
  const end = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'touch') return;
    if (timer.current) clearTimeout(timer.current);
    if (held.current) {
      suppress.current = true;
      setTimeout(() => setShowLabel(false), 900);
    }
  };
  return <button type="button" className={`tool-button${selected ? ' selected' : ''}${showLabel ? ' show-label' : ''}`}
    aria-label={name} aria-pressed={selected === undefined ? undefined : selected} disabled={disabled}
    onPointerDown={start} onPointerUp={end} onPointerCancel={end}
    onClick={event => { if (suppress.current) { suppress.current = false; event.preventDefault(); return; } onActivate(); if (event.detail > 0) event.currentTarget.blur(); }}>
    <Image src={icon} alt="" width={24} height={24} unoptimized />
    <span className="tool-label" aria-hidden="true">{name}</span>
  </button>;
}

export function DrawingToolbar({ drawing, mode, onMode, onUndo, onRedo }: {
  drawing: Drawing; mode: 'draw' | 'hand'; onMode(mode: 'draw' | 'hand'): void; onUndo(): void; onRedo(): void;
}) {
  return <div className="drawing-toolbar" role="toolbar" aria-label="Drawing controls">
    <ToolButton name="Draw" icon="/figma/icon-draw.svg" selected={mode === 'draw'} onActivate={() => onMode('draw')} />
    <ToolButton name="Hand" icon="/figma/icon-pan.svg" selected={mode === 'hand'} onActivate={() => onMode('hand')} />
    <ToolButton name="Undo" icon="/figma/icon-undo.svg" disabled={drawing.strokes.length <= drawing.undoFloor} onActivate={onUndo} />
    <ToolButton name="Redo" icon="/figma/icon-redo.svg" disabled={!drawing.redo.length} onActivate={onRedo} />
  </div>;
}
