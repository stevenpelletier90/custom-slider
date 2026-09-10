// OEM variants: a brand preset that carries values, and the knobs it needs.
// Spec: docs/superpowers/specs/2026-09-09-oem-variants-design.md
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { openBuilder, pick, rowByLabel, stageFrame, copyParts, ORIGIN, hostHtml, engineFiles, readSlider } from './helpers.mjs';

test.describe.configure({ mode: 'serial' });

let browser, page, errors;

test.beforeAll(async ({ browser: b }) => {
  browser = b;
  ({ page, errors } = await openBuilder(browser, 1500));
});

// The value a knob displays, by row label - same reading as controls.test.mjs.
const knob = (page, label) =>
  page.evaluate((l) => {
    const row = [...document.querySelectorAll('#wb-settings .tp-lblv')].find((r) => r.querySelector('.tp-lblv_l')?.textContent.trim() === l);
    if (!row) return null;
    const len = row.querySelector('.tp-lenv');
    if (len) {
      const n = len.querySelector('input').value;
      return n === '' ? '' : n + len.querySelector('select').value;
    }
    const el = row.querySelector('input[type="text"], input, select');
    return el ? el.value : null;
  }, label);

// What the tab row is actually drawing in the preview frame.
const tabStyles = (page) =>
  page.evaluate(() => {
    const d = globalThis.CARGO.sdoc();
    const list = d.querySelector('.cargo-tabs');
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const sel = tabs.find((t) => t.getAttribute('aria-selected') === 'true');
    const other = tabs.find((t) => t !== sel);
    const w = d.defaultView;
    return {
      size: w.getComputedStyle(sel).fontSize,
      dim: w.getComputedStyle(other).opacity,
      line: w.getComputedStyle(sel).borderBottomColor,
      colour: w.getComputedStyle(sel).color,
      rule: w.getComputedStyle(list).borderBottomColor,
      divider: w.getComputedStyle(other, '::before').content,
    };
  });

// What the strip's card name is actually drawing - the look half of a brand's
// values (--name-color/--name-case), which is a different route through
// cssFor() than the tab row's own --tab-* properties tabStyles() reads.
const cardNameStyle = (page) =>
  page.evaluate(() => {
    const d = globalThis.CARGO.sdoc();
    const el = d.querySelector('.cargo-name');
    const cs = d.defaultView.getComputedStyle(el);
    return { colour: cs.color, transform: cs.textTransform };
  });

test.describe('the tab row has knobs', () => {
  test('the five tab knobs show what the untouched tabs pattern is drawing', async () => {
    await pick(page, 'tabs');
    assert.equal(await knob(page, 'Tab text size'), '1em');
    assert.equal(await knob(page, 'Dim unselected tabs'), '0.65');
    assert.equal(await knob(page, 'Selected tab line'), 'currentcolor');
    assert.equal(await knob(page, 'Rule under the tabs'), '#e2e5ea');
    assert.equal(await knob(page, 'Between tabs'), 'none');
    const s = await tabStyles(page);
    // Same picture as before the knobs existed: 14px inherits the frame's body,
    // 0.65 dim, line in the text colour, the #e2e5ea rule, no divider.
    assert.equal(s.dim, '0.65');
    assert.equal(s.line, s.colour);
    assert.equal(s.rule, 'rgb(226, 229, 234)');
    assert.equal(s.divider, 'none');
    assert.deepEqual(errors, []);
  });

  test('a tab knob reaches the preview and the copied CSS', async () => {
    await pick(page, 'tabs');
    const row = rowByLabel(page, 'Rule under the tabs');
    const input = row.locator('input[type="text"]').first();
    await input.fill('#ff0000');
    await input.press('Enter');
    await page.waitForTimeout(150);
    assert.equal((await tabStyles(page)).rule, 'rgb(255, 0, 0)');
    const { css } = await copyParts(page);
    assert.match(css, /--tab-rule: #ff0000;/);
    assert.deepEqual(errors, []);
  });
});

const selectBrand = async (page, id) => {
  const select = rowByLabel(page, 'Brand').locator('select');
  // restoreSettings() remembers state.brand across a pattern revisit without
  // replaying applyBrand()'s side effects (the panel's own comment: "the
  // preset is NOT re-run"), and this file's tests share one page/localStorage
  // across the whole run - so a prior test can leave the picker already
  // showing `id`. Selecting an already-selected <option> fires no change
  // event, so applyBrand() never runs and state.panes/props stay stale. Route
  // through "Start from the default" first to guarantee a real change.
  if ((await select.inputValue()) === id) await select.selectOption('');
  await select.selectOption(id);
  await page.waitForTimeout(200);
};

test.describe('a brand applies its values', () => {
  test('Chevrolet on the tabbed bar draws the blue line and ships it', async () => {
    await pick(page, 'tabs');
    await selectBrand(page, 'chevrolet');
    const s = await tabStyles(page);
    assert.equal(s.line, 'rgb(0, 109, 199)');
    assert.equal(s.dim, '1');
    assert.equal(s.rule, 'rgba(0, 0, 0, 0)');
    assert.equal(s.divider, '"|"');
    assert.equal(await knob(page, 'Selected tab line'), '#006dc7');
    assert.equal(await knob(page, 'Name case'), 'capitalize');
    // The look half of the brand's values (--name-color/--name-case) has to
    // land on the carousel root, not the tabs wrap: an own declaration on the
    // wrap loses to the shared card sheet's own --name-color on the root, so
    // this used to draw #222/none no matter what the knobs said.
    const name = await cardNameStyle(page);
    assert.equal(name.colour, 'rgb(51, 51, 51)');
    assert.equal(name.transform, 'capitalize');
    const tabs = await page.evaluate(() => [...globalThis.CARGO.sdoc().querySelectorAll('.cargo-tabs [role="tab"]')].map((t) => t.textContent.trim()));
    assert.deepEqual(tabs, ['Trucks', 'Electric', 'Crossovers/SUVs', 'Performance', 'Commercial']);
    const { css } = await copyParts(page);
    assert.match(css, /--tab-line: #006dc7;/);
    assert.match(css, /--name-case: capitalize;/);
    assert.deepEqual(errors, []);
  });

  test('the same brand on the plain model bar brings the card values and nothing about tabs', async () => {
    await pick(page, 'modelbar');
    await selectBrand(page, 'chevrolet');
    assert.equal(await knob(page, 'Name case'), 'capitalize');
    const { css } = await copyParts(page);
    assert.match(css, /--name-case: capitalize;/);
    assert.doesNotMatch(css, /--tab-/);
  });

  test('clearing a brand-added tab name falls back instead of throwing', async () => {
    await pick(page, 'tabs');
    await selectBrand(page, 'chevrolet');
    // Chevrolet hands the pattern five tabs; the pattern's own default is
    // three, so Tab 4/5 have no pattern value to fall back to.
    const input = rowByLabel(page, 'Tab 5').locator('input[type="text"]').first();
    await input.fill('');
    await input.press('Enter');
    await page.waitForTimeout(150);
    const tabs = await page.evaluate(() => [...globalThis.CARGO.sdoc().querySelectorAll('.cargo-tabs [role="tab"]')].map((t) => t.textContent.trim()));
    assert.equal(tabs[4], 'Commercial');
    assert.deepEqual(errors, []);
  });

  test('resetting a knob goes back to the brand; Start from the default goes back to the pattern', async () => {
    await pick(page, 'tabs');
    await selectBrand(page, 'chevrolet');
    const row = rowByLabel(page, 'Selected tab line');
    const input = row.locator('input[type="text"]').first();
    await input.fill('#123456');
    await input.press('Enter');
    await page.waitForTimeout(150);
    assert.equal((await tabStyles(page)).line, 'rgb(18, 52, 86)');
    await input.fill('');
    await input.press('Enter');
    await page.waitForTimeout(150);
    assert.equal((await tabStyles(page)).line, 'rgb(0, 109, 199)', 'clearing the field should fall back to the brand value');
    await selectBrand(page, '');
    const s = await tabStyles(page);
    assert.equal(s.line, s.colour, 'Start from the default should put the pattern value back');
    assert.equal(s.dim, '0.65');
    assert.equal(await knob(page, 'Name case'), 'none');
    const tabs = await page.evaluate(() => [...globalThis.CARGO.sdoc().querySelectorAll('.cargo-tabs [role="tab"]')].map((t) => t.textContent.trim()));
    assert.deepEqual(tabs, ['Trucks', 'SUVs', 'Crossovers']);
    assert.deepEqual(errors, []);
  });

  test('the brand list is offered only where a brand has something to give', async () => {
    await pick(page, 'logostrip');
    assert.equal(await rowByLabel(page, 'Brand').count(), 0, 'no brand carries values for the logo strip');
    await pick(page, 'tabs');
    const opts = await rowByLabel(page, 'Brand')
      .locator('select')
      .evaluate((s) => [...s.options].map((o) => o.value).filter(Boolean));
    assert.ok(opts.includes('chevrolet'));
    assert.ok(opts.length >= 32, 'a cutout card offers every brand, because every brand has a roster');
  });
});

test.describe('the patterns page shows the variants', () => {
  test('one stage per brand that carries values, with a tile in the index', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(`${ORIGIN}/demo/patterns.html`, { waitUntil: 'load' });
    await p.waitForSelector('#p-tabs .cs-slide');
    const found = await p.evaluate(() => ({
      stage: !!document.querySelector('#p-tabs-chevrolet .cs'),
      caption: document.querySelector('#p-tabs-chevrolet .gx-variant')?.textContent.trim(),
      tile: !!document.querySelector('.gx-tile[href="#p-tabs-chevrolet"]'),
      builderLink: document.querySelector('#p-tabs-chevrolet a.ui-btn')?.getAttribute('href'),
      line: (() => {
        const t = document.querySelector('#p-tabs-chevrolet [role="tab"][aria-selected="true"]');
        return t && getComputedStyle(t).borderBottomColor;
      })(),
      noneOnLogo: !document.querySelector('#p-logostrip-chevrolet'),
    }));
    assert.equal(found.stage, true, 'no Chevrolet stage under the tabbed bar');
    assert.match(found.caption ?? '', /Chevrolet/);
    assert.equal(found.tile, true);
    assert.equal(found.builderLink, 'index.html#tabs?brand=chevrolet');
    assert.equal(found.line, 'rgb(0, 109, 199)');
    assert.equal(found.noneOnLogo, true);
    assert.deepEqual(errs, []);
    await ctx.close();
  });

  test('the deep link opens the builder on the variant', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 900 } });
    const p = await ctx.newPage();
    await p.goto(`${ORIGIN}/demo/index.html#tabs?brand=chevrolet`, { waitUntil: 'load' });
    await p.waitForSelector('#wb-stage');
    await p.frameLocator('#wb-stage').locator('.cs-slide').first().waitFor({ state: 'attached', timeout: 15000 });
    const brand = await rowByLabel(p, 'Brand').locator('select').inputValue();
    assert.equal(brand, 'chevrolet');
    assert.equal((await tabStyles(p)).line, 'rgb(0, 109, 199)');
    await ctx.close();
  });

  test('the Chevrolet tabbed bar pastes onto a hostile host the way the page shows it', async () => {
    await pick(page, 'tabs');
    await selectBrand(page, 'chevrolet');
    const parts = await copyParts(page);
    const engine = await engineFiles();
    const host = await browser.newPage();
    await host.setContent(hostHtml({ ...engine, css: parts.css, html: parts.html, js: parts.js }), { waitUntil: 'load' });
    const hostLine = await host.evaluate(() => getComputedStyle(document.querySelector('[role="tab"][aria-selected="true"]')).borderBottomColor);
    assert.equal(hostLine, 'rgb(0, 109, 199)');
    const slider = await readSlider(host);
    assert.ok(slider && slider.width > 0);
    await host.close();
  });
});
