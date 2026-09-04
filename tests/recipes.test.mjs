// F056: size and the four arrow colours are knobs; shape, position, hiding and
// the glyph are recipes on the Reference page. A recipe is a promise made to
// someone who cannot easily tell whether it worked, so each one is applied here
// to a real pasted slider and measured. These fail if the engine's own arrow
// rules change out from under them.
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { openBuilder, pick, copyParts, hostHtml, engineFiles } from './helpers.mjs';

test.describe.configure({ mode: 'serial' });

let page, host, engine, snippet, recipes;

test.beforeAll(async ({ browser }) => {
  ({ page } = await openBuilder(browser, 1500));
  engine = await engineFiles();
  recipes = await page.evaluate(() => globalThis.CARGO.guide.ARROW_RECIPES);
  // A card strip with arrows over the cards, which is what the recipes restyle.
  await pick(page, 'cards');
  await page.click('.ui-widths button[data-w="1200"]');
  await page.waitForTimeout(120);
  snippet = await copyParts(page);
  host = await browser.newPage();
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

test.describe('every arrow recipe the Reference publishes still works', () => {
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
test.describe('the visible counter recipe the Reference publishes', () => {
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

// Where the arrows sit is the slider's decision, not the engine's.
//
// They are centred on the CARD by default, which is the common convention and
// the steadier rule - it does not move when a card's text wraps a line. Level
// with the picture was built and then taken out again: on a photo-over-text
// card the card's middle is 62-167px below the picture's, which does look low,
// but no standards body prescribes either, the design systems that document it
// disagree, and the one thing they agree on is that an arrow has to stay
// legible over whatever is behind it - which argues against sitting it on the
// photograph at all.
//
// So what is guarded is the DEFAULT and the knob that changes it: a slider that
// sets nothing must not move, and the knob is what makes this a design decision
// per slider rather than a choice baked into the engine.
test.describe('where the arrows sit', () => {
  const centreOffset = (page, sel) =>
    page.evaluate((s) => {
      const root = document.querySelector(s);
      const slide = root.querySelector('.cs-slide');
      const arrow = root.querySelector('.cs-arrow--prev');
      const a = arrow.getBoundingClientRect();
      const b = slide.getBoundingClientRect();
      if (!a.height) return null;
      return Math.round(a.top + a.height / 2 - (b.top + b.height / 2));
    }, sel);

  const slider = (style = '') =>
    `<div class="cs" data-cs aria-label="T" style="--cs-per-view:1${style}"><ul class="cs-track">` +
    [1, 2, 3].map(() => '<li class="cs-slide"><div style="height:300px"></div></li>').join('') +
    '</ul></div>';

  test('a slider that sets nothing is centred on the card', async () => {
    const engine = await engineFiles();
    await host.setContent(hostHtml({ ...engine, html: slider() }), { waitUntil: 'load' });
    await host.waitForTimeout(200);
    const off = await centreOffset(host, '#box .cs');
    assert.ok(off !== null, 'no arrow to measure');
    assert.ok(Math.abs(off) <= 1, `the default moved: ${off}px off the card's centre`);
  });

  // The whole point of the knob: a slider whose cards are a picture over text
  // can lift the arrows to the picture without the engine knowing what a
  // picture is.
  test('--cs-arrow-at moves them, and 0.5 is exactly the old behaviour', async () => {
    const engine = await engineFiles();
    const at = async (v) => {
      await host.setContent(hostHtml({ ...engine, html: slider(v == null ? '' : `;--cs-arrow-at:${v}`) }), { waitUntil: 'load' });
      await host.waitForTimeout(200);
      return centreOffset(host, '#box .cs');
    };
    const none = await at(null);
    const half = await at('0.5');
    const quarter = await at('0.25');
    assert.equal(half, none, 'setting 0.5 by hand is not the same as setting nothing');
    assert.ok(quarter < none - 40, `0.25 did not lift the arrow: ${quarter} against ${none}`);
  });

  // The catalogue must not have picked the fraction up by accident: the looks
  // set it during the experiment and every one of those values came back out.
  test('no card style ships a fraction of its own', async () => {
    const set = await page.evaluate(() => {
      const { LOOKS, PATTERNS } = globalThis.CARGO;
      const hits = [];
      for (const [id, l] of Object.entries(LOOKS)) if (l.settings?.['--cs-arrow-at'] || /--cs-arrow-at/.test(l.css ?? '')) hits.push(`look ${id}`);
      for (const [id, p] of Object.entries(PATTERNS)) if (p.props?.['--cs-arrow-at'] || /--cs-arrow-at/.test(p.css ?? '')) hits.push(`pattern ${id}`);
      return hits;
    });
    assert.deepEqual(set, [], 'a card style still sets the arrow fraction');
  });
});
