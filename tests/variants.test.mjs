// OEM variants: a brand preset that carries values, and the knobs it needs.
// Spec: docs/superpowers/specs/2026-09-09-oem-variants-design.md
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { openBuilder, pick, rowByLabel, copyParts, ORIGIN, hostHtml, engineFiles, readSlider, stageReady } from './helpers.mjs';

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

// What the tab row is actually drawing in the preview frame. bodySize rides
// along in the same evaluate as size, rather than a second call, so the two
// are read off the same paint - --tab-size: 1em inherits it, and reading them
// apart would risk comparing two different frames if one raced a rebuild.
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
      bodySize: w.getComputedStyle(d.body).fontSize,
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
  test('the six tab knobs show what the untouched tabs pattern is drawing', async () => {
    await pick(page, 'tabs');
    assert.equal(await knob(page, 'Tab text size'), '1em');
    assert.equal(await knob(page, 'Dim unselected tabs'), '0.65');
    assert.equal(await knob(page, 'Selected tab text'), 'currentcolor');
    assert.equal(await knob(page, 'Selected tab line'), 'currentcolor');
    assert.equal(await knob(page, 'Rule under the tabs'), '#e2e5ea');
    assert.equal(await knob(page, 'Between tabs'), 'none');
    const s = await tabStyles(page);
    // Same picture as before the knobs existed: 1em inherits the frame's body
    // size (whatever it is - never hardcoded), 0.65 dim, line in the text
    // colour, the #e2e5ea rule, no divider.
    assert.equal(s.size, s.bodySize);
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
    assert.equal(parseFloat(s.size), parseFloat(s.bodySize) * 1.125, '--tab-size: 1.125em should be 1.125x the body it inherits from');
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

  test('the placeholder shows the brand value, then the pattern default', async () => {
    await pick(page, 'tabs');
    await selectBrand(page, 'chevrolet');
    const field = () => rowByLabel(page, 'Selected tab line').locator('input[type="text"]').first();
    assert.equal(await field().getAttribute('placeholder'), '#006dc7');
    await selectBrand(page, '');
    assert.equal(await field().getAttribute('placeholder'), 'currentcolor');
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

  test('Toyota is a second measured brand on the tabbed bar', async () => {
    await pick(page, 'tabs');
    const variants = await page.evaluate(() => globalThis.CARGO.variantsOf('tabs'));
    assert.ok(variants.includes('toyota'), `tabs variants: ${variants}`);
    await selectBrand(page, 'toyota');
    // Toyota colours the SELECTED TAB'S TEXT (not the line independently) and
    // the line follows it via currentcolor - --tab-selected carries the red,
    // --tab-line stays at the pattern default, and both read back the same.
    const s = await tabStyles(page);
    assert.equal(s.line, 'rgb(187, 22, 43)');
    assert.equal(s.colour, 'rgb(187, 22, 43)');
    const tabs = await page.evaluate(() => [...globalThis.CARGO.sdoc().querySelectorAll('.cargo-tabs [role="tab"]')].map((t) => t.textContent.trim()));
    assert.ok(tabs.length >= 4, `expected Toyota's body-style tabs, got ${tabs}`);
    assert.deepEqual(errors, []);
  });
});

test.describe('the patterns page shows the variants', () => {
  test('one card per pattern, with a link to the Brands page where a brand is measured', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(`${ORIGIN}/demo/patterns.html`, { waitUntil: 'load' });
    await p.waitForSelector('#p-tabs .cs-slide');
    const found = await p.evaluate(() => ({
      nested: document.querySelectorAll('.gx-card--variant, #p-tabs-chevrolet').length,
      cards: document.querySelectorAll('.gx-card').length,
      patterns: Object.keys(globalThis.CARGO.PATTERNS).length,
      also: [...document.querySelectorAll('#p-tabs .gx-also a')].map((a) => [a.textContent.trim(), a.getAttribute('href')]),
      alsoOnLogo: document.querySelector('#p-logostrip .gx-also'),
      tiles: document.querySelectorAll('.gx-tile').length,
    }));
    assert.equal(found.nested, 0);
    assert.equal(found.cards, found.patterns);
    assert.equal(found.tiles, found.patterns);
    assert.ok(
      found.also.some(([t, h]) => t === 'Chevrolet' && h === 'brands.html#chevrolet'),
      `also: ${JSON.stringify(found.also)}`,
    );
    assert.equal(found.alsoOnLogo, null);
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

// A brand's tab names were SAVED on Keep but never read back: restoreSettings()
// restored `brand` (so the picker showed Chevrolet) and left `panes` alone (so
// the bar reverted to the pattern's three), which is a picker saying one thing
// over a strip doing another. Found by the final review of the variants work.
test.describe('kept settings bring the brand tab names back', () => {
  test('after Keep and a reload the five Chevrolet tabs are still there', async () => {
    // From a clean store: this file shares one page, and an earlier test can
    // leave the session entry already holding Chevrolet's five tabs - in which
    // case re-picking the brand changes nothing and Keep is rightly disabled.
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'load' });
    await stageReady(page);
    await pick(page, 'tabs');
    await selectBrand(page, 'chevrolet');
    await page.click('#wb-keep');
    await page.waitForTimeout(200);
    await page.reload({ waitUntil: 'load' });
    await stageReady(page);
    const brand = await rowByLabel(page, 'Brand').locator('select').inputValue();
    assert.equal(brand, 'chevrolet');
    const tabs = await page.evaluate(() => [...globalThis.CARGO.sdoc().querySelectorAll('.cargo-tabs [role="tab"]')].map((t) => t.textContent.trim()));
    assert.deepEqual(tabs, ['Trucks', 'Electric', 'Crossovers/SUVs', 'Performance', 'Commercial']);
    assert.deepEqual(errors, []);
  });
});

test.describe('the variant strip above the stage', () => {
  const chips = (page) => page.evaluate(() => [...document.querySelectorAll('#wb-variants button')].map((b) => [b.dataset.brand, b.getAttribute('aria-pressed')]));

  test('hidden where no brand is measured, shown with Default plus the brands on tabs', async () => {
    await pick(page, 'logostrip');
    assert.equal(await page.evaluate(() => document.getElementById('wb-variants').hidden), true);
    await pick(page, 'tabs');
    assert.equal(await page.evaluate(() => document.getElementById('wb-variants').hidden), false);
    const c = await chips(page);
    assert.equal(c[0][0], '');
    assert.ok(c.some(([b]) => b === 'chevrolet'));
    assert.ok(c.some(([b]) => b === 'toyota'));
  });

  test('a chip applies the brand, and the Brand list agrees', async () => {
    await pick(page, 'tabs');
    await selectBrand(page, '');
    await page.click('#wb-variants button[data-brand="chevrolet"]');
    await page.waitForTimeout(250);
    assert.equal((await tabStyles(page)).line, 'rgb(0, 109, 199)');
    assert.equal(await rowByLabel(page, 'Brand').locator('select').inputValue(), 'chevrolet');
    const pressed = (await chips(page)).find(([, p]) => p === 'true')[0];
    assert.equal(pressed, 'chevrolet');
    await selectBrand(page, '');
    assert.equal((await chips(page)).find(([, p]) => p === 'true')[0], '', 'Default should be pressed after Start from the default');
    assert.deepEqual(errors, []);
  });

  test('a chip click keeps keyboard focus on the strip', async () => {
    await pick(page, 'tabs');
    await page.focus('#wb-variants button[data-brand="chevrolet"]');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(250);
    const inside = await page.evaluate(() => document.getElementById('wb-variants').contains(document.activeElement));
    assert.equal(inside, true, `activeElement was ${await page.evaluate(() => document.activeElement.tagName)}`);
  });

  test('patternsOf mirrors variantsOf', async () => {
    const ok = await page.evaluate(() => {
      const { PATTERNS, BRANDS, variantsOf, patternsOf } = globalThis.CARGO;
      return Object.keys(BRANDS).every((b) => patternsOf(b).every((p) => variantsOf(p).includes(b))) && Object.keys(PATTERNS).every((p) => variantsOf(p).every((b) => patternsOf(b).includes(p)));
    });
    assert.equal(ok, true);
  });
});
