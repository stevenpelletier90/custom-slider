// Controls that told the truth about what the page was doing.
//
// Every one of these was a knob showing one thing while the slider did another,
// or a click that quietly threw away work. They are cheap to break again -
// nothing about them is visible in the generated CSS, which is why the linters
// never caught any of them.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { serve, launch, openBuilder, pick, setField } from './helpers.mjs';

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

// The value a knob displays, by its row label.
const knob = (page, label) =>
  page.evaluate((l) => {
    const row = [...document.querySelectorAll('#wb-settings label.wb-row')].find((r) => r.querySelector('span')?.textContent.trim() === l);
    return row ? (row.querySelector('input')?.value ?? null) : null;
  }, label);

const hasKnob = async (page, label) => (await knob(page, label)) !== null;

describe('a knob shows what the slider is actually using', () => {
  // F042: Tall photos set --cs-controls-space in its pattern CSS instead of its
  // props, so the knob read the engine's 2.5em while the strip resolved 3em -
  // and the copied CSS shipped both, in sequence, with no edit at all.
  test('Room for the dots agrees with the strip, before anyone touches it', async () => {
    await pick(page, 'models');
    const shown = await knob(page, 'Room for the dots');
    const [resolved, occurrences] = await page.evaluate(() => {
      const root = document.querySelector('#wb-stage .cs');
      const code = document.getElementById('wb-code').textContent;
      return [getComputedStyle(root).getPropertyValue('--cs-controls-space').trim(), (code.match(/--cs-controls-space:/g) || []).length];
    });
    assert.equal(shown, resolved, 'the knob and the slider disagree');
    assert.equal(occurrences, 1, 'the copied CSS sets the controls space more than once');
  });

  // F041: offered on the four gallery patterns, which draw a thumbnail strip
  // and have no dots - so the rule it added matched nothing.
  test('Show dots is not offered where there are no dots', async () => {
    await pick(page, 'gallery');
    assert.equal(await hasKnob(page, 'Show dots'), false, 'gallery mode still offers the dots switch');
    await pick(page, 'modelbar');
    assert.equal(await hasKnob(page, 'Show dots'), true, 'a pattern with dots lost its switch');
  });
});

describe('a click that looks like a no-op is one', () => {
  // F044: clicking the already-selected card style reset the ladder to that
  // look's default - 1/2/3/3 to 2/3/4/5 on the two-row grid, and the arrows and
  // dots vanished with it.
  test('re-selecting the current card style keeps a hand-set ladder', async () => {
    await pick(page, 'grid');
    const before = await page.evaluate(() => JSON.stringify(globalThis.CARGO.PATTERNS.grid.perView));
    // Change the ladder by hand first, so there is something to lose.
    const field = page.locator('#wb-settings label:has(> span:text-is("992px and up")) input').first();
    await field.fill('3');
    await page.waitForTimeout(120);
    const set = await knob(page, '992px and up');
    await page.click('#wb-settings .wb-look[aria-pressed="true"]');
    await page.waitForTimeout(150);
    assert.equal(await knob(page, '992px and up'), set, 're-selecting the current look reset the ladder');
    assert.ok(before, 'pattern defaults unreadable');
  });
});

describe('a control puts back everything it took', () => {
  // F039: "Start from the default" restored only the roster, so the previous
  // brand's card style and ladder survived - Vehicle cards came back as tall
  // tiles under a Honda and Toyota roster.
  test('Start from the default undoes the whole preset', async () => {
    await pick(page, 'cards');
    const look0 = await page.evaluate(() => globalThis.CARGO.PATTERNS.cards.look);
    const name = 'kept-name';
    const nameField = page.locator('[data-name-field]');
    await nameField.fill(name);
    await nameField.blur();

    const select = page.locator('#wb-settings select[aria-label="Brand preset"]');
    const brand = await select.evaluate((s) => [...s.options].map((o) => o.value).find((v) => v));
    await select.selectOption(brand);
    await page.waitForTimeout(200);
    await select.selectOption('');
    await page.waitForTimeout(200);

    const after = await page.evaluate(() => ({
      look: document.querySelector('#wb-settings .wb-look[aria-pressed="true"] span:last-child')?.textContent,
      cls: document.getElementById('wb-code').textContent.match(/^\.([\w-]+)\.cs \{/m)?.[1],
      lookClass: /cargo-(\w+)/.exec(document.getElementById('wb-code').textContent)?.[1],
    }));
    assert.equal(after.lookClass, look0, `the preset's card style survived the reset (${after.lookClass})`);
    assert.equal(after.cls, name, 'resetting the preset also threw away the slider name');
  });
});

describe('a number field refuses what the engine cannot page', () => {
  // F060: typing 2.5 emitted cs-lg-2 while the field went on showing 2.5, and
  // setting the property to 2.5 by hand makes the last page unreachable.
  test('a fractional count is not left showing in the field', async () => {
    await pick(page, 'modelbar');
    const field = page.locator('#wb-settings label:has(> span:text-is("phone")) input').first();
    await field.fill('2.5');
    await field.blur();
    await page.waitForTimeout(120);
    const shown = await field.inputValue();
    assert.ok(/^\d+$/.test(shown), `the field still shows "${shown}"`);
    const cls = await page.evaluate(() => /class="[^"]*cs-xs-(\d+)/.exec(document.getElementById('wb-code').textContent)?.[1] ?? null);
    if (cls !== null) assert.equal(cls, shown, 'the emitted column class disagrees with the field');
  });
});

describe('every producer reads the roster in effect', () => {
  // F077: the lightbox trigger read the pattern's own roster, the only producer
  // that did, so an edited slide 1 changed the photo inside the dialog and not
  // the thumbnail that opens it.
  test('editing slide one changes the lightbox thumbnail too', async () => {
    await pick(page, 'lightbox');
    // The first slide's Alt text specifically: Image URL is type=url and the
    // dimensions are type=number, so nth() over text inputs lands on slide two.
    const alt = page.locator('#wb-content fieldset').first().locator('label:has(> span:text-is("Alt text")) input').first();
    await alt.fill('A CHANGED DESCRIPTION');
    await page.waitForTimeout(200);
    const code = await page.evaluate(() => document.getElementById('wb-code').textContent);
    const trigger = /<button[^>]*cargo-lb-open[\s\S]*?<img[^>]*>/.exec(code)?.[0] ?? '';
    assert.match(trigger, /A CHANGED DESCRIPTION/, 'the trigger thumbnail did not take the edited alt text');
  });
});

describe('a knob the page actually reads', () => {
  // F038: the generated gutter rule wrote its own width on the same element the
  // Side gutter knob sets, and wrote it last - so the field took the edit, the
  // declaration shipped, and nothing moved. Measured on the model bar: 50px
  // drawn against the 47.75px the field named, unchanged after typing 7em.
  test('Side gutter changes the gutter the page draws', async () => {
    await pick(page, 'modelbar');
    const drawn = () => page.evaluate(() => +getComputedStyle(document.querySelector('#wb-stage .cs')).paddingLeft.replace('px', ''));
    const before = await drawn();
    await setField(page, 'Side gutter', '7em');
    const after = await drawn();
    assert.notEqual(after, before, 'the knob still does not move the gutter');
    const code = await page.evaluate(() => document.getElementById('wb-code').textContent);
    assert.match(code, /--strip-pad-x: 7em;/, 'the copied CSS lost the value');
    assert.match(code, /padding-inline: var\(--strip-pad-x,/, 'the gutter rule does not read the knob');
  });

  // With the rule reading the knob, a value the property cannot use stops being
  // harmless: padding-inline goes invalid and the 44px arrow lands on the card.
  test('a Side gutter value the property cannot use is refused, not drawn', async () => {
    await pick(page, 'modelbar');
    await setField(page, 'Side gutter', 'banana');
    const r = await page.evaluate(() => {
      const root = document.querySelector('#wb-stage .cs');
      const input = [...document.querySelectorAll('#wb-settings label > span')].find((x) => x.textContent.trim() === 'Side gutter')?.parentElement.querySelector('input');
      return {
        pad: +getComputedStyle(root).paddingLeft.replace('px', ''),
        flagged: input?.getAttribute('aria-invalid') === 'true',
        emitted: /--strip-pad-x:\s*([^;]*);/.exec(document.getElementById('wb-code').textContent)?.[1] ?? null,
      };
    });
    assert.ok(r.flagged, 'a non-length Side gutter was not flagged');
    assert.equal(r.emitted, null, 'the refused value reached the copied CSS');
    assert.ok(r.pad > 0, `the arrow channel collapsed to ${r.pad}px, so the arrow lands on the first card`);
  });
});

describe('nothing threw', () => {
  test('no page errors', () => {
    assert.deepEqual(errors, []);
  });
});
