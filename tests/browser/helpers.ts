import { expect, type Page } from '@playwright/test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { loadLocalCapability } from '../../experiments/voice-mcp/local-config';

export async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByLabel('Sketch canvas')).toBeVisible();
  await expect(page.getByLabel('Sketch canvas')).toHaveAttribute('data-ready', 'true');
}
export async function drag(page: Page, start: [number, number], end: [number, number], mode = 'Draw') {
  await page.getByRole('button', { name: mode, exact: true }).click();
  const bounds = await page.getByLabel('Sketch canvas').boundingBox(); if (!bounds) throw new Error('Canvas is not visible');
  const pos = ([x, y]: [number, number]) => ({ x: bounds.x + x * bounds.width / 1024, y: bounds.y + y * bounds.height / 768 });
  await page.mouse.move(pos(start).x, pos(start).y); await page.mouse.down();
  await page.mouse.move(pos(end).x, pos(end).y, { steps: 6 }); await page.mouse.up();
}
export async function read() {
  const bootstrap = loadLocalCapability();
  const url = `http://127.0.0.1:${process.env.SKETCH_BROKER_PORT ?? '3101'}`;
  let authorization = '';
  await expect.poll(async () => {
    const response = await fetch(`${url}/client-authorization`, { headers: { Authorization: `Bearer ${bootstrap}` } });
    if (response.ok) authorization = (await response.json() as { Authorization: string }).Authorization;
    return response.status;
  }).toBe(200);
  const client = new Client({ name: 'browser-contract-check', version: '1.0.0' });
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL(`${url}/mcp`), { requestInit: { headers: { Authorization: authorization } } }));
    return CallToolResultSchema.parse(await client.callTool({ name: 'read_current_drawing', arguments: {} }));
  } finally { await client.close(); }
}
