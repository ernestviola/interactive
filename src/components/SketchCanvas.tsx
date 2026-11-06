'use client';
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import { begin, cancel, move, createDrawing, type Drawing } from '../lib/drawing/state';
import { renderViewportCanvas } from '../lib/drawing/render';
import { newId } from '../lib/drawing/capture';
import { createViewport, fitToDrawing, pan, screenToWorld, zoomAt, type Viewport } from '../lib/drawing/viewport';
import { createGestureState, changeNavigation, pointerDown, pointerMove, pointerUp, pointerCancel, type GestureState } from '../lib/drawing/gestures';
import { SessionDocument } from '../lib/session-document';
import { SessionClient } from '../lib/session-client';
import { DrawingToolbar } from './DrawingToolbar';

export function SketchCanvas() {
  const [drawing, setDrawing] = useState<Drawing>(createDrawing);
  const [ready, setReady] = useState(false);
  const current = useRef(drawing);
  const [viewport, setViewport] = useState<Viewport>(createViewport);
  const viewRef = useRef(viewport);
  const [mode, setMode] = useState<'draw' | 'hand'>('draw');
  const [spaceHeld, setSpaceHeld] = useState(false);
  const gesture = useRef<GestureState>(createGestureState('draw'));
  const canvas = useRef<HTMLCanvasElement>(null);
  const document = useRef<SessionDocument | null>(null);
  const client = useRef<SessionClient | null>(null);
  const setCurrent = (next: Drawing) => { current.current = next; setDrawing(next); };
  const setView = (next: Viewport) => { viewRef.current = next; setViewport(next); };
  useLayoutEffect(() => {
    const element = canvas.current;
    if (!element) return;
    renderViewportCanvas(element, drawing, viewport);
    const observer = new ResizeObserver(() => renderViewportCanvas(element, current.current, viewRef.current));
    observer.observe(element);
    return () => observer.disconnect();
  }, [drawing, viewport]);
  useEffect(() => {
    const shared = new SessionDocument(next => setCurrent({ ...next, gesture: current.current.gesture }));
    document.current = shared;
    void shared.start().then(() => {
      if (document.current !== shared) return;
      setReady(true);
      const session = new SessionClient(() => shared.captureDrawing(current.current), () => {},
        shared.sessionId, shared.tabId, () => shared.isCoordinator);
      client.current = session;
      void session.start();
    });
    const keydown = (event: KeyboardEvent) => {
      const target = event.target;
      const editing = target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select'));
      if (event.code === 'Space' && !editing) {
        event.preventDefault();
        const next = changeNavigation(gesture.current, gesture.current.mode, true);
        gesture.current = next;
        if (next.cancelInk) { setCurrent(cancel(current.current)); shared.endGesture(); }
        setSpaceHeld(true);
      }
    };
    const keyup = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        const target = event.target;
        if (!(target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select')))) event.preventDefault();
        gesture.current = { ...gesture.current, space: false }; setSpaceHeld(false);
      }
    };
    const blur = () => { gesture.current = { ...gesture.current, space: false }; setSpaceHeld(false); };
    const pagehide = () => { shared.close(); sessionClose(); };
    const sessionClose = () => client.current?.close();
    window.addEventListener('keydown', keydown, true);
    window.addEventListener('keyup', keyup, true);
    window.addEventListener('blur', blur);
    window.addEventListener('pagehide', pagehide);
    return () => {
      shared.close(); sessionClose(); document.current = null; client.current = null;
      window.removeEventListener('keydown', keydown, true); window.removeEventListener('keyup', keyup, true); window.removeEventListener('blur', blur); window.removeEventListener('pagehide', pagehide);
    };
  }, []);
  const local = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const down = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!ready) return;
    if (event.pointerType !== 'touch' && event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const previous = gesture.current;
    const next = pointerDown(previous, event.pointerId, event.pointerType, local(event));
    gesture.current = next;
    if (next.cancelInk) { setCurrent(cancel(current.current)); document.current?.endGesture(); }
    else if (previous.kind === 'idle' && next.kind === 'ink') {
      document.current?.beginGesture();
      setCurrent(begin(current.current, 'draw', newId(), screenToWorld(viewRef.current, local(event))));
    }
  };
  const moving = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!gesture.current.pointers[event.pointerId]) return;
    event.preventDefault();
    const next = pointerMove(gesture.current, event.pointerId, local(event));
    gesture.current = next;
    if (next.kind === 'ink') setCurrent(move(current.current, screenToWorld(viewRef.current, local(event))));
    if (next.navigation) {
      const moved = pan(viewRef.current, next.navigation.dx, next.navigation.dy);
      setView(next.navigation.scale === 1 ? moved : zoomAt(moved, next.navigation.scale, next.navigation.anchor));
    }
  };
  const up = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!gesture.current.pointers[event.pointerId]) return;
    const wasInk = gesture.current.kind === 'ink';
    if (wasInk) setCurrent(move(current.current, screenToWorld(viewRef.current, local(event))));
    const next = pointerUp(gesture.current, event.pointerId);
    gesture.current = next;
    if (next.commitInk && current.current.gesture) {
      const pending = current.current.gesture;
      setCurrent(cancel(current.current));
      if (pending.rejected) document.current?.endGesture();
      else {
        const stroke = { id: pending.id, points: pending.points };
        void document.current?.submit({ id: newId(), type: 'stroke', stroke }).then(nextDrawing => {
          setCurrent(nextDrawing); document.current?.endGesture();
        });
      }
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const cancelled = (event: PointerEvent<HTMLCanvasElement>) => {
    gesture.current = pointerCancel(gesture.current, event.pointerId);
    if (gesture.current.cancelInk) { setCurrent(cancel(current.current)); document.current?.endGesture(); }
  };
  const wheel = (event: WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    setView(zoomAt(viewRef.current, Math.exp(-event.deltaY * 0.001), { x: event.clientX - rect.left, y: event.clientY - rect.top }));
  };
  return <main className="canvas-app">
    <span className="canvas-wordmark">interactive</span>
    <div className={`open-canvas ${mode}${spaceHeld ? ' space-pan' : ''}`}><canvas ref={canvas} aria-label="Sketch canvas" aria-busy={!ready} data-ready={ready} data-revision={drawing.revision} data-strokes={drawing.strokes.length}
      data-gesture={drawing.gesture?.points.length ?? 0}
      onPointerDown={down} onPointerMove={moving} onPointerUp={up} onPointerCancel={cancelled} onLostPointerCapture={cancelled} onWheel={wheel} /></div>
    <button type="button" className="zoom-chip" aria-label={`Fit drawing; zoom ${Math.round(viewport.zoom * 100)} percent`}
      onClick={event => { const element = canvas.current; if (element) setView(fitToDrawing(drawing.strokes, element.getBoundingClientRect())); if (event.detail > 0) event.currentTarget.blur(); }}>
      {Math.round(viewport.zoom * 100)}% · Fit
    </button>
    <DrawingToolbar drawing={drawing} mode={spaceHeld ? 'hand' : mode} onMode={next => {
      setMode(next);
      const updated = changeNavigation(gesture.current, next, gesture.current.space);
      gesture.current = updated;
      if (updated.cancelInk) { setCurrent(cancel(current.current)); document.current?.endGesture(); }
    }}
      onUndo={() => void document.current?.submit({ id: newId(), type: 'undo' })}
      onRedo={() => void document.current?.submit({ id: newId(), type: 'redo' })} />
    {drawing.notice && <p className="canvas-alert" role="alert">{drawing.notice}</p>}
  </main>;
}
