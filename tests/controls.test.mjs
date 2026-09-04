// Controls that told the truth about what the page was doing.
//
// Every one of these was a knob showing one thing while the slider did another,
// or a click that quietly threw away work. They are cheap to break again -
// nothing about them is visible in the generated CSS, which is why the linters
// never caught any of them.
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { ORIGIN, openBuilder, pick, setField, rowByLabel, openFolder, switchRow, copyParts, stageFrame, patternIds, hostHtml, engineFiles } from './helpers.mjs';

test.describe.configure({ mode: 'serial' });

let browser, page, errors;

test.beforeAll(async ({ browser: b }) => {
  browser = b;
  ({ page, errors } = await openBuilder(browser, 1500));
});

// The value a knob displays, by its row label.
const knob = (page, label) =>
  page.evaluate((l) => {
    const row = [...document.querySelectorAll('#wb-settings .tp-lblv')].find((r) => r.querySelector('.tp-lblv_l')?.textContent.trim() === l);
    if (!row) return null;
    const el = row.querySelector('input, select');
    return el ? (el.type === 'checkbox' ? String(el.checked) : el.value) : null;
  }, label);

const hasKnob = async (page, label) => (await knob(page, label)) !== null;

// Until the colour plugin lands a colour row is a text row, so it reads the
// same way.
const colorKnob = knob;

test.describe('a knob shows what the slider is actually using', () => {
  // F042: Tall photos set --cs-controls-space in its pattern CSS instead of its
  // props, so the knob read the engine's 2.5em while the strip resolved 3em -
  // and the copied CSS shipped both, in sequence, with no edit at all.
  test('Room for the dots agrees with the strip, before anyone touches it', async () => {
    await pick(page, 'models');
    const shown = await knob(page, 'Room for the dots');
    const [resolved, occurrences] = await page.evaluate(() => {
      const root = globalThis.CARGO.sdoc().querySelector('.cs');
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

test.describe('a click that looks like a no-op is one', () => {
  // F044: clicking the already-selected card style reset the ladder to that
  // look's default - 1/2/3/3 to 2/3/4/5 on the two-row grid, and the arrows and
  // dots vanished with it.
  test('re-selecting the current card style keeps a hand-set ladder', async () => {
    await pick(page, 'grid');
    const before = await page.evaluate(() => JSON.stringify(globalThis.CARGO.PATTERNS.grid.perView));
    // Change the ladder by hand first, so there is something to lose.
    await setField(page, 'Laptop · 992+', '3');
    const set = await knob(page, 'Laptop · 992+');
    await page.click('#wb-settings .tp-lookv button[aria-pressed="true"]');
    await page.waitForTimeout(150);
    assert.equal(await knob(page, 'Laptop · 992+'), set, 're-selecting the current look reset the ladder');
    assert.ok(before, 'pattern defaults unreadable');
  });
});

test.describe('a control puts back everything it took', () => {
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

    const select = rowByLabel(page, 'Brand').locator('select');
    const brand = await select.evaluate((s) => [...s.options].map((o) => o.value).find((v) => v));
    await select.selectOption(brand);
    await page.waitForTimeout(200);
    // The panel is rebuilt by the change, so the row has to be found again.
    await rowByLabel(page, 'Brand').locator('select').selectOption('');
    await page.waitForTimeout(200);

    const after = await page.evaluate(() => ({
      look: document.querySelector('#wb-settings .tp-lookv button[aria-pressed="true"] span:last-child')?.textContent,
      cls: document.getElementById('wb-code').textContent.match(/^\.([\w-]+)\.cs \{/m)?.[1],
      lookClass: /cargo-(\w+)/.exec(document.getElementById('wb-code').textContent)?.[1],
    }));
    assert.equal(after.lookClass, look0, `the preset's card style survived the reset (${after.lookClass})`);
    assert.equal(after.cls, name, 'resetting the preset also threw away the slider name');
  });
});

test.describe('a number field refuses what the engine cannot page', () => {
  // F060: typing 2.5 emitted cs-lg-2 while the field went on showing 2.5, and
  // setting the property to 2.5 by hand makes the last page unreachable.
  test('a fractional count is not left showing in the field', async () => {
    await pick(page, 'modelbar');
    const field = await setField(page, 'Phone · under 768', '2.5');
    const shown = await field.inputValue();
    assert.ok(/^\d+$/.test(shown), `the field still shows "${shown}"`);
    const cls = await page.evaluate(() => /class="[^"]*cs-xs-(\d+)/.exec(document.getElementById('wb-code').textContent)?.[1] ?? null);
    if (cls !== null) assert.equal(cls, shown, 'the emitted column class disagrees with the field');
  });
});

test.describe('every producer reads the roster in effect', () => {
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

test.describe('a knob the page actually reads', () => {
  // F038: the generated gutter rule wrote its own width on the same element the
  // Side gutter knob sets, and wrote it last - so the field took the edit, the
  // declaration shipped, and nothing moved. Measured on the model bar: 50px
  // drawn against the 47.75px the field named, unchanged after typing 7em.
  test('Side gutter changes the gutter the page draws', async () => {
    await pick(page, 'modelbar');
    const drawn = () => page.evaluate(() => +getComputedStyle(globalThis.CARGO.sdoc().querySelector('.cs')).paddingLeft.replace('px', ''));
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
      const root = globalThis.CARGO.sdoc().querySelector('.cs');
      const input = [...document.querySelectorAll('#wb-settings .tp-lblv')].find((r) => r.querySelector('.tp-lblv_l')?.textContent.trim() === 'Side gutter')?.querySelector('input');
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

test.describe('the rotation the hero was born with is a control, not a literal', () => {
  // F054: data-cs-autoplay has been a first-class engine option all along and
  // the panel never showed it. The hero shipped it hard-wired at 5000 and no
  // other pattern could turn it on, so slowing a hero, holding one still, or
  // rotating a testimonial strip all meant knowing the attribute and editing
  // the copied markup by hand.
  const ROW = 'Rotate every (ms)';
  const rotate = (page) => rowByLabel(page, ROW).locator('input').first();
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

  // The reachable bad values are a negative (every engine guard is `> 0`, so it
  // would silently do nothing) and an empty box - the F022 shape, where a
  // cleared field emitted the property with no value at all. The row is a
  // bound number now, so a negative arrives clamped to the 0 that means off,
  // and an empty box is refused at the commit and the field is redrawn with
  // the timer still in force. Either way the attribute is never written
  // empty, and the field never shows something the snippet does not.
  test('a value the engine would misread is refused', async () => {
    await pick(page, 'reviews');
    await set(page, '3000');
    assert.match(await code(page), /data-cs-autoplay="3000"/, 'the set-up value did not take');
    await set(page, '-500');
    assert.doesNotMatch(await code(page), /data-cs-autoplay/, '"-500" reached the attribute');

    await set(page, '3000');
    await set(page, '');
    assert.doesNotMatch(await code(page), /data-cs-autoplay=""/, 'an empty box reached the attribute');
    assert.equal(await rotate(page).inputValue(), '3000', 'the field no longer shows the timer the snippet ships');
    assert.match(await code(page), /data-cs-autoplay="3000"/, 'the snippet lost the timer the field still shows');
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

test.describe('peek is offered wherever it can do something', () => {
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
    const wide = await page.evaluate(() => globalThis.CARGO.sdoc().querySelector('.cs-slide').getBoundingClientRect().width);
    await setField(page, 'Peek', '2em');
    await page.waitForTimeout(250);
    const narrow = await page.evaluate(() => globalThis.CARGO.sdoc().querySelector('.cs-slide').getBoundingClientRect().width);
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

test.describe('a property the slider is already using has a control', () => {
  // F056 / F057: five engine properties the Reference documents and the panel
  // never offered. Two of them were worse than merely absent - the portrait
  // and logo looks ship --cs-arrow-bg-hover in their settings, and the hero
  // sets --cs-dot-current in its props, so those values were going out with
  // nothing able to show a designer what had been chosen for them.
  const ROWS = ['Arrow colour · hover', 'Arrow background · hover', 'Dot size', 'Dot colour', 'Dot colour, current'];

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
    await page.evaluate((label) => [...document.querySelectorAll('#wb-settings .tp-lookv button')].find((b) => b.textContent.includes(label))?.click(), look.label);
    await page.waitForTimeout(300);
    assert.equal(await colorKnob(page, 'Arrow background · hover'), look.value, `${look.label} ships ${look.value} and the field does not show it`);
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
    const drawn = await page.evaluate(() => getComputedStyle(globalThis.CARGO.sdoc().querySelector('.cs-dot:not(.cs-dot--current)'), '::after').backgroundColor);
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
    const drawn = await page.evaluate(() => +globalThis.CARGO.sdoc().querySelector('.cs-arrow').getBoundingClientRect().width.toFixed(0));
    const { css } = await copyParts(page);
    assert.match(css, /--cs-arrow-size:\s*60px/, 'the value never reached the copied CSS');
    assert.equal(drawn, 60, `the arrow is drawn ${drawn}px`);
  });

  test('a design that resizes the arrow in a media query says so', async () => {
    await pick(page, 'models'); // sets 56px at (min-width: 992px) in its own CSS
    const notes = await page.evaluate(() => [...document.querySelectorAll('#wb-settings .tp-notev')].map((n) => n.textContent));
    assert.ok(
      notes.some((t) => /arrow to 56px at \(min-width: 992px\)/.test(t)),
      `no note names the media-query size the design sets: ${JSON.stringify(notes)}`,
    );
    await pick(page, 'peek'); // sets it nowhere
    const none = await page.evaluate(() => [...document.querySelectorAll('#wb-settings .tp-notev')].map((n) => n.textContent));
    assert.ok(!none.some((t) => /sets the arrow to/.test(t)), 'a note claims a media-query size on a design that sets none');
  });

  test('the dot rows go away with the dots', async () => {
    await pick(page, 'gallery'); // a thumbnail rail, no dots at all
    for (const label of ['Dot size', 'Dot colour', 'Dot colour, current']) {
      assert.equal(await hasKnob(page, label), false, `gallery mode offers "${label}" where there are no dots`);
    }
  });
});

test.describe('card chrome is a knob, not a literal', () => {
  // F061: the vehicle card's 1px #e2e5ea border and its 1.04 hover zoom were
  // literals in the look's CSS, no look had a shadow, and there was no badge
  // slot at all - so a border colour or a "New" flash meant hand CSS.
  // The card style has to be chosen, not assumed: an earlier test in this file
  // switches the style on `cards`, and picking the pattern again does not put
  // the original back.
  const wearVcard = async (page) => {
    await pick(page, 'cards');
    await page.evaluate(() => [...document.querySelectorAll('#wb-settings .tp-lookv button')].find((b) => b.textContent.includes('Vehicle card'))?.click());
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
    const drawn = await page.evaluate(() => getComputedStyle(globalThis.CARGO.sdoc().querySelector('.cargo-card')).boxShadow);
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

test.describe('a tab can be renamed', () => {
  // F018 (the half that needs no decision): Trucks/SUVs/Crossovers were
  // hard-coded, so a New/Used/Certified bar meant editing the pasted markup.
  test('renaming a tab moves its words, its id and its aria wiring together', async () => {
    await pick(page, 'tabs');
    // Tab names starts closed - it is a rename, not a setting anyone reaches
    // for on every build - so a person opens it before typing in it.
    await openFolder(page, 'Tab names');
    const box = rowByLabel(page, 'Tab 1').locator('input').first();
    assert.equal(await box.count(), 1, 'the tabbed bar offers no way to rename a tab');
    assert.equal(await box.inputValue(), 'Trucks', 'the box does not show the name the bar is using');

    await box.fill('Certified');
    await page.waitForTimeout(300);
    const { html } = await copyParts(page);
    assert.match(html, /role="tab"[^>]*>Certified</, 'the tab still reads Trucks');
    assert.match(html, /id="tab-certified"[^>]*aria-controls="pane-certified"/, 'the id did not follow the name');
    assert.match(html, /id="pane-certified"[^>]*role="tabpanel"[^>]*aria-labelledby="tab-certified"/, 'the pane and the tab no longer point at each other');
    assert.doesNotMatch(html, /trucks/i, 'the old name survives somewhere in the markup');
  });

  test('clearing a tab name puts the original back', async () => {
    await pick(page, 'tabs');
    await openFolder(page, 'Tab names');
    const box = rowByLabel(page, 'Tab 2').locator('input').first();
    await box.fill('');
    await page.waitForTimeout(300);
    assert.match((await copyParts(page)).html, /role="tab"[^>]*>SUVs</, 'an empty box left the tab nameless');
  });

  test('a pattern with no tabs is not offered the section', async () => {
    await pick(page, 'modelbar');
    assert.equal(await rowByLabel(page, 'Tab 1').locator('input').count(), 0, 'a pattern with no tabs offers tab names');
  });
});

test.describe('a link to a card style opens that card style', () => {
  // F074: all seven "Open in the builder" buttons under the card styles on the
  // Patterns page pointed at #modelbar, so six of the seven opened whichever
  // style happened to be remembered and read as a broken link.
  test('the Patterns page names the style in every link', async () => {
    const links = await page.evaluate(async (origin) => {
      const html = await fetch(`${origin}/demo/assets/gallery.js`).then((r) => r.text());
      return [...html.matchAll(/index\.html#([^"'`]*)/g)].map((m) => m[1]);
    }, ORIGIN);
    assert.ok(
      links.some((h) => h.includes('/')),
      `no link carries a card style: ${JSON.stringify(links)}`,
    );
  });

  test('opening one lands on it, not on whatever was last used', async () => {
    // Leave a different style remembered first, so the link has to beat it.
    await pick(page, 'modelbar');
    await page.evaluate(() => [...document.querySelectorAll('#wb-settings .tp-lookv button')].find((b) => b.textContent.includes('Vehicle card'))?.click());
    await page.waitForTimeout(300);

    // A query string as well as the hash: navigating from index.html to
    // index.html#... is a same-document move, so the script would never re-run
    // and this would test nothing.
    await page.goto(`${ORIGIN}/demo/index.html?f074#modelbar/logo`, { waitUntil: 'load' });
    await page.waitForTimeout(600);
    const shown = await page.evaluate(() => document.querySelector('#wb-settings .tp-lookv button[aria-pressed="true"] span:last-child')?.textContent);
    const cls = await page.evaluate(() => /cargo-(\w+)/.exec(document.getElementById('wb-code').textContent)?.[1]);
    assert.equal(cls, 'logo', `the link opened ${cls}, not the style it named`);
    assert.ok(shown, 'no card style is shown as selected');
  });
});

test.describe('the small things a designer trips over', () => {
  // F089: the builder read location.hash once at boot, so typing a different
  // #pattern and pressing Enter left the previous one on screen - and Back and
  // Forward were dead for the same reason.
  test('editing the address switches the pattern', async () => {
    await pick(page, 'modelbar');
    await page.evaluate(() => {
      location.hash = '#service';
    });
    await page.waitForTimeout(500);
    const showing = await page.evaluate(() => document.querySelector('#wb-nav button[aria-current="true"]')?.dataset.go);
    assert.equal(showing, 'service', 'the address says one pattern and the stage shows another');
  });

  test('a hash naming nothing is left alone', async () => {
    await pick(page, 'modelbar');
    await page.evaluate(() => {
      location.hash = '#not-a-pattern';
    });
    await page.waitForTimeout(400);
    const showing = await page.evaluate(() => document.querySelector('#wb-nav button[aria-current="true"]')?.dataset.go);
    assert.equal(showing, 'modelbar', 'an unknown hash changed the pattern');
  });

  // F086: comparing seven card styles meant clicking all seven and watching the
  // preview, because the description only appeared once you had chosen one.
  test('every card style button says what it is before you click it', async () => {
    await pick(page, 'modelbar');
    const titles = await page.evaluate(() => [...document.querySelectorAll('#wb-settings .tp-lookv button')].map((b) => b.getAttribute('title')));
    assert.ok(titles.length >= 7, `only ${titles.length} card styles`);
    assert.deepEqual(
      titles.filter((t) => !t || t.length < 10),
      [],
      'a card style button carries no usable tooltip',
    );
  });

  // F093: "3 sliders" is true of the card grid and misleading on the tabbed
  // bar, where the three carousels are one bar's three panes.
  test('the tabbed bar counts panes, the card grid counts sliders', async () => {
    await pick(page, 'tabs');
    await page.waitForTimeout(200);
    assert.match(await page.evaluate(() => document.getElementById('spec-across').textContent), /panes/, 'the tabbed bar still calls its panes sliders');
    await pick(page, 'card-gallery');
    await page.waitForTimeout(200);
    const cg = await page.evaluate(() => document.getElementById('spec-across').textContent);
    if (/·/.test(cg)) assert.match(cg, /sliders/, 'the card grid calls its sliders panes');
  });

  // F091: rosters store names HTML-escaped, so a name beginning with a quote
  // put the "&" of the entity in the avatar circle instead of a letter.
  test('the avatar shows a letter, not the start of an entity', async () => {
    await pick(page, 'reviews');
    const box = page.locator('#wb-content fieldset').first().locator('input[type="text"]').first();
    await box.fill('"Bee" Wilson');
    await page.waitForTimeout(300);
    const shown = await page.evaluate(() => globalThis.CARGO.sdoc().querySelector('.cargo-avatar')?.textContent?.trim());
    assert.equal(shown, 'B', `the avatar reads "${shown}"`);
  });
});

test.describe('the hero can put its dots on the photo', () => {
  // F057: the hero reserved a strip under the photo and drew its dots there,
  // where 57 of the 76 OEM heroes overlay them. Off by default, because the
  // census argues for making it easy and not for changing what exists.
  const overBox = (page) => switchRow(page, 'Dots over the image');

  const geometry = (page) =>
    page.evaluate(() => {
      const root = globalThis.CARGO.sdoc().querySelector('.cs');
      const img = root.querySelector('.cargo-photo img');
      const dots = root.querySelector('.cs-dots');
      const arrow = root.querySelector('.cs-arrow--prev');
      const r = root.getBoundingClientRect();
      const i = img.getBoundingClientRect();
      return {
        rootH: +r.height.toFixed(1),
        imgH: +i.height.toFixed(1),
        arrowMid: +(arrow.getBoundingClientRect().top + arrow.getBoundingClientRect().height / 2 - r.top).toFixed(1),
        dotsOnPhoto: dots.getBoundingClientRect().top < i.bottom - 1,
      };
    });

  test('it is off until it is asked for', async () => {
    await pick(page, 'hero');
    await page.waitForTimeout(250);
    assert.equal(await overBox(page).count(), 1, 'the hero offers no way to overlay its dots');
    assert.equal(await overBox(page).isChecked(), false, 'the hero now overlays its dots by default');
    assert.equal((await geometry(page)).dotsOnPhoto, false, 'the dots start on the photo');
  });

  test('turning it on moves the dots without resizing the photo or shifting the arrows', async () => {
    await pick(page, 'hero');
    await page.waitForTimeout(250);
    const before = await geometry(page);
    await overBox(page).check();
    await page.waitForTimeout(350);
    const after = await geometry(page);
    assert.equal(after.dotsOnPhoto, true, 'the dots did not move onto the photo');
    assert.equal(after.imgH, before.imgH, `the photo resized: ${before.imgH} -> ${after.imgH}`);
    assert.equal(after.arrowMid, before.arrowMid, `the arrows moved: ${before.arrowMid} -> ${after.arrowMid}`);
    assert.ok(after.rootH < before.rootH, 'the reserved strip was not given back');
  });

  // The one that matters, and the one that was missing: positioned over the
  // photo is not the same as PAINTED over it. The dot row takes no z-index of
  // its own, so the track painted straight over it - measured, the stack at a
  // dot's centre was IMG, .cargo-photo, .cs-slide, .cs-track, then the dot.
  // Geometry and computed style both said the dots were fine; they were
  // invisible on the page.
  test('a dot is the topmost thing at its own centre', async () => {
    await pick(page, 'hero');
    await page.waitForTimeout(250);
    if (!(await overBox(page).isChecked())) {
      await overBox(page).check();
      await page.waitForTimeout(350);
    }
    await stageFrame(page).locator('.cs-dots').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    // Hit-tested inside the frame's own document. The preview is an iframe now,
    // so the parent's elementsFromPoint stops at the <iframe> element and would
    // report a clean stack for a dot buried under the photo.
    const stack = await page.evaluate(() => {
      const d = globalThis.CARGO.sdoc();
      const dot = d.querySelector('.cs-dot');
      const r = dot.getBoundingClientRect();
      return d.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2).map((e) => `${e.tagName}.${String(e.className).split(' ').filter(Boolean)[0] ?? ''}`);
    });
    assert.ok(stack.length, 'the dot is not in the viewport, so this proves nothing');
    assert.match(stack[0], /cs-dot/, `the photo paints over the dots — stack was ${stack.slice(0, 4).join(' > ')}`);
  });

  test('the dots turn light, and the knobs say so', async () => {
    await pick(page, 'hero');
    await page.waitForTimeout(250);
    await overBox(page).check();
    await page.waitForTimeout(350);
    // A control must show what the slider is using, so the colour knobs have to
    // carry the overlay values rather than them being applied behind the panel.
    assert.match(await colorKnob(page, 'Dot colour'), /255/, 'the dot colour knob does not show the light value in force');
    assert.equal(await colorKnob(page, 'Dot colour, current'), '#fff', 'the current-dot knob does not show the light value in force');
  });

  test('turning it off hands back exactly what was there', async () => {
    await pick(page, 'hero');
    await page.waitForTimeout(250);
    // Settings are remembered per pattern, and the test above leaves this on -
    // so start from a known off state or the baseline is the overlaid value.
    if (await overBox(page).isChecked()) {
      await overBox(page).uncheck();
      await page.waitForTimeout(350);
    }
    const was = { space: await knob(page, 'Room for the dots'), current: await colorKnob(page, 'Dot colour, current') };
    await overBox(page).check();
    await page.waitForTimeout(350);
    await overBox(page).uncheck();
    await page.waitForTimeout(350);
    assert.equal(await knob(page, 'Room for the dots'), was.space, 'the reserved strip came back a different size');
    assert.equal(await colorKnob(page, 'Dot colour, current'), was.current, 'the current-dot colour did not come back');
  });

  test('it is not offered where the dots would land on card text', async () => {
    for (const id of ['modelbar', 'cards', 'service']) {
      await pick(page, id);
      await page.waitForTimeout(200);
      assert.equal(await overBox(page).count(), 0, `${id}: offers to overlay dots onto a card`);
    }
  });
});

test.describe('the last engine properties reach the panel', () => {
  // F099 / F102 / F103: six properties the engine documents and the panel never
  // offered, so matching a focus ring or resizing a gallery thumbnail meant
  // reading the name off the Reference and hand-editing the snippet.
  test('a gallery offers its thumbnail sizes', async () => {
    await pick(page, 'gallery');
    for (const label of ['Thumbnail width', 'Thumbnail height', 'Thumbnail zoom']) {
      assert.equal(await hasKnob(page, label), true, `no "${label}" row on a gallery`);
    }
    await pick(page, 'modelbar');
    assert.equal(await hasKnob(page, 'Thumbnail width'), false, 'a pattern with no thumbnail rail offers thumbnail sizes');
  });

  test('a crossfade offers its duration, and nothing else does', async () => {
    await pick(page, 'hero');
    assert.equal(await hasKnob(page, 'Crossfade time'), true, 'the hero cannot set its crossfade duration');
    await pick(page, 'modelbar');
    assert.equal(await hasKnob(page, 'Crossfade time'), false, 'a sliding strip offers a crossfade duration');
  });

  test('the focus ring and the control transition are reachable everywhere', async () => {
    for (const id of ['modelbar', 'hero', 'gallery']) {
      await pick(page, id);
      assert.equal(await hasKnob(page, 'Control transition'), true, `${id}: no transition knob`);
      assert.equal((await colorKnob(page, 'Focus ring')) !== null, true, `${id}: no focus-ring knob`);
    }
  });

  test('a thumbnail size reaches the copied CSS and the drawn thumb', async () => {
    await pick(page, 'gallery');
    await setField(page, 'Thumbnail width', '120px');
    await page.waitForTimeout(300);
    const drawn = await page.evaluate(() => Math.round(globalThis.CARGO.sdoc().querySelector('.cs-thumb')?.getBoundingClientRect().width ?? 0));
    const { css } = await copyParts(page);
    assert.match(css, /--cs-thumb-w:\s*120px/, 'the value never reached the copied CSS');
    assert.equal(drawn, 120, `the thumbnail is drawn ${drawn}px`);
  });

  // F083: a count outside 1-8 was refused in silence, so between typing and
  // blurring the panel showed one number and the slider ran another. The row
  // is a bound number with the range on the binding now: the commit clamps and
  // the field is redrawn with what the ladder took, so the two can never
  // disagree in the first place.
  test('an out-of-range count is never left showing', async () => {
    await pick(page, 'modelbar');
    const f = await setField(page, 'Phone · under 768', '9');
    const shown = await f.inputValue();
    assert.ok(+shown >= 1 && +shown <= 8, `the field still shows "${shown}"`);
    const cls = await page.evaluate(() => /class="[^"]*cs-xs-(\d+)/.exec(document.getElementById('wb-code').textContent)?.[1] ?? null);
    if (cls !== null) assert.equal(cls, shown, 'the emitted column class disagrees with the field');
  });

  // F097: cards size themselves off the host page's body text, so the same
  // slider is taller on a bigger-bodied site. The readout never said what size
  // the preview itself is, so that scaling looked like a defect.
  test('the readout says what text size the preview is running', async () => {
    await pick(page, 'modelbar');
    await page.waitForTimeout(200);
    const card = await page.evaluate(() => document.getElementById('spec-card').textContent);
    assert.match(card, /text \d+px/, `the readout does not state the preview's text size: "${card}"`);
  });
});

// A colour changes the stylesheet and nothing else, so it must not go through
// the path that rebuilds the stage. Every input event used to destroy and
// re-initialise every slider in the preview - measured one destroy and one init
// each, 9-11 ms of JS per event - and a colour picker fires one on every
// pointer move, which is what made dragging a colour crawl. Guarded here
// because it is invisible in the generated CSS: the output is byte-identical
// either way, only the cost and the scroll position differ.
//
// The row is a plain text field on the pane until the colour plugin lands, so
// the drag is played back as a run of commits on that field. What is under
// test is the same thing: a run of colour changes must reach the preview
// without tearing the stage down once.
test.describe('picking a colour does not rebuild the slider', () => {
  const ROW = 'Arrow background';

  const drag = (page, label, values) =>
    page.evaluate(
      ([l, vals]) => {
        const row = [...document.querySelectorAll('#wb-settings .tp-lblv')].find((r) => r.querySelector('.tp-lblv_l')?.textContent.trim() === l);
        const field = row?.querySelector('input');
        if (!field) return { none: true };
        let inits = 0,
          destroys = 0;
        const AI = globalThis.CustomSlider.autoInit;
        const D = globalThis.CustomSlider.prototype.destroy;
        globalThis.CustomSlider.autoInit = function (...a) {
          inits++;
          return AI.apply(this, a);
        };
        globalThis.CustomSlider.prototype.destroy = function (...a) {
          destroys++;
          return D.apply(this, a);
        };
        const first = globalThis.CARGO.sdoc().querySelector('.cs-slide');
        for (const v of vals) {
          field.value = v;
          field.dispatchEvent(new Event('change', { bubbles: true }));
        }
        globalThis.CustomSlider.autoInit = AI;
        globalThis.CustomSlider.prototype.destroy = D;
        return { inits, destroys, sameNode: first === globalThis.CARGO.sdoc().querySelector('.cs-slide'), text: field.value };
      },
      [label, values],
    );

  test('a whole drag costs no teardown, and the preview keeps the colour', async () => {
    await pick(page, 'cards');
    await page.waitForTimeout(150);
    assert.ok(await hasKnob(page, ROW), 'no colour row to drag');

    const r = await drag(page, ROW, ['#112233', '#445566', '#778899', '#aabbcc', '#c8102e']);
    assert.equal(r.destroys, 0, 'the stage was torn down mid-drag');
    assert.equal(r.inits, 0, 'the sliders were re-initialised mid-drag');
    assert.equal(r.sameNode, true, 'the first slide was replaced, so the stage was rebuilt');
    assert.equal(r.text.toLowerCase(), '#c8102e', 'the field did not keep the last colour');

    // The point of not rebuilding is that the colour still arrives.
    const applied = await page.evaluate(() => globalThis.CARGO.sdoc().getElementById('wb-live-css').textContent.includes('#c8102e'));
    assert.equal(applied, true, 'the preview stylesheet never got the colour');
  });

  // The panel is downstream of the same generator, and a colour can change the
  // line counts it prints - clearing one drops a whole declaration. Skipping
  // the rebuild must not skip the panel.
  test('the copy panel still tracks the colour', async () => {
    await pick(page, 'cards');
    await page.waitForTimeout(150);
    await drag(page, ROW, ['#0a5c2b']);
    await page.waitForTimeout(120);
    const parts = await copyParts(page);
    assert.match(parts.css, /#0a5c2b/i, 'the copied CSS does not carry the colour that is on screen');
    const box = await page.evaluate(() => document.getElementById('wb-code').textContent);
    assert.match(box, /#0a5c2b/i, 'the code box did not refresh');
  });
});

// F006: a media query asks the WINDOW. The preview used to be a box inside this
// page, so the snippet's phone rules could never fire in it however narrow the
// box was set - measured, ten of seventeen patterns rendered differently on a
// real narrow window. It is an iframe now, which IS a window of the previewed
// width, so they resolve on their own.
test.describe('the preview resolves the phone rules for real', () => {
  // The claim of the whole refactor, checked the way the defect was found: the
  // copied snippet in a genuinely narrow window, against what the builder shows
  // at that button. Every property, every pattern.
  test('every pattern matches a real phone window, property for property', async () => {
    const PHONE = 390;
    const ctx = await browser.newContext({ viewport: { width: PHONE, height: 900 } });
    const real = await ctx.newPage();
    const engine = await engineFiles();

    const READ = (root) => {
      const slide = root.querySelector('.cs-slide');
      const cs = getComputedStyle(root);
      const img = root.querySelector('img');
      return {
        perView: cs.getPropertyValue('--cs-per-view').trim(),
        arrow: cs.getPropertyValue('--cs-arrow-size').trim(),
        rootPad: Math.round(parseFloat(cs.paddingInlineStart)),
        slideW: Math.round(slide.getBoundingClientRect().width),
        ratio: img ? getComputedStyle(img).aspectRatio : null,
        stops: root._cs?._stops?.().length ?? null,
      };
    };

    const ids = await patternIds(page);
    for (const id of ids) {
      await pick(page, id);
      await page.click('.ui-widths button[data-w="390"]');
      await page.waitForTimeout(300);
      const shown = await stageFrame(page).locator('.cs').first().evaluate(READ);

      const p = await copyParts(page);
      await real.setContent(hostHtml({ ...engine, css: p.css, html: p.html, js: p.js, box: PHONE }), { waitUntil: 'load' });
      await real.waitForTimeout(300);
      const onPhone = await real.evaluate((fn) => new Function('root', `return (${fn})(root)`)(document.querySelector('#box .cs')), READ.toString());

      assert.deepEqual(shown, onPhone, `${id}: the preview and a real ${PHONE}px phone disagree`);
    }
    await ctx.close();
  });

  // The frame's viewport is what a media query asks, and an iframe's default
  // 2px inset border comes out of it - a 390px frame gave the slider 386px and
  // put every measurement 4px short. Guarded because it is invisible: the
  // layout still looks right, it is just the wrong width.
  test('the frame viewport is exactly the width on the button', async () => {
    for (const w of [390, 768, 992, 1200]) {
      await page.click(`.ui-widths button[data-w="${w}"]`);
      await page.waitForTimeout(220);
      const inner = await page.evaluate(() => globalThis.CARGO.swin().innerWidth);
      assert.equal(inner, w, `the ${w} button gives the slider a ${inner}px window`);
    }
  });

  // Whatever else changes, the preview must run the CSS that is copied - the
  // per-view pin that used to be appended is gone, because the cascade resolves
  // the ladder itself now.
  test('nothing is appended to the preview CSS any more', async () => {
    await pick(page, 'modelbar');
    await page.click('.ui-widths button[data-w="390"]');
    await page.waitForTimeout(200);
    const [live, copied] = await Promise.all([page.evaluate(() => globalThis.CARGO.sdoc().getElementById('wb-live-css').textContent), copyParts(page).then((p) => p.css)]);
    const name = /^\.([\w-]+)\.cs/m.exec(copied)?.[1] ?? 'my-slider';
    assert.equal(live.split(name).join('wb-live'), copied.split(name).join('wb-live'), 'the preview stylesheet is not the copied stylesheet');
  });
});

test.describe('the ladder resolves without a pin', () => {
  // The pin resolved the designer's ladder alone. A card style carries its own
  // narrow override - the cutout tile drops to one across below 380px - and
  // that is a max-width rule, so it was as inert as everything else: the phone
  // frame showed the wrong count outright, each card narrower than a
  // 150px minimum, which pushed the fit gauge amber and advised "show fewer
  // across" about a row that does not exist.
  //
  // Asserted as an INVARIANT rather than against the number 1: the look's own
  // stylesheet is the authority on what it does below its narrow breakpoint, so
  // whatever it says there is what the preview must show. A hard-coded 1 passed
  // against the broken code whenever an earlier test had left the ladder at 1,
  // which is a test that proves nothing.
  test('the card count matches what a phone actually gets', async () => {
    // Its own page. This file shares one across every describe, and earlier tests
    // edit the ladder - which had this assertion agreeing with the broken code by
    // coincidence, because the leftover ladder happened to be 1 already.
    const { page: fresh } = await openBuilder(browser, 1500);
    // Every look that HAS a narrow per-view rule, so the guard widens on its own
    // when another one gains it.
    const cases = await fresh.evaluate(() =>
      Object.entries(globalThis.CARGO.LOOKS)
        .map(([id, l]) => {
          // [^}] rather than [\s\S]: a span that can cross a closing brace walks
          // out of its own @media block and credits the next block's declaration
          // to this one, which is how the tile's 380px rule read as if it sat in
          // the 767.98px block.
          const hit = [...String(l.css ?? '').matchAll(/@media[^{]*max-width:\s*(\d[\d.]*)px[^{]*\{[^}]*?--cs-per-view:\s*(\d+)/g)].filter((m) => +m[1] >= 390);
          return hit.length ? { id, want: hit[hit.length - 1][2] } : null;
        })
        .filter(Boolean),
    );
    assert.ok(cases.length, 'no card style declares a narrow per-view rule any more');

    for (const c of cases) {
      // Reach the look through a pattern that wears it, then force the look so
      // no earlier test decides the answer.
      const pat = await fresh.evaluate((look) => Object.entries(globalThis.CARGO.PATTERNS).find(([, p]) => p.look === look)?.[0] ?? null, c.id);
      if (!pat) continue;
      await pick(fresh, pat);
      await fresh.click('.ui-widths button[data-w="390"]');
      await fresh.waitForTimeout(240);
      const seen = await fresh.evaluate(() => ({
        perView: getComputedStyle(globalThis.CARGO.sdoc().querySelector('.cs')).getPropertyValue('--cs-per-view').trim(),
        across: document.getElementById('spec-across').textContent,
      }));
      assert.equal(seen.perView, c.want, `${pat}/${c.id}: the 390 preview shows ${seen.perView} across where its own card sheet says ${c.want}`);
      assert.match(seen.across, new RegExp(`\\b${c.want}\\b`), `${pat}/${c.id}: the readout disagrees with the strip (${seen.across})`);
    }
    await fresh.context().close();
  });

  // Whatever the pin does, it is PREVIEW only: a dealer page is the width it
  // is and must ship the real ladder.
  test('the copied CSS ships the real ladder, with nothing appended', async () => {
    await pick(page, 'modelbar');
    await page.click('.ui-widths button[data-w="390"]');
    await page.waitForTimeout(180);
    const parts = await copyParts(page);
    // The model bar ships its ladder as the cs-xs/sm/md/lg column classes on
    // the markup, not as emitted media queries - so what has to be proved is
    // that the PIN is absent and the ladder is still on the slides.
    assert.doesNotMatch(parts.css, /--cs-per-view/, 'a per-view declaration leaked into the copied CSS');
    assert.match(parts.html, /\bcs-(xs|sm|md|lg)-\d/, 'the copied markup lost its column classes');
  });
});

// A classic scrollbar inside the frame takes 15px out of the VIEWPORT, and the
// viewport is the number a media query reads. The 390 Phone button resolved 375
// - under the card sheet's own 380px breakpoint - so a scrollbar was quietly
// deciding which rules fired, and the readout said "375px in 375px". It latched
// too: content measured at 375 is taller than at 390, which keeps the scrollbar
// justified.
//
// Headless Chromium draws OVERLAY scrollbars that take no width, so it cannot
// see this at all. The guard is therefore not "is there a scrollbar" but "does
// the frame's own root refuse to scroll", which is true in every engine.
test.describe('the frame viewport is never eaten by a scrollbar', () => {
  test('the frame refuses to scroll, so its width is the width on the button', async () => {
    await pick(page, 'cards');
    for (const w of [390, 768, 992, 1200]) {
      await page.click(`.ui-widths button[data-w="${w}"]`);
      await page.waitForTimeout(280);
      const r = await page.evaluate(() => {
        const d = globalThis.CARGO.sdoc();
        return {
          inner: globalThis.CARGO.swin().innerWidth,
          client: d.documentElement.clientWidth,
          overflowY: d.defaultView.getComputedStyle(d.documentElement).overflowY,
          clipped: d.documentElement.scrollHeight - d.documentElement.clientHeight,
        };
      });
      assert.equal(r.overflowY, 'hidden', `at ${w} the frame root can still grow a scrollbar`);
      assert.equal(r.client, r.inner, `at ${w} something took ${r.inner - r.client}px out of the viewport`);
      assert.equal(r.client, w, `the ${w} button gives the slider a ${r.client}px window`);
      // Refusing to scroll is only safe if the height is right; a short frame
      // would clip with no way to reach the rest.
      assert.ok(r.clipped <= 1, `at ${w} the frame clips ${r.clipped}px of its own content`);
    }
  });
});

// "Arrows outside the cards" has to mean the same thing at every width.
//
// It briefly did not. The phone rule that drops the tab strip's gutter was
// widened to the carousel as well, to buy a phone back the ~80px the arrow
// channel costs - which made the switch a dead control below 768: it read
// "outside", and a phone put the arrow on the card anyway. Nothing in the panel
// said so, and nothing could see it, because the preview was a box inside this
// page and the phone rule never fired in it. Both halves of that are fixed now,
// and this is the half a test can hold.
test.describe('the arrow placement switch is not overruled by a breakpoint', () => {
  const gut = (p) => switchRow(p, 'Arrows outside the cards');

  const placement = (p) =>
    p.evaluate(() => {
      const d = globalThis.CARGO.sdoc();
      const w = globalThis.CARGO.swin();
      const root = d.querySelector('.cs');
      const slide = d.querySelector('.cs-slide');
      const prev = d.querySelector('.cs-arrow--prev');
      if (!root || !slide || !prev) return null;
      const sr = slide.getBoundingClientRect();
      const ar = prev.getBoundingClientRect();
      return { pad: Math.round(parseFloat(w.getComputedStyle(root).paddingInlineStart)), onCard: Math.round(ar.right) > Math.round(sr.left) + 1 };
    });

  test('outside means outside on a phone too, and over means over everywhere', async () => {
    for (const id of ['modelbar', 'cards']) {
      await pick(page, id);
      await page.waitForTimeout(250);
      for (const outside of [true, false]) {
        const box = gut(page);
        if ((await box.isChecked()) !== outside) {
          await box.setChecked(outside);
          await page.waitForTimeout(350);
        }
        for (const w of [390, 768, 1200]) {
          await page.click(`.ui-widths button[data-w="${w}"]`);
          await page.waitForTimeout(240);
          const seen = await placement(page);
          assert.ok(seen, `${id} at ${w}: nothing to measure`);
          assert.equal(seen.onCard, !outside, `${id} at ${w}: the switch says outside=${outside} and the arrow is ${seen.onCard ? 'on the card' : 'beside it'}`);
          if (outside) assert.ok(seen.pad > 0, `${id} at ${w}: outside is on but no channel is reserved`);
          else assert.equal(seen.pad, 0, `${id} at ${w}: over is on but a channel is still reserved`);
        }
      }
    }
  });

  // The strip DOES still give its gutter up on a phone, and should: a tab row
  // has no arrows beside it to line up with, and the alignment cost Chevrolet's
  // three body-style tabs 246px where they need 259, so they stacked.
  test('a tab strip still drops its gutter on a phone', async () => {
    await pick(page, 'tabs');
    const box = gut(page);
    if (!(await box.isChecked())) {
      await box.setChecked(true);
      await page.waitForTimeout(350);
    }
    const parts = await copyParts(page);
    assert.match(parts.css, /@media \(max-width: 767\.98px\)[\s\S]*?cargo-tabs[^}]*padding-inline: 0/, 'the tab strip no longer drops its gutter on a phone');
    assert.doesNotMatch(parts.css, /@media \(max-width: 767\.98px\) \{\s*\.[\w-]+\.cs \{ padding-inline: 0/, 'the phone rule is overruling the carousel again');
  });
});

// The pause button belongs over the media it pauses. An absolutely positioned
// element is placed against its ancestor's PADDING box, so the engine's
// `inset-inline-end: 0.5em` measures from the outer edge of the arrow gutter
// rather than from the picture - measured on the hero at 768, the image ran
// 59-709 and the button sat 716-752, floating on the page beside it. The arrows
// are in that channel deliberately; the pause is not.
test.describe('the pause button sits on the thing it pauses', () => {
  const placed = () =>
    stageFrame(page)
      .locator('.cs')
      .first()
      .evaluate((root) => {
        const p = root.querySelector('.cs-pause');
        const media = root.querySelector('img') ?? root.querySelector('.cs-slide');
        if (!p || !media) return null;
        const a = p.getBoundingClientRect();
        const b = media.getBoundingClientRect();
        return { inside: a.left >= b.left - 1 && a.right <= b.right + 1, pause: `${Math.round(a.left)}-${Math.round(a.right)}`, media: `${Math.round(b.left)}-${Math.round(b.right)}` };
      });

  test('with the arrows outside the cards or over them, at every width', async () => {
    await pick(page, 'hero');
    await page.waitForTimeout(300);
    const auto = rowByLabel(page, 'Rotate every (ms)').locator('input').first();
    await auto.fill('4000');
    await page.waitForTimeout(400);
    const gut = switchRow(page, 'Arrows outside the cards');

    for (const outside of [true, false]) {
      if ((await gut.isChecked()) !== outside) {
        await gut.setChecked(outside);
        await page.waitForTimeout(400);
      }
      for (const w of [390, 768, 1200]) {
        await page.click(`.ui-widths button[data-w="${w}"]`);
        await page.waitForTimeout(350);
        const r = await placed();
        assert.ok(r, `outside=${outside} at ${w}: no pause button to measure`);
        assert.equal(r.inside, true, `outside=${outside} at ${w}: the pause sits at ${r.pause} against media at ${r.media}`);
      }
    }
  });

  // A slider with no pause button must not carry the rule that positions one.
  test('no autoplay, no rule', async () => {
    await pick(page, 'hero');
    await page.waitForTimeout(300);
    const auto = rowByLabel(page, 'Rotate every (ms)').locator('input').first();
    await auto.fill('0');
    await page.waitForTimeout(400);
    const parts = await copyParts(page);
    assert.doesNotMatch(parts.css, /cs-pause/, 'a slider with no pause button ships a rule for one');
  });
});

test.describe('nothing threw', () => {
  test('no page errors', () => {
    assert.deepEqual(errors, []);
  });
});
