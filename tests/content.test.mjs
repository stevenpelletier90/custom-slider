// F027: "Slides in this example" was a second owner of the slide count, and the
// only writer of it that did not rebuild the row list. Typing a smaller number
// left the editor offering rows the slider no longer had; editing one of them
// threw "Cannot set properties of undefined" and the edit was silently lost.
// It also moved with a brand preset without saying so, and vanished after the
// first edit.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { serve, launch, openBuilder, pick, copyParts } from './helpers.mjs';

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

  // F062: a photo slide was a bare <img> in a <span>, so a caption meant
  // hand-writing <figure>/<figcaption> and its CSS per slide.
  const captionBox = (page) => page.locator('#wb-content fieldset').first().locator('label:has(> span:text-is("Caption")) input').first();

  test('a caption reaches the copied markup, and nothing is emitted without one', async () => {
    await pick(page, 'gallery');
    const bare = await copyParts(page);
    assert.doesNotMatch(bare.html, /<figure|figcaption/, 'an empty caption still ships a figure');
    assert.match(bare.html, /<span class="cargo-photo">/, 'the uncaptioned slide stopped being the markup that shipped before');
    // And the rule goes with it: five patterns would otherwise paste a
    // figcaption rule matching nothing.
    assert.doesNotMatch(bare.css, /figcaption/, 'an uncaptioned pattern still ships the caption rule');

    await captionBox(page).fill('Courtesy vehicles while you wait');
    await page.waitForTimeout(250);
    const done = await copyParts(page);
    assert.match(done.html, /<figure class="cargo-photo">[\s\S]*?<figcaption>Courtesy vehicles while you wait<\/figcaption>/, 'the caption never reached the markup');
    assert.match(done.css, /\.cargo-photo figcaption \{/, 'the caption rule is missing from the copied CSS');
  });

  test('the caption carries its own size and leading, and the figure its own margin', async () => {
    await pick(page, 'gallery');
    await captionBox(page).fill('A caption');
    await page.waitForTimeout(250);
    const r = await page.evaluate(() => {
      const f = document.querySelector('#wb-stage figure.cargo-photo');
      const c = f?.querySelector('figcaption');
      if (!c) return null;
      const fs = getComputedStyle(f);
      const cs = getComputedStyle(c);
      return { figMargin: `${fs.marginTop} ${fs.marginLeft}`, display: cs.display, size: cs.fontSize, leading: cs.lineHeight };
    });
    assert.ok(r, 'no figure rendered');
    assert.equal(r.figMargin, '0px 0px', `the UA figure margin survived: ${r.figMargin}`);
    assert.equal(r.display, 'block', 'the caption is not a block');
    assert.notEqual(r.leading, 'normal', 'the caption takes the host page leading');
  });

  // F031 must not come back: a box offered where the markup cannot draw it.
  test('the Caption box is offered only where a caption is drawn', async () => {
    for (const id of ['hero', 'gallery', 'peek', 'lightbox', 'gallery-filter']) {
      await pick(page, id);
      assert.equal(await captionBox(page).count(), 1, `${id}: no Caption box on a pattern whose slide is only a photo`);
    }
    for (const id of ['video', 'media-gallery', 'modelbar', 'cards']) {
      await pick(page, id);
      assert.equal(await captionBox(page).count(), 0, `${id}: offers a Caption box that goes nowhere`);
    }
  });

  // F061: no card style had a badge slot, so "New" or "Certified" over a photo
  // was hand-written markup and hand-written CSS per card.
  const badgeBox = (page) => page.locator('#wb-content fieldset').first().locator('label:has(> span:text-is("Badge")) input').first();

  test('a badge is drawn only where one is typed', async () => {
    await pick(page, 'cards');
    const bare = await copyParts(page);
    assert.doesNotMatch(bare.html, /cargo-badge/, 'an empty badge still ships an element');

    await badgeBox(page).fill('Certified');
    await page.waitForTimeout(250);
    const done = await copyParts(page);
    assert.match(done.html, /<span class="cargo-badge">Certified<\/span>/, 'the badge never reached the markup');
    // One card carries it, not all six.
    assert.equal((done.html.match(/cargo-badge/g) || []).length, 1, 'the badge landed on more than the card it was typed into');
  });

  test('the Badge box is offered only on the card styles that draw it', async () => {
    await pick(page, 'grid'); // tile draws it
    assert.equal(await badgeBox(page).count(), 1, 'no Badge box on a card style whose markup draws one');
    // Switch to a style that does not read it and the box must go with it.
    const other = await page.evaluate(() => {
      const L = globalThis.CARGO.LOOKS;
      const id = Object.keys(L).find((k) => !/badge/.test(String(L[k].markup)));
      const b = [...document.querySelectorAll('#wb-settings .wb-look')].find((x) => x.textContent.includes(L[id].label));
      b?.click();
      return !!b && L[id].label;
    });
    assert.ok(other, 'every card style draws a badge, so this guards nothing');
    await page.waitForTimeout(300);
    assert.equal(await badgeBox(page).count(), 0, `${other} does not draw a badge but still offers the box`);
  });

  // F019 (the half that needs no decision): the words on a card style's button
  // were literals - "Shop Now", "Browse inventory", "Visit" - so changing them
  // meant editing the pasted markup by hand on every card.
  test('the button keeps its own wording until someone types other words', async () => {
    await pick(page, 'cards');
    await page.evaluate(() => [...document.querySelectorAll('#wb-settings .wb-look')].find((b) => b.textContent.includes('Location card'))?.click());
    await page.waitForTimeout(300);
    const box = page.locator('#wb-content fieldset').first().locator('label:has(> span:text-is("Button text")) input').first();
    assert.equal(await box.count(), 1, 'a card style with a button offers no Button text box');
    assert.match((await copyParts(page)).html, /Visit/, 'the card style stopped printing its own wording');
    await box.fill('See this store');
    await page.waitForTimeout(250);
    assert.match((await copyParts(page)).html, /See this store/, 'the typed wording never reached the markup');
  });

  test('a card style with no button does not offer the box', async () => {
    await pick(page, 'grid'); // the cutout tile: photo and name, no button
    await page.evaluate(() => [...document.querySelectorAll('#wb-settings .wb-look')].find((b) => b.textContent.includes('Cutout tile'))?.click());
    await page.waitForTimeout(300);
    const box = page.locator('#wb-content fieldset').first().locator('label:has(> span:text-is("Button text")) input');
    assert.equal(await box.count(), 0, 'a card style with no button offers a Button text box');
  });

  // F017 (the half that needs no decision): the hero could not be a linked
  // slide, though the editor already had a Link field - the hero's rows just
  // never carried the key.
  test('a hero slide can be a link, and is not one until it is given a href', async () => {
    await pick(page, 'hero');
    const bare = await copyParts(page);
    assert.doesNotMatch(bare.html, /<a href/, 'an empty Link still wraps the photo');
    const box = page.locator('#wb-content fieldset').first().locator('label:has(> span:text-is("Link")) input').first();
    assert.equal(await box.count(), 1, 'the hero offers no Link box');
    await box.fill('/new-inventory/index.htm');
    await page.waitForTimeout(250);
    const done = await copyParts(page);
    assert.match(done.html, /<a href="\/new-inventory\/index\.htm"><img/, 'the link never reached the markup');
    // An inline <a> would take the host page's leading, the same trap the
    // caption and the tab strip are guarded against.
    assert.match(done.css, /\.cargo-photo a \{ display: block; \}/, 'the linked photo ships no display rule');
  });

  // F017: 68 of the 76 OEM homepages surveyed run a hero whose anatomy is a
  // whole-slide link wrapping a <picture> with mobile and desktop art, and the
  // builder could not produce that shape at all.
  const phoneBox = (page) => page.locator('#wb-content fieldset').first().locator('label:has(> span:text-is("Phone image")) input').first();

  test('a hero can carry different art on a phone, and does not until it is given some', async () => {
    await pick(page, 'hero');
    const bare = await copyParts(page);
    assert.doesNotMatch(bare.html, /<picture|<source/, 'an empty Phone image still ships a <picture>');
    assert.equal(await phoneBox(page).count(), 1, 'the hero offers no Phone image box');

    await phoneBox(page).fill('img/photo-4.jpg');
    await page.waitForTimeout(250);
    const done = await copyParts(page);
    assert.match(done.html, /<picture>\s*<source media="\(max-width: 767\.98px\)" srcset="[^"]+">/, 'no <source> for the phone art');
    // The <img> must survive as the fallback, or a browser without <picture>
    // support gets an empty slide.
    assert.match(done.html, /<source[\s\S]{0,200}?<img src="[^"]+"[^>]*alt=/, 'the desktop <img> fallback is gone');
    // And the phone art must be rewritten to a platform path like every other
    // image the copy panel hands over - srcset was not covered before.
    assert.doesNotMatch(done.html, /srcset="img\//, 'the phone art still points at the demo folder');
  });

  test('the Phone image box is offered only on the hero', async () => {
    for (const id of ['gallery', 'peek', 'cards', 'modelbar']) {
      await pick(page, id);
      assert.equal(await phoneBox(page).count(), 0, `${id}: offers a Phone image box that goes nowhere`);
    }
  });

  // F018: tab names were editable but membership was not - every pane showed
  // the same roster at its own offset, and tabs are 30 of the 55 model bars in
  // the census. Nobody typing a Tab must still get the rotation that shipped
  // before, or every existing snippet changes under them.
  const tabBox = (page, n = 0) => page.locator('#wb-content fieldset').nth(n).locator('label:has(> span:text-is("Tab")) input').first();

  const paneCards = (page) => page.evaluate(() => [...document.querySelectorAll('#wb-stage .cargo-pane')].map((p) => [...p.querySelectorAll('.cargo-name')].map((n) => n.textContent.trim())));

  test('an untouched roster keeps the rotation it always emitted', async () => {
    await pick(page, 'tabs');
    await page.waitForTimeout(300);
    const panes = await paneCards(page);
    assert.equal(panes.length, 3, 'not three panes');
    assert.notDeepEqual(panes[0], panes[1], 'the panes became identical');
    assert.ok(
      panes.every((p) => p.length > 0),
      'a pane came out empty',
    );
    assert.equal(await tabBox(page).count(), 1, 'the tabbed bar offers no Tab box');
  });

  test('typing a tab name moves that slide into that tab alone', async () => {
    await pick(page, 'tabs');
    await page.waitForTimeout(300);
    // The Heading, named explicitly: the first text input in a fieldset is the
    // Image URL, so nth(0) reads a filename rather than the card's name.
    const first = await page.locator('#wb-content fieldset').first().locator('label:has(> span:text-is("Heading")) input').first().inputValue();
    await tabBox(page).fill('SUVs');
    await page.waitForTimeout(350);
    const panes = await paneCards(page);
    const inTrucks = panes[0].includes(first);
    const inSuvs = panes[1].includes(first);
    assert.equal(inSuvs, true, `"${first}" is not in the SUVs pane`);
    assert.equal(inTrucks, false, `"${first}" is still in the Trucks pane as well`);
  });

  test('a slide with no tab is shared, so no pane empties', async () => {
    await pick(page, 'tabs');
    await page.waitForTimeout(300);
    await tabBox(page).fill('SUVs');
    await page.waitForTimeout(350);
    const panes = await paneCards(page);
    assert.ok(
      panes.every((p) => p.length > 0),
      `a pane emptied: ${JSON.stringify(panes.map((p) => p.length))}`,
    );
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

describe('nothing threw', () => {
  test('no page errors', () => {
    assert.deepEqual(errors, []);
  });
});
