---
paths:
  - "src/**"
  - "dist/**"
  - "scripts/size.mjs"
  - "tests/install.test.mjs"
  - "demo/assets/{brands,looks,patterns}.js"
---

# Engine (`src/`, `dist/`)

**`npm run build` writes four files** — `dist/dealeron-slider.{css,js}` readable,
`dist/dealeron-slider.min.{css,js}` minified. Everything runs the `.min` pair; the readable pair is
for reading, and `src/` keeps the comments. The install panel offers a Download per file plus
**Download all four**; each button's `data-file` names the file, and `tests/install.test.mjs` checks
saved name and bytes together.

## Architecture

**CSS owns layout and physics; JS only wires controls and state.** `src/dealeron-slider.css` makes the
track a native `scroll-snap` container, so swipe/drag/momentum/snap work with JS disabled.
`src/dealeron-slider.js` adds prev/next/dots/pause/thumbs into space the CSS reserved
(`--dos-controls-space`) — why CLS is 0. Keep layout decisions out of JS. One exception:
`_wireDrag()` adds mouse drag-to-scroll (`data-dos-drag="false"` opts out), disabling snap only
during the gesture and restoring it in `_commit()`.

**Two entry points, one class.** `src/dealeron-slider.js` exports `DealerOnSlider`; `src/auto.js` (the
CMS entry) assigns `window.DealerOnSlider` and auto-inits on `DOMContentLoaded`; esbuild bundles it to
`dist/dealeron-slider.min.js` as an IIFE. One class name in source and on the page — no second alias.

**The engine is LINKED, never pasted.** A page gets the two `.min` files from two head tags and no
other way: a pasted engine can never be fixed, and nothing records which sites carry which build.
Add a paste-the-engine route only for a real page that cannot reach the shared folder, and ship it
with a test. The per-slider CSS the copy panel emits IS pasted (Style Only, Head Section), which is
why `.stylelintrc.json` pins `rgba()` to the legacy form.

**One commit point for state.** `_commit()` (`scrollend`, or a 150 ms debounced `scroll` fallback
for pre-26.2 iOS Safari) is the only place `this.current` changes and `dos:change` fires — except
fade, which never scrolls, so `goTo()` commits inline and any post-change bookkeeping goes in both.
Selection UI updates optimistically at activation via `this._target` + `_updateUI()`; `_commit()`
clears `_target`.

**Pages, not slides.** Arrows and dots step by page; `data-dos-step="slide"` or `"N"` steps cards.
Dots stay per-page, and the final stop is always the end. `_measure()` reads `--dos-per-view` from
computed style, `_pages()` derives page starts with the last clamped to the end, `_stops()` is what
the arrows walk. Slides-per-view is CSS-only — no JS breakpoint option.

**A slider auto-inited inside a `[hidden]` tab pane heals itself on reveal** through its
ResizeObserver, so no slick-style `height:0` hack is needed (verified empirically).

**Teardown.** Every listener registers with `{ signal: this._ac.signal }`; `destroy()` aborts,
disconnects observers, restores `this._snapshot` and removes only `_addedRootAttrs`. Any new
listener/observer/timer joins this scheme.

## Hard constraints

**Byte budget: < 6656 B gzip for `dist` JS+CSS combined, enforced by `npm run size`.** A positioning
target (beat Splide 15.8 KB / Embla core 6.7 KB); rationale and raise history live in
`scripts/size.mjs`. Raise it only for a correctness or accessibility need and record why there. Gzip
locality makes size intuition unreliable — always measure.

**Never do these** (each is a fixed bug documented in source comments; review agents keep
re-proposing them):

- Never CSS `scroll-behavior: smooth` on the track — Safari hijacks intended-instant scrolls. Every
  scroll passes `behavior` per call, resolved from `prefers-reduced-motion` at call time.
  `scroll-behavior: auto` IS set there deliberately: `scrollTo({behavior:'auto'})` defers to the
  property, so a host's global `* { scroll-behavior: smooth }` would capture every instant scroll,
  reduced-motion path included. `tests/engine.test.mjs` holds both.
- Never `inert`/`aria-hidden` off-screen cards in the multi-card variants — it corrupts announced
  counts. (`inert` on non-visible panels is correct in `gallery` mode only, never on a panel
  containing focus.)
- Never use Chromium-only platform features in the core: `scrollsnapchange` / `scrollsnapchanging`,
  `::scroll-button`, `::scroll-marker` / `scroll-marker-group`, `scroll-state()`,
  `interactivity: inert`, `scrollIntoView({container})`.
- `scroll-snap-type: x mandatory` goes on the TRACK, never the root scroller (it breaks the
  reserved-space layout), and the track carries `overscroll-behavior-x: contain` so a flick never
  becomes back-navigation.
- Never `scroll-snap-stop: always` — it blocks multi-slide flicks and hit a Firefox bug.
- Never make the track the live region; the terse `.dos-status` region exists so multi-card moves
  don't announce every card.
- Never "fix" the IntersectionObserver to read `intersectionRatio` instead of `e.isIntersecting`.
  Three separate reviews have filed this on the reading that `isIntersecting` means "any pixel", so
  a 0.25 threshold lets autoplay resume on a sliver. Browsers set `isIntersecting` from the
  THRESHOLD INDEX: with a single 0.25 threshold it is false below that crossing. Probed directly on
  Chromium, Firefox and WebKit (2026-09-15), walking a target 0 → 10% → 50% → 10% → 0 — every one
  reports `{ ratio: 0.1, isIntersecting: false }` coming back DOWN through the threshold, and
  reports nothing at all at 10% going up. `tests/engine.test.mjs` walks it in both directions now;
  the ascending half alone proved nothing, because no callback fires there.
- Never inject slide content. The engine generates controls only; headings, links and images come
  from the authored HTML (SEO + no-JS). Thumbs build a fresh `<img>` rather than cloning, so site
  ids/srcset don't leak.
- Never `scrollIntoView()` a thumb; use strip-local `scrollBy` math, or init below the fold scrolls
  the whole page.
- Keep `.dos-track::-webkit-scrollbar` alongside `scrollbar-width: none`: Android WebView has no
  `scrollbar-width` support, and in-app browsers are real dealer traffic.
- Never set a `--dos-*` knob on a WRAPPER and expect it to reach the slider. The engine declares
  every one of them inside its own `.dos { }` block, and a property set ON an element beats the same
  property INHERITED from an ancestor at any specificity. `--dos-focus` on `.cargo-lb` was silently
  dead while Cadillac's identical override worked, because a brand's props land on `.dos` itself.
  Scope to `.dos`, or to the element (2026-09-15).
- Never copy an OEM's weaknesses. A measured value is the FLOOR, not the target (Steven's standing
  rule, 2026-09-15): record the live values in `brands.js` as the audit trail, then look at phone
  and tablet as a designer would and fix what is weak (wrapped tab rows, cramped cards, oversized
  arrows) as pattern defaults or knobs, and say in the report which choices depart from the live
  site and why. "The live site does it too" is no reason to leave it. Colour is the sharpest case:
  Ford's measured `#919191` arrow was 3.15:1 on white and 2.77:1 on the `#f0f0f0` its own tab cells
  draw — a 1.4.11 failure, taken on by copying, against the pattern's own 15.13:1 default. Measure
  the ratio against the band the control actually sits on, not against white.

**A card look owns the responsive arrow ladder, and a brand that sets `--dos-arrow-size` leaves it.**
The looks shrink the arrow 44 → 36 at 767 → 32 at 575 from the shared card sheet at (0,1,0); a
brand's props reach the snippet at (0,2,0) with no media query and win at every width. Measured
2026-09-15: a plain paste goes 44/36/32 while `tabs × ford` renders 25×25 at 1280, 700 and 390
alike. So set `--dos-arrow-size` in a preset only when the measurement genuinely needs it — an OEM's
35px slick arrow is smaller than our 44px default and is not worth the ladder.

**v1 scope limits:** LTR only, no infinite loop (rewind or stop), `gallery` + `autoplay` unsupported
(autoplay ignored with a console warning), `gallery` + `fade` unsupported (fade ignored with a
console warning; fade is a 1-up stacked crossfade, see README `data-dos-fade`).
