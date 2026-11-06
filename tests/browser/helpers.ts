import { expect, type Page } from '@playwright/test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
export async function ready(page: Page) {
  await page.goto('/'); await page.getByRole('button', { name: 'Start drawing' }).click();
  await expect(page.getByLabel('Sketch canvas')).toBeVisible();
}
export async function drag(page: Page, start: [number, number], end: [number, number], mode = 'Draw') {
  await page.getByRole('button', { name: mode, exact: true }).click();
  const bounds = await page.getByLabel('Sketch canvas').boundingBox(); if (!bounds) throw new Error('Canvas is not visible');
  const pos = ([x, y]: [number, number]) => ({ x: bounds.x + x * bounds.width / 1024, y: bounds.y + y * bounds.height / 768 });
  await page.mouse.move(pos(start).x, pos(start).y); await page.mouse.down();
  await page.mouse.move(pos(end).x, pos(end).y, { steps: 6 }); await page.mouse.up();
}
export async function pair(page: Page) {
  await page.getByRole('button', { name: 'Connect', exact: true }).click();
  const input = page.getByLabel('Read capability');
  await expect.poll(async () => /^[\w-]{43}$/.test(await input.inputValue())).toBe(true);
  return input.inputValue();
}
export async function read(token: string) {
  const client = new Client({ name: 'browser-contract-check', version: '1.0.0' });
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${process.env.SKETCH_BROKER_PORT ?? '3101'}/mcp`), { requestInit: { headers: { Authorization: `Bearer ${token}` } } }));
    return CallToolResultSchema.parse(await client.callTool({ name: 'read_selected_sketch', arguments: {} }));
  } finally { await client.close(); }
}

