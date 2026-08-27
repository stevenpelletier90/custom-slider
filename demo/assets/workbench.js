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
  const { LOOKS } = globalThis.DLX;

  // Breakpoints are the platform's Bootstrap 3 grid, measured in its CSS
  // bundle. Not the estate's 461 / 539 / 599 / 990 / 1440 - several of those
  // were an off-by-one in a slick conversion, and none of them line up with
  // the page the slider sits in.
  const BPS = [768, 992, 1200];

  const CHEVY = ['silverado-1500', 'colorado', 'tahoe', 'suburban', 'traverse', 'trax', 'equinox', 'trailblazer'];
  const title = (s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const PATTERNS = {
    modelbar: {
      label: 'Model bar',
      blurb: 'A strip of vehicle cutouts. Arrows only, one card per step - the most requested thing on the platform.',
      look: 'tile',
      data: { 'data-step': 'slide' },
      props: { '--dlc-gap': '0.5rem', '--dlc-controls-space': '0.1px', '--dlc-arrow-bg': 'transparent', '--dlc-arrow-fg': '#262626' },
      perView: { base: 2, 768: 3, 992: 4, 1200: 5 },
      hideDots: true,
      models: CHEVY.map((slug) => ({
        href: `/searchnew.aspx?Model=${encodeURIComponent(title(slug))}`,
        img: `img/chrome-${slug}.webp`,
        img640: `img/chrome-${slug}-640.webp`,
        alt: `2026 Chevrolet ${title(slug)}`,
        name: title(slug),
      })),
    },
  };

  /* ---- state ------------------------------------------------------------ */

  const state = {
    pattern: 'modelbar',
    look: null,
    perView: null,
    props: null,
    lookProps: null,
    data: null,
    hideDots: false,
  };

  function loadPattern(id) {
    const p = PATTERNS[id];
    state.pattern = id;
    state.look = p.look;
    state.perView = { ...p.perView };
    state.props = { ...p.props };
    state.data = { ...p.data };
    state.hideDots = !!p.hideDots;
    state.lookProps = { ...LOOKS[p.look].settings };
  }

  /* ---- the single source: settings -> CSS text -------------------------- */

  // `sel` is the only difference between what runs and what you copy.
  function cssFor(sel) {
    const look = LOOKS[state.look];
    const base = { ...state.lookProps, ...state.props, '--dlc-per-view': state.perView.base };
    const decls = Object.entries(base)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');

    const steps = BPS.filter((bp) => state.perView[bp] != null)
      .map((bp) => `@media (min-width: ${bp}px) {\n  ${sel} { --dlc-per-view: ${state.perView[bp]}; }\n}`)
      .join('\n');

    const dots = state.hideDots ? `${sel} .dl-carousel-dots { display: none; }` : '';
    // Park the arrows in the gutter the look's padding reserved, rather than
    // letting them overlay the cards.
    const arrows = [`${sel} .dl-carousel-arrow--prev { inset-inline-start: 0; }`, `${sel} .dl-carousel-arrow--next { inset-inline-end: 0; }`].join('\n');
    // Scope the look's own rules to this slider so two on one page cannot clash.
    const lookCss = look.css.replace(/^\.dlx/gm, `${sel} .dlx`).replace(new RegExp(`${sel.replace('.', '\\.')} \\.dlx \\{`, 'g'), `${sel} {`);

    return [`${sel} {\n${decls}\n}`, steps, dots, arrows, lookCss].filter(Boolean).join('\n\n');
  }

  function htmlFor(cls) {
    const p = PATTERNS[state.pattern];
    const look = LOOKS[state.look];
    const slides = p.models
      .map(
        (m) =>
          `    <li class="dl-carousel-slide">\n${look
            .markup(m)
            .split('\n')
            .map((l) => '      ' + l)
            .join('\n')}\n    </li>`,
      )
      .join('\n');
    const attrs = Object.entries(state.data)
      .map(([k, v]) => ` ${k}="${v}"`)
      .join('');
    return `<div class="${cls} dl-carousel" data-slider${attrs} aria-label="${p.label}">\n  <ul class="dl-carousel-track">\n${slides}\n  </ul>\n</div>`;
  }

  /* ---- render ----------------------------------------------------------- */

  const stage = document.getElementById('wb-stage');
  const styleEl = document.getElementById('wb-live-css');
  const codeEl = document.getElementById('wb-code');
  const panel = document.getElementById('wb-settings');
  const titleEl = document.getElementById('wb-title');
  const blurbEl = document.getElementById('wb-blurb');
  let live = [];

  function render() {
    live.forEach((s) => s.destroy());
    live = [];
    styleEl.textContent = cssFor('.wb-live');
    stage.innerHTML = htmlFor('wb-live');
    live = globalThis.DLCarousel.autoInit(stage);

    const p = PATTERNS[state.pattern];
    titleEl.textContent = p.label;
    blurbEl.textContent = p.blurb;
    // Same generator, different selector - that is the parity guarantee.
    codeEl.textContent = `<link rel="stylesheet" href="dl-carousel.css">\n<script src="dl-carousel.js" defer></script>\n\n<style>\n${cssFor('.my-slider')}\n</style>\n\n${htmlFor('my-slider')}`;
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

  function buildPanel() {
    panel.replaceChildren();

    // How many across, per breakpoint.
    const grid = document.createElement('div');
    grid.className = 'wb-perview';
    for (const key of ['base', ...BPS]) {
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '1';
      input.max = '8';
      input.value = state.perView[key] ?? '';
      input.addEventListener('input', () => {
        const n = parseInt(input.value, 10);
        if (n >= 1 && n <= 8) {
          state.perView[key] = n;
          render();
        }
      });
      grid.append(control(key === 'base' ? 'phone' : `≥${key}`, input));
    }
    panel.append(section('How many across', grid));

    // The look, chosen visually - a dropdown reading "split photo card" helps
    // nobody who does not already know they want it.
    const looks = document.createElement('div');
    looks.className = 'wb-looks';
    for (const [id, look] of Object.entries(LOOKS)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'wb-look';
      b.setAttribute('aria-pressed', String(id === state.look));
      b.innerHTML = `<span class="wb-look-swatch" data-look="${id}"></span><span>${look.label}</span>`;
      b.addEventListener('click', () => {
        state.look = id;
        state.lookProps = { ...LOOKS[id].settings };
        buildPanel();
        render();
      });
      looks.append(b);
    }
    panel.append(section('Card style', looks));

    // Whatever the current look exposes.
    const knobs = document.createElement('div');
    for (const [k, v] of Object.entries(state.lookProps)) {
      const isColor = /^#|rgb/.test(v);
      const input = document.createElement('input');
      input.type = isColor ? 'color' : 'text';
      input.value = v;
      input.addEventListener('input', () => {
        state.lookProps[k] = input.value;
        render();
      });
      knobs.append(control(k.replace('--', ''), input));
    }
    panel.append(section('Style', knobs));

    // Behaviour that lives on data attributes, not properties.
    const beh = document.createElement('div');
    const step = document.createElement('select');
    for (const v of ['page', 'slide']) {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = v === 'page' ? 'a full page' : 'one card';
      o.selected = (state.data['data-step'] ?? 'page') === v;
      step.append(o);
    }
    step.addEventListener('change', () => {
      if (step.value === 'page') delete state.data['data-step'];
      else state.data['data-step'] = 'slide';
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
    panel.append(section('Behaviour', beh));
  }

  function section(heading, body) {
    const s = document.createElement('section');
    const h = document.createElement('h3');
    h.textContent = heading;
    s.append(h, body);
    return s;
  }

  /* ---- copy -------------------------------------------------------------- */

  document.getElementById('wb-copy').addEventListener('click', async (e) => {
    try {
      await navigator.clipboard.writeText(codeEl.textContent);
      e.target.textContent = 'Copied';
    } catch {
      getSelection().selectAllChildren(codeEl);
      e.target.textContent = 'Press Ctrl+C';
    }
    setTimeout(() => (e.target.textContent = 'Copy'), 1600);
  });

  // This script is inline-loaded before the deferred engine, so wait for it.
  const boot = () => {
    loadPattern('modelbar');
    buildPanel();
    render();
  };
  if (globalThis.DLCarousel) boot();
  else addEventListener('DOMContentLoaded', boot);
})();
