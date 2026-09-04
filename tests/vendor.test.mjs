// The pane library reaches the page as a classic script. Tweakpane v4 ships
// ES modules only, and ES modules are blocked over file://, which the demo
// must open from. So esbuild bundles it into an IIFE that is committed, and
// this proves the page can see it before any control is built on it.
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { openBuilder } from './helpers.mjs';

test.describe.configure({ mode: 'serial' });

let page;
test.beforeAll(async ({ browser }) => {
  ({ page } = await openBuilder(browser));
});

test('CARGO.tp carries Pane and the core plugin API', async () => {
  const have = await page.evaluate(() => {
    const tp = globalThis.CARGO?.tp;
    return tp ? ['Pane', 'createPlugin', 'parseRecord', 'ClassName', 'BladeController', 'BladeApi'].filter((k) => typeof tp[k] === 'function') : [];
  });
  assert.deepEqual(have, ['Pane', 'createPlugin', 'parseRecord', 'ClassName', 'BladeController', 'BladeApi']);
});
