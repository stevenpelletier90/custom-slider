// F043: the hero offered "How many across", "Arrows move" and "Gap", which the
// crossfade ignores - and they were not merely inert. data-cs-fade-on is set by
// JS at init, so until the script runs the column classes are in charge: a hero
// authored three across laid out as a three-across strip and jumped a whole
// image height on init, which is also what a no-JS visitor was left with.
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { openBuilder, pick, copyParts, hostHtml, engineFiles } from './helpers.mjs';

test.describe.configure({ mode: 'serial' });

let ctx, page, host, errors, engine;

test.beforeAll(async ({ browser }) => {
  ({ ctx, page, errors } = await openBuilder(browser, 1500));
  host = await ctx.newPage();
  host.on('pageerror', (e) => errors.push(`host: ${e.message}`));
  engine = await engineFiles();
});

test.describe('a fading hero is one across before the script runs', () => {
  test('authoring it three across shifts nothing on init', async () => {
    await pick(page, 'hero');
    for (const label of ['Phone · under 768', 'Tablet · 768+', 'Laptop · 992+', 'Desktop · 1200+']) {
      const f = page.locator(`#wb-settings label:has(> span:text-is("${label}")) input`).first();
      if (await f.count()) {
        await f.fill('3');
        await page.waitForTimeout(60);
      }
    }
    const p = await copyParts(page);

    // No engine JS yet: this is what the page looks like before init, and what
    // a visitor with JavaScript off keeps looking at.
    await host.setContent(hostHtml({ ...engine, engineJs: '', css: p.css, html: p.html, box: 1170 }), { waitUntil: 'load' });
    await host.waitForTimeout(150);
    const pre = await host.evaluate(() => {
      const root = document.querySelector('#box .cs');
      return {
        perView: getComputedStyle(root).getPropertyValue('--cs-per-view').trim(),
        cls: root.className,
        height: +root.getBoundingClientRect().height.toFixed(1),
      };
    });
    assert.equal(pre.perView, '1', 'the engine does not pin a fading carousel to one across before init');
    assert.match(pre.cls, /cs-xs-3/, 'the ladder class is gone, so this test is no longer measuring what it thinks');

    await host.addScriptTag({ content: engine.engineJs });
    await host.waitForTimeout(250);
    const post = await host.evaluate(() => +document.querySelector('#box .cs').getBoundingClientRect().height.toFixed(1));
    assert.ok(Math.abs(post - pre.height) <= 1, `the hero jumped ${pre.height} -> ${post} on init`);
  });

  // A guard rather than a proof: this passes today and exists so that a later
  // "simplification" to `.cs[data-cs-fade]` cannot silently pin a strip that
  // has explicitly opted OUT of fading, which would cost it its column classes
  // and make it announce "Slide 1 of 3".
  test('data-cs-fade="false" keeps its column classes', async () => {
    await host.setContent(
      hostHtml({
        ...engine,
        engineJs: '',
        html: '<div class="cs cs-xs-3" data-cs data-cs-fade="false" aria-label="t"><ul class="cs-track"><li class="cs-slide">a</li><li class="cs-slide">b</li><li class="cs-slide">c</li></ul></div>',
        box: 1170,
      }),
      { waitUntil: 'load' },
    );
    await host.waitForTimeout(120);
    const perView = await host.evaluate(() => getComputedStyle(document.querySelector('#box .cs')).getPropertyValue('--cs-per-view').trim());
    assert.equal(perView, '3', 'opting out of fade lost the column class');
  });
});

test.describe('the panel says which controls the crossfade ignores', () => {
  const rowLabel = (page, text) =>
    page.evaluate((t) => {
      const row = [...document.querySelectorAll('#wb-settings label.wb-row')].find((r) => r.querySelector('span')?.textContent.trim().startsWith(t));
      return row ? row.querySelector('span').textContent.trim() : null;
    }, text);

  test('the hero is annotated and the model bar is not', async () => {
    await pick(page, 'hero');
    const note = await page.evaluate(() => [...document.querySelectorAll('#wb-settings p.wb-note')].map((n) => n.textContent).join(' '));
    assert.match(note, /crossfade/i, 'nothing in the panel says the crossfade ignores the count');
    assert.equal(await rowLabel(page, 'Gap'), 'Gap (a crossfade has no gap)');
    assert.equal(await rowLabel(page, 'Arrows move'), 'Arrows move (a crossfade always moves 1)');

    await pick(page, 'modelbar');
    assert.equal(await rowLabel(page, 'Gap'), 'Gap', 'the fade note leaked onto a pattern that does not fade');
    assert.equal(await rowLabel(page, 'Arrows move'), 'Arrows move', 'the fade label leaked onto a pattern that does not fade');
  });
});

test.describe('nothing threw', () => {
  test('no page errors', () => {
    assert.deepEqual(errors, []);
  });
});
