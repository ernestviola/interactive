import { test, expect } from './fixture';
import { ready, drag } from './helpers';
test('draw/select/history work through pointer input, orientation, and cancellation while controls remain reachable', async ({ page }, info) => {
  await ready(page); await drag(page, [50, 50], [150, 150]);
  await expect(page.getByText('1 stroke', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByText('0 strokes', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(page.getByText('1 stroke', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Discard redo history', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Redo', exact: true })).toBeDisabled();
  await drag(page, [80, 100], [300, 250]);
  if (info.project.name === 'webkit') {
    const canvas = page.getByLabel('Sketch canvas'); const box = (await canvas.boundingBox())!;
    const before = await canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL());
    await page.touchscreen.tap(box.x + 35, box.y + 40);
    await expect(page.getByText('2 strokes', { exact: true })).toBeVisible();
    const after = await canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL()); expect(before !== after).toBe(true);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
  }
  await page.getByLabel('Sketch canvas').evaluate(element => element.addEventListener('pointerdown', event => Object.assign(window, { cancelledPointerId: (event as PointerEvent).pointerId }), { once: true }));
  const bounds = (await page.getByLabel('Sketch canvas').boundingBox())!;
  await page.mouse.move(bounds.x + 30, bounds.y + 30); await page.mouse.down();
  await page.getByLabel('Sketch canvas').evaluate(element => element.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: (window as unknown as { cancelledPointerId: number }).cancelledPointerId })));
  await page.mouse.up(); await expect(page.getByText('1 stroke', { exact: true })).toBeVisible();
  await drag(page, [50, 50], [350, 300], 'Select');
  const size = page.viewportSize()!; await page.setViewportSize({ width: size.height, height: size.width });
  await expect(page.getByLabel('Selected region preview')).toBeVisible();
  await expect(page.getByText('1 stroke', { exact: true })).toBeVisible();
  const touchAction = await page.getByLabel('Sketch canvas').evaluate(element => getComputedStyle(element).touchAction);
  expect(touchAction).toBe('none');
  expect(await page.getByRole('button', { name: 'Connect', exact: true }).evaluate(element => getComputedStyle(element).touchAction)).not.toBe('none');
});

test('an overlong pointer gesture is visibly rejected as a whole and a shorter stroke recovers', async ({ page }) => {
  await ready(page); await drag(page, [20, 20], [80, 80]);
  await page.getByLabel('Sketch canvas').evaluate(element => element.addEventListener('pointerdown', event => Object.assign(window, { testPointerId: (event as PointerEvent).pointerId }), { once: true }));
  const bounds = (await page.getByLabel('Sketch canvas').boundingBox())!;
  await page.mouse.move(bounds.x + 20, bounds.y + 20); await page.mouse.down();
  await page.getByLabel('Sketch canvas').evaluate(element => {
    const rect = element.getBoundingClientRect(); const id = (window as unknown as { testPointerId: number }).testPointerId;
    for (let i = 0; i < 2001; i++) element.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: id, clientX: rect.x + 30 + i % 10, clientY: rect.y + 30 }));
  });
  await page.mouse.up();
  await expect(page.getByText(/This stroke was not saved.*shorter/)).toBeVisible();
  await expect(page.getByText('1 stroke', { exact: true })).toBeVisible();
  await drag(page, [30, 100], [100, 100]); await expect(page.getByText('2 strokes', { exact: true })).toBeVisible();
});
