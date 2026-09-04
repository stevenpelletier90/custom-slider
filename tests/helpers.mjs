// Shared rig for the browser tests, run by @playwright/test
// (playwright.config.mjs starts the server and hands each file a browser).
export const ORIGIN = 'http://127.0.0.1:8137';

// A demo page with the clipboard readable, which is the only way to test what
// the copy buttons actually hand over rather than what the panel displays.
export async function openBuilder(browser, width = 1200) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${ORIGIN}/demo/index.html`, { waitUntil: 'load' });
  await stageReady(page);
  return { ctx, page, errors };
}

// Switch pattern by clicking the rail, never by changing the hash: a URL that
// differs only in its fragment is a same-document navigation, so goto('#id')
// leaves the page showing whatever loaded first. That cost an hour once.
export async function pick(page, id) {
  await page.click(`#wb-nav button[data-go="${id}"]`);
  await stageReady(page);
}

// The preview lives in an iframe, so that a media query asks a window of the
// previewed width rather than the whole browser. Nothing in the builder page
// can reach it with a plain selector any more, and these two are how the tests
// do: a Playwright FrameLocator for interaction, and CARGO.sdoc() for reads
// inside page.evaluate.
export const stageFrame = (page) => page.frameLocator('#wb-stage');

export async function stageReady(page) {
  await page.waitForSelector('#wb-stage');
  await stageFrame(page).locator('.cs-slide').first().waitFor({ state: 'attached', timeout: 15000 });
}

// Read something off the live slider from the parent page's context.
export const inStage = (page, fn, arg) => page.evaluate(([body, a]) => new Function('d', 'a', body)(globalThis.CARGO.sdoc(), a), [`return (${fn.toString()})(d, a)`, arg ?? null]);

export const patternIds = (page) => page.evaluate(() => Object.keys(globalThis.CARGO.PATTERNS));

// Chromium hands clipboard text back with CRLF on Windows whatever went in.
const clip = (page) => page.evaluate(() => navigator.clipboard.readText().then((t) => t.split('\r\n').join('\n')));

// The three parts a designer actually carries away, taken from the buttons
// rather than from the code box - the box is for reading, the buttons are the
// contract.
export async function copyParts(page) {
  await page.click('#wb-copy-css');
  const css = await clip(page);
  await page.click('#wb-copy-html');
  const html = await clip(page);
  const jsHidden = await page.evaluate(() => document.getElementById('wb-copy-js').hidden);
  let js = '';
  if (!jsHidden) {
    await page.click('#wb-copy-js');
    js = await clip(page);
  }
  return { css, html, js, jsHidden };
}

// A folder that starts closed - Tab names, Advanced - keeps its rows in the
// DOM but out of reach: a hidden input can still be READ, never filled or
// clicked. Open it the way a person would, and only when it is shut, so a
// second call does not close it again. pane.folder remembers the state, so
// this survives the rebuild a pattern switch does.
export const openFolder = async (page, title) => {
  const folder = page.locator(`#wb-settings .tp-fldv:has(.tp-fldv_t:text-is("${title}"))`).first();
  if (await folder.evaluate((f) => f.classList.contains('tp-fldv-expanded'))) return;
  await folder.locator('.tp-fldv_b').first().click();
  // The fold animates its height; a row is not clickable until it settles.
  await page.waitForTimeout(250);
};

// A row by its label, in the pane. Tweakpane commits a text input on change
// (Enter or blur), not on every keystroke, so the fill is followed by Enter.
export const rowByLabel = (page, label) => page.locator(`#wb-settings .tp-lblv:has(.tp-lblv_l:text-is("${label}"))`).first();

// A length row: a number box and a px/em/%/vw list. The unit goes FIRST -
// changing it converts what is in the box, so setting it after the number
// would convert the number you just asked for.
export const setLength = async (page, label, n, unit) => {
  const row = rowByLabel(page, label);
  await row.locator('select').first().selectOption(unit);
  const input = row.locator('input').first();
  await input.fill(n);
  await input.press('Enter');
  await page.waitForTimeout(120);
  return input;
};

export const setField = async (page, label, value) => {
  const input = rowByLabel(page, label).locator('input').first();
  await input.fill(value);
  await input.press('Enter');
  await page.waitForTimeout(120);
  return input;
};

// A switch row. Tweakpane draws its own tick: the real <input type=checkbox>
// sits at opacity 0 behind the mark (.tp-ckbv_w), so Playwright refuses to
// click the input as invisible - clicking the mark is what a person does
// anyway. The input is still what the state is read off. The methods are named
// for the Locator ones they stand in for, so a call site reads the same.
export const switchRow = (page, label) => {
  const row = rowByLabel(page, label);
  const input = row.locator('input[type=checkbox]').first();
  const hit = async () => {
    await row.locator('.tp-ckbv_w').first().click();
    // The panel is rebuilt out of the change event, so the new row exists a
    // microtask later; anything read straight after has to wait for it.
    await page.waitForTimeout(150);
  };
  return {
    count: () => input.count(),
    isChecked: () => input.isChecked(),
    click: hit,
    setChecked: async (on) => void ((await input.isChecked()) !== on && (await hit())),
    check: async () => void (!(await input.isChecked()) && (await hit())),
    uncheck: async () => void ((await input.isChecked()) && (await hit())),
  };
};

// A hostile host: Bootstrap 3 pins html to 10px on the storefronts, and the
// body font is not the demo's. Everything the snippet needs it has to bring.
export function hostHtml({ engineCss, engineJs, css = '', html = '', js = '', box = 1170, cssFirst = false }) {
  const sheets = cssFirst ? `<style>${css}</style><style>${engineCss}</style>` : `<style>${engineCss}</style><style>${css}</style>`;
  return (
    `<!doctype html><html><head><meta charset="utf-8">` +
    `<style>html{font-size:10px}body{margin:0;font-family:Arial,sans-serif;font-size:14px}#box{inline-size:${box}px}</style>` +
    `${sheets}</head><body><div id="box">${html}</div>` +
    `<script>${engineJs}<\/script>${js ? `<script>${js}<\/script>` : ''}</body></html>`
  );
}

export async function engineFiles() {
  const [engineCss, engineJs] = await Promise.all([fetch(`${ORIGIN}/dist/custom-slider.min.css`).then((r) => r.text()), fetch(`${ORIGIN}/dist/custom-slider.min.js`).then((r) => r.text())]);
  return { engineCss, engineJs };
}

// What the first slide and the root actually resolve to, which is the only
// thing worth asserting: every defect these tests guard shows up as a slide
// that stopped being the size it should be.
export const readSlider = (page, scope = '#box') =>
  page.evaluate((sel) => {
    const root = document.querySelector(`${sel} .cs`);
    const slide = document.querySelector(`${sel} .cs-slide`);
    if (!root || !slide) return null;
    const cs = getComputedStyle(root);
    return {
      cls: root.className.split(' ')[0],
      width: +slide.getBoundingClientRect().width.toFixed(1),
      basis: getComputedStyle(slide).flexBasis,
      gap: cs.getPropertyValue('--cs-gap').trim(),
      perView: cs.getPropertyValue('--cs-per-view').trim(),
      arrowBg: cs.getPropertyValue('--cs-arrow-bg').trim(),
    };
  }, scope);
