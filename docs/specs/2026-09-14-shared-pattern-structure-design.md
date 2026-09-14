# Shared pattern structure — the snippet ships values and markup, the shared files ship the rest

2026-09-14. Proposed after the Chevrolet tabbed-bar work; Steven asked where a slider's CSS and JS
should live once there are many replacement codes and many dealers. Not started. This is the design
he reviews before a plan is written.

## The problem

A pasted snippet carries three kinds of thing today, and only one of them is the dealer's:

| In the Chevrolet tabbed bar's snippet | Size (gzip) | Whose is it                                   |
| ------------------------------------- | ----------- | --------------------------------------------- |
| Knob values on the root               | ~15 lines   | The dealer's. Differs per site.               |
| The tab row's structural rules        | ~40 lines   | The pattern's. Identical on every tabbed bar. |
| The tab script                        | 0.8 KB      | The pattern's. Identical on every tabbed bar. |
| The markup                            | 18.5 KB     | The dealer's content. Not code.               |

Two of the four are the same bytes on every site that pastes the pattern, and a pasted copy can
never be fixed — the argument this project already made on 2026-09-08 when the card styles moved out
of the snippet and into `custom-slider.min.css`. Six of the 21 patterns ship a script; every
structural pattern ships rules. As replacement codes are added, that duplicated structure grows one
pattern at a time, and a bug in the tab script has to be re-pasted on every Chevrolet site to fix.

**The platform makes this worse, measured:** `chevroletdemo1.dealeron.com` serves no site
stylesheet. Its theme CSS arrives as six inline `<style>` blocks totalling 287 KB in a 469 KB page,
each block marked with the file it was aggregated from. Style Only CSS rides the same way: in the
page HTML, on every page load, never cached across pages. Every line a snippet ships is paid for on
every view; a line in the linked engine file is paid for once per site.

## The decision

**A snippet ships only what is the dealer's: knob values on the root, and the markup.** Pattern
structure (the rules a pattern adds around the engine) and pattern scripts ship in the shared files
every site already links, the way the seven card looks do.

Concretely:

- `custom-slider.min.css` gains a third section behind a `/*! patterns */` marker, built by
  `scripts/build-cards.mjs` (renamed or joined by a `build-patterns` step) from each pattern's `css`
  in `patterns.js`, scoped by a pattern class the markup already carries or gains
  (`cargo-tabs-wrap`, `cargo-hero`, …) and weakened with `:where()` where it is a parent, exactly as
  `weaken()` does for looks. `npm run size` keeps weighing the ENGINE alone by splitting on the
  markers.
- `custom-slider.min.js` gains the six pattern scripts, each guarded the way `guarded()` wraps them
  today and each keyed on the data attribute the markup already carries (`[data-tabs]`,
  `[data-filter-gallery]`, `[data-lightbox]`, `[data-bar]`, the two video posters). A page with none
  of that markup runs none of it.
- `cssFor()` emits the root declarations and any rule a pattern marks as per-slider (there should be
  none; a pattern that needs one is a pattern whose value is not a knob yet). `htmlFor()` is
  unchanged. The JS copy button disappears for every pattern.
- The preview frame and the hostile-host tests link the same two shared files, so paste parity is
  proven against what a dealer page actually loads.

## What it costs

- The shared CSS grows by the structural rules of every pattern. Estimated from today's generator:
  about 1 KB gzipped per structural pattern, ~8 KB for all 21 — comparable to the card styles, and
  outside the engine's 6656 B budget the same way they are.
- The shared JS grows by the six scripts, ~3 KB gzipped, inside the engine file. Whether that sits
  inside the engine budget or beside it behind its own marker is a decision for the plan; the budget
  exists to keep the engine honest against Splide and Embla, and pattern wiring is not engine.
- Every site takes every pattern's structure whether it uses it or not. At these sizes that is
  cheaper than one inline copy on one page.
- A structural change to a pattern reaches every site on the next upload of the shared files, which
  is the point — and also the risk. The markup contract already carries the same promise for the
  engine ("the HTML is the stable API"); pattern classes and data attributes join it. A pattern's
  structure becomes a frozen contract the day it ships.

## What stays exactly as it is

- Knobs, brand presets, the editor, the copy buttons for CSS and HTML, the Brands page code box, the
  tests that hold knobs honest. A value is still a value on the root.
- The engine's own contract and budget. Nothing in `src/custom-slider.js` changes for this.
- The rule that nothing in a snippet names a size, weight or colour the site's theme owns.

## Open questions for the plan

1. Where the pattern scripts sit: appended to `custom-slider.min.js` behind a marker, or a third
   file `custom-slider-patterns.min.js`. One more `<script>` per site against a cleaner budget
   story.
2. Whether the readable `dist/custom-slider.css` keeps the pattern section too (it should; the
   readable pair is for reading).
3. How a designer restyles a pattern's structure on one site once the rules are shared: the
   Reference's recipe route (site CSS after the shared sheet, which already wins on source order) is
   the answer, and it needs one worked example.
4. The upload step: the shared files are on FTP at one path per site. A pattern change means an
   upload, and README's "if `git log src/` has anything after the upload date, re-upload" rule
   widens to `patterns.js`.

## Decisions, 2026-09-14 (Steven)

1. **Scripts append to `custom-slider.min.js`** behind `/*! patterns */`, each in its own
   `try/catch` after the engine's own start-up, published as `CustomSlider.wirePatterns()` for
   markup added after load. One file makes the engine-then-patterns order a fact, keeps the head
   tags at two (a copied tag someone has to edit ships wrong), keeps one version per site, and
   isolates a throwing pattern script from the engine. `npm run size` splits the JS on the marker
   the way it already split the CSS, so the budget still weighs the engine alone.
2. **The readable pair carries the section too.**
3. **Structure is edited in the shared files only.** Global by construction: the shared folder is
   the one surface designers cannot touch, Style Only and Custom HTML blocks are theirs, and the
   builder offers values, never structure. The escape hatch is the cascade: shared rules sit at the
   lowest specificity that beats the engine, so a designer's one-property rule under their slider's
   name wins in any order, and the Reference says that is the form — never a wholesale copy of the
   shared rules, which would stop taking fixes.
4. **A `patterns.js` change is an upload,** the same rule as `src/`.

Shipped the same day: `scripts/build-patterns.mjs`, `data-cargo` on every pattern's outermost
element, `cssFor()` down to values plus the gutter and rows rules, no JS part, the preview frame and
catalogue pages re-wired through `wirePatterns()`. Measured after: the Chevrolet tabbed bar's paste
is 39 lines / 436 B gzipped of values (was 56 lines / 1 020 B of CSS plus 793 B of script); the
shared files gained 2.7 KB gzipped of pattern CSS and 1.3 KB of scripts, weighed beside the engine's
unchanged 6 364 B.

## Verification the plan must carry

- `lint-generated-css.mjs` lints the shared pattern section the way it lints the card section.
- A test pastes each pattern's snippet onto the hostile host with the shared files linked and reads
  the same geometry the builder shows — the existing parity test, with the JS part gone.
- `npm run size` prints the engine, the cards and the patterns as three figures.
- The Chevrolet tabbed bar's snippet shrinks to its root values and markup; a test asserts no
  `.cargo-tabs` rule and no script in the copied parts.
