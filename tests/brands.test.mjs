// The Brands page: browse the library by OEM. Spec:
// docs/specs/2026-09-10-brands-page-design.md
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { ORIGIN } from './helpers.mjs';

let page, errors;

test.beforeAll(async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  page = await ctx.newPage();
  errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${ORIGIN}/demo/brands.html`, { waitUntil: 'load' });
  await page.waitForSelector('#b-chevrolet .cs-slide');
});

test('every brand has a tile, measured ones first, each with its logo', async () => {
  const tiles = await page.evaluate(() =>
    [...document.querySelectorAll('#bb-index .gx-tile')].map((a) => ({
      id: a.getAttribute('href').slice(1),
      badge: a.querySelector('.bb-badge')?.textContent.trim(),
      img: a.querySelector('img')?.getAttribute('src'),
      ok: a.querySelector('img')?.naturalWidth > 0,
    })),
  );
  const brands = await page.evaluate(() => Object.keys(globalThis.CARGO.BRANDS));
  assert.equal(tiles.length, brands.length);
  const measured = await page.evaluate(() => Object.keys(globalThis.CARGO.BRANDS).filter((b) => globalThis.CARGO.patternsOf(b).length));
  assert.deepEqual(
    tiles
      .slice(0, measured.length)
      .map((t) => t.id)
      .sort(),
    measured.sort(),
    'measured brands lead',
  );
  for (const t of tiles) {
    assert.equal(t.img, `img/logo-${t.id}.png`);
    assert.equal(t.ok, true, `${t.id}: logo did not load`);
  }
  assert.match(tiles.find((t) => t.id === 'chevrolet').badge, /^\d+ patterns?$/);
  assert.equal(tiles.find((t) => t.id === 'kia').badge, 'roster only');
});

test('a measured brand has one live stage per pattern it is measured for', async () => {
  const got = await page.evaluate(() =>
    [...document.querySelectorAll('#b-chevrolet .bb-stage')].map((s) => {
      const root = s.querySelector('.cs');
      return {
        pattern: s.dataset.pattern,
        // The engine sets element._cs on construction and deletes it on
        // destroy() - checking for it proves the slider was actually
        // initialised, not just that some prev/track markup exists.
        live: !!(root && root._cs),
        link: s.parentElement.querySelector('a.ui-btn')?.getAttribute('href'),
      };
    }),
  );
  const want = await page.evaluate(() => globalThis.CARGO.patternsOf('chevrolet'));
  assert.deepEqual(
    got.map((g) => g.pattern),
    want,
  );
  for (const g of got) {
    assert.equal(g.live, true, `${g.pattern}: stage is not a slider`);
    assert.equal(g.link, `index.html#${g.pattern}?brand=chevrolet`);
  }
  const line = await page.evaluate(
    () =>
      document.querySelector('#b-chevrolet [role="tab"][aria-selected="true"]') &&
      getComputedStyle(document.querySelector('#b-chevrolet [role="tab"][aria-selected="true"]'), '::after').backgroundColor,
  );
  assert.equal(line, 'rgb(0, 109, 199)', 'the tabbed stage should draw Chevrolet values');
});

// 2026-09-14: Steven wants to take a measured brand's code from here without
// the builder. It has to be the builder's code - the same generator, the same
// three parts, the same slider name - or the two pages would hand out two
// versions of the Chevrolet bar.
test('every measured stage shows its code, closed, and it is byte for byte the builder’s', async ({ browser }) => {
  const boxes = await page.evaluate(() =>
    [...document.querySelectorAll('#b-chevrolet .bb-block')].map((b) => ({
      pattern: b.querySelector('.bb-stage').dataset.pattern,
      open: b.querySelector('.bb-code')?.open,
      buttons: [...(b.querySelectorAll('.bb-code [data-copy]') ?? [])].filter((x) => !x.hidden).map((x) => x.dataset.copy),
      code: b.querySelector('.bb-code pre')?.textContent ?? null,
    })),
  );
  assert.ok(boxes.length >= 2);
  for (const b of boxes) {
    assert.equal(b.open, false, `${b.pattern}: the code box starts open`);
    assert.ok(b.buttons.includes('css') && b.buttons.includes('html'), `${b.pattern}: copy buttons missing (${b.buttons})`);
    assert.ok(b.code && b.code.startsWith('<style>'), `${b.pattern}: no code shown`);
  }
  const tabs = boxes.find((b) => b.pattern === 'tabs');
  // No script button anywhere: pattern scripts ship in the engine file since
  // 2026-09-14, so there is nothing to paste into Body Section Bottom.
  assert.ok(!tabs.buttons.includes('js'), 'the box offers a script to paste, and there is none to paste');
  // The builder, same pattern, same brand: its code box text is what its
  // three copy buttons assemble, so this is the copy buttons by proxy.
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 900 } });
  const wb = await ctx.newPage();
  await wb.goto(`${ORIGIN}/demo/index.html#tabs?brand=chevrolet`, { waitUntil: 'load' });
  await wb.waitForSelector('#wb-stage');
  await wb.frameLocator('#wb-stage').locator('.cs-slide').first().waitFor({ state: 'attached', timeout: 15000 });
  await wb.waitForTimeout(500);
  const builder = await wb.evaluate(() => document.getElementById('wb-code').textContent);
  await ctx.close();
  assert.equal(tabs.code, builder, 'the Brands page shows a different Chevrolet tabbed bar than the builder copies');
  // The snippet carries none of the page's own theme stand-ins.
  assert.doesNotMatch(tabs.code, /#006dc7|\.btn\s*\{|--cta-background-color:\s*#/i, 'preview scaffolding leaked into the code');
  assert.deepEqual(errors, []);
});

test('a brand with a font is shown in it; the generated CSS never names one', async () => {
  const got = await page.evaluate(() => {
    const chevy = document.querySelector('#b-chevrolet .bb-stage [role="tab"]');
    const other = document.querySelector('#b-acura .bb-stage .cargo-name');
    return {
      chevy: getComputedStyle(chevy).fontFamily,
      other: getComputedStyle(other).fontFamily,
      link: !!document.querySelector('link[href="https://cdn.dealeron.com/assets/fonts/chevy-sans/fonts.min.css"]'),
      note: document.querySelector('#b-chevrolet .bb-note')?.textContent,
      css: document.getElementById('gx-css').textContent,
    };
  });
  assert.match(got.chevy, /^ChevySans/);
  assert.match(got.other, /^Arial/, 'a brand without a font keeps the stage font');
  assert.equal(got.link, true);
  assert.match(got.note, /Shown in ChevySans/);
  assert.doesNotMatch(got.css, /font-family|ChevySans|@import/i, 'the font is page scaffolding, never generated CSS');
});

test('a roster-only brand shows its own cars on the model bar', async () => {
  const kia = await page.evaluate(() => {
    const s = document.querySelector('#b-kia .bb-stage');
    return {
      count: document.querySelectorAll('#b-kia .bb-stage').length,
      pattern: s?.dataset.pattern,
      first: s?.querySelector('.cs-slide img')?.getAttribute('src'),
      link: s?.parentElement.querySelector('a.ui-btn')?.getAttribute('href'),
      note: document.querySelector('#b-kia .bb-note')?.textContent,
    };
  });
  assert.equal(kia.count, 1);
  assert.equal(kia.pattern, 'modelbar');
  assert.match(kia.first ?? '', /oem\/kia\//);
  assert.equal(kia.link, 'index.html#modelbar?brand=kia');
  assert.match(kia.note ?? '', /not measured yet/i);
});

test('a roster-only brand with no cutouts of its own says so; a brand with its own roster does not', async () => {
  const notes = await page.evaluate(() => ({
    fiat: [...document.querySelectorAll('#b-fiat .bb-note')].map((p) => p.textContent).join(' '),
    kia: [...document.querySelectorAll('#b-kia .bb-note')].map((p) => p.textContent).join(' '),
  }));
  assert.match(notes.fiat, /no cutout roster of its own/);
  assert.doesNotMatch(notes.kia, /no cutout roster of its own/);
});

test('a brand tile name wraps instead of ellipsising', async () => {
  const name = await page.evaluate(() => {
    const el = document.querySelector('#bb-index a[href="#chevrolet"] .gx-tile-name');
    const cs = getComputedStyle(el);
    return { text: el.textContent, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, textOverflow: cs.textOverflow };
  });
  assert.equal(name.text, 'Chevrolet');
  assert.ok(name.scrollWidth <= name.clientWidth + 1, `scrollWidth ${name.scrollWidth} vs clientWidth ${name.clientWidth}`);
  assert.notEqual(name.textOverflow, 'ellipsis');
});

test('a black OEM mark gets a plate under it in dark mode, none in light', async ({ browser }) => {
  const light = await page.evaluate(() => getComputedStyle(document.querySelector('#b-chrysler .bb-logo')).backgroundColor);
  assert.match(light, /rgba\(0, 0, 0, 0\)|transparent/);

  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const p = await ctx.newPage();
  await p.addInitScript(() => localStorage.setItem('cs-theme', 'dark'));
  await p.goto(`${ORIGIN}/demo/brands.html`, { waitUntil: 'load' });
  await p.waitForSelector('#b-chrysler .bb-logo');
  const dark = await p.evaluate(() => getComputedStyle(document.querySelector('#b-chrysler .bb-logo')).backgroundColor);
  assert.equal(dark, 'rgb(255, 255, 255)');
  await ctx.close();
});

test('the deep link lands on the brand and nothing threw', async () => {
  await page.goto(`${ORIGIN}/demo/brands.html#toyota`, { waitUntil: 'load' });
  await page.waitForSelector('#b-toyota .cs-slide');
  await page.waitForTimeout(300);
  const near = await page.evaluate(() => Math.abs(document.getElementById('b-toyota').getBoundingClientRect().top) < 120);
  assert.equal(near, true);
  assert.deepEqual(errors, []);
});
