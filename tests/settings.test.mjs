// F025: slide content survived a reload and the settings did not, so a designer
// came back to their own slides under the wrong card style, with the wrong
// class name and the wrong ladder - and nothing on the page said why. The
// asymmetry was the bug: remembering half the state is worse than none.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { serve, launch, openBuilder, pick, setField } from './helpers.mjs';

let server, browser, ctx, page, errors;

before(async () => {
  server = await serve();
  browser = await launch();
  ({ ctx, page, errors } = await openBuilder(browser, server.origin, 1500));
});

after(async () => {
  await browser?.close();
  await server?.close();
});

const shown = (page) =>
  page.evaluate(() => ({
    name: document.querySelector('[data-name-field]').value,
    look: document.querySelector('#wb-settings .wb-look[aria-pressed="true"] span:last-child')?.textContent ?? null,
    gap: /--cs-gap:\s*([^;]*);/.exec(document.getElementById('wb-code').textContent)?.[1] ?? null,
    perView: [...document.querySelectorAll('#wb-settings label.wb-row')].filter((r) => /phone|and up/.test(r.querySelector('span')?.textContent ?? '')).map((r) => r.querySelector('input').value),
    frame: document.querySelector('.ui-widths button[aria-pressed="true"]')?.dataset.w ?? null,
  }));

describe('the settings come back with the slides', () => {
  test('card style, ladder, gap, name and preview width all survive a reload', async () => {
    await pick(page, 'cards');
    const nameField = page.locator('[data-name-field]');
    await nameField.fill('used-inventory');
    await nameField.blur();
    await setField(page, 'Gap', '1.75em');
    const ladder = page.locator('#wb-settings label:has(> span:text-is("Laptop (992px and up)")) input').first();
    await ladder.fill('4');
    await page.waitForTimeout(120);
    await page.click('.ui-widths button[data-w="970"]');
    await page.waitForTimeout(150);

    const before = await shown(page);
    assert.equal(before.name, 'used-inventory');
    assert.equal(before.gap, '1.75em');
    assert.equal(before.frame, '970');

    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('#wb-stage .cs-slide', { state: 'attached' });
    const after = await shown(page);
    assert.deepEqual(after, before, 'the settings did not come back the way they were left');
  });

  test('each pattern keeps its own settings', async () => {
    await pick(page, 'modelbar');
    await setField(page, 'Gap', '2.25em');
    await pick(page, 'service');
    await setField(page, 'Gap', '0.75em');

    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('#wb-stage .cs-slide', { state: 'attached' });
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
    await page.waitForSelector('#wb-stage .cs-slide', { state: 'attached' });

    const r = await page.evaluate(() => ({
      stage: document.getElementById('wb-stage').innerHTML.length,
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
    await page.click('.ui-widths button[data-w="1170"]');
    await page.waitForTimeout(150);
    // Shrink until 1170 no longer fits, so the builder steps the preview down.
    await page.setViewportSize({ width: 900, height: 900 });
    await page.waitForTimeout(300);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('cs-settings') ?? '{}').frame);
    assert.equal(stored, 1170, `the forced step-down overwrote the chosen width with ${stored}`);
    await page.setViewportSize({ width: 1500, height: 900 });
    await page.waitForTimeout(300);
  });
});

describe('nothing threw', () => {
  test('no page errors', () => {
    assert.deepEqual(errors, []);
  });
});
