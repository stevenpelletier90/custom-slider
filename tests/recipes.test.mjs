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
  await page.click('.ui-widths button[data-w="1170"]');
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
