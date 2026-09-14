# Brands page and variant strip — browsing the library by OEM

2026-09-10. Approved by Steven ("your rec is fine", then "sure" to the design below). Follows
`2026-09-09-oem-variants-design.md`, which put a measured brand's values in `brands.js` and showed
them as a card nested under the pattern on `patterns.html`.

## The problem

The nested card was the plan's minimum, not a design. A designer building a Chevrolet site does not
start from "which pattern" — they start from "Chevrolet: what do we have?" — and the builder gives
no sign that the pattern on screen has a measured brand at all unless they open the Brand list and
read the note.

## The decision

Two surfaces, one data source.

1. **A Brands page** (`demo/brands.html`, tab **Brands** between Patterns and Reference) that
   browses by OEM first: every brand as a tile, a section per brand showing every pattern it has
   measured values for, live, with a link into the builder.
2. **A variant strip in the builder**: when the pattern on screen has measured brands, a chip row
   above the stage — Default and one chip per brand — that applies the brand the same way the Brand
   list does.

`patterns.html` goes back to one card per pattern. The nested variant cards go; a measured pattern
gets a one-line "Also measured for …" link into the Brands page.

Everything is read off `BRANDS` and `PATTERNS` through the generator. A new helper
`patternsOf(brand)` mirrors `variantsOf(pattern)`; both are exported on `CARGO`.

## The Brands page

**Head:** the same head, header and nav as `patterns.html`, with `aria-current` on Brands. Scripts:
engine, `looks.js`, `brands.js`, `highlight.js`, `workbench.js`, the new `brandbook.js`, `theme.js`.
It opens over `file://` like the others.

**Tiles.** One `.gx-tile` per brand in `BRANDS`, logo (`img/logo-<id>.png`, all 32 exist, 116×100)
and label. Measured brands first, then the rest alphabetically. A measured tile carries a
`.gx-variant`-style badge reading `N patterns`; a roster-only tile reads `roster only`. Each links
to `#<id>`.

**Sections.** One `<section id="b-<id>">` per brand, in the same order. Heading: logo + label + a
line of plain words — for a measured brand "Measured on <source>", for the rest "Vehicles and how
many across, from <brand>'s demo sites. Values not measured yet." Then:

- measured brand: one stage per pattern in `patternsOf(id)`, captioned with the pattern's label,
  built by `renderPattern(pid, cls, { brand: id })`, with "Open in the builder" →
  `index.html#<pid>?brand=<id>`.
- roster-only brand: one stage, the `modelbar` pattern with the brand applied (its cutouts at its
  ladder), "Open in the builder" → `index.html#modelbar?brand=<id>`. Fiat has no roster of its own;
  it draws with the Chevrolet fallback exactly as the builder does, and its note already says so.

Every stage is a live slider (initialised after append, like `gallery.js`). Pattern scripts run once
each, as on the patterns page.

**Deep link:** `brands.html#chevrolet` scrolls to that section; the sticky masthead offset rule that
`.gx-card` uses applies to `.bb-section` too.

## The variant strip

In `index.html`, directly above `.wb-stage`, an empty
`<nav id="wb-variants" aria-label="Measured brands for this pattern" hidden>`. `buildPanel()` fills
it (it already knows `brandsFor`): hidden when `variantsOf(state.pattern)` is empty; otherwise one
`<button type="button" data-brand="">Default</button>` plus one button per variant brand with the
logo and label. `aria-pressed="true"` on the one matching `state.brand` (Default when `state.brand`
is null or not a variant brand).

A click runs the same handler as the Brand list — extracted into `pickBrand(id)` in `workbench.js`
so the two cannot diverge — and the list's select shows the new value because `buildPanel()`
rebuilds it.

## The patterns page

`gallery.js` drops the variant-card loop and the extra index tiles. After a pattern's blurb, when
`variantsOf(id)` is non-empty, a line:
`Also measured for <a href="brands.html#chevrolet">Chevrolet</a>` (one link per brand,
comma-separated). `.gx-card--variant` and its rule go.

## Toyota

`toyotademo1` runs the tabbed cutout bar on the Chevrolet template (roster and ladder already
updated 2026-09-10). Its tab values are measured the same way Chevrolet's were and land as
`BRANDS.toyota.styles` with a `source`. The patterns page then lists both brands, the Brands page
shows two measured sections, and the strip has three chips on `tabs`.

## What measuring an OEM demo may and may not bring in

Steven, 2026-09-10: "we have made a lot of accessibility and performance improvements on our
iteration, perhaps even better styling properties and practices, and I do not want to lose those." A
measurement copies **knob values only**: colours, sizes, tab names, how many across. It never copies
markup, script, units or a CSS block, and `check-looks.mjs` fails the build on any `styles` key that
is not an existing knob, so the rule is mechanical rather than a habit. Everything else on a variant
is ours — the engine, the ARIA tab markup and keyboard handling, the live region, reduced motion,
`em` lengths (Chevrolet's 18px tab text landed as `1.125em` of the site body), legacy `rgba()`, the
paste-parity test, and the generated-CSS lint over every variant sheet. Where a demo shows a
practice worth having, it becomes a knob or a pattern change of ours, reviewed like any other, never
a copy.

## Gates and tests

- `lint-generated-css.mjs` already walks every variant; nothing new to add.
- `check-looks.mjs`: every brand has `demo/img/logo-<id>.png`.
- `tests/brands.test.mjs` (new): 32 tiles, measured first; a measured section has one stage per
  `patternsOf`; a roster-only section has one model-bar stage drawing that brand's cutouts; the deep
  link lands; "Open in the builder" links carry the brand.
- `tests/variants.test.mjs`: the strip is hidden on a pattern with no variants, shows Default plus
  the brands on `tabs`, a chip click applies the brand and the Brand select agrees, and the pressed
  chip follows the select; the patterns page has no nested card and carries the "Also measured for"
  link.
- `tests/layout.test.mjs` still holds the folder order (the strip is outside the pane).

## Not in scope

- Live thumbnails in the strip. The stage is the preview.
- Measuring any brand beyond Toyota.
- A search or filter over the 32 tiles.

## Addendum 2026-09-10: one brand control

The chip strip above the stage and the Brand list in the settings panel turned out to be two
controls over the same data, and they disagreed on a measured pattern - a pressed chip with the
panel's picker still reading "Start from the default". The strip is now the only brand control: a
chip per measured brand, a select for every other brand the card can take, and the note underneath
it. The Brand list left the settings panel, and its folder - "Brand and cards" where a pattern
carried both - is "The card" again, holding the card's own settings and nothing else.
