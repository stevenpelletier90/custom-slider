# Catalog pages

Two shareable pages for the team, both self-contained single HTML files with no
build step. Open either directly in a browser to preview before publishing.

| Page                     | Published                                                              | What it answers                                                                                    |
| ------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `model-bar-library.html` | <https://claude.ai/code/artifact/72367577-3336-4f58-abc1-5b0beb64ac08> | "Show me the model bars." Screenshots of every distinct variant, with its ladder and build recipe. |
| `oem-slider-census.html` | <https://claude.ai/code/artifact/88715cca-344b-4643-be15-20c82a0860c8> | "What sliders exist across the estate, and which do we support?" The numbers.                      |

Both are private until shared from the page's own share menu.

The source of truth for both is
[docs/research/2026-08-18-oem-demo-slider-census.md](../research/2026-08-18-oem-demo-slider-census.md).
When it changes, update the page and republish to the **same URL** so links
already handed out keep working.

## Regenerating the library

`shots/` holds the 18 source screenshots, captured live at 1280px.

    # 1. capture (needs playwright-core + a cached chromium; see capture.mjs)
    node capture.mjs ./shots

    # 2. rebuild the cards with the images inlined as data URIs
    node build-library.mjs ./shots .

`capture.mjs` picks one representative site per distinct breakpoint ladder plus
the composition outliers; `build-library.mjs` holds the per-site spec table
(ladder, tab count, dots, why it is interesting) that becomes each card.

## Encoding

**Both pages are pure ASCII** — every non-ASCII character is an HTML numeric
entity. A plain `python3 -m http.server` sends `text/html` with no charset, and
the em-dashes rendered as mojibake during preview. Entity-encoding makes the
pages render correctly regardless of what charset the host declares. Keep it
that way: re-run the encoder after editing.
