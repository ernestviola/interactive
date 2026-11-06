import { test, expect } from './fixture';
import { canvasWorkload } from '../fixtures/workloads';

test('measures input to first changed canvas frame with 500 strokes across five views', async ({ page }, testInfo) => {
  await page.goto('/');
  const strokes = canvasWorkload();
  await page.evaluate(stored => {
    sessionStorage.setItem('interactive:canvas-checkpoint:v1', JSON.stringify({ version: 1, sessionId: crypto.randomUUID(), appliedIds: [],
      drawing: { strokes: stored, redo: [], undoFloor: 450, revision: 500, gesture: null, notice: '' } }));
  }, strokes);
  await page.reload();
  const canvas = page.getByLabel('Sketch canvas');
  await expect(canvas).toHaveAttribute('data-strokes', '500');
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  const measure = async (kind: 'draw' | 'pan' | 'zoom') => page.evaluate(async action => {
    const element = document.querySelector('canvas[aria-label="Sketch canvas"]') as HTMLCanvasElement;
    element.setPointerCapture = () => {}; element.releasePointerCapture = () => {}; element.hasPointerCapture = () => false;
    const event = (type: string, id: number, x: number, y: number) => element.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, pointerId: id, pointerType: 'mouse', button: 0, clientX: x, clientY: y,
    }));
    const settle = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const sample = async (send: () => void): Promise<number> => {
      await settle();
      const start = performance.now();
      const baseline = element.dataset.frameSignature;
      const frame = new Promise<number>(resolve => {
        const changed = (input: Event) => {
          const detail = (input as CustomEvent<{ time: number; signature: string }>).detail;
          if (detail.signature === baseline) return;
          element.removeEventListener('interactive:frame', changed);
          resolve(Math.max(0, detail.time - start));
        };
        element.addEventListener('interactive:frame', changed);
      });
      send();
      return Promise.race([frame, new Promise<number>((_resolve, reject) => setTimeout(() => reject(new Error('No changed frame')), 2000))]);
    };
    const samples: number[] = [];
    const rect = element.getBoundingClientRect();
    const x = rect.left + Math.min(350, rect.width / 3); const y = rect.top + Math.min(250, rect.height / 3);
    for (let i = 0; i < 20; i++) {
      if (action === 'zoom') {
        samples.push(await sample(() => element.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: i % 2 ? 25 : -25, clientX: x, clientY: y }))));
      } else {
        const id = i + 10;
        event('pointerdown', id, x, y);
        await settle();
        samples.push(await sample(() => event('pointermove', id, x + 8 + i, y + 8 + i)));
        event('pointerup', id, x + 8 + i, y + 8 + i);
        await settle();
      }
    }
    return samples;
  }, kind);
  const draw = await measure('draw');
  await page.getByRole('button', { name: 'Hand' }).click();
  const pan = await measure('pan');
  const zoom = await measure('zoom');
  const summarize = (samples: number[]) => {
    const ordered = [...samples].sort((a, b) => a - b);
    return { count: samples.length, medianMs: ordered[Math.floor(ordered.length / 2)], p95Ms: ordered[Math.ceil(ordered.length * .95) - 1],
      within100Ms: samples.filter(value => value <= 100).length / samples.length * 100 };
  };
  const summary = { browser: testInfo.project.name, workload: '500 strokes x 75 points / five starting views',
    definition: 'input event timestamp to the first requestAnimationFrame after changed canvas rendering',
    draw: summarize(draw), pan: summarize(pan), zoom: summarize(zoom) };
  console.log('canvas timing', JSON.stringify(summary));
  expect(draw).toHaveLength(20); expect(pan).toHaveLength(20); expect(zoom).toHaveLength(20);
});
