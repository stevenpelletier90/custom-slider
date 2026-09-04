// The workbench: one component per pattern, settings that drive it, and code
// generated from the same settings.
//
// The whole state model is the `state` object below. Applying it writes a
// stylesheet; showing the code prints that same stylesheet with the live class
// swapped for the one you would paste. There is no second source, so the code
// panel cannot drift from the preview - which is the bug the old hand-written
// recipes had, and why a checker existed to police them.
//
// Scope guard from the spec: a settings object, a template string, and one
// stylesheet element. No framework, no reactivity, no build step. If this
// starts wanting one, stop and re-open the design.

(() => {
  const { LOOKS, BRANDS, perViewFor } = globalThis.CARGO;

  // The platform's Bootstrap 3 grid, measured in its CSS bundle. Not the
  // estate's 461 / 539 / 599 / 990 / 1440 - several of those were an
  // off-by-one, and none line up with the page the slider sits in.
  const BPS = [768, 992, 1200];
  // One vocabulary for the tiers. The panel used to say "phone / 768px and up"
  // while the preview's width buttons said "Phone / Tablet / Laptop / Desktop",
  // so the two halves of the same screen named the same tier differently and
  // neither said these were screen widths. Both read from here now.
  const TIER_LABEL = { base: 'Phone · under 768', 768: 'Tablet · 768+', 992: 'Laptop · 992+', 1200: 'Desktop · 1200+' };

  // A number typed into a slide field reaches the markup, and markup that
  // throws takes the whole builder with it: `'&star;'.repeat(5 - 6)` raises
  // "Invalid count value: -1" inside render(), so the preview and the code
  // panel freeze on the previous card, every later edit throws at the same
  // line - and the bad value is already in localStorage, so the next visit to
  // the Build page boots into a blank screen with nothing to say why. Clamped
  // where the value enters state AND again where the markup is built, so a
  // number saved before this existed cannot take the page down either.
  const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0));

  // The slider's name becomes a CSS class, so it has to be a legal one. Runs of
  // anything else become a single hyphen rather than being DELETED: deleting
  // turned "2024 Specials" into `2024specials`, and a class cannot start with a
  // digit, so the browser threw away all five rules of the copied CSS while the
  // preview went on looking right - the preview is scoped to a different class.
  // A leading digit takes a `slider-` prefix for the same reason.
  const toClass = (v) => {
    const s = String(v)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!s) return '';
    return /^\d/.test(s) ? `slider-${s}` : s;
  };

  const CHEVY = ['silverado-1500', 'colorado', 'tahoe', 'suburban', 'traverse', 'trax', 'equinox', 'trailblazer'];
  const title = (s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const cutouts = CHEVY.map((slug) => ({
    href: `/searchnew.aspx?Model=${encodeURIComponent(title(slug))}`,
    img: `img/chrome-${slug}.webp`,
    // Stated rather than left to each look's fallback: these are what reserve
    // the space before the photo arrives, so a pair that drifts from the file is
    // a page that jumps.
    w: 320,
    h: 240,
    alt: `2026 Chevrolet ${title(slug)}`,
    name: title(slug),
    mark: 'Chevrolet',
    sub: 'In stock now',
    blurb: 'Built for the way you actually drive.',
    // Empty, so the Badge box is offered on the two card styles whose markup
    // draws it and on no others - the readsOf probe hides it everywhere else.
    badge: '',
    cta: '',
  }));

  // Each card names the vehicle its render actually depicts, and the model year
  // is the one in the ChromeData code behind it — so nothing here claims a car
  // it is not showing. All six are 640x480, which is the 4:3 the card crops to.
  const VEHICLES = [
    ['vehicle-1.png', '2025 Honda Pilot EX-L', '$41,900 · 11,200 mi', 'Honda Pilot, front three-quarter studio view'],
    ['vehicle-2.png', '2026 Toyota RAV4', '$34,600 · 6,400 mi', 'Toyota RAV4, front three-quarter studio view'],
    ['vehicle-3.png', '2023 Nissan Rogue SV', '$24,800 · 31,500 mi', 'Nissan Rogue, front three-quarter studio view'],
    ['vehicle-4.png', '2026 Ford Explorer', '$43,200 · 8,900 mi', 'Ford Explorer, front three-quarter studio view'],
    ['vehicle-5.png', '2026 Hyundai Tucson', '$31,400 · 7,300 mi', 'Hyundai Tucson, front three-quarter studio view'],
    ['vehicle-6.png', '2026 Subaru Outback', '$35,700 · 5,100 mi', 'Subaru Outback, front three-quarter studio view'],
  ].map(([f, name, sub, alt]) => ({ img: `img/${f}`, w: 640, h: 480, name, sub, alt, href: '/searchused.aspx', badge: '', cta: '' }));

  // From the platform's own industry-automotive collection, not from Unsplash:
  // every dealer can see it, so these copy out as paths that resolve instead of
  // as placeholders. Sizes are the library's real ones and they are not uniform,
  // which is why pic() reads them rather than asserting one shape for all six.
  const PHOTOS = [
    ['photo-1.jpg', 1200, 800, 'Hand lifting the cap off a brake fluid reservoir under a bonnet'],
    ['photo-2.jpg', 1200, 800, 'Alloy wheel leaning against a stack of new tyres'],
    ['photo-3.jpg', 1200, 800, 'Painter in a protective suit spraying a car in a paint booth'],
    ['photo-4.jpg', 1200, 798, 'Hand held to a dashboard vent to feel the air conditioning'],
    ['photo-5.jpg', 1200, 717, 'Pressure washing a wheel arch'],
    ['photo-6.jpg', 1960, 1308, 'Hand putting a key into a car door at sunset'],
  ].map(([f, w, h, alt]) => ({ img: `img/${f}`, w, h, alt }));

  const pic = (m) => `<img src="${m.img}" width="${m.w ?? 1200}" height="${m.h ?? 750}" alt="${m.alt}" loading="lazy" decoding="async">`;

  // The avatar letter, taken from the name a reader sees rather than from the
  // stored string. Rosters hold names HTML-escaped, so a name a designer types
  // beginning with a quote is stored `&quot;...` and `name[0]` is the "&" of the
  // entity - an ampersand in the circle instead of a letter. Decode first, take
  // the initial, then escape that one character on the way out.
  const ENTITY = { '&amp;': '&', '&quot;': '"', '&#39;': "'", '&lt;': '<', '&gt;': '>' };
  const initial = (name) => {
    const plain = String(name ?? '').replace(/&(?:amp|quot|#39|lt|gt);/g, (e) => ENTITY[e]);
    // The first LETTER, not the first character: a name a designer types as
    // `"Bee" Wilson` would otherwise put a quotation mark in the circle, which
    // is no more a letter than the `&` this started as. Falls back to the first
    // character for a name with no letters in it at all.
    const c = (/\p{L}|\p{N}/u.exec(plain) ?? [])[0] ?? plain.trim()[0] ?? '';
    return c.toUpperCase().replace(/[&<>"]/g, (x) => `&${{ '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot' }[x]};`);
  };

  // A caption under a photo is the usual second request, and the slide was a
  // bare <img> in a <span>, so it meant hand-writing <figure>/<figcaption> and
  // its CSS per slide. Empty stays exactly the markup that shipped before -
  // a <figure> only appears when there is something to put in it.
  // A hero that wants different art on a phone. 68 of the 76 OEM homepages
  // surveyed run a hero whose anatomy is exactly this - a whole-slide link
  // wrapping a <picture> with mobile and desktop sources - and it was the one
  // shape the builder could not produce at all.
  //
  // <source> before <img>, and the <img> stays the desktop one: the browser
  // takes the first <source> whose media matches and falls back to the <img>,
  // so a browser that does not understand <picture> still gets a working
  // photo. 767.98 rather than 767 for the same reason the rest of this file
  // uses it - max-width: 767px against min-width: 768px leaves a dead zone at
  // fractional viewport widths.
  const picture = (m) => (m.phone ? `<picture>\n  <source media="(max-width: 767.98px)" srcset="${m.phone}">\n  ${pic(m)}\n</picture>` : pic(m));

  const photo = (m, attrs = '') => {
    const img = m.href ? `<a href="${m.href}">${picture(m)}</a>` : picture(m);
    return m.caption ? `<figure class="cargo-photo"${attrs}>${img}<figcaption>${m.caption}</figcaption></figure>` : `<span class="cargo-photo"${attrs}>${img}</span>`;
  };

  // Offers the Caption box on a roster. The editor shows a field only where a
  // row carries the key, so this is the whole opt-in - and it is applied per
  // pattern rather than to PHOTOS itself, because the video pattern draws the
  // same rows as .cargo-video and would then have offered a box that goes
  // nowhere. Media gallery is out for the same reason: its video rows are
  // <button>s, and a <figcaption> is not allowed inside one.
  const captioned = (rows) => rows.map((m) => ({ ...m, caption: '' }));

  // One rule for all five photo patterns. A <figure> carries a UA margin of
  // 1em 40px, so the swap would silently inset every slide; and a <figcaption>
  // is a block that otherwise takes the host page's font-size and leading -
  // the same trap the card rules already guard against, one level up.
  const PHOTO_CSS = '.cargo-photo { display: block; margin: 0; }';
  // Appended by cssFor only when a slide actually carries a caption, so an
  // uncaptioned pattern does not paste a rule matching nothing.
  const PHOTO_CAPTION_CSS = '.cargo-photo figcaption { display: block; margin-block-start: 0.5em; font-size: 0.9em; line-height: 1.5; color: #5f6368; }';
  // A linked photo, same rule: an <a> is inline, so without this it takes the
  // host page's leading and the slide ships taller than the preview showed.
  const PHOTO_LINK_CSS = '.cargo-photo a { display: block; }';

  // Tall 3:5 model photography — the "model cards" look, and the reason
  // model-*.jpg is in demo/img.
  // Tall model cards need genuinely tall photography. The only real portrait
  // model art on the platform is Alfa Romeo's, and it is 300x500 - exactly the
  // 3/5 this card crops to, so the crop throws nothing away.
  //
  // It replaced six stock stand-ins captioned Silverado, Equinox, Tahoe,
  // Malibu, Camaro and Corvette that pictured none of those vehicles. A card
  // that names a model has to show that model; the library has no Chevrolet
  // portrait art (only Equinox, Silverado 1500 and Trax exist, and only as
  // 1000x1000 squares), so the pattern uses the marque whose art fits it.
  // Picking a brand in the workbench still swaps the whole roster.
  const MODELS = BRANDS.alfaromeo.models;

  // Deliberately mismatched source files. The point of the example is that the
  // CSS crops them to one shape, so a dealer uploading whatever they have still
  // gets an even row.
  // Real library files at genuinely different shapes — the numbers printed on
  // each card are its actual source size, so they have to be true. Two of the
  // six are files already in the tree rather than fresh copies of the same
  // bytes under a second name.
  const MIXED = [
    ['mixed-1.jpg', 1000, 1000, 'Chevrolet Silverado 1500 pickup, square source', '1000 × 1000 source', 'Square upload — cover-cropped to 4:3.'],
    ['mixed-3.jpg', 1920, 600, 'Buick Enclave on a coastal road, ultra-wide source', '1920 × 600 source', 'Ultra-wide upload — top and bottom get cropped.'],
    ['oem/alfaromeo/giulia-quadrifoglio.jpg', 300, 500, 'Alfa Romeo Giulia Quadrifoglio, tall narrow source', '300 × 500 source', 'Tall and narrow — the most aggressive crop of the set.'],
    ['oem/toyota/corolla.jpg', 800, 744, 'Toyota Corolla, nearly square source', '800 × 744 source', 'Almost square — a light trim off the sides.'],
    ['mixed-2.jpg', 800, 400, 'Nissan Altima sedan, wide source', '800 × 400 source', 'Wide upload — a heavier trim top and bottom.'],
    ['vehicle-3.png', 640, 480, 'Nissan Rogue, 4:3 source', '640 × 480 source', 'Already 4:3 — nothing is lost.'],
  ].map(([f, w, h, alt, name, blurb]) => ({ img: `img/${f}`, w, h, alt, name, blurb }));

  const REVIEWS = [
    ['#7b1fa2', 'Dana W.', '2 weeks ago', 5, 'Painless from test drive to paperwork — in and out in two hours.'],
    ['#1565c0', 'Marcus T.', 'a month ago', 5, "Fair trade-in value and no pressure. Second car we've bought here."],
    ['#00796b', 'Priya S.', '3 months ago', 5, "Service department caught a recall I didn't know about. Honest people."],
    ['#e65100', 'Colin R.', '3 weeks ago', 4, 'Found the exact trim I wanted and they delivered it to my office.'],
    ['#c2185b', 'Aisha B.', '2 months ago', 5, 'First-time buyer — they walked me through financing without the runaround.'],
    ['#2e7d32', 'Gene &amp; Marta L.', 'a week ago', 5, "Five years of oil changes and never an upsell. That's why we come back."],
  ].map(([bg, name, when, stars, quote]) => ({ bg, name, when, stars, quote }));

  // Real pixel sizes, read off the files. cms-paths.js maps all six to real
  // platform paths, so whatever is declared here ships to a dealer page as-is -
  // and width/height are what reserve the space before the photo arrives, which
  // is what stops the page jumping. These used to be hard-coded 1200x750 on
  // every one of them, and not one of the six is that size.
  // Real DealerOn platform pages, not placeholders. These six ship as example
  // content to every site, so a wrong path is worse than no path: '#' reads as
  // 'fill this in', a plausible-but-dead .aspx reads as working and 404s. Each
  // one below was taken from the paths the case docs actually use - /finance
  // 516 times, /trade 502, /service 247, /testdrive 117, /orderparts 80.
  //
  // Body Shop is the exception: there is NO platform page for collision or
  // detailing (zero references to /bodyshop or /collision anywhere), so it
  // points at Service, which is where a dealer's own body-shop page normally
  // hangs. That one is worth re-pointing per site.
  // The photograph has to be OF the thing the card names. These pairs were
  // written against the previous photo set and the files changed subject
  // underneath them when the set was replaced with bigger ones: "Test Drives"
  // ended up captioning a spray booth and "Parts & Accessories" a car key. The
  // sizes are each file's real pixels, so they move with the file too.
  const SERVICES = [
    ['photo-1.jpg', 1200, 800, '/service.aspx', 'Service Center', 'Factory-trained technicians, genuine parts, and online scheduling for everything from oil changes to major repairs.'],
    ['photo-6.jpg', 1960, 1308, '/testdrive.aspx', 'Test Drives', "Book a no-pressure drive online — we'll have the vehicle warmed up and out front when you arrive."],
    ['vehicle-2.png', 640, 480, '/finance.aspx', 'Financing', 'Flexible terms, first-time buyer programs, and pre-approval in minutes without a hit to your credit score.'],
    ['vehicle-4.png', 640, 480, '/trade.aspx', 'Trade-In Appraisal', 'Get a real number for your current vehicle in minutes — good for seven days or 500 miles.'],
    ['photo-2.jpg', 1200, 800, '/orderparts.aspx', 'Parts &amp; Accessories', 'OEM parts counter, accessories, and installation — ordered to your VIN so it fits the first time.'],
    ['photo-3.jpg', 1200, 800, '/service.aspx', 'Body Shop &amp; Detailing', 'Collision repair, paintless dent removal, and full detailing with insurance-claim assistance.'],
  ].map(([f, w, h, href, name, blurb]) => ({ img: `img/${f}`, w, h, name, blurb, alt: '', href, cta: '' }));

  // Photos carrying a category, for the filterable gallery.
  // Built FROM the photo list, never written out again beside it. The two used
  // to be separate hand-written arrays over the same six files, and every one
  // of the six captions here described a different photograph than the file it
  // named - a blue Camaro in a desert for a technician under a lift, a Mustang
  // in a neon car park for a tyre check - with the categories wrong alongside
  // them. So the Filterable gallery demonstrated filtering by nothing true, and
  // a designer who kept the demo alt text shipped descriptions of photos their
  // page does not contain. Reading the caption from PHOTOS makes that
  // impossible rather than merely fixed.
  //
  // The category is the one thing that cannot be derived, so it is stated once
  // per file, keyed by name so a mis-keyed entry is a missing photo rather than
  // a silently shifted one. Checked against the files themselves.
  const CATEGORY = {
    'photo-1.jpg': 'service', // brake fluid reservoir under a bonnet
    'photo-2.jpg': 'service', // alloy wheel and a stack of new tyres
    'photo-3.jpg': 'detailing', // paint booth - finish work, same family as detailing
    'photo-4.jpg': 'service', // air conditioning at the dashboard vent
    'photo-5.jpg': 'detailing', // pressure washing a wheel arch
    'photo-6.jpg': 'driving', // key going into a car door
  };
  const TAGGED = PHOTOS.map((m) => ({ ...m, tag: CATEGORY[m.img.replace('img/', '')] }));

  // The two video patterns promise "posters open a native dialog", and the
  // preview did it - but the wiring lived in the demo page, so the copied code
  // was a poster button with nothing behind it and the parts list showed no
  // JavaScript at all. The dialog, its styling and its handler now ship in the
  // snippet, and the preview runs the very same script, so the promise is the
  // pasted block's rather than the demo's.
  //
  // The dialog body is deliberately empty apart from an HTML comment saying
  // where the embed goes: a native <dialog> is what buys Esc-to-close and the
  // focus trap, and the video itself is the designer's to drop in. Placeholder
  // copy would ship to a dealer page as real text.
  const VIDEO_DIALOG_CSS = `.cargo-vdlg { inline-size: min(94vw, 720px); padding: 1em 1.2em; color: inherit; background: #fff; border: 0; border-radius: 12px; }
.cargo-vdlg::backdrop { background: rgba(0, 0, 0, 0.8); }
.cargo-vdlg-title { margin: 0 0 0.6em; font-size: 1.1em; font-weight: 700; line-height: 1.3; }
.cargo-vdlg-media { display: grid; place-items: center; inline-size: 100%; margin-block-end: 0.8em; font-size: 0.9em; color: #fff; text-align: center; background: #16324f; border-radius: 8px; aspect-ratio: 16 / 9; }
.cargo-vdlg-close { padding: 0.4em 1em; font: inherit; line-height: 1.55; cursor: pointer; background: #eef1f4; border: 0; border-radius: 6px; }`;

  // The dialog held a title, a Close button, and an HTML COMMENT where the
  // video goes - so opening it showed an empty white box, and the one thing
  // this pattern exists to demonstrate was the one thing it did not.
  //
  // A div, not an <iframe> pointed at a real video. This markup gets PASTED
  // onto a dealer page: an embed here would put somebody else's video on a
  // storefront and load a player on every page carrying the block. The
  // placeholder is inert, needs no third party, and says what to replace it
  // with - the same reasoning the example photography carries, one step firmer,
  // because a photograph is a stand-in and a video is not.
  //
  // aria-labelledby rather than aria-label="Video": the heading is written per
  // poster, so a fixed label made every dialog announce the same word and threw
  // away the one thing the reader needed to hear.
  const VIDEO_DIALOG_HTML = [
    `<dialog class="cargo-vdlg" aria-labelledby="cargo-vdlg-h">`,
    `  <h3 class="cargo-vdlg-title" id="cargo-vdlg-h"></h3>`,
    `  <!-- Replace this div with your video: a YouTube or Vimeo <iframe>, or a <video> element. -->`,
    `  <div class="cargo-vdlg-media">Your video goes here</div>`,
    `  <form method="dialog"><button type="submit" class="cargo-vdlg-close">Close</button></form>`,
    `</dialog>`,
  ];

  const VIDEO_DIALOG_JS = `document.querySelectorAll('[data-video-dialog]').forEach((root) => {
  const dlg = root.querySelector('.cargo-vdlg');
  const title = dlg.querySelector('.cargo-vdlg-title');
  root.querySelectorAll('[data-video]').forEach((poster) => {
    poster.addEventListener('click', () => {
      title.textContent = poster.dataset.video;
      dlg.showModal();
    });
  });
});`;

  // A pattern is content plus defaults. `look` means it draws its cards with a
  // shared component and the look chooser applies; `slides` means it draws its
  // own markup because no card look describes it - a hero is a photo, a video
  // poster is a button.
  //
  // No zero length in a custom property, ever: write 0.1px. The platform's
  // styleCode minifier strips the unit off any zero, and a unitless 0 makes
  // every calc() that reads the variable invalid - the slide basis
  // `calc((100% - (per-view - 1) * var(--cs-gap)) / per-view)` falls to auto
  // and the cards collapse to their content width, in Chromium and WebKit
  // alike. Same reason `--cs-controls-space` is 0.1px (bfe446c).
  // scripts/lint-generated-css.mjs fails the build on a new one.
  const PATTERNS = {
    modelbar: {
      label: 'Model bar',
      blurb: 'A strip of vehicle cutouts, arrows only, one card per step. The most requested thing on the platform.',
      look: 'tile',
      models: cutouts,
      data: { 'data-cs-step': 'slide' },
      props: { '--cs-gap': '0.5em', '--cs-controls-space': '0.1px', '--cs-arrow-bg': 'transparent', '--cs-arrow-fg': '#262626' },
      hideDots: true,
    },
    cards: {
      label: 'Vehicle cards',
      blurb: 'Photo, title, price and a link. The whole card is clickable through one stretched link, so there is no nested-link or duplicate-announcement problem.',
      look: 'vcard',
      models: VEHICLES,
      data: {},
      props: { '--cs-gap': '1em', '--cs-arrow-bg': 'transparent', '--cs-arrow-fg': '#262626' },
    },
    hero: {
      gutter: false,
      label: 'Hero banner',
      blurb: 'Full width, one at a time, crossfading on a timer. Autoplay adds the pause button and never starts under reduced motion.',
      data: { 'data-cs-fade': '', 'data-cs-autoplay': '5000' },
      props: { '--cs-gap': '0.1px', '--cs-controls-space': '2em', '--cs-dot-current': '#16324f' },
      perView: { base: 1, 768: 1, 992: 1, 1200: 1 },
      minCard: 240,
      models: captioned(PHOTOS.slice(0, 3)).map((m) => ({ ...m, href: '', phone: '' })),
      css: `${PHOTO_CSS}
.cargo-photo img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 21 / 9; object-fit: cover; border-radius: 8px; }
@media (max-width: 767.98px) { .cargo-photo img { aspect-ratio: 4 / 3; } }`,
      slides: (models) => models.map((m) => photo(m)),
    },
    gallery: {
      gutter: false,
      label: 'Photo gallery',
      blurb:
        'For walking a shopper through one vehicle’s photos — the pictures on a VDP, or a gallery on a custom page. The thumbnails underneath are generated from the slides and behave like real tabs, with arrow keys.',
      data: { 'data-cs-gallery': '' },
      props: { '--cs-gap': '0.1px', '--cs-arrow-bg': 'transparent', '--cs-arrow-fg': '#262626' },
      perView: { base: 1, 768: 1, 992: 1, 1200: 1 },
      minCard: 240,
      track: 'div',
      models: captioned(PHOTOS),
      css: `${PHOTO_CSS}
.cargo-photo img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 8px; }`,
      slides: (models) => models.map((m) => photo(m)),
    },
    grid: {
      label: 'Two-row grid',
      blurb: 'Twice as many fit before you scroll. Each slide is a COLUMN holding two cards, so one slide is still one scroll stop — the model the engine is built on.',
      look: 'tile',
      models: cutouts,
      data: {},
      props: { '--cs-gap': '1em', '--cs-controls-space': '2em', '--cs-arrow-bg': 'transparent', '--cs-arrow-fg': '#262626' },
      perView: { base: 1, 768: 2, 992: 3, 1200: 3 },
      pairUp: true,
      css: `.cargo-col { display: grid; grid-template-rows: repeat(2, auto); gap: var(--cs-gap); }
`,
    },
    peek: {
      gutter: false,
      label: 'Peek at the next slide',
      blurb: 'A sliver of the neighbours stays visible so it always reads as "there is more this way". One property — --cs-peek. Zero turns it off.',
      data: {},
      props: { '--cs-gap': '1em', '--cs-peek': '3em', '--cs-arrow-bg': 'rgba(0, 0, 0, 0.55)', '--cs-arrow-fg': '#fff' },
      perView: { base: 1, 768: 1, 992: 2, 1200: 2 },
      minCard: 240,
      models: captioned(PHOTOS),
      // The phone override this used to carry - `%root% { --cs-peek: 1.5em }`
      // under 768 - set the value somewhere the Peek knob could not see it, so
      // turning Peek off left 1.5em on phones while the field read 0px. Same
      // shape as the controls-space bug on Tall photos. One owner instead: the
      // knob is the value at every width. Measured at a 320 window, that costs
      // the slide 233px -> 188px on this pattern and nothing anywhere else.
      css: `${PHOTO_CSS}
.cargo-photo img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 8px; }`,
      slides: (models) => models.map((m) => photo(m)),
    },
    video: {
      gutter: false,
      label: 'Video testimonials',
      blurb:
        'For customer video testimonials, or a walkaround of a vehicle. Each poster opens the video in a dialog rather than playing inline, so nothing starts moving while someone is reading the page.',
      data: { 'data-video-dialog': '' },
      props: { '--cs-gap': '1em', '--cs-arrow-bg': 'rgba(0, 0, 0, 0.55)', '--cs-arrow-fg': '#fff' },
      perView: { base: 1, 768: 2, 992: 2, 1200: 3 },
      minCard: 260,
      videoDialog: true,
      models: PHOTOS.slice(0, 3).map((m, i) => ({ ...m, name: ['Dana W.', 'Marcus T.', 'Gene &amp; Marta L.'][i] })),
      // `color: inherit` is load-bearing, not tidiness. A <button> takes the UA's
      // `buttontext` system colour unless told otherwise, and `font: inherit`
      // does not carry colour with it. `buttontext` follows color-scheme, so in
      // dark mode it resolves to WHITE - and the name under the poster went
      // white-on-white and vanished. On a dealer site the same card lands on
      // whatever band it is dropped into, so the card has to take the
      // surrounding text colour the way every non-button card already does.
      css: `.cargo-video { position: relative; display: block; inline-size: 100%; padding: 0; overflow: hidden; font: inherit; color: inherit; text-align: start; cursor: pointer; background: none; border: 0; border-radius: 8px; }
.cargo-video img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 16 / 10; object-fit: cover; }
.cargo-play { position: absolute; inset-block-start: 42%; inset-inline-start: 50%; display: grid; place-items: center; inline-size: 56px; block-size: 56px; color: #16324f; background: rgba(255, 255, 255, 0.92); border-radius: 50%; transform: translate(-50%, -50%); }
.cargo-name { display: block; margin: 0.6em 0 0; font-size: 1em; font-weight: 700; line-height: 1.3; }
${VIDEO_DIALOG_CSS}`,
      slides: (models) =>
        models.map(
          (m) =>
            // Same fix as the media gallery: without a label the button is
            // announced as the photo's alt plus a person's name, which says
            // nothing about pressing it. The label keeps the visible name
            // inside it, so it still satisfies label-in-name.
            `<button type="button" class="cargo-video" data-video="${m.name}" aria-label="Play video: ${m.name}" aria-haspopup="dialog">${pic(m)}<span class="cargo-play" aria-hidden="true">&#9654;</span><span class="cargo-name">${m.name}</span></button>`,
        ),
      script: VIDEO_DIALOG_JS,
    },

    tabs: {
      label: 'Model bar with tabs',
      blurb:
        'The same strip under body-style tabs. Each pane holds its own slider, and a pane revealed later measures itself correctly — so none of slick’s hidden-pane refresh hacks are needed. This is how Chevrolet has shipped its bar since Nov 2025.',
      look: 'tile',
      // Only this pattern opts into the Tab box: cutouts is shared with the model
      // bar and the two-row grid, and adding the key to the roster itself would
      // offer a field those two draw nothing from.
      models: cutouts.map((m) => ({ ...m, tab: '' })),
      data: { 'data-cs-step': 'slide' },
      props: { '--cs-gap': '0.5em', '--cs-controls-space': '0.1px', '--cs-arrow-bg': 'transparent', '--cs-arrow-fg': '#262626' },
      hideDots: true,
      panes: ['Trucks', 'SUVs', 'Crossovers'],
      css: `.cargo-tabs { display: flex; flex-wrap: wrap; gap: 0.25em; justify-content: center; margin-block-end: 1em; border-block-end: 1px solid #e2e5ea; }
.cargo-tabs [role="tab"] { padding: 0.6em 1.1em; font: inherit; font-weight: 600; line-height: 1.55; color: inherit; cursor: pointer; background: none; border: 0; border-block-end: 2px solid transparent; opacity: 0.65; }
.cargo-tabs [role="tab"][aria-selected="true"] { border-block-end-color: currentcolor; opacity: 1; }
.cargo-pane[hidden] { display: none; }
/* Three tabs need 272px at the default padding, and a 320px phone leaves 236 -
   so Chevrolet's own three body styles wrapped onto two rows at the narrowest
   size anyone browses at. The padding gives way, not the type: 99px of that
   strip is side padding, and taking 0.6em off each side of each tab buys back
   54px - more than the 35 needed - while the label stays 15px and the tab stays
   43px tall, so nothing about readability or the tap target moves. */
@media (max-width: 767.98px) {
  .cargo-tabs [role="tab"] { padding-inline: 0.5em; }
}`,
      script: `document.querySelectorAll('[data-tabs]').forEach((wrap, w) => {
  const tabs = [...wrap.querySelectorAll('[role="tab"]')];
  const panes = [...wrap.querySelectorAll('[role="tabpanel"]')];
  // Re-id per widget, and find panes within this wrapper rather than by
  // getElementById. The markup ships fixed ids, so two of these on one page
  // would otherwise share them and each tab would drive the other's panes.
  tabs.forEach((t, i) => {
    const tid = 'cargo-tab-' + w + '-' + i;
    const pid = 'cargo-pane-' + w + '-' + i;
    t.id = tid;
    panes[i].id = pid;
    t.setAttribute('aria-controls', pid);
    panes[i].setAttribute('aria-labelledby', tid);
  });
  const show = (i) => tabs.forEach((t, j) => {
    t.setAttribute('aria-selected', String(i === j));
    t.tabIndex = i === j ? 0 : -1;
    panes[j].hidden = i !== j;
  });
  tabs.forEach((t, i) => t.addEventListener('click', () => show(i)));
  wrap.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(e.target);
    if (i < 0) return;
    const to = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    const n = (to + tabs.length) % tabs.length;
    show(n);
    tabs[n].focus();
  });
  show(0);
});`,
    },

    models: {
      gutter: true,
      label: 'Model cards — tall photos',
      blurb:
        'Portrait photography instead of cutouts, and the dot row restyled into a solid bar with a marker that slides along it. The marker is page script watching the engine’s own state — the segments underneath are still real "go to page" buttons.',
      data: { 'data-cs-rewind': 'false', 'data-bar': '' },
      // --cs-controls-space belongs HERE and not in the pattern's css, which is
      // where it used to sit: the "Room for the dots" knob reads props, so it
      // showed the engine's 2.5em while the strip resolved this 3em, and the
      // copied CSS shipped both values in sequence with no edit at all.
      props: { '--cs-gap': '1em', '--cs-controls-space': '3em', '--cs-arrow-bg': 'rgba(0, 0, 0, 0.55)', '--cs-arrow-fg': '#fff' },
      perView: { base: 1, 768: 2, 992: 4, 1200: 4 },
      minCard: 190,
      models: MODELS,
      css: `%root% { --cs-dot-fg: #949494; --cs-dot-current: #949494; }
@media (min-width: 992px) { %root% { --cs-arrow-size: 56px; } }

/* The dots become one solid bar. Every segment is still a real, labelled
   button; the marker is a ::before whose translate follows --bar-index and
   --bar-count, set by the script below. #949494 is 3.03:1 on white, because
   the segments ARE the control and their extent has to meet WCAG 1.4.11. */
%root% .cs-dots { inset-inline: 25%; gap: 0; }
%root% .cs-dots::before { position: absolute; inset-block-start: calc(50% - 2px); inset-inline-start: 0; inline-size: calc(100% / var(--bar-count, 1)); block-size: 4px; pointer-events: none; content: ""; background: #262626; border-radius: 2px; translate: calc(var(--bar-index, 0) * 100%); }
@media (prefers-reduced-motion: no-preference) { %root% .cs-dots::before { transition: translate 0.35s ease; } }
%root% .cs-dot { flex: 1 1 auto; }
%root% .cs-dot::after { inline-size: 100%; block-size: 4px; border-radius: 0; }
%root% .cs-dot:first-child::after { border-start-start-radius: 2px; border-end-start-radius: 2px; }
%root% .cs-dot:last-child::after { border-start-end-radius: 2px; border-end-end-radius: 2px; }

.cargo-model { position: relative; display: block; overflow: hidden; color: #fff; text-decoration: none; border-radius: 10px; }
.cargo-model img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 3 / 5; object-fit: cover; transition: transform 0.35s ease; }
.cargo-model:hover img { transform: scale(1.05); }
.cargo-model h3 { position: absolute; inset-block-end: 0; inset-inline: 0; padding: 2.5em 1em 1em; margin: 0; font-size: 1.15em; line-height: 1.3; background: linear-gradient(transparent, rgba(0, 0, 0, 0.78)); }`,
      slides: (models) =>
        models.map((m) => `<a class="cargo-model" href="${m.href}"><img src="${m.img}" width="${m.w ?? 600}" height="${m.h ?? 1000}" alt="" loading="lazy" decoding="async"><h3>${m.name}</h3></a>`),
      // Site-level enhancement, not an engine feature: it reads the engine's
      // own current-dot class and writes two custom properties. Nothing in the
      // engine knows the bar exists.
      script: `document.querySelectorAll('[data-bar]').forEach((root) => {
  const sync = () => {
    const bar = root.querySelector('.cs-dots');
    if (!bar) return;
    const dots = [...bar.children];
    bar.style.setProperty('--bar-count', dots.length || 1);
    bar.style.setProperty('--bar-index', Math.max(0, dots.findIndex((d) => d.classList.contains('cs-dot--current'))));
  };
  // Watch the carousel, not the dot row: the dots are built by the engine and
  // may not exist yet, whatever order the two scripts loaded in. The same
  // observer catches the class flipping on a page change and the children
  // being rebuilt when a breakpoint changes the page count.
  new MutationObserver(sync).observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  sync();
});`,
    },

    mixed: {
      gutter: true,
      label: 'Mixed image sizes',
      blurb: 'Six source files at six different aspect ratios, all cropped to one shape by the CSS. Dealers upload whatever they have — aspect-ratio plus object-fit is what keeps the row even.',
      props: { '--cs-gap': '1em', '--cs-arrow-bg': 'rgba(0, 0, 0, 0.55)', '--cs-arrow-fg': '#fff' },
      perView: { base: 1, 768: 2, 992: 3, 1200: 3 },
      minCard: 230,
      models: MIXED,
      css: `@media (max-width: 767.98px) { %root% { --cs-arrow-size: 36px; } }
.cargo-mix { display: flex; flex-direction: column; block-size: 100%; overflow: hidden; background: #fff; border: 1px solid #e2e5ea; border-radius: 10px; }
.cargo-mix img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 4 / 3; object-fit: cover; }
.cargo-mix h3 { margin: 0.8em 0.9em 0.2em; font-size: 0.95em; line-height: 1.3; }
.cargo-mix p { margin: 0 0.9em 0.9em; font-size: 0.85em; line-height: 1.45; color: #5f6368; }`,
      slides: (models) =>
        models.map((m) => `<article class="cargo-mix"><img src="${m.img}" width="${m.w}" height="${m.h}" alt="${m.alt}" loading="lazy" decoding="async"><h3>${m.name}</h3><p>${m.blurb}</p></article>`),
    },

    service: {
      gutter: true,
      label: 'Service cards',
      blurb: 'Photo, heading, a paragraph and a read-more affordance. One card per arrow click, because the copy is long enough that a full-page jump loses your place.',
      data: { 'data-cs-step': 'slide' },
      props: { '--cs-gap': '1em', '--cs-arrow-bg': 'rgba(0, 0, 0, 0.55)', '--cs-arrow-fg': '#fff' },
      perView: { base: 1, 768: 2, 992: 3, 1200: 3 },
      minCard: 250,
      models: SERVICES,
      css: `@media (max-width: 767.98px) { %root% { --cs-arrow-size: 36px; } }
.cargo-svc { display: flex; flex-direction: column; block-size: 100%; overflow: hidden; color: inherit; text-decoration: none; background: #fff; border: 1px solid #e2e5ea; border-radius: 10px; }
.cargo-media { display: block; overflow: hidden; }
.cargo-svc img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 16 / 9; object-fit: cover; transition: transform 0.35s ease; }
.cargo-svc:hover img { transform: scale(1.05); }
@media (prefers-reduced-motion: reduce) { .cargo-svc:hover img { transform: none; } }
.cargo-svc h3 { margin: 1em 1.1em 0.35em; font-size: 1.1em; line-height: 1.3; }
.cargo-svc p { margin: 0 1.1em; font-size: 0.9em; line-height: 1.5; color: #5f6368; }
.cargo-svc-more { display: block; margin: 0.9em 1.1em 1.1em; font-size: 0.85em; font-weight: 700; line-height: 1.35; }`,
      slides: (models) =>
        models.map(
          (m) =>
            // aria-hidden because the whole card is already the link: without
            // it a screen reader reads the heading, the blurb and then "Read
            // more" as a second, separate destination.
            `<a class="cargo-svc" href="${m.href}"><span class="cargo-media">${pic(m)}</span><h3>${m.name}</h3><p>${m.blurb}</p><span class="cargo-svc-more" aria-hidden="true">${m.cta || 'Read more &#8594;'}</span></a>`,
        ),
    },

    reviews: {
      gutter: true,
      label: 'Customer reviews',
      blurb: 'For customer reviews on a homepage or an About page. Star ratings are announced as “Rated 5 out of 5” rather than read out one star at a time.',
      props: { '--cs-gap': '1em', '--cs-arrow-bg': 'transparent', '--cs-arrow-fg': '#262626' },
      perView: { base: 1, 768: 2, 992: 3, 1200: 3 },
      minCard: 250,
      models: REVIEWS,
      css: `@media (max-width: 767.98px) { %root% { --cs-arrow-size: 36px; } }
.cargo-review { block-size: 100%; padding: 1.25em; margin: 0; line-height: 1.5; background: #fff; border: 1px solid #e2e5ea; border-radius: 10px; }
.cargo-review figcaption { display: flex; gap: 0.7em; align-items: center; line-height: 1.35; }
.cargo-avatar { display: grid; flex: none; place-items: center; inline-size: 40px; block-size: 40px; font-weight: 700; line-height: 1; color: #fff; background: var(--avatar-bg); border-radius: 50%; }
.cargo-byline { display: flex; flex-direction: column; line-height: 1.35; }
.cargo-byline strong { font-size: 0.95em; }
.cargo-byline small { font-size: 0.8em; opacity: 0.7; }
.cargo-stars { display: block; margin: 0.7em 0 0.4em; font-size: 1em; line-height: 1; color: #e0a012; letter-spacing: 0.1em; }
.cargo-review blockquote { margin: 0; }
.cargo-review blockquote p { margin: 0; font-size: 0.95em; line-height: 1.55; }`,
      // The stars ship as HTML entities, not as the glyphs themselves. CMS
      // block storage is Windows-1252 and U+2605/U+2606 are not in it, so a
      // pasted literal star comes back mangled; an entity is plain ASCII and
      // survives the round trip. Same reason the play triangle above is &#9654;.
      slides: (models) =>
        models.map(
          (m) => `<figure class="cargo-review">
  <figcaption>
    <span class="cargo-avatar" aria-hidden="true" style="--avatar-bg: ${m.bg}">${initial(m.name)}</span>
    <span class="cargo-byline"><strong>${m.name}</strong><small>${m.when}</small></span>
  </figcaption>
  <span class="cargo-stars" role="img" aria-label="Rated ${clamp(m.stars, 0, 5)} out of 5">${'&starf;'.repeat(clamp(m.stars, 0, 5))}${'&star;'.repeat(5 - clamp(m.stars, 0, 5))}</span>
  <blockquote><p>${m.quote}</p></blockquote>
</figure>`,
        ),
    },

    'gallery-filter': {
      gutter: false,
      label: 'Filterable gallery',
      blurb:
        'A gallery whose slides carry a category. Filtering rebuilds the slider over the matching slides rather than hiding the rest — hiding leaves them in the thumb strip and in the announced "3 of 6".',
      data: { 'data-cs-gallery': '' },
      props: { '--cs-gap': '0.1px', '--cs-arrow-bg': 'rgba(0, 0, 0, 0.55)', '--cs-arrow-fg': '#fff' },
      perView: { base: 1, 768: 1, 992: 1, 1200: 1 },
      minCard: 240,
      track: 'div',
      models: captioned(TAGGED),
      // Derived from the photos, so a chip can never offer a category no
      // photo carries - which is what filtering by nothing looks like.
      filters: ['', ...new Set(TAGGED.map((m) => m.tag))],
      css: `.cargo-filterbar { display: flex; flex-wrap: wrap; gap: 0.4em; margin-block-end: 1em; }
.cargo-filterbar button { padding: 0.4em 0.9em; font: inherit; font-size: 0.87em; line-height: 1.55; color: inherit; cursor: pointer; background: #fff; border: 1px solid #e2e5ea; border-radius: 999px; }
.cargo-filterbar button[aria-pressed="true"] { color: #fff; background: #16324f; border-color: #16324f; }
/* Four chips need 262px and a 320px phone leaves 236 - a 26px shortfall, and
   only 2px at 344 - so they broke onto a second row for want of almost
   nothing. 94px of that 262 is side padding, so the padding gives way here for
   the same reason it does on the tab strip: trimming it saves 36px, keeps the
   13px label, and leaves the smallest chip 31x32 against WCAG 2.5.8's 24x24. */
@media (max-width: 767.98px) {
  .cargo-filterbar button { padding-inline: 0.55em; }
}
${PHOTO_CSS}
.cargo-photo img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 8px; }`,
      slides: (models) => models.map((m) => photo(m, ` data-tag="${m.tag}"`)),
      script: `document.querySelectorAll('[data-filter-gallery]').forEach((wrap) => {
  const root = wrap.querySelector('.cs');
  const all = [...root.querySelectorAll('.cs-slide')].map((s) => s.cloneNode(true));
  wrap.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.filter;
      wrap.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      if (root._cs) root._cs.destroy();
      // Re-query AFTER destroy(). destroy() puts the root's original markup
      // back, so any element captured before it is now detached and writing
      // to it changes nothing you can see.
      const track = root.querySelector('.cs-track');
      track.replaceChildren(...all.filter((s) => !tag || s.querySelector('[data-tag]').dataset.tag === tag).map((s) => s.cloneNode(true)));
      new CustomSlider(root);
    });
  });
});`,
    },

    'media-gallery': {
      gutter: false,
      label: 'Gallery with photos and video',
      blurb: 'A gallery where some slides are video posters. The poster is a real button that opens a dialog — video never plays inline, and the thumb strip treats it like any other slide.',
      data: { 'data-cs-gallery': '', 'data-video-dialog': '' },
      props: { '--cs-gap': '0.1px', '--cs-arrow-bg': 'rgba(0, 0, 0, 0.55)', '--cs-arrow-fg': '#fff' },
      perView: { base: 1, 768: 1, 992: 1, 1200: 1 },
      minCard: 240,
      track: 'div',
      videoDialog: true,
      models: PHOTOS.map((m, i) => ({ ...m, video: i === 2 || i === 4 })),
      css: `.cargo-photo { display: block; }
.cargo-photo img, .cargo-mv img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 8px; }
.cargo-mv { position: relative; display: block; inline-size: 100%; padding: 0; font: inherit; color: inherit; cursor: pointer; background: none; border: 0; }
.cargo-mv-play { position: absolute; inset-block-start: 50%; inset-inline-start: 50%; display: grid; place-items: center; inline-size: 64px; block-size: 64px; font-size: 1.3em; color: #16324f; background: rgba(255, 255, 255, 0.92); border-radius: 50%; transform: translate(-50%, -50%); }
${VIDEO_DIALOG_CSS}`,
      slides: (models) =>
        models.map((m) =>
          m.video
            ? // The button's name used to come from the photo's alt alone, so a
              // screen reader announced a description of a picture and nothing
              // about what pressing it does - and the play triangle beside it is
              // aria-hidden, so there was no second chance. The alt stays on the
              // image where it belongs; the BUTTON says what it is for.
              `<button type="button" class="cargo-mv" data-video="${m.alt}" aria-label="Play video: ${m.alt}" aria-haspopup="dialog">${pic(m)}<span class="cargo-mv-play" aria-hidden="true">&#9654;</span></button>`
            : `<span class="cargo-photo">${pic(m)}</span>`,
        ),
      script: VIDEO_DIALOG_JS,
    },

    lightbox: {
      gutter: false,
      label: 'Fullscreen gallery in a dialog',
      blurb:
        'A thumbnail that opens the full gallery in a native dialog. Built with data-cs-init="manual" so it initialises only once the dialog is open — a slider measured while hidden has no width to measure. Open the gallery to see your settings: the stage below shows only the closed trigger until you do, the readout has nothing to measure yet, and changing a setting rebuilds the dialog closed, so it is open, look, close, change.',
      data: { 'data-cs-gallery': '', 'data-cs-init': 'manual' },
      props: { '--cs-gap': '0.1px', '--cs-arrow-bg': 'rgba(0, 0, 0, 0.55)', '--cs-arrow-fg': '#fff' },
      perView: { base: 1, 768: 1, 992: 1, 1200: 1 },
      minCard: 240,
      track: 'div',
      models: captioned(PHOTOS),
      css: `.cargo-lb-open { display: inline-flex; gap: 0.7em; align-items: center; padding: 0.6em 1em; font: inherit; font-weight: 600; line-height: 1.55; color: inherit; cursor: pointer; background: #fff; border: 1px solid #e2e5ea; border-radius: 10px; }
.cargo-lb-open img { inline-size: 68px; block-size: 44px; object-fit: cover; border-radius: 5px; }
%root% { --cs-dot-current: #fff; --cs-dot-fg: #9aa3ad; }
.cargo-lb { inline-size: min(94vw, 1100px); padding: 0; background: #111; border: 0; border-radius: 12px; }
.cargo-lb::backdrop { background: rgba(0, 0, 0, 0.8); }
.cargo-lb-head { display: flex; align-items: center; justify-content: space-between; padding: 0.6em 0.9em; font-size: 0.9em; line-height: 1.55; color: #fff; }
.cargo-lb-close { padding: 0.35em 0.85em; font: inherit; line-height: 1.55; color: #fff; cursor: pointer; background: rgba(255, 255, 255, 0.15); border: 0; border-radius: 6px; }
${PHOTO_CSS}
.cargo-photo img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 16 / 10; object-fit: contain; }`,
      slides: (models) => models.map((m) => photo(m)),
      script: `document.querySelectorAll('[data-lightbox]').forEach((wrap) => {
  const dlg = wrap.querySelector('dialog');
  const root = dlg.querySelector('.cs');
  wrap.querySelector('[data-lb-open]').addEventListener('click', () => {
    dlg.showModal();
    // Init AFTER the dialog is visible: a slider measured while display:none
    // has no width, so every slide would come out the same wrong size.
    if (!root._cs) new CustomSlider(root);
  });
  dlg.querySelector('[data-lb-close]').addEventListener('click', () => dlg.close());
});`,
    },

    'card-gallery': {
      gutter: false,
      label: 'Vehicle cards with a mini gallery',
      blurb:
        'The SRP pattern: a grid of cards, each holding its own small slider of that vehicle’s photos. Many instances on one page is fine — each is independent, and none of them is the page’s main carousel.',
      props: { '--cs-gap': '0.1px', '--cs-controls-space': '0.1px', '--cs-arrow-size': '32px', '--cs-arrow-bg': 'rgba(0, 0, 0, 0.55)', '--cs-arrow-fg': '#fff' },
      perView: { base: 1, 768: 1, 992: 1, 1200: 1 },
      minCard: 200,
      models: VEHICLES,
      cardGrid: true,
      hideDots: true,
      css: `%wrap% { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(250px, 100%), 1fr)); gap: 1em; }
.cargo-cg-card { overflow: hidden; background: #fff; border: 1px solid #e2e5ea; border-radius: 10px; }
.cargo-cg-card img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 4 / 3; object-fit: cover; }
.cargo-cg-body { padding: 0.8em 0.9em 1em; }
.cargo-cg-body h3 { margin: 0; font-size: 0.95em; line-height: 1.35; }
.cargo-cg-body p { margin: 0.2em 0 0; font-size: 0.85em; line-height: 1.4; color: #5f6368; }`,
    },

    stock: {
      gutter: true,
      label: 'Stock look — the base',
      blurb:
        'The engine with nothing styled on top: default arrows, default dots, no card CSS at all. This is what you get before setting a single property, and the honest starting point for anything new.',
      props: {},
      perView: { base: 1, 768: 2, 992: 3, 1200: 3 },
      minCard: 200,
      models: [
        ['Default controls', 'Arrows overlay the content edges; dots sit in space the CSS reserved before JS ran.'],
        ['One knob per look', 'Every other example here is <code>--cs-*</code> custom properties and plain site CSS.'],
        ['Works without JS', 'The track is a native scroll-snap container — turn JavaScript off and it still swipes.'],
        ['Start here', 'Copy the markup, add your <code>--cs-per-view</code> breakpoints, then restyle.'],
      ].map(([name, blurb]) => ({ name, blurb })),
      css: `@media (max-width: 767.98px) { %root% { --cs-arrow-size: 36px; } }
.cargo-stock { block-size: 100%; padding: 1.1em; background: #f0f2f5; border-radius: 8px; }
.cargo-stock h3 { margin: 0 0 0.35em; font-size: 1em; line-height: 1.3; }
.cargo-stock p { margin: 0; font-size: 0.9em; line-height: 1.5; color: #5f6368; }
/* Inline code sits INSIDE the paragraph, so this em is measured against the
   paragraph's 0.9em, not the card base - deliberately, since code should track
   the copy it interrupts. 0.94 of 0.9 is the 0.85-of-base this rendered at
   before the rem-to-em pass; the two-decimal value is that ratio, not a guess. */
.cargo-stock code { font-size: 0.94em; }`,
      slides: (models) => models.map((m) => `<article class="cargo-stock"><h3>${m.name}</h3><p>${m.blurb}</p></article>`),
    },
  };

  /* ---- state ------------------------------------------------------------ */

  const state = {
    pattern: 'modelbar',
    panes: null,
    brand: null,
    look: null,
    perView: null,
    props: null,
    lookProps: null,
    data: null,
    hideDots: false,
    dotSpace: null, // what the reserved dot row measured before the dots were hidden
    content: null,
    label: null,
    name: 'my-slider',
    standalone: false,
  };

  // A look that sets --cs-* is choosing how the ENGINE's controls sit on the
  // background it brings, so those belong in props - where the panel edits them
  // as "Arrow colour" and the pattern's own values are overridden rather than
  // overriding. A logo panel that brings navy has to bring arrows you can see on
  // navy; leaving them in lookProps let the model bar's dark arrows win at 1.06:1.
  let lookCs = [];
  const applyLook = (id) => {
    // Hand back whatever the PREVIOUS look borrowed, to the pattern's own value
    // if it had one. Without this the logo panel's white arrows survived a
    // switch to the location card and sat on its near-white strip at 1.07:1.
    const own = PATTERNS[state.pattern].props ?? {};
    for (const k of lookCs) {
      if (k in own) state.props[k] = own[k];
      else delete state.props[k];
    }
    lookCs = [];
    state.look = id;
    state.lookProps = { ...LOOKS[id].settings };
    for (const k of Object.keys(state.lookProps)) {
      if (k.startsWith('--cs-')) {
        state.props[k] = state.lookProps[k];
        lookCs.push(k);
        delete state.lookProps[k];
      }
    }
  };

  // The rail shows a short name; `label` stays the descriptive title used for
  // the page heading and the patterns page. At the width the rail has to be for
  // the preview to reach 1170px, a sentence wraps to three or four lines - 16 of
  // the 17 did - and a column of wrapped sentences cannot be scanned.
  const SHORT = {
    modelbar: 'Model bar',
    cards: 'Vehicle cards',
    hero: 'Hero banner',
    gallery: 'Photo gallery',
    grid: 'Two-row grid',
    peek: 'Peek',
    video: 'Testimonials',
    tabs: 'Tabbed bar',
    models: 'Tall photos',
    mixed: 'Mixed sizes',
    service: 'Service cards',
    reviews: 'Reviews',
    'gallery-filter': 'Filter gallery',
    'media-gallery': 'Photos + video',
    lightbox: 'Lightbox',
    'card-gallery': 'Card gallery',
    stock: 'Stock look',
  };

  function loadPattern(id) {
    const p = PATTERNS[id];
    state.pattern = id;
    state.brand = null;
    state.look = p.look ?? null;
    state.perView = { ...(p.perView ?? LOOKS[p.look].perView) };
    state.props = { ...p.props };
    state.data = { ...p.data };
    state.hideDots = !!p.hideDots;
    state.dotsOver = false;
    state.dotsWere = null;
    state.dotSpace = null;
    state.count = p.models.length;
    // A pattern change is a shape change: a review row has a star rating and a
    // photo row has none, so edited slides can never carry across.
    state.content = null;
    state.panes = null;
    state.label = null; // only renderLook overrides it — see the note there
    // The class this slider's CSS hangs off. Every snippet used to be
    // `.my-slider`, so a second slider pasted on the same page redefined the
    // first one's rules and both rendered as whichever was last in the
    // document - reported as "adding a second slider breaks the first", and
    // it was not a missed step, the tool handed out one name for everything.
    state.name = toClass(SHORT[id] ?? id);
    // Beside the content wherever a card has text an arrow could land on.
    state.gutter = p.gutter ?? !!p.look;
    state.lookProps = {};
    if (p.look) applyLook(p.look);
  }

  // A brand preset brings its own vehicles where the estate gave us the
  // cutouts. Seventeen of the 32 have none, and those keep the pattern's own
  // content rather than being shown someone else's cars under their name.
  // The rosters a LOOK may ask the catalogue to draw it with, by name. Only
  // the ones whose shape differs from the model bar's cutouts need an entry.
  const ROSTERS = { models: MODELS, services: SERVICES, vehicles: VEHICLES, photos: PHOTOS };

  const modelsFor = (p) => (state.content ? state.content : state.brand && BRANDS[state.brand]?.models ? BRANDS[state.brand].models : p.models);

  const minCard = () => PATTERNS[state.pattern].minCard ?? (state.look ? LOOKS[state.look].minCard : 200);

  // The width buttons are Bootstrap 3's own container widths, so choosing 750
  // means "show me a page at the 768 tier". Everything downstream has to agree
  // on which tier that is: what the preview draws, and what the fit gauge
  // thinks a real page would give.
  let frameW = 1200; // the pressed width button, 0 for "fill"

  const gapPx = () => {
    const g = state.props['--cs-gap'] ?? '1em';
    const n = parseFloat(g) || 0;
    if (!g.trim().endsWith('em')) return n;
    const root = sdoc()?.querySelector('.cs');
    return n * (root ? parseFloat(swin().getComputedStyle(root).fontSize) : 16);
  };

  /* ---- the single source: settings -> CSS text -------------------------- */

  // `sel` is the only difference between what runs and what you copy.
  // The patterns that wrap the carousel in something: tabs, a filter bar, a
  // lightbox trigger, or a grid of cards each holding one.
  const hasWrap = () => {
    const p = PATTERNS[state.pattern];
    return !!(p.panes || p.filters || p.cardGrid || state.pattern === 'lightbox');
  };

  // The card styles ship inside dist/custom-slider.css, which every site links,
  // so a snippet does not repeat them - it carries only what THIS slider changed
  // from its card style's defaults. The delta is computed, never trusted: a
  // value equal to the default is dropped, so the block cannot go stale against
  // the file. `standalone` is the escape hatch for a block that has to work
  // somewhere the stylesheet is not linked.
  //
  // A pattern that draws its own cards has nothing in the file, so its CSS comes
  // along either way and the flag changes nothing for it - which the panel says,
  // rather than disabling a control, the mistake the old version made on 13 of
  // the 17 patterns.
  const shared = () => !!state.look && !state.standalone;

  // Every rule the snippet puts on the carousel itself is written `.name.cs`,
  // not `.name`. Specificity, not source order, then decides against the two
  // other rules that style that same element - the engine's `.cs` and the
  // shared stylesheet's `.cargo-<look>` - which are both (0,1,0), exactly what
  // a bare `.name` is. Where the platform emits its aggregated Style Only sheet
  // relative to a head <link> is not documented and may well vary, and with the
  // CSS landing first the model bar quietly reverted to gap 1em, 55%-black
  // arrows and a 2.5em dot reservation, while service cards fell from three per
  // view to one. (0,2,0) costs nothing, is invisible to the designer, and takes
  // the question off the table. Descendant rules already outrank both.
  const ROOT = '.cs';

  // Properties whose default is written by the shared stylesheet rather than by
  // the look's own settings, so restating them in a snippet is a line that
  // changes nothing. build-cards.mjs emits `font-size: var(--cargo-font, 1em)`
  // on every card class, which is the whole list.
  const SHARED_DEFAULTS = { '--cargo-font': '1em' };

  // The engine's own `.cs` defaults. A snippet restating one of these is a line
  // that changes nothing, and 48 such lines were being pasted across 15
  // patterns - `--cs-gap: 1em`, `--cs-arrow-bg`, `--cs-arrow-fg` and a
  // `--cs-per-view: 1` that is the engine's value anyway. The delta filter used
  // to run only against a look's settings, so the 13 look-less patterns had
  // nothing to be filtered against and everything came through.
  //
  // Kept in step with src/custom-slider.css by scripts/check-looks.mjs, which
  // reads the .cs block and fails if any value here disagrees. A hand-kept copy
  // would drift, and the drift would only show as a line that quietly stopped
  // being dropped.
  const ENGINE_DEFAULTS = {
    '--cs-per-view': '1',
    '--cs-gap': '1em',
    '--cs-peek': '0px',
    '--cs-arrow-size': '44px',
    '--cs-arrow-fg': '#fff',
    '--cs-arrow-bg': 'rgba(0, 0, 0, 0.55)',
    '--cs-arrow-fg-hover': '#fff',
    '--cs-arrow-bg-hover': 'rgba(0, 0, 0, 0.8)',
    '--cs-dot-size': '12px',
    '--cs-dot-fg': '#757575',
    '--cs-dot-current': '#333',
    '--cs-controls-space': '2.5em',
    '--cs-thumb-w': '88px',
    '--cs-thumb-h': '56px',
    '--cs-thumb-hover-scale': '1.06',
    '--cs-focus': '#1a5fb4',
    '--cs-fade-ms': '500ms',
    '--cs-transition': '250ms ease-in-out',
  };

  const knobDefault = (key) => LOOKS[state.look]?.settings?.[key] ?? PATTERNS[state.pattern].props?.[key] ?? SHARED_DEFAULTS[key] ?? ENGINE_DEFAULTS[key];

  // A number with a unit on it, or nothing.
  const LENGTH = /^-?(?:\d*\.)?\d+(?:px|em|rem|%|vw|vh|vmin|vmax|ch|ex|cm|mm|in|pt|pc|q)$/i;

  // Typing `10` into Gap shipped `--cs-gap: 10`, and a unitless number is not a
  // length: the gap goes invalid AND the slide's flex basis with it, so the
  // cards collapse to content width while the readout still claims 5 of 8. It
  // is the same broken slider that a `0px` (F003) and a cleared field (F022)
  // produced, reached a third way, so all three now pass through one predicate
  // rather than being patched one route at a time.
  //
  // Which knobs are lengths is read off the SHAPE OF THEIR DEFAULT rather than
  // a hand-kept list, so a knob added to a look is covered the day it ships. A
  // bare `0` is rejected on purpose: it is a valid CSS length, but the
  // platform's minifier turns `0px` into it and the engine's calc() cannot use
  // it, which is the whole reason this repo writes 0.1px.
  // A CSS math function is a length too. --strip-pad-x is the only knob that
  // ships one today, and now that the gutter rule READS it, a value the
  // property cannot use no longer sits harmlessly in a declaration nothing
  // consulted: padding-inline goes invalid, the arrow channel collapses to 0
  // and the 44px arrow lands on the first card - measured 44px of overlap on
  // the model bar with "banana" typed into Side gutter. Matched by shape like
  // every other length here, so a look shipping a clamp() or a min() tomorrow
  // is covered the day it ships rather than being a second special case.
  const MATH_FN = /^(?:calc|min|max|clamp)\(/i;
  const wantsLength = (key) => {
    const d = String(knobDefault(key) ?? '');
    return LENGTH.test(d) || MATH_FN.test(d);
  };
  const okValue = (key, v) => {
    const s = String(v).trim();
    if (!s || !wantsLength(key)) return true;
    // calc(), var(), min() and friends cannot be judged without resolving them,
    // and the looks ship several. Left alone rather than guessed at.
    if (/[a-z-]+\(/i.test(s)) return true;
    return LENGTH.test(s);
  };
  function cssFor(sel, preview) {
    const p = PATTERNS[state.pattern];
    const lib = shared();
    // Engine first, then the look: a look that deliberately restates an engine
    // value (portrait and logo both set --cs-arrow-bg) must be the one that
    // counts, or a designer returning a knob to the engine's value would find
    // the line silently dropped and the look's value still winning.
    const defaults = lib ? { ...ENGINE_DEFAULTS, ...SHARED_DEFAULTS, ...LOOKS[state.look].settings } : { ...ENGINE_DEFAULTS };
    const merged = { ...state.lookProps, ...state.props };
    const kept = Object.fromEntries(Object.entries(merged).filter(([k, v]) => defaults[k] !== v));
    // Per-view is always cs-xs-N / cs-sm-N classes now - see the ladder in
    // htmlFor() - so it never appears as a declaration here.
    const base = kept;
    const decls = Object.entries(base)
      // A value that is empty is not a value: `--cs-gap: ;` is an invalid
      // declaration and takes the whole rule's meaning with it. Nothing should
      // reach here blank now that a cleared field restores its default, but
      // this is the one place every property passes through - so the length
      // check rides here too, and a knob left mid-typo falls back to its
      // default instead of shipping a slider that cannot lay itself out.
      .filter(([k, v]) => String(v).trim() !== '' && okValue(k, v))
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');

    // The base every em inside the card is measured from. It has to be stated
    // here, on the carousel itself, because the card CSS cannot trust either
    // end of the host page: rem follows <html>, and Bootstrap 3 - which the
    // storefronts run - sets `html { font-size: 10px }`, so a 1rem name shipped
    // at 10px on a real dealer site while the demo showed 16. Defaulting to 1em
    // makes the cards inherit the site's own body size, so they match the copy
    // around them; setting --cargo-font to a length pins them instead.
    // build-cards.mjs puts this on `.cargo-<look>`, so a pattern using a shared
    // look already has it; a pattern drawing its own cards has no card class to
    // carry it and states it here. It is the one line that cannot ride on the
    // column classes.
    const font = lib ? '' : `  font-size: var(--cargo-font, 1em);`;

    // The preview used to pin --cs-per-view here, because a media query could
    // not fire inside a box. The frame is a real window now, so the ladder and
    // the card style's own narrow rules resolve themselves - and the preview
    // runs exactly the CSS that is copied, with nothing appended at all.
    const pin = '';

    // Dots on a photograph need more than a light colour. Screenshotted on the
    // service-bay hero, white at 55% all but disappeared into a busy image: the
    // dot is 12px across and the thing behind it is arbitrary, so there is no
    // colour that reads on every photo. A hairline dark ring gives them an edge
    // whatever they land on, which is what Bootstrap's own indicators lean on.
    // The z-index is not optional and it comes first. The dot row is absolutely
    // positioned but takes no z-index of its own, because it normally sits in
    // the reserved strip OUTSIDE the track and never overlaps anything. Move it
    // onto the photo and the track paints straight over it: measured with
    // elementsFromPoint, the stack at a dot's centre read IMG, .cargo-photo,
    // .cs-slide, .cs-track, and only then the dot. The engine's own .cs-arrow
    // carries z-index: 1 for exactly this reason.
    const dots = state.hideDots ? `${sel} .cs-dots { display: none; }` : state.dotsOver ? `${sel} .cs-dots { z-index: 1; }\n${sel} .cs-dot::after { box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.45); }` : '';
    // No arrow-inset override any more: the engine's own default is 0, which
    // is what all 17 patterns and all 7 looks were restating. Three lines a
    // snippet, and the gutter formula every look uses (arrow-size + 0.25em)
    // always assumed a flush arrow anyway.

    // Scope every selector, wherever it starts. Matching only at line start
    // silently left rules inside @media blocks unscoped, so they matched
    // nothing - the phone overrides were generated and did nothing at all.
    //
    // `%root%` means the carousel itself and `%wrap%` the outer element the
    // few structural patterns add (tabs, filter bar, lightbox, card grid);
    // anything else is a descendant of whichever of those is the real root.
    const root = hasWrap() ? `${sel}-wrap` : sel;
    // Comments come out before the scoping, not after: Style Only is a raw-CSS
    // field that takes no comments, and four patterns carry multi-line notes
    // explaining a breakpoint mid-sheet. Stripped here rather than at the copy
    // button, so the preview is styled by the very same text - the parity rule
    // this whole file is built on. The notes themselves stay where a maintainer
    // reads them, in the JS beside the rule.
    const scope = (css) =>
      css
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^[ \t]*\n/gm, '')
        .replace(/(^|[{}\n,]\s*)(%root%|%wrap%|\.cargo[\w-]*)/g, (_, pre, tok) => {
          if (tok === '%root%') return `${pre}${sel}${ROOT}`;
          if (tok === '%wrap%') return `${pre}${sel}-wrap`;
          return `${pre}${root} ${tok}`;
        });

    // The card style's rules come from the shared stylesheet; a pattern's own
    // CSS never does, because structural patterns (tabs, filter bar, lightbox)
    // are not card styles and have no entry in it.
    // The caption rule ships only once a slide has a caption. Every photo
    // pattern would otherwise paste a figcaption rule matching nothing, the
    // same dead line the tab and filter-bar rules are already filtered for.
    const photoRows = (p.css || '').includes('cargo-photo') ? modelsFor(p) : [];
    const captionCss = [photoRows.some((m) => m.caption) ? PHOTO_CAPTION_CSS : '', photoRows.some((m) => m.href) ? PHOTO_LINK_CSS : ''].filter(Boolean).join('\n');
    const body = [state.look && !lib ? scope(LOOKS[state.look].css) : '', p.css ? scope(captionCss ? `${p.css}\n${captionCss}` : p.css) : ''].filter(Boolean).join('\n');
    // Arrows either sit in a gutter beside the content or float over it. Last
    // in the sheet so it beats the padding-inline a card look sets for itself -
    // which is exactly why it has to READ the look's value rather than restate
    // a number of its own. Writing the width here made "Side gutter" a dead
    // knob: the field took the edit and the declaration shipped, and this rule
    // then overrode it on the same element. Measured on the model bar at
    // 1500px: 50px drawn against the 47.75px the field named, and still 50px
    // after typing 7em into it.
    //
    // Both fallbacks matter. --strip-pad-x exists only where a card look
    // defines it (tile and vcard); --cs-arrow-size is defined on .cs, and the
    // tab strip sits OUTSIDE the carousel, so without either the whole
    // declaration is dropped. The strip below keeps the literal for that
    // reason - it is a sibling of the carousel and never inherits the knob -
    // and nothing misaligns, because the tabs are centred (bbeda7a): measured
    // 0.0px off the carousel's centre at rest, at 7em, and at a refused value.
    //
    // Off stays a literal 0. `var(--strip-pad-x, 0)` would let a look's gutter
    // survive the toggle, and the phone rule below reads this literal.
    const gw = state.gutter ? 'var(--strip-pad-x, calc(var(--cs-arrow-size, 44px) + 0.4em))' : '0';
    // Tabs and filter buttons sit outside the carousel, so they have to be told
    // about the gutter or they hang off the left edge of their own cards.
    //
    // On a phone that alignment costs more than it buys: an arrow channel is
    // ~42px a side, which on a 330px strip leaves 246px for the tabs, and the
    // three body-style tabs Chevrolet ships need 259 - so they stacked one per
    // row and the pattern looked broken. The carousel keeps its channel either
    // way, because the arrows are still there; only the strip above it gives
    // the alignment up, and it has no arrows beside it to line up with anyway.
    // .98 for the same reason build-cards.mjs uses it: max-width 767px against
    // min-width 768px leaves a dead zone at fractional viewport widths.
    //
    // With the gutter off there is usually nothing to say: the carousel has no
    // padding of its own, so `padding-inline: 0` lands on an already-unpadded
    // element. The exception is a card look, which sets its own padding-inline
    // from --strip-pad-x - there the zero is what turns the gutter off, so it
    // still has to be written.
    const needsRootPad = state.gutter || !!state.look;
    // Only the strips this pattern actually has. Naming both on every wrapper
    // pattern pasted two rules matching nothing on the lightbox and the card
    // grid, which have neither a tab strip nor a filter bar.
    const strips = ['cargo-tabs', 'cargo-filterbar'].filter((c) => (p.css || '').includes(c));
    const stripSel = strips.map((c) => `${sel}-wrap .${c}`).join(', ');
    const gutter = [
      needsRootPad ? `${sel}${ROOT} { padding-inline: ${gw}; }` : '',
      stripSel ? `${stripSel} { padding-inline: ${gw}; }` : '',
      // The STRIP only, never the carousel. A tab row or a filter bar has no
      // arrows beside it to line up with, and at a phone width the channel it
      // was matching cost more than the alignment bought: ~42px a side, which
      // left Chevrolet's three body-style tabs 246px where they need 259, so
      // they stacked one per row and the pattern looked broken.
      //
      // The carousel keeps whatever "Arrows outside the cards" says, at every
      // width. It briefly did not - the rule was widened to the root as well,
      // to buy a phone back the ~80px the channel costs - and that made the
      // switch a dead control below 768: it read "outside", and a phone put the
      // arrow on the card anyway. Nothing in the panel said so, and nothing
      // could see it either, because the preview was a box in this page and the
      // phone rule never fired in it. A control that lies is worse than a
      // narrow card, so the switch wins now and the width is the designer's to
      // spend. Steven's call, 2026-09-03.
      //
      // Already zero above when the gutter is off; a second rule setting it to
      // zero says nothing the first did not.
      stripSel && gw !== '0' ? `@media (max-width: 767.98px) {\n  ${stripSel} { padding-inline: 0; }\n}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    // Both halves can be empty now that engine defaults are filtered out and
    // the ladder rides on classes - stock opens with nothing but the font line,
    // and a shared-look pattern at its defaults with nothing at all. Join only
    // what is there, or the rule ships with blank lines in it.
    const rootRule = [decls, font].filter(Boolean).join('\n');
    return [rootRule ? `${sel}${ROOT} {\n${rootRule}\n}` : '', pin, dots, body, gutter].filter(Boolean).join('\n\n');
  }

  function htmlFor(cls) {
    const p = PATTERNS[state.pattern];
    // The carousel names its card style and its column ladder so the shared
    // stylesheet can reach it. Two things this must NOT do, both learned the
    // hard way: replace the instance class (the overrides hook onto it, and
    // dropping it detached every one of them), or end up inside `cls` itself
    // (the structural patterns build their wrapper as `${cls}-wrap`, so an
    // augmented cls glued "-wrap" onto the last column class). It is a suffix
    // applied at the carousel element and nowhere else.
    //
    // The column ladder goes on EVERY pattern, not only the four with a card
    // look. cs-xs-N / cs-sm-N / cs-md-N / cs-lg-N ship unscoped in
    // custom-slider.css and say exactly what the hand-written ladder said - a
    // root line plus three @media blocks, ten lines of CSS a snippet, and
    // two-thirds of the rungs repeated the tier below because a min-width rule
    // already carries upward. Only `cargo-<look>` still depends on the shared
    // stylesheet being linked, so only that one stays behind the toggle.
    const tiers = [['xs', 'base'], ...BPS.map((bp, i) => [['sm', 'md', 'lg'][i], bp])];
    // A rung is worth a class only where the count changes: cs-sm-2 already
    // applies at 992 and at 1200. The tier below the first one is the engine's
    // own --cs-per-view: 1.
    let prev = 1;
    let ladder = '';
    for (const [t, k] of tiers) {
      const n = state.perView[k];
      if (n == null || n === prev) continue;
      ladder += ` cs-${t}-${n}`;
      prev = n;
    }
    const libCls = (shared() ? ` cargo-${state.look}` : '') + ladder;
    // Cycle the content up or down to the requested count. Repeats are how you
    // see what the slider does at 12 cards, and what it does when everything
    // already fits and it correctly stops drawing arrows and dots.
    const source = modelsFor(p);
    // Take `n` models from the roster starting at `from`, cycling if the
    // roster is shorter than asked for.
    const take = (n, from = 0) => Array.from({ length: n }, (_, i) => source[(from + i) % source.length]);
    // A pattern draws its slides one of three ways: its own slides(), a shared
    // card look, or - for the card grid - entirely inside its own branch below.
    const draw = (list) => (p.slides ? p.slides(list) : state.look ? list.map((m) => LOOKS[state.look].markup(m)) : []);
    let items = draw(take(state.count));

    // The two-row grid puts a COLUMN in each slide, not a card - one slide is
    // one scroll stop, which is what keeps the dots and the count honest.
    if (p.pairUp) {
      const cols = [];
      for (let i = 0; i < items.length; i += 2) cols.push(`<div class="cargo-col">${items.slice(i, i + 2).join('')}</div>`);
      items = cols;
    }

    const tag = p.track === 'div' ? 'div' : 'ul';
    const item = tag === 'ul' ? 'li' : 'div';
    const attrs = Object.entries(state.data)
      .map(([k, v]) => (v === '' ? ` ${k}` : ` ${k}="${v}"`))
      .join('');

    // One carousel, over whichever slides it is given. Patterns that need more
    // than one (the tabs) or need it wrapped in something (the lightbox) build
    // from this rather than hand-writing a second copy of the markup.
    // README, the Reference and cms-implementation.md all say the first visible
    // image is eager and the rest are lazy; every producer hard-coded
    // loading="lazy", including the first card and the hero's LCP image, so the
    // snippet failed the project's own contract and a designer reading both
    // could not tell which was right.
    //
    // "First visible" is the base tier's count - what a phone shows. A lazy
    // image already inside the viewport loads at once anyway, so marking the
    // desktop tiers eager as well would only cost a phone bandwidth it does not
    // need. Applied at the one place slides are wrapped, so a new card style
    // cannot quietly miss it. fetchpriority is the hero's alone: README says to
    // add it only above the fold, and a full-width hero banner always is.
    const eagerCount = state.perView.base ?? 1;
    const eager = (html, i) => (i >= eagerCount ? html : html.replace('loading="lazy"', state.pattern === 'hero' && i === 0 ? 'loading="eager" fetchpriority="high"' : 'loading="eager"'));

    // `onScreen` false for a carousel that starts hidden - the tab panes behind
    // the first one. An eager image inside a hidden pane is fetched anyway,
    // where a lazy one waits until the pane is shown, so eager there is
    // strictly worse than what it replaced.
    const carousel = (list, label, pad = '', onScreen = true) =>
      [
        `${pad}<div class="${cls}${libCls} cs" data-cs${attrs} aria-label="${label}">`,
        `${pad}  <${tag} class="cs-track">`,
        // Indent the card's own lines to match, so what you paste is not a
        // wall of markup starting at column zero inside a nested list item.
        ...list.map((h, i) => {
          const inner = h.includes('\n') ? ['', h.replace(/^/gm, `${pad}      `), `${pad}    `].join('\n') : h;
          return `${pad}    <${item} class="cs-slide">${onScreen ? eager(inner, i) : inner}</${item}>`;
        }),
        `${pad}  </${tag}>`,
        // Inside the carousel, not beside it, so the pattern CSS scopes to it
        // the way every other .cargo-* rule does. A closed <dialog> is
        // display:none and an open one renders in the top layer, so it costs
        // the strip no space either way.
        ...(p.videoDialog ? VIDEO_DIALOG_HTML.map((l) => `${pad}  ${l}`) : []),
        `${pad}</div>`,
      ].join('\n');

    // Body-style tabs: one carousel per pane, each over its own subset.
    if (p.panes) {
      const names = state.panes ?? p.panes;
      const ids = names.map((name) => name.toLowerCase().replace(/\W+/g, '-'));
      const tabs = names.map((name, i) => `    <button type="button" role="tab" id="tab-${ids[i]}" aria-controls="pane-${ids[i]}" aria-selected="${i === 0}">${name}</button>`).join('\n');
      // Two ways to fill the panes, and which one is in force is decided by the
      // rows themselves rather than by a switch.
      //
      // Nobody has typed a Tab: every pane draws the requested number of cards
      // from the roster at its own offset, so the slide count means slides PER
      // PANE and no pane comes out half empty. Models repeating across panes is
      // faithful - the real Chevrolet bar does it too - and it is what this
      // pattern has always emitted, so an untouched roster is unchanged.
      //
      // Someone HAS typed a Tab: membership decides. A row goes to the tab it
      // names, matched on the name a reader sees rather than an id, so renaming
      // a tab in the panel carries its rows with it. A row left blank is shared
      // - it appears in every pane - which is what makes it possible to tag
      // three of eight rows and have the rest still show up.
      const tagged = source.some((m) => String(m.tab ?? '').trim());
      const stride = Math.max(1, Math.ceil(source.length / names.length));
      const norm = (x) =>
        String(x ?? '')
          .trim()
          .toLowerCase();
      const panes = names
        .map((name, i) => {
          const sub = tagged ? draw(source.filter((m) => !norm(m.tab) || norm(m.tab) === norm(name))) : draw(take(state.count, i * stride));
          return `  <div class="cargo-pane" id="pane-${ids[i]}" role="tabpanel" aria-labelledby="tab-${ids[i]}"${i === 0 ? '' : ' hidden'}>\n${carousel(sub, name, '  ', i === 0)}\n  </div>`;
        })
        .join('\n');
      return `<div class="${cls}-wrap" data-tabs>\n  <div class="cargo-tabs" role="tablist" aria-label="Body style">\n${tabs}\n  </div>\n${panes}\n</div>`;
    }

    // Filter buttons above a gallery; the script rebuilds it per category.
    if (p.filters) {
      const bar = p.filters
        .map((f) => `    <button type="button" data-filter="${f}" aria-pressed="${f === '' ? 'true' : 'false'}">${f === '' ? 'All' : f[0].toUpperCase() + f.slice(1)}</button>`)
        .join('\n');
      return `<div class="${cls}-wrap" data-filter-gallery>\n  <div class="cargo-filterbar" role="group" aria-label="Filter photos">\n${bar}\n  </div>\n${carousel(items, state.label ?? p.label, '  ')}\n</div>`;
    }

    // A thumbnail that opens the gallery in a dialog.
    if (state.pattern === 'lightbox') {
      // The roster in effect, not the pattern's own: every other producer here
      // uses modelsFor(), and this one reading p.models meant an edited slide 1
      // changed the photo inside the dialog but not the thumbnail that opens
      // it. Its alt text comes along too, rather than being hardcoded empty.
      const m = source[0];
      return [
        `<div class="${cls}-wrap" data-lightbox>`,
        `  <button type="button" class="cargo-lb-open" data-lb-open>`,
        `    <img src="${m.img}" width="68" height="44" alt="${m.alt ?? ''}" loading="eager" decoding="async">`,
        `    <span>View all ${items.length} photos</span>`,
        `  </button>`,
        `  <dialog class="cargo-lb" aria-label="Vehicle photos">`,
        `    <div class="cargo-lb-head"><span>Vehicle photos</span><button type="button" class="cargo-lb-close" data-lb-close>Close</button></div>`,
        // The gallery starts inside a closed <dialog>, so nothing in it is
        // visible yet - the opener thumbnail above is this pattern's first
        // visible image and takes the eager load instead.
        carousel(items, 'Vehicle photos', '    ', false),
        `  </dialog>`,
        `</div>`,
      ].join('\n');
    }

    // A grid of cards, each with its own small slider of that vehicle's photos.
    if (p.cardGrid) {
      const cards = modelsFor(p)
        .slice(0, state.count)
        .map((m, i) => {
          // Each photo carries its OWN description. Stamping the vehicle's alt
          // on all three put "2021 Porsche Panamera" over a steering wheel.
          const pics = [{ img: m.img, alt: m.alt }, PHOTOS[i % PHOTOS.length], PHOTOS[(i + 2) % PHOTOS.length]].map(
            (x) => `<img src="${x.img}" width="${x.w ?? 800}" height="${x.h ?? 600}" alt="${x.alt}" loading="lazy" decoding="async">`,
          );
          return [`  <div class="cargo-cg-card">`, carousel(pics, `Photos of the ${m.name}`, '    '), `    <div class="cargo-cg-body"><h3>${m.name}</h3><p>${m.sub}</p></div>`, `  </div>`].join('\n');
        });
      return `<div class="${cls}-wrap">\n${cards.join('\n')}\n</div>`;
    }

    return carousel(items, state.label ?? p.label);
  }

  // The preview keeps the relative image paths; the copy panel emits the
  // PLATFORM ones. Designers were re-adding every image by hand after each
  // paste, because a repo-relative src means nothing on a dealer site, and that
  // cost is paid again by every designer who reuses the snippet.
  //
  // cms-paths.js maps each cutout to the path the platform itself serves it
  // from - /assets/stock/ (the ChromeData ColorMatched service) or
  // /static/brand-<make>/ (the shared OEM collection). Both are global: no
  // dealer id anywhere in the path, byte-identical on any dealer domain, so a
  // pasted model bar draws its cars with nothing uploaded. Every pair in that
  // file was proved by SHA-1 against the image this demo displays, which is why
  // the swap cannot quietly point at a different car than the preview shows.
  //
  // An image with no platform equivalent becomes `#MISCPATH#<file>`, the house
  // convention for the dealer's own upload: it does not resolve until they
  // upload one, which is the honest answer for a slot that is theirs to fill,
  // and it reads as "put your image here" rather than as a link that looks like
  // it might already work.
  //
  // As of the cms-paths harvest this branch is DEAD for everything shipped:
  // all 17 patterns map every image to a platform path, so zero snippets
  // contain a #MISCPATH#. It is kept because it is the fallback for an image
  // added later, and because a designer who types their own upload into the
  // editor still needs the convention. This comment used to say the gallery,
  // review and service photography took this route; those are all mapped now.
  //
  // Done as one pass over the finished markup on purpose: every producer -
  // look, pattern slides(), card grid, lightbox thumb - emits src="img/...",
  // so nothing can add a new image slot that this quietly misses.
  // Both attributes: a <picture> puts its phone art in srcset, and a rewrite
  // that only knew about src= left that one pointing at the demo folder.
  const toCms = (html) => html.replace(/(src|srcset)="img\/([^"]+)"/g, (_, attr, rel) => `${attr}="${globalThis.CARGO.CMS?.[rel] ?? `#MISCPATH#${rel.split('/').pop()}`}"`);

  // Every pattern script goes out behind a readiness guard, so where it is
  // pasted stops mattering. Body Section Bottom runs during parsing, while the
  // engine's <script defer> has not executed yet - so a script that looked for
  // markup the engine builds found nothing and never ran again. DOMContentLoaded
  // ordering alone does not save it either: an inline script in the body
  // registers its listener BEFORE a deferred script gets to register its own,
  // so it would still go first. The guard fixes the "markup not parsed yet"
  // half; the engine half is fixed in the scripts themselves, which observe
  // the carousel rather than querying what the engine has yet to build.
  const guarded = (src) => `(function go() {\n  if (document.readyState === 'loading') return document.addEventListener('DOMContentLoaded', go);\n${src.replace(/^/gm, '  ')}\n})();`;

  /* ---- render ----------------------------------------------------------- */

  const $ = (id) => document.getElementById(id);
  const stage = $('wb-stage');
  const codeEl = $('wb-code');
  const panel = $('wb-settings');
  let live = [];

  // The preview's own document. The frame is a real window of the chosen width,
  // which is the only way a max-width rule in the snippet can fire - a box
  // inside this page asks THIS window and always got the desktop answer.
  const sdoc = () => stage?.contentDocument;
  const swin = () => stage?.contentWindow;
  const styleEl = () => sdoc()?.getElementById('wb-live-css');
  const sroot = () => sdoc()?.getElementById('wb-live-root');

  // The index page (patterns.html) loads this file for the generator alone: one
  // example of every pattern, built by the same cssFor/htmlFor pair the builder
  // uses, so an example there cannot drift from the same example here.
  globalThis.CARGO = Object.assign(globalThis.CARGO || {}, {
    PATTERNS,
    // Exported so scripts/lint-generated-css.mjs can read the engine's real
    // .cs block and fail if this copy has drifted from it.
    ENGINE_DEFAULTS,
    // The index on patterns.html labels its tiles from the same map the rail
    // uses, so the two pages cannot call the same pattern different things.
    SHORT,
    renderPattern(id, cls) {
      loadPattern(id);
      return { css: cssFor(`.${cls}`), html: htmlFor(cls) };
    },
    // The card LOOKS, drawn the same way. A look is not a pattern - it is the
    // card inside one - but a style you can only reach by guessing which brand
    // wears it is a style nobody finds. Alfa Romeo's tall dark tiles are the
    // case in point: a completely different-looking strip with no entry in the
    // catalogue. This puts each look on the page beside the patterns, built by
    // the same cssFor/htmlFor pair, so it cannot drift from the builder either.
    renderLook(id, cls) {
      loadPattern('modelbar');
      const look = LOOKS[id];
      applyLook(id);
      state.perView = { ...look.perView };
      state.gutter = true;
      // Every look used to be drawn on the model bar's roster, which is
      // landscape 320px vehicle cutouts - so a card built for a 3:5 portrait
      // showed a car floating in dead space, and the split card put a cutout
      // where a photograph goes. The look says which roster suits its shape and
      // the catalogue honours it. The ROSTER, not the pattern: borrowing the
      // pattern would drag in its CSS, its data attributes and a page script
      // that renderLook does not return, leaving dead markup behind.
      if (look.demoModels) state.content = ROSTERS[look.demoModels] ?? null;
      // Named for the look it is showing, not the pattern it borrows to show it.
      state.label = `${look.label} cards`;
      return { css: cssFor(`.${cls}`), html: htmlFor(cls) };
    },
    // The preview's document. It is inside a frame now, so `#wb-stage .cs` no
    // longer finds anything from this page - the tests and anything else
    // inspecting the live slider go through here.
    sdoc: () => sdoc(),
    swin: () => swin(),
  });

  // Nothing below this line has a DOM to attach to on that page.
  if (!stage) return;

  // A colour changes the stylesheet and nothing else - not the markup, not the
  // geometry, not which script the pattern needs. Sending one through render()
  // tore the stage down and re-initialised every slider in it: measured one
  // destroy and one init per input event at 9-11 ms of JS each, against a
  // native <input type="color"> that fires on every pointer move inside the OS
  // picker. That is the whole reason dragging a colour crawled. This is the
  // same generator with the same argument, so the copy panel still cannot
  // drift from the slider on screen - it just stops rebuilding what did not
  // change. Anything that alters the MARKUP must still call render().
  // The frame's document, written once. It links the SAME two dist files a
  // dealer page links - so the preview runs the shipped engine, not a copy -
  // and carries the Bootstrap 3 html{font-size:10px} the storefronts set, which
  // is why every length in the card CSS is em and never rem.
  //
  // srcdoc rather than a src: it inherits this page's origin, so the parent can
  // reach contentDocument even when index.html is opened by double-click.
  // Verified on file:// before this was built - a src="about:blank" document
  // written into is not reliably same-origin there, and the demo has always had
  // to work without a server.
  const FRAME_DOC =
    // lang, a title, a <main> and an h1: the furniture any real page has. Not
    // decoration - the accessibility audit treats this frame as a document, and
    // a bare one produced a dozen findings about the SCAFFOLDING (no landmark,
    // no title, no lang) that said nothing about the slider inside it. A
    // preview that stands in for a dealer page should stand in for its
    // structure too, so what the audit reports is the snippet.
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Slider preview</title>' +
    '<link rel="stylesheet" href="../dist/custom-slider.css">' +
    // overflow:hidden on the frame's own root is a CORRECTNESS rule, not
    // tidying. A classic scrollbar - which real Chrome on Windows draws, and
    // headless Chromium does not, so this is invisible to the test suite - takes
    // 15px out of the VIEWPORT. That is the number a media query reads: the 390
    // Phone button was resolving 375, which is under the card sheet's own 380px
    // breakpoint, so the scrollbar was quietly deciding which rules fired. It
    // latched, too: content measured at 375 is taller than at 390, which keeps
    // the scrollbar justified. The parent sizes this frame to its content, so
    // there is nothing here to scroll and nothing to lose by refusing.
    '<style>html{overflow:hidden}html{font-size:10px}body{margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#10151c;background:#fff}.wb-sr{position:absolute;inline-size:1px;block-size:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%)}' +
    // Bootstrap 3's own container, because the frame is now the SCREEN rather
    // than the box. That distinction is the whole reason this exists: a
    // .container is 750px BECAUSE the screen is 768, so a 750px-wide frame
    // asks 750 and no min-width:768 rule fires. Previewing the container width
    // directly put every tier one rung low - the model bar drew three cards at
    // the Laptop button where a 992 screen gives four. Frame = 768/992/1200,
    // container = 750/970/1170, exactly as the storefront does it.
    '#wb-live-root{margin:0 auto}' +
    '@media(min-width:768px){#wb-live-root{inline-size:750px}}' +
    '@media(min-width:992px){#wb-live-root{inline-size:970px}}' +
    '@media(min-width:1200px){#wb-live-root{inline-size:1170px}}</style>' +
    // wb-live-css stays EMPTY: restyle() replaces its textContent on every
    // edit, so anything parked in it is wiped the first time a knob moves. The
    // scaffolding rule for the heading lives in the block above with the rest
    // of the frame's own styling.
    '<style id="wb-live-css"></style></head>' +
    // No h1, deliberately, after trying one. A hidden "Slider preview" heading
    // silenced page-has-heading-one and then produced NINE heading-order
    // findings instead, because a snippet's own h2 or h3 is the next heading
    // after it and nothing bridges the gap. The snippet's headings are the
    // content here; inventing one above them to satisfy a rule is scaffolding
    // pretending to be a page, and it made the audit noisier, not truer.
    '<body><main aria-label="Slider preview"><div id="wb-live-root"></div></main>' +
    '<script src="../dist/custom-slider.js"><' +
    '/script></body></html>';

  // Resolves when the frame has its engine. Everything that paints waits on it.
  let frameReady = new Promise((done) => {
    stage.addEventListener(
      'load',
      () => {
        watchFrameHeight();
        done();
      },
      { once: true },
    );
    stage.srcdoc = FRAME_DOC;
  });

  // An iframe does not grow with its content, so the preview would either clip
  // or float in dead space. Measure what the frame's document actually needs
  // and give the element exactly that.
  function fitFrameHeight() {
    const d = sdoc();
    if (!d?.body) return;
    // Measured off the CONTENT element, never the document. documentElement's
    // scrollHeight is bounded below by the viewport - which is the height this
    // function just set - so a frame could grow and never shrink: every pattern
    // after a tall one inherited its height. The div is its content, both ways.
    const root = d.getElementById('wb-live-root');
    if (!root) return;
    stage.style.blockSize = `${Math.ceil(Math.max(root.getBoundingClientRect().height, root.scrollHeight))}px`;
    // The frame refuses to scroll, so a height that came out short would clip
    // rather than scroll. Measure once more against what the document ended up
    // needing and grow if it disagrees - one correction, not a loop.
    const need = Math.ceil(Math.max(d.documentElement.scrollHeight, root.scrollHeight));
    if (need > parseFloat(stage.style.blockSize)) stage.style.blockSize = `${need}px`;
  }

  // A measurement taken once is a measurement taken too early: images decode
  // after render, fonts settle, and a grid grows a second row. Watch the frame's
  // own body and re-fit whenever it changes. Registered once, on the frame's
  // document, so it survives every re-render into it.
  let frameRO = null;
  function watchFrameHeight() {
    const d = sdoc();
    if (!d?.body || frameRO) return;
    frameRO = new (swin().ResizeObserver)(() => fitFrameHeight());
    frameRO.observe(d.body);
    // A late image is a load event, not necessarily a body resize.
    d.addEventListener('load', fitFrameHeight, true);
  }

  function restyle() {
    const el = styleEl();
    if (!el) return;
    el.textContent = cssFor('.wb-live');
    fitFrameHeight();
    publish();
  }

  function render() {
    const root = sroot();
    // Before the frame has loaded there is nothing to paint into. Queue it and
    // return: boot() calls render() synchronously, and srcdoc is asynchronous.
    if (!root) {
      frameReady.then(render);
      return;
    }
    live.forEach((s) => s.destroy());
    live = [];
    styleEl().textContent = cssFor('.wb-live');
    root.innerHTML = htmlFor('wb-live');
    // The frame's OWN engine instance: the class inside the frame, over the
    // frame's document. The parent's copy would measure the wrong window.
    live = swin().CustomSlider.autoInit(root);

    // A few patterns need page script - tabs, the gallery filter, the lightbox,
    // and now the two video patterns, whose dialog used to be wired by the demo
    // page instead of by the snippet.
    // The SAME string runs here and is printed in the code panel, so what you
    // copy is what you just watched work.
    const p = PATTERNS[state.pattern];
    if (p.script) {
      try {
        // Run it IN the frame, so its document.querySelectorAll sees the slider
        // and nothing else - which is how the same script behaves once it is
        // pasted into a dealer page. It used to run against this whole page.
        swin().eval(p.script);
      } catch (e) {
        console.error(`${state.pattern}: page script failed`, e);
      }
    }
    fitFrameHeight();
    checkFit();
    publish();
  }

  // Everything downstream of the preview: the three copy parts, the box, the
  // "what goes where" list. Split out of render() so a restyle can refresh the
  // panel without rebuilding the stage - the panel still has to update, since
  // clearing a colour drops a whole declaration and the line counts move with
  // it.
  function publish() {
    const p = PATTERNS[state.pattern];
    $('wb-title').textContent = p.label;
    $('wb-blurb').textContent = p.blurb;
    // Same generator, different selector - that is the parity guarantee.
    // Kept as text as well as highlighted markup: the clipboard gets the text,
    // never the spans.
    // The three parts, each in the form the field it goes into wants. The box
    // below shows them together with their tags, because that is what the
    // finished page contains - but Style Only is a raw-CSS field, so the CSS
    // part carries no <style> around it. The box is BUILT from these three, so
    // the button and the box cannot hand over different text.
    state.cssText = cssFor(`.${state.name}`);
    state.htmlText = toCms(htmlFor(state.name));
    state.scriptText = p.script ? guarded(p.script) : '';
    // Left alone while it is being typed into; see the wiring below.
    const nameEl = $('wb-name');
    if (nameEl && document.activeElement !== nameEl) nameEl.value = state.name;
    state.codeText = `<style>\n${state.cssText}\n</style>\n\n${state.htmlText}${state.scriptText ? `\n\n<script>\n${state.scriptText}\n</script>` : ''}`;
    const css = state.cssText;
    const html = state.htmlText;
    $('wb-copy-js').hidden = !p.script;

    // Say what is in the box and where each part goes, counted off the snippet
    // itself so it can never name a part that is not there.
    //
    // An earlier "use the card-looks file" checkbox failed because it was a
    // question: greyed out on 13 of the 17 patterns, and where it did work it
    // still left 13-21 lines of CSS behind. The card styles now ship inside
    // custom-slider.css, so using them is the default and no longer a decision
    // anyone has to make - the toggle survives only as an escape hatch for a
    // page that cannot link the file, and it is never greyed out.
    const lines = (t) => t.trim().split('\n').length;
    const parts = [
      ['HTML', lines(html), 'a <strong>Custom HTML</strong> block'],
      ['CSS', lines(css), '<strong>Style Only</strong> — raw CSS, no <code>&lt;style&gt;</code> tags'],
    ];
    if (shared()) parts.push(['Card style', `.cargo-${state.look}`, 'comes from <strong>custom-slider.css</strong> — nothing to paste for it']);
    // The one line in the snippet nobody can read the purpose of: 0.1px is not
    // a measurement, it is "no room, and do not let the minifier turn it into a
    // bare 0". Said here rather than left to be puzzled over on a dealer page.
    if (state.hideDots) parts.push(['Dot row', '0.1px', 'the dots are off, so the row reserved for them is collapsed — leave the value, a plain <code>0</code> breaks the arrows']);
    // Counted off the guarded script, which is the one that ships. "Either
    // side" is the point of the guard: the script no longer cares whether the
    // engine's line runs before or after it.
    if (state.scriptText) parts.push(['JavaScript', lines(state.scriptText), '<strong>Body Section, Bottom</strong> — either side of the custom-slider.js line']);
    // The demo images resolve to real platform paths, which is what makes them
    // usable - and exactly why this warning belongs here: they load perfectly
    // on any dealer's site and show the wrong thing, which is worse than a
    // broken image because nothing looks wrong.
    //
    // WHAT they show is read off the snippet's own addresses, never asserted.
    // This line used to say "Chevrolet stock art" on all seventeen patterns:
    // true of three of them at their default brand, and wrong for the other
    // twelve image patterns - seven of which reference no vehicle at all, only
    // the platform's library photography. CMS is the map toCms() emits from, so
    // an address still in it is an example and an address outside it is the
    // designer's own. That is also how the row stops nagging once step 1 has
    // replaced the photos it can reach.
    //
    // The MAKE is deliberately not named: /assets/stock/ carries a model code,
    // not a marque, so the address cannot supply one - and the only field that
    // could is the editable Wordmark, so reading it would tell a designer who
    // typed their own dealership name that the stock art is theirs.
    const examples = new Set(Object.values(globalThis.CARGO.CMS || {}));
    const shipped = [...state.htmlText.matchAll(/<img[^>]*\ssrc="([^"]*)"/g)].map((m) => m[1]);
    const left = shipped.filter((src) => examples.has(src) || src.startsWith('#MISCPATH#'));
    const warn = left.length
      ? `<li class="ui-parts-warn"><b>Photos</b> <span>${left.length} of ${shipped.length}</span>still the example photography — it loads on any dealer's site and shows the wrong vehicles, so put your own in step 1 above</li>`
      : '';
    $('wb-parts').innerHTML =
      parts
        .map(([what, n, where]) => `<li><b>${what}</b> <span>${typeof n === 'number' ? `${n} line${n === 1 ? '' : 's'}` : n}</span>${typeof n === 'number' ? 'goes into ' : ''}${where}</li>`)
        .join('') + warn;
    codeEl.innerHTML = globalThis.CARGO.hl.snippet(state.codeText);
    // NOT saved here. Settings used to write themselves to localStorage on
    // every render, which made every experiment permanent: a value typed to see
    // what it looked like was still there next week, on a pattern the designer
    // had forgotten touching, quietly holding out the shipped default it
    // replaced. Keeping is a decision now - "Keep these settings" - and this
    // only marks the panel as having something worth keeping.
    saveSettings();
    markDirty();
  }

  // Measured, not asserted: compare the card actually rendered against the
  // narrowest this look's content fits in. Catches "crammed" the only way that
  // works - by looking, not by reading the numbers.
  // Everything here is MEASURED off the rendered slider, never computed from
  // the settings - the point is to report what the browser actually did. The
  // gauge is the fit check made visible: how much room the card has over the
  // width this look's content needs.
  function checkFit() {
    const warn = $('wb-warn');
    const spec = $('wb-spec');
    const set = (id, v) => ($(id).textContent = v);
    const root = sdoc()?.querySelector('.cs');
    const slide = sdoc()?.querySelector('.cs-slide');
    if (!root || !slide) return;

    const w = Math.round(slide.getBoundingClientRect().width);
    // A slider inside a closed <dialog> measures 0. There is nothing to judge
    // until it is opened, so report that rather than cry "cramped".
    if (w === 0) {
      spec.dataset.fit = 'idle';
      warn.hidden = true;
      set('spec-card', 'not on screen yet');
      set('spec-across', '—');
      set('spec-gap', '—');
      set('spec-stops', '—');
      set('spec-controls', '—');
      set('spec-spare', '—');
      $('spec-gauge').style.inlineSize = '0%';
      return;
    }

    const cs = swin().getComputedStyle(root);
    const min = minCard();
    const stops = root._cs ? root._cs._stops().length : 1;
    const fits = root.hasAttribute('data-cs-fits');
    const n = sdoc().querySelectorAll('.cs').length;

    // F097: cards are sized in em off the host page's body text, by design - so
    // the same slider is 5 to 63px taller on a 19px-body site than it is here.
    // That is scaling working, not leakage (measured: at an equal body size all
    // 17 first slides match the preview to 0.00px), but the readout never said
    // what size this preview is, so the difference looked like a defect.
    // The container inside the frame, not the frame itself: the frame is the
    // SCREEN width now, and a Bootstrap container is narrower than the screen
    // it sits on. What the designer wants to read is the box the slider got.
    const boxW = Math.round(sroot().getBoundingClientRect().width);
    set('spec-card', `${w}px in ${boxW}px · text ${Math.round(parseFloat(swin().getComputedStyle(root).fontSize))}px`);
    // Counted in THIS slider, and never more than there are. The tabbed bar
    // draws three carousels and the card grid six, so counting the stage said
    // "5 of 24" over a pane holding eight; and asking for more cards across
    // than the pattern has slides said "8 of 6", which is not a thing. The
    // engine shows every slide in that case and hides the controls, so the
    // honest reading is "6 of 6".
    const slides = root.querySelectorAll('.cs-slide').length;
    const across = Math.min(+cs.getPropertyValue('--cs-per-view').trim() || 1, slides);
    // "3 sliders" is true of the card grid and misleading on the tabbed bar,
    // where the three carousels are one bar's three panes.
    set('spec-across', `${across} of ${slides}${n > 1 ? ` · ${n} ${PATTERNS[state.pattern].panes ? 'panes' : 'sliders'}` : ''}`);
    set('spec-gap', cs.getPropertyValue('--cs-gap').trim() || '0');
    set('spec-stops', String(stops));
    set('spec-controls', fits ? 'nothing — they all fit' : 'arrows' + (state.hideDots ? '' : ' and dots'));

    // The workbench chrome often leaves the preview column narrower than the
    // .container a real page would give at this window. Judge the card against
    // what that container would produce, or the gauge cries "cramped" about a
    // layout that is fine in production.
    // A chosen width IS the container being simulated, so judge the card
    // against that. Only "fill" has to guess from the window.
    const tier = frameW || (innerWidth >= 1200 ? 1170 : innerWidth >= 992 ? 970 : innerWidth >= 768 ? 750 : innerWidth - 30);
    const frame = Math.round(sroot().getBoundingClientRect().width);
    const capped = frame < tier - 2;
    const would = capped ? Math.round((w * tier) / frame) : w;

    // Full bar at twice the minimum; amber inside the last 15% before it.
    const head = would / min;
    $('spec-gauge').style.inlineSize = `${Math.max(4, Math.min(100, (head / 2) * 100))}%`;
    // A bar with no number on it is a mood, not a measurement. Say how much
    // room each card has beyond the narrowest its content fits in.
    const spare = Math.round(would - min);
    set('spec-spare', spare >= 0 ? `${spare}px per card` : `${-spare}px short`);
    spec.dataset.fit = head < 1.15 ? 'tight' : 'ok';

    if (capped && w < min) {
      // The preview is the thing that is short, not the settings.
      warn.hidden = false;
      warn.textContent = `Preview is ${frame}px wide; a real page at this window gives the slider about ${tier}px, where each card would be ${would}px. Widen the window to judge this properly.`;
    } else {
      warn.hidden = would >= min;
      warn.textContent = warn.hidden
        ? ''
        : `Each card is ${would}px here and this look needs about ${min}px before the text starts colliding. Show fewer across, or pick a card style that suits narrow cards.`;
    }
  }

  /* ---- settings UI ------------------------------------------------------ */

  // The panel says what a property DOES; the raw custom-property name is still
  // right there in the copied CSS for anyone who wants it. A column of
  // 'strip-pad-x' next to 'Arrow colour' reads like two different tools.
  const KNOB_LABELS = {
    '--strip-bg': 'Strip background',
    '--strip-pad': 'Space above',
    '--strip-pad-x': 'Side gutter',
    '--name-color': 'Name colour',
    '--name-size': 'Name size',
    '--name-weight': 'Name weight',
    '--name-case': 'Name case',
    '--name-tracking': 'Name tracking',
    '--name-order': 'Name position',
    '--img-filter': 'Photo filter',
    '--img-aspect': 'Photo shape',
    '--img-hover-scale': 'Zoom on hover',
    '--plate-bg': 'Plate colour',
    '--plate-pad': 'Plate padding',
    '--card-bg': 'Card background',
    '--card-fg': 'Card text',
    '--card-radius': 'Corner radius',
    '--card-border': 'Card border',
    '--card-shadow': 'Card shadow',
    '--badge-bg': 'Badge background',
    '--badge-fg': 'Badge text',
    '--price-color': 'Price colour',
    '--cta-bg': 'Button background',
    '--cta-fg': 'Button text',
    '--pill-bg': 'Pill background',
    '--pill-fg': 'Pill text',
    '--mark-size': 'Wordmark size',
  };
  const knobLabel = (k) => KNOB_LABELS[k] ?? k.replace(/^--/, '').replace(/-/g, ' ');

  // What a knob does, in the Reference's own words rather than a second set
  // written here - the two would drift, and the Reference's are already gated
  // by check-looks.mjs. Tags stripped, because a title attribute is plain text.
  const knobNote = (key) => {
    const g = globalThis.CARGO.guide;
    const raw = g?.CARD_NOTES?.[key] ?? g?.NOTES?.[key] ?? '';
    return raw.replace(/<[^>]*>/g, '');
  };

  const control = (label, node, note, extra) => {
    const row = document.createElement('label');
    row.className = 'wb-row';
    if (note) row.title = note;
    const span = document.createElement('span');
    span.textContent = label;
    row.append(span, node);
    if (extra) row.append(extra);
    return row;
  };

  // Up/down arrows step the number under the caret, the way browser Inspect
  // does: plain = 1, Shift = 10, Alt = 0.1. The unit rides along untouched, and
  // in a multi-value string only the number the caret is in moves - `6% 6% 1%`
  // steps one of the three, not all of them. Rounded to the decimals actually
  // in play, or 0.1 steps drift into 0.30000000000000004.
  const NUM = /-?\d*\.?\d+/g;
  function stepper(input, commit) {
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      const v = input.value;
      const hits = [...v.matchAll(NUM)];
      if (!hits.length) return;
      const caret = input.selectionStart ?? v.length;
      // The number the caret sits in or just after; failing that, the first.
      const hit = hits.find((m) => caret >= m.index && caret <= m.index + m[0].length) ?? hits.find((m) => m.index > caret) ?? hits[0];
      const by = (e.shiftKey ? 10 : e.altKey ? 0.1 : 1) * (e.key === 'ArrowUp' ? 1 : -1);
      const dp = Math.max((hit[0].split('.')[1] || '').length, e.altKey ? 1 : 0);
      const next = (parseFloat(hit[0]) + by).toFixed(dp);
      e.preventDefault();
      input.value = v.slice(0, hit.index) + next + v.slice(hit.index + hit[0].length);
      // Keep the caret on the number just changed so the key repeats on it.
      input.setSelectionRange(hit.index, hit.index + next.length);
      commit(input.value);
    });
  }

  // Look properties whose values are a closed set. A free-text box for one of
  // these is a guessing game - you have to already know that `capitalize` is
  // spelled the CSS way and that `title-case` is not a thing. Add a key here
  // and it becomes a dropdown; anything absent stays a text field.
  const ENUMS = {
    '--name-case': [
      ['none', 'As typed'],
      ['uppercase', 'UPPERCASE'],
      ['lowercase', 'lowercase'],
      ['capitalize', 'Capitalize Each Word'],
    ],
    '--name-order': [
      ['0', 'Name below the vehicle'],
      ['-1', 'Name above the vehicle'],
    ],
  };

  function enumSelect(key, store) {
    const sel = document.createElement('select');
    for (const [value, label] of ENUMS[key]) {
      const o = document.createElement('option');
      o.value = value;
      o.textContent = label;
      o.selected = String(store[key]).trim() === value;
      sel.append(o);
    }
    sel.addEventListener('change', () => {
      store[key] = sel.value;
      render();
    });
    return sel;
  }

  // A text field for a CSS value, with the arrow-key stepping wired on.
  // Clearing a field means "go back to the default", not "ship nothing". An
  // empty value used to be stored as-is and emitted as `--cs-gap: ;`, which is
  // an invalid declaration: the arrows fell to the page's text colour and a
  // cleared Gap invalidated the slide flex basis, so the cards collapsed to
  // content width - in the preview AND in the copied CSS. Restore the value the
  // field started with instead: a look knob goes back to that look's setting, a
  // pattern knob to the pattern's own, and a knob the pattern never set is
  // deleted so the engine's default applies.
  const defaultFor = (key, store) => (store === state.lookProps ? LOOKS[state.look]?.settings?.[key] : PATTERNS[state.pattern].props?.[key]);

  // What a knob started as, wherever that came from. Also what its placeholder
  // shows, so an empty field says what it will fall back to.
  // SHARED_DEFAULTS is in the chain because --cargo-font has no engine default
  // to fall back on - the engine never defines it, the card class does, as
  // `font-size: var(--cargo-font, 1em)`. Without it that field had neither a
  // placeholder nor a unit check, and it is a length like any other.
  const setProp = (store, key, v) => {
    if (String(v).trim()) return void (store[key] = v);
    const d = defaultFor(key, store);
    if (d == null) delete store[key];
    else store[key] = d;
  };

  function valueRow(label, key, store, after) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = store[key] ?? '';
    // What it falls back to, shown rather than described.
    input.placeholder = String(knobDefault(key) ?? '');
    const warn = document.createElement('span');
    warn.className = 'wb-bad';
    warn.hidden = true;
    warn.textContent = wantsLength(key) ? 'Needs a unit — try 1em or 16px, and 0.1px rather than 0.' : '';
    const mark = () => {
      const bad = !okValue(key, input.value);
      input.setAttribute('aria-invalid', String(bad));
      input.classList.toggle('wb-input-bad', bad);
      warn.hidden = !bad;
    };
    const push = (v) => {
      setProp(store, key, v);
      mark();
      render();
      after?.();
    };
    input.addEventListener('input', () => push(input.value));
    stepper(input, push);
    mark();
    return control(label, input, knobNote(key), warn);
  }

  const section = (heading, body) => {
    const s = document.createElement('section');
    const h = document.createElement('h3');
    h.textContent = heading;
    s.append(h, body);
    // A section is kept whole in the settings columns so a heading never parts
    // from its controls - except a long one, which would then set the height of
    // the whole panel on its own. "This card style" runs to 14 rows and pushed
    // the preview off a 1440x900 laptop; letting it flow lets the columns
    // balance, and every row inside it carries its own label anyway.
    if (body.children.length > 8) s.dataset.flow = '';
    return s;
  };

  function colorRow(label, key, store) {
    const wrap = document.createElement('span');
    wrap.className = 'wb-color';
    const val = store[key] ?? '';
    const swatch = document.createElement('input');
    swatch.type = 'color';
    // A colour input only understands #rrggbb; transparent and rgb() are
    // legitimate values here, so the text field stays authoritative.
    swatch.value = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test((val || '').trim()) ? val : '#000000';
    const text = document.createElement('input');
    text.type = 'text';
    text.value = val;
    // Same as the value rows: show what clearing it falls back to. No unit
    // check here - a colour is a colour, and transparent, a hex and an rgba()
    // are all legitimate in this field.
    text.placeholder = String(knobDefault(key) ?? '');
    // The wrapping <label> binds to the swatch, not to this field - and the
    // swatch is hidden whenever the value is not a plain hex.
    text.setAttribute('aria-label', `${label} value`);
    // restyle(), not render(): see the note on it. The OS colour picker fires
    // an input event on every pointer move, and a rebuild per move is what made
    // dragging one crawl.
    const push = (v) => {
      setProp(store, key, v);
      restyle();
    };
    // A colour input has no way to show "transparent" or an rgb() with alpha -
    // it just renders black, which reads as a real colour choice that was never
    // made. Show the swatch only when it can tell the truth.
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'wb-chip';
    chip.addEventListener('click', () => {
      // Give it a real colour to edit, then hand over to the picker.
      text.value = '#262626';
      push(text.value);
      sync();
      swatch.click();
    });

    // #222 is as valid as #222222 and the picker only speaks the long form.
    const asHex = (v) => {
      const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((v || '').trim());
      if (!m) return null;
      return m[1].length === 3 ? `#${[...m[1]].map((c) => c + c).join('')}` : `#${m[1]}`;
    };

    const sync = () => {
      const hex = asHex(text.value);
      swatch.hidden = !hex;
      chip.hidden = !!hex;
      if (hex) swatch.value = hex;
      else {
        chip.style.setProperty('--chip', text.value || 'transparent');
        chip.title = `${text.value || 'unset'} — click to pick a solid colour instead`;
        chip.setAttribute('aria-label', chip.title);
      }
    };
    swatch.addEventListener('input', () => {
      text.value = swatch.value;
      push(swatch.value);
    });
    text.addEventListener('input', () => {
      sync();
      push(text.value);
    });
    sync();
    wrap.append(swatch, chip, text);
    return control(label, wrap, knobNote(key));
  }

  function buildPanel() {
    panel.replaceChildren();
    const p = PATTERNS[state.pattern];
    // The crossfade ignores how many across, the gap and the step. The hero is
    // the only pattern that carries the attribute today, but read it off the
    // state rather than the pattern id so a second fading pattern is covered.
    const fading = state.data['data-cs-fade'] != null;
    // A horizontal scroll strip, which is what the track's padding and snap
    // physics need to exist for. Derived from the same two attributes rather
    // than a hand-kept list of pattern ids, so a pattern added later is
    // classified the day it ships.
    const scrolling = !fading && state.data['data-cs-gallery'] == null;

    const grid = document.createElement('div');
    for (const key of ['base', ...BPS]) {
      if (state.perView[key] == null) continue;
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '1';
      input.max = '8';
      input.value = state.perView[key];
      // F083: a number outside 1-8 was refused in silence. The field snapped
      // back on blur, so nothing was lost, but between typing and blurring the
      // panel showed one number and the slider ran another with no hint that
      // the value had not been taken.
      const warn = document.createElement('span');
      warn.className = 'wb-bad';
      warn.hidden = true;
      warn.textContent = 'Whole cards, 1 to 8.';
      input.addEventListener('input', () => {
        const n = parseInt(input.value, 10);
        const ok = n >= 1 && n <= 8;
        input.setAttribute('aria-invalid', String(!ok));
        input.classList.toggle('wb-input-bad', !ok);
        warn.hidden = ok;
        if (ok) {
          state.perView[key] = n;
          render();
        }
      });
      // The field must not go on showing a number the ladder did not take.
      // `2.5` truncated to 2 and the box kept saying 2.5, and there is no
      // half-card option to offer instead: the engine pages by whole slides,
      // so a 2.5 set by hand makes the last page unreachable. Peek is the
      // control for showing part of the next card.
      input.addEventListener('change', () => {
        input.value = state.perView[key];
        input.setAttribute('aria-invalid', 'false');
        input.classList.remove('wb-input-bad');
        warn.hidden = true;
      });
      grid.append(control(TIER_LABEL[key], input, 'Whole cards only — use Peek to show a sliver of the next one.', warn));
    }
    // A crossfade ignores all three of these, and saying so is better than
    // hiding them: this file already carries a note that a greyed-out control
    // which will not explain itself was the mistake the previous version made,
    // and "At the ends" is relabelled under autoplay rather than removed.
    if (fading) {
      const note = document.createElement('p');
      note.className = 'wb-note';
      note.textContent =
        'A crossfade stacks the slides and shows one at a time. The engine pins this to 1 in CSS, so the page looks the same before the script runs as after — a count above 1 still ships as a cs-xs-N class in the markup and does nothing.';
      grid.append(note);
    }
    panel.append(section('How many across', grid));

    if (p.look) {
      const wrap = document.createElement('div');
      const sel = document.createElement('select');
      sel.setAttribute('aria-label', 'Brand preset');
      sel.className = 'wb-wide';
      const none = document.createElement('option');
      none.value = '';
      none.textContent = 'Start from the default';
      sel.append(none);
      for (const [id, b] of Object.entries(BRANDS)) {
        const o = document.createElement('option');
        o.value = id;
        o.textContent = b.label;
        o.selected = id === state.brand;
        sel.append(o);
      }
      const note = document.createElement('p');
      note.className = 'wb-note';
      const describe = () => {
        const b = BRANDS[state.brand];
        if (!b) {
          note.textContent = 'Sets how many cards across and which card style, from what that brand actually ships. Colours stay yours — pull them from the site theme.';
          return;
        }
        // Plain words: "ladder" and "the census" are how this was written down
        // while it was being researched, and neither is defined anywhere a
        // designer would look.
        const counts = ['base', 768, 992, 1200].map((k) => state.perView[k]).join(' / ');
        note.textContent = b.ladder
          ? `${counts} cards across, on a phone / from 768px / from 992px / from 1200px. ${b.note ?? ''}`.trim()
          : `The ${b.label} demo sites we surveyed showed no clear pattern of how many across, so this starts from the card style's own. ${b.note ?? ''}`.trim();
      };
      sel.addEventListener('change', () => {
        state.brand = sel.value || null;
        // A preset brings its own vehicles, so it replaces the roster outright.
        // Keeping edited rows here would show Ford copy under a Kia preset - so
        // it is offered back instead, which is the one of the three discards
        // that used to happen with no warning at all.
        rememberDiscard('the preset');
        state.content = null;
        clearContent();
        const b = BRANDS[state.brand];
        if (!b) {
          // "Start from the default" has to undo what a preset changed - its
          // card style, its ladder and its slide count - and nothing else.
          // Without this the previous brand's look and ladder survived, so
          // Vehicle cards came back as tall tiles. loadPattern() would undo it
          // all, but it would also throw away the slider name the designer
          // typed, which no preset ever touched.
          state.look = p.look ?? null;
          state.lookProps = {};
          if (p.look) applyLook(p.look);
          state.perView = { ...(p.perView ?? LOOKS[p.look].perView) };
          state.count = p.models.length;
        }
        if (b) {
          if (b.models) state.count = b.models.length;
          applyLook(b.look);
          // A recorded ladder is read at the platform's tiers and clamped;
          // a brand with none keeps the look's own sensible ladder.
          // The gap in effect, not a default: the two-row grid runs a 16px gap
          // where the model bar runs 8, and four cards plus three 16px gaps is a
          // different sum. Assuming 8 let seven presets through at 146px.
          state.perView = b.ladder ? perViewFor(b.ladder, LOOKS[b.look].minCard, gapPx(), b.look) : { ...LOOKS[b.look].perView };
        }
        buildPanel();
        buildContent();
        render();
      });
      wrap.append(sel, note);
      describe();
      panel.append(section('Brand preset', wrap));
    }

    // Chosen visually: a dropdown reading "split photo card" helps nobody who
    // does not already know they want it.
    if (p.look) {
      const looks = document.createElement('div');
      looks.className = 'wb-looks';
      for (const [id, look] of Object.entries(LOOKS)) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'wb-look';
        b.setAttribute('aria-pressed', String(id === state.look));
        b.innerHTML = `<span class="wb-look-icon">${look.icon}</span><span>${look.label}</span>`;
        // Comparing seven styles meant clicking all seven and watching the
        // preview change; the description only appeared after choosing one.
        b.title = look.note ?? look.label;
        b.addEventListener('click', () => {
          // Selecting what is already selected does nothing. It used to reset
          // the ladder to the look's own default, so clicking the highlighted
          // style on the two-row grid took 1/2/3/3 to 2/3/4/5 and the arrows
          // and dots disappeared - a hand-set ladder thrown away by a click
          // that looked like a no-op.
          if (id === state.look) return;
          state.brand = null;
          applyLook(id);
          // Each look brings the ladder that suits it: a split card at five
          // across is unreadable, a cutout at one across is a waste.
          state.perView = { ...LOOKS[id].perView };
          buildPanel();
          // The editor too: which fields a card style reads is part of the
          // style, so switching one has to add or remove the rows for them.
          buildContent();
          render();
        });
        looks.append(b);
      }
      // What the selected style is FOR. A thumbnail cannot say "this one is a
      // logo strip, so it will look wrong under a model bar" - and that is
      // exactly the question the navy panel raises the first time you pick it.
      const lookNote = document.createElement('p');
      lookNote.className = 'wb-note';
      lookNote.textContent = LOOKS[state.look].note ?? '';
      const wrap2 = document.createElement('div');
      wrap2.append(looks, lookNote);
      panel.append(section('Card style', wrap2));
    }

    const colors = document.createElement('div');
    colors.append(colorRow('Arrow colour', '--cs-arrow-fg', state.props));
    colors.append(colorRow('Arrow background', '--cs-arrow-bg', state.props));
    // Both hover colours have been in the engine and in the Reference all
    // along, with no way to reach them from here. Worse than merely absent:
    // the portrait and logo looks already carry --cs-arrow-bg-hover in their
    // settings, and applyLook moves it into state.props - so the value was
    // being shipped by two card styles with no control anywhere that could
    // show it, let alone change it.
    colors.append(colorRow('Arrow colour · hover', '--cs-arrow-fg-hover', state.props));
    colors.append(colorRow('Arrow background · hover', '--cs-arrow-bg-hover', state.props));
    colors.append(valueRow('Arrow size', '--cs-arrow-size', state.props));
    // Six designs resize the arrow inside a media query in their own CSS - the
    // tile and vehicle card at 36px on phones, the logo strip at 56px on wide
    // screens - and this field cannot reach a rule it does not own. Rather
    // than let the row imply one size at every width, read those rules back
    // and say what they set. The alternative was to give the knob a second
    // "on phones" field and take the value off the six designs, which is a
    // bigger change than showing what is already true.
    for (const [, cond, val] of `${p.css || ''}\n${LOOKS[state.look]?.css || ''}`.matchAll(/@media\s*\(([^)]+)\)[^{]*\{[^}]*--cs-arrow-size:\s*([^;}]+)/g)) {
      const n = document.createElement('p');
      n.className = 'wb-note';
      n.textContent = `This design also sets the arrow to ${val.trim()} at (${cond.trim()}), in its own CSS. The field above is the size everywhere else.`;
      colors.append(n);
    }
    // "Show a sliver of the next car" lands on a model bar as often as on the
    // pattern named after it, so the row is offered wherever it can do
    // something rather than only where the pattern pre-set it. Not under fade
    // or gallery: `.cs[data-cs-fade-on] .cs-track` and the gallery's own track
    // rule both win over `.cs-track { padding: 0 var(--cs-peek) }`, so the
    // field would move nothing and lie about it.
    //
    // Off is `0px`, not the dot row's `0.1px`. It is the engine's own default,
    // so cssFor()'s delta filter drops it before it is written - it never
    // reaches the platform minifier to be stripped to a unitless `0`, and off
    // costs no declaration on any of the twelve patterns this now appears on.
    if (scrolling) {
      state.props['--cs-peek'] ??= '0px';
      colors.append(valueRow('Peek', '--cs-peek', state.props));
    }
    state.props['--cs-gap'] ??= '1em';
    colors.append(valueRow(fading ? 'Gap (a crossfade has no gap)' : 'Gap', '--cs-gap', state.props));
    // Everything inside a card is sized in em off this. `1em` inherits the host
    // page's body size, so the cards match the copy around them on whatever
    // site they are pasted into; a length here pins them to that size instead.
    state.props['--cargo-font'] ??= '1em';
    colors.append(valueRow('Card text size', '--cargo-font', state.props));
    // Only worth showing when there are dots to make room for - this is the
    // reserved strip they are drawn into, and shrinking it puts them on the
    // card text. A gallery fills that same strip with the thumb rail instead,
    // so it sizes itself off --cs-thumb-h and this knob would only confuse.
    if (!state.hideDots && state.data['data-cs-gallery'] == null) {
      state.props['--cs-controls-space'] ??= '2.5em'; // the engine's own default
      colors.append(valueRow('Room for the dots', '--cs-controls-space', state.props));
      // Same story as the arrow hover colours: three engine properties the
      // Reference documents and the panel never offered. The hero even sets
      // --cs-dot-current blind, in its pattern props, with nothing able to
      // show a designer what colour it picked or let them change it.
      colors.append(valueRow('Dot size', '--cs-dot-size', state.props));
      colors.append(colorRow('Dot colour', '--cs-dot-fg', state.props));
      colors.append(colorRow('Dot colour, current', '--cs-dot-current', state.props));
    }
    // F099: a gallery draws a thumbnail rail instead of dots, and both its size
    // knobs and the hover zoom were in the engine and in the Reference with no
    // way to reach them from here. Thumbs ABOVE the photo stays hand CSS and a
    // vertical rail is a deliberate no - the strip is laid out and auto-scrolled
    // horizontally, so there is nothing to turn.
    if (state.data['data-cs-gallery'] != null) {
      colors.append(valueRow('Thumbnail width', '--cs-thumb-w', state.props));
      colors.append(valueRow('Thumbnail height', '--cs-thumb-h', state.props));
      colors.append(valueRow('Thumbnail zoom', '--cs-thumb-hover-scale', state.props));
    }

    // F102: the hero hard-codes the crossfade and its duration knob never
    // appeared, though both have been in the engine all along.
    if (fading) colors.append(valueRow('Crossfade time', '--cs-fade-ms', state.props));

    panel.append(section('Arrows and spacing', colors));

    // F018 (the half that needs no decision): the tab words were hard-coded,
    // so a Trucks/SUVs/Crossovers bar could not become New/Used/Certified
    // without editing the pasted markup. The pane ids and the aria wiring are
    // derived from the same names, so renaming a tab keeps them in step.
    // Which models sit under which tab is the part still to be decided.
    if (p.panes) {
      const names = document.createElement('div');
      (state.panes ?? p.panes).forEach((name, i) => {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = name;
        input.placeholder = p.panes[i];
        input.addEventListener('input', () => {
          const next = [...(state.panes ?? p.panes)];
          next[i] = input.value.trim() || p.panes[i];
          state.panes = next.every((n, j) => n === p.panes[j]) ? null : next;
          render();
        });
        names.append(control(`Tab ${i + 1}`, input));
      });
      panel.append(section('Tab names', names));
    }

    if (Object.keys(state.lookProps).length) {
      const knobs = document.createElement('div');
      for (const k of Object.keys(state.lookProps)) {
        const v = state.lookProps[k];
        if (/^#|rgb|transparent/.test(v)) knobs.append(colorRow(knobLabel(k), k, state.lookProps));
        else if (ENUMS[k]) knobs.append(control(knobLabel(k), enumSelect(k, state.lookProps)));
        else knobs.append(valueRow(knobLabel(k), k, state.lookProps));
      }
      panel.append(section('This card style', knobs));
    }

    const beh = document.createElement('div');
    const step = document.createElement('select');
    // data-cs-step takes a number as of 2026-08-27: how many cards one arrow
    // click moves. 'page' is a whole screenful; 'slide' is the old name for 1.
    for (const [v, label] of [
      ['page', 'a full page'],
      ['slide', '1 card'],
      ['2', '2 cards'],
      ['3', '3 cards'],
      ['4', '4 cards'],
    ]) {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = label;
      o.selected = (state.data['data-cs-step'] ?? 'page') === v;
      step.append(o);
    }
    step.addEventListener('change', () => {
      if (step.value === 'page') delete state.data['data-cs-step'];
      else state.data['data-cs-step'] = step.value;
      render();
    });
    beh.append(control(fading ? 'Arrows move (a crossfade always moves 1)' : 'Arrows move', step));

    // data-cs-autoplay has been a first-class engine option all along, and the
    // panel never showed it: the hero carried it hard-wired at 5000, and no
    // other pattern could turn it on. Slowing a hero, holding one still, or
    // rotating a testimonial strip all meant knowing the attribute and editing
    // the copied markup by hand.
    //
    // Read straight off state.data, so the hero's own 5000 IS this field's
    // value rather than a literal sitting beside a control that invented its
    // own. Not offered in gallery mode: the engine throws autoplay away there
    // and says so in a console warning, and a control that writes an attribute
    // the engine discards is the plainest kind of lying control.
    if (state.data['data-cs-gallery'] == null) {
      const auto = document.createElement('input');
      auto.type = 'number';
      auto.min = '0';
      auto.step = '500';
      auto.value = state.data['data-cs-autoplay'] ?? '0';
      auto.addEventListener('change', () => {
        // Whole milliseconds above zero, or no attribute at all. htmlFor drops
        // a data value into a double-quoted attribute unescaped, and the
        // engine's parseInt would take "5s" and rotate every 5 milliseconds.
        const n = parseInt(auto.value, 10);
        if (Number.isFinite(n) && n > 0) {
          state.data['data-cs-autoplay'] = String(n);
          // The engine forces rewind back on under autoplay - a strip that
          // rotates to the last slide and stops dead reads as broken - and
          // warns when it does. Tall photos ships data-cs-rewind="false", so
          // without this every dealer page running it would log that warning.
          delete state.data['data-cs-rewind'];
        } else delete state.data['data-cs-autoplay'];
        auto.value = state.data['data-cs-autoplay'] ?? '0';
        buildPanel(); // "At the ends" reads the autoplay state as it is built
        render();
      });
      beh.append(
        control('Rotate every (ms)', auto, 'Zero turns it off. Zero of the 55 OEM model bars surveyed rotate either — rotation belongs on a hero; a strip of cards is easier to read holding still.'),
      );
    }

    // data-cs-rewind has been in the engine and the reference all along; it was
    // just unreachable from here, so the only way to stop at the ends was to
    // know the attribute and hand-edit the snippet.
    const ends = document.createElement('select');
    for (const [v, label] of [
      // F055: "Wrap around" reads as an endless loop to anyone coming from
      // slick, which loops by cloning - 51 of the 55 OEM model bars surveyed
      // do. This one scrolls back to the first card instead, visibly, and the
      // question "why does it jump back?" was going to be the first one asked.
      ['', 'Wrap around (scrolls back to the first)'],
      ['false', 'Stop at the ends'],
    ]) {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = label;
      o.selected = (state.data['data-cs-rewind'] ?? '') === v;
      ends.append(o);
    }
    // The engine ignores rewind:false under autoplay (a rotating strip that
    // stops dead at the last slide is a broken-looking page) and says so in a
    // console warning. Say it here instead of letting the control lie.
    const autoplaying = state.data['data-cs-autoplay'] != null;
    ends.disabled = autoplaying;
    ends.addEventListener('change', () => {
      if (ends.value) state.data['data-cs-rewind'] = ends.value;
      else delete state.data['data-cs-rewind'];
      render();
    });
    beh.append(
      control(
        autoplaying ? 'At the ends (autoplay always wraps)' : 'At the ends',
        ends,
        'There are no cloned slides, so wrapping is a scroll back to the first card rather than an endless loop. Cloning would duplicate the content for search engines and make a screen reader count every card twice.',
      ),
    );

    // Not offered in gallery mode: those four patterns draw a thumbnail strip
    // and have no dots at all, so the switch added a rule matching nothing and
    // a tick round trip left a dead controls-space line in the copied CSS.
    const galleryMode = state.data['data-cs-gallery'] != null;
    const dots = document.createElement('input');
    dots.type = 'checkbox';
    dots.checked = !state.hideDots;
    dots.addEventListener('change', () => {
      state.hideDots = !dots.checked;
      // The dot row is a RESERVATION, not the dots: the engine holds
      // --cs-controls-space of padding under the track from the moment the page
      // paints (src/custom-slider.css), so starting the slider shifts nothing.
      // Hiding the dots without collapsing that reservation leaves its height
      // standing as blank page - measured 30px on the hero, 45px on Tall
      // photos, 37.5px on any pattern shipping no value of its own.
      //
      // So take the room away with the dots and hand back exactly what was
      // there, never the engine's 2.5em: a tick round trip used to rewrite the
      // pattern's own value. 0.1px and never 0, because the platform's
      // minifier turns 0px into a unitless 0 and that invalidates the arrow's
      // centring calc(). The `.cs-dots { display: none }` rule stays either
      // way - the dots are absolutely positioned at the bottom of the root, so
      // with the strip collapsed they would draw over the last line of text.
      if (state.hideDots) {
        state.dotSpace = state.props['--cs-controls-space'] ?? null;
        state.props['--cs-controls-space'] = '0.1px';
      } else {
        // A pattern that ships dots-off has never had a strip, so the first
        // tick has nothing to restore and takes the engine's own.
        state.props['--cs-controls-space'] = state.dotSpace ?? '2.5em';
        state.dotSpace = null;
      }
      buildPanel(); // the space knob appears and disappears with the dots
      render();
    });
    if (!galleryMode) beh.append(control('Show dots', dots));

    // F057: the hero reserved a strip under the photo and drew its dots there.
    // 57 of the 76 OEM heroes surveyed carry Bootstrap's carousel-indicators,
    // which sit over the image by default - so this is the convention, though
    // the census counted them present rather than measuring their position.
    //
    // Off by default. The census is a good argument for making this one click
    // and a bad one for changing how every hero already built draws itself.
    //
    // Offered only where the slide IS the photograph. Over a card strip the
    // dots would land on the last line of card text, which is the thing the
    // reservation exists to prevent.
    //
    // Measured before building it: taking the strip away leaves the photo the
    // same size (415.7px either way) and does not move the arrows (207.8px
    // either way - .cs-arrow centres on 100% of a root that shrank by exactly
    // the strip, so the formula corrects itself). The hero simply loses 30px.
    const photoSlides = (p.css || '').includes('cargo-photo');
    if (photoSlides && !galleryMode && !state.hideDots) {
      const over = document.createElement('input');
      over.type = 'checkbox';
      over.checked = !!state.dotsOver;
      over.addEventListener('change', () => {
        state.dotsOver = over.checked;
        if (state.dotsOver) {
          // Remember all three, because all three change together and a tick
          // round trip has to hand back exactly what was there.
          state.dotsWere = {
            space: state.props['--cs-controls-space'] ?? null,
            fg: state.props['--cs-dot-fg'] ?? null,
            current: state.props['--cs-dot-current'] ?? null,
          };
          // 0.1px, never 0: the platform minifier turns 0px into a unitless 0
          // and that invalidates the arrow's centring calc().
          state.props['--cs-controls-space'] = '0.1px';
          // The engine's #757575 is tuned for 3:1 on WHITE, and a photograph
          // is not white. Light dots are the only ones that read on an unknown
          // image, and they are written into the knobs rather than applied
          // behind them - a control has to show what the slider is using.
          state.props['--cs-dot-fg'] = 'rgba(255, 255, 255, 0.55)';
          state.props['--cs-dot-current'] = '#fff';
        } else {
          const was = state.dotsWere ?? {};
          for (const [k, v] of [
            ['--cs-controls-space', was.space],
            ['--cs-dot-fg', was.fg],
            ['--cs-dot-current', was.current],
          ]) {
            if (v == null) delete state.props[k];
            else state.props[k] = v;
          }
          state.dotsWere = null;
        }
        buildPanel();
        render();
      });
      beh.append(
        control('Dots over the image', over, 'Takes away the strip under the photo and draws the dots on it. Turns them light, because the default grey is tuned for white and a photograph is not.'),
      );
    }

    const gut = document.createElement('input');
    gut.type = 'checkbox';
    gut.checked = state.gutter;
    gut.addEventListener('change', () => {
      state.gutter = gut.checked;
      render();
    });
    beh.append(control('Arrows outside the cards', gut, 'Off lets the arrows sit on top of the first and last card. On reserves a channel beside them instead.'));

    // No slide-count dial. The roster length IS the slide count, and "Add a
    // slide" / "Remove" are the only things that move it - the note above the
    // rows says how many there are. A dial beside them was a second owner of
    // one number, and the only writer of it that did not rebuild the row list:
    // the editor went on offering rows the slider no longer had, and the next
    // edit to one of them threw "Cannot set properties of undefined" and was
    // silently lost. Every other writer of state.count already rebuilds.
    //
    // The name is NOT here either. It lives beside the copy buttons, because it is the
    // one setting whose consequence lands on the page rather than on this
    // slider - see the note in demo/index.html.

    // Never disabled. On a pattern that draws its own cards this changes
    // nothing, and the note below says so - a greyed-out control that will not
    // explain itself is what the previous version of this got wrong.
    const alone = document.createElement('input');
    alone.type = 'checkbox';
    alone.checked = state.standalone;
    alone.addEventListener('change', () => {
      state.standalone = alone.checked;
      render();
    });
    beh.append(control('Paste the card styles too', alone));
    const aloneNote = document.createElement('p');
    aloneNote.className = 'wb-note';
    aloneNote.textContent = state.look
      ? 'Leave this off: the card styling comes from custom-slider.css, which is what keeps the snippet short. Tick it only for a page that cannot link that file — the slider looks the same either way.'
      : 'This pattern draws its own cards, so its styling comes with the snippet either way — this setting changes nothing here.';
    beh.append(aloneNote);

    panel.append(section('Behaviour', beh));

    // F103: the last two engine properties with no control anywhere. Matching a
    // site's focus-ring colour or slowing the control transitions meant reading
    // the name off the Reference and hand-editing the snippet. Both are rare
    // enough to sit at the end rather than among the settings people reach for
    // every time.
    const adv = document.createElement('div');
    adv.append(colorRow('Focus ring', '--cs-focus', state.props));
    adv.append(valueRow('Control transition', '--cs-transition', state.props));
    panel.append(section('Everything else', adv));
  }

  /* ---- slide content ----------------------------------------------------- */

  // Which model keys a designer can edit, in the order they read on a card, and
  // the control each one wants. A pattern shows only the fields its own content
  // actually carries, so a review card never asks for an image URL and a photo
  // never asks for a star rating.
  const FIELDS = {
    // type text, not url. A url field rejects every path the editor itself
    // suggests - #MISCPATH#your-photo.jpg, /static/... and img/... are all
    // "invalid" to it - and Chromium paints nothing, so 16 fields on the model
    // bar sat marked invalid to a screen reader with no visible cause.
    img: { label: 'Image URL', type: 'text', hint: '#MISCPATH#your-photo.jpg' },
    alt: { label: 'Alt text', type: 'text', hint: 'What the photo shows — leave empty only if the card text already says it' },
    // Only offered where the rows carry the key, which is the five patterns
    // whose slide is nothing but a photo. Empty emits no <figcaption> and no
    // <figure>, so a pattern nobody captions ships the markup it always did.
    // Which tab this slide belongs to, matched on the tab's visible name.
    // Blank means every tab, and a roster where none is filled in keeps the
    // rotation this pattern has always emitted.
    tab: { label: 'Tab', type: 'text', hint: 'Which tab shows this slide — leave empty and it shows in all of them' },
    // Empty emits a plain <img>, exactly what shipped before. Only the hero's
    // rows carry the key, so the box appears there and nowhere else.
    phone: { label: 'Phone image', type: 'text', hint: 'Different art under 768px — leave empty to use the one above at every width' },
    caption: { label: 'Caption', type: 'text', hint: 'Printed under the photo. Say something the alt text does not, or leave it empty' },
    badge: { label: 'Badge', type: 'text', hint: 'A short label over the photo — New, Certified, Special Offer. Empty draws nothing' },
    w: { label: 'Source width', type: 'number', hint: 'Real pixel width of the file' },
    h: { label: 'Source height', type: 'number', hint: 'Real pixel height of the file' },
    // Empty prints the words the card style has always printed, so a roster
    // nobody edits renders exactly as it did before.
    cta: { label: 'Button text', type: 'text', hint: 'Empty prints the wording the card style already uses' },
    name: { label: 'Heading', type: 'text' },
    mark: { label: 'Wordmark', type: 'text' },
    sub: { label: 'Sub text', type: 'text' },
    blurb: { label: 'Paragraph', type: 'textarea' },
    quote: { label: 'Quote', type: 'textarea' },
    when: { label: 'When', type: 'text' },
    stars: { label: 'Stars out of 5', type: 'number', min: 0, max: 5 },
    bg: { label: 'Avatar colour', type: 'text' },
    tag: { label: 'Category', type: 'text', hint: 'Must match one of the filter buttons' },
    // Real platform paths, since a placeholder is the shape a designer copies:
    // /searchnew.aspx and /searchused.aspx for inventory, /service.aspx,
    // /finance.aspx, /trade.aspx, /testdrive.aspx, /orderparts.aspx for the rest.
    href: { label: 'Link', type: 'text', hint: '/searchnew.aspx?Model=Tahoe — or /service.aspx, /finance.aspx, /trade.aspx' },
    video: { label: 'Opens a video', type: 'checkbox' },
  };

  // Which of the editor's keys a card look's markup() actually reads. The look
  // is handed a stand-in row that records every property touched and answers
  // truthily, so BOTH arms of a `m.sub ? … : ''` count - the question is what
  // the look CAN draw, not what this roster happens to fill in. Probed from the
  // markup rather than declared beside it: a hand-kept list would drift, and
  // the drift would show only as a field that quietly does nothing. A new
  // editable key has to be READ by the look's markup(), not merely added to
  // FIELDS, or this will hide it.
  const readsOf = (markup) => {
    const seen = new Set();
    try {
      markup(new Proxy({}, { get: (_t, k) => (typeof k === 'string' && seen.add(k), '1') }));
    } catch {
      return null; // a look that will not run on a stand-in row: offer every field the rows carry
    }
    return seen;
  };

  const contentBox = $('wb-content');

  // The content is stored HTML-ready — "Parts &amp; Accessories" — because every
  // markup() interpolates it straight into innerHTML and into the copied
  // snippet. A designer must not have to know that. The editor shows plain text
  // and re-escapes on the way back, so typing `Bob's Tyres & Co` renders as
  // typed instead of injecting markup into the preview and shipping broken HTML
  // in the copy panel. One table covers both contexts: everything lands either
  // in text or in a double-quoted attribute.
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
  const UNESC = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'" };
  const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ESC[c]);
  const unesc = (v) => String(v).replace(/&(amp|lt|gt|quot|apos|#39);/g, (m, e) => UNESC[e] ?? m);
  // Both count the rows rendered directly underneath, so the number and the
  // list cannot disagree - which is what the deleted slide-count dial did.
  // They describe the LIST, not the strip above it: the two-row grid draws
  // eight rows as four slides and the tabbed bar draws them three times over.
  // Appended only where the rows carry them, so the sentence is never about
  // fields that are not on screen. They existed with no explanation at all, and
  // "Source width" reads like something the slider sets rather than something
  // it is told.
  const SIZE_ROWS =
    'Source width and height are the picture file’s real pixel size. The browser reserves the space from them before the photo arrives, which is what stops the page jumping as the slider loads — so change them whenever you change the image.';
  // Where the preview's photos come from, and why the code says something else.
  // The two really are different files and nothing said so.
  const IMG_ROWS =
    'The preview shows local copies; the code points at the platform’s own library, which resolves on any DealerOn site. Replace an address with your own upload and it is used as typed.';
  const OWN_ROWS = (n) => `Your ${n} slides, listed below. The preview above and the code below are built from them — “Use the example content” puts the demo cars back.`;
  const EXAMPLE_ROWS = (n, brand) =>
    `${n} example slides${brand ? ` from the ${brand} preset` : ''}, listed below and ready to edit. “Add a slide” and “Remove” change how many. Change any field and it becomes yours — edits stay in this browser only, so copy the code before you leave.`;

  // Typing eight cards of copy and losing it to a stray refresh is the fastest
  // way to make a tool feel disposable. Keyed BY pattern - an object, one entry
  // each - because the fields differ per pattern and restoring one pattern's
  // rows into another would put a star rating on a photo. It used to be one
  // entry holding one pattern's rows plus its name, and a restore only fired
  // when the name matched: writing three service cards and then editing one
  // heading on a model bar overwrote the service text, silently, with nothing
  // on the page saying so.
  const CKEY = 'cs-content';
  // Two stores, not one. THIS session's edits live in memory and follow you
  // from pattern to pattern; localStorage only holds what Keep has been pressed
  // on. Splitting them is what lets "not saved unless you save it" coexist with
  // F007 - switching pattern must not throw away the slides you just wrote, and
  // an edit that vanishes when you click the next pattern is a worse bug than
  // the one that persisted too eagerly.
  let session = null;
  const readSaved = () => {
    try {
      const v = JSON.parse(localStorage.getItem(CKEY) || 'null');
      // The single-pattern shape this replaced, so a designer mid-edit keeps
      // the rows they had when the page updates under them.
      if (v && Array.isArray(v.rows)) return v.pattern ? { [v.pattern]: v.rows } : {};
      return v && typeof v === 'object' ? v : {};
    } catch {
      /* a corrupt entry must not take the page down with it */
      return {};
    }
  };
  // Seeded once from what was kept, then it is the session's own.
  const readStore = () => (session ??= readSaved());
  const writeStore = (store) => {
    session = store;
  };
  // Keep: this session's rows become the kept ones.
  const flushContent = ({ drop = false } = {}) => {
    const kept = readSaved();
    if (drop) delete kept[state.pattern];
    else if (readStore()[state.pattern]) kept[state.pattern] = readStore()[state.pattern];
    try {
      localStorage.setItem(CKEY, JSON.stringify(kept));
    } catch {
      /* private mode — the editor still works, it just will not survive a reload */
    }
  };
  const saveContent = () => writeStore({ ...readStore(), [state.pattern]: state.content });
  // Only this pattern's rows: "Use the example content" is a per-pattern button
  // and must not throw away work done on the other sixteen.
  const clearContent = () => {
    const store = readStore();
    delete store[state.pattern];
    writeStore(store);
  };
  function restoreContent() {
    const rows = readStore()[state.pattern];
    if (!Array.isArray(rows) || !rows.length) return;
    // Bring a stored row back inside its field's range. An out-of-range
    // number saved before the clamp existed would otherwise sit in the
    // editor disagreeing with the card the markup draws.
    state.content = rows.map((row) => {
      const out = { ...row };
      for (const [k, f] of Object.entries(FIELDS)) {
        if (f.type === 'number' && f.max != null && out[k] != null) out[k] = clamp(out[k], f.min ?? 0, f.max);
      }
      return out;
    });
    state.count = rows.length;
  }

  /* ---- settings, remembered the same way the slides are ----------------- */

  // Remembering the slides but not the settings was worse than remembering
  // neither: a designer came back to their own content under someone else's
  // card style, with the wrong class name, and nothing on the page saying why.
  // Same shape as the content store, keyed by pattern for the same reason.
  const SKEY = 'cs-settings';
  const SAVED = ['look', 'brand', 'perView', 'props', 'lookProps', 'data', 'hideDots', 'gutter', 'standalone', 'name', 'count', 'panes', 'dotsOver', 'dotsWere'];

  // Same split as the slides: what is on screen is the session's, what is in
  // localStorage is what Keep was pressed on.
  let sessionSettings = null;
  const readSaved2 = () => {
    try {
      const v = JSON.parse(localStorage.getItem(SKEY) || 'null');
      return v && typeof v === 'object' && v.byPattern && typeof v.byPattern === 'object' ? v : { byPattern: {} };
    } catch {
      /* a corrupt entry must not take the page down with it */
      return { byPattern: {} };
    }
  };
  const readSettings = () => (sessionSettings ??= readSaved2());
  const flushSettings = ({ drop = false } = {}) => {
    const kept = readSaved2();
    if (drop) delete kept.byPattern[state.pattern];
    else if (readSettings().byPattern[state.pattern]) kept.byPattern[state.pattern] = readSettings().byPattern[state.pattern];
    if (readSettings().frame != null) kept.frame = readSettings().frame;
    try {
      localStorage.setItem(SKEY, JSON.stringify(kept));
    } catch {
      /* private mode — the builder still works, it just will not survive a reload */
    }
  };

  const isMap = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
  // Custom-property and data-attribute names, and values that cannot break out
  // of the attribute they land in: htmlFor() drops a data value straight into a
  // double-quoted attribute without escaping it.
  const PROP = /^--[a-z0-9-]+$/i;
  const ATTR = /^data-cs-[a-z-]+$/i;
  const okStored = (v) => typeof v === 'string' && v.length < 120 && !/["<>{};]/.test(v);
  const cleanMap = (m, keyRe) => {
    if (!isMap(m)) return null;
    const out = {};
    for (const [k, v] of Object.entries(m)) if (keyRe.test(k) && okStored(v)) out[k] = v;
    return out;
  };

  // Written only when something actually changed, so a pattern nobody touched
  // gets no entry at all - and a later change to that pattern's shipped
  // defaults still reaches a browser that has been here before.
  let baseline = null;
  // The SLIDES are in here too, not just the settings. Keep writes both, so
  // "is there anything to keep" has to ask about both - with the settings alone
  // it was possible to rewrite every heading on a pattern and find the button
  // still greyed out.
  const snapshot = () => JSON.stringify([SAVED.map((k) => state[k]), state.content]);
  // force: the Keep button. Without it this records the baseline on the first
  // call after a pattern loads and writes nothing ever again - which is what
  // makes the panel a scratchpad rather than a diary.
  const saveSettings = ({ force = false } = {}) => {
    const snap = snapshot();
    if (baseline === null) baseline = snap;
    // Memory always; disk only when Keep asked. The entry is written even
    // unchanged, because "what this pattern looked like when I left it" is what
    // restoreSettings reads on the way back.
    readSettings().byPattern[state.pattern] = Object.fromEntries(SAVED.map((k) => [k, state[k]]));
    if (force) flushSettings();
  };

  // The chosen preview width is not per pattern: it stands for the screen you
  // are designing for, which does not change when you switch pattern.
  const saveFrame = (w) => {
    readSettings().frame = w;
    flushSettings();
  };

  // Is what is on screen different from what is stored (or, with nothing
  // stored, from what the pattern ships as)? That is the only question the
  // Keep/Reset pair needs answered, and snapshot() already answers it.
  let markDirty = () => {};
  function wireKeepReset() {
    const keep = $('wb-keep');
    const reset = $('wb-reset');
    const flag = $('wb-dirty');
    if (!keep || !reset || !flag) return;

    markDirty = () => {
      // The baseline is whatever the pattern rendered as before anyone touched
      // it, so this claims it on the first call after a load. restoreSettings()
      // clears it on every pattern switch, and render() calls this straight
      // after - so the mark is always against THIS pattern's starting point,
      // whether that came from its shipped defaults or from a kept entry.
      if (baseline === null) baseline = snapshot();
      const dirty = snapshot() !== baseline;
      flag.hidden = !dirty;
      keep.disabled = !dirty;
      // Reset is about the KEPT entry as much as the screen: a pattern with
      // something on disk can always be put back, dirty or not. Asked of the
      // kept stores, never the session ones - those hold an entry for every
      // pattern that has been rendered, so they would light this permanently.
      reset.disabled = !dirty && !readSaved2().byPattern[state.pattern] && !readSaved()[state.pattern];
    };

    keep.addEventListener('click', () => {
      saveSettings({ force: true });
      flushContent();
      baseline = snapshot();
      markDirty();
      flash(keep, 'Kept');
    });

    reset.addEventListener('click', () => {
      // Both stores, because both are per pattern and a half reset is the
      // confusing one: settings back to shipped, slides still edited.
      delete readSettings().byPattern[state.pattern];
      flushSettings({ drop: true });
      clearContent();
      flushContent({ drop: true });
      // Reload the pattern from its shipped definition rather than unpicking
      // the state by hand: loadPattern is the one place that knows what a
      // pattern is before anybody touched it.
      loadPattern(state.pattern);
      buildPanel();
      buildContent();
      render();
      baseline = snapshot();
      markDirty();
      flash(reset, 'Reset');
    });

    markDirty();
  }

  function restoreSettings() {
    baseline = null;
    const s = readSettings().byPattern[state.pattern];
    if (!isMap(s)) return;
    // The look first: applyLook() hands the previous look's --cs-* values back
    // before taking the new one's, so the props restored below have to land on
    // top of it, not under it. Only where the pattern HAS a look picker -
    // forcing one onto a pattern that draws its own cards would put a cargo-
    // class on markup that does not have it.
    if (PATTERNS[state.pattern].look && LOOKS[s.look] && s.look !== state.look) {
      applyLook(s.look);
      state.perView = { ...LOOKS[s.look].perView };
    }
    if (isMap(s.perView)) {
      for (const k of ['base', ...BPS]) {
        const n = s.perView[k];
        // Whole cards, 1 to 8, and only for a tier this pattern actually has -
        // adding one would emit a column class the pattern never ships.
        if (state.perView[k] != null && Number.isInteger(n) && n >= 1 && n <= 8) state.perView[k] = n;
      }
    }
    const props = cleanMap(s.props, PROP);
    if (props) state.props = { ...state.props, ...props };
    // A look knob this look no longer has must not add a row to the panel or a
    // line to the snippet, so only the keys it still ships come back.
    const lookProps = cleanMap(s.lookProps, PROP);
    if (lookProps) for (const k of Object.keys(state.lookProps)) if (k in lookProps) state.lookProps[k] = lookProps[k];
    // Replaced, not merged: modelbar, tabs and service ship data-cs-step="slide"
    // and Tall photos ships data-cs-rewind="false", and setting "Arrows move" to
    // a full page DELETES the attribute. A merge would put the pattern's own
    // value back and leave the select saying "a full page" over a slider
    // stepping one card. A map that lost a key to the checks was not written by
    // this panel, so it is refused whole rather than obeyed in half.
    const data = cleanMap(s.data, ATTR);
    if (data && isMap(s.data) && Object.keys(data).length === Object.keys(s.data).length) state.data = data;
    for (const k of ['hideDots', 'gutter', 'standalone', 'dotsOver']) if (typeof s[k] === 'boolean') state[k] = s[k];
    // Through toClass() rather than trusted: a name stored before the sanitiser
    // existed could be an invalid selector.
    if (okStored(s.name) && toClass(s.name)) state.name = toClass(s.name);
    // The brand is remembered so the picker shows it, but the preset is NOT
    // re-run: it would overwrite the ladder and card style restored above with
    // the preset's own, undoing every edit made after picking it.
    if (BRANDS[s.brand]) state.brand = s.brand;
    if (Number.isInteger(s.count) && s.count >= 1 && s.count <= 16) state.count = s.count;
  }

  // The roster as it stands, ignoring any edits — the example content, or the
  // brand's if one is picked.
  const exampleRoster = () => {
    const p = PATTERNS[state.pattern];
    return state.brand && BRANDS[state.brand]?.models ? BRANDS[state.brand].models : p.models;
  };

  // Editing starts from what is already on screen, so the fields arrive filled
  // in rather than blank. The worked example IS the starting point — nobody
  // wants to type a whole model bar from nothing to see how one behaves.
  function adoptContent() {
    if (!state.content) {
      const src = exampleRoster();
      state.content = Array.from({ length: state.count }, (_, i) => ({ ...src[i % src.length] }));
    }
    return state.content;
  }

  function buildContent() {
    if (!contentBox) return;
    contentBox.replaceChildren();
    const src = exampleRoster();
    const rows = state.content ?? Array.from({ length: state.count }, (_, i) => src[i % src.length]);
    // Only the fields this pattern's own content uses - and, where a card LOOK
    // draws the slides, only the ones its markup() actually reads. Same
    // precedence as draw() at the top of htmlFor(): a pattern's own slides()
    // and the card grid both win over the look, so neither may be filtered by
    // a markup() that is not drawing them. The cutout roster carries a wordmark
    // and a paragraph for the looks that have a slot; the tile has neither, so
    // those two boxes took typing, stored it, and shipped it nowhere - not to
    // the preview and not to the snippet. An intersection, never a
    // replacement: it can only ever REMOVE a field.
    const pat = PATTERNS[state.pattern];
    const drawn = !pat.slides && !pat.cardGrid && state.look ? readsOf(LOOKS[state.look].markup) : null;
    // A key the PATTERN consumes rather than the card. The readsOf probe asks
    // the card style what it draws, which is right for content - but Tab decides
    // which pane a row lands in, and no card style reads it, so the probe would
    // hide the one field the tabbed bar exists to offer.
    const PATTERN_KEYS = new Set(pat.panes ? ['tab'] : []);
    const keys = Object.keys(FIELDS).filter((k) => rows.some((m) => m[k] !== undefined) && (!drawn || drawn.has(k) || PATTERN_KEYS.has(k)));

    const note = document.createElement('p');
    note.className = 'wb-note';
    // Credited to the preset only when the preset actually supplied cars.
    // Fiat is the one of the 32 with no roster of its own.
    const preset = state.brand ? BRANDS[state.brand] : null;
    const setNote = () => {
      note.textContent =
        (state.content ? OWN_ROWS(state.content.length) : EXAMPLE_ROWS(rows.length, preset?.models ? preset.label : null)) +
        (keys.includes('img') ? ` ${IMG_ROWS}` : '') +
        (keys.includes('w') ? ` ${SIZE_ROWS}` : '');
    };
    setNote();
    contentBox.append(note);

    const list = document.createElement('div');
    list.className = 'wb-slides';
    rows.forEach((m, i) => {
      // A fieldset, not a div: this is a group of related controls, and the
      // legend is what makes a screen reader announce "Slide 3, Heading"
      // instead of leaving eight identically-labelled fields with no way to
      // tell which slide they belong to. The legend carries the caption ALONE
      // — putting the Remove button inside it would fold "Remove" into the
      // group's accessible name.
      const card = document.createElement('fieldset');
      card.className = 'wb-slide';
      const cap = document.createElement('legend');
      cap.textContent = `Slide ${i + 1}`;
      const head = document.createElement('div');
      head.className = 'wb-slide-head';
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'ui-btn';
      // "Remove" alone is eight identical buttons in the tab order.
      del.textContent = 'Remove';
      del.setAttribute('aria-label', `Remove slide ${i + 1}`);
      // A slider with no slides has nothing to preview and nothing to copy.
      del.disabled = rows.length < 2;
      del.addEventListener('click', () => {
        rememberDiscard('remove');
        const r = adoptContent();
        r.splice(i, 1);
        state.count = r.length;
        saveContent();
        markDirty();
        buildPanel();
        buildContent();
        render();
      });
      head.append(del);
      card.append(cap, head); // legend must be the fieldset's first child

      for (const k of keys) {
        const f = FIELDS[k];
        const input = document.createElement(f.type === 'textarea' ? 'textarea' : 'input');
        if (f.type !== 'textarea') input.type = f.type;
        const isText = f.type !== 'checkbox' && f.type !== 'number';
        if (f.type === 'checkbox') input.checked = !!m[k];
        else input.value = isText ? unesc(m[k] ?? '') : (m[k] ?? '');
        if (f.hint) input.placeholder = f.hint;
        // A range on the field gives the spinner its stops; the clamp below is
        // what actually holds, because typing past the max is still allowed.
        if (f.min != null) input.min = f.min;
        if (f.max != null) input.max = f.max;
        // Two rows cut a quote off mid-sentence and made the drag handle look
        // like the only way to read your own copy.
        if (f.type === 'textarea') input.rows = 4;
        // `input` covers the checkbox too — it fires on state change, so a
        // second `change` listener here would only double the work.
        input.addEventListener('input', () => {
          // Catch the moment the example content becomes the designer's own,
          // so the note above the rows stops calling them the example.
          const adopting = !state.content;
          const r = adoptContent();
          r[i][k] = f.type === 'checkbox' ? input.checked : f.type === 'number' ? (f.max == null ? Number(input.value) : clamp(input.value, f.min ?? 0, f.max)) : esc(input.value);
          saveContent();
          markDirty();
          if (adopting) {
            // The note, never this editor — rebuilding it would replace the
            // field being typed into and drop the caret on every keystroke.
            setNote();
          }
          // Deliberately NOT rebuilding this editor: it would replace the field
          // being typed into and drop the caret on every keystroke.
          render();
        });
        card.append(control(f.label, input));
      }
      list.append(card);
    });
    contentBox.append(list);
  }

  // One step of undo for the three things that throw slides away: Remove, "Use
  // the example content", and picking a brand preset - which replaces the whole
  // roster and used to do it with no warning at all. A confirm() on each would
  // nag on every Remove and blocks the page besides; keeping the last discarded
  // rows costs a variable, and the button only appears when there is something
  // to put back.
  const undoBtn = $('wb-content-undo');
  let undid = null;
  const rememberDiscard = (why) => {
    undid = state.content ? { rows: state.content.map((r) => ({ ...r })), count: state.count, why } : null;
    showUndo();
  };
  function showUndo() {
    if (!undoBtn) return;
    undoBtn.hidden = !undid;
    if (undid) undoBtn.textContent = `Undo ${undid.why}`;
  }
  undoBtn?.addEventListener('click', () => {
    if (!undid) return;
    state.content = undid.rows;
    state.count = undid.count;
    undid = null;
    saveContent();
    markDirty();
    showUndo();
    buildPanel();
    buildContent();
    render();
  });

  const contentAdd = $('wb-content-add');
  const contentReset = $('wb-content-reset');
  contentAdd?.addEventListener('click', () => {
    const r = adoptContent();
    // Copy the last card rather than pushing a blank: a blank row has no keys,
    // so the look's markup() would emit an empty card and the field list would
    // lose whichever columns only that row had.
    r.push({ ...r[r.length - 1] });
    state.count = r.length;
    saveContent();
    markDirty();
    buildPanel();
    buildContent();
    render();
  });
  contentReset?.addEventListener('click', () => {
    rememberDiscard('putting the example back');
    state.content = null;
    state.count = exampleRoster().length;
    clearContent();
    buildPanel();
    buildContent();
    render();
  });

  // Preview width. The column the stage sits in is not the width the slider
  // will have on a real page, so the default caps it at Bootstrap 3's 1170px
  // .container and you can step down through the other two tiers.
  const widthBtns = () => [...document.querySelectorAll('.ui-widths button')];

  // `keep` false for a width the WINDOW forced rather than the designer chose:
  // shrinking the browser steps the preview down, and that correction must not
  // overwrite the width they picked and expect back next time.
  const setFrame = (b, keep = true) => {
    for (const x of widthBtns()) x.setAttribute('aria-pressed', String(x === b));
    const w = +b.dataset.w;
    stage.style.setProperty('--frame', w === 0 ? '100%' : `${w}px`);
    const moved = w !== frameW;
    frameW = w;
    // The preview's per-view is resolved for this frame now, so changing the
    // frame has to regenerate the CSS rather than only resize the box.
    if (moved) render();
    if (keep) saveFrame(w);
    requestAnimationFrame(checkFit);
  };

  // A width the column cannot actually give is a lie: the preview silently
  // renders narrower, the fit gauge then reports "tight" for a layout that is
  // fine on a real page, and the number beside it disagrees with the button
  // you pressed. Offer only the widths that fit, and step down when the window
  // shrinks past one.
  function fitWidths() {
    const box = stage.parentElement;
    const cs = getComputedStyle(box);
    const avail = box.clientWidth - parseFloat(cs.paddingInlineStart) - parseFloat(cs.paddingInlineEnd);
    const reach = avail;
    const SCREEN = { 390: TIER_LABEL.base, 768: TIER_LABEL[768], 992: TIER_LABEL[992], 1200: TIER_LABEL[1200] };
    // Bootstrap 3's own container for each screen. The button width is the
    // SCREEN, because that is what a media query asks; the slider gets the
    // narrower container inside it, and saying both is the honest label.
    const CONTAINER = { 390: 'the full width', 768: '750px', 992: '970px', 1200: '1170px' };
    let active = null;
    for (const b of widthBtns()) {
      const w = +b.dataset.w;
      b.disabled = w > reach + 1;
      b.title = b.disabled
        ? `Make the window about ${Math.round(w + (innerWidth - reach))}px wide to use this`
        : w
          ? `${SCREEN[w]} screen — a ${w}px window, where the slider gets ${CONTAINER[w]}`
          : 'Use all the width this page has';
      if (b.getAttribute('aria-pressed') === 'true') active = b;
    }
    // A chosen width that no longer fits must not keep its label. Buttons stay
    // enabled on `reach` so a collapse can still get you there, but the ACTIVE
    // one is judged on the width available right now: re-opening the rail with
    // Desktop selected rendered 999px and went on calling it Desktop.
    if (active && +active.dataset.w > avail + 1) {
      const widest = widthBtns()
        .filter((b) => !b.disabled && +b.dataset.w <= avail + 1)
        .sort((a, b) => +b.dataset.w - +a.dataset.w)[0];
      if (widest) setFrame(widest, false);
    }
  }

  for (const b of widthBtns()) b.addEventListener('click', () => setFrame(b));

  /* ---- pattern picker ---------------------------------------------------- */

  const nav = $('wb-nav');
  for (const [id, p] of Object.entries(PATTERNS)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `<span class="wb-glyph wb-glyph--${id}"></span><span>${SHORT[id] ?? p.label}</span>`;
    b.title = p.label;
    b.dataset.go = id;
    b.addEventListener('click', () => goToPattern(id));
    nav.append(b);
  }

  // One path for "show this pattern", so the rail, the address bar and any
  // future caller cannot drift apart. Named rather than inlined because the
  // hashchange listener below has to run exactly this and not a copy of it.
  function goToPattern(id, writeHash = true) {
    loadPattern(id);
    // Settings first, content second: restoreContent sets state.count from
    // the stored rows, and edited rows ARE the slide count.
    restoreSettings();
    restoreContent();
    buildPanel();
    buildContent();
    render();
    for (const x of nav.querySelectorAll('button')) x.setAttribute('aria-current', String(x.dataset.go === id));
    if (writeHash) history.replaceState(null, '', '#' + id);
  }

  // F089: the builder read location.hash once at boot, so typing a different
  // #pattern and pressing Enter left the previous one on screen - the address
  // said one thing and the stage showed another. Back and Forward were dead for
  // the same reason. `writeHash: false` because the hash is already what the
  // browser navigated to; writing it again would stack history entries.
  addEventListener('hashchange', () => {
    const [id] = location.hash.slice(1).split('/');
    if (PATTERNS[id] && id !== state.pattern) goToPattern(id, false);
  });

  /* ---- copy / download --------------------------------------------------- */

  const flash = (btn, msg) => {
    const old = btn.textContent;
    btn.textContent = msg;
    setTimeout(() => (btn.textContent = old), 1600);
  };

  async function copyText(btn, text) {
    try {
      await navigator.clipboard.writeText(text);
      flash(btn, 'Copied');
    } catch {
      flash(btn, 'Press Ctrl+C');
    }
  }

  // One button per CMS field. A single Copy handed over
  // `<style>…</style>` + HTML + `<script>` as one blob for three different
  // fields, and left whole in Style Only the tag and the first rule parse as
  // one invalid selector and are dropped - taking the slider's --cs-gap,
  // arrow colours and per-view base with them, with nothing on screen to say
  // so. Each button copies the part its field can actually hold.
  for (const [id, get] of [
    ['wb-copy-css', () => state.cssText],
    ['wb-copy-html', () => state.htmlText],
    ['wb-copy-js', () => state.scriptText],
  ]) {
    $(id).addEventListener('click', (e) => copyText(e.target, get()));
  }

  // Wired once, because it is in the page's own markup rather than rebuilt with
  // the settings panel. render() refreshes it on a pattern change, but never
  // while it has focus - writing a cleaned value back mid-word fights the
  // caret, which is why the cleaned value lands on `change` instead.
  const nameField = $('wb-name');
  nameField.addEventListener('input', () => {
    state.name = toClass(nameField.value) || 'my-slider';
    render();
  });
  nameField.addEventListener('change', () => {
    nameField.value = state.name;
  });

  // Built here rather than read out of the DOM: the markup on disk may carry
  // CRLF, and a stray carriage return inside a pasted tag is a nasty thing to
  // have to debug on someone else's site.
  // The real shared path, not a "/path/" placeholder for the designer to fill
  // in - designers do not upload the engine, and a copied tag they have to edit
  // is a tag that ships wrong. One folder, every site.
  const ENGINE_PATH = '/assets/shared/CustomHTMLFiles/Responsive/Apps/customSlider/';
  const TAGS = [`<link rel="stylesheet" href="${ENGINE_PATH}custom-slider.css">`, `<script src="${ENGINE_PATH}custom-slider.js" defer></script>`].join('\n');
  $('wb-copy-tags').addEventListener('click', (e) => copyText(e.target, TAGS));

  // The engine files, fetched at click time from the very files this page is
  // running - so what lands on the clipboard can never be a stale copy.
  const ENGINE = { css: '../dist/custom-slider.css', js: '../dist/custom-slider.js' };
  const grab = (k) => fetch(ENGINE[k]).then((r) => r.text());

  for (const btn of document.querySelectorAll('[data-file]')) {
    btn.addEventListener('click', async () => {
      const kind = btn.dataset.file;
      const text = await grab(kind);
      if (btn.dataset.act === 'copy') return copyText(btn, kind === 'js' ? `<script>\n${text}\n</script>` : `<style>\n${text}\n</style>`);
      if (btn.dataset.act === 'view') {
        const box = $('wb-file-view');
        box.hidden = false;
        box.querySelector('code').innerHTML = kind === 'css' ? globalThis.CARGO.hl.css(text) : globalThis.CARGO.hl.js(text);
        box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: kind === 'js' ? 'text/javascript' : 'text/css' }));
      a.download = `custom-slider.${kind}`;
      a.click();
      URL.revokeObjectURL(a.href);
      flash(btn, 'Downloaded');
    });
  }

  // This script is inline-loaded before the deferred engine, so wait for it.
  const boot = () => {
    // `#pattern` or `#pattern/card-style`. The Patterns page links one card
    // style per card, and every one of those seven links used to say
    // #modelbar - so six of the seven opened whichever style was last used and
    // read as a broken link.
    const [id, look] = location.hash.slice(1).split('/');
    loadPattern(PATTERNS[id] ? id : 'modelbar');
    restoreSettings();
    restoreContent();
    // After restoreSettings, so a style named in the link beats the remembered
    // one. Same two steps the style buttons take: each look brings the ladder
    // that suits it.
    if (look && LOOKS[look] && PATTERNS[state.pattern].look) {
      applyLook(look);
      state.perView = { ...LOOKS[look].perView };
    }
    for (const x of nav.querySelectorAll('button')) x.setAttribute('aria-current', String(x.dataset.go === state.pattern));
    buildPanel();
    buildContent();
    render();
    // After the first render, so the baseline it compares against is the state
    // the pattern actually booted into rather than an empty one.
    wireKeepReset();
    // Matching a button by data-w IS the validation: a width that is not one of
    // the four finds no button. `keep: false` because the value came FROM
    // storage, and fitWidths below still steps it down if it no longer fits.
    const seat = widthBtns().find((b) => +b.dataset.w === readSettings().frame);
    if (seat) setFrame(seat, false);
    addEventListener('resize', () => {
      fitWidths();
      checkFit();
    });
    fitWidths();
  };
  if (globalThis.CustomSlider) boot();
  else addEventListener('DOMContentLoaded', boot);
})();
