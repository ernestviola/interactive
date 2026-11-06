import { test, expect } from './fixture';
import { ready } from './helpers';

test('simulated second finger cancels provisional ink and does not add Undo history', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas[aria-label="Sketch canvas"]') as HTMLCanvasElement;
    canvas.setPointerCapture = () => {};
    canvas.releasePointerCapture = () => {};
    canvas.hasPointerCapture = () => false;
    const send = (type: string, id: number, x: number, y: number) => canvas.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, pointerId: id, pointerType: 'touch', clientX: x, clientY: y, button: 0,
    }));
    send('pointerdown', 1, 100, 100); send('pointermove', 1, 130, 130);
    send('pointerdown', 2, 180, 180); send('pointermove', 1, 200, 200);
    send('pointerup', 1, 200, 200); send('pointerup', 2, 180, 180);
  });
  await expect(page.getByLabel('Sketch canvas')).toHaveAttribute('data-strokes', '0');
  await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled();
});
