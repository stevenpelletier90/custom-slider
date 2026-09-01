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
// other. Six components cover all 17 old skins; a seventh, the vehicle card,
// is new.
//
// Every point of variation is a custom property, so a preset is a handful of
// values and the browser does the rendering. If a new brand needs something no
// property can express, that is a new component - shared, so the next brand
// that wants it selects it rather than getting a copy.

const LOOKS = {
  tile: {
    // A vehicle cutout with its name under it - no card, no plate.
    icon: `<svg viewBox="0 0 44 30" fill="none" aria-hidden="true"><path d="M9 16h26l-3-5.5a3 3 0 0 0-2.6-1.5H14.6A3 3 0 0 0 12 10.5L9 16Z" fill="currentColor" opacity=".85"/><rect x="7" y="15.5" width="30" height="3.5" rx="1.6" fill="currentColor" opacity=".85"/><circle cx="14" cy="19.5" r="2.6" fill="currentColor"/><circle cx="30" cy="19.5" r="2.6" fill="currentColor"/><rect x="13" y="25" width="18" height="2.4" rx="1.2" fill="currentColor" opacity=".45"/></svg>`,
    label: 'Cutout tile',
    note: 'The workhorse - a vehicle cutout with its name under it. Fourteen of the 24 brands in the census ship this one.',
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
      '--strip-pad-x': 'calc(var(--cs-arrow-size) + 0.25em)',
      '--name-color': '#222',
      '--name-size': '1em',
      '--name-weight': '600',
      '--name-case': 'none',
      '--name-tracking': 'normal',
      '--name-order': '0', // -1 puts the name ABOVE the vehicle
      '--img-filter': 'none',
      '--img-aspect': 'auto',
      // Zoom on hover. 1 is off, and off is the default: a model bar sits above
      // the fold on most of these sites and a strip that grows under the cursor
      // is a decision to make deliberately, not one to inherit.
      '--img-hover-scale': '1',
      '--plate-bg': 'transparent', // coloured plate behind the vehicle
      // The cutouts already carry 13-17% transparent margin below the vehicle
      // (measured across the set), so the plate adds very little underneath or
      // the name drifts away from the car. Raise it when --plate-bg is a real
      // colour and you want the plate to read as a plate.
      '--plate-pad': '6% 6% 1%',
    },
    css: `%root% { padding-block-start: var(--strip-pad); padding-inline: var(--strip-pad-x); background: var(--strip-bg); }
@media (max-width: 600px) { %root% { --cs-arrow-size: 36px; padding-inline: 0; } }
@media (max-width: 380px) { %root% { --cs-per-view: 1; } }
.cargo-card { display: flex; flex-direction: column; block-size: 100%; color: inherit; text-align: center; text-decoration: none; }
.cargo-media { display: block; overflow: hidden; }
.cargo-card img { box-sizing: border-box; inline-size: 100%; block-size: auto; aspect-ratio: var(--img-aspect); padding: var(--plate-pad); object-fit: contain; background: var(--plate-bg); filter: var(--img-filter); transition: filter 0.2s, transform 0.25s ease; }
.cargo-card:hover img { filter: none; transform: scale(var(--img-hover-scale)); }
@media (prefers-reduced-motion: reduce) { .cargo-card:hover img { transform: none; } }
.cargo-name { order: var(--name-order); margin: 0.4em 0 0; font-size: var(--name-size); font-weight: var(--name-weight); line-height: 1.35; color: var(--name-color); text-transform: var(--name-case); letter-spacing: var(--name-tracking); }
.cargo-sub { display: block; margin-block-start: 0.15em; font-size: 0.8em; line-height: 1.35; color: #5f6368; }`,
    markup: (m) => `<a class="cargo-card" href="${m.href}">
  <span class="cargo-media"><img src="${m.img}" width="${m.w ?? 320}" height="${m.h ?? 240}" alt="${m.alt}" loading="lazy" decoding="async"></span>
  <p class="cargo-name">${m.name}</p>${m.sub ? `\n  <small class="cargo-sub">${m.sub}</small>` : ''}
</a>`,
  },

  vcard: {
    // Photo on top, title and price under it, all inside one card.
    icon: `<svg viewBox="0 0 44 30" fill="none" aria-hidden="true"><rect x="6.5" y="3.5" width="31" height="23" rx="3" stroke="currentColor" opacity=".5"/><rect x="9" y="6" width="26" height="11" rx="1.6" fill="currentColor" opacity=".85"/><rect x="9" y="19" width="18" height="2.2" rx="1.1" fill="currentColor" opacity=".55"/><rect x="9" y="22.6" width="11" height="2" rx="1" fill="currentColor" opacity=".3"/></svg>`,
    label: 'Vehicle card',
    note: 'Photo, title and price in one card, made clickable by a single stretched link.',
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
      // Reserves the gutter the arrows sit in. Without it a transparent
      // arrow lands on the card's own text instead of beside it.
      '--strip-pad-x': 'calc(var(--cs-arrow-size) + 0.4em)',
      '--card-bg': '#fff',
      '--card-radius': '10px',
      '--name-color': '#1c1f23',
      '--name-size': '1em',
      '--price-color': '#16324f',
    },
    css: `%root% { padding-block-start: var(--strip-pad); padding-inline: var(--strip-pad-x); background: var(--strip-bg); }
@media (max-width: 600px) { %root% { --cs-arrow-size: 36px; } }
.cargo-card { position: relative; display: flex; flex-direction: column; block-size: 100%; overflow: hidden; color: inherit; text-decoration: none; background: var(--card-bg); border: 1px solid #e2e5ea; border-radius: var(--card-radius); }
.cargo-media { display: block; overflow: hidden; }
.cargo-card img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 4 / 3; object-fit: cover; transition: transform 0.3s ease; }
.cargo-card:hover img { transform: scale(1.04); }
@media (prefers-reduced-motion: reduce) { .cargo-card:hover img { transform: none; } }
.cargo-body { display: block; padding: 0.85em 0.9em 1em; line-height: 1.4; }
.cargo-name { display: block; margin: 0; font-size: var(--name-size); font-weight: 700; line-height: 1.35; color: var(--name-color); }
.cargo-sub { display: block; margin-block-start: 0.2em; font-size: 0.85em; line-height: 1.4; color: var(--price-color); }`,
    // One stretched link over the whole card: the anchor IS the card, so there
    // is no nested link and nothing announces twice.
    markup: (m) => `<a class="cargo-card" href="${m.href}">
  <span class="cargo-media"><img src="${m.img}" width="${m.w ?? 1200}" height="${m.h ?? 900}" alt="${m.alt}" loading="lazy" decoding="async"></span>
  <span class="cargo-body">
    <span class="cargo-name">${m.name}</span>${m.sub ? `\n    <small class="cargo-sub">${m.sub}</small>` : ''}
  </span>
</a>`,
  },

  wordmark: {
    // The model wordmark set ABOVE the vehicle - the one slot the tile
    // has no room for, which is why this is its own component.
    icon: `<svg viewBox="0 0 44 30" fill="none" aria-hidden="true"><rect x="12" y="4" width="20" height="2.8" rx="1.4" fill="currentColor" opacity=".85"/><rect x="9" y="12.5" width="26" height="3.5" rx="1.6" fill="currentColor" opacity=".85"/><path d="M11 13h22l-2.4-4a2.6 2.6 0 0 0-2.2-1.2H15.6A2.6 2.6 0 0 0 13.4 9L11 13Z" fill="currentColor" opacity=".45"/><circle cx="15.5" cy="16.5" r="2.2" fill="currentColor"/><circle cx="28.5" cy="16.5" r="2.2" fill="currentColor"/><rect x="13" y="22" width="18" height="2.4" rx="1.2" fill="currentColor" opacity=".45"/></svg>`,
    label: 'Wordmark above',
    note: "The model's wordmark set above the vehicle - the one slot the cutout tile has no room for.",
    // Narrowest card this look's content fits in, measured by narrowing it
    // until text overflowed. The workbench warns rather than letting you cram it.
    minCard: 165,
    perView: { base: 1, 768: 2, 992: 3, 1200: 4 },
    // The model's wordmark set above the vehicle - an element the tile has no
    // slot for, which is why this is its own component and not a tile setting.
    absorbs: ['wordmark-dark', 'spotlight'],
    settings: {
      '--strip-bg': 'transparent',
      '--strip-pad': '1.75em',
      '--name-color': 'inherit',
      '--mark-size': '1.4em',
      '--name-size': '1em',
      '--name-case': 'uppercase',
    },
    css: `%root% { padding-block-start: var(--strip-pad); background: var(--strip-bg); }
.cargo-card { display: block; color: var(--name-color); text-align: center; text-decoration: none; }
.cargo-mark { display: block; margin-block-end: 0.6em; font-size: var(--mark-size); font-style: italic; font-weight: 700; line-height: 1.2; letter-spacing: 0.06em; }
.cargo-card img { inline-size: 100%; block-size: auto; object-fit: contain; transition: transform 0.25s ease; }
.cargo-name { margin: 0.5em 0 0; font-size: var(--name-size); font-weight: 600; line-height: 1.35; text-transform: var(--name-case); letter-spacing: 0.1em; }`,
    // No `mark` means no wordmark element - falling back to the model name
    // printed it twice in every card.
    markup: (m) =>
      [
        `<a class="cargo-card" href="${m.href}">`,
        m.mark ? `  <span class="cargo-mark">${m.mark}</span>` : null,
        `  <img src="${m.img}" width="${m.w ?? 320}" height="${m.h ?? 240}" alt="${m.alt}" loading="lazy" decoding="async">`,
        `  <p class="cargo-name">${m.name}</p>`,
        `</a>`,
      ]
        .filter((l) => l !== null)
        .join('\n'),
  },

  split: {
    // Photo down one half, copy and a pill down the other.
    icon: `<svg viewBox="0 0 44 30" fill="none" aria-hidden="true"><rect x="4.5" y="6.5" width="35" height="17" rx="3" stroke="currentColor" opacity=".5"/><path d="M7 9.5a2 2 0 0 1 2-2h11v15H9a2 2 0 0 1-2-2v-11Z" fill="currentColor" opacity=".85"/><rect x="23" y="10" width="13" height="2.4" rx="1.2" fill="currentColor" opacity=".55"/><rect x="23" y="14" width="9" height="1.8" rx=".9" fill="currentColor" opacity=".3"/><rect x="23" y="18" width="10" height="3.4" rx="1.7" fill="currentColor" opacity=".55"/></svg>`,
    label: 'Split photo card',
    note: 'Photo down one half, copy and a button down the other. Needs a wide card: 260px is the floor.',
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
    css: `.cargo-card { display: flex; overflow: hidden; color: var(--card-fg); text-decoration: none; background: var(--card-bg); border-radius: 8px; }
.cargo-card img { flex: 0 0 50%; inline-size: 50%; aspect-ratio: 1; object-fit: cover; }
.cargo-copy { display: flex; flex-direction: column; gap: 0.5em; align-items: flex-start; min-inline-size: 0; padding: 28px; }
.cargo-sub { font-size: 0.85em; color: #d9d9d9; }
.cargo-name { display: block; margin: 0; font-size: 1.5em; font-weight: 700; line-height: 1.2; }
.cargo-blurb { font-size: 0.95em; line-height: 1.4; color: #d9d9d9; }
.cargo-pill { padding: 0.5em 1.3em; margin-block-start: auto; font-size: 0.9em; font-weight: 600; color: var(--pill-fg); background: var(--pill-bg); border-radius: 999px; }
@media (max-width: 600px) { .cargo-copy { gap: 0.35em; padding: 1em; } .cargo-name { font-size: 1.15em; } .cargo-pill { padding: 0.45em 1em; font-size: 0.8em; white-space: nowrap; } }
@media (max-width: 480px) { .cargo-card { flex-direction: column; } .cargo-card img { flex: none; inline-size: 100%; aspect-ratio: 16 / 9; } }`,
    // An absent field emits NO element. Rendering an empty <span> left the copy
    // column with a blank row, and the pill's `margin-block-start: auto` then
    // pushed it to the bottom of a card that looked like it had lost its text.
    markup: (m) =>
      [
        `<a class="cargo-card" href="${m.href}">`,
        `  <img src="${m.img}" width="${m.w ?? 800}" height="${m.h ?? 800}" alt="${m.alt}" loading="lazy" decoding="async">`,
        `  <span class="cargo-copy">`,
        m.sub ? `    <small class="cargo-sub">${m.sub}</small>` : null,
        `    <span class="cargo-name">${m.name}</span>`,
        m.blurb ? `    <span class="cargo-blurb">${m.blurb}</span>` : null,
        `    <span class="cargo-pill">Shop Now</span>`,
        `  </span>`,
        `</a>`,
      ]
        .filter((l) => l !== null)
        .join('\n'),
  },

  portrait: {
    // Tall photo with the name and a button over the bottom of it.
    icon: `<svg viewBox="0 0 44 30" fill="none" aria-hidden="true"><rect x="13.5" y="2.5" width="17" height="25" rx="3" fill="currentColor" opacity=".85"/><rect x="16" y="17" width="12" height="2.2" rx="1.1" fill="var(--wb-icon-bg, #fff)" opacity=".9"/><rect x="16" y="21" width="12" height="4" rx="2" fill="var(--wb-icon-bg, #fff)" opacity=".55"/></svg>`,
    label: 'Tall tile with CTA',
    note: 'Tall photography with the name and a button over the bottom of the image.',
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
    css: `%root% { padding-block-start: 1.5em; padding-inline: 1.5em; background: var(--strip-bg); }
.cargo-card { display: block; color: var(--card-fg); text-align: center; text-decoration: none; }
.cargo-name { min-block-size: 2.6em; margin: 0 0 0.5em; font-size: 1.25em; font-weight: 700; line-height: 1.3; color: var(--card-fg); text-align: start; text-transform: uppercase; letter-spacing: 0.08em; }
.cargo-card img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: var(--img-aspect); object-fit: cover; }
.cargo-cta { display: inline-block; padding: 0.6em 1.4em; margin-block-start: 0.75em; font-size: 0.75em; font-weight: 700; color: var(--cta-fg); text-transform: uppercase; letter-spacing: 0.15em; background: var(--cta-bg); }`,
    markup: (m) => `<a class="cargo-card" href="${m.href}">
  <p class="cargo-name">${m.name}</p>
  <img src="${m.img}" width="${m.w ?? 320}" height="${m.h ?? 533}" alt="${m.alt}" loading="lazy" decoding="async">
  <span class="cargo-cta">Browse inventory</span>
</a>`,
  },

  logo: {
    // A logo centred on a filled panel - brand strips, nothing else.
    icon: `<svg viewBox="0 0 44 30" fill="none" aria-hidden="true"><rect x="5.5" y="5.5" width="33" height="19" rx="3" fill="currentColor" opacity=".85"/><circle cx="22" cy="15" r="5" fill="var(--wb-icon-bg, #fff)" opacity=".9"/><rect x="17" y="14" width="10" height="2" rx="1" fill="currentColor" opacity=".85"/></svg>`,
    label: 'Logo panel',
    note: 'Built for a strip of manufacturer logos on a dark panel, not for vehicles - which is why it looks odd under a model bar. The navy is only --strip-bg and --card-bg; change them below.',
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
    css: `%root% { padding-block-start: 1.5em; padding-inline: 1em; background: var(--strip-bg); }
%root% .cs-track { padding-block-end: 1.5em; }
@media (max-width: 460px) { %root% { --cs-per-view: 1; padding-block-start: 1em; padding-inline: 0.5em; } %root% .cs-track { padding-block-end: 1em; } }
.cargo-card { display: flex; align-items: center; justify-content: center; aspect-ratio: 3 / 2; padding: 1em; color: var(--card-fg); background: var(--card-bg); border: 1px solid rgb(255 255 255 / 7%); border-radius: 10px; transition: background 0.2s; }
.cargo-card img { inline-size: 75%; block-size: auto; object-fit: contain; }`,
    markup: (m) => `<a class="cargo-card" href="${m.href}" aria-label="${m.alt}">
  <img src="${m.img}" width="${m.w ?? 240}" height="${m.h ?? 160}" alt="" loading="lazy" decoding="async">
</a>`,
  },

  location: {
    // Storefront photo, the store name, then a coloured action bar.
    icon: `<svg viewBox="0 0 44 30" fill="none" aria-hidden="true"><rect x="6.5" y="3.5" width="31" height="23" rx="3" stroke="currentColor" opacity=".5"/><rect x="9" y="6" width="26" height="9" rx="1.6" fill="currentColor" opacity=".85"/><rect x="9" y="17" width="15" height="2.2" rx="1.1" fill="currentColor" opacity=".45"/><rect x="9" y="21" width="26" height="3.2" rx="1.6" fill="currentColor" opacity=".85"/></svg>`,
    label: 'Location card',
    note: 'A dealership: storefront photo, the store name, and a coloured action bar.',
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
    css: `%root% { padding-block-start: 1.5em; padding-inline: 1em; background: var(--strip-bg); }
.cargo-card { display: flex; flex-direction: column; align-items: center; block-size: 100%; padding: 1.25em; text-align: center; text-decoration: none; background: var(--card-bg); border-radius: 10px; }
.cargo-card img { inline-size: 55%; block-size: auto; object-fit: contain; }
.cargo-name { margin: 0.5em 0 0.4em; font-size: 1.1em; font-weight: 700; line-height: 1.3; color: #222; }
.cargo-card p { margin: 0 0 0.9em; font-size: 0.9em; color: #5f6368; }
.cargo-cta { padding: 0.5em 1.3em; margin-block-start: auto; font-size: 0.8em; font-weight: 700; color: var(--cta-fg); background: var(--cta-bg); border-radius: 999px; }`,
    // An absent field emits NO element - see the note on the split look.
    markup: (m) =>
      [
        `<a class="cargo-card" href="${m.href}">`,
        `  <img src="${m.img}" width="${m.w ?? 240}" height="${m.h ?? 160}" alt="${m.alt}" loading="lazy" decoding="async">`,
        `  <span class="cargo-name">${m.name}</span>`,
        m.sub ? `  <p>${m.sub}</p>` : null,
        `  <span class="cargo-cta">Visit</span>`,
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
globalThis.CARGO = { LOOKS, OLD_SKINS };
