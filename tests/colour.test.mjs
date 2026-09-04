// A colour control that can show every value the field can hold, and that
// hands the platform the notation it keeps: #rrggbb, legacy rgba(), or
// transparent - never modern rgb(r g b / a).
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { openBuilder, pick, rowByLabel, copyParts } from './helpers.mjs';

test.describe.configure({ mode: 'serial' });

let page, errors;
test.beforeAll(async ({ browser }) => {
  ({ page, errors } = await openBuilder(browser, 1440));
  await pick(page, 'modelbar');
});

const field = (label) => rowByLabel(page, label).locator('input[type=text]').first();
const type = async (label, v) => {
  await field(label).fill(v);
  await field(label).press('Enter');
  await page.waitForTimeout(120);
};

// The swatches are read at the moment the popover opens, so a row has to be
// opened before its list exists - which is also the only way to click one.
const openPicker = async (label) => {
  const row = rowByLabel(page, label);
  const sw = row.locator('.tp-colv_sw');
  // The masthead is sticky: a row Playwright has just scrolled to the top of
  // the window is underneath it, and the click lands on the header instead.
  await sw.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  if ((await sw.getAttribute('aria-expanded')) !== 'true') await sw.click();
  await page.waitForTimeout(80);
  return row;
};

test('a typed hex, rgba and transparent all keep a swatch', async () => {
  for (const v of ['#16324f', 'rgba(0, 0, 0, 0.5)', 'transparent']) {
    await type('Arrow background', v);
    const sw = rowByLabel(page, 'Arrow background').locator('.tp-colv_sw');
    const bg = await sw.evaluate((el) => getComputedStyle(el).backgroundColor);
    assert.notEqual(bg, '', `${v} has no swatch`);
    // The colour the swatch is actually painted with. A native colour input
    // answered all three of these with a solid black square.
    assert.equal(await sw.evaluate((el) => el.style.getPropertyValue('--sw')), v, `the swatch does not show ${v}`);
  }
});

test('the picker writes legacy notation and the copied CSS carries it', async () => {
  await type('Arrow background', 'rgb(0 0 0 / 0.5)');
  const { css } = await copyParts(page);
  assert.match(css, /--cs-arrow-bg:\s*rgba\(0, 0, 0, 0\.5\)/);
  assert.doesNotMatch(css, /rgb\(0 0 0/);
});

test('alpha 1 is hex, alpha 0 is transparent', async () => {
  await type('Arrow background', 'rgba(22, 50, 79, 1)');
  let { css } = await copyParts(page);
  assert.match(css, /--cs-arrow-bg:\s*#16324f/);
  await type('Arrow background', 'rgba(22, 50, 79, 0)');
  ({ css } = await copyParts(page));
  assert.match(css, /--cs-arrow-bg:\s*transparent/);
});

test('the opacity slider turns a hex into an rgba() without leaving the row', async () => {
  await type('Arrow background', '#16324f');
  const row = await openPicker('Arrow background');
  await row.locator('input[type=range]').evaluate((el) => {
    el.value = '0.4';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(120);
  assert.equal(await field('Arrow background').inputValue(), 'rgba(22, 50, 79, 0.4)');
  const { css } = await copyParts(page);
  assert.match(css, /--cs-arrow-bg:\s*rgba\(22, 50, 79, 0\.4\)/);
});

test('a swatch click writes the field, and the swatches include the colours in use', async () => {
  await type('Arrow colour', '#abcdef');
  const row = await openPicker('Arrow background');
  const sw = row.locator('.tp-colv_list button[data-colour="#abcdef"]');
  assert.equal(await sw.count(), 1, 'the arrow colour is offered as a swatch on the other rows');
  await sw.click();
  await page.waitForTimeout(120);
  assert.equal(await field('Arrow background').inputValue(), '#abcdef');
});

test('Clear puts the default back and drops the declaration', async () => {
  await type('Arrow background', '#123456');
  await rowByLabel(page, 'Arrow background').locator('.tp-colv_clear').click();
  await page.waitForTimeout(120);
  const { css } = await copyParts(page);
  assert.doesNotMatch(css, /--cs-arrow-bg:\s*#123456/);
  // The model bar sets its own Arrow background to transparent, which is not
  // the engine's default (rgba(0, 0, 0, 0.55)) - so Clear restores that
  // pattern default and the delta filter in cssFor() keeps the declaration
  // rather than dropping it. "Dropped" only holds where the default in play
  // IS the engine's; here the surviving declaration has to equal the pattern's.
  assert.match(css, /--cs-arrow-bg:\s*transparent;/, "Clear did not restore the model bar's own default");
});

test('currentcolor stays a text field', async () => {
  await type('Arrow colour', 'currentcolor');
  await page.waitForTimeout(120);
  const { css } = await copyParts(page);
  assert.match(css, /--cs-arrow-fg:\s*currentcolor/);
  // Shown as typed, with no swatch colour invented for it: what it resolves to
  // is the dealer's page, not this panel.
  assert.equal(await field('Arrow colour').inputValue(), 'currentcolor');
  assert.equal(
    await rowByLabel(page, 'Arrow colour')
      .locator('.tp-colv_sw')
      .evaluate((el) => el.style.getPropertyValue('--sw')),
    'transparent',
  );
});

test.describe('nothing threw', () => {
  test('no page errors', () => {
    assert.deepEqual(errors, []);
  });
});
