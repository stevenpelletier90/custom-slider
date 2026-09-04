// Byte-budget gate: dist JS+CSS combined, gzipped.
//
// The number is a positioning target, not a technical limit. Spec §2 set it at
// 5 KB against the libraries this replaces — Glider.js 2.9 KB, Embla core
// 6.7 KB, Splide 15.8 KB gzip — to prove the in-house engine is the smaller
// choice. Raised to 6 KB on 2026-07-29: accessibility work (role="list" for
// WebKit, reduced-motion handling, the focusable gallery panel and its focus
// ring) had consumed the last 2 bytes, and the gate was about to start
// rejecting WCAG fixes. 6 KB still undercuts Embla's core and is 2.6x smaller
// than Splide, so the claim the budget exists to defend still holds.
//
// Raised to 6.5 KB on 2026-08-27, again for accessibility. A carousel whose
// slides all fit still rendered both arrows and a dot: two focusable controls
// that do nothing, and a dot group announcing a one-of-one choice. Because
// --cs-per-view is CSS, whether a strip fits changes at any resize, so the
// check has to live in _updateUI and cost real bytes (that, plus the CSS rule
// letting [hidden] beat the controls' own display values, came to 49 B). The
// alternative was shipping a known keyboard and screen-reader defect to stay
// under a self-imposed number. 6.5 KB still undercuts Embla's 6.7 KB core.
//
// Raise it again only for the same reason — a correctness or accessibility
// need — and say so here. Features should have to fit.
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const BUDGET = 6656;

// The stylesheet ships the engine AND the card styles in one file, so a site
// links one CSS and one JS. The budget still weighs the ENGINE alone: it exists
// to show this is smaller than Embla's 6.7 KB core and Splide's 15.8 KB, and
// those are carousel engines with no card library in them. Counting the cards
// against it would keep the number and quietly change the question it answers.
// scripts/build-cards.mjs writes the marker this splits on.
const cssAll = readFileSync('dist/custom-slider.min.css', 'utf8');
const cut = cssAll.indexOf('/*! cards */');
const engineCss = cut === -1 ? cssAll : cssAll.slice(0, cut);
const cardsCss = cut === -1 ? '' : cssAll.slice(cut);

let total = 0;
for (const [name, buf] of [
  ['dist/custom-slider.min.js', readFileSync('dist/custom-slider.min.js')],
  ['dist/custom-slider.min.css (engine)', Buffer.from(engineCss)],
]) {
  const gz = gzipSync(buf, { level: 9 }).length;
  total += gz;
  console.log(`${name}: ${gz} B gzip`);
}
console.log(`total: ${total} B gzip (budget ${BUDGET})`);

// Reported so the real transfer size is never a surprise, but outside the gate.
if (cardsCss) {
  const cards = gzipSync(Buffer.from(cardsCss), { level: 9 }).length;
  const whole = gzipSync(Buffer.from(cssAll), { level: 9 }).length;
  console.log(`  card styles in the same file: ${cards} B gzip`);
  console.log(`  what a site actually downloads: ${whole} B CSS + ${gzipSync(readFileSync('dist/custom-slider.min.js'), { level: 9 }).length} B JS`);
}

if (total >= BUDGET) {
  console.error(`FAIL: at or over the ${BUDGET} B gzip budget`);
  process.exit(1);
}
