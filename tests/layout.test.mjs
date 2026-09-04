// The panel reads in the order decisions get made, nothing splits, and the
// preview stays on screen while the settings scroll.
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { openBuilder, pick } from './helpers.mjs';

test.describe.configure({ mode: 'serial' });

const titles = (page) => page.evaluate(() => [...document.querySelectorAll('#wb-settings .tp-fldv')].map((f) => f.querySelector('.tp-fldv_t')?.textContent.trim()));
const expanded = (page, title) =>
  page.evaluate((t) => [...document.querySelectorAll('#wb-settings .tp-fldv')].find((f) => f.querySelector('.tp-fldv_t')?.textContent.trim() === t)?.classList.contains('tp-fldv-expanded'), title);

test('folders come in decision order on the model bar', async ({ browser }) => {
  const { page } = await openBuilder(browser, 1440);
  await pick(page, 'modelbar');
  assert.deepEqual(await titles(page), ['Brand and card style', 'How many across', 'This card style', 'Arrows and dots', 'Behaviour', 'Advanced']);
  assert.equal(await expanded(page, 'Advanced'), false, 'Advanced starts closed');
  assert.equal(await expanded(page, 'Brand and card style'), true);
});

test('the preview is pinned at 1440 and in flow at 1024', async ({ browser }) => {
  for (const [w, want] of [
    [1440, 'sticky'],
    [1024, 'static'],
  ]) {
    const { page } = await openBuilder(browser, w);
    const pos = await page.evaluate(() => getComputedStyle(document.querySelector('.ui-preview')).position);
    assert.equal(pos, want, `at ${w}`);
  }
});
