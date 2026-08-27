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

/** Split a stylesheet into top-level rules, keeping each rule's full text. */
function topRules(css) {
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
      // Comments must go before declarations are parsed: a comment
      // containing something like "1.32:1," parses as a declaration whose
      // value runs greedily to the next semicolon, swallowing the real
      // declaration that follows it. That silently dropped --dlc-dot-fg.
      const raw = css.slice(i + 1, j - 1);
      out.push({ sel: css.slice(start, i).trim(), text: css.slice(start, j), body: raw.replace(/\/\*[\s\S]*?\*\//g, '') });
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
  if (missing.length) findings.push({ sec, missing, mine });
}

if (findings.length === 0) {
  console.log('check-recipes: every recipe declares the knobs its live example sets.');
  process.exit(0);
}

if (!FIX) {
  console.error('check-recipes: recipes are missing knobs their live example sets.\n');
  for (const f of findings) console.error(`  ${f.sec.id.padEnd(16)} ${f.missing.map((k) => k.replace('--dlc-', '')).join(', ')}`);
  console.error(`\n  ${findings.reduce((n, f) => n + f.missing.length, 0)} missing declarations across ${findings.length} recipes.`);
  console.error('  A paste will not look like the demo. Run: node scripts/check-recipes.mjs --fix');
  process.exit(1);
}

// --fix: transplant the missing DECLARATIONS, not whole rules. Copying rules
// wholesale duplicated values the recipe already had and dragged the live
// stylesheet's own comments along with them.
let out = src;
let fixed = 0;

for (const { sec, missing, mine } of findings) {
  const need = new Set(missing);
  const rootDecls = new Map(); // knob/prop -> value, last write wins as in CSS
  const parts = []; // descendant rules the look also needs

  for (const r of mine) {
    const selNames = [...r.sel.matchAll(/\.(demo-[\w-]+)/g)].map((m) => m[1]);
    const touchesRoot = selNames.includes(sec.root);
    const isDescendant = /\.dl-carousel-/.test(r.sel);

    for (const [, prop, value] of r.body.matchAll(/([\w-]+)\s*:\s*([^;]+);/g)) {
      const p = prop.trim();
      if (need.has(p) && !isDescendant) rootDecls.set(p, value.trim());
      else if (CARRY.includes(p) && touchesRoot && !isDescendant && [...knobsIn(r.text)].some((k) => need.has(k))) rootDecls.set(p, value.trim());
    }

    // Arrow repositioning carries no custom property but is half the look.
    if (isDescendant && touchesRoot && /arrow--(prev|next)/.test(r.sel)) {
      const side = /arrow--prev/.test(r.sel) ? 'prev' : 'next';
      const decl = [...r.body.matchAll(/([\w-]+)\s*:\s*([^;]+);/g)].map(([, p, v]) => `${p.trim()}: ${v.trim()};`).join(' ');
      if (decl) parts.push(`.${sec.recipeRoot} .dl-carousel-arrow--${side} { ${decl} }`);
    }
  }

  if (rootDecls.size === 0 && parts.length === 0) continue;

  // Custom properties first, then ordinary ones — the order the library's own
  // stylesheet uses, and what a reader expects to skim.
  const ordered = [...rootDecls].sort((a, b) => Number(b[0].startsWith('--')) - Number(a[0].startsWith('--')));
  const lines = ordered.map(([p, v]) => `  ${p}: ${v};`).join('\n');
  const block = [
    '',
    '',
    '/* Control theming the example above uses. Without it the engine ships its',
    '   stock dark discs on top of the cards instead of arrows in a gutter. */',
    `.${sec.recipeRoot} {`,
    lines,
    '}',
    ...new Set(parts),
  ].join('\n');

  const all = [...sec.body.matchAll(/(<p class="code-label">CSS<\/p>\s*<pre><code>)([\s\S]*?)(<\/code><\/pre>)/g)];
  const last = all[all.length - 1];
  const newBody = sec.body.replace(last[0], last[1] + last[2] + escapeHtml(block) + last[3]);
  out = out.replace(sec.body, newBody);
  fixed++;
}

writeFileSync(FILE, out);
console.log(`check-recipes --fix: added the missing declarations to ${fixed} recipes.`);
