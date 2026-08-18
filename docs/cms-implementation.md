# Putting dl-carousel on a DealerOn site

> **Status: not deployed.** As of 2026-08-18 the files are not on FTP and no
> live site uses them. This documents the intended process so it is ready to go,
> and so the questions get settled before anything ships — not a runbook for
> work you can do today.

> **No hosted files yet?** You do not have to wait — the whole engine can be
> pasted into a page today. See [cms-no-hosting.md](cms-no-hosting.md). Your
> markup and CSS do not change when the hosted files land.

## 1. What ships

Two files, no dependencies, no build step on the site side:

| File              | Gzip    | What it does                                 |
| ----------------- | ------- | -------------------------------------------- |
| `dl-carousel.css` | ~1.2 KB | Layout, scroll-snap physics, control styling |
| `dl-carousel.js`  | ~4.8 KB | Wires controls, state, autoplay, fade, drag  |

Both come from `dist/` in this repo — never from `src/`, which is the readable
source and is not minified.

### Where they go

The platform already hosts shared third-party slider code at
`/assets/shared/CustomHTMLFiles/slick/slick.min.js`, so the natural home is
alongside it. **This is the open question to settle before launch:**

- **Shared path** (e.g. `/assets/shared/CustomHTMLFiles/dl-carousel/`) — one
  copy, every site gets fixes at once. This is the whole point of a replacement
  code, and the reason the HTML is a frozen contract: the engine can be replaced
  underneath every site without touching a single page.
- **Per-dealer Media Gallery** (`#MISCPATH#dl-carousel.js`) — works today with no
  platform involvement, but every site is then pinned to whatever version it got,
  and a fix means re-uploading to each one.

Recommend the shared path. Per-dealer upload is the fallback if a shared location
is not available, and it should be treated as temporary.

### How a page loads them

    <link rel="stylesheet" href="/assets/shared/CustomHTMLFiles/dl-carousel/dl-carousel.css">
    <script src="/assets/shared/CustomHTMLFiles/dl-carousel/dl-carousel.js" defer></script>

`defer` matters: the engine auto-initializes on `DOMContentLoaded`, and the CSS
already reserves the control space, so nothing shifts when the JS lands (CLS 0).

## 2. The markup contract

Everything the engine needs, and nothing it generates for you:

    <div class="dl-carousel my-strip" data-slider aria-label="Featured vehicles">
      <ul class="dl-carousel-track">
        <li class="dl-carousel-slide">…authored content…</li>
        <li class="dl-carousel-slide">…authored content…</li>
      </ul>
    </div>

Rules that are not negotiable:

- **The engine never injects slide content.** Every heading, link, and image is
  authored in the block. That is what keeps the content indexable and readable
  with JS off.
- **Never author control markup.** Arrows, dots, the pause button and gallery
  thumbs are all generated. A block containing its own arrows will end up with two sets.
- Give the root an `aria-label` (or `aria-labelledby`). A missing one logs a
  console warning at init.
- Images need `width` and `height` — that is what holds CLS at 0 — plus
  `loading="lazy"` on everything below the first visible slide.

## 3. Where the CSS goes

Per-site styling goes in **Style Only / Head Section (`styleCode`)**, which is
**raw CSS — no `<style>` tags and no comments.** The platform wraps and minifies
it. Do not put slider CSS in the block itself.

## 4. Picking a variation

Every variation is authored HTML plus site CSS over the same two files. The demo
page (`demo/index.html`) is the copy-paste catalog; each section's "How this
variant is built" block has the exact markup and CSS.

| You want                         | Use                                            |
| -------------------------------- | ---------------------------------------------- |
| Rotating homepage banner         | `data-fade` + `data-autoplay="5000"`, 1-up     |
| Model bar (cutouts, arrows only) | `data-step="slide"`, dots hidden, `--dlc-peek` |
| Model bar grouped by body style  | The above, one instance per tab pane           |
| Vehicle / service / offer cards  | Default page stepping, 1-2-3 per view          |
| Photo gallery with thumbnails    | `data-gallery`                                 |

**For a model bar, start from the ladder for that OEM.** All 55 OEM demo sites
share one anatomy and differ only in breakpoints; the fourteen ladders are
tabulated in the demo's model-bar section, already converted to the min-width
media queries `--dlc-per-view` uses. Do not re-derive them — slick counts
breakpoints as max-width and ours are min-width, so a hand conversion is where
this goes wrong.

## 5. Theming per OEM

Override custom properties in `styleCode`. Never edit the engine:

    .my-strip {
      --dlc-per-view: 2;
      --dlc-gap: 1rem;
      --dlc-peek: 60px;
      --dlc-arrow-bg: #0b2a4a;
      --dlc-arrow-fg: #fff;
      --dlc-dot-current: #0b2a4a;
    }
    @media (min-width: 769px) { .my-strip { --dlc-per-view: 5; } }

Full list in the README under "CSS custom properties".

## 6. Replacement codes inside slider markup

The slider is ordinary block HTML, so the usual rules apply unchanged:

- **Tokenize dealer identity** — `#NAME#`, `#CITY#`, `#STATE#`, `#CONTACTUS#`
  (wide `#CONTACTUSW|#`, narrow `#CONTACTUSN|#`) — rather than hardcoding it.
- **`%(…)` SEO codes NEVER resolve inside a Custom HTML block.** They work only
  in the platform's own SEO fields. Do not put them in slide copy.
- **Uploaded images:** reference flat as `#MISCPATH#<file>`, never a hardcoded
  `/static/dealer-<id>/…`. Verify the served URL after uploading — subfolder
  behavior is per-dealer. Platform-shared assets
  (`/static/industry-automotive/…`, `/static/brand-<make>/…`) stay literal.
- **Vehicle cutouts for a model bar:** `#CHROMEPHOTOPATH|<StyleID>|<angle>|<size>#`
  — Style IDs from the Chrome Photo Builder. Angle 1 at 640 is what the demo uses.
- **Block storage is Latin-1** — HTML-entity-encode anything outside it.
- Replacement codes do **not** resolve in hosted WordPress blogs. Use literal
  text there.

## 7. What not to do

- **Do not fork the engine per site.** If a site needs something the engine
  cannot do, that is a request against this repo, not a local copy. A forked
  copy silently opts that site out of every future fix.
- **Do not add slider CSS to the block.** It belongs in `styleCode`.
- **Do not rename the classes or data attributes.** `dl-carousel`,
  `-track`, `-slide`, the `data-*` options and the `--dlc-*` properties are a
  frozen contract precisely so the engine can be swapped later without editing
  any site.
- **Do not add autoplay to a card strip.** Zero of the 55 OEM model bars
  autoplay. Rotation belongs on the hero and nowhere else.
- **Do not hide slides to "fix" screen-reader counts.** Off-screen cards stay in
  the accessibility tree deliberately.

## 8. After placing a slider

- Everything is Fastly edge-cached — hand out review links cache-busted (`?123`,
  any query value forces a miss), and clear your own browser cache before
  debugging anything "missing".
- Check it with the keyboard: Tab should reach pause → prev → next → dots →
  the cards, and focus should never disappear.
- Check it with JS disabled — the strip must still scroll and every slide must
  still be readable.
- Run the ADA scanner before closing the case.
