import { test, expect } from './fixture';
import { ready } from './helpers';
test('controls are keyboard-activated, focused, announced, and have at least 44 × 44 CSS pixels touch targets', async ({ page }) => {
  await ready(page);
  const select = page.getByRole('button', { name: 'Select', exact: true }); await select.focus(); await page.keyboard.press('Enter');
  await expect(select).toHaveAttribute('aria-pressed', 'true');
  expect(await select.evaluate(element => getComputedStyle(element).outlineStyle !== 'none')).toBe(true);
  await expect(page.getByRole('status').first()).toBeVisible();
  for (const label of ['Draw', 'Select', 'Undo', 'Redo', 'Connect', 'End session']) {
    const button = page.getByRole('button', { name: label, exact: true });
    const rect = await button.boundingBox(); expect(!!rect && rect.width >= 44 && rect.height >= 44).toBe(true);
  }
});
