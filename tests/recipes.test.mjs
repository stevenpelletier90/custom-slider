// F056: size and the four arrow colours are knobs; shape, position, hiding and
// the glyph are recipes on the Reference page. A recipe is a promise made to
// someone who cannot easily tell whether it worked, so each one is applied here
// to a real pasted slider and measured. These fail if the engine's own arrow
// rules change out from under them.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { serve, launch, openBuilder, pick, copyParts, hostHtml, engineFiles } from './helpers.mjs';

let server, browser, page, host, engine, snippet, recipes;

before(async () => {
  server = await serve();
  browser = await launch();
  ({ page } = await openBuilder(browser, server.origin, 1500));
  engine = await engineFiles(server.origin);
  recipes = await page.evaluate(() => globalThis.CARGO.guide.ARROW_RECIPES);
  // A card strip with arrows over the cards, which is what the recipes restyle.
  await pick(page, 'cards');
  await page.click('.ui-widths button[data-w="1200"]');
  await page.waitForTimeout(120);
  snippet = await copyParts(page);
  host = await browser.newPage();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

// Renders the snippet with one recipe appended, exactly as a designer would
// paste it: their own CSS after the engine's, in Style Only.
const withRecipe = async (css) => {
  await host.setContent(hostHtml({ ...engine, css: `${snippet.css}\n${css.replace(/my-slider/g, snippet.css.match(/^\.([\w-]+)\.cs/m)?.[1] ?? 'my-slider')}`, html: snippet.html, js: snippet.js }), {
    waitUntil: 'load',
  });
  await host.waitForTimeout(250);
};

const arrow = (sel = '.cs-arrow--prev') =>
  host.evaluate((s) => {
    const a = document.querySelector(s);
    if (!a) return null;
    const r = a.getBoundingClientRect();
    const cs = getComputedStyle(a);
    const track = document.querySelector('.cs-track').getBoundingClientRect();
    return {
      w: +r.width.toFixed(1),
      h: +r.height.toFixed(1),
      radius: cs.borderTopLeftRadius,
      display: cs.display,
      left: +(r.left - track.left).toFixed(1),
      glyph: getComputedStyle(a, '::before').content,
      svg: !!a.querySelector('svg') && getComputedStyle(a.querySelector('svg')).display,
      trackH: +track.height.toFixed(1),
    };
  }, sel);

describe('every arrow recipe the Reference publishes still works', () => {
  test('the list is not empty and every entry is a name and some CSS', () => {
    assert.ok(Array.isArray(recipes) && recipes.length >= 5, 'the recipe list is missing or too short');
    for (const [name, css] of recipes) {
      assert.ok(name && typeof name === 'string', 'a recipe has no name');
      assert.match(css, /\.my-slider/, `"${name}" is not scoped to the slider's own name`);
    }
  });

  test('the arrow is round and over the cards before any recipe', async () => {
    await withRecipe('');
    const a = await arrow();
    assert.equal(a.radius, '50%', `the engine arrow is no longer round (${a.radius})`);
    assert.ok(a.h < a.trackH, 'the engine arrow is already full height, so one recipe below proves nothing');
  });

  test('square, not round', async () => {
    await withRecipe(recipes.find(([n]) => /square/i.test(n))[1]);
    assert.equal((await arrow()).radius, '0px', 'the arrow is still round');
  });

  test('hidden on phones', async () => {
    const css = recipes.find(([n]) => /phone/i.test(n))[1];
    await host.setViewportSize({ width: 400, height: 800 });
    await withRecipe(css);
    assert.equal((await arrow()).display, 'none', 'the arrow is still drawn on a phone');
    await host.setViewportSize({ width: 1280, height: 900 });
    await withRecipe(css);
    assert.notEqual((await arrow()).display, 'none', 'the arrow is hidden on a desktop too');
  });

  // The arrow is positioned against the root, which is taller than the cards by
  // the strip reserved for the dots. A recipe saying `block-size: 100%` puts it
  // over them - measured 360.1px against a 325px row - so the published one
  // subtracts that strip.
  test('a full-height hit area, and not over the dots', async () => {
    await withRecipe(recipes.find(([n]) => /full-height/i.test(n))[1]);
    const a = await arrow();
    assert.ok(Math.abs(a.h - a.trackH) <= 1, `the arrow is ${a.h}px against a ${a.trackH}px row of cards`);
    const overlapsDots = await host.evaluate(() => {
      const d = document.querySelector('.cs-dots');
      const a2 = document.querySelector('.cs-arrow--prev');
      if (!d || !a2 || d.hidden) return false;
      const dr = d.getBoundingClientRect();
      const ar = a2.getBoundingClientRect();
      return ar.bottom > dr.top + 1;
    });
    assert.equal(overlapsDots, false, 'the full-height arrow reaches down over the dots');
  });

  test('outside the cards rather than over them', async () => {
    const plain = (await withRecipe(''), await arrow()).left;
    await withRecipe(recipes.find(([n]) => /outside/i.test(n))[1]);
    const moved = (await arrow()).left;
    assert.ok(moved < plain, `the arrow did not move outwards: ${plain} -> ${moved}`);
    assert.ok(moved <= -40, `the arrow sits at ${moved}px, still over the cards`);
  });

  test('a glyph of your own', async () => {
    await withRecipe(recipes.find(([n]) => /glyph/i.test(n))[1]);
    const a = await arrow();
    assert.equal(a.svg, 'none', 'the built-in chevron is still drawn');
    assert.match(a.glyph, /‹/, `the replacement glyph is not there (${a.glyph})`);
    const next = await arrow('.cs-arrow--next');
    assert.match(next.glyph, /›/, `the next arrow got the wrong glyph (${next.glyph})`);
  });
});

// F098: a visible "3 / 12" counter is the hidden status region unhidden, which
// is a recipe rather than a feature - but only if all five declarations that
// .cs-sr-only sets are actually undone. Leave clip-path in and the text takes
// up space while being clipped to nothing, which reads as the recipe failing.
describe('the visible counter recipe the Reference publishes', () => {
  const counter = () =>
    host.evaluate(() => {
      const s = document.querySelector('.cs-status');
      if (!s) return null;
      const r = s.getBoundingClientRect();
      const cs = getComputedStyle(s);
      return { w: +r.width.toFixed(1), h: +r.height.toFixed(1), text: s.textContent, clip: cs.clipPath, position: cs.position };
    });

  test('hidden by default, and readable once the recipe is applied', async () => {
    await withRecipe('');
    const before = await counter();
    assert.ok(before.w <= 1 && before.h <= 1, `the status region is already visible (${before.w}x${before.h})`);

    const css = await page.evaluate(() => globalThis.CARGO.guide.COUNTER_CSS);
    await withRecipe(css);
    const after = await counter();
    assert.equal(after.clip, 'none', 'clip-path is still cutting the text away');
    assert.ok(after.w > 20 && after.h > 8, `the counter is still not readable (${after.w}x${after.h})`);
    assert.match(after.text, /\d/, `the counter has no number in it (${after.text})`);
  });

  // The wording half. The recipe is only useful with the attribute, so the two
  // are checked together on the same pasted slider.
  test('the attribute re-words it, and it keeps counting after a move', async () => {
    const css = await page.evaluate(() => globalThis.CARGO.guide.COUNTER_CSS);
    const named = snippet.css.match(/^\.([\w-]+)\.cs/m)?.[1] ?? 'my-slider';
    const html = snippet.html.replace('<div', '<div data-cs-label-status-single="{n} / {total}" data-cs-label-status-multi="{from}\u2013{to} / {total}"');
    await host.setContent(hostHtml({ ...engine, css: `${snippet.css}\n${css.replace(/my-slider/g, named)}`, html, js: snippet.js }), { waitUntil: 'load' });
    await host.waitForTimeout(250);

    const first = (await counter()).text;
    assert.doesNotMatch(first, /Slide/i, `the wording attribute was ignored (${first})`);
    assert.match(first, /^\s*1( ?[\u2013-] ?\d)? \/ \d+\s*$/, `unexpected counter text (${first})`);

    await host.click('.cs-arrow--next');
    await host.waitForTimeout(700);
    const second = (await counter()).text;
    assert.notEqual(second, first, 'the counter did not move with the slider');
    assert.match(second, /\//, `the second reading lost the wording (${second})`);
  });
});

// An arrow moves the pictures, so it belongs level with them. The engine
// centres on the card, which on a photo-over-text card is below the middle of
// the photo - measured, 62px on the location card and 167px on the two-row
// grid, where it stopped overlapping the image at all.
//
// The engine cannot find the image itself (cs-* is mechanism, cargo-* is
// content), so --cs-arrow-at is the card style's to set and this checks the
// RESULT rather than the numbers: every visible arrow level with the picture
// beside it, whatever it was set to.
describe('the arrows sit level with the pictures they move', () => {
  test('every pattern and every card style on the catalogue', async () => {
    const cat = await browser.newPage();
    await cat.goto(`${server.origin}/demo/patterns.html`, { waitUntil: 'load' });
    await cat.waitForTimeout(1600);

    const rows = await cat.evaluate(() => {
      const out = [];
      for (const sec of document.querySelectorAll('.gx-card')) {
        const arrow = sec.querySelector('.cs-arrow--prev');
        const img = sec.querySelector('.cs-slide img');
        if (!arrow || !img) continue;
        const a = arrow.getBoundingClientRect();
        const i = img.getBoundingClientRect();
        // A slider whose slides all fit hides its arrows: a zero-height rect is
        // nothing to measure, not a failure.
        if (!a.height || !i.height) continue;
        out.push({ id: sec.id, off: Math.round(a.top + a.height / 2 - (i.top + i.height / 2)), imgH: Math.round(i.height) });
      }
      return out;
    });
    await cat.close();

    assert.ok(rows.length >= 15, `only ${rows.length} sliders had both an arrow and an image to measure`);
    // 12px of slack: the fraction is a fraction, and a card whose text wraps an
    // extra line moves its picture by a few pixels either way.
    const off = rows.filter((r) => Math.abs(r.off) > 12);
    assert.deepEqual(
      off.map((r) => `${r.id} ${r.off > 0 ? '+' : ''}${r.off}px`),
      [],
      'these arrows are not level with their picture',
    );
  });

  // The default has to stay what it was, or every hand-written slider that
  // never heard of this property moves.
  test('a slider that sets nothing is still centred on the card', async () => {
    const host = await browser.newPage();
    const engine = await engineFiles(server.origin);
    await host.setContent(
      hostHtml({
        ...engine,
        html: `<div class="cs" data-cs aria-label="T" style="--cs-per-view:1"><ul class="cs-track">${[1, 2, 3].map(() => '<li class="cs-slide"><div style="height:200px"></div></li>').join('')}</ul></div>`,
      }),
      { waitUntil: 'load' },
    );
    await host.waitForTimeout(200);
    const r = await host.evaluate(() => {
      const root = document.querySelector('#box .cs');
      const slide = root.querySelector('.cs-slide');
      const arrow = root.querySelector('.cs-arrow--prev');
      const a = arrow.getBoundingClientRect();
      const s = slide.getBoundingClientRect();
      return Math.round(a.top + a.height / 2 - (s.top + s.height / 2));
    });
    await host.close();
    assert.ok(Math.abs(r) <= 1, `the default moved: ${r}px off the card's centre`);
  });
});

