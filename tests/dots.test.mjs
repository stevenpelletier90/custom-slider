// F040: hiding the dots left the height reserved for them standing as blank
// page - 30px on the hero, 45px on Tall photos, 37.5px on a pattern shipping no
// value - and ticking them back on handed over the engine's 2.5em instead of
// the value the pattern actually had.
//
// Three shapes of the same bug, so three patterns: one shipping its own strip,
// one shipping none, one shipping the collapse already.
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { openBuilder, pick, switchRow, hostHtml, engineFiles } from './helpers.mjs';

test.describe.configure({ mode: 'serial' });

let page, errors;

test.beforeAll(async ({ browser }) => {
  ({ page, errors } = await openBuilder(browser, 1500));
});

const strip = (page) =>
  page.evaluate(() => {
    const root = globalThis.CARGO.sdoc().querySelector('.cs');
    const track = root.querySelector('.cs-track').getBoundingClientRect();
    return {
      space: getComputedStyle(root).getPropertyValue('--cs-controls-space').trim(),
      below: +(root.getBoundingClientRect().bottom - track.bottom).toFixed(1),
      code: document.getElementById('wb-code').textContent,
      parts: document.getElementById('wb-parts').textContent,
    };
  });

test.describe('the dot row is taken away and given back unchanged', () => {
  for (const [id, space] of [
    ['hero', '2em'],
    ['cards', '2.5em'],
    ['modelbar', '0.1px'],
  ]) {
    test(`Show dots on ${id}`, async () => {
      await pick(page, id);
      // A lazy locator: buildPanel() replaces the row on every toggle, so an
      // element handle cached here would be detached by the second click.
      const box = switchRow(page, 'Show dots');
      const started = await box.isChecked();
      const before = await strip(page);
      assert.equal(before.space, space, `${id} no longer opens at ${space} — pick a pattern that does`);

      if (started) {
        await box.click();
        await page.waitForTimeout(150);
      }
      const off = await strip(page);
      assert.ok(off.below <= 1, `hiding the dots left ${off.below}px of blank strip`);
      assert.match(off.code, /\.cs-dots \{ display: none; \}/, 'the snippet stopped hiding the dots');
      assert.match(off.code, /--cs-controls-space: 0\.1px;/, 'the snippet does not collapse the reserved strip');
      assert.equal((off.code.match(/--cs-controls-space:/g) || []).length, 1, 'the controls space is declared more than once');
      assert.match(off.parts, /Dot row/, 'the parts list does not name the collapsed reservation');

      await box.click();
      await page.waitForTimeout(150);
      const back = await strip(page);
      assert.doesNotMatch(back.parts, /Dot row/, 'the parts list still names a row that is back');
      if (started) {
        assert.equal(back.space, before.space, `re-ticking rewrote the strip to ${back.space}`);
        assert.equal(back.below, before.below, 'the strip did not come back the height it was');
      }
    });
  }
});

// Windows High Contrast forces every background to the canvas colour. A dot is
// nothing but a background, so both system themes painted the whole row in the
// page colour and the slider lost its only position indicator - invisible, and
// invisible in a way scripts/a11y.mjs structurally cannot catch, because it
// reads computed style outside forced-colors emulation. Hence a test and not an
// audit rule (2026-09-15).
test.describe('the dots survive Windows High Contrast', () => {
  test.use({ forcedColors: 'active' });

  test('a dot and the current dot are painted, and are not the same colour', async ({ page }) => {
    const { engineCss, engineJs } = await engineFiles();
    await page.setContent(
      hostHtml({
        engineCss,
        engineJs,
        css: '.cs{--cs-per-view:1}',
        html: `<div class="cs" data-cs aria-label="HCM"><div class="cs-track">${[1, 2, 3].map((n) => `<div class="cs-slide"><p>Slide ${n}</p></div>`).join('')}</div></div>`,
        box: 1170,
      }),
      { waitUntil: 'load' },
    );
    await page.waitForTimeout(400);

    const seen = await page.evaluate(() => {
      const dot = document.querySelector('.cs-dot:not(.cs-dot--current)');
      const cur = document.querySelector('.cs-dot--current');
      if (!dot || !cur) return { error: 'no dot row' };
      const bg = (el) => getComputedStyle(el, '::after').backgroundColor;
      return { dot: bg(dot), current: bg(cur), canvas: getComputedStyle(document.body).backgroundColor };
    });

    assert.ok(!seen.error, seen.error);
    // The exact system colours differ per theme, so assert the RELATIONSHIPS
    // that have to hold rather than a value: a dot is not the page, and the
    // current dot is not an ordinary one.
    assert.notEqual(seen.dot, seen.canvas, 'a dot is painted in the canvas colour — the row is invisible in High Contrast');
    assert.notEqual(seen.current, seen.canvas, 'the current dot is painted in the canvas colour');
    assert.notEqual(seen.dot, seen.current, 'the current dot is indistinguishable from the rest in High Contrast');
  });
});

test.describe('nothing threw', () => {
  test('no page errors', () => {
    assert.deepEqual(errors, []);
  });
});
