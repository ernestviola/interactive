import { defineConfig } from 'vitest/config';

// Never persist response payloads, image buffers, credentials, or failure attachments.
export default defineConfig({
  test: {
    reporters: ['default'],
    silent: true,
    testTimeout: 5_000,
    projects: [
      { test: { name: 'unit', include: ['tests/unit/**/*.test.ts'] } },
      { test: { name: 'contract', include: ['tests/contract/**/*.test.ts'] } },
    ],
  },
});
