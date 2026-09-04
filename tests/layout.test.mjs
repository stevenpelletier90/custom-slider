// The panel reads in the order decisions get made, nothing splits, the preview
// stays on screen while the settings scroll - and it is never cut off: a frame
// wider than its column is scaled down, never clipped and never capped.
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
    const w = wrap.getBoundingClientRect();
    const f = frame.getBoundingClientRect();
    return {
      wrap: { top: w.top, bottom: w.bottom, left: w.left, right: w.right },
      frame: { top: f.top, bottom: f.bottom, left: f.left, right: f.right },
      headBottom: head.getBoundingClientRect().bottom,
      transform: getComputedStyle(frame).transform,
      // The layout width the media queries inside the frame actually see, and
      // the container the slider gets inside it. Neither may move when the
      // picture is scaled.
      frameClient: frame.clientWidth,
      rootWidth: Math.round(frame.contentDocument.querySelector('.cs')?.getBoundingClientRect().width ?? 0),
      specVisible: document.querySelector('.ui-spec').getBoundingClientRect().bottom <= innerHeight,
      shownAt: document.getElementById('spec-scale-item').hidden ? null : document.getElementById('spec-scale').textContent,
    };
  });

test('folders come in decision order on the model bar', async ({ browser }) => {
  const { page, errors } = await openBuilder(browser, 1440);
  await pick(page, 'modelbar');
  assert.deepEqual(await titles(page), ['Brand and card style', 'How many across', 'This card style', 'Arrows and dots', 'Behaviour', 'Advanced']);
  assert.equal(await expanded(page, 'Advanced'), false, 'Advanced starts closed');
  assert.equal(await expanded(page, 'Brand and card style'), true);
  assert.deepEqual(errors, []);
});

// Pinned UNDER the masthead, not behind it: the masthead is sticky at 0 and
// 3.5rem tall, and a preview pinned at 1rem had its top 40px painted over.
test('the preview pins below the masthead when the settings scroll', async ({ browser }) => {
  const { page, errors } = await openBuilder(browser, 1440);
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(400);
  const box = await stageBox(page);
  assert.ok(box.wrap.top >= box.headBottom, `the stage (${box.wrap.top}) is under the masthead (${box.headBottom})`);
  assert.ok(box.wrap.top <= box.headBottom + 32, `the stage sits ${Math.round(box.wrap.top - box.headBottom)}px below the masthead, which is not pinned`);
  assert.deepEqual(errors, []);
});

test('the preview is in flow, above the settings, at 1024', async ({ browser }) => {
  const { page, errors } = await openBuilder(browser, 1024);
  const pos = await page.evaluate(() => getComputedStyle(document.querySelector('.ui-preview')).position);
  assert.equal(pos, 'static');
  const order = await page.evaluate(() => {
    const preview = document.querySelector('.ui-preview');
    const panel = document.querySelector('.ui-panel');
    return preview.getBoundingClientRect().top < panel.getBoundingClientRect().top;
  });
  assert.equal(order, true, 'the preview is below the settings at 1024');
  assert.deepEqual(errors, []);
});

// The whole point of the round: a 1200px frame in a ~790px column is SHOWN
// smaller, never cut off, and the numbers under it stay the real ones.
test('a frame wider than its column is scaled to fit, not clipped', async ({ browser }) => {
  for (const [w, want] of [
    [1440, '1200'],
    [1024, '992'],
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
    assert.ok(box.shownAt !== null && box.shownAt !== '100%', `at ${w}: the readout does not say the preview is scaled (${box.shownAt})`);
    assert.deepEqual(errors, [], `at ${w}: a page error occurred`);
  }
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
  assert.equal(box.transform, 'none', 'a 390px frame in a 790px column is being transformed');
  assert.equal(box.shownAt, null, 'the readout claims a scale on a preview shown at full size');
  assert.deepEqual(errors, []);
});
