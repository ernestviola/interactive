import { test, expect } from './fixture';

test('opens directly to a canvas, draws outside the initial view, and restores on reload', async ({ page }) => {
  await page.goto('/');
  const canvas = page.getByLabel('Sketch canvas');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas missing');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 40);
  await page.mouse.up();
  await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Start drawing' })).toHaveCount(0);
});

test('storage quota rejection preserves earlier ink and identifies the unsaved stroke', async ({ page }) => {
  await page.goto('/');
  const canvas = page.getByLabel('Sketch canvas');
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  const box = await canvas.boundingBox(); if (!box) throw new Error('Canvas missing');
  const stroke = async (x: number) => {
    await page.mouse.move(box.x + x, box.y + 120); await page.mouse.down();
    await page.mouse.move(box.x + x + 30, box.y + 150); await page.mouse.up();
  };
  await stroke(100);
  await expect(canvas).toHaveAttribute('data-strokes', '1');
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Storage full', 'QuotaExceededError'); }; });
  await stroke(220);
  await expect(canvas).toHaveAttribute('data-strokes', '1');
  await expect(page.locator('.canvas-alert')).toContainText('This stroke was not saved');
});

test('an overlong stroke stays rejected and keeps its notice after release', async ({ page }) => {
  await page.goto('/');
  const canvas = page.getByLabel('Sketch canvas');
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas missing');
  await canvas.evaluate(element => element.addEventListener('pointerdown', event => { element.dataset.pointerId = String((event as PointerEvent).pointerId); }, { once: true }));
  await page.mouse.move(box.x + 100, box.y + 100);
  await page.mouse.down();
  await canvas.evaluate(element => {
    const id = Number(element.dataset.pointerId);
    const rect = element.getBoundingClientRect();
    for (let i = 0; i < 2_005; i++) element.dispatchEvent(new PointerEvent('pointermove', {
      bubbles: true, pointerId: id, pointerType: 'mouse', buttons: 1,
      clientX: rect.x + 100 + i / 10, clientY: rect.y + 100 + i / 15,
    }));
  });
  await page.mouse.up();
  await expect(canvas).toHaveAttribute('data-strokes', '0');
  await expect(page.locator('.canvas-alert')).toContainText('shorter stroke');
});
