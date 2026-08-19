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
// Cutouts relabelled as body-style categories, for the powersports category bar.
const CATEGORY_TILES = [
  ['silverado-1500', 'Trucks'],
  ['tahoe', 'Full-size SUVs'],
  ['traverse', 'Crossovers'],
  ['equinox', 'Electric'],
  ['colorado', 'Midsize trucks'],
  ['trax', 'Small SUVs'],
];
// Fictional rooftops for the group-site locations strip.
const LOCATIONS = [
  ['Northgate Chevrolet', '2400 Commerce Dr, Springfield', '(555) 010-1100'],
  ['Riverside Buick GMC', '18 Bridge St, Springfield', '(555) 010-1200'],
  ['Lakeview CDJR', '901 Shoreline Ave, Lakeview', '(555) 010-1300'],
  ['Summit Ford', '77 Hilltop Rd, Summit', '(555) 010-1400'],
  ['Valley Honda', '5120 Orchard Way, Valleyfield', '(555) 010-1500'],
  ['Downtown Kia', '311 Main St, Springfield', '(555) 010-1600'],
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
  'cdjr-dark': {
    cardCss: `.my-modelbar { padding-block: 1.75rem; background: #212121; }
.my-modelbar { --dlc-arrow-bg: transparent; --dlc-arrow-fg: #fff; }
.my-modelbar-card { display: block; color: #fff; text-align: center; text-decoration: none; }
.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; transition: transform 0.2s; }
.my-modelbar-card:hover img, .my-modelbar-card:focus-visible img { transform: scale(1.1); }
.my-modelbar-card p { margin: 0.5rem 0 0; font-weight: 600; }`,
    liveSlides: () => CUTOUTS.map(([slug, name, alt]) => `<a class="my-modelbar-card" href="index.html#modelbar" aria-label="Explore the ${name}">${cutoutImg(slug, alt)}<p>${name}</p></a>`),
    snippetHtml: `<a class="my-modelbar-card" href="/new-inventory/index.htm?model=Wrangler" aria-label="Explore the Wrangler">
        <img src="#CHROMEPHOTOPATH|StyleID|1|640p#" width="320" height="240" alt="2026 Jeep Wrangler">
        <p>Wrangler</p>
      </a>`,
  },
  'category-tile': {
    cardCss: `.my-modelbar { padding-block: 1.75rem; background: #1c1c1c; }
.my-modelbar { --dlc-arrow-bg: transparent; --dlc-arrow-fg: #fff; }
.my-modelbar-card { display: block; color: #fff; text-align: center; text-decoration: none; }
.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; }
.my-modelbar-card p { margin: -0.75rem 0 0; font-size: 1.15rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }`,
    liveSlides: () => CATEGORY_TILES.map(([slug, cat]) => `<a class="my-modelbar-card" href="index.html#modelbar">${cutoutImg(slug, '')}<p>${cat}</p></a>`),
    snippetLabel: 'Shop by category',
    snippetHtml: `<a class="my-modelbar-card" href="/searchnew.aspx?bodystyle=Motorcycle">
        <img src="#MISCPATH#/category-motorcycles.png" width="320" height="240" alt="">
        <p>Motorcycles</p>
      </a>`,
  },
  'brand-logo': {
    cardCss: `.my-modelbar-card { display: block; color: inherit; text-align: center; text-decoration: none; }
.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; filter: grayscale(1); opacity: 0.6; transition: filter 0.2s, opacity 0.2s; }
.my-modelbar-card:hover img, .my-modelbar-card:focus-within img { filter: none; opacity: 1; }
.my-modelbar-card p { margin: -0.6rem 0 0; font-weight: 600; }`,
    liveSlides: () => CUTOUTS.map(([slug, name, alt]) => `<a class="my-modelbar-card" href="index.html#modelbar">${cutoutImg(slug, alt)}<p>${name}</p></a>`),
    snippetLabel: 'Shop by brand',
    snippetHtml: `<a class="my-modelbar-card" href="/searchnew.aspx?make=Honda">
        <img src="#MISCPATH#/brand-honda.png" width="320" height="240" alt="">
        <p>Honda</p>
      </a>`,
  },
  'wordmark-dark': {
    cardCss: `.my-modelbar { padding-block: 1.75rem; background: #101010; }
.my-modelbar { --dlc-arrow-bg: transparent; --dlc-arrow-fg: #fff; }
.my-modelbar-card { display: block; color: #fff; text-align: center; text-decoration: none; }
.my-modelbar-wordmark { display: block; margin-block-end: 0.75rem; font-size: 1.3rem; font-style: italic; font-weight: 700; letter-spacing: 0.06em; }
.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; }
.my-modelbar-card p { margin: 0.5rem 0 0; font-size: 0.85rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; }`,
    // No aria-label here: the visible text names the card twice (wordmark +
    // caption), and an "Explore the X" label would fail label-in-name (WCAG
    // 2.5.3). Content names the link; the cutout is decorative (alt="").
    liveSlides: () => CUTOUTS.map(([slug, name]) => `<a class="my-modelbar-card" href="index.html#modelbar"><span class="my-modelbar-wordmark">${name}</span>${cutoutImg(slug, '')}<p>${name}</p></a>`),
    snippetHtml: `<a class="my-modelbar-card" href="/new-inventory/index.htm?model=Roma">
        <span class="my-modelbar-wordmark">Roma</span>
        <img src="#CHROMEPHOTOPATH|StyleID|1|640p#" width="320" height="240" alt="">
        <p>Roma</p>
      </a>
      <!-- the real site puts the model's script-wordmark image where the span is.
           No aria-label and an empty alt: the text already names the card twice,
           and a label that doesn't contain ALL of it fails label-in-name -->`,
  },
  'photo-overlay': {
    cardCss: `.my-modelbar { --dlc-gap: 1rem; }
.my-modelbar-card { position: relative; display: block; overflow: hidden; color: #fff; text-decoration: none; }
.my-modelbar-card img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 16 / 10; object-fit: cover; }
.my-modelbar-card p { position: absolute; inset-block-end: 0; inset-inline: 0; margin: 0; padding: 2.5rem 1rem 0.9rem; font-weight: 700; background: linear-gradient(transparent, rgb(0 0 0 / 75%)); }`,
    liveSlides: () =>
      PHOTO_CARDS.map(
        ([slug, name, alt]) =>
          `<a class="my-modelbar-card" href="index.html#vehicles"><img src="img/${slug}.jpg" width="800" height="500" alt="${alt}" loading="lazy" decoding="async" /><p>${name}</p></a>`,
      ),
    snippetHtml: `<a class="my-modelbar-card" href="/new-inventory/index.htm?model=Purosangue">
        <img src="#MISCPATH#/purosangue.jpg" width="800" height="500" alt="Red Ferrari Purosangue on a coastal road">
        <p>Purosangue</p>
      </a>`,
  },
  spotlight: {
    cardCss: `.my-modelbar { --dlc-arrow-size: 64px; --dlc-arrow-fg: #14161b; --dlc-arrow-bg: rgb(255 255 255 / 85%); }
.my-modelbar .dl-carousel-arrow { box-shadow: 0 2px 10px rgb(0 0 0 / 25%); }
@media (min-width: 992px) { .my-modelbar { --dlc-peek: 23%; } }
.my-modelbar-card { display: block; color: inherit; text-align: center; text-decoration: none; }
.my-modelbar-wordmark { display: block; margin-block-end: 0.5rem; font-size: 1.5rem; font-style: italic; font-weight: 700; letter-spacing: 0.06em; }
.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; }
.my-modelbar-card p { margin: 0.5rem 0 0; font-size: 1.15rem; }`,
    // Same label-in-name reasoning as the wordmark-dark skin above.
    liveSlides: () => CUTOUTS.map(([slug, name]) => `<a class="my-modelbar-card" href="index.html#modelbar"><span class="my-modelbar-wordmark">${name}</span>${cutoutImg(slug, '')}<p>${name}</p></a>`),
    snippetHtml: `<a class="my-modelbar-card" href="/new-inventory/index.htm?model=GranTurismo">
        <span class="my-modelbar-wordmark">GranTurismo</span>
        <img src="#CHROMEPHOTOPATH|StyleID|1|640p#" width="320" height="240" alt="">
        <p>GranTurismo</p>
      </a>`,
  },
  'logo-strip': {
    cardCss: `.my-modelbar { --dlc-gap: 1rem; }
.my-modelbar-card { display: block; text-align: center; }
.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; }`,
    liveSlides: () => CUTOUTS.map(([slug, name]) => `<a class="my-modelbar-card" href="index.html#modelbar" aria-label="Shop ${name}">${cutoutImg(slug, '')}</a>`),
    snippetLabel: 'Shop by make',
    snippetHtml: `<a class="my-modelbar-card" href="/searchnew.aspx?make=Chevrolet" aria-label="Shop Chevrolet">
        <img src="#MISCPATH#/make-chevrolet.png" width="320" height="240" alt="">
      </a>`,
  },
  'location-card': {
    cardCss: `.my-modelbar { --dlc-gap: 1rem; }
.my-modelbar-card { display: block; padding: 1.5rem 1.25rem; color: inherit; text-align: center; text-decoration: none; border: 1px solid #ddd; }
.my-modelbar-card h3 { margin: 0 0 0.4rem; font-size: 1.05rem; }
.my-modelbar-card p { margin: 0 0 1rem; font-size: 0.9rem; color: #5f6368; }
.my-modelbar-visit { display: inline-block; padding: 0.5rem 1.2rem; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #fff; background: #1a5fb4; }`,
    liveSlides: () =>
      LOCATIONS.map(
        ([store, addr, phone]) => `<a class="my-modelbar-card" href="index.html#cards"><h3>${store}</h3><p>${addr}<br />${phone}</p><span class="my-modelbar-visit">Visit website</span></a>`,
      ),
    snippetLabel: 'Our locations',
    snippetHtml: `<a class="my-modelbar-card" href="https://www.rooftop-site.example/">
        <h3>Northgate Chevrolet</h3>
        <p>2400 Commerce Dr, Springfield<br>(555) 010-1100</p>
        <span class="my-modelbar-visit">Visit website</span>
      </a>`,
  },
};

// One entry per distinct ladder; strips = the looks that ladder ships with.
const VARIANTS = [
  {
    key: 'acura',
    toc: 'Acura',
    sites: 19,
    demos: 'acura 1-4, ford 2-4, gmc 1-2, honda 2-5, kia 2-3, mitsubishi 1-2, mitsubishi 4, toyota 9',
    ladder: [
      [0, 2],
      [461, 3],
      [769, 5],
    ],
    why: 'The most common ladder in the estate — tied with the Chevrolet tiers at 19 sites apiece.',
    strips: [{ skin: 'white', label: 'Plain white, name below — how all 19 ship it' }],
  },
  {
    key: 'chevrolet',
    toc: 'Chevrolet',
    sites: 19,
    demos: 'buickgmc 1-4, cadillac 1-3, chevrolet 1-4, ford 6-7, subaru 1-4, volvo 1-2',
    ladder: [
      [0, 2],
      [540, 3],
      [992, 4],
      [1200, 5],
    ],
    why: 'The GM ladder — and proof a ladder is not a look: Chevrolet runs it plain, Cadillac on a black band, and the Buick GMC, Ford-family, and Subaru demos wear it under brand or body-style tabs.',
    strips: [
      { skin: 'white', label: 'As Chevrolet ships it' },
      { skin: 'band-dark', label: 'Same ladder as Cadillac ships it — a dark band and spaced capitals' },
    ],
  },
  {
    key: 'lexus',
    toc: 'Lexus',
    sites: 14,
    demos: 'lexus 1-4, lexus 7, nissan 2-5, toyota 1, toyota 4-7',
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
    sites: 7,
    demos: 'buick 1-2, jaguar 1, jaguar 3, landrover 1, landrover 3-4',
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
    sites: 4,
    demos: 'lincoln 1-4',
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
    sites: 3,
    demos: 'hyundai 2-4',
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
    why: 'Never more than two across — the roomiest cards of any standard bar.',
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
  {
    key: 'cdjr',
    toc: 'CDJR',
    sites: 4,
    demos: 'cdjr 1-4',
    ladder: [
      [0, 2],
      [461, 3],
      [992, 6],
    ],
    why: 'The only six-up ladder that gets there in three rungs — and the only ladder from the 19 Aug sweep worn by more than one site.',
    strips: [
      {
        skin: 'cdjr-dark',
        label:
          'The dark #212121 band with white model names under transparent cutouts — shown here minus the brand-logo tabs: the real sites wrap four or five of these bars (Chrysler, Dodge, Jeep, Ram, Wagoneer) in brand tabs, which is page script rather than the engine — see <a href="index.html#modelbar-tabs">the tab wiring</a>',
      },
    ],
  },
  {
    key: 'powersports-cat',
    toc: 'Powersports categories',
    sites: 1,
    demos: 'powersports 2',
    ladder: [
      [0, 2],
      [461, 3],
      [993, 5],
    ],
    why: 'Same engine, different content contract: the slides are body-style categories (motorcycles, ATVs, scooters), not models.',
    strips: [
      {
        skin: 'category-tile',
        label: 'Category tiles on a dark band — uppercase, letter-spaced labels pulled up under each vehicle. The Chevrolet cutouts stand in for the real site&rsquo;s dealer-hosted category images',
      },
    ],
  },
  {
    key: 'powersports-brands',
    toc: 'Powersports brands',
    sites: 1,
    demos: 'powersports 1',
    ladder: [
      [0, 2],
      [461, 3],
      [769, 6],
    ],
    why: 'A brand-logo strip standing where the model bar would be — the Acura tiers with a six-up ceiling.',
    strips: [
      {
        skin: 'brand-logo',
        label:
          'Grayscale logo tiles that gain their colour on hover or keyboard focus — <code>filter: grayscale(1)</code> plus opacity, removed on hover/focus. The model cutouts here are stand-ins for the real site&rsquo;s brand logos',
      },
    ],
  },
  {
    key: 'ferrari',
    toc: 'Ferrari',
    sites: 1,
    demos: 'ferrari 1',
    ladder: [
      [0, 1],
      [768, 3],
    ],
    why: 'One to three in a single step — and the boundary is 768px, not the platform&rsquo;s usual 769.',
    strips: [
      {
        skin: 'wordmark-dark',
        label: 'A dark band with a small wordmark line above each car and the name repeated below. The styled text span stands in for the real site&rsquo;s script-wordmark images',
      },
    ],
  },
  {
    key: 'ferrari-photo',
    toc: 'Ferrari photo cards',
    sites: 1,
    demos: 'ferrari 2',
    ladder: [
      [0, 1],
      [769, 2],
      [993, 3],
      [1441, 4],
    ],
    why: 'The estate&rsquo;s only 1441px tier — a fourth card appears only past 1440px.',
    strips: [{ skin: 'photo-overlay', label: 'Lifestyle photo cards with a bottom gradient overlay and the name bottom-left' }],
  },
  {
    key: 'maserati',
    toc: 'Maserati spotlight',
    heading: 'The Maserati spotlight',
    sites: 1,
    demos: 'maserati 4',
    ladder: [[0, 1]],
    peek: '20%',
    why: 'Not really a ladder: one huge card centred at every width with both neighbours peeking. This is the <a href="index.html#peek">peek pattern</a> worn as a model bar — <code>--dlc-per-view: 1</code> with the peek turned right up.',
    strips: [{ skin: 'spotlight', label: 'Wordmark above the car, name below, oversized white arrows — the peek grows from 20% to 23% at 992px' }],
  },
  {
    key: 'group',
    toc: 'Group-site strips',
    heading: 'Group-site strips',
    sites: 1,
    demos: 'group 1',
    why: 'Not model bars, but the strips designers will be asked for on group sites: a make-logo rail and a rooftop-location rail. Both autoplay on the real site — the census&rsquo;s only autoplay anywhere — so both carry <code>data-autoplay="4000"</code>, and the engine adds its pause button (top right, first in tab order). Dots stay hidden as everywhere else.',
    strips: [
      {
        skin: 'logo-strip',
        recipeName: 'Group makes strip',
        ladder: [
          [0, 2],
          [769, 4],
          [993, 7],
        ],
        autoplay: 4000,
        label: 'Make logos, seven across past 992px (base 2 &middot; &ge;769px 4 &middot; &ge;993px 7) — the cutouts stand in for OEM logos',
      },
      {
        skin: 'location-card',
        recipeName: 'Group locations strip',
        ladder: [
          [0, 1],
          [769, 2],
          [993, 4],
        ],
        autoplay: 4000,
        label: 'Rooftop location cards (base 1 &middot; &ge;769px 2 &middot; &ge;993px 4)',
      },
    ],
  },
];

const ladderText = (l) => l.map(([bp, n], i) => (i === 0 ? `base ${n}` : `&ge;${bp}px ${n}`)).join(' &middot; ');

// The complete copy-paste CSS for one strip: ladder + dots + skin. This exact
// string, class-renamed, is also the live CSS — rendered and taught are one.
// A strip may carry its own ladder/autoplay (the group-site rails); a variant
// may override the base peek (the Maserati spotlight's centre mode).
const recipeCss = (v, s) => {
  const rungs = (s.ladder ?? v.ladder)
    .map(([bp, n], i) =>
      i === 0 ? `.my-modelbar { --dlc-per-view: ${n}; --dlc-peek: ${v.peek ?? '60px'}; --dlc-gap: 0.5rem; }` : `@media (min-width: ${bp}px) { .my-modelbar { --dlc-per-view: ${n}; } }`,
    )
    .join('\n');
  const dots = v.dots
    ? `/* This bar is one of the three in the estate that keeps its dots - nothing to hide. */`
    : `/* Arrows only - hide the dots and reclaim the space they reserved. */\n.my-modelbar .dl-carousel-dots { display: none; }\n.my-modelbar { --dlc-controls-space: 0px; }`;
  const auto = s.autoplay ? `\n\n/* Autoplay adds the engine's pause button (top right, first in tab order) - leave it. */` : '';
  return `/* ${s.recipeName ?? `${v.toc} ladder`} - ${v.sites === 1 ? '1 site runs' : `${v.sites} sites run`} exactly this. */\n${rungs}\n\n${dots}${auto}\n\n${SKINS[s.skin].cardCss}`;
};

const stripId = (v, i) => (v.strips.length === 1 ? `mbx-${v.key}` : `mbx-${v.key}-${i}`);

// Live style block: each strip's recipe with .my-modelbar → its unique class.
const liveCss = VARIANTS.flatMap((v) =>
  v.strips.map((s, i) =>
    recipeCss(v, s)
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
  const attrs = `data-slider data-step="slide"${s.autoplay ? ` data-autoplay="${s.autoplay}"` : ''}`;
  const slides = SKINS[s.skin]
    .liveSlides()
    .map((a) => `            <li class="dl-carousel-slide">${a.replaceAll('my-modelbar', id)}</li>`)
    .join('\n');
  return `${heading}${note}        <div class="dl-carousel ${id}" ${attrs} ${aria}>
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
          <pre><code>${esc(`<div class="my-modelbar dl-carousel" ${attrs} aria-label="${SKINS[s.skin].snippetLabel ?? 'Explore our lineup'}">
  <ul class="dl-carousel-track">
    <li class="dl-carousel-slide">
      ${SKINS[s.skin].snippetHtml}
    </li>
    <!-- repeat the <li> for each model -->
  </ul>
</div>`)}</code></pre>
          <p class="code-label">CSS</p>
          <pre><code>${esc(recipeCss(v, s))}</code></pre>
        </details>`;
};

const section = (v) => `      <section class="demo-section demo-wide" id="${v.key}">
        <h2 id="${v.key}-h">${v.heading ?? `The ${v.toc} ladder`} &mdash; ${v.sites === 1 ? '1 site' : `${v.sites} sites`}</h2>
        <p class="demo-sub">${v.why} Runs on ${esc(v.demos)}.${v.ladder ? ` Cards per view: ${ladderText(v.ladder)}.` : ''}</p>
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
        <strong>All 90 model bars across the 129 OEM demo sites are one design</strong> &mdash; arrows, swipe, one card per step, a sliver of the next card peeking, and never autoplay (the only
        autoplaying strips anywhere are one group site&rsquo;s make and location rails &mdash; not model bars &mdash; shown last on this page). Brands differ in two ways only: the <em>ladder</em>
        (how many cards show at each width) and the <em>look</em> (what the cards wear &mdash; plain white, a gray or black band, a colour tile behind each car, photo cards). Every strip below runs
        live on a different brand&rsquo;s ladder wearing that brand&rsquo;s look; resize the window and watch the counts change.
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
        <p class="demo-sub">A few census entries are not the standard model bar. Each one is already demonstrated live on the main page.</p>
        <ul>
          <li><strong>Kia demo 1</strong> and the <strong>Lexus and Nissan quick-navs</strong> are centre-mode: the active card sits centred with neighbours peeking. That is the <a href="index.html#peek">peek pattern</a> with the peek turned right up &mdash; and it now has company as a model bar proper: the <a href="#maserati">Maserati spotlight</a> above is the same recipe.</li>
          <li><strong>Hyundai demo 1</strong> folds the lineup into two rows &mdash; the <a href="index.html#grid">two-row grid</a>.</li>
          <li><strong>Subaru&rsquo;s strip</strong> is content cards stepping a whole page at a time &mdash; the default behaviour shown by <a href="index.html#vehicles">featured vehicles</a>.</li>
          <li><strong>Ford demo 5</strong> has no slider at all: a static flex-wrap grid of models, six across on desktop down to two on phones. Proof the bar is optional &mdash; nothing to copy from this library.</li>
        </ul>
      </section>

      <p>Back to <a href="index.html">the main demo</a>. Ladder data: <a href="https://github.com/stevenpelletier90/custom-slider/blob/master/docs/research/2026-08-18-oem-demo-slider-census.md">the OEM demo slider census</a>, fingerprinted 18&ndash;19 Aug 2026.</p>
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
