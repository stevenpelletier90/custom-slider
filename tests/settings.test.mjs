// F025: slide content survived a reload and the settings did not, so a designer
// came back to their own slides under the wrong card style, with the wrong
// class name and the wrong ladder - and nothing on the page said why. The
// asymmetry was the bug: remembering half the state is worse than none.
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { openBuilder, pick, setField, stageReady } from './helpers.mjs';

test.describe.configure({ mode: 'serial' });

let ctx, page, errors;

test.beforeAll(async ({ browser }) => {
  ({ ctx, page, errors } = await openBuilder(browser, 1500));
});

const shown = (page) =>
  page.evaluate(() => ({
    name: document.querySelector('[data-name-field]').value,
    look: document.querySelector('#wb-settings .wb-look[aria-pressed="true"] span:last-child')?.textContent ?? null,
    gap: /--cs-gap:\s*([^;]*);/.exec(document.getElementById('wb-code').textContent)?.[1] ?? null,
    perView: [...document.querySelectorAll('#wb-settings label.wb-row')].filter((r) => /phone|and up/.test(r.querySelector('span')?.textContent ?? '')).map((r) => r.querySelector('input').value),
    frame: document.querySelector('.ui-widths button[aria-pressed="true"]')?.dataset.w ?? null,
  }));

// Settings are a scratchpad until Keep is pressed. They used to write
// themselves on every render, so a value typed to see what it looked like was
// still there next week - on a pattern the designer had forgotten touching,
// holding out the shipped default it replaced. What survives a reload is what
// someone decided should.
test.describe('the settings come back with the slides once they are kept', () => {
  test('card style, ladder, gap, name and preview width all survive a reload', async () => {
    await pick(page, 'cards');
    const nameField = page.locator('[data-name-field]');
    await nameField.fill('used-inventory');
    await nameField.blur();
    await setField(page, 'Gap', '1.75em');
    const ladder = page.locator('#wb-settings label:has(> span:text-is("Laptop · 992+")) input').first();
    await ladder.fill('4');
    await page.waitForTimeout(120);
    await page.click('.ui-widths button[data-w="992"]');
    await page.waitForTimeout(150);

    const before = await shown(page);
    assert.equal(before.name, 'used-inventory');
    assert.equal(before.gap, '1.75em');
    assert.equal(before.frame, '992');

    await page.click('#wb-keep');
    await page.waitForTimeout(200);
    await page.reload({ waitUntil: 'load' });
    await stageReady(page);
    const after = await shown(page);
    assert.deepEqual(after, before, 'the settings did not come back the way they were left');
  });

  test('each pattern keeps its own settings', async () => {
    await pick(page, 'modelbar');
    await setField(page, 'Gap', '2.25em');
    await page.click('#wb-keep');
    await page.waitForTimeout(150);
    await pick(page, 'service');
    await setField(page, 'Gap', '0.75em');
    await page.click('#wb-keep');
    await page.waitForTimeout(150);

    await page.reload({ waitUntil: 'load' });
    await stageReady(page);
    await pick(page, 'modelbar');
    assert.equal((await shown(page)).gap, '2.25em', 'the model bar took another pattern settings');
    await pick(page, 'service');
    assert.equal((await shown(page)).gap, '0.75em', 'service cards lost their own gap');
  });

  test('a poisoned entry does not take the page down or reach the snippet', async () => {
    await pick(page, 'modelbar');
    await page.evaluate(() => {
      const all = JSON.parse(localStorage.getItem('cs-settings')) ?? { byPattern: {} };
      all.byPattern.modelbar = {
        look: 'a-look-that-does-not-exist',
        perView: { base: 2.5, 768: 99, 1200: 3 },
        props: { '--cs-gap': '1em"><script>x</script>', 'javascript:evil': '1em', '--cs-arrow-fg': '#0a0' },
        data: { 'data-cs-step': 'slide', onclick: 'evil()' },
        name: '2024 Specials',
        count: 999,
      };
      localStorage.setItem('cs-settings', JSON.stringify(all));
    });
    await page.reload({ waitUntil: 'load' });
    await stageReady(page);

    const r = await page.evaluate(() => ({
      stage: globalThis.CARGO.sdoc().documentElement.innerHTML.length,
      code: document.getElementById('wb-code').textContent,
      name: document.querySelector('[data-name-field]').value,
      rows: document.querySelectorAll('#wb-content fieldset').length,
    }));
    assert.ok(r.stage > 100, 'a poisoned settings entry blanked the Build page');
    assert.doesNotMatch(r.code, /<script>x/, 'a stored value broke out of the attribute it was written into');
    assert.doesNotMatch(r.code, /javascript:evil|onclick/, 'a key that is not a --custom-property or data-cs- attribute was restored');
    assert.match(r.code, /--cs-arrow-fg: #0a0;/, 'a legitimate stored property was thrown away with the bad ones');
    assert.equal(r.name, 'slider-2024-specials', 'a stored name skipped the sanitiser');
    assert.ok(r.rows <= 16, `the stored count of 999 produced ${r.rows} rows`);
    // 2.5 and 99 are refused; 3 is a real tier value and comes back.
    assert.doesNotMatch(r.code, /cs-xs-2\.5|cs-sm-99/, 'an out-of-range stored ladder value was restored');
  });

  test('a width the window forced is not remembered as a choice', async () => {
    await pick(page, 'modelbar');
    await page.click('.ui-widths button[data-w="1200"]');
    await page.waitForTimeout(150);
    // Shrink until the 1200 frame no longer fits, so the builder steps down.
    await page.setViewportSize({ width: 900, height: 900 });
    await page.waitForTimeout(300);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('cs-settings') ?? '{}').frame);
    assert.equal(stored, 1200, `the forced step-down overwrote the chosen width with ${stored}`);
    await page.setViewportSize({ width: 1500, height: 900 });
    await page.waitForTimeout(300);
  });
});

test.describe('nothing threw', () => {
  test('no page errors', () => {
    assert.deepEqual(errors, []);
  });
});

// Settings and slides are a scratchpad until Keep is pressed. They used to
// write themselves to localStorage on every render, which made every experiment
// permanent: a value typed to see what it looked like was still there next
// week, on a pattern the designer had forgotten touching, quietly holding out
// the shipped default it replaced.
//
// The split that makes this work is a SESSION store separate from the kept one.
// Persistence is opt-in; keeping your work while the page is open is not, or
// clicking the next pattern would throw away the slides you just wrote - a
// worse bug than the one being fixed (F007 again, by another route).
test.describe('nothing is remembered across a reload unless it is kept', () => {
  const gap = (p) => p.locator('#wb-settings label:has(> span:text-is("Gap")) input[type=text]').first();
  const flags = (p) =>
    p.evaluate(() => ({
      dirty: !document.getElementById('wb-dirty').hidden,
      keep: !document.getElementById('wb-keep').disabled,
      reset: !document.getElementById('wb-reset').disabled,
      stored: !!JSON.parse(localStorage.getItem('cs-settings') || '{}')?.byPattern?.cards,
    }));

  const fresh = async () => {
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'load' });
    await stageReady(page);
    await pick(page, 'cards');
    await page.waitForTimeout(200);
  };

  test('an edit is offered for keeping, and thrown away by a reload if it is not', async () => {
    await fresh();
    assert.deepEqual(await flags(page), { dirty: false, keep: false, reset: false, stored: false }, 'a freshly loaded pattern is not dirty');

    await gap(page).fill('2.5em');
    await page.waitForTimeout(300);
    const edited = await flags(page);
    assert.equal(edited.dirty, true, 'an edit did not mark the panel');
    assert.equal(edited.keep, true, 'Keep is not offered for an edit');
    assert.equal(edited.stored, false, 'the edit reached storage without being kept');

    await page.reload({ waitUntil: 'load' });
    await stageReady(page);
    await pick(page, 'cards');
    await page.waitForTimeout(200);
    assert.equal(await gap(page).inputValue(), '1em', 'an unkept edit survived a reload');
  });

  test('Keep makes it survive, and Reset puts the pattern back to what it ships as', async () => {
    await fresh();
    await gap(page).fill('2.5em');
    await page.waitForTimeout(300);
    await page.click('#wb-keep');
    await page.waitForTimeout(300);
    const kept = await flags(page);
    assert.equal(kept.stored, true, 'Keep did not store anything');
    assert.equal(kept.dirty, false, 'the panel still reads as unsaved after Keep');

    await page.reload({ waitUntil: 'load' });
    await stageReady(page);
    await pick(page, 'cards');
    await page.waitForTimeout(200);
    assert.equal(await gap(page).inputValue(), '2.5em', 'a kept edit did not come back');

    await page.click('#wb-reset');
    await page.waitForTimeout(400);
    assert.equal(await gap(page).inputValue(), '1em', 'Reset did not restore the shipped value');
    assert.equal((await flags(page)).stored, false, 'Reset left the kept entry behind');

    await page.reload({ waitUntil: 'load' });
    await stageReady(page);
    await pick(page, 'cards');
    await page.waitForTimeout(200);
    assert.equal(await gap(page).inputValue(), '1em', 'the reset did not outlive a reload');
  });

  // The half that persistence-by-default was accidentally providing. An edit
  // has to follow you from pattern to pattern within the session even though
  // nothing has been written to disk.
  test('an unkept edit still survives switching pattern and back', async () => {
    await fresh();
    await gap(page).fill('3.25em');
    await page.waitForTimeout(300);
    await pick(page, 'modelbar');
    await page.waitForTimeout(200);
    await pick(page, 'cards');
    await page.waitForTimeout(200);
    assert.equal(await gap(page).inputValue(), '3.25em', 'switching pattern threw away an unkept edit');
    assert.equal((await flags(page)).stored, false, 'the session edit leaked into storage');
  });
});
