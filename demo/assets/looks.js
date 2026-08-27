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
    // The workhorse: 14 of 24 brands ship this. Vehicle cutout, name under it.
    absorbs: ['white', 'counts', 'tile', 'band-gray', 'band-flat', 'band-dark', 'cdjr-dark', 'category-tile', 'brand-logo', 'photo-overlay', 'name-top-chip'],
    settings: {
      '--strip-bg': 'transparent',
      '--strip-pad': '0px',
      '--name-color': '#222',
      '--name-size': '1rem',
      '--name-weight': '600',
      '--name-case': 'none',
      '--name-tracking': 'normal',
      '--name-order': '0', // -1 puts the name ABOVE the vehicle
      '--img-filter': 'none',
      '--img-aspect': 'auto',
      '--plate-bg': 'transparent', // coloured plate behind the vehicle
    },
    css: `.dlx { background: var(--strip-bg); padding-block: var(--strip-pad); }
.dlx-card { display: flex; flex-direction: column; block-size: 100%; color: inherit; text-align: center; text-decoration: none; }
.dlx-plate { display: block; padding: 8% 6%; background: var(--plate-bg); }
.dlx-card img { inline-size: 100%; block-size: auto; aspect-ratio: var(--img-aspect); object-fit: contain; filter: var(--img-filter); transition: filter 0.2s, transform 0.25s ease; }
.dlx-card:hover img { filter: none; }
.dlx-name { order: var(--name-order); margin: 0.4rem 0 0; font-size: var(--name-size); font-weight: var(--name-weight); text-transform: var(--name-case); letter-spacing: var(--name-tracking); color: var(--name-color); }
.dlx-sub { display: block; margin-block-start: 0.15rem; font-size: 0.8rem; color: #5f6368; }`,
    markup: (m) => `<a class="dlx-card" href="${m.href}">
  <span class="dlx-plate"><img src="${m.img}" width="320" height="240" alt="${m.alt}" loading="lazy" decoding="async"></span>
  <p class="dlx-name">${m.name}</p>${m.sub ? `\n  <small class="dlx-sub">${m.sub}</small>` : ''}
</a>`,
  },

  wordmark: {
    label: 'Wordmark above',
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
    css: `.dlx { background: var(--strip-bg); padding-block: var(--strip-pad); }
.dlx-card { display: block; color: var(--name-color); text-align: center; text-decoration: none; }
.dlx-mark { display: block; margin-block-end: 0.6rem; font-size: var(--mark-size); font-style: italic; font-weight: 700; letter-spacing: 0.06em; }
.dlx-card img { inline-size: 100%; block-size: auto; object-fit: contain; transition: transform 0.25s ease; }
.dlx-name { margin: 0.5rem 0 0; font-size: var(--name-size); font-weight: 600; text-transform: var(--name-case); letter-spacing: 0.1em; }`,
    markup: (m) => `<a class="dlx-card" href="${m.href}">
  <span class="dlx-mark">${m.mark ?? m.name}</span>
  <img src="${m.img}" width="320" height="240" alt="${m.alt}" loading="lazy" decoding="async">
  <p class="dlx-name">${m.name}</p>
</a>`,
  },

  split: {
    label: 'Split photo card',
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
.dlx-name { margin: 0; font-size: 1.5rem; font-weight: 700; }
.dlx-blurb { font-size: 0.95rem; line-height: 1.4; color: #d9d9d9; }
.dlx-pill { margin-block-start: auto; padding: 0.5rem 1.3rem; font-size: 0.9rem; font-weight: 600; color: var(--pill-fg); background: var(--pill-bg); border-radius: 999px; }
@media (max-width: 600px) { .dlx-copy { gap: 0.35rem; padding: 1rem; } .dlx-name { font-size: 1.15rem; } .dlx-pill { padding: 0.45rem 1rem; font-size: 0.8rem; white-space: nowrap; } }`,
    markup: (m) => `<a class="dlx-card" href="${m.href}">
  <img src="${m.img}" width="800" height="800" alt="${m.alt}" loading="lazy" decoding="async">
  <span class="dlx-copy">
    <small class="dlx-sub">${m.sub ?? ''}</small>
    <p class="dlx-name">${m.name}</p>
    <span class="dlx-blurb">${m.blurb ?? ''}</span>
    <span class="dlx-pill">Shop Now</span>
  </span>
</a>`,
  },

  portrait: {
    label: 'Tall tile with CTA',
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
    css: `.dlx { background: var(--strip-bg); padding: 1.5rem; }
.dlx-card { display: block; color: var(--card-fg); text-align: center; text-decoration: none; }
.dlx-name { margin: 0 0 0.5rem; font-size: 1.25rem; font-weight: 700; text-align: start; text-transform: uppercase; letter-spacing: 0.08em; }
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
    // A bordered panel with a centred mark, no name at all - the card IS the
    // panel, which no tile setting produces.
    absorbs: ['logo-strip'],
    settings: {
      '--strip-bg': '#16294f',
      '--card-bg': '#253a5e',
      '--card-fg': '#fff',
    },
    css: `.dlx { padding: 1.5rem 1rem; background: var(--strip-bg); }
.dlx-card { display: flex; align-items: center; justify-content: center; aspect-ratio: 3 / 2; padding: 1rem; color: var(--card-fg); background: var(--card-bg); border: 1px solid rgb(255 255 255 / 7%); border-radius: 10px; transition: background 0.2s; }
.dlx-card img { inline-size: 75%; block-size: auto; object-fit: contain; }`,
    markup: (m) => `<a class="dlx-card" href="${m.href}" aria-label="${m.alt}">
  <img src="${m.img}" width="240" height="160" alt="" loading="lazy" decoding="async">
</a>`,
  },

  location: {
    label: 'Location card',
    // Name, address line and a Visit button. Not a vehicle card at all.
    absorbs: ['location-card'],
    settings: {
      '--strip-bg': '#f4f6f8',
      '--card-bg': '#fff',
      '--cta-bg': '#c8102e',
      '--cta-fg': '#fff',
    },
    css: `.dlx { padding: 1.5rem 1rem; background: var(--strip-bg); }
.dlx-card { display: flex; flex-direction: column; align-items: center; block-size: 100%; padding: 1.25rem; text-align: center; text-decoration: none; background: var(--card-bg); border-radius: 10px; }
.dlx-card img { inline-size: 55%; block-size: auto; object-fit: contain; }
.dlx-name { margin: 0.5rem 0 0.4rem; font-size: 1.1rem; font-weight: 700; color: #222; }
.dlx-card p { margin: 0 0 0.9rem; font-size: 0.9rem; color: #5f6368; }
.dlx-cta { margin-block-start: auto; padding: 0.5rem 1.3rem; font-size: 0.8rem; font-weight: 700; color: var(--cta-fg); background: var(--cta-bg); border-radius: 999px; }`,
    markup: (m) => `<a class="dlx-card" href="${m.href}">
  <img src="${m.img}" width="240" height="160" alt="${m.alt}" loading="lazy" decoding="async">
  <span class="dlx-name">${m.name}</span>
  <p>${m.sub ?? ''}</p>
  <span class="dlx-cta">Visit</span>
</a>`,
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
