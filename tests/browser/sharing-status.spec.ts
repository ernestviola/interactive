import { test, expect } from './fixture';
import { ready } from './helpers';

test('the canvas fills the page with only the wordmark above it', async ({ page }) => {
  await ready(page);
  await expect(page.getByRole('button', { name: 'Connect' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Discuss' })).toHaveCount(0);
  await expect(page.getByText('About', { exact: true })).toHaveCount(0);
  await expect(page.locator('.canvas-header')).toHaveCount(0);
  await expect(page.getByText('interactive', { exact: true })).toBeVisible();
  const bounds = await page.getByLabel('Sketch canvas').boundingBox();
  expect(bounds?.y).toBe(0);
});
