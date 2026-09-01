# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A dependency-free scroll-snap carousel (`cs`) built to replace third-party slider libraries on DealerOn CMS sites. Two shipped files, no runtime dependencies, about 6.0 KB gzip total against a 6656 B budget.

`README.md` is the public API reference (markup contract, options, CSS custom properties, JS API, accessibility behaviors, verification checklist) — read it before changing anything user-facing. The design rationale behind each decision is in `docs/superpowers/specs/2026-07-13-custom-slider-design.md`; the per-task build log and the triaged backlog of known non-blocking issues are in `.superpowers/sdd/progress.md` (git-ignored).

## Commands

```bash
npm run build          # src → dist via esbuild (bundle+minify JS, minify CSS)
npm run size           # build + gzip budget gate — FAILS at ≥ 6656 B total
npm run validate       # stylelint (files + generated) + eslint + prettier --check + check:looks  (the gate before committing)
npm run check:looks    # asserts the demo data holds: 17 old skins -> 7 components, 32 brand presets, no cramped preset
npm run lint:css:generated # stylelints the CSS the copy panel ships (the card/pattern rules that live in JS template literals)
npm run lint:css:fix   # stylelint --fix on src/**/*.css and demo/assets/*.css
npm run lint:js:fix    # eslint --fix on src/**/*.js, demo/assets/*.js and scripts/
npm run format         # prettier --write .
npm run serve          # esbuild static server on http://127.0.0.1:8137 (for Lighthouse/demo)
```

**Three demo pages.** `demo/index.html` is the workbench: a rail of 17 patterns, a settings panel, a live stage, a slide-content editor and a code panel, with no per-example markup at all. The content editor makes the slides themselves editable (headings, links, photos, alt text), so the snippet is a finished block rather than a template someone retypes into; `state.content` holds the edited rows, null means "use the example content", and it is kept per pattern in localStorage. `demo/patterns.html` renders every pattern and look at once, built by `gallery.js` from the same generator. `demo/reference.html` is the technical guide — markup contract, options, properties, accessibility, limits. `demo/assets/`: `looks.js` (7 card components, the census's 17 OEM "skins" collapsed into them — most differed only in values), `brands.js` (32 brand presets), `workbench.js` (the state object driving everything), `guide.js` (the reference content), `gallery.js` (the patterns page), `cms-paths.js` (the platform image paths), `highlight.js` (the Monokai tokeniser), `theme.js` (light/dark), `ui.css` (all demo chrome).

**Card LOOKS collapse into components; PATTERNS do not.** A look is values on one card (a band colour, a type case). A pattern is a different structure — tabs over panes, a filter bar, a lightbox trigger, a grid of cards each holding a slider. Collapsing looks was right; a first pass also dropped ten patterns with them and they had to be restored. `htmlFor()` builds the structural ones from one `carousel()` helper, and `cssFor()` scopes to the wrapper for those: `%root%` means the carousel, `%wrap%` the outer element.

**Two rules the pattern CSS must follow.** Every card sets its own `font-size` and `line-height`, and any element styled as a block says `display: block` — an inline `<span>` takes the host page's leading, and a `<strong>` with no size takes the host's font-size, so the card ships taller than the preview showed. And an arrow overlays media but never text: a text card reserves a gutter with `padding-inline: calc(var(--cs-arrow-size) + 0.4em)`. The check for both is the paste-parity test in the verification checklist — drop each snippet into a hostile host page and the rendered slide must match to the pixel.

**Code parity is structural, not policed.** `cssFor(sel)` and `htmlFor(cls)` in `workbench.js` are the ONLY producers of CSS and markup. The live preview is `cssFor('.wb-live')`; the copy panel is `cssFor('.my-slider')`. Same function, one argument different - so the code you copy cannot drift from the slider you are looking at. The preview adds exactly ONE thing the copy does not: a `--cs-per-view` pin resolved at the width button you have pressed. A media query asks the WINDOW, but the preview is a 750/970/1170px box inside a much wider one, so the ladder's top tier used to win whatever the box was set to - with the frame at 750, editing "992 and up" changed nothing you could see. `cssFor(sel, preview)` appends that pin after the media queries; the copied CSS still ships the real ladder, because a dealer page is the width it is. The previous demo hand-wrote its recipes beside the live examples and needed a checker (`check-recipes.mjs`, now deleted) to catch the drift; generating both removes the failure mode instead of policing it.

**Lengths are `em`, never `rem` — enforced.** `rem` is locked to `<html>`, and Bootstrap 3 (what the storefronts run) sets `html { font-size: 10px }`, so every `rem` shipped at 62.5% on a real dealer page: card names rendered 10px where the demo showed 16, and the reserved dot row fell to 25px against a 24px dot hit box. The card CSS sizes everything off `font-size: var(--cargo-font, 1em)` on the carousel root, so `1em` inherits the site body and a length pins it. The generated controls carry `font: inherit` because a `<button>` otherwise takes 13.33px Arial and `em` inside it would mean something else. `unit-disallowed-list` in `.stylelintrc.generated.json` fails the build on a new `rem`.

**The CSS in JS template literals is linted too.** `npm run lint:css` only sees `.css` FILES, and about 15 KB of this project — every card and pattern rule, i.e. exactly what the copy panel hands a designer to paste onto a live site — lives in template literals in `demo/assets/*.js`. `scripts/lint-generated-css.mjs` closes that hole by running the real generator (`cssFor`) and stylelinting its output, so what is checked is what ships and cannot drift from it. Source-layout rules (one declaration per line, blank lines between rules) are off in `.stylelintrc.generated.json` because the card CSS is deliberately compact; the semantic ones — property order, the `rem` ban, hex length, zero units — are on.

**What `npm run validate` guards beyond the linters is the data.** `scripts/check-looks.mjs` asserts every one of the 17 old skins is claimed by exactly one component, that a component absorbing nothing is deliberately marked `isNew`, that all 32 brand presets name a real look and land on a card no narrower than that look needs - and that no look sets `padding`/`padding-block` on the carousel root. That last one is a fixed bug: the engine reserves the dot row as `padding-bottom` on the root, a look's CSS lands on that same element, and the shorthand silently wiped the reservation so the dots drew on top of the last row of card text.

There is no test framework (deliberate, spec §1 non-goals). Verification is the browser checklist in README "Verification checklist" — run it, don't skip to a size check and call it verified.

`.claude/settings.json` registers a PostToolUse hook (`scripts/claude-format-hook.js`) that auto-fixes each file Claude edits with the same fixers. It never blocks; `npm run validate` is still the real gate.

## Architecture

**CSS owns layout and physics; JS only wires controls and state.** `src/custom-slider.css` makes the track a native scroll container with `scroll-snap`, so swipe/drag/momentum/snapping work before any JS runs and still work with JS disabled. `src/custom-slider.js` adds prev/next/dots/pause/thumbs into space the CSS already reserved (`--cs-controls-space`) — that reservation is why CLS is 0. Don't move layout decisions into JS. One deliberate exception: `_wireDrag()` adds mouse drag-to-scroll (default on, `data-cs-drag="false"` opts out) because native scroll containers never mouse-drag — it disables snap only during the gesture and restores it in `_commit()` at the settled snap position.

**Two entry points, one class.** `src/custom-slider.js` exports `CustomSlider` (ES module consumers). `src/auto.js` is the CMS entry: it assigns `window.CustomSlider` and auto-inits on `DOMContentLoaded`. esbuild bundles `auto.js` → `dist/custom-slider.js` as an IIFE. The class has ONE name in source and on the page — the old split (`Slider` in source, `DLCarousel` on the page) is gone, and nothing should reintroduce a second alias.

**`dist/` is checked into git** even though it's in `.prettierignore`. Rebuild and commit `dist/` in the same commit whenever `src/` changes, or the demo and every consuming site keep running the old engine. `demo/index.html` loads `../dist/*`, so a demo check after a `src/` edit is meaningless without a build.

**Demo assets are classic scripts on purpose.** ES modules are blocked over `file://`, and the demo has to open by double-click as well as over HTTP, so `demo/assets/*.js` are plain scripts that hang off `globalThis.CARGO`. `check-looks.mjs` reads them with `new Function` for the same reason.

**One commit point for state.** `_commit()` (fired by `scrollend`, or a 150 ms debounced `scroll` fallback for pre-26.2 iOS Safari) is the only place `this.current` changes and the only place `cs:change` is emitted. Selection UI updates _optimistically_ at activation via `this._target` + `_updateUI()`, so dots/tabs/status move on click, not ~900 ms later when the scroll settles; `_commit()` clears `_target`.

**Pages, not slides.** Arrows and dots step by page by default; `data-cs-step="slide"` switches arrows/autoplay to one-card steps, and `data-cs-step="N"` (a positive integer) steps N cards at a time. Dots stay per-page in every case, and the final stop is always the end, so the last click never leaves a part-page. `_measure()` reads `--cs-per-view` off computed style, `_pages()` derives page start indexes with the last page clamped to the end, `_stops()` is what the arrows walk. Slides-per-view is CSS-only by design — never add a JS breakpoint option.

**Teardown.** All listeners are registered with `{ signal: this._ac.signal }` from one `AbortController`; `destroy()` aborts it, disconnects the observers, restores `this._snapshot` (root `innerHTML` captured at construction) and removes only the root attributes it added (`_addedRootAttrs`). Any new listener/observer/timer must join this scheme.

## Hard constraints

**The HTML is the stable API; the engine is an implementation detail.** Class names (`cs`, `-track`, `-slide`, generated control classes), data attributes, `--cs-*` properties, `cs:*` event payloads, the public methods, and the accessibility behaviors are a frozen contract — sites can't be edited when the engine changes (README "Swapping the engine later"). Adding is fine; renaming or repurposing is not.

**Byte budget: < 6656 B gzip for `dist` JS+CSS combined, enforced by `npm run size`.** It is a positioning target (beat Splide 15.8 KB / Embla core 6.7 KB), not a technical limit — the rationale and the raise history live in `scripts/size.mjs`. Raise it only for a correctness or accessibility need, and record why there; features should have to fit. Note that gzip locality makes size intuition unreliable: merging two duplicate rules once made the CSS _bigger_ because it separated a selector from its sibling. Always measure with `npm run size` rather than reasoning about byte counts.

**Never do these** (each one is a fixed bug, documented in the source comments — the review agents keep re-proposing them):

- Never set CSS `scroll-behavior` on the track. Safari hijacks intended-instant programmatic scrolls. Every scroll passes `behavior` per call, resolved from `prefers-reduced-motion` _at call time_.
- Never `inert`/`aria-hidden` off-screen cards in the multi-card variants — hiding them corrupts announced counts. (`inert` on non-visible panels is correct in `gallery` mode only, and never on a panel containing focus.)
- Never use Chromium-only platform features in the core. The full list from the original plan: `scrollsnapchange` / `scrollsnapchanging`, `::scroll-button`, `::scroll-marker` / `scroll-marker-group`, `scroll-state()`, `interactivity: inert`, `scrollIntoView({container})`.
- `scroll-snap-type: x mandatory` goes on the TRACK, never on the root scroller, and the track carries `overscroll-behavior-x: contain` so a horizontal flick never turns into a page-level back-navigation. Moving the snap type up to the root breaks the reserved-space layout the controls depend on.
- Never `scroll-snap-stop: always` — it blocks multi-slide flicks and hit a Firefox bug.
- Never make the track itself the live region; the terse `.cs-status` region exists precisely so multi-card moves don't announce every card.
- Never inject slide content. The engine generates controls only — all headings, links, and images come from the authored HTML (SEO + no-JS requirement). Thumbs build a fresh `<img>` rather than cloning, so site ids/srcset don't leak.
- Never `scrollIntoView()` a thumb; use strip-local `scrollBy` math, or init below the fold scrolls the whole page.
- Never delete `.cs-track::-webkit-scrollbar` as redundant with `scrollbar-width: none`. It looks like 20 free bytes and isn't: Android WebView has NO support for `scrollbar-width` at all (Chrome 121 / Firefox 64 / Safari 18.2, but `webview_android: false`). In-app browsers are real dealer traffic, and removing it ships them a visible scrollbar under the strip. Both rules stay.

**v1 scope limits:** LTR only, no infinite loop (rewind or stop), `gallery` + `autoplay` unsupported (autoplay ignored with a console warning), `gallery` + `fade` unsupported (fade ignored with a console warning; fade itself shipped 2026-08-18 — a 1-up stacked crossfade, see README `data-cs-fade`).

## Conventions

- Formatting: Prettier, `printWidth: 200`, single quotes in JS / double in CSS. Long single-line statements in the engine are the formatter's output, not a style choice — don't hand-wrap them.
- CSS: stylelint standard + `recess-order` (property order is enforced). Kebab-case selectors with BEM `--` modifiers. Logical properties (`inline-size`, `inset-inline`) are the house style; the few remaining physical ones are a known backlog nit.
- Missing markup fails loudly: `console.error` for a missing track/slides, `console.warn` for a missing `aria-label` or a conflicting option combination. Keep that pattern for new validation.
- Extending behavior belongs in page script, not the engine — listen for `cs:change` (bubbles from the root) or read the instance at `element._cs`. `workbench.js`'s `wireVideo()` (posters opening a native `<dialog>`) is the reference example.
