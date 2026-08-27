# OEM look reference shots

`shots/` holds the screenshots the card components in `demo/assets/looks.js`
were built from — one per distinct OEM look found in the August 2026 census of
76 demo homepages. They are the evidence behind each component's `absorbs`
list: what "band-gray" or "name-top-chip" actually looked like on the site it
came from.

The generators that once built browsable HTML pages from these
(`build-library.mjs`, `capture.mjs`, `encode.mjs`, and the two generated pages)
were deleted on 2026-08-27 when the demo became a single configurable
workbench. Browsing a gallery of near-identical strips was the thing that made
the old demo confusing; the looks now exist once each, as components you select.

The measurements taken from these shots live in
`docs/research/2026-08-18-oem-demo-slider-census.md`, and the ladders they
produced are recorded per brand in `demo/assets/brands.js`.
