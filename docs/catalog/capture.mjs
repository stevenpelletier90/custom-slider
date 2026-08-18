import { chromium } from 'playwright-core';
import fs from 'node:fs';

const EXEC = process.env.HOME + '/Library/Caches/ms-playwright/chromium-1187/chrome-mac/Chromium.app/Contents/MacOS/Chromium';
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

const browser = await chromium.launch({ executablePath: EXEC });
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
