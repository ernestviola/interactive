import { test, expect } from './fixture';
import { ready, drag, pair, read } from './helpers';

test('background-style lease expiry preserves ink and reconnects explicitly with a fresh key', async ({ page, sketchBroker }) => {
  await ready(page); await drag(page, [60, 60], [180, 180]); await drag(page, [20, 20], [250, 250], 'Select');
  const previous = await pair(page); const first = await read(previous);
  expect(first.content.some(c => c.type === 'image')).toBe(true);
  const other = await page.context().newPage(); await other.bringToFront();
  sketchBroker.advanceTime(30_000); await page.bringToFront(); await other.close();
  await expect(page.getByText('1 stroke', { exact: true })).toBeVisible();
  await expect(read(previous)).rejects.toThrow();
  const current = await pair(page); expect(current !== previous).toBe(true);
  const next = await read(current); expect(next.content.some(c => c.type === 'image')).toBe(true);
  await expect(page.getByText('1 stroke', { exact: true })).toBeVisible();
});

test('broker restart and session end revoke earlier keys while surviving local ink can be paired anew', async ({ page, sketchBroker }) => {
  await ready(page); await drag(page, [50, 50], [150, 150]); await drag(page, [20, 20], [220, 220], 'Select');
  const previous = await pair(page); await read(previous);
  await sketchBroker.restart(); await expect(read(previous)).rejects.toThrow();
  await drag(page, [80, 100], [200, 200]); await expect(page.getByText('2 strokes', { exact: true })).toBeVisible();
  const current = await pair(page); expect(current !== previous).toBe(true);
  expect((await read(current)).content.some(c => c.type === 'image')).toBe(true);
  page.once('dialog', dialog => dialog.accept()); await page.getByRole('button', { name: 'End session', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start drawing' })).toBeVisible();
  await expect(read(current)).rejects.toThrow();
});
