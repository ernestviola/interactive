'use client';
import { useLayoutEffect, useRef } from 'react';
import { renderSelection, hasInk } from '../lib/drawing/render';
import type { Drawing } from '../lib/drawing/state';
export function SelectionPreview({ drawing }: { drawing: Drawing }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    if (!ref.current || !drawing.selection) return;
    const crop = renderSelection(drawing.strokes, drawing.selection);
    ref.current.width = crop.width; ref.current.height = crop.height;
    ref.current.getContext('2d')!.drawImage(crop, 0, 0);
    ref.current.dataset.hasInk = String(hasInk(crop));
  }, [drawing.strokes, drawing.selection]);
  return <section className="preview-section"><div className="section-label"><span>02 / Shared region</span><span className="small-dot" /></div>
    <h2>Only this leaves the canvas.</h2>
    <div className="preview-frame">{drawing.selection ? <canvas aria-label="Selected region preview" ref={ref} /> : <p>Choose Select, then drag a rectangle around the part you want to discuss.</p>}</div>
    <p className="muted">The AI receives a fresh image of this region only when it asks. Changes after a read do not change the earlier image.</p>
  </section>;
}
