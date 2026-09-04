// The pane library reaches the page as a classic script. Tweakpane v4 ships
// ES modules only, and ES modules are blocked over file://, which the demo
// must open from. So esbuild bundles it into an IIFE that is committed, and
// this proves the page can see it before any control is built on it.
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { openBuilder, ORIGIN } from './helpers.mjs';

test.describe.configure({ mode: 'serial' });

let page, errors;
test.beforeAll(async ({ browser }) => {
  ({ page, errors } = await openBuilder(browser));
});

test('CARGO.tp carries Pane and the core plugin API', async () => {
  const have = await page.evaluate(() => {
    const tp = globalThis.CARGO?.tp;
    return tp ? ['Pane', 'createPlugin', 'parseRecord', 'ClassName', 'BladeController', 'BladeApi'].filter((k) => typeof tp[k] === 'function') : [];
  });
  assert.deepEqual(have, ['Pane', 'createPlugin', 'parseRecord', 'ClassName', 'BladeController', 'BladeApi']);
});

// tp-plugins.js destructures CARGO.tp before anything else in the file - a
// missing bundle used to throw an uncaught TypeError there, past pane.js's own
// "could not load" message. Its own context: the abort has to be routed
// before the page navigates, which openBuilder already does not leave room for.
test('a missing vendor bundle throws nothing and shows the fallback message', async ({ browser }) => {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.route('**/vendor/tweakpane.js', (route) => route.abort());
  await p.goto(`${ORIGIN}/demo/index.html`, { waitUntil: 'load' });
  await p.waitForFunction(() => document.getElementById('wb-settings')?.textContent.includes('could not load'), { timeout: 15000 });
  assert.deepEqual(errs, []);
  await ctx.close();
});

test.describe('nothing threw', () => {
  test('no page errors', () => {
    assert.deepEqual(errors, []);
  });
});
