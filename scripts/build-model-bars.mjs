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

// Brand-correct model images, harvested 19 Aug 2026 from each strip's own
// demo site (sources in demo/img/CREDITS.md). Counts on Genesis are the
// source site's live inventory figures; Mazda/Toyota counts are sample data.
const R = {
  acura: [
    { file: 'img/oem/acura/integra.png', w: 320, h: 240, name: 'Integra', alt: '2026 Acura Integra' },
    { file: 'img/oem/acura/tlx.png', w: 320, h: 240, name: 'TLX', alt: '2026 Acura TLX' },
    { file: 'img/oem/acura/adx.png', w: 320, h: 240, name: 'ADX', alt: '2026 Acura ADX' },
    { file: 'img/oem/acura/rdx.png', w: 320, h: 240, name: 'RDX', alt: '2026 Acura RDX' },
    { file: 'img/oem/acura/zdx.png', w: 480, h: 300, name: 'ZDX', alt: '2024 Acura ZDX' },
    { file: 'img/oem/acura/mdx.png', w: 320, h: 240, name: 'MDX', alt: '2026 Acura MDX' },
  ],
  lexus: [
    { file: 'img/oem/lexus/ux-hybrid.png', w: 240, h: 140, name: 'UX Hybrid', alt: '2026 Lexus UX Hybrid' },
    { file: 'img/oem/lexus/nx.png', w: 240, h: 140, name: 'NX', alt: '2026 Lexus NX' },
    { file: 'img/oem/lexus/nx-hybrid.png', w: 240, h: 140, name: 'NX Hybrid', alt: '2026 Lexus NX Hybrid' },
    { file: 'img/oem/lexus/rz.png', w: 240, h: 140, name: 'RZ', alt: '2026 Lexus RZ' },
    { file: 'img/oem/lexus/rx.png', w: 240, h: 140, name: 'RX', alt: '2026 Lexus RX' },
    { file: 'img/oem/lexus/gx.png', w: 240, h: 140, name: 'GX', alt: '2026 Lexus GX' },
  ],
  buick: [
    { file: 'img/oem/buick/envista.png', w: 320, h: 240, name: 'Envista', alt: '2026 Buick Envista' },
    { file: 'img/oem/buick/encore-gx.png', w: 320, h: 240, name: 'Encore GX', alt: '2026 Buick Encore GX' },
    { file: 'img/oem/buick/envision.png', w: 320, h: 240, name: 'Envision', alt: '2026 Buick Envision' },
    { file: 'img/oem/buick/enclave.png', w: 320, h: 240, name: 'Enclave', alt: '2026 Buick Enclave' },
  ],
  audi: [
    { file: 'img/oem/audi/e-tron-gt.webp', w: 420, h: 180, name: 'e-tron GT', alt: '2026 Audi e-tron GT' },
    { file: 'img/oem/audi/q4-e-tron.webp', w: 420, h: 180, name: 'Q4 e-tron', alt: '2026 Audi Q4 e-tron' },
    { file: 'img/oem/audi/q6-e-tron.webp', w: 420, h: 180, name: 'Q6 e-tron', alt: '2026 Audi Q6 e-tron' },
    { file: 'img/oem/audi/q3.webp', w: 420, h: 180, name: 'Q3', alt: '2026 Audi Q3' },
    { file: 'img/oem/audi/q5.webp', w: 420, h: 180, name: 'Q5', alt: '2026 Audi Q5' },
    { file: 'img/oem/audi/q7.webp', w: 420, h: 180, name: 'Q7', alt: '2026 Audi Q7' },
  ],
  genesis: [
    { file: 'img/oem/genesis/g70.png', w: 400, h: 225, name: 'G70', alt: '2026 Genesis G70', count: 53 },
    { file: 'img/oem/genesis/g80.png', w: 400, h: 225, name: 'G80', alt: '2026 Genesis G80', count: 28 },
    { file: 'img/oem/genesis/g90.png', w: 400, h: 225, name: 'G90', alt: '2026 Genesis G90', count: 8 },
    { file: 'img/oem/genesis/gv60.png', w: 640, h: 360, name: 'GV60', alt: '2026 Genesis GV60', count: 5 },
    { file: 'img/oem/genesis/gv70.png', w: 400, h: 225, name: 'GV70', alt: '2026 Genesis GV70', count: 198 },
    { file: 'img/oem/genesis/gv80.png', w: 400, h: 225, name: 'GV80', alt: '2026 Genesis GV80', count: 134 },
  ],
  lincoln: [
    { file: 'img/oem/lincoln/navigator.png', w: 320, h: 240, name: 'Navigator', alt: '2026 Lincoln Navigator' },
    { file: 'img/oem/lincoln/aviator.png', w: 320, h: 240, name: 'Aviator', alt: '2026 Lincoln Aviator' },
    { file: 'img/oem/lincoln/nautilus.png', w: 320, h: 240, name: 'Nautilus', alt: '2026 Lincoln Nautilus' },
    { file: 'img/oem/lincoln/corsair.png', w: 320, h: 240, name: 'Corsair', alt: '2026 Lincoln Corsair' },
  ],
  ford: [
    { file: 'img/oem/ford/mustang.png', w: 320, h: 240, name: 'Mustang', alt: '2026 Ford Mustang' },
    { file: 'img/oem/ford/mach-e.png', w: 320, h: 240, name: 'Mach-E', alt: '2026 Ford Mach-E' },
    { file: 'img/oem/ford/escape.png', w: 320, h: 240, name: 'Escape', alt: '2026 Ford Escape' },
    { file: 'img/oem/ford/explorer.png', w: 320, h: 240, name: 'Explorer', alt: '2026 Ford Explorer' },
    { file: 'img/oem/ford/bronco.png', w: 320, h: 240, name: 'Bronco', alt: '2026 Ford Bronco' },
    { file: 'img/oem/ford/f-150.png', w: 320, h: 240, name: 'F-150', alt: '2026 Ford F-150' },
  ],
  hyundai: [
    { file: 'img/oem/hyundai/kona.png', w: 420, h: 260, name: 'Kona', alt: '2024 Hyundai Kona' },
    { file: 'img/oem/hyundai/tucson.png', w: 420, h: 260, name: 'Tucson', alt: '2024 Hyundai Tucson' },
    { file: 'img/oem/hyundai/santa-fe.png', w: 320, h: 240, name: 'Santa Fe', alt: '2023 Hyundai Santa Fe' },
    { file: 'img/oem/hyundai/palisade.png', w: 320, h: 240, name: 'Palisade', alt: '2024 Hyundai Palisade' },
    { file: 'img/oem/hyundai/ioniq-5.png', w: 420, h: 260, name: 'IONIQ 5', alt: '2024 Hyundai IONIQ 5' },
    { file: 'img/oem/hyundai/elantra.png', w: 420, h: 260, name: 'Elantra', alt: '2024 Hyundai Elantra' },
  ],
  mazda: [
    { file: 'img/oem/mazda/cx-30.png', w: 480, h: 209, name: 'CX-30', alt: '2026 Mazda CX-30', count: 12 },
    { file: 'img/oem/mazda/cx-5.png', w: 480, h: 209, name: 'CX-5', alt: '2026 Mazda CX-5', count: 7 },
    { file: 'img/oem/mazda/cx-50.png', w: 480, h: 209, name: 'CX-50', alt: '2026 Mazda CX-50', count: 19 },
    { file: 'img/oem/mazda/cx-90.png', w: 480, h: 209, name: 'CX-90', alt: '2026 Mazda CX-90', count: 4 },
    { file: 'img/oem/mazda/mazda3-sedan.png', w: 480, h: 209, name: 'Mazda3 Sedan', alt: '2026 Mazda Mazda3 Sedan', count: 9 },
    { file: 'img/oem/mazda/mx-5-miata.png', w: 480, h: 209, name: 'MX-5 Miata', alt: '2026 Mazda MX-5 Miata', count: 15 },
  ],
  toyota: [
    { file: 'img/oem/toyota/camry.jpg', w: 800, h: 747, name: 'Camry', alt: '2026 Toyota Camry', count: 6 },
    { file: 'img/oem/toyota/corolla.jpg', w: 800, h: 744, name: 'Corolla', alt: '2026 Toyota Corolla', count: 11 },
    { file: 'img/oem/toyota/rav4.jpg', w: 800, h: 744, name: 'RAV4', alt: '2026 Toyota RAV4', count: 4 },
    { file: 'img/oem/toyota/tacoma.jpg', w: 800, h: 744, name: 'Tacoma', alt: '2026 Toyota Tacoma', count: 9 },
    { file: 'img/oem/toyota/tundra.jpg', w: 800, h: 744, name: 'Tundra', alt: '2026 Toyota Tundra', count: 3 },
    { file: 'img/oem/toyota/4runner.jpg', w: 800, h: 744, name: '4Runner', alt: '2026 Toyota 4Runner', count: 7 },
  ],
  alfaromeo: [
    { file: 'img/oem/alfaromeo/tonale.jpg', w: 300, h: 500, name: 'Tonale', alt: '2026 Alfa Romeo Tonale' },
    { file: 'img/oem/alfaromeo/tonale-hybrid.jpg', w: 300, h: 500, name: 'Tonale Hybrid', alt: '2025 Alfa Romeo Tonale Hybrid' },
    { file: 'img/oem/alfaromeo/giulia.jpg', w: 300, h: 500, name: 'Giulia', alt: '2025 Alfa Romeo Giulia' },
    { file: 'img/oem/alfaromeo/stelvio.jpg', w: 300, h: 500, name: 'Stelvio', alt: '2025 Alfa Romeo Stelvio' },
    { file: 'img/oem/alfaromeo/giulia-quadrifoglio.jpg', w: 300, h: 500, name: 'Giulia Quadrifoglio', alt: '2025 Alfa Romeo Giulia Quadrifoglio' },
    { file: 'img/oem/alfaromeo/stelvio-quadrifoglio.jpg', w: 300, h: 500, name: 'Stelvio Quadrifoglio', alt: '2025 Alfa Romeo Stelvio Quadrifoglio' },
  ],
  cdjr: [
    { file: 'img/oem/cdjr/chrysler-pacifica.png', w: 480, h: 360, name: 'Pacifica', alt: '2026 Chrysler Pacifica' },
    { file: 'img/oem/cdjr/chrysler-voyager.png', w: 480, h: 360, name: 'Voyager', alt: '2026 Chrysler Voyager' },
    { file: 'img/oem/cdjr/dodge-charger.png', w: 480, h: 360, name: 'Charger', alt: '2026 Dodge Charger' },
    { file: 'img/oem/cdjr/dodge-durango.png', w: 480, h: 360, name: 'Durango', alt: '2026 Dodge Durango' },
    { file: 'img/oem/cdjr/jeep-wrangler.png', w: 480, h: 360, name: 'Wrangler', alt: '2026 Jeep Wrangler' },
    { file: 'img/oem/cdjr/jeep-grand-cherokee.png', w: 480, h: 360, name: 'Grand Cherokee', alt: '2026 Jeep Grand Cherokee' },
    { file: 'img/oem/cdjr/ram-1500.png', w: 480, h: 360, name: 'Ram 1500', alt: '2026 Ram 1500' },
    { file: 'img/oem/cdjr/ram-2500.png', w: 480, h: 360, name: 'Ram 2500', alt: '2026 Ram 2500' },
  ],
};

// One image tag for either source: the Chevrolet srcset cutouts (slug) or a
// harvested single-size brand image (file). altOverride: pass '' when the
// card's text already names the model and the photo is decorative.
const imgTag = (e, altOverride) =>
  e.slug !== undefined ? cutoutImg(e.slug, altOverride ?? e.alt) : `<img src="${e.file}" width="${e.w}" height="${e.h}" alt="${altOverride ?? e.alt}" loading="lazy" decoding="async" />`;
const CHEVY = CUTOUTS.map(([slug, name, alt, count]) => ({ slug, name, alt, count }));

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const cutoutImg = (slug, alt) =>
  `<img src="img/chrome-${slug}.png" srcset="img/chrome-${slug}.png 320w, img/chrome-${slug}-640.png 640w" sizes="(min-width: 1024px) 250px, (min-width: 640px) 30vw, 45vw" width="320" height="240" alt="${alt}" loading="lazy" decoding="async" />`;

// Each skin: how the estate actually dresses the bar (see the screenshot
// library). cardCss is the copy-paste CSS below the ladder lines; liveSlides
// and snippetHtml are the same markup — real sources vs. platform tokens.
const SKINS = {
  white: {
    cardCss: `/* Flex column grounded at the bottom: cards whose photos have different
   aspect ratios still align their captions, and the cars share a ground line. */
.my-modelbar-card { display: flex; flex-direction: column; justify-content: flex-end; block-size: 100%; color: inherit; text-align: center; text-decoration: none; }
.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; }
.my-modelbar-card p { margin: 0.25rem 0 0; font-weight: 600; }`,
    liveSlides: (r) => r.map((e) => `<a class="my-modelbar-card" href="index.html#modelbar" aria-label="Explore the ${e.name}">${imgTag(e)}<p>${e.name}</p></a>`),
    snippetHtml: (r) => `<a class="my-modelbar-card" href="/new-inventory/index.htm?model=${r[0].name}" aria-label="Explore the ${r[0].name}">
        <img src="#CHROMEPHOTOPATH|StyleID|1|640p#" width="320" height="240" alt="${r[0].alt}">
        <p>${r[0].name}</p>
      </a>`,
  },
  'band-gray': {
    cardCss: `.my-modelbar { padding-block: 1.5rem; background: linear-gradient(#e9e9e9, #f9f9f9); }
.my-modelbar-card { display: block; color: #222; text-align: center; text-decoration: none; }
.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; }
.my-modelbar-card p { margin: 0.25rem 0 0; font-size: 0.85rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }`,
    liveSlides: (r) => r.map((e) => `<a class="my-modelbar-card" href="index.html#modelbar" aria-label="Explore the ${e.name}">${imgTag(e)}<p>${e.name}</p></a>`),
    snippetHtml: (r) => `<a class="my-modelbar-card" href="/new-inventory/index.htm?model=${r[0].name}" aria-label="Explore the ${r[0].name}">
        <img src="#CHROMEPHOTOPATH|StyleID|1|640p#" width="320" height="240" alt="${r[0].alt}">
        <p>${r[0].name}</p>
      </a>`,
  },
  'band-flat': {
    cardCss: `.my-modelbar { padding-block: 1.5rem; background: #f2f2f2; }
.my-modelbar-card { display: block; color: #444649; text-align: center; text-decoration: none; }
.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; }
.my-modelbar-card p { margin: 0.5rem 0 0; font-size: 0.85rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; }`,
    liveSlides: (r) => r.map((e) => `<a class="my-modelbar-card" href="index.html#modelbar" aria-label="Explore the ${e.name}">${imgTag(e)}<p>${e.name}</p></a>`),
    snippetHtml: (r) => `<a class="my-modelbar-card" href="/new-inventory/index.htm?model=${r[0].name}" aria-label="Explore the ${r[0].name}">
        <img src="#CHROMEPHOTOPATH|StyleID|1|640p#" width="320" height="240" alt="${r[0].alt}">
        <p>${r[0].name}</p>
      </a>`,
  },
  counts: {
    cardCss: `.my-modelbar-card { display: block; color: inherit; text-align: center; text-decoration: none; }
.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; }
.my-modelbar-card p { margin: 0.25rem 0 0; font-weight: 600; }
.my-modelbar-card small { display: block; color: #5f6368; }`,
    liveSlides: (r) => r.map((e) => `<a class="my-modelbar-card" href="index.html#modelbar">${imgTag(e)}<p>${e.name}</p><small>${e.count ?? 12} Available</small></a>`),
    snippetHtml: (r) => `<a class="my-modelbar-card" href="/new-inventory/index.htm?model=${r[0].name}">
        <img src="#CHROMEPHOTOPATH|StyleID|1|640p#" width="320" height="240" alt="${r[0].alt}">
        <p>${r[0].name}</p>
        <small>${r[0].count ?? 12} Available</small>
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
    liveSlides: (r) => r.map((e) => `<a class="my-modelbar-card" href="index.html#modelbar">${imgTag(e)}<p>${e.name}</p><small>${e.count ?? 9} Available</small></a>`),
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
    liveSlides: (r) =>
      r.map((e) => `<a class="my-modelbar-card" href="index.html#vehicles">${imgTag(e)}<span class="my-modelbar-copy"><small>${e.count ?? 5} Available</small><h3>${e.name}</h3></span></a>`),
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
    liveSlides: (r) =>
      r.map((e) => `<a class="my-modelbar-card" href="index.html#models"><p class="my-modelbar-name">${e.name}</p>${imgTag(e, '')}<span class="my-modelbar-cta">Browse inventory</span></a>`),
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
    liveSlides: (r) => r.map((e) => `<a class="my-modelbar-card" href="index.html#modelbar" aria-label="Explore the ${e.name}">${imgTag(e)}<p>${e.name}</p></a>`),
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
/* autoplay's pause button clears the overlaid next arrow - both stay 24px+ touch targets */
.my-modelbar .dl-carousel-pause { inset-inline-end: calc(var(--dlc-arrow-size, 36px) + 0.75rem); }
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
/* same pause-vs-arrow clearance as the makes rail */
.my-modelbar .dl-carousel-pause { inset-inline-end: calc(var(--dlc-arrow-size, 36px) + 0.75rem); }
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
    roster: R.acura,
    toc: 'Acura',
    sites: 19,
    demos: 'acura 1-4, ford 2-4, gmc 1-2, honda 2-5, kia 2-3, mitsubishi 1-2, mitsubishi 4, toyota 9',
    ladder: [
      [0, 2],
      [461, 3],
      [769, 5],
    ],
    why: 'The most common ladder in the estate — tied with the Chevrolet tiers at 19 sites apiece. The same tiers also ship branded as Lexus on live client sites: a centered underlined heading and small cutouts that scale up a touch on hover.',
    strips: [{ skin: 'white', label: 'Plain white, name below — how all 19 ship it' }],
  },
  {
    key: 'chevrolet',
    roster: CHEVY,
    toc: 'Chevrolet',
    sites: 19,
    demos: 'buickgmc 1-4, cadillac 1-3, chevrolet 1-4, ford 6-7, subaru 1-4, volvo 1-2',
    ladder: [
      [0, 2],
      [540, 3],
      [992, 4],
      [1200, 5],
    ],
    why: 'The GM ladder — and proof a ladder is not a look: Chevrolet runs it plain, Cadillac on a black band, and the Buick GMC, Ford-family, and Subaru demos wear it under brand or body-style tabs. Note: since Nov 2025 the official Chevrolet bar is the TABBED version (the plain slick look was deprecated and its sites migrated) — expect tabs on new Chevrolet requests; the <a href="index.html#modelbar-tabs">tabs demo</a> shows the wiring over this same ladder.',
    strips: [
      {
        skin: 'white',
        label: 'As Chevrolet ships it — five body-style tabs (the official presentation since Nov 2025), each pane its own carousel on this ladder. Models repeat across panes on the real site too',
        tabbed: {
          labels: ['Trucks', 'Electric', 'Crossovers/SUVs', 'Performance', 'Commercial'],
          panes: [
            [0, 1, 2],
            [5, 7],
            [2, 3, 4, 6],
            [0, 7],
            [0, 1, 3],
          ],
        },
      },
      { skin: 'band-dark', label: 'Same ladder as Cadillac ships it — a dark band and spaced capitals' },
    ],
  },
  {
    key: 'lexus',
    roster: R.lexus,
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
    roster: R.buick,
    toc: 'Buick',
    sites: 7,
    demos: 'buick 1-2, jaguar 1, jaguar 3, landrover 1, landrover 3-4',
    ladder: [
      [0, 2],
      [461, 3],
      [769, 4],
    ],
    why: 'Four-up ceiling — roomier cards than the five-up brands. Jaguar and Land Rover wear these same tiers as photo cards: a background photo per model with a dark hover overlay and an uppercase name plus tagline below (their imagery is pending, so the look is described rather than shown).',
    strips: [{ skin: 'white', label: 'Plain white, name below' }],
  },
  {
    key: 'genesis',
    roster: R.genesis,
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
      {
        skin: 'counts',
        recipeName: 'Genesis new-platform ladder',
        ladder: [
          [0, 1],
          [600, 2],
          [991, 3],
        ],
        label:
          'The new-platform ladder (base 1 &middot; &ge;600px 2 &middot; &ge;991px 3) — the newest platform generation runs this shorter climb, and hides its arrows when every model already fits',
      },
    ],
  },
  {
    key: 'lincoln',
    roster: R.lincoln,
    toc: 'Lincoln',
    sites: 4,
    demos: 'lincoln 1-4',
    ladder: [
      [0, 2],
      [461, 3],
      [993, 4],
    ],
    why: 'Holds three cards across a wide tablet range. Client builds sometimes cut the 4-up tier at 992px instead of 993 — one pixel, same ladder.',
    strips: [{ skin: 'band-flat', label: 'On a flat light-gray band, spaced capitals' }],
  },
  {
    key: 'ford',
    roster: R.ford,
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
    roster: R.hyundai,
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
    roster: R.mazda,
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
    roster: R.toyota,
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
    roster: R.alfaromeo,
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
    roster: R.audi,
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
    roster: R.cdjr,
    toc: 'CDJR',
    sites: 4,
    demos: 'cdjr 1-4',
    ladder: [
      [0, 2],
      [461, 3],
      [992, 6],
    ],
    why: 'The only six-up ladder that gets there in three rungs — and the only ladder from the 19 Aug sweep worn by more than one site. A Fiat-including client variant drops the colored band, uses pipe-divider tabs, and starts at one card — moot, since that variant hides the whole bar below 768px.',
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

// ---- the non-slider model bars ---------------------------------------------
// Verified on the live sites, 19 Aug 2026: several OEMs ship a model bar that
// is not a slider at all — hover-reveal tile grids and tab panes. Same
// rendered-equals-taught rule as the strips: each demo's CSS is one string,
// class-renamed for the live block and verbatim in the copy panel.
const STATICS = [
  {
    key: 'tilegrid',
    title: 'Hover-reveal tile grid',
    note: 'As the Porsche demo ships it: square photo tiles, two across on phones, six across on desktop. At rest a tile is just the photo; hover (or keyboard focus) darkens it and slides up the name with Search New / Search Used links. Below 992px the label and links simply sit under the photo &mdash; no hover choreography on touch.',
    css: `/* Hover-reveal tile grid - 2-across base, 3 at 540px, 6 at 992px. */
.my-tilegrid { display: flex; flex-wrap: wrap; gap: 1rem 2%; }
.my-tile { position: relative; inline-size: 49%; overflow: hidden; border-radius: 10px; }
@media (min-width: 540px) { .my-tile { inline-size: 32%; } }
@media (min-width: 992px) { .my-tile { inline-size: 15%; } }
.my-tile img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 1; object-fit: cover; }

/* The cover: static under the photo on small screens, an overlay on desktop. */
.my-tile-cover { display: flex; flex-direction: column; gap: 0.25rem; align-items: center; padding: 0.5rem; text-align: center; }
.my-tile-cover p { margin: 0; font-weight: 700; }
.my-tile-cover a { font-size: 0.9rem; }
@media (min-width: 992px) {
  .my-tile-cover { position: absolute; inset: 0; justify-content: center; color: #fff; background: rgb(0 0 0 / 55%); border-radius: 10px; opacity: 0; transition: opacity 0.25s; }
  .my-tile-cover a { color: #fff; transition: transform 0.25s; transform: translateY(10px); }
  .my-tile-cover a + a { transition-delay: 0.07s; }
  .my-tile:hover .my-tile-cover, .my-tile:focus-within .my-tile-cover { opacity: 1; }
  .my-tile:hover .my-tile-cover a, .my-tile:focus-within .my-tile-cover a { transform: none; }
}
@media (prefers-reduced-motion: reduce) { .my-tile-cover, .my-tile-cover a { transition: none; } }`,
    rootClass: 'my-tilegrid',
    liveUnits: TALL_TILES.slice(0, 6).map(
      ([slug, name]) => `<div class="my-tile"><img src="img/${slug}.jpg" width="640" height="640" alt="" loading="lazy" decoding="async" />
              <div class="my-tile-cover"><p>${name}</p><a href="index.html#modelbar">Search New</a><a href="index.html#modelbar">Search Used</a></div></div>`,
    ),
    snippetHtml: `<div class="my-tilegrid">
  <div class="my-tile">
    <img src="#MISCPATH#macan.jpg" width="640" height="640" alt="">
    <div class="my-tile-cover">
      <p>Macan</p>
      <a href="/new-inventory/index.htm?model=Macan">Search New</a>
      <a href="/used-inventory/index.htm?model=Macan">Search Used</a>
    </div>
  </div>
  <!-- repeat the tile for each model. The photo is decorative (alt="") -
       the cover carries the name and the links. -->
</div>`,
  },
  {
    key: 'tilewide',
    title: 'Tile grid, landscape variant',
    note: 'The same skeleton as the INFINITI demo ships it: landscape photos, two across until desktop, three past 992px, square corners, and a permanent dark wash with the name always on the tile. A client variant flips the photos portrait into a full-bleed mosaic (two across, ~112% tall) &mdash; same CSS with the aspect ratio and widths changed.',
    css: `/* Landscape tile grid - 2-across until 992px, then 3. */
.my-tilewide { display: flex; flex-wrap: wrap; gap: 1rem 2%; }
.my-tilewide-unit { position: relative; inline-size: 49%; overflow: hidden; }
@media (min-width: 992px) { .my-tilewide-unit { inline-size: 32%; } }
.my-tilewide-unit img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 16 / 7; object-fit: cover; }

/* Permanent wash; the name sits on the photo at every width. */
.my-tilewide-cover { position: absolute; inset: 0; display: flex; flex-direction: column; gap: 0.15rem; justify-content: flex-end; padding: 0.6rem 0.8rem; color: #fff; background: rgb(0 0 0 / 40%); }
.my-tilewide-cover p { margin: 0; font-weight: 700; }
.my-tilewide-cover a { align-self: flex-start; font-size: 0.85rem; color: #fff; }`,
    rootClass: 'my-tilewide',
    liveUnits: PHOTO_CARDS.slice(0, 3).map(
      ([slug, name]) => `<div class="my-tilewide-unit"><img src="img/${slug}.jpg" width="800" height="500" alt="" loading="lazy" decoding="async" />
              <div class="my-tilewide-cover"><p>${name.replace(/^\d{4} /, '')}</p><a href="index.html#modelbar">Explore</a></div></div>`,
    ),
    snippetHtml: `<div class="my-tilewide">
  <div class="my-tilewide-unit">
    <img src="#MISCPATH#qx60.jpg" width="800" height="350" alt="">
    <div class="my-tilewide-cover">
      <p>QX60</p>
      <a href="/new-inventory/index.htm?model=QX60">Explore</a>
    </div>
  </div>
  <!-- repeat the unit for each model -->
</div>`,
  },
];

const staticSection = () => {
  const demos = STATICS.map((d) => {
    const cls = `sb-${d.key}`;
    // rendered = taught with my- renamed sb- (markup and CSS alike)
    const live = d.liveUnits.map((u) => `            ${u.replaceAll('my-', 'sb-')}`).join('\n');
    return `        <h4 id="${cls}-h" class="strip-label">${d.title}</h4>
        <p class="strip-note">${d.note}</p>
        <div class="${d.rootClass.replaceAll('my-', 'sb-')}">
${live}
        </div>
        <details>
          <summary>Copy this look</summary>
          <p class="copy-lead"><strong>Copy this.</strong> The HTML goes in a Custom HTML block; the CSS goes in the page's <em>Style Only</em> box. No slider install needed &mdash; this one is pure CSS.</p>
          <p class="code-label">HTML</p>
          <pre><code>${esc(d.snippetHtml)}</code></pre>
          <p class="code-label">CSS</p>
          <pre><code>${esc(d.css)}</code></pre>
        </details>`;
  }).join('\n');
  return `      <section class="demo-section demo-wide" id="static-bars">
        <h3 id="static-bars-h">Model bars that are not sliders</h3>
        <p class="demo-sub">
          A recurring official family, not a one-off: several OEMs ship their model bar as a static grid or tab panes with no carousel at all. Porsche and INFINITI run hover-reveal tile grids, one
          Ford variant is a plain CSS grid (<a href="index.html#modelbar">see the main page's ladder table</a>), BMW's is tab panes with a text rail &mdash; one pane per model, and on phones it
          simply becomes a stacked list (the <a href="index.html#modelbar-tabs">tabs demo</a> shows the wiring). And clients drift here too: one Nissan store replaced its slider with a tabbed
          static grid. If a request says &ldquo;model bar&rdquo;, check which family before reaching for the slider.
        </p>
${demos}
      </section>`;
};

// Strip /* ... */ comments (multi-line included) from taught CSS before it
// becomes live CSS — a line-based filter once left a dangling `*/` that
// silently voided the rule after it.
const stripComments = (css) =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s*\n/, '');

const staticCss = STATICS.map((d) => stripComments(d.css).replaceAll('.my-', '.sb-')).join('\n\n');

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
  const tabbed = s.tabbed ? `\n${TABBED_CSS}` : '';
  return `/* ${s.recipeName ?? `${v.toc} ladder`} - ${v.sites === 1 ? '1 site runs' : `${v.sites} sites run`} exactly this. */\n${rungs}\n\n${dots}${auto}\n\n${SKINS[s.skin].cardCss}${tabbed}`;
};

// Tab chrome for tabbed strips (Chevrolet ships this way): pipe-separated
// labels, blue underline on the active tab — the real site's look.
const TABBED_CSS = `
/* The tabs: pipe-separated labels, blue underline on the active one. The tab
   SCRIPT is the standard one - copy it from the tabs demo on the main page. */
.my-modelbar-tablist { display: flex; flex-wrap: wrap; justify-content: center; margin: 0 0 1rem; }
.my-modelbar-tab { padding: 0.3rem 1.25rem; font: inherit; font-size: 1.1rem; color: #222; cursor: pointer; background: none; border: 0; border-block-end: 3px solid transparent; }
.my-modelbar-tab + .my-modelbar-tab { border-inline-start: 1px solid #c8ccd2; }
.my-modelbar-tab[aria-selected="true"] { font-weight: 600; border-block-end-color: #006dc7; }
.my-modelbar-tab:focus-visible { outline: 3px solid #16324f; outline-offset: 2px; }`;

const stripId = (v, i) => (v.strips.length === 1 ? `mbx-${v.key}` : `mbx-${v.key}-${i}`);

// Live style block: each strip's recipe with .my-modelbar → its unique class.
const liveCss = VARIANTS.flatMap((v) => v.strips.map((s, i) => stripComments(recipeCss(v, s)).replaceAll('.my-modelbar', `.${stripId(v, i)}`))).join('\n\n');

const strip = (v, s, i) => {
  const id = stripId(v, i);
  const labelId = `${id}-h`;
  const heading = v.strips.length === 1 ? '' : `        <h4 id="${labelId}" class="strip-label">${s.label}</h4>\n`;
  const note = v.strips.length === 1 ? `        <p class="strip-note">${s.label}.</p>\n` : '';
  const aria = v.strips.length === 1 ? `aria-labelledby="${v.key}-h"` : `aria-labelledby="${labelId}"`;
  const attrs = `data-slider data-step="slide"${s.autoplay ? ` data-autoplay="${s.autoplay}"` : ''}`;
  const roster = s.roster ?? v.roster ?? CHEVY;
  const snippetHtml = typeof SKINS[s.skin].snippetHtml === 'function' ? SKINS[s.skin].snippetHtml(roster) : SKINS[s.skin].snippetHtml;
  if (s.tabbed) return tabbedStrip(v, s, i, { id, heading, note, roster, snippetHtml });
  const slides = SKINS[s.skin]
    .liveSlides(roster)
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
      ${snippetHtml}
    </li>
    <!-- repeat the <li> for each model -->
  </ul>
</div>`)}</code></pre>
          <p class="code-label">CSS</p>
          <pre><code>${esc(recipeCss(v, s))}</code></pre>
        </details>`;
};

// A tabbed strip: the real Chevrolet presentation — body-style tabs, each
// pane its own auto-inited carousel on the same ladder. Uses the shared
// [data-tabs] APG handler from assets/demo.js.
const tabbedStrip = (v, s, i, { id, heading, note, roster, snippetHtml }) => {
  const tabs = s.tabbed.labels
    .map(
      (label, t) =>
        `            <button type="button" role="tab" id="${id}-tab-${t}" aria-controls="${id}-pane-${t}" aria-selected="${t === 0 ? 'true' : 'false'}" class="${id}-tab">${label}</button>`,
    )
    .join('\n');
  const panes = s.tabbed.labels
    .map((label, t) => {
      const picks = s.tabbed.panes[t].map((n) => roster[n]);
      const slides = SKINS[s.skin]
        .liveSlides(picks)
        .map((a) => `              <li class="dl-carousel-slide">${a.replaceAll('my-modelbar', id)}</li>`)
        .join('\n');
      return `          <div role="tabpanel" id="${id}-pane-${t}" aria-labelledby="${id}-tab-${t}"${t === 0 ? '' : ' hidden'}>
            <div class="dl-carousel ${id}" data-slider data-step="slide" aria-label="Chevrolet ${label}">
              <ul class="dl-carousel-track">
${slides}
              </ul>
            </div>
          </div>`;
    })
    .join('\n');
  return `${heading}${note}        <div class="${id}-tabs" data-tabs>
          <div role="tablist" aria-label="Models by body style" class="${id}-tablist">
${tabs}
          </div>
${panes}
        </div>
        <details>
          <summary>Copy this look</summary>
          <p class="copy-lead">
            <strong>Copy this.</strong> The HTML goes in a Custom HTML block; the CSS goes in the page's <em>Style Only</em> box. Add
            <a href="index.html#start">the slider itself</a> first &mdash; once per page &mdash; and take the small tabs script from the
            <a href="index.html#modelbar-tabs">tabs demo</a>, which shows this exact wiring.
          </p>
          <p class="code-label">HTML</p>
          <pre><code>${esc(`<div class="my-modelbar-tabs" data-tabs>
  <div role="tablist" aria-label="Models by body style" class="my-modelbar-tablist">
    <button type="button" role="tab" id="tab-trucks" aria-controls="pane-trucks" aria-selected="true" class="my-modelbar-tab">${s.tabbed.labels[0]}</button>
    <button type="button" role="tab" id="tab-electric" aria-controls="pane-electric" aria-selected="false" class="my-modelbar-tab">${s.tabbed.labels[1]}</button>
    <!-- one tab per group -->
  </div>
  <div role="tabpanel" id="pane-trucks" aria-labelledby="tab-trucks">
    <div class="my-modelbar dl-carousel" data-slider data-step="slide" aria-label="${s.tabbed.labels[0]}">
      <ul class="dl-carousel-track">
        <li class="dl-carousel-slide">
          ${snippetHtml}
        </li>
        <!-- repeat the <li> for each model in this group -->
      </ul>
    </div>
  </div>
  <div role="tabpanel" id="pane-electric" aria-labelledby="tab-electric" hidden>
    <!-- same structure - one pane (with its own carousel) per tab. Models may
         repeat across panes; the real sites do exactly that. -->
  </div>
</div>`)}</code></pre>
          <p class="code-label">CSS</p>
          <pre><code>${esc(recipeCss(v, s))}</code></pre>
        </details>`;
};

const section = (v) => `      <section class="demo-section demo-wide" id="${v.key}">
        <h3 id="${v.key}-h">${v.heading ?? `The ${v.toc} ladder`} &mdash; ${v.sites === 1 ? '1 site' : `${v.sites} sites`}</h3>
        <p class="demo-sub">${v.why} Runs on ${esc(v.demos)}.${v.ladder ? ` Cards per view: ${ladderText(v.ladder)}.` : ''}</p>
${v.strips.map((s, i) => strip(v, s, i)).join('\n')}
      </section>`;

// The page's bands: same grouped-architecture chrome the main demo uses
// (assets/demo.css), one navy rule per band. Groups take the h2 slot;
// sections sit at h3, strip labels at h4.
const PAGE_GROUPS = [
  {
    g: 'shared',
    title: 'The shared ladders',
    desc: 'Worn by two sites or more &mdash; find your brand here first. Ordered by how many sites run each ladder.',
    keys: ['acura', 'chevrolet', 'lexus', 'buick', 'genesis', 'lincoln', 'cdjr', 'hyundai', 'ford', 'mazda', 'toyota'],
  },
  {
    g: 'single',
    title: 'The one-site ladders',
    desc: 'Each of these runs on exactly one demo &mdash; the niche brands and the newest arrivals.',
    keys: ['alfaromeo', 'audi', 'powersports-cat', 'powersports-brands', 'ferrari', 'ferrari-photo'],
  },
  {
    g: 'special',
    title: 'The specialty strips',
    desc: 'Centre-mode worn as a model bar, and the rails a multi-rooftop group site runs instead of one.',
    keys: ['maserati', 'group'],
  },
];
const byKey = Object.fromEntries(VARIANTS.map((v) => [v.key, v]));
const groupedSections = PAGE_GROUPS.map(
  (G) => `      <section class="demo-group" aria-labelledby="g-${G.g}-h">
        <header class="demo-group-head">
          <h2 id="g-${G.g}-h">${G.title}</h2>
          <p>${G.desc}</p>
        </header>

${G.keys.map((k) => section(byKey[k])).join('\n\n')}
      </section>`,
).join('\n\n');

// Shared resource footer — one string, emitted onto both generated pages
// (demo/index.html carries its own copy with an extra Notes column).
const FOOT = `    <footer class="demo-foot">
      <div class="demo-foot-inner">
        <div>
          <h2>This library</h2>
          <ul>
            <li><a href="index.html">Examples &mdash; every pattern, live</a></li>
            <li><a href="model-bars.html">Model bar library &mdash; every ladder and look</a></li>
            <li><a href="brands.html">Find your brand &mdash; the OEM directory</a></li>
            <li><a href="index.html#options">Options reference</a></li>
          </ul>
        </div>
        <div>
          <h2>Research &amp; docs</h2>
          <ul>
            <li><a href="../docs/catalog/oem-slider-census.html">The OEM slider census</a></li>
            <li><a href="../docs/catalog/model-bar-library.html">Screenshot library of the real sites</a></li>
            <li><a href="https://github.com/stevenpelletier90/custom-slider#readme">README &mdash; full API and verification checklist</a></li>
            <li><a href="https://github.com/stevenpelletier90/custom-slider/blob/master/docs/cms-implementation.md">CMS install notes + conditional loader</a></li>
          </ul>
          <p><a class="demo-top" href="#main">Back to top &#8593;</a></p>
        </div>
      </div>
    </footer>`;

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
      /* The non-slider family — same rendered-equals-taught rule. */
${staticCss
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
        <a href="brands.html">Find your brand</a>
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
${PAGE_GROUPS.map((G) => `        <p class="demo-toc-group"><strong>${G.title}:</strong> ${G.keys.map((k) => `<a href="#${k}">${byKey[k].toc} (${byKey[k].sites})</a>`).join(' &middot; ')}</p>`).join('\n')}
        <p class="demo-toc-group"><strong>Not the standard design:</strong> <a href="#static-bars">Not sliders</a> &middot; <a href="#outliers">The outliers</a></p>
      </nav>

${groupedSections}

      <section class="demo-group" aria-labelledby="g-beyond-h">
        <header class="demo-group-head">
          <h2 id="g-beyond-h">Not the standard design</h2>
          <p>The official non-slider family, and the census entries whose live builds sit on the main demo page.</p>
        </header>

${staticSection()}

      <section class="demo-section" id="outliers">
        <h3>The outliers &mdash; not this design</h3>
        <p class="demo-sub">A few census entries are not the standard model bar. Each one is already demonstrated live on the main page.</p>
        <ul>
          <li><strong>Kia demo 1</strong> and the <strong>Lexus and Nissan quick-navs</strong> are centre-mode: the active card sits centred with neighbours peeking. That is the <a href="index.html#peek">peek pattern</a> with the peek turned right up &mdash; and it now has company as a model bar proper: the <a href="#maserati">Maserati spotlight</a> above is the same recipe.</li>
          <li><strong>Hyundai demo 1</strong> folds the lineup into two rows &mdash; the <a href="index.html#grid">two-row grid</a>.</li>
          <li><strong>Subaru&rsquo;s strip</strong> is content cards stepping a whole page at a time &mdash; the default behaviour shown by <a href="index.html#vehicles">featured vehicles</a>.</li>
          <li><strong>Ford demo 5</strong> has no slider at all: a static flex-wrap grid of models, six across on desktop down to two on phones. Once a one-off, now a documented family &mdash; see <a href="#static-bars">model bars that are not sliders</a> above.</li>
        </ul>
      </section>
      </section>

      <p>Back to <a href="index.html">the main demo</a>. Ladder data: <a href="https://github.com/stevenpelletier90/custom-slider/blob/master/docs/research/2026-08-18-oem-demo-slider-census.md">the OEM demo slider census</a>, fingerprinted 18&ndash;19 Aug 2026.</p>
    </main>
${FOOT}
    <!-- Copy buttons, the section jump, and the scrollspy come from assets/demo.js, shared with the main demo page. -->
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

// ---- demo/brands.html — the per-brand directory ----------------------------
// One row per brand a designer might be handed: what its model bar IS, its
// tiers, where on the demo pages to copy it, and the official example site.
// Emitted from the same script as the library so the two can never disagree.
const BRANDS = [
  ['Acura', 'Slider', '2 / 3 / 5', [['model-bars.html#acura', 'Acura ladder']], 'acurademo1'],
  ['Alfa Romeo', 'Slider — tall photo tiles with a CTA', '1 / 2 / 3 / 4 / 6', [['model-bars.html#alfaromeo', 'Alfa Romeo ladder']], 'alfaromeodemo1'],
  ['Audi', 'Slider', '1 / 2 / 3 / 4 / 6', [['model-bars.html#audi', 'Audi ladder']], 'audidemo1'],
  [
    'BMW',
    'Tab panes; a static stacked list on phones — no slider',
    '&mdash;',
    [
      ['model-bars.html#static-bars', 'Not-sliders family'],
      ['index.html#modelbar-tabs', 'tab wiring'],
    ],
    'bmwdemo1',
  ],
  ['Buick', 'Slider', '2 / 3 / 4', [['model-bars.html#buick', 'Buick ladder']], 'buickdemo1'],
  ['Cadillac', 'Slider under body-style tabs, dark band', '2 / 3 / 4 / 5', [['model-bars.html#chevrolet', 'Chevrolet ladder, dark look']], 'cadillacdemo1'],
  [
    'Chevrolet',
    'Tabbed slider (tabs are the official version since Nov 2025)',
    '2 / 3 / 4 / 5',
    [
      ['model-bars.html#chevrolet', 'Chevrolet ladder'],
      ['index.html#modelbar-tabs', 'tab wiring'],
    ],
    'chevroletdemo1',
  ],
  ['Chrysler / Dodge / Jeep / Ram', 'Brand-logo tabs over sliders on a dark band', '2 / 3 / 6', [['model-bars.html#cdjr', 'CDJR ladder']], 'cdjrdemo1'],
  [
    'Ferrari',
    'Slider — wordmark band, or lifestyle photo cards',
    '1 / 3 &middot; 1 / 2 / 3 / 4',
    [
      ['model-bars.html#ferrari', 'Ferrari band'],
      ['model-bars.html#ferrari-photo', 'photo cards'],
    ],
    'ferraridemo1',
  ],
  ['Fiat', 'Rides the CDJR bar (Fiat-including variant)', '2 / 3 / 6', [['model-bars.html#cdjr', 'CDJR ladder']], 'cdjrdemo1'],
  [
    'Ford',
    'Slider, a static CSS grid, and a tabbed version',
    '1 / 3 / 5',
    [
      ['model-bars.html#ford', 'Ford ladder'],
      ['model-bars.html#static-bars', 'static grid'],
    ],
    'forddemo3',
  ],
  ['Genesis', 'Tabbed slider with inventory counts', '1 / 2 / 3 / 4 (new platform: 1 / 2 / 3)', [['model-bars.html#genesis', 'Genesis ladder']], 'genesisdemo1'],
  [
    'GMC',
    'Tabs; the slick version rides the Acura tiers',
    '2 / 3 / 5',
    [
      ['model-bars.html#acura', 'Acura ladder'],
      ['index.html#modelbar-tabs', 'tab wiring'],
    ],
    'gmcdemo1',
  ],
  ['Group sites', 'Autoplaying make-logo and rooftop-location rails', '2 / 4 / 7 &middot; 1 / 2 / 4', [['model-bars.html#group', 'Group-site strips']], 'groupdemo1'],
  ['Honda', 'Slider (plus a tabbed variant)', '2 / 3 / 5', [['model-bars.html#acura', 'Acura ladder']], 'hondademo4'],
  ['Hyundai', 'Slider, and a tabbed version', '1 / 3 / 4 / 5', [['model-bars.html#hyundai', 'Hyundai ladder']], 'hyundaidemo1'],
  ['INFINITI', 'Static tile grid — no slider', '2 / 2 / 3 across', [['model-bars.html#static-bars', 'tile-grid family']], 'infinitidemo1'],
  ['Jaguar', 'Slider — photo cards with a tagline', '2 / 3 / 4', [['model-bars.html#buick', 'Buick ladder']], 'jaguardemo3'],
  [
    'Kia',
    'Slider; a tabbed version; and a centre-mode version',
    '2 / 3 / 5',
    [
      ['model-bars.html#acura', 'Acura ladder'],
      ['index.html#peek', 'centre mode'],
    ],
    'kiademo3',
  ],
  ['Land Rover', 'Slider — photo cards with a tagline', '2 / 3 / 4', [['model-bars.html#buick', 'Buick ladder']], 'landroverdemo3'],
  ['Lexus', 'Tabbed slider; the v2 look rides the Acura tiers', '1 / 2 / 3 / 5', [['model-bars.html#lexus', 'Lexus ladder']], 'lexusdemo1'],
  ['Lincoln', 'Slider', '2 / 3 / 4', [['model-bars.html#lincoln', 'Lincoln ladder']], 'lincolndemo2'],
  ['Maserati', 'Spotlight slider — one huge centred card', '1-up centre mode', [['model-bars.html#maserati', 'Maserati spotlight']], 'maseratidemo4'],
  ['Mazda', 'Tabbed slider — and it keeps its dots', '1 / 2 / 3', [['model-bars.html#mazda', 'Mazda ladder']], 'mazdademo1'],
  ['Mitsubishi', 'Slider', '2 / 3 / 5', [['model-bars.html#acura', 'Acura ladder']], 'mitsubishidemo1'],
  ['Nissan', 'Tabbed slider', '1 / 2 / 3 / 5', [['model-bars.html#lexus', 'Lexus ladder']], 'nissandemo1'],
  ['Porsche', 'Hover-reveal photo tile grid — no slider', '2 / 3 / 6 across', [['model-bars.html#static-bars', 'tile-grid family']], 'porschedemo1'],
  [
    'Powersports',
    'Category bar and a brand-logo strip',
    '2 / 3 / 5 &middot; 2 / 3 / 6',
    [
      ['model-bars.html#powersports-cat', 'category bar'],
      ['model-bars.html#powersports-brands', 'brand strip'],
    ],
    'powersportsdemo2',
  ],
  ['Subaru', 'Tabbed slider (icon tabs)', '2 / 3 / 4 / 5', [['model-bars.html#chevrolet', 'Chevrolet ladder']], 'subarudemo2'],
  [
    'Toyota',
    'Slider (photo cards) plus three tabbed versions on the Lexus tiers',
    '1 / 2 own &middot; 1 / 2 / 3 / 5',
    [
      ['model-bars.html#toyota', 'Toyota photo cards'],
      ['model-bars.html#lexus', 'Lexus ladder'],
    ],
    'toyotademo1',
  ],
  ['Volkswagen', 'Tabbed slider — a colour tile behind each car', '1 / 2 / 3 / 4', [['model-bars.html#genesis', 'Genesis ladder, tile look']], 'vwdemo1'],
  ['Volvo', 'Slider', '2 / 3 / 4 / 5', [['model-bars.html#chevrolet', 'Chevrolet ladder']], 'volvodemo1'],
];

const brandRows = BRANDS.map(
  ([brand, what, tiers, copies, host]) => `            <tr>
              <th scope="row">${brand}</th>
              <td>${what}</td>
              <td>${tiers}</td>
              <td>${copies.map(([href, label]) => `<a href="${href}">${label}</a>`).join(' &middot; ')}</td>
              <td><a href="https://${host}.dealeron.com/">${host}</a></td>
            </tr>`,
).join('\n');

const brandsPage = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Custom Slider — find your brand</title>
    <meta name="description" content="Every OEM's model bar in one directory: what it runs, its cards-per-view tiers, where to copy it from, and the official example site." />
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
      /* Page chrome shared with the other demo pages lives in assets/demo.css. */
      .brand-filter {
        max-inline-size: 22rem;
        margin-block: 1rem 0.35rem;
      }
      .brand-filter label {
        display: block;
        margin-block-end: 0.25rem;
        font-size: 0.85rem;
        font-weight: 600;
      }
      .brand-filter input {
        inline-size: 100%;
        padding: 0.5rem 0.7rem;
        font: inherit;
        border: 1px solid #c4ced8;
        border-radius: 6px;
      }
      .brand-filter input:focus-visible {
        outline: 3px solid #16324f;
        outline-offset: 2px;
      }
      .brand-table {
        inline-size: 100%;
        min-inline-size: 46rem;
        border-collapse: collapse;
      }
      .brand-table th,
      .brand-table td {
        padding: 0.55rem 0.7rem;
        font-size: 0.9rem;
        text-align: start;
        vertical-align: top;
        border-block-end: 1px solid #dde3e9;
      }
      .brand-table thead th {
        font-size: 0.72rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #5f6368;
      }
      .brand-table tbody th {
        white-space: nowrap;
      }
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
        <a href="model-bars.html">Model bar library</a>
        <a href="brands.html" aria-current="page">Find your brand</a>
      </nav>
    </header>
    <main id="main">
      <h1>Find your brand</h1>
      <p class="demo-lede">
        Handed a site and told &ldquo;add the model bar&rdquo;? Look the brand up here: what its bar actually is (a slider, a tabbed slider, or no slider at all), how many cards it shows at each
        width, where on these pages to copy the finished build, and the official example site to compare against.
      </p>
      <div class="brand-filter">
        <label for="brand-q">Filter brands</label>
        <input id="brand-q" type="text" autocomplete="off" placeholder="e.g. Kia, tabs, no slider" />
        <p class="demo-vh" role="status" id="brand-count"></p>
      </div>
      <div class="demo-scroll">
        <table class="brand-table">
          <thead>
            <tr>
              <th scope="col">Brand</th>
              <th scope="col">What its model bar is</th>
              <th scope="col">Cards per view</th>
              <th scope="col">Copy it from</th>
              <th scope="col">Official example</th>
            </tr>
          </thead>
          <tbody>
${brandRows}
          </tbody>
        </table>
      </div>
      <p>
        Ladders and looks all run live on the <a href="model-bars.html">model bar library</a>; generic patterns and the install step live on <a href="index.html">the main demo</a>. Sites named here
        are internal demo sites, safe to open and compare against.
      </p>
    </main>
${FOOT}
    <script>
      // Type-to-filter: hides rows whose text doesn't match; announces the
      // count to screen readers. With JS off the full table simply stands.
      addEventListener('DOMContentLoaded', () => {
        const q = document.getElementById('brand-q');
        const status = document.getElementById('brand-count');
        const rows = [...document.querySelectorAll('.brand-table tbody tr')];
        q.addEventListener('input', () => {
          const term = q.value.trim().toLowerCase();
          let shown = 0;
          for (const row of rows) {
            const hit = !term || row.textContent.toLowerCase().includes(term);
            row.hidden = !hit;
            if (hit) shown += 1;
          }
          status.textContent = term ? shown + ' of ' + rows.length + ' brands shown' : '';
        });
      });
    </script>
  </body>
</html>
`;

fs.writeFileSync('demo/brands.html', brandsPage);
console.log('demo/brands.html written:', BRANDS.length, 'brands');
