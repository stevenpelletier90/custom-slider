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
  `<img src="img/chrome-${slug}.webp" srcset="img/chrome-${slug}.webp 320w, img/chrome-${slug}-640.webp 640w" sizes="(min-width: 1024px) 250px, (min-width: 640px) 30vw, 45vw" width="320" height="240" alt="${alt}" loading="lazy" decoding="async" />`;

// Each skin: how the estate actually dresses the bar (see the screenshot
// library). cardCss is the copy-paste CSS below the ladder lines; liveSlides
// and snippetHtml are the same markup — real sources vs. platform tokens.
const SKINS = {
  white: {
    cardCss: `/* Flex column grounded at the bottom: cards whose photos have different
   aspect ratios still align their captions, and the cars share a ground line. */
.my-modelbar-card { display: flex; flex-direction: column; justify-content: flex-end; block-size: 100%; color: inherit; text-align: center; text-decoration: none; }
.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; }
.my-modelbar-card p { margin: 0.25rem 0 0; font-weight: 600; }

/* Soft white arrow discs instead of the engine's gray defaults, a gentle
   cutout lift on hover/focus (transform only - no layout shift), and a
   visible focus ring. */
.my-modelbar { --dlc-arrow-fg: #222; --dlc-arrow-bg: rgba(255, 255, 255, 0.92); }
.my-modelbar .dl-carousel-arrow { box-shadow: 0 1px 6px rgb(0 0 0 / 20%); }
.my-modelbar-card img { transition: transform 0.25s ease; }
.my-modelbar-card:hover img, .my-modelbar-card:focus-visible img { transform: scale(1.04); }
@media (prefers-reduced-motion: reduce) { .my-modelbar-card img { transition: none; } }
.my-modelbar-card:focus-visible { outline: 3px solid currentcolor; outline-offset: 3px; }`,
    liveSlides: (r) => r.map((e) => `<a class="my-modelbar-card" href="index.html#modelbar" aria-label="Explore the ${e.name}">${imgTag(e)}<p>${e.name}</p></a>`),
    snippetHtml: (r) => `<a class="my-modelbar-card" href="/searchnew.aspx?Model=${r[0].name}" aria-label="Explore the ${r[0].name}">
        <img src="#CHROMEPHOTOPATH|StyleID|1|640p#" width="320" height="240" alt="${r[0].alt}">
        <p>${r[0].name}</p>
      </a>`,
  },
  'band-gray': {
    cardCss: `.my-modelbar { padding-block: 1.5rem; background: linear-gradient(#e9e9e9, #f9f9f9); }
.my-modelbar-card { display: block; color: #222; text-align: center; text-decoration: none; }
.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; }
.my-modelbar-card p { margin: 0.25rem 0 0; font-size: 0.85rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }
.my-modelbar { --dlc-arrow-fg: #222; --dlc-arrow-bg: rgba(255, 255, 255, 0.92); }
.my-modelbar .dl-carousel-arrow { box-shadow: 0 1px 6px rgb(0 0 0 / 20%); }
.my-modelbar-card img { transition: transform 0.25s ease; }
.my-modelbar-card:hover img, .my-modelbar-card:focus-visible img { transform: scale(1.04); }
@media (prefers-reduced-motion: reduce) { .my-modelbar-card img { transition: none; } }
.my-modelbar-card:focus-visible { outline: 3px solid currentcolor; outline-offset: 3px; }`,
    liveSlides: (r) => r.map((e) => `<a class="my-modelbar-card" href="index.html#modelbar" aria-label="Explore the ${e.name}">${imgTag(e)}<p>${e.name}</p></a>`),
    snippetHtml: (r) => `<a class="my-modelbar-card" href="/searchnew.aspx?Model=${r[0].name}" aria-label="Explore the ${r[0].name}">
        <img src="#CHROMEPHOTOPATH|StyleID|1|640p#" width="320" height="240" alt="${r[0].alt}">
        <p>${r[0].name}</p>
      </a>`,
  },
  'band-flat': {
    cardCss: `.my-modelbar { padding-block: 1.5rem; background: #f2f2f2; }
.my-modelbar-card { display: block; color: #444649; text-align: center; text-decoration: none; }
.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; }
.my-modelbar-card p { margin: 0.5rem 0 0; font-size: 0.85rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; }
.my-modelbar { --dlc-arrow-fg: #222; --dlc-arrow-bg: rgba(255, 255, 255, 0.92); }
.my-modelbar .dl-carousel-arrow { box-shadow: 0 1px 6px rgb(0 0 0 / 20%); }
.my-modelbar-card img { transition: transform 0.25s ease; }
.my-modelbar-card:hover img, .my-modelbar-card:focus-visible img { transform: scale(1.04); }
@media (prefers-reduced-motion: reduce) { .my-modelbar-card img { transition: none; } }
.my-modelbar-card:focus-visible { outline: 3px solid currentcolor; outline-offset: 3px; }`,
    liveSlides: (r) => r.map((e) => `<a class="my-modelbar-card" href="index.html#modelbar" aria-label="Explore the ${e.name}">${imgTag(e)}<p>${e.name}</p></a>`),
    snippetHtml: (r) => `<a class="my-modelbar-card" href="/searchnew.aspx?Model=${r[0].name}" aria-label="Explore the ${r[0].name}">
        <img src="#CHROMEPHOTOPATH|StyleID|1|640p#" width="320" height="240" alt="${r[0].alt}">
        <p>${r[0].name}</p>
      </a>`,
  },
  counts: {
    cardCss: `.my-modelbar-card { display: block; color: inherit; text-align: center; text-decoration: none; }
.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; }
.my-modelbar-card p { margin: 0.25rem 0 0; font-size: 1.05rem; font-weight: 600; }
.my-modelbar-card small { display: block; margin-block-start: 0.1rem; font-size: 0.8rem; color: #5f6368; letter-spacing: 0.02em; }
.my-modelbar { --dlc-arrow-fg: #222; --dlc-arrow-bg: rgba(255, 255, 255, 0.92); }
.my-modelbar .dl-carousel-arrow { box-shadow: 0 1px 6px rgb(0 0 0 / 20%); }
.my-modelbar-card img { transition: transform 0.25s ease; }
.my-modelbar-card:hover img, .my-modelbar-card:focus-visible img { transform: scale(1.04); }
@media (prefers-reduced-motion: reduce) { .my-modelbar-card img { transition: none; } }
.my-modelbar-card:focus-visible { outline: 3px solid currentcolor; outline-offset: 3px; }`,
    liveSlides: (r) => r.map((e) => `<a class="my-modelbar-card" href="index.html#modelbar">${imgTag(e)}<p>${e.name}</p><small>${e.count ?? 12} Available</small></a>`),
    snippetHtml: (r) => `<a class="my-modelbar-card" href="/searchnew.aspx?Model=${r[0].name}">
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
.my-modelbar-card p { margin: 0.4rem 0 0; font-weight: 700; }
.my-modelbar { --dlc-arrow-fg: #222; --dlc-arrow-bg: rgba(255, 255, 255, 0.92); }
.my-modelbar .dl-carousel-arrow { box-shadow: 0 1px 6px rgb(0 0 0 / 20%); }
.my-modelbar-card img { transition: transform 0.25s ease; }
.my-modelbar-card:hover img, .my-modelbar-card:focus-visible img { transform: scale(1.04); }
@media (prefers-reduced-motion: reduce) { .my-modelbar-card img { transition: none; } }
.my-modelbar-card:focus-visible { outline: 3px solid currentcolor; outline-offset: 3px; }`,
    liveSlides: () =>
      CUTOUTS.map(
        ([slug, name, alt], i) =>
          `<a class="my-modelbar-card${i === 2 ? ' my-modelbar-card--feature' : ''}" href="index.html#modelbar" aria-label="Explore the ${name}"><span class="my-modelbar-tile">${cutoutImg(slug, alt)}</span><p>${name}</p></a>`,
      ),
    snippetHtml: `<a class="my-modelbar-card" href="/searchnew.aspx?Model=Atlas" aria-label="Explore the Atlas">
        <span class="my-modelbar-tile"><img src="#CHROMEPHOTOPATH|StyleID|1|640p#" width="320" height="240" alt="2026 Volkswagen Atlas"></span>
        <p>Atlas</p>
      </a>
      <!-- add my-modelbar-card--feature to the card you want on the navy tile -->`,
  },
  'band-dark': {
    cardCss: `.my-modelbar { padding-block: 1.75rem; background: #101010; }
/* a 40% scrim disc keeps the white chevron visible over silver cutouts */
.my-modelbar { --dlc-arrow-bg: rgba(0, 0, 0, 0.4); --dlc-arrow-fg: #fff; }
.my-modelbar-card { display: block; color: #fff; text-align: center; text-decoration: none; }
.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; }
.my-modelbar-card p { margin: 0.5rem 0 0; font-size: 0.85rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; }
.my-modelbar-card img { transition: transform 0.25s ease; }
.my-modelbar-card:hover img, .my-modelbar-card:focus-visible img { transform: scale(1.04); }
@media (prefers-reduced-motion: reduce) { .my-modelbar-card img { transition: none; } }
.my-modelbar-card:focus-visible { outline: 3px solid currentcolor; outline-offset: 3px; }`,
    liveSlides: () => CUTOUTS.map(([slug, name, alt]) => `<a class="my-modelbar-card" href="index.html#modelbar" aria-label="Explore the ${name}">${cutoutImg(slug, alt)}<p>${name}</p></a>`),
    snippetHtml: `<a class="my-modelbar-card" href="/searchnew.aspx?Model=LYRIQ" aria-label="Explore the LYRIQ">
        <img src="#CHROMEPHOTOPATH|StyleID|1|640p#" width="320" height="240" alt="2026 Cadillac LYRIQ">
        <p>LYRIQ</p>
      </a>`,
  },
  'name-top-chip': {
    cardCss: `.my-modelbar-card { display: flex; flex-direction: column; color: #222; text-align: center; text-decoration: none; }
.my-modelbar-card p { order: -1; margin: 0 0 0.5rem; font-size: 0.95rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; }
.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; }
.my-modelbar-card small { align-self: center; margin-block-start: 0.75rem; padding: 0.35rem 0.9rem; font-size: 0.7rem; color: #55585c; letter-spacing: 0.14em; text-transform: uppercase; background: #f2f2f2; border-radius: 2px; }
.my-modelbar-card:hover small, .my-modelbar-card:focus-visible small { background: #e2e2e2; }
.my-modelbar { --dlc-arrow-fg: #222; --dlc-arrow-bg: rgba(255, 255, 255, 0.92); }
.my-modelbar .dl-carousel-arrow { box-shadow: 0 1px 6px rgb(0 0 0 / 20%); }
.my-modelbar-card img { transition: transform 0.25s ease; }
.my-modelbar-card:hover img, .my-modelbar-card:focus-visible img { transform: scale(1.04); }
@media (prefers-reduced-motion: reduce) { .my-modelbar-card img { transition: none; } }
.my-modelbar-card:focus-visible { outline: 3px solid currentcolor; outline-offset: 3px; }`,
    liveSlides: (r) => r.map((e) => `<a class="my-modelbar-card" href="index.html#modelbar">${imgTag(e)}<p>${e.name}</p><small>${e.count ?? 9} Available</small></a>`),
    snippetHtml: `<a class="my-modelbar-card" href="/searchnew.aspx?Model=CX-5">
        <img src="#CHROMEPHOTOPATH|StyleID|1|640p#" width="320" height="240" alt="2026 Mazda CX-5">
        <p>Mazda CX-5</p>
        <small>108 Available</small>
      </a>`,
  },
  'photo-card': {
    cardCss: `/* Verified live 19 Aug: a split card - photo on the left half, dark panel on
   the right with year | count, a big name, and a white Shop Now pill. */
.my-modelbar { --dlc-gap: 1.5rem; }
.my-modelbar-card { display: flex; overflow: hidden; color: #fff; text-decoration: none; background: #2f2f2f; border-radius: 8px; }
/* the copy column must be allowed to shrink, or long names clip on phones */
.my-modelbar-copy { min-inline-size: 0; }
@media (max-width: 600px) { .my-modelbar-copy { gap: 0.35rem; padding: 1rem; } .my-modelbar-copy .my-modelbar-name { font-size: 1.15rem; } .my-modelbar-shop { padding: 0.45rem 1rem; font-size: 0.8rem; white-space: nowrap; } }
.my-modelbar-card img { inline-size: 48%; block-size: auto; align-self: stretch; object-fit: cover; }
.my-modelbar-copy { display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start; padding: 1.4rem 1.5rem; }
.my-modelbar-copy small { font-size: 0.85rem; color: #d9d9d9; letter-spacing: 0.03em; }
.my-modelbar-copy .my-modelbar-name { margin: 0; font-size: 1.5rem; font-weight: 700; }
.my-modelbar-shop { margin-block-start: auto; padding: 0.5rem 1.3rem; font-size: 0.9rem; font-weight: 600; color: #222; background: #fff; border-radius: 999px; transition: background 0.2s; }
.my-modelbar-card:hover .my-modelbar-shop, .my-modelbar-card:focus-visible .my-modelbar-shop { background: #e6e6e6; }
.my-modelbar { --dlc-arrow-fg: #222; --dlc-arrow-bg: rgba(255, 255, 255, 0.92); }
.my-modelbar .dl-carousel-arrow { box-shadow: 0 1px 6px rgb(0 0 0 / 20%); }
.my-modelbar-card:focus-visible { outline: 3px solid currentcolor; outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) { .my-modelbar-shop { transition: none; } }`,
    liveSlides: (r) =>
      r.map((e) => {
        const year = (e.alt.match(/\b(20\d\d)\b/) || [])[1];
        return `<a class="my-modelbar-card" href="index.html#vehicles">${imgTag(e)}<span class="my-modelbar-copy"><small>${year ? `${year} | ` : ''}${e.count ?? 5} Available</small><p class="my-modelbar-name">${e.name}</p><span class="my-modelbar-shop">Shop Now</span></span></a>`;
      }),
    snippetHtml: `<a class="my-modelbar-card" href="/searchnew.aspx?Model=Highlander">
        <img src="#MISCPATH#/highlander.jpg" width="800" height="500" alt="Blue Toyota Highlander on a forest road">
        <span class="my-modelbar-copy">
          <small>2026 | 4 Available</small>
          <h3 class="my-modelbar-name">Highlander</h3>
          <span class="my-modelbar-shop">Shop Now</span>
        </span>
      </a>`,
  },
  'tall-tile': {
    cardCss: `.my-modelbar { --dlc-gap: 1.25rem; padding: 1.5rem; background: #14161b; }
.my-modelbar { --dlc-arrow-bg: rgba(0, 0, 0, 0.4); --dlc-arrow-fg: #fff; }
.my-modelbar-card { display: block; color: #fff; text-align: center; text-decoration: none; }
.my-modelbar-name { margin: 0 0 0.5rem; font-size: 1.25rem; font-weight: 700; letter-spacing: 0.08em; text-align: start; text-transform: uppercase; }
.my-modelbar-card img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 3 / 5; object-fit: cover; }
.my-modelbar-cta { display: inline-block; margin-block-start: 0.75rem; padding: 0.6rem 1.4rem; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #14161b; background: #fff; transition: background 0.2s; }
.my-modelbar-card:hover .my-modelbar-cta, .my-modelbar-card:focus-visible .my-modelbar-cta { background: #d9d9d9; }
.my-modelbar-card:focus-visible { outline: 3px solid currentcolor; outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) { .my-modelbar-cta { transition: none; } }`,
    liveSlides: (r) =>
      r.map((e) => `<a class="my-modelbar-card" href="index.html#models"><p class="my-modelbar-name">${e.name}</p>${imgTag(e, '')}<span class="my-modelbar-cta">Browse inventory</span></a>`),
    snippetHtml: `<a class="my-modelbar-card" href="/searchnew.aspx?Model=Giulia">
        <p class="my-modelbar-name">Giulia</p>
        <img src="#MISCPATH#/giulia-tall.jpg" width="600" height="1000" alt="">
        <span class="my-modelbar-cta">Browse inventory</span>
      </a>`,
  },
  'cdjr-dark': {
    cardCss: `.my-modelbar { padding-block: 1.75rem; background: #212121; }
.my-modelbar { --dlc-arrow-bg: rgba(0, 0, 0, 0.4); --dlc-arrow-fg: #fff; }
.my-modelbar-card { display: block; color: #fff; text-align: center; text-decoration: none; }
.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; transition: transform 0.2s; }
.my-modelbar-card:hover img, .my-modelbar-card:focus-visible img { transform: scale(1.1); }
.my-modelbar-card p { margin: 0.5rem 0 0; font-weight: 600; }
.my-modelbar-card:focus-visible { outline: 3px solid currentcolor; outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) { .my-modelbar-card img { transition: none; } }`,
    liveSlides: (r) => r.map((e) => `<a class="my-modelbar-card" href="index.html#modelbar" aria-label="Explore the ${e.name}">${imgTag(e)}<p>${e.name}</p></a>`),
    snippetHtml: `<a class="my-modelbar-card" href="/searchnew.aspx?Model=Wrangler" aria-label="Explore the Wrangler">
        <img src="#CHROMEPHOTOPATH|StyleID|1|640p#" width="320" height="240" alt="2026 Jeep Wrangler">
        <p>Wrangler</p>
      </a>`,
  },
  'category-tile': {
    cardCss: `/* Verified live 19 Aug: white background, dark uppercase labels BELOW the vehicles. */
.my-modelbar-card { display: block; color: #222; text-align: center; text-decoration: none; }
.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; }
.my-modelbar-card p { margin: 0.5rem 0 0; font-size: 1.05rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; }
.my-modelbar { --dlc-arrow-fg: #222; --dlc-arrow-bg: rgba(255, 255, 255, 0.92); }
.my-modelbar .dl-carousel-arrow { box-shadow: 0 1px 6px rgb(0 0 0 / 20%); }
.my-modelbar-card img { transition: transform 0.25s ease; }
.my-modelbar-card:hover img, .my-modelbar-card:focus-visible img { transform: scale(1.04); }
@media (prefers-reduced-motion: reduce) { .my-modelbar-card img { transition: none; } }
.my-modelbar-card:focus-visible { outline: 3px solid currentcolor; outline-offset: 3px; }`,
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
.my-modelbar-card p { margin: -0.6rem 0 0; font-weight: 600; }
.my-modelbar { --dlc-arrow-fg: #222; --dlc-arrow-bg: rgba(255, 255, 255, 0.92); }
.my-modelbar .dl-carousel-arrow { box-shadow: 0 1px 6px rgb(0 0 0 / 20%); }
.my-modelbar-card:focus-visible { outline: 3px solid currentcolor; outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) { .my-modelbar-card img { transition: none; } }`,
    liveSlides: () => CUTOUTS.map(([slug, name, alt]) => `<a class="my-modelbar-card" href="index.html#modelbar">${cutoutImg(slug, alt)}<p>${name}</p></a>`),
    snippetLabel: 'Shop by brand',
    snippetHtml: `<a class="my-modelbar-card" href="/searchnew.aspx?make=Honda">
        <img src="#MISCPATH#/brand-honda.png" width="320" height="240" alt="">
        <p>Honda</p>
      </a>`,
  },
  'wordmark-dark': {
    cardCss: `.my-modelbar { padding-block: 1.75rem; background: linear-gradient(#3a3a3a, #1f1f1f); }
.my-modelbar { --dlc-arrow-bg: rgba(0, 0, 0, 0.4); --dlc-arrow-fg: #fff; }
.my-modelbar-card { display: block; color: #fff; text-align: center; text-decoration: none; }
.my-modelbar-wordmark { display: block; margin-block-end: 0.75rem; font-size: 1.3rem; font-style: italic; font-weight: 700; letter-spacing: 0.06em; }
.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; }
.my-modelbar-card p { margin: 0.5rem 0 0; font-size: 0.85rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; }
.my-modelbar-card img { transition: transform 0.25s ease; }
.my-modelbar-card:hover img, .my-modelbar-card:focus-visible img { transform: scale(1.04); }
@media (prefers-reduced-motion: reduce) { .my-modelbar-card img { transition: none; } }
.my-modelbar-card:focus-visible { outline: 3px solid currentcolor; outline-offset: 3px; }`,
    // No aria-label here: the visible text names the card twice (wordmark +
    // caption), and an "Explore the X" label would fail label-in-name (WCAG
    // 2.5.3). Content names the link; the cutout is decorative (alt="").
    liveSlides: () => CUTOUTS.map(([slug, name]) => `<a class="my-modelbar-card" href="index.html#modelbar"><span class="my-modelbar-wordmark">${name}</span>${cutoutImg(slug, '')}<p>${name}</p></a>`),
    snippetHtml: `<a class="my-modelbar-card" href="/searchnew.aspx?Model=Roma">
        <span class="my-modelbar-wordmark">Roma</span>
        <img src="#CHROMEPHOTOPATH|StyleID|1|640p#" width="320" height="240" alt="">
        <p>Roma</p>
      </a>
      <!-- the real site puts the model's script-wordmark image where the span is.
           No aria-label and an empty alt: the text already names the card twice,
           and a label that doesn't contain ALL of it fails label-in-name -->`,
  },
  'photo-overlay': {
    cardCss: `/* Verified live 19 Aug: a solid dark caption strip along the card bottom. */
.my-modelbar { --dlc-gap: 1rem; }
.my-modelbar-card { position: relative; display: block; overflow: hidden; color: #fff; text-decoration: none; }
.my-modelbar-card img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 16 / 10; object-fit: cover; }
.my-modelbar-card p { position: absolute; inset-block-end: 0; inset-inline: 0; margin: 0; padding: 0.7rem 1rem; font-weight: 700; background: rgb(20 20 20 / 88%); }
.my-modelbar { --dlc-arrow-fg: #222; --dlc-arrow-bg: rgba(255, 255, 255, 0.92); }
.my-modelbar .dl-carousel-arrow { box-shadow: 0 1px 6px rgb(0 0 0 / 20%); }
.my-modelbar-card img { transition: transform 0.25s ease; }
.my-modelbar-card:hover img, .my-modelbar-card:focus-visible img { transform: scale(1.04); }
@media (prefers-reduced-motion: reduce) { .my-modelbar-card img { transition: none; } }
.my-modelbar-card:focus-visible { outline: 3px solid currentcolor; outline-offset: 3px; }`,
    liveSlides: () =>
      PHOTO_CARDS.map(
        ([slug, name, alt]) =>
          `<a class="my-modelbar-card" href="index.html#vehicles"><img src="img/${slug}.jpg" width="800" height="500" alt="${alt}" loading="lazy" decoding="async" /><p>${name}</p></a>`,
      ),
    snippetHtml: `<a class="my-modelbar-card" href="/searchnew.aspx?Model=Purosangue">
        <img src="#MISCPATH#/purosangue.jpg" width="800" height="500" alt="Red Ferrari Purosangue on a coastal road">
        <p>Purosangue</p>
      </a>`,
  },
  spotlight: {
    cardCss: `.my-modelbar { --dlc-arrow-size: 56px; --dlc-arrow-fg: #14161b; --dlc-arrow-bg: rgba(255, 255, 255, 0.85); }
.my-modelbar .dl-carousel-arrow { box-shadow: 0 2px 10px rgb(0 0 0 / 25%); }
@media (min-width: 992px) { .my-modelbar { --dlc-peek: 23%; } }
@media (max-width: 480px) { .my-modelbar { --dlc-arrow-size: 44px; } }
.my-modelbar-card { display: block; color: inherit; text-align: center; text-decoration: none; }
.my-modelbar-wordmark { display: block; margin-block-end: 0.5rem; font-size: 1.5rem; font-style: italic; font-weight: 700; letter-spacing: 0.06em; }
.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; }
.my-modelbar-card p { margin: 0.5rem 0 0; font-size: 1.15rem; font-weight: 600; }
.my-modelbar-card img { transition: transform 0.25s ease; }
.my-modelbar-card:hover img, .my-modelbar-card:focus-visible img { transform: scale(1.04); }
@media (prefers-reduced-motion: reduce) { .my-modelbar-card img { transition: none; } }
.my-modelbar-card:focus-visible { outline: 3px solid currentcolor; outline-offset: 3px; }`,
    // Same label-in-name reasoning as the wordmark-dark skin above.
    liveSlides: () => CUTOUTS.map(([slug, name]) => `<a class="my-modelbar-card" href="index.html#modelbar"><span class="my-modelbar-wordmark">${name}</span>${cutoutImg(slug, '')}<p>${name}</p></a>`),
    snippetHtml: `<a class="my-modelbar-card" href="/searchnew.aspx?Model=GranTurismo">
        <span class="my-modelbar-wordmark">GranTurismo</span>
        <img src="#CHROMEPHOTOPATH|StyleID|1|640p#" width="320" height="240" alt="">
        <p>GranTurismo</p>
      </a>`,
  },
  'logo-strip': {
    cardCss: `/* Verified live 19 Aug: a navy band, each make a rounded lighter-navy tile. */
.my-modelbar { --dlc-gap: 1rem; padding: 1.5rem 1rem; background: #16294f; }
.my-modelbar { --dlc-arrow-bg: rgba(9, 17, 34, 0.45); --dlc-arrow-fg: #fff; }
/* autoplay's pause button clears the overlaid next arrow - both stay 24px+ touch targets */
.my-modelbar .dl-carousel-pause { inset-inline-end: calc(var(--dlc-arrow-size, 36px) + 0.75rem); }
.my-modelbar-card { display: flex; align-items: center; justify-content: center; aspect-ratio: 3 / 2; padding: 1rem; color: #fff; background: #253a5e; border: 1px solid rgb(255 255 255 / 7%); border-radius: 10px; transition: background 0.2s; }
.my-modelbar-card:hover, .my-modelbar-card:focus-visible { background: #2e4670; }
.my-modelbar-card img { inline-size: 75%; block-size: auto; object-fit: contain; }
.my-modelbar-card:focus-visible { outline: 3px solid currentcolor; outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) { .my-modelbar-card { transition: none; } }`,
    liveSlides: () => CUTOUTS.map(([slug, name]) => `<a class="my-modelbar-card" href="index.html#modelbar" aria-label="Shop ${name}">${cutoutImg(slug, '')}</a>`),
    snippetLabel: 'Shop by make',
    snippetHtml: `<a class="my-modelbar-card" href="/searchnew.aspx?make=Chevrolet" aria-label="Shop Chevrolet">
        <img src="#MISCPATH#/make-chevrolet.png" width="320" height="240" alt="">
      </a>`,
  },
  'location-card': {
    cardCss: `/* Verified live 19 Aug: floating white cards on a light band - brand mark on
   top, name, address, phone, and a red Visit Website pill. */
.my-modelbar { --dlc-gap: 1.25rem; padding: 1.5rem 1rem; background: #f4f6f8; }
.my-modelbar { --dlc-arrow-fg: #222; --dlc-arrow-bg: rgba(255, 255, 255, 0.92); }
.my-modelbar .dl-carousel-arrow { box-shadow: 0 1px 6px rgb(0 0 0 / 20%); }
/* same pause-vs-arrow clearance as the makes rail */
.my-modelbar .dl-carousel-pause { inset-inline-end: calc(var(--dlc-arrow-size, 36px) + 0.75rem); }
/* border-box, or the 100% height plus padding overflows the slide and the
   card grows its own scrollbar */
.my-modelbar-card { display: flex; flex-direction: column; align-items: center; box-sizing: border-box; block-size: 100%; padding: 1.5rem 1.25rem; color: inherit; text-align: center; text-decoration: none; background: #fff; border-radius: 10px; box-shadow: 0 4px 16px rgb(16 22 29 / 12%); transition: box-shadow 0.2s; }
.my-modelbar-card:hover, .my-modelbar-card:focus-visible { box-shadow: 0 8px 24px rgb(16 22 29 / 18%); }
.my-modelbar-card img { inline-size: 55%; block-size: auto; object-fit: contain; }
.my-modelbar-card .my-modelbar-name { margin: 0.5rem 0 0.4rem; font-size: 1.1rem; font-weight: 700; color: #222; }
.my-modelbar-card p { margin: 0 0 0.9rem; font-size: 0.9rem; color: #5f6368; }
.my-modelbar-visit { display: inline-block; margin-block-start: auto; padding: 0.5rem 1.3rem; font-size: 0.8rem; font-weight: 700; color: #fff; background: #c8102e; border-radius: 999px; }
.my-modelbar-card:hover .my-modelbar-visit, .my-modelbar-card:focus-visible .my-modelbar-visit { background: #a80d27; }
.my-modelbar-card:focus-visible { outline: 3px solid currentcolor; outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) { .my-modelbar-card { transition: none; } }`,
    liveSlides: () =>
      LOCATIONS.map(
        ([store, addr, phone], i) =>
          `<a class="my-modelbar-card" href="index.html#cards">${imgTag(CHEVY[i % CHEVY.length], '')}<p class="my-modelbar-name">${store}</p><p>${addr}<br />${phone}</p><span class="my-modelbar-visit">Visit website</span></a>`,
      ),
    snippetLabel: 'Our locations',
    snippetHtml: `<a class="my-modelbar-card" href="https://www.rooftop-site.example/">
        <h3 class="my-modelbar-name">Northgate Chevrolet</h3>
        <p>2400 Commerce Dr, Springfield<br>(555) 010-1100</p>
        <span class="my-modelbar-visit">Visit website</span>
      </a>`,
  },
};

// One entry per distinct ladder; strips = the looks that ladder ships with.
//
// Ladder pairs are [minWidth, perView] for --dlc-per-view, derived from each
// site's live slick config. THE RULE: slick compares `windowWidth <
// breakpoint` (slick.js:619, a strict <), so `breakpoint: N` means the tier
// ABOVE starts at exactly min-width N -- NOT N+1.
//
// An earlier hand-conversion added 1 at every rung. That put every strip one
// pixel out of step with the Bootstrap 3 grid the platform actually runs
// (768/992/1200, measured in the DealerOn CSS bundle -- there is no 576): at
// 768px, iPad portrait, the page went md while the slider stayed on its phone
// tier. The tell that it was an error rather than a record: the same real
// breakpoint appeared both ways across entries -- 540/541, 600/601, 768/769,
// 991/992/993, 1200/1201.
//
// Where a corrected value lands 1px under a grid tier it is snapped onto it
// (Chevrolet's 991/1199 -> 992/1200). Our engine reads min-width directly and
// has no slick quirk to reproduce, and a builder wants the strip to flip where
// the page flips. The raw max-width configs stay verbatim in the census:
// docs/research/2026-08-18-oem-demo-slider-census.md
const VARIANTS = [
  {
    key: 'acura',
    roster: R.acura,
    toc: 'Acura',
    sites: 19,
    demos: 'acura 1-4, ford 2-4, gmc 1-2, honda 2-5, kia 2-3, mitsubishi 1-2, mitsubishi 4, toyota 9',
    ladder: [
      [0, 2],
      [460, 3],
      [768, 5],
    ],
    why: 'The most common ladder in the estate — tied with the Chevrolet tiers at 19 sites apiece. The same tiers also ship branded as Lexus on live client sites: a centered underlined heading and small cutouts that scale up a touch on hover.',
    strips: [{ skin: 'white', copy: 'Acura, plain white', label: 'Plain white, name below — how all 19 ship it' }],
  },
  {
    key: 'chevrolet',
    roster: CHEVY,
    toc: 'Chevrolet',
    sites: 19,
    demos: 'buickgmc 1-4, cadillac 1-3, chevrolet 1-4, ford 6-7, subaru 1-4, volvo 1-2',
    ladder: [
      [0, 2],
      [539, 3],
      [992, 4],
      [1200, 5],
    ],
    why: 'The GM ladder — and proof a ladder is not a look: Chevrolet runs it plain, Cadillac on a black band, and the Buick GMC, Ford-family, and Subaru demos wear it under brand or body-style tabs. Note: since Nov 2025 the official Chevrolet bar is the TABBED version (the plain slick look was deprecated and its sites migrated) — expect tabs on new Chevrolet requests; the <a href="index.html#modelbar-tabs">tabs demo</a> shows the wiring over this same ladder.',
    strips: [
      {
        skin: 'white',
        copy: 'Chevrolet, the official tabbed bar',
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
      { skin: 'band-dark', copy: "Cadillac's dark band, on the Chevrolet ladder", label: 'Same ladder as Cadillac ships it — a dark band and spaced capitals' },
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
      [400, 2],
      [600, 3],
      [992, 5],
    ],
    why: 'Drops to a single card on the narrowest phones.',
    strips: [{ skin: 'band-gray', copy: 'Lexus, gray gradient band', label: 'On a soft gray gradient band, spaced capitals' }],
  },
  {
    key: 'buick',
    roster: R.buick,
    toc: 'Buick',
    sites: 7,
    demos: 'buick 1-2, jaguar 1, jaguar 3, landrover 1, landrover 3-4',
    ladder: [
      [0, 2],
      [460, 3],
      [768, 4],
    ],
    why: 'Four-up ceiling — roomier cards than the five-up brands. Jaguar and Land Rover wear these same tiers as photo cards: a background photo per model with a dark hover overlay and an uppercase name plus tagline below (their imagery is pending, so the look is described rather than shown).',
    strips: [{ skin: 'white', copy: 'Buick, plain white', label: 'Plain white, name below' }],
  },
  {
    key: 'genesis',
    roster: R.genesis,
    toc: 'Genesis',
    sites: 5,
    demos: 'genesis 1-3, vw 1-2',
    ladder: [
      [0, 1],
      [540, 2],
      [992, 3],
      [1200, 4],
    ],
    why: 'A gentle four-step climb — shipped two ways: Genesis plain with inventory counts, Volkswagen with a colour tile behind every car.',
    strips: [
      { skin: 'counts', copy: 'Genesis, inventory counts', label: 'As Genesis ships it — inventory count under each name' },
      { skin: 'tile', copy: "Volkswagen's colour tiles, on the Genesis ladder", label: 'Same ladder as Volkswagen ships it — a tile of colour behind each car, one featured in navy' },
      {
        skin: 'counts',
        copy: 'Genesis, new-platform ladder',
        recipeName: 'Genesis new-platform ladder',
        ladder: [
          [0, 1],
          [599, 2],
          [990, 3],
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
      [460, 3],
      [992, 4],
    ],
    why: 'Holds three cards across a wide tablet range. Client builds sometimes cut the 4-up tier at 992px instead of 993 — one pixel, same ladder.',
    strips: [{ skin: 'band-flat', copy: 'Lincoln, flat gray band', label: 'On a flat light-gray band, spaced capitals' }],
  },
  {
    key: 'ford',
    roster: R.ford,
    toc: 'Ford',
    sites: 2,
    demos: 'ford 1, honda 1',
    ladder: [
      [0, 1],
      [460, 3],
      [992, 5],
    ],
    why: 'Jumps 1 → 3 in one step; no two-up state at all.',
    strips: [{ skin: 'white', copy: 'Ford, plain white', label: 'Plain white, name below' }],
  },
  {
    key: 'hyundai',
    roster: R.hyundai,
    toc: 'Hyundai',
    sites: 3,
    demos: 'hyundai 2-4',
    ladder: [
      [0, 1],
      [460, 3],
      [992, 4],
      [1200, 5],
    ],
    why: 'Also skips two-up on the way from phone to tablet.',
    strips: [{ skin: 'white', copy: 'Hyundai, plain white', label: 'Plain white, name below' }],
  },
  {
    key: 'mazda',
    roster: R.mazda,
    toc: 'Mazda',
    sites: 2,
    demos: 'mazda 1-2',
    ladder: [
      [0, 1],
      [768, 2],
      [992, 3],
    ],
    dots: true,
    why: 'One of only three model bars in the estate that shows dots.',
    strips: [{ skin: 'name-top-chip', copy: 'Mazda, name above with chip', label: 'Name above the car, inventory chip below — and it keeps its dots' }],
  },
  {
    key: 'toyota',
    roster: R.toyota,
    toc: 'Toyota',
    sites: 2,
    demos: 'toyota 2-3',
    ladder: [
      [0, 1],
      [540, 2],
    ],
    why: 'Never more than two across — the roomiest cards of any standard bar.',
    strips: [
      { skin: 'photo-card', copy: 'Toyota, split photo cards', label: 'Split photo cards — photo left, year and inventory count right, Shop Now pill. On the tabbed sites these group by body style' },
    ],
  },
  {
    key: 'alfaromeo',
    roster: R.alfaromeo,
    toc: 'Alfa Romeo',
    sites: 1,
    demos: 'alfaromeo 1',
    ladder: [
      [0, 1],
      [540, 2],
      [992, 3],
      [1200, 4],
      [1800, 6],
    ],
    why: 'Six-up, but only past 1800px — the widest breakpoint in the estate.',
    strips: [{ skin: 'tall-tile', copy: 'Alfa Romeo, tall dark tiles', label: 'Tall dark tiles with a browse button — the most styled bar in the estate' }],
  },
  {
    key: 'audi',
    roster: R.audi,
    toc: 'Audi',
    sites: 1,
    demos: 'audi 1',
    ladder: [
      [0, 1],
      [360, 2],
      [768, 3],
      [992, 4],
      [1200, 6],
    ],
    why: 'Five rungs, the most granular ladder anywhere.',
    strips: [{ skin: 'white', copy: 'Audi, plain white', label: 'Plain white, name below' }],
  },
  {
    key: 'cdjr',
    roster: R.cdjr,
    toc: 'CDJR',
    sites: 4,
    demos: 'cdjr 1-4',
    ladder: [
      [0, 2],
      [460, 3],
      [992, 6],
    ],
    why: 'The only six-up ladder that gets there in three rungs — and the only ladder from the 19 Aug sweep worn by more than one site. A Fiat-including client variant drops the colored band, uses pipe-divider tabs, and starts at one card — moot, since that variant hides the whole bar below 768px.',
    strips: [
      {
        skin: 'cdjr-dark',
        copy: 'CDJR, dark band',
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
      [460, 3],
      [992, 5],
    ],
    why: 'Same engine, different content contract: the slides are body-style categories (motorcycles, ATVs, scooters), not models.',
    strips: [
      {
        skin: 'category-tile',
        copy: 'Powersports category tiles',
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
      [460, 3],
      [768, 6],
    ],
    why: 'A brand-logo strip standing where the model bar would be — the Acura tiers with a six-up ceiling.',
    strips: [
      {
        skin: 'brand-logo',
        copy: 'Powersports brand logos',
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
        copy: 'Ferrari, wordmark band',
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
      [768, 2],
      [992, 3],
      [1440, 4],
    ],
    why: 'The estate&rsquo;s only 1441px tier — a fourth card appears only past 1440px.',
    strips: [{ skin: 'photo-overlay', copy: 'Ferrari, photo cards', label: 'Lifestyle photo cards with a bottom gradient overlay and the name bottom-left' }],
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
    strips: [{ skin: 'spotlight', copy: 'Maserati spotlight', label: 'Wordmark above the car, name below, oversized white arrows — the peek grows from 20% to 23% at 992px' }],
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
        copy: 'Group makes rail',
        recipeName: 'Group makes strip',
        ladder: [
          [0, 2],
          [768, 4],
          [992, 7],
        ],
        autoplay: 4000,
        label: 'Make logos, seven across past 992px (base 2 &middot; &ge;769px 4 &middot; &ge;993px 7) — the cutouts stand in for OEM logos',
      },
      {
        skin: 'location-card',
        copy: 'Group locations rail',
        recipeName: 'Group locations strip',
        ladder: [
          [0, 1],
          [768, 2],
          [992, 4],
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
    css: `/* Tile grid - 2-across base, 3 at 540px, 6 at 992px. Verified live 19 Aug:
   the name stays visible bottom-left over a darkened base at every width;
   hover (or keyboard focus) deepens the wash and slides the action links up. */
.my-tilegrid { display: flex; flex-wrap: wrap; gap: 1rem 2%; }
.my-tile { position: relative; inline-size: 49%; overflow: hidden; border-radius: 10px; }
@media (min-width: 540px) { .my-tile { inline-size: 32%; } }
@media (min-width: 992px) { .my-tile { inline-size: 15%; } }
.my-tile img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 1; object-fit: cover; }
.my-tile-cover { position: absolute; inset: 0; display: flex; flex-direction: column; gap: 0.25rem; align-items: flex-start; justify-content: flex-end; padding: 0.6rem 0.7rem; color: #fff; background: linear-gradient(transparent 55%, rgb(0 0 0 / 65%)); border-radius: 10px; }
.my-tile-cover p { margin: 0; font-weight: 700; }
.my-tile-cover a { max-block-size: 0; overflow: hidden; font-size: 0.9rem; color: #fff; opacity: 0; transition: max-block-size 0.25s, opacity 0.25s, transform 0.25s; transform: translateY(8px); }
.my-tile:hover .my-tile-cover, .my-tile:focus-within .my-tile-cover { background: rgb(0 0 0 / 55%); }
.my-tile:hover .my-tile-cover a, .my-tile:focus-within .my-tile-cover a { max-block-size: 2rem; opacity: 1; transform: none; }

/* No hover on touch - keep the links visible below desktop. */
@media (max-width: 991px) { .my-tile-cover a { max-block-size: 2rem; opacity: 1; transform: none; } }
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
      <a href="/searchnew.aspx?Model=Macan">Search New</a>
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
.my-tilewide-cover { position: absolute; inset: 0; display: flex; flex-direction: column; gap: 0.15rem; justify-content: flex-end; padding: 0.6rem 0.8rem; color: #fff; background: linear-gradient(transparent 55%, rgb(0 0 0 / 55%)); }
.my-tilewide-cover p { margin: 0; font-weight: 700; }
.my-tilewide-cover p::before { content: "\\203A "; }
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
      <a href="/searchnew.aspx?Model=QX60">Explore</a>
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
        <div class="demo-stage">
          <span class="demo-stage-tag" aria-hidden="true">Live</span>
          <div class="${d.rootClass.replaceAll('my-', 'sb-')}">
${live}
          </div>
        </div>
        <details class="demo-copy">
          <summary>Copy this look &mdash; ${d.title}</summary>
          <p class="copy-lead"><strong>Copy this.</strong> The HTML goes in a Custom HTML block; the CSS goes in the page's <em>Style Only</em> box. No slider install needed &mdash; this one is pure CSS.</p>
          <p class="code-label">HTML</p>
          <pre><code>${esc(d.snippetHtml)}</code></pre>
          <p class="code-label">CSS</p>
          <pre><code>${esc(d.css)}</code></pre>
        </details>`;
  }).join('\n');
  return `      <section class="demo-section demo-wide" id="static-bars">
        <h3 id="static-bars-h">Model bars that are not sliders<a class="demo-anchor" href="#static-bars" aria-label="Link to this section">#</a></h3>
        <p class="demo-sub">
          A recurring official family, not a one-off: several OEMs ship their model bar as a static grid or tab panes with no carousel at all. Porsche and INFINITI run hover-reveal tile grids, one
          Ford variant is a plain CSS grid (<a href="index.html#modelbar">see the main page's ladder table</a>), BMW's is tab panes with a text rail &mdash; one pane per model, and on phones it
          simply becomes a stacked list (the <a href="index.html#modelbar-tabs">tabs demo</a> shows the wiring). And clients drift here too: one Nissan store replaced its slider with a tabbed
          static grid. If a request says &ldquo;model bar&rdquo;, check which family before reaching for the slider.
        </p>
${demos}
        <p class="demo-backtotoc"><a href="#toc">All sections &#8593;</a></p>
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
    : `/* Arrows only - hide the dots and reclaim the space they reserved.
   0.1px, not 0px: the platform's CSS minifier strips the unit off any zero
   length, and a unitless 0 inside the engine's calc() breaks the arrows'
   vertical centering (they jump to the top of the strip). */\n.my-modelbar .dl-carousel-dots { display: none; }\n.my-modelbar { --dlc-controls-space: 0.1px; }`;
  const auto = s.autoplay ? `\n\n/* Autoplay adds the engine's pause button (top right, first in tab order) - leave it. */` : '';
  const tabbed = s.tabbed ? `\n${TABBED_CSS}` : '';
  // Platform-safe by design: DealerOn's styleCode minifier rejects modern
  // function values (clamp, slash-rgb) INSIDE custom-property declarations
  // and silently serves the last good sheet - so responsive peek is a plain
  // media step, never clamp() (live-tested on dealer 26900, 2026-08-20).
  const phones = `/* Phones: smaller peek and arrow discs so the arrows stop sitting on the vehicles (still a 24px+ target). */\n@media (max-width: 480px) { .my-modelbar { ${v.peek ? '' : '--dlc-peek: 36px; '}--dlc-arrow-size: 36px; } }`;
  return `/* ${s.copy ?? s.recipeName ?? `${v.toc} ladder`} - ${v.sites === 1 ? 'runs on 1 site' : `${v.sites} sites run this ladder`}. */\n${rungs}\n${phones}\n\n${dots}${auto}\n\n${SKINS[s.skin].cardCss}${tabbed}`;
};

// Tab chrome for tabbed strips (Chevrolet ships this way): centered heading,
// pipe-separated labels with the blue underline, centered CTA — the real
// site's full unit.
const TABBED_CSS = `
/* The bar's own chrome: centered heading, tabs, centered CTA. The tab SCRIPT
   is the standard one - copy it from the tabs demo on the main page. */
.my-modelbar-title { margin: 0 0 1rem; font-size: 1.6rem; font-weight: 700; color: #222; text-align: center; }
.my-modelbar-tablist { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; margin: 0 0 1.75rem; }
.my-modelbar-tab { position: relative; padding: 0.35rem 0.2rem; margin-inline: 1.5rem; font: inherit; font-size: 1.05rem; font-weight: 600; color: #222; cursor: pointer; background: none; border: 0; border-block-end: 3px solid transparent; }
/* The divider is a thin text-height pipe centered in the gap - NOT a border
   on the button, which would run full height and touch the labels. */
.my-modelbar-tab + .my-modelbar-tab::before { position: absolute; inset-block-start: 50%; inset-inline-start: -1.5rem; inline-size: 1px; block-size: 1.05rem; content: ""; background: #c8ccd2; transform: translate(-50%, -50%); }
.my-modelbar-tab:hover { border-block-end-color: #9cc6e8; }
.my-modelbar-tab[aria-selected="true"] { border-block-end-color: #006dc7; }
.my-modelbar-tab:focus-visible { outline: 3px solid #16324f; outline-offset: 2px; }
/* Phones: tighter gaps, and no pipes - a wrapped row would strand them. */
@media (max-width: 560px) { .my-modelbar-tablist { row-gap: 0.2rem; } .my-modelbar-tab { margin-inline: 0.7rem; } .my-modelbar-tab + .my-modelbar-tab::before { display: none; } }
.my-modelbar-cta { display: block; inline-size: fit-content; padding: 0.7rem 1.6rem; margin: 1.5rem auto 0; font-weight: 600; color: #fff; text-decoration: none; background: #006dc7; border-radius: 4px; }
.my-modelbar-cta:hover, .my-modelbar-cta:focus-visible { background: #005ba6; }
.my-modelbar-cta:focus-visible { outline: 3px solid #16324f; outline-offset: 2px; }`;

// The tab-switching script, verbatim from the tabs demo on the main page —
// emitted into the tabbed copy panel with its own copy button, so the
// official tabbed build is ONE panel instead of a hunt across two pages.
const TAB_SCRIPT = `<script>
  // Tab switching. Each pane holds its own slider; they look after themselves.
  addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-tabs]').forEach(function (wrap) {
      var tabs = Array.prototype.slice.call(wrap.querySelectorAll('[role="tab"]'));
      var panes = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
      function select(i) {
        tabs.forEach(function (t, j) {
          t.setAttribute('aria-selected', String(i === j));
          t.tabIndex = i === j ? 0 : -1;
          panes[j].hidden = i !== j;
        });
        wrap.dataset.tab = i;
      }
      tabs.forEach(function (t, i) { t.addEventListener('click', function () { select(i); }); });
      wrap.querySelector('[role="tablist"]').addEventListener('keydown', function (e) {
        var i = tabs.indexOf(e.target); if (i === -1) return;
        var n = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length : null;
        if (n === null) return;
        e.preventDefault(); tabs[n].focus(); select(n);
      });
      select(0);
    });
  });
</script>`;

// The "did it work" list at the foot of every copy panel: what the paste
// should do, generated from the same ladder data as the CSS it follows.
const checkList = (v, s) => {
  const items = [
    `Cards per view: ${ladderText(s.ladder ?? v.ladder)} &mdash; resize the window and count.`,
    v.dots ? 'Arrows step one card, and the dots stay visible (this bar keeps them).' : 'Arrows step one card; no dots (the CSS hides them).',
    s.autoplay ? `It advances by itself every ${s.autoplay / 1000}s, and a pause button sits top right, first in tab order.` : 'Nothing moves on its own &mdash; these bars never autoplay.',
  ];
  if (s.tabbed) items.push(`${s.tabbed.labels.length} tabs switch panes, and arrow keys move between them.`);
  items.push('Swipe, drag and scroll all work &mdash; and the strip still scrolls with JavaScript turned off.');
  return `          <p class="code-label">Check it worked</p>
          <ul class="copy-check">
${items.map((t) => `            <li>${t}</li>`).join('\n')}
          </ul>`;
};

const stripId = (v, i) => (v.strips.length === 1 ? `mbx-${v.key}` : `mbx-${v.key}-${i}`);

// A skin that sets a background on the strip root paints its own band and
// self-delimits; everything else is white-on-white and gets the dotted
// specimen stage so the exhibit's bounds separate from the page chrome.
const isBanded = (skin) => /\.my-modelbar \{[^}]*background/.test(SKINS[skin].cardCss);
const stage = (skin, inner) => `        <div class="demo-stage${isBanded(skin) ? ' demo-stage--band' : ''}">
          <span class="demo-stage-tag" aria-hidden="true">Live</span>
${inner}
        </div>`;

// The live tabbed unit — centered title, tablist, one carousel per pane,
// centered CTA — shared by the library's tabbed strip and the brand
// directory's Chevrolet section so the two can never drift.
const tabbedLive = (id, s, roster, brandName) => {
  const tabs = s.tabbed.labels
    .map(
      (label, t) =>
        `            <button type="button" role="tab" id="${id}-tab-${t}" aria-controls="${id}-pane-${t}" aria-selected="${t === 0 ? 'true' : 'false'}"${t === 0 ? '' : ' tabindex="-1"'} class="${id}-tab">${label}</button>`,
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
            <div class="dl-carousel ${id}" data-slider data-step="slide" aria-label="${brandName} ${label}">
              <ul class="dl-carousel-track">
${slides}
              </ul>
            </div>
          </div>`;
    })
    .join('\n');
  return `        <div class="${id}-tabs" data-tabs>
          <p class="${id}-title">View Our Lineup</p>
          <div role="tablist" aria-label="Models by body style" class="${id}-tablist">
${tabs}
          </div>
${panes}
          <a class="${id}-cta" href="index.html#modelbar">Explore All New Inventory</a>
        </div>`;
};

// Live style block: each strip's recipe with .my-modelbar → its unique class.
const liveCss = VARIANTS.flatMap((v) => v.strips.map((s, i) => stripComments(recipeCss(v, s)).replaceAll('.my-modelbar', `.${stripId(v, i)}`))).join('\n\n');

const strip = (v, s, i) => {
  const id = stripId(v, i);
  const labelId = `${id}-h`;
  const heading = v.strips.length === 1 ? '' : `        <h4 id="${labelId}" class="strip-label">${s.label}</h4>\n`;
  const note = v.strips.length === 1 ? `        <p class="strip-note">${s.label}.</p>\n` : '';
  const aria = `aria-label="${s.copy}"`;
  const attrs = `data-slider data-step="slide"${s.autoplay ? ` data-autoplay="${s.autoplay}"` : ''}`;
  const roster = s.roster ?? v.roster ?? CHEVY;
  const snippetHtml = typeof SKINS[s.skin].snippetHtml === 'function' ? SKINS[s.skin].snippetHtml(roster) : SKINS[s.skin].snippetHtml;
  if (s.tabbed) return tabbedStrip(v, s, i, { id, heading, note, roster, snippetHtml });
  const slides = SKINS[s.skin]
    .liveSlides(roster)
    .map((a) => `            <li class="dl-carousel-slide">${a.replaceAll('my-modelbar', id)}</li>`)
    .join('\n');
  return `${heading}${note}${stage(
    s.skin,
    `          <div class="dl-carousel ${id}" ${attrs} ${aria}>
            <ul class="dl-carousel-track">
${slides}
            </ul>
          </div>`,
  )}
        <details class="demo-copy">
          <summary>Copy this look &mdash; ${s.copy}</summary>
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
${checkList(v, s)}
        </details>`;
};

// A tabbed strip: the real Chevrolet presentation — body-style tabs, each
// pane its own auto-inited carousel on the same ladder. Uses the shared
// [data-tabs] APG handler from assets/demo.js.
const tabbedStrip = (v, s, i, { id, heading, note, roster, snippetHtml }) => {
  const slug = (label) =>
    label
      .toLowerCase()
      .replace(/[^a-z]+/g, '-')
      .replace(/^-|-$/g, '');
  const members = (t) => s.tabbed.panes[t].map((n) => roster[n].name).join(', ');
  const snippetTabs = s.tabbed.labels
    .map(
      (label, t) =>
        `    <button type="button" role="tab" id="tab-${slug(label)}" aria-controls="pane-${slug(label)}" aria-selected="${t === 0 ? 'true' : 'false'}"${t === 0 ? '' : ' tabindex="-1"'} class="my-modelbar-tab">${label}</button>`,
    )
    .join('\n');
  const firstSlug = slug(s.tabbed.labels[0]);
  const stubPanes = s.tabbed.labels
    .slice(1)
    .map(
      (label, t) => `  <div role="tabpanel" id="pane-${slug(label)}" aria-labelledby="tab-${slug(label)}" hidden>
    <!-- same structure as the first pane. ${label}: ${members(t + 1)} -->
  </div>`,
    )
    .join('\n');
  return `${heading}${note}${stage(s.skin, tabbedLive(id, s, roster, v.toc))}
        <details class="demo-copy">
          <summary>Copy this look &mdash; ${s.copy}</summary>
          <p class="copy-lead">
            <strong>Copy this.</strong> Three pastes, all from this panel: the HTML into a Custom HTML block, the tab script into the same block right after it, and the CSS into the page's
            <em>Style Only</em> box. Add <a href="index.html#start">the slider itself</a> first &mdash; once per page. Models may repeat across panes; the real sites do exactly that.
          </p>
          <p class="code-label">HTML</p>
          <pre><code>${esc(`<div class="my-modelbar-tabs" data-tabs>
  <h2 class="my-modelbar-title">View Our Lineup</h2>
  <div role="tablist" aria-label="Models by body style" class="my-modelbar-tablist">
${snippetTabs}
  </div>
  <div role="tabpanel" id="pane-${firstSlug}" aria-labelledby="tab-${firstSlug}">
    <div class="my-modelbar dl-carousel" data-slider data-step="slide" aria-label="${s.tabbed.labels[0]}">
      <ul class="dl-carousel-track">
        <li class="dl-carousel-slide">
          ${snippetHtml}
        </li>
        <!-- repeat the <li> for each model in this group.
             ${s.tabbed.labels[0]}: ${members(0)} -->
      </ul>
    </div>
  </div>
${stubPanes}
  <a class="my-modelbar-cta" href="/searchnew.aspx">Explore All New Inventory</a>
</div>`)}</code></pre>
          <p class="code-label">Tab script &mdash; once per page</p>
          <pre><code>${esc(TAB_SCRIPT)}</code></pre>
          <p class="code-label">CSS</p>
          <pre><code>${esc(recipeCss(v, s))}</code></pre>
${checkList(v, s)}
        </details>`;
};

const section = (v) => `      <section class="demo-section demo-wide" id="${v.key}">
        <h3 id="${v.key}-h">${v.heading ?? `The ${v.toc} ladder`} &mdash; ${v.sites === 1 ? '1 site' : `${v.sites} sites`}<a class="demo-anchor" href="#${v.key}" aria-label="Link to this section">#</a></h3>
        <p class="demo-sub">${v.why} Runs on ${esc(v.demos)}.${v.ladder ? ` Cards per view: ${ladderText(v.ladder)}.` : ''}</p>
${v.strips.map((s, i) => strip(v, s, i)).join('\n')}
        <p class="demo-backtotoc"><a href="#toc">All sections &#8593;</a></p>
      </section>`;

// The page's bands: same grouped-architecture chrome the main demo uses
// (assets/demo.css), one navy rule per band. Groups take the h2 slot;
// sections sit at h3, strip labels at h4.
const PAGE_GROUPS = [
  {
    g: 'shared',
    title: 'The shared ladders',
    desc: 'Worn by two sites or more, each named after the brand that anchors it. If your brand is not a heading here, it wears one of these ladders &mdash; the <strong>Brands wearing them</strong> line in the index above links each one to its exact look.',
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

// The anchor for a specific LOOK: the strip's own h4 id when the section
// holds more than one look, else the section id — so a brand pointer can
// land on the exact strip it names instead of the top of the section.
const lookAnchor = (key, skin) => {
  const v = byKey[key];
  if (v.strips.length > 1) {
    const i = v.strips.findIndex((s) => s.skin === skin);
    if (i > 0) return `${stripId(v, i)}-h`;
  }
  return key;
};
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

// Built as a function and written at the end of the script: the on-page TOC
// carries brand aliases derived from the BRANDS table, which is defined below
// alongside the brand directory it also feeds.
const modelBarsPage = () => `<!doctype html>
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
    <script src="assets/vendor/prism.js" defer></script>
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
        <a href="model-bars.html" aria-current="page">Model bar library</a>
        <a href="brands.html">Find your brand</a>
        <a href="index.html#start">Start here</a>
        <a href="index.html#options">Options</a>
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
        Where one ladder ships with two looks in the estate, both are shown &mdash; same breakpoints, different clothes, same engine. Each strip carries everything its build needs. Do the
        <a href="index.html#start">Start here</a> step from the main demo once per page first. Ladders are named after the brand that anchors them; if yours is not named below, the
        <strong>Brands wearing them</strong> line links each remaining brand to its exact look &mdash; or look it up on <a href="brands.html">Find your brand</a>. For screenshots of the real
        sites, see the <a href="../docs/catalog/model-bar-library.html">screenshot library</a> and the <a href="../docs/catalog/oem-slider-census.html">census</a> (fingerprinted live
        18&ndash;19 Aug 2026).
      </p>

      <div class="demo-search">
        <label for="demo-filter">Filter ladders and looks</label>
        <input id="demo-filter" type="text" autocomplete="off" placeholder="e.g. Cadillac, dark band, tabs" />
        <p class="demo-vh" role="status" id="demo-filter-count"></p>
      </div>
      <nav class="demo-toc demo-toc--chips" id="toc" aria-label="On this page">
${PAGE_GROUPS.map((G) => `        <p class="demo-toc-group"><strong>${G.title}:</strong> ${G.keys.map((k) => `<a href="#${k}">${byKey[k].toc} (${byKey[k].sites})</a>`).join(' ')}</p>`).join('\n')}
        <p class="demo-toc-group"><strong>Brands wearing them:</strong> ${TOC_ALIASES.map(([b, href]) => `<a href="${href}">${b}</a>`).join(' ')}</p>
        <p class="demo-toc-group"><strong>Not the standard design:</strong> <a href="#static-bars">Not sliders</a> <a href="#outliers">The outliers</a></p>
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
  ['Cadillac', 'Slider under body-style tabs, dark band', '2 / 3 / 4 / 5', [[`model-bars.html#${lookAnchor('chevrolet', 'band-dark')}`, 'the dark look on the Chevrolet ladder']], 'cadillacdemo1'],
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
  ['Volkswagen', 'Tabbed slider — a colour tile behind each car', '1 / 2 / 3 / 4', [[`model-bars.html#${lookAnchor('genesis', 'tile')}`, 'the tile look on the Genesis ladder']], 'vwdemo1'],
  ['Volvo', 'Slider', '2 / 3 / 4 / 5', [['model-bars.html#chevrolet', 'Chevrolet ladder']], 'volvodemo1'],
];

// How each brand RENDERS on the brand library page: its variant's ladder,
// its skin, and its imagery (brand-correct where harvested; Chevrolet
// cutouts as labeled stand-ins otherwise). Note-only entries are the
// non-slider bars and pure pointers.
const BRAND_RENDER = {
  Acura: { key: 'acura', skin: 'white', roster: R.acura },
  'Alfa Romeo': { key: 'alfaromeo', skin: 'tall-tile', roster: R.alfaromeo },
  Audi: { key: 'audi', skin: 'white', roster: R.audi },
  BMW: {
    note: 'BMW&rsquo;s official bar is tab panes with a static stacked list on phones &mdash; there is no slider to render. See <a href="model-bars.html#static-bars">the non-slider family</a> for the shape and <a href="index.html#modelbar-tabs">the tabs demo</a> for the wiring.',
  },
  Buick: { key: 'buick', skin: 'white', roster: R.buick },
  Cadillac: { key: 'chevrolet', skin: 'band-dark', standin: true },
  Chevrolet: {
    key: 'chevrolet',
    skin: 'white',
    stripIndex: 0,
    extra:
      'This IS the official five-tab presentation (since Nov 2025). Copy the complete build &mdash; HTML, tab script and CSS &mdash; from the <a href="model-bars.html#chevrolet">library&rsquo;s Chevrolet section</a>.',
  },
  'Chrysler / Dodge / Jeep / Ram': {
    key: 'cdjr',
    skin: 'cdjr-dark',
    roster: R.cdjr,
    extra: 'On the real sites this bar sits under brand-logo tabs &mdash; one pane per brand; the <a href="index.html#modelbar-tabs">tabs demo</a> shows the wiring.',
  },
  Ferrari: {
    key: 'ferrari',
    skin: 'wordmark-dark',
    standin: true,
    extra: 'Ferrari also ships a lifestyle photo-card version &mdash; <a href="model-bars.html#ferrari-photo">running live in the library</a>.',
  },
  Fiat: { note: 'Fiat rides the CDJR bar (the Fiat-including variant) &mdash; see <a href="#b-chrysler-dodge-jeep-ram">Chrysler / Dodge / Jeep / Ram</a> above.' },
  Ford: {
    key: 'ford',
    skin: 'white',
    roster: R.ford,
    extra:
      'Ford also ships a pure-CSS static grid and a tabbed version &mdash; see <a href="model-bars.html#static-bars">the non-slider family</a> and <a href="index.html#modelbar-tabs">the tabs demo</a>.',
  },
  Genesis: { key: 'genesis', skin: 'counts', roster: R.genesis },
  GMC: { key: 'acura', skin: 'white', standin: true },
  'Group sites': {
    key: 'group',
    skin: 'logo-strip',
    stripIndex: 0,
    standin: true,
    extra: 'The rooftop-location rail runs live in <a href="model-bars.html#group">the library&rsquo;s group-site section</a>.',
  },
  Honda: { key: 'acura', skin: 'white', standin: true },
  Hyundai: { key: 'hyundai', skin: 'white', roster: R.hyundai },
  INFINITI: { note: 'INFINITI&rsquo;s bar is a static tile grid &mdash; no slider. The shape runs live in <a href="model-bars.html#static-bars">the non-slider family</a> (landscape variant).' },
  Jaguar: { key: 'buick', skin: 'white', standin: true, extra: 'Jaguar dresses these tiers as photo cards with a tagline below each model.' },
  Kia: {
    key: 'acura',
    skin: 'white',
    standin: true,
    extra: 'Kia also ships a tabbed version and a centre-mode version &mdash; the centre-mode recipe is <a href="index.html#peek">the peek pattern</a>.',
  },
  'Land Rover': { key: 'buick', skin: 'white', standin: true, extra: 'Land Rover dresses these tiers as photo cards, same as Jaguar.' },
  Lexus: { key: 'lexus', skin: 'band-gray', roster: R.lexus },
  Lincoln: { key: 'lincoln', skin: 'band-flat', roster: R.lincoln },
  Maserati: { key: 'maserati', skin: 'spotlight', standin: true },
  Mazda: { key: 'mazda', skin: 'name-top-chip', roster: R.mazda },
  Mitsubishi: { key: 'acura', skin: 'white', standin: true },
  Nissan: { key: 'lexus', skin: 'white', standin: true, extra: 'Nissan wears these tiers under body-style tabs with an est-MPG line per model.' },
  Porsche: { note: 'Porsche&rsquo;s bar is a hover-reveal photo tile grid &mdash; no slider. The shape runs live in <a href="model-bars.html#static-bars">the non-slider family</a>.' },
  Powersports: { key: 'powersports-cat', skin: 'category-tile', standin: true },
  Subaru: { key: 'chevrolet', skin: 'white', standin: true, extra: 'Subaru wears this ladder under five icon tabs on the real sites.' },
  Toyota: { key: 'toyota', skin: 'photo-card', roster: R.toyota },
  Volkswagen: { key: 'genesis', skin: 'tile', standin: true },
  Volvo: { key: 'chevrolet', skin: 'white', standin: true },
};

const brandSlug = (b) =>
  b
    .toLowerCase()
    .replace(/[^a-z]+/g, '-')
    .replace(/^-|-$/g, '');

const brandCss = BRANDS.map(([brand]) => {
  const r = BRAND_RENDER[brand];
  if (!r || r.note) return '';
  const v = byKey[r.key];
  const s = r.stripIndex !== undefined ? v.strips[r.stripIndex] : { skin: r.skin };
  return stripComments(recipeCss(v, { ...s, skin: r.skin })).replaceAll('.my-modelbar', `.bb-${brandSlug(brand)}`);
})
  .filter(Boolean)
  .join('\n\n');

const brandSections = BRANDS.map(([brand, what, tiers, copies, host]) => {
  const r = BRAND_RENDER[brand] ?? {};
  const slug = brandSlug(brand);
  const links = copies.map(([href, label]) => `<a href="${href}">${label}</a>`).join(' &middot; ');
  const standinChip = r.standin ? ' <span class="demo-standin">stand-in photos</span>' : '';
  let body;
  if (r.note) {
    body = `        <p class="brand-note">${r.note}</p>`;
  } else {
    const v = byKey[r.key];
    const s = r.stripIndex !== undefined ? v.strips[r.stripIndex] : {};
    const roster = r.roster ?? s.roster ?? CHEVY;
    if (s.tabbed) {
      // the full tabbed unit, exactly as the library renders it (same helper)
      body = stage(r.skin, tabbedLive(`bb-${slug}`, s, roster, brand));
    } else {
      const attrs = `data-slider data-step="slide"${s.autoplay ? ` data-autoplay="${s.autoplay}"` : ''}`;
      const slides = SKINS[r.skin]
        .liveSlides(roster)
        .map((a) => `            <li class="dl-carousel-slide">${a.replaceAll('my-modelbar', `bb-${slug}`)}</li>`)
        .join('\n');
      body = stage(
        r.skin,
        `          <div class="dl-carousel bb-${slug}" ${attrs} aria-labelledby="b-${slug}-h">
            <ul class="dl-carousel-track">
${slides}
            </ul>
          </div>`,
      );
    }
  }
  const extra = r.extra ? `\n        <p class="brand-note">${r.extra}</p>` : '';
  return `      <section class="demo-section" id="b-${slug}">
        <h2 id="b-${slug}-h">${brand}${standinChip}<a class="demo-anchor" href="#b-${slug}" aria-label="Link to this section">#</a></h2>
        <p class="demo-sub">${what}. Cards per view: ${tiers}. Copy the finished build: ${links}. Official example: <a href="https://${host}.dealeron.com/">${host}</a>.</p>
${body}${extra}
      </section>`;
}).join('\n\n');

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
    <script src="assets/vendor/prism.js" defer></script>
    <script src="assets/demo.js" defer></script>
    <style>
      /* Page chrome shared with the other demo pages lives in assets/demo.css. */
      .demo-standin {
        display: inline-block;
        padding: 0.1rem 0.55rem;
        font-size: 0.68rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        color: #6b4a00;
        text-transform: uppercase;
        vertical-align: middle;
        background: #faeedd;
        border-radius: 999px;
      }
      .brand-note {
        max-width: 68ch;
        margin: 0.5rem 0 0;
        color: #5f6368;
      }
      .demo-section > h2 {
        margin: 0 0 0.35rem;
        font-size: 1.5rem;
        line-height: 1.25;
      }
      /* Every strip below is its library recipe, class-renamed - rendered and
         taught stay one, same rule as the model bar library page. */
${brandCss
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
        <a href="model-bars.html">Model bar library</a>
        <a href="brands.html" aria-current="page">Find your brand</a>
        <a href="index.html#start">Start here</a>
        <a href="index.html#options">Options</a>
      </nav>
    </header>
    <main id="main">
      <h1>Find your brand</h1>
      <p class="demo-lede">
        Handed a site and told &ldquo;add the model bar&rdquo;? Look the brand up here: what its bar actually is (a slider, a tabbed slider, or no slider at all), how many cards it shows at each
        width, where on these pages to copy the finished build, and the official example site to compare against.
      </p>
      <div class="demo-search">
        <label for="demo-filter">Filter brands</label>
        <input id="demo-filter" type="text" autocomplete="off" placeholder="e.g. Kia, tabs, no slider" />
        <p class="demo-vh" role="status" id="demo-filter-count"></p>
      </div>
${brandSections}

      <p>
        Ladders and looks in engineering detail run on the <a href="model-bars.html">model bar library</a>; generic patterns and the install step live on <a href="index.html">the main demo</a>.
        Sites named here are internal demo sites, safe to open and compare against. Brands marked <span class="demo-standin">stand-in photos</span> render their real ladder and look with Chevrolet
        cutouts standing in until their own imagery lands.
      </p>
    </main>
${FOOT}
    <!-- The type-to-filter, copy buttons, section jump and scrollspy all come
         from assets/demo.js, shared with the other demo pages. -->
  </body>
</html>
`;

fs.writeFileSync('demo/brands.html', brandsPage);
console.log('demo/brands.html written:', BRANDS.length, 'brands');

// ---- the library page's brand-alias index -----------------------------------
// Every brand that wears a shared ladder (or a non-slider family), linked to
// its exact look — derived from the same BRANDS/BRAND_RENDER data as the
// directory so the two cannot drift. Brands whose ladder is named after them
// are already section headings and are skipped.
const TOC_ALIASES = [
  ...BRANDS.flatMap(([brand]) => {
    const r = BRAND_RENDER[brand];
    if (!r?.key) return [];
    const anchor = byKey[r.key].toc;
    if (anchor === brand || anchor.startsWith(brand) || brand === 'Group sites') return [];
    return [[brand, `#${lookAnchor(r.key, r.skin)}`]];
  }),
  ['BMW', '#static-bars'],
  ['Fiat', '#cdjr'],
  ['INFINITI', '#static-bars'],
  ['Porsche', '#static-bars'],
].sort((a, b) => a[0].localeCompare(b[0]));

fs.writeFileSync('demo/model-bars.html', modelBarsPage());
console.log(
  'demo/model-bars.html written:',
  VARIANTS.length,
  'ladders,',
  VARIANTS.reduce((n, v) => n + v.strips.length, 0),
  'strips,',
  TOC_ALIASES.length,
  'brand aliases',
);

// ---- truth sync into the hand-written page ----------------------------------
// demo/index.html's picker card quotes this library's strip count; rewrite
// the number from the real data so the two cannot drift.
const stripCount = VARIANTS.reduce((n, v) => n + v.strips.length, 0);
const indexHtml = fs.readFileSync('demo/index.html', 'utf8');
const synced = indexHtml.replace(/\d+ live strips/, `${stripCount} live strips`);
if (synced !== indexHtml) {
  fs.writeFileSync('demo/index.html', synced);
  console.log('demo/index.html picker count synced:', stripCount, 'live strips');
}
