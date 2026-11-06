import { test, expect } from './fixture';
import { ready, drag, read } from './helpers';

test('drawing survives broker outage and automatic read access recovers after restart', async ({ page, sketchBroker }) => {
  await ready(page);
  await drag(page, [100, 100], [170, 170]);
  await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();
  await sketchBroker.restart();
  await drag(page, [200, 200], [260, 260]);
  await expect(page.getByLabel('Sketch canvas')).toHaveAttribute('data-strokes', '2');
  const result = await read();
  expect(result.isError).not.toBe(true);
  expect(result.content.some(item => item.type === 'image')).toBe(true);
});
