import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { loadLocalCapability } from '../../experiments/voice-mcp/local-config';
import { test, expect } from './fixture';
import { ready, drag, read } from './helpers';

test('the configured helper reads the latest whole drawing without Connect or selection', async ({ page }) => {
  await page.goto('/');
  const canvas = page.getByLabel('Sketch canvas');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  const box = await canvas.boundingBox(); if (!box) throw new Error('Canvas missing');
  await page.mouse.move(box.x + 150, box.y + 150); await page.mouse.down();
  await page.mouse.move(box.x + 250, box.y + 250); await page.mouse.up();
  await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Connect' })).toHaveCount(0);
  const bootstrap = loadLocalCapability();
  await expect.poll(async () => (await fetch('http://127.0.0.1:3101/client-authorization', { headers: { Authorization: `Bearer ${bootstrap}` } })).status).toBe(200);
  const authorization = await fetch('http://127.0.0.1:3101/client-authorization', { headers: { Authorization: `Bearer ${bootstrap}` } });
  expect(authorization.ok).toBe(true);
  const { Authorization } = await authorization.json() as { Authorization: string };
  const client = new Client({ name: 'canvas-read-browser-check', version: '1.0.0' });
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL('http://127.0.0.1:3101/mcp'), { requestInit: { headers: { Authorization } } }));
    const result = CallToolResultSchema.parse(await client.callTool({ name: 'read_current_drawing', arguments: {} }));
    expect(result.isError).not.toBe(true);
    expect(result.content.some(item => item.type === 'image' && item.mimeType === 'image/png')).toBe(true);
  } finally { await client.close(); }
});

test('a read waits for an active stroke and captures the finished revision', async ({ page }) => {
  await ready(page);
  await drag(page, [80, 80], [130, 130]);
  const box = await page.getByLabel('Sketch canvas').boundingBox(); if (!box) throw new Error('Canvas missing');
  await page.mouse.move(box.x + 250, box.y + 250); await page.mouse.down();
  await page.mouse.move(box.x + 320, box.y + 320);
  const pending = read();
  await page.waitForTimeout(250);
  await page.mouse.up();
  const result = await pending;
  expect(result.isError).not.toBe(true);
  const metadata = result.content.find(item => item.type === 'text');
  expect(metadata?.text).toContain('"drawingRevision":2');
});

test('a lost sibling gesture cannot block later reads forever', async ({ page, context }) => {
  await ready(page);
  await drag(page, [80, 80], [130, 130]);
  const sessionId = await page.evaluate(() => JSON.parse(sessionStorage.getItem('interactive:canvas-checkpoint:v1') ?? 'null')?.sessionId);
  await page.evaluate(id => {
    const observer = new BroadcastChannel(`interactive:canvas:${id}`);
    observer.onmessage = event => {
      if (event.data?.type === 'gesture' && event.data.active) (window as Window & { remoteGestureSeen?: boolean }).remoteGestureSeen = true;
    };
  }, sessionId);
  const opened = context.waitForEvent('page');
  await page.evaluate(() => window.open(location.href, '_blank'));
  const sibling = await opened;
  await expect(sibling.getByLabel('Sketch canvas')).toHaveAttribute('data-ready', 'true');
  const box = await sibling.getByLabel('Sketch canvas').boundingBox();
  if (!box) throw new Error('Canvas missing');
  await sibling.mouse.move(box.x + 220, box.y + 220);
  await sibling.mouse.down();
  await sibling.mouse.move(box.x + 260, box.y + 260);
  await expect.poll(() => page.evaluate(() => (window as Window & { remoteGestureSeen?: boolean }).remoteGestureSeen)).toBe(true);
  await sibling.evaluate(() => {
    const send = BroadcastChannel.prototype.postMessage;
    BroadcastChannel.prototype.postMessage = function (message: unknown) {
      if ((message as { type?: string; active?: boolean })?.type === 'gesture' && (message as { active?: boolean }).active === false) return;
      send.call(this, message);
    };
  });
  await sibling.close();
  const result = await read();
  expect(result.isError).not.toBe(true);
});

test('a long active sibling gesture still delays capture until its stroke commits', async ({ page, context }) => {
  await ready(page);
  await drag(page, [80, 80], [130, 130]);
  const opened = context.waitForEvent('page');
  await page.evaluate(() => window.open(location.href, '_blank'));
  const sibling = await opened;
  await expect(sibling.getByLabel('Sketch canvas')).toHaveAttribute('data-ready', 'true');
  const box = await sibling.getByLabel('Sketch canvas').boundingBox();
  if (!box) throw new Error('Canvas missing');
  await sibling.mouse.move(box.x + 220, box.y + 220);
  await sibling.mouse.down();
  await sibling.mouse.move(box.x + 260, box.y + 260);
  await page.waitForTimeout(3_500);
  let settled = false;
  const pending = read().then(result => { settled = true; return result; });
  await page.waitForTimeout(250);
  expect(settled).toBe(false);
  await sibling.mouse.up();
  const result = await pending;
  expect(result.isError).not.toBe(true);
  expect(result.content.find(item => item.type === 'text')?.text).toContain('"drawingRevision":2');
});
