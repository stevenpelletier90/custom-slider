// The engine's own contract, on authored markup — not through the demo.
//
// Every other file here tests the BUILDER: what the copy panel hands over and
// whether it lays itself out. This one tests the thing a dealer page actually
// links, driven the way a dealer page drives it — hand-written markup, the two
// shipped files, no workbench in the middle.
//
// Most of it was checklist items in README "Verification checklist", carried
// out by hand each time or, more honestly, not carried out. Items 3, 4, 6 and 7
// are here now: keyboard order, autoplay and reduced motion, JavaScript off,
// and the fits state. A checklist step nobody runs is not a check, which is the
// same argument that grew the rest of this suite.
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { hostHtml, engineFiles } from './helpers.mjs';

test.describe.configure({ mode: 'serial' });

let engine;

test.beforeAll(async () => {
  engine = await engineFiles();
});

const slides = (n) => Array.from({ length: n }, (_, i) => `<li class="cs-slide"><a class="cargo-name" href="#m${i}">Model ${i + 1}</a></li>`).join('');

const slider = (n, attrs = '') => `<div class="cs" data-cs aria-label="Models" ${attrs}><ul class="cs-track">${slides(n)}</ul></div>`;

// One slider on a hostile host, per-view pinned so "does it fit" is decidable.
const build = (n, perView, attrs = '', extra = {}) => hostHtml({ ...engine, css: `.cs{--cs-per-view:${perView}}`, html: slider(n, attrs), box: 1170, ...extra });

test.describe('what the page gets with no JavaScript', () => {
  // README checklist 6. The CSS owns layout and physics precisely so the strip
  // works before any script runs; nothing here may depend on the engine having
  // loaded. Note there is no page.evaluate in this test: with JS disabled it
  // does not throw, it HANGS, so everything is read through Playwright.
  test('the strip still scrolls and every slide is there', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1170, height: 800 } });
    const page = await ctx.newPage();
    await page.setContent(build(8, 4), { waitUntil: 'load' });
    await page.waitForTimeout(250);

    const n = await page.locator('.cs-slide').count();
    assert.equal(n, 8, 'slides are missing with JavaScript off');
    assert.equal(await page.locator('.cs-prev, .cs-next, .cs-dot, .cs-pause, .cs-arrow').count(), 0, 'controls were generated without JavaScript');

    const track = await page.locator('.cs-track').boundingBox();
    const boxes = [];
    for (let i = 0; i < n; i++) boxes.push(await page.locator('.cs-slide').nth(i).boundingBox());

    assert.equal(boxes.filter((b) => b && b.width > 10 && b.height > 10).length, n, 'a slide has no size with JavaScript off, so its content is unreachable');
    // The eighth card starts past the right edge of the track: the strip is a
    // scroller, not a clip, before any script touches it.
    assert.ok(boxes.at(-1).x > track.x + track.width, 'the last slide is not past the track edge, so the strip is not scrolling');
    await ctx.close();
  });
});

test.describe('when every slide already fits', () => {
  // README checklist 7. Controls that cannot move anything must not be
  // focusable - a Tab stop that does nothing is worse than no control.
  test('the controls go, and none of them is left in the tab order', async ({ page }) => {
    await page.setContent(build(8, 4), { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const before = await page.evaluate(() => ({
      fits: document.querySelector('.cs').hasAttribute('data-cs-fits'),
      reachable: [...document.querySelectorAll('.cs-arrow, .cs-dot, .cs-pause')].filter((c) => c.checkVisibility({ checkVisibilityCSS: true }) && c.tabIndex >= 0).length,
    }));
    assert.equal(before.fits, false, 'eight cards at four across is not meant to fit');
    assert.ok(before.reachable > 0, 'a strip that does not fit offers no controls at all');

    // Same slider, wide enough for all eight.
    await page.setContent(build(8, 8), { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => ({
      fits: document.querySelector('.cs').hasAttribute('data-cs-fits'),
      // checkVisibility, not getComputedStyle(el).display: the engine hides the
      // dots by putting [hidden] on their CONTAINER, and a child of a
      // display:none parent still reports its own display, so reading the dot
      // itself says "inline-block" for something nobody can see or reach.
      reachable: [...document.querySelectorAll('.cs-arrow, .cs-dot, .cs-pause')]
        .filter((c) => c.checkVisibility({ checkVisibilityCSS: true }) && !c.disabled && c.tabIndex >= 0)
        .map((c) => c.className),
    }));
    assert.equal(after.fits, true, 'eight cards at eight across did not set data-cs-fits');
    assert.deepEqual(after.reachable, [], `a control that cannot move anything is still focusable: ${after.reachable.join(', ')}`);
  });
});

test.describe('keyboard', () => {
  // README checklist 3. The order is the reading order of the controls, and
  // the cards come last: a keyboard user tabs past the controls into content,
  // never the other way round.
  test('tab order runs pause, prev, next, dots, then the cards', async ({ page }) => {
    await page.setContent(build(8, 4, 'data-cs-autoplay="4000"'), { waitUntil: 'load' });
    await page.waitForTimeout(400);
    await page.locator('body').press('Tab');

    const seen = [];
    for (let i = 0; i < 12; i++) {
      const here = await page.evaluate(() => {
        const a = document.activeElement;
        if (!a || a === document.body) return null;
        if (a.closest('.cs-slide')) return 'card';
        // Canonical labels. Prev and next are both `cs-arrow`, so they must be
        // told apart or the run-collapsing below merges them and a broken order
        // reads as a correct one. Dots go the other way: the first is
        // `cs-dot--current`, and keeping that distinct would report the single
        // run of dots as two separate stops.
        const cls = [...a.classList];
        if (cls.includes('cs-dot')) return 'cs-dot';
        if (cls.includes('cs-arrow')) return cls.find((c) => c.startsWith('cs-arrow--')) ?? 'cs-arrow';
        return cls.find((c) => c.startsWith('cs-')) ?? a.tagName.toLowerCase();
      });
      if (here === null) break;
      // Runs of dots and runs of cards collapse to one entry; the named
      // controls cannot, because each has its own label.
      if (seen.at(-1) !== here) seen.push(here);
      await page.keyboard.press('Tab');
    }

    const controls = seen.filter((s) => s !== 'card');
    const firstCard = seen.indexOf('card');
    assert.ok(firstCard > 0, `the cards are not reachable by Tab: saw ${seen.join(' -> ')}`);
    assert.deepEqual(controls, ['cs-pause', 'cs-arrow--prev', 'cs-arrow--next', 'cs-dot'], `tab order is ${seen.join(' -> ')}, not pause -> prev -> next -> dots -> cards`);
    assert.ok(
      seen.slice(firstCard).every((s) => s === 'card'),
      `a control comes after the first card: ${seen.join(' -> ')}`,
    );
  });
});

test.describe('autoplay', () => {
  // README checklist 4, the half a machine can answer. Hover and drag are left
  // to a person; focus, the button and reduced motion are not.
  test('focus stops it and the button starts it again', async ({ page }) => {
    await page.setContent(build(8, 4, 'data-cs-autoplay="300"'), { waitUntil: 'load' });
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => document.querySelector('.cs')._cs.rotating), true, 'autoplay never started');

    await page.locator('.cs-arrow--next').focus();
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => document.querySelector('.cs')._cs.rotating), false, 'focus inside the slider did not stop the rotation');
    // The name has to follow the state, or a screen reader offers to stop
    // something that already stopped.
    assert.match(await page.locator('.cs-pause').getAttribute('aria-label'), /^Start /, 'the stopped button does not offer to start');

    // Focus + Enter, not click(). The strip may still be settling from the last
    // autoplay tick, and click() waits for the element to be "stable" - which a
    // moving control never is, so the mouse path times out on a button that is
    // perfectly usable. The keyboard path is also the one that matters here:
    // this is the control a keyboard user reaches for to stop the motion.
    const pause = page.locator('.cs-pause');
    await pause.focus();
    await pause.press('Enter');
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(() => document.querySelector('.cs')._cs.rotating), true, 'the pause button did not restart it');
    assert.match(await pause.getAttribute('aria-label'), /^Stop /, 'the running button still offers to start what is already running');
  });

  test('nothing rotates under prefers-reduced-motion', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1400, height: 900 } });
    const page = await ctx.newPage();
    await page.setContent(build(8, 4, 'data-cs-autoplay="200"'), { waitUntil: 'load' });
    await page.waitForTimeout(300);
    const start = await page.evaluate(() => document.querySelector('.cs-track').scrollLeft);
    await page.waitForTimeout(900);
    const end = await page.evaluate(() => document.querySelector('.cs-track').scrollLeft);
    assert.equal(end, start, `the strip rotated under reduced motion: ${start} -> ${end}`);
    await ctx.close();
  });
});

test.describe('the contract, in the last window before it froze', () => {
  // The engine puts exactly one class on markup the DEALER wrote, and it used
  // to be a bare `is-current` - a name any site theme may already use, whose
  // collision would show as a slide stuck visible or invisible on their page
  // with nothing here to explain it. Every other engine class carries the cs-
  // stem. Renamed 2026-09-08; after the first live page it could not have been.
  test('the class the engine puts on an authored slide carries the cs- stem', async ({ page }) => {
    await page.setContent(build(4, 1, 'data-cs-fade="true"'), { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const classes = await page.evaluate(() => [...document.querySelectorAll('.cs-slide')].flatMap((s) => [...s.classList]));
    const foreign = [...new Set(classes)].filter((c) => !c.startsWith('cs-') && !c.startsWith('cargo-'));
    assert.deepEqual(foreign, [], `the engine wrote ${foreign.join(', ')} onto an authored slide`);
    assert.ok(classes.includes('cs-slide--current'), 'the current slide is not marked at all');
  });

  // destroy() restores the snapshot and removes the root attributes it added.
  // data-cs-fits was written with toggleAttribute outside _setRootAttr, so it
  // was never registered and survived - left on the dealer's element, still
  // suppressing the controls of whatever was built there next.
  test('destroy leaves the root exactly as it was found', async ({ page }) => {
    await page.setContent(build(8, 8), { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const result = await page.evaluate(() => {
      const el = document.querySelector('.cs');
      const before = [...el.attributes].map((a) => a.name).sort();
      const fitsWasSet = el.hasAttribute('data-cs-fits');
      el._cs.destroy();
      return { before, fitsWasSet, after: [...el.attributes].map((a) => a.name).sort() };
    });
    assert.equal(result.fitsWasSet, true, 'the fixture never reached the fits state, so this proves nothing');
    assert.deepEqual(result.after, ['aria-label', 'class', 'data-cs'], `destroy left ${result.after.join(', ')} behind`);
  });

  // scrollTo({behavior:'auto'}) defers to the element's CSS scroll-behavior, so
  // a host page shipping a global `* { scroll-behavior: smooth }` captured every
  // instant scroll the engine makes - including the reduced-motion path, where
  // a visitor who asked for no motion got an animation anyway. The track
  // declares `auto` to take that decision back. Both directions are checked:
  // instant must be instant, and an explicit smooth must still animate, because
  // a shield that also disabled smooth scrolling would be a worse bug.
  test('a host page with global smooth scroll cannot hijack an instant move', async ({ page }) => {
    for (const [want, shouldBeInstant] of [
      ['auto', true],
      ['smooth', false],
    ]) {
      await page.setContent(build(8, 4).replace('<head>', '<head><style>*{scroll-behavior:smooth}</style>'), { waitUntil: 'load' });
      await page.waitForTimeout(350);
      const r = await page.evaluate(async (behavior) => {
        const t = document.querySelector('.cs-track');
        const cs = document.querySelector('.cs')._cs;
        t.scrollLeft = 0;
        await new Promise((done) => setTimeout(done, 100));
        cs.goTo(2, { behavior });
        // One frame later an instant move is already home; a smooth one has
        // barely left.
        await new Promise((done) => requestAnimationFrame(done));
        const oneFrame = Math.round(t.scrollLeft);
        await new Promise((done) => setTimeout(done, 700));
        return { computed: getComputedStyle(t).scrollBehavior, oneFrame, settled: Math.round(t.scrollLeft) };
      }, want);
      assert.equal(r.computed, 'auto', 'the host page won the track scroll-behavior');
      assert.ok(r.settled > 0, `behavior:${want} never arrived`);
      assert.equal(r.oneFrame === r.settled, shouldBeInstant, `behavior:${want} landed at ${r.oneFrame} after one frame and settled at ${r.settled}`);
    }
  });

  // A property used only through a var() fallback is invisible to the
  // Reference page, which tabulates the knobs by reading them out of the
  // shipped stylesheet. --cs-arrow-at was such a knob. This guards the class of
  // gap, not the one instance.
  test('every --cs-* the stylesheet uses is also declared in it', async () => {
    const css = await readFile('dist/custom-slider.css', 'utf8');
    const declared = new Set([...css.matchAll(/(--cs-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
    const used = new Set([...css.matchAll(/var\(\s*(--cs-[a-z0-9-]+)/g)].map((m) => m[1]));
    const undeclared = [...used].filter((p) => !declared.has(p)).sort();
    assert.deepEqual(undeclared, [], `used but never declared, so the Reference page cannot list it: ${undeclared.join(', ')}`);
  });
});
