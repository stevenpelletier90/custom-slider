// Proves the card-look collapse lost nothing.
//
// The old library shipped 17 skins. They were merged into seven components (six
// absorb the old skins, one is new) because
// most differed only in values. The risk in a merge like that is silent loss —
// a look that nobody notices is gone until a brand needs it. This asserts every
// one of the 17 is accounted for by exactly one component, and that no
// component claims a skin that never existed.
//
// Run from `npm run validate`.

import { readFileSync } from 'node:fs';

// looks.js is a classic script (see the note at its foot), so it cannot be
// imported. Evaluate it and read the global it sets.
const src = readFileSync('demo/assets/looks.js', 'utf8');
const sandbox = {};
new Function('globalThis', src).call(sandbox, sandbox);
new Function('globalThis', readFileSync('demo/assets/brands.js', 'utf8')).call(sandbox, sandbox);
const { LOOKS, OLD_SKINS, BRANDS, perViewFor } = sandbox.DLX;

const claimed = new Map();
let bad = 0;

for (const [id, look] of Object.entries(LOOKS)) {
  if (!Array.isArray(look.absorbs)) {
    console.error(`  ${id}: has no "absorbs" list — every component must say which skins it replaces`);
    bad++;
    continue;
  }
  // A component that replaces nothing must say so deliberately, so "absorbs
  // nothing" can never be how a merge quietly loses a look.
  if (look.absorbs.length === 0 && !look.isNew) {
    console.error(`  ${id}: absorbs nothing and is not marked isNew — did a skin get dropped?`);
    bad++;
    continue;
  }
  for (const skin of look.absorbs) {
    if (claimed.has(skin)) {
      console.error(`  ${skin}: claimed by both "${claimed.get(skin)}" and "${id}" — a skin maps to exactly one component`);
      bad++;
    }
    claimed.set(skin, id);
  }
}

const missing = OLD_SKINS.filter((s) => !claimed.has(s));
const invented = [...claimed.keys()].filter((s) => !OLD_SKINS.includes(s));

if (missing.length) {
  console.error(`  dropped on the floor: ${missing.join(', ')}`);
  bad += missing.length;
}
if (invented.length) {
  console.error(`  absorbed a skin that never existed: ${invented.join(', ')}`);
  bad += invented.length;
}

// Each component must actually be renderable.
for (const [id, look] of Object.entries(LOOKS)) {
  for (const field of ['label', 'css', 'markup', 'settings', 'minCard', 'perView', 'icon']) {
    if (!look[field]) {
      console.error(`  ${id}: missing ${field}`);
      bad++;
    }
  }
  if (typeof look.markup === 'function') {
    const out = look.markup({ href: '#', img: 'x.png', alt: 'a', name: 'N', sub: 's', blurb: 'b', mark: 'm' });
    if (!out.includes('dlx-card')) {
      console.error(`  ${id}: markup() does not produce a .dlx-card root`);
      bad++;
    }
    // Not every content set carries a sub or a blurb. A look that renders the
    // element anyway leaves a blank row, and any `margin-block-start: auto`
    // below it then pushes to the bottom of a card that reads as broken.
    const bare = look.markup({ href: '#', img: 'x.png', alt: 'a', name: 'N' });
    const empty = bare.match(/<(\w+)[^>]*>\s*<\/\1>/);
    if (empty) {
      console.error(`  ${id}: markup() emits an empty ${empty[1]} when optional content is missing — omit the element instead`);
      bad++;
    }
  }
}

// The engine reserves the dot row as padding-bottom on the carousel root, and
// a look's CSS lands on that same element. A `padding:` or `padding-block:`
// shorthand there silently wipes the reservation, and the dots then draw on top
// of the last row of card text — which is exactly what happened to the two-row
// grid. Bottom padding on the root is therefore never allowed; use
// padding-block-start and padding-inline.
for (const [id, look] of Object.entries(LOOKS)) {
  for (const rule of look.css.match(/\.dlx\s*\{[^}]*\}/g) ?? []) {
    const hit = rule.match(/(?:^|[;{]\s*)(padding|padding-block|padding-bottom|padding-block-end)\s*:/);
    if (hit) {
      console.error(`  ${id}: "${hit[1]}" on the carousel root wipes the reserved dot space — use padding-block-start / padding-inline`);
      bad++;
    }
  }
}

// The brand presets. The roster is the census's 32-brand table; a preset that
// names a look which no longer exists would fail silently in the picker, and a
// ladder that lands a card under its look's minCard would ship a preset that
// trips the workbench's own cramped warning the moment you select it.
const ROSTER = 32;
const brands = Object.entries(BRANDS ?? {});
if (brands.length !== ROSTER) {
  console.error(`  brands: ${brands.length} presets, expected ${ROSTER} (the census roster)`);
  bad++;
}
for (const [id, b] of brands) {
  if (!b.label) {
    console.error(`  ${id}: no label`);
    bad++;
  }
  if (!LOOKS[b.look]) {
    console.error(`  ${id}: look "${b.look}" does not exist`);
    bad++;
    continue;
  }
  if (b.ladder === null) continue;
  if (!Array.isArray(b.ladder) || !b.ladder.length || b.ladder[0][0] !== 0) {
    console.error(`  ${id}: ladder must start at 0 or be null when nothing is recorded`);
    bad++;
    continue;
  }
  // Both gaps in use across the patterns: the model bar's 8px and the two-row
  // grid's 16px. A preset has to hold at whichever it is dropped into.
  for (const gap of [8, 16]) {
    const pv = perViewFor(b.ladder, LOOKS[b.look].minCard, gap, b.look);
    for (const [tier, n] of Object.entries(pv)) {
      const box = sandbox.DLX.TIER_BOX[tier] - (sandbox.DLX.CHROME[b.look] ?? 0);
      const card = (box - (n - 1) * gap) / n;
      if (n > 1 && card < LOOKS[b.look].minCard + sandbox.DLX.MARGIN) {
        console.error(`  ${id}: ${n} across at ${tier} with a ${gap}px gap is a ${Math.round(card)}px card, under ${b.look}'s ${LOOKS[b.look].minCard}px`);
        bad++;
      }
    }
  }
}

if (bad) {
  console.error(`\ncheck-looks: ${bad} problem(s).`);
  process.exit(1);
}

console.log(`check-looks: ${OLD_SKINS.length} old skins -> ${Object.keys(LOOKS).length} components, ${brands.length} brand presets, all accounted for.`);
for (const [id, look] of Object.entries(LOOKS)) {
  console.log(`  ${id.padEnd(10)} ${String(look.absorbs.length).padStart(2)}  ${look.absorbs.join(', ')}`);
}
