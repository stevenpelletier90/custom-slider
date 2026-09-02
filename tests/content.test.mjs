// F027: "Slides in this example" was a second owner of the slide count, and the
// only writer of it that did not rebuild the row list. Typing a smaller number
// left the editor offering rows the slider no longer had; editing one of them
// threw "Cannot set properties of undefined" and the edit was silently lost.
// It also moved with a brand preset without saying so, and vanished after the
// first edit.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { serve, launch, openBuilder, pick } from './helpers.mjs';

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

const rows = (page) => page.locator('#wb-content fieldset').count();
const note = (page) => page.evaluate(() => document.querySelector('#wb-content .wb-note')?.textContent ?? '');

describe('one owner of the slide count', () => {
  test('there is no second control for it', async () => {
    await pick(page, 'modelbar');
    const dial = await page.evaluate(() => [...document.querySelectorAll('#wb-settings label > span')].some((s) => /slides in this example/i.test(s.textContent)));
    assert.equal(dial, false, 'the slide-count dial is back');
  });

  test('the note counts the rows listed underneath it', async () => {
    for (const id of ['modelbar', 'grid', 'tabs']) {
      await pick(page, id);
      const n = await rows(page);
      const text = await note(page);
      assert.match(text, new RegExp(`\\b${n}\\b`), `${id}: the note does not say ${n}, the number of rows below it`);
    }
  });

  test('Add and Remove move the count, and the note follows', async () => {
    await pick(page, 'modelbar');
    const before = await rows(page);
    await page.click('#wb-content-add');
    await page.waitForTimeout(150);
    assert.equal(await rows(page), before + 1, 'Add did not add a row');
    assert.match(await note(page), new RegExp(`\\b${before + 1}\\b`), 'the note did not follow Add');

    // Editing the row that was just added must reach the code, not throw.
    const last = page.locator('#wb-content fieldset').last().locator('input[type="text"]').first();
    await last.fill('ADDED ROW EDIT');
    await page.waitForTimeout(150);
    const code = await page.evaluate(() => document.getElementById('wb-code').textContent);
    assert.match(code, /ADDED ROW EDIT/, 'editing the new row did not reach the snippet');
  });

  test('a preset says it brought the slides, and Fiat is not credited with cars it has none of', async () => {
    await pick(page, 'cards');
    const select = page.locator('#wb-settings select[aria-label="Brand preset"]');
    const withCars = await select.evaluate((s) => {
      const b = globalThis.CARGO.BRANDS ?? {};
      return [...s.options].map((o) => o.value).find((v) => v && b[v]?.models);
    });
    if (withCars) {
      await select.selectOption(withCars);
      await page.waitForTimeout(250);
      const text = await note(page);
      assert.match(text, /preset/, 'the note does not say the slides came from a preset');
      assert.match(text, new RegExp(`\\b${await rows(page)}\\b`), 'the note count disagrees with the rows after a preset');
    }
    const noCars = await select.evaluate((s) => {
      const b = globalThis.CARGO.BRANDS ?? {};
      return [...s.options].map((o) => o.value).find((v) => v && b[v] && !b[v].models);
    });
    if (noCars) {
      await select.selectOption(noCars);
      await page.waitForTimeout(250);
      assert.doesNotMatch(await note(page), /preset/, 'a preset with no roster was credited with the slides');
    }
  });
});

describe('nothing threw', () => {
  test('no page errors', () => {
    assert.deepEqual(errors, []);
  });
});

describe('the demo describes what it is actually showing', () => {
  // F075: all six filter-gallery captions described a different photograph
  // than the file they named - a blue Camaro in a desert for a technician
  // under a lift - with the categories wrong alongside them. The gallery
  // therefore demonstrated filtering by nothing true, and a designer keeping
  // the demo alt text shipped descriptions of photos their page does not have.
  test('every filter-gallery caption is the caption of that file', async () => {
    const mismatched = await page.evaluate(() => {
      const { PATTERNS } = globalThis.CARGO;
      const html = globalThis.CARGO.renderPattern('gallery-filter', 'x').html;
      const shown = [...html.matchAll(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"/g)].map((m) => [m[1], m[2]]);
      // The photo list is the one that was checked against the files.
      const truth = new Map(PATTERNS.gallery.models.map((m) => [m.img.replace('img/', ''), m.alt]));
      return shown.filter(([src, alt]) => {
        const file = src.split('/').pop();
        const want = [...truth.entries()].find(([f]) => f.split('.')[0] === file.split('.')[0]);
        return want && want[1] !== alt;
      });
    });
    assert.deepEqual(mismatched, [], 'these captions describe a different photo than the file they are on');
  });

  test('every filter chip matches at least one photo', async () => {
    await pick(page, 'gallery-filter');
    const empty = await page.evaluate(() => {
      const html = globalThis.CARGO.renderPattern('gallery-filter', 'x').html;
      const chips = [...html.matchAll(/data-filter="([^"]*)"/g)].map((m) => m[1]).filter(Boolean);
      const tags = new Set([...html.matchAll(/data-tag="([^"]*)"/g)].map((m) => m[1]));
      return chips.filter((c) => tags.size && !tags.has(c));
    });
    assert.deepEqual(empty, [], 'these chips filter to nothing');
  });

  // F026: brand notes read like a research log - "ladders", "forddemo1",
  // "the census" - none of which is defined anywhere a designer would look.
  test('the brand notes use no in-house jargon', async () => {
    const jargon = await page.evaluate(() => {
      const b = globalThis.CARGO.BRANDS ?? {};
      return Object.entries(b)
        .filter(([, v]) => /\bthe census\b|\bladder\b|forddemo/i.test(v.note ?? ''))
        .map(([k]) => k);
    });
    assert.deepEqual(jargon, [], 'these brand notes still use research shorthand');
  });
});
