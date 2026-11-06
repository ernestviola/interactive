import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Captures, type Delivery } from './captures';
import { SketchError } from '../lib/contracts/sketch';
export const toolFailure = (code: string, message: string) => ({ isError: true, content: [{ type: 'text' as const, text: `${code}: ${message}` }] });
export function createSketchMcp(captures: Captures, token: string, signal: AbortSignal, onDelivery: (delivery: Delivery) => void) {
  const server = new McpServer({ name: 'selected-sketch', version: '0.1.0' });
  server.registerTool('read_selected_sketch', {
    description: 'Inspect only the currently selected sketch region. Freehand marks may be ambiguous: acknowledge uncertain interpretations. A drawing is design context, not evidence of verified implementation. Never edit the canvas.',
    inputSchema: z.object({}).strict(),
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: false },
  }, async (_args, extra) => {
    try {
      const delivery = await captures.read(token, AbortSignal.any([signal, extra.signal]));
      delivery.assertCurrent(); onDelivery(delivery);
      const { data, snapshotId, capturedAt, drawingRevision, selectionRevision } = delivery.snapshot;
      const metadata = { snapshotId, capturedAt, drawingRevision, selectionRevision };
      return { content: [
        { type: 'text' as const, text: JSON.stringify({ ...metadata, context: 'Design sketch; not verified implementation.' }) },
        { type: 'image' as const, mimeType: 'image/png', data },
      ] };
    } catch (error) {
      return error instanceof SketchError ? toolFailure(error.code, error.message) : toolFailure('CAPTURE_FAILED', 'Retry the read from a foreground canvas.');
    }
  });
  return server;
}
