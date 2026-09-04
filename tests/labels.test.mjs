// F100/F098: every announced string settable from the HTML.
//
// The CMS hands a designer markup, never a constructor call, so before this the
// labels option was unreachable from a pasted snippet: a Spanish-language page
// announced English controls, and the visible "3 / 12" counter - which is
// otherwise two lines of CSS away - could not be worded.
//
// One generic sweep over data-cs-label-* covers all eleven labels, so the test
// that matters is that the MAPPING holds for every key in DEFAULTS, not that
// some hand-picked three of them work.
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { hostHtml, engineFiles } from './helpers.mjs';

test.describe.configure({ mode: 'serial' });

let ctx, page, engine, errors;

test.beforeAll(async ({ browser }) => {
  engine = await engineFiles();
  ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  page = await ctx.newPage();
  errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
});

// A plain three-slide carousel, one card per view unless told otherwise.
const slider = (attrs = '', perView = 1) =>
  `<div class="cs demo" data-cs aria-label="Test" style="--cs-per-view:${perView}"${attrs ? ' ' + attrs : ''}>` +
  `<ul class="cs-track">${[1, 2, 3, 4, 5, 6].map((n) => `<li class="cs-slide"><p>Card ${n}</p></li>`).join('')}</ul></div>`;

const render = async (attrs, perView) => {
  await page.setContent(hostHtml({ ...engine, html: slider(attrs, perView) }), { waitUntil: 'load' });
  await page.waitForTimeout(120);
};

const announced = () =>
  page.evaluate(() => {
    const q = (s) => document.querySelector(`#box ${s}`);
    return {
      prev: q('.cs-arrow--prev')?.getAttribute('aria-label'),
      next: q('.cs-arrow--next')?.getAttribute('aria-label'),
      dots: q('.cs-dots')?.getAttribute('aria-label'),
      dot0: q('.cs-dot')?.getAttribute('aria-label'),
      status: q('.cs-status')?.textContent,
    };
  });

test.describe('data-cs-label-* reaches every announced string', () => {
  test('the defaults are English and unchanged when no attribute is set', async () => {
    await render('');
    const a = await announced();
    assert.equal(a.prev, 'Previous slides');
    assert.equal(a.next, 'Next slides');
    assert.equal(a.dots, 'Choose slide');
    assert.equal(a.status, 'Slide 1 of 6');
    assert.deepEqual(errors, []);
  });

  // The whole point: a dealer page in Spanish, with nothing but attributes.
  test('a Spanish page announces Spanish', async () => {
    await render(
      'data-cs-label-prev="Anteriores" data-cs-label-next="Siguientes" data-cs-label-dots="Elegir diapositiva" data-cs-label-goto-slide="Ir a la diapositiva {n}" data-cs-label-status-single="Diapositiva {n} de {total}" data-cs-roledescription="carrusel"',
    );
    const a = await announced();
    assert.equal(a.prev, 'Anteriores');
    assert.equal(a.next, 'Siguientes');
    assert.equal(a.dots, 'Elegir diapositiva');
    assert.equal(a.dot0, 'Ir a la diapositiva 1');
    assert.equal(a.status, 'Diapositiva 1 de 6');
    assert.equal(await page.getAttribute('#box .cs', 'aria-roledescription'), 'carrusel');
    assert.deepEqual(errors, []);
  });

  // The kebab attribute name has to reach the camelCase key for EVERY label,
  // including the two-word ones - that mapping is the only thing the generic
  // sweep can get wrong, and it fails silently when it does.
  test('every label in DEFAULTS is reachable, two-word names included', async () => {
    const KEYS = ['prev', 'next', 'pause', 'play', 'dots', 'gotoSlide', 'gotoPage', 'statusSingle', 'statusMulti', 'thumbs', 'photo'];
    const attrs = KEYS.map((k) => `data-cs-label-${k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}="X${k}"`).join(' ');
    await render(attrs);
    const seen = await page.evaluate(() => document.querySelector('#box .cs')._cs.opts.labels);
    for (const k of KEYS) assert.equal(seen[k], `X${k}`, `${k} did not arrive from its attribute`);
    assert.deepEqual(errors, []);
  });

  // Multi-card wording is a different label from the 1-up one, and it is the
  // one a model bar actually uses.
  test('the multi-card status uses its own label and keeps updating', async () => {
    await render('data-cs-label-status-multi="{from}-{to} / {total}"', 3);
    assert.equal((await announced()).status, '1-3 / 6');
    await page.click('#box .cs-arrow--next');
    await page.waitForTimeout(700);
    assert.equal((await announced()).status, '4-6 / 6');
    assert.deepEqual(errors, []);
  });

  // An explicit constructor call still wins, the same way it does for every
  // other option: the attribute is the floor, not an override.
  test('a JS labels option still beats the attribute', async () => {
    await page.setContent(
      hostHtml({ ...engine, html: slider('data-cs-init="manual" data-cs-label-next="FromAttr"'), js: `new CustomSlider(document.querySelector('#box .cs'), { labels: { next: 'FromJS' } });` }),
      { waitUntil: 'load' },
    );
    await page.waitForTimeout(120);
    const a = await announced();
    assert.equal(a.next, 'FromJS');
    assert.equal(a.prev, 'Previous slides', 'an unset label should still fall back to the default');
    assert.deepEqual(errors, []);
  });

  // A bare data-cs-label- has no key to write to. It used to throw reading
  // charAt 7 of a 7-character string, which would take the whole slider down.
  test('a malformed attribute name does not take the slider down', async () => {
    await render('data-cs-label- data-cs-label-nonsense="ignored"');
    const a = await announced();
    assert.equal(a.next, 'Next slides');
    assert.deepEqual(errors, []);
  });
});
