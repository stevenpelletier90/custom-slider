// Generates demo/model-bars.html — the live model-bar library. Every distinct
// breakpoint ladder found in the OEM demo census rendered as a working
// dl-carousel wearing its representative OEM's look, each with a complete
// copy-paste pair. Where one ladder ships two looks in the estate
// (Chevrolet/Cadillac, Genesis/VW) both strips are shown.
//
// Generated so the rendered CSS and the taught CSS are the same string — the
// live <style> is each strip's copy panel with only the class name swapped.
// A hand-edited page got rendered and taught out of sync once; this makes
// that impossible.
//
//   node scripts/build-model-bars.mjs
//
// Commit the output alongside this script. Source of truth for the ladder
// data: docs/research/2026-08-18-oem-demo-slider-census.md; the looks are
// docs/catalog/shots/*.jpg.
import fs from 'node:fs';

// Same roster and attributes as the demo page's model bar.
const CUTOUTS = [
  ['silverado-1500', 'Silverado 1500', '2026 Chevrolet Silverado 1500', 23],
  ['colorado', 'Colorado', '2025 Chevrolet Colorado', 8],
  ['tahoe', 'Tahoe', '2025 Chevrolet Tahoe', 14],
  ['suburban', 'Suburban', '2025 Chevrolet Suburban', 5],
  ['traverse', 'Traverse', '2025 Chevrolet Traverse', 11],
  ['equinox', 'Equinox', '2025 Chevrolet Equinox', 17],
  ['trailblazer', 'Trailblazer', '2025 Chevrolet Trailblazer', 9],
  ['trax', 'Trax', '2025 Chevrolet Trax', 32],
];
// The demo's used-vehicle photos, for the Toyota-style photo cards.
const PHOTO_CARDS = [
  ['vehicle-1', '2021 Porsche Panamera', 'Black Porsche Panamera driving on a highway, rear three-quarter view', 2],
  ['vehicle-2', '2023 BMW 430i Coupe', 'Blue BMW 4 Series coupe parked on a city street, side view', 4],
  ['vehicle-3', '2022 Ford Expedition Limited', 'White Ford Expedition on a desert road between red rock cliffs', 3],
  ['vehicle-4', '2023 Honda CR-V EX-L', 'White Honda CR-V parked near snowy mountains', 6],
  ['vehicle-5', '2020 Nissan GT-R Premium', 'White Nissan GT-R from behind on an open country road', 1],
  ['vehicle-6', '2019 Fiat 500 Lounge', 'Light blue Fiat 500 parked beside a stone building, side view', 2],
];
// The demo's tall model photos, for the Alfa Romeo-style tall tiles.
const TALL_TILES = [
  ['model-camaro', 'Camaro'],
  ['model-corvette', 'Corvette'],
  ['model-equinox', 'Equinox'],
  ['model-malibu', 'Malibu'],
  ['model-silverado', 'Silverado'],
  ['model-tahoe', 'Tahoe'],
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const cutoutImg = (slug, alt) =>
  `<img src="img/chrome-${slug}.png" srcset="img/chrome-${slug}.png 320w, img/chrome-${slug}-640.png 640w" sizes="(min-width: 1024px) 250px, (min-width: 640px) 30vw, 45vw" width="320" height="240" alt="${alt}" loading="lazy" decoding="async" />`;

// Each skin: how the estate actually dresses the bar (see the screenshot
// library). cardCss is the copy-paste CSS below the ladder lines; liveSlides
// and snippetHtml are the same markup — real sources vs. platform tokens.
const SKINS = {
  white: {
    cardCss: `.my-modelbar-card { display: block; color: inherit; text-align: center; text-decoration: none; }
.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; }
.my-modelbar-card p { margin: 0.25rem 0 0; font-weight: 600; }`,
    liveSlides: () => CUTOUTS.map(([slug, name, alt]) => `<a class="my-modelbar-card" href="index.html#modelbar" aria-label="Explore the ${name}">${cutoutImg(slug, alt)}<p>${name}</p></a>`),
    snippetHtml: `<a class="my-modelbar-card" href="/new-inventory/index.htm?model=Silverado" aria-label="Explore the Silverado 1500">
        <img src="#CHROMEPHOTOPATH|StyleID|1|640p#" width="320" height="240" alt="2026 Chevrolet Silverado 1500">
        <p>Silverado 1500</p>
      </a>`,
  },
  'band-gray': {
    cardCss: `.my-modelbar { padding-block: 1.5rem; background: linear-gradient(#e9e9e9, #f9f9f9); }
.my-modelbar-card { display: block; color: #222; text-align: center; text-decoration: none; }
.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; }
.my-modelbar-card p { margin: 0.25rem 0 0; font-size: 0.85rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }`,
    liveSlides: () => CUTOUTS.map(([slug, name, alt]) => `<a class="my-modelbar-card" href="index.html#modelbar" aria-label="Explore the ${name}">${cutoutImg(slug, alt)}<p>${name}</p></a>`),
    snippetHtml: `<a class="my-modelbar-card" href="/new-inventory/index.htm?model=NX" aria-label="Explore the NX">
        <img src="#CHROMEPHOTOPATH|StyleID|1|640p#" width="320" height="240" alt="2026 Lexus NX">
        <p>NX</p>
      </a>`,
  },
  'band-flat': {
    cardCss: `.my-modelbar { padding-block: 1.5rem; background: #f2f2f2; }
.my-modelbar-card { display: block; color: #444649; text-align: center; text-decoration: none; }
.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; }
.my-modelbar-card p { margin: 0.5rem 0 0; font-size: 0.85rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; }`,
    liveSlides: () => CUTOUTS.map(([slug, name, alt]) => `<a class="my-modelbar-card" href="index.html#modelbar" aria-label="Explore the ${name}">${cutoutImg(slug, alt)}<p>${name}</p></a>`),
    snippetHtml: `<a class="my-modelbar-card" href="/new-inventory/index.htm?model=Navigator" aria-label="Explore the Navigator">
        <img src="#CHROMEPHOTOPATH|StyleID|1|640p#" width="320" height="240" alt="2026 Lincoln Navigator">
        <p>Navigator</p>
      </a>`,
  },
  counts: {
    cardCss: `.my-modelbar-card { display: block; color: inherit; text-align: center; text-decoration: none; }
.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; }
.my-modelbar-card p { margin: 0.25rem 0 0; font-weight: 600; }
.my-modelbar-card small { display: block; color: #5f6368; }`,
    liveSlides: () => CUTOUTS.map(([slug, name, alt, n]) => `<a class="my-modelbar-card" href="index.html#modelbar">${cutoutImg(slug, alt)}<p>${name}</p><small>${n} Available</small></a>`),
    snippetHtml: `<a class="my-modelbar-card" href="/new-inventory/index.htm?model=GV70">
        <img src="#CHROMEPHOTOPATH|StyleID|1|640p#" width="320" height="240" alt="2026 Genesis GV70">
        <p>GV70</p>
        <small>198 Available</small>
      </a>`,
  },
  tile: {
    cardCss: `.my-modelbar { --dlc-gap: 1rem; }
.my-modelbar-card { display: block; color: #0b2a5b; text-align: center; text-decoration: none; }
.my-modelbar-tile { display: block; padding: 8% 6%; background: #e2e6ea; }
.my-modelbar-card--feature .my-modelbar-tile { background: #0b2a5b; }
.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; }
.my-modelbar-card p { margin: 0.4rem 0 0; font-weight: 700; }`,
    liveSlides: () =>
      CUTOUTS.map(
        ([slug, name, alt], i) =>
          `<a class="my-modelbar-card${i === 2 ? ' my-modelbar-card--feature' : ''}" href="index.html#modelbar" aria-label="Explore the ${name}"><span class="my-modelbar-tile">${cutoutImg(slug, alt)}</span><p>${name}</p></a>`,
      ),
    snippetHtml: `<a class="my-modelbar-card" href="/new-inventory/index.htm?model=Atlas" aria-label="Explore the Atlas">
        <span class="my-modelbar-tile"><img src="#CHROMEPHOTOPATH|StyleID|1|640p#" width="320" height="240" alt="2026 Volkswagen Atlas"></span>
        <p>Atlas</p>
      </a>
      <!-- add my-modelbar-card--feature to the card you want on the navy tile -->`,
  },
  'band-dark': {
    cardCss: `.my-modelbar { padding-block: 1.75rem; background: #101010; }
.my-modelbar { --dlc-arrow-bg: transparent; --dlc-arrow-fg: #fff; }
.my-modelbar-card { display: block; color: #fff; text-align: center; text-decoration: none; }
.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; }
.my-modelbar-card p { margin: 0.5rem 0 0; font-size: 0.85rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; }`,
    liveSlides: () => CUTOUTS.map(([slug, name, alt]) => `<a class="my-modelbar-card" href="index.html#modelbar" aria-label="Explore the ${name}">${cutoutImg(slug, alt)}<p>${name}</p></a>`),
    snippetHtml: `<a class="my-modelbar-card" href="/new-inventory/index.htm?model=LYRIQ" aria-label="Explore the LYRIQ">
        <img src="#CHROMEPHOTOPATH|StyleID|1|640p#" width="320" height="240" alt="2026 Cadillac LYRIQ">
        <p>LYRIQ</p>
      </a>`,
  },
  'name-top-chip': {
    cardCss: `.my-modelbar-card { display: flex; flex-direction: column; color: #222; text-align: center; text-decoration: none; }
.my-modelbar-card p { order: -1; margin: 0 0 0.5rem; font-size: 0.85rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; }
.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; }
.my-modelbar-card small { align-self: center; margin-block-start: 0.75rem; padding: 0.35rem 0.9rem; font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase; background: #ececec; }`,
    liveSlides: () => CUTOUTS.map(([slug, name, alt, n]) => `<a class="my-modelbar-card" href="index.html#modelbar">${cutoutImg(slug, alt)}<p>${name}</p><small>${n} Available</small></a>`),
    snippetHtml: `<a class="my-modelbar-card" href="/new-inventory/index.htm?model=CX-5">
        <img src="#CHROMEPHOTOPATH|StyleID|1|640p#" width="320" height="240" alt="2026 Mazda CX-5">
        <p>Mazda CX-5</p>
        <small>108 Available</small>
      </a>`,
  },
  'photo-card': {
    cardCss: `.my-modelbar { --dlc-gap: 1rem; }
.my-modelbar-card { display: block; overflow: hidden; color: #fff; text-decoration: none; background: #2a2a2a; border-radius: 8px; }
.my-modelbar-card img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 16 / 10; object-fit: cover; }
.my-modelbar-copy { padding: 0.9rem 1rem 1.1rem; }
.my-modelbar-copy small { color: #c9c9c9; }
.my-modelbar-copy h3 { margin: 0.15rem 0 0; font-size: 1.05rem; }`,
    liveSlides: () =>
      PHOTO_CARDS.map(
        ([slug, name, alt, n]) =>
          `<a class="my-modelbar-card" href="index.html#vehicles"><img src="img/${slug}.jpg" width="800" height="500" alt="${alt}" loading="lazy" decoding="async" /><span class="my-modelbar-copy"><small>${n} Available</small><h3>${name}</h3></span></a>`,
      ),
    snippetHtml: `<a class="my-modelbar-card" href="/new-inventory/index.htm?model=Highlander">
        <img src="#MISCPATH#/highlander.jpg" width="800" height="500" alt="Blue Toyota Highlander on a forest road">
        <span class="my-modelbar-copy"><small>4 Available</small><h3>Highlander</h3></span>
      </a>`,
  },
  'tall-tile': {
    cardCss: `.my-modelbar { --dlc-gap: 1.25rem; padding: 1.5rem; background: #14161b; }
.my-modelbar { --dlc-arrow-bg: transparent; --dlc-arrow-fg: #fff; }
.my-modelbar-card { display: block; color: #fff; text-align: center; text-decoration: none; }
.my-modelbar-name { margin: 0 0 0.5rem; font-size: 1.1rem; font-weight: 700; letter-spacing: 0.06em; text-align: start; text-transform: uppercase; }
.my-modelbar-card img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 3 / 5; object-fit: cover; }
.my-modelbar-cta { display: inline-block; margin-block-start: 0.75rem; padding: 0.6rem 1.4rem; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #14161b; background: #fff; }`,
    liveSlides: () =>
      TALL_TILES.map(
        ([slug, name]) =>
          `<a class="my-modelbar-card" href="index.html#models"><p class="my-modelbar-name">${name}</p><img src="img/${slug}.jpg" width="600" height="1000" alt="" loading="lazy" decoding="async" /><span class="my-modelbar-cta">Browse inventory</span></a>`,
      ),
    snippetHtml: `<a class="my-modelbar-card" href="/new-inventory/index.htm?model=Giulia">
        <p class="my-modelbar-name">Giulia</p>
        <img src="#MISCPATH#/giulia-tall.jpg" width="600" height="1000" alt="">
        <span class="my-modelbar-cta">Browse inventory</span>
      </a>`,
  },
};

// One entry per distinct ladder; strips = the looks that ladder ships with.
const VARIANTS = [
  {
    key: 'acura',
    toc: 'Acura',
    sites: 13,
    demos: 'acura 1-3, ford 2-3, gmc 1-2, honda 2-3, kia 2-3, mitsubishi 1-2',
    ladder: [
      [0, 2],
      [461, 3],
      [769, 5],
    ],
    why: 'The most common ladder in the estate.',
    strips: [{ skin: 'white', label: 'Plain white, name below — how all 13 ship it' }],
  },
  {
    key: 'chevrolet',
    toc: 'Chevrolet',
    sites: 11,
    demos: 'cadillac 1-3, chevrolet 1-3, subaru 1-3, volvo 1-2',
    ladder: [
      [0, 2],
      [540, 3],
      [992, 4],
      [1200, 5],
    ],
    why: 'The GM ladder — and proof a ladder is not a look: Chevrolet runs it plain, Cadillac runs it on a black band.',
    strips: [
      { skin: 'white', label: 'As Chevrolet ships it' },
      { skin: 'band-dark', label: 'Same ladder as Cadillac ships it — a dark band and spaced capitals' },
    ],
  },
  {
    key: 'lexus',
    toc: 'Lexus',
    sites: 6,
    demos: 'lexus 1-3, nissan 2-3, toyota 1',
    ladder: [
      [0, 1],
      [401, 2],
      [601, 3],
      [992, 5],
    ],
    why: 'Drops to a single card on the narrowest phones.',
    strips: [{ skin: 'band-gray', label: 'On a soft gray gradient band, spaced capitals' }],
  },
  {
    key: 'buick',
    toc: 'Buick',
    sites: 5,
    demos: 'buick 1-2, jaguar 1, landrover 1, landrover 3',
    ladder: [
      [0, 2],
      [461, 3],
      [769, 4],
    ],
    why: 'Four-up ceiling — roomier cards than the five-up brands.',
    strips: [{ skin: 'white', label: 'Plain white, name below' }],
  },
  {
    key: 'genesis',
    toc: 'Genesis',
    sites: 5,
    demos: 'genesis 1-3, vw 1-2',
    ladder: [
      [0, 1],
      [541, 2],
      [993, 3],
      [1201, 4],
    ],
    why: 'A gentle four-step climb — shipped two ways: Genesis plain with inventory counts, Volkswagen with a colour tile behind every car.',
    strips: [
      { skin: 'counts', label: 'As Genesis ships it — inventory count under each name' },
      { skin: 'tile', label: 'Same ladder as Volkswagen ships it — a tile of colour behind each car, one featured in navy' },
    ],
  },
  {
    key: 'lincoln',
    toc: 'Lincoln',
    sites: 3,
    demos: 'lincoln 1-3',
    ladder: [
      [0, 2],
      [461, 3],
      [993, 4],
    ],
    why: 'Holds three cards across a wide tablet range.',
    strips: [{ skin: 'band-flat', label: 'On a flat light-gray band, spaced capitals' }],
  },
  {
    key: 'ford',
    toc: 'Ford',
    sites: 2,
    demos: 'ford 1, honda 1',
    ladder: [
      [0, 1],
      [461, 3],
      [992, 5],
    ],
    why: 'Jumps 1 → 3 in one step; no two-up state at all.',
    strips: [{ skin: 'white', label: 'Plain white, name below' }],
  },
  {
    key: 'hyundai',
    toc: 'Hyundai',
    sites: 2,
    demos: 'hyundai 2-3',
    ladder: [
      [0, 1],
      [461, 3],
      [993, 4],
      [1201, 5],
    ],
    why: 'Also skips two-up on the way from phone to tablet.',
    strips: [{ skin: 'white', label: 'Plain white, name below' }],
  },
  {
    key: 'mazda',
    toc: 'Mazda',
    sites: 2,
    demos: 'mazda 1-2',
    ladder: [
      [0, 1],
      [769, 2],
      [992, 3],
    ],
    dots: true,
    why: 'One of only three model bars in the estate that shows dots.',
    strips: [{ skin: 'name-top-chip', label: 'Name above the car, inventory chip below — and it keeps its dots' }],
  },
  {
    key: 'toyota',
    toc: 'Toyota',
    sites: 2,
    demos: 'toyota 2-3',
    ladder: [
      [0, 1],
      [541, 2],
    ],
    why: 'The largest cards anywhere — never more than two across.',
    strips: [{ skin: 'photo-card', label: 'Big dark photo cards rather than cutouts' }],
  },
  {
    key: 'alfaromeo',
    toc: 'Alfa Romeo',
    sites: 1,
    demos: 'alfaromeo 1',
    ladder: [
      [0, 1],
      [541, 2],
      [993, 3],
      [1201, 4],
      [1801, 6],
    ],
    why: 'Six-up, but only past 1800px — the widest breakpoint in the estate.',
    strips: [{ skin: 'tall-tile', label: 'Tall dark tiles with a browse button — the most styled bar in the estate' }],
  },
  {
    key: 'audi',
    toc: 'Audi',
    sites: 1,
    demos: 'audi 1',
    ladder: [
      [0, 1],
      [361, 2],
      [769, 3],
      [993, 4],
      [1201, 6],
    ],
    why: 'Five rungs, the most granular ladder anywhere.',
    strips: [{ skin: 'white', label: 'Plain white, name below' }],
  },
];

const ladderText = (l) => l.map(([bp, n], i) => (i === 0 ? `base ${n}` : `&ge;${bp}px ${n}`)).join(' &middot; ');

// The complete copy-paste CSS for one strip: ladder + dots + skin. This exact
// string, class-renamed, is also the live CSS — rendered and taught are one.
const recipeCss = (v, skin) => {
  const rungs = v.ladder
    .map(([bp, n], i) => (i === 0 ? `.my-modelbar { --dlc-per-view: ${n}; --dlc-peek: 60px; --dlc-gap: 0.5rem; }` : `@media (min-width: ${bp}px) { .my-modelbar { --dlc-per-view: ${n}; } }`))
    .join('\n');
  const dots = v.dots
    ? `/* This bar is one of the three in the estate that keeps its dots - nothing to hide. */`
    : `/* Arrows only - hide the dots and reclaim the space they reserved. */\n.my-modelbar .dl-carousel-dots { display: none; }\n.my-modelbar { --dlc-controls-space: 0px; }`;
  return `/* ${v.toc} ladder - ${v.sites === 1 ? '1 site runs' : `${v.sites} sites run`} exactly this. */\n${rungs}\n\n${dots}\n\n${SKINS[skin].cardCss}`;
};

const stripId = (v, i) => (v.strips.length === 1 ? `mbx-${v.key}` : `mbx-${v.key}-${i}`);

// Live style block: each strip's recipe with .my-modelbar → its unique class.
const liveCss = VARIANTS.flatMap((v) =>
  v.strips.map((s, i) =>
    recipeCss(v, s.skin)
      .split('\n')
      .filter((line) => !line.startsWith('/*'))
      .join('\n')
      .replaceAll('.my-modelbar', `.${stripId(v, i)}`),
  ),
).join('\n\n');

const strip = (v, s, i) => {
  const id = stripId(v, i);
  const labelId = `${id}-h`;
  const heading = v.strips.length === 1 ? '' : `        <h3 id="${labelId}" class="strip-label">${s.label}</h3>\n`;
  const note = v.strips.length === 1 ? `        <p class="strip-note">${s.label}.</p>\n` : '';
  const aria = v.strips.length === 1 ? `aria-labelledby="${v.key}-h"` : `aria-labelledby="${labelId}"`;
  const slides = SKINS[s.skin]
    .liveSlides()
    .map((a) => `            <li class="dl-carousel-slide">${a.replaceAll('my-modelbar', id)}</li>`)
    .join('\n');
  return `${heading}${note}        <div class="dl-carousel ${id}" data-slider data-step="slide" ${aria}>
          <ul class="dl-carousel-track">
${slides}
          </ul>
        </div>
        <details>
          <summary>Copy this look</summary>
          <p class="copy-lead">
            <strong>Copy this.</strong> The HTML goes in a Custom HTML block; the CSS goes in the page's <em>Style Only</em> box. Add
            <a href="index.html#start">the slider itself</a> first &mdash; once per page.
          </p>
          <p class="code-label">HTML</p>
          <pre><code>${esc(`<div class="my-modelbar dl-carousel" data-slider data-step="slide" aria-label="Explore our lineup">
  <ul class="dl-carousel-track">
    <li class="dl-carousel-slide">
      ${SKINS[s.skin].snippetHtml}
    </li>
    <!-- repeat the <li> for each model -->
  </ul>
</div>`)}</code></pre>
          <p class="code-label">CSS</p>
          <pre><code>${esc(recipeCss(v, s.skin))}</code></pre>
        </details>`;
};

const section = (v) => `      <section class="demo-section demo-wide" id="${v.key}">
        <h2 id="${v.key}-h">The ${v.toc} ladder &mdash; ${v.sites === 1 ? '1 site' : `${v.sites} sites`}</h2>
        <p class="demo-sub">${v.why} Runs on ${esc(v.demos)}. Cards per view: ${ladderText(v.ladder)}.</p>
${v.strips.map((s, i) => strip(v, s, i)).join('\n')}
      </section>`;

const page = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Custom Slider — model bar library</title>
    <meta name="description" content="Every distinct OEM model bar — each breakpoint ladder and each look — rendered live with the dependency-free scroll-snap slider, with copy-paste code." />
    <!-- inline so the page makes no request the repo can't serve (a missing favicon was a 404 in the console) -->
    <link
      rel="icon"
      href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%23262626'/><rect x='5' y='11' width='14' height='10' rx='2' fill='%23fff'/><rect x='21' y='13' width='6' height='6' rx='2' fill='%23949494'/></svg>"
    />
    <link rel="stylesheet" href="../dist/dl-carousel.css" />
    <link rel="stylesheet" href="assets/demo.css" />
    <script src="../dist/dl-carousel.js" defer></script>
    <script src="assets/demo.js" defer></script>
    <style>
      /* Page chrome shared with demo/index.html lives in assets/demo.css;
         slider styling lives in the library CSS. Only this page's own rules
         are inline. */
      .strip-label {
        margin: 2rem 0 0.75rem;
        font-size: 1.05rem;
      }
      .strip-note {
        max-width: 68ch;
        margin: 0.35rem 0 0.75rem;
        font-size: 0.9rem;
        color: #3c4043;
      }
      /* Every strip below is its copy panel's CSS verbatim, class-renamed by
         the generator — what renders is exactly what the panel teaches. */
${liveCss
  .split('\n')
  .map((l) => (l ? `      ${l}` : ''))
  .join('\n')}
    </style>
  </head>
  <body>
    <a class="demo-skip" href="#main">Skip to content</a>
    <header class="demo-sitenav">
      <nav aria-label="Slider library">
        <strong class="demo-sitenav-title">Custom Slider</strong>
        <a href="index.html">Examples</a>
        <a href="index.html#start">Start here</a>
        <a href="index.html#options">Options</a>
        <a href="model-bars.html" aria-current="page">Model bar library</a>
      </nav>
    </header>
    <main id="main">
      <h1>Model bar library</h1>
      <p class="demo-lede">
        <strong>All 55 model bars across the 76 OEM demo sites are one design</strong> &mdash; arrows, swipe, one card per step, a sliver of the next card peeking, and never autoplay. Brands differ in
        two ways only: the <em>ladder</em> (how many cards show at each width) and the <em>look</em> (what the cards wear &mdash; plain white, a gray or black band, a colour tile behind each car,
        photo cards). Every strip below runs live on a different brand&rsquo;s ladder wearing that brand&rsquo;s look; resize the window and watch the counts change.
      </p>
      <p class="demo-lede">
        Where one ladder ships with two looks in the estate, both are shown &mdash; same breakpoints, different clothes, same engine. Each strip carries its complete copy-paste pair. Do the
        <a href="index.html#start">Start here</a> step from the main demo once per page first. For screenshots of the real sites, see the
        <a href="../docs/catalog/model-bar-library.html">screenshot library</a> and the <a href="../docs/catalog/oem-slider-census.html">census</a>.
      </p>

      <nav class="demo-toc" aria-label="On this page">
${VARIANTS.map((v) => `        <a href="#${v.key}">${v.toc} (${v.sites})</a> &middot;`).join('\n')}
        <a href="#outliers">The outliers</a>
      </nav>

${VARIANTS.map(section).join('\n\n')}

      <section class="demo-section" id="outliers">
        <h2>The outliers &mdash; not this design</h2>
        <p class="demo-sub">Four census entries are not the standard model bar (two of them share the centre-mode pattern). Each one is already demonstrated live on the main page.</p>
        <ul>
          <li><strong>Kia demo 1</strong> and the <strong>Lexus quick-nav</strong> are centre-mode: the active card sits centred with neighbours peeking. That is the <a href="index.html#peek">peek pattern</a> with the peek turned right up.</li>
          <li><strong>Hyundai demo 1</strong> folds the lineup into two rows &mdash; the <a href="index.html#grid">two-row grid</a>.</li>
          <li><strong>Subaru&rsquo;s strip</strong> is content cards stepping a whole page at a time &mdash; the default behaviour shown by <a href="index.html#vehicles">featured vehicles</a>.</li>
        </ul>
      </section>

      <p>Back to <a href="index.html">the main demo</a>. Ladder data: <a href="https://github.com/stevenpelletier90/custom-slider/blob/master/docs/research/2026-08-18-oem-demo-slider-census.md">the OEM demo slider census</a>, fingerprinted 18 Aug 2026.</p>
    </main>
    <!-- Copy buttons and the TOC scrollspy come from assets/demo.js, shared with the main demo page. -->
  </body>
</html>
`;

fs.writeFileSync('demo/model-bars.html', page);
console.log(
  'demo/model-bars.html written:',
  VARIANTS.length,
  'ladders,',
  VARIANTS.reduce((n, v) => n + v.strips.length, 0),
  'strips',
);
