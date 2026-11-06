import { test, expect } from './fixture';
import { ready, drag } from './helpers';

test('four icon controls have names, selection state, keyboard activation, and touch-size targets', async ({ page }) => {
  await ready(page);
  const toolbar = page.getByRole('toolbar', { name: 'Drawing controls' });
  await expect(toolbar.getByRole('button')).toHaveCount(4);
  const names = await toolbar.getByRole('button').allTextContents();
  expect(names).toEqual(['Draw', 'Hand', 'Undo', 'Redo']);
  const draw = toolbar.getByRole('button', { name: 'Draw' });
  const hand = toolbar.getByRole('button', { name: 'Hand' });
  await expect(draw).toHaveAttribute('aria-pressed', 'true');
  await hand.focus(); await page.keyboard.press('Enter');
  await expect(hand).toHaveAttribute('aria-pressed', 'true');
  await expect(draw).toHaveAttribute('aria-pressed', 'false');
  await draw.focus(); await page.keyboard.press('Space');
  await expect(hand).toHaveAttribute('aria-pressed', 'true');
  await expect(draw).toHaveAttribute('aria-pressed', 'false');
  await draw.focus(); await page.keyboard.press('Enter');
  await expect(draw).toHaveAttribute('aria-pressed', 'true');
  await expect(draw).toBeFocused();
  for (const button of await toolbar.getByRole('button').all()) {
    const box = await button.boundingBox(); expect(box?.width).toBeGreaterThanOrEqual(44); expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await drag(page, [100, 100], [160, 160]);
  await expect(toolbar.getByRole('button', { name: 'Undo' })).toBeEnabled();
});

test('touch hold reveals a temporary label without changing the selected tool', async ({ page }) => {
  await ready(page);
  const hand = page.getByRole('button', { name: 'Hand' });
  await hand.evaluate(element => element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', pointerId: 31 })));
  await expect(hand.locator('.tool-label')).toBeVisible({ timeout: 1000 });
  await hand.evaluate(element => element.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch', pointerId: 31 })));
  await hand.click();
  await expect(page.getByRole('toolbar', { name: 'Drawing controls' }).getByRole('button', { name: 'Draw', exact: true })).toHaveAttribute('aria-pressed', 'true');
});
