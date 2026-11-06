import { test, expect } from '@playwright/test';

test('probe tab checkpoint and navigation signals', async ({ page, context }, testInfo) => {
  await page.goto('/');
  await page.evaluate(() => sessionStorage.setItem('spec002-probe', 'checkpoint'));
  const read = (target: typeof page) => target.evaluate(() => ({
    navigation: performance.getEntriesByType('navigation').at(-1)?.toJSON().type,
    checkpoint: sessionStorage.getItem('spec002-probe'),
    webLocks: Boolean(navigator.locks),
    broadcastChannel: Boolean(globalThis.BroadcastChannel),
  }));
  const initial = await read(page);
  await page.reload();
  const reload = await read(page);
  const popupPromise = context.waitForEvent('page');
  await page.evaluate(() => window.open(location.href, '_blank'));
  const sibling = await popupPromise;
  await sibling.waitForLoadState();
  const openedSibling = await read(sibling);
  await page.close();
  const afterFirstClose = await read(sibling);
  await sibling.close();
  const newPage = await context.newPage();
  await newPage.goto('/');
  const freshAfterFinalClose = await read(newPage);
  testInfo.annotations.push({ type: 'probe', description: JSON.stringify({ initial, reload, openedSibling, afterFirstClose, freshAfterFinalClose }) });
  console.log(JSON.stringify({ browser: testInfo.project.name, initial, reload, openedSibling, afterFirstClose, freshAfterFinalClose }));
  expect(reload).toMatchObject({ navigation: 'reload', checkpoint: 'checkpoint' });
  expect(openedSibling.checkpoint).toBe('checkpoint');
  expect(freshAfterFinalClose.checkpoint).toBeNull();
});
