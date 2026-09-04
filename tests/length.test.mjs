// A length is a number and a unit, and switching the unit converts where a
// conversion is exact. The store still holds '0.5em' - the shape okValue()
// and cssFor() already understand - so nothing the copy panel emits changes.
//
// The unit is set BEFORE the number in every case here, which is also what
// helpers.setLength() does. Changing the unit converts what is in the box, so
// typing a number and then reaching for the unit list would convert the number
// you just typed - right for a designer switching units, wrong for a test that
// means "12, in px".
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { openBuilder, pick, rowByLabel, copyParts } from './helpers.mjs';

test.describe.configure({ mode: 'serial' });

let page;
test.beforeAll(async ({ browser }) => {
  ({ page } = await openBuilder(browser, 1440));
  await pick(page, 'modelbar');
});

const num = (label) => rowByLabel(page, label).locator('input[type=text], input[type=number]').first();
const unit = (label) => rowByLabel(page, label).locator('select').first();

// The card's own resolved font size, which is what px<->em converts off.
const fontPx = () => page.evaluate(() => parseFloat(getComputedStyle(globalThis.CARGO.sdoc().querySelector('.cs')).fontSize));

test('Gap is a number with a unit list, and the copied CSS carries the pair', async () => {
  await unit('Gap').selectOption('px');
  await num('Gap').fill('12');
  await num('Gap').press('Enter');
  await page.waitForTimeout(120);
  const { css } = await copyParts(page);
  assert.match(css, /--cs-gap:\s*12px/);
});

test('both halves of the row have a name of their own', async () => {
  assert.equal(await num('Gap').getAttribute('aria-label'), 'Gap');
  assert.equal(await unit('Gap').getAttribute('aria-label'), 'Gap unit');
});

test('px to em converts off the card font size', async () => {
  await unit('Gap').selectOption('px');
  await num('Gap').fill('16');
  await num('Gap').press('Enter');
  await unit('Gap').selectOption('em');
  await page.waitForTimeout(120);
  const px = await fontPx();
  const want = String(+(16 / px).toFixed(3));
  assert.equal(await num('Gap').inputValue(), want);
  const { css } = await copyParts(page);
  assert.match(css, new RegExp(`--cs-gap:\\s*${want}em`));
});

// The one knob that IS the carousel's font-size. An em in a font-size resolves
// against the PARENT's, so converting it against the carousel is
// self-referential: .cs computes 32px, 32/32 hands back 1em - half the size
// asked for, and the value SHARED_DEFAULTS already holds, so the delta filter
// drops the declaration and the knob silently does nothing.
test('the card text size converts against the page around the carousel, not itself', async () => {
  const outer = await page.evaluate(() => parseFloat(getComputedStyle(globalThis.CARGO.sdoc().querySelector('.cs').parentElement).fontSize));
  await unit('Card text size').selectOption('px');
  await num('Card text size').fill(String(outer * 2));
  await num('Card text size').press('Enter');
  await page.waitForTimeout(150);
  await unit('Card text size').selectOption('em');
  await page.waitForTimeout(150);
  assert.equal(await num('Card text size').inputValue(), '2', 'the conversion measured the carousel it was about to resize');
  const { css } = await copyParts(page);
  assert.match(css, /--cargo-font:\s*2em/, 'the doubled text size never reached the copied CSS');
  // Put it back: every test after this one reads the same card font size.
  await unit('Card text size').selectOption('em');
  await num('Card text size').fill('1');
  await num('Card text size').press('Enter');
  await page.waitForTimeout(150);
});

test('a typed zero stores 0.1px, never a bare 0', async () => {
  await num('Gap').fill('0');
  await num('Gap').press('Enter');
  await page.waitForTimeout(120);
  const { css } = await copyParts(page);
  assert.doesNotMatch(css, /--cs-gap:\s*0(px)?\s*;/);
  assert.match(css, /--cs-gap:\s*0\.1px/);
});

// Peek's own off value is 0px, which is the ENGINE's default - so it is
// dropped by the delta filter and costs no declaration. Turning it off must
// not start shipping the dot row's 0.1px instead.
test('a zero goes back to the default zero where the default is one', async () => {
  await unit('Peek').selectOption('px');
  await num('Peek').fill('0');
  await num('Peek').press('Enter');
  await page.waitForTimeout(150);
  const { css } = await copyParts(page);
  assert.doesNotMatch(css, /--cs-peek/);
});

test('switching to % keeps the number and changes only the unit', async () => {
  await unit('Gap').selectOption('em');
  await num('Gap').fill('5');
  await num('Gap').press('Enter');
  await unit('Gap').selectOption('%');
  await page.waitForTimeout(120);
  assert.equal(await num('Gap').inputValue(), '5');
  const { css } = await copyParts(page);
  assert.match(css, /--cs-gap:\s*5%/);
});

// The arrows are how a length is nudged; a step must land on a real number
// rather than 0.30000000000000004.
test('the arrow keys step the number and commit it', async () => {
  await unit('Gap').selectOption('em');
  await num('Gap').fill('2');
  await num('Gap').press('Enter');
  await num('Gap').press('ArrowUp');
  await page.waitForTimeout(120);
  assert.equal(await num('Gap').inputValue(), '3');
  await num('Gap').press('Alt+ArrowDown');
  await page.waitForTimeout(120);
  assert.equal(await num('Gap').inputValue(), '2.9');
  const { css } = await copyParts(page);
  assert.match(css, /--cs-gap:\s*2\.9em/);
});

// An arrow key is held down. Stepping past zero into a negative gap is not
// what anyone holding one means, and okValue() would pass it and cssFor()
// would ship it.
// The floor shows as 0.1px on the gap rather than 0, because a stepped-to-zero
// is a zero like any other and the gap's zero is 0.1px.
test('the stepper stops at zero rather than going negative', async () => {
  await unit('Gap').selectOption('em');
  await num('Gap').fill('0.5');
  await num('Gap').press('Enter');
  await num('Gap').press('ArrowDown');
  await page.waitForTimeout(120);
  await num('Gap').press('ArrowDown');
  await page.waitForTimeout(120);
  assert.ok(parseFloat(await num('Gap').inputValue()) >= 0, `the stepper went to ${await num('Gap').inputValue()}`);
  const { css } = await copyParts(page);
  assert.doesNotMatch(css, /--cs-gap:\s*-/, 'the stepper shipped a negative length');
  assert.match(css, /--cs-gap:\s*0\.1px/, 'stepping to the floor did not land on the zero the gap uses');
});

// Which switches convert and which do not is not guessable from the list.
test('the unit list says which switches convert', async () => {
  const title = await unit('Gap').getAttribute('title');
  assert.match(title ?? '', /px and em convert/i);
  assert.match(title ?? '', /% and vw/i);
});

// A value that is not one number and one unit cannot be shown in a number box
// without lying about it, so those knobs keep the free-text field.
test('a multi-value knob stays a text field', async () => {
  for (const label of ['Plate padding', 'Side gutter']) {
    assert.equal(await rowByLabel(page, label).locator('select').count(), 0, `${label} became a length row`);
  }
});
