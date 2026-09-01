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

import { readFileSync, existsSync } from 'node:fs';

// looks.js is a classic script (see the note at its foot), so it cannot be
// imported. Evaluate it and read the global it sets.
const src = readFileSync('demo/assets/looks.js', 'utf8');
const sandbox = {};
new Function('globalThis', src).call(sandbox, sandbox);
new Function('globalThis', readFileSync('demo/assets/brands.js', 'utf8')).call(sandbox, sandbox);
const { LOOKS, OLD_SKINS, BRANDS, perViewFor } = sandbox.CARGO;

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
    if (!out.includes('cargo-card')) {
      console.error(`  ${id}: markup() does not produce a .cargo-card root`);
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
  for (const rule of look.css.match(/%root%\s*\{[^}]*\}/g) ?? []) {
    const hit = rule.match(/(?:^|[;{]\s*)(padding|padding-block|padding-bottom|padding-block-end)\s*:/);
    if (hit) {
      console.error(`  ${id}: "${hit[1]}" on the carousel root wipes the reserved dot space — use padding-block-start / padding-inline`);
      bad++;
    }
  }
}

// A look that paints its own strip background turns it into a visible box, so
// the cards cannot sit flush against its bottom edge - it reads as cut off. Two
// of the three looks that paint one (location and portrait) shipped with 23px
// above the cards and 0 below; only the logo panel had it right. The space goes
// on the TRACK, because the root's padding-bottom is the engine's reserved dot
// row and the rule above forbids touching it.
for (const [id, look] of Object.entries(LOOKS)) {
  const bg = look.settings?.['--strip-bg'] ?? '';
  if (!/^#|rgb/.test(bg)) continue; // transparent strip: no box, nothing to balance
  if (!/%root% \.cs-track \{[^}]*padding-block-end/.test(look.css)) {
    console.error(`  ${id}: paints --strip-bg ${bg} but reserves no space under the cards — add "%root% .cs-track { padding-block-end: … }"`);
    bad++;
  }
}

// Every card property a look exposes must be explained on the reference page.
// A designer testing this got as far as "what is strip-pad-x for?" - the answer
// existed nowhere, because the reference documents the ENGINE's --cs-* knobs and
// the card's own were only ever row labels in the builder. Renaming the label
// was not enough; the table is, and this keeps it complete.
const guideSrc = readFileSync('demo/assets/guide.js', 'utf8');
for (const [id, look] of Object.entries(LOOKS)) {
  for (const prop of Object.keys(look.settings ?? {})) {
    if (prop.startsWith('--cs-')) continue; // engine property, documented from the shipped CSS
    if (!guideSrc.includes(`'${prop}':`)) {
      console.error(`  ${id}: ${prop} has no entry in CARD_NOTES (demo/assets/guide.js) — a card setting nobody can look up`);
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
      const box = sandbox.CARGO.TIER_BOX[tier] - (sandbox.CARGO.CHROME[b.look] ?? 0);
      const card = (box - (n - 1) * gap) / n;
      if (n > 1 && card < LOOKS[b.look].minCard + sandbox.CARGO.MARGIN) {
        console.error(`  ${id}: ${n} across at ${tier} with a ${gap}px gap is a ${Math.round(card)}px card, under ${b.look}'s ${LOOKS[b.look].minCard}px`);
        bad++;
      }
    }
  }
}

// A roster records each cutout's REAL intrinsic size, because that pair becomes
// the width/height attributes on a live page and a wrong one is a layout shift.
// Nothing checked it until refreshing six Hyundai cutouts from the platform
// silently changed them from 420x260 to 340x213 - the declared values stayed,
// and every Hyundai card would have jumped on load. OEMs re-cut this art on
// their own schedule, so the check belongs here rather than in the memory of
// whoever runs the harvest next.
function pixelSize(buf) {
  if (buf.readUInt32BE(0) === 0x89504e47) return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const fmt = buf.toString('ascii', 12, 16);
    if (fmt === 'VP8X') return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)];
    if (fmt === 'VP8 ') return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
    if (fmt === 'VP8L') {
      const bits = buf.readUInt32LE(21);
      return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
    }
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let o = 2;
    while (o < buf.length - 8) {
      if (buf[o] !== 0xff) {
        o++;
        continue;
      }
      const marker = buf[o + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return [buf.readUInt16BE(o + 7), buf.readUInt16BE(o + 5)];
      o += 2 + buf.readUInt16BE(o + 2);
    }
  }
  return null;
}

// Checked against the RENDERED attributes, not the roster values, because those
// are two different things and only one of them ships. The portrait look
// hardcoded width="320" height="533" and ignored the roster entirely, so Alfa
// Romeo's 300x500 art went out declaring a size it never had - a roster-only
// check would have called that clean.
for (const [id, b] of brands) {
  const look = LOOKS[b.look];
  for (const m of b.models ?? []) {
    const dim = pixelSize(readFileSync(`demo/${m.img}`));
    if (!dim) {
      console.error(`  ${id}: cannot read the pixel size of ${m.img}`);
      bad++;
      continue;
    }
    const tag = (look?.markup?.(m) ?? '').match(/<img[^>]*>/)?.[0];
    if (!tag) continue;
    const w = +(tag.match(/\bwidth="(\d+)"/)?.[1] ?? 0);
    const h = +(tag.match(/\bheight="(\d+)"/)?.[1] ?? 0);
    if (w !== dim[0] || h !== dim[1]) {
      console.error(`  ${id}: ${m.img} is ${dim[0]}x${dim[1]} but the ${b.look} look renders width="${w}" height="${h}" — that pair ships as-is, so it is a layout shift`);
      bad++;
    }
  }
}

// The CMS path map is what the copy panel emits, so a stale entry ships a
// broken image to every designer who pastes the snippet. Two ways it goes
// stale, both caught here: a key naming an image that no longer exists (the
// swap silently stops happening), and a per-dealer /static/dealer-<id>/ path
// creeping in (it would resolve on the one site it was harvested from and 404
// on every other, which is the exact failure this map exists to remove).
new Function('globalThis', readFileSync('demo/assets/cms-paths.js', 'utf8')).call(sandbox, sandbox);
const CMS = sandbox.CARGO.CMS ?? {};
if (!Object.keys(CMS).length) {
  console.error('  cms-paths: empty — re-run scripts/harvest-cms-paths.mjs');
  bad++;
}
for (const [rel, path] of Object.entries(CMS)) {
  if (!existsSync(`demo/img/${rel}`)) {
    console.error(`  cms-paths: "${rel}" is mapped but not in demo/img — re-run the harvest`);
    bad++;
  }
  if (!/^\/(?:assets\/stock|static\/(?!dealer-)[a-z0-9_-]+)\//.test(path)) {
    console.error(`  cms-paths: "${rel}" -> "${path}" is not a shared platform collection`);
    bad++;
  }
}

if (bad) {
  console.error(`\ncheck-looks: ${bad} problem(s).`);
  process.exit(1);
}

console.log(
  `check-looks: ${OLD_SKINS.length} old skins -> ${Object.keys(LOOKS).length} components, ${brands.length} brand presets, ${Object.keys(CMS).length} platform image paths, all accounted for.`,
);
for (const [id, look] of Object.entries(LOOKS)) {
  console.log(`  ${id.padEnd(10)} ${String(look.absorbs.length).padStart(2)}  ${look.absorbs.join(', ')}`);
}
