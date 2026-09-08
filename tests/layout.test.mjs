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
import { openBuilder, pick } from './helpers.mjs';

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
  // The two card-style folders lead and sit together; the rest follow the order
  // a slider gets built, rare last.
  assert.deepEqual(await titles(page), ['Brand and card style', 'This card style', 'How many across', 'Arrows and dots', 'Behaviour', 'Advanced']);
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

// Pinned UNDER the masthead, not behind it: the masthead is sticky at 0 and
// 3.5rem tall, and a preview pinned at 1rem had its top 40px painted over.
// Both widths, because the pinning is no longer something only a 1200px window
// gets - the settings pass under the preview at every size now.
test('the preview pins below the masthead when the settings scroll', async ({ browser }) => {
  for (const w of [1440, 1024]) {
    const { page, errors } = await openBuilder(browser, w);
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(400);
    const box = await stageBox(page);
    assert.equal(box.position, 'sticky', `at ${w}: the preview is not pinned`);
    assert.ok(box.wrap.top >= box.headBottom, `at ${w}: the stage (${box.wrap.top}) is under the masthead (${box.headBottom})`);
    assert.ok(box.wrap.top <= box.headBottom + 32, `at ${w}: the stage sits ${Math.round(box.wrap.top - box.headBottom)}px below the masthead, which is not pinned`);
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

// A pinned preview that takes the whole window leaves a sliver of settings to
// work in, so it is capped - and the cap has to SHORTEN the picture, not hide
// the bottom of it. Tall photos is the pattern that proves it: 461px of frame
// at 1200, against a 587px box on a 900px window.
//
// The cap is `max(24rem, 60vh, 100vh - 3.5rem - 1px - 16rem)`, so this asserts
// the rule rather than one of the three numbers: whichever term wins at this
// viewport, the preview may not exceed it. The 16rem term is the real one on
// anything tall - the preview takes what is left after the masthead and a
// strip of settings - and the other two are floors under short windows.
const capPx = (winH) => Math.max(24 * 16, winH * 0.6, winH - 3.5 * 16 - 1 - 16 * 16);

test('the height cap keeps the pinned preview inside the reserved settings strip', async ({ browser }) => {
  const { page, errors } = await openBuilder(browser, 1440);
  await pick(page, 'models');
  await page.click('.ui-widths button[data-w="1200"]');
  await page.waitForTimeout(600);
  const box = await stageBox(page);
  assert.ok(box.preview.height <= capPx(box.winH) + 1, `the pinned preview is ${Math.round(box.preview.height)}px of a ${box.winH}px window, past the ${Math.round(capPx(box.winH))}px cap`);
  assert.ok(box.frame.bottom <= box.preview.bottom + 1, `the frame runs ${Math.round(box.frame.bottom - box.preview.bottom)}px past the bottom of the preview`);
  // The cap has to reach the SCALE, not just clip the box: with the width
  // alone deciding, this frame is drawn at 99% of its 461px inside a 540px box
  // that also has to hold the readout, and the readout goes below the fold of
  // a preview that exists so nothing has to be scrolled to.
  assert.equal(box.previewScrolls, false, 'the pinned preview has to be scrolled to see all of the frame');
  assert.ok(box.specBottom <= box.preview.bottom + 1, `the readout is ${Math.round(box.specBottom - box.preview.bottom)}px below the bottom of the preview it belongs to`);
  assert.ok(box.specVisible, 'the readout is off screen under a preview that is meant to fit');
  assert.ok(pct(box.shownAt) < 100, `the readout says ${box.shownAt} on a frame the cap had to shrink`);
  assert.equal(box.frameClient, 1200, 'the frame stopped being a real 1200px window');
  assert.deepEqual(errors, []);
});
