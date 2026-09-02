// Controls that told the truth about what the page was doing.
//
// Every one of these was a knob showing one thing while the slider did another,
// or a click that quietly threw away work. They are cheap to break again -
// nothing about them is visible in the generated CSS, which is why the linters
// never caught any of them.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { serve, launch, openBuilder, pick, setField, copyParts } from './helpers.mjs';

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

// A colour row puts the swatch first, and a swatch can only hold #rrggbb - it
// reads #000000 for a transparent or an rgba(). The text field beside it is
// the authoritative one.
const colorKnob = (page, label) =>
  page.evaluate((l) => {
    const row = [...document.querySelectorAll('#wb-settings label.wb-row')].find((r) => r.querySelector('span')?.textContent.trim() === l);
    return row?.querySelector('input[type=text]')?.value ?? null;
  }, label);

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

describe('the rotation the hero was born with is a control, not a literal', () => {
  // F054: data-cs-autoplay has been a first-class engine option all along and
  // the panel never showed it. The hero shipped it hard-wired at 5000 and no
  // other pattern could turn it on, so slowing a hero, holding one still, or
  // rotating a testimonial strip all meant knowing the attribute and editing
  // the copied markup by hand.
  const ROW = 'Rotate every (ms, 0 = off)';
  const rotate = (page) => page.locator(`#wb-settings label.wb-row:has(> span:text-is("${ROW}")) input`).first();
  const set = async (page, v) => {
    await rotate(page).fill(v);
    await rotate(page).dispatchEvent('change');
    await page.waitForTimeout(250);
  };
  const code = (page) => page.evaluate(() => document.getElementById('wb-code').textContent);

  test('the field shows the hero the timer it is actually running', async () => {
    await pick(page, 'hero');
    assert.equal(await rotate(page).inputValue(), '5000', 'the field invented its own value beside the hero 5000');
    assert.match(await code(page), /data-cs-autoplay="5000"/, 'the hero stopped shipping its timer');
  });

  test('zero takes the attribute away instead of writing a zero', async () => {
    await pick(page, 'hero');
    await set(page, '0');
    assert.doesNotMatch(await code(page), /data-cs-autoplay/, 'off still ships the attribute');
  });

  test('a strip that never rotated can be told to', async () => {
    await pick(page, 'reviews');
    await set(page, '7000');
    assert.match(await code(page), /data-cs-autoplay="7000"/, 'the value never reached the snippet');
  });

  // A number input refuses letters outright, so the reachable bad values are a
  // negative (every engine guard is `> 0`, so it would silently do nothing) and
  // an empty box - the F022 shape, where a cleared field emitted the property
  // with no value at all.
  test('a value the engine would misread is refused', async () => {
    await pick(page, 'reviews');
    for (const bad of ['-500', '']) {
      await set(page, '3000');
      assert.match(await code(page), /data-cs-autoplay="3000"/, 'the set-up value did not take');
      await set(page, bad);
      assert.doesNotMatch(await code(page), /data-cs-autoplay/, `"${bad}" reached the attribute`);
    }
  });

  test('turning it on drops the rewind the engine would have overridden', async () => {
    await pick(page, 'models');
    assert.match(await code(page), /data-cs-rewind="false"/, 'Tall photos no longer ships rewind=false, so this guards nothing');
    await set(page, '4000');
    assert.doesNotMatch(await code(page), /data-cs-rewind/, 'the snippet would console-warn on every page that runs it');
  });

  test('it is not offered where the engine throws it away', async () => {
    for (const id of ['gallery', 'gallery-filter', 'media-gallery', 'lightbox']) {
      await pick(page, id);
      assert.equal(await rotate(page).count(), 0, `${id}: gallery mode offers a timer the engine discards`);
    }
  });
});

describe('peek is offered wherever it can do something', () => {
  // F058: the row appeared only where the pattern had already set --cs-peek,
  // which was the one pattern named after it. "Show a sliver of the next car"
  // lands on a model bar just as often.
  test('a scrolling strip can show a sliver of the next card', async () => {
    for (const id of ['modelbar', 'cards', 'grid', 'service']) {
      await pick(page, id);
      assert.equal(await hasKnob(page, 'Peek'), true, `${id}: no Peek row`);
    }
  });

  test('off ships no declaration at all', async () => {
    await pick(page, 'modelbar');
    assert.equal(await knob(page, 'Peek'), '0px', 'Peek does not start off');
    const { css } = await copyParts(page);
    assert.doesNotMatch(css, /--cs-peek/, '0px is the engine default and should never be written');
  });

  test('a value reaches the copied CSS and narrows the card', async () => {
    await pick(page, 'modelbar');
    const wide = await page.evaluate(() => document.querySelector('#wb-stage .cs-slide').getBoundingClientRect().width);
    await setField(page, 'Peek', '2em');
    await page.waitForTimeout(250);
    const narrow = await page.evaluate(() => document.querySelector('#wb-stage .cs-slide').getBoundingClientRect().width);
    const { css } = await copyParts(page);
    assert.match(css, /--cs-peek:\s*2em/, 'the value never reached the copied CSS');
    assert.ok(narrow < wide, `the slide did not narrow: ${wide} -> ${narrow}`);
  });

  test('not offered where the track padding is overridden away', async () => {
    for (const id of ['hero', 'gallery', 'lightbox']) {
      await pick(page, id);
      assert.equal(await hasKnob(page, 'Peek'), false, `${id}: offers a Peek the track rule ignores`);
    }
  });

  // The pattern named after peek set its phone value in its CSS rather than its
  // props, so turning Peek off left 1.5em under 768 while the field read 0px -
  // the same shape as the controls-space bug on Tall photos.
  test('turning Peek off leaves nothing behind on phones', async () => {
    await pick(page, 'peek');
    await setField(page, 'Peek', '0px');
    await page.waitForTimeout(250);
    const { css } = await copyParts(page);
    assert.doesNotMatch(css, /--cs-peek/, 'a media query still sets peek where the knob cannot see it');
  });
});

describe('a property the slider is already using has a control', () => {
  // F056 / F057: five engine properties the Reference documents and the panel
  // never offered. Two of them were worse than merely absent - the portrait
  // and logo looks ship --cs-arrow-bg-hover in their settings, and the hero
  // sets --cs-dot-current in its props, so those values were going out with
  // nothing able to show a designer what had been chosen for them.
  const ROWS = ['Arrow colour, hover', 'Arrow background, hover', 'Dot size', 'Dot colour', 'Dot colour, current'];

  // `cards`, not `modelbar`: a model bar ships its dots off, so it correctly
  // has no dot rows at all.
  test('the arrow and dot rows are there on a pattern that has both', async () => {
    await pick(page, 'cards');
    for (const label of ROWS) assert.equal(await hasKnob(page, label), true, `no "${label}" row`);
  });

  test('a look that ships a hover colour shows the one it ships', async () => {
    await pick(page, 'cards');
    // Ask the data which look carries it rather than naming one here - the
    // point is that whichever look ships a value, the field shows that value.
    const look = await page.evaluate(() => {
      const L = globalThis.CARGO.LOOKS;
      const id = Object.keys(L).find((k) => L[k].settings['--cs-arrow-bg-hover']);
      return id ? { label: L[id].label, value: L[id].settings['--cs-arrow-bg-hover'] } : null;
    });
    assert.ok(look, 'no card style ships an arrow hover colour, so this guards nothing');
    await page.evaluate((label) => [...document.querySelectorAll('#wb-settings .wb-look')].find((b) => b.textContent.includes(label))?.click(), look.label);
    await page.waitForTimeout(300);
    assert.equal(await colorKnob(page, 'Arrow background, hover'), look.value, `${look.label} ships ${look.value} and the field does not show it`);
  });

  test('the hero shows the current-dot colour it was born with', async () => {
    await pick(page, 'hero');
    assert.equal(await colorKnob(page, 'Dot colour, current'), '#16324f', 'the hero sets this blind and the field does not show it');
  });

  test('a dot colour reaches the copied CSS and the drawn dot', async () => {
    await pick(page, 'cards');
    await setField(page, 'Dot colour', '#c8102e');
    await page.waitForTimeout(250);
    // Not the first dot: that one is current, and correctly draws in
    // --cs-dot-current rather than the colour under test.
    const drawn = await page.evaluate(() => getComputedStyle(document.querySelector('#wb-stage .cs-dot:not(.cs-dot--current)'), '::after').backgroundColor);
    const { css } = await copyParts(page);
    assert.match(css, /--cs-dot-fg:\s*#c8102e/, 'the value never reached the copied CSS');
    assert.equal(drawn, 'rgb(200, 16, 46)', `the dot is drawn ${drawn}`);
  });

  // F056: --cs-arrow-size was reachable only by hand-editing the snippet, and
  // six designs resize the arrow inside their own media queries - which the
  // field cannot own. Rather than imply one size at every width, the panel
  // reads those rules back and says what they set.
  test('arrow size is editable and reaches the drawn arrow', async () => {
    await pick(page, 'cards');
    await setField(page, 'Arrow size', '60px');
    await page.waitForTimeout(250);
    const drawn = await page.evaluate(() => +document.querySelector('#wb-stage .cs-arrow').getBoundingClientRect().width.toFixed(0));
    const { css } = await copyParts(page);
    assert.match(css, /--cs-arrow-size:\s*60px/, 'the value never reached the copied CSS');
    assert.equal(drawn, 60, `the arrow is drawn ${drawn}px`);
  });

  test('a design that resizes the arrow in a media query says so', async () => {
    await pick(page, 'models'); // sets 56px at (min-width: 992px) in its own CSS
    const notes = await page.evaluate(() => [...document.querySelectorAll('#wb-settings .wb-note')].map((n) => n.textContent));
    assert.ok(
      notes.some((t) => /arrow to 56px at \(min-width: 992px\)/.test(t)),
      `no note names the media-query size the design sets: ${JSON.stringify(notes)}`,
    );
    await pick(page, 'peek'); // sets it nowhere
    const none = await page.evaluate(() => [...document.querySelectorAll('#wb-settings .wb-note')].map((n) => n.textContent));
    assert.ok(!none.some((t) => /sets the arrow to/.test(t)), 'a note claims a media-query size on a design that sets none');
  });

  test('the dot rows go away with the dots', async () => {
    await pick(page, 'gallery'); // a thumbnail rail, no dots at all
    for (const label of ['Dot size', 'Dot colour', 'Dot colour, current']) {
      assert.equal(await hasKnob(page, label), false, `gallery mode offers "${label}" where there are no dots`);
    }
  });
});

describe('card chrome is a knob, not a literal', () => {
  // F061: the vehicle card's 1px #e2e5ea border and its 1.04 hover zoom were
  // literals in the look's CSS, no look had a shadow, and there was no badge
  // slot at all - so a border colour or a "New" flash meant hand CSS.
  // The card style has to be chosen, not assumed: an earlier test in this file
  // switches the style on `cards`, and picking the pattern again does not put
  // the original back.
  const wearVcard = async (page) => {
    await pick(page, 'cards');
    await page.evaluate(() => [...document.querySelectorAll('#wb-settings .wb-look')].find((b) => b.textContent.includes('Vehicle card'))?.click());
    await page.waitForTimeout(300);
  };

  test('the border and the zoom show the values the card has always had', async () => {
    await wearVcard(page);
    assert.equal(await colorKnob(page, 'Card border'), '1px solid #e2e5ea', 'the border knob does not show the border the card draws');
    assert.equal(await knob(page, 'Zoom on hover'), '1.04', 'the zoom knob does not show the zoom the card has always done');
  });

  test('a shadow reaches the card', async () => {
    await wearVcard(page);
    await setField(page, 'Card shadow', '0 2px 8px rgba(0, 0, 0, 0.15)');
    await page.waitForTimeout(250);
    const drawn = await page.evaluate(() => getComputedStyle(document.querySelector('#wb-stage .cargo-card')).boxShadow);
    assert.notEqual(drawn, 'none', 'the shadow never reached the card');
    const { css } = await copyParts(page);
    assert.match(css, /--card-shadow:\s*0 2px 8px rgba\(0, 0, 0, 0\.15\)/, 'the shadow is missing from the copied CSS');
  });

  test('the defaults are still dropped from the snippet', async () => {
    await pick(page, 'grid'); // the tile look, untouched
    const { css } = await copyParts(page);
    for (const k of ['--card-shadow', '--badge-bg', '--badge-fg']) {
      assert.doesNotMatch(css, new RegExp(k), `${k} is pasted even though it equals the card style's own default`);
    }
  });
});

describe('nothing threw', () => {
  test('no page errors', () => {
    assert.deepEqual(errors, []);
  });
});
