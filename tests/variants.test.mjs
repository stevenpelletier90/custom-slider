// OEM variants: a brand preset that carries values, and the knobs it needs.
// Spec: docs/specs/2026-09-09-oem-variants-design.md
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { openBuilder, pick, rowByLabel, copyParts, ORIGIN, hostHtml, engineFiles, readSlider, stageReady, setField } from './helpers.mjs';

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
      weight: w.getComputedStyle(sel).fontWeight,
      dim: w.getComputedStyle(other).opacity,
      line: w.getComputedStyle(sel, '::after').backgroundColor,
      colour: w.getComputedStyle(sel).color,
      rule: w.getComputedStyle(list).borderBottomColor,
      divider: w.getComputedStyle(other, '::before').content,
      dividerColour: w.getComputedStyle(other, '::before').color,
      gap: w.getComputedStyle(d.querySelector('.cs')).getPropertyValue('--cs-gap').trim(),
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
  test('the eight tab knobs show what the untouched tabs pattern is drawing', async () => {
    await pick(page, 'tabs');
    assert.equal(await knob(page, 'Tab text size'), '1em');
    assert.equal(await knob(page, 'Tab text weight'), '600');
    assert.equal(await knob(page, 'Dim unselected tabs'), '0.65');
    assert.equal(await knob(page, 'Selected tab text'), 'currentcolor');
    assert.equal(await knob(page, 'Selected tab line'), 'currentcolor');
    assert.equal(await knob(page, 'Rule under the tabs'), '#e2e5ea');
    assert.equal(await knob(page, 'Between tabs'), 'none');
    assert.equal(await knob(page, 'Divider colour'), 'currentcolor');
    const s = await tabStyles(page);
    // Same picture as before the knobs existed: 1em inherits the frame's body
    // size (whatever it is - never hardcoded), 600, 0.65 dim, line in the text
    // colour, the #e2e5ea rule, no divider.
    assert.equal(s.size, s.bodySize);
    assert.equal(s.weight, '600');
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

// The one brand control (2026-09-10): a Default chip, a chip per measured
// brand, a select for every other brand the card can take. `id === ''` is
// always a chip (Default is drawn whenever the strip is shown); a measured
// brand is a chip; anything else goes through the select.
const selectBrand = async (page, id) => {
  if (id === '') {
    await page.click('#wb-variants button[data-brand=""]');
    await page.waitForTimeout(200);
    return;
  }
  const chip = page.locator(`#wb-variants button[data-brand="${id}"]`);
  if (await chip.count()) {
    await chip.click();
    await page.waitForTimeout(200);
    return;
  }
  const select = page.locator('#wb-brand');
  // restoreSettings() remembers state.brand across a pattern revisit without
  // replaying applyBrand()'s side effects (the panel's own comment: "the
  // preset is NOT re-run"), and this file's tests share one page/localStorage
  // across the whole run - so a prior test can leave the select already
  // showing `id`. Selecting an already-selected <option> fires no change
  // event, so applyBrand() never runs and state.panes/props stay stale. Route
  // through the Default chip first to guarantee a real change.
  if ((await select.inputValue()) === id) {
    await page.click('#wb-variants button[data-brand=""]');
    await page.waitForTimeout(200);
  }
  await select.selectOption(id);
  await page.waitForTimeout(200);
};

// What the strip is actually showing: the pressed chip's brand, or the
// select's value when no chip is pressed - the same reading a designer gets
// from looking at it, whichever of the two doors the brand came through.
const currentBrand = (page) =>
  page.evaluate(() => {
    const pressed = document.querySelector('#wb-variants button[aria-pressed="true"]');
    if (pressed) return pressed.dataset.brand;
    return document.getElementById('wb-brand')?.value ?? '';
  });

test.describe('a brand applies its values', () => {
  test('Chevrolet on the tabbed bar draws the blue line and ships it', async () => {
    await pick(page, 'tabs');
    await selectBrand(page, 'chevrolet');
    const s = await tabStyles(page);
    // 18px on the site's 14px body (measured 2026-09-14), as 1.29em of the
    // body the tabs inherit from - within a hundredth of a pixel of it.
    assert.ok(Math.abs(parseFloat(s.size) - parseFloat(s.bodySize) * 1.29) < 0.05, `--tab-size: 1.29em should be 1.29x the body, got ${s.size} of ${s.bodySize}`);
    assert.equal(s.weight, '700', 'the live bar wraps each label in <b>');
    assert.equal(s.line, 'rgb(0, 109, 199)');
    assert.equal(s.dim, '1');
    assert.equal(s.rule, 'rgba(0, 0, 0, 0)');
    assert.equal(s.divider, '"|"');
    assert.equal(s.dividerColour, 'rgb(118, 118, 118)', "the site's own grey, not the tab text at full strength");
    assert.equal(s.gap, '0.1px', 'the live slides butt together');
    assert.equal(await knob(page, 'Selected tab line'), '#006dc7');
    assert.equal(await knob(page, 'Tab text weight'), '700');
    assert.equal(await knob(page, 'Divider colour'), '#767676');
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
    assert.match(css, /--tab-weight: 700;/);
    assert.match(css, /--tab-divider-color: #767676;/);
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

  test('the brand control is offered only where a brand has something to give', async () => {
    await pick(page, 'logostrip');
    assert.equal(await page.evaluate(() => document.getElementById('wb-variants').hidden), true, 'no brand carries values for the logo strip');
    await pick(page, 'tabs');
    assert.equal(await page.locator('#wb-variants button[data-brand="chevrolet"]').count(), 1, 'Chevrolet should be a chip on tabs');
    assert.equal(await page.locator('#wb-variants button[data-brand="toyota"]').count(), 1, 'Toyota should be a chip on tabs');
    const optCount = await page.locator('#wb-brand option:not([value=""])').count();
    assert.ok(optCount >= 30, `a cutout card offers every other brand in the select, got ${optCount}`);
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

  test('a tab name with an & escapes in the copied markup and still reads correctly', async () => {
    await pick(page, 'tabs');
    await selectBrand(page, 'toyota');
    const { html } = await copyParts(page);
    assert.match(html, /Cars &amp; Minivan/);
    assert.doesNotMatch(html, /Cars & Minivan</);
    const tabs = await page.evaluate(() => [...globalThis.CARGO.sdoc().querySelectorAll('.cargo-tabs [role="tab"]')].map((t) => t.textContent.trim()));
    assert.ok(tabs.includes('Cars & Minivan'), `tabs: ${tabs}`);
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
    const brand = await currentBrand(p);
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
    const hostLine = await host.evaluate(() => getComputedStyle(document.querySelector('[role="tab"][aria-selected="true"]'), '::after').backgroundColor);
    assert.equal(hostLine, 'rgb(0, 109, 199)');
    const slider = await readSlider(host);
    assert.ok(slider && slider.width > 0);
    await host.close();
  });
});

// 2026-09-14, afternoon. The morning's Chevrolet pass measured static values
// and the bar still did not look like chevroletdemo1's: the motion and the
// spacing were literals nobody had measured. Every number here is the live
// bar's at 1280 (docs/history.md), and every one reaches the page as a value.
test.describe('the tabbed bar moves and spaces like the live one', () => {
  const geometry = (page) =>
    page.evaluate(() => {
      const d = globalThis.CARGO.sdoc();
      const w = d.defaultView;
      const tabs = [...d.querySelectorAll('.cargo-tabs [role="tab"]')];
      const [a, b] = tabs.map((t) => t.getBoundingClientRect());
      const divider = w.getComputedStyle(tabs[1], '::before');
      const pane = d.querySelector('.cargo-pane:not([hidden])');
      const img = pane.querySelector('.cargo-card img');
      const name = pane.querySelector('.cargo-name');
      const arrow = pane.querySelector('.cs-arrow--prev');
      return {
        gap: +(b.left - a.right).toFixed(1),
        rowH: +a.height.toFixed(1),
        dividerSize: divider.fontSize,
        // Centred in the space between the two tabs: its box's middle against
        // the gap's middle.
        // The pseudo's box starts at the tab's left plus its offset; the
        // translate(-50%) then centres the glyph on that point.
        dividerCentred: Math.abs(b.left + parseFloat(divider.left) - (a.right + b.left) / 2) < 1,
        nameGap: +(name.getBoundingClientRect().top - img.getBoundingClientRect().bottom).toFixed(1),
        nameLine: w.getComputedStyle(name).lineHeight,
        zoomSpeed: w.getComputedStyle(img).transitionDuration,
        arrowFg: w.getComputedStyle(arrow).color,
        title: d.querySelector('.cargo-title'),
        titleTag: d.querySelector('.cargo-title')?.tagName,
        titleSize: d.querySelector('.cargo-title') && w.getComputedStyle(d.querySelector('.cargo-title')).fontSize,
        more: d.querySelector('.cargo-more .cargo-cta') && {
          href: d.querySelector('.cargo-more .cargo-cta').getAttribute('href'),
          text: d.querySelector('.cargo-more .cargo-cta').textContent.trim(),
          bg: w.getComputedStyle(d.querySelector('.cargo-more .cargo-cta')).backgroundColor,
          fg: w.getComputedStyle(d.querySelector('.cargo-more .cargo-cta')).color,
        },
        body: w.getComputedStyle(d.body).fontSize,
      };
    });

  test('the untouched bar keeps every value it had, and gains its heading and button', async () => {
    await pick(page, 'tabs');
    await selectBrand(page, '');
    await page.click('.ui-widths button[data-w="1200"]');
    await page.waitForTimeout(200);
    const g = await geometry(page);
    assert.equal(g.gap, 3.5, 'the default 0.25em gap moved');
    assert.equal(g.dividerSize, g.body, 'the default divider is the tab size, which is the body size here');
    assert.equal(g.zoomSpeed, '0.2s, 0.25s', 'the default zoom speed moved');
    assert.equal(g.nameLine, `${(parseFloat(g.body) * 1.35).toFixed(2).replace(/\.?0+$/, '')}px`.replace('18.9px', '18.9px'), 'the default name line height moved');
    assert.equal(g.titleTag, 'H2', 'the heading over the bar is not an h2');
    assert.deepEqual(g.more && { href: g.more.href, text: g.more.text }, { href: '/searchnew.aspx', text: 'Explore All New Inventory' });
    assert.equal(await knob(page, 'Space between tabs'), '0.25em');
    assert.equal(await knob(page, 'Pane fade'), '0s');
    assert.deepEqual(errors, []);
  });

  test('Chevrolet lands every measured number', async () => {
    await pick(page, 'tabs');
    await selectBrand(page, 'chevrolet');
    await page.waitForTimeout(200);
    const g = await geometry(page);
    assert.ok(Math.abs(g.gap - 31) < 1, `31px between tabs on the live bar, got ${g.gap}`);
    assert.ok(Math.abs(g.rowH - 57) < 1.5, `the live tab is 57px tall, got ${g.rowH}`);
    assert.ok(Math.abs(parseFloat(g.dividerSize) - parseFloat(g.body)) < 0.2, `the live divider is the body size, got ${g.dividerSize} on a ${g.body} body`);
    assert.equal(g.dividerCentred, true, 'the divider is not centred between the tabs');
    assert.ok(Math.abs(g.nameGap - 2) < 0.6, `the live name sits 2px under the cutout, got ${g.nameGap}`);
    assert.ok(Math.abs(parseFloat(g.nameLine) - 17.6) < 0.3, `the live name line is 17.6px, got ${g.nameLine}`);
    assert.equal(g.zoomSpeed, '0.2s, 0.1s', 'the live cutout grows in 0.1s');
    assert.equal(g.arrowFg, 'rgb(102, 102, 102)');
    assert.equal(g.more.bg, 'rgb(0, 109, 199)', "the button under the bar is Chevrolet's blue");
    assert.equal(g.more.fg, 'rgb(255, 255, 255)');
    const { css, html } = await copyParts(page);
    for (const line of [
      '--tab-gap: 1.7em;',
      '--tab-pad: 0.75em;',
      '--tab-divider-size: 0.78;',
      '--tab-fade: 0.15s;',
      '--more-bg: #006dc7;',
      '--cs-arrow-fg-hover: #006dc7;',
      '--cs-arrow-bg-hover: transparent;',
      '--name-gap: 0.14em;',
      '--name-leading: 1.1;',
      '--img-hover-speed: 0.1s;',
    ]) {
      assert.ok(css.includes(line), `${line} never reached the copied CSS`);
    }
    assert.match(html, /<h2 class="cargo-title">View Our Lineup<\/h2>/);
    assert.match(html, /<p class="cargo-more"><a class="cargo-cta" href="\/searchnew\.aspx">Explore All New Inventory<\/a><\/p>/);
    assert.deepEqual(errors, []);
  });

  // The live line is an ::after on the tab link: 2px, left 50% and zero wide
  // at rest, left 0 and full width when selected, width and left over 0.15s
  // cubic-bezier(0.215, 0.61, 0.355, 1) - so it grows out from the centre.
  test('the line under a picked tab grows from the centre over 0.15s, and instantly by default', async () => {
    await pick(page, 'tabs');
    await selectBrand(page, 'chevrolet');
    await page.waitForTimeout(300);
    const lineOf = (i) =>
      page.evaluate((n) => {
        const d = globalThis.CARGO.sdoc();
        const t = d.querySelectorAll('.cargo-tabs [role="tab"]')[n];
        const cs = d.defaultView.getComputedStyle(t, '::after');
        return {
          width: parseFloat(cs.width),
          left: parseFloat(cs.left),
          tab: t.getBoundingClientRect().width,
          duration: cs.transitionDuration,
          easing: cs.transitionTimingFunction,
          height: cs.height,
          bg: cs.backgroundColor,
        };
      }, i);
    const rest = await lineOf(1);
    assert.equal(rest.width, 0, 'an unselected tab shows a line');
    assert.equal(rest.height, '2px');
    assert.equal(rest.bg, 'rgb(0, 109, 199)');
    assert.match(rest.duration, /^0\.15s/, `the line grows over 0.15s, got ${rest.duration}`);
    assert.match(rest.easing, /cubic-bezier\(0\.215, 0\.61, 0\.355, 1\)/);
    await page.frameLocator('#wb-stage').locator('.cargo-tabs [role="tab"]').nth(1).click();
    await page.waitForTimeout(40);
    const mid = await lineOf(1);
    assert.ok(mid.width > 0 && mid.width < mid.tab, `read mid-grow the line should be part way out, got ${mid.width} of ${mid.tab}`);
    assert.ok(mid.left > 0 && mid.left < mid.tab / 2, `growing from the centre means left is moving in from 50%, got ${mid.left}`);
    await page.waitForTimeout(300);
    const done = await lineOf(1);
    assert.ok(Math.abs(done.width - done.tab) < 0.5, 'the line should end the full tab width');
    assert.equal(done.left, 0);
    assert.ok(((await copyParts(page)).css || '').includes('--tab-line-grow: 0.15s;'), 'the grow time never reached the copied CSS');
    // The untouched pattern: same box, no motion.
    await selectBrand(page, '');
    await page.waitForTimeout(200);
    assert.match((await lineOf(0)).duration, /^0s/, 'the default line should switch at once');
    assert.equal(await knob(page, 'Line grow time'), '0s');
    assert.deepEqual(errors, []);
  });

  test('the arrows turn blue on hover, on nothing', async () => {
    await pick(page, 'tabs');
    await selectBrand(page, 'chevrolet');
    // Only a pane with more models than fit draws arrows; the Chevrolet
    // roster is eight across five, so the first pane has them.
    const arrow = page.frameLocator('#wb-stage').locator('.cargo-pane:not([hidden]) .cs-arrow--next').first();
    await arrow.hover();
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const a = globalThis.CARGO.sdoc().querySelector('.cargo-pane:not([hidden]) .cs-arrow--next');
      const cs = a.ownerDocument.defaultView.getComputedStyle(a);
      return { fg: cs.color, bg: cs.backgroundColor };
    });
    assert.equal(r.fg, 'rgb(0, 109, 199)', 'the hovered arrow is not the link blue');
    assert.equal(r.bg, 'rgba(0, 0, 0, 0)', 'the hovered arrow grew a background');
  });

  test('a picked pane fades in; the pane the page loads with does not; reduced motion never fades', async () => {
    await pick(page, 'tabs');
    await selectBrand(page, 'chevrolet');
    await page.waitForTimeout(300);
    const atLoad = await page.evaluate(() => {
      const d = globalThis.CARGO.sdoc();
      const p = d.querySelector('.cargo-pane:not([hidden])');
      return { marked: p.hasAttribute('data-in'), anim: d.defaultView.getComputedStyle(p).animationName };
    });
    assert.equal(atLoad.marked, false, 'the first pane is marked as picked at load');
    assert.equal(atLoad.anim, 'none', 'the first pane animates at load');
    await page.frameLocator('#wb-stage').locator('.cargo-tabs [role="tab"]').nth(1).click();
    const mid = await page.evaluate(() => {
      const d = globalThis.CARGO.sdoc();
      const p = d.querySelector('.cargo-pane:not([hidden])');
      const cs = d.defaultView.getComputedStyle(p);
      return { marked: p.hasAttribute('data-in'), anim: cs.animationName, duration: cs.animationDuration, opacity: +cs.opacity };
    });
    assert.equal(mid.marked, true);
    assert.equal(mid.anim, 'cargo-tab-fade');
    assert.equal(mid.duration, '0.15s');
    assert.ok(mid.opacity < 1, `read mid-fade, the pane should still be fading in, got opacity ${mid.opacity}`);
    await page.waitForTimeout(300);
    // Reduced motion: the same click, no animation at all.
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 900 }, reducedMotion: 'reduce' });
    const p2 = await ctx.newPage();
    await p2.goto(`${ORIGIN}/demo/index.html#tabs?brand=chevrolet`, { waitUntil: 'load' });
    await p2.waitForSelector('#wb-stage');
    await p2.frameLocator('#wb-stage').locator('.cs-slide').first().waitFor({ state: 'attached', timeout: 15000 });
    await p2.waitForTimeout(500);
    await p2.frameLocator('#wb-stage').locator('.cargo-tabs [role="tab"]').nth(1).click();
    const rm = await p2.evaluate(() => {
      const d = globalThis.CARGO.sdoc();
      const p = d.querySelector('.cargo-pane:not([hidden])');
      const cs = d.defaultView.getComputedStyle(p);
      return { anim: cs.animationName, opacity: +cs.opacity };
    });
    assert.equal(rm.anim, 'none', 'reduced motion still fades');
    assert.equal(rm.opacity, 1);
    await ctx.close();
  });

  test("the heading and button are the pattern's words: editable, empty means absent, kept across a reload", async () => {
    await pick(page, 'tabs');
    await selectBrand(page, '');
    await setField(page, 'Heading over the bar', 'Our Lineup');
    await setField(page, 'Button under the bar', '');
    let { html, css } = await copyParts(page);
    assert.match(html, /<h2 class="cargo-title">Our Lineup<\/h2>/);
    assert.doesNotMatch(html, /cargo-more/, 'an empty button text still ships a button');
    assert.match(css, /\.cargo-title \{/, 'the heading rule did not ship');
    await setField(page, 'Heading over the bar', '');
    ({ html } = await copyParts(page));
    assert.doesNotMatch(html, /cargo-title/, 'an empty heading still ships an h2');
    await setField(page, 'Button under the bar', 'See them all');
    await setField(page, 'Button under the bar, link', '/searchused.aspx');
    ({ html } = await copyParts(page));
    assert.match(html, /<a class="cargo-cta" href="\/searchused\.aspx">See them all<\/a>/);
    // Kept: pressed Keep, reloaded, the typed words are still there and the
    // cleared heading is still cleared - an empty string is a choice, not a
    // missing value.
    await page.click('#wb-keep');
    await page.waitForTimeout(200);
    await page.reload({ waitUntil: 'load' });
    await stageReady(page);
    await page.waitForTimeout(300);
    ({ html } = await copyParts(page));
    assert.doesNotMatch(html, /cargo-title/, 'the cleared heading came back after a reload');
    assert.match(html, /See them all/, 'the typed button was lost on reload');
    // Back to the pattern's own words for the tests that follow.
    await setField(page, 'Heading over the bar', 'View Our Lineup');
    await setField(page, 'Button under the bar', 'Explore All New Inventory');
    await setField(page, 'Button under the bar, link', '/searchnew.aspx');
    assert.deepEqual(errors, []);
  });

  test('the heading and button paste onto a hostile host at the size the page shows', async () => {
    await pick(page, 'tabs');
    await selectBrand(page, 'chevrolet');
    const parts = await copyParts(page);
    const engine = await engineFiles();
    const host = await browser.newPage();
    await host.setContent(hostHtml({ ...engine, css: parts.css, html: parts.html, js: parts.js }), { waitUntil: 'load' });
    const r = await host.evaluate(() => {
      const h = document.querySelector('.cargo-title');
      const a = document.querySelector('.cargo-more .cargo-cta');
      const tabs = [...document.querySelectorAll('.cargo-tabs [role="tab"]')].map((t) => t.getBoundingClientRect());
      return {
        h2: h.tagName,
        size: getComputedStyle(h).fontSize,
        btn: getComputedStyle(a).fontSize,
        btnH: +a.getBoundingClientRect().height.toFixed(1),
        gap: +(tabs[1].left - tabs[0].right).toFixed(1),
        headings: [...document.querySelectorAll('h1,h2,h3')].map((e) => e.tagName),
      };
    });
    assert.equal(r.h2, 'H2');
    assert.ok(Math.abs(parseFloat(r.size) - 36) < 0.1, `the live heading is 36px on a 14px page, got ${r.size}`);
    assert.ok(Math.abs(parseFloat(r.btn) - 18) < 0.1, `the live button is 18px, got ${r.btn}`);
    assert.ok(Math.abs(r.btnH - 44) < 1.5, `the live button is 44px tall, got ${r.btnH}`);
    assert.ok(Math.abs(r.gap - 31) < 1, `31px between tabs on the host, got ${r.gap}`);
    // Only the pattern's own heading: the slides carry names, never headings,
    // so the snippet adds exactly one level to the host page's outline.
    assert.deepEqual(r.headings, ['H2']);
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
    const brand = await currentBrand(page);
    assert.equal(brand, 'chevrolet');
    const tabs = await page.evaluate(() => [...globalThis.CARGO.sdoc().querySelectorAll('.cargo-tabs [role="tab"]')].map((t) => t.textContent.trim()));
    assert.deepEqual(tabs, ['Trucks', 'Electric', 'Crossovers/SUVs', 'Performance', 'Commercial']);
    assert.deepEqual(errors, []);
  });
});

test.describe('the variant strip above the stage', () => {
  const chips = (page) => page.evaluate(() => [...document.querySelectorAll('#wb-variants button')].map((b) => [b.dataset.brand, b.getAttribute('aria-pressed')]));

  test('hidden where no brand has anything to give, shown with Default plus the brands on tabs', async () => {
    await pick(page, 'logostrip');
    assert.equal(await page.evaluate(() => document.getElementById('wb-variants').hidden), true);
    await pick(page, 'tabs');
    assert.equal(await page.evaluate(() => document.getElementById('wb-variants').hidden), false);
    const c = await chips(page);
    assert.equal(c[0][0], '');
    assert.ok(c.some(([b]) => b === 'chevrolet'));
    assert.ok(c.some(([b]) => b === 'toyota'));
  });

  test('shown on a cutout card with nothing measured: Default plus the select, no chips', async () => {
    await pick(page, 'cards');
    assert.equal(await page.evaluate(() => document.getElementById('wb-variants').hidden), false, 'a cutout card takes every brand, even with nothing measured');
    const c = await chips(page);
    assert.deepEqual(
      c.map(([b]) => b),
      [''],
      'only the Default chip should be drawn - no brand is measured for cards',
    );
    const optCount = await page.locator('#wb-brand option:not([value=""])').count();
    assert.ok(optCount >= 30, `expected every brand in the select, got ${optCount}`);
  });

  test('a chip applies the brand, and the strip agrees with itself', async () => {
    await pick(page, 'tabs');
    await selectBrand(page, '');
    await page.click('#wb-variants button[data-brand="chevrolet"]');
    await page.waitForTimeout(250);
    assert.equal((await tabStyles(page)).line, 'rgb(0, 109, 199)');
    assert.equal(await currentBrand(page), 'chevrolet');
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

  test('no chip is pressed when a roster-only brand is picked from the select', async () => {
    await pick(page, 'modelbar');
    await selectBrand(page, 'kia');
    const pressedCount = (await chips(page)).filter(([, p]) => p === 'true').length;
    assert.equal(pressedCount, 0, `chips: ${JSON.stringify(await chips(page))}`);
    assert.equal(await page.locator('#wb-brand').inputValue(), 'kia');
  });

  test('patternsOf mirrors variantsOf', async () => {
    const ok = await page.evaluate(() => {
      const { PATTERNS, BRANDS, variantsOf, patternsOf } = globalThis.CARGO;
      return Object.keys(BRANDS).every((b) => patternsOf(b).every((p) => variantsOf(p).includes(b))) && Object.keys(PATTERNS).every((p) => variantsOf(p).every((b) => patternsOf(b).includes(p)));
    });
    assert.equal(ok, true);
  });
});

// A measured brand may name the typeface its sites load (brands.js `font`).
// The preview wears it so the bar is judged in the font it will have on the
// page; the copied code never names it, because the page already loads it and
// the snippet is not the place to load it twice. Spec addendum 2026-09-14.
test.describe('a brand font reaches the preview and never the code', () => {
  const frameFont = (page) =>
    page.evaluate(() => {
      const d = globalThis.CARGO.sdoc();
      return {
        body: d.defaultView.getComputedStyle(d.body).fontFamily,
        tab: d.defaultView.getComputedStyle(d.querySelector('.cargo-tabs [role="tab"]')).fontFamily,
        link: d.getElementById('wb-live-font')?.getAttribute('href') ?? null,
      };
    });

  test('Chevrolet shows in ChevySans, Default goes back to the frame font, the snippet is font-free', async () => {
    await pick(page, 'tabs');
    await selectBrand(page, 'chevrolet');
    const on = await frameFont(page);
    assert.match(on.body, /^ChevySans/);
    assert.match(on.tab, /^ChevySans/, 'the tab labels inherit the brand font');
    assert.equal(on.link, 'https://cdn.dealeron.com/assets/fonts/chevy-sans/fonts.min.css');
    const { css, html, js } = await copyParts(page);
    for (const [what, text] of Object.entries({ css, html, js })) {
      assert.doesNotMatch(text, /ChevySans|font-family|@import|fonts\.min\.css/i, `${what} must not carry the preview font`);
    }
    const note = await page.evaluate(() => document.querySelector('#wb-variants .wb-brand-note')?.textContent ?? '');
    assert.match(note, /Shown in ChevySans/, 'the strip says the font is borrowed');
    await selectBrand(page, '');
    const off = await frameFont(page);
    assert.match(off.body, /^Arial/);
    assert.equal(off.link, null, 'no brand, no font stylesheet in the frame');
    assert.deepEqual(errors, []);
  });
});

// A spectrum drag used to cost ~9 ms of script plus a paint per event - the
// highlighted code box was rewritten and the parent page laid out for every
// pointer move - so the picker crawled. Mid-drag events (Tweakpane's
// `last: false`) now restyle the frame at once and settle the rest once the
// drag pauses; a final commit still publishes synchronously.
test.describe('a colour drag restyles the frame now and the code panel when it pauses', () => {
  test('input events reach the preview at once and the panel catches up', async () => {
    await pick(page, 'tabs');
    await selectBrand(page, '');
    const row = rowByLabel(page, 'Rule under the tabs');
    await row.locator('.tp-colv_sw').click();
    const r = await page.evaluate(() => {
      const row = [...document.querySelectorAll('#wb-settings .tp-lblv')].find((r) => r.querySelector('.tp-lblv_l')?.textContent.trim() === 'Rule under the tabs');
      const native = row.querySelector('input[type="color"]');
      const d = globalThis.CARGO.sdoc();
      const rule = () => d.defaultView.getComputedStyle(d.querySelector('.cargo-tabs')).borderBottomColor;
      const code = () => document.getElementById('wb-code').textContent;
      const out = [];
      for (const hex of ['#ff0000', '#00ff00', '#0000ff']) {
        native.value = hex;
        native.dispatchEvent(new Event('input', { bubbles: true }));
        out.push({ hex, frame: rule(), panelHasIt: code().includes(hex) });
      }
      return out;
    });
    assert.equal(r[0].frame, 'rgb(255, 0, 0)', 'the frame follows the first input synchronously');
    assert.equal(r[2].frame, 'rgb(0, 0, 255)', 'and the last');
    assert.equal(r[2].panelHasIt, false, 'the code panel is not rewritten mid-drag');
    await page.waitForFunction(() => document.getElementById('wb-code').textContent.includes('#0000ff'), null, { timeout: 2000 });
    // A release commits synchronously: the panel is right before the next read.
    const final = await page.evaluate(() => {
      const row = [...document.querySelectorAll('#wb-settings .tp-lblv')].find((r) => r.querySelector('.tp-lblv_l')?.textContent.trim() === 'Rule under the tabs');
      const native = row.querySelector('input[type="color"]');
      native.value = '#123456';
      native.dispatchEvent(new Event('change', { bubbles: true }));
      return document.getElementById('wb-code').textContent.includes('#123456');
    });
    assert.equal(final, true);
    const { css } = await copyParts(page);
    assert.match(css, /--tab-rule: #123456;/);
    assert.deepEqual(errors, []);
  });
});
