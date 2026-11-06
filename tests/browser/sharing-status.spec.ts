import { test, expect } from './fixture';
import { ready, drag, pair, read } from './helpers';
test('distinguishes the eligible current preview from Last sent to AI client without implying comprehension', async ({ page }) => {
  await ready(page); await drag(page, [50, 50], [150, 150]); await drag(page, [20, 20], [200, 200], 'Select');
  const token = await pair(page); const first = await read(token); const text = first.content.find(c => c.type === 'text');
  const metadata = text?.type === 'text' ? JSON.parse(text.text) : {};
  await expect(page.getByText('Last sent to AI client', { exact: false })).toBeVisible();
  await expect(page.getByText(metadata.snapshotId, { exact: true })).toBeVisible();
  await drag(page, [80, 120], [120, 160]);
  await expect(page.getByText(/Changes since last send/)).toBeVisible();
  await expect(page.getByText(metadata.snapshotId, { exact: true })).toBeVisible();
  expect((await page.getByRole('status').allTextContents()).every(value => !/AI understood|AI inspected/.test(value))).toBe(true);
});
