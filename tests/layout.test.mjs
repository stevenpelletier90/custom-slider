// The panel reads in the order decisions get made, nothing splits, the preview
// stays on screen while the settings scroll - and it is never cut off: a frame
// wider or taller than the box it is shown in is scaled down, never clipped
// and never capped.
//
// One column now, at every width: the preview on top and the settings under
// it. The two-column layout it replaced gave the preview about 790px of a 1440
// window, so the Desktop frame was shown at 63% - a picture of the slider
// rather than the slider. Full width makes that same frame life size, and
// these tests are what says so.
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { openBuilder, pick, patternIds, ORIGIN } from './helpers.mjs';

test.describe.configure({ mode: 'serial' });

const titles = (page) => page.evaluate(() => [...document.querySelectorAll('#wb-settings .tp-fldv')].map((f) => f.querySelector('.tp-fldv_t')?.textContent.trim()));
const expanded = (page, title) =>
  page.evaluate((t) => [...document.querySelectorAll('#wb-settings .tp-fldv')].find((f) => f.querySelector('.tp-fldv_t')?.textContent.trim() === t)?.classList.contains('tp-fldv-expanded'), title);

// Everything about the stage that matters, in the parent's coordinates. The
// frame's box is read with getBoundingClientRect on purpose here - that IS the
// transformed box, which is the thing that has to fit.
const stageBox = (page) =>
  page.evaluate(() => {
    const wrap = document.querySelector('.wb-stage');
    const frame = document.getElementById('wb-stage');
    const head = document.querySelector('.ui-head');
    const preview = document.querySelector('.ui-preview');
    const w = wrap.getBoundingClientRect();
    const f = frame.getBoundingClientRect();
    const p = preview.getBoundingClientRect();
    return {
      wrap: { top: w.top, bottom: w.bottom, left: w.left, right: w.right },
      frame: { top: f.top, bottom: f.bottom, left: f.left, right: f.right },
      preview: { top: p.top, bottom: p.bottom, height: p.height },
      // A pinned preview that has to be scrolled to see the bottom of the
      // frame is the failure the cap exists to prevent, so ask it directly.
      previewScrolls: preview.scrollHeight > preview.clientHeight + 1,
      specBottom: document.querySelector('.ui-spec').getBoundingClientRect().bottom,
      panelTop: document.querySelector('.ui-panel').getBoundingClientRect().top,
      position: getComputedStyle(preview).position,
      headBottom: head.getBoundingClientRect().bottom,
      transform: getComputedStyle(frame).transform,
      winH: innerHeight,
      // The layout width the media queries inside the frame actually see, and
      // the container the slider gets inside it. Neither may move when the
      // picture is scaled.
      frameClient: frame.clientWidth,
      rootWidth: Math.round(frame.contentDocument.querySelector('.cs')?.getBoundingClientRect().width ?? 0),
      specVisible: document.querySelector('.ui-spec').getBoundingClientRect().bottom <= innerHeight,
      shownAt: document.getElementById('spec-scale-item').hidden ? null : document.getElementById('spec-scale').textContent,
    };
  });

const pct = (s) => parseFloat(/(\d+)%/.exec(s ?? '')?.[1] ?? 'NaN');

test('folders come in decision order on the model bar', async ({ browser }) => {
  const { page, errors } = await openBuilder(browser, 1440);
  await pick(page, 'modelbar');
  // The two card folders lead and sit together; the rest follow the order a
  // slider gets built, rare last. "The card" rather than "Brand and cards"
  // since 2026-09-10: the brand control moved above the stage (one control,
  // in the strip, replacing the Brand list that used to live in here), so
  // this folder holds the card's own settings and nothing else.
  assert.deepEqual(await titles(page), ['The card', 'This card style', 'How many across', 'Arrows and dots', 'Behaviour', 'Advanced']);
  assert.deepEqual(errors, []);
});

// Advanced used to start closed, and Tab names with it. A setting nobody can
// see is a setting nobody knows is there, so every section is open and none of
// them can be shut. Tweakpane offers no non-collapsible folder - the fold is
// starved by pointer-events in ui.css and tabindex in pane.js - so this checks
// the outcome a person gets rather than the mechanism: click each title bar and
// none of them closes.
test('every section is open, and nothing can close one', async ({ browser }) => {
  const { page, errors } = await openBuilder(browser, 1440);
  for (const id of ['modelbar', 'tabs']) {
    await pick(page, id);
    for (const title of await titles(page)) {
      assert.equal(await expanded(page, title), true, `${id}: "${title}" is closed on load`);
      // force:true because pointer-events: none is exactly what is being
      // tested - Playwright would otherwise refuse the click and pass by luck.
      await page.locator(`#wb-settings .tp-fldv:has(.tp-fldv_t:text-is("${title}")) .tp-fldv_b`).first().click({ force: true });
      await page.waitForTimeout(250);
      assert.equal(await expanded(page, title), true, `${id}: clicking "${title}" closed it`);
    }
  }
  // The fold store is gone with the fold. A stale one would re-collapse a
  // folder that no longer has a toggle to open it again.
  assert.equal(await page.evaluate(() => localStorage.getItem('cs-folders')), null, 'something still writes cs-folders');
  assert.deepEqual(errors, []);
});

// The page numbers three steps, and only step 3 was ever a heading - the other
// two were <span>s in a code bar with a styled badge. So a screen-reader user
// listing headings found a "3" with no 1 or 2 in front of it, and the sequence
// the whole page is built around existed on screen only. All three are h3 now,
// siblings, and they must stay that way and stay looking the same.
test('all three numbered steps are headings, at one level, in order', async ({ browser }) => {
  const { page, errors } = await openBuilder(browser, 1440);
  const steps = await page.evaluate(() =>
    [...document.querySelectorAll('.ui-main h2, .ui-main h3, .ui-main h4, .ui-main h5')]
      .filter((h) => h.querySelector('.ui-step'))
      .map((h) => ({ tag: h.tagName, n: h.querySelector('.ui-step').textContent, name: h.textContent.replace(/\s+/g, ' ').trim() })),
  );

  assert.deepEqual(
    steps.map((s) => s.n),
    ['1', '2', '3'],
    `the numbered steps that are headings are ${steps.map((s) => s.n).join(', ') || 'none'}`,
  );
  assert.deepEqual([...new Set(steps.map((s) => s.tag))], ['H3'], 'the three steps are not all at the same heading level');

  // Step 2 carries a legend about class prefixes. Inside the heading it became
  // part of the name, so the heading read as two sentences about cs- and cargo-.
  assert.doesNotMatch(steps[1].name, /cargo-/, "step 2's heading name swallowed the class-prefix legend");

  // The badge is decoration; the heading has to say something after it.
  for (const s of steps) assert.ok(s.name.replace(s.n, '').trim().length > 10, `step ${s.n} is a heading with no text`);
  assert.deepEqual(errors, []);
});

// The title bar is a real <button> that no longer does anything, so it must not
// take a Tab. Nothing else in the pane may lose its place in the tab order.
test('a title bar is not in the tab order', async ({ browser }) => {
  const { page, errors } = await openBuilder(browser, 1440);
  await pick(page, 'modelbar');
  const tabbable = await page.evaluate(() => [...document.querySelectorAll('#wb-settings .tp-fldv_b')].map((b) => b.getAttribute('tabindex')));
  assert.ok(tabbable.length, 'no folder title bars found at all');
  assert.deepEqual(
    tabbable.filter((t) => t !== '-1'),
    [],
    'a folder title bar is still reachable by Tab',
  );
  assert.deepEqual(errors, []);
});

// The preview scrolls away with the page. It used to be pinned under the
// masthead with a height cap, so the settings passed beneath it - and that was
// the objection: a panel you are reading slides under a white slab covering the
// thing you came to look at. Unpinned 2026-09-08 at Steven's call, and this is
// what stops it creeping back, because "sticky" is a one-word change that reads
// as an improvement to anyone who did not have to use it.
test('the preview scrolls with the page and never pins over the settings', async ({ browser }) => {
  for (const w of [1440, 1024]) {
    const { page, errors } = await openBuilder(browser, w);
    const before = (await stageBox(page)).preview.top;
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForTimeout(400);
    const box = await stageBox(page);

    // Not "must be static": it is `relative`, which does not pin but does give
    // it a z-index, and it needs one - the masthead is sticky at z-index 20 and
    // was painting over the top of the frame as the page scrolled under it,
    // which reads as a card with its top border missing. What must never come
    // back is a POSITION THAT PINS.
    assert.ok(!['sticky', 'fixed'].includes(box.position), `at ${w}: the preview is positioned "${box.position}", so it pins over the settings again`);
    // It moved with the page rather than holding station under the masthead.
    assert.ok(before - box.preview.top > 300, `at ${w}: the preview only moved ${Math.round(before - box.preview.top)}px for a 900px scroll, so it is still pinning`);
    // No cap and no inner scroller: both existed only to serve the pinning, and
    // a leftover cap would silently shrink the frame for no reason.
    assert.equal(box.previewScrolls, false, `at ${w}: the preview scrolls inside itself, so a height cap survived the unpinning`);
    // NOTHING on this page pins over anything. The preview was unpinned so it
    // would stop sliding over the settings; the masthead was doing the same to
    // the preview, painting over the top 87px of the frame at 1700x900 scrolled
    // 260 - which reads as a card with its top border missing. Raising the
    // preview above it was tried and reverted: that fixes the card and puts a
    // slider over the site nav.
    //
    // So the masthead scrolls away too, and this asserts the outcome rather
    // than the property: scrolled down, the header is off screen. The rail is
    // the one exception and is allowed to stick, because it sits BESIDE the
    // content instead of over it.
    const headTop = await page.evaluate(() => Math.round(document.querySelector('.ui-head').getBoundingClientRect().bottom));
    assert.ok(headTop <= 0, `at ${w}: the masthead is still on screen at ${headTop}px after a 900px scroll, so it pins over the preview`);
    assert.deepEqual(errors, [], `at ${w}: a page error occurred`);
  }
});

// It used to be the settings first and the preview beside them from 1200px up,
// and above them below that - two layouts and an `order` swap to reconcile the
// second with the DOM. One column, preview first, at every width now.
test('the preview is above the settings at every width', async ({ browser }) => {
  for (const w of [1440, 1024]) {
    const { page, errors } = await openBuilder(browser, w);
    const box = await stageBox(page);
    assert.ok(box.preview.top < box.panelTop, `at ${w}: the preview (${Math.round(box.preview.top)}) is not above the settings (${Math.round(box.panelTop)})`);
    const source = await page.evaluate(() => {
      const kids = [...document.querySelector('.ui-work').children];
      return kids.findIndex((k) => k.classList.contains('ui-preview')) < kids.findIndex((k) => k.classList.contains('ui-panel'));
    });
    assert.equal(source, true, `at ${w}: the visual order is reading order by CSS, not in the markup`);
    // The pair that acts on the whole panel stays at the top of it, right
    // under the preview it changes.
    const keepFirst = await page.evaluate(() => document.querySelector('.ui-panel').firstElementChild.classList.contains('ui-panel-bar'));
    assert.equal(keepFirst, true, `at ${w}: Keep/Reset is no longer the first thing in the panel`);
    assert.deepEqual(errors, [], `at ${w}: a page error occurred`);
  }
});

// A full-width panel is a full-width LABEL: Tweakpane gives the value
// --tp-blade-value-width and lets the label take the rest, so at 1440 the row
// "Phone · under 768" ran from x=217 to a slider starting at x=1227. The
// folders flow into columns instead, and a folder is never split across a
// column boundary - a heading stranded at the foot of one column with its
// controls starting the next is what the demo's previous columns layout did.
test('the settings flow into columns, and no folder is split across one', async ({ browser }) => {
  for (const w of [1440, 1280, 1024]) {
    const { page, errors } = await openBuilder(browser, w);
    const pane = await page.evaluate(() => {
      const folders = [...document.querySelectorAll('#wb-settings .tp-rotv_c > .tp-fldv')];
      return {
        folders: folders.length,
        // A block fragmented across a column boundary reports more than one
        // client rect. That IS the split, asked of the browser directly.
        split: folders.filter((f) => f.getClientRects().length > 1).map((f) => f.querySelector('.tp-fldv_t')?.textContent.trim()),
        columns: new Set(folders.map((f) => Math.round(f.getBoundingClientRect().left))).size,
        // How far a value sits from the start of its own label. 195px at 1440
        // and 1024, 319px at 1280; it was 1010px with one full-width column.
        widest: Math.max(
          ...[...document.querySelectorAll('#wb-settings .tp-lblv')].map((r) => {
            const l = r.querySelector('.tp-lblv_l')?.getBoundingClientRect();
            const v = r.querySelector('.tp-lblv_v')?.getBoundingClientRect();
            return l && v ? v.left - l.left : 0;
          }),
        ),
      };
    });
    assert.equal(pane.folders, 6, `at ${w}: the pane no longer has its six folders where this test looks`);
    assert.deepEqual(pane.split, [], `at ${w}: a folder is split across a column boundary`);
    assert.ok(pane.columns >= 2, `at ${w}: the settings are in ${pane.columns} column, so the rows have the whole width to stretch across`);
    assert.ok(pane.widest < 450, `at ${w}: a row's value sits ${Math.round(pane.widest)}px from its label, which is a stretched row`);
    assert.deepEqual(errors, [], `at ${w}: a page error occurred`);
  }
});

// The whole point of the earlier round, and still true: a frame wider than the
// stage is SHOWN smaller, never cut off, and the numbers under it stay the
// real ones. What changed is where it bites - at 1440 the stage is the whole
// width now, so it is the laptop window that has to scale.
test('a frame wider than its stage is scaled to fit, not clipped', async ({ browser }) => {
  for (const [w, want, atMost] of [
    [1024, '1200', 80],
    [1024, '992', 90],
  ]) {
    const { page, errors } = await openBuilder(browser, w);
    await page.click(`.ui-widths button[data-w="${want}"]`);
    await page.waitForTimeout(400);
    const box = await stageBox(page);
    assert.ok(
      box.frame.left >= box.wrap.left - 1 && box.frame.right <= box.wrap.right + 1,
      `at ${w}: the frame (${Math.round(box.frame.left)}–${Math.round(box.frame.right)}) is outside the stage (${Math.round(box.wrap.left)}–${Math.round(box.wrap.right)})`,
    );
    assert.ok(box.frame.bottom <= box.wrap.bottom + 1, `at ${w}: the frame runs past the bottom of the stage`);
    assert.equal(box.frameClient, +want, `at ${w}: the frame stopped being a real ${want}px window`);
    assert.ok(pct(box.shownAt) <= atMost, `at ${w}: the readout says ${box.shownAt}, not scaled down to fit`);
    assert.deepEqual(errors, [], `at ${w}: a page error occurred`);
  }
});

// What the round was for. The two-column layout showed this frame at 63%; the
// stage is the full width of the work area now, so it is life size and the
// only thing scaled away is the 10px the page's own gutters cost.
test('the desktop frame is life size on a 1440 window', async ({ browser }) => {
  const { page, errors } = await openBuilder(browser, 1440);
  await page.click('.ui-widths button[data-w="1200"]');
  await page.waitForTimeout(400);
  const box = await stageBox(page);
  assert.ok(pct(box.shownAt) >= 95, `the desktop frame is shown at ${box.shownAt} on a 1440 window, which is not life size`);
  assert.equal(box.frameClient, 1200, 'the frame stopped being a real 1200px window');
  assert.deepEqual(errors, []);
});

test('the desktop frame is still a 1170px container at 1440', async ({ browser }) => {
  const { page, errors } = await openBuilder(browser, 1440);
  await page.click('.ui-widths button[data-w="1200"]');
  await page.waitForTimeout(400);
  const box = await stageBox(page);
  assert.equal(box.rootWidth, 1170, 'the slider inside the frame is no longer in a 1170px container');
  assert.deepEqual(errors, []);
});

test('a frame that fits is not scaled at all', async ({ browser }) => {
  const { page, errors } = await openBuilder(browser, 1440);
  await page.click('.ui-widths button[data-w="390"]');
  await page.waitForTimeout(400);
  const box = await stageBox(page);
  assert.equal(box.transform, 'none', 'a 390px frame in a 1190px stage is being transformed');
  assert.equal(box.shownAt, null, 'the readout claims a scale on a preview shown at full size');
  assert.deepEqual(errors, []);
});

// This used to assert a height cap: the preview was pinned, so it was capped at
// `max(24rem, 60vh, 100vh - 3.5rem - 1px - 16rem)` to leave a strip of settings
// to work in, and the cap had to SHORTEN the picture rather than hide the bottom
// of it. The pinning went on 2026-09-08 and the cap went with it, at which point
// this test kept passing while asserting nothing - the cap it compared against
// (587px on a 900px window) was simply larger than anything the preview did.
//
// What still has to hold is the part that was never about the cap: a tall
// pattern is scaled to fit the width it is given, the whole frame stays inside
// the preview, the readout stays with it, and scaling the PICTURE never changes
// the window the slider thinks it is in.
test('a tall pattern is scaled into the preview, readout and all', async ({ browser }) => {
  const { page, errors } = await openBuilder(browser, 1440);
  await pick(page, 'models');
  await page.click('.ui-widths button[data-w="1200"]');
  await page.waitForTimeout(600);
  const box = await stageBox(page);

  assert.ok(box.frame.bottom <= box.preview.bottom + 1, `the frame runs ${Math.round(box.frame.bottom - box.preview.bottom)}px past the bottom of the preview`);
  assert.ok(box.specBottom <= box.preview.bottom + 1, `the readout is ${Math.round(box.specBottom - box.preview.bottom)}px below the bottom of the preview it belongs to`);
  // No cap means no inner scroller: a preview that scrolls inside itself is the
  // signature of a leftover max-block-size.
  assert.equal(box.previewScrolls, false, 'the preview scrolls inside itself, so a height cap survived the unpinning');
  // The scale is a transform on the picture. The frame is still a real 1200px
  // window, so the media queries inside it fire where they would on the device.
  assert.equal(box.frameClient, 1200, 'the frame stopped being a real 1200px window');
  assert.ok(pct(box.shownAt) <= 100, `the readout says ${box.shownAt}, which is more than life size`);
  assert.deepEqual(errors, []);
});

// "the pane isnt tall enough because i still have to scroll to see the whole
// card" / "the border doesnt show but when I scroll vertically the card goes up
// and the border appears" (Steven, twice). Both were the same thing and neither
// was the frame's height: the preview frame was running content-box while
// BOOTSTRAP 3 SETS border-box on everything, and a card written `block-size:
// 100%` with padding and a border only fits its slide under border-box.
//
// Measured before the fix, at the Desktop button: the review card came out
// 184.61px tall inside a 147.61px slide - 37px out of its own slide and 1.6px
// out of the frame, where html{overflow:hidden} cut it off - and the mixed-sizes
// card overflowed by exactly its own two 1px borders, which is why its bottom
// border was missing until the page scrolled and the browser repainted it.
//
// Verified in bootstrap@3.4.1's own dist/css/bootstrap.css, line 1069.
test('the preview runs the box model the storefront runs', async ({ browser }) => {
  const { page, errors } = await openBuilder(browser, 1500);
  const box = await page.evaluate(() => {
    const d = globalThis.CARGO.sdoc();
    const win = globalThis.CARGO.swin();
    const el = d.querySelector('.cs-slide') ?? d.body;
    return { slide: win.getComputedStyle(el).boxSizing, html: win.getComputedStyle(d.documentElement).boxSizing };
  });
  assert.equal(box.slide, 'border-box', 'the preview frame is not running Bootstrap 3 box model');
  assert.equal(box.html, 'border-box', 'the frame root is not running Bootstrap 3 box model');
  assert.deepEqual(errors, []);
});

test('no card is taller than the slide holding it, on any pattern', async ({ browser }) => {
  const { page, errors } = await openBuilder(browser, 1700);
  const bad = [];
  for (const id of await patternIds(page)) {
    await pick(page, id);
    await page.waitForTimeout(350);
    const worst = await page.evaluate(() => {
      const d = globalThis.CARGO.sdoc();
      const win = globalThis.CARGO.swin();
      let over = 0;
      let who = '';
      for (const slide of d.querySelectorAll('.cs-slide')) {
        const sr = slide.getBoundingClientRect();
        for (const el of slide.children) {
          const gap = +(el.getBoundingClientRect().bottom - sr.bottom).toFixed(2);
          if (gap > over) {
            over = gap;
            who = `${el.tagName}.${typeof el.className === 'string' ? el.className.split(' ')[0] : ''}`;
          }
        }
      }
      // And nothing spills out of the frame either: the frame refuses to scroll,
      // so a document taller than its viewport is content nobody can reach.
      let bottom = 0;
      for (const el of d.querySelectorAll('#wb-live-root *')) {
        const r = el.getBoundingClientRect();
        if (r.height && r.bottom > bottom) bottom = r.bottom;
      }
      return { over, who, clipped: +(bottom - win.innerHeight).toFixed(2) };
    });
    if (worst.over > 0.01) bad.push(`${id}: ${worst.who} hangs ${worst.over}px below its slide`);
    if (worst.clipped > 0.01) bad.push(`${id}: ${worst.clipped}px of content is cut off by the frame`);
  }
  assert.deepEqual(bad, [], bad.join(' | '));
  assert.deepEqual(errors, []);
});

// "When a user hits fill it doesnt seem to affect the display of the current
// pattern" (Steven, 2026-09-08). It did not: Fill widened the FRAME, and the
// frame's Bootstrap container rules then held the slider at 1170px anyway, so
// on any window wide enough to matter Fill and Desktop drew the same picture.
// The button's own tooltip has always said "use all the width this page has".
test('Fill drops the container and uses the whole width', async ({ browser }) => {
  const { page, errors } = await openBuilder(browser, 1900);
  await pick(page, 'mixed');
  const read = () =>
    page.evaluate(() => {
      const d = globalThis.CARGO.sdoc();
      return {
        frame: d.documentElement.clientWidth,
        root: Math.round(d.getElementById('wb-live-root').getBoundingClientRect().width),
        slide: Math.round(d.querySelector('.cs-slide').getBoundingClientRect().width),
      };
    });

  await page.click('.ui-widths button[data-w="1200"]');
  await page.waitForTimeout(500);
  const desktop = await read();
  assert.equal(desktop.root, 1170, `the Desktop button gives the slider ${desktop.root}px, not Bootstrap's 1170`);

  await page.click('.ui-widths button[data-w="0"]');
  await page.waitForTimeout(600);
  const fill = await read();
  assert.equal(fill.root, fill.frame, `Fill left the slider in a ${fill.root}px container inside a ${fill.frame}px frame`);
  assert.ok(fill.root > desktop.root, `Fill gave the slider ${fill.root}px, no more than Desktop's ${desktop.root}`);
  assert.ok(fill.slide > desktop.slide, `the cards are ${fill.slide}px on Fill and ${desktop.slide}px on Desktop, so Fill changed nothing anyone can see`);

  // And back: Fill is a choice, not a one-way door.
  await page.click('.ui-widths button[data-w="1200"]');
  await page.waitForTimeout(500);
  assert.equal((await read()).root, 1170, 'the container did not come back when Fill was turned off');
  assert.deepEqual(errors, []);
});

// ---------------------------------------------------------------------------
// The 320px standing check (2026-09-15). The workbench's narrowest button is
// 390, so none of the tests above can see the width the phone pass was about:
// 320 is the narrowest screen anyone browses at, and it is where the tabbed
// bar wrapped to four rows, where the arrows ate a third of the card, and
// where brands.html scrolled sideways. These drive the catalogue pages at a
// real 320 viewport instead, because that is the only place the number exists.
const at = async (browser, path, width) => {
  const ctx = await browser.newContext({ viewport: { width, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${ORIGIN}/demo/${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  return { ctx, page, errors };
};

// brands.html scrolled sideways by 30px at 320: the brand tile's badge held
// its width, the name held its min-content width, and the badge went out the
// side of the tile. A page that scrolls sideways on a phone is a bug wherever
// it comes from, so this asks the document, not the tile.
for (const path of ['brands.html', 'patterns.html', 'reference.html']) {
  test(`${path} does not scroll sideways at 320`, async ({ browser }) => {
    const { ctx, page, errors } = await at(browser, path, 320);
    const found = await page.evaluate(() => {
      const doc = document.documentElement;
      const over = doc.scrollWidth - doc.clientWidth;
      const past = [];
      if (over > 0)
        for (const el of document.querySelectorAll('body *')) {
          const b = el.getBoundingClientRect();
          if (!b.width && !b.height) continue;
          if (b.right <= innerWidth + 0.5) continue;
          // Anything inside a deliberate horizontal scroller (the tab row, the
          // engine's own track) is allowed to be wider than the screen - that
          // is what a scroller is for. Only content that pushes the PAGE counts.
          let inScroller = false;
          for (let a = el.parentElement; a; a = a.parentElement) {
            const ov = getComputedStyle(a).overflowX;
            if (ov === 'auto' || ov === 'scroll' || ov === 'hidden') {
              inScroller = true;
              break;
            }
          }
          if (!inScroller) past.push(`<${el.tagName.toLowerCase()} class="${(el.className || '').toString().split(' ')[0]}"> reaches ${Math.round(b.right)}`);
        }
      return { over, past: past.slice(0, 6) };
    });
    assert.equal(found.over, 0, `${path} scrolls sideways by ${found.over}px at 320: ${found.past.join(' | ')}`);
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}

// The tab row wrapped: three tabs onto two rows at 320, five onto two at 600
// and 700. A wrapped row puts the divider glyph — which hangs off the tab that
// FOLLOWS it — dangling at the start of every new row, and Chevrolet's five
// body styles took more height than the car under them. The row does not wrap
// at any width now; it scrolls, and only when it has to.
test('no tab row wraps, at any width', async ({ browser }) => {
  const bad = [];
  for (const width of [320, 390, 600, 700, 992, 1400]) {
    const { ctx, page, errors } = await at(browser, 'brands.html', width);
    const rows = await page.evaluate(() =>
      [...document.querySelectorAll('[data-cargo="tabs"] [role="tablist"]')].map((row, i) => {
        const tabs = [...row.querySelectorAll('[role="tab"]')];
        return {
          i,
          lines: new Set(tabs.map((t) => Math.round(t.getBoundingClientRect().top))).size,
          overflow: row.scrollWidth - row.clientWidth,
          more: row.getAttribute('data-more'),
          justify: getComputedStyle(row).justifyContent,
          scrollLeft: Math.round(row.scrollLeft),
        };
      }),
    );
    assert.ok(rows.length, `no tab rows found on brands.html at ${width}`);
    for (const r of rows) {
      if (r.lines !== 1) bad.push(`${width}px bar ${r.i}: tabs sit on ${r.lines} lines`);
      // data-more is the script's report of the same fact the layout shows, and
      // the fade and the left alignment both hang off it. Out of step either
      // way and the row either fades an edge with nothing past it or centres a
      // scroller, which puts its own first tab out of reach.
      const overflows = r.overflow > 1;
      if (overflows && !r.more) bad.push(`${width}px bar ${r.i}: overflows by ${r.overflow} with no data-more`);
      if (!overflows && r.more) bad.push(`${width}px bar ${r.i}: data-more="${r.more}" on a row that fits`);
      if (overflows && r.justify !== 'flex-start') bad.push(`${width}px bar ${r.i}: a scrolling row is ${r.justify}, so its first tab is unreachable`);
      if (r.scrollLeft !== 0) bad.push(`${width}px bar ${r.i}: rests at scrollLeft ${r.scrollLeft}, not 0`);
    }
    assert.deepEqual(errors, []);
    await ctx.close();
  }
  assert.deepEqual(bad, [], bad.join(' | '));
});

// "It looks like you never decreased the size of the text or spacing to fit
// within the mobile viewport and there's overflow" (Steven, 2026-09-15). Two
// things were true. The phone tier had handed the tabs their full desktop
// padding back — the 768 rule squeezes the sides to 0.5em so three tabs fit a
// 320 screen, and a 576 rule setting the whole `padding` shorthand after it
// undid exactly that. And nothing shrank: a bar wider than the phone simply
// scrolled, so Chevrolet showed two and a half of its five tabs.
//
// Now the row shrinks to fit before it scrolls, down to a 12px floor, and the
// two bars whose WORDS could not fit at any readable size carry phone-short
// names in the platform's hidden-xs span — the same mechanism that always made
// Ford's bar the one that fitted.
test('a tab row shrinks to fit the phone rather than scrolling off it', async ({ browser }) => {
  const bad = [];
  for (const width of [320, 360, 390, 430]) {
    const { ctx, page, errors } = await at(browser, 'brands.html', width);
    const rows = await page.evaluate(() =>
      [...document.querySelectorAll('[data-cargo="tabs"] [role="tablist"]')].map((row, i) => {
        const tabs = [...row.querySelectorAll('[role="tab"]')];
        return {
          i,
          labels: tabs.map((t) => t.innerText.trim()).join('|'),
          px: parseFloat(getComputedStyle(tabs[0]).fontSize),
          over: row.scrollWidth - row.clientWidth,
          lines: new Set(tabs.map((t) => Math.round(t.getBoundingClientRect().top))).size,
          tapH: Math.round(tabs[0].getBoundingClientRect().height),
        };
      }),
    );
    assert.ok(rows.length, `no tab rows on brands.html at ${width}`);
    for (const r of rows) {
      if (r.lines !== 1) bad.push(`${width}px bar ${r.i}: ${r.lines} lines`);
      // The floor is the whole point of having one: below 12px a tab label
      // stops being readable, so the row is allowed to scroll instead. Anything
      // ABOVE the floor that still overflows means the shrink did not run.
      if (r.over > 2 && r.px > 12.01) bad.push(`${width}px bar ${r.i}: overflows by ${r.over} at ${r.px}px, which is above the 12px floor — it should have shrunk further (${r.labels})`);
      if (r.px < 11.99) bad.push(`${width}px bar ${r.i}: shrank to ${r.px}px, past the floor (${r.labels})`);
      // WCAG 2.5.8 wants 24px; the floor must not take the tap target under it.
      if (r.tapH < 24) bad.push(`${width}px bar ${r.i}: tab is ${r.tapH}px tall`);
    }
    assert.deepEqual(errors, []);
    await ctx.close();
  }
  assert.deepEqual(bad, [], bad.join(' | '));
});

// The phone tier must not hand back the side padding the tablet tier squeezed
// out — that regression is what made the tabs look untouched on a phone.
test('the phone tier keeps the squeezed side padding, not the desktop value', async ({ browser }) => {
  const { ctx, page, errors } = await at(browser, 'brands.html', 320);
  const pads = await page.evaluate(() =>
    [...document.querySelectorAll('[data-cargo="tabs"] [role="tab"]:first-child')].map((t) => {
      const cs = getComputedStyle(t);
      return { padX: parseFloat(cs.paddingLeft), px: parseFloat(cs.fontSize), marginX: parseFloat(cs.marginLeft) };
    }),
  );
  for (const p of pads) {
    // 0.5em a side is the squeeze; anything near the 1.1em default means the
    // shorthand in the phone rule overrode it again.
    assert.ok(p.padX <= p.px * 0.75, `a phone tab pads ${p.padX}px against a ${p.px}px label — the desktop padding came back`);
    assert.ok(p.marginX <= p.px * 0.3, `a phone tab is spaced ${p.marginX}px a side at ${p.px}px — the desktop gap came back`);
  }
  assert.deepEqual(errors, []);
  await ctx.close();
});

// Every card strip drops its arrows to 36px under 768 and 32px under 576, so
// the reserved channel each side gives the card its width back: 151px of a
// 320 screen became 175 on the six strips that had no phone rule at all.
test('every card strip shrinks its arrows on a phone', async ({ browser }) => {
  const { ctx, page, errors } = await at(browser, 'patterns.html', 320);
  const found = await page.evaluate(() => {
    const out = {};
    for (const root of document.querySelectorAll('.cs')) {
      const host = root.closest('[data-cargo]');
      if (!host || out[host.dataset.cargo]) continue;
      // A card strip reserves a channel for its arrows; a full-bleed pattern
      // (the hero, the galleries, the lightbox) overlays them on the picture
      // and gets nothing back by shrinking them, so it is not asked to.
      if (parseFloat(getComputedStyle(root).paddingInlineStart) < 1) continue;
      out[host.dataset.cargo] = getComputedStyle(root).getPropertyValue('--cs-arrow-size').trim();
    }
    return out;
  });
  const big = Object.entries(found).filter(([, v]) => parseFloat(v) > 32);
  assert.deepEqual(big, [], `at 320 these card strips still reserve a channel for a large arrow: ${big.map(([k, v]) => `${k}=${v}`).join(', ')}`);
  assert.ok(Object.keys(found).length >= 10, `only ${Object.keys(found).length} card strips found — the selector stopped matching`);
  assert.deepEqual(errors, []);
  await ctx.close();
});

// An arrow overlays media but never text (CLAUDE.md, "Two rules for pattern
// CSS"), and a card look reserves a channel for it precisely so it cannot land
// on the name. The tile look carried `padding-inline: 0` in its phone rule for
// months, which would have taken that channel away below 768 - it never fired,
// because the generated snippet's own gutter rule is (0,2,0) against the look's
// (0,1,0). Measured on 2026-09-15: with the zero forced on, the prev arrow
// overlapped the model name at both 390 and 320. So the line was deleted rather
// than strengthened, and this holds the reason.
test('no arrow lands on a card name at phone widths', async ({ browser }) => {
  for (const width of [390, 320]) {
    const { ctx, page, errors } = await at(browser, 'patterns.html', width);
    const hits = await page.evaluate(() => {
      const bad = [];
      const overlaps = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      for (const root of document.querySelectorAll('.cs')) {
        const host = root.closest('[data-cargo]');
        const arrows = [...root.querySelectorAll('.cs-arrow')].filter((a) => !a.hidden && a.offsetParent);
        const track = root.querySelector('.cs-track');
        if (!arrows.length || !track) continue;
        const t = track.getBoundingClientRect();
        for (const name of root.querySelectorAll('.cargo-name')) {
          const n = name.getBoundingClientRect();
          if (!n.width) continue;
          // Only cards at REST inside the viewport. A card mid-scroll slides
          // under the arrow by design - the arrow overlays the strip - so
          // judging those would fail every pattern for doing the right thing.
          const slide = name.closest('.cs-slide');
          const s = slide && slide.getBoundingClientRect();
          if (!s || s.left < t.left - 1 || s.right > t.right + 1) continue;
          for (const arrow of arrows) {
            if (overlaps(n, arrow.getBoundingClientRect())) {
              bad.push(`${host ? host.dataset.cargo : '(no data-cargo)'}: ${arrow.className.includes('prev') ? 'prev' : 'next'} arrow on “${name.textContent.trim().slice(0, 20)}”`);
            }
          }
        }
      }
      return [...new Set(bad)];
    });
    assert.deepEqual(hits, [], `at ${width} an arrow is drawn over a card name: ${hits.join('; ')}`);
    assert.deepEqual(errors, []);
    await ctx.close();
  }
});
