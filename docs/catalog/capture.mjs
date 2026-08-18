// No dependency is added to this repo for this script — custom-slider ships zero
// runtime dependencies and this is one-off research tooling, not part of the build.
// dealeron-design-tooling already depends on playwright, so we borrow its copy.
// Override with PLAYWRIGHT_FROM=/path/to/a/repo/that/has/it.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const CANDIDATES = [process.env.PLAYWRIGHT_FROM, path.join(process.env.HOME, 'Developer/dealeron-design-tooling'), process.cwd()].filter(Boolean);

function loadChromium() {
  for (const base of CANDIDATES) {
    for (const pkg of ['playwright', 'playwright-core']) {
      try {
        return require(require.resolve(pkg, { paths: [base] })).chromium;
      } catch {
        /* try the next one */
      }
    }
  }
  throw new Error(
    'playwright not found. It is deliberately NOT a dependency of this repo.\n' +
      'Run this from a checkout that has it (dealeron-design-tooling does), or:\n' +
      '  PLAYWRIGHT_FROM=/path/to/that/repo node capture.mjs ./shots',
  );
}

const chromium = loadChromium();
const OUT = process.argv[2];

// one representative per distinct ladder, plus the composition outliers
const TARGETS = [
  { host: 'acurademo1', brand: 'Acura', note: '5-up · 2→3→5' },
  { host: 'chevroletdemo1', brand: 'Chevrolet', note: '5-up · 2→3→4→5 · 5 tabs' },
  { host: 'lexusdemo1', brand: 'Lexus', note: '5-up · 1→2→3→5 · 4 bars' },
  { host: 'buickdemo1', brand: 'Buick', note: '4-up · 2→3→4' },
  { host: 'genesisdemo1', brand: 'Genesis', note: '4-up · 1→2→3→4 · 3 tabs' },
  { host: 'lincolndemo1', brand: 'Lincoln', note: '4-up · 2→3→4' },
  { host: 'forddemo1', brand: 'Ford', note: '5-up · 1→3→5 · 4 bars' },
  { host: 'hyundaidemo2', brand: 'Hyundai', note: '5-up · 1→3→4→5' },
  { host: 'mazdademo1', brand: 'Mazda', note: '3-up · 1→2→3 · has dots' },
  { host: 'toyotademo2', brand: 'Toyota', note: '2-up · 1→2' },
  { host: 'alfaromeodemo1', brand: 'Alfa Romeo', note: '6-up · 1→2→3→4→6' },
  { host: 'audidemo1', brand: 'Audi', note: '6-up · 1→2→3→4→6' },
  { host: 'kiademo1', brand: 'Kia', note: '3-up · centerMode · 3 tabs' },
  { host: 'hyundaidemo1', brand: 'Hyundai', note: 'rows: 2 — two-row grid' },
  { host: 'subarudemo1', brand: 'Subaru', note: '.corpcell-slider · page-stepping' },
  { host: 'vwdemo1', brand: 'Volkswagen', note: '4-up · 1→2→3→4 · 3 tabs' },
  { host: 'cadillacdemo1', brand: 'Cadillac', note: '5-up · 2→3→4→5 · 3 tabs' },
  { host: 'lexusdemo2', brand: 'Lexus', note: 'quick-nav · centerMode 9%' },
];

// Borrowing another repo's playwright means its bundled-browser version may not
// match what is in the shared ms-playwright cache (seen in practice: the package
// wanted build 1234, the cache held 1187). Try its own browser, then the system
// Chrome, then any chromium already in the cache.
async function launch() {
  const attempts = [
    ['bundled chromium', {}],
    ['system Chrome', { channel: 'chrome' }],
  ];
  for (const [what, opts] of attempts) {
    try {
      const b = await chromium.launch(opts);
      console.log(`browser: ${what}`);
      return b;
    } catch {
      /* try the next one */
    }
  }
  const cache = path.join(process.env.HOME, 'Library/Caches/ms-playwright');
  const build =
    fs.existsSync(cache) &&
    fs
      .readdirSync(cache)
      .filter((d) => d.startsWith('chromium-'))
      .sort()
      .pop();
  if (build) {
    const exe = path.join(cache, build, 'chrome-mac/Chromium.app/Contents/MacOS/Chromium');
    if (fs.existsSync(exe)) {
      console.log(`browser: cached ${build}`);
      return chromium.launch({ executablePath: exe });
    }
  }
  throw new Error('no usable browser: install one with `npx playwright install chromium`, or install Google Chrome');
}

const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
const results = [];

for (const t of TARGETS) {
  const page = await ctx.newPage();
  const sel = t.host === 'subarudemo1' ? '.corpcell-slider' : t.host === 'lexusdemo2' ? '.quick-nav-5' : '.modelBarS';
  try {
    await page.goto(`https://${t.host}.dealeron.com/`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3500);
    const handle = await page.evaluateHandle((sel) => {
      const all = [...document.querySelectorAll(sel)];
      const el = all.find((b) => b.getBoundingClientRect().height > 40) || all[0];
      if (el) el.scrollIntoView({ block: 'center' });
      return el || null;
    }, sel);
    const el = handle.asElement();
    if (!el) {
      results.push({ ...t, ok: false, why: 'element not found' });
      await page.close();
      continue;
    }
    await page.waitForTimeout(1500);
    const box = await el.boundingBox();
    if (!box || box.height < 40) {
      results.push({ ...t, ok: false, why: 'not rendered' });
      await page.close();
      continue;
    }
    const file = `${OUT}/mb-${t.host}.jpg`;
    await el.screenshot({ path: file, type: 'jpeg', quality: 72 });
    const bytes = fs.statSync(file).size;
    results.push({ ...t, ok: true, file, bytes, w: Math.round(box.width), h: Math.round(box.height) });
    console.log(`ok   ${t.host.padEnd(18)} ${Math.round(box.width)}x${Math.round(box.height)}  ${(bytes / 1024).toFixed(0)}KB`);
  } catch (e) {
    results.push({ ...t, ok: false, why: String(e).slice(0, 90) });
    console.log(`FAIL ${t.host.padEnd(18)} ${String(e).slice(0, 70)}`);
  }
  await page.close();
}

fs.writeFileSync(`${OUT}/manifest.json`, JSON.stringify(results, null, 2));
await browser.close();
console.log(`\ncaptured ${results.filter((r) => r.ok).length}/${TARGETS.length}`);
