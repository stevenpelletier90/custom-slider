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
// can reach it with a plain selector any more: stageFrame() is the Playwright
// FrameLocator for interaction, and reads go through globalThis.CARGO.sdoc()
// inside a page.evaluate. A helper wrapping that second half used to live here
// too; no test ever imported it, so it went on 2026-09-08.
export const stageFrame = (page) => page.frameLocator('#wb-stage');

export async function stageReady(page) {
  await page.waitForSelector('#wb-stage');
  await stageFrame(page).locator('.cs-slide').first().waitFor({ state: 'attached', timeout: 15000 });
}

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

// There used to be an openFolder() here, because Tab names and Advanced
// started closed and a closed folder keeps its rows in the DOM but out of
// reach - a hidden input can still be READ, never filled or clicked. Every
// folder is open now and none of them can be shut, so a test reaches any row
// the moment the panel is built. tests/pane.test.mjs is what holds that.

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
// The platform's theme layer, the part every dealer page has (the four theme
// tokens on :root, Bootstrap 3's .h1 and .btn/.btn-lg, the platform's
// .btn-cta built from the tokens). The tabbed bar's heading and button name
// these classes and tokens and ship no values of their own, so the host has
// to carry them or the paste is compared against a page no dealer has. Same
// rules as THEME_CSS in workbench.js; `theme` overrides the token values (a
// brand's own, from brands.js).
export const themeCss = (theme = {}) =>
  `:root{--cta-background-color:${theme['--cta-background-color'] ?? '#16324f'};--cta-font-color:${theme['--cta-font-color'] ?? '#fff'};--cta-hover-color:${theme['--cta-hover-color'] ?? '#0e2438'};--main-color:${theme['--main-color'] ?? '#262626'}}` +
  '.h1{margin:20px 0 10px;font-size:36px;font-weight:500;line-height:1.1}' +
  '.btn{display:inline-block;padding:6px 12px;font-size:14px;font-weight:400;line-height:1.42857143;text-align:center;white-space:nowrap;vertical-align:middle;cursor:pointer;text-decoration:none;border:1px solid transparent;border-radius:4px}' +
  '.btn-lg{padding:10px 16px;font-size:18px;line-height:1.3333333;border-radius:6px}' +
  '.btn-cta{color:var(--cta-font-color);background-color:var(--cta-background-color);border-color:var(--cta-background-color)}' +
  '.btn-cta:hover,.btn-cta:focus{color:var(--cta-font-color);background-color:var(--cta-hover-color);border-color:var(--cta-hover-color)}' +
  '.lead{margin:0 0 20px;font-size:16px;font-weight:300;line-height:1.4}@media(min-width:768px){.lead{font-size:21px}}' +
  '.text-muted{color:#777}@media(max-width:767px){.hidden-xs{display:none!important}}' +
  '.bg-main{color:#fff;background-color:var(--main-color)}.bg-main .btn-cta{color:#fff;background-color:transparent;border-color:#fff}.bg-main .btn-cta:hover,.bg-main .btn-cta:focus{color:var(--main-color);background-color:#fff;border-color:#fff}' +
  '.heading-lg{font-size:42px;line-height:1.1}' +
  // A brand's own heading and button rules on top, as its site's theme has.
  (theme.css ?? '');

export function hostHtml({ engineCss, engineJs, css = '', html = '', js = '', box = 1170, cssFirst = false, theme = {} }) {
  const sheets = cssFirst ? `<style>${css}</style><style>${engineCss}</style>` : `<style>${engineCss}</style><style>${css}</style>`;
  return (
    `<!doctype html><html><head><meta charset="utf-8">` +
    // The same two things a Bootstrap 3 storefront does to everything on it:
    // html{font-size:10px} (which is why every length in the card CSS is em),
    // and `* { box-sizing: border-box }` - bootstrap@3.4.1 dist/css/bootstrap.css
    // line 1069. The box model was missing here AND in the preview frame, so the
    // paste-parity test compared two documents that were consistently wrong
    // together and agreed with each other while both differed from a real
    // dealer page. A card with `block-size: 100%` plus padding and a border only
    // fits its slide under border-box.
    `<style>html{font-size:10px}*,*::before,*::after{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;font-size:14px}#box{inline-size:${box}px}${themeCss(theme)}</style>` +
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
