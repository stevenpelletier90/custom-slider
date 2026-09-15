# Custom Slider

Dependency-free scroll-snap slider/carousel. **`npm run size` is the authority on every byte
figure** and the only place one is written down: CI enforces a 6656 B gzip budget on the engine and
a 16 KiB guard on what a site actually downloads, and the demo masthead fetches the two shipped
files and gzips them in the browser, so its number cannot go stale either. Nothing else in this repo
repeats a current size — a figure copied into prose was 50% low within six weeks, because the same
two files grew the card styles and the shared pattern structure after it was written. No build step
required to use, themed entirely with CSS custom properties. Built to be maintained in-house: the
whole engine is one commented file, `src/custom-slider.js`.

The browser owns the physics (touch, drag, momentum, snapping — CSS `scroll-snap`); the JS only
wires controls, state, autoplay, and the gallery variant — plus the one physics gap browsers leave
open: mouse drag-to-scroll (native scroll containers don't drag with a mouse; `data-cs-drag="false"`
opts out). Rewind instead of infinite loop: no cloned slides, so no duplicate content for SEO and no
screen-reader confusion.

The demo page (`demo/index.html`) is a workbench: pick a pattern, set it up (how many across at each
breakpoint, how many rows, brand preset, arrow colours, how many cards an arrow moves), and copy
code generated from those same settings — so the snippet is always exactly the slider on screen. It
also hands you all four `dist/` files themselves, to upload — the engine is linked, never pasted.

## Quick start (CMS / classic script)

```html
<link rel="stylesheet" href="custom-slider.min.css">
<script src="custom-slider.min.js" defer></script>

<div class="cs my-slider cs-sm-2 cs-md-3" data-cs aria-label="Featured vehicles">
  <ul class="cs-track">
    <li class="cs-slide">…</li>
    <li class="cs-slide">…</li>
  </ul>
</div>
```

Every `[data-cs]` element initializes automatically. Slides-per-view is CSS, not a JS option: the
`cs-xs-N` / `cs-sm-N` / `cs-md-N` / `cs-lg-N` classes ship in the stylesheet for N of 1–8, on
Bootstrap 3's tiers — **768 / 992 / 1200**, the grid the storefronts run today — and since
2026-09-15 `cs-576-N` and `cs-1400-N` on Bootstrap 5's two extra tiers, **576 / 1400**, named by
their width because Bootstrap 5's letters mean different numbers (its `sm` is 576; ours is 768 and
frozen). The three shared numbers mean the same thing in both grids, so one set of classes serves a
site before and after the platform moves. One class per tier where the count changes; the engine's
own default is one across, so `cs-xs-1` is never needed.

Setting `--cs-per-view` by hand in a media query does the same thing and is what the classes are
made of, but on a DealerOn page your CSS goes in the **Style Only** field as raw CSS — no `<style>`
tags — so there is no in-page `<style>` block to put it in. Write `.my-slider.cs { … }` rather than
`.my-slider { … }` there: a bare class ties with the engine's own `.cs`, and then source order,
which you do not control, decides which wins.

## Quick start (ES module)

```js
import { CustomSlider } from './src/custom-slider.js';
const slider = new CustomSlider(document.querySelector('.my-slider'), { autoplay: 4000 });
```

JS options override data attributes, which override defaults.

## Markup contract

- Root: `class="cs"` (+ `data-cs` for auto-init) with `aria-label` or `aria-labelledby`.
- Name: one more class of your own on the root — `my-slider` — which is what your settings hang off.
  **It must be unique on the page.** Two sliders sharing a name share their rules, and the second
  block's CSS wins for both: measured on a pair of model bars, the first strip took the second's 3em
  gap and its slides went from 208.6px to 180.6px, with nothing on the page saying so. The builder
  puts the field beside its copy buttons for this reason.
- Track: one `.cs-track` child — `<ul>` for card carousels, `<div>` for `data-cs-gallery`.
- Slides: `.cs-slide` children. All real content (headings, links, images) goes in the HTML — the
  engine never injects content, only controls.
- Images: always `width`/`height`; first visible image eager (add `fetchpriority="high"` only if the
  slider is above the fold); later slides `loading="lazy" decoding="async"`; `sizes` = one slide's
  rendered width.
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
| `labels`          | `data-cs-label-*`         | English strings | Every announced string, one attribute each — see [Announced text and other languages](#announced-text-and-other-languages)                                                                                      |
| —                 | `data-cs-init="manual"`   | auto            | Skip auto-init; construct via `new CustomSlider(el, opts)` from page script                                                                                                                                     |

## Announced text and other languages

Every string the carousel announces is settable from the markup, because the CMS hands a designer
markup and never a constructor call — a page built in the block editor has no other route to a
Spanish carousel.

| Attribute                      | Default                         | Where it is heard                                                             |
| ------------------------------ | ------------------------------- | ----------------------------------------------------------------------------- |
| `data-cs-label-prev`           | `Previous slides`               | Previous arrow                                                                |
| `data-cs-label-next`           | `Next slides`                   | Next arrow                                                                    |
| `data-cs-label-pause`          | `Stop automatic slide show`     | Pause button (autoplay only)                                                  |
| `data-cs-label-play`           | `Start automatic slide show`    | Same button once paused                                                       |
| `data-cs-label-dots`           | `Choose slide`                  | The dot group                                                                 |
| `data-cs-label-goto-slide`     | `Go to slide {n}`               | One dot, 1-up                                                                 |
| `data-cs-label-goto-page`      | `Go to slides {from}–{to}`      | One dot, multi-card                                                           |
| `data-cs-label-status-single`  | `Slide {n} of {total}`          | The live status region, 1-up                                                  |
| `data-cs-label-status-multi`   | `Slides {from}–{to} of {total}` | The live status region, multi-card                                            |
| `data-cs-label-thumbs`         | `Choose photo`                  | The thumb strip (`gallery`)                                                   |
| `data-cs-label-photo`          | `Photo {n}`                     | One thumb (`gallery`)                                                         |
| `data-cs-label-slide-position` | `{n} of {total}`                | A slide's own name, when the track is not a list and the slide has no heading |

`{n}`, `{from}`, `{to}` and `{total}` are filled in; anything else is used verbatim. Set
`data-cs-roledescription` too — a screen reader says the word "carousel" before any of these.

```html
<div
  class="cs"
  data-cs
  lang="es"
  aria-label="Modelos"
  data-cs-roledescription="carrusel"
  data-cs-label-prev="Anteriores"
  data-cs-label-next="Siguientes"
  data-cs-label-dots="Elegir diapositiva"
  data-cs-label-goto-slide="Ir a la diapositiva {n}"
  data-cs-label-status-single="Diapositiva {n} de {total}"
></div>
```

The status region is also the shortest route to a **visible** "3 / 12" counter: it already tracks
every move, so it only needs unhiding and wording.

```css
.my-slider .cs-status {
  position: static;
  inline-size: auto;
  block-size: auto;
  margin: 0;
  clip-path: none;
}
```

```html
<div class="my-slider cs" data-cs data-cs-label-status-single="{n} / {total}" data-cs-label-status-multi="{from}–{to} / {total}"></div>
```

A JS `labels` option still wins over an attribute, so an existing manual-init page is unaffected.

## One shared copy, no version in the filename

The two files are meant to live at one URL every site links, and the filenames carry no version — so
a fix reaches every storefront at once, and so would a mistake. What makes that safe is the
contract, not the filename: class names (`cs`, `cs-track`, `cs-slide`, the generated control
classes), the data attributes, the `--cs-*` properties, the `cs:*` event payloads, the public
methods and the accessibility behaviours are frozen. **Adding is fine. Renaming or repurposing is
not**, because the sites already linking the file cannot be edited to keep up.

That rule was always written down. With a shared copy it stops being a preference and becomes the
only thing standing between a rename and every storefront that links it.

Files named `dl-carousel.js` / `dl-carousel.css` are **not** an older version of these. That was the
pre-rename engine and it is a different contract — root class `dl-carousel`, `--dlc-*` properties,
`window.DLCarousel`. A page linking those and pasting a snippet from the current builder gets an
unstyled list, so they should be removed rather than left alongside. Note that the pre-rename build
is currently served under the CURRENT filenames rather than its own — see "Deployment status" below
for what is actually on the shared path today, and the rename map for moving a page across.

## Card styles come with the stylesheet

`dist/custom-slider.min.css` is the engine **plus** a small library of card styling: the seven card
looks and a set of column classes (`npm run size` prints the share). The engine itself styles no
cards on purpose — `cs-*` is mechanism, `cargo-*` is content — but every site that links it gets the
card half too, so a slider is mostly just its markup:

```html
<link rel="stylesheet" href="/path/custom-slider.min.css" />
<script src="/path/custom-slider.min.js" defer></script>

<div class="cs cargo-tile cs-xs-2 cs-sm-3 cs-md-4 cs-lg-5" data-cs aria-label="Our models">
  <ul class="cs-track">
    …
  </ul>
</div>
```

Looks: `cargo-tile`, `cargo-vcard`, `cargo-wordmark`, `cargo-split`, `cargo-portrait`, `cargo-logo`,
`cargo-location`. Columns: `cs-xs-N` / `cs-sm-N` / `cs-md-N` / `cs-lg-N` for N of 1–8, on Bootstrap
3's tiers, plus `cs-576-N` / `cs-1400-N` on Bootstrap 5's two extra tiers. Anything you change from
a look's defaults goes in a short `<style>` block beside the markup — the builder writes only the
differences.

The card half is **generated** from the same look definitions the builder draws with
(`scripts/build-cards.mjs` appends it behind a `/*! cards */` marker), so the file and the preview
cannot disagree. `npm run size` splits on that marker and weighs only the engine against the budget
below — the budget's job is to show the engine undercuts Embla's core and Splide, and neither of
those ships a card library.

There was a **Paste the card styles too** switch in the builder that inlined a look's rules into the
snippet, for a page linking a `custom-slider.min.css` older than the card half. It went on
2026-09-08, for the reason the paste-the-engine route went: an inlined copy can never be fixed, so
patching a card style reaches every linked page and silently misses every inlined one, with nothing
saying which pages are on which. The gap it covered closes with a re-upload — see "Deployment
status". It was also a no-op on most of the patterns, where it drew a control that announced it did
nothing.

Worth keeping in mind either way: the card CSS carries the card styling **only**, never the engine's
layout and physics, so on a page with no stylesheet linked at all a block renders as a full-width
vertical list with static arrows, whatever the column classes say. Measured, not assumed: track
`display: block`, `overflow-x: visible`, `scroll-snap-type: none`, slide `flex-basis: auto`.

### Pattern structure comes with it too

Since 2026-09-14 both shared files carry a third section behind a `/*! patterns */` marker
(`scripts/build-patterns.mjs`, run by `npm run build`): every pattern's structural CSS — the tab
row, the filter bar, the lightbox, the photo captions — and the six pattern scripts, each in its own
`try/catch` after the engine's own start-up. A pasted snippet is therefore **values and markup and
nothing else**: the Chevrolet tabbed bar went from 56 lines of CSS plus a script to 39 lines of
values, and a site pays for the structure once, cached, instead of on every page view — the platform
serves Style Only inline in every page.

The markup names its pattern on its outermost element, `data-cargo="tabs"`, and every shared rule
hangs off that attribute at the lowest specificity that still beats the engine: `:where()` around
the attribute, so a root rule is (0,1,0) and a descendant rule one class more. The engine's own
rules tie and lose on source order, which is fixed because the section is appended after them in the
same file. **A rule under your slider's own name is one class higher and wins in any order** — that
is how a pattern is restyled on one site, one property at a time, and the only way. Copying the
shared rules into Style Only freezes them at that day's build.

Which means the shared files are the one place a pattern's structure is edited, and only whoever
uploads them edits it. The upload rule below widens accordingly: a change under `src/` **or to
`demo/assets/patterns.js`** puts the hosted files a build behind.

### The engine is linked, never pasted

A page gets the engine from the two `<link>`/`<script>` tags and no other way. There is no
paste-the-engine route any more, and adding one back needs a better reason than a page being
awkward.

**Why, and it is not tidiness: a pasted engine can never be fixed.** Patch a bug and every linked
page picks it up on its next cache cycle. Every pasted copy silently does not — and nothing on those
pages, in this repo, or in the folder says which sites are carrying which build. That is permanent,
undetectable divergence across dealer sites nobody owns. Sharing one cached copy and not repeating
15 KB per page are real gains too, and both are secondary to that one.

`docs/cms-no-hosting.md` and `scripts/paste.mjs` used to be the escape hatch, written when nothing
was hosted yet. Both are deleted: the condition that justified them ended when the four files went
up (see Deployment status above), and the script emitted code onto live dealer pages with no test
over it — the only thing in this repo shipping to a dealer without a gate. Git has them if the case
ever turns out to be real, and it comes back with a test.

Note this is about the ENGINE. The per-slider CSS the copy panel hands over is still pasted, still
goes in **Style Only, Head Section**, and is still why `.stylelintrc.json` pins `rgba()` to the
legacy form.

## CSS custom properties

Every one of them is tabulated with its live default on the Reference page, which reads them out of
the shipped stylesheet rather than counting by hand: `--cs-per-view`, `--cs-gap`, `--cs-peek` (edge
sliver of the next slide), `--cs-arrow-size/fg/bg`, `--cs-arrow-fg-hover/bg-hover`,
`--cs-dot-size/fg/current`, `--cs-controls-space`, `--cs-thumb-w/h`, `--cs-thumb-hover-scale`
(gallery thumb zoom on hover; `1` turns it off), `--cs-focus`, `--cs-transition` (duration+easing
for control colour transitions), `--cs-fade-ms` (crossfade duration in fade mode). Set them on the
`.cs` element or any wrapper.

Spacing defaults are **`em`, never `rem`**. `rem` is locked to `<html>`, and Bootstrap 3 — which the
storefronts run — sets `html { font-size: 10px }`, so every `rem` shipped at 62.5% of its intended
size on a real dealer page (the reserved dot row fell to 25px against a 24px dot hit box). `em`
tracks whatever the host sets on `body`, so the slider scales with the page it is pasted into. The
generated controls carry `font: inherit` for the same reason: a `<button>` otherwise takes 13.33px
Arial, and `em` inside it would mean something different from `em` outside it.

## JS API

Methods: `goTo(n)`, `next()`, `prev()`, `pause()`, `play()`, `destroy()`,
`CustomSlider.autoInit(scope?)` — the same name whether loaded as a classic script
(`window.CustomSlider`) or imported as an ES module. Instance is at `element._cs`. Events (bubble
from the root): `cs:change` `{index, page, slidesInView}`, `cs:autoplay-start`, `cs:autoplay-stop`,
`cs:destroy`.

`goTo(n)` takes a slide index: a finite whole number, clamped to the ends. A fraction truncates
(`goTo(1.5)` is slide 1) and anything that is not a number — `NaN`, `Infinity`, a word, `undefined`
— is a no-op rather than a throw. JS options beat data attributes for the CSS state too:
constructing with `{ gallery: false }` or `{ fade: false }` over authored `data-cs-gallery` /
`data-cs-fade` writes `="false"` onto the element, so the stylesheet stops reserving the thumb strip
or pinning the slides one-up. `destroy()` puts the authored value back.

`destroy()` puts the root's attributes back to what they were before init and restores the authored
markup from a snapshot taken at init. The snapshot is a rebuild, not a mutation: the slides come
back as new nodes, so listeners or state a page script attached to the original slide elements do
not survive it. Re-attach after `cs:destroy` if you need them.

`CustomSlider.wirePatterns()` is set by the pattern section of `custom-slider.min.js` (not by the
engine, so it is absent from the ES module): it runs every pattern script again over the whole
document. It runs once by itself on load; call it only for pattern markup added afterwards, once per
batch — a tab row wired twice answers a key twice.

## Accessibility behavior (by design — don't "fix" these)

- Multi-card: ALL cards stay in the tab order and accessibility tree — no `inert`/`aria-hidden` on
  off-screen cards (hiding corrupts announced counts).
- A `<ul>`/`<ol>` track gets `role="list"` re-applied at init. The library's own `list-style: none`
  makes WebKit drop list semantics, which would silently kill the "N of 6" count announcements in
  Safari/VoiceOver — don't remove it.
- Dots are one per PAGE of slides, plain buttons (not tabs); current dot is `aria-disabled`, still
  focusable.
- When every slide already fits, the arrows and dots are hidden and the root gains `data-cs-fits` —
  controls that cannot move anything must not be focusable, and a one-of-one dot group announces a
  choice that isn't one. It is re-evaluated on resize, because slides-per-view is CSS. Style on
  `data-cs-fits` if you want the reserved control space to collapse too.
- Gallery: full APG tabbed-carousel — thumbs are a `tablist` with roving tabindex and arrow keys;
  non-visible panels are `inert`. The visible panel takes `tabindex="0"`: it holds no focusable
  content, and without it Chrome puts an unnamed tab stop on the scrolling track instead (it does
  that for any scroll container with no focusable children). Gallery tab order is prev → next →
  panel → selected thumb.
- Autoplay: pause button first in tab order; hover pauses temporarily; focus or drag stops
  permanently (only the button restarts); never starts under `prefers-reduced-motion`, and turning
  that setting on mid-session stops a rotation already running; status announcements are off while
  rotating.
- Fade: slides are stacked in one grid cell, so every non-current slide is `inert` — the same
  carve-out `gallery` mode has, and the reason the multi-card "never inert off-screen cards" rule
  does not apply here (fade is 1-up, so no count is corrupted). A slide containing focus is never
  inerted. Fade never scrolls, so `goTo()` is its commit point instead of `scrollend`.
- Fade's stacking CSS is keyed to `data-cs-fade-on`, which **the engine sets at init** — never to
  the authored `data-cs-fade`. JS decides which slide is visible, so if the stacking applied without
  JS every slide would sit at opacity 0 and the whole carousel would vanish. With JS off the track
  stays an ordinary scrollable strip with all slides visible. `destroy()` removes the marker. The
  **width** is the one exception: `--cs-per-view: 1` is pinned in the stylesheet off the authored
  `data-cs-fade`, so a fading carousel is one across from first paint and init shifts nothing.
  Without it, a hero authored three across laid out as a three-across strip and jumped a whole image
  height when the script ran — measured 195.1px to 529.4px on a 1170px page — and that is also what
  a no-JS visitor was left looking at. It means the `cs-*-N` classes and your own `--cs-per-view`
  are **ignored on a fading carousel**, which is intended: a crossfade is 1-up.
  `data-cs-fade="false"` keeps its columns.
- Every programmatic scroll resolves smooth-vs-instant from `prefers-reduced-motion` at call time.
  Never add CSS `scroll-behavior: smooth` — but `auto` IS declared on the track and must stay:
  without it a host page's global `* { scroll-behavior: smooth }` captures every instant scroll the
  engine makes, reduced motion included.

## Advanced use (escape hatches)

- **Manual init:** add `data-cs-init="manual"` and construct from page script:
  `new CustomSlider(el, { autoplay: 6000, labels: { next: 'Next vehicles' } })`.
- **Custom callbacks:** listen for `cs:change` on the root (bubbles) — e.g. update a counter,
  lazy-init a map, sync anything to the current slide.
- **Synchronized sliders:** wire two instances in page script:
  `a.addEventListener('cs:change', e => b._cs.goTo(e.detail.index))` — `goTo` is idempotent, so
  feedback loops settle naturally.
- **OEM styling:** override `--cs-*` custom properties per site/brand — no engine edits.

## Swapping the engine later (the Custom Slider contract)

The HTML on the sites is the stable API; this engine is an implementation detail. Any future engine
(third-party or rewrite) must honor the same contract, and then replacing it = replacing the
contents of the two dist files, with zero site edits:

1. Consume `.cs[data-cs] > .cs-track > .cs-slide+` with all content authored in the HTML; generate
   its own controls (never require control markup in the CMS).
2. Honor the data attributes (`data-cs-autoplay`, `data-cs-rewind`, `data-cs-step`, `data-cs-drag`,
   `data-cs-fade`, `data-cs-gallery`, `data-cs-roledescription`, `data-cs-init`) and the `--cs-*`
   theming knobs.
3. Emit the `cs:*` events with the same payloads and expose `goTo/next/prev/pause/play/destroy` +
   `CustomSlider.autoInit`.
4. Keep the accessibility behaviors listed above — they are part of the contract, not this engine's
   private choices.
5. Write the same attributes and classes back onto the page. The engine puts `data-cs-fits` on the
   root when every slide already fits (and removes it again on `destroy()`), `data-cs-gallery` /
   `data-cs-fade-on` on the root to let the CSS reserve space, and `data-cs-draggable` /
   `data-cs-dragging` on the track for the grab cursor. Its generated controls are `.cs-controls`,
   `.cs-arrow` + `.cs-arrow--prev` / `--next`, `.cs-pause`, `.cs-dots`, `.cs-dot` +
   `.cs-dot--current`, `.cs-status.cs-sr-only`, `.cs-thumbs`, `.cs-thumb`.
6. **The one class it writes onto markup the site authored is `cs-slide--current`**, on the visible
   slide in fade mode. It was a bare `is-current` until 2026-09-08 — renamed in the last window
   before the contract froze, because a name with no `cs-` stem can collide with whatever the site's
   own theme already calls things, and the collision shows as a slide stuck visible or invisible on
   their page with nothing to explain it. A replacement engine must use the same name; nothing else
   it writes may land outside its own generated elements.

Everything in 5 and 6 was undocumented until 2026-09-08. Undocumented does not mean unfrozen — a
site can already be relying on it.

## Putting it on a DealerOn site

[docs/cms-implementation.md](docs/cms-implementation.md) — where the files go, the markup contract,
replacement codes, per-OEM theming, and the ladder for each brand's model bar.

### Deployment status — the one place it is written down

**As of 2026-09-08 all four files are on FTP.** The folder is

```text
/assets/shared/CustomHTMLFiles/Responsive/Apps/customSlider/
```

Measured that day, cache-busted against `www.karlchevrolet.com`: all four answered 200,
`last-modified` 2026-09-08 14:01 GMT, and three of them were byte-identical to `dist/` as it then
stood. The pre-rename `dl-carousel` build they replaced is gone — no `.dl-carousel{` or `--dlc-`
anywhere at that path.

**⚠ `src/` has changed since that upload, so the hosted files are a build behind.** Deliberately not
restating which bytes: any commit touching `src/` puts the folder out of date, and a byte count
written here goes stale the same day. **The rule, not the number: if
`git log src/ demo/assets/patterns.js` has anything after the upload date above, re-upload.** Then
update that date.

**Do not expect `custom-slider.min.css` to match `dist/` byte for byte even when it is current** —
the platform re-minifies CSS it is given: `:after` becomes `::after`, `.5s` becomes `500ms`, `.5`
becomes `0.5`, `rgba(0,0,0,.8)` becomes `rgba(0,0,0,0.8)`, `background: none` becomes
`background: 0`, and **`--cs-peek: 0px` becomes `--cs-peek: 0`**. Rendered side by side on a hostile
host page at 1170px and four across, the two sheets resolved identically — slide 282px, flex basis
`calc(25% - 10.5px)`, track padding `0px`, scroll padding `0px`, root `padding-bottom` 35px, snap
type, overflow and dot colour all equal. Only the token differs. Compare the other three for a byte
check, or prove the render; a byte difference in this one file is expected.

That unitless zero is worth reading twice, because it is **F003 arriving from the platform rather
than from the builder**. It is harmless here — `--cs-peek` is only ever consumed by `padding` and
`scroll-padding-inline` (`src/custom-slider.css:80`, `:90`), and both accept a unitless `0`. It
would not be harmless on `--cs-gap`, which `src/custom-slider.css:119` feeds to
`calc((100% - (var(--cs-per-view) - 1) * var(--cs-gap)) / var(--cs-per-view))` — subtracting a
unitless number from a percentage is invalid, the declaration is dropped and the cards collapse to
content width. So `okValue()` refusing a bare `0` is no longer an inference about what the minifier
might do; the minifier has now been observed doing it.

`npm run build` writes four files to `dist/`, each in three sections — the engine, then the card
styles behind `/*! cards */` (CSS only), then the pattern structure and scripts behind
`/*! patterns */`: `custom-slider.css` and `custom-slider.js` are the **readable** engine, for
anyone opening the file to see what it does; `custom-slider.min.css` and `custom-slider.min.js` are
the same code minified, and **the `.min` pair is what every page links** — the demo, the copy
panel's tags and the snippet at the top of this file all name it. The readable pair goes up beside
it so the folder holds both; no page should link it. The other two documents defer to this section;
do not restate a status in them.

**Uploading (do not skip the cache step).** The files are served with
`cache-control: max-age=1814400` — 21 days — from behind Fastly. Overwriting a file does not shorten
that: a browser that already fetched the old one keeps it for up to three weeks.

1. Run `npm run build`, then `npm run size`, and confirm the gate is green.
2. Upload all four files from `dist/` into the folder above, overwriting what is there. The demo's
   install panel has a Download for each of the four and a **Download all four** button, under
   "First, get the four files up there" — the same bytes as `dist/`, saved under their own names, if
   that is easier to reach than the repo.
3. Verify with a cache-busted request, not a browser reload:
   `curl -s ".../custom-slider.min.css?cb=$RANDOM" | head -c 40` should begin `.cs{--cs-per-view`.
   Check `last-modified` too — a 200 alone only says something is there, not that yours is.
4. Do NOT expect `custom-slider.min.css` to match `dist/` byte for byte; the platform re-minifies it
   (see above). The other three do match, so compare those if you want a byte check. What matters
   for the `.min.css` is that it still renders the same — the paste-parity test in the verification
   checklist is the way to prove that.
5. Anyone who opened a page linking the old file needs a hard refresh, or to wait out the TTL. Say
   so when you hand a test page over.

### Moving a page off dl-carousel

The old contract is a different set of names throughout, so a page cannot be half-migrated. Rename
map:

| Old (dl-carousel)   | Current (cs)          |
| ------------------- | --------------------- |
| `dl-carousel`       | `cs`                  |
| `dl-carousel-track` | `cs-track`            |
| `dl-carousel-slide` | `cs-slide`            |
| `--dlc-*`           | `--cs-*`              |
| `data-slider`       | `data-cs`             |
| `data-slider-*`     | `data-cs-*`           |
| `window.DLCarousel` | `window.CustomSlider` |

Finding the pages that link the shared folder is Steven's, and nothing is believed to be live on it
yet — the known consumer is a designer test page built on the old classes. Migrate a page by
rebuilding its slider in the builder and re-pasting all three parts, rather than by editing class
names in place: the snippet's CSS, markup and script have to agree with each other.

### Changing a slider that is already live

The builder cannot read a snippet back in — there is no import, and settings reset on reload — so
there are two supported routes, and which one depends on what changed:

- **Content** (a heading, a link, a photo, adding or removing a card): edit the **Custom HTML**
  block directly. Copy an existing `<li class="cs-slide">…</li>` and change it. Nothing else has to
  move.
- **Settings** (how many across, how many rows, gap, arrow colours, a different pattern): rebuild it
  in the builder and re-paste both parts — CSS and HTML. Re-pasting only the CSS leaves markup that
  no longer matches it.

**A slider pasted before 2026-09-14 carries a script in Body Section, Bottom.** Since then a
pattern's script ships inside `custom-slider.min.js` and its structure inside
`custom-slider.min.css`, so when the shared files are re-uploaded that pasted script must come out,
or the tabs are wired twice and a keyboard press moves two tabs. The pasted structure rules can stay
(they say what the shared file says) or go; the values must stay.

Either way **the class name must not change**. `.my-slider` is what the Style Only rules hook onto;
rename it and every setting silently stops applying. Give a second slider on the same page a
different name instead.

Replacement codes (`#NAME#`, `#CITY#`, `#STATE#`, `#CONTACTUS#`) resolve inside a Custom HTML block,
so they are safe in slide text and headings. They do **not** resolve in the Style Only field, and
`#MISCPATH#` in an `img src` only resolves once that dealer has the file in their gallery.

## Development

```bash
npm install
npm run build   # src → dist (esbuild)
npm run size    # build + gzip budget gate (fails at or over 6656 B for the engine) — and the
                # authority on every byte figure; nothing else here repeats one
npm run serve   # http://127.0.0.1:8137 (for Lighthouse)
```

`src/` is the canonical, readable code; `dist/` is the checked-in CMS build. Rebuild and re-commit
`dist/` whenever `src/` changes.

## Verification checklist (run before shipping changes)

1. `npm run size` and `npm run validate` pass, and `npm test` is green — the browser checks under
   `@playwright/test` (`npx playwright test --list` prints the current count; about 90 seconds).
   They cover what a linter cannot: that the pasted code still lays itself out, and lays itself out
   the way the preview did. **Steps 3, 4, 6 and 7 below now run in there too**
   (`tests/engine.test.mjs`), so what is left in this list is the part a machine cannot answer.
2. Demo page: Lighthouse accessibility = 100, performance ≈ 100, CLS = 0.
3. Keyboard-only: **the tab order is asserted by `npm test`**. Still by hand: gallery tabs respond
   to Arrow/Home/End, and focus is never trapped or lost.
4. Autoplay: **focus stopping it, the button restarting it, and reduced motion are asserted by
   `npm test`**. Still by hand: pauses on hover, stops on drag.
5. Screenshots at 375 / 768 / 1280 look right; slides-per-view matches the breakpoints.
6. With JavaScript disabled the strips still scroll and all content is visible — **asserted by
   `npm test`** on authored markup.
7. Widen until every slide fits: the arrows and dots disappear (the root gains `data-cs-fits`) and
   controls that cannot move anything are not focusable — **asserted by `npm test`**. Worth an eye
   at a real window anyway.
8. Paste parity: drop a generated snippet into a page with hostile typography (serif, 19px,
   line-height 2.1) at the same container width. The rendered slide must match the preview to the
   pixel — a mismatch means a card is inheriting the host's leading or font-size instead of setting
   its own.
9. Spot-checks: Windows Firefox at 125–150 % DPI; Tab into cards in Safari; one pre-2025 iPhone
   (scrollend fallback).

## Known limitations (v1)

- LTR only. No infinite loop — the ends rewind by default, or stop with `data-cs-rewind="false"`.
  `gallery` + `autoplay` together is unsupported (autoplay is ignored, console warning).
- iOS flicks advance ~one slide per gesture (WebKit limitation) — arrows/dots are the primary
  traversal there.
- **The slider emits the carousel and nothing around it**, deliberately. A section heading, a "View
  all" link, a full-bleed band behind the row: page furniture, built in the block with the site's
  own classes, with the slider placed inside. Wrapping them into the snippet would freeze another
  class name into the markup contract to do what the block markup already does — and `--strip-bg`
  paints the strip, not the page width, for the same reason.
