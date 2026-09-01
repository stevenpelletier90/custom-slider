# Custom Slider

Dependency-free scroll-snap slider/carousel. ~6.0 KB gzip total (JS+CSS), no build
step required to use, themed entirely with CSS custom properties. Built to be
maintained in-house: the whole engine is one commented file, `src/custom-slider.js`.

The browser owns the physics (touch, drag, momentum, snapping — CSS
`scroll-snap`); the JS only wires controls, state, autoplay, and the gallery
variant — plus the one physics gap browsers leave open: mouse drag-to-scroll
(native scroll containers don't drag with a mouse; `data-cs-drag="false"` opts out). Rewind instead of infinite loop: no cloned slides, so no duplicate
content for SEO and no screen-reader confusion.

The demo page (`demo/index.html`) is a workbench: pick a pattern, set it up
(how many across at each breakpoint, card style, brand preset, arrow colours,
how many cards an arrow moves), and copy code generated from those same
settings — so the snippet is always exactly the slider on screen. It also hands
you `custom-slider.css` and `custom-slider.js` themselves, to link or to paste.

## Quick start (CMS / classic script)

    <link rel="stylesheet" href="custom-slider.css">
    <script src="custom-slider.js" defer></script>

    <div class="cs my-slider" data-cs aria-label="Featured vehicles">
      <ul class="cs-track">
        <li class="cs-slide">…</li>
        <li class="cs-slide">…</li>
      </ul>
    </div>

    <style>
      .my-slider { --cs-per-view: 1; }
      @media (min-width: 640px)  { .my-slider { --cs-per-view: 2; } }
      @media (min-width: 1024px) { .my-slider { --cs-per-view: 3; } }
    </style>

Every `[data-cs]` element initializes automatically. Slides-per-view is CSS,
not a JS option — set `--cs-per-view` per breakpoint.

## Quick start (ES module)

    import { CustomSlider } from './src/custom-slider.js';
    const slider = new CustomSlider(document.querySelector('.my-slider'), { autoplay: 4000 });

JS options override data attributes, which override defaults.

## Markup contract

- Root: `class="cs"` (+ `data-cs` for auto-init) with `aria-label` or `aria-labelledby`.
- Track: one `.cs-track` child — `<ul>` for card carousels, `<div>` for `data-cs-gallery`.
- Slides: `.cs-slide` children. All real content (headings, links, images) goes
  in the HTML — the engine never injects content, only controls.
- Images: always `width`/`height`; first visible image eager (add
  `fetchpriority="high"` only if the slider is above the fold); later slides
  `loading="lazy" decoding="async"`; `sizes` = one slide's rendered width.
- Missing pieces fail loudly in the console at init.

## Options

| Option            | Data attribute            | Default         | Effect                                                                                                                                                                                                          |
| ----------------- | ------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autoplay`        | `data-cs-autoplay="4000"` | `0`             | Advance every N ms; adds pause button (first in tab order)                                                                                                                                                      |
| `rewind`          | `data-cs-rewind="false"`  | `true`          | Arrows wrap at the ends; `false` stops there and `aria-disable`s the end arrow (ignored with autoplay, which needs the wrap)                                                                                    |
| `step`            | `data-cs-step="slide"`    | `"page"`        | `"slide"` advances one card per arrow click / autoplay tick instead of a full page; a positive integer (`data-cs-step="3"`) advances that many. Dots still represent pages, and the last stop is always the end |
| `drag`            | `data-cs-drag="false"`    | `true`          | Mouse drag-to-scroll on the track (click-through suppressed after a real drag); touch/pen swiping is native and unaffected                                                                                      |
| `fade`            | `data-cs-fade`            | `false`         | Stacked crossfade instead of a scrolling track — 1-up heroes; no drag/peek, ignored with `gallery`                                                                                                              |
| `gallery`         | `data-cs-gallery`         | `false`         | Tabbed thumbnail gallery (thumbs generated from slide images)                                                                                                                                                   |
| `roledescription` | `data-cs-roledescription` | `"carousel"`    | Empty string to omit                                                                                                                                                                                            |
| `labels`          | — (JS only)               | English strings | All UI text, for localization — see `DEFAULTS.labels` in `src/custom-slider.js`                                                                                                                                 |
| —                 | `data-cs-init="manual"`   | auto            | Skip auto-init; construct via `new CustomSlider(el, opts)` from page script                                                                                                                                     |

## The optional card-looks file

`dist/custom-slider-cards.css` (~2 KB gzip) is a **separate, optional** stylesheet
holding the seven card looks and a set of column classes. The engine ships no card
styling on purpose — `cs-*` is mechanism, `cargo-*` is content — so without it every
slider has to paste its own `<style>` block. Link it once and a slider becomes a
markup paste:

```html
<link rel="stylesheet" href="/path/custom-slider.css" />
<link rel="stylesheet" href="/path/custom-slider-cards.css" />
<script src="/path/custom-slider.js" defer></script>

<div class="cs cargo-tile cs-xs-2 cs-sm-3 cs-md-4 cs-lg-5" data-cs aria-label="Our models">
  <ul class="cs-track">
    …
  </ul>
</div>
```

Looks: `cargo-tile`, `cargo-vcard`, `cargo-wordmark`, `cargo-split`, `cargo-portrait`,
`cargo-logo`, `cargo-location`. Columns: `cs-xs-N` / `cs-sm-N` / `cs-md-N` / `cs-lg-N`
for N of 1–8, on Bootstrap 3's tiers. Anything you change from a look's defaults goes
in a short `<style>` block beside the markup — the builder writes only the differences.

It is **generated** from the same look definitions the builder draws with
(`scripts/build-cards.mjs`), so the file and the preview cannot disagree. It is not
counted against the byte budget below: a site that links no card looks pays none of it.

## CSS custom properties

All eighteen: `--cs-per-view`, `--cs-gap`, `--cs-peek` (edge sliver of the next
slide), `--cs-arrow-size/fg/bg`, `--cs-arrow-fg-hover/bg-hover`,
`--cs-dot-size/fg/current`, `--cs-controls-space`, `--cs-thumb-w/h`,
`--cs-thumb-hover-scale` (gallery thumb zoom on hover; `1` turns it off),
`--cs-focus`, `--cs-transition` (duration+easing for control colour transitions),
`--cs-fade-ms` (crossfade duration in fade mode). Set them on the `.cs` element or any wrapper.

Spacing defaults are **`em`, never `rem`**. `rem` is locked to `<html>`, and
Bootstrap 3 — which the storefronts run — sets `html { font-size: 10px }`, so
every `rem` shipped at 62.5% of its intended size on a real dealer page (the
reserved dot row fell to 25px against a 24px dot hit box). `em` tracks whatever
the host sets on `body`, so the slider scales with the page it is pasted into.
The generated controls carry `font: inherit` for the same reason: a `<button>`
otherwise takes 13.33px Arial, and `em` inside it would mean something different
from `em` outside it.

## JS API

Methods: `goTo(n)`, `next()`, `prev()`, `pause()`, `play()`, `destroy()`,
`CustomSlider.autoInit(scope?)` — the same name whether loaded as a classic script (`window.CustomSlider`) or imported as an ES module. Instance is at `element._cs`.
Events (bubble from the root): `cs:change` `{index, page, slidesInView}`,
`cs:autoplay-start`, `cs:autoplay-stop`, `cs:destroy`.

## Accessibility behavior (by design — don't "fix" these)

- Multi-card: ALL cards stay in the tab order and accessibility tree — no
  `inert`/`aria-hidden` on off-screen cards (hiding corrupts announced counts).
- A `<ul>`/`<ol>` track gets `role="list"` re-applied at init. The library's own
  `list-style: none` makes WebKit drop list semantics, which would silently kill
  the "N of 6" count announcements in Safari/VoiceOver — don't remove it.
- Dots are one per PAGE of slides, plain buttons (not tabs); current dot is
  `aria-disabled`, still focusable.
- When every slide already fits, the arrows and dots are hidden and the root
  gains `data-cs-fits` — controls that cannot move anything must not be focusable,
  and a one-of-one dot group announces a choice that isn't one. It is
  re-evaluated on resize, because slides-per-view is CSS. Style on `data-cs-fits`
  if you want the reserved control space to collapse too.
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
- Fade: slides are stacked in one grid cell, so every non-current slide is
  `inert` — the same carve-out `gallery` mode has, and the reason the multi-card
  "never inert off-screen cards" rule does not apply here (fade is 1-up, so no
  count is corrupted). A slide containing focus is never inerted. Fade never
  scrolls, so `goTo()` is its commit point instead of `scrollend`.
- Fade's stacking CSS is keyed to `data-cs-fade-on`, which **the engine sets at
  init** — never to the authored `data-cs-fade`. JS decides which slide is visible,
  so if the stacking applied without JS every slide would sit at opacity 0 and
  the whole carousel would vanish. With JS off the track stays an ordinary
  scrollable strip with all slides visible. `destroy()` removes the marker.
- Every programmatic scroll resolves smooth-vs-instant from
  `prefers-reduced-motion` at call time. Never add CSS `scroll-behavior`.

## Advanced use (escape hatches)

- **Manual init:** add `data-cs-init="manual"` and construct from page script:
  `new CustomSlider(el, { autoplay: 6000, labels: { next: 'Next vehicles' } })`.
- **Custom callbacks:** listen for `cs:change` on the root (bubbles) — e.g. update
  a counter, lazy-init a map, sync anything to the current slide.
- **Synchronized sliders:** wire two instances in page script:
  `a.addEventListener('cs:change', e => b._cs.goTo(e.detail.index))` —
  `goTo` is idempotent, so feedback loops settle naturally.
- **OEM styling:** override `--cs-*` custom properties per site/brand — no engine edits.

## Swapping the engine later (the Custom Slider contract)

The HTML on the sites is the stable API; this engine is an implementation detail.
Any future engine (third-party or rewrite) must honor the same contract, and then
replacing it = replacing the contents of the two dist files, with zero site edits:

1. Consume `.cs[data-cs] > .cs-track > .cs-slide+`
   with all content authored in the HTML; generate its own controls (never require
   control markup in the CMS).
2. Honor the data attributes (`data-cs-autoplay`, `data-cs-rewind`, `data-cs-step`,
   `data-cs-drag`, `data-cs-fade`, `data-cs-gallery`, `data-cs-roledescription`, `data-cs-init`) and the `--cs-*` theming knobs.
3. Emit the `cs:*` events with the same payloads and expose
   `goTo/next/prev/pause/play/destroy` + `CustomSlider.autoInit`.
4. Keep the accessibility behaviors listed above — they are part of the contract,
   not this engine's private choices.

## Putting it on a DealerOn site

[docs/cms-implementation.md](docs/cms-implementation.md) — where the files go,
the markup contract, replacement codes, per-OEM theming, and the ladder for each
brand's model bar.

**The shared-path question is answered: the engine IS hosted**, at
`/assets/shared/CustomHTMLFiles/Responsive/Apps/customSlider/`. Verified
2026-08-31: `dl-carousel.js` served from there is byte-identical to this repo's
build, and at least one designer test page is already built against it using the
old `dl-carousel` classes and `data-slider`.

That matters more than a filename. **The contract is only free to rename while
nothing consumes it, and something now does** — so before republishing under the
`custom-slider.{css,js}` / `cs-*` names, find every page pointing at the old
files and move it, or host both side by side. Re-uploading renamed files over
the old paths silently strips the controls off every existing page.

## Development

    npm install
    npm run build   # src → dist (esbuild)
    npm run size    # build + gzip budget gate (fails at or over 6656 B / 6.5 KB total)
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
7. Widen until every slide fits: the arrows and dots disappear (the root gains
   `data-cs-fits`), and narrowing brings them back. Controls that cannot move
   anything must not be focusable.
8. Paste parity: drop a generated snippet into a page with hostile typography
   (serif, 19px, line-height 2.1) at the same container width. The rendered
   slide must match the preview to the pixel — a mismatch means a card is
   inheriting the host's leading or font-size instead of setting its own.
9. Spot-checks: Windows Firefox at 125–150 % DPI; Tab into cards in Safari;
   one pre-2025 iPhone (scrollend fallback).

## Known limitations (v1)

- LTR only. No infinite loop — the ends rewind by default, or stop with
  `data-cs-rewind="false"`. `gallery` + `autoplay` together is
  unsupported (autoplay is ignored, console warning).
- iOS flicks advance ~one slide per gesture (WebKit limitation) — arrows/dots
  are the primary traversal there.
