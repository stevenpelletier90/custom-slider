// Accessibility audit: axe-core over every page and every state.
//
// The engine's accessibility behaviours are a frozen part of the contract
// (README, "Swapping the engine later"), so a regression in one is a broken
// promise to every site running it. axe cannot see most of what matters here -
// it will not tell you an announced count is wrong - but it catches the whole
// mechanical class (names, roles, contrast, duplicate ids, orphaned controls)
// over far more states than anyone clicks through by hand.
//
// The point is the STATES. The builder is one page in 17 patterns x 7 looks x 2
// themes; auditing demo/index.html once checks the model bar in light mode and
// nothing else. The first run of this found 26 violations, 23 of them contrast
// in the card CSS the copy panel ships to dealers - none of which appear on a
// plain page load.
//
//   npm run a11y                 # needs the dev server: npm run serve
//   npm run a11y -- --url ...    # audit somewhere else
//
// Kept out of `npm run validate` on purpose: it drives a real browser and needs
// a server, so it is a deliberate run, not part of the pre-commit gate.

import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const argv = process.argv.slice(2);
const BASE = argv.includes('--url') ? argv[argv.indexOf('--url') + 1] : 'http://127.0.0.1:8137';

// WCAG 2.2 AA, which is what the project's own notes cite (1.4.11, 2.4.7, 2.5.8).
const RUN = { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

const seen = new Set();
const findings = [];
let states = 0;

// The generated controls, checked against what is actually painted behind them.
//
// axe does not catch these and cannot be blamed for it: its colour-contrast rule
// looks at TEXT, and an arrow is an SVG glyph, a dot is a ::after background and
// a selected thumb is a border. A logo panel shipping black arrows on a navy
// strip at 1.06:1 passed a clean axe run over all 31 states.
//
// Everything here composites. A translucent chip over a card over a page is
// three layers, and judging the glyph against only the nearest one is how a
// first pass at this reported fifteen white-on-white failures that were all fine.
function controlContrast() {
  const parse = (c) => {
    const m = (c.match(/[0-9.]+/g) || [0, 0, 0]).map(Number);
    return { r: m[0], g: m[1], b: m[2], a: m.length > 3 ? m[3] : 1 };
  };
  const over = (f, b) => ({ r: f.a * f.r + (1 - f.a) * b.r, g: f.a * f.g + (1 - f.a) * b.g, b: f.a * f.b + (1 - f.a) * b.b, a: 1 });
  const lum = (c) => {
    const t = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * t(c.r) + 0.7152 * t(c.g) + 0.0722 * t(c.b);
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100;
  };
  // Composite every translucent layer back to the first opaque one. A 55%-black
  // chip over a white card over the page is three layers, and judging the glyph
  // against only the nearest is how a first pass reported fifteen
  // white-on-white failures that were all perfectly legible.
  const ground = (el) => {
    const layers = [];
    for (let n = el.parentElement; n; n = n.parentElement) {
      const bg = parse(getComputedStyle(n).backgroundColor);
      if (bg.a === 0) continue;
      layers.push(bg);
      if (bg.a > 0.99) break;
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
    return base;
  };
  const shown = (el) => el && !el.hidden && el.offsetParent !== null;
  const rgb = (c) => 'rgb(' + [c.r, c.g, c.b].map(Math.round).join(' ') + ')';
  const out = [];
  for (const root of document.querySelectorAll('.cs')) {
    const label = root.getAttribute('aria-label') || '(unlabelled)';
    const add = (what, fg, behind) => {
      const r = ratio(fg, behind);
      if (r < 3) out.push({ label, what, fg: rgb(fg), behind: rgb(behind), ratio: r });
    };
    for (const [sel, what] of [
      ['.cs-arrow', 'arrow'],
      ['.cs-pause', 'pause button'],
    ]) {
      const el = root.querySelector(sel);
      if (!shown(el)) continue;
      const cs = getComputedStyle(el);
      add(what, parse(cs.color), over(parse(cs.backgroundColor), ground(el)));
    }
    for (const [sel, what] of [
      ['.cs-dot:not(.cs-dot--current)', 'dot'],
      ['.cs-dot--current', 'current dot'],
    ]) {
      const el = root.querySelector(sel);
      if (!shown(el)) continue;
      add(what, parse(getComputedStyle(el, '::after').backgroundColor), ground(el));
    }
    const thumb = root.querySelector('.cs-thumb[aria-selected="true"]');
    if (shown(thumb)) add('selected thumb outline', parse(getComputedStyle(thumb).borderTopColor), ground(thumb));
  }
  return out;
}

async function audit(where) {
  states++;
  await page.evaluate(AXE);
  const res = await page.evaluate((opts) => globalThis.axe.run(document, opts), RUN);
  for (const v of res.violations) {
    for (const n of v.nodes) {
      // The same violation on the same element recurs across states; report each
      // distinct (rule, target) once, named for where it first showed up.
      const key = `${v.id}|${n.target.join(' ')}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const d = n.any?.[0]?.data ?? {};
      findings.push({
        impact: v.impact,
        id: v.id,
        help: v.help,
        where,
        target: n.target.join(' ').slice(0, 100),
        contrast: d.contrastRatio ? `${d.fgColor} on ${d.bgColor} = ${d.contrastRatio}:1, needs ${d.expectedContrastRatio}` : null,
      });
    }
  }

  // WCAG 1.4.11 wants 3:1 for a control against its background. These are the
  // engine's own controls, which are the frozen part of the contract - a strip
  // whose arrows cannot be seen is broken for everyone using that look.
  for (const c of await page.evaluate(controlContrast)) {
    const key = `control|${c.what}|${c.fg}|${c.behind}`;
    if (seen.has(key)) continue;
    seen.add(key);
    findings.push({
      impact: 'serious',
      id: 'control-contrast',
      help: 'Slider controls must be visible against what is behind them',
      where,
      target: `${c.what} in “${c.label}”`,
      contrast: `${c.fg} on ${c.behind} = ${c.ratio}:1, needs 3:1`,
    });
  }
}

const go = async (path) => {
  await page.goto(BASE + path, { waitUntil: 'load' });
  await page.waitForTimeout(1400);
};

// The root page is a 0-second meta refresh onto /demo/. Auditing it as it
// ships is a race - sometimes axe runs on the stub, sometimes on the page it
// has already navigated to, and a half-torn-down document reports phantom
// failures against <html>. Strip the refresh so what is audited is
// deterministically the fallback content a crawler or a no-JS visitor reads.
await page.route(`${BASE}/index.html`, async (route) => {
  const res = await route.fetch();
  await route.fulfill({ response: res, contentType: 'text/html', body: (await res.text()).replace(/<meta http-equiv="refresh"[^>]*>/i, '') });
});

for (const p of ['/index.html', '/demo/index.html', '/demo/patterns.html', '/demo/reference.html']) {
  await go(p);
  await audit(p);
}
await page.unroute(`${BASE}/index.html`);

// Every pattern, each with its own settings panel and content editor.
await go('/demo/index.html');
const patterns = await page.evaluate(() => Object.keys(globalThis.CARGO.PATTERNS));
for (const id of patterns) {
  await page.locator(`#wb-nav button[data-go="${id}"]`).click();
  await page.waitForTimeout(500);
  await audit(`builder #${id}`);
}

// Every card look, drawn on the model bar the way the look picker draws it.
await page.locator('#wb-nav button[data-go="modelbar"]').click();
await page.waitForTimeout(500);
const looks = await page.locator('.wb-look').count();
for (let i = 0; i < looks; i++) {
  await page.locator('.wb-look').nth(i).click();
  await page.waitForTimeout(500);
  await audit(`look ${i}`);
}

// The dark palette is a second set of colours axe has not seen yet.
await page.locator('#ui-theme').click();
await page.waitForTimeout(600);
await audit('dark theme');
await page.locator('#ui-theme').click();
await page.waitForTimeout(400);

// States only a click reaches. A dialog's contents are not in the page until
// it opens, so a load-time audit never sees either of these.
await page.locator('#wb-nav button[data-go="media-gallery"]').click();
await page.waitForTimeout(700);
await page.locator('#wb-stage .cs-thumb').nth(2).click();
await page.waitForTimeout(800);
await page.locator('#wb-stage .cs-slide:not([inert]) [data-video]').first().click();
await page.waitForTimeout(600);
await audit('video dialog open');
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

await page.locator('#wb-nav button[data-go="lightbox"]').click();
await page.waitForTimeout(700);
await page.locator('#wb-stage [data-lb-open]').click();
await page.waitForTimeout(800);
await audit('lightbox dialog open');

await browser.close();

const order = { critical: 0, serious: 1, moderate: 2, minor: 3 };
findings.sort((a, b) => (order[a.impact] ?? 9) - (order[b.impact] ?? 9));
for (const f of findings) {
  console.error(`  [${f.impact}] ${f.id} — ${f.help}`);
  console.error(`    ${f.where}   ${f.target}`);
  if (f.contrast) console.error(`    ${f.contrast}`);
}

if (findings.length) {
  console.error(`\na11y: ${findings.length} violation(s) over ${states} states.`);
  process.exit(1);
}
console.log(`a11y: clean over ${states} states (${patterns.length} patterns, ${looks} looks, both themes, both dialogs).`);
