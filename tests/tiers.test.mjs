// The Bootstrap 5 tiers (2026-09-15, Steven: "we need to move away from
// Bootstrap 3 breakpoints in favor of BS5 media query breakpoints").
//
// What is held: the four old column classes keep their names and numbers (a
// frozen part of the markup contract), two new tiers exist under names that
// say their width, an untouched slider ships exactly the classes it did
// before, a rung set on a new tier reaches the copied markup and the preview,
// and the builder's grid toggle changes the container the preview draws in and
// survives a reload. The tabbed bar's phone knobs sit at 576, where Cadillac's
// live bar switches, so a 576-767 window keeps the tablet values.
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { openBuilder, pick, copyParts, engineFiles, hostHtml, stageReady } from './helpers.mjs';

test.describe.configure({ mode: 'serial' });

// The brand strip above the stage, as variants.test.mjs drives it.
const selectBrand = async (page, id) => {
  await page.locator(`#wb-variants button[data-brand="${id}"]`).click();
  await page.waitForTimeout(300);
};

let browser, page;

test.beforeAll(async ({ browser: b }) => {
  browser = b;
  ({ page } = await openBuilder(b, 1600));
});

test.describe('the column classes', () => {
  test('the stylesheet ships all six tiers, the old four under their old names and numbers', async () => {
    // The shipped file, where a media block is one run of text: a class is
    // inside its tier if it appears between that min-width and the next `@`.
    const css = await readFile('dist/custom-slider.min.css', 'utf8');
    const inTier = (bp, cls, n) => new RegExp(`min-width:\\s*${bp}px\\)\\{[^@]*\\.${cls}\\{--cs-per-view:\\s*${n}\\}`).test(css);
    // Bootstrap 3's names at Bootstrap 3's numbers, frozen.
    assert.match(css, /\.cs-xs-2\{--cs-per-view:\s*2\}/);
    assert.ok(inTier(768, 'cs-sm-3', 3), 'cs-sm-3 is not at 768');
    assert.ok(inTier(992, 'cs-md-4', 4), 'cs-md-4 is not at 992');
    assert.ok(inTier(1200, 'cs-lg-5', 5), 'cs-lg-5 is not at 1200');
    // The two Bootstrap 5 tiers, named by width.
    assert.ok(inTier(576, 'cs-576-2', 2), 'cs-576-2 is not at 576');
    assert.ok(inTier(1400, 'cs-1400-6', 6), 'cs-1400-6 is not at 1400');
    // Never Bootstrap 5's letters, which would mean a different width here.
    assert.doesNotMatch(css, /\.cs-xl-|\.cs-xxl-/, 'a second alphabet on the same element');
  });

  test('an untouched pattern ships the classes it always did, and no new ones', async () => {
    await pick(page, 'modelbar');
    const { html } = await copyParts(page);
    const cls = html.match(/class="[^"]*\bcs\b[^"]*"/)[0];
    assert.doesNotMatch(cls, /cs-576-|cs-1400-/, `a new tier's class appeared on a slider nobody set it on: ${cls}`);
    assert.match(cls, /cs-xs-2 cs-sm-3 cs-md-4 cs-lg-5/);
  });

  test('a rung set on the 576 tier reaches the copied markup and the preview honours it', async () => {
    await pick(page, 'modelbar');
    const row = page.locator('#wb-settings .tp-lblv:has(.tp-lblv_l:text-is("Wide phone · 576+"))').first();
    const input = row.locator('input').first();
    await input.fill('3');
    await input.press('Enter');
    await page.waitForTimeout(400);
    const { html } = await copyParts(page);
    assert.match(html.match(/class="[^"]*\bcs\b[^"]*"/)[0], /cs-576-3 cs-md-4/, 'the 576 rung did not reach the markup (and sm-3 is now redundant, so it goes)');
    await page.click('.ui-widths button[data-w="576"]');
    await page.waitForTimeout(600);
    const perView = await page.evaluate(() => getComputedStyle(globalThis.CARGO.sdoc().querySelector('.cs')).getPropertyValue('--cs-per-view').trim());
    assert.equal(perView, '3', 'a 576px window did not draw the 576 rung');
    await page.click('.ui-widths button[data-w="390"]');
    await page.waitForTimeout(600);
    assert.equal(await page.evaluate(() => getComputedStyle(globalThis.CARGO.sdoc().querySelector('.cs')).getPropertyValue('--cs-per-view').trim()), '2', 'the phone rung stopped applying under 576');
    await page.click('.ui-widths button[data-w="1200"]');
  });
});

test.describe('the grid toggle', () => {
  test('Bootstrap 5 narrows the container at every tier and adds two, and Fill still fills', async () => {
    await pick(page, 'modelbar');
    const rootW = () => page.evaluate(() => Math.round(globalThis.CARGO.sdoc().getElementById('wb-live-root').getBoundingClientRect().width));
    const at = async (w) => {
      await page.click(`.ui-widths button[data-w="${w}"]`);
      await page.waitForTimeout(500);
      return rootW();
    };
    await page.selectOption('#ui-grid', 'bs3');
    await page.waitForTimeout(400);
    assert.deepEqual([await at(768), await at(1200), await at(1400)], [750, 1170, 1170], 'Bootstrap 3 containers');
    await page.selectOption('#ui-grid', 'bs5');
    await page.waitForTimeout(400);
    assert.deepEqual([await at(576), await at(768), await at(992), await at(1200), await at(1400)], [540, 720, 960, 1140, 1320], 'Bootstrap 5 containers');
    assert.ok((await at(0)) > 1320, 'Fill stopped filling under Bootstrap 5');
    assert.match(await page.getAttribute('.ui-widths button[data-w="1200"]', 'title'), /1140px \(Bootstrap 5\)/);
  });

  test('the grid survives a reload, like the width', async () => {
    await page.reload({ waitUntil: 'load' });
    await stageReady(page);
    assert.equal(await page.evaluate(() => document.getElementById('ui-grid').value), 'bs5');
    assert.equal(await page.evaluate(() => globalThis.CARGO.sdoc().documentElement.dataset.grid), 'bs5');
    await page.selectOption('#ui-grid', 'bs3');
    await page.click('.ui-widths button[data-w="1200"]');
    await page.waitForTimeout(300);
  });
});

test.describe("the tabbed bar's phone tier is 576", () => {
  test('Cadillac keeps 18px tabs and the divider in a 700px window, and drops both at 390', async () => {
    await pick(page, 'tabs');
    await selectBrand(page, 'cadillac');
    const parts = await copyParts(page);
    const engine = await engineFiles();
    const theme = await page.evaluate(() => globalThis.CARGO.BRANDS.cadillac.theme);
    const read = async (width) => {
      const host = await browser.newPage({ viewport: { width, height: 800 } });
      await host.setContent(hostHtml({ ...engine, css: parts.css, html: parts.html, js: parts.js, theme, box: width - 30 }), { waitUntil: 'load' });
      const r = await host.evaluate(() => {
        const t = document.querySelectorAll('.cargo-tabs [role="tab"]')[1];
        return { size: parseFloat(getComputedStyle(t).fontSize), divider: getComputedStyle(t, '::before').content };
      });
      await host.close();
      return r;
    };
    const wide = await read(700);
    assert.ok(Math.abs(wide.size - 18) < 0.1, `a 700px window is not a phone: tabs should be 18px, got ${wide.size}`);
    assert.equal(wide.divider, '"|"');
    const phone = await read(390);
    assert.ok(Math.abs(phone.size - 16) < 0.1, `under 576 the tabs drop to 16px, got ${phone.size}`);
    assert.equal(phone.divider, 'none');
  });
});
