import { expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { Sessions } from '../../src/broker/sessions';
import { Captures } from '../../src/broker/captures';
import { createSketchMcp } from '../../src/broker/mcp';

it('product MCP exposes only the strict empty-object read tool and maps a whole-drawing error without mutation tools', async () => {
  const sessions = new Sessions(); const a = sessions.create(); const token = sessions.pair(a.id, a.ownerCapability);
  const captures = new Captures(sessions);
  const mcp = createSketchMcp(captures, token, new AbortController().signal, () => {});
  const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'product-protocol-check', version: '1.0.0' });
  try {
    await mcp.connect(serverTransport); await client.connect(clientTransport);
    const tools = (await client.listTools()).tools;
    expect(tools.map(t => t.name)).toEqual(['read_current_drawing']);
    expect(tools[0].inputSchema.additionalProperties).toBe(false);
    expect(tools[0].annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: false });
    const invalid = CallToolResultSchema.parse(await client.callTool({ name: 'read_current_drawing', arguments: { sessionId: 'foreign' } }));
    expect(invalid.isError === true && !captures.busy(a.id)).toBe(true);
    const unknown = CallToolResultSchema.parse(await client.callTool({ name: 'clear_canvas', arguments: {} }));
    expect(unknown.isError === true && !captures.busy(a.id)).toBe(true);
    const pending = client.callTool({ name: 'read_current_drawing', arguments: {} });
    await Promise.resolve(); await Promise.resolve();
    let request = captures.claim(a.id, a.ownerCapability);
    for (let i = 0; !request && i < 30; i++) { await new Promise(resolve => setTimeout(resolve, 1)); request = captures.claim(a.id, a.ownerCapability); }
    expect(!!request).toBe(true); if (!request) return;
    captures.submit(a.id, a.ownerCapability, request.requestId, { generation: request.generation, pairingEpoch: request.pairingEpoch, error: 'NO_DRAWING' });
    const result = CallToolResultSchema.parse(await pending);
    expect(result.isError === true && !result.content.some(c => c.type === 'image')).toBe(true);
    expect(result.content.some(c => c.type === 'text' && c.text.includes('NO_DRAWING'))).toBe(true);
  } finally { await client.close(); await mcp.close(); }
});
