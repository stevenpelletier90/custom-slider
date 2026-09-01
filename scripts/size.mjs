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
const files = ['dist/custom-slider.js', 'dist/custom-slider.css'];
let total = 0;
for (const f of files) {
  const gz = gzipSync(readFileSync(f), { level: 9 }).length;
  total += gz;
  console.log(`${f}: ${gz} B gzip`);
}
console.log(`total: ${total} B gzip (budget ${BUDGET})`);

// The card looks are a SEPARATE, optional file, reported but never counted.
// The budget exists to prove the ENGINE is the smaller choice against Embla's
// 6.7 KB core and Splide's 15.8 KB, and a site that links no card looks pays
// none of this. A site that does link it is buying seven card designs, not
// carousel machinery, so charging it against the engine's number would make
// that number answer a different question than the one it was set to answer.
try {
  const gz = gzipSync(readFileSync('dist/custom-slider-cards.css'), { level: 9 }).length;
  console.log(`dist/custom-slider-cards.css: ${gz} B gzip (optional, outside the budget)`);
} catch {
  /* not built yet — the engine gate above is what matters */
}

if (total >= BUDGET) {
  console.error(`FAIL: at or over the ${BUDGET} B gzip budget`);
  process.exit(1);
}
