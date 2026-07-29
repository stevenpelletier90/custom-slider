# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A dependency-free scroll-snap carousel (`dl-carousel`) built to replace third-party slider libraries on DealerOn CMS sites. Two shipped files, no runtime dependencies, ~5 KB gzip total.

`README.md` is the public API reference (markup contract, options, CSS custom properties, JS API, accessibility behaviors, verification checklist) — read it before changing anything user-facing. The design rationale behind each decision is in `docs/superpowers/specs/2026-07-13-custom-slider-design.md`; the per-task build log and the triaged backlog of known non-blocking issues are in `.superpowers/sdd/progress.md` (git-ignored).

## Commands

```bash
npm run build          # src → dist via esbuild (bundle+minify JS, minify CSS)
npm run size           # build + gzip budget gate — FAILS at ≥ 6144 B total
npm run validate       # stylelint + eslint + prettier --check  (the gate before committing)
npm run lint:css:fix   # stylelint --fix on src/**/*.css
npm run lint:js:fix    # eslint --fix on src/**/*.js and scripts/
npm run format         # prettier --write .
npm run serve          # esbuild static server on http://127.0.0.1:8137 (for Lighthouse/demo)
```

There is no test framework (deliberate, spec §1 non-goals). Verification is the browser checklist in README "Verification checklist" — run it, don't skip to a size check and call it verified.

`.claude/settings.json` registers a PostToolUse hook (`scripts/claude-format-hook.js`) that auto-fixes each file Claude edits with the same fixers. It never blocks; `npm run validate` is still the real gate.

## Architecture

**CSS owns layout and physics; JS only wires controls and state.** `src/dl-carousel.css` makes the track a native scroll container with `scroll-snap`, so swipe/drag/momentum/snapping work before any JS runs and still work with JS disabled. `src/dl-carousel.js` adds prev/next/dots/pause/thumbs into space the CSS already reserved (`--dlc-controls-space`) — that reservation is why CLS is 0. Don't move layout decisions into JS.

**Two entry points, one class.** `src/dl-carousel.js` exports `Slider` (ES module consumers). `src/auto.js` is the CMS entry: it assigns `window.DLCarousel = Slider` and auto-inits on `DOMContentLoaded`. esbuild bundles `auto.js` → `dist/dl-carousel.js` as an IIFE. The class is `Slider` in source and `DLCarousel` on the page — both names are part of the documented API.

**`dist/` is checked into git** even though it's in `.prettierignore`. Rebuild and commit `dist/` in the same commit whenever `src/` changes, or the demo and every consuming site keep running the old engine. `demo/index.html` loads `../dist/*`, so a demo check after a `src/` edit is meaningless without a build.

**One commit point for state.** `_commit()` (fired by `scrollend`, or a 150 ms debounced `scroll` fallback for pre-26.2 iOS Safari) is the only place `this.current` changes and the only place `dlc:change` is emitted. Selection UI updates _optimistically_ at activation via `this._target` + `_updateUI()`, so dots/tabs/status move on click, not ~900 ms later when the scroll settles; `_commit()` clears `_target`.

**Pages, not slides.** Arrows and dots step by page. `_measure()` reads `--dlc-per-view` off computed style, `_pages()` derives page start indexes with the last page clamped to the end. Slides-per-view is CSS-only by design — never add a JS breakpoint option.

**Teardown.** All listeners are registered with `{ signal: this._ac.signal }` from one `AbortController`; `destroy()` aborts it, disconnects the observers, restores `this._snapshot` (root `innerHTML` captured at construction) and removes only the root attributes it added (`_addedRootAttrs`). Any new listener/observer/timer must join this scheme.

## Hard constraints

**The HTML is the stable API; the engine is an implementation detail.** Class names (`dl-carousel`, `-track`, `-slide`, generated control classes), data attributes, `--dlc-*` properties, `dlc:*` event payloads, the public methods, and the accessibility behaviors are a frozen contract — sites can't be edited when the engine changes (README "Swapping the engine later"). Adding is fine; renaming or repurposing is not.

**Byte budget: < 6144 B gzip for `dist` JS+CSS combined, enforced by `npm run size`.** It is a positioning target (beat Splide 15.8 KB / Embla core 6.7 KB), not a technical limit — the rationale and the raise history live in `scripts/size.mjs`. Raise it only for a correctness or accessibility need, and record why there; features should have to fit. Note that gzip locality makes size intuition unreliable: merging two duplicate rules once made the CSS _bigger_ because it separated a selector from its sibling. Always measure with `npm run size` rather than reasoning about byte counts.

**Never do these** (each one is a fixed bug, documented in the source comments — the review agents keep re-proposing them):

- Never set CSS `scroll-behavior` on the track. Safari hijacks intended-instant programmatic scrolls. Every scroll passes `behavior` per call, resolved from `prefers-reduced-motion` _at call time_.
- Never `inert`/`aria-hidden` off-screen cards in the multi-card variants — hiding them corrupts announced counts. (`inert` on non-visible panels is correct in `gallery` mode only, and never on a panel containing focus.)
- Never use Chromium-only platform features (`::scroll-marker`, `scrollsnapchange`, `scroll-state()`, `scrollIntoView({container})`) in the core.
- Never `scroll-snap-stop: always` — it blocks multi-slide flicks and hit a Firefox bug.
- Never make the track itself the live region; the terse `.dl-carousel-status` region exists precisely so multi-card moves don't announce every card.
- Never inject slide content. The engine generates controls only — all headings, links, and images come from the authored HTML (SEO + no-JS requirement). Thumbs build a fresh `<img>` rather than cloning, so site ids/srcset don't leak.
- Never `scrollIntoView()` a thumb; use strip-local `scrollBy` math, or init below the fold scrolls the whole page.

**v1 scope limits:** LTR only, no infinite loop (rewind or stop), no fade mode, `gallery` + `autoplay` unsupported (autoplay ignored with a console warning).

## Conventions

- Formatting: Prettier, `printWidth: 200`, single quotes in JS / double in CSS. Long single-line statements in the engine are the formatter's output, not a style choice — don't hand-wrap them.
- CSS: stylelint standard + `recess-order` (property order is enforced). Kebab-case selectors with BEM `--` modifiers. Logical properties (`inline-size`, `inset-inline`) are the house style; the few remaining physical ones are a known backlog nit.
- Missing markup fails loudly: `console.error` for a missing track/slides, `console.warn` for a missing `aria-label` or a conflicting option combination. Keep that pattern for new validation.
- Extending behavior belongs in page script, not the engine — listen for `dlc:change` (bubbles from the root) or read the instance at `element._dlCarousel`. `demo/index.html`'s page scripts (sliding bar thumb, thumb drag-scroll) are the reference examples of this.
