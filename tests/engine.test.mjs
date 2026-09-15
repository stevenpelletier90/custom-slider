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

  // An open hand promises a scroll. A strip with one stop has nowhere to drag
  // to, and every tabbed bar whose pane held no more cards than fit across was
  // offering it anyway (2026-09-15, Steven). The card LINK must keep its own
  // pointer either way - that is the whole reason the cue rule reaches every
  // child on a strip that does scroll.
  test('a strip that fits offers no drag cursor, and its links keep the pointer', async ({ page }) => {
    await page.setContent(build(8, 8), { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const fitted = await page.evaluate(() => {
      const t = document.querySelector('.cs-track');
      const a = document.querySelector('.cs-slide a');
      return {
        fits: document.querySelector('.cs').hasAttribute('data-cs-fits'),
        draggable: t.hasAttribute('data-cs-draggable'),
        track: getComputedStyle(t).cursor,
        link: a ? getComputedStyle(a).cursor : 'pointer',
      };
    });
    assert.equal(fitted.fits, true, 'eight across eight is meant to fit');
    assert.equal(fitted.draggable, true, 'the track stopped being drag-wired, so this proves nothing about the cursor');
    assert.notEqual(fitted.track, 'grab', 'a strip with one stop still offers the open hand');
    // Asserted as "not grab" rather than "is pointer": WebKit reports a link's
    // default cursor as `auto` where Chromium resolves it to `pointer`, and the
    // invariant is that our cue is not painted over the link, not what the UA
    // calls the link's own default.
    assert.notEqual(fitted.link, 'grab', 'a card link is wearing the drag cursor on a strip that cannot scroll');

    // And the cue is still there when there IS somewhere to drag to.
    await page.setContent(build(8, 4), { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const scrolls = await page.evaluate(() => ({ fits: document.querySelector('.cs').hasAttribute('data-cs-fits'), track: getComputedStyle(document.querySelector('.cs-track')).cursor }));
    assert.equal(scrolls.fits, false, 'eight across four is meant to scroll');
    assert.equal(scrolls.track, 'grab', 'a scrollable strip stopped offering the open hand');
  });
});

test.describe('keyboard', () => {
  // README checklist 3. The order is the reading order of the controls, and
  // the cards come last: a keyboard user tabs past the controls into content,
  // never the other way round.
  test('tab order runs pause, prev, next, dots, then the cards', async ({ page, browserName }) => {
    await page.setContent(build(8, 4, 'data-cs-autoplay="4000"'), { waitUntil: 'load' });
    await page.waitForTimeout(400);
    // Safari's Tab skips links by default; Option+Tab is its "every item"
    // key, and the cards are links. The order under test is the same.
    const TAB = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
    await page.locator('body').press(TAB);

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
      await page.keyboard.press(TAB);
    }

    // Firefox gives every scroll container a tab stop of its own, focusable
    // children or not, so the track shows up between the dots and the cards
    // there (first seen 2026-09-15, the day the file ran on Firefox). That is
    // the browser's stop, not the engine's; the ORDER of the engine's controls
    // is what this test holds. Whether the engine should take that stop away
    // is in docs/backlog.md.
    const controls = seen.filter((s) => s !== 'card' && s !== 'cs-track');
    assert.deepEqual(controls, ['cs-pause', 'cs-arrow--prev', 'cs-arrow--next', 'cs-dot'], `tab order is ${seen.join(' -> ')}, not pause -> prev -> next -> dots -> cards`);
    // Playwright's WebKit never tabs into a link, Option+Tab included (there
    // is no macOS behind it), so the half about the cards can only be held on
    // the other two engines.
    if (browserName === 'webkit') return;
    const firstCard = seen.indexOf('card');
    assert.ok(firstCard > 0, `the cards are not reachable by Tab: saw ${seen.join(' -> ')}`);
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

  // destroy() restores the snapshot and puts every root attribute back to what
  // it was. data-cs-fits was written with toggleAttribute outside _setRootAttr,
  // so it was never registered and survived - left on the dealer's element,
  // still suppressing the controls of whatever was built there next. And until
  // 2026-09-15 only NAMES were kept: an authored role="group" the engine
  // overwrote with role="region" stayed "region" after destroy, and this test
  // compared names, so it passed. Values now, on markup that has its own.
  test('destroy leaves the root exactly as it was found, values included', async ({ page }) => {
    await page.setContent(build(8, 8, 'role="group" aria-roledescription="showcase"'), { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const result = await page.evaluate(() => {
      const el = document.querySelector('.cs');
      const attrs = () => Object.fromEntries([...el.attributes].map((a) => [a.name, a.value]).sort());
      const during = attrs();
      el._cs.destroy();
      return { during, after: attrs(), html: el.innerHTML };
    });
    assert.equal(result.during.role, 'region', 'the fixture never had its role overwritten, so this proves nothing');
    assert.equal(result.during['aria-roledescription'], 'carousel');
    assert.equal(result.during['data-cs-fits'], '', 'the fixture never reached the fits state, so this proves nothing');
    assert.deepEqual(result.after, { 'aria-label': 'Models', 'aria-roledescription': 'showcase', class: 'cs', 'data-cs': '', role: 'group' });
    assert.doesNotMatch(result.html, /cs-arrow|cs-dots|cs-status/, 'the generated controls survived destroy');
  });

  // The constructor's `step` came through unchecked while the data attribute
  // was normalised, and _stops() loops `i += n`: `{ step: 0 }` hung the page,
  // `{ step: 1.5 }` produced slides[1.5]. Each input here either hangs the old
  // engine (this test times out) or reaches _stops() as something it cannot
  // step by. The valid ones prove the check lets real values through.
  test('a step the engine cannot walk by is a page, whichever way it arrives', async ({ page }) => {
    await page.setContent(build(9, 3, 'data-cs-init="manual"'), { waitUntil: 'load' });
    const seen = await page.evaluate(() => {
      const src = document.querySelector('.cs');
      const out = {};
      for (const [name, step] of [
        ['zero', 0],
        ['negative', -1],
        ['decimal', 1.5],
        ['nan', NaN],
        ['infinity', Infinity],
        ['junk', 'twelve'],
        ['numeric string', '2'],
        ['two', 2],
        ['slide', 'slide'],
        ['page', 'page'],
      ]) {
        const el = src.cloneNode(true);
        document.body.append(el);
        const cs = new window.CustomSlider(el, { step });
        out[name] = { step: cs.opts.step, stops: cs._stops() };
        cs.destroy();
        el.remove();
      }
      return out;
    });
    for (const bad of ['zero', 'negative', 'decimal', 'nan', 'infinity', 'junk']) {
      assert.equal(seen[bad].step, 'page', `${bad} was not turned into a page step`);
      assert.deepEqual(seen[bad].stops, [0, 3, 6], `${bad} did not step by pages`);
    }
    assert.deepEqual(seen['numeric string'].stops, [0, 2, 4, 6], 'a numeric string is the number it spells');
    assert.deepEqual(seen.two.stops, [0, 2, 4, 6]);
    assert.deepEqual(seen.slide.stops, [0, 1, 2, 3, 4, 5, 6]);
    assert.deepEqual(seen.page.stops, [0, 3, 6]);
  });

  // Three reviews have now called `e.isIntersecting` with a 0.25 threshold a
  // bug, on the reading that isIntersecting means "any pixel" and only
  // intersectionRatio knows how much. It does not: browsers set isIntersecting
  // from the THRESHOLD INDEX, so with a single 0.25 threshold it is false below
  // that crossing. Measured on Chromium, Firefox and WebKit 2026-09-15 - at 10%
  // every one of them reports `{ ratio: 0.1, isIntersecting: false }`.
  //
  // The first two passes of this test only ever walked the strip UP (0 -> 10%
  // -> 50%), which is the half that proves nothing: nothing fires at 10% on the
  // way up, so the assertion passed on a callback that never happened. The
  // DOWNWARD leg is the one that crosses .25 with a real entry, and it is the
  // only evidence that isIntersecting flips rather than staying true.
  test('autoplay waits for a quarter of the strip, and lets go again on the way down', async ({ page }) => {
    await page.setContent(
      hostHtml({ ...engine, css: '.cs{--cs-per-view:4}', html: `<div style="height:3000px"></div>${slider(8, 'data-cs-autoplay="300"')}<div style="height:3000px"></div>`, box: 1170 }),
      { waitUntil: 'load' },
    );
    await page.waitForTimeout(300);
    const show = (fraction) =>
      page.evaluate(async (f) => {
        const el = document.querySelector('.cs');
        const top = el.getBoundingClientRect().top + scrollY;
        // The strip's top edge enters from the bottom of the window: f of its
        // height is inside when the window bottom sits at top + f * height.
        scrollTo(0, Math.round(top + f * el.offsetHeight - innerHeight));
        await new Promise((r) => setTimeout(r, 350));
        // `rotating` is the intent (the button, focus); off-screen is a HOLD on
        // top of it, so the hold is what is read.
        return { visible: (innerHeight - el.getBoundingClientRect().top) / el.offsetHeight, held: el._cs._suspended.has('offscreen') };
      }, fraction);
    const offscreen = await show(0);
    assert.equal(offscreen.held, true, 'a strip below the fold was not held');
    const sliver = await show(0.1);
    assert.ok(sliver.visible < 0.2, `the fixture showed ${sliver.visible} of the strip, not a tenth`);
    assert.equal(sliver.held, true, 'a tenth of the strip released the hold');
    const half = await show(0.5);
    assert.ok(half.visible > 0.3, `the fixture showed ${half.visible} of the strip, not half`);
    assert.equal(half.held, false, 'half the strip in view did not release the hold');
    // Down across the same crossing, which is where a callback actually fires
    // with a ratio of 0.1. If isIntersecting were "any pixel" this entry would
    // say true and the hold would never come back.
    const back = await show(0.1);
    assert.ok(back.visible < 0.2, `the fixture showed ${back.visible} of the strip on the way down, not a tenth`);
    assert.equal(back.held, true, 'scrolling back down to a tenth left autoplay running');
    const gone = await show(0);
    assert.equal(gone.held, true, 'a strip scrolled fully out of view left autoplay running');
  });

  // data-cs-gallery="false" means not a gallery to the JS, but the CSS reserved
  // the thumb strip's space on the attribute's presence - an empty band under
  // the track. The rule keys off presence on purpose (the space must exist
  // before JS runs, or every gallery shifts at init), so "false" is excluded
  // by name, the way the fade pin already does.
  test('data-cs-gallery="false" reserves no thumb strip', async ({ page }) => {
    const pad = async (attrs) => {
      await page.setContent(build(8, 4, attrs), { waitUntil: 'load' });
      await page.waitForTimeout(300);
      return page.evaluate(() => ({ pad: parseFloat(getComputedStyle(document.querySelector('.cs')).paddingBottom), thumbs: document.querySelectorAll('.cs-thumb').length }));
    };
    const plain = await pad('');
    const off = await pad('data-cs-gallery="false"');
    const on = await pad('data-cs-gallery');
    assert.ok(on.thumbs > 0 && on.pad > plain.pad, 'the fixture gallery reserved nothing, so this proves nothing');
    assert.equal(off.thumbs, 0, 'gallery="false" still built thumbs');
    assert.equal(off.pad, plain.pad, `gallery="false" reserved ${off.pad - plain.pad}px of strip it never draws`);
  });

  // No rewind: the arrows stop at the ends instead of wrapping, and say so.
  test('without rewind the last stop disables next and the first disables prev', async ({ page }) => {
    await page.setContent(build(8, 4, 'data-cs-rewind="false"'), { waitUntil: 'load' });
    await page.waitForTimeout(300);
    const state = () =>
      page.evaluate(() => {
        const off = (b) => b.disabled || b.getAttribute('aria-disabled') === 'true';
        return { current: document.querySelector('.cs')._cs.current, prev: off(document.querySelector('.cs-arrow--prev')), next: off(document.querySelector('.cs-arrow--next')) };
      });
    assert.deepEqual(await state(), { current: 0, prev: true, next: false });
    await page.evaluate(() => document.querySelector('.cs')._cs.next());
    // Wait for the commit (scrollend, or the scroll fallback), not a guess at
    // how long a smooth scroll takes: Firefox's took longer than 700ms.
    await page.waitForFunction(() => document.querySelector('.cs')._cs.current === 4, null, { timeout: 5000 });
    await page.waitForTimeout(200);
    assert.deepEqual(await state(), { current: 4, prev: false, next: true }, 'the last page did not disable next');
    await page.evaluate(() => document.querySelector('.cs')._cs.next());
    await page.waitForTimeout(1200);
    assert.equal((await state()).current, 4, 'next past the end moved, or wrapped');

    // The disabled state has to stay VISIBLE, not just be announced. On the
    // nine patterns that set --cs-arrow-bg: transparent the glyph is the whole
    // control, and the old 0.35 composited it to 2.10:1. 0.5 gives 3.09:1.
    // Read it settled: mid-transition this reads 0.994 (2026-09-15).
    const settled = await page.evaluate(() => {
      const n = document.querySelector('.cs-arrow--next');
      n.style.transition = 'none';
      return getComputedStyle(n).opacity;
    });
    assert.equal(settled, '0.5', `a disabled arrow faded to ${settled}; under ~0.5 the glyph drops below 3:1 where the arrow has no background`);
  });

  // Gallery: a thumb activates its slide, and every other slide is inert - the
  // one place inert is allowed, because a gallery is 1-up and no count is
  // corrupted by it.
  test('a gallery thumb shows its slide and inerts the rest', async ({ page }) => {
    await page.setContent(build(5, 1, 'data-cs-gallery'), { waitUntil: 'load' });
    await page.waitForTimeout(400);
    await page.locator('.cs-thumb').nth(3).click();
    await page.waitForTimeout(700);
    const r = await page.evaluate(() => ({
      current: document.querySelector('.cs')._cs.current,
      inert: [...document.querySelectorAll('.cs-slide')].map((s) => s.inert),
      selected: [...document.querySelectorAll('.cs-thumb')].map((t) => t.getAttribute('aria-selected')),
    }));
    assert.equal(r.current, 3);
    assert.deepEqual(r.inert, [true, true, true, false, true], 'the shown slide is inert, or a hidden one is not');
    assert.deepEqual(r.selected, ['false', 'false', 'false', 'true', 'false']);
  });

  // Mouse drag scrolls the track; the click that ends a real drag is eaten so
  // a card link does not fire under a released pointer.
  test('dragging the track with a mouse moves it', async ({ page }) => {
    await page.setContent(build(12, 4), { waitUntil: 'load' });
    await page.waitForTimeout(300);
    const box = await page.locator('.cs-track').boundingBox();
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(x - i * 30, y);
    await page.mouse.up();
    await page.waitForTimeout(700);
    const left = await page.evaluate(() => document.querySelector('.cs-track').scrollLeft);
    assert.ok(left > 100, `a 300px drag moved the track ${left}px`);
  });

  // --cs-per-view is CSS, so a resize can make a strip fit or stop fitting at
  // any moment; the engine re-measures and the fits state follows.
  test('a resize that makes every slide fit takes the controls away, and back', async ({ page }) => {
    // The host's box follows the window here (a fixed 1170px box would keep
    // the root the same size across the viewport change, and it is the root's
    // resize the engine observes - a real page's container moves with the
    // window at every breakpoint a per-view query sits on).
    await page.setContent(hostHtml({ ...engine, css: '#box{inline-size:auto}.cs{--cs-per-view:2}@media(min-width:1000px){.cs{--cs-per-view:4}}', html: slider(4), box: 1170 }), { waitUntil: 'load' });
    const fits = () => page.evaluate(() => document.querySelector('.cs').hasAttribute('data-cs-fits'));
    await page.waitForTimeout(300);
    assert.equal(await fits(), true, 'four slides four across did not fit');
    await page.setViewportSize({ width: 800, height: 700 });
    await page.waitForTimeout(500);
    assert.equal(await fits(), false, 'four slides two across still claimed to fit after the resize');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    assert.equal(await fits(), true, 'the controls did not go away again');
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

// The boundary cases of the 2026-09-15 review, in one describe so they read as
// what they are: the API's edges, not the engine's happy path.
test.describe('the API boundary', () => {
  // "JS options override data attributes, which override defaults" is the
  // documented precedence, but the CSS reads the AUTHORED attribute — it has
  // to, because the thumb strip's space and the one-up width must exist before
  // any script runs. Mirroring only the TRUE side meant { gallery: false } on
  // authored data-cs-gallery markup built no gallery while the CSS went on
  // reserving the strip, and { fade: false } on authored data-cs-fade left the
  // slides pinned one-up while the engine scrolled them normally.
  test('a false JS option overrides an authored data attribute in the CSS too', async ({ page }) => {
    const read = async (attrs, opts) => {
      await page.setContent(hostHtml({ ...engine, css: '.cs{--cs-per-view:4}', html: `<div class="cs" aria-label="Models"${attrs}><ul class="cs-track">${slides(8)}</ul></div>`, box: 1170 }), {
        waitUntil: 'load',
      });
      await page.waitForTimeout(250);
      return page.evaluate((o) => {
        const el = document.querySelector('.cs');
        const cs = new CustomSlider(el, o);
        return {
          thumbs: el.querySelectorAll('.cs-thumb').length,
          pad: parseFloat(getComputedStyle(el).paddingBottom),
          slide: Math.round(el.querySelector('.cs-slide').getBoundingClientRect().width),
          track: Math.round(el.querySelector('.cs-track').clientWidth),
          gallery: cs.opts.gallery,
          fade: cs.opts.fade,
        };
      }, opts);
    };
    const plain = await read('', {});
    const galleryOff = await read(' data-cs-gallery', { gallery: false });
    assert.equal(galleryOff.gallery, false, 'the JS option did not win in the JS');
    assert.equal(galleryOff.thumbs, 0, 'gallery:false still built thumbs');
    assert.equal(galleryOff.pad, plain.pad, `gallery:false reserved ${galleryOff.pad - plain.pad}px of thumb strip that is never drawn`);

    const fadeOff = await read(' data-cs-fade', { fade: false });
    assert.equal(fadeOff.fade, false, 'the JS option did not win in the JS');
    assert.ok(fadeOff.slide < fadeOff.track * 0.5, `fade:false left the slides pinned one-up at ${fadeOff.slide} of a ${fadeOff.track} track`);
    assert.equal(fadeOff.slide, plain.slide, 'fade:false did not draw the same strip as markup that never mentioned fade');
  });

  // goTo is public API and took whatever it was given: Math.min/max clamps the
  // ENDS, it does not validate, so goTo(1.5) reached slides[1.5] and goTo(NaN)
  // slides[NaN] — both undefined, and both threw on getBoundingClientRect().
  // The same treatment step got: a slide index is a finite whole number.
  test('goTo refuses an index that is not a whole number', async ({ page }) => {
    await page.setContent(build(8, 4), { waitUntil: 'load' });
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => {
      const cs = document.querySelector('.cs')._cs;
      const out = {};
      for (const [name, n] of [
        ['fraction', 1.5],
        ['nan', NaN],
        ['infinity', Infinity],
        ['-infinity', -Infinity],
        ['string', 'three'],
        ['undefined', undefined],
        ['null', null],
        ['object', {}],
        ['negative', -5],
        ['past the end', 999],
      ]) {
        try {
          cs.goTo(n, { behavior: 'auto' });
          // _target is where goTo is TAKING it - current only moves at the commit
          // (scrollend), which has not happened yet a line later.
          out[name] = { threw: false, current: cs._target ?? cs.current };
        } catch (e) {
          out[name] = { threw: true, message: e.message };
        }
        cs.goTo(0, { behavior: 'auto' });
      }
      return out;
    });
    for (const [name, v] of Object.entries(r)) assert.equal(v.threw, false, `goTo(${name}) threw: ${v.message}`);
    // A fraction truncates rather than being refused — goTo(1.5) is slide 1,
    // the same way step takes a numeric string for the number it spells.
    assert.equal(r.fraction.current, 1, 'goTo(1.5) did not truncate to slide 1');
    // The ends still clamp, which is the behaviour that was always there.
    assert.equal(r.negative.current, 0, 'goTo(-5) did not clamp to the first slide');
    assert.equal(r['past the end'].current, 7, 'goTo(999) did not clamp to the last slide');
    // null is 0 through Number(), so it lands on the first slide like -5 does.
    // Anything that is not a number at all is a no-op, not a jump.
    for (const name of ['nan', 'string', 'undefined', 'object']) assert.equal(r[name].current, 0, `goTo(${name}) moved the slider to ${r[name].current}`);
  });

  // fits already hid the arrows and the dots — controls that cannot do anything
  // when there is one stop. The pause button was left offering to stop an
  // autoplay that goes from stop 0 to stop 0 forever, with the interval firing
  // no-op next() calls behind it.
  test('a strip that fits hides the pause button and suspends the timer', async ({ page }) => {
    await page.setContent(build(3, 4, 'data-cs-autoplay="300"'), { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const fits = await page.evaluate(() => {
      const el = document.querySelector('.cs');
      return { stops: el._cs._stops().length, pause: document.querySelector('.cs-pause').hidden, held: el._cs._suspended.has('fits'), arrows: document.querySelector('.cs-arrow--next').hidden };
    });
    assert.equal(fits.stops, 1, 'the fixture does not fit, so this proves nothing');
    assert.equal(fits.arrows, true, 'the arrows were not hidden, so fits never ran');
    assert.equal(fits.pause, true, 'the pause button is still offered on a strip with one stop');
    assert.equal(fits.held, true, 'the autoplay timer still runs on a strip with one stop');
    // And it comes back: fits is re-evaluated on every _updateUI, because
    // --cs-per-view is CSS and a narrower window makes the same strip stop
    // fitting at any moment.
    const narrow = await page.evaluate(async () => {
      const el = document.querySelector('.cs');
      el.style.setProperty('--cs-per-view', '1');
      el._cs._measure();
      el._cs._updateUI();
      await new Promise((r) => setTimeout(r, 100));
      return { pause: document.querySelector('.cs-pause').hidden, held: el._cs._suspended.has('fits') };
    });
    assert.equal(narrow.pause, false, 'the pause button did not come back when the strip stopped fitting');
    assert.equal(narrow.held, false, 'the autoplay hold did not lift when the strip stopped fitting');
  });

  // Every announced string is settable from HTML — labels.test.mjs says so and
  // checks the eleven keys it knew about. This one was built inline, so a
  // Spanish page could translate its status region and still have every slide
  // announce "1 of 6". It only appears on a non-list track whose slides carry
  // no heading, which is why the <ul> fixtures elsewhere never reached it.
  test('the slide-position fallback is a label like every other announced string', async ({ page }) => {
    const html = (attrs = '') =>
      hostHtml({
        ...engine,
        css: '.cs{--cs-per-view:4}',
        html: `<div class="cs" data-cs aria-label="Modelos" ${attrs}><div class="cs-track">${Array.from({ length: 6 }, () => '<div class="cs-slide"><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt=""></div>').join('')}</div></div>`,
        box: 1170,
      });
    await page.setContent(html(), { waitUntil: 'load' });
    await page.waitForTimeout(300);
    const dflt = await page.evaluate(() => [...document.querySelectorAll('.cs-slide')].map((s) => s.getAttribute('aria-label')));
    assert.deepEqual(dflt.slice(0, 2), ['1 of 6', '2 of 6'], 'the default wording changed');

    await page.setContent(html('data-cs-label-slide-position="Diapositiva {n} de {total}"'), { waitUntil: 'load' });
    await page.waitForTimeout(300);
    const es = await page.evaluate(() => [...document.querySelectorAll('.cs-slide')].map((s) => s.getAttribute('aria-label')));
    assert.deepEqual(es.slice(0, 2), ['Diapositiva 1 de 6', 'Diapositiva 2 de 6'], 'the slide position is not settable from HTML');
  });

  // The track carries scroll-behavior:auto so a host page's
  // `* { scroll-behavior: smooth }` cannot hijack an instant move. The thumb
  // rail is scrolled the same way — _revealThumb() calls scrollBy() with no
  // behavior, which defers to the property — and had no shield, so the same
  // host rule animated the rail, reduced-motion readers included.
  test('a host page with global smooth scroll cannot hijack the thumb rail either', async ({ page }) => {
    await page.setContent(build(8, 1, 'data-cs-gallery').replace('<head>', '<head><style>*{scroll-behavior:smooth}</style>'), { waitUntil: 'load' });
    await page.waitForTimeout(350);
    const r = await page.evaluate(() => ({
      track: getComputedStyle(document.querySelector('.cs-track')).scrollBehavior,
      thumbs: getComputedStyle(document.querySelector('.cs-thumbs')).scrollBehavior,
    }));
    assert.equal(r.track, 'auto', 'the host page won the track scroll-behavior');
    assert.equal(r.thumbs, 'auto', 'the host page won the thumb rail scroll-behavior');
  });
});
