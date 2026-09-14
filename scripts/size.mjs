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
//
// Since 2026-09-14 both files carry a THIRD section behind `/*! patterns */`
// (scripts/build-patterns.mjs): every pattern's structural CSS, and the six
// pattern scripts. Same rule - pattern wiring is not engine, so it is weighed
// beside the budget, not against it.
const cssAll = readFileSync('dist/custom-slider.min.css', 'utf8');
const jsAll = readFileSync('dist/custom-slider.min.js', 'utf8');
const split = (text, mark) => {
  const at = text.indexOf(mark);
  return at === -1 ? [text, ''] : [text.slice(0, at), text.slice(at)];
};
const [cssNoPatterns, patternsCss] = split(cssAll, '/*! patterns */');
const [engineCss, cardsCss] = split(cssNoPatterns, '/*! cards */');
const [engineJs, patternsJs] = split(jsAll, '/*! patterns */');

let total = 0;
for (const [name, buf] of [
  ['dist/custom-slider.min.js (engine)', Buffer.from(engineJs)],
  ['dist/custom-slider.min.css (engine)', Buffer.from(engineCss)],
]) {
  const gz = gzipSync(buf, { level: 9 }).length;
  total += gz;
  console.log(`${name}: ${gz} B gzip`);
}
console.log(`total: ${total} B gzip (budget ${BUDGET})`);

// Reported so the real transfer size is never a surprise, but outside the gate.
const gz = (text) => gzipSync(Buffer.from(text), { level: 9 }).length;
if (cardsCss) console.log(`  card styles in the same file: ${gz(cardsCss)} B gzip`);
if (patternsCss || patternsJs) console.log(`  pattern structure in the same files: ${gz(patternsCss)} B CSS + ${gz(patternsJs)} B JS gzip`);
console.log(`  what a site actually downloads: ${gz(cssAll)} B CSS + ${gz(jsAll)} B JS`);

if (total >= BUDGET) {
  console.error(`FAIL: at or over the ${BUDGET} B gzip budget`);
  process.exit(1);
}
