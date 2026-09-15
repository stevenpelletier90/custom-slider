# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## What this is

A dependency-free scroll-snap carousel (`cs`) built to replace third-party slider libraries on
DealerOn CMS sites. Two shipped files, no runtime dependencies. `npm run size` prints the byte
figures and is the authority — every figure written down elsewhere goes stale.

`README.md` is the public API reference (markup contract, options, CSS custom properties, JS API,
accessibility behaviors, verification checklist) — read it before changing anything user-facing.
Design rationale lives in `docs/specs/` (start with `2026-07-13-custom-slider-design.md`). Work
agreed but not started is `docs/roadmap.md`; findings triaged as non-blocking and left for a
decision are `docs/backlog.md`; the dated evidence behind the rules here is `docs/history.md`.

**What this repo can actually replace is `docs/coverage.md`** — one row per replacement code, not
per brand. The list of codes is not ours: it is the Salesforce Knowledge article "Model Bar
Replacement Codes" (000001851), 49 codes in scope across 24 OEM sections — the article lists 56, but
the seven GM multi-make combinations are work the team no longer does (2026-09-15) and are recorded
at the foot of the ledger, counted nowhere. A brand is the wrong unit (GM ships ten; CDJR ships one
code across four marques this repo holds as four presets), and ten of the 49 are not carousels at
all — static grids and tabbed lists, where swapping in a slider is a design decision rather than a
measurement. A row moves to **Replacement built** when a preset in `brands.js` gains a `styles`
block and a `source`; the state is `brands.js` and that file is the readable view. Measure one, add
its row.

## Commands

```bash
npm run build          # src → dist via esbuild (bundle+minify JS, minify CSS), then appends the generated card styles to the CSS and the pattern structure + scripts to both
npm run size           # build + gzip budget gate — FAILS at ≥ 6656 B total
npm run validate       # stylelint (files + generated) + eslint + prettier --check + check:looks  (fast; run before committing)
npm run test           # @playwright/test browser checks on Chromium (`npx playwright test --list` for the count), starts its own server on 8137 (reuses one already running)
npm run test:browsers  # tests/engine.test.mjs on Firefox and WebKit (npx playwright install firefox webkit once)
npm run a11y           # axe over every pattern and page state; needs `npm run serve` up; not a gate, run it after rail or demo-page changes
npm run check:looks    # asserts the demo data holds: 17 old skins -> 7 components, 32 brand presets, no cramped preset
npm run lint:css:generated # stylelints the CSS the copy panel ships (the card/pattern rules that live in JS template literals)
npm run lint:css:fix   # stylelint --fix on src/**/*.css and demo/assets/*.css
npm run lint:js:fix    # eslint --fix on src/**/*.js, demo/assets/*.js and scripts/
npm run format         # prettier --write .
npm run serve          # esbuild static server on http://127.0.0.1:8137 (for Lighthouse/demo)
```

**Four demo pages, one generator.** `demo/index.html` is the workbench: rail of starting points,
settings panel, live stage, slide-content editor, code panel (`state.content` holds edited slide
rows, null = example content, kept per pattern in localStorage). `demo/patterns.html` renders every
pattern (`gallery.js`), `demo/brands.html` browses by OEM (`brandbook.js`), `demo/reference.html` is
the technical guide (`guide.js`) — all built from the workbench's generator. Other `demo/assets/`:
`looks.js` (7 card components), `brands.js` (32 brand presets), `patterns.js` (the 21 rail entries:
example rosters, each pattern's CSS, markup and page script — a new replacement code is an entry
here), `workbench.js` (state and generators; reads `PATTERNS` off `globalThis.CARGO` like `LOOKS`
and `BRANDS`), `pane.js` (the only Tweakpane contact), `tp-plugins.js` (`note`, length and colour
controls), `vendor/tweakpane.js` (committed classic-script bundle from `scripts/build-vendor.mjs`;
`npm run check:vendor` fails `validate` after an `npm update` moves
`esbuild`/`tweakpane`/`@tweakpane/core` until it is rebuilt and committed — the intended loud
failure), `cms-paths.js`, `highlight.js`, `theme.js`, `ui.css`.

**`npm run build` writes four files** — `dist/custom-slider.{css,js}` readable,
`dist/custom-slider.min.{css,js}` minified. Everything runs the `.min` pair; the readable pair is
for reading, and `src/` keeps the comments. The install panel offers a Download per file plus
**Download all four**; each button's `data-file` names the file, and `tests/install.test.mjs` checks
saved name and bytes together.

**Card styles are GENERATED, never hand-written.** `scripts/build-cards.mjs` builds the 7 looks plus
`cs-{xs,sm,md,lg}-N` column classes from the same `LOOKS` the builder uses and appends them to the
engine stylesheet behind a `/*! cards */` marker. One file, because every site links it. The marker
is load-bearing: `npm run size` splits on it to weigh the ENGINE alone. The builder emits
shared-class markup with only the properties that differ from the look's defaults and offers no
inlined copy of the card styles — an inlined copy can never be fixed.

**Pattern structure and pattern scripts are SHARED too, never pasted** (spec
`2026-09-14-shared-pattern-structure-design.md`). `scripts/build-patterns.mjs` appends every
pattern's CSS and the six pattern scripts to both `dist` files behind a `/*! patterns */` marker,
from the same `PATTERNS` the builder draws with; `npm run size` splits both files on it and weighs
the engine alone. `htmlFor()` names the pattern on its outermost element, `data-cargo="<id>"` (the
wrap where there is one, else the root), and every shared rule is `:where([data-cargo])`-scoped: a
root rule at (0,1,0), a descendant one class more, a pattern's own prop defaults at (0,0,0). The
engine's rules tie and lose on source order inside the one file; a designer's rule under their
slider's name is one class higher and wins in any order — the sanctioned per-site override. A
snippet is values and markup only: `cssFor()` emits pattern-own props as deltas against those
defaults and no `.cargo-` rule but the gutter and the stacked-rows column; there is no JS part. The
pattern scripts publish `CustomSlider.wirePatterns()` for markup added after load; the preview frame
and the two catalogue pages call it once per build, a dealer page never does. A change to
`patterns.js` is an upload, exactly like a change under `src/`.

**Every card is a rail entry; there is no card-style picker.** All seven looks emit different
element trees, so a control that swaps markup is not a style control. The seven looks are seven rail
entries (`modelbar`/tile, `wordmark`, `cards`/vcard, `portrait`, `split`, `logostrip`, `locations`),
each with the roster its card is built for; the settings panel holds settings only. Deep links are
`#pattern` or `#pattern?brand=id`, never `#pattern/look`. A test fails on a picker reappearing.

**A card is built for a KIND OF PICTURE (the third axis).** Every look declares `content` (`cutout`,
`photo`, `cutout-or-photo`, `mark`, `place`) and `crop` (forced aspect or `null`); `check-looks.mjs`
fails on a look without them. `content` decides where the brand control above the stage appears:
where the card takes a cutout, and wherever a brand carries measured values for the pattern or its
card — read off the data, never a list of pattern ids. The crop warning is measured, never
categorical: compare aspects, say what will happen, stay silent when they agree. It is never a gate,
because `modelsFor()` swaps the roster under a brand preset or edited content.

**A brand variant is knob values, never a CSS block and never markup.** `brands.js` entries may
carry `styles` (card values by look, pattern values by pattern, tab names, and since 2026-09-14 the
`words` around a tabbed bar: heading, lead, button text and link, plus the platform classes the
heading and the wrap wear — `titleClass`, `wrapClass` — which is how Cadillac's bar is a `bg-main`
band with a `heading-lg` heading and the theme does the colouring), measured on the OEM's live demo
and cited in `source`. A tab name may hold a phone-only part in square brackets
(`SUVs [& Crossovers]`), which `htmlFor()` wraps in the platform's own `hidden-xs` span — markup the
platform already styles, not CSS of ours. Ford's bar (forddemo1) is the second measured tabbed bar
and the proof of the rule: a filled row of cells, a line on top, a bordered box and a lead paragraph
all became knobs on the same pattern (`--tab-flex`, `--tab-line-inset`, `--box-*`, `--*-narrow` for
the platform's 992px tier), never a second pattern. A measurement copies knob values only — never
markup, script, units or a CSS block; a demo's `18px` lands as `1.125em` of the site body, and no
gate catches a copied `px`, so this is a rule to read. `applyBrand()` writes them where the panel
edits them, `defaultFor()` resets a knob to the brand and "Start from the default" to the pattern,
`renderPattern(id, cls, { brand })` draws them on `brands.html` and as the brand control above the
stage (measured brands as chips, the rest in an Other brand list; no Brand list in the settings
panel). `check-looks.mjs` fails on a key that is not an existing knob. A value in a pattern's CSS is
a knob that lies — pattern values live in props. If an OEM needs something no knob provides, add the
knob; if it needs structure, that is a new pattern. Specs: `2026-09-09-oem-variants-design.md`,
`2026-09-10-brands-page-design.md`.

**Rows is a SETTING, not a pattern.** `state.rows` (1–3) wraps each slide's cards in `.cargo-col`
and emits the matching `grid-template-rows` from the same place. `rowsApply()` is the one place that
says where it applies — off for every `track: 'div'` pattern (the galleries and the lightbox), a
filter bar, the card grid and a crossfade; read the predicate, not this list. One slide is still one
scroll stop, so dots and the announced count stay honest.

**The lightbox opens over the demo page, not inside the preview frame.** A modal is only fullscreen
relative to its own document. `openOverlay()` in `workbench.js` clones the snippet's wrapper into a
`.wb-overlay` host in the top document and calls `showModal()` there — the only place the preview
does something the copied code does not. Two traps: a capture listener with `stopPropagation()`
beats the snippet's handler (at the target, listeners run in registration order), and the clone's
trigger is REMOVED, not hidden, because `display: inline-flex` outranks `[hidden]`.
`.cargo-lb[open]` names its state because `dialog:not([open])` is (0,1,1) and a scoped
`.cargo-lb { display: flex }` at (0,2,0) would render every closed lightbox inline.

**A video slide names its own video.** `videoSrc` lands on the poster as `data-video-src`;
`VIDEO_DIALOG_JS` builds the player at open time and tears it down on `close`, so nothing loads
until asked. An empty field emits no attribute.

**Looks collapse into components; patterns do not.** A look is values on one card; a pattern is a
different structure and stays its own rail entry. `htmlFor()` builds structural patterns from one
`carousel()` helper; `cssFor()` scopes to the wrapper: `%root%` is the carousel, `%wrap%` the outer
element.

**Two rules for pattern CSS.** Every card sets its own `font-size` and `line-height`, and any
block-styled element says `display: block`, or the host page's typography makes the card taller than
the preview. An arrow overlays media but never text: a text card reserves
`padding-inline: calc(var(--cs-arrow-size) + 0.4em)`. Both are held by the paste-parity test: each
snippet in a hostile host page must match the preview to the pixel.

**The tabbed bar is authored as PLAIN CONTENT; the script makes it a tab interface** (2026-09-15).
`htmlFor()` emits no `role="tab"`, `role="tabpanel"`, `role="tablist"`, id, `aria-controls`,
`aria-labelledby` or `aria-selected` — a tabpanel is part of a tab interface, and until the script
runs there is none for those to describe. What ships is a row of plain `<button>`s and a sequence of
`.cargo-pane` divs, each holding a carousel carrying the tab's name as its own `aria-label`, so a
reader with scripts off gets named regions in sequence rather than panels pointing at controls that
are not presented. The script finds the row by CLASS (`.cargo-tabs`, and `:scope > button` for the
tabs, so the engine's arrow buttons inside each pane are never mistaken for tabs) and applies every
tab semantic at once. It also emits no `hidden`, the tab script sets `data-tabs-on` on the wrap and
hides all but the current pane at wire time, and `%wrap%:not([data-tabs-on]) .cargo-tabs` keeps the
tab row out of the page until then. The old markup carried `hidden` on every pane but the first, so
a reader with scripts off got one pane and a row of buttons that switched nothing — three quarters
of the lineup unreachable, and dead controls in the tab order, against the README's own promise that
all content is visible without JS. The upgrade costs nothing to look at: measured frame by frame
from first paint, the bar draws at one height (CLS 0.0004), because the deferred script lands before
the first render. `tests/builder.test.mjs` holds both halves — the fallback and the no-flash.

**The tab row shrinks to fit before it scrolls** (2026-09-15, Steven: "decrease the size of the text
or spacing to fit within the mobile viewport"). Everything across a tab is measured in its own em —
padding, gap, divider — so one multiplier, `--tab-fit`, takes the whole row in proportionally, and
the script converges on it in a pass or two against `clientWidth - 2` (aiming at the box exactly
leaves 2–3px behind, because `scrollWidth` rounds). **12px is the floor**: below it a label stops
being readable, and the row scrolls instead. Two things it is not allowed to paper over: a phone
rule setting the whole `padding` shorthand undoes the 768 tier's `padding-inline: 0.5em` squeeze —
that regression is what made the tabs look untouched on a phone — and type alone cannot save a bar
whose WORDS are too long (five Chevrolet labels needed 5px at 320). Those get phone-short names
through the `[bracket]` / `hidden-xs` convention, which is why Ford's bar always fitted. The
`ResizeObserver` watches the row **and every tab**: it reports an element's own box, the row is full
width either way, and only the tabs feel a font landing or a preset repainting.

**The tab row never wraps, at any width** (2026-09-15). `.cargo-tabs` is `nowrap` +
`overflow-x: auto`, because the divider glyph hangs off the tab that FOLLOWS it, so every wrapped
row started with a `|` dangling in the margin — and Chevrolet's five body styles wrapped at 992 as
well as on a phone, which is why this is not a media query. `data-more`, set by the pattern script
only while the row actually overflows, is what turns on the left alignment, the `flex: 0 0 auto` and
the edge fade; a row that fits scrolls nowhere and stays centred, so no desktop bar moved. No
`scroll-snap` on it: the snap area is the tab's border box, so snapping scrolled its `--tab-gap`
margin off and left every bar resting 14–15px in. `tests/layout.test.mjs` holds all of it at six
widths, and those 320px checks drive the catalogue pages directly because the builder's narrowest
frame button is 390.

**Code parity is structural, not policed.** `cssFor(sel)` and `htmlFor(cls)` in `workbench.js` are
the ONLY producers of CSS and markup; preview is `cssFor('.wb-live')`, copy panel
`cssFor('.my-slider')`. The preview adds exactly one thing: a `--cs-per-view` pin for the pressed
width button (`cssFor(sel, preview)`, appended after the media queries), because a media query asks
the window and the preview is a box of the chosen grid's container width. The copied CSS ships the
real ladder.

**Lengths are `em`, never `rem` — enforced.** Bootstrap 3 storefronts set
`html { font-size: 10px }`, so `rem` ships at 62.5%. Card CSS sizes off
`font-size: var(--cargo-font, 1em)` on the root; generated controls carry `font: inherit`.
`unit-disallowed-list` fails the build on a `rem` in `src/**/*.css` (an override in
`.stylelintrc.json`) and in the generated card CSS (`.stylelintrc.generated.json`).

**The preview frame simulates Bootstrap 3 with TWO rules:** `html { font-size: 10px }` and
`* { box-sizing: border-box }` (plus `*:before, *:after`). The card CSS is written for border-box.
`tests/helpers.mjs` `hostHtml()` carries both; `tests/layout.test.mjs` asserts no card overflows its
slide on any pattern.

**Fill means no container.** The width buttons set a real screen width and Bootstrap's container
rules give 750/970/1170 inside it. Fill drops the container (`html[data-fill] #wb-live-root`,
(1,1,1) over the bare id's (1,0,0)) as well as widening the frame; widening alone draws the same
picture as Desktop.

**Six tiers, two grids (since 2026-09-15).** `BPS` in `workbench.js` is 576 / 768 / 992 / 1200 /
1400: the platform's Bootstrap 3 three plus Bootstrap 5's two, because the platform is moving to
Bootstrap 5 and the three shared numbers mean the same thing in both. The column classes keep the
frozen `xs/sm/md/lg` names at the Bootstrap 3 numbers and add `cs-576-N` / `cs-1400-N`, named by
width because Bootstrap 5's letters mean different numbers (`TIER_CLASS`). A four-rung ladder in
`looks.js`, `patterns.js` or a brand preset is filled out by `fullLadder()` (576 from the phone
rung, 1400 from the desktop's), and a rung equal to the one below emits no class, so an untouched
slider ships exactly the classes it did. The **Grid** select beside the width buttons picks which
container the preview draws in (`html[data-grid]` on the frame; Bootstrap 3 750/970/1170, Bootstrap
5 540/720/960/1140/1320), is saved with the width, and is the `grid` that `perViewFor()` clamps a
preset against; `check-looks` clamps every preset against both grids (`TIER_BOX` in `brands.js`).
Pick the grid before the brand: the clamp runs when the preset is applied. `tests/tiers.test.mjs`
holds all of it.

**CSS in JS template literals is linted too.** `scripts/lint-generated-css.mjs` runs the real
generator (`cssFor`) and stylelints its output, so what is checked is what ships.
`.stylelintrc.generated.json` turns off source-layout rules (the card CSS is deliberately compact)
and keeps the semantic ones: property order, the `rem` ban, hex length, zero units.

**`npm run validate` also guards the data.** `scripts/check-looks.mjs` asserts every one of the 17
old skins is claimed by exactly one component, a component absorbing nothing is marked `isNew`, all
32 brand presets name a real look and land on a card no narrower than it needs, and no look sets
`padding`, `padding-block`, `padding-bottom` or `padding-block-end` on the carousel root (any of
them wipes the engine's `padding-bottom` dot-row reservation; `padding-block-start` and
`padding-inline` are fine).

**`npm test` is a gate, not optional.** `@playwright/test`, workers, `retries: 0` (so the configured
trace is `retain-on-failure`, since an on-retry one could never fire); about 90 seconds. Every test
names the finding it guards and was checked to fail against the code before it. One file per area
(`npx playwright test --list` for the count; a number written here went stale within a week):
`brands`, `builder` (copy-panel output, paste parity on a hostile host), `controls` (a knob shows
what the slider actually uses), `content`, `engine` (the engine's contract on authored markup —
no-JS, fits state, tab order, autoplay, reduced motion), `install` (saved name AND bytes; Copy hands
over the file with no tag; the panel neither states a deployment status nor offers a paste route),
`editor`, `dots`, `fade`, `settings`, `colour`, `labels`, `layout`, `length`, `pane`, `vendor`,
`variants` (measured brand values reaching preview and copied CSS), `recipes` (every Reference
restyle applied to a real pasted slider). It deliberately does NOT sweep all 21 patterns at every
width — a gate nobody runs is not a gate. Run `validate` and `test` before committing, and the
README "Verification checklist" browser sweep before shipping; a size check alone is not
verification.

`.claude/settings.json` registers a PostToolUse hook (`scripts/claude-format-hook.js`, exec form, so
no shell is involved) that auto-fixes each file Claude edits inside this repo and leaves files in
the other working directories alone. It never blocks; `npm run validate` is the real gate.

**Accessibility is a required check, not a good intention.** `.github/workflows/a11y.yml` runs on
every push and pull request with NO path filter, decides relevance itself, and always ends in one
job, `a11y gate`, that resolves green or red. That shape is deliberate: a workflow filtered with
`on.pull_request.paths` is SKIPPED for an irrelevant PR, and a required check that never runs sits
Pending forever and wedges the merge it was meant to guard. `a11y gate` is the context to mark
required in branch protection. The relevance list must include everything the audit can SEE, which
is wider than it looks: the root `index.html` (a11y.mjs walks it by name), and `package-lock.json`
(it pins the playwright and axe-core that produce the verdict) were both missing from the first cut.

**CI checks that the committed `dist/` matches source** (`git diff --exit-code -- dist`, after the
build). Without it a `src/` change with a forgotten rebuild passed everything: `npm run size`
rebuilds `dist` on the runner and the tests then measure that fresh build, while the repo went on
serving the stale committed bytes to every dealer page and to the demo (2026-09-15 review). It is
the only step that looks at what is actually in the repo rather than at what CI just built.

`.github/workflows/validate.yml` runs `validate`, `size` and `test` on every push and pull request
(Chromium), and a second job runs `test:browsers` — `tests/engine.test.mjs` alone on Firefox and
WebKit, the engine's contract where its Safari and Firefox decisions actually execute. After a push,
watch both until green. `.github/workflows/a11y.yml` is the third: `npm run a11y` (axe over every
pattern, the brands page, the two catalogue pages at 390, both themes, both dialogs) on any change
to `src/`, `dist/`, `demo/` or the build scripts. It became a gate on 2026-09-15 — as "a deliberate
run" it drifted for a week exiting non-zero on a deleted selector, and a nightly job would report a
contrast regression only after it had merged and deployed. It stays out of `npm run validate`, which
is the fast local command: this one needs a browser and a server. Run it locally after any change to
the rail or the demo pages rather than waiting for CI.

## Architecture

**CSS owns layout and physics; JS only wires controls and state.** `src/custom-slider.css` makes the
track a native `scroll-snap` container, so swipe/drag/momentum/snap work with JS disabled.
`src/custom-slider.js` adds prev/next/dots/pause/thumbs into space the CSS reserved
(`--cs-controls-space`) — why CLS is 0. Keep layout decisions out of JS. One exception:
`_wireDrag()` adds mouse drag-to-scroll (`data-cs-drag="false"` opts out), disabling snap only
during the gesture and restoring it in `_commit()`.

**Two entry points, one class.** `src/custom-slider.js` exports `CustomSlider`; `src/auto.js` (the
CMS entry) assigns `window.CustomSlider` and auto-inits on `DOMContentLoaded`; esbuild bundles it to
`dist/custom-slider.min.js` as an IIFE. One class name in source and on the page — no second alias.

**The engine is LINKED, never pasted.** A page gets the two `.min` files from two head tags and no
other way: a pasted engine can never be fixed, and nothing records which sites carry which build.
Add a paste-the-engine route only for a real page that cannot reach the shared folder, and ship it
with a test. The per-slider CSS the copy panel emits IS pasted (Style Only, Head Section), which is
why `.stylelintrc.json` pins `rgba()` to the legacy form.

**`dist/` is checked in** (though `.prettierignore`d). Rebuild and commit `dist/` in the same commit
as any `src/` change; `demo/index.html` loads `../dist/*`, so a demo check without a build is
meaningless.

**Demo assets are classic scripts** hanging off `globalThis.CARGO`, because ES modules are blocked
over `file://` and the demo must open by double-click. `check-looks.mjs` reads them with
`new Function` for the same reason.

**The settings panel is a Tweakpane pane; the engine knows nothing about it.** `buildPanel()`
decides which controls exist and what a change does; `pane.js` decides how one is drawn. Every
control binds to a private `{ v }` and calls back, so `state` keeps its owners and a structural
change rebuilds the pane. Length and colour plugins in `tp-plugins.js` normalise on the way out
(zero to `0.1px`, colour to hex/legacy `rgba()`/`transparent`) to what `okValue()` and the platform
accept.

**Every settings folder is open and cannot be closed.** Tweakpane 4.0.5 has no non-collapsible
folder and wires the click in `FolderController`'s constructor, so the click is starved, not
unbound: `pointer-events: none` on `#wb-settings .tp-fldv_b` in `ui.css`, `tabindex="-1"` in
`pane.js`. A same-element capture listener cannot help (registration order wins at the target).
Folder order is style-first in `buildPanel()`, which packs the `columns: 23rem` flow.

**One commit point for state.** `_commit()` (`scrollend`, or a 150 ms debounced `scroll` fallback
for pre-26.2 iOS Safari) is the only place `this.current` changes and `cs:change` fires — except
fade, which never scrolls, so `goTo()` commits inline and any post-change bookkeeping goes in both.
Selection UI updates optimistically at activation via `this._target` + `_updateUI()`; `_commit()`
clears `_target`.

**Pages, not slides.** Arrows and dots step by page; `data-cs-step="slide"` or `"N"` steps cards.
Dots stay per-page, and the final stop is always the end. `_measure()` reads `--cs-per-view` from
computed style, `_pages()` derives page starts with the last clamped to the end, `_stops()` is what
the arrows walk. Slides-per-view is CSS-only — no JS breakpoint option.

**Teardown.** Every listener registers with `{ signal: this._ac.signal }`; `destroy()` aborts,
disconnects observers, restores `this._snapshot` and removes only `_addedRootAttrs`. Any new
listener/observer/timer joins this scheme.

## What the builder must never hand a designer

**One predicate decides whether a value may be emitted.** A unitless `0`, an empty value and a bare
number each collapse the cards while the readout still looks right. `okValue()` in `workbench.js` is
the single gate; `cssFor()` drops what it refuses so the value falls back instead of shipping. Which
knobs are lengths is read off the shape of their default, never a hand-kept list. A bare `0` is
refused deliberately: it is what the minifier makes of `0px` and what the engine's `calc()` cannot
use.

**Anything `cssFor()` or `htmlFor()` calls is declared ABOVE `if (!stage) return`** —
`patterns.html` and `lint-generated-css.mjs` take that early return, and a helper below it is a
`ReferenceError` in the generator.

**Snippet rules on the carousel are written `.name.cs`, not `.name`.** A bare class ties with the
engine's `.cs` and the shared `.cargo-<look>`, and where the platform emits its aggregated Style
Only sheet relative to a head `<link>` is undocumented, so paste order would decide.

**The shared card sheet weakens its own class with `:where()` — descendants only.** A designer's
`.my-slider .cargo-name` ties at (0,2,0) with `.cargo-tile .cargo-name` on the same undocumented
order. `weaken()` in `build-cards.mjs` wraps the look class wherever it is a PARENT, never where it
is the whole selector — that rule carries the look's custom properties, and at (0,0,0) the engine's
`.cs` block would outrank it.

**The slider's name is the one setting about the PAGE, so it lives beside the copy buttons.** Two
snippets sharing a name share rules and the second paste wins. Auto-numbering a repeat copy is wrong
— the builder cannot see the page it is pasted into. Uniqueness can only be surfaced.

**Classic `rgba()` and `em` in everything the copy panel emits**, enforced by `.stylelintrc*.json`
(`color-function-notation: legacy`, `alpha-value-notation: number`,
`color-function-alias-notation: with-alpha` in both; the `rem` ban, `unit-disallowed-list`, in
`.stylelintrc.generated.json` and, since 2026-09-14, as an `overrides` entry for `src/**/*.css` in
`.stylelintrc.json` — never on `demo/`, because the demo's own `ui.css` uses `rem` and is never
pasted). `stylelint-config-standard` defaults to `"modern"` and the format hook would rewrite
`rgba()` back — point the rule at the platform's form rather than skipping it.

**A control must show what the slider is actually using.** A knob lies by a value set in pattern CSS
instead of props, a switch for something that does not exist, a click on the selected option
resetting a hand-set ladder, or a reset restoring only half. None shows in the generated CSS, which
is why `tests/controls.test.mjs` exists.

## Hard constraints

**The HTML is the stable API; the engine is an implementation detail.** Class names (`cs`, `-track`,
`-slide`, generated control classes), data attributes, `--cs-*` properties, `cs:*` event payloads,
public methods and accessibility behaviors are a frozen contract — sites can't be edited when the
engine changes (README "Swapping the engine later"). Add freely; rename or repurpose nothing.

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
- Never make the track the live region; the terse `.cs-status` region exists so multi-card moves
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
- Keep `.cs-track::-webkit-scrollbar` alongside `scrollbar-width: none`: Android WebView has no
  `scrollbar-width` support, and in-app browsers are real dealer traffic.
- Never set a `--cs-*` knob on a WRAPPER and expect it to reach the slider. The engine declares
  every one of them inside its own `.cs { }` block, and a property set ON an element beats the same
  property INHERITED from an ancestor at any specificity. `--cs-focus` on `.cargo-lb` was silently
  dead while Cadillac's identical override worked, because a brand's props land on `.cs` itself.
  Scope to `.cs`, or to the element (2026-09-15).
- Never copy an OEM's contrast. A measured value is the FLOOR (Steven's standing rule) and colour is
  the sharpest case: Ford's measured `#919191` arrow was 3.15:1 on white and 2.77:1 on the `#f0f0f0`
  its own tab cells draw — a 1.4.11 failure, taken on by copying, against the pattern's own 15.13:1
  default. Measure the ratio against the band the control actually sits on, not against white.

**A card look owns the responsive arrow ladder, and a brand that sets `--cs-arrow-size` leaves it.**
The looks shrink the arrow 44 → 36 at 767 → 32 at 575 from the shared card sheet at (0,1,0); a
brand's props reach the snippet at (0,2,0) with no media query and win at every width. Measured
2026-09-15: a plain paste goes 44/36/32 while `tabs × ford` renders 25×25 at 1280, 700 and 390
alike. So set `--cs-arrow-size` in a preset only when the measurement genuinely needs it — an OEM's
35px slick arrow is smaller than our 44px default and is not worth the ladder.

**v1 scope limits:** LTR only, no infinite loop (rewind or stop), `gallery` + `autoplay` unsupported
(autoplay ignored with a console warning), `gallery` + `fade` unsupported (fade ignored with a
console warning; fade is a 1-up stacked crossfade, see README `data-cs-fade`).

## Conventions

- Formatting: Prettier, `printWidth: 200`, single quotes in JS / double in CSS. Long single-line
  statements in the engine are the formatter's output — leave them unwrapped.
- CSS: stylelint standard + `recess-order` (property order enforced). Kebab-case selectors with BEM
  `--` modifiers. Logical properties (`inline-size`, `inset-inline`) are the house style.
- Missing markup fails loudly: `console.error` for a missing track/slides, `console.warn` for a
  missing `aria-label` or a conflicting option combination. Keep that pattern for new validation.
- Extending behavior belongs in page script, not the engine — listen for `cs:change` (bubbles from
  the root) or read the instance at `element._cs`. The two video patterns carry their own `<dialog>`
  and handler inside the emitted snippet (`patterns.js`) — the reference example: wiring ships with
  the copied code, not the demo.
