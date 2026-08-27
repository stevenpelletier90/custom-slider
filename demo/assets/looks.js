// The card looks, as components rather than copies.
//
// The old library shipped 17 "skins". Inspecting them, most differ only in
// values: `band-gray`, `band-flat`, `band-dark` and `cdjr-dark` are one card on
// four different strip backgrounds; `category-tile` is the same card with
// uppercase tracked type; `brand-logo` is the same card with a greyscale
// filter. Those are settings, not looks.
//
// What survives here is the set that differs in MARKUP - a split card is not a
// stacked card with different numbers, and no property turns one into the
// other. Six components cover all 17.
//
// Every point of variation is a custom property, so a preset is a handful of
// values and the browser does the rendering. If a new brand needs something no
// property can express, that is a new component - shared, so the next brand
// that wants it selects it rather than getting a copy.

const LOOKS = {
  tile: {
    label: 'Cutout tile',
    // Narrowest card this look's content fits in, measured by narrowing it
    // until text overflowed. The workbench warns rather than letting you cram it.
    minCard: 150,
    perView: { base: 2, 768: 3, 992: 4, 1200: 5 },
    // The workhorse: 14 of 24 brands ship this. Vehicle cutout, name under it.
    absorbs: ['white', 'counts', 'tile', 'band-gray', 'band-flat', 'band-dark', 'cdjr-dark', 'category-tile', 'brand-logo', 'photo-overlay', 'name-top-chip'],
    settings: {
      '--strip-bg': 'transparent',
      '--strip-pad': '0px',
      // Reserves the gutter the arrows sit in. Without it transparent arrows
      // overlay the vehicles instead of standing beside them.
      '--strip-pad-x': 'calc(var(--dlc-arrow-size) + 0.25rem)',
      '--name-color': '#222',
      '--name-size': '1rem',
      '--name-weight': '600',
      '--name-case': 'none',
      '--name-tracking': 'normal',
      '--name-order': '0', // -1 puts the name ABOVE the vehicle
      '--img-filter': 'none',
      '--img-aspect': 'auto',
      '--plate-bg': 'transparent', // coloured plate behind the vehicle
      // The cutouts already carry 13-17% transparent margin below the vehicle
      // (measured across the set), so the plate adds very little underneath or
      // the name drifts away from the car. Raise it when --plate-bg is a real
      // colour and you want the plate to read as a plate.
      '--plate-pad': '6% 6% 1%',
    },
    css: `.dlx { background: var(--strip-bg); padding-block-start: var(--strip-pad); padding-inline: var(--strip-pad-x); }
@media (max-width: 600px) { .dlx { --dlc-arrow-size: 36px; padding-inline: 0; } }
@media (max-width: 380px) { .dlx { --dlc-per-view: 1; } }
.dlx-card { display: flex; flex-direction: column; block-size: 100%; color: inherit; text-align: center; text-decoration: none; }
.dlx-plate { display: block; padding: var(--plate-pad); background: var(--plate-bg); }
.dlx-card img { inline-size: 100%; block-size: auto; aspect-ratio: var(--img-aspect); object-fit: contain; filter: var(--img-filter); transition: filter 0.2s, transform 0.25s ease; }
.dlx-card:hover img { filter: none; }
.dlx-name { order: var(--name-order); margin: 0.4rem 0 0; line-height: 1.35; font-size: var(--name-size); font-weight: var(--name-weight); text-transform: var(--name-case); letter-spacing: var(--name-tracking); color: var(--name-color); }
.dlx-sub { display: block; margin-block-start: 0.15rem; font-size: 0.8rem; line-height: 1.35; color: #5f6368; }`,
    markup: (m) => `<a class="dlx-card" href="${m.href}">
  <span class="dlx-plate"><img src="${m.img}" width="320" height="240" alt="${m.alt}" loading="lazy" decoding="async"></span>
  <p class="dlx-name">${m.name}</p>${m.sub ? `\n  <small class="dlx-sub">${m.sub}</small>` : ''}
</a>`,
  },

  vcard: {
    label: 'Vehicle card',
    // Narrowest card this look's content fits in, measured by narrowing it
    // until text overflowed. The workbench warns rather than letting you cram it.
    minCard: 240,
    perView: { base: 1, 768: 2, 992: 3, 1200: 3 },
    // New, not a merge of anything: the estate had no photo-with-price card,
    // and every SRP-style ask ends up needing one.
    absorbs: [],
    isNew: true,
    settings: {
      '--strip-bg': 'transparent',
      '--strip-pad': '0px',
      '--card-bg': '#ffffff',
      '--card-radius': '10px',
      '--name-color': '#1c1f23',
      '--name-size': '1rem',
      '--price-color': '#16324f',
    },
    css: `.dlx { background: var(--strip-bg); padding-block-start: var(--strip-pad); }
.dlx-card { position: relative; display: flex; flex-direction: column; block-size: 100%; overflow: hidden; color: inherit; text-decoration: none; background: var(--card-bg); border: 1px solid #e2e5ea; border-radius: var(--card-radius); }
.dlx-card img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 4 / 3; object-fit: cover; transition: transform 0.3s ease; }
.dlx-card:hover img { transform: scale(1.04); }
.dlx-body { padding: 0.85rem 0.9rem 1rem; }
.dlx-name { margin: 0; font-size: var(--name-size); font-weight: 700; line-height: 1.35; color: var(--name-color); }
.dlx-sub { display: block; margin-block-start: 0.2rem; font-size: 0.85rem; line-height: 1.4; color: var(--price-color); }`,
    // One stretched link over the whole card: the anchor IS the card, so there
    // is no nested link and nothing announces twice.
    markup: (m) => `<a class="dlx-card" href="${m.href}">
  <img src="${m.img}" width="1200" height="900" alt="${m.alt}" loading="lazy" decoding="async">
  <span class="dlx-body">
    <span class="dlx-name">${m.name}</span>${m.sub ? `\n    <small class="dlx-sub">${m.sub}</small>` : ''}
  </span>
</a>`,
  },

  wordmark: {
    label: 'Wordmark above',
    // Narrowest card this look's content fits in, measured by narrowing it
    // until text overflowed. The workbench warns rather than letting you cram it.
    minCard: 165,
    perView: { base: 1, 768: 2, 992: 3, 1200: 4 },
    // The model's wordmark set above the vehicle - an element the tile has no
    // slot for, which is why this is its own component and not a tile setting.
    absorbs: ['wordmark-dark', 'spotlight'],
    settings: {
      '--strip-bg': 'transparent',
      '--strip-pad': '1.75rem',
      '--name-color': 'inherit',
      '--mark-size': '1.4rem',
      '--name-size': '1rem',
      '--name-case': 'uppercase',
    },
    css: `.dlx { background: var(--strip-bg); padding-block-start: var(--strip-pad); }
.dlx-card { display: block; color: var(--name-color); text-align: center; text-decoration: none; }
.dlx-mark { display: block; margin-block-end: 0.6rem; font-size: var(--mark-size); font-style: italic; font-weight: 700; line-height: 1.2; letter-spacing: 0.06em; }
.dlx-card img { inline-size: 100%; block-size: auto; object-fit: contain; transition: transform 0.25s ease; }
.dlx-name { margin: 0.5rem 0 0; font-size: var(--name-size); font-weight: 600; line-height: 1.35; text-transform: var(--name-case); letter-spacing: 0.1em; }`,
    markup: (m) => `<a class="dlx-card" href="${m.href}">
  <span class="dlx-mark">${m.mark ?? m.name}</span>
  <img src="${m.img}" width="320" height="240" alt="${m.alt}" loading="lazy" decoding="async">
  <p class="dlx-name">${m.name}</p>
</a>`,
  },

  split: {
    label: 'Split photo card',
    // Narrowest card this look's content fits in, measured by narrowing it
    // until text overflowed. The workbench warns rather than letting you cram it.
    minCard: 260,
    perView: { base: 1, 768: 1, 992: 2, 1200: 2 },
    // Photo beside a copy column. Measured on toyotademo2: the card is 2:1 with
    // a SQUARE photo filling half, so the height follows the card's own width
    // rather than the source photo's aspect.
    absorbs: ['photo-card'],
    settings: {
      '--card-bg': '#2f2f2f',
      '--card-fg': '#fff',
      '--pill-bg': '#fff',
      '--pill-fg': '#222',
    },
    css: `.dlx-card { display: flex; overflow: hidden; color: var(--card-fg); text-decoration: none; background: var(--card-bg); border-radius: 8px; }
.dlx-card img { flex: 0 0 50%; inline-size: 50%; aspect-ratio: 1; object-fit: cover; }
.dlx-copy { display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start; min-inline-size: 0; padding: 28px; }
.dlx-sub { font-size: 0.85rem; color: #d9d9d9; }
.dlx-name { margin: 0; font-size: 1.5rem; font-weight: 700; line-height: 1.2; }
.dlx-blurb { font-size: 0.95rem; line-height: 1.4; color: #d9d9d9; }
.dlx-pill { margin-block-start: auto; padding: 0.5rem 1.3rem; font-size: 0.9rem; font-weight: 600; color: var(--pill-fg); background: var(--pill-bg); border-radius: 999px; }
@media (max-width: 600px) { .dlx-copy { gap: 0.35rem; padding: 1rem; } .dlx-name { font-size: 1.15rem; } .dlx-pill { padding: 0.45rem 1rem; font-size: 0.8rem; white-space: nowrap; } }
@media (max-width: 480px) { .dlx-card { flex-direction: column; } .dlx-card img { flex: none; inline-size: 100%; aspect-ratio: 16 / 9; } }`,
    // An absent field emits NO element. Rendering an empty <span> left the copy
    // column with a blank row, and the pill's `margin-block-start: auto` then
    // pushed it to the bottom of a card that looked like it had lost its text.
    markup: (m) =>
      [
        `<a class="dlx-card" href="${m.href}">`,
        `  <img src="${m.img}" width="800" height="800" alt="${m.alt}" loading="lazy" decoding="async">`,
        `  <span class="dlx-copy">`,
        m.sub ? `    <small class="dlx-sub">${m.sub}</small>` : null,
        `    <p class="dlx-name">${m.name}</p>`,
        m.blurb ? `    <span class="dlx-blurb">${m.blurb}</span>` : null,
        `    <span class="dlx-pill">Shop Now</span>`,
        `  </span>`,
        `</a>`,
      ]
        .filter((l) => l !== null)
        .join('\n'),
  },

  portrait: {
    label: 'Tall tile with CTA',
    // Narrowest card this look's content fits in, measured by narrowing it
    // until text overflowed. The workbench warns rather than letting you cram it.
    minCard: 165,
    perView: { base: 1, 768: 3, 992: 4, 1200: 4 },
    // Name ABOVE a portrait photo, button underneath. The button is markup the
    // tile has no slot for.
    absorbs: ['tall-tile'],
    settings: {
      '--strip-bg': '#14161b',
      '--card-fg': '#fff',
      '--cta-bg': '#fff',
      '--cta-fg': '#14161b',
      '--img-aspect': '3 / 5',
    },
    css: `.dlx { background: var(--strip-bg); padding-block-start: 1.5rem; padding-inline: 1.5rem; }
.dlx-card { display: block; color: var(--card-fg); text-align: center; text-decoration: none; }
.dlx-name { margin: 0 0 0.5rem; font-size: 1.25rem; font-weight: 700; line-height: 1.3; text-align: start; text-transform: uppercase; letter-spacing: 0.08em; }
.dlx-card img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: var(--img-aspect); object-fit: cover; }
.dlx-cta { display: inline-block; margin-block-start: 0.75rem; padding: 0.6rem 1.4rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: var(--cta-fg); background: var(--cta-bg); }`,
    markup: (m) => `<a class="dlx-card" href="${m.href}">
  <p class="dlx-name">${m.name}</p>
  <img src="${m.img}" width="320" height="533" alt="${m.alt}" loading="lazy" decoding="async">
  <span class="dlx-cta">Browse inventory</span>
</a>`,
  },

  logo: {
    label: 'Logo panel',
    // Narrowest card this look's content fits in, measured by narrowing it
    // until text overflowed. The workbench warns rather than letting you cram it.
    minCard: 165,
    perView: { base: 2, 768: 3, 992: 4, 1200: 6 },
    // A bordered panel with a centred mark, no name at all - the card IS the
    // panel, which no tile setting produces.
    absorbs: ['logo-strip'],
    settings: {
      '--strip-bg': '#16294f',
      '--card-bg': '#253a5e',
      '--card-fg': '#fff',
    },
    css: `.dlx { padding-block-start: 1.5rem; padding-inline: 1rem; background: var(--strip-bg); }
@media (max-width: 460px) { .dlx { --dlc-per-view: 1; padding-block-start: 1rem; padding-inline: 0.5rem; } }
.dlx-card { display: flex; align-items: center; justify-content: center; aspect-ratio: 3 / 2; padding: 1rem; color: var(--card-fg); background: var(--card-bg); border: 1px solid rgb(255 255 255 / 7%); border-radius: 10px; transition: background 0.2s; }
.dlx-card img { inline-size: 75%; block-size: auto; object-fit: contain; }`,
    markup: (m) => `<a class="dlx-card" href="${m.href}" aria-label="${m.alt}">
  <img src="${m.img}" width="240" height="160" alt="" loading="lazy" decoding="async">
</a>`,
  },

  location: {
    label: 'Location card',
    // Narrowest card this look's content fits in, measured by narrowing it
    // until text overflowed. The workbench warns rather than letting you cram it.
    minCard: 170,
    perView: { base: 1, 768: 2, 992: 3, 1200: 3 },
    // Name, address line and a Visit button. Not a vehicle card at all.
    absorbs: ['location-card'],
    settings: {
      '--strip-bg': '#f4f6f8',
      '--card-bg': '#fff',
      '--cta-bg': '#c8102e',
      '--cta-fg': '#fff',
    },
    css: `.dlx { padding-block-start: 1.5rem; padding-inline: 1rem; background: var(--strip-bg); }
.dlx-card { display: flex; flex-direction: column; align-items: center; block-size: 100%; padding: 1.25rem; text-align: center; text-decoration: none; background: var(--card-bg); border-radius: 10px; }
.dlx-card img { inline-size: 55%; block-size: auto; object-fit: contain; }
.dlx-name { margin: 0.5rem 0 0.4rem; font-size: 1.1rem; font-weight: 700; line-height: 1.3; color: #222; }
.dlx-card p { margin: 0 0 0.9rem; font-size: 0.9rem; color: #5f6368; }
.dlx-cta { margin-block-start: auto; padding: 0.5rem 1.3rem; font-size: 0.8rem; font-weight: 700; color: var(--cta-fg); background: var(--cta-bg); border-radius: 999px; }`,
    // An absent field emits NO element - see the note on the split look.
    markup: (m) =>
      [
        `<a class="dlx-card" href="${m.href}">`,
        `  <img src="${m.img}" width="240" height="160" alt="${m.alt}" loading="lazy" decoding="async">`,
        `  <span class="dlx-name">${m.name}</span>`,
        m.sub ? `  <p>${m.sub}</p>` : null,
        `  <span class="dlx-cta">Visit</span>`,
        `</a>`,
      ]
        .filter((l) => l !== null)
        .join('\n'),
  },
};

// Every skin the old library shipped, so the guard can prove none was dropped.
const OLD_SKINS = [
  'white',
  'band-gray',
  'band-flat',
  'counts',
  'tile',
  'band-dark',
  'name-top-chip',
  'photo-card',
  'tall-tile',
  'cdjr-dark',
  'category-tile',
  'brand-logo',
  'wordmark-dark',
  'photo-overlay',
  'spotlight',
  'logo-strip',
  'location-card',
];

// Classic script, not an ES module, on purpose: modules are blocked over
// file://, and this demo has always had to work when opened by double-click.
globalThis.DLX = { LOOKS, OLD_SKINS };
