import { test, expect } from './fixture';
import { ready, drag, read } from './helpers';

test('empty read fails clearly without an image or selection fallback', async ({ page }) => {
  await ready(page);
  const result = await read();
  expect(result.isError).toBe(true);
  expect(result.content.some(item => item.type === 'text' && item.text.includes('NO_DRAWING'))).toBe(true);
  expect(result.content.some(item => item.type === 'image')).toBe(false);
});

test('read frames all committed strokes, independent of the viewport', async ({ page }) => {
  await ready(page);
  await drag(page, [80, 80], [130, 130]);
  await page.getByRole('button', { name: 'Hand' }).click();
  const box = await page.getByLabel('Sketch canvas').boundingBox(); if (!box) throw new Error('Canvas missing');
  await page.mouse.move(box.x + 300, box.y + 300); await page.mouse.down();
  await page.mouse.move(box.x + 700, box.y + 400); await page.mouse.up();
  await drag(page, [700, 400], [760, 450]);
  const result = await read();
  expect(result.isError).not.toBe(true);
  const metadata = result.content.find(item => item.type === 'text');
  expect(metadata?.text).toContain('drawingRevision');
  expect(result.content.some(item => item.type === 'image' && item.mimeType === 'image/png')).toBe(true);
});
