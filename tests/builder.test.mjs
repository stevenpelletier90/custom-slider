// What a designer carries away from the builder, checked in a browser.
//
// Every test here is a bug that shipped. The linters cover what can be read off
// the generated text - a zero length, a comment, a character outside
// Windows-1252, a rem - and this file covers what only a rendering engine can
// answer: does the copied code still lay itself out, and does it lay itself out
// the same way the preview did.
//
// Deliberately NOT a sweep over all 17 patterns at every width. That took
// minutes and a gate nobody runs is not a gate; the sweeps live in the
// verification checklist in README, which is still the thing to run before
// shipping. This is the fast one, for every commit.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { serve, launch, openBuilder, pick, patternIds, copyParts, setField, hostHtml, engineFiles, readSlider } from './helpers.mjs';

let server, browser, ctx, page, host, errors, engine;

before(async () => {
  server = await serve();
  browser = await launch();
  // Wide enough that the 1170 preview frame is offered: the builder disables a
  // width the window cannot hold, and the paste-order test needs the frame and
  // the window in the same breakpoint tier to compare like with like.
  ({ ctx, page, errors } = await openBuilder(browser, server.origin, 1500));
  host = await ctx.newPage();
  host.on('pageerror', (e) => errors.push(`host: ${e.message}`));
  engine = await engineFiles(server.origin);
});

after(async () => {
  await browser?.close();
  await server?.close();
});

const render = async (opts) => {
  await host.setContent(hostHtml({ ...engine, ...opts }), { waitUntil: 'load' });
  await host.waitForTimeout(150);
  return readSlider(host);
};

describe('the three copy buttons', () => {
  // F004/F008: one Copy button handed over <style> + HTML + <script> as a
  // single blob for three different CMS fields. Style Only is a raw-CSS field,
  // and a tag left in it makes the parser read the tag and the first rule as
  // one invalid selector, dropping the rule that carries every setting.
  test('each part is in the form its CMS field takes, and together they are the box', async () => {
    for (const id of await patternIds(page)) {
      await pick(page, id);
      const box = await page.evaluate(() => document.getElementById('wb-code').textContent);
      const hasScript = await page.evaluate(() => !!globalThis.CARGO.PATTERNS[location.hash.slice(1) || 'modelbar'].script);
      const p = await copyParts(page);

      assert.doesNotMatch(p.css, /<\/?(style|script)\b/i, `${id}: the CSS part carries a tag`);
      assert.match(p.css.trimStart(), /^\./, `${id}: the CSS part does not start with a selector`);
      assert.match(p.html.trimStart(), /^</, `${id}: the HTML part is not markup`);
      assert.equal(p.jsHidden, !hasScript, `${id}: the script button does not match whether the pattern has one`);

      const rebuilt = `<style>\n${p.css}\n</style>\n\n${p.html}${p.js ? `\n\n<script>\n${p.js}\n</script>` : ''}`;
      assert.equal(rebuilt, box, `${id}: the three parts do not reassemble into the box`);
    }
  });
});

describe('values that must never reach the copied CSS', () => {
  // Three findings, one broken slider: --cs-gap: 0px surviving minification as
  // a unitless 0 (F003), a cleared field emitting `--cs-gap: ;` (F022), and a
  // typed `10` (F028). Each invalidates the slide's flex basis, so the cards
  // collapse to their content width while the readout still claims otherwise.
  const REFUSED = ['10', '0', 'wide'];

  test('a value the property cannot use is dropped, flagged, and never collapses the strip', async () => {
    await pick(page, 'modelbar');
    const good = await page.evaluate(() => +document.querySelector('#wb-stage .cs-slide').getBoundingClientRect().width.toFixed(1));

    for (const typed of REFUSED) {
      await setField(page, 'Gap', typed);
      const r = await page.evaluate(() => {
        const slide = document.querySelector('#wb-stage .cs-slide');
        const input = [...document.querySelectorAll('#wb-settings label > span')].find((x) => x.textContent.trim() === 'Gap')?.parentElement.querySelector('input');
        return {
          width: +slide.getBoundingClientRect().width.toFixed(1),
          basis: getComputedStyle(slide).flexBasis,
          emitted: /--cs-gap:\s*([^;]*);/.exec(document.getElementById('wb-code').textContent)?.[1]?.trim() ?? null,
          flagged: input?.getAttribute('aria-invalid') === 'true',
        };
      });
      assert.equal(r.emitted, null, `"${typed}" reached the copied CSS`);
      assert.ok(r.flagged, `"${typed}" was not flagged in the field`);
      assert.notEqual(r.basis, 'auto', `"${typed}" collapsed the slide basis`);
      // Not 'unchanged': a refused value counts as NO value, so the knob
      // falls back to the engine default and the gap legitimately shifts a
      // little. What must never happen is the collapse - 208px to 81px when
      // the flex basis went invalid.
      assert.ok(r.width > good * 0.9, `"${typed}" collapsed the strip: ${good} -> ${r.width}`);
    }
  });

  test('clearing a field goes back to the default rather than shipping nothing', async () => {
    await pick(page, 'modelbar');
    await setField(page, 'Gap', '');
    const r = await page.evaluate(() => ({
      code: document.getElementById('wb-code').textContent,
      live: document.getElementById('wb-live-css').textContent,
    }));
    assert.doesNotMatch(r.code, /--[\w-]+:\s*;/, 'an empty declaration reached the copied CSS');
    assert.doesNotMatch(r.live, /--[\w-]+:\s*;/, 'an empty declaration reached the preview');
    assert.match(r.code, /--cs-gap:\s*0\.5em;/, "the model bar's own default did not come back");
  });

  test('every settings field says what it falls back to', async () => {
    await pick(page, 'modelbar');
    const missing = await page.evaluate(() =>
      [...document.querySelectorAll('#wb-settings label.wb-row')]
        .filter((r) => r.querySelector('input[type="text"]') && !r.querySelector('input[type="text"]').placeholder)
        .map((r) => r.querySelector('span')?.textContent.trim()),
    );
    assert.deepEqual(missing, [], 'fields with no placeholder');
  });
});

describe('the slider name', () => {
  // F029: the field deleted characters it could not use rather than
  // hyphenating, so "2024 Specials" became `.2024specials` - not a valid
  // selector, so the browser dropped every rule of the copied CSS while the
  // preview, scoped to a different class, went on looking right.
  test('becomes a legal class, and the field says so once you leave it', async () => {
    await pick(page, 'modelbar');
    const field = page.locator('[data-name-field]');
    for (const [typed, want] of [
      ['2024 Specials', 'slider-2024-specials'],
      ["Bob's Tyres & Co", 'bob-s-tyres-co'],
      ['   ', 'my-slider'],
    ]) {
      await field.fill(typed);
      await field.blur();
      await page.waitForTimeout(100);
      assert.equal(await field.inputValue(), want, `"${typed}" was not written back cleaned`);
      const code = await page.evaluate(() => document.getElementById('wb-code').textContent);
      assert.match(code, new RegExp(`^\\.${want}\\.cs \\{`, 'm'), `"${typed}" did not scope the CSS to .${want}`);
      assert.match(code, new RegExp(`class="${want}[ "]`), `"${typed}" did not reach the markup`);
    }
  });

  // F030: two sliders sharing a name share their rules, and the second paste
  // wins for both. Not fixable in code - the settings live in a page-global
  // stylesheet and the builder cannot see the page - so the tool's job is to
  // make the decision visible, and the test's job is to keep the remedy true.
  test('two sliders on one page keep their own settings when they are named apart', async () => {
    await pick(page, 'modelbar');
    const field = page.locator('[data-name-field]');
    await field.fill('new-vehicles');
    await field.blur();
    await setField(page, 'Gap', '0.5em');
    const a = await copyParts(page);

    await field.fill('pre-owned');
    await field.blur();
    await setField(page, 'Gap', '3em');
    const b = await copyParts(page);

    await host.setContent(hostHtml({ ...engine, css: `${a.css}\n${b.css}`, html: `<div id="one">${a.html}</div><div id="two">${b.html}</div>` }), { waitUntil: 'load' });
    await host.waitForTimeout(200);
    const [one, two] = await Promise.all([readSlider(host, '#one'), readSlider(host, '#two')]);
    assert.equal(one.gap, '0.5em', "the first slider took the second one's gap");
    assert.equal(two.gap, '3em', 'the second slider did not keep its own gap');
    assert.notEqual(one.cls, two.cls, 'both sliders ended up with the same class');
  });

  test('the name is offered where the copying happens', async () => {
    const inCode = await page.evaluate(() => document.querySelector('.ui-code').contains(document.querySelector('[data-name-field]')));
    const warns = await page.evaluate(() => /overwrite|different name/i.test(document.querySelector('.ui-code').innerText));
    assert.ok(inCode, 'the name field is not in the code panel');
    assert.ok(warns, 'nothing beside the copy buttons warns about a second slider');
  });
});

describe('the pasted block on a hostile host page', () => {
  // F010: the snippet's root rules were (0,1,0), the same as the engine's `.cs`
  // and the shared `.cargo-<look>`, so source order decided - and where the
  // platform emits its Style Only sheet relative to a head <link> is not
  // documented. Measured before the fix: service cards went from 347.6px at
  // three per view to 1070.8px at one.
  test('renders the same whichever order the sheets land in', async () => {
    for (const id of ['modelbar', 'service', 'cards', 'tabs']) {
      await pick(page, id);
      await page.click('.ui-widths button[data-w="1170"]');
      await page.waitForTimeout(80);
      const p = await copyParts(page);
      const after = await render({ css: p.css, html: p.html, js: p.js });
      const before = await render({ css: p.css, html: p.html, js: p.js, cssFirst: true });
      assert.deepEqual(before, after, `${id}: paste order changes what it renders`);
    }
  });

  // F049: on a phone the arrow gutter costs about a quarter of the screen. The
  // snippet now drops it under 768 - but only if the arrow still lands beside
  // the text rather than on it, which is the rule the whole gutter exists for.
  // Measured with a Range over the painted text, not the block box: a centred
  // name in a 241px card paints far narrower than its box, so a box-level check
  // reports a collision that no reader would ever see.
  test('dropping the phone gutter puts no arrow over a single character', async () => {
    const looks = await page.evaluate(() => Object.keys(globalThis.CARGO.LOOKS));
    await page.setViewportSize({ width: 320, height: 900 });
    for (const look of ['modelbar', 'cards', 'service']) {
      await pick(page, look === 'modelbar' ? 'modelbar' : look);
      await page.waitForTimeout(120);
      const p = await copyParts(page);
      await host.setViewportSize({ width: 320, height: 900 });
      await host.setContent(hostHtml({ ...engine, css: p.css, html: p.html, js: p.js, box: 320 }), { waitUntil: 'load' });
      await host.waitForTimeout(250);
      const covered = await host.evaluate(() => {
        const track = document.querySelector('.cs-track').getBoundingClientRect();
        const walk = document.createTreeWalker(document.querySelector('.cs-track'), NodeFilter.SHOW_TEXT);
        const texts = [];
        for (let n = walk.nextNode(); n; n = walk.nextNode()) if (n.textContent.trim()) texts.push(n);
        const hits = [];
        for (const a of document.querySelectorAll('.cs-arrow')) {
          if (a.hidden) continue;
          const ar = a.getBoundingClientRect();
          for (const t of texts) {
            const range = document.createRange();
            range.selectNodeContents(t);
            for (const r of range.getClientRects()) {
              const vl = Math.max(r.left, track.left);
              const vr = Math.min(r.right, track.right);
              if (vr - vl <= 1) continue; // clipped out of view by the track
              if (ar.left < vr && ar.right > vl && ar.top < r.bottom && ar.bottom > r.top)
                hits.push(`${Math.round(Math.min(ar.right, vr) - Math.max(ar.left, vl))}px of "${t.textContent.trim().slice(0, 24)}"`);
            }
          }
        }
        return [...new Set(hits)];
      });
      assert.deepEqual(covered, [], `${look}: an arrow covers text on a 320px phone`);
    }
    assert.ok(looks.length >= 7, 'card styles unreadable');
    // Both viewports back, or the next test measures a phone. The markup-only
    // check below asserts the arrow clears the card entirely, which is a
    // desktop rule - on a phone the tile deliberately gives that channel up.
    await page.setViewportSize({ width: 1500, height: 1000 });
    await host.setViewportSize({ width: 1280, height: 900 });
  });

  // F053: a designer restyling a card writes against their own slider name, and
  // `.my-slider .cargo-name` ties with the shared sheet's `.cargo-tile
  // .cargo-name` at (0,2,0) - so source order decided, and where the platform
  // emits Style Only relative to a head <link> is undocumented. Measured before
  // the fix: shared sheet first gave the designer's colour, their CSS first
  // silently gave the card style's. The shared sheet now weakens the look class
  // to :where(), so the designer wins either way.
  test('a hand-written card restyle wins whichever order the sheets land in', async () => {
    const MINE = '.my-slider .cargo-name { color: rgb(200, 16, 46); }';
    const HTML =
      '<div class="my-slider cs cargo-tile cs-xs-2" data-cs aria-label="t"><ul class="cs-track">' +
      '<li class="cs-slide"><a class="cargo-card" href="#"><p class="cargo-name">Tahoe</p></a></li>' +
      '<li class="cs-slide"><a class="cargo-card" href="#"><p class="cargo-name">Traverse</p></a></li></ul></div>';
    const at = async (cssFirst) => {
      await host.setContent(hostHtml({ ...engine, css: MINE, html: HTML, cssFirst }), { waitUntil: 'load' });
      await host.waitForTimeout(150);
      return host.evaluate(() => getComputedStyle(document.querySelector('.cargo-name')).color);
    };
    const sheetFirst = await at(false);
    const mineFirst = await at(true);
    assert.equal(sheetFirst, 'rgb(200, 16, 46)', 'the card style beat the designer even with the shared sheet first');
    assert.equal(mineFirst, sheetFirst, `paste order decides: ${mineFirst} vs ${sheetFirst}`);
  });

  // The other half of that change: the look's own class must keep its full
  // specificity where it IS the selector, because that rule carries the look's
  // custom properties and the engine's `.cs` block sets some of the same ones.
  test('a card style still wins the engine defaults it overrides', async () => {
    const HTML =
      '<div class="cs cargo-portrait cs-xs-2" data-cs aria-label="t"><ul class="cs-track"><li class="cs-slide"><a class="cargo-card" href="#"><p class="cargo-name">Giulia</p></a></li></ul></div>';
    await host.setContent(hostHtml({ ...engine, html: HTML }), { waitUntil: 'load' });
    await host.waitForTimeout(150);
    const bg = await host.evaluate(() => getComputedStyle(document.querySelector('.cs')).getPropertyValue('--cs-arrow-bg').trim());
    assert.match(bg, /255/, `the tall tile lost its light arrow to the engine default (${bg}) — a dark arrow on its dark strip`);
  });

  // F078: the cards matched the preview to 0.00px at an equal body size, but
  // the control-like elements did not. `.cargo-tabs [role="tab"]` and
  // `.cargo-filterbar button` set `font: inherit` and no line-height, so the
  // strip took the host page's leading and shipped taller than the preview
  // showed - the tab strip 44.25 -> 52.5px on a 2.1-leading host, the chip row
  // 32.66 -> 39.83. The same trap as the inline <span> the card rules already
  // guard against, one level up.
  test('a control-shaped element ignores the host page leading', async () => {
    const cases = [
      ['tabs', '.cargo-tabs [role="tab"]'],
      ['gallery-filter', '.cargo-filterbar button'],
      ['lightbox', '.cargo-lb-open'],
    ];
    for (const [id, sel] of cases) {
      await pick(page, id);
      await page.click('.ui-widths button[data-w="1170"]');
      await page.waitForTimeout(80);
      const p = await copyParts(page);
      const at = async (leading) => {
        await host.setContent(hostHtml({ ...engine, css: `body { line-height: ${leading} }\n${p.css}`, html: p.html, js: p.js }), { waitUntil: 'load' });
        await host.waitForTimeout(200);
        return host.evaluate((s) => {
          const el = document.querySelector(s);
          return el ? +el.getBoundingClientRect().height.toFixed(2) : null;
        }, sel);
      };
      const tight = await at(1.2);
      const loose = await at(2.6);
      assert.ok(tight, `${id}: ${sel} did not render on the host page`);
      assert.equal(loose, tight, `${id}: ${sel} is ${loose}px on a 2.6-leading host and ${tight}px on a 1.2-leading one`);
    }
  });

  // F016: the engine's arrow inset default was 0.5em and every snippet undid
  // it, so the markup-only paste README advertises overlapped the first card.
  test('a markup-only paste keeps the arrow out of the first card', async () => {
    for (const look of ['cargo-tile', 'cargo-vcard']) {
      const cards = [1, 2, 3, 4, 5, 6]
        .map((n) => `<li class="cs-slide"><a class="cargo-card" href="#"><span class="cargo-media"><img src="/demo/img/chrome-tahoe.webp" alt=""></span><p class="cargo-name">Tahoe ${n}</p></a></li>`)
        .join('');
      await host.setContent(hostHtml({ ...engine, html: `<div class="cs ${look} cs-xs-2 cs-sm-3 cs-md-4 cs-lg-5" data-cs aria-label="t"><ul class="cs-track">${cards}</ul></div>` }), {
        waitUntil: 'load',
      });
      await host.waitForTimeout(200);
      const gap = await host.evaluate(() => {
        const a = document.querySelector('.cs-arrow--prev').getBoundingClientRect();
        const s = document.querySelector('.cs-slide').getBoundingClientRect();
        return +(s.left - a.right).toFixed(1);
      });
      assert.ok(gap >= 0, `${look}: the arrow overlaps the first card by ${-gap}px`);
    }
  });

  // F024: the Tall photos marker queried .cs-dots the moment it ran, so pasted
  // at body bottom it found nothing and never wrote its counters - and that
  // marker is the pattern's only visible page indicator.
  test('a pattern script works with the engine loaded before it and after it', async () => {
    await pick(page, 'models');
    const p = await copyParts(page);
    assert.equal(p.jsHidden, false, 'Tall photos no longer ships a script');
    for (const order of ['engine first', 'script first']) {
      const body = order === 'engine first' ? `<script>${engine.engineJs}<\/script><script>${p.js}<\/script>` : `<script>${p.js}<\/script><script>${engine.engineJs}<\/script>`;
      await host.setContent(
        `<!doctype html><html><head><meta charset="utf-8"><style>html{font-size:10px}body{margin:0;font-family:Arial,sans-serif}#box{inline-size:1170px}</style><style>${engine.engineCss}</style><style>${p.css}</style></head><body><div id="box">${p.html}</div>${body}</body></html>`,
        { waitUntil: 'load' },
      );
      await host.waitForTimeout(250);
      const count = await host.evaluate(() => document.querySelector('#box .cs-dots')?.style.getPropertyValue('--bar-count') ?? '');
      assert.notEqual(count, '', `${order}: the marker never got its counters`);
    }
  });
});

describe('the builder survives its own inputs', () => {
  // F076: a star rating above 5 threw inside the review markup, the throw was
  // inside render(), and the bad value went to localStorage - so the next visit
  // booted into a blank page with nothing saying why.
  test('an out-of-range number is clamped, in the field and in what is stored', async () => {
    await pick(page, 'reviews');
    const stars = page.locator('#wb-content input[type=number]').first();
    await stars.fill('6');
    await page.waitForTimeout(150);
    const after = await page.evaluate(() => document.querySelector('#wb-stage .cargo-stars')?.getAttribute('aria-label'));
    assert.equal(after, 'Rated 5 out of 5', 'typing 6 did not clamp');

    await page.fill('#wb-content textarea', 'STILL EDITABLE');
    await page.waitForTimeout(150);
    const live = await page.evaluate(() => document.getElementById('wb-code').textContent.includes('STILL EDITABLE'));
    assert.ok(live, 'the builder stopped accepting edits after an out-of-range value');

    // A value stored by an older build must not take the page down either.
    await page.evaluate(() => {
      const v = JSON.parse(localStorage.getItem('cs-content'));
      const first = Object.values(v)[0];
      if (Array.isArray(first)) first[0].stars = 99;
      localStorage.setItem('cs-content', JSON.stringify(v));
    });
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(250);
    const stageLen = await page.evaluate(() => document.getElementById('wb-stage').innerHTML.length);
    assert.ok(stageLen > 100, 'a poisoned stored value blanked the Build page');
  });

  // F007: one localStorage key held one pattern's rows, so editing a second
  // pattern erased the first one's slides with nothing saying so.
  test('slide text is kept per pattern', async () => {
    await pick(page, 'service');
    await page.fill('#wb-content textarea', 'SERVICE TEXT KEPT');
    await page.waitForTimeout(150);
    await pick(page, 'modelbar');
    await page.fill('#wb-content input[type="text"]', 'MODELBAR NAME');
    await page.waitForTimeout(150);
    await pick(page, 'service');
    const kept = await page.evaluate(() => document.getElementById('wb-code').textContent.includes('SERVICE TEXT KEPT'));
    assert.ok(kept, 'editing another pattern erased this one');
  });
});

describe('nothing threw along the way', () => {
  test('no page errors in the builder or the host pages', () => {
    assert.deepEqual(errors, []);
  });
});
