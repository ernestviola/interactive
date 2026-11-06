import { test, expect } from './fixture';
import { ready, drag, pair, read } from './helpers';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

test('exact crop preview matches the MCP PNG, clips crossing strokes, and excludes surrounding UI/secrets', async ({ page }) => {
  await ready(page);
  await drag(page, [20, 200], [700, 200]); await drag(page, [800, 650], [900, 700]);
  await drag(page, [100, 100], [300, 300], 'Select');
  const token = await pair(page);
  const helperProcess = await promisify(execFile)(process.execPath, ['experiments/voice-mcp/auth-headers.ts'], { encoding: 'utf8' });
  const helper = JSON.parse(helperProcess.stdout) as { Authorization: string };
  expect(helper.Authorization === `Bearer ${token}`).toBe(true);
  const before = await page.getByLabel('Selected region preview').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  const result = await read(token); const image = result.content.find(c => c.type === 'image');
  expect(image?.type === 'image' && image.mimeType === 'image/png').toBe(true); if (!image) return;
  const equal = await page.evaluate(async ({ data, before }) => {
    async function pixels(url: string) {
      const blob = await (await fetch(url)).blob(); const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0); bitmap.close();
      return { width: canvas.width, height: canvas.height, data: canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data };
    }
    const a = await pixels(before); const b = await pixels(`data:image/png;base64,${data}`);
    const centerInk = b.data.some((value, index) => index % 4 !== 3 && value < 100);
    const cornerWhite = b.data[0] === 255 && b.data[1] === 255 && b.data[2] === 255;
    return a.width === b.width && a.height === b.height && b.width <= 1024 && b.height <= 768 &&
      b.width < 210 && b.height < 210 && centerInk && cornerWhite && a.data.every((value, i) => value === b.data[i]);
  }, { data: image.data, before });
  expect(equal).toBe(true);
  expect(result.content.filter(c => c.type === 'text').every(c => !c.text.includes(token) && !c.text.includes('ownerCapability'))).toBe(true);
});

test('absent and blank selections return actionable errors without any full-canvas fallback', async ({ page }) => {
  await ready(page); await drag(page, [20, 200], [70, 250]); const token = await pair(page);
  const absent = await read(token);
  expect(absent.isError === true && !absent.content.some(c => c.type === 'image')).toBe(true);
  expect(absent.content.some(c => c.type === 'text' && c.text.includes('NO_SELECTION'))).toBe(true);
  await drag(page, [500, 400], [650, 550], 'Select');
  const blank = await read(token);
  expect(blank.isError === true && !blank.content.some(c => c.type === 'image')).toBe(true);
  expect(blank.content.some(c => c.type === 'text' && c.text.includes('EMPTY_SELECTION'))).toBe(true);
});

test('freezes revisions before asynchronous encoding; maximum image dimensions are 1024 × 768 and maximum encoded payload is 4 MiB', async ({ page }) => {
  await ready(page); await drag(page, [150, 180], [250, 180]); await drag(page, [100, 100], [400, 400], 'Select');
  const token = await pair(page);
  await page.evaluate(() => {
    const original = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function(callback, ...args) {
      HTMLCanvasElement.prototype.toBlob = original;
      Object.assign(window, { captureEncoding: true, releaseEncoding: () => original.call(this, callback, ...args) });
    };
  });
  const pending = read(token);
  await page.waitForFunction(() => (window as unknown as { captureEncoding?: boolean }).captureEncoding === true);
  await drag(page, [150, 250], [300, 300]);
  await page.evaluate(() => (window as unknown as { releaseEncoding(): void }).releaseEncoding());
  const result = await pending; const text = result.content.find(c => c.type === 'text');
  const metadata = text?.type === 'text' ? JSON.parse(text.text) : {};
  expect(metadata.drawingRevision).toBe(1);
  expect(metadata.selectionRevision).toBe(1);
  const next = await read(token); const nextText = next.content.find(c => c.type === 'text');
  const newer = nextText?.type === 'text' ? JSON.parse(nextText.text) : {};
  expect(newer.drawingRevision).toBe(2); expect(newer.snapshotId !== metadata.snapshotId).toBe(true);
  const firstImage = result.content.find(c => c.type === 'image'); const nextImage = next.content.find(c => c.type === 'image');
  expect(!!firstImage && !!nextImage && firstImage.data !== nextImage.data && firstImage.data.length < 5_592_408).toBe(true);
});

test('clearing a selection preserves ink and undo history and prevents further image sharing until reselected', async ({ page, isMobile }) => {
  await ready(page);
  await drag(page, [20, 20], [100, 100]); await drag(page, [50, 100], [100, 50]);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await drag(page, [10, 10], [150, 150], 'Select');
  const token = await pair(page);
  const first = await read(token); expect(first.content.some(c => c.type === 'image')).toBe(true);
  const clear = page.getByRole('button', { name: 'Clear selection', exact: true });
  await expect(clear).toBeEnabled();
  const bounds = await clear.boundingBox(); expect(!!bounds && bounds.width >= 44 && bounds.height >= 44).toBe(true);
  if (isMobile) await clear.tap(); else { await clear.focus(); await page.keyboard.press('Enter'); }
  await expect(page.getByLabel('Selected region preview')).toHaveCount(0);
  await expect(clear).toBeDisabled();
  await expect(page.getByText('1 stroke', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Redo', exact: true })).toBeEnabled();
  const absent = await read(token);
  expect(absent.isError === true && !absent.content.some(c => c.type === 'image')).toBe(true);
  expect(absent.content.some(c => c.type === 'text' && c.text.includes('NO_SELECTION'))).toBe(true);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(page.getByText('2 strokes', { exact: true })).toBeVisible();
  await drag(page, [10, 10], [150, 150], 'Select');
  const fresh = await read(token);
  const metadata = fresh.content.find(c => c.type === 'text');
  expect(metadata?.type === 'text' && JSON.parse(metadata.text).selectionRevision === 3).toBe(true);
});
