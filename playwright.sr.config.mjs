// The screen-reader run: what NVDA (Windows) or VoiceOver (macOS) actually
// says about the demo's own patterns. On demand only - `npm run test:sr`
// locally, or .github/workflows/screen-reader.yml - never part of `npm test`:
// it drives a real screen reader on a real desktop, headed and one test at a
// time, which withGuidepup enforces. Its files end .sr.mjs so the main config's
// *.test.mjs never picks them up.
//
// Chromium under NVDA, WebKit under VoiceOver: the pairs people actually use.
import { defineConfig, devices } from '@playwright/test';
import { withGuidepup } from '@guidepup/playwright';

const mac = process.platform === 'darwin';

export default withGuidepup(
  defineConfig({
    testDir: 'tests',
    testMatch: '**/*.sr.mjs',
    timeout: 300_000,
    retries: 0,
    reporter: process.env.CI ? [['github'], ['list']] : 'list',
    use: { baseURL: 'http://127.0.0.1:8137', viewport: { width: 1366, height: 768 }, trace: 'retain-on-failure' },
    projects: [
      mac
        ? { name: 'voiceover-webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1366, height: 768 } } }
        : { name: 'nvda-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } } },
    ],
    webServer: {
      command: 'npm run serve',
      url: 'http://127.0.0.1:8137/demo/patterns.html',
      reuseExistingServer: true,
      timeout: 30_000,
    },
  }),
);
