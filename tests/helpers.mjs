// Shared rig for the browser tests.
//
// No new dependencies: playwright is already a devDependency and node:test is
// built in. The static server is written here rather than shelled out to
// esbuild so there is no child process to kill - on Windows that is the part
// that goes wrong, and a hung server on a port is worse than a slow test.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// The repo's own dev server, if it happens to be running. CLAUDE.md is explicit
// that a second server must never be started on 8137, so this reuses the one
// that answers and otherwise takes a port of its own.
const DEV = 'http://127.0.0.1:8137';

async function devServerUp() {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 700);
    const r = await fetch(`${DEV}/demo/index.html`, { signal: c.signal });
    clearTimeout(t);
    return r.ok;
  } catch {
    return false;
  }
}

export async function serve(root = process.cwd()) {
  if (await devServerUp()) return { origin: DEV, close: async () => {}, reused: true };

  const server = createServer(async (req, res) => {
    // Strip the query and keep the path inside the repo: this serves the whole
    // working tree to a browser, so it refuses to walk out of it.
    const rel = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^([/\\])+/, '');
    if (rel.split(/[/\\]/).includes('..')) {
      res.writeHead(403).end('no');
      return;
    }
    try {
      const body = await readFile(join(root, rel));
      res.writeHead(200, { 'content-type': TYPES[extname(rel)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  return {
    origin: `http://127.0.0.1:${port}`,
    reused: false,
    close: () =>
      new Promise((r) => {
        server.closeAllConnections?.();
        server.close(r);
      }),
  };
}

export async function launch() {
  const pw = await import('playwright');
  const chromium = pw.chromium ?? pw.default.chromium;
  return chromium.launch();
}

// A demo page with the clipboard readable, which is the only way to test what
// the copy buttons actually hand over rather than what the panel displays.
export async function openBuilder(browser, origin, width = 1200) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${origin}/demo/index.html`, { waitUntil: 'load' });
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

export const setField = async (page, label, value) => {
  const input = page.locator(`#wb-settings label:has(> span:text-is("${label}")) input[type=text]`).first();
  await input.fill(value);
  await page.waitForTimeout(120);
  return input;
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

export async function engineFiles(origin) {
  const [engineCss, engineJs] = await Promise.all([fetch(`${origin}/dist/custom-slider.min.css`).then((r) => r.text()), fetch(`${origin}/dist/custom-slider.min.js`).then((r) => r.text())]);
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
