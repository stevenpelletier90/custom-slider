# Custom Slider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dependency-free vanilla HTML/CSS/JS scroll-snap slider library with a 3-variation demo page (multi-card, thumbnail gallery, autoplay multi-card), per the approved spec at `docs/superpowers/specs/2026-07-13-custom-slider-design.md`.

**Architecture:** The CSS owns layout and physics (a native scroll container with `scroll-snap`); one ES module (`src/dl-carousel.js`) wires controls, state, autoplay, and the tabbed-gallery variant. An esbuild one-liner produces a self-contained classic script for CMS paste-in. The demo page is the test fixture; verification is browser-driven (Playwright MCP + Lighthouse), no test framework in v1.

**Tech Stack:** Vanilla ES2022 JS, plain CSS, esbuild (dev-only dependency), Playwright/chrome-devtools MCP for verification.

## Global Constraints

Every task implicitly includes these. Copied from the spec — do not relax them.

- **Byte budget:** `dist/dl-carousel.js` + `dist/dl-carousel.css` **< 5120 bytes gzip total** (`npm run size` gates this).
- **Zero runtime dependencies.** esbuild is the only devDependency.
- **Baseline platform features only.** Forbidden (Chromium-only as of July 2026): `scrollsnapchange`/`scrollsnapchanging`, `::scroll-button`/`::scroll-marker`/`scroll-marker-group`, `scroll-state()`, `interactivity: inert`, `scrollIntoView({container})`.
- **Never set CSS `scroll-behavior`** anywhere. Every programmatic scroll passes `behavior:` explicitly, resolved from `matchMedia('(prefers-reduced-motion: reduce)').matches` **at call time** (`'auto'` when reduced, else `'smooth'`).
- `scroll-snap-type: x mandatory` goes **on the track element, never the root scroller**. `scroll-snap-stop: normal` (never `always`). `overscroll-behavior-x: contain` on the track.
- **Multi-card slides:** no `inert`, no `aria-hidden`, no `tabindex="-1"` — all cards stay in the a11y tree and tab order. **Gallery (single-view) non-visible panels:** JS-managed `inert`, never on a panel containing focus.
- **`goTo` computes its own snap target** (never trusts browser re-snap), is idempotent, never uses `scrollIntoView` on the main track, and never scrolls while a pointer is down on the track.
- Current index commits in **one place**: a `scrollend` handler, with a ~150 ms debounced `scroll` fallback when `'onscrollend' in window` is false. Scroll listeners are `{ passive: true }`.
- **Controls are JS-generated**; their space is reserved in CSS (arrows overlay the track; dot row / thumb strip live in reserved `padding-bottom`). Pre-JS and post-JS render pixel-identical (CLS 0.000).
- **All slide content ships in the demo's initial HTML.** Every `<img>` has `width`/`height`. First visible images eager (`fetchpriority="high"` only on the very first, above-the-fold image); off-view images `loading="lazy" decoding="async"`. Local SVG placeholders only — no external requests.
- **Naming:** classes `dl-carousel-*`, custom properties `--dlc-*`, events `dlc:*`.
- **Commit style:** short plain imperative subject (match `git log`: "Add custom slider design spec"). No `feat:`/`fix:` prefixes. Stage only files belonging to the task.
- **Windows execution notes:** create/edit files with the Write/Edit tools (never bash `echo`/heredocs — CRLF/backslash mangling). Run npm via PowerShell. LF/CRLF warnings from git are noise — ignore them.
- **LTR only in v1** (dealer sites are LTR; stride math assumes it — documented limitation).

## File Map

| Path                            | Responsibility                                              | Task    |
| ------------------------------- | ----------------------------------------------------------- | ------- |
| `package.json`, `.gitignore`    | esbuild devDep; `build` / `size` / `serve` scripts          | 1       |
| `scripts/size.mjs`              | gzip-size gate (< 5120 B total, exit 1 over)                | 1       |
| `src/dl-carousel.css`           | ALL layout/physics/theme; `--dlc-*` knobs                   | 2       |
| `scripts/make-placeholders.mjs` | writes `demo/img/*.svg` (12 files)                          | 2       |
| `demo/index.html`               | fixture + docs page; grows across tasks 2/4/5/6             | 2,4,5,6 |
| `src/dl-carousel.js`            | the engine (one ES module); grows across tasks 3/4/5        | 3,4,5   |
| `src/auto.js`                   | CMS entry: DOMContentLoaded auto-init + `window.DLCarousel` | 3       |
| `dist/*`                        | built, checked in; rebuilt whenever src changes             | 1→      |
| `README.md`                     | usage, options, a11y notes, verification checklist          | 6       |

---

### Task 1: Scaffold, build pipeline, size gate

**Files:**

- Create: `package.json`, `.gitignore`, `scripts/size.mjs`, `src/dl-carousel.js` (stub), `src/auto.js` (stub), `src/dl-carousel.css` (stub)

**Interfaces:**

- Produces: `npm run build` (src → dist), `npm run size` (build + gzip gate), `npm run serve` (dev server on `127.0.0.1:8137` for Lighthouse in Task 7).

- [ ] **Step 1: Create `.gitignore`**

```
node_modules/
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "custom-slider",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "esbuild src/auto.js --bundle --format=iife --minify --outfile=dist/dl-carousel.js && esbuild src/dl-carousel.css --minify --outfile=dist/dl-carousel.css",
    "size": "npm run build && node scripts/size.mjs",
    "serve": "esbuild --servedir=. --serve=127.0.0.1:8137"
  }
}
```

- [ ] **Step 3: Install esbuild**

Run: `npm install --save-dev esbuild`
Expected: `package-lock.json` created, esbuild under devDependencies.

- [ ] **Step 4: Create `scripts/size.mjs`**

```js
// Byte-budget gate: dist JS+CSS must stay under 5 KB gzip TOTAL (spec §2).
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const BUDGET = 5120;
const files = ['dist/dl-carousel.js', 'dist/dl-carousel.css'];
let total = 0;
for (const f of files) {
  const gz = gzipSync(readFileSync(f), { level: 9 }).length;
  total += gz;
  console.log(`${f}: ${gz} B gzip`);
}
console.log(`total: ${total} B gzip (budget ${BUDGET})`);
if (total > BUDGET) {
  console.error('FAIL: over the 5 KB gzip budget');
  process.exit(1);
}
```

- [ ] **Step 5: Create stub `src/dl-carousel.js`**

```js
/**
 * Custom Slider — dependency-free scroll-snap carousel.
 * Engine lands in the next commits; this stub keeps the build green.
 */
export class Slider {}
```

- [ ] **Step 6: Create stub `src/auto.js`**

```js
import { Slider } from './dl-carousel.js';
window.DLCarousel = Slider;
```

- [ ] **Step 7: Create stub `src/dl-carousel.css`**

```css
/* Custom Slider — layout + theme. Populated in the next commit. */
```

- [ ] **Step 8: Build and run the size gate**

Run: `npm run size`
Expected: prints per-file gzip sizes and `total: … B gzip (budget 5120)`, exits 0. `dist/dl-carousel.js` and `dist/dl-carousel.css` now exist.

- [ ] **Step 9: Commit**

```powershell
git add .gitignore package.json package-lock.json scripts/size.mjs src/
git add -f dist/
git commit -m "Add build pipeline with esbuild and gzip size gate"
```

---

### Task 2: Library CSS + demo page with the multi-card variation (static)

**Files:**

- Create: `src/dl-carousel.css` (full, replaces stub), `scripts/make-placeholders.mjs`, `demo/img/*.svg` (generated), `demo/index.html`

**Interfaces:**

- Produces (markup contract consumed by all later tasks): root element `class="dl-carousel"` `[data-slider]`; child `.dl-carousel-track` (a `<ul>` for card carousels, `<div>` for gallery); children `.dl-carousel-slide`. CSS knobs: `--dlc-per-view`, `--dlc-gap`, `--dlc-peek`, `--dlc-arrow-size/fg/bg`, `--dlc-dot-size/fg/current`, `--dlc-controls-space`, `--dlc-thumb-w/h`, `--dlc-focus`. Generated-control classes styled here and created by JS in Tasks 3–5: `.dl-carousel-controls`, `.dl-carousel-arrow--prev/--next`, `.dl-carousel-pause`, `.dl-carousel-dots`/`.dl-carousel-dot`, `.dl-carousel-status`, `.dl-carousel-sr-only`, `.dl-carousel-thumbs`/`.dl-carousel-thumb`.
- Produces: `demo/img/vehicle-1..6.svg` (800×500), `demo/img/photo-1..6.svg` (1200×750).

- [ ] **Step 1: Write `src/dl-carousel.css` (complete file)**

```css
/* ==========================================================================
   Custom Slider — dl-carousel.css
   The CSS owns layout AND physics: the track is a native scroll container
   with scroll-snap, so the strip works (swipe, scroll, snap) before any JS
   runs. JS only adds controls into space this file has already reserved.
   Every knob is a --dlc-* custom property; override them on .dl-carousel or a wrapper.
   ========================================================================== */

.dl-carousel {
  /* ---- knobs ---------------------------------------------------------- */
  --dlc-per-view: 1; /* slides visible at once (integer; set per breakpoint) */
  --dlc-gap: 1rem; /* space between slides */
  --dlc-peek: 0px; /* sliver of next slide visible at the edges */
  --dlc-arrow-size: 44px; /* prev/next tap target */
  --dlc-arrow-fg: #fff;
  --dlc-arrow-bg: rgb(0 0 0 / 55%);
  --dlc-dot-size: 12px;
  --dlc-dot-fg: #757575; /* ≥3:1 on white (WCAG 1.4.11) */
  --dlc-dot-current: #333;
  --dlc-controls-space: 2.5rem; /* reserved dot-row height — keeps CLS at 0 */
  --dlc-thumb-w: 88px;
  --dlc-thumb-h: 56px;
  --dlc-focus: #1a5fb4;

  position: relative;
  /* Dots (or the gallery thumb strip) are injected later, absolutely
     positioned into this reserved space, so JS init shifts nothing. */
  padding-bottom: var(--dlc-controls-space);
}
.dl-carousel[data-gallery] {
  --dlc-controls-space: calc(var(--dlc-thumb-h) + 1rem);
}

.dl-carousel-track {
  position: relative; /* slide offsets measured against the track */
  display: flex;
  gap: var(--dlc-gap);
  margin: 0;
  padding: 0 var(--dlc-peek);
  list-style: none;
  overflow-x: auto;
  /* Snap on the track only — never the root scroller. */
  scroll-snap-type: x mandatory;
  scroll-padding-inline: var(--dlc-peek);
  /* Edge overscroll must not chain into the page / back gesture. */
  overscroll-behavior-x: contain;
  /* Scrollbar hidden: arrows, dots, keyboard, and the peek remain as
     affordances. NEVER set scroll-behavior here — Safari would hijack
     intended-instant programmatic scrolls; JS passes behavior per call. */
  scrollbar-width: none;
}
.dl-carousel-track::-webkit-scrollbar {
  display: none;
}

.dl-carousel-slide {
  /* Explicit flex basis — Safari mis-sizes snap items without one. */
  flex: 0 0 calc((100% - (var(--dlc-per-view) - 1) * var(--dlc-gap)) / var(--dlc-per-view));
  /* 'always' would block multi-slide flicks (and fed a Firefox bug). */
  scroll-snap-align: start;
  scroll-snap-stop: normal;
}
.dl-carousel-slide img {
  max-inline-size: 100%;
  block-size: auto;
  display: block;
}

/* ---- generated controls (JS creates these; CSS already reserved room) -- */

.dl-carousel button:focus-visible {
  outline: 3px solid var(--dlc-focus);
  outline-offset: 2px;
}

.dl-carousel-arrow {
  position: absolute;
  top: calc((100% - var(--dlc-controls-space)) / 2);
  transform: translateY(-50%);
  inline-size: var(--dlc-arrow-size);
  block-size: var(--dlc-arrow-size);
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: var(--dlc-arrow-fg);
  background: var(--dlc-arrow-bg);
  cursor: pointer;
}
.dl-carousel-arrow--prev {
  inset-inline-start: 0.5rem;
}
.dl-carousel-arrow--next {
  inset-inline-end: 0.5rem;
}

.dl-carousel-pause {
  position: absolute;
  inset-block-start: 0.5rem;
  inset-inline-end: 0.5rem;
  z-index: 1;
  inline-size: 36px;
  block-size: 36px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: var(--dlc-arrow-fg);
  background: var(--dlc-arrow-bg);
  cursor: pointer;
}

.dl-carousel-dots {
  position: absolute;
  inset-block-end: 0;
  inset-inline: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}
.dl-carousel-dot {
  /* 24px hit box (WCAG 2.5.8) around a smaller drawn dot */
  inline-size: 24px;
  block-size: 24px;
  padding: 0;
  border: 0;
  background: transparent;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.dl-carousel-dot::after {
  content: '';
  inline-size: var(--dlc-dot-size);
  block-size: var(--dlc-dot-size);
  border-radius: 50%;
  background: var(--dlc-dot-fg);
}
.dl-carousel-dot--current::after {
  background: var(--dlc-dot-current);
}

/* ---- gallery (tabbed) variant ------------------------------------------ */

.dl-carousel-thumbs {
  position: absolute;
  inset-block-end: 0;
  inset-inline: 0;
  display: flex;
  gap: 0.5rem;
  block-size: var(--dlc-thumb-h);
  overflow-x: auto;
  scrollbar-width: none;
}
.dl-carousel-thumbs::-webkit-scrollbar {
  display: none;
}
.dl-carousel-thumb {
  flex: 0 0 var(--dlc-thumb-w);
  padding: 0;
  border: 2px solid transparent;
  border-radius: 4px;
  background: none;
  overflow: hidden;
  cursor: pointer;
}
.dl-carousel-thumb img {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  display: block;
}
.dl-carousel-thumb[aria-selected='true'] {
  border-color: var(--dlc-dot-current);
}

/* ---- visually hidden (status region) ----------------------------------- */

.dl-carousel-sr-only {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
```

- [ ] **Step 2: Write `scripts/make-placeholders.mjs` and run it**

```js
// Generates the demo's local SVG placeholder images (no external requests).
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = new URL('../demo/img/', import.meta.url);
mkdirSync(OUT, { recursive: true });

const svg = (w, h, bg, label) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${bg}"/>
  <text x="50%" y="50%" fill="#fff" font-family="system-ui,sans-serif" font-size="${Math.round(h / 8)}" text-anchor="middle" dominant-baseline="middle">${label}</text>
</svg>`;

['#4a6fa5', '#a54a6f', '#6fa54a', '#a5864a', '#4aa596', '#7a4aa5'].forEach((c, i) => writeFileSync(new URL(`vehicle-${i + 1}.svg`, OUT), svg(800, 500, c, `Vehicle ${i + 1}`)));
['#1f4e5f', '#2a637a', '#357895', '#408db0', '#2a7a5f', '#1f5f4e'].forEach((c, i) => writeFileSync(new URL(`photo-${i + 1}.svg`, OUT), svg(1200, 750, c, `Photo ${i + 1}`)));
console.log('wrote 12 SVGs to demo/img/');
```

Run: `node scripts/make-placeholders.mjs`
Expected: `wrote 12 SVGs to demo/img/`; 12 files exist.

- [ ] **Step 3: Write `demo/index.html`** (multi-card section only for now; reviews/gallery sections land in Tasks 4–5)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Custom Slider — demo</title>
    <meta name="description" content="Demo of the in-house dependency-free scroll-snap slider: multi-card, thumbnail gallery, and autoplay variations." />
    <link rel="stylesheet" href="../dist/dl-carousel.css" />
    <script src="../dist/dl-carousel.js" defer></script>
    <style>
      /* Demo page chrome only — slider styling lives in the library CSS. */
      body {
        font-family: system-ui, sans-serif;
        margin: 0;
        color: #222;
        line-height: 1.5;
      }
      main {
        max-width: 72rem;
        margin: 0 auto;
        padding: 1rem;
      }
      .demo-section {
        margin-block: 3rem;
      }
      /* Slides-per-view is site configuration: plain media queries, no JS breakpoints. */
      .demo-vehicles,
      .demo-reviews {
        --dlc-per-view: 1;
      }
      @media (min-width: 640px) {
        .demo-vehicles,
        .demo-reviews {
          --dlc-per-view: 2;
        }
      }
      @media (min-width: 1024px) {
        .demo-vehicles,
        .demo-reviews {
          --dlc-per-view: 3;
        }
      }
      .demo-card {
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
        block-size: 100%;
        box-sizing: border-box;
      }
      .demo-card h3 {
        margin: 0.75rem 1rem 0.25rem;
        font-size: 1.05rem;
      }
      .demo-card p {
        margin: 0 1rem 0.5rem;
        color: #555;
      }
      .demo-card a {
        display: inline-block;
        margin: 0 1rem 1rem;
      }
      details {
        margin-block-start: 1rem;
      }
      pre {
        background: #f6f6f6;
        padding: 1rem;
        overflow-x: auto;
        border-radius: 6px;
      }
      table {
        border-collapse: collapse;
        margin-block: 0.5rem;
      }
      th,
      td {
        border: 1px solid #ccc;
        padding: 0.35rem 0.6rem;
        text-align: left;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Custom Slider</h1>
      <p>Dependency-free scroll-snap slider. Try this page with JavaScript disabled — every variation remains a readable, swipeable strip.</p>

      <section class="demo-section" aria-labelledby="vehicles-h">
        <h2 id="vehicles-h">Featured vehicles</h2>
        <div class="dl-carousel demo-vehicles" data-slider aria-labelledby="vehicles-h">
          <ul class="dl-carousel-track">
            <li class="dl-carousel-slide">
              <article class="demo-card">
                <img src="img/vehicle-1.svg" width="800" height="500" alt="Silver 2024 Honda Accord EX-L sedan" fetchpriority="high" />
                <h3>2024 Honda Accord EX-L</h3>
                <p>$31,990 · 12,400 mi</p>
                <a href="#vehicle-1">View details</a>
              </article>
            </li>
            <li class="dl-carousel-slide">
              <article class="demo-card">
                <img src="img/vehicle-2.svg" width="800" height="500" alt="Red 2023 Toyota RAV4 XLE SUV" />
                <h3>2023 Toyota RAV4 XLE</h3>
                <p>$29,450 · 21,700 mi</p>
                <a href="#vehicle-2">View details</a>
              </article>
            </li>
            <li class="dl-carousel-slide">
              <article class="demo-card">
                <img src="img/vehicle-3.svg" width="800" height="500" alt="Green 2025 Ford F-150 Lariat pickup" />
                <h3>2025 Ford F-150 Lariat</h3>
                <p>$54,899 · 3,100 mi</p>
                <a href="#vehicle-3">View details</a>
              </article>
            </li>
            <li class="dl-carousel-slide">
              <article class="demo-card">
                <img src="img/vehicle-4.svg" width="800" height="500" alt="Tan 2022 Chevrolet Equinox LT SUV" loading="lazy" decoding="async" />
                <h3>2022 Chevrolet Equinox LT</h3>
                <p>$22,988 · 34,900 mi</p>
                <a href="#vehicle-4">View details</a>
              </article>
            </li>
            <li class="dl-carousel-slide">
              <article class="demo-card">
                <img src="img/vehicle-5.svg" width="800" height="500" alt="Teal 2024 Hyundai Tucson SEL SUV" loading="lazy" decoding="async" />
                <h3>2024 Hyundai Tucson SEL</h3>
                <p>$27,325 · 9,800 mi</p>
                <a href="#vehicle-5">View details</a>
              </article>
            </li>
            <li class="dl-carousel-slide">
              <article class="demo-card">
                <img src="img/vehicle-6.svg" width="800" height="500" alt="Purple 2021 Jeep Grand Cherokee Limited SUV" loading="lazy" decoding="async" />
                <h3>2021 Jeep Grand Cherokee Limited</h3>
                <p>$30,995 · 41,200 mi</p>
                <a href="#vehicle-6">View details</a>
              </article>
            </li>
          </ul>
        </div>
      </section>
    </main>
  </body>
</html>
```

- [ ] **Step 4: Verify the no-JS layout in the browser**

Using Playwright MCP (`browser_navigate` to `file:///C:/Users/steve/Dev/custom-slider/demo/index.html`):

1. `browser_resize` to 1280×900. `browser_evaluate`:
   ```js
   () => {
     const t = document.querySelector('.dl-carousel-track');
     const s = getComputedStyle(t);
     const w = [...t.children].map((li) => li.getBoundingClientRect().width);
     return { overflow: s.overflowX, snap: s.scrollSnapType, widths: w.slice(0, 3), scrollable: t.scrollWidth > t.clientWidth };
   };
   ```
   Expected: `overflow: "auto"`, `snap: "x mandatory"`, three roughly equal widths (~1/3 of track), `scrollable: true`.
2. `browser_resize` to 375×812 → same evaluate → slide width ≈ full track width (per-view 1). 768×1024 → per-view 2.
3. No-JS proof via `browser_run_code_unsafe`: open a new context with `javaScriptEnabled: false`, navigate the same URL, assert `document.querySelector('.dl-carousel-track').scrollWidth > clientWidth` still holds (layout is pure CSS) and take a screenshot. (Fallback if context creation is unavailable: `route` the `dl-carousel.js` URL to abort, then reload and check the same.)
4. `browser_evaluate`: `() => document.querySelector('.dl-carousel-track').scrollBy({left: 400}) || document.querySelector('.dl-carousel-track').scrollLeft` then re-read `scrollLeft` after ~500 ms — the strip scrolls and snaps with zero engine code.

- [ ] **Step 5: Commit**

```powershell
git add src/dl-carousel.css scripts/make-placeholders.mjs demo/
git add -f dist/
git commit -m "Add library CSS and demo page with static multi-card variation"
```

_(Run `npm run build` before committing so dist/dl-carousel.css picks up the new CSS.)_

---

### Task 3: Engine core — multi-card navigation, dots, state, events

**Files:**

- Create: `src/dl-carousel.js` (complete rewrite of stub), `src/auto.js` (rewrite of stub)

**Interfaces:**

- Consumes: markup contract + control classes from Task 2.
- Produces (relied on by Tasks 4–6):
  - `export class Slider` — `constructor(root, options = {})`, `goTo(n, {behavior}={})`, `next()`, `prev()`, `destroy()`, `static autoInit(scope = document)`.
  - Instance fields used later: `this.opts` (with `opts.labels`, `opts.autoplay`, `opts.gallery`), `this.root`, `this.track`, `this.slides`, `this.current`, `this.perView`, `this.uid`, `this.status`, `this.dots`, `this._ac` (AbortController), `this._prm` (matchMedia list), `this._btn(cls, label, icon)`, `this._commit()`, `this._emit(type, detail)`, `this._setRootAttr(name, value)`.
  - Module-level helpers used later: `fmt(tpl, vals)`, `ICONS.prev/next/pause/play`, `DEFAULTS.labels` keys: `prev,next,pause,play,dots,gotoSlide,gotoPage,statusSingle,statusMulti,thumbs,photo`.
  - Events: `dlc:change` `{index, page, slidesInView}` (bubbles), `dlc:destroy`.
  - `window.DLCarousel` global from the dist build; auto-init of `[data-slider]` on DOMContentLoaded.
  - Constructor call order (Tasks 4–5 splice into it): snapshot → `_parseOptions` → `_setupAria` → `_buildControls` → `_listen` → `_commit`.

- [ ] **Step 1: Write `src/dl-carousel.js` (complete file)**

```js
/**
 * Custom Slider — dependency-free scroll-snap carousel engine.
 *
 * The CSS (dl-carousel.css) owns layout and physics: the track is a native
 * scroll container with scroll-snap. This file only wires controls,
 * state, autoplay, and the gallery (tabbed) variant onto that.
 *
 * Markup contract (see README): .dl-carousel[data-slider] > .dl-carousel-track > .dl-carousel-slide+
 * Use <ul>/<li> for card carousels (list semantics announce counts),
 * plain <div>s for the gallery variant (slides become tabpanels).
 */

let uidCounter = 0;

const fmt = (tpl, vals) => tpl.replace(/\{(\w+)\}/g, (_, k) => vals[k]);

const DEFAULTS = {
  autoplay: 0, // ms between advances; 0 = off
  gallery: false, // tabbed thumbnail-gallery variant
  roledescription: 'carousel', // set '' to omit (localization concerns)
  labels: {
    prev: 'Previous slides',
    next: 'Next slides',
    pause: 'Stop automatic slide show',
    play: 'Start automatic slide show',
    dots: 'Choose slide',
    gotoSlide: 'Go to slide {n}',
    gotoPage: 'Go to slides {from}–{to}',
    statusSingle: 'Slide {n} of {total}',
    statusMulti: 'Slides {from}–{to} of {total}',
    thumbs: 'Choose photo',
    photo: 'Photo {n}',
  },
};

const ICONS = {
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20"><path d="M15 4l-8 8 8 8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20"><path d="M9 4l8 8-8 8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16"><path d="M7 4h4v16H7zM13 4h4v16h-4z" fill="currentColor"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg>',
};

export class Slider {
  constructor(root, options = {}) {
    this.root = root;
    this.track = root.querySelector('.dl-carousel-track');
    if (!this.track) {
      console.error('[dl-carousel] missing required .dl-carousel-track element in', root);
      return;
    }
    this.slides = [...this.track.querySelectorAll(':scope > .dl-carousel-slide')];
    if (!this.slides.length) {
      console.error('[dl-carousel] .dl-carousel-track has no .dl-carousel-slide children in', root);
      return;
    }

    this._snapshot = root.innerHTML; // destroy() restores this
    this.uid = `dlc-${++uidCounter}`;
    this.opts = this._parseOptions(options);
    this.current = 0;
    this._target = null; // pending goTo destination (rapid clicks)
    this._pointerDown = false;
    this._addedRootAttrs = [];
    this._prm = matchMedia('(prefers-reduced-motion: reduce)');
    this._ac = new AbortController();

    this._setupAria();
    this._buildControls();
    this._listen();
    this._commit();
    root._dlCarousel = this;
  }

  static autoInit(scope = document) {
    return [...scope.querySelectorAll('[data-slider]')].filter((el) => !el._dlCarousel).map((el) => new Slider(el));
  }

  /* ---- options ---------------------------------------------------------- */

  _parseOptions(js) {
    const d = this.root.dataset;
    const data = {};
    if (d.autoplay !== undefined) data.autoplay = parseInt(d.autoplay, 10) || 0;
    if (d.gallery !== undefined) data.gallery = d.gallery !== 'false';
    if (d.roledescription !== undefined) data.roledescription = d.roledescription;
    const opts = { ...DEFAULTS, ...data, ...js, labels: { ...DEFAULTS.labels, ...(js.labels || {}) } };
    if (opts.gallery && opts.autoplay) {
      console.warn('[dl-carousel] autoplay is ignored in gallery mode', this.root);
      opts.autoplay = 0;
    }
    return opts;
  }

  /* ---- ARIA setup ------------------------------------------------------- */

  _setRootAttr(name, value) {
    if (!this.root.hasAttribute(name)) this._addedRootAttrs.push(name);
    this.root.setAttribute(name, value);
  }

  _setupAria() {
    if (this.root.tagName !== 'SECTION') this._setRootAttr('role', 'region');
    if (this.opts.roledescription) this._setRootAttr('aria-roledescription', this.opts.roledescription);
    if (!this.root.hasAttribute('aria-label') && !this.root.hasAttribute('aria-labelledby')) {
      console.warn('[dl-carousel] give the slider an aria-label or aria-labelledby', this.root);
    }
    if (this.opts.gallery) return; // gallery slides become tabpanels later
    // <ul>/<li> keeps list semantics (count announcements) — leave it alone.
    // Non-list slides get the APG grouped-carousel treatment instead.
    if (!/^(UL|OL)$/.test(this.track.tagName)) {
      this.slides.forEach((s, i) => {
        s.setAttribute('role', 'group');
        s.setAttribute('aria-roledescription', 'slide');
        if (!s.hasAttribute('aria-label') && !s.hasAttribute('aria-labelledby')) {
          const h = s.querySelector('h2,h3,h4,h5,h6');
          if (h) {
            h.id ||= `${this.uid}-h-${i}`;
            s.setAttribute('aria-labelledby', h.id);
          } else {
            s.setAttribute('aria-label', `${i + 1} of ${this.slides.length}`);
          }
        }
      });
    }
  }

  /* ---- generated controls ------------------------------------------------ */

  _btn(cls, label, icon) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.setAttribute('aria-label', label);
    b.innerHTML = icon;
    return b;
  }

  _buildControls() {
    const L = this.opts.labels;
    const c = document.createElement('div');
    c.className = 'dl-carousel-controls';
    const prev = this._btn('dl-carousel-arrow dl-carousel-arrow--prev', L.prev, ICONS.prev);
    prev.addEventListener('click', () => this.prev(), { signal: this._ac.signal });
    const next = this._btn('dl-carousel-arrow dl-carousel-arrow--next', L.next, ICONS.next);
    next.addEventListener('click', () => this.next(), { signal: this._ac.signal });
    c.append(prev, next);
    if (!this.opts.gallery) {
      this.dots = document.createElement('div');
      this.dots.className = 'dl-carousel-dots';
      this.dots.setAttribute('role', 'group');
      this.dots.setAttribute('aria-label', L.dots);
      c.append(this.dots);
    }
    // Terse hidden status ("Slides 4–6 of 12"). Separate region, NOT the
    // track: a live track would announce every card on multi-card moves.
    this.status = document.createElement('div');
    this.status.className = 'dl-carousel-status dl-carousel-sr-only';
    this.status.setAttribute('aria-live', 'polite');
    this.status.setAttribute('aria-atomic', 'false');
    c.append(this.status);
    // DOM order = tab order: [pause] → prev → next → dots → track.
    this.root.insertBefore(c, this.track);
    this._controls = c;
    this._measure();
    this._rebuildDots();
  }

  /* ---- geometry ---------------------------------------------------------- */

  _measure() {
    const s = this.slides;
    const r0 = s[0].getBoundingClientRect();
    this.stride = s.length > 1 ? s[1].getBoundingClientRect().left - r0.left : r0.width || 1;
    if (this.stride <= 0) this.stride = r0.width || 1; // LTR assumed (v1)
    this.perView = Math.max(1, parseInt(getComputedStyle(this.root).getPropertyValue('--dlc-per-view'), 10) || 1);
  }

  _pages() {
    // Page start indexes, stepping by perView, last page clamped to the end.
    // n=7,v=3 → [0,3,4]; n=4,v=3 → [0,1]; n=6,v=3 → [0,3].
    const n = this.slides.length,
      v = this.perView;
    const last = Math.max(0, n - v);
    const starts = [];
    for (let i = 0; i < n; i += v) {
      const s = Math.min(i, last);
      if (starts[starts.length - 1] !== s) starts.push(s);
    }
    return starts;
  }

  _currentPage() {
    const ref = this._target ?? this.current;
    const p = this._pages();
    let best = 0;
    p.forEach((s, i) => {
      if (Math.abs(s - ref) < Math.abs(p[best] - ref)) best = i;
    });
    return best;
  }

  /* ---- navigation --------------------------------------------------------- */

  goTo(n, { behavior } = {}) {
    if (this._pointerDown) return; // never fight an active drag
    n = Math.max(0, Math.min(this.slides.length - 1, n));
    const t = this.track;
    // Compute the snap position ourselves — browsers (WebKit especially)
    // don't reliably re-snap after programmatic scrolls.
    const pad = parseFloat(getComputedStyle(t).scrollPaddingLeft) || 0;
    const left = Math.max(0, Math.min(this.slides[n].getBoundingClientRect().left - t.getBoundingClientRect().left - t.clientLeft + t.scrollLeft - pad, t.scrollWidth - t.clientWidth));
    if (Math.abs(left - t.scrollLeft) < 1) {
      this._commit(); // already there — scrollend won't fire, commit directly
      return;
    }
    this._target = n;
    t.scrollTo({
      left,
      behavior: behavior ?? (this._prm.matches ? 'auto' : 'smooth'),
    });
  }

  next() {
    const p = this._pages(),
      c = this._currentPage();
    this.goTo(c >= p.length - 1 ? 0 : p[c + 1]); // rewind past the end
  }

  prev() {
    const p = this._pages(),
      c = this._currentPage();
    this.goTo(c <= 0 ? p[p.length - 1] : p[c - 1]); // rewind before the start
  }

  /* ---- state: the single commit point -------------------------------------- */

  _listen() {
    const sig = this._ac.signal,
      t = this.track;
    if ('onscrollend' in window) {
      t.addEventListener('scrollend', () => this._commit(), { signal: sig });
    } else {
      // Fallback for engines without scrollend (e.g. iOS Safari < 26.2).
      t.addEventListener(
        'scroll',
        () => {
          clearTimeout(this._debounce);
          this._debounce = setTimeout(() => this._commit(), 150);
        },
        { passive: true, signal: sig },
      );
    }
    t.addEventListener(
      'pointerdown',
      () => {
        this._pointerDown = true;
        this.pause?.(); // user drag permanently stops autoplay (Task 4)
      },
      { signal: sig },
    );
    addEventListener(
      'pointerup',
      () => {
        this._pointerDown = false;
      },
      { signal: sig },
    );
    addEventListener(
      'pointercancel',
      () => {
        this._pointerDown = false;
      },
      { signal: sig },
    );
    this._ro = new ResizeObserver(() => {
      cancelAnimationFrame(this._raf);
      this._raf = requestAnimationFrame(() => {
        const before = this.perView;
        this._measure();
        if (this.perView !== before) this._rebuildDots();
        this.goTo(this.current, { behavior: 'auto' }); // re-align to a snap point
      });
    });
    this._ro.observe(t);
  }

  _commit() {
    this._target = null;
    this._measure();
    const idx = Math.max(0, Math.min(this.slides.length - 1, Math.round(this.track.scrollLeft / this.stride)));
    const changed = idx !== this.current;
    this.current = idx;
    this._updateDots();
    this._updateStatus();
    if (changed) {
      this._emit('dlc:change', { index: idx, page: this._currentPage(), slidesInView: this.perView });
    }
  }

  _rebuildDots() {
    if (!this.dots) return;
    const L = this.opts.labels,
      pages = this._pages(),
      total = this.slides.length;
    if (this.dots.children.length !== pages.length) {
      this.dots.textContent = '';
      pages.forEach((start) => {
        const from = start + 1,
          to = Math.min(start + this.perView, total);
        const label = this.perView > 1 ? fmt(L.gotoPage, { from, to }) : fmt(L.gotoSlide, { n: from });
        const b = this._btn('dl-carousel-dot', label, '');
        b.addEventListener('click', () => this.goTo(start), { signal: this._ac.signal });
        this.dots.append(b);
      });
    }
    this._updateDots();
  }

  _updateDots() {
    if (!this.dots) return;
    const page = this._currentPage();
    [...this.dots.children].forEach((b, i) => {
      b.classList.toggle('dl-carousel-dot--current', i === page);
      // aria-disabled (not disabled): the current dot stays focusable.
      if (i === page) b.setAttribute('aria-disabled', 'true');
      else b.removeAttribute('aria-disabled');
    });
  }

  _updateStatus() {
    const L = this.opts.labels,
      total = this.slides.length;
    const from = this.current + 1;
    const to = Math.min(this.current + this.perView, total);
    this.status.textContent = this.perView > 1 ? fmt(L.statusMulti, { from, to, total }) : fmt(L.statusSingle, { n: from, total });
  }

  /* ---- misc ----------------------------------------------------------------- */

  _emit(type, detail) {
    this.root.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
  }

  destroy() {
    if (!this.track) return;
    this._emit('dlc:destroy', {});
    this._ac.abort();
    clearInterval(this._timer);
    clearTimeout(this._debounce);
    cancelAnimationFrame(this._raf);
    this._ro?.disconnect();
    this._io?.disconnect();
    this.root.innerHTML = this._snapshot;
    for (const a of this._addedRootAttrs) this.root.removeAttribute(a);
    delete this.root._dlCarousel;
  }
}
```

- [ ] **Step 2: Write `src/auto.js` (CMS entry — replaces stub)**

```js
/**
 * CMS entry point: bundled to dist/dl-carousel.js (classic script).
 * Auto-initializes every [data-slider] on the page; exposes the class
 * as window.DLCarousel for page-level scripting.
 */
import { Slider } from './dl-carousel.js';

window.DLCarousel = Slider;

const run = () => Slider.autoInit();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run);
} else {
  run();
}
```

- [ ] **Step 3: Build**

Run: `npm run size`
Expected: builds clean; total well under 5120 B (engine alone ≈ 2–3 KB gzip).

- [ ] **Step 4: Verify controls + ARIA in the browser**

Playwright MCP, navigate to `file:///C:/Users/steve/Dev/custom-slider/demo/index.html`, viewport 1280×900:

1. `browser_evaluate`:
   ```js
   () => {
     const r = document.querySelector('[data-slider]');
     return {
       role: r.getAttribute('role'),
       roledesc: r.getAttribute('aria-roledescription'),
       arrows: r.querySelectorAll('.dl-carousel-arrow').length,
       dots: [...r.querySelectorAll('.dl-carousel-dot')].map((d) => d.getAttribute('aria-label')),
       currentDot: r.querySelector('.dl-carousel-dot[aria-disabled="true"]')?.getAttribute('aria-label'),
       status: r.querySelector('.dl-carousel-status').textContent,
       slideAria: r.querySelector('.dl-carousel-slide').getAttribute('role'), // null — <li> keeps list semantics
     };
   };
   ```
   Expected: `role: "region"`, `roledesc: "carousel"`, `arrows: 2`, dots = `["Go to slides 1–3", "Go to slides 4–6"]` (per-view 3 at this width), `currentDot: "Go to slides 1–3"`, `status: "Slides 1–3 of 6"`, `slideAria: null`.
2. `browser_snapshot` — confirm the a11y tree shows: region "Featured vehicles" → buttons Previous/Next → group "Choose slide" with 2 buttons → list of 6 items, all six cards' links present (nothing hidden).

- [ ] **Step 5: Verify navigation, rewind, drag-sync, events**

1. Arm an event log, then click next twice:
   `browser_evaluate`: `() => { window._log = []; document.querySelector('[data-slider]').addEventListener('dlc:change', e => window._log.push(e.detail)); }`
   `browser_click` on "Next slides" → wait ~700 ms → `browser_evaluate`: `() => ({ log: window._log, status: document.querySelector('.dl-carousel-status').textContent })`
   Expected: one `dlc:change` with `{index: 3, page: 1, slidesInView: 3}`; status `"Slides 4–6 of 6"`.
2. Click "Next slides" again → wait → expected **rewind**: `dlc:change` `{index: 0, page: 0}`, track `scrollLeft` back near 0.
3. Click "Previous slides" from page 0 → wait → expected rewind to the LAST page (`index: 3`).
4. Drag/scroll sync: `browser_evaluate`: `() => document.querySelector('.dl-carousel-track').scrollBy({left: 900, behavior: 'smooth'})` → wait ~800 ms → current dot flips to page 2 and status updates (the scrollend commit path).
5. Dot navigation: click the first dot → track animates back to 0.

- [ ] **Step 6: Verify reduced-motion + resize behavior**

1. Via `browser_run_code_unsafe`: `await page.emulateMedia({ reducedMotion: 'reduce' })`, then click "Next slides" and read `scrollLeft` **immediately** (~50 ms): it must already be at the target (instant jump, no smooth animation). Reset with `emulateMedia({ reducedMotion: null })`.
2. `browser_resize` to 375×812 → `browser_evaluate`: `() => document.querySelectorAll('.dl-carousel-dot').length` → expected **6** dots (per-view 1 → labels "Go to slide N"), current dot tracks the same slide.

- [ ] **Step 7: Commit**

```powershell
git add src/dl-carousel.js src/auto.js
git add -f dist/
git commit -m "Add slider engine with scroll-snap navigation, dots, and state tracking"
```

---

### Task 4: Autoplay + "Customer reviews" demo section

**Files:**

- Modify: `src/dl-carousel.js` (add pause button + autoplay methods; two splice edits shown below)
- Modify: `demo/index.html` (add reviews section)

**Interfaces:**

- Consumes: `this._btn`, `ICONS.pause/play`, `this.status`, `this.opts.autoplay`, `this._ac.signal`, `this._prm`, `this.next()`, `this._emit` from Task 3.
- Produces: `pause()` / `play()` public methods, `this.rotating` (bool), `this.pauseBtn`, events `dlc:autoplay-start` / `dlc:autoplay-stop`. `this.pause?.()` in the Task-3 pointerdown handler now resolves.

- [ ] **Step 1: Add the pause button to `_buildControls`**

In `src/dl-carousel.js`, immediately after the two lines

```js
const c = document.createElement('div');
c.className = 'dl-carousel-controls';
```

insert:

```js
if (this.opts.autoplay > 0) {
  // WCAG 2.2.2: a visible pause mechanism, FIRST in the tab sequence.
  this.pauseBtn = this._btn('dl-carousel-pause', L.pause, ICONS.pause);
  this.pauseBtn.addEventListener(
    'click',
    () => {
      this.rotating ? this.pause() : this.play();
    },
    { signal: this._ac.signal },
  );
  c.append(this.pauseBtn);
}
```

- [ ] **Step 2: Wire autoplay setup into the constructor**

Replace the constructor lines

```js
this._listen();
this._commit();
```

with:

```js
this._listen();
this._setupAutoplay();
this._commit();
```

- [ ] **Step 3: Add the autoplay section to the class** (insert the following methods after `_updateStatus()` and before `/* ---- misc ---- */`)

```js
  /* ---- autoplay --------------------------------------------------------- */

  _setupAutoplay() {
    if (!(this.opts.autoplay > 0)) return;
    const sig = this._ac.signal;
    this._suspended = new Set();      // temporary holds: hover / hidden / offscreen
    this._wasRotating = false;
    // Reduced motion: rotation never starts at all (APG example behavior).
    this.rotating = !this._prm.matches;
    this.root.addEventListener('pointerenter', () => this._suspend('hover'), { signal: sig });
    this.root.addEventListener('pointerleave', () => this._unsuspend('hover'), { signal: sig });
    // Keyboard focus anywhere in the carousel permanently stops rotation
    // (APG) — except on the pause button itself, so tabbing to it doesn't
    // flip the very state the user came to change.
    this.root.addEventListener('focusin', (e) => {
      if (this.pauseBtn.contains(e.target)) return;
      this.pause();
    }, { signal: sig });
    document.addEventListener('visibilitychange', () => {
      document.hidden ? this._suspend('hidden') : this._unsuspend('hidden');
    }, { signal: sig });
    this._io = new IntersectionObserver(([e]) => {
      e.isIntersecting ? this._unsuspend('offscreen') : this._suspend('offscreen');
    }, { threshold: 0.25 });
    this._io.observe(this.root);
    this._syncRotation();
  }

  /** Permanently stop rotation (only the pause/play button restarts it). */
  pause() {
    if (!this.rotating) return;
    this.rotating = false;
    this._syncRotation();
  }

  play() {
    if (!(this.opts.autoplay > 0) || this.rotating) return;
    this.rotating = true;
    this._syncRotation();
  }

  _suspend(why) { this._suspended.add(why); this._syncRotation(); }

  _unsuspend(why) { this._suspended.delete(why); this._syncRotation(); }

  _syncRotation() {
    clearInterval(this._timer);
    if (this.rotating && this._suspended.size === 0) {
      this._timer = setInterval(() => this.next(), this.opts.autoplay);
    }
    // While rotating, announcements are off (constant chatter);
    // when stopped, they're polite. (APG / WCAG 2.2.2)
    this.status.setAttribute('aria-live', this.rotating ? 'off' : 'polite');
    const L = this.opts.labels;
    this.pauseBtn.setAttribute('aria-label', this.rotating ? L.pause : L.play);
    this.pauseBtn.innerHTML = this.rotating ? ICONS.pause : ICONS.play;
    if (this.rotating !== this._wasRotating) {
      this._wasRotating = this.rotating;
      this._emit(this.rotating ? 'dlc:autoplay-start' : 'dlc:autoplay-stop', {});
    }
  }
```

- [ ] **Step 3b: Add the manual-init escape hatch to `autoInit`**

In `src/dl-carousel.js`, `static autoInit`, replace:

```js
      .filter((el) => !el._dlCarousel)
```

with:

```js
      .filter((el) => !el._dlCarousel && el.dataset.init !== 'manual')
```

Advanced sliders can then opt out of auto-init (`data-init="manual"`) and be constructed
from page script via `new window.DLCarousel(el, options)` with full JS options (custom
labels, event callbacks) — the escape hatch for OEM-specific behavior.

- [ ] **Step 4: Add the reviews section to `demo/index.html`** (insert before `</main>`)

```html
<section class="demo-section" aria-labelledby="reviews-h">
  <h2 id="reviews-h">Customer reviews</h2>
  <div class="dl-carousel demo-reviews" data-slider data-autoplay="5000" aria-labelledby="reviews-h">
    <ul class="dl-carousel-track">
      <li class="dl-carousel-slide">
        <figure class="demo-card demo-review">
          <blockquote><p>Painless from test drive to paperwork — in and out in two hours.</p></blockquote>
          <figcaption>— Dana W.</figcaption>
        </figure>
      </li>
      <li class="dl-carousel-slide">
        <figure class="demo-card demo-review">
          <blockquote><p>Fair trade-in value and no pressure. Second car we've bought here.</p></blockquote>
          <figcaption>— Marcus T.</figcaption>
        </figure>
      </li>
      <li class="dl-carousel-slide">
        <figure class="demo-card demo-review">
          <blockquote><p>Service department caught a recall I didn't know about. Honest people.</p></blockquote>
          <figcaption>— Priya S.</figcaption>
        </figure>
      </li>
      <li class="dl-carousel-slide">
        <figure class="demo-card demo-review">
          <blockquote><p>Found the exact trim I wanted and they delivered it to my office.</p></blockquote>
          <figcaption>— Colin R.</figcaption>
        </figure>
      </li>
      <li class="dl-carousel-slide">
        <figure class="demo-card demo-review">
          <blockquote><p>First-time buyer — they walked me through financing without the runaround.</p></blockquote>
          <figcaption>— Aisha B.</figcaption>
        </figure>
      </li>
      <li class="dl-carousel-slide">
        <figure class="demo-card demo-review">
          <blockquote><p>Five years of oil changes and never an upsell. That's why we come back.</p></blockquote>
          <figcaption>— Gene &amp; Marta L.</figcaption>
        </figure>
      </li>
    </ul>
  </div>
</section>
```

Also add to the demo `<style>` block:

```css
.demo-review {
  margin: 0;
  padding: 1rem;
}
.demo-review blockquote {
  margin: 0;
}
.demo-review figcaption {
  margin-block-start: 0.5rem;
  color: #555;
}
```

- [ ] **Step 5: Build** — Run: `npm run size`. Expected: passes, still under budget.

- [ ] **Step 6: Verify autoplay behavior in the browser**

Playwright MCP, fresh navigate, 1280×900. Scroll the reviews section into view first (`browser_evaluate`: `() => document.querySelector('.demo-reviews').scrollIntoView()`) — autoplay is suspended while offscreen, which is itself part of the design.

1. Initial state: `browser_evaluate` on `.demo-reviews`:
   ```js
   () => {
     const r = document.querySelector('.demo-reviews');
     const b = r.querySelector('.dl-carousel-pause');
     return { first: r.querySelector('.dl-carousel-controls').firstElementChild === b, label: b.getAttribute('aria-label'), live: r.querySelector('.dl-carousel-status').getAttribute('aria-live') };
   };
   ```
   Expected: `first: true`, `label: "Stop automatic slide show"`, `live: "off"`.
2. Advance: wait ~5.6 s (mouse NOT over the carousel) → `scrollLeft > 0` and status shows a later page.
3. Hover pause: `browser_hover` over the reviews track, wait 5.6 s → `scrollLeft` unchanged. Move hover away → advances again within ~5.6 s (hover is a temporary hold).
4. Focus = permanent stop: `browser_evaluate`: `() => document.querySelector('.demo-reviews .dl-carousel-arrow--next').focus()` → pause button label flips to "Start automatic slide show", `aria-live` becomes `"polite"`, and no advance happens after 5.6 s even after focus/hover leave.
5. Explicit restart: `browser_click` the pause/play button → label back to "Stop…", rotation resumes.
6. Reduced motion: `browser_run_code_unsafe` → `emulateMedia({ reducedMotion: 'reduce' })`, reload, scroll reviews into view, wait 5.6 s → **no rotation ever starts**; pause button shows "Start automatic slide show". Reset emulation.
7. Vehicles slider (no autoplay) still has NO `.dl-carousel-pause` button.
8. Manual-init opt-out: `browser_evaluate`: `() => { const el = document.createElement('div'); el.className = 'dl-carousel'; el.dataset.slider = ''; el.dataset.init = 'manual'; el.innerHTML = '<ul class="dl-carousel-track"><li class="dl-carousel-slide">x</li></ul>'; document.body.append(el); const n = window.DLCarousel.autoInit().length; const skipped = !el._dlCarousel; el.remove(); return { n, skipped }; }` → `{ n: 0, skipped: true }`.

- [ ] **Step 7: Commit**

```powershell
git add src/dl-carousel.js demo/index.html
git add -f dist/
git commit -m "Add autoplay with APG pause semantics and reviews demo section"
```

---

### Task 5: Thumbnail gallery (APG tabbed carousel) + demo section

**Files:**

- Modify: `src/dl-carousel.js` (gallery build/update methods; constructor + `_commit` splice edits)
- Modify: `demo/index.html` (add gallery section)

**Interfaces:**

- Consumes: `this._btn`, `fmt`, `this.opts.labels.thumbs/photo`, `this.uid`, `this.goTo`, `this.current`, `this._ac.signal` from Task 3.
- Produces: `.dl-carousel-thumbs[role=tablist] > .dl-carousel-thumb[role=tab]` DOM, slides upgraded to `role=tabpanel` with JS-managed `inert`, `this.tabs` (button array), `this.thumbsEl`.

- [ ] **Step 1: Wire gallery into the constructor**

Replace:

```js
this._setupAria();
this._buildControls();
```

with:

```js
this._setupAria();
this._buildControls();
if (this.opts.gallery) this._buildGallery();
```

- [ ] **Step 2: Wire gallery into the commit point**

In `_commit()`, replace:

```js
this._updateDots();
this._updateStatus();
```

with:

```js
this._updateDots();
this._updateStatus();
if (this.opts.gallery) this._updateGallery();
```

- [ ] **Step 3: Add the gallery section to the class** (insert after the autoplay methods, before `/* ---- misc ---- */`)

```js
  /* ---- gallery (APG tabbed carousel) ------------------------------------ */

  _buildGallery() {
    const L = this.opts.labels, sig = this._ac.signal;
    // Per APG tabbed-carousel: the panels wrapper is a polite live region.
    this.track.setAttribute('aria-live', 'polite');
    const list = document.createElement('div');
    list.className = 'dl-carousel-thumbs';
    list.setAttribute('role', 'tablist');
    list.setAttribute('aria-label', L.thumbs);
    this.tabs = this.slides.map((s, i) => {
      const img = s.querySelector('img');
      const name = (img && img.alt) || fmt(L.photo, { n: i + 1 });
      s.id ||= `${this.uid}-panel-${i}`;
      s.setAttribute('role', 'tabpanel');   // NO aria-roledescription="slide" here
      s.setAttribute('aria-label', name);
      const b = this._btn('dl-carousel-thumb', name, '');
      b.id = `${this.uid}-tab-${i}`;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', s.id);
      if (img) {
        const thumb = img.cloneNode();
        thumb.alt = '';                     // decorative — the tab carries the name
        thumb.loading = 'lazy';
        thumb.removeAttribute('fetchpriority');
        b.append(thumb);
      }
      b.addEventListener('click', () => this.goTo(i), { signal: sig });
      list.append(b);
      return b;
    });
    // Roving tabindex + automatic activation: arrow-focusing a tab shows it.
    list.addEventListener('keydown', (e) => {
      const n = this.tabs.length;
      let i = this.tabs.indexOf(e.target);
      if (i === -1) return;
      if (e.key === 'ArrowRight') i = (i + 1) % n;
      else if (e.key === 'ArrowLeft') i = (i - 1 + n) % n;
      else if (e.key === 'Home') i = 0;
      else if (e.key === 'End') i = n - 1;
      else return;
      e.preventDefault();
      this.tabs[i].focus();
      this.goTo(i);
    }, { signal: sig });
    this.root.append(list);
    this.thumbsEl = list;
  }

  _updateGallery() {
    this.slides.forEach((s, i) => {
      const active = i === this.current;
      // Never inert the panel holding focus — that would eject the user.
      if (!active && s.contains(document.activeElement)) return;
      s.inert = !active;
    });
    this.tabs.forEach((b, i) => {
      b.setAttribute('aria-selected', String(i === this.current));
      b.tabIndex = i === this.current ? 0 : -1;
    });
    // Keep the active thumb visible — strip-local math only; scrollIntoView
    // could scroll the PAGE (e.g. on init when the strip is below the fold).
    const strip = this.thumbsEl, b = this.tabs[this.current];
    const br = b.getBoundingClientRect(), sr = strip.getBoundingClientRect();
    if (br.left < sr.left) strip.scrollBy({ left: br.left - sr.left });
    else if (br.right > sr.right) strip.scrollBy({ left: br.right - sr.right });
  }
```

- [ ] **Step 4: Add the gallery section to `demo/index.html`** (insert between the vehicles and reviews sections). Note: `<div>` track/slides here, not `<ul>` — the slides become tabpanels.

```html
<section class="demo-section" aria-labelledby="gallery-h">
  <h2 id="gallery-h">Vehicle photos</h2>
  <div class="dl-carousel demo-gallery" data-slider data-gallery aria-labelledby="gallery-h">
    <div class="dl-carousel-track">
      <div class="dl-carousel-slide"><img src="img/photo-1.svg" width="1200" height="750" alt="Exterior front three-quarter view" /></div>
      <div class="dl-carousel-slide"><img src="img/photo-2.svg" width="1200" height="750" alt="Interior dashboard" loading="lazy" decoding="async" /></div>
      <div class="dl-carousel-slide"><img src="img/photo-3.svg" width="1200" height="750" alt="Rear cargo area" loading="lazy" decoding="async" /></div>
      <div class="dl-carousel-slide"><img src="img/photo-4.svg" width="1200" height="750" alt="Wheel and tire detail" loading="lazy" decoding="async" /></div>
      <div class="dl-carousel-slide"><img src="img/photo-5.svg" width="1200" height="750" alt="Back seat legroom" loading="lazy" decoding="async" /></div>
      <div class="dl-carousel-slide"><img src="img/photo-6.svg" width="1200" height="750" alt="Engine bay" loading="lazy" decoding="async" /></div>
    </div>
  </div>
</section>
```

- [ ] **Step 5: Build** — Run: `npm run size`. Expected: passes; if the total nears 5120 B, note the number in the task report (Task 6 gates it formally).

- [ ] **Step 6: Verify gallery semantics + behavior in the browser**

Playwright MCP, fresh navigate, 1280×900:

1. Semantics: `browser_evaluate`:
   ```js
   () => {
     const g = document.querySelector('.demo-gallery');
     return {
       tabs: g.querySelectorAll('[role="tab"]').length,
       tablistLabel: g.querySelector('[role="tablist"]').getAttribute('aria-label'),
       panels: g.querySelectorAll('[role="tabpanel"]').length,
       inerted: g.querySelectorAll('[role="tabpanel"][inert]').length,
       selected: g.querySelector('[role="tab"][aria-selected="true"]').getAttribute('aria-label'),
       tabindexes: [...g.querySelectorAll('[role="tab"]')].map((t) => t.tabIndex),
       noDots: !g.querySelector('.dl-carousel-dots'),
       trackLive: g.querySelector('.dl-carousel-track').getAttribute('aria-live'),
     };
   };
   ```
   Expected: `tabs: 6`, `tablistLabel: "Choose photo"`, `panels: 6`, `inerted: 5`, `selected: "Exterior front three-quarter view"`, `tabindexes: [0,-1,-1,-1,-1,-1]`, `noDots: true`, `trackLive: "polite"`.
2. Init must not scroll the page: after fresh load, `browser_evaluate` `() => scrollY` → `0`.
3. Thumb click: click the third thumb → main track animates to photo 3; after settle, `aria-selected` moves to tab 3, `inert` moves off panel 3 onto the others.
4. Keyboard: focus the active tab, `browser_press_key` ArrowRight → focus AND selection advance (automatic activation); Home/End jump to first/last.
5. Drag sync: `browser_evaluate` `() => document.querySelector('.demo-gallery .dl-carousel-track').scrollBy({left: 2000, behavior: 'smooth'})` → after settle, selected tab follows (one-directional flow: main's commit drives the tabs).
6. Focus-guard: focus tab 1, activate panel 2 via ArrowRight, then `browser_evaluate` `() => document.querySelector('.demo-gallery [role="tabpanel"]:first-child').hasAttribute('inert')` → `true` (focus is in the tablist, not the panel, so inert applies normally).
7. `browser_snapshot` — a11y tree shows tablist with 6 named tabs, exactly one non-inert tabpanel.

- [ ] **Step 7: Commit**

```powershell
git add src/dl-carousel.js demo/index.html
git add -f dist/
git commit -m "Add tabbed thumbnail gallery variant and demo section"
```

---

### Task 6: Usage docs — copy-paste snippets, options tables, README, size gate

**Files:**

- Modify: `demo/index.html` (add `<details>` snippet + options table per variation, footer)
- Create: `README.md`

**Interfaces:**

- Consumes: everything shipped in Tasks 1–5.
- Produces: the v1 deliverable — self-documenting demo + README with the verification checklist.

- [ ] **Step 1: Add a copy-paste block after EACH demo slider** (inside each `<section>`, after the `.dl-carousel` div). All three shown; note the HTML inside `<code>` is entity-escaped.

Vehicles section:

```html
<details>
  <summary>Copy-paste HTML + options</summary>
  <pre><code>&lt;div class="dl-carousel" data-slider aria-label="Featured vehicles"&gt;
  &lt;ul class="dl-carousel-track"&gt;
    &lt;li class="dl-carousel-slide"&gt;…card content…&lt;/li&gt;
    &lt;!-- more slides --&gt;
  &lt;/ul&gt;
&lt;/div&gt;</code></pre>
  <p>Set slides-per-view in CSS (no JS breakpoints):</p>
  <pre><code>.my-slider { --dlc-per-view: 1; }
@media (min-width: 640px)  { .my-slider { --dlc-per-view: 2; } }
@media (min-width: 1024px) { .my-slider { --dlc-per-view: 3; } }</code></pre>
  <table>
    <caption>
      Data attributes
    </caption>
    <tr>
      <th>Attribute</th>
      <th>Default</th>
      <th>Effect</th>
    </tr>
    <tr>
      <td><code>data-slider</code></td>
      <td>—</td>
      <td>Auto-initialize this element</td>
    </tr>
    <tr>
      <td><code>data-autoplay="4000"</code></td>
      <td>0 (off)</td>
      <td>Advance every N ms; adds a pause button</td>
    </tr>
    <tr>
      <td><code>data-gallery</code></td>
      <td>off</td>
      <td>Thumbnail-gallery (tabbed) variant</td>
    </tr>
    <tr>
      <td><code>data-roledescription="…"</code></td>
      <td>carousel</td>
      <td>Screen-reader role description; empty string to omit</td>
    </tr>
  </table>
</details>
```

Gallery section:

```html
<details>
  <summary>Copy-paste HTML + options</summary>
  <pre><code>&lt;div class="dl-carousel" data-slider data-gallery aria-label="Vehicle photos"&gt;
  &lt;div class="dl-carousel-track"&gt;
    &lt;div class="dl-carousel-slide"&gt;&lt;img src="…" width="1200" height="750" alt="Describe the photo"&gt;&lt;/div&gt;
    &lt;!-- more photos; use divs (slides become tabpanels), not ul/li --&gt;
  &lt;/div&gt;
&lt;/div&gt;</code></pre>
  <p>
    Thumbnails are generated from each slide's image; the image <code>alt</code> names the thumbnail tab. Real photos should also carry <code>srcset</code>/<code>sizes</code> — size
    <code>sizes</code> to ONE slide's rendered width, never <code>100vw</code>.
  </p>
</details>
```

Reviews section:

```html
<details>
  <summary>Copy-paste HTML + options</summary>
  <pre><code>&lt;div class="dl-carousel" data-slider data-autoplay="5000" aria-label="Customer reviews"&gt;
  &lt;ul class="dl-carousel-track"&gt;
    &lt;li class="dl-carousel-slide"&gt;…review…&lt;/li&gt;
  &lt;/ul&gt;
&lt;/div&gt;</code></pre>
  <p>
    Autoplay pauses on hover, stops permanently on keyboard focus or drag (the pause button restarts it), never starts under <code>prefers-reduced-motion</code>, and rewinds at the end — no cloned
    slides.
  </p>
</details>
```

- [ ] **Step 2: Add the demo footer** (before `</main>`)

```html
<footer class="demo-section">
  <h2>Notes</h2>
  <ul>
    <li><strong>No JavaScript?</strong> Every slider degrades to a swipeable snap strip; all content stays visible and indexable.</li>
    <li><strong>SEO:</strong> all slides ship in the initial HTML, nothing is cloned — every heading and link exists exactly once.</li>
    <li>
      <strong>Include once per page:</strong> <code>dl-carousel.css</code> + <code>dl-carousel.js</code> (defer). See the <a href="../README.md">README</a> for the JS API and the verification
      checklist.
    </li>
  </ul>
</footer>
```

- [ ] **Step 3: Write `README.md`**

```markdown
# Custom Slider

Dependency-free scroll-snap slider/carousel. ~4 KB gzip total (JS+CSS), no build
step required to use, themed entirely with CSS custom properties. Built to be
maintained in-house: the whole engine is one commented file, `src/dl-carousel.js`.

The browser owns the physics (touch, drag, momentum, snapping — CSS
`scroll-snap`); the JS only wires controls, state, autoplay, and the gallery
variant. Rewind instead of infinite loop: no cloned slides, so no duplicate
content for SEO and no screen-reader confusion.

## Quick start (CMS / classic script)

    <link rel="stylesheet" href="dl-carousel.css">
    <script src="dl-carousel.js" defer></script>

    <div class="dl-carousel my-slider" data-slider aria-label="Featured vehicles">
      <ul class="dl-carousel-track">
        <li class="dl-carousel-slide">…</li>
        <li class="dl-carousel-slide">…</li>
      </ul>
    </div>

    <style>
      .my-slider { --dlc-per-view: 1; }
      @media (min-width: 640px)  { .my-slider { --dlc-per-view: 2; } }
      @media (min-width: 1024px) { .my-slider { --dlc-per-view: 3; } }
    </style>

Every `[data-slider]` element initializes automatically. Slides-per-view is CSS,
not a JS option — set `--dlc-per-view` per breakpoint.

## Quick start (ES module)

    import { Slider } from './src/dl-carousel.js';
    const slider = new Slider(document.querySelector('.my-slider'), { autoplay: 4000 });

JS options override data attributes, which override defaults.

## Markup contract

- Root: `class="dl-carousel"` (+ `data-slider` for auto-init) with `aria-label` or `aria-labelledby`.
- Track: one `.dl-carousel-track` child — `<ul>` for card carousels, `<div>` for `data-gallery`.
- Slides: `.dl-carousel-slide` children. All real content (headings, links, images) goes
  in the HTML — the engine never injects content, only controls.
- Images: always `width`/`height`; first visible image eager (add
  `fetchpriority="high"` only if the slider is above the fold); later slides
  `loading="lazy" decoding="async"`; `sizes` = one slide's rendered width.
- Missing pieces fail loudly in the console at init.

## Options

| Option            | Data attribute         | Default         | Effect                                                                        |
| ----------------- | ---------------------- | --------------- | ----------------------------------------------------------------------------- |
| `autoplay`        | `data-autoplay="4000"` | `0`             | Advance every N ms; adds pause button (first in tab order)                    |
| `gallery`         | `data-gallery`         | `false`         | Tabbed thumbnail gallery (thumbs generated from slide images)                 |
| `roledescription` | `data-roledescription` | `"carousel"`    | Empty string to omit                                                          |
| `labels`          | — (JS only)            | English strings | All UI text, for localization — see `DEFAULTS.labels` in `src/dl-carousel.js` |
| —                 | `data-init="manual"`   | auto            | Skip auto-init; construct via `new DLCarousel(el, opts)` from page script     |

## CSS custom properties

`--dlc-per-view`, `--dlc-gap`, `--dlc-peek` (edge sliver of the next slide),
`--dlc-arrow-size/fg/bg`, `--dlc-dot-size/fg/current`, `--dlc-controls-space`,
`--dlc-thumb-w/h`, `--dlc-focus`. Set them on the `.dl-carousel` element or any wrapper.

## JS API

Methods: `goTo(n)`, `next()`, `prev()`, `pause()`, `play()`, `destroy()`,
`Slider.autoInit(scope?)`. Instance is at `element._dlCarousel`.
Events (bubble from the root): `dlc:change` `{index, page, slidesInView}`,
`dlc:autoplay-start`, `dlc:autoplay-stop`, `dlc:destroy`.

## Accessibility behavior (by design — don't "fix" these)

- Multi-card: ALL cards stay in the tab order and accessibility tree — no
  `inert`/`aria-hidden` on off-screen cards (hiding corrupts announced counts).
- Dots are one per PAGE of slides, plain buttons (not tabs); current dot is
  `aria-disabled`, still focusable.
- Gallery: full APG tabbed-carousel — thumbs are a `tablist` with roving
  tabindex and arrow keys; non-visible panels are `inert`.
- Autoplay: pause button first in tab order; hover pauses temporarily; focus or
  drag stops permanently (only the button restarts); never starts under
  `prefers-reduced-motion`; status announcements are off while rotating.
- Every programmatic scroll resolves smooth-vs-instant from
  `prefers-reduced-motion` at call time. Never add CSS `scroll-behavior`.

## Advanced use (escape hatches)

- **Manual init:** add `data-init="manual"` and construct from page script:
  `new DLCarousel(el, { autoplay: 6000, labels: { next: 'Next vehicles' } })`.
- **Custom callbacks:** listen for `dlc:change` on the root (bubbles) — e.g. update
  a counter, lazy-init a map, sync anything to the current slide.
- **Synchronized sliders:** wire two instances in page script:
  `a.addEventListener('dlc:change', e => b._dlCarousel.goTo(e.detail.index))` —
  `goTo` is idempotent, so feedback loops settle naturally.
- **OEM styling:** override `--dlc-*` custom properties per site/brand — no engine edits.

## Swapping the engine later (the dl-carousel contract)

The HTML on the sites is the stable API; this engine is an implementation detail.
Any future engine (third-party or rewrite) must honor the same contract, and then
replacing it = replacing the contents of the two dist files, with zero site edits:

1. Consume `.dl-carousel[data-slider] > .dl-carousel-track > .dl-carousel-slide+`
   with all content authored in the HTML; generate its own controls (never require
   control markup in the CMS).
2. Honor the data attributes (`data-autoplay`, `data-gallery`, `data-roledescription`,
   `data-init`) and the `--dlc-*` theming knobs.
3. Emit the `dlc:*` events with the same payloads and expose
   `goTo/next/prev/pause/play/destroy` + `DLCarousel.autoInit`.
4. Keep the accessibility behaviors listed above — they are part of the contract,
   not this engine's private choices.

## Development

    npm install
    npm run build   # src → dist (esbuild)
    npm run size    # build + gzip budget gate (fails > 5 KB total)
    npm run serve   # http://127.0.0.1:8137 (for Lighthouse)

`src/` is the canonical, readable code; `dist/` is the checked-in CMS build.
Rebuild and re-commit `dist/` whenever `src/` changes.

## Verification checklist (run before shipping changes)

1. `npm run size` passes.
2. Demo page: Lighthouse accessibility = 100, performance ≈ 100, CLS = 0.
3. Keyboard-only: tab order is pause → prev → next → dots → cards; gallery
   tabs respond to Arrow/Home/End; focus is never trapped or lost.
4. Autoplay: pauses on hover, stops on focus/drag, button restarts, nothing
   rotates under emulated `prefers-reduced-motion`.
5. Screenshots at 375 / 768 / 1280 look right; slides-per-view matches the
   breakpoints.
6. With JavaScript disabled the strips still scroll and all content is visible.
7. Spot-checks: Windows Firefox at 125–150 % DPI; Tab into cards in Safari;
   one pre-2025 iPhone (scrollend fallback).

## Known limitations (v1)

- LTR only. No infinite loop (rewind by design). No fade mode. `gallery` +
  `autoplay` together is unsupported (autoplay is ignored, console warning).
- iOS flicks advance ~one slide per gesture (WebKit limitation) — arrows/dots
  are the primary traversal there.
```

- [ ] **Step 4: Rebuild + final size gate**

Run: `npm run size`
Expected: PASS with the final total printed. Record the exact number for the ship report.

- [ ] **Step 5: Quick browser sanity check**

Navigate the demo; `browser_evaluate`: `() => document.querySelectorAll('details').length` → 3; footer present; all three sliders still initialize (no console errors via `browser_console_messages`).

- [ ] **Step 6: Commit**

```powershell
git add demo/index.html README.md
git add -f dist/
git commit -m "Add usage docs, copy-paste snippets, and README"
```

---

### Task 7: Full verification sweep (Lighthouse, keyboard, screenshots, reduced motion)

**Files:**

- Modify: whatever the sweep flags (fix at root cause; never relax a check to pass).

**Interfaces:**

- Consumes: the complete demo + README.
- Produces: evidence for the ship report — Lighthouse scores, CLS number, byte sizes, screenshot set.

- [ ] **Step 1: Start the dev server** — Run `npm run serve` as a background task. URL: `http://127.0.0.1:8137/demo/index.html`.

- [ ] **Step 2: Lighthouse** — chrome-devtools MCP `lighthouse_audit` on that URL (mobile defaults).
      Expected: **Accessibility = 100**; Performance ≥ 95 with **CLS = 0**; SEO ≥ 95. Anything lower: read the failing audits, fix at the source (CSS/engine/demo markup), rebuild, rerun.

- [ ] **Step 3: Keyboard-only walkthrough** (Playwright MCP, 1280×900)
      Tab from the page top; verify encounter order in the reviews slider is pause → prev → next → dots → first card content; in the gallery it's prev → next → panels/tablist. Arrow/Home/End work in the tablist. `:focus-visible` ring is visible on every control (screenshot one). No focus trap; Shift+Tab walks back out cleanly.

- [ ] **Step 4: Screenshot set** — `browser_take_screenshot` at 375×812, 768×1024, 1280×900 (full page). Slides-per-view = 1 / 2 / 3 respectively in vehicles + reviews; gallery always 1 + thumb strip. Save to the scratchpad and reference paths in the report.

- [ ] **Step 5: Reduced-motion sweep** — `emulateMedia({ reducedMotion: 'reduce' })` + reload: no autoplay anywhere; arrow clicks jump instantly; gallery arrow-key activation still works (instant).

- [ ] **Step 6: No-JS sweep** — new context with JS disabled (as Task 2 Step 4): all three strips render laid-out and scrollable; every heading/link/image present; zero generated controls.

- [ ] **Step 7: CLS trace** — chrome-devtools MCP `performance_start_trace` → reload → `performance_stop_trace`; confirm layout-shift total 0.000 on the demo. (This is the by-construction claim — verify it, don't assume it.)

- [ ] **Step 8: Console hygiene** — `browser_console_messages` after a full interaction pass: no errors, no engine warnings (the aria-label warning must not fire on the demo).

- [ ] **Step 9: Stop the server, fix anything found, rebuild, commit**

```powershell
git add -A
git commit -m "Fix issues found in verification sweep"
```

(Skip the commit if the sweep found nothing — say so in the report.)

---

## Plan Self-Review (completed)

- **Spec coverage:** §2 requirements → Tasks 2 (CSS/no-JS/CLS), 3 (engine/a11y core), 4 (autoplay/WCAG 2.2.2), 5 (gallery/APG tabbed), 6 (docs/budget), 7 (verification). §7 a11y contract items all appear in Task 3/4/5 code. §9 image rules in Task 2/5 markup + README. §11 verification = Task 7. §12 risks: markup validation (Task 3 constructor), no-scroll-while-pointer-down (Task 3 `goTo`), scrollend fallback (Task 3 `_listen`).
- **Placeholder scan:** stubs in Task 1 are the build pipeline's real content, replaced wholesale by complete code in Task 3 — no "TODO/similar-to" anywhere.
- **Type consistency:** labels keys, method names (`_syncRotation`, `_updateGallery`, `pause`/`play`), fields (`this.tabs`, `this.thumbsEl`, `this.pauseBtn`, `this.rotating`) cross-checked between Tasks 3/4/5 splice edits.
- **Known deviation from spec file map:** adds `src/auto.js` (keeps `dl-carousel.js` side-effect-free) and `scripts/` — both noted in the File Map.
