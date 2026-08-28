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
  const { LOOKS, BRANDS, perViewFor } = globalThis.DLX;

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
    ['vehicle-2.jpg', 'Financing', 'Flexible terms, first-time buyer programs, and pre-approval in minutes without a hit to your credit score.'],
    ['vehicle-4.jpg', 'Trade-In Appraisal', 'Get a real number for your current vehicle in minutes — good for seven days or 500 miles.'],
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
      data: { 'data-step': 'slide' },
      props: { '--dlc-gap': '0.5rem', '--dlc-controls-space': '0.1px', '--dlc-arrow-bg': 'transparent', '--dlc-arrow-fg': '#262626' },
      hideDots: true,
    },
    cards: {
      label: 'Vehicle cards',
      blurb: 'Photo, title, price and a link. The whole card is clickable through one stretched link, so there is no nested-link or duplicate-announcement problem.',
      look: 'vcard',
      models: VEHICLES,
      data: {},
      props: { '--dlc-gap': '1rem', '--dlc-arrow-bg': 'transparent', '--dlc-arrow-fg': '#262626' },
    },
    hero: {
      gutter: false,
      label: 'Hero banner',
      blurb: 'Full width, one at a time, crossfading on a timer. Autoplay adds the pause button and never starts under reduced motion.',
      data: { 'data-fade': '', 'data-autoplay': '5000' },
      props: { '--dlc-gap': '0px', '--dlc-controls-space': '2rem', '--dlc-dot-current': '#16324f' },
      perView: { base: 1, 768: 1, 992: 1, 1200: 1 },
      minCard: 240,
      models: PHOTOS.slice(0, 3),
      css: `.dlx-photo { display: block; }
.dlx-photo img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 21 / 9; object-fit: cover; border-radius: 8px; }
@media (max-width: 600px) { .dlx-photo img { aspect-ratio: 4 / 3; } }`,
      slides: (models) => models.map((m) => `<span class="dlx-photo">${pic(m)}</span>`),
    },
    gallery: {
      gutter: false,
      label: 'Photo gallery',
      blurb: 'Thumbnails generated from the slide images and wired as a real tab list with arrow keys. Thumbs are fresh elements, so site ids and srcset never leak into them.',
      data: { 'data-gallery': '' },
      props: { '--dlc-gap': '0px', '--dlc-arrow-bg': 'transparent', '--dlc-arrow-fg': '#262626' },
      perView: { base: 1, 768: 1, 992: 1, 1200: 1 },
      minCard: 240,
      track: 'div',
      models: PHOTOS,
      css: `.dlx-photo { display: block; }
.dlx-photo img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 8px; }`,
      slides: (models) => models.map((m) => `<span class="dlx-photo">${pic(m)}</span>`),
    },
    grid: {
      label: 'Two-row grid',
      blurb: 'Twice as many fit before you scroll. Each slide is a COLUMN holding two cards, so one slide is still one scroll stop — the model the engine is built on.',
      look: 'tile',
      models: cutouts,
      data: {},
      props: { '--dlc-gap': '1rem', '--dlc-controls-space': '2rem', '--dlc-arrow-bg': 'transparent', '--dlc-arrow-fg': '#262626' },
      perView: { base: 1, 768: 2, 992: 3, 1200: 3 },
      pairUp: true,
      css: `.dlx-col { display: grid; grid-template-rows: repeat(2, auto); gap: var(--dlc-gap); }
@media (max-width: 600px) { .dlx { padding-inline: calc(var(--dlc-arrow-size) + 0.3rem); } }`,
    },
    peek: {
      gutter: false,
      label: 'Peek at the next slide',
      blurb: 'A sliver of the neighbours stays visible so it always reads as "there is more this way". One property — --dlc-peek. Zero turns it off.',
      data: {},
      props: { '--dlc-gap': '1rem', '--dlc-peek': '3rem', '--dlc-arrow-bg': 'rgb(0 0 0 / 55%)', '--dlc-arrow-fg': '#ffffff' },
      perView: { base: 1, 768: 1, 992: 2, 1200: 2 },
      minCard: 240,
      models: PHOTOS,
      css: `.dlx-photo { display: block; }
.dlx-photo img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 8px; }
@media (max-width: 600px) { .dlx { --dlc-peek: 1.5rem; } }`,
      slides: (models) => models.map((m) => `<span class="dlx-photo">${pic(m)}</span>`),
    },
    video: {
      gutter: false,
      label: 'Video testimonials',
      blurb: 'Posters open a native dialog, which gives Esc-to-close and focus trapping for free. Video never plays inline — autoplay on video cards fights the content.',
      data: {},
      props: { '--dlc-gap': '1rem', '--dlc-arrow-bg': 'rgb(0 0 0 / 55%)', '--dlc-arrow-fg': '#ffffff' },
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
      css: `.dlx-video { position: relative; display: block; inline-size: 100%; padding: 0; overflow: hidden; font: inherit; color: inherit; text-align: start; cursor: pointer; background: none; border: 0; border-radius: 8px; }
.dlx-video img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 16 / 10; object-fit: cover; }
.dlx-play { position: absolute; inset-block-start: 42%; inset-inline-start: 50%; display: grid; place-items: center; inline-size: 56px; block-size: 56px; color: #16324f; background: rgb(255 255 255 / 92%); border-radius: 50%; transform: translate(-50%, -50%); }
.dlx-name { display: block; margin: 0.6rem 0 0; font-size: 1rem; font-weight: 700; line-height: 1.3; }`,
      slides: (models) =>
        models.map(
          (m) => `<button type="button" class="dlx-video" data-video="${m.name}">${pic(m)}<span class="dlx-play" aria-hidden="true">&#9654;</span><span class="dlx-name">${m.name}</span></button>`,
        ),
    },

    tabs: {
      label: 'Model bar with tabs',
      blurb:
        'The same strip under body-style tabs. Each pane holds its own slider, and a pane revealed later measures itself correctly — so none of slick’s hidden-pane refresh hacks are needed. This is how Chevrolet has shipped its bar since Nov 2025.',
      look: 'tile',
      models: cutouts,
      data: { 'data-step': 'slide' },
      props: { '--dlc-gap': '0.5rem', '--dlc-controls-space': '0.1px', '--dlc-arrow-bg': 'transparent', '--dlc-arrow-fg': '#262626' },
      hideDots: true,
      panes: ['Trucks', 'SUVs', 'Crossovers'],
      css: `.dlx-tabs { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-block-end: 1rem; border-block-end: 1px solid #e2e5ea; }
.dlx-tabs [role="tab"] { padding: 0.6rem 1.1rem; font: inherit; font-weight: 600; color: inherit; cursor: pointer; background: none; border: 0; border-block-end: 2px solid transparent; opacity: 0.65; }
.dlx-tabs [role="tab"][aria-selected="true"] { opacity: 1; border-block-end-color: currentcolor; }
.dlx-pane[hidden] { display: none; }`,
      script: `document.querySelectorAll('[data-tabs]').forEach((wrap, w) => {
  const tabs = [...wrap.querySelectorAll('[role="tab"]')];
  const panes = [...wrap.querySelectorAll('[role="tabpanel"]')];
  // Re-id per widget, and find panes within this wrapper rather than by
  // getElementById. The markup ships fixed ids, so two of these on one page
  // would otherwise share them and each tab would drive the other's panes.
  tabs.forEach((t, i) => {
    const tid = 'dlx-tab-' + w + '-' + i;
    const pid = 'dlx-pane-' + w + '-' + i;
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
      data: { 'data-rewind': 'false', 'data-bar': '' },
      props: { '--dlc-gap': '1rem', '--dlc-arrow-bg': 'rgb(0 0 0 / 55%)', '--dlc-arrow-fg': '#ffffff' },
      perView: { base: 1, 768: 2, 992: 4, 1200: 4 },
      minCard: 190,
      models: MODELS,
      css: `.dlx { --dlc-dot-fg: #949494; --dlc-dot-current: #949494; --dlc-controls-space: 3rem; }
@media (min-width: 992px) { .dlx { --dlc-arrow-size: 56px; } }

/* The dots become one solid bar. Every segment is still a real, labelled
   button; the marker is a ::before whose translate follows --bar-index and
   --bar-count, set by the script below. #949494 is 3.03:1 on white, because
   the segments ARE the control and their extent has to meet WCAG 1.4.11. */
.dlx .dl-carousel-dots { gap: 0; inset-inline: 25%; }
.dlx .dl-carousel-dots::before { content: ""; position: absolute; inset-block-start: calc(50% - 2px); inset-inline-start: 0; inline-size: calc(100% / var(--bar-count, 1)); block-size: 4px; background: #262626; border-radius: 2px; translate: calc(var(--bar-index, 0) * 100%); pointer-events: none; }
@media (prefers-reduced-motion: no-preference) { .dlx .dl-carousel-dots::before { transition: translate 0.35s ease; } }
.dlx .dl-carousel-dot { flex: 1 1 auto; }
.dlx .dl-carousel-dot::after { inline-size: 100%; block-size: 4px; border-radius: 0; }
.dlx .dl-carousel-dot:first-child::after { border-start-start-radius: 2px; border-end-start-radius: 2px; }
.dlx .dl-carousel-dot:last-child::after { border-start-end-radius: 2px; border-end-end-radius: 2px; }

.dlx-model { position: relative; display: block; overflow: hidden; color: #fff; text-decoration: none; border-radius: 10px; }
.dlx-model img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 3 / 5; object-fit: cover; transition: transform 0.35s ease; }
.dlx-model:hover img { transform: scale(1.05); }
.dlx-model h4 { position: absolute; inset-inline: 0; inset-block-end: 0; padding: 2.5rem 1rem 1rem; margin: 0; font-size: 1.15rem; line-height: 1.3; background: linear-gradient(transparent, rgb(0 0 0 / 78%)); }`,
      slides: (models) =>
        models.map((m) => `<a class="dlx-model" href="${m.href}"><img src="${m.img}" width="${m.w ?? 600}" height="${m.h ?? 1000}" alt="" loading="lazy" decoding="async"><h4>${m.name}</h4></a>`),
      // Site-level enhancement, not an engine feature: it reads the engine's
      // own current-dot class and writes two custom properties. Nothing in the
      // engine knows the bar exists.
      script: `document.querySelectorAll('[data-bar] .dl-carousel-dots').forEach((bar) => {
  const sync = () => {
    const dots = [...bar.children];
    bar.style.setProperty('--bar-count', dots.length || 1);
    bar.style.setProperty('--bar-index', Math.max(0, dots.findIndex((d) => d.classList.contains('dl-carousel-dot--current'))));
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
      props: { '--dlc-gap': '1rem', '--dlc-arrow-bg': 'rgb(0 0 0 / 55%)', '--dlc-arrow-fg': '#ffffff' },
      perView: { base: 1, 768: 2, 992: 3, 1200: 3 },
      minCard: 230,
      models: MIXED,
      css: `.dlx { padding-inline: calc(var(--dlc-arrow-size) + 0.4rem); }
@media (max-width: 600px) { .dlx { --dlc-arrow-size: 36px; } }
.dlx-mix { display: flex; flex-direction: column; block-size: 100%; overflow: hidden; background: #fff; border: 1px solid #e2e5ea; border-radius: 10px; }
.dlx-mix img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 4 / 3; object-fit: cover; }
.dlx-mix h4 { margin: 0.8rem 0.9rem 0.2rem; font-size: 0.95rem; line-height: 1.3; }
.dlx-mix p { margin: 0 0.9rem 0.9rem; font-size: 0.85rem; line-height: 1.45; opacity: 0.75; }`,
      slides: (models) =>
        models.map((m) => `<article class="dlx-mix"><img src="${m.img}" width="${m.w}" height="${m.h}" alt="${m.alt}" loading="lazy" decoding="async"><h4>${m.name}</h4><p>${m.blurb}</p></article>`),
    },

    service: {
      gutter: true,
      label: 'Service cards',
      blurb: 'Photo, heading, a paragraph and a read-more affordance. One card per arrow click, because the copy is long enough that a full-page jump loses your place.',
      data: { 'data-step': 'slide' },
      props: { '--dlc-gap': '1rem', '--dlc-arrow-bg': 'rgb(0 0 0 / 55%)', '--dlc-arrow-fg': '#ffffff' },
      perView: { base: 1, 768: 2, 992: 3, 1200: 3 },
      minCard: 250,
      models: SERVICES,
      css: `.dlx { padding-inline: calc(var(--dlc-arrow-size) + 0.4rem); }
@media (max-width: 600px) { .dlx { --dlc-arrow-size: 36px; } }
.dlx-svc { display: flex; flex-direction: column; block-size: 100%; overflow: hidden; color: inherit; text-decoration: none; background: #fff; border: 1px solid #e2e5ea; border-radius: 10px; }
.dlx-svc img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 16 / 9; object-fit: cover; transition: transform 0.35s ease; }
.dlx-svc:hover img { transform: scale(1.05); }
.dlx-svc h4 { margin: 1rem 1.1rem 0.35rem; font-size: 1.1rem; line-height: 1.3; }
.dlx-svc p { margin: 0 1.1rem; font-size: 0.9rem; line-height: 1.5; opacity: 0.75; }
.dlx-svc-more { display: block; margin: 0.9rem 1.1rem 1.1rem; font-size: 0.85rem; font-weight: 700; line-height: 1.35; }`,
      slides: (models) =>
        models.map(
          (m) =>
            `<a class="dlx-svc" href="${m.href}"><img src="${m.img}" width="1200" height="750" alt="" loading="lazy" decoding="async"><h4>${m.name}</h4><p>${m.blurb}</p><span class="dlx-svc-more" aria-hidden="true">Read more →</span></a>`,
        ),
    },

    reviews: {
      gutter: true,
      label: 'Customer reviews',
      blurb: 'Quotes in a real figure/blockquote, with the star rating exposed as an image plus a text label rather than bare glyphs a screen reader would spell out one at a time.',
      props: { '--dlc-gap': '1rem', '--dlc-arrow-bg': 'transparent', '--dlc-arrow-fg': '#262626' },
      perView: { base: 1, 768: 2, 992: 3, 1200: 3 },
      minCard: 250,
      models: REVIEWS,
      css: `.dlx { padding-inline: calc(var(--dlc-arrow-size) + 0.4rem); }
@media (max-width: 600px) { .dlx { --dlc-arrow-size: 36px; } }
.dlx-review { block-size: 100%; padding: 1.25rem; margin: 0; line-height: 1.5; background: #fff; border: 1px solid #e2e5ea; border-radius: 10px; }
.dlx-review figcaption { display: flex; gap: 0.7rem; align-items: center; line-height: 1.35; }
.dlx-avatar { display: grid; flex: none; place-items: center; inline-size: 40px; block-size: 40px; font-weight: 700; line-height: 1; color: #fff; background: var(--avatar-bg); border-radius: 50%; }
.dlx-byline { display: flex; flex-direction: column; font-size: 0.95rem; line-height: 1.35; }
.dlx-byline small { font-size: 0.8rem; opacity: 0.7; }
.dlx-stars { margin: 0.7rem 0 0.4rem; font-size: 1rem; line-height: 1; color: #e0a012; letter-spacing: 0.1em; }
.dlx-review blockquote { margin: 0; }
.dlx-review blockquote p { margin: 0; font-size: 0.95rem; line-height: 1.55; }`,
      slides: (models) =>
        models.map(
          (m) => `<figure class="dlx-review">
  <figcaption>
    <span class="dlx-avatar" aria-hidden="true" style="--avatar-bg: ${m.bg}">${m.name[0]}</span>
    <span class="dlx-byline"><strong>${m.name}</strong><small>${m.when}</small></span>
  </figcaption>
  <p class="dlx-stars" role="img" aria-label="Rated ${m.stars} out of 5">${'★'.repeat(m.stars)}${'☆'.repeat(5 - m.stars)}</p>
  <blockquote><p>${m.quote}</p></blockquote>
</figure>`,
        ),
    },

    'gallery-filter': {
      gutter: false,
      label: 'Filterable gallery',
      blurb:
        'A gallery whose slides carry a category. Filtering rebuilds the slider over the matching slides rather than hiding the rest — hiding leaves them in the thumb strip and in the announced "3 of 6".',
      data: { 'data-gallery': '' },
      props: { '--dlc-gap': '0px', '--dlc-arrow-bg': 'rgb(0 0 0 / 55%)', '--dlc-arrow-fg': '#ffffff' },
      perView: { base: 1, 768: 1, 992: 1, 1200: 1 },
      minCard: 240,
      track: 'div',
      models: TAGGED,
      filters: ['', 'exterior', 'interior', 'service'],
      css: `.dlx-filterbar { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-block-end: 1rem; }
.dlx-filterbar button { padding: 0.4rem 0.9rem; font: inherit; font-size: 0.87rem; color: inherit; cursor: pointer; background: #fff; border: 1px solid #e2e5ea; border-radius: 999px; }
.dlx-filterbar button[aria-pressed="true"] { color: #fff; background: #16324f; border-color: #16324f; }
.dlx-photo { display: block; }
.dlx-photo img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 8px; }`,
      slides: (models) => models.map((m) => `<span class="dlx-photo" data-tag="${m.tag}">${pic(m)}</span>`),
      script: `document.querySelectorAll('[data-filter-gallery]').forEach((wrap) => {
  const root = wrap.querySelector('.dl-carousel');
  const all = [...root.querySelectorAll('.dl-carousel-slide')].map((s) => s.cloneNode(true));
  wrap.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.filter;
      wrap.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      if (root._dlCarousel) root._dlCarousel.destroy();
      // Re-query AFTER destroy(). destroy() puts the root's original markup
      // back, so any element captured before it is now detached and writing
      // to it changes nothing you can see.
      const track = root.querySelector('.dl-carousel-track');
      track.replaceChildren(...all.filter((s) => !tag || s.querySelector('[data-tag]').dataset.tag === tag).map((s) => s.cloneNode(true)));
      new DLCarousel(root);
    });
  });
});`,
    },

    'media-gallery': {
      gutter: false,
      label: 'Gallery with photos and video',
      blurb: 'A gallery where some slides are video posters. The poster is a real button that opens a dialog — video never plays inline, and the thumb strip treats it like any other slide.',
      data: { 'data-gallery': '' },
      props: { '--dlc-gap': '0px', '--dlc-arrow-bg': 'rgb(0 0 0 / 55%)', '--dlc-arrow-fg': '#ffffff' },
      perView: { base: 1, 768: 1, 992: 1, 1200: 1 },
      minCard: 240,
      track: 'div',
      models: PHOTOS.map((m, i) => ({ ...m, video: i === 2 || i === 4 })),
      css: `.dlx-photo { display: block; }
.dlx-photo img, .dlx-mv img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 8px; }
.dlx-mv { position: relative; display: block; inline-size: 100%; padding: 0; font: inherit; color: inherit; cursor: pointer; background: none; border: 0; }
.dlx-mv-play { position: absolute; inset-block-start: 50%; inset-inline-start: 50%; display: grid; place-items: center; inline-size: 64px; block-size: 64px; font-size: 1.3rem; color: #16324f; background: rgb(255 255 255 / 92%); border-radius: 50%; transform: translate(-50%, -50%); }`,
      slides: (models) =>
        models.map((m) =>
          m.video
            ? `<button type="button" class="dlx-mv" data-video="${m.alt}">${pic(m)}<span class="dlx-mv-play" aria-hidden="true">&#9654;</span></button>`
            : `<span class="dlx-photo">${pic(m)}</span>`,
        ),
    },

    lightbox: {
      gutter: false,
      label: 'Fullscreen gallery in a dialog',
      blurb:
        'A thumbnail that opens the full gallery in a native dialog. Built with data-init="manual" so it initialises only once the dialog is open — a slider measured while hidden has no width to measure.',
      data: { 'data-gallery': '', 'data-init': 'manual' },
      props: { '--dlc-gap': '0px', '--dlc-arrow-bg': 'rgb(0 0 0 / 55%)', '--dlc-arrow-fg': '#ffffff' },
      perView: { base: 1, 768: 1, 992: 1, 1200: 1 },
      minCard: 240,
      track: 'div',
      models: PHOTOS,
      css: `.dlx-lb-open { display: inline-flex; gap: 0.7rem; align-items: center; padding: 0.6rem 1rem; font: inherit; font-weight: 600; color: inherit; cursor: pointer; background: #fff; border: 1px solid #e2e5ea; border-radius: 10px; }
.dlx-lb-open img { inline-size: 68px; block-size: 44px; object-fit: cover; border-radius: 5px; }
.dlx-lb { inline-size: min(94vw, 1100px); padding: 0; background: #111; border: 0; border-radius: 12px; }
.dlx-lb::backdrop { background: rgb(0 0 0 / 80%); }
.dlx-lb-head { display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0.9rem; font-size: 0.9rem; color: #fff; }
.dlx-lb-close { padding: 0.35rem 0.85rem; font: inherit; color: #fff; cursor: pointer; background: rgb(255 255 255 / 15%); border: 0; border-radius: 6px; }
.dlx-photo { display: block; }
.dlx-photo img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 16 / 10; object-fit: contain; }`,
      slides: (models) => models.map((m) => `<span class="dlx-photo">${pic(m)}</span>`),
      script: `document.querySelectorAll('[data-lightbox]').forEach((wrap) => {
  const dlg = wrap.querySelector('dialog');
  const root = dlg.querySelector('.dl-carousel');
  wrap.querySelector('[data-lb-open]').addEventListener('click', () => {
    dlg.showModal();
    // Init AFTER the dialog is visible: a slider measured while display:none
    // has no width, so every slide would come out the same wrong size.
    if (!root._dlCarousel) new DLCarousel(root);
  });
  dlg.querySelector('[data-lb-close]').addEventListener('click', () => dlg.close());
});`,
    },

    'card-gallery': {
      gutter: false,
      label: 'Vehicle cards with a mini gallery',
      blurb:
        'The SRP pattern: a grid of cards, each holding its own small slider of that vehicle’s photos. Many instances on one page is fine — each is independent, and none of them is the page’s main carousel.',
      props: { '--dlc-gap': '0px', '--dlc-controls-space': '0.1px', '--dlc-arrow-size': '32px', '--dlc-arrow-bg': 'rgb(0 0 0 / 55%)', '--dlc-arrow-fg': '#ffffff' },
      perView: { base: 1, 768: 1, 992: 1, 1200: 1 },
      minCard: 200,
      models: VEHICLES,
      cardGrid: true,
      hideDots: true,
      css: `.dlx-wrap { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(250px, 100%), 1fr)); gap: 1rem; }
.dlx-cg-card { overflow: hidden; background: #fff; border: 1px solid #e2e5ea; border-radius: 10px; }
.dlx-cg-card img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 4 / 3; object-fit: cover; }
.dlx-cg-body { padding: 0.8rem 0.9rem 1rem; }
.dlx-cg-body h4 { margin: 0; font-size: 0.95rem; line-height: 1.35; }
.dlx-cg-body p { margin: 0.2rem 0 0; font-size: 0.85rem; line-height: 1.4; opacity: 0.8; }`,
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
        ['One knob per look', 'Every other example here is <code>--dlc-*</code> custom properties and plain site CSS.'],
        ['Works without JS', 'The track is a native scroll-snap container — turn JavaScript off and it still swipes.'],
        ['Start here', 'Copy the markup, add your <code>--dlc-per-view</code> breakpoints, then restyle.'],
      ].map(([name, blurb]) => ({ name, blurb })),
      css: `.dlx { padding-inline: calc(var(--dlc-arrow-size) + 0.4rem); }
@media (max-width: 600px) { .dlx { --dlc-arrow-size: 36px; } }
.dlx-stock { block-size: 100%; padding: 1.1rem; background: #f0f2f5; border-radius: 8px; }
.dlx-stock h4 { margin: 0 0 0.35rem; font-size: 1rem; line-height: 1.3; }
.dlx-stock p { margin: 0; font-size: 0.9rem; line-height: 1.5; opacity: 0.8; }
.dlx-stock code { font-size: 0.85em; }`,
      slides: (models) => models.map((m) => `<article class="dlx-stock"><h4>${m.name}</h4><p>${m.blurb}</p></article>`),
    },
  };

  /* ---- state ------------------------------------------------------------ */

  const state = { pattern: 'modelbar', brand: null, look: null, perView: null, props: null, lookProps: null, data: null, hideDots: false };

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
    // Beside the content wherever a card has text an arrow could land on.
    state.gutter = p.gutter ?? !!p.look;
    state.lookProps = p.look ? { ...LOOKS[p.look].settings } : {};
  }

  // A brand preset brings its own vehicles where the estate gave us the
  // cutouts. Seventeen of the 32 have none, and those keep the pattern's own
  // content rather than being shown someone else's cars under their name.
  const modelsFor = (p) => (state.brand && BRANDS[state.brand]?.models ? BRANDS[state.brand].models : p.models);

  const minCard = () => PATTERNS[state.pattern].minCard ?? (state.look ? LOOKS[state.look].minCard : 200);

  // --dlc-gap as a number. Values here are always rem or px.
  const gapPx = () => {
    const g = state.props['--dlc-gap'] ?? '1rem';
    return g.endsWith('rem') ? parseFloat(g) * 16 : parseFloat(g) || 0;
  };

  /* ---- the single source: settings -> CSS text -------------------------- */

  // `sel` is the only difference between what runs and what you copy.
  // The patterns that wrap the carousel in something: tabs, a filter bar, a
  // lightbox trigger, or a grid of cards each holding one.
  const hasWrap = () => {
    const p = PATTERNS[state.pattern];
    return !!(p.panes || p.filters || p.cardGrid || state.pattern === 'lightbox');
  };

  function cssFor(sel) {
    const p = PATTERNS[state.pattern];
    const base = { ...state.lookProps, ...state.props, '--dlc-per-view': state.perView.base };
    const decls = Object.entries(base)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');

    const steps = BPS.filter((bp) => state.perView[bp] != null)
      .map((bp) => `@media (min-width: ${bp}px) {\n  ${sel} { --dlc-per-view: ${state.perView[bp]}; }\n}`)
      .join('\n');

    const dots = state.hideDots ? `${sel} .dl-carousel-dots { display: none; }` : '';
    const arrows = [`${sel} .dl-carousel-arrow--prev { inset-inline-start: 0; }`, `${sel} .dl-carousel-arrow--next { inset-inline-end: 0; }`].join('\n');

    // Scope every selector, wherever it starts. Matching only at line start
    // silently left rules inside @media blocks unscoped, so they matched
    // nothing - the phone overrides were generated and did nothing at all.
    //
    // `.dlx` means the carousel itself and `.dlx-wrap` the outer element the
    // few structural patterns add (tabs, filter bar, lightbox, card grid);
    // anything else is a descendant of whichever of those is the real root.
    const root = hasWrap() ? `${sel}-wrap` : sel;
    const scope = (css) =>
      css.replace(/(^|[{}\n,]\s*)(\.dlx[\w-]*)/g, (_, pre, tok) => {
        if (tok === '.dlx') return `${pre}${sel}`;
        if (tok === '.dlx-wrap') return `${pre}${sel}-wrap`;
        return `${pre}${root} ${tok}`;
      });

    const body = [state.look ? scope(LOOKS[state.look].css) : '', p.css ? scope(p.css) : ''].filter(Boolean).join('\n');
    // Arrows either sit in a gutter beside the content or float over it. Last
    // in the sheet so it beats the padding-inline a card look sets for itself.
    // The fallback matters: --dlc-arrow-size is defined on .dl-carousel, and the
    // tab strip sits OUTSIDE the carousel, so without one the calc() references
    // an undefined variable and the whole declaration is dropped.
    const gw = state.gutter ? 'calc(var(--dlc-arrow-size, 44px) + 0.4rem)' : '0px';
    // Tabs and filter buttons sit outside the carousel, so they have to be told
    // about the gutter or they hang off the left edge of their own cards.
    const gutter = [`${sel} { padding-inline: ${gw}; }`, hasWrap() ? `${sel}-wrap .dlx-tabs, ${sel}-wrap .dlx-filterbar { padding-inline: ${gw}; }` : ''].filter(Boolean).join('\n');
    return [`${sel} {\n${decls}\n}`, steps, dots, arrows, body, gutter].filter(Boolean).join('\n\n');
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
      for (let i = 0; i < items.length; i += 2) cols.push(`<div class="dlx-col">${items.slice(i, i + 2).join('')}</div>`);
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
        `${pad}<div class="${cls} dl-carousel" data-slider${attrs} aria-label="${label}">`,
        `${pad}  <${tag} class="dl-carousel-track">`,
        // Indent the card's own lines to match, so what you paste is not a
        // wall of markup starting at column zero inside a nested list item.
        ...list.map((h) => {
          const inner = h.includes('\n') ? ['', h.replace(/^/gm, `${pad}      `), `${pad}    `].join('\n') : h;
          return `${pad}    <${item} class="dl-carousel-slide">${inner}</${item}>`;
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
          return `  <div class="dlx-pane" id="pane-${ids[i]}" role="tabpanel" aria-labelledby="tab-${ids[i]}"${i === 0 ? '' : ' hidden'}>\n${carousel(sub, name, '  ')}\n  </div>`;
        })
        .join('\n');
      return `<div class="${cls}-wrap" data-tabs>\n  <div class="dlx-tabs" role="tablist" aria-label="Body style">\n${tabs}\n  </div>\n${panes}\n</div>`;
    }

    // Filter buttons above a gallery; the script rebuilds it per category.
    if (p.filters) {
      const bar = p.filters
        .map((f) => `    <button type="button" data-filter="${f}" aria-pressed="${f === '' ? 'true' : 'false'}">${f === '' ? 'All' : f[0].toUpperCase() + f.slice(1)}</button>`)
        .join('\n');
      return `<div class="${cls}-wrap" data-filter-gallery>\n  <div class="dlx-filterbar" role="group" aria-label="Filter photos">\n${bar}\n  </div>\n${carousel(items, p.label, '  ')}\n</div>`;
    }

    // A thumbnail that opens the gallery in a dialog.
    if (state.pattern === 'lightbox') {
      const m = p.models[0];
      return [
        `<div class="${cls}-wrap" data-lightbox>`,
        `  <button type="button" class="dlx-lb-open" data-lb-open>`,
        `    <img src="${m.img}" width="68" height="44" alt="" loading="lazy" decoding="async">`,
        `    <span>View all ${items.length} photos</span>`,
        `  </button>`,
        `  <dialog class="dlx-lb" aria-label="Vehicle photos">`,
        `    <div class="dlx-lb-head"><span>Vehicle photos</span><button type="button" class="dlx-lb-close" data-lb-close>Close</button></div>`,
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
          return [`  <div class="dlx-cg-card">`, carousel(pics, `Photos of the ${m.name}`, '    '), `    <div class="dlx-cg-body"><h4>${m.name}</h4><p>${m.sub}</p></div>`, `  </div>`].join('\n');
        });
      return `<div class="${cls}-wrap">\n${cards.join('\n')}\n</div>`;
    }

    return carousel(items, p.label);
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
  const toCms = (html) => html.replace(/src="img\/([^"]+)"/g, (_, rel) => `src="${globalThis.DLX.CMS?.[rel] ?? `#MISCPATH#${rel.split('/').pop()}`}"`);

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
  globalThis.DLX = Object.assign(globalThis.DLX || {}, {
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
      state.look = id;
      state.lookProps = { ...look.settings };
      state.perView = { ...look.perView };
      state.gutter = true;
      return { css: cssFor(`.${cls}`), html: htmlFor(cls) };
    },
  });

  // Nothing below this line has a DOM to attach to on that page.
  if (!stage) return;

  function render() {
    live.forEach((s) => s.destroy());
    live = [];
    styleEl.textContent = cssFor('.wb-live');
    stage.innerHTML = htmlFor('wb-live');
    live = globalThis.DLCarousel.autoInit(stage);
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
    state.codeText = `<style>\n${cssFor('.my-slider')}\n</style>\n\n${toCms(htmlFor('my-slider'))}${script}`;
    codeEl.innerHTML = globalThis.DLX.hl.snippet(state.codeText);
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
    const root = stage.querySelector('.dl-carousel');
    const slide = stage.querySelector('.dl-carousel-slide');
    if (!root || !slide) return;

    const w = Math.round(slide.getBoundingClientRect().width);
    // A slider inside a closed <dialog> measures 0. There is nothing to judge
    // until it is opened, so report that rather than cry "cramped".
    if (w === 0) {
      spec.dataset.fit = 'idle';
      warn.hidden = true;
      set('spec-card', 'not shown yet');
      set('spec-across', '—');
      set('spec-gap', '—');
      set('spec-stops', '—');
      set('spec-controls', '—');
      $('spec-gauge').style.inlineSize = '0%';
      return;
    }

    const cs = getComputedStyle(root);
    const min = minCard();
    const stops = root._dlCarousel ? root._dlCarousel._stops().length : 1;
    const fits = root.hasAttribute('data-fits');
    const n = stage.querySelectorAll('.dl-carousel').length;

    set('spec-card', `${w}px in ${Math.round(stage.getBoundingClientRect().width)}px`);
    set('spec-across', `${cs.getPropertyValue('--dlc-per-view').trim()} of ${stage.querySelectorAll('.dl-carousel-slide').length}${n > 1 ? ` · ${n} sliders` : ''}`);
    set('spec-gap', cs.getPropertyValue('--dlc-gap').trim() || '0');
    set('spec-stops', String(stops));
    set('spec-controls', fits ? 'hidden — all fits' : 'arrows' + (state.hideDots ? '' : ' + dots'));

    // The workbench chrome often leaves the preview column narrower than the
    // .container a real page would give at this window. Judge the card against
    // what that container would produce, or the gauge cries "cramped" about a
    // layout that is fine in production.
    const tier = innerWidth >= 1200 ? 1170 : innerWidth >= 992 ? 970 : innerWidth >= 768 ? 750 : innerWidth - 30;
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

  const control = (label, node) => {
    const row = document.createElement('label');
    row.className = 'wb-row';
    const span = document.createElement('span');
    span.textContent = label;
    row.append(span, node);
    return row;
  };

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
      sel.style.inlineSize = '100%';
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
        const b = BRANDS[state.brand];
        if (b) {
          if (b.models) state.count = b.models.length;
          state.look = b.look;
          state.lookProps = { ...LOOKS[b.look].settings };
          // A recorded ladder is read at the platform's tiers and clamped;
          // a brand with none keeps the look's own sensible ladder.
          // The gap in effect, not a default: the two-row grid runs a 16px gap
          // where the model bar runs 8, and four cards plus three 16px gaps is a
          // different sum. Assuming 8 let seven presets through at 146px.
          state.perView = b.ladder ? perViewFor(b.ladder, LOOKS[b.look].minCard, gapPx(), b.look) : { ...LOOKS[b.look].perView };
        }
        buildPanel();
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
          state.look = id;
          state.lookProps = { ...LOOKS[id].settings };
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
    colors.append(colorRow('Arrow colour', '--dlc-arrow-fg', state.props));
    colors.append(colorRow('Arrow background', '--dlc-arrow-bg', state.props));
    if (state.props['--dlc-peek'] != null) {
      const peek = document.createElement('input');
      peek.type = 'text';
      peek.value = state.props['--dlc-peek'];
      peek.addEventListener('input', () => {
        state.props['--dlc-peek'] = peek.value;
        render();
      });
      colors.append(control('Peek', peek));
    }
    const gap = document.createElement('input');
    gap.type = 'text';
    gap.value = state.props['--dlc-gap'] ?? '1rem';
    gap.addEventListener('input', () => {
      state.props['--dlc-gap'] = gap.value;
      render();
    });
    colors.append(control('Gap', gap));
    panel.append(section('Arrows and spacing', colors));

    if (Object.keys(state.lookProps).length) {
      const knobs = document.createElement('div');
      for (const k of Object.keys(state.lookProps)) {
        const v = state.lookProps[k];
        if (/^#|rgb|transparent/.test(v)) knobs.append(colorRow(k.replace('--', ''), k, state.lookProps));
        else {
          const input = document.createElement('input');
          input.type = 'text';
          input.value = v;
          input.addEventListener('input', () => {
            state.lookProps[k] = input.value;
            render();
          });
          knobs.append(control(k.replace('--', ''), input));
        }
      }
      panel.append(section('This card style', knobs));
    }

    const beh = document.createElement('div');
    const step = document.createElement('select');
    // data-step takes a number as of 2026-08-27: how many cards one arrow
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
      o.selected = (state.data['data-step'] ?? 'page') === v;
      step.append(o);
    }
    step.addEventListener('change', () => {
      if (step.value === 'page') delete state.data['data-step'];
      else state.data['data-step'] = step.value;
      render();
    });
    beh.append(control('Arrows move', step));

    const dots = document.createElement('input');
    dots.type = 'checkbox';
    dots.checked = !state.hideDots;
    dots.addEventListener('change', () => {
      state.hideDots = !dots.checked;
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
    beh.append(control('Slides in this example', count));
    panel.append(section('Behaviour', beh));
  }

  // Preview width. The column the stage sits in is not the width the slider
  // will have on a real page, so the default caps it at Bootstrap 3's 1170px
  // .container and you can step down through the other two tiers.
  const widthBtns = () => [...document.querySelectorAll('.ui-widths button')];

  const setFrame = (b) => {
    for (const x of widthBtns()) x.setAttribute('aria-pressed', String(x === b));
    stage.style.setProperty('--frame', b.dataset.w === '0' ? '100%' : `${b.dataset.w}px`);
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
    let active = null;
    for (const b of widthBtns()) {
      const w = +b.dataset.w;
      b.disabled = w > avail + 1;
      b.title = b.disabled ? `Needs a window about ${Math.round(w + (innerWidth - avail))}px wide` : `Preview in a ${w || 'full-width'} container`;
      if (b.getAttribute('aria-pressed') === 'true') active = b;
    }
    if (active && active.disabled) {
      const widest = widthBtns()
        .filter((b) => !b.disabled)
        .sort((a, b) => +b.dataset.w - +a.dataset.w)[0];
      if (widest) setFrame(widest);
    }
  }

  for (const b of widthBtns()) b.addEventListener('click', () => setFrame(b));

  /* ---- pattern picker ---------------------------------------------------- */

  const nav = $('wb-nav');
  for (const [id, p] of Object.entries(PATTERNS)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `<span class="wb-glyph wb-glyph--${id}"></span><span>${p.label}</span>`;
    b.dataset.go = id;
    b.addEventListener('click', () => {
      loadPattern(id);
      buildPanel();
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
  const TAGS = ['<link rel="stylesheet" href="/path/dl-carousel.css">', '<script src="/path/dl-carousel.js" defer></script>'].join('\n');
  $('wb-copy-tags').addEventListener('click', (e) => copyText(e.target, TAGS));

  // The engine files, fetched at click time from the very files this page is
  // running - so what lands on the clipboard can never be a stale copy.
  const ENGINE = { css: '../dist/dl-carousel.css', js: '../dist/dl-carousel.js' };
  const grab = (k) => fetch(ENGINE[k]).then((r) => r.text());

  for (const btn of document.querySelectorAll('[data-file]')) {
    btn.addEventListener('click', async () => {
      const kind = btn.dataset.file;
      const text = await grab(kind);
      if (btn.dataset.act === 'copy') return copyText(btn, kind === 'js' ? `<script>\n${text}\n</script>` : `<style>\n${text}\n</style>`);
      if (btn.dataset.act === 'view') {
        const box = $('wb-file-view');
        box.hidden = false;
        box.querySelector('code').innerHTML = kind === 'css' ? globalThis.DLX.hl.css(text) : globalThis.DLX.hl.js(text);
        box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: kind === 'js' ? 'text/javascript' : 'text/css' }));
      a.download = `dl-carousel.${kind}`;
      a.click();
      URL.revokeObjectURL(a.href);
      flash(btn, 'Downloaded');
    });
  }

  // This script is inline-loaded before the deferred engine, so wait for it.
  const boot = () => {
    const id = location.hash.slice(1);
    loadPattern(PATTERNS[id] ? id : 'modelbar');
    for (const x of nav.querySelectorAll('button')) x.setAttribute('aria-current', String(x.dataset.go === state.pattern));
    buildPanel();
    render();
    addEventListener('resize', () => {
      fitWidths();
      checkFit();
    });
    fitWidths();
  };
  if (globalThis.DLCarousel) boot();
  else addEventListener('DOMContentLoaded', boot);
})();
