// The patterns: every rail entry, with the example rosters they draw from,
// the CSS and markup each one adds around the engine, and the page script a
// few of them ship. Moved out of workbench.js on 2026-09-14 so that a new
// replacement code is an entry in this file and nothing in the builder -
// the builder (workbench.js) reads PATTERNS off globalThis.CARGO the way it
// reads LOOKS and BRANDS, and its cssFor()/htmlFor() stay the only producers
// of the code a pattern hands over.
//
// A pattern is data: `css` and `script` are template literals so that
// scripts/lint-generated-css.mjs can run the real generator over them, and
// `slides`/`markup` are the functions htmlFor() calls. Nothing here touches
// the DOM; patterns.html and the lint load this file with no page at all.

(() => {
  const { BRANDS } = globalThis.CARGO;

  // A number typed into a slide field reaches the markup, and markup that
  // throws takes the whole builder with it: `'&star;'.repeat(5 - 6)` raises
  // "Invalid count value: -1" inside render(), so the preview and the code
  // panel freeze on the previous card, every later edit throws at the same
  // line - and the bad value is already in localStorage, so the next visit to
  // the Build page boots into a blank screen with nothing to say why. Clamped
  // where the value enters state AND again where the markup is built, so a
  // number saved before this existed cannot take the page down either.
  const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0));

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
.cargo-vdlg-media { display: grid; place-items: center; inline-size: 100%; aspect-ratio: 16 / 9; margin-block-end: 0.8em; overflow: hidden; font-size: 0.9em; color: #fff; text-align: center; background: #16324f; border-radius: 8px; }
/* The player the script builds from the slide's Video URL. It fills the box the
   placeholder already reserved, so the dialog is the same size either way and
   nothing reflows when a video is added to a slide. */
.cargo-vdlg-media > iframe, .cargo-vdlg-media > video { inline-size: 100%; block-size: 100%; border: 0; }
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
  // No fixed aria-label="Video": the heading is written per poster, so a fixed
  // label made every dialog announce the same word and threw away the one thing
  // the reader needed to hear. And no id-based aria-labelledby either: the
  // dialog ships in two patterns, and a page carrying both had two elements
  // with the same id, so both dialogs were named by the FIRST heading (axe
  // duplicate-id-aria, critical, on patterns.html). The script sets aria-label
  // from the poster at open time - per-poster, nothing to collide.
  const VIDEO_DIALOG_HTML = [
    `<dialog class="cargo-vdlg">`,
    `  <h3 class="cargo-vdlg-title"></h3>`,
    `  <!-- Filled from the poster's data-video-src, or left as this placeholder when a slide has no video yet. -->`,
    `  <div class="cargo-vdlg-media">Your video goes here</div>`,
    `  <form method="dialog"><button type="submit" class="cargo-vdlg-close">Close</button></form>`,
    `</dialog>`,
  ];

  // The player is built AT OPEN TIME from the poster's own address, and torn
  // down on close. Three reasons, and none of them is tidiness:
  //
  //   Nothing loads until someone asks. A page carrying six posters would
  //   otherwise start six YouTube players on load - the cost this pattern
  //   exists to avoid, since the whole point of a poster is that video never
  //   plays inline.
  //   The video STOPS when the dialog closes. A player left in the DOM keeps
  //   playing audio behind a closed dialog, which is the one bug every
  //   hand-rolled lightbox ships with.
  //   A slide with no address still gets the placeholder and the comment, so
  //   an untouched roster emits exactly what it always did.
  //
  // A YouTube/Vimeo address becomes an <iframe>; anything else becomes a
  // <video> with controls, which is what a file uploaded to the platform needs.
  const VIDEO_DIALOG_JS = `document.querySelectorAll('[data-video-dialog]').forEach((root) => {
  const dlg = root.querySelector('.cargo-vdlg');
  const title = dlg.querySelector('.cargo-vdlg-title');
  const media = dlg.querySelector('.cargo-vdlg-media');
  const empty = media.innerHTML;
  root.querySelectorAll('[data-video]').forEach((poster) => {
    poster.addEventListener('click', () => {
      title.textContent = poster.dataset.video;
      dlg.setAttribute('aria-label', poster.dataset.video);
      const src = poster.dataset.videoSrc;
      if (!src) media.innerHTML = empty;
      else if (/youtube|youtu\\.be|vimeo/.test(src)) media.innerHTML = '<iframe src="' + src + '" title="' + poster.dataset.video + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
      else media.innerHTML = '<video src="' + src + '" controls playsinline></video>';
      dlg.showModal();
    });
  });
  // Covers the Close button, the Escape key and a click on the backdrop with
  // one listener, because all three end in the same event.
  dlg.addEventListener('close', () => { media.innerHTML = empty; });
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
  // LOGOS and PLACES live up here, above PATTERNS, because the Logo strip and
  // Locations rail entries consume them. Declared after it they are in the
  // temporal dead zone for the generator that patterns.html and
  // lint-generated-css.mjs run, and the failure is a ReferenceError nowhere
  // near the cause - the same trap CLAUDE.md records for cssFor()/htmlFor().
  // Manufacturer marks, for the one look that is about marks rather than cars.
  // /assets/logos/ is root-relative on any dealer domain, like /assets/stock/,
  // so these paste and resolve with nothing uploaded.
  const LOGOS = [
    ['acura', 'Acura'],
    ['bmw', 'BMW'],
    ['chevrolet', 'Chevrolet'],
    ['ford', 'Ford'],
    ['honda', 'Honda'],
    ['hyundai', 'Hyundai'],
    ['nissan', 'Nissan'],
    ['toyota', 'Toyota'],
  ].map(([slug, name]) => ({ img: `img/logo-${slug}.png`, w: 116, h: 100, alt: `${name} logo`, name, mark: name, href: `/searchnew.aspx?Make=${name}`, badge: '', cta: '' }));

  // Dealership photography for the location card, which promises "a storefront
  // photo, the store name and a coloured action bar" and was drawing vehicle
  // cutouts labelled "In stock now".
  const PLACES = [
    ['place-1.jpg', 1920, 1280, 'Downtown', 'Rows of new vehicles on a dealership lot'],
    ['place-2.jpg', 800, 600, 'Northside', 'A dealership lot seen from the forecourt'],
    ['place-3.jpg', 1920, 600, 'Airport Road', 'A dealership building and its forecourt'],
  ].map(([f, w, h, name, alt]) => ({ img: `img/${f}`, w, h, name, alt, sub: 'Open today until 7pm', href: '/dealership/directions.htm', cta: 'Get directions', badge: '' }));

  // Escapes a tab name for the tabs markup builder inside htmlFor() (workbench.js) -
  // both the button text and the aria-label carousel() sets from it. Declared
  // in this file rather than beside htmlFor(), because htmlFor()
  // runs in the generator that patterns.html and lint-generated-css.mjs use
  // (the same trap CLAUDE.md records for cssFor()/htmlFor() itself). The
  // fuller esc()/unesc() pair near the bottom of the file is declared below
  // that return and is in the temporal dead zone for that generator.
  const escTab = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

  // A URL a designer typed, on its way into an href the builder hands over as
  // paste-ready markup. Escaping alone is not enough: a stray quote would end
  // the attribute early, and `javascript:` in the Link box would paste a script
  // onto a dealer page (2026-09-15 review). Everything the platform actually
  // links to is a path, a full http(s) URL, a fragment, or tel:/mailto: — so
  // that is the allowlist, and anything else falls back to "#" rather than
  // shipping. A protocol-relative `//host` is refused too: it is a scheme in
  // disguise. Whitespace is stripped first, because `java\tscript:` is the
  // classic way past a naive prefix check.
  const escUrl = (s) => {
    // Whitespace goes first, and as a plain \s class rather than a control
    // -character escape: `java<TAB>script:` is the classic way past a prefix
    // check because a browser strips the tab before resolving the scheme.
    // (Written this way on purpose - the formatter rewrites a \u00NN escape
    // into the literal byte, which puts a real NUL in this file.)
    const raw = String(s ?? '').replace(/\s+/g, '');
    if (!raw) return '#';
    // A protocol-relative //host is a scheme in disguise.
    if (raw.startsWith('//')) return '#';
    // Everything before the first / ? or # is the scheme, if there is one. A
    // path, a fragment and a query have no colon there; javascript: and data:
    // do, and are the whole point of the check.
    const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(raw.split(/[/?#]/)[0]);
    if (scheme && !/^(?:https?|tel|mailto)$/i.test(scheme[1])) return '#';
    return escTab(raw);
  };

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
    // EVERY CARD IS A RAIL ENTRY, and there is no card-style picker anywhere
    // (2026-09-08). Two of these were promoted first, for a reason that turned
    // out to apply to all seven: the logo look "draws MARKS, so it is drawn
    // with marks" and emits no text node at all, and the location look says
    // "Not a vehicle card at all" - so both were noise in the picker on every
    // vehicle job and invisible to anyone looking for the job they ARE for.
    //
    // The same is true of the rest. looks.js has said since it was written that
    // "a split card is not a stacked card with different numbers, and no
    // property turns one into the other" - all seven emit different element
    // trees. A control that swaps the markup out from under you is not a style
    // control, and nesting it inside a structural pattern (a tabbed bar, a
    // model bar) made the tab strip look like it owned a decision about cards.
    // A purpose belongs in the rail, and the rail is now the only place a card
    // is chosen: pick the thing you want, and the settings are settings.
    wordmark: {
      label: 'Wordmark strip',
      blurb: "The model's wordmark set above the vehicle — the one slot the cutout tile has no room for. A strip like the model bar, one card per step.",
      look: 'wordmark',
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
    // The roster is the look's own `demoModels`, not the model bar's cutouts.
    // A 3:5 card drawn on landscape cutouts is a car floating in dead space,
    // and a square photo half is a photograph's slot, not a transparent PNG's -
    // which is exactly what the picker used to hand you and what promoting
    // these to patterns fixes at the source.
    portrait: {
      label: 'Tall tile with CTA',
      blurb: 'Tall photography with the name and a button over the bottom of the image, on a dark strip. Wants portrait art — 3:5 is the shape it crops to.',
      look: 'portrait',
      models: MODELS,
      data: {},
      props: { '--cs-gap': '1em' },
    },
    split: {
      label: 'Split photo cards',
      blurb: 'Photo down one half, copy and a button down the other. Needs a wide card: 260px is the floor, so it runs one or two across, not five.',
      look: 'split',
      models: SERVICES,
      data: {},
      props: { '--cs-gap': '1em', '--cs-arrow-bg': 'transparent', '--cs-arrow-fg': '#262626' },
    },
    logostrip: {
      label: 'Logo strip',
      blurb: 'Manufacturer marks on panels — the brands a dealer group carries, or the badges on a service page. Not a vehicle card: no name, no price, just the mark.',
      look: 'logo',
      models: LOGOS,
      data: {},
      props: { '--cs-gap': '1em', '--cs-arrow-bg': 'transparent', '--cs-arrow-fg': '#262626' },
    },
    locations: {
      label: 'Locations',
      blurb: 'A card per rooftop — storefront photo, name, address and a link. For a dealer group with more than one site.',
      look: 'location',
      models: PLACES,
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
    // Two-row grid was a rail entry until 2026-09-08. It was the model bar with
    // `pairUp: true` and a two-rung ladder, and nothing else - so it answered
    // "how many rows" by making you leave the pattern you had chosen and lose
    // your settings. Rows is a SETTING now, beside "how many across", and it
    // works on every pattern that draws cards into a track rather than on the
    // one that shipped with it pre-set.
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
      // videoSrc empty on purpose: an example roster must not put a real third
      // party's video on a dealer page, and empty is what makes the Video URL
      // box appear on every slide with the placeholder still shipping.
      models: PHOTOS.slice(0, 3).map((m, i) => ({ ...m, name: ['Dana W.', 'Marcus T.', 'Gene &amp; Marta L.'][i], videoSrc: '' })),
      // `color: inherit` is load-bearing, not tidiness. A <button> takes the UA's
      // `buttontext` system colour unless told otherwise, and `font: inherit`
      // does not carry colour with it. `buttontext` follows color-scheme, so in
      // dark mode it resolves to WHITE - and the name under the poster went
      // white-on-white and vanished. On a dealer site the same card lands on
      // whatever band it is dropped into, so the card has to take the
      // surrounding text colour the way every non-button card already does.
      css: `.cargo-video { position: relative; display: block; inline-size: 100%; padding: 0; overflow: hidden; font: inherit; color: inherit; text-align: start; cursor: pointer; background: none; border: 0; border-radius: 8px; }
.cargo-video:focus-visible { outline: 3px solid var(--cs-focus); outline-offset: 2px; }
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
            `<button type="button" class="cargo-video" data-video="${m.name}"${m.videoSrc ? ` data-video-src="${m.videoSrc}"` : ''} aria-label="Play video: ${m.name}" aria-haspopup="dialog">${pic(m)}<span class="cargo-play" aria-hidden="true">&#9654;</span><span class="cargo-name">${m.name}</span></button>`,
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
      props: {
        '--cs-gap': '0.5em',
        '--cs-controls-space': '0.1px',
        '--cs-arrow-bg': 'transparent',
        '--cs-arrow-fg': '#262626',
        // The tab row's own values. They were literals in the css below until
        // 2026-09-09, which meant no control showed them - the F039 shape - and
        // a brand variant had nothing to set. Defaults are what the literals
        // were, so an untouched pattern draws the same row.
        '--tab-size': '1em',
        // 600 was a literal in the css until 2026-09-14; the live Chevrolet
        // bar wraps each label in <b>, which is 700, and the two weights are
        // different files of ChevySans.
        '--tab-weight': '600',
        '--tab-dim': '0.65',
        // The selected tab's text colour. currentcolor keeps the inherited
        // colour, which is what the untouched pattern drew before this knob
        // existed - --tab-line defaults to currentcolor too, so with this one
        // left alone the line still follows the text exactly as it always has.
        '--tab-selected': 'currentcolor',
        '--tab-line': 'currentcolor',
        '--tab-rule': '#e2e5ea',
        // A string, single-quoted: okStored() refuses a value holding a double
        // quote, so '"|"' would survive the session and vanish on reload.
        '--tab-divider': 'none',
        // The divider's own colour. currentcolor at --tab-dim opacity is what
        // it always drew; Chevrolet's live bar draws its `|` in a grey of its
        // own (#767676) with the tabs at full strength, which no other knob
        // could say.
        '--tab-divider-color': 'currentcolor',
        // Measured on chevroletdemo1, 2026-09-14, after Steven asked why the
        // bar still did not look like the live one: the spacing and the
        // motion were literals. Space between tabs (was a 0.25em flex gap,
        // now half of this on each tab so the divider can sit centred in it,
        // in the tab's own em), the tab's vertical padding (was 0.6em), the
        // divider's size (was the tab size; the live one is the body size)
        // and how long a pane takes to fade in when a tab is picked (the
        // live bar is Bootstrap's 0.15s; 0s is the instant switch this
        // pattern always had).
        '--tab-gap': '0.25em',
        // The whole padding shorthand since 2026-09-14 (it was the block
        // padding alone, over a 1.1em literal each side): Ford's cells run
        // 5px a side, and the line over a picked Ford tab is padding too -
        // see --tab-line-inset.
        '--tab-pad': '0.6em 1.1em',
        // A fraction of the tab text, not a length: the divider's own em
        // would otherwise be its own size, and the offset that centres it
        // in the gap has to be in the TAB's em. 1 is the tab size.
        '--tab-divider-size': '1',
        '--tab-fade': '0s',
        // How long the line under a newly picked tab takes to grow out from
        // its centre (the live bar: 0.15s, ease-out). 0s is the instant
        // switch this pattern always had.
        '--tab-line-grow': '0s',
        // forddemo1's bar, measured 2026-09-14 the afternoon after Chevrolet's:
        // the same pattern in a different dress, and every difference below
        // was a value once these existed. Cells that share the row equally on
        // a grey ground, the picked one white with a 5px line on TOP and no
        // line on hover, a 1px rule between cells and under the unpicked
        // ones, the row and the panes inside one bordered box whose panes are
        // padded, a lead paragraph under the heading. Defaults are what the
        // literals were, so an untouched bar and Chevrolet's draw the same.
        //
        // How each cell is sized: `0 1 auto` is its own text's width, which
        // is what centred tabs want; `1 1 0%` shares the row equally, which
        // is what a row of cells wants (Ford). A filled row has nothing to
        // line up with, so cssFor() leaves the arrow channel off the strip
        // when the grow is non-zero.
        '--tab-flex': '0 1 auto',
        '--tab-leading': '1.55',
        '--tab-case': 'none',
        '--tab-color': 'currentcolor',
        '--tab-bg': 'transparent',
        '--tab-selected-bg': 'transparent',
        // The line under (or over) a picked tab sits INSIDE the tab's padding
        // box: `auto 0` is flush with the bottom, `0 auto` with the top. The
        // padding is what makes room for it - Chevrolet's 2px under, Ford's
        // 5px over - which is why --tab-pad became the whole shorthand.
        '--tab-line-size': '2px',
        '--tab-line-inset': 'auto 0',
        // What the line is under a tab that is only hovered. Chevrolet grows
        // the same line; Ford draws none, and says so with transparent.
        '--tab-line-hover': 'var(--tab-line)',
        // A 1px rule under each UNPICKED tab and a 1px rule between cells,
        // drawn over the row's own rule so the two never stack. Ford's cells
        // have both in #ccc; a centred row wants neither.
        '--tab-cell-rule': 'transparent',
        '--tab-cell-divider': 'transparent',
        '--tab-row-gap': '1em',
        // Below 992px, where the platform's 12-column grid drops to its tablet
        // tier. Ford's tabs go from 16px to 12px there; the pattern's own
        // follow --tab-size unless told otherwise.
        '--tab-size-narrow': 'var(--tab-size)',
        // The padding is in the tab's own em, so a tab that shrinks there
        // would pull its padding in with it - Ford's stays 10px over and
        // 15px under the label at every width, which in a 12px tab is more
        // em, not less.
        '--tab-pad-narrow': 'var(--tab-pad)',
        // The box around the row and the panes (Ford: 1px #ccc), and the
        // padding inside it around the panes and the button (Ford: 30px, 15px
        // below 992). Zero and none by default: a bar with no box draws none.
        '--box-border': 'none',
        '--box-pad': '0.1px',
        '--box-pad-narrow': 'var(--box-pad)',
        // Space under the heading, under the lead paragraph and over the
        // button, each in its own em (the heading's is 36px on the platform).
        '--title-gap': '0.19em',
        '--lead-gap': '2em',
        '--more-gap': '2.29em',
        // The band. cadillacdemo1 (2026-09-14) draws its bar on a black band
        // with white text and a white outline button - which on the platform
        // is the wrapper wearing bg-main (the words' `wrapClass`), so the
        // theme colours the band, the text and the button itself. No knob
        // for the band's colour: it is the site's (2026-09-15, Steven: "the
        // background color will come from the website"), and a --bar-bg that
        // shipped Cadillac's #0a0a0a fought the theme it landed in. The
        // padding is the band's, in the body's em, and follows the
        // platform's tablet tier like the rest.
        '--bar-pad': '0.1px',
        '--bar-pad-narrow': 'var(--bar-pad)',
        // Below 576px, Bootstrap 5's phone tier (a Bootstrap 3 site has no
        // rule there, and one is harmless: it is a narrower phone). Sat at 768
        // for one day; cadillacdemo1 drops its tabs from 18px to 16px and
        // hides the `|` between them at 540, and 576 is the tier that means
        // that. The pattern's own follow the tablet values unless told
        // otherwise, so a bar that never said anything about a phone draws
        // what it always did. A divider on a wrapped row is a `|` dangling at
        // the start of the second line, which is why the divider gets its own
        // phone knob.
        '--tab-size-phone': 'var(--tab-size-narrow)',
        '--tab-divider-phone': 'var(--tab-divider)',
        // The tablet padding is measured against a tablet tab. Ford's cells go
        // back up to the body size on a phone (the row scrolls now, so they no
        // longer have to be crushed to fit four across), and 15px over and
        // under the label is less em in a 14px tab than in a 12px one.
        '--tab-pad-phone': 'var(--tab-pad-narrow)',
        // No --title-gap-phone or --tab-row-gap-phone, and that is a measured
        // no rather than an oversight (2026-09-15, all four measured bars at
        // 320): the heading gap is already 10-13px there and the row gap 14-20,
        // and what makes the bar tall on a phone is the platform's own heading
        // class wrapping "View Our Lineup" onto two 32px lines - the theme's to
        // set, not ours. A knob nothing would ever be set to is a panel row
        // that teaches nobody anything.
      },
      hideDots: true,
      panes: ['Trucks', 'SUVs', 'Crossovers'],
      // The words around the bar. Empty means absent, so a bar that wants
      // neither ships neither. An <h2>, not the platform's h3-styled-as-h1:
      // a section under the page's h1 is an h2, and copying the site's level
      // would ship a heading outline that skips a level.
      title: 'View Our Lineup',
      // A paragraph under the heading, in the platform's own lead class
      // (Ford: "See our full lineup of vehicles…"). Empty by default, so a
      // bar that never had one ships none.
      lead: '',
      more: { text: 'Explore All New Inventory', href: '/searchnew.aspx' },
      css: `/* :is(h2) and :is(p) for one reason: the platform's own .h1 and .lead rules
   set margins at (0,1,0), which is exactly what a scoped .cargo- rule weighs,
   and which of the two the page emits last is undocumented. The element name
   is one point more, so the spacing here wins in either order. */
.cargo-title:is(h2) { margin: 0 0 var(--title-gap); text-align: center; }
.cargo-lead:is(p) { margin: 0 0 var(--lead-gap); text-align: center; }
/* The band's colour is never set here: the wrap wears the platform's bg-main
   and the theme paints it. Over and under only: side to side, a band is as
   wide as the block it is in, and the page's container already insets that. */
%wrap% { padding-block: var(--bar-pad); }
/* The row and the panes sit in one box, the panes and the button in a padded
   body inside it, so a border can wrap the row without padding it - Ford's
   cells run edge to edge. Both are no-ops until a value says otherwise. */
.cargo-box { border: var(--box-border); }
.cargo-body { padding: var(--box-pad); }
/* One row that scrolls, never a wrapped one - the deliberate departure from
   every live bar we measured (2026-09-15). Wrapping left a divider dangling at
   the start of each new row (the divider hangs off the tab that FOLLOWS it, and
   a wrap makes that tab first) and gave Chevrolet's five body styles more height
   on a 320px screen than the car underneath. It is not a phone rule: the same
   bar wrapped to two rows at 600 and 700 too, and a row that never wraps cannot
   dangle anything at any width. A row that fits scrolls nowhere and stays
   centred, so nothing about a desktop bar moves. */
.cargo-tabs { display: flex; flex-wrap: nowrap; justify-content: center; margin-block-end: var(--tab-row-gap); overflow-x: auto; overscroll-behavior-x: contain; scrollbar-width: none; border-block-end: 1px solid var(--tab-rule); }
/* Android WebView has no scrollbar-width, and in-app browsers are real dealer
   traffic - the same reason the engine keeps both on its track. */
.cargo-tabs::-webkit-scrollbar { display: none; }
/* Progressive enhancement, the same shape the engine itself uses: the markup
   carries every pane visible, and the script hides all but the current one and
   sets data-tabs-on at wire time. Until it does, the tab row is not presented at
   all - a row of buttons that switch nothing is worse than no row, and a
   keyboard reader would tab through four of them. With scripts off the attribute
   never arrives, so the reader gets all the panes in sequence under the heading
   instead of one pane and four dead controls. (0,2,0), one over the row's own
   rule, so it wins wherever the sheet lands. */
%wrap%:not([data-tabs-on]) .cargo-tabs { display: none; }
/* Everything below keys on data-more, which the script sets only while the row
   actually overflows. Centring a scroller that overflows puts its first tab out
   of reach, and a cell that shares the row equally (Ford's 1 1 0%) would keep
   shrinking instead of scrolling - but only once there is more than fits. */
.cargo-tabs[data-more] { justify-content: flex-start; }
.cargo-tabs[data-more] [role="tab"] { flex: 0 0 auto; }
/* Which way there is more to see, so the fade never dims an edge with nothing
   past it. Pure decoration, twice over: with no JS there is no attribute, and
   on a browser with no unprefixed mask-image the declaration is dropped. Either
   way the row still scrolls and the cut tab is still the cue - which is why
   this does not earn the -webkit- copy ::-webkit-scrollbar does. LTR, like v1. */
.cargo-tabs[data-more="end"] { mask-image: linear-gradient(90deg, #000 calc(100% - 2em), transparent); }
.cargo-tabs[data-more="start"] { mask-image: linear-gradient(90deg, transparent, #000 2em); }
.cargo-tabs[data-more="both"] { mask-image: linear-gradient(90deg, transparent, #000 2em, #000 calc(100% - 2em), transparent); }
/* No scroll-snap, deliberately. A tab is not a slide: snapping pulled the first
   tab flush against the edge (the snap area is its border box, so the browser
   scrolled off its --tab-gap margin), leaving every bar 14-15px in at rest with
   the start fade lit and nothing behind it.

   Each tab overlaps the row's rule by the 1px of its own bottom border, so a
   cell rule (Ford) draws where the row rule would and the two never stack;
   the picked tab's border goes transparent and the row rule shows through. */
.cargo-tabs [role="tab"] { position: relative; flex: var(--tab-flex); padding: var(--tab-pad); margin-block-end: -1px; margin-inline: calc(var(--tab-gap) / 2); font: inherit; font-size: var(--tab-size); font-weight: var(--tab-weight); line-height: var(--tab-leading); color: var(--tab-color); text-transform: var(--tab-case); cursor: pointer; background: var(--tab-bg); border: 0; border-block-end: 1px solid var(--tab-cell-rule); opacity: var(--tab-dim); }
/* A rule between cells, drawn inside the tab that follows so it costs no
   width - a real border would move every centred tab by a pixel. */
.cargo-tabs [role="tab"] + [role="tab"] { box-shadow: inset 1px 0 var(--tab-cell-divider); }
.cargo-tabs [role="tab"][aria-selected="true"] { color: var(--tab-selected); background: var(--tab-selected-bg); border-block-end-color: transparent; opacity: 1; }
/* The line under the selected tab is a box inside the tab's padding, not a
   border, so it can grow out from the centre the way the live bar's does.
   Zero wide on an unselected tab, so nothing shows. */
.cargo-tabs [role="tab"]::after { position: absolute; inset-block: var(--tab-line-inset); inset-inline-start: 50%; inline-size: 0; block-size: var(--tab-line-size); content: ""; background: var(--tab-line); }
/* Selected, or under the pointer: the live rule pairs li.active a::after
   with li a:hover::after, so the line grows out on hover and shrinks back
   on leave, and a click keeps it. Hover has its own colour so a bar can
   draw no line there at all (Ford); the picked tab's is restated after it,
   so hovering the picked tab never dims its line. */
.cargo-tabs [role="tab"]:hover::after { background: var(--tab-line-hover); }
.cargo-tabs [role="tab"][aria-selected="true"]::after { background: var(--tab-line); }
.cargo-tabs [role="tab"][aria-selected="true"]::after, .cargo-tabs [role="tab"]:hover::after { inset-inline-start: 0; inline-size: 100%; }
@media (prefers-reduced-motion: no-preference) { .cargo-tabs [role="tab"]::after { transition: inline-size var(--tab-line-grow) cubic-bezier(0.215, 0.61, 0.355, 1), inset-inline-start var(--tab-line-grow) cubic-bezier(0.215, 0.61, 0.355, 1); } }
/* The divider sits on the tab that FOLLOWS it, centred in the space before
   it and outside its own box, so it never widens the hit target. none draws
   nothing. */
.cargo-tabs [role="tab"] + [role="tab"]::before { position: absolute; inset-block-start: 50%; inset-inline-start: calc(var(--tab-gap) / -2 / var(--tab-divider-size)); font-size: calc(1em * var(--tab-divider-size)); line-height: 1; color: var(--tab-divider-color); content: var(--tab-divider); opacity: var(--tab-dim); transform: translate(-50%, -50%); }
.cargo-pane[hidden] { display: none; }
/* A pane picked by the reader fades in; the one the page loads with does
   not (the script marks only a switch), and nobody who asked for reduced
   motion sees it at all. Opacity only, so nothing moves. */
@media (prefers-reduced-motion: no-preference) { .cargo-pane[data-in] { animation: cargo-tab-fade var(--tab-fade) linear; } }
@keyframes cargo-tab-fade { from { opacity: 0; } }
/* Only placement. The heading wears the platform's h1 size class and the
   button its btn-cta classes, so the site's own theme sizes and colours
   both - nothing here may name a size, a weight or a colour, or the
   snippet would override the theme it lands in. */
.cargo-more { margin: var(--more-gap) 0 0; text-align: center; }
/* The platform's tablet tier. Ford's live bar drops its tabs to 12px and its
   box padding to 15px here; the defaults follow the wide values. */
@media (max-width: 991.98px) {
  %wrap% { padding-block: var(--bar-pad-narrow); }
  .cargo-tabs [role="tab"] { padding: var(--tab-pad-narrow); font-size: var(--tab-size-narrow); }
  .cargo-body { padding: var(--box-pad-narrow); }
}
/* Three tabs need 272px at the default padding, and a 320px phone leaves 236 -
   so Chevrolet's own three body styles wrapped onto two rows at the narrowest
   size anyone browses at. The padding gives way, not the type: 99px of that
   strip is side padding, and taking 0.6em off each side of each tab buys back
   54px - more than the 35 needed - while the label stays 15px and the tab stays
   43px tall, so nothing about readability or the tap target moves. */
@media (max-width: 767.98px) {
  .cargo-tabs [role="tab"] { padding-inline: 0.5em; }
}
/* Bootstrap 5's phone tier. Cadillac's live bar switches at 540; 576 is the
   tier that means that, and a Bootstrap 3 page simply has a finer phone rule. */
@media (max-width: 575.98px) {
  .cargo-tabs [role="tab"] { padding: var(--tab-pad-phone); font-size: var(--tab-size-phone); }
  .cargo-tabs [role="tab"] + [role="tab"]::before { content: var(--tab-divider-phone); }
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
  // The row scrolls sideways rather than wrapping, at every width. data-more
  // says which way there is more to see and is absent while the row fits, which
  // is what the CSS keys its left alignment and its edge fade on.
  const row = wrap.querySelector('[role="tablist"]');
  const edges = () => {
    const max = row.scrollWidth - row.clientWidth;
    if (max < 2) row.removeAttribute('data-more');
    else row.setAttribute('data-more', row.scrollLeft < 2 ? 'end' : row.scrollLeft > max - 2 ? 'start' : 'both');
  };
  // Strip-local math, never scrollIntoView(): the row sits inside the page, and
  // scrollIntoView() would scroll the PAGE to it as well.
  const reveal = (t) => {
    if (row.scrollWidth - row.clientWidth < 2) return;
    const to = t.getBoundingClientRect().left - row.getBoundingClientRect().left + row.scrollLeft - (row.clientWidth - t.offsetWidth) / 2;
    row.scrollTo({ left: Math.max(0, to), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  row.addEventListener('scroll', edges, { passive: true });
  addEventListener('resize', edges);
  // picked marks a pane the reader switched to, which is what the fade in
  // the CSS keys on - the pane the page loads with is shown without it, so
  // nothing fades on load.
  const show = (i, picked) => {
    tabs.forEach((t, j) => {
      t.setAttribute('aria-selected', String(i === j));
      t.tabIndex = i === j ? 0 : -1;
      panes[j].hidden = i !== j;
      if (picked && i === j) panes[j].setAttribute('data-in', '');
    });
    if (picked) reveal(tabs[i]);
  };
  // The marker the CSS waits for: from here the tab row is a control that
  // works, so it may be presented. Set BEFORE show(0) so the row and the pane
  // hiding arrive in the same frame rather than the row appearing over three
  // open panes.
  wrap.setAttribute('data-tabs-on', '');
  tabs.forEach((t, i) => t.addEventListener('click', () => show(i, true)));
  wrap.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(e.target);
    if (i < 0) return;
    const to = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    const n = (to + tabs.length) % tabs.length;
    show(n, true);
    tabs[n].focus();
  });
  show(0);
  edges();
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
@media (max-width: 767.98px) { %root% { --cs-arrow-size: 36px; } }
@media (max-width: 575.98px) { %root% { --cs-arrow-size: 32px; } }

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
.cargo-model .cargo-name { position: absolute; inset-block-end: 0; inset-inline: 0; display: block; padding: 2.5em 1em 1em; margin: 0; font-size: 1.15em; line-height: 1.3; background: linear-gradient(transparent, rgba(0, 0, 0, 0.78)); }`,
      slides: (models) =>
        models.map(
          (m) =>
            `<a class="cargo-model" href="${m.href}"><img src="${m.img}" width="${m.w ?? 600}" height="${m.h ?? 1000}" alt="" loading="lazy" decoding="async"><h3 class="cargo-name">${m.name}</h3></a>`,
        ),
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
@media (max-width: 575.98px) { %root% { --cs-arrow-size: 32px; } }
.cargo-mix { display: flex; flex-direction: column; block-size: 100%; overflow: hidden; background: #fff; border: 1px solid #e2e5ea; border-radius: 10px; }
.cargo-mix img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 4 / 3; object-fit: cover; }
.cargo-mix .cargo-name { display: block; margin: 0.8em 0.9em 0.2em; font-size: 0.95em; line-height: 1.3; }
.cargo-mix .cargo-sub { display: block; margin: 0 0.9em 0.9em; font-size: 0.85em; line-height: 1.45; color: #5f6368; }`,
      slides: (models) =>
        models.map(
          (m) =>
            `<article class="cargo-mix"><img src="${m.img}" width="${m.w}" height="${m.h}" alt="${m.alt}" loading="lazy" decoding="async"><h3 class="cargo-name">${m.name}</h3><p class="cargo-sub">${m.blurb}</p></article>`,
        ),
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
@media (max-width: 575.98px) { %root% { --cs-arrow-size: 32px; } }
.cargo-svc { display: flex; flex-direction: column; block-size: 100%; overflow: hidden; color: inherit; text-decoration: none; background: #fff; border: 1px solid #e2e5ea; border-radius: 10px; }
.cargo-media { display: block; overflow: hidden; }
.cargo-svc img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 16 / 9; object-fit: cover; transition: transform 0.35s ease; }
.cargo-svc:hover img { transform: scale(1.05); }
@media (prefers-reduced-motion: reduce) { .cargo-svc:hover img { transform: none; } }
.cargo-svc .cargo-name { display: block; margin: 1em 1.1em 0.35em; font-size: 1.1em; line-height: 1.3; }
.cargo-svc .cargo-sub { display: block; margin: 0 1.1em; font-size: 0.9em; line-height: 1.5; color: #5f6368; }
.cargo-svc-more { display: block; margin: 0.9em 1.1em 1.1em; font-size: 0.85em; font-weight: 700; line-height: 1.35; }`,
      slides: (models) =>
        models.map(
          (m) =>
            // aria-hidden because the whole card is already the link: without
            // it a screen reader reads the heading, the blurb and then "Read
            // more" as a second, separate destination.
            `<a class="cargo-svc" href="${m.href}"><span class="cargo-media">${pic(m)}</span><h3 class="cargo-name">${m.name}</h3><p class="cargo-sub">${m.blurb}</p><span class="cargo-svc-more" aria-hidden="true">${m.cta || 'Read more &#8594;'}</span></a>`,
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
@media (max-width: 575.98px) { %root% { --cs-arrow-size: 32px; } }
.cargo-review { block-size: 100%; padding: 1.25em; margin: 0; line-height: 1.5; background: #fff; border: 1px solid #e2e5ea; border-radius: 10px; }
.cargo-review figcaption { display: flex; gap: 0.7em; align-items: center; line-height: 1.35; }
.cargo-avatar { display: grid; flex: none; place-items: center; inline-size: 40px; block-size: 40px; font-weight: 700; line-height: 1; color: #fff; background: var(--avatar-bg); border-radius: 50%; }
.cargo-byline { display: flex; flex-direction: column; line-height: 1.35; }
.cargo-byline .cargo-name { font-size: 0.95em; }
.cargo-byline .cargo-sub { font-size: 0.8em; opacity: 0.7; }
.cargo-stars { display: block; margin: 0.7em 0 0.4em; font-size: 1em; line-height: 1; color: #e0a012; letter-spacing: 0.1em; }
.cargo-review blockquote { margin: 0; }
.cargo-review .cargo-quote { display: block; margin: 0; font-size: 0.95em; line-height: 1.55; }`,
      // The stars ship as HTML entities, not as the glyphs themselves. CMS
      // block storage is Windows-1252 and U+2605/U+2606 are not in it, so a
      // pasted literal star comes back mangled; an entity is plain ASCII and
      // survives the round trip. Same reason the play triangle above is &#9654;.
      slides: (models) =>
        models.map(
          (m) => `<figure class="cargo-review">
  <figcaption>
    <span class="cargo-avatar" aria-hidden="true" style="--avatar-bg: ${m.bg}">${initial(m.name)}</span>
    <span class="cargo-byline"><strong class="cargo-name">${m.name}</strong><small class="cargo-sub">${m.when}</small></span>
  </figcaption>
  <span class="cargo-stars" role="img" aria-label="Rated ${clamp(m.stars, 0, 5)} out of 5">${'&starf;'.repeat(clamp(m.stars, 0, 5))}${'&star;'.repeat(5 - clamp(m.stars, 0, 5))}</span>
  <blockquote><p class="cargo-quote">${m.quote}</p></blockquote>
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
      models: PHOTOS.map((m, i) => ({ ...m, video: i === 2 || i === 4, videoSrc: '' })),
      css: `.cargo-photo { display: block; }
.cargo-photo img, .cargo-mv img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 8px; }
.cargo-mv { position: relative; display: block; inline-size: 100%; padding: 0; font: inherit; color: inherit; cursor: pointer; background: none; border: 0; }
.cargo-mv:focus-visible { outline: 3px solid var(--cs-focus); outline-offset: 2px; }
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
              `<button type="button" class="cargo-mv" data-video="${m.alt}"${m.videoSrc ? ` data-video-src="${m.videoSrc}"` : ''} aria-label="Play video: ${m.alt}" aria-haspopup="dialog">${pic(m)}<span class="cargo-mv-play" aria-hidden="true">&#9654;</span></button>`
            : `<span class="cargo-photo">${pic(m)}</span>`,
        ),
      script: VIDEO_DIALOG_JS,
    },

    lightbox: {
      gutter: false,
      label: 'Fullscreen gallery in a dialog',
      blurb:
        'A thumbnail that opens the full gallery in a native dialog. Built with data-cs-init="manual" so it initialises only once the dialog is open — a slider measured while hidden has no width to measure. Press the thumbnail: the gallery opens over this whole page, the way it will over a dealer page. The Patterns page shows it open too, because a closed button is not an example of a gallery.',
      data: { 'data-cs-gallery': '', 'data-cs-init': 'manual' },
      props: { '--cs-gap': '0.1px', '--cs-arrow-bg': 'rgba(0, 0, 0, 0.55)', '--cs-arrow-fg': '#fff' },
      perView: { base: 1, 768: 1, 992: 1, 1200: 1 },
      minCard: 240,
      // There was a frameMin: 620 here, propping the preview frame up to a
      // window's height so the dialog had something to cover. It was treating
      // the symptom: the dialog opens over the whole page now (liftOverlay in
      // this file), so the frame is back to showing what the pattern actually
      // puts ON the page, which is one button.
      track: 'div',
      models: captioned(PHOTOS),
      css: `.cargo-lb-open { display: inline-flex; gap: 0.7em; align-items: center; padding: 0.6em 1em; font: inherit; font-weight: 600; line-height: 1.55; color: inherit; cursor: pointer; background: #fff; border: 1px solid #e2e5ea; border-radius: 10px; }
.cargo-lb-open img { inline-size: 68px; block-size: 44px; object-fit: cover; border-radius: 5px; }
%root% { --cs-dot-current: #fff; --cs-dot-fg: #9aa3ad; }
/* A lightbox that scrolls is not a lightbox. The dialog was sized on its width
   alone, so on any viewport shorter than head + photo + thumb strip its own
   content overflowed and the UA gave it a scrollbar - measured in the preview
   frame, and it is the same arithmetic on a phone held in landscape. Bound it
   to the viewport, let the flex column give the track the space that is left,
   and cap the photo so it shrinks instead of pushing. min-block-size: 0 is the
   load-bearing line: a flex item's default min-size is its content, so without
   it the track refuses to shrink and the cap above it does nothing. */
.cargo-lb { inline-size: min(94vw, 1100px); max-block-size: min(92dvh, 900px); padding: 0; background: #111; border: 0; border-radius: 12px; }
/* [open], and it is not decoration. A closed <dialog> is hidden by the UA rule
   dialog:not([open]) { display: none }, which is (0,1,1) - so a bare
   .name-wrap .cargo-lb { display: flex } at (0,2,0) OUTRANKS it and every
   closed lightbox on the page renders inline, 1100px wide, wherever it happens
   to sit in the markup. Caught in the preview, where the frame is 176px tall
   and a 1100x162 dark panel spilled out of it. Naming the state costs nothing
   and cannot come back. */
.cargo-lb[open] { display: flex; flex-direction: column; }
.cargo-lb .cs { min-block-size: 0; }
.cargo-lb .cargo-photo img { max-block-size: 70dvh; }
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
.cargo-cg-body .cargo-name { display: block; margin: 0; font-size: 0.95em; line-height: 1.35; }
.cargo-cg-body .cargo-sub { display: block; margin: 0.2em 0 0; font-size: 0.85em; line-height: 1.4; color: #5f6368; }`,
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
@media (max-width: 575.98px) { %root% { --cs-arrow-size: 32px; } }
.cargo-stock { block-size: 100%; padding: 1.1em; background: #f0f2f5; border-radius: 8px; }
.cargo-stock .cargo-name { display: block; margin: 0 0 0.35em; font-size: 1em; line-height: 1.3; }
.cargo-stock .cargo-sub { display: block; margin: 0; font-size: 0.9em; line-height: 1.5; color: #5f6368; }
/* Inline code sits INSIDE the paragraph, so this em is measured against the
   paragraph's 0.9em, not the card base - deliberately, since code should track
   the copy it interrupts. 0.94 of 0.9 is the 0.85-of-base this rendered at
   before the rem-to-em pass; the two-decimal value is that ratio, not a guess. */
.cargo-stock .cargo-sub code { font-size: 0.94em; }`,
      slides: (models) => models.map((m) => `<article class="cargo-stock"><h3 class="cargo-name">${m.name}</h3><p class="cargo-sub">${m.blurb}</p></article>`),
    },
  };

  /* ---- exports ---------------------------------------------------------- */

  // Classic script, not an ES module, on purpose: modules are blocked over
  // file://, and this demo has always had to work when opened by double-click.
  // The rosters go out too: the builder keys them by name for a look that asks
  // to be drawn on a particular one (ROSTERS in workbench.js).
  globalThis.CARGO = Object.assign(globalThis.CARGO || {}, {
    PATTERNS,
    VEHICLES,
    PHOTOS,
    MODELS,
    SERVICES,
    LOGOS,
    PLACES,
    PHOTO_CAPTION_CSS,
    PHOTO_LINK_CSS,
    VIDEO_DIALOG_HTML,
    escTab,
    escUrl,
    clamp,
  });
})();
