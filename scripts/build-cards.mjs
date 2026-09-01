// Builds dist/custom-slider-cards.css — the OPTIONAL card-looks stylesheet.
//
// Why it exists: the engine ships zero card styling on purpose (cs-* is
// mechanism, cargo-* is content), so putting a slider on a page meant pasting a
// <style> block AND markup for every single one — 300–990 B gzip of near-
// duplicate CSS per slider, and two things to paste instead of one. Link this
// file once and a slider becomes an HTML paste:
//
//   <div class="cs cargo-tile cs-xs-2 cs-sm-3 cs-md-4 cs-lg-5" data-cs> …
//
// It is generated from the SAME LOOKS object demo/assets/looks.js gives the
// builder, never hand-written. That is the whole point: a hand-kept copy of
// seven card looks would drift from the builder within a week, and the drift
// would only show up on a dealer's page. Same source, same scoping rule the
// builder uses, so the file cannot disagree with the preview.
//
// Run from `npm run build`.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { transform } from 'esbuild';

const noop = () => {};
const sandbox = {};
sandbox.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  querySelector: () => null,
  createElement: () => ({ style: {}, setAttribute: noop, append: noop }),
  addEventListener: noop,
};
sandbox.addEventListener = noop;
sandbox.getComputedStyle = () => ({ getPropertyValue: () => '', fontSize: '16px' });
sandbox.location = { hash: '' };
sandbox.history = { replaceState: noop };
for (const f of ['looks.js', 'brands.js']) {
  new Function('globalThis', 'document', 'window', readFileSync(`demo/assets/${f}`, 'utf8')).call(sandbox, sandbox, sandbox.document, sandbox);
}
const { LOOKS } = sandbox.CARGO;

// The platform's Bootstrap 3 tiers, and the xs ceiling that pairs with them.
// .98 because max-width:767px and min-width:768px leave a dead zone at any
// fractional viewport width — the same reason Bootstrap 4 and 5 use it.
const TIERS = [
  ['xs', null],
  ['sm', 768],
  ['md', 992],
  ['lg', 1200],
];
const MAX_COLS = 8;

// The builder's own scoping rule, applied with the look's class as the root.
// %wrap% never appears in a LOOK (only structural patterns wrap themselves), so
// a look that grows one would show up here as an unscoped selector rather than
// silently shipping broken CSS.
const scope = (css, sel) =>
  css.replace(/(^|[{}\n,]\s*)(%root%|%wrap%|\.cargo[\w-]*)/g, (_, pre, tok) => {
    if (tok === '%root%') return `${pre}${sel}`;
    if (tok === '%wrap%') throw new Error(`${sel}: a card look must not use %wrap% — that is for structural patterns, which stay in the snippet`);
    return `${pre}${sel} ${tok}`;
  });

const out = [
  '/*! Custom Slider — card looks. Optional: the engine runs without this file.',
  '   Generated from demo/assets/looks.js by scripts/build-cards.mjs — do not',
  '   edit by hand, the next build overwrites it. */',
  '',
  '/* ---- columns ---------------------------------------------------------',
  '   Per-breakpoint so a ladder is a set of classes rather than one class per',
  '   combination: cs-xs-2 cs-sm-3 cs-md-4 cs-lg-5. Slides-per-view stays a CSS',
  "   decision, which is the engine's rule — these only set the property. */",
];

for (const [name, bp] of TIERS) {
  const rules = Array.from({ length: MAX_COLS }, (_, i) => `.cs-${name}-${i + 1} { --cs-per-view: ${i + 1}; }`);
  out.push(bp ? `@media (min-width: ${bp}px) {\n${rules.map((r) => '  ' + r).join('\n')}\n}` : rules.join('\n'));
}

for (const [id, look] of Object.entries(LOOKS)) {
  const sel = `.cargo-${id}`;
  const decls = Object.entries(look.settings)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');
  out.push(
    '',
    `/* ---- ${look.label} ---- */`,
    // The same font-size the builder puts on the carousel root: everything in
    // the card is sized in em from it, so it has to be here too or a pasted
    // card inherits <html> and Bootstrap 3's 10px root shrinks it to 62.5%.
    `${sel} {\n${decls}\n  font-size: var(--cargo-font, 1em);\n}`,
    scope(look.css, sel),
  );
}

const css = out.join('\n') + '\n';

// A look that still carries a generator token would ship broken CSS. Checked
// before anything is written, so a bad build leaves the old file in place.
const stray = css.match(/%root%|%wrap%/g);
if (stray) {
  console.error(`build-cards: ${stray.length} unscoped generator token(s) left in the output`);
  process.exit(1);
}

// Minified like the engine file, and for the same reason: it is a build
// artefact a dealer site links, not something anyone reads. The /*! header
// survives minification, so the generated-not-hand-written warning ships too.
const min = (await transform(css, { loader: 'css', minify: true })).code;
mkdirSync('dist', { recursive: true });
writeFileSync('dist/custom-slider-cards.css', min);
console.log(`dist/custom-slider-cards.css: ${Object.keys(LOOKS).length} looks, ${TIERS.length * MAX_COLS} column classes, ${min.length} B min`);
