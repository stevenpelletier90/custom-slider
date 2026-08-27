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
    sub: 'In stock now',
    blurb: 'Built for the way you actually drive.',
  }));

  const VEHICLES = [
    ['vehicle-1.jpg', '2021 Porsche Panamera', '$82,900 · 18,300 mi', 'Grey Porsche Panamera, rear three-quarter view'],
    ['vehicle-2.jpg', '2023 BMW 430i Coupe', '$54,200 · 9,100 mi', 'White BMW 430i coupe on a city street'],
    ['vehicle-3.jpg', '2022 Ford Expedition', '$61,750 · 22,400 mi', 'Black Ford Expedition on a mountain road'],
    ['vehicle-4.jpg', '2023 Honda CR-V EX-L', '$34,900 · 12,800 mi', 'Silver Honda CR-V parked by trees'],
    ['vehicle-5.jpg', '2020 Nissan GT-R', '$96,500 · 14,200 mi', 'Blue Nissan GT-R on a race circuit'],
    ['vehicle-6.jpg', '2019 Fiat 500 Lounge', '$12,400 · 31,900 mi', 'Red Fiat 500 on a cobbled street'],
  ].map(([f, name, sub, alt]) => ({ img: `img/${f}`, name, sub, alt, href: '/used-inventory/index.htm' }));

  const PHOTOS = [
    ['photo-1.jpg', 'Blue Chevrolet Camaro in the desert at dusk'],
    ['photo-2.jpg', 'White Ford Mustang in a neon-lit parking garage'],
    ['photo-3.jpg', 'Hands on the steering wheel at dusk'],
    ['photo-4.jpg', 'Audi R8 tail lights on a city street at sunset'],
    ['photo-5.jpg', 'Technician topping up engine oil'],
    ['photo-6.jpg', 'Classic BMW grilles lined up in a museum'],
  ].map(([f, alt]) => ({ img: `img/${f}`, alt }));

  const pic = (m) => `<img src="${m.img}" width="1200" height="750" alt="${m.alt}" loading="lazy" decoding="async">`;

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
      css: `.dlx-col { display: grid; grid-template-rows: repeat(2, auto); gap: var(--dlc-gap); }`,
    },
    peek: {
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
      label: 'Video testimonials',
      blurb: 'Posters open a native dialog, which gives Esc-to-close and focus trapping for free. Video never plays inline — autoplay on video cards fights the content.',
      data: {},
      props: { '--dlc-gap': '1rem', '--dlc-arrow-bg': 'rgb(0 0 0 / 55%)', '--dlc-arrow-fg': '#ffffff' },
      perView: { base: 1, 768: 2, 992: 2, 1200: 3 },
      minCard: 260,
      models: PHOTOS.slice(0, 3).map((m, i) => ({ ...m, name: ['Dana W.', 'Marcus T.', 'Gene & Marta L.'][i] })),
      css: `.dlx-video { position: relative; display: block; inline-size: 100%; padding: 0; overflow: hidden; font: inherit; text-align: start; cursor: pointer; background: none; border: 0; border-radius: 8px; }
.dlx-video img { display: block; inline-size: 100%; block-size: auto; aspect-ratio: 16 / 10; object-fit: cover; }
.dlx-play { position: absolute; inset-block-start: 42%; inset-inline-start: 50%; display: grid; place-items: center; inline-size: 56px; block-size: 56px; color: #16324f; background: rgb(255 255 255 / 92%); border-radius: 50%; transform: translate(-50%, -50%); }
.dlx-name { display: block; margin: 0.6rem 0 0; font-size: 1rem; font-weight: 700; line-height: 1.3; }`,
      slides: (models) =>
        models.map(
          (m) => `<button type="button" class="dlx-video" data-video="${m.name}">${pic(m)}<span class="dlx-play" aria-hidden="true">&#9654;</span><span class="dlx-name">${m.name}</span></button>`,
        ),
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
    state.lookProps = p.look ? { ...LOOKS[p.look].settings } : {};
  }

  const minCard = () => PATTERNS[state.pattern].minCard ?? (state.look ? LOOKS[state.look].minCard : 200);

  // --dlc-gap as a number. Values here are always rem or px.
  const gapPx = () => {
    const g = state.props['--dlc-gap'] ?? '1rem';
    return g.endsWith('rem') ? parseFloat(g) * 16 : parseFloat(g) || 0;
  };

  /* ---- the single source: settings -> CSS text -------------------------- */

  // `sel` is the only difference between what runs and what you copy.
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
    const scope = (css) => css.replace(/(^|[{}\n,]\s*)\.dlx/g, (_, pre) => `${pre}${sel} .dlx`).replace(new RegExp(`${sel.replace('.', '\\.')} \\.dlx(?=[\\s{])`, 'g'), sel);

    const body = [state.look ? scope(LOOKS[state.look].css) : '', p.css ? scope(p.css) : ''].filter(Boolean).join('\n');
    return [`${sel} {\n${decls}\n}`, steps, dots, arrows, body].filter(Boolean).join('\n\n');
  }

  function htmlFor(cls) {
    const p = PATTERNS[state.pattern];
    // Cycle the content up or down to the requested count. Repeats are how you
    // see what the slider does at 12 cards, and what it does when everything
    // already fits and it correctly stops drawing arrows and dots.
    const models = Array.from({ length: state.count }, (_, i) => p.models[i % p.models.length]);
    let items = p.slides ? p.slides(models) : models.map((m) => LOOKS[state.look].markup(m));

    // The two-row grid puts a COLUMN in each slide, not a card - one slide is
    // one scroll stop, which is what keeps the dots and the count honest.
    if (p.pairUp) {
      const cols = [];
      for (let i = 0; i < items.length; i += 2) cols.push(`<div class="dlx-col">${items.slice(i, i + 2).join('')}</div>`);
      items = cols;
    }

    const tag = p.track === 'div' ? 'div' : 'ul';
    const item = tag === 'ul' ? 'li' : 'div';
    const slides = items.map((h) => `    <${item} class="dl-carousel-slide">${h}</${item}>`).join('\n');
    const attrs = Object.entries(state.data)
      .map(([k, v]) => (v === '' ? ` ${k}` : ` ${k}="${v}"`))
      .join('');
    return `<div class="${cls} dl-carousel" data-slider${attrs} aria-label="${p.label}">\n  <${tag} class="dl-carousel-track">\n${slides}\n  </${tag}>\n</div>`;
  }

  /* ---- render ----------------------------------------------------------- */

  const $ = (id) => document.getElementById(id);
  const stage = $('wb-stage');
  const styleEl = $('wb-live-css');
  const codeEl = $('wb-code');
  const panel = $('wb-settings');
  let live = [];

  function render() {
    live.forEach((s) => s.destroy());
    live = [];
    styleEl.textContent = cssFor('.wb-live');
    stage.innerHTML = htmlFor('wb-live');
    live = globalThis.DLCarousel.autoInit(stage);
    wireVideo();
    checkFit();

    const p = PATTERNS[state.pattern];
    $('wb-title').textContent = p.label;
    $('wb-blurb').textContent = p.blurb;
    // Same generator, different selector - that is the parity guarantee.
    // Kept as text as well as highlighted markup: the clipboard gets the text,
    // never the spans.
    state.codeText = `<style>\n${cssFor('.my-slider')}\n</style>\n\n${htmlFor('my-slider')}`;
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
  function checkFit() {
    const warn = $('wb-warn');
    const slide = stage.querySelector('.dl-carousel-slide');
    if (!slide) return;
    const w = Math.round(slide.getBoundingClientRect().width);
    const min = minCard();
    warn.hidden = w >= min;
    warn.textContent = warn.hidden ? '' : `Each card is ${w}px here, and this look needs about ${min}px before the text starts colliding. Show fewer across, or pick a look that suits narrow cards.`;
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
    swatch.value = /^#[0-9a-f]{6}$/i.test(val) ? val : '#000000';
    const text = document.createElement('input');
    text.type = 'text';
    text.value = val;
    const push = (v) => {
      store[key] = v;
      render();
    };
    // A colour input has no way to show "transparent" or an rgb() with alpha -
    // it just renders black, which reads as a real colour choice that was never
    // made. Show the swatch only when it can tell the truth.
    const sync = () => {
      swatch.hidden = !/^#[0-9a-f]{6}$/i.test(text.value);
      if (!swatch.hidden) swatch.value = text.value;
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
    wrap.append(swatch, text);
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
          : `No model bar runs on any of ${b.label}'s ${b.demos} demo homepages, so there is no recorded ladder — this is the default. ${b.note ?? ''}`.trim();
      };
      sel.addEventListener('change', () => {
        state.brand = sel.value || null;
        const b = BRANDS[state.brand];
        if (b) {
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
        b.innerHTML = `<span class="wb-look-swatch" data-look="${id}"></span><span>${look.label}</span>`;
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
      panel.append(section('Card style', looks));
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

  /* ---- pattern picker ---------------------------------------------------- */

  const nav = $('wb-nav');
  for (const [id, p] of Object.entries(PATTERNS)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = p.label;
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
    addEventListener('resize', checkFit);
  };
  if (globalThis.DLCarousel) boot();
  else addEventListener('DOMContentLoaded', boot);
})();
