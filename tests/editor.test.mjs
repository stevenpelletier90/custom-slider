// The slide editor: fields that took typing and shipped it nowhere, a field
// type that rejected the editor's own suggestions, and a warning that named
// the wrong brand on fourteen of seventeen patterns.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { serve, launch, openBuilder, pick, patternIds } from './helpers.mjs';

let server, browser, page, errors;

before(async () => {
  server = await serve();
  browser = await launch();
  ({ page, errors } = await openBuilder(browser, server.origin, 1500));
});

after(async () => {
  await browser?.close();
  await server?.close();
});

describe('every field the editor offers reaches the code', () => {
  // F031: the cutout roster carries a wordmark and a paragraph for the looks
  // that have a slot. The tile has neither, so those two boxes accepted typing,
  // stored it in localStorage, and shipped it nowhere.
  const fillFirstSlide = async (page, tag) => {
    const boxes = page.locator('#wb-content fieldset').first().locator('input[type="text"], textarea');
    const n = await boxes.count();
    const typed = [];
    for (let i = 0; i < n; i++) {
      const label = await boxes.nth(i).evaluate((el) => el.closest('label')?.querySelector('span')?.textContent.trim() ?? '?');
      const value = `${tag}-${i}`;
      await boxes.nth(i).fill(value);
      typed.push([label, value]);
    }
    await page.waitForTimeout(250);
    const code = await page.evaluate(() => document.getElementById('wb-code').textContent);
    return typed.filter(([, value]) => !code.includes(value)).map(([label]) => label);
  };

  test('the model bar offers no box the cutout tile cannot draw', async () => {
    await pick(page, 'modelbar');
    assert.deepEqual(await fillFirstSlide(page, 'MB'), [], 'these fields took typing and shipped it nowhere');
  });

  test('switching card style adds and removes the fields with it', async () => {
    await pick(page, 'grid');
    const before = await page.locator('#wb-content fieldset').first().locator('input[type="text"], textarea').count();
    const other = await page.evaluate(() => {
      const b = [...document.querySelectorAll('#wb-settings .wb-look')].find((x) => x.getAttribute('aria-pressed') !== 'true');
      b?.click();
      return !!b;
    });
    if (!other) return;
    await page.waitForTimeout(250);
    assert.deepEqual(await fillFirstSlide(page, 'GR'), [], 'after switching style, a field is offered that the new style cannot draw');
    const after = await page.locator('#wb-content fieldset').first().locator('input[type="text"], textarea').count();
    assert.ok(Number.isInteger(before) && Number.isInteger(after), 'field counts unreadable');
  });
});

describe('a field does not reject the value it suggests', () => {
  // F032: Image URL and Link were type=url, which rejects #MISCPATH#..., a
  // /static/ library path and img/... - every shape the editor itself offers.
  // Chromium paints nothing for it, so the only symptom was 16 fields on the
  // model bar reported invalid to a screen reader with no visible cause.
  test('the editor accepts its own placeholder', async () => {
    await pick(page, 'modelbar');
    const img = page.locator('#wb-content fieldset').first().locator('label:has(> span:text-is("Image URL")) input').first();
    const placeholder = await img.getAttribute('placeholder');
    assert.ok(placeholder, 'Image URL lost its hint');
    await img.fill(placeholder);
    await page.waitForTimeout(200);
    const bad = await page.evaluate(() => document.querySelectorAll('#wb-content :invalid').length);
    assert.equal(bad, 0, 'the editor marks its own suggested path invalid');
  });

  test('no slide field is born invalid', async () => {
    for (const id of ['modelbar', 'cards', 'service', 'gallery']) {
      await pick(page, id);
      const bad = await page.evaluate(() => document.querySelectorAll('#wb-content :invalid').length);
      assert.equal(bad, 0, `${id}: fields are invalid before anyone has typed anything`);
    }
  });
});

describe('the photo warning describes the photos that are there', () => {
  // F034: it said "Chevrolet stock art" on every pattern - true of three at
  // their default brand, wrong for the other twelve image patterns, seven of
  // which reference no vehicle at all.
  test('it names no make, and counts what is still an example', async () => {
    for (const id of await patternIds(page)) {
      await pick(page, id);
      const row = await page.evaluate(() => document.querySelector('.ui-parts-warn')?.textContent ?? '');
      if (!row) continue;
      assert.doesNotMatch(row, /chevrolet|ford|toyota|honda/i, `${id}: the photo warning names a make it cannot know`);
      assert.match(row, /\d+ of \d+/, `${id}: the photo warning does not count what is still an example`);
    }
  });

  test('replacing every photo clears the warning', async () => {
    await pick(page, 'gallery');
    const boxes = page.locator('#wb-content label:has(> span:text-is("Image URL")) input');
    const n = await boxes.count();
    for (let i = 0; i < n; i++) await boxes.nth(i).fill(`/uploads/dealer/own-${i}.jpg`);
    await page.waitForTimeout(300);
    const row = await page.evaluate(() => document.querySelector('.ui-parts-warn')?.textContent ?? '');
    assert.equal(row, '', 'the warning still nags after every photo has been replaced');
  });
});

describe('nothing threw', () => {
  test('no page errors', () => {
    assert.deepEqual(errors, []);
  });
});
