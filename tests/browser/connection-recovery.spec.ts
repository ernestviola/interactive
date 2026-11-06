import { test, expect } from './fixture';
import { ready, drag, pair } from './helpers';
test('drawing survives a broker outage and explicit Connect pairs a fresh session without retargeting old tokens', async ({ page }) => {
  await ready(page); await drag(page, [10, 10], [100, 100]); const previous = await pair(page);
  await page.route('**/api/sketch/**', route => route.abort());
  await expect(page.getByText(/Connection unavailable/)).toBeVisible({ timeout: 12_000 });
  await expect(page.getByText(/The local desktop MCP helper can now read/)).toBeHidden();
  await expect(page.getByLabel('Read capability', { exact: true })).toHaveCount(0);
  await drag(page, [30, 40], [200, 220]); await expect(page.getByText('2 strokes', { exact: true })).toBeVisible();
  await page.unroute('**/api/sketch/**');
  const next = await pair(page); expect(next !== previous).toBe(true);
  await expect(page.getByText('2 strokes', { exact: true })).toBeVisible();
});
