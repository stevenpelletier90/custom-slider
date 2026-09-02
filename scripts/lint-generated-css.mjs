// Lints the CSS that actually ships to a dealer.
//
// `npm run lint:css` only sees .css FILES. But every card and pattern rule in
// this project lives in a JS template literal in demo/assets/*.js — about 15 KB
// of CSS, and it is precisely the CSS the copy panel hands to a designer to
// paste onto a live site. None of it was linted. All three CSS defects found in
// the 2026-09-01 design review (a <span> styled as a block with no
// `display: block`, an unclipped hover transform, and rem on a Bootstrap 3 host)
// were in that unlinted 15 KB.
//
// Rather than parse the template literals out — which would lint a fragment
// full of %root% tokens that is not valid CSS — this runs the real generator.
// cssFor() is the single producer of shipped CSS (see CLAUDE.md, "Code parity
// is structural"), so linting its output cannot drift from what is copied.
//
// Run from `npm run validate`.

import { readFileSync } from 'node:fs';
import stylelint from 'stylelint';

// The demo assets are classic scripts hanging off globalThis (ES modules are
// blocked over file://, and the demo has to open by double-click). Evaluate
// them the way check-looks.mjs does, into one shared sandbox.
const sandbox = {};
// workbench.js reaches for a few elements at load time and bails out when the
// stage is absent — which is the path patterns.html uses too. Give it just
// enough DOM to reach that guard; anything it would touch afterwards is behind
// the `if (!stage) return`.
const noop = () => {};
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

for (const f of ['looks.js', 'brands.js', 'cms-paths.js', 'workbench.js']) {
  new Function('globalThis', 'document', 'window', readFileSync(`demo/assets/${f}`, 'utf8')).call(sandbox, sandbox, sandbox.document, sandbox);
}
const { PATTERNS, LOOKS, renderPattern, renderLook, ENGINE_DEFAULTS } = sandbox.CARGO;

// cssFor() drops any value equal to an engine default, so that map has to BE
// the engine. Read the real `.cs { … }` block out of src/custom-slider.css and
// compare: a hand-kept copy would drift, and the only symptom would be a line
// that quietly stopped being dropped from every snippet.
// Comments out first: the block's own notes mention `--x:` declarations.
const engineBlock = (readFileSync('src/custom-slider.css', 'utf8').match(/\.cs\s*\{([\s\S]*?)\n\}/)?.[1] ?? '').replace(/\/\*[\s\S]*?\*\//g, '');
const engineReal = Object.fromEntries([...engineBlock.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]));
let drift = 0;
for (const [k, v] of Object.entries(engineReal)) {
  if (!(k in ENGINE_DEFAULTS)) (console.error(`  ENGINE_DEFAULTS is missing ${k} (src/custom-slider.css says "${v}")`), drift++);
  else if (ENGINE_DEFAULTS[k] !== v) (console.error(`  ENGINE_DEFAULTS[${k}] = "${ENGINE_DEFAULTS[k]}" but src/custom-slider.css says "${v}"`), drift++);
}
for (const k of Object.keys(ENGINE_DEFAULTS)) {
  if (!(k in engineReal)) (console.error(`  ENGINE_DEFAULTS has ${k}, which .cs in src/custom-slider.css does not set`), drift++);
}
if (drift) {
  console.error(`\nlint-generated-css: ENGINE_DEFAULTS in demo/assets/workbench.js has drifted from src/custom-slider.css (${drift}).`);
  process.exit(1);
}

// One sheet per pattern and per card look, named so a failure says which.
const sheets = [...Object.keys(PATTERNS).map((id) => [`pattern “${id}”`, renderPattern(id, 'demo').css]), ...Object.keys(LOOKS).map((id) => [`look “${id}”`, renderLook(id, 'demo').css])];
// The markup too, for the encoding scan below.
const markup = [...Object.keys(PATTERNS).map((id) => [`pattern “${id}”`, renderPattern(id, 'demo').html]), ...Object.keys(LOOKS).map((id) => [`look “${id}”`, renderLook(id, 'demo').html])];

// CMS block storage is Windows-1252. A character outside that code page comes
// back mangled on the storefront - the service cards shipped a literal → six
// times, which is U+2192 and not in 1252. Entity-encode instead: `&#8594;` is
// plain ASCII and survives the round trip, the same reason the review stars
// ship as &starf;/&star; and the play triangle as &#9654;.
//
// Curly quotes, en/em dashes and the ellipsis ARE in 1252 and are fine, which
// is why this checks the code page rather than banning non-ASCII.
const CP1252_EXTRA = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152, 0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a,
  0x0153, 0x017e, 0x0178,
]);
const inCp1252 = (cp) => cp <= 0x7e || (cp >= 0xa0 && cp <= 0xff) || CP1252_EXTRA.has(cp);
const encodingProblems = [];
for (const [name, html] of markup) {
  const seen = new Set();
  for (const ch of html) {
    const cp = ch.codePointAt(0);
    if (inCp1252(cp) || seen.has(cp)) continue;
    seen.add(cp);
    encodingProblems.push(`  ${name} [not-windows-1252] "${ch}" (U+${cp.toString(16).toUpperCase().padStart(4, '0')}) - CMS block storage cannot hold it; write &#${cp};`);
  }
}

// A zero length in a custom property is a platform bug stylelint cannot see.
// The styleCode minifier strips the unit off any zero, and a unitless 0 makes
// every calc() reading that variable invalid - the slide basis falls back to
// auto and the cards collapse to content width, measured identical in Chromium
// and WebKit. Write 0.1px instead (bfe446c). A bare `0` is deliberately NOT
// matched: --name-order: 0 is an integer for `order`, where 0 is correct.
const ZERO_LENGTH = /(--[\w-]+)\s*:\s*(0(?:px|em|rem|ex|ch|%|vw|vh|vmin|vmax|cm|mm|in|pt|pc|q))\b/gi;

let problems = encodingProblems.length;
for (const line of encodingProblems) console.error(line);

// Reported once per sheet and declaration, however many routes find it: the
// same 0px shows up in a pattern's props map and again in the sheet built from
// it, and two lines for one edit reads as two bugs.
const seen = new Set();
const zeroLength = (name, prop, val) => {
  if (seen.has(`${name}|${prop}|${val}`)) return;
  seen.add(`${name}|${prop}|${val}`);
  problems++;
  console.error(`  ${name} [zero-length-custom-property] "${prop}: ${val}" - the styleCode minifier strips the unit and the calc() dies; use 0.1px`);
};

// The sheets above are the shared-stylesheet form. A look's own settings only
// reach the snippet under "Paste the card styles too", which nothing here
// renders, so read those maps directly - exhaustive by construction rather
// than by whichever variant happened to be generated.
for (const [what, map] of [
  ['pattern', Object.entries(PATTERNS).map(([id, p]) => [id, p.props])],
  ['look', Object.entries(LOOKS).map(([id, l]) => [id, l.settings])],
]) {
  for (const [id, props] of map) {
    for (const [prop, val] of Object.entries(props || {})) {
      // `match` with a /g regex, not `test`: it returns every hit and leaves
      // lastIndex alone, so the shared regex cannot carry state into the loop.
      if (`${prop}: ${val}`.match(ZERO_LENGTH)) zeroLength(`${what} “${id}”`, prop, val);
    }
  }
}

for (const [name, css] of sheets) {
  for (const [, prop, val] of css.matchAll(ZERO_LENGTH)) zeroLength(name, prop, val);
  // Style Only takes no comments either. cssFor strips them, so a hit here
  // means a new route into the sheet that bypasses the scoping pass.
  for (const c of css.match(/\/\*[\s\S]*?\*\//g) || []) {
    problems++;
    console.error(`  ${name} [comment-in-generated-css] ${JSON.stringify(c.slice(0, 60))} - Style Only takes raw CSS with no comments`);
  }
  const res = await stylelint.lint({ code: css, config: JSON.parse(readFileSync('.stylelintrc.generated.json', 'utf8')) });
  for (const r of res.results) {
    for (const w of r.warnings) {
      problems++;
      // The generated line, so the offending rule is greppable in the source
      // even though the line number belongs to the assembled sheet.
      const line = css.split('\n')[w.line - 1] ?? '';
      console.error(`  ${name} ${w.line}:${w.column} [${w.rule}] ${w.text}`);
      console.error(`    ${line.trim().slice(0, 140)}`);
    }
  }
}

if (problems) {
  console.error(`\nlint-generated-css: ${problems} problem(s) in the CSS the copy panel ships.`);
  process.exit(1);
}
console.log(`lint-generated-css: ${sheets.length} generated sheets clean (${Object.keys(PATTERNS).length} patterns, ${Object.keys(LOOKS).length} looks).`);
