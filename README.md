# Custom Slider

Dependency-free scroll-snap slider/carousel. The engine is 6.2 KB gzip (JS 4.9 +
CSS 1.4); the shipped stylesheet also carries 2 KB of card styles, so a site
downloads 7.8 KB in total — the figure the demo masthead prints, from the same
measurement. No build step required to use, themed entirely with CSS custom
properties. Built to be maintained in-house: the whole engine is one commented
file, `src/custom-slider.js`. `npm run size` is the authority on all of these.

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

    <div class="cs my-slider cs-sm-2 cs-md-3" data-cs aria-label="Featured vehicles">
      <ul class="cs-track">
        <li class="cs-slide">…</li>
        <li class="cs-slide">…</li>
      </ul>
    </div>

Every `[data-cs]` element initializes automatically. Slides-per-view is CSS, not
a JS option: the `cs-xs-N` / `cs-sm-N` / `cs-md-N` / `cs-lg-N` classes ship in
the stylesheet for N of 1–8, on Bootstrap 3's tiers — **768 / 992 / 1200**, the
grid the storefronts actually run. There is no 576. One class per tier where the
count changes; the engine's own default is one across, so `cs-xs-1` is never
needed.

Setting `--cs-per-view` by hand in a media query does the same thing and is what
the classes are made of, but on a DealerOn page your CSS goes in the **Style
Only** field as raw CSS — no `<style>` tags — so there is no in-page `<style>`
block to put it in. Write `.my-slider.cs { … }` rather than `.my-slider { … }`
there: a bare class ties with the engine's own `.cs`, and then source order,
which you do not control, decides which wins.

## Quick start (ES module)

    import { CustomSlider } from './src/custom-slider.js';
    const slider = new CustomSlider(document.querySelector('.my-slider'), { autoplay: 4000 });

JS options override data attributes, which override defaults.

## Markup contract

- Root: `class="cs"` (+ `data-cs` for auto-init) with `aria-label` or `aria-labelledby`.
- Name: one more class of your own on the root — `my-slider` — which is what
  your settings hang off. **It must be unique on the page.** Two sliders sharing
  a name share their rules, and the second block's CSS wins for both: measured
  on a pair of model bars, the first strip took the second's 3em gap and its
  slides went from 208.6px to 180.6px, with nothing on the page saying so. The
  builder puts the field beside its copy buttons for this reason.
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

## One shared copy, no version in the filename

The two files are meant to live at one URL every site links, and the filenames
carry no version — so a fix reaches every storefront at once, and so would a
mistake. What makes that safe is the contract, not the filename: class names
(`cs`, `cs-track`, `cs-slide`, the generated control classes), the data
attributes, the `--cs-*` properties, the `cs:*` event payloads, the public
methods and the accessibility behaviours are frozen. **Adding is fine. Renaming
or repurposing is not**, because the sites already linking the file cannot be
edited to keep up.

That rule was always written down. With a shared copy it stops being a
preference and becomes the only thing standing between a rename and every
storefront that links it.

Files named `dl-carousel.js` / `dl-carousel.css` are **not** an older version of
these. That was the pre-rename engine and it is a different contract — root
class `dl-carousel`, `--dlc-*` properties, `window.DLCarousel`. A page linking
those and pasting a snippet from the current builder gets an unstyled list, so
they should be removed rather than left alongside. Note that the pre-rename
build is currently served under the CURRENT filenames rather than its own — see
"Deployment status" below for what is actually on the shared path today, and the
rename map for moving a page across.

## Card styles come with the stylesheet

`dist/custom-slider.css` is the engine **plus** a small library of card styling:
the seven card looks and a set of column classes, about 2 KB gzip of the file. The
engine itself styles no cards on purpose — `cs-*` is mechanism, `cargo-*` is content
— but every site that links it gets the card half too, so a slider is mostly just
its markup:

```html
<link rel="stylesheet" href="/path/custom-slider.css" />
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

The card half is **generated** from the same look definitions the builder draws with
(`scripts/build-cards.mjs` appends it behind a `/*! cards */` marker), so the file and
the preview cannot disagree. `npm run size` splits on that marker and weighs only the
engine against the budget below — the budget's job is to show the engine undercuts
Embla's core and Splide, and neither of those ships a card library.

**Paste the card styles too** in the builder inlines a look's own rules into the
snippet, for a page that links a `custom-slider.css` older than the card half. It
carries the card styling **only** — never the engine's layout and physics — so on
a page with no stylesheet at all the block renders as a full-width vertical list
with static arrows, whatever the column classes say. Measured, not assumed: track
`display: block`, `overflow-x: visible`, `scroll-snap-type: none`, slide
`flex-basis: auto`.

For a page that genuinely cannot link the files, use `npm run paste`. It writes
`dist/paste/1-style-only.css` (engine **and** cards, comment-free for the Style
Only field) and `dist/paste/2-body-bottom.html`. That is the route that works
without the stylesheet; the checkbox is not.

## CSS custom properties

Every one of them is tabulated with its live default on the Reference page,
which reads them out of the shipped stylesheet rather than counting by hand:
`--cs-per-view`, `--cs-gap`, `--cs-peek` (edge sliver of the next
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
  The **width** is the one exception: `--cs-per-view: 1` is pinned in the
  stylesheet off the authored `data-cs-fade`, so a fading carousel is one across
  from first paint and init shifts nothing. Without it, a hero authored three
  across laid out as a three-across strip and jumped a whole image height when
  the script ran — measured 195.1px to 529.4px on a 1170px page — and that is
  also what a no-JS visitor was left looking at. It means the `cs-*-N` classes
  and your own `--cs-per-view` are **ignored on a fading carousel**, which is
  intended: a crossfade is 1-up. `data-cs-fade="false"` keeps its columns.
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

### Deployment status — the one place it is written down

**As of 2026-09-02 the current engine is NOT yet on FTP.** The two files live at

    /assets/shared/CustomHTMLFiles/Responsive/Apps/customSlider/custom-slider.css
    /assets/shared/CustomHTMLFiles/Responsive/Apps/customSlider/custom-slider.js

and both URLs answer 200 today — but with the **pre-rename dl-carousel build**
under the current names. Measured 2026-09-02, cache-busted: the CSS is 4,885 B
and begins `.dl-carousel{--dlc-per-view: 1;--dlc-gap: 1rem`, with zero
occurrences of `.cs{` or `--cs-`; the JS is 15,444 B and exposes `DLCarousel`.
`last-modified` on both is 2026-08-28. `dl-carousel.css` and `dl-carousel.js`
are **404** at that path — the old build is there only under the new names.

So a `cs`/`data-cs` snippet linked to those URLs renders as a plain list right
now. Nothing on a live site links them yet, which is what makes the upload
simple: it replaces those two files in place, under the same names. The other
two documents defer to this section; do not restate a status in them.

**Uploading (do not skip the cache step).** Both files are served with
`cache-control: max-age=1814400` — 21 days — from behind Fastly. Overwriting a
file does not shorten that: a browser that already fetched the old one keeps it
for up to three weeks.

1. Run `npm run build`, then `npm run size`, and confirm the gate is green.
2. Upload `dist/custom-slider.css` and `dist/custom-slider.js` over the two
   paths above. Same names, same folder.
3. Verify with a cache-busted request, not a browser reload:
   `curl -s ".../custom-slider.css?cb=$RANDOM" | head -c 40` should begin
   `.cs{--cs-per-view` — if it still says `.dl-carousel`, the upload has not
   landed.
4. Anyone who opened a page linking the old file needs a hard refresh, or to
   wait out the TTL. Say so when you hand a test page over.

### Moving a page off dl-carousel

The old contract is a different set of names throughout, so a page cannot be
half-migrated. Rename map:

| Old (dl-carousel)   | Current (cs)          |
| ------------------- | --------------------- |
| `dl-carousel`       | `cs`                  |
| `dl-carousel-track` | `cs-track`            |
| `dl-carousel-slide` | `cs-slide`            |
| `--dlc-*`           | `--cs-*`              |
| `data-slider`       | `data-cs`             |
| `data-slider-*`     | `data-cs-*`           |
| `window.DLCarousel` | `window.CustomSlider` |

Finding the pages that link the shared folder is Steven's, and nothing is
believed to be live on it yet — the known consumer is a designer test page built
on the old classes. Migrate a page by rebuilding its slider in the builder and
re-pasting all three parts, rather than by editing class names in place: the
snippet's CSS, markup and script have to agree with each other.

### Changing a slider that is already live

The builder cannot read a snippet back in — there is no import, and settings
reset on reload — so there are two supported routes, and which one depends on
what changed:

- **Content** (a heading, a link, a photo, adding or removing a card): edit the
  **Custom HTML** block directly. Copy an existing `<li class="cs-slide">…</li>`
  and change it. Nothing else has to move.
- **Settings** (how many across, gap, arrow colours, card style, a different
  pattern): rebuild it in the builder and re-paste all three parts — CSS, HTML
  and script. Re-pasting only the CSS leaves markup that no longer matches it.

Either way **the class name must not change**. `.my-slider` is what the Style
Only rules hook onto; rename it and every setting silently stops applying. Give
a second slider on the same page a different name instead.

Replacement codes (`#NAME#`, `#CITY#`, `#STATE#`, `#CONTACTUS#`) resolve inside
a Custom HTML block, so they are safe in slide text and headings. They do **not**
resolve in the Style Only field, and `#MISCPATH#` in an `img src` only resolves
once that dealer has the file in their gallery.

## Development

    npm install
    npm run build   # src → dist (esbuild)
    npm run size    # build + gzip budget gate (fails at or over 6656 B / 6.5 KB total)
    npm run serve   # http://127.0.0.1:8137 (for Lighthouse)

`src/` is the canonical, readable code; `dist/` is the checked-in CMS build.
Rebuild and re-commit `dist/` whenever `src/` changes.

## Verification checklist (run before shipping changes)

1. `npm run size` and `npm run validate` pass, and `npm test` is green — 13
   browser checks of what the copy panel hands over, about ten seconds. They
   cover what a linter cannot: that the pasted code still lays itself out, and
   lays itself out the way the preview did. They are not a substitute for the
   rest of this list, which is the sweep across every pattern and width.
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
- **The slider emits the carousel and nothing around it**, deliberately. A
  section heading, a "View all" link, a full-bleed band behind the row: page
  furniture, built in the block with the site's own classes, with the slider
  placed inside. Wrapping them into the snippet would freeze another class name
  into the markup contract to do what the block markup already does — and
  `--strip-bg` paints the strip, not the page width, for the same reason.
