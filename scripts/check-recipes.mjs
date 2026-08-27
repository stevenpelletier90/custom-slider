// Guards the promise the demo page makes: the CSS in a copy-paste recipe
// reproduces the example rendered above it.
//
// The failure this exists to stop is specific and was reported from the field:
// every recipe on the page omitted `--dlc-arrow-bg` / `--dlc-arrow-fg`, so
// pasting one gave you the engine's stock dark discs sitting on top of the
// cards instead of the bare gutter arrows the demo shows. The recipes are
// hand-written beside the live examples, so nothing forced them to keep up.
//
// What it deliberately does NOT check: the HTML. Recipe markup is adapted for
// the CMS on purpose -- #MISCPATH# image tokens, `aria-label` instead of
// `aria-labelledby` (the heading does not travel with the snippet), one <li>
// plus a "repeat this" comment instead of six. Those differences are the point
// and must survive.
//
// Usage:  node scripts/check-recipes.mjs         report drift, exit 1 if any
//         node scripts/check-recipes.mjs --fix   append the missing declarations
//
// Wired into `npm run validate`.

import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'demo/index.html';
const FIX = process.argv.includes('--fix');

// Page furniture: styles the catalog itself, never a component, so it must
// never leak into a snippet.
const CHROME = new Set(['demo-section', 'demo-wide', 'demo-sub', 'demo-copy', 'demo-start', 'demo-toc', 'demo-nav', 'demo-head', 'demo-foot', 'demo-note', 'demo-lead', 'demo-card-note']);

// Declarations that carry a look but are not custom properties, so the knob
// diff alone would miss them. `padding-inline` is what reserves the arrow
// gutter -- without it transparent arrows sit on the cards anyway.
const CARRY = ['padding-inline'];

const src = readFileSync(FILE, 'utf8');
const style = src.match(/<style>([\s\S]*?)<\/style>/)[1];

const stripComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '');

/** Split a stylesheet into top-level rules, keeping each rule's full text. */
function topRules(css, media = '') {
  const out = [];
  let i = 0,
    start = 0;
  while (i < css.length) {
    if (css[i] === '{') {
      let depth = 1,
        j = i + 1;
      while (depth > 0 && j < css.length) {
        if (css[j] === '{') depth++;
        else if (css[j] === '}') depth--;
        j++;
      }
      const sel = stripComments(css.slice(start, i)).trim();
      const raw = css.slice(i + 1, j - 1);
      if (sel.startsWith('@')) {
        // Recurse into at-rules. Without this every rule inside a @media block
        // is invisible: the at-rule's "selector" names no class, so the
        // attribution filter below rejects the whole block and every knob in
        // it. That hid `--dlc-arrow-size: 56px` on the models example, which a
        // render-and-compare caught only after the checker reported all-clear.
        out.push(...topRules(raw, sel));
      } else {
        // Comments must go before declarations are parsed: a comment
        // containing something like "1.32:1," parses as a declaration whose
        // value runs greedily to the next semicolon, swallowing the real
        // declaration that follows it. That silently dropped --dlc-dot-fg.
        out.push({ sel, media, text: css.slice(start, j), body: raw.replace(/\/\*[\s\S]*?\*\//g, '') });
      }
      i = start = j;
      continue;
    }
    i++;
  }
  return out;
}

const RULES = topRules(style);
const unescapeHtml = (s) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const sections = [...src.matchAll(/<section class="[^"]*" id="([\w-]+)">([\s\S]*?)<\/section>/g)].map(([, id, body]) => ({ id, body }));
for (const s of sections) {
  s.root = s.body.match(/<div class="dl-carousel ([\w-]+)"/)?.[1];
  s.recipeRoot = s.body.match(/class="(my-[\w-]+) dl-carousel"/)?.[1] ?? s.body.match(/class="dl-carousel (my-[\w-]+)"/)?.[1];
}
const ALL_ROOTS = new Set(sections.map((s) => s.root).filter(Boolean));

const knobsIn = (text) => new Set([...text.matchAll(/(--dlc-[\w-]+)\s*:/g)].map((m) => m[1]));

const findings = [];

for (const sec of sections) {
  if (!sec.root || !sec.recipeRoot) continue;

  const authored = sec.body.includes('<details') ? sec.body.slice(0, sec.body.indexOf('<details')) : sec.body;
  const used = new Set([...authored.matchAll(/demo-[\w-]+/g)].map((m) => m[0]).filter((c) => !CHROME.has(c)));

  // A rule belongs to this section when it names the section's own root class,
  // or names a class the section uses without naming any OTHER section's root.
  // Generous on purpose: over-inclusion ships harmless extra CSS, while
  // under-inclusion silently recreates the bug this script exists to catch.
  const mine = RULES.filter(({ sel }) => {
    const names = new Set([...sel.matchAll(/\.(demo-[\w-]+)/g)].map((m) => m[1]));
    if (names.size === 0) return false;
    if (names.has(sec.root)) return true;
    return ![...names].some((n) => ALL_ROOTS.has(n) && n !== sec.root) && [...names].some((n) => used.has(n));
  });

  const live = new Set();
  for (const r of mine) for (const k of knobsIn(r.text)) live.add(k);

  const cssBlocks = [...sec.body.matchAll(/<p class="code-label">CSS<\/p>\s*<pre><code>([\s\S]*?)<\/code><\/pre>/g)];
  if (cssBlocks.length === 0) continue;
  const recipe = knobsIn(unescapeHtml(cssBlocks.map((m) => m[1]).join('\n')));

  const missing = [...live].filter((k) => !recipe.has(k)).sort();

  // Sub-part rules carry a look without declaring a single custom property, so
  // the knob diff above is blind to them. The models example is the proof: its
  // dots row is restyled into a sliding progress bar entirely through
  // `.dl-carousel-dots::before` and friends. The knob check passed while a
  // paste still rendered plain dots.
  const partsOf = (css) => new Set([...css.matchAll(/\.(dl-carousel-[\w-]+(?:::?[\w-]+(?:\([^)]*\))?)*)/g)].map((m) => m[1]));
  const recipeCssText = unescapeHtml(cssBlocks.map((m) => m[1]).join('\n'));
  const recipeParts = partsOf(recipeCssText);
  const livePartRules = mine.filter((r) => /\.dl-carousel-/.test(r.sel) && r.sel.includes('.' + sec.root));
  const missingParts = [];
  for (const r of livePartRules) {
    // Only the fragment of a shared selector that belongs to THIS example.
    for (const one of r.sel.split(',').map((x) => x.trim())) {
      if (!one.includes('.' + sec.root)) continue;
      for (const p of partsOf(one)) if (!recipeParts.has(p)) missingParts.push({ part: p, rule: r, frag: one, key: (r.media || '') + '|' + one });
    }
  }
  // Key on media + selector, not the bare part name. The same part legitimately
  // appears in several contexts -- `.dl-carousel-dots::before` is both the thumb
  // itself and a reduced-motion transition override -- and deduping by name
  // silently dropped the base rule, leaving a recipe that styled the transition
  // of an element it never drew.
  const uniqParts = [...new Map(missingParts.map((m) => [m.key, m])).values()];

  if (missing.length || uniqParts.length) findings.push({ sec, missing, mine, parts: uniqParts });
}

// ---- second check: an example driven by page script must SHIP that script ----
//
// The models example rebuilds the engine's dots into a sliding progress bar,
// and that needs a page script. The recipe never offered it, so a reader could
// not reproduce what they were looking at no matter how carefully they pasted.
//
// Matching is on exact class TOKENS, never substrings: `.demo-cardgal-media`
// contains the text "demo-card", and a substring test wrongly implicated three
// unrelated sections.
const pageScripts = (() => {
  const tail = src.slice(src.lastIndexOf('</dialog>'));
  const inline = [...tail.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');
  let shared = '';
  try {
    shared = readFileSync('demo/assets/demo.js', 'utf8');
  } catch {
    /* optional */
  }
  return inline + '\n' + shared;
})();
const SCRIPT_CLASSES = new Set([...pageScripts.matchAll(/\.(demo-[\w-]+)/g)].map((m) => m[1]));

const jsGaps = [];
for (const sec of sections) {
  if (!sec.root) continue;
  const cut = sec.body.indexOf('<details');
  if (cut === -1) continue;
  const authored = sec.body.slice(0, cut);
  const details = sec.body.slice(cut);
  const driven = [...new Set([...authored.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/)))].filter((c) => SCRIPT_CLASSES.has(c));
  if (driven.length && !details.includes('&lt;script&gt;')) jsGaps.push({ id: sec.id, driven });
}

if (findings.length === 0 && jsGaps.length === 0) {
  console.log('check-recipes: every recipe declares the knobs its live example sets,');
  console.log('               and every script-driven example ships its script.');
  process.exit(0);
}

if (jsGaps.length) {
  console.error('check-recipes: these examples need page script the recipe never provides.\n');
  for (const g of jsGaps) console.error(`  ${g.id.padEnd(16)} driven by script targeting: ${g.driven.join(', ')}`);
  console.error('\n  A reader cannot reproduce what they are looking at. Add the script to the');
  console.error('  recipe as an escaped <script> block (see the card-gallery HTML recipe).');
  if (findings.length === 0) process.exit(1);
  console.error('');
}

if (!FIX) {
  console.error('check-recipes: recipes do not reproduce the example above them.\n');
  for (const f of findings) {
    const bits = [];
    if (f.missing.length) bits.push('knobs: ' + f.missing.map((k) => k.replace('--dlc-', '')).join(', '));
    if (f.parts.length) bits.push('parts: ' + f.parts.map((p) => p.part.replace('dl-carousel-', '')).join(', '));
    console.error(`  ${f.sec.id.padEnd(16)} ${bits.join('  |  ')}`);
  }
  const k = findings.reduce((n, f) => n + f.missing.length, 0);
  const p = findings.reduce((n, f) => n + f.parts.length, 0);
  console.error(`\n  ${k} missing knob declarations and ${p} missing control-part rules across ${findings.length} recipes.`);
  console.error('  A paste will not look like the demo. Run: node scripts/check-recipes.mjs --fix');
  process.exit(1);
}

// --fix: transplant the missing DECLARATIONS, not whole rules. Copying rules
// wholesale duplicated values the recipe already had and dragged the live
// stylesheet's own comments along with them.
let out = src;
let fixed = 0;

for (const { sec, missing, mine, parts: partGaps } of findings) {
  const need = new Set(missing);
  // Keyed by media condition ('' = unconditional). A knob set only inside
  // `@media (min-width: 992px)` must not be emitted unconditionally, or the
  // recipe would apply a desktop value on phones.
  const byMedia = new Map();
  const decl = (media) => {
    if (!byMedia.has(media)) byMedia.set(media, new Map());
    return byMedia.get(media);
  };
  const parts = []; // descendant rules the look also needs

  for (const r of mine) {
    const selNames = [...r.sel.matchAll(/\.(demo-[\w-]+)/g)].map((m) => m[1]);
    const touchesRoot = selNames.includes(sec.root);
    const isDescendant = /\.dl-carousel-/.test(r.sel);

    for (const [, prop, value] of r.body.matchAll(/([\w-]+)\s*:\s*([^;]+);/g)) {
      const p = prop.trim();
      if (need.has(p) && !isDescendant) decl(r.media || '').set(p, value.trim());
      else if (CARRY.includes(p) && touchesRoot && !isDescendant && [...knobsIn(r.text)].some((k) => need.has(k))) decl(r.media || '').set(p, value.trim());
    }
  }
  const rootDecls = byMedia.get('') ?? new Map();

  // Control-part rules: everything targeting a .dl-carousel-* piece of this
  // example. These carry no custom property, so the knob pass never sees them,
  // yet they are often the whole look — the models progress bar is nothing but
  // these. A shared selector is split so only this example's fragment travels.
  for (const { rule, frag } of partGaps ?? []) {
    const decl = [...rule.body.matchAll(/([\w-]+)\s*:\s*([^;]+);/g)].map(([, p, v]) => `${p.trim()}: ${v.trim()};`).join(' ');
    if (!decl) continue;
    const sel = frag.replace(new RegExp('\\.' + sec.root + '\\b', 'g'), '.' + sec.recipeRoot).replace(/\s+/g, ' ');
    const line = `${sel} { ${decl} }`;
    parts.push(rule.media ? `${rule.media} { ${line} }` : line);
  }

  // Breakpoint-scoped knobs, re-wrapped in the media query they came from.
  const mediaRules = [...byMedia].filter(([m]) => m).map(([m, d]) => `${m} {\n  .${sec.recipeRoot} {\n${[...d].map(([p, v]) => `    ${p}: ${v};`).join('\n')}\n  }\n}`);

  if (rootDecls.size === 0 && parts.length === 0 && mediaRules.length === 0) continue;

  // Custom properties first, then ordinary ones — the order the library's own
  // stylesheet uses, and what a reader expects to skim.
  const ordered = [...rootDecls].sort((a, b) => Number(b[0].startsWith('--')) - Number(a[0].startsWith('--')));
  const lines = ordered.map(([p, v]) => `  ${p}: ${v};`).join('\n');
  const rootRule = ordered.length ? [`.${sec.recipeRoot} {`, lines, '}'] : [];
  const block = [
    '',
    '',
    '/* Control styling the example above uses. Without it you get the stock',
    '   look: dark discs on the cards, and plain dots instead of the bar. */',
    ...rootRule,
    ...new Set(parts),
    ...mediaRules,
  ].join('\n');

  const all = [...sec.body.matchAll(/(<p class="code-label">CSS<\/p>\s*<pre><code>)([\s\S]*?)(<\/code><\/pre>)/g)];
  const last = all[all.length - 1];
  const newBody = sec.body.replace(last[0], last[1] + last[2] + escapeHtml(block) + last[3]);
  out = out.replace(sec.body, newBody);
  fixed++;
}

writeFileSync(FILE, out);
console.log(`check-recipes --fix: added the missing declarations to ${fixed} recipes.`);
