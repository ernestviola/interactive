'use client';
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { begin, cancel, commit, createDrawing, move, type Drawing } from '../lib/drawing/state';
import { renderCanvas } from '../lib/drawing/render';
import { newId } from '../lib/drawing/capture';
import { SessionClient, type Connection } from '../lib/session-client';
import { SelectionPreview } from './SelectionPreview';
import { ConnectionControls } from './ConnectionControls';
import { DrawingToolbar } from './DrawingToolbar';
import { SharingStatus } from './SharingStatus';
export function SketchCanvas() {
  const [started, setStarted] = useState(false); const [mode, setMode] = useState<'draw' | 'select'>('draw');
  const [view, setView] = useState(createDrawing); const drawing = useRef(view); const canvas = useRef<HTMLCanvasElement>(null);
  const client = useRef<SessionClient | null>(null);
  const [connection, setConnection] = useState<Connection>({ state: 'connecting', message: 'Start a private drawing session.' });
  const pointer = useRef<number | null>(null);
  function update(next: Drawing) { drawing.current = next; setView(next); }
  useLayoutEffect(() => { if (canvas.current) renderCanvas(canvas.current, view); }, [view, started]);
  useEffect(() => {
    if (!started) return;
    const session = new SessionClient(() => drawing.current, status => setConnection(previous => ({ ...previous, ...status })));
    client.current = session; void session.start();
    const warn = (event: BeforeUnloadEvent) => { if (drawing.current.strokes.length) { event.preventDefault(); event.returnValue = ''; } };
    const close = () => session.close();
    window.addEventListener('beforeunload', warn); window.addEventListener('pagehide', close);
    return () => { session.close(); client.current = null; window.removeEventListener('beforeunload', warn); window.removeEventListener('pagehide', close); };
  }, [started]);
  function position(event: PointerEvent<HTMLCanvasElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - bounds.left) * 1024 / bounds.width, y: (event.clientY - bounds.top) * 768 / bounds.height };
  }
  function down(event: PointerEvent<HTMLCanvasElement>) {
    if (pointer.current !== null || !event.isPrimary || event.button !== 0) return;
    event.preventDefault(); pointer.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId);
    update(begin(drawing.current, mode, newId(), position(event)));
  }
  function moving(event: PointerEvent<HTMLCanvasElement>) {
    if (pointer.current !== event.pointerId) return;
    event.preventDefault(); update(move(drawing.current, position(event)));
  }
  function up(event: PointerEvent<HTMLCanvasElement>) {
    if (pointer.current !== event.pointerId) return;
    update(commit(move(drawing.current, position(event)))); pointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function cancelled(event: PointerEvent<HTMLCanvasElement>) { if (pointer.current === event.pointerId) { pointer.current = null; update(cancel(drawing.current)); } }
  function end() {
    if (!window.confirm('End this session? Your drawing will be lost and the AI connection will be revoked.')) return;
    client.current?.close(); update(createDrawing()); setStarted(false);
  }
  return <main className="app-shell"><header className="app-header"><div className="wordmark" aria-label="Sketch"><span className="brand-mark">s</span>sketch<span className="wordmark-dot">.</span></div><span className="header-note">A place to think out loud</span><span className="session-badge">LOCAL · SESSION ONLY</span></header>
    {!started ? <section className="welcome"><span className="eyebrow">FROM A ROUGH IDEA TO A BETTER QUESTION</span><h1>Give your thoughts<br />a little room.</h1><p>Draw freely. Select a part. Talk it through with AI.</p><div className="session-notice"><strong>Just for this session.</strong><p>Your sketch stays in this browser tab. Reloading or closing it loses the drawing. Only the region you select can be shared; AI never edits your canvas.</p></div><button className="primary" onClick={() => setStarted(true)}>Start drawing</button><span className="welcome-caption">No account. No saved sketches. Yours to shape.</span></section> : <div className="workspace"><section className="drawing-section"><div className="section-label">01 / The canvas<span>{view.strokes.length} {view.strokes.length === 1 ? 'stroke' : 'strokes'}</span></div><div className="canvas-title"><div><h1>Think with your hands.</h1><p className="muted">{mode === 'draw' ? 'A rough sketch is enough. Use your mouse or finger.' : 'Drag a rectangle around what you want to discuss.'}</p></div><DrawingToolbar drawing={view} mode={mode} onMode={setMode} onChange={update} /></div><div className={`canvas-frame ${mode}`}><canvas ref={canvas} aria-label="Sketch canvas" onPointerDown={down} onPointerMove={moving} onPointerUp={up} onPointerCancel={cancelled} onLostPointerCapture={cancelled} /></div>{view.notice && <p className="drawing-notice" role="alert">{view.notice}</p>}<div className="canvas-footer"><span><i className="pen-dot" /> Dark ink · white canvas</span><span>Drawn by you. Discussed together.</span></div></section><aside><SelectionPreview drawing={view} /><SharingStatus drawing={view} connection={connection} /><ConnectionControls connection={connection} pair={() => client.current?.pair() ?? Promise.reject(new Error('Start a session'))} end={end} /></aside></div>}
    <footer className="app-footer"><span>Make room for the next thought.</span><span>FREEHAND, HUMAN FIRST</span></footer>
  </main>;
}
