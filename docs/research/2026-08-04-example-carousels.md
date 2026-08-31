# Team example carousels — full research notes

The six sites shared in the 2026-08-04 slider meeting (Dylan, Sarah, Casey) and Slack follow-ups, analyzed 2026-08-07 for the variations round. Method: rendered HTML scraped
(Firecrawl), then **runtime options read live in a browser** — Slick via `$(el).slick('getSlick').options`, Bootstrap via `$(el).data('bs.carousel').options`, Splide from the inline
init scripts — so per-view counts, advance behavior, autoplay, and fade claims below are measured, not inferred. Condensed conclusions live in
`../superpowers/specs/2026-08-07-slider-variations-design.md` §2; this file is the per-site detail.

## 1. forddemo1.dealeron.com — the model bar (Dylan's example)

**Hero banner** (context): Bootstrap 3 carousel (`carousel carousel-fade slide`), 11 slides, fade, autoplay 5 s with a real pause button
(`fieldset.carousel-navigation-controls` — prev / pause / next) plus 11 dot indicators. Each slide is a whole-slide link wrapping a `<picture>` with uniform 1920×600 marketing JPGs.

**Model bar** ("Something for Everyone"): Bootstrap tab nav `ul#myTab` with 4 tabs (SUVs & Crossovers / Trucks & Vans / All Electric / Cars); **each tab pane contains its own slick
instance** on `aside.modelBarS`, all initialized by one selector:

```js
$('.modelBarS').slick({
  slidesToShow: 5,
  slidesToScroll: 1,
  centerPadding: '60px',
  autoplay: false,
  swipeToSlide: true,
  arrows: true,
  responsive: [
    { breakpoint: 991, settings: { centerPadding: '40px', slidesToShow: 3 } },
    { breakpoint: 460, settings: { centerPadding: '40px', slidesToShow: 1 } },
  ],
});
```

- 5-up desktop, **one card per advance**, arrows only, no dots, no autoplay; infinite via slick clones. A tab whose models fit exactly (SUVs, 5) renders no arrows/clones.
- Card: `div.model<Name> > a` (whole card links to `/searchnew.aspx?Make=Ford&Model=X`) > `img.carImage` + `p.vehicleName` (`aria-hidden="true"`). No per-card price/CTA — one shared
  "Explore All New Models" button under the bar.
- Images: OEM studio **transparent-PNG cutouts** (`/static/brand-ford/Homepage/model-bar/2025/*.png`, ~400 w), uniform angle/scale. Hover zoom:
  `.carImage { transform: scale(0.85) } .carImage:hover { transform: scale(0.9) }`.
- Infrastructure hacks worth knowing: anti-FOUC `.modelBarS { display:none; visibility:hidden }` until `.slick-initialized`; Bootstrap hidden-tab hack so slick can measure inside
  inactive panes: `.tab-content>.tab-pane { display:block; height:0; overflow-y:hidden } .tab-content>.active { height:auto }`.
  **Custom Slider does not need either** — verified 2026-08-07: an instance auto-inited inside a `[hidden]` pane re-measures itself on reveal (ResizeObserver).

## 2. legaldemo7.leadscience.com (Sarah's LS demo)

DealerOn platform underneath (dealer-32691 static paths). **Three Splide v4 carousels**, all arrows + pagination, none autoplay, all draggable. Pagination styled as a **segmented
progress bar**, not dots (`.splide__pagination` max-width 228px, `li { flex: 1 }`).

- **Practice areas** (`#splide01`): 8 slides, `perPage: 4, perMove: 4` — **full page per advance**; breakpoints 1199→3, 991→2, 538→1. Whole card is `a.practice-area.h3`: portrait tile
  `aspect-ratio: 10/16`, cover photo with the darkening gradient baked into the inline `background-image` stack; hover animates `padding-bottom` to lift the label.
- **Results** (`#splide02`): 10 **text-only** slides (`$3.2M` / subtitle / `h3`), `perPage: 5, perMove: 5`. Custom page JS adds `is-last-visible` to the trailing visible card, which
  renders faded — a "more content this way" affordance (their only non-active-slide fade).
- **Blog** (`#splide03`): 8 slides, `perPage: 4, perMove: 4, gap: 24px`. Whole card is `a.blog-item`: rounded bordered card, uniform landscape thumb on top, `h3` + excerpt.

## 3. client32811.leadscience.com — Skaug Law (Sarah's "advances one card at a time" example)

Practice-area carousel behind a pill tab toggle ("Personal Injury" / "Workers Compensation") — same one-selector-many-instances pattern as the Ford model bar, same
`display:none`-until-init and `height: 0` hidden-tab hacks. Slick init:

```js
$('.practice-areas').slick({
  slidesToShow: 3,
  slidesToScroll: 1,
  centerPadding: '60px',
  autoplay: false,
  swipeToSlide: true,
  arrows: true,
  responsive: [
    { breakpoint: 1600, settings: { centerPadding: '40px', slidesToShow: 3 } },
    { breakpoint: 1200, settings: { centerPadding: '40px', slidesToShow: 2 } },
    { breakpoint: 767, settings: { centerPadding: '15%', centerMode: true, slidesToShow: 1 } },
  ],
});
```

- 3-up desktop, **one card per advance**, arrows only (55 px chevrons in gutters reserved by `.slick-list { margin: 0 55px }`), no dots, no autoplay, infinite via clones.
- **Mobile is Cliff's faded-peek case**: ≤767 px switches to `centerMode` with 15% neighbor peek and dims non-active slides —
  `.slick-slide { opacity: 0.3 } .slick-slide.slick-active { opacity: 1 }`. Desktop has no peek and no dim.
- **Whole card is the link** (`a.practice-item`): white rounded card, image in a fixed-aspect cover box (`padding-top: 62%`, 77% ≤539 px — their mixed-image-size normalization; photos
  come from both industry-stock and dealer-upload paths), serif `h3`, description with `flex-grow: 1` + `.slick-track { display: flex }` for **equal-height cards**, "Read More" text
  line with arrow icon. Hover ≥992 px: image zoom 1.01→1.1 inside `overflow: hidden`.

## 4. bordaslaw.com (Casey)

All slick. Three carousels:

- **Results text strip** (near hero): `aside.quickNav`, 12 text-only cards (`p.h2` dollar amount + one-line description), **whole card links** to `/our-results/` (all cards the same
  href). 6-up >1600 / 5 at 1440 / 4 ≤1300 / 3 ≤1050 / 2 ≤767 / 1 ≤540; `slidesToScroll: 1`; arrows only; `infinite: false` (prev arrow renders `slick-disabled` at the start — the
  rewind-off pattern).
- **Video & text testimonials** (lower): `div.video-scroller`, 10 slides, 1-up at every width. Two-column card: cover-cropped 55%-ratio image with play overlay (LEFT), name + fixed
  tagline + "Click to Watch" (RIGHT). Card is NOT a link — image and text both open a Bootstrap modal with a Vimeo embed; video never plays inline. Verified
  `autoplay: true, autoplaySpeed: 3000, infinite: true` — a 3 s autoplay on video testimonials, aggressive.
- **Logo strip**: 14 award badges, same option ladder as the results strip, arrows only.

## 5. gregoryhoaglaw.com (Casey's "interesting testimonials")

- **Case results cards** (mid-page, dark): slick, 6 text-only rounded cards (category eyebrow / `$2 Million` / description), 3-up desktop → 2 ≤1200 → 1 ≤767, `slidesToScroll: 1`,
  `infinite: true`, **`autoplay: true, autoplaySpeed: 3000`**, arrows only. Cards are inert (no links).
- **Testimonials — the notable pattern**: a TABBED double widget. Tab 1 "Featured" = Bootstrap 3 carousel in **fade mode** (`carousel-fade`, interval 5000, pause on hover): pull-quote
  headline, then the quote in `div.review-text.has-scrollbar` with `tabindex="0"` — a **fixed-height, internally scrollable quote box** so wildly different review lengths never change
  slide height (the cleverest detail found; worth stealing for a future quote variation). Dot indicators exist in source but are commented out. Tab 2 "More Reviews" = a Trustindex
  live-Google-reviews slider widget.
- Also present: a **pure-CSS logo marquee** (`div.logo-slider` with `--width/--height/--quantity/--position` custom properties, no JS library) — appears on Michael Greer too; already
  dependency-free, needs no carousel engine.

## 6. michaelgreerpools.com (Casey's gallery)

- `aside.galleryS`, slick in **fade mode** (`fade: true, speed: 500`), `infinite: true`, arrows only, no dots/autoplay. 3 slides; each slide is a **two-image collage** (flex row,
  deliberately staggered heights 535×585 + 535×435). Every image is a link (`data-toggle="lightbox"`, ekko-lightbox) and `data-cs-gallery="gallery"` groups all 6 photos so lightbox
  arrows page across every image regardless of source slide.
- All carousel images are cover-cropped CSS `background-image` divs — no real `<img>` elements (SEO/no-JS liability Custom Slider's authored-HTML rule avoids). Site also hides the
  whole gallery pre-init (`.galleryS { display: none }`) — a CLS/no-JS liability the CSS-first design avoids.

## Cross-site patterns (what drove the variation designs)

- **Libraries**: slick everywhere on the DealerOn-style builds (Ford, Skaug, Bordas, Hoag, Greer), Splide v4 on the newer LS demo, Bootstrap 3 for hero/fade cases. No owl/swiper/glide.
- **Two advance models**: slick sites always `slidesToScroll: 1` (card-at-a-time); Splide sites always `perPage == perMove` (page-at-a-time, Custom Slider's native model). This split is
  why `data-cs-step="slide"` was added.
- **Dots are dead** in this space: absent or commented out on every card carousel; arrows-only is the norm. Segmented progress bars replace dots on the LS demo (the existing
  "Explore Chevrolet Models" demo section already rebuilds that).
- **Nobody lets mixed image sizes drive layout**: fixed-aspect cover boxes (`padding-top: 62%`, `aspect-ratio: 10/16`, 55% ratio) or uniform cutouts everywhere — basis for the
  demo's aspect-box recipe.
- **Autoplay only on heroes** (with a pause control) — never on card strips, except Hoag/Bordas testimonial-ish strips at an aggressive 3 s.
- **Fade mode appears three times** (Ford hero, Hoag quotes, Greer gallery) — still a deliberate Custom Slider v1 non-goal; substitution is slide-in-place.
- **Tabs wrapping same-class carousel instances** (Ford ×4, Skaug ×2, Hoag ×2) — rebuilt as the demo's "Model bar with tabs" without slick's `height: 0`/anti-FOUC hacks.
