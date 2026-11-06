import { test, expect } from './fixture';
import { ready, drag, read } from './helpers';

test('a duplicated tab joins latest ink and shares Undo across tabs', async ({ page, context }) => {
  await ready(page);
  await drag(page, [100, 100], [180, 180]);
  await expect(page.getByLabel('Sketch canvas')).toHaveAttribute('data-strokes', '1');
  const popupEvent = context.waitForEvent('page');
  await page.evaluate(() => window.open(location.href, '_blank'));
  const sibling = await popupEvent;
  await expect(sibling.getByLabel('Sketch canvas')).toHaveAttribute('data-strokes', '1');
  await expect(sibling.getByLabel('Sketch canvas')).toHaveAttribute('data-ready', 'true');
  await drag(sibling, [240, 240], [300, 300]);
  await expect(page.getByLabel('Sketch canvas')).toHaveAttribute('data-strokes', '2');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(sibling.getByLabel('Sketch canvas')).toHaveAttribute('data-strokes', '1');
  await sibling.close();
});

test('a duplicate waits for a delayed live coordinator instead of splitting the session', async ({ page, context }) => {
  await ready(page);
  await drag(page, [100, 100], [180, 180]);
  await expect(page.getByLabel('Sketch canvas')).toHaveAttribute('data-strokes', '1');
  const sessionId = await page.evaluate(() => JSON.parse(sessionStorage.getItem('interactive:canvas-checkpoint:v1') ?? 'null')?.sessionId);
  await page.evaluate(() => {
    const send = BroadcastChannel.prototype.postMessage;
    BroadcastChannel.prototype.postMessage = function (message: unknown) {
      if ((message as { type?: string })?.type === 'state') setTimeout(() => send.call(this, message), 500);
      else send.call(this, message);
    };
  });
  const opened = context.waitForEvent('page');
  await page.evaluate(() => window.open(location.href, '_blank'));
  const sibling = await opened;
  await expect(sibling.getByLabel('Sketch canvas')).toHaveAttribute('data-ready', 'true');
  await expect(sibling.getByLabel('Sketch canvas')).toHaveAttribute('data-strokes', '1');
  expect(await sibling.evaluate(() => JSON.parse(sessionStorage.getItem('interactive:canvas-checkpoint:v1') ?? 'null')?.sessionId)).toBe(sessionId);
  await sibling.close();
});

test('a follower does not acknowledge an unsaved shared stroke before sole-tab reload', async ({ page, context }) => {
  await ready(page);
  await drag(page, [100, 100], [180, 180]);
  const opened = context.waitForEvent('page');
  await page.evaluate(() => window.open(location.href, '_blank'));
  const sibling = await opened;
  await expect(sibling.getByLabel('Sketch canvas')).toHaveAttribute('data-strokes', '1');
  await expect(sibling.getByLabel('Sketch canvas')).toHaveAttribute('data-ready', 'true');
  await sibling.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); }; });
  await drag(page, [220, 220], [300, 300]);
  await expect(page.locator('.canvas-alert')).toContainText('not saved');
  await expect(page.getByLabel('Sketch canvas')).toHaveAttribute('data-strokes', '1');
  await page.close();
  await expect(sibling.getByLabel('Sketch canvas')).toHaveAttribute('data-strokes', '1');
  await expect(sibling.locator('.canvas-alert')).toContainText('not saved');
  await sibling.reload();
  await expect(sibling.getByLabel('Sketch canvas')).toHaveAttribute('data-strokes', '1');
});

test('reload keeps the drawing; a fresh tab after final close starts blank', async ({ page, context }) => {
  await ready(page); await drag(page, [100, 100], [180, 180]);
  await page.reload();
  await expect(page.getByLabel('Sketch canvas')).toHaveAttribute('data-strokes', '1');
  const oldCheckpoint = await page.evaluate(() => sessionStorage.getItem('interactive:canvas-checkpoint:v1'));
  await page.close();
  const fresh = await context.newPage();
  await fresh.addInitScript(raw => { if (raw) sessionStorage.setItem('interactive:canvas-checkpoint:v1', raw); }, oldCheckpoint);
  await ready(fresh);
  await expect(fresh.getByLabel('Sketch canvas')).toHaveAttribute('data-strokes', '0');
});

test('an empty duplicate joins the same canvas and can take over after the original closes', async ({ page, context }) => {
  await ready(page);
  const originalId = await page.evaluate(() => JSON.parse(sessionStorage.getItem('interactive:canvas-checkpoint:v1') ?? 'null')?.sessionId);
  const popupEvent = context.waitForEvent('page');
  await page.evaluate(() => window.open(location.href, '_blank'));
  const sibling = await popupEvent;
  await expect(sibling.getByLabel('Sketch canvas')).toHaveAttribute('data-ready', 'true');
  const siblingId = await sibling.evaluate(() => JSON.parse(sessionStorage.getItem('interactive:canvas-checkpoint:v1') ?? 'null')?.sessionId);
  expect(siblingId).toBe(originalId);
  await page.close();
  await drag(sibling, [200, 200], [260, 260]);
  await expect(sibling.getByLabel('Sketch canvas')).toHaveAttribute('data-strokes', '1');
  const result = await read();
  expect(result.isError).not.toBe(true);
});
