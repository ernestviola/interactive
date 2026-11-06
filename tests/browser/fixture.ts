import { test as base, expect } from '@playwright/test';
import { once } from 'node:events';
import { createBroker } from '../../src/broker/server';
import { loadLocalCapability } from '../../experiments/voice-mcp/local-config';
// Fresh real registry per case keeps service capacity/rate limits enabled without
// cross-test state or test-only debug endpoints in the application.
type TestBroker = { advanceTime(ms: number): void; restart(): Promise<void> };
export const test = base.extend<{ sketchBroker: TestBroker }>({
  sketchBroker: [async ({}, provide) => {
    let offset = 0;
    const bootstrap = loadLocalCapability();
    const fresh = () => createBroker([], bootstrap, { now: () => Date.now() + offset });
    let broker = fresh();
    const start = async () => { broker.server.listen(3101, '127.0.0.1'); await once(broker.server, 'listening'); };
    const close = async () => { broker.server.closeAllConnections(); await new Promise<void>(resolve => broker.server.close(() => resolve())); };
    await start();
    try { await provide({ advanceTime(ms) { offset += ms; broker.sessions.expire(); }, async restart() { await close(); broker = fresh(); await start(); } }); }
    finally { await close(); }
  }, { auto: true }],
});
export { expect };
