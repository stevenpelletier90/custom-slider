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

  const CHEVY = ['silverado-1500', 'colorado', 'tahoe', 'suburban', 'traverse', 'trax', 'equinox', 'trailblazer'];
  const title = (s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const cutouts = CHEVY.map((slug) => ({
    href: `/searchnew.aspx?Model=${encodeURIComponent(title(slug))}`,
    img: `img/chrome-${slug}.webp`,
    alt: `2026 Chevrolet ${title(slug)}`,
    name: title(slug),
    mark: 'Chevrolet',
    sub: 'In stock now',
    blurb: 'Built for the way you actually drive.',
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
  ].map(([f, name, sub, alt]) => ({ img: `img/${f}`, w: 640, h: 480, name, sub, alt, href: '/used-inventory/index.htm' }));

  // From the platform's own industry-automotive collection, not from Unsplash:
  // every dealer can see it, so these copy out as paths that resolve instead of
  // as placeholders. Sizes are the library's real ones and they are not uniform,
  // which is why pic() reads them rather than asserting one shape for all six.
  const PHOTOS = [
    ['photo-1.jpg', 900, 600, 'Technician inspecting a car raised on a lift'],
    ['photo-2.jpg', 900, 600, 'Technician checking a tyre in the service bay'],
    ['photo-3.jpg', 800, 534, 'Technician polishing a car in the detailing bay'],
    ['photo-4.jpg', 800, 534, 'Hand washing the bonnet of a red car'],
    ['photo-5.jpg', 800, 600, 'Driver smiling at the wheel'],
    ['photo-6.jpg', 1200, 717, 'Pressure washing a wheel arch'],
  ].map(([f, w, h, alt]) => ({ img: `img/${f}`, w, h, alt }));

  const pic = (m) => `<img src="${m.img}" width="${m.w ?? 1200}" height="${m.h ?? 750}" alt="${m.alt}" loading="lazy" decoding="async">`;

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

  const SERVICES = [
    ['photo-5.jpg', 'Service Center', 'Factory-trained technicians, genuine parts, and online scheduling for everything from oil changes to major repairs.'],
    ['photo-3.jpg', 'Test Drives', "Book a no-pressure drive online — we'll have the vehicle warmed up and out front when you arrive."],
    ['vehicle-2.png', 'Financing', 'Flexible terms, first-time buyer programs, and pre-approval in minutes without a hit to your credit score.'],
    ['vehicle-4.png', 'Trade-In Appraisal', 'Get a real number for your current vehicle in minutes — good for seven days or 500 miles.'],
    ['photo-6.jpg', 'Parts &amp; Accessories', 'OEM parts counter, accessories, and installation — ordered to your VIN so it fits the first time.'],
    ['photo-2.jpg', 'Body Shop &amp; Detailing', 'Collision repair, paintless dent removal, and full detailing with insurance-claim assistance.'],
  ].map(([f, name, blurb]) => ({ img: `img/${f}`, name, blurb, alt: '', href: '#' }));

  // Photos carrying a category, for the filterable gallery.
  const TAGGED = [
    ['photo-1.jpg', 'exterior', 'Blue Chevrolet Camaro in the desert at dusk'],
    ['photo-2.jpg', 'exterior', 'White Ford Mustang in a neon-lit parking garage'],
    ['photo-4.jpg', 'exterior', 'Audi R8 tail lights on a city street at sunset'],
    ['photo-3.jpg', 'interior', 'Hands on the steering wheel at dusk'],
    ['photo-5.jpg', 'service', 'Technician topping up engine oil'],
    ['photo-6.jpg', 'service', 'Classic BMW grilles lined up in a museum'],
  ].map(([f, tag, alt]) => ({ img: `img/${f}`, tag, alt }));

  // A pattern is content plus defaults. `look` means it draws its cards with a
  // shared component and the look chooser applies; `slides` means it draws its
  // own markup because no card look describes it - a hero is a photo, a video
  // poster is a button.
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
      props: { '--cs-gap': '0px', '--cs-controls-space': '2em', '--cs-dot-current': '#16324f' },
      perView: { base: 1, 768: 1, 992: 1, 1200: 1 },
      minCard: 240,
      models: PHOTOS.slice(0, 3),
      css: `.cargo-photo { display: block; }
.cargo-photo img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 21 / 9; object-fit: cover; border-radius: 8px; }
@media (max-width: 767.98px) { .cargo-photo img { aspect-ratio: 4 / 3; } }`,
      slides: (models) => models.map((m) => `<span class="cargo-photo">${pic(m)}</span>`),
    },
    gallery: {
      gutter: false,
      label: 'Photo gallery',
      blurb: 'Thumbnails generated from the slide images and wired as a real tab list with arrow keys. Thumbs are fresh elements, so site ids and srcset never leak into them.',
      data: { 'data-cs-gallery': '' },
      props: { '--cs-gap': '0px', '--cs-arrow-bg': 'transparent', '--cs-arrow-fg': '#262626' },
      perView: { base: 1, 768: 1, 992: 1, 1200: 1 },
      minCard: 240,
      track: 'div',
      models: PHOTOS,
      css: `.cargo-photo { display: block; }
.cargo-photo img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 8px; }`,
      slides: (models) => models.map((m) => `<span class="cargo-photo">${pic(m)}</span>`),
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
@media (max-width: 767.98px) { %root% { padding-inline: calc(var(--cs-arrow-size) + 0.3em); } }`,
    },
    peek: {
      gutter: false,
      label: 'Peek at the next slide',
      blurb: 'A sliver of the neighbours stays visible so it always reads as "there is more this way". One property — --cs-peek. Zero turns it off.',
      data: {},
      props: { '--cs-gap': '1em', '--cs-peek': '3em', '--cs-arrow-bg': 'rgb(0 0 0 / 55%)', '--cs-arrow-fg': '#fff' },
      perView: { base: 1, 768: 1, 992: 2, 1200: 2 },
      minCard: 240,
      models: PHOTOS,
      css: `.cargo-photo { display: block; }
.cargo-photo img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 8px; }
@media (max-width: 767.98px) { %root% { --cs-peek: 1.5em; } }`,
      slides: (models) => models.map((m) => `<span class="cargo-photo">${pic(m)}</span>`),
    },
    video: {
      gutter: false,
      label: 'Video testimonials',
      blurb: 'Posters open a native dialog, which gives Esc-to-close and focus trapping for free. Video never plays inline — autoplay on video cards fights the content.',
      data: {},
      props: { '--cs-gap': '1em', '--cs-arrow-bg': 'rgb(0 0 0 / 55%)', '--cs-arrow-fg': '#fff' },
      perView: { base: 1, 768: 2, 992: 2, 1200: 3 },
      minCard: 260,
      models: PHOTOS.slice(0, 3).map((m, i) => ({ ...m, name: ['Dana W.', 'Marcus T.', 'Gene & Marta L.'][i] })),
      // `color: inherit` is load-bearing, not tidiness. A <button> takes the UA's
      // `buttontext` system colour unless told otherwise, and `font: inherit`
      // does not carry colour with it. `buttontext` follows color-scheme, so in
      // dark mode it resolves to WHITE - and the name under the poster went
      // white-on-white and vanished. On a dealer site the same card lands on
      // whatever band it is dropped into, so the card has to take the
      // surrounding text colour the way every non-button card already does.
      css: `.cargo-video { position: relative; display: block; inline-size: 100%; padding: 0; overflow: hidden; font: inherit; color: inherit; text-align: start; cursor: pointer; background: none; border: 0; border-radius: 8px; }
.cargo-video img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 16 / 10; object-fit: cover; }
.cargo-play { position: absolute; inset-block-start: 42%; inset-inline-start: 50%; display: grid; place-items: center; inline-size: 56px; block-size: 56px; color: #16324f; background: rgb(255 255 255 / 92%); border-radius: 50%; transform: translate(-50%, -50%); }
.cargo-name { display: block; margin: 0.6em 0 0; font-size: 1em; font-weight: 700; line-height: 1.3; }`,
      slides: (models) =>
        models.map(
          (m) =>
            `<button type="button" class="cargo-video" data-video="${m.name}">${pic(m)}<span class="cargo-play" aria-hidden="true">&#9654;</span><span class="cargo-name">${m.name}</span></button>`,
        ),
    },

    tabs: {
      label: 'Model bar with tabs',
      blurb:
        'The same strip under body-style tabs. Each pane holds its own slider, and a pane revealed later measures itself correctly — so none of slick’s hidden-pane refresh hacks are needed. This is how Chevrolet has shipped its bar since Nov 2025.',
      look: 'tile',
      models: cutouts,
      data: { 'data-cs-step': 'slide' },
      props: { '--cs-gap': '0.5em', '--cs-controls-space': '0.1px', '--cs-arrow-bg': 'transparent', '--cs-arrow-fg': '#262626' },
      hideDots: true,
      panes: ['Trucks', 'SUVs', 'Crossovers'],
      css: `.cargo-tabs { display: flex; flex-wrap: wrap; gap: 0.25em; margin-block-end: 1em; border-block-end: 1px solid #e2e5ea; }
.cargo-tabs [role="tab"] { padding: 0.6em 1.1em; font: inherit; font-weight: 600; color: inherit; cursor: pointer; background: none; border: 0; border-block-end: 2px solid transparent; opacity: 0.65; }
.cargo-tabs [role="tab"][aria-selected="true"] { border-block-end-color: currentcolor; opacity: 1; }
.cargo-pane[hidden] { display: none; }`,
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
      props: { '--cs-gap': '1em', '--cs-arrow-bg': 'rgb(0 0 0 / 55%)', '--cs-arrow-fg': '#fff' },
      perView: { base: 1, 768: 2, 992: 4, 1200: 4 },
      minCard: 190,
      models: MODELS,
      css: `%root% { --cs-dot-fg: #949494; --cs-dot-current: #949494; --cs-controls-space: 3em; }
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
.cargo-model h3 { position: absolute; inset-block-end: 0; inset-inline: 0; padding: 2.5em 1em 1em; margin: 0; font-size: 1.15em; line-height: 1.3; background: linear-gradient(transparent, rgb(0 0 0 / 78%)); }`,
      slides: (models) =>
        models.map((m) => `<a class="cargo-model" href="${m.href}"><img src="${m.img}" width="${m.w ?? 600}" height="${m.h ?? 1000}" alt="" loading="lazy" decoding="async"><h3>${m.name}</h3></a>`),
      // Site-level enhancement, not an engine feature: it reads the engine's
      // own current-dot class and writes two custom properties. Nothing in the
      // engine knows the bar exists.
      script: `document.querySelectorAll('[data-bar] .cs-dots').forEach((bar) => {
  const sync = () => {
    const dots = [...bar.children];
    bar.style.setProperty('--bar-count', dots.length || 1);
    bar.style.setProperty('--bar-index', Math.max(0, dots.findIndex((d) => d.classList.contains('cs-dot--current'))));
  };
  // The class flips on page change; the children are rebuilt when a
  // breakpoint changes the page count, so watch for both.
  new MutationObserver(sync).observe(bar, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  sync();
});`,
    },

    mixed: {
      gutter: true,
      label: 'Mixed image sizes',
      blurb: 'Six source files at six different aspect ratios, all cropped to one shape by the CSS. Dealers upload whatever they have — aspect-ratio plus object-fit is what keeps the row even.',
      props: { '--cs-gap': '1em', '--cs-arrow-bg': 'rgb(0 0 0 / 55%)', '--cs-arrow-fg': '#fff' },
      perView: { base: 1, 768: 2, 992: 3, 1200: 3 },
      minCard: 230,
      models: MIXED,
      css: `%root% { padding-inline: calc(var(--cs-arrow-size) + 0.4em); }
@media (max-width: 767.98px) { %root% { --cs-arrow-size: 36px; } }
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
      props: { '--cs-gap': '1em', '--cs-arrow-bg': 'rgb(0 0 0 / 55%)', '--cs-arrow-fg': '#fff' },
      perView: { base: 1, 768: 2, 992: 3, 1200: 3 },
      minCard: 250,
      models: SERVICES,
      css: `%root% { padding-inline: calc(var(--cs-arrow-size) + 0.4em); }
@media (max-width: 767.98px) { %root% { --cs-arrow-size: 36px; } }
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
            `<a class="cargo-svc" href="${m.href}"><span class="cargo-media"><img src="${m.img}" width="1200" height="750" alt="" loading="lazy" decoding="async"></span><h3>${m.name}</h3><p>${m.blurb}</p><span class="cargo-svc-more" aria-hidden="true">Read more →</span></a>`,
        ),
    },

    reviews: {
      gutter: true,
      label: 'Customer reviews',
      blurb: 'Quotes in a real figure/blockquote, with the star rating exposed as an image plus a text label rather than bare glyphs a screen reader would spell out one at a time.',
      props: { '--cs-gap': '1em', '--cs-arrow-bg': 'transparent', '--cs-arrow-fg': '#262626' },
      perView: { base: 1, 768: 2, 992: 3, 1200: 3 },
      minCard: 250,
      models: REVIEWS,
      css: `%root% { padding-inline: calc(var(--cs-arrow-size) + 0.4em); }
@media (max-width: 767.98px) { %root% { --cs-arrow-size: 36px; } }
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
    <span class="cargo-avatar" aria-hidden="true" style="--avatar-bg: ${m.bg}">${m.name[0]}</span>
    <span class="cargo-byline"><strong>${m.name}</strong><small>${m.when}</small></span>
  </figcaption>
  <span class="cargo-stars" role="img" aria-label="Rated ${m.stars} out of 5">${'&starf;'.repeat(m.stars)}${'&star;'.repeat(5 - m.stars)}</span>
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
      props: { '--cs-gap': '0px', '--cs-arrow-bg': 'rgb(0 0 0 / 55%)', '--cs-arrow-fg': '#fff' },
      perView: { base: 1, 768: 1, 992: 1, 1200: 1 },
      minCard: 240,
      track: 'div',
      models: TAGGED,
      filters: ['', 'exterior', 'interior', 'service'],
      css: `.cargo-filterbar { display: flex; flex-wrap: wrap; gap: 0.4em; margin-block-end: 1em; }
.cargo-filterbar button { padding: 0.4em 0.9em; font: inherit; font-size: 0.87em; color: inherit; cursor: pointer; background: #fff; border: 1px solid #e2e5ea; border-radius: 999px; }
.cargo-filterbar button[aria-pressed="true"] { color: #fff; background: #16324f; border-color: #16324f; }
.cargo-photo { display: block; }
.cargo-photo img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 8px; }`,
      slides: (models) => models.map((m) => `<span class="cargo-photo" data-tag="${m.tag}">${pic(m)}</span>`),
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
      data: { 'data-cs-gallery': '' },
      props: { '--cs-gap': '0px', '--cs-arrow-bg': 'rgb(0 0 0 / 55%)', '--cs-arrow-fg': '#fff' },
      perView: { base: 1, 768: 1, 992: 1, 1200: 1 },
      minCard: 240,
      track: 'div',
      models: PHOTOS.map((m, i) => ({ ...m, video: i === 2 || i === 4 })),
      css: `.cargo-photo { display: block; }
.cargo-photo img, .cargo-mv img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 8px; }
.cargo-mv { position: relative; display: block; inline-size: 100%; padding: 0; font: inherit; color: inherit; cursor: pointer; background: none; border: 0; }
.cargo-mv-play { position: absolute; inset-block-start: 50%; inset-inline-start: 50%; display: grid; place-items: center; inline-size: 64px; block-size: 64px; font-size: 1.3em; color: #16324f; background: rgb(255 255 255 / 92%); border-radius: 50%; transform: translate(-50%, -50%); }`,
      slides: (models) =>
        models.map((m) =>
          m.video
            ? `<button type="button" class="cargo-mv" data-video="${m.alt}">${pic(m)}<span class="cargo-mv-play" aria-hidden="true">&#9654;</span></button>`
            : `<span class="cargo-photo">${pic(m)}</span>`,
        ),
    },

    lightbox: {
      gutter: false,
      label: 'Fullscreen gallery in a dialog',
      blurb:
        'A thumbnail that opens the full gallery in a native dialog. Built with data-cs-init="manual" so it initialises only once the dialog is open — a slider measured while hidden has no width to measure.',
      data: { 'data-cs-gallery': '', 'data-cs-init': 'manual' },
      props: { '--cs-gap': '0px', '--cs-arrow-bg': 'rgb(0 0 0 / 55%)', '--cs-arrow-fg': '#fff' },
      perView: { base: 1, 768: 1, 992: 1, 1200: 1 },
      minCard: 240,
      track: 'div',
      models: PHOTOS,
      css: `.cargo-lb-open { display: inline-flex; gap: 0.7em; align-items: center; padding: 0.6em 1em; font: inherit; font-weight: 600; color: inherit; cursor: pointer; background: #fff; border: 1px solid #e2e5ea; border-radius: 10px; }
.cargo-lb-open img { inline-size: 68px; block-size: 44px; object-fit: cover; border-radius: 5px; }
%root% { --cs-dot-current: #fff; --cs-dot-fg: #9aa3ad; }
.cargo-lb { inline-size: min(94vw, 1100px); padding: 0; background: #111; border: 0; border-radius: 12px; }
.cargo-lb::backdrop { background: rgb(0 0 0 / 80%); }
.cargo-lb-head { display: flex; align-items: center; justify-content: space-between; padding: 0.6em 0.9em; font-size: 0.9em; color: #fff; }
.cargo-lb-close { padding: 0.35em 0.85em; font: inherit; color: #fff; cursor: pointer; background: rgb(255 255 255 / 15%); border: 0; border-radius: 6px; }
.cargo-photo { display: block; }
.cargo-photo img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 16 / 10; object-fit: contain; }`,
      slides: (models) => models.map((m) => `<span class="cargo-photo">${pic(m)}</span>`),
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
      props: { '--cs-gap': '0px', '--cs-controls-space': '0.1px', '--cs-arrow-size': '32px', '--cs-arrow-bg': 'rgb(0 0 0 / 55%)', '--cs-arrow-fg': '#fff' },
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
      css: `%root% { padding-inline: calc(var(--cs-arrow-size) + 0.4em); }
@media (max-width: 767.98px) { %root% { --cs-arrow-size: 36px; } }
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

  const state = { pattern: 'modelbar', brand: null, look: null, perView: null, props: null, lookProps: null, data: null, hideDots: false, content: null, label: null };

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

  function loadPattern(id) {
    const p = PATTERNS[id];
    state.pattern = id;
    state.brand = null;
    state.look = p.look ?? null;
    state.perView = { ...(p.perView ?? LOOKS[p.look].perView) };
    state.props = { ...p.props };
    state.data = { ...p.data };
    state.hideDots = !!p.hideDots;
    state.count = p.models.length;
    // A pattern change is a shape change: a review row has a star rating and a
    // photo row has none, so edited slides can never carry across.
    state.content = null;
    state.label = null; // only renderLook overrides it — see the note there
    // Beside the content wherever a card has text an arrow could land on.
    state.gutter = p.gutter ?? !!p.look;
    state.lookProps = {};
    if (p.look) applyLook(p.look);
  }

  // A brand preset brings its own vehicles where the estate gave us the
  // cutouts. Seventeen of the 32 have none, and those keep the pattern's own
  // content rather than being shown someone else's cars under their name.
  const modelsFor = (p) => (state.content ? state.content : state.brand && BRANDS[state.brand]?.models ? BRANDS[state.brand].models : p.models);

  const minCard = () => PATTERNS[state.pattern].minCard ?? (state.look ? LOOKS[state.look].minCard : 200);

  // The width buttons are Bootstrap 3's own container widths, so choosing 750
  // means "show me a page at the 768 tier". Everything downstream has to agree
  // on which tier that is: what the preview draws, and what the fit gauge
  // thinks a real page would give.
  // Container width -> the screen width whose tier it belongs to. Both numbers
  // are Bootstrap 3's: 768 is what a media query asks, 750 is the .container it
  // hands you at that size. The buttons preview the container, because that is
  // the box the slider gets; the ladder keys on the screen.
  const FRAME_TIER = { 330: 0, 750: 768, 970: 992, 1170: 1200 };
  let frameW = 1170; // the pressed width button, 0 for "fill"
  const frameTier = () => (frameW ? FRAME_TIER[frameW] : innerWidth >= 1200 ? 1200 : innerWidth >= 992 ? 992 : innerWidth >= 768 ? 768 : 0);

  // The ladder evaluated at one tier, the way the cascade would: every
  // matching min-width rule applies and the last one wins.
  const perViewAt = (tier) => {
    let n = state.perView.base;
    for (const bp of BPS) if (bp <= tier && state.perView[bp] != null) n = state.perView[bp];
    return n;
  };

  // --cs-gap as a number. Values here are always em or px. An em resolves
  // against the carousel root, which carries font-size: var(--cargo-font, 1em)
  // - so measure that off the live element rather than assuming 16. Assuming a
  // 16px root is the exact mistake that made every rem render at 62.5% on a
  // Bootstrap 3 storefront; it should not be re-made here. patterns.html has no
  // stage, and 16 is the right guess when there is nothing to measure.
  const gapPx = () => {
    const g = state.props['--cs-gap'] ?? '1em';
    const n = parseFloat(g) || 0;
    if (!g.trim().endsWith('em')) return n;
    const root = stage?.querySelector('.cs');
    return n * (root ? parseFloat(getComputedStyle(root).fontSize) : 16);
  };

  /* ---- the single source: settings -> CSS text -------------------------- */

  // `sel` is the only difference between what runs and what you copy.
  // The patterns that wrap the carousel in something: tabs, a filter bar, a
  // lightbox trigger, or a grid of cards each holding one.
  const hasWrap = () => {
    const p = PATTERNS[state.pattern];
    return !!(p.panes || p.filters || p.cardGrid || state.pattern === 'lightbox');
  };

  function cssFor(sel, preview) {
    const p = PATTERNS[state.pattern];
    // Library mode: the look's rules AND its default values already come from
    // custom-slider-cards.css, so the snippet carries only what this slider
    // changed. That is the difference between a 40-line paste and a 3-line one,
    // and it is computed rather than trusted - a value equal to the look's
    // default is dropped, so the delta block can never go stale against it.
    const base = { ...state.lookProps, ...state.props, '--cs-per-view': state.perView.base };
    const decls = Object.entries(base)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');

    // The base every em inside the card is measured from. It has to be stated
    // here, on the carousel itself, because the card CSS cannot trust either
    // end of the host page: rem follows <html>, and Bootstrap 3 - which the
    // storefronts run - sets `html { font-size: 10px }`, so a 1rem name shipped
    // at 10px on a real dealer site while the demo showed 16. Defaulting to 1em
    // makes the cards inherit the site's own body size, so they match the copy
    // around them; setting --cargo-font to a length pins them instead.
    const font = `  font-size: var(--cargo-font, 1em);`;

    const steps = BPS.filter((bp) => state.perView[bp] != null)
      .map((bp) => `@media (min-width: ${bp}px) {\n  ${sel} { --cs-per-view: ${state.perView[bp]}; }\n}`)
      .join('\n');

    // The preview is a fixed-width box inside a window that is usually much
    // wider, and a media query asks the WINDOW - so whatever the box was set
    // to, the ladder's top tier won. With the frame at 750, editing "992 and
    // up" changed nothing you could see. Pin the ladder resolved at the tier
    // the frame stands in for, after the media queries so it wins. Preview
    // only: the copied CSS ships the real ladder, which is what a page needs.
    const pin = preview ? `${sel} { --cs-per-view: ${perViewAt(frameTier())}; }` : '';

    const dots = state.hideDots ? `${sel} .cs-dots { display: none; }` : '';
    const arrows = [`${sel} .cs-arrow--prev { inset-inline-start: 0; }`, `${sel} .cs-arrow--next { inset-inline-end: 0; }`].join('\n');

    // Scope every selector, wherever it starts. Matching only at line start
    // silently left rules inside @media blocks unscoped, so they matched
    // nothing - the phone overrides were generated and did nothing at all.
    //
    // `%root%` means the carousel itself and `%wrap%` the outer element the
    // few structural patterns add (tabs, filter bar, lightbox, card grid);
    // anything else is a descendant of whichever of those is the real root.
    const root = hasWrap() ? `${sel}-wrap` : sel;
    const scope = (css) =>
      css.replace(/(^|[{}\n,]\s*)(%root%|%wrap%|\.cargo[\w-]*)/g, (_, pre, tok) => {
        if (tok === '%root%') return `${pre}${sel}`;
        if (tok === '%wrap%') return `${pre}${sel}-wrap`;
        return `${pre}${root} ${tok}`;
      });

    // The look's rules are skipped in library mode; a pattern's own CSS never
    // is, because structural patterns (tabs, filter bar, lightbox) are not card
    // looks and have no entry in the file.
    const body = [state.look ? scope(LOOKS[state.look].css) : '', p.css ? scope(p.css) : ''].filter(Boolean).join('\n');
    // Arrows either sit in a gutter beside the content or float over it. Last
    // in the sheet so it beats the padding-inline a card look sets for itself.
    // The fallback matters: --cs-arrow-size is defined on .cs, and the
    // tab strip sits OUTSIDE the carousel, so without one the calc() references
    // an undefined variable and the whole declaration is dropped.
    const gw = state.gutter ? 'calc(var(--cs-arrow-size, 44px) + 0.4em)' : '0';
    // Tabs and filter buttons sit outside the carousel, so they have to be told
    // about the gutter or they hang off the left edge of their own cards.
    const gutter = [`${sel} { padding-inline: ${gw}; }`, hasWrap() ? `${sel}-wrap .cargo-tabs, ${sel}-wrap .cargo-filterbar { padding-inline: ${gw}; }` : ''].filter(Boolean).join('\n');
    return [`${sel} {\n${decls}\n${font}\n}`, steps, pin, dots, arrows, body, gutter].filter(Boolean).join('\n\n');
  }

  function htmlFor(cls) {
    const p = PATTERNS[state.pattern];
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
    const carousel = (list, label, pad = '') =>
      [
        `${pad}<div class="${cls} cs" data-cs${attrs} aria-label="${label}">`,
        `${pad}  <${tag} class="cs-track">`,
        // Indent the card's own lines to match, so what you paste is not a
        // wall of markup starting at column zero inside a nested list item.
        ...list.map((h) => {
          const inner = h.includes('\n') ? ['', h.replace(/^/gm, `${pad}      `), `${pad}    `].join('\n') : h;
          return `${pad}    <${item} class="cs-slide">${inner}</${item}>`;
        }),
        `${pad}  </${tag}>`,
        `${pad}</div>`,
      ].join('\n');

    // Body-style tabs: one carousel per pane, each over its own subset.
    if (p.panes) {
      const ids = p.panes.map((name) => name.toLowerCase().replace(/\W+/g, '-'));
      const tabs = p.panes.map((name, i) => `    <button type="button" role="tab" id="tab-${ids[i]}" aria-controls="pane-${ids[i]}" aria-selected="${i === 0}">${name}</button>`).join('\n');
      // Each pane draws the requested number of cards from the roster at its
      // own offset, so "slides in this example" means slides PER PANE and no
      // pane comes out half empty. Models repeating across panes is faithful:
      // the real Chevrolet bar does it too.
      const stride = Math.max(1, Math.ceil(source.length / p.panes.length));
      const panes = p.panes
        .map((name, i) => {
          const sub = draw(take(state.count, i * stride));
          return `  <div class="cargo-pane" id="pane-${ids[i]}" role="tabpanel" aria-labelledby="tab-${ids[i]}"${i === 0 ? '' : ' hidden'}>\n${carousel(sub, name, '  ')}\n  </div>`;
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
      const m = p.models[0];
      return [
        `<div class="${cls}-wrap" data-lightbox>`,
        `  <button type="button" class="cargo-lb-open" data-lb-open>`,
        `    <img src="${m.img}" width="68" height="44" alt="" loading="lazy" decoding="async">`,
        `    <span>View all ${items.length} photos</span>`,
        `  </button>`,
        `  <dialog class="cargo-lb" aria-label="Vehicle photos">`,
        `    <div class="cargo-lb-head"><span>Vehicle photos</span><button type="button" class="cargo-lb-close" data-lb-close>Close</button></div>`,
        carousel(items, 'Vehicle photos', '    '),
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
  // An image with no platform equivalent - the Unsplash photography behind the
  // gallery, review and service patterns - becomes `#MISCPATH#<file>`, the house
  // convention for the dealer's own gallery upload. It does not resolve until
  // they upload one, which is the honest answer for a slot that is theirs to
  // fill, and it reads as "put your image here" rather than as a link that
  // looks like it might already work.
  //
  // Done as one pass over the finished markup on purpose: every producer -
  // look, pattern slides(), card grid, lightbox thumb - emits src="img/...",
  // so nothing can add a new image slot that this quietly misses.
  const toCms = (html) => html.replace(/src="img\/([^"]+)"/g, (_, rel) => `src="${globalThis.CARGO.CMS?.[rel] ?? `#MISCPATH#${rel.split('/').pop()}`}"`);

  /* ---- render ----------------------------------------------------------- */

  const $ = (id) => document.getElementById(id);
  const stage = $('wb-stage');
  const styleEl = $('wb-live-css');
  const codeEl = $('wb-code');
  const panel = $('wb-settings');
  let live = [];

  // The index page (patterns.html) loads this file for the generator alone: one
  // example of every pattern, built by the same cssFor/htmlFor pair the builder
  // uses, so an example there cannot drift from the same example here.
  globalThis.CARGO = Object.assign(globalThis.CARGO || {}, {
    PATTERNS,
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
      // Named for the look it is showing, not the pattern it borrows to show it.
      state.label = `${look.label} cards`;
      return { css: cssFor(`.${cls}`), html: htmlFor(cls) };
    },
  });

  // Nothing below this line has a DOM to attach to on that page.
  if (!stage) return;

  function render() {
    live.forEach((s) => s.destroy());
    live = [];
    styleEl.textContent = cssFor('.wb-live', true);
    stage.innerHTML = htmlFor('wb-live');
    live = globalThis.CustomSlider.autoInit(stage);
    wireVideo();

    // A few patterns need page script - tabs, the gallery filter, the lightbox.
    // The SAME string runs here and is printed in the code panel, so what you
    // copy is what you just watched work.
    const p = PATTERNS[state.pattern];
    if (p.script) {
      try {
        new Function(p.script).call(stage);
      } catch (e) {
        console.error(`${state.pattern}: page script failed`, e);
      }
    }
    checkFit();

    $('wb-title').textContent = p.label;
    $('wb-blurb').textContent = p.blurb;
    // Same generator, different selector - that is the parity guarantee.
    // Kept as text as well as highlighted markup: the clipboard gets the text,
    // never the spans.
    const script = p.script ? `\n\n<script>\n${p.script}\n</script>` : '';
    const css = cssFor('.my-slider');
    const html = toCms(htmlFor('my-slider'));
    state.codeText = `<style>\n${css}\n</style>\n\n${html}${script}`;

    // Say what is in the box and where each part goes, counted off the snippet
    // itself so it can never name a part that is not there. This replaced a
    // "use the card-looks file" checkbox that was greyed out on 13 of the 17
    // patterns and, where it did work, still left 13-21 lines of CSS behind -
    // a control for something that was never the designer's decision to make.
    const lines = (t) => t.trim().split('\n').length;
    const parts = [
      ['HTML', lines(html), 'a <strong>Custom HTML</strong> block'],
      ['CSS', lines(css), '<strong>Style Only &rarr; Head Section</strong>'],
    ];
    if (p.script) parts.push(['JavaScript', lines(p.script), '<strong>Body Section, Bottom</strong>']);
    // The demo images resolve to real platform paths, which is what makes them
    // usable - and exactly why this warning belongs here. They are Chevrolet
    // stock art, so on any other brand's site they load perfectly and show the
    // wrong cars: worse than a broken image, because nothing looks wrong.
    const warn = /<img/.test(state.codeText) ? '<li class="ui-parts-warn"><b>Photos</b> <span>examples</span>the addresses point at Chevrolet stock art — put your own in step 1 above</li>' : '';
    $('wb-parts').innerHTML = parts.map(([what, n, where]) => `<li><b>${what}</b> <span>${n} line${n === 1 ? '' : 's'}</span>goes into ${where}</li>`).join('') + warn;
    codeEl.innerHTML = globalThis.CARGO.hl.snippet(state.codeText);
  }

  // Posters open a native dialog. Kept here rather than in the snippet because
  // it is three lines and the snippet says so.
  function wireVideo() {
    const dlg = $('wb-dialog');
    for (const b of stage.querySelectorAll('[data-video]')) {
      b.addEventListener('click', () => {
        $('wb-dialog-title').textContent = b.dataset.video;
        dlg.showModal();
      });
    }
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
    const root = stage.querySelector('.cs');
    const slide = stage.querySelector('.cs-slide');
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
      $('spec-gauge').style.inlineSize = '0%';
      return;
    }

    const cs = getComputedStyle(root);
    const min = minCard();
    const stops = root._cs ? root._cs._stops().length : 1;
    const fits = root.hasAttribute('data-cs-fits');
    const n = stage.querySelectorAll('.cs').length;

    set('spec-card', `${w}px in ${Math.round(stage.getBoundingClientRect().width)}px`);
    set('spec-across', `${cs.getPropertyValue('--cs-per-view').trim()} of ${stage.querySelectorAll('.cs-slide').length}${n > 1 ? ` · ${n} sliders` : ''}`);
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
    const frame = Math.round(stage.getBoundingClientRect().width);
    const capped = frame < tier - 2;
    const would = capped ? Math.round((w * tier) / frame) : w;

    // Full bar at twice the minimum; amber inside the last 15% before it.
    const head = would / min;
    $('spec-gauge').style.inlineSize = `${Math.max(4, Math.min(100, (head / 2) * 100))}%`;
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
    '--price-color': 'Price colour',
    '--cta-bg': 'Button background',
    '--cta-fg': 'Button text',
    '--pill-bg': 'Pill background',
    '--pill-fg': 'Pill text',
    '--mark-size': 'Wordmark size',
  };
  const knobLabel = (k) => KNOB_LABELS[k] ?? k.replace(/^--/, '').replace(/-/g, ' ');

  const control = (label, node) => {
    const row = document.createElement('label');
    row.className = 'wb-row';
    const span = document.createElement('span');
    span.textContent = label;
    row.append(span, node);
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
  function valueRow(label, key, store, after) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = store[key] ?? '';
    const push = (v) => {
      store[key] = v;
      render();
      after?.();
    };
    input.addEventListener('input', () => push(input.value));
    stepper(input, push);
    return control(label, input);
  }

  const section = (heading, body) => {
    const s = document.createElement('section');
    const h = document.createElement('h3');
    h.textContent = heading;
    s.append(h, body);
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
    // The wrapping <label> binds to the swatch, not to this field - and the
    // swatch is hidden whenever the value is not a plain hex.
    text.setAttribute('aria-label', `${label} value`);
    const push = (v) => {
      store[key] = v;
      render();
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
    return control(label, wrap);
  }

  function buildPanel() {
    panel.replaceChildren();
    const p = PATTERNS[state.pattern];

    const grid = document.createElement('div');
    for (const key of ['base', ...BPS]) {
      if (state.perView[key] == null) continue;
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '1';
      input.max = '8';
      input.value = state.perView[key];
      input.addEventListener('input', () => {
        const n = parseInt(input.value, 10);
        if (n >= 1 && n <= 8) {
          state.perView[key] = n;
          render();
        }
      });
      grid.append(control(key === 'base' ? 'phone' : `${key}px and up`, input));
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
        const counts = ['base', 768, 992, 1200].map((k) => state.perView[k]).join(' / ');
        note.textContent = b.ladder
          ? `${counts} across (phone / 768 / 992 / 1200). ${b.note ?? ''}`.trim()
          : `The census recorded no breakpoint ladder for ${b.label}, so this starts from the card style's own defaults. ${b.note ?? ''}`.trim();
      };
      sel.addEventListener('change', () => {
        state.brand = sel.value || null;
        // A preset brings its own vehicles, so it replaces the roster outright.
        // Keeping edited rows here would show Ford copy under a Kia preset.
        state.content = null;
        clearContent();
        const b = BRANDS[state.brand];
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
        b.addEventListener('click', () => {
          state.brand = null;
          applyLook(id);
          // Each look brings the ladder that suits it: a split card at five
          // across is unreadable, a cutout at one across is a waste.
          state.perView = { ...LOOKS[id].perView };
          buildPanel();
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
    if (state.props['--cs-peek'] != null) colors.append(valueRow('Peek', '--cs-peek', state.props));
    state.props['--cs-gap'] ??= '1em';
    colors.append(valueRow('Gap', '--cs-gap', state.props));
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
    }
    panel.append(section('Arrows and spacing', colors));

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
    beh.append(control('Arrows move', step));

    // data-cs-rewind has been in the engine and the reference all along; it was
    // just unreachable from here, so the only way to stop at the ends was to
    // know the attribute and hand-edit the snippet.
    const ends = document.createElement('select');
    for (const [v, label] of [
      ['', 'Wrap around'],
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
    beh.append(control(autoplaying ? 'At the ends (autoplay always wraps)' : 'At the ends', ends));

    const dots = document.createElement('input');
    dots.type = 'checkbox';
    dots.checked = !state.hideDots;
    dots.addEventListener('change', () => {
      state.hideDots = !dots.checked;
      // A dots-off pattern collapses the reserved strip to nothing (the model
      // bar ships 0.1px) because nothing is drawn there. Turning the dots back
      // on without restoring that strip drops them straight onto the last line
      // of card text - measured at 4px of overlap on the model bar. Give the
      // room back with the dots, and take it away again with them, so the
      // toggle is symmetrical and the pattern's own value is never lost.
      const shipped = PATTERNS[state.pattern].props?.['--cs-controls-space'];
      if (!state.hideDots) {
        if (state.props['--cs-controls-space'] === shipped) state.props['--cs-controls-space'] = '2.5em';
      } else if (shipped != null) state.props['--cs-controls-space'] = shipped;
      buildPanel(); // the space knob appears and disappears with the dots
      render();
    });
    beh.append(control('Show dots', dots));

    const gut = document.createElement('input');
    gut.type = 'checkbox';
    gut.checked = state.gutter;
    gut.addEventListener('change', () => {
      state.gutter = gut.checked;
      render();
    });
    beh.append(control('Arrows beside, not over', gut));

    const count = document.createElement('input');
    count.type = 'number';
    count.min = '1';
    count.max = '16';
    count.value = state.count;
    count.addEventListener('input', () => {
      const n = parseInt(count.value, 10);
      if (n >= 1 && n <= 16) {
        state.count = n;
        render();
      }
    });
    // Once the slides are the designer's own content, the roster length IS the
    // slide count - adding a card means writing one, not turning a dial. Two
    // controls for one number is how they drift apart.
    if (!state.content) beh.append(control('Slides in this example', count));
    panel.append(section('Behaviour', beh));
  }

  /* ---- slide content ----------------------------------------------------- */

  // Which model keys a designer can edit, in the order they read on a card, and
  // the control each one wants. A pattern shows only the fields its own content
  // actually carries, so a review card never asks for an image URL and a photo
  // never asks for a star rating.
  const FIELDS = {
    img: { label: 'Image URL', type: 'url', hint: '#MISCPATH#your-photo.jpg' },
    alt: { label: 'Alt text', type: 'text', hint: 'What the photo shows — leave empty only if the card text already says it' },
    w: { label: 'Source width', type: 'number', hint: 'Real pixel width of the file' },
    h: { label: 'Source height', type: 'number', hint: 'Real pixel height of the file' },
    name: { label: 'Heading', type: 'text' },
    mark: { label: 'Wordmark', type: 'text' },
    sub: { label: 'Sub text', type: 'text' },
    blurb: { label: 'Paragraph', type: 'textarea' },
    quote: { label: 'Quote', type: 'textarea' },
    when: { label: 'When', type: 'text' },
    stars: { label: 'Stars out of 5', type: 'number' },
    bg: { label: 'Avatar colour', type: 'text' },
    tag: { label: 'Category', type: 'text', hint: 'Must match one of the filter buttons' },
    href: { label: 'Link', type: 'url', hint: '/searchnew.aspx?Model=Tahoe' },
    video: { label: 'Opens a video', type: 'checkbox' },
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
  const OWN_ROWS = 'These are your slides. The preview above and the code below are built from them — “Use the example content” puts the demo cars back.';
  const EXAMPLE_ROWS = 'The example content, ready to edit. Change any field and it becomes yours; nothing here is saved to a server.';

  // Typing eight cards of copy and losing it to a stray refresh is the fastest
  // way to make a tool feel disposable. Keyed by pattern: the fields differ per
  // pattern, and restoring one pattern's rows into another would put a star
  // rating on a photo.
  const CKEY = 'cs-content';
  const saveContent = () => {
    try {
      localStorage.setItem(CKEY, JSON.stringify({ pattern: state.pattern, rows: state.content }));
    } catch {
      /* private mode — the editor still works, it just will not survive a reload */
    }
  };
  const clearContent = () => {
    try {
      localStorage.removeItem(CKEY);
    } catch {
      /* as above */
    }
  };
  function restoreContent() {
    try {
      const v = JSON.parse(localStorage.getItem(CKEY) || 'null');
      if (v?.pattern === state.pattern && Array.isArray(v.rows) && v.rows.length) {
        state.content = v.rows;
        state.count = v.rows.length;
      }
    } catch {
      /* a corrupt entry must not take the page down with it */
    }
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
    // Only the fields this pattern's own content uses.
    const keys = Object.keys(FIELDS).filter((k) => rows.some((m) => m[k] !== undefined));

    const note = document.createElement('p');
    note.className = 'wb-note';
    note.textContent = state.content ? OWN_ROWS : EXAMPLE_ROWS;
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
        const r = adoptContent();
        r.splice(i, 1);
        state.count = r.length;
        saveContent();
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
        // Two rows cut a quote off mid-sentence and made the drag handle look
        // like the only way to read your own copy.
        if (f.type === 'textarea') input.rows = 4;
        // `input` covers the checkbox too — it fires on state change, so a
        // second `change` listener here would only double the work.
        input.addEventListener('input', () => {
          // Catch the moment the example content becomes the designer's own:
          // the panel's slide-count dial has to go, or it and the row list are
          // two controls fighting over one number.
          const adopting = !state.content;
          const r = adoptContent();
          r[i][k] = f.type === 'checkbox' ? input.checked : f.type === 'number' ? Number(input.value) : esc(input.value);
          saveContent();
          if (adopting) {
            buildPanel(); // the panel, never this editor — see below
            contentBox.querySelector('.wb-note').textContent = OWN_ROWS;
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
    buildPanel();
    buildContent();
    render();
  });
  contentReset?.addEventListener('click', () => {
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

  const setFrame = (b) => {
    for (const x of widthBtns()) x.setAttribute('aria-pressed', String(x === b));
    const w = +b.dataset.w;
    stage.style.setProperty('--frame', w === 0 ? '100%' : `${w}px`);
    const moved = w !== frameW;
    frameW = w;
    // The preview's per-view is resolved for this frame now, so changing the
    // frame has to regenerate the CSS rather than only resize the box.
    if (moved) render();
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
    // Collapsing the rail hands its width to the preview, so a button is only
    // out of reach when it will not fit even then. Offering it and collapsing
    // on click beats greying out the one width most desktop traffic actually
    // gets, which is what a 1440px laptop used to see.
    const reach = avail + railGain();
    const SCREEN = { 330: 'under 768px', 750: '768px and up', 970: '992px and up', 1170: '1200px and up' };
    let active = null;
    for (const b of widthBtns()) {
      const w = +b.dataset.w;
      b.disabled = w > reach + 1;
      b.title = b.disabled
        ? `Make the window about ${Math.round(w + (innerWidth - reach))}px wide to use this`
        : w
          ? `${SCREEN[w]} screen — the slider gets ${w}px${w > avail + 1 ? ' · hides the settings to fit' : ''}`
          : 'Use the whole column';
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
      if (widest) setFrame(widest);
    }
  }

  /* ---- the collapsible rail --------------------------------------------- */

  // A 312px rail at every window size put the 1170px desktop container out of
  // reach on a 1440px laptop - the width most people here are working at, and
  // the container most dealer desktop traffic gets. Collapsing gives that 312px
  // to the preview.
  const collapse = $('ui-collapse');
  const setRail = (open, remember = true) => {
    collapse.setAttribute('aria-expanded', String(open));
    collapse.querySelector('span').textContent = open ? 'Hide settings' : 'Show settings';
    collapse.title = open ? 'Hide the settings and give the width to the preview' : 'Show the settings again';
    if (remember) {
      try {
        localStorage.setItem('cs-rail', open ? 'open' : 'shut');
      } catch {
        /* private mode: the rail just opens again next visit */
      }
    }
    // The available width changed, so which width buttons fit changed with it.
    requestAnimationFrame(() => {
      fitWidths();
      checkFit();
    });
  };
  const railOpen = () => collapse.getAttribute('aria-expanded') === 'true';
  collapse.addEventListener('click', () => setRail(!railOpen()));
  try {
    if (localStorage.getItem('cs-rail') === 'shut') setRail(false, false);
  } catch {
    /* private mode: leave it open */
  }

  for (const b of widthBtns())
    b.addEventListener('click', () => {
      setFrame(b);
      // Asking for a width the open rail cannot give used to do nothing at all,
      // because fitWidths had already disabled that button. Collapsing on
      // demand is the difference between "that one is greyed out" and seeing it.
      if (railOpen() && +b.dataset.w > stage.parentElement.clientWidth - 60) setRail(false);
    });

  // How much collapsing hands back. The rail is measured live so this stays
  // true if --rail changes; 42 is the 2.6rem strip the collapsed rail keeps
  // (.ui-shell:has(...) in ui.css).
  const RAIL_SHUT = 42;
  const railGain = () => (railOpen() ? Math.max(0, $('ui-rail').getBoundingClientRect().width - RAIL_SHUT) : 0);

  /* ---- pattern picker ---------------------------------------------------- */

  const nav = $('wb-nav');
  for (const [id, p] of Object.entries(PATTERNS)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `<span class="wb-glyph wb-glyph--${id}"></span><span>${p.label}</span>`;
    b.dataset.go = id;
    b.addEventListener('click', () => {
      loadPattern(id);
      restoreContent();
      buildPanel();
      buildContent();
      render();
      for (const x of nav.querySelectorAll('button')) x.setAttribute('aria-current', String(x.dataset.go === id));
      history.replaceState(null, '', '#' + id);
    });
    nav.append(b);
  }

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

  $('wb-copy').addEventListener('click', (e) => copyText(e.target, state.codeText));

  // Built here rather than read out of the DOM: the markup on disk may carry
  // CRLF, and a stray carriage return inside a pasted tag is a nasty thing to
  // have to debug on someone else's site.
  const TAGS = ['<link rel="stylesheet" href="/path/custom-slider.css">', '<link rel="stylesheet" href="/path/custom-slider-cards.css">', '<script src="/path/custom-slider.js" defer></script>'].join(
    '\n',
  );
  $('wb-copy-tags').addEventListener('click', (e) => copyText(e.target, TAGS));

  // The engine files, fetched at click time from the very files this page is
  // running - so what lands on the clipboard can never be a stale copy.
  const ENGINE = { css: '../dist/custom-slider.css', js: '../dist/custom-slider.js', cards: '../dist/custom-slider-cards.css' };
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
      a.download = kind === 'cards' ? 'custom-slider-cards.css' : `custom-slider.${kind}`;
      a.click();
      URL.revokeObjectURL(a.href);
      flash(btn, 'Downloaded');
    });
  }

  // This script is inline-loaded before the deferred engine, so wait for it.
  const boot = () => {
    const id = location.hash.slice(1);
    loadPattern(PATTERNS[id] ? id : 'modelbar');
    restoreContent();
    for (const x of nav.querySelectorAll('button')) x.setAttribute('aria-current', String(x.dataset.go === state.pattern));
    buildPanel();
    buildContent();
    render();
    addEventListener('resize', () => {
      fitWidths();
      checkFit();
    });
    fitWidths();
  };
  if (globalThis.CustomSlider) boot();
  else addEventListener('DOMContentLoaded', boot);
})();
