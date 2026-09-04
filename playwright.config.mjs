// The test runner. Same Chromium the tests always used, now with workers,
// a trace on the first retry, and a server the runner starts itself.
//
// reuseExistingServer: CLAUDE.md is explicit that a second server must never
// be started on 8137 - if `npm run serve` is already answering, that one is
// used. The port is fixed rather than random so helpers.mjs can export ORIGIN
// as a constant that beforeAll hooks can read without a fixture.
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  testMatch: '**/*.test.mjs',
  // Each file shares one page across its tests (they build on each other),
  // so files run serially inside and in parallel across workers.
  fullyParallel: false,
  workers: process.env.CI ? 2 : undefined,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:8137',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run serve',
    url: 'http://127.0.0.1:8137/demo/index.html',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
