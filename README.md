# Custom Slider

Dependency-free scroll-snap slider/carousel. ~4.7 KB gzip total (JS+CSS), no build
step required to use, themed entirely with CSS custom properties. Built to be
maintained in-house: the whole engine is one commented file, `src/dl-carousel.js`.

The browser owns the physics (touch, drag, momentum, snapping — CSS
`scroll-snap`); the JS only wires controls, state, autoplay, and the gallery
variant — plus the one physics gap browsers leave open: mouse drag-to-scroll
(native scroll containers don't drag with a mouse; `data-drag="false"` opts out). Rewind instead of infinite loop: no cloned slides, so no duplicate
content for SEO and no screen-reader confusion.

The demo page (`demo/index.html`) doubles as the variation catalog — every
section is a copy-paste recipe over the same two files.

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

| Option            | Data attribute         | Default         | Effect                                                                                                                       |
| ----------------- | ---------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `autoplay`        | `data-autoplay="4000"` | `0`             | Advance every N ms; adds pause button (first in tab order)                                                                   |
| `rewind`          | `data-rewind="false"`  | `true`          | Arrows wrap at the ends; `false` stops there and `aria-disable`s the end arrow (ignored with autoplay, which needs the wrap) |
| `step`            | `data-step="slide"`    | `"page"`        | `"slide"` advances one card per arrow click / autoplay tick instead of a full page; dots still represent pages               |
| `drag`            | `data-drag="false"`    | `true`          | Mouse drag-to-scroll on the track (click-through suppressed after a real drag); touch/pen swiping is native and unaffected   |
| `gallery`         | `data-gallery`         | `false`         | Tabbed thumbnail gallery (thumbs generated from slide images)                                                                |
| `roledescription` | `data-roledescription` | `"carousel"`    | Empty string to omit                                                                                                         |
| `labels`          | — (JS only)            | English strings | All UI text, for localization — see `DEFAULTS.labels` in `src/dl-carousel.js`                                                |
| —                 | `data-init="manual"`   | auto            | Skip auto-init; construct via `new DLCarousel(el, opts)` from page script                                                    |

## CSS custom properties

`--dlc-per-view`, `--dlc-gap`, `--dlc-peek` (edge sliver of the next slide),
`--dlc-arrow-size/fg/bg`, `--dlc-dot-size/fg/current`, `--dlc-controls-space`,
`--dlc-thumb-w/h`, `--dlc-focus`. Set them on the `.dl-carousel` element or any wrapper.

## JS API

Methods: `goTo(n)`, `next()`, `prev()`, `pause()`, `play()`, `destroy()`,
`DLCarousel.autoInit(scope?)` (classic script) / `Slider.autoInit(scope?)` (ES module). Instance is at `element._dlCarousel`.
Events (bubble from the root): `dlc:change` `{index, page, slidesInView}`,
`dlc:autoplay-start`, `dlc:autoplay-stop`, `dlc:destroy`.

## Accessibility behavior (by design — don't "fix" these)

- Multi-card: ALL cards stay in the tab order and accessibility tree — no
  `inert`/`aria-hidden` on off-screen cards (hiding corrupts announced counts).
- A `<ul>`/`<ol>` track gets `role="list"` re-applied at init. The library's own
  `list-style: none` makes WebKit drop list semantics, which would silently kill
  the "N of 6" count announcements in Safari/VoiceOver — don't remove it.
- Dots are one per PAGE of slides, plain buttons (not tabs); current dot is
  `aria-disabled`, still focusable.
- Gallery: full APG tabbed-carousel — thumbs are a `tablist` with roving
  tabindex and arrow keys; non-visible panels are `inert`. The visible panel
  takes `tabindex="0"`: it holds no focusable content, and without it Chrome
  puts an unnamed tab stop on the scrolling track instead (it does that for any
  scroll container with no focusable children). Gallery tab order is
  prev → next → panel → selected thumb.
- Autoplay: pause button first in tab order; hover pauses temporarily; focus or
  drag stops permanently (only the button restarts); never starts under
  `prefers-reduced-motion`, and turning that setting on mid-session stops a
  rotation already running; status announcements are off while rotating.
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
2. Honor the data attributes (`data-autoplay`, `data-rewind`, `data-step`,
   `data-drag`, `data-gallery`, `data-roledescription`, `data-init`) and the `--dlc-*` theming knobs.
3. Emit the `dlc:*` events with the same payloads and expose
   `goTo/next/prev/pause/play/destroy` + `DLCarousel.autoInit`.
4. Keep the accessibility behaviors listed above — they are part of the contract,
   not this engine's private choices.

## Development

    npm install
    npm run build   # src → dist (esbuild)
    npm run size    # build + gzip budget gate (fails at or over 6 KB total)
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

- LTR only. No infinite loop — the ends rewind by default, or stop with
  `data-rewind="false"`. No fade mode. `gallery` + `autoplay` together is
  unsupported (autoplay is ignored, console warning).
- iOS flicks advance ~one slide per gesture (WebKit limitation) — arrows/dots
  are the primary traversal there.
