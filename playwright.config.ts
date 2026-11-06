import { defineConfig, devices } from '@playwright/test';
process.env.SKETCH_WEB_PORT = '3100';
process.env.SKETCH_BROKER_PORT = '3101';
process.env.SKETCH_TEST_RUN = '1';
export default defineConfig({
  testDir: './tests/browser', fullyParallel: false, workers: 1,
  reporter: [['line']], timeout: 30_000,
  use: { baseURL: 'http://127.0.0.1:3100', trace: 'off', screenshot: 'off', video: 'off' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['iPhone 12'] } },
  ],
  webServer: { command: 'pnpm exec next dev --hostname 127.0.0.1 --port 3100', url: 'http://127.0.0.1:3100', reuseExistingServer: false, timeout: 120_000, stdout: 'ignore', stderr: 'ignore' },
});
