# Slider variations — design

Date: 2026-08-07 · Status: **approved 2026-08-07** (Steven) — decisions: D6 approved (measured cost 148 B gzip, 5269/6144); model bar uses Chrome Photo Builder cutouts (Steven's call,
supersedes the SVG-silhouette recommendation — sourced from a live DealerOn storefront's public Chrome paths); packaging = recipes only; D1 confirmed Featured Vehicles only.

Inputs: 2026-08-04 team meeting + Slack follow-ups (Casey, Dylan, Cliff, Tony, Sarah), plus live-site research done for this spec: forddemo1.dealeron.com, legaldemo7.leadscience.com,
client32811.leadscience.com (Skaug Law), bordaslaw.com, gregoryhoaglaw.com, michaelgreerpools.com — rendered markup scraped and runtime slider options read live (slick/Splide/Bootstrap
configs), not inferred.

## 1. What the team asked for

1. **Model bar example** (Dylan) — like forddemo1.dealeron.com, to show it works across OEMs.
2. **Faded left/right preview of the next item** (Cliff).
3. **Handle different-sized images by default** (Tony) — "the default state of the code should be able to take images with different dimensions, to eliminate the need to crop or add
   additional code".
4. **Whole card clickable** on Featured Vehicles (Casey, seconded by Pete).
5. **A base version for customization plus pre-built variations** (group decision).

## 2. What the real examples actually do (research summary)

- **forddemo1 model bar**: slick, `slidesToShow: 5 / 3 / 1`, **`slidesToScroll: 1`** (one card per click), arrows only, no dots, no autoplay, infinite via clones. Cards are OEM studio
  **transparent-PNG cutouts** at a uniform angle/scale, model name below, **whole card links** to inventory search. Hover zooms the cutout. Four body-style tabs each wrap their own
  carousel instance (with a `height: 0` hidden-tab hack so slick can measure).
- **client32811 (Skaug) practice areas**: slick, 3-up desktop, `slidesToScroll: 1`, whole card is the link, equal-height cards, images normalized in a **fixed-aspect `cover` box**
  (`padding-top: 62%`). Mobile is Cliff's exact look: `centerMode` with 15% peek and **non-active slides dimmed to opacity 0.3**.
- **legaldemo7 (LS)**: three Splide carousels, all **page-at-a-time** (`perPage == perMove`) — matches dl-carousel's stepping natively. Practice-area tiles are `aspect-ratio: 10/16`
  cover boxes; results carousel fades only the last visible card as a "more content" cue; pagination restyled as a segmented bar (which our models section already rebuilds).
- **bordaslaw / gregoryhoag / michaelgreer** (Casey's law examples): all slick or Bootstrap, all arrows-only (dots absent or commented out), all `slidesToScroll: 1`. Notable shapes:
  text-stat strip with whole-card links (Bordas results, 5–6-up), video+text card opening a modal player, fade-mode quote carousel with a **fixed-height internally-scrollable quote
  box** (equal heights despite wildly different review lengths), fading two-image collage gallery feeding a grouped lightbox.
- **Cross-cutting**: nobody lets mixed image sizes drive layout — every site normalizes with fixed-ratio cover boxes or uniform cutouts. Autoplay appears only on the Ford hero (which
  ships a pause control), never on card carousels. Fade transitions appear three times (Ford hero, Hoag quotes, Greer gallery) — fade mode is a documented dl-carousel v1 non-goal.

## 3. Design

Guiding rule (unchanged from v1): **the engine stays frozen; every variation is authored HTML + site CSS + optional page script on the demo page.** One optional engine addition is
proposed (D6) and gated on Steven's approval. Everything else is zero engine bytes.

### D1 — Featured Vehicles: whole card clickable

Stretched-link pattern on the existing section: `.demo-card` is already `position: relative`; give the existing "View details" `<a>` an `::after` covering the card (`position:
absolute; inset: 0`). The card's accessible name stays the link's current short `aria-label`; add a `:focus-within` ring on the card and a hover cue. No markup restructuring, no
engine change. Scope: **this section only** — the models strip already wraps its cards in `<a>`.

### D2 — New section: Model bar (the forddemo1 rebuild)

- Anatomy per card: cutout-style image + model name below, **whole card is a link** (`<a>` wrapping, `aria-label="Explore the <model>"`), hover/focus zoom guarded by
  `prefers-reduced-motion` — same pattern as the existing models strip.
- Layout: `--dlc-per-view: 2 / 3 / 5` (mobile / tablet / desktop), arrows in gutters, **dots hidden** (`display: none` + `--dlc-controls-space: 0px` — keep the unit, unitless 0 breaks the engine's `calc()`s) to match every researched dealer
  implementation; the track stays swipeable and arrows remain, so no navigation is lost. Default rewind (wrap at ends ≈ the infinite-loop feel without clones).
- With the demo's 6 models at 5-up, page stepping already lands one card per click (pages clamp to `[0, 1]`), so **this section needs no engine change**. The step-by-one gap only
  appears with real lineup counts — that is D6.
- **Assets**: Ford uses OEM press cutouts, which we can't put in a public repo. Ship 6 placeholder **SVG vehicle silhouettes** (uniform scale, tiny, no licensing risk, obviously
  placeholders) with a docs note to swap in licensed OEM cutout PNGs per brand — and re-theme via `--dlc-*` to show the across-OEMs point. Open question 2 offers the alternative of
  waiting for Steven's planned slider image library.

### D3 — New section: Faded peek preview (Cliff's ask)

- Built entirely from existing knobs: `--dlc-peek` (already in the engine: track padding + `scroll-padding-inline`) shows a sliver of the previous/next slide at each edge; a static
  `mask-image: linear-gradient(to right, transparent, #000 <peek>, #000 calc(100% - <peek>), transparent)` on `.dl-carousel-track` fades those slivers out — the same technique the
  thumb strip already uses. At the ends the fade covers empty peek padding, so nothing readable is ever lost. Pure CSS, zero JS, PRM-safe; arrows/dots sit outside the track and are
  unaffected.
- Reuses the existing gallery photos (no new image weight). 1-per-view mobile → 3-per-view desktop.
- Skaug's mobile treatment (centered active slide, neighbors dimmed to 0.3) needs `scroll-snap-align: center`, which the engine's scroll math doesn't support — deliberately out of
  scope (§4); the mask approach delivers the same "preview of the next item" read.

### D4 — Mixed image sizes: default recipe + proof section (Tony's ask)

Position (the middle ground Steven wanted): **recommend uniform assets, but make the default card recipe indifferent to source dimensions.** The research backs this — every real site
normalizes with a fixed-ratio cover box; none lets ragged image sizes drive layout.

- Recipe: media box with fixed `aspect-ratio` + `inline-size: 100%` + `object-fit: cover` for photos (`contain` for cutouts/logos). Any source dimensions render neatly; `width`/
  `height` attributes still required (CLS 0).
- New small demo section feeding deliberately mismatched images (portrait / landscape / square, generated locally from the existing Unsplash files, kept small) through the recipe, so
  the claim is demonstrated, not asserted. Details block documents cover-vs-contain and the "uniform assets still preferred" guidance.
- Add one sentence to the existing copy-paste blocks pointing at the recipe.

### D5 — Packaging: base version + pre-built variations

- **Base**: new "Stock" section near the top showing the engine's untouched default look (no section on the page currently does — they all restyle the arrows), with the minimal
  copy-paste markup. This is the "base version for customization".
- **Pre-built variations**: each demo section keeps being a complete copy-paste recipe (markup + the exact site CSS in its details block). The demo page gets a short jump-link TOC —
  at 7+ sections it needs one.
- A shipped `dist/dl-carousel-variants.css` of named variant classes is **deferred**: it adds a second maintained contract surface, and per-site restyling is the actual deployment
  model (DealerOn styleCode). Promotion criterion: when 2–3 real sites adopt the same recipe verbatim, promote that recipe to a variants file (outside the core size gate, with its own
  size note).

### D6 — The one engine candidate: `data-step="slide"` (optional, Steven's call)

Both researched **dealer/slick** implementations advance one card at a time regardless of cards-in-view; the **Splide/LS** ones step by page like dl-carousel. To reproduce the dealer
feel on real lineup counts (e.g. 8 models at 3–5-up, where pages jump 3–5 cards), the engine would need an additive option: `data-step="slide"` → `next()`/`prev()` move `index ± 1`
instead of page math; dots stay per-page (dealer implementations hide dots anyway); rewind semantics unchanged. Additive to the frozen contract (allowed), estimated ~100–200 B gzip
(**unverified — must be measured with `npm run size`**; current 5121/6144). Fallback if declined: a documented page-script escape hatch (capture-phase listener on the arrows calling
`goTo(index ± 1)`), or simply accept page stepping. Recommendation: approve it, but it can also be deferred until the first real site needs it — nothing else in this spec depends on
it.

## 4. Deliberately out of scope

- **Fade transition mode** (Hoag quotes, Greer gallery, Ford hero) — v1 non-goal; substitution is slide-in-place. Revisit only with a real client requirement.
- **Center-mode snapping** (Skaug mobile) — engine scroll math assumes `start` alignment.
- **Tabs wrapping multiple carousel instances** (Ford, Skaug, Hoag) — real pattern, but `_measure()` inside a hidden `display: none` / `height: 0` pane is untested and slick needed
  hacks for it; test before offering as a recipe. Future candidate.
- **Video-modal card, live-review widgets (Trustindex), lightbox gallery** — page/site territory, not slider variations.
- **Logo marquee** (Hoag/Greer) — already CSS-only on those sites; needs no carousel engine at all.
- Autoplay on any new card section — no researched site does it, and the reviews section already demonstrates the capability.

## 5. Implementation shape (for the plan, after approval)

Files touched: `demo/index.html` (D1 + four new sections + TOC), `demo/img/` (SVG silhouettes, mixed-size derivatives, CREDITS.md update), `README.md` (one-line pointer to the
variations demo). Only if D6 approved: `src/dl-carousel.js` + rebuilt `dist/` in the same commit, measured with `npm run size`. Nothing else.

Verification: full README checklist (not just the size gate) — Lighthouse a11y 100 / CLS 0, keyboard walk including the new stretched links and the dots-hidden model bar, JS-disabled
pass, 375/768/1280 screenshots, spot-check the scripted image derivatives, `npm run validate`.

## 6. Open questions for Steven

1. **D6 `data-step="slide"`**: approve the engine bytes now, defer until a real site needs it, or decline? (Recommended: approve; measured cost gate still applies.)
2. **Model bar placeholders**: SVG silhouettes now (recommended), or hold the section until your slider image library has licensed cutouts?
3. **Packaging**: recipes-on-the-demo-page only (recommended), or also ship `dist/dl-carousel-variants.css` now?
4. Confirm whole-card-clickable is wanted **only** on Featured Vehicles (models strip already has it; reviews/gallery cards have nothing to link to).
