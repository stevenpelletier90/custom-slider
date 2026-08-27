// Proves the card-look collapse lost nothing.
//
// The old library shipped 17 skins. They were merged into 6 components because
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
const { LOOKS, OLD_SKINS } = sandbox.DLX;

const claimed = new Map();
let bad = 0;

for (const [id, look] of Object.entries(LOOKS)) {
  if (!Array.isArray(look.absorbs) || look.absorbs.length === 0) {
    console.error(`  ${id}: has no "absorbs" list — every component must say which skins it replaces`);
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
  for (const field of ['label', 'css', 'markup', 'settings', 'minCard', 'perView']) {
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
  }
}

if (bad) {
  console.error(`\ncheck-looks: ${bad} problem(s).`);
  process.exit(1);
}

console.log(`check-looks: ${OLD_SKINS.length} old skins -> ${Object.keys(LOOKS).length} components, all accounted for.`);
for (const [id, look] of Object.entries(LOOKS)) {
  console.log(`  ${id.padEnd(10)} ${String(look.absorbs.length).padStart(2)}  ${look.absorbs.join(', ')}`);
}
