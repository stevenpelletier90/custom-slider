# OEM demo slider census — 76 DealerOn demo sites

Date: 2026-08-18 · Method: scripted fingerprint of all 76 rendered homepages, plus live
runtime verification in a real browser on representative sites.

Prompted by the 2026-08-11 Creative Solutions sync: "here is a link to a bunch we might need
to start cataloguing and organizing ones that are the same both for diff OEMs etc."

**Shareable versions** (both in [docs/catalog/](../catalog/)):

- **[Model Bar Library](https://claude.ai/code/artifact/72367577-3336-4f58-abc1-5b0beb64ac08)** —
  screenshots of every distinct model bar, captured live at 1280px, each with its
  breakpoint ladder and the CSS to rebuild it. This is the one to open if you want to
  _see_ the variants.
- **[OEM Slider Census](https://claude.ai/code/artifact/88715cca-344b-4643-be15-20c82a0860c8)** —
  the numbers behind this document.

## 1. Method

1. **Roster discovery.** The Salesforce Knowledge article (ka0UP000000B3k9YAC) is behind
   Lightning auth and could not be read. The roster was instead derived by probing the
   `<oem>demo<N>.dealeron.com` convention that `forddemo1` and `kiademo1` both follow.
   **76 live hosts across 32 OEM brands** responded 200. (`chevydemo*` is not the
   convention; `chevroletdemo*` is.)
2. **Fingerprint pass.** All 76 homepages fetched and parsed by
   `scratchpad/census/fingerprint.mjs`: `<style>` blocks and HTML comments stripped first
   (bundled Bootstrap CSS otherwise produces false `carousel` hits on all 76), then
   balanced-delimiter extraction of every `.slick(...)` init with its bound selector and
   config, including the `responsive` breakpoint ladder.
3. **Live verification.** Claims that depend on runtime behavior — does the hero actually
   rotate, is a pause control actually rendered — were checked in a real browser, not
   inferred from markup. This corrected two wrong readings (see §5).
4. **Counting correction.** The first pass counted slick **init calls**, but a single
   `$('.modelBarS').slick({…})` initializes _every_ matching element — so instance count is
   not bar count. Re-counting `.modelBarS` **elements** in the markup is what revealed the
   tabbed grouping in §4.1. Any figure below that says "bars" counts elements; "instances"
   counts init calls.

## 2. Headline finding: only five slider selectors exist estate-wide

The variety the team perceives across OEMs is **skin, not structure.**

| Selector           | Distinct sites | What it is                             |
| ------------------ | -------------- | -------------------------------------- |
| `.modelBarS`       | **55**         | The model bar                          |
| `.corpcell-slider` | 3              | Subaru 3-up card strip, page-stepping  |
| `.filtering`       | 2              | Mazda filter UI (not a content slider) |
| `.quick-nav-5`     | 1              | Lexus quick-nav, center-mode           |
| `.galleryS`        | 1              | Lexus gallery, center-mode             |

80 slick instances total across 76 sites.

## 3. The fade hero is the most common pattern — and we do not support it

**68 of 76 sites run a Bootstrap `carousel-fade` hero at `data-interval="5000"`.** That makes
it more widespread than the model bar (55).

It was missed by the 2026-08-04 research because it is **Bootstrap**, not slick: `fade` appears
in **0 of 55** slick configs. The prior spec concluded fade was a low-priority Cliff
nice-to-have; by deployment count it is the estate's number-one pattern.

Verified live on `bmwdemo1`: active slide advanced 1 → 4 over 12 s, jQuery `bs.carousel` bound,
`data-ride` absent (JS binds it explicitly, which is why the static-markup count of
`data-ride="carousel"` is only 2/76 and misleading).

Anatomy: 1-up, full-bleed, `carousel-fade`, 5 s interval, `carousel-indicators` dots on 57/76,
whole-slide anchor wrapping a `<picture>` with mobile/desktop `srcset`.

## 4. The model bar is one pattern with fourteen breakpoint skins

All 55 instances share an identical anatomy. Option prevalence:

| Option           | Distribution                                           |
| ---------------- | ------------------------------------------------------ |
| `slidesToScroll` | **1 on 53/55** (5 on kiademo2, absent on hyundaidemo1) |
| `arrows`         | `true` on 55/55                                        |
| `autoplay`       | **`false` on 55/55**                                   |
| `swipeToSlide`   | `true` on 55/55                                        |
| `centerPadding`  | `60px` on 53/55                                        |
| `dots`           | absent on 52/55                                        |
| `infinite`       | absent 50, `false` 4, `true` 1                         |
| `centerMode`     | `true` on 1 (kiademo1)                                 |
| `fade`           | **absent on 55/55**                                    |
| `rows`           | `2` on 1 (hyundaidemo1)                                |

Three of these directly validate existing dl-carousel decisions: `slidesToScroll: 1` is exactly
`data-step="slide"`; `centerPadding: 60px` is exactly `--dlc-peek`; `autoplay: false` everywhere
confirms card strips must never auto-rotate.

### 4.1 Thirty of the 55 group several model bars under tabs

Tabbed model bars are the estate's dominant composition, not a single-OEM flourish:
**30 of the 55 model-bar sites carry more than one model bar**, grouped under tabs by body
style or fuel type.

| Bars | Sites                                                                |
| ---- | -------------------------------------------------------------------- |
| 5    | chevrolet 1-3, subaru 1-3, toyota 1                                  |
| 4    | ford 1, honda 1, lexus 1-3, nissan 2-3, toyota 2-3                   |
| 3    | cadillac 1-3, genesis 1-3, hyundai 1 & 3, kia 1-2, volvo 1-2, vw 1-2 |
| 1    | the remaining 25                                                     |

The groupings themselves:

| OEM                           | Model-bar tab groups                                                |
| ----------------------------- | ------------------------------------------------------------------- |
| Chevrolet, Subaru, Toyota     | Trucks · Electric · Crossovers/SUVs · Performance · Commercial      |
| Toyota                        | Popular · Cars & Minivan · Trucks · Crossovers & SUVs · Electrified |
| Ford, Honda, Lexus, Nissan    | SUVs & Crossovers · Trucks & Vans · All Electric · Cars             |
| Genesis, VW                   | SUV · Sedan · Electric (VW: Bus)                                    |
| Kia, Cadillac, Hyundai, Volvo | SUV/CUV/MPV · Hybrid/Electric · Sedan                               |

**Reading trap:** nearly every site also carries a separate **Buy / Finance / Lease**
tablist for payments. It is a different widget and must not be counted as model-bar
grouping — it is why a naive `role="tab"` count returns 6-8 tabs on sites that have only
3-5 model-bar groups.

### The fourteen ladders

slick breakpoints are max-width. `5 | 768:3 460:2` reads: 5 per view above 768, 3 at ≤768,
2 at ≤460. Translating to dl-carousel's min-width CSS means inverting these.

| Per view | Ladder (max-width)           | Sites | Hosts                                                      |
| -------- | ---------------------------- | ----- | ---------------------------------------------------------- |
| 5        | 768→3, 460→2                 | 13    | acura1-3, ford2-3, gmc1-2, honda2-3, kia2-3, mitsubishi1-2 |
| 5        | 1199→4, 991→3, 539→2         | 11    | cadillac1-3, chevrolet1-3, subaru1-3, volvo1-2             |
| 5        | 991→3, 600→2, 400→1          | 6     | lexus1-3, nissan2-3, toyota1                               |
| 4        | 768→3, 460→2                 | 5     | buick1-2, jaguar1, landrover1, landrover3                  |
| 4        | 1200→3, 992→2, 540→1         | 5     | genesis1-3, vw1-2                                          |
| 4        | 992→3, 460→2                 | 3     | lincoln1-3                                                 |
| 5        | 991→3, 460→1                 | 2     | ford1, honda1                                              |
| 5        | 1200→4, 992→3, 460→1         | 2     | hyundai2-3                                                 |
| 3        | 991→2, 768→1                 | 2     | mazda1-2                                                   |
| 2        | 540→1                        | 2     | toyota2-3                                                  |
| 6        | 1800→4, 1200→3, 992→2, 540→1 | 1     | alfaromeo1                                                 |
| 6        | 1200→4, 992→3, 768→2, 360→1  | 1     | audi1                                                      |
| 3        | 768→1 (centerMode, 10px pad) | 1     | kia1                                                       |
| —        | `rows: 2`, no ladder         | 1     | hyundai1                                                   |

The 21 sites without `.modelBarS` do not have a model bar section on the homepage at all —
they are not using a different library for it.

> **Correction (2026-08-19, see §11):** the paragraph above overreached. "No `.modelBarS`"
> only ever meant "no slick" — the fingerprint detected the absence of a library, not the
> absence of a model bar. The live pass over the internal per-OEM model-bar reference found
> official non-slick model bars on at least BMW (Bootstrap tab panes plus a static mobile
> stack on bmwdemo1), Porsche (hover-reveal tile grid on porschedemo1) and INFINITI (tile
> grid on infinitidemo1). forddemo5's static grid (§10.5) was the first crack in this claim;
> §11 shows it is a family. The original sentence is kept as written above, as the record of
> what the fingerprint alone could support.

## 5. Accessibility findings (live-verified)

Two corrections to static-markup readings, both found by checking the running page:

- **A pause control does exist.** Static HTML shows 0/76, because the platform injects it at
  runtime. It is a real `<button aria-label="Click to pause slide rotation.">`. However it
  renders at **16 × 6 px**, under the WCAG 2.5.8 (AA) 24 × 24 minimum, and carries
  `id="hiddenPlayPauseControl-Main"`.
- **The heroes genuinely auto-rotate**, despite `data-ride` being nearly absent — confirmed by
  observing slide index change over 12 s.

Further gaps in the platform hero:

- Dots are `<li role="button" tabindex="0">` inside `<ol role="group">` — not real buttons.
- `aria-live="off"` on `.carousel-inner`.
- No `prefers-reduced-motion` handling observed on the rotation.

dl-carousel already handles all of these correctly: a full-size pause button first in tab order,
real `<button>` dots, a terse dedicated status region, and reduced-motion resolved per scroll call.

## 6. Implications for the library

1. **Build the fade hero.** Largest gap by deployment (68/76), and the accessible-replacement
   argument is concrete rather than theoretical.
2. **Ship the ladder recipes.** Fourteen ladders is a closed set — an OEM build should start
   from the right one, not guess.
3. **The model bar needs no rework.** The census validates it as shipped — but the demo's
   tabbed variant should show 3-5 groups, not 2, since that is the real shape (§4.1).
4. **Center-mode and the two-row grid turned out to be buildable** — see §8. Both were filed
   as out of scope on the assumption they needed engine work. Tested, neither does.

## 7. The roster — every site, linked

All 76 homepages, so anyone can open the original rather than take this document's
word for it. Numbers are the demo index (`<brand>demo<N>.dealeron.com`).

| Brand      | Demos                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Acura      | [1](https://acurademo1.dealeron.com/) · [2](https://acurademo2.dealeron.com/) · [3](https://acurademo3.dealeron.com/)                |
| Alfa Romeo | [1](https://alfaromeodemo1.dealeron.com/)                                                                                            |
| Audi       | [1](https://audidemo1.dealeron.com/)                                                                                                 |
| BMW        | [1](https://bmwdemo1.dealeron.com/) · [2](https://bmwdemo2.dealeron.com/) · [3](https://bmwdemo3.dealeron.com/)                      |
| Buick      | [1](https://buickdemo1.dealeron.com/) · [2](https://buickdemo2.dealeron.com/)                                                        |
| Cadillac   | [1](https://cadillacdemo1.dealeron.com/) · [2](https://cadillacdemo2.dealeron.com/) · [3](https://cadillacdemo3.dealeron.com/)       |
| Chevrolet  | [1](https://chevroletdemo1.dealeron.com/) · [2](https://chevroletdemo2.dealeron.com/) · [3](https://chevroletdemo3.dealeron.com/)    |
| Chrysler   | [1](https://chryslerdemo1.dealeron.com/)                                                                                             |
| Dodge      | [1](https://dodgedemo1.dealeron.com/)                                                                                                |
| Fiat       | [1](https://fiatdemo1.dealeron.com/)                                                                                                 |
| Ford       | [1](https://forddemo1.dealeron.com/) · [2](https://forddemo2.dealeron.com/) · [3](https://forddemo3.dealeron.com/)                   |
| Genesis    | [1](https://genesisdemo1.dealeron.com/) · [2](https://genesisdemo2.dealeron.com/) · [3](https://genesisdemo3.dealeron.com/)          |
| GMC        | [1](https://gmcdemo1.dealeron.com/) · [2](https://gmcdemo2.dealeron.com/)                                                            |
| Honda      | [1](https://hondademo1.dealeron.com/) · [2](https://hondademo2.dealeron.com/) · [3](https://hondademo3.dealeron.com/)                |
| Hyundai    | [1](https://hyundaidemo1.dealeron.com/) · [2](https://hyundaidemo2.dealeron.com/) · [3](https://hyundaidemo3.dealeron.com/)          |
| Infiniti   | [1](https://infinitidemo1.dealeron.com/) · [2](https://infinitidemo2.dealeron.com/)                                                  |
| Jaguar     | [1](https://jaguardemo1.dealeron.com/)                                                                                               |
| Jeep       | [1](https://jeepdemo1.dealeron.com/) · [2](https://jeepdemo2.dealeron.com/)                                                          |
| Kia        | [1](https://kiademo1.dealeron.com/) · [2](https://kiademo2.dealeron.com/) · [3](https://kiademo3.dealeron.com/)                      |
| Land Rover | [1](https://landroverdemo1.dealeron.com/) · [2](https://landroverdemo2.dealeron.com/) · [3](https://landroverdemo3.dealeron.com/)    |
| Lexus      | [1](https://lexusdemo1.dealeron.com/) · [2](https://lexusdemo2.dealeron.com/) · [3](https://lexusdemo3.dealeron.com/)                |
| Lincoln    | [1](https://lincolndemo1.dealeron.com/) · [2](https://lincolndemo2.dealeron.com/) · [3](https://lincolndemo3.dealeron.com/)          |
| Mazda      | [1](https://mazdademo1.dealeron.com/) · [2](https://mazdademo2.dealeron.com/)                                                        |
| MINI       | [1](https://minidemo1.dealeron.com/) · [2](https://minidemo2.dealeron.com/) · [3](https://minidemo3.dealeron.com/)                   |
| Mitsubishi | [1](https://mitsubishidemo1.dealeron.com/) · [2](https://mitsubishidemo2.dealeron.com/) · [3](https://mitsubishidemo3.dealeron.com/) |
| Nissan     | [1](https://nissandemo1.dealeron.com/) · [2](https://nissandemo2.dealeron.com/) · [3](https://nissandemo3.dealeron.com/)             |
| Porsche    | [1](https://porschedemo1.dealeron.com/) · [2](https://porschedemo2.dealeron.com/) · [3](https://porschedemo3.dealeron.com/)          |
| RAM        | [1](https://ramdemo1.dealeron.com/) · [2](https://ramdemo2.dealeron.com/)                                                            |
| Subaru     | [1](https://subarudemo1.dealeron.com/) · [2](https://subarudemo2.dealeron.com/) · [3](https://subarudemo3.dealeron.com/)             |
| Toyota     | [1](https://toyotademo1.dealeron.com/) · [2](https://toyotademo2.dealeron.com/) · [3](https://toyotademo3.dealeron.com/)             |
| Volkswagen | [1](https://vwdemo1.dealeron.com/) · [2](https://vwdemo2.dealeron.com/)                                                              |
| Volvo      | [1](https://volvodemo1.dealeron.com/) · [2](https://volvodemo2.dealeron.com/)                                                        |

**Where to look at each pattern live:**

| Pattern                                       | Best example                           |
| --------------------------------------------- | -------------------------------------- |
| Fade hero, no model bar on the page           | <https://bmwdemo1.dealeron.com/>       |
| Model bar, 5-up, ungrouped                    | <https://acurademo1.dealeron.com/>     |
| Model bar in 5 body-style tabs                | <https://chevroletdemo1.dealeron.com/> |
| Model bar in 3 tabs + background transition   | <https://kiademo1.dealeron.com/>       |
| Center-mode model bar (out of scope for us)   | <https://kiademo1.dealeron.com/>       |
| Center-mode quick-nav and gallery             | <https://lexusdemo2.dealeron.com/>     |
| Page-stepping card strip (`.corpcell-slider`) | <https://subarudemo1.dealeron.com/>    |
| Two-row grid (`rows: 2`, out of scope)        | <https://hyundaidemo1.dealeron.com/>   |

These are internal DealerOn demo sites, not client sites — safe to open, click
around, and screenshot for design review.

## 8. The "out of scope" patterns, re-tested (2026-08-18)

Center-mode and the two-row grid were both filed as out of scope on the assumption they
needed engine changes. Tested rather than assumed, neither does — **the estate is fully
covered with no engine work**.

### Centre-mode

| Site                 | slick config                | Reproducible?                         |
| -------------------- | --------------------------- | ------------------------------------- |
| lexusdemo2 gallery   | 1 up, `centerPadding: 20%`  | **Exactly** — measured 0px off centre |
| kiademo1 model bar   | 3 up, `centerPadding: 10px` | **Visually yes**, see caveat          |
| lexusdemo2 quick-nav | 3 up, `centerPadding: 9%`   | **Visually yes**, see caveat          |

`--dlc-peek` already pads both edges and shifts the snap points, so at **one card per view** a
large peek puts the active card dead centre with slices of its neighbours either side —
measured at exactly 0px off centre. That is slick's centre mode, reproduced with a CSS custom
property we already ship.

**Caveat above one card per view:** the look is reproducible, but slick treats the _middle_
visible card as current whereas we treat the _leftmost_ as current. Neither Kia's model bar
nor Lexus's quick-nav visually marks a current card, so on those two the difference is
invisible. It would matter on a design that highlights the centred card.

### Two-row grid (hyundaidemo1, `rows: 2`)

CSS only — the track becomes a two-row grid with columns flowing across. Shipped as the
`#grid` demo section.

**The one thing to get right:** the engine counts _cards_, not columns, and in two rows the
next card along is the one directly underneath. So `--dlc-per-view` must be the number of
cards on screen (columns × 2), with a separate `--dlc-cols` sizing the columns. Get that
pairing wrong and an arrow click moves half a screen or nothing at all — which is exactly what
happened on the first attempt, before it was measured.

With the pairing right, one arrow click moves one full screen and the dot count is correct:
verified at 1280px (4 columns, 3 visible, 2 dots) and 700px (4 columns, 2 visible, 2 dots).

### Coverage

Every slider pattern in the estate is now buildable. The only entry that stays out is Mazda's
`.filtering`, which is a filter UI and not a carousel at all.

## 9. Inner pages — the 2026-08-19 sweep

The census above stops at the homepage. On 2026-08-19 a second sweep followed **one demo site
per brand** (`<brand>demo1`) inside: SRPs (new/used/CPO), VDPs, model detail pages, specials,
service, and about/staff pages — **~190 inner pages** fingerprinted by static `curl`, no
browser. 32 sites were attempted; **24 had their full page set reachable**, and every count
below is drawn from those 24 — the other 8 did not expose a full page set to the crawl and are
excluded from the counts rather than partially counted.

### Method, and the static-HTML limitation

Same fingerprint approach as §1 — `<style>` blocks stripped before matching, balanced-delimiter
extraction of every `.slick(...)` init — but no live-verification pass this time. That matters
more here than it did on the homepages: **DealerOn SRP vehicle cards are 100% client-rendered**
(cosmos API JSON → skeleton loaders), so the single biggest inner-page slider surface — the
per-card image carousel on every SRP — is invisible to a static fetch. What _is_ visible
statically: every SRP ships `slick.min.js` plus the full slick CSS with **zero** static init or
markup, and the cosmos JSON for each card carries a `VehicleImageCarouselModel` with a
`PhotoList`. The carousel is real; only a live browser can show which library actually renders
it. Representative live-check candidates, for whenever that pass runs:
`acurademo1`/`gmcdemo1`/`lexusdemo1`/`subarudemo1`/`volvodemo1` `searchnew.aspx`, an Acura VDP
and CPO page, `ramdemo1.dealeron.com/2019-ram-1500.html`, and
`kiademo1.dealeron.com/model-showroom`.

### Thirteen distinct patterns, two of them universal

Inner-page sliders collapse into **~13 functionally distinct patterns**. Two are platform
components on effectively every site; the rest are authored one-offs concentrated on
model-detail and service pages.

The two universal ones first, because they reframe the pitch:

1. **The VDP photo gallery is DealerOn's own component, and it is architecturally
   dl-carousel.** Every VDP runs `data-dlron-type="vehicle-image-carousel"` — a native CSS
   scroll-snap track (`.hero-carousel__items`) with hover arrows, an image counter, and
   thumbnail strips, plus a second instance inside a fullscreen modal
   (`.vehicle-image-gallery`) with a vertical thumbnail rail and video-thumb support.
   **slick is not loaded on VDPs at all.** The platform's newest slider already made the
   native-scroll-snap bet dl-carousel makes.
2. **The SRP per-card image carousel is runtime-injected.** Universal across every SRP and
   SRP-shaped model landing page on all 24 sites (~50+ pages) — the biggest slider surface on
   inner pages — but confirmable only live, per the limitation above.

The authored instances:

| Pattern                                                                                                                | Where                                                                                      | Prevalence                                                 |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| Certified-service tile carousel — 3-up slick strip of 6 coupon/feature cards, arrows + dots                            | [buick](https://buickdemo1.dealeron.com/service) / cadillac / chevrolet / gmc `/service`   | 4 sites, byte-identical init (shared GM template)          |
| Tabbed feature-card carousels — Bootstrap tabs each wrapping a 3-up slick strip                                        | [INFINITI QX60 demo page](https://infinitidemo1.dealeron.com/2026-infiniti-qx60-demo.html) | 1 page, 8 instances                                        |
| Trim-card strip — 10 trim cards, 4-up, arrows only                                                                     | [Kia Telluride](https://kiademo1.dealeron.com/2027-telluride)                              | 1 page                                                     |
| Synced filterable gallery — main fade carousel + thumb nav (`asNavFor`), category filter buttons driving `slickFilter` | [Kia Telluride](https://kiademo1.dealeron.com/2027-telluride)                              | 1 page, 7 instances — densest custom slider found          |
| Mixed photo+video gallery — synced pair with fade/speed disabled when slides contain video                             | Kia Telluride; platform VDP `data-carousel-content-type=video`                             | 1 authored page + platform support                         |
| Center-mode technology strip — 10 cards, 3-up, 160px center padding                                                    | [Nissan Rogue](https://nissandemo1.dealeron.com/nissan-rogue)                              | 1 page                                                     |
| Autoplaying feature cards — 3-up, autoplay on                                                                          | [MINI Countryman](https://minidemo1.dealeron.com/mini-countryman.html)                     | 1 page — the only autoplaying card strip found anywhere    |
| Sitewide incentive chrome — Bootstrap fade promo banner + slick 3-up offer strip                                       | [Subaru](https://subarudemo1.dealeron.com/service.aspx), every inner page                  | 1 site, but on **all** of its inner pages                  |
| Service hero promo rotator — Bootstrap 3 auto-cycling banner, 2 slides                                                 | [Lexus service](https://lexusdemo1.dealeron.com/service.aspx)                              | 1 page — only genuine Bootstrap carousel on any inner page |
| `<do-banner>` web component — 2-banner SRP incentive slot, runtime-rendered                                            | [Mitsubishi SRPs](https://mitsubishidemo1.dealeron.com/searchnew.aspx)                     | 1 site's SRPs (platform component)                         |
| **Dormant** Maverick trim showcase — slick init + assets still ship, target markup commented out                       | [Ford Maverick](https://forddemo1.dealeron.com/2025-ford-maverick.html)                    | 1 page — 100% dead payload                                 |

Recorded to prevent future false positives: the VDP similar-vehicles row is a plain flex
overflow strip (no library), `refine_slider` is the SRP filter drawer, Lincoln Corsair's
"gallery-section" is a tabbed grid with modals, and Lexus's `.carousel-model` is Bootstrap
tabs despite the name. None are sliders. Homepage markers (`modelBarS`, corpcell, quick-nav,
`galleryS`) were confirmed absent from inner pages — §2's inventory does not leak inward.

### Coverage, and the four sections built to close it

Most patterns map onto demo sections that already existed: the GM service tiles →
[#cards](../../demo/index.html#cards), the Subaru/Lexus/Mitsubishi banners →
[#hero](../../demo/index.html#hero), the Kia trim strip, Subaru offer strip, and MINI cards →
[#vehicles](../../demo/index.html#vehicles), the INFINITI tab wiring →
[#modelbar-tabs](../../demo/index.html#modelbar-tabs), the Nissan and dormant Ford
center-mode strips → [#peek](../../demo/index.html#peek), and the inline VDP gallery →
[#gallery](../../demo/index.html#gallery).

Four patterns had no demo counterpart. All four now do — added to `demo/index.html` on
2026-08-19:

| New section                                                                             | Covers                                                                                           |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [#card-gallery](../../demo/index.html#card-gallery) — Vehicle cards with a mini gallery | The SRP per-card carousel: a small dl-carousel instance nested inside each card of a grid        |
| [#gallery-filter](../../demo/index.html#gallery-filter) — Filterable gallery            | Kia's `slickFilter` pattern: filter buttons narrowing a synced main+thumb pair, page script only |
| [#media-gallery](../../demo/index.html#media-gallery) — Gallery with photos and video   | Mixed photo+video slides with video-badged thumbnails                                            |
| [#lightbox](../../demo/index.html#lightbox) — Fullscreen gallery in a dialog            | The VDP fullscreen viewer: dl-carousel in a modal with a vertical thumb rail                     |

### Dead weight, for the positioning notes

Two findings worth quoting when the byte budget comes up:

- **Ford ships a fully dormant slider.** `forddemo1`'s Maverick page still loads slick and
  still calls `$('.maverick-gallery').slick(...)` — but the entire target markup block is
  commented out, replaced by a static grid. The library is 100% dead payload on that page,
  and its font-face path leaks onto Acura/Alfa Romeo/Audi SRPs.
- **Every SRP estate-wide loads slick JS + CSS for a runtime card carousel** that dl-carousel
  could replace inside its entire < 6 KB gzip budget — less than slick's own CSS-and-JS
  freight, before counting jQuery.

## 10. The full estate — the 2026-08-19 hostname sweep

§1's roster came from probing the obvious `<brand>demo<N>` stems and stopping when they
stopped answering. On 2026-08-19 the probe was made exhaustive: every brand stem × indexes
1–8, extended to 14 wherever the tail kept answering, plus the combined-brand and genre stems
the first pass never tried (`buickgmc`, `cdjr`, `group`, `powersports`, `mb`, `ferrari`,
`maserati`). Non-contiguous numbering is proven — `cadillacdemo4` is a 404 while
`cadillacdemo5`–`7` exist, and `minidemo6` exists with no 4 or 5 — so a 404 was never allowed
to end a stem's probe early. The Salesforce Knowledge article that should be the
authoritative roster (§1) is still behind Lightning auth; reconciling this probe against it
remains pending.

### 10.1 The corrected numbers

| Count   | What                                                                          |
| ------- | ----------------------------------------------------------------------------- |
| **154** | live hostnames — the 76 from §1 plus 78 newly discovered                      |
| **25**  | of the 78 are redirect aliases                                                |
| **129** | distinct sites                                                                |
| **53**  | newly analyzed real sites, fingerprinted 2026-08-19 (static HTML — see §10.7) |

§§1–8 remain the fully fingerprinted homepage baseline of **76** and are deliberately not
restated against 129 — this section is the diff on top of them.

The 25 aliases (a fetch of the alias hostname lands on the target):

| Alias           | Redirects to                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------- |
| cadillacdemo5   | cadillacdemo1                                                                                   |
| cadillacdemo6   | cadillacdemo2                                                                                   |
| cadillacdemo7   | cadillacdemo3                                                                                   |
| cdjrdemo5       | cdjrdemo3                                                                                       |
| chevroletdemo5  | dealer17728 — outside the demo set, unanalyzed                                                  |
| chryslerdemo2   | chryslerdemo1                                                                                   |
| forddemo8       | forddemo7                                                                                       |
| forddemo9       | forddemo7                                                                                       |
| forddemo10      | forddemo7                                                                                       |
| forddemo11      | forddemo2 — already in the library                                                              |
| forddemo12      | forddemo6                                                                                       |
| forddemo13      | forddemo3 — already in the library                                                              |
| forddemo14      | forddemo1 — already in the library                                                              |
| genesisdemo4    | genesisdemo1 — already in the library                                                           |
| hyundaidemo6    | dealer26244 — outside the demo set, unanalyzed                                                  |
| kiademo4        | kiademo3 — already in the library; fetched content confirms Acura ladder                        |
| kiademo5        | kiademo2 — already in the library; confirms full-screen paging, `slidesToScroll = slidesToShow` |
| lexusdemo5      | lexusdemo3 — already in the library; confirms Lexus ladder                                      |
| lexusdemo6      | lexusdemo4                                                                                      |
| lincolndemo5    | lincolndemo4                                                                                    |
| mitsubishidemo5 | mitsubishidemo3 — already in the library                                                        |
| mitsubishidemo6 | mitsubishidemo1 — already in the library                                                        |
| nissandemo6     | nissandemo3 — already in the library; confirms Lexus ladder, tabbed                             |
| toyotademo8     | toyotademo2 — already in the library                                                            |
| vwdemo4         | vwdemo1 — already in the library                                                                |

Two of the 53 real sites also answer through `dealerNNNNN` redirects but serve unique,
analyzed content: `jaguardemo3` (serves `dealer19076`) and `lexusdemo7` (serves
`dealer22691`). They count as sites, not aliases.

### 10.2 New brands and genres

Seven stems the original probe never tried, plus deeper tails on known stems:

- **mb (Mercedes-Benz) × 4** — all four are hero-only pages, slider-free beyond the fade hero.
- **ferrari × 2** — both carry model bars on new ladders (below), both `infinite: true`.
- **maserati × 4** — background-video hero, two hero-only pages (one with a second decorative
  fade rotator), and the estate's first 1-up centre-mode spotlight model bar.
- **buickgmc × 4** — brand-tabbed (Buick · GMC) model bars on the Chevrolet ladder.
- **cdjr × 4 (+1 alias)** — brand-logo-tabbed model bars on a new 6-up ladder.
- **group × 5** — multi-rooftop group sites; groupdemo1 runs the estate's first two
  autoplaying strips.
- **powersports × 4** — brand-logo and category-tile strips standing in for the model bar,
  two background-video heroes.

Deep tails: ford now runs to `demo14` (8–14 are all aliases), toyota to `demo9` (8 is an
alias), lexus to `demo7` (5–6 are aliases), and cadillac's 5–7 are aliases of 1–3.

### 10.3 Eight new ladders

Exact tiers, straight from the fingerprints — these feed the generator, so the numbers are
copied verbatim. Tiers read min-width, matching §4's convention after inversion. `dots` is
false on all eight; the two `group` strips are the only autoplaying ones.

| Ladder                                                                                                                                                                        | Hosts            | Notes                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CDJR 6-up: base 2 → ≥461px 3 → ≥992px 6 (slick: slidesToShow 6 \| 991:3, 460:2; centerPadding 60px, slidesToScroll 1, swipeToSlide, arrows, autoplay false)                   | cdjrdemo1–4      | Only 6-up ladder with just three tiers (Alfa/Audi 6-ups have five). One shared init covers 4–5 `.modelBarS` bars, one per brand tab-pane. cdjrdemo2/3/4 hide the whole widget below md (`hidden-xs`); cdjrdemo2/4 place it _above_ the hero in DOM order.             |
| Powersports brand strip 6-up: base 2 → ≥461px 3 → ≥769px 6 (slick: slidesToShow 6 \| 768:3 @40px pad, 460:2 @40px pad; otherwise standard recipe)                             | powersportsdemo1 | Selector is `.brandsNav`, not `.modelBarS` — slides are brand logos, not vehicles. Same tiers as the Acura ladder but tops out at 6 instead of 5.                                                                                                                     |
| Powersports category 5-up: base 2 → ≥461px 3 → ≥993px 5 (slick: slidesToShow 5 \| 992:3 @40px pad, 460:2 @40px pad)                                                           | powersportsdemo2 | One-off tier set: like Acura (2/3/5) but the 5-up threshold is 993 instead of 769; like Lincoln's 461/993 thresholds but 5-up. Slides are body-style category tiles (Motorcycles/ATVs/Scooters), not models.                                                          |
| Ferrari flat 3-up: base 1 → ≥768px 3 (slick: slidesToShow 3, infinite:true, cssEase linear, centerPadding '60'/'40', centerMode:false \| 767:1)                               | ferraridemo1     | Near-twin of the Kia1 1/3@769 centre-mode ladder but _not_ centre-mode, boundary is 768 not 769, and it is the estate's only `infinite: true` untabbed bar besides ferraridemo2. No swipeToSlide/autoplay keys — a different slick recipe from the volume-brand bars. |
| Ferrari photo 4-up: base 1 → ≥769px 2 → ≥993px 3 → ≥1441px 4 (slick: slidesToShow 4, infinite:true, cssEase linear \| 1440:3, 992:2, 768:1)                                   | ferraridemo2     | Only ladder anywhere with a 1441 tier; maxes at 4-up only above 1440px. Slides are photo cards, not cutouts.                                                                                                                                                          |
| Maserati spotlight: 1-up centre-mode at every width; centerPadding 20% base → 23% at ≥992px (slick: centerMode:true, slidesToShow 1, infinite:true \| 991: centerPadding 20%) | maseratidemo4    | Structurally the lexusdemo2 gallery recipe (1-up + large `--dlc-peek`, already proven 0px-off-centre reproducible in §8) applied to a model bar — first model bar in the estate to use it.                                                                            |
| Group makes logo strip: base 2 → ≥769px 4 → ≥993px 7, **autoplay on** (slick: slidesToShow 7, arrows:true \| 992:4, 768:2)                                                    | groupdemo1       | Selector `.makes` — transparent-black OEM logo links to `/searchnew.aspx?make=X`. First autoplaying homepage card strip in the estate (§4 had `autoplay: false` on 55/55 model bars); 7-up is the widest per-view seen anywhere.                                      |
| Group locations 4-up: base 1 → ≥769px 2 → ≥993px 4, **autoplay on** (slick: slidesToShow 4, arrows:true \| 992:2, 768:1)                                                      | groupdemo1       | Selector `.locations` — dealership-location cards (logo, address, phone, Visit Website CTA). A genuinely new content type for a strip: multi-rooftop group navigation.                                                                                                |

### 10.4 The known ladders grew — six of the fourteen absorbed 26 new sites

26 of the 35 new slick-strip sites land _exactly_ on six ladders from §4, which means the
Chevrolet and Lexus tiers are now the estate's true workhorses, worn by eight OEM brands:

| Ladder (min-width)               | Was | Now | New wearers                                                        |
| -------------------------------- | --- | --- | ------------------------------------------------------------------ |
| Acura 2/3/5 @ 461/769            | 13  | 19  | acura4, ford4, honda4, honda5, mitsubishi4, toyota9                |
| Chevrolet 2/3/4/5 @ 540/992/1200 | 11  | 19  | buickgmc1–4, chevrolet4, ford6, ford7, subaru4                     |
| Lexus 1/2/3/5 @ 401/601/992      | 6   | 14  | lexus4, lexus7, nissan4, nissan5, toyota4–7                        |
| Buick 2/3/4 @ 461/769            | 5   | 7   | jaguar3, landrover4 — both wearing the new JLR photo-card dressing |
| Lincoln 2/3/4 @ 461/993          | 3   | 4   | lincoln4                                                           |
| Hyundai 1/3/4/5 @ 461/993/1201   | 2   | 3   | hyundai4 — tabbed SUVs · Sedans · Electrified                      |

The fade hero holds its crown: **44 of the 53** new real sites carry it (top-of-page on
most). The tabbed composition of §4.1 also holds: 21 of the 35 new slick-strip sites are
tabbed, validating the 3–5-group demo shape.

### 10.5 Structurally new patterns

Things the 18 Aug census had no example of at all:

- **Static model grid, zero JS** — forddemo5: a `.modelBar` flex-wrap grid, 6-across →
  4-across at ≤1199px → 2-across at ≤450px, no slick on the page. First no-slider model strip
  seen; a pure-CSS competitor to the bar.
- **Autoplaying strips** — groupdemo1's `.makes` 7-up logo strip and `.locations` 4-up
  rooftop-card strip both set `autoplay: true`, breaking the census's
  autoplay-false-everywhere rule — though on non-`.modelBarS` selectors, so §4's model-bar
  claim itself still stands. Both use the show()-before-init CLS-mitigation pattern.
- **Brand-tabbed model bars** — tabs switch OEM _brand_ rather than body style/fuel:
  buickgmc1–4 (two text tabs) and cdjr1–4 (4–5 logo tabs with a sliding caret indicator over
  a dark band). All of §4.1's groupings were body-style/fuel; multi-brand grouping is new.
- **Background-video hero** — a full-bleed muted looping `<video>` replacing any carousel:
  groupdemo1, maseratidemo1, powersportsdemo3, powersportsdemo4 (and kiademo2 was confirmed
  to carry one via its kiademo5 alias). Not in the library's hero patterns.
- **Arrows-only fade hero, no indicator dots** — hondademo4, subarudemo4, toyotademo4–7:
  six sites. §3's anatomy lists dots on 57/76; this variant should be a documented hero
  option.
- **Search-led homepages with the fade banner demoted mid-page** — nissandemo4/5,
  powersportsdemo2 (sometimes boxed in a `bg-main` border-x container); the hero also sits
  _after_ the model bar in DOM order on cdjrdemo2/4, forddemo4 and mitsubishidemo4. The
  library treats the fade hero as top-of-page.
- **Decorative second fade rotator** — maseratidemo3's `#carousel-maserati`: a second
  Bootstrap `carousel-fade` with `data-ride`, cross-fading GranTurismo cutout angles inside a
  `visible-lg` block. Not a model bar, not a hero.
- **Zero-stock redirect wiring** — nissandemo4/5: `data-count` inventory attributes drive a
  redirect to model research pages when the count is 0 (`data-count` elsewhere in the estate
  is display-only).
- **Brand-logo / category-tile strips in the model-bar slot** — powersportsdemo1's
  `.brandsNav` grayscale logos and powersportsdemo2's body-style category tiles: same engine,
  different content contract.
- **Full-height 100px arrow hit-areas** — maseratidemo4 and nissandemo4's quick-nav: an
  arrow ergonomics treatment not shown in the demo library.
- **Triple-carousel homepage** — subarudemo4 runs the hero fade, a second full-width
  Bootstrap fade (`#carousel-CorporateCell`, with disclaimer modal) and the known corpcell
  slick 3-up. The second full-width fade instance is the new part.

About 14 visually distinct new dressings ride on top of these — the CDJR dark logo-tab band,
the Ford family road-backdrop, the JLR and Ferrari photo cards, the Maserati spotlight and
the Toyota boxed tab tiles being the ones worth screenshots in the library page. None of it
needs engine work: **everything remains covered by dl-carousel as shipped** — the work is
catalog entries (ladders + looks), not engine changes.

### 10.6 The 53 new sites, fingerprint by fingerprint

Ladders read `perView…@min-width…` as in §10.4; "(Acura)" etc. names the §4 ladder the bar
lands on. Tab labels use `·` where the source uses a pipe.

| Host                             | Hero                               | Model bar / strip                        | Tabs                                          | Dots          | Notes                                                                                                         |
| -------------------------------- | ---------------------------------- | ---------------------------------------- | --------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------- |
| acurademo4                       | fade 5s, 8 slides                  | 2/3/5@461/769 (Acura)                    | none                                          | no            | OEM cutouts, top heading + bottom CTA frame, fade-in on init                                                  |
| bmwdemo4                         | fade 5s                            | no model bar                             | —                                             | —             | zero slick; quick-nav is a static flex grid of image panels                                                   |
| buickgmcdemo1                    | fade 5s                            | 2/3/4/5@540/992/1200 (Chevrolet)         | brand: Buick · GMC text tabs                  | no            | 2 bars one init, sibling-dim hover, stat-arrow classes                                                        |
| buickgmcdemo2                    | fade 5s                            | 2/3/4/5@540/992/1200 (Chevrolet)         | brand: Buick · GMC                            | no            | byte-identical config to demo1; static icon quickNav                                                          |
| buickgmcdemo3                    | fade 5s, 12 slides                 | 2/3/4/5@540/992/1200 (Chevrolet)         | brand: Buick · GMC                            | no            | same template; GMC cutouts from /static/brand-gmc                                                             |
| buickgmcdemo4                    | fade 5s, 2 slides                  | 2/3/4/5@540/992/1200 (Chevrolet)         | brand: Buick · GMC                            | no            | same template; static CPO block                                                                               |
| cdjrdemo1                        | fade 5s, 18 slides                 | 2/3/6@461/992 (new CDJR)                 | brand logo tabs × 5 + caret indicator         | no            | dark #212121 band, 5 bars one init, white labels                                                              |
| cdjrdemo2                        | fade 5s, after bar                 | 2/3/6@461/992 (CDJR)                     | brand logo tabs × 4                           | no            | desktop-only bar (hidden-xs), hover scale 1.1                                                                 |
| cdjrdemo3                        | fade 5s                            | 2/3/6@461/992 (CDJR)                     | brand logo tabs × 4                           | no            | cdjrdemo5 aliases here; same dark look                                                                        |
| cdjrdemo4                        | fade 5s after bar, 9 slides        | 2/3/6@461/992 (CDJR)                     | brand logo tabs × 5 (col-flush-5)             | no            | static quickNav1 card grid                                                                                    |
| chevroletdemo4                   | fade 5s inside split-hero          | 2/3/4/5@540/992/1200 (Chevrolet)         | body-style × 5, gold #B6862D underline        | no            | data-count attrs; per-slide disclaimer popover                                                                |
| ferraridemo1                     | fade 5s, 10 slides                 | 1/3@768 (new, infinite)                  | none                                          | no            | dark band, logotype above car, custom SVG arrows                                                              |
| ferraridemo2                     | fade 5s, 8 slides                  | 1/2/3/4@769/993/1441 (new, infinite)     | none                                          | no            | lifestyle photo cards, hover Learn More CTA overlay                                                           |
| forddemo4                        | fade 5s mid-page (after bar)       | 2/3/5@461/769 (Acura)                    | none                                          | no            | light band "A Vehicle for Every Lifestyle"; focus-visible arrow fix                                           |
| forddemo5                        | fade 5s, 8 slides                  | static grid 6 → 4@≤1199 → 2@≤450         | none                                          | —             | no slick on page; pure-CSS model strip                                                                        |
| forddemo6                        | fade 5s, 10 slides                 | 2/3/4/5@540/992/1200 (Chevrolet)         | body-style × 4, gold #feb245                  | no            | "The Ford Family", road backdrop ≥992, sibling dim                                                            |
| forddemo7                        | fade 5s, 10 slides                 | 2/3/4/5@540/992/1200 (Chevrolet)         | body-style × 4, gold #feb245                  | no            | bar byte-identical to demo6; alias target of demo8/9/10                                                       |
| groupdemo1                       | bg video + search widget           | no model bar                             | —                                             | no            | new: `.makes` 2/4/7@769/993 autoplay + `.locations` 1/2/4@769/993 autoplay; ekko-lightbox                     |
| groupdemo2                       | static 100vh image + search        | none                                     | —                                             | —             | zero JS sliders; static 9-tile quick-nav grid                                                                 |
| groupdemo3                       | fade 5s, 3 slides                  | none                                     | —                                             | —             | hero only                                                                                                     |
| groupdemo4                       | fade 5s, 3 slides                  | none                                     | —                                             | —             | hero only                                                                                                     |
| groupdemo5                       | static image hero + search         | none                                     | —                                             | —             | static makesNav logo row; zero sliders                                                                        |
| hondademo4                       | fade 5s, arrows only (no dots)     | 2/3/5@461/769 (Acura)                    | none                                          | no            | img-chrome cutouts, btn-main CTA below bar                                                                    |
| hondademo5                       | fade 5s + dots                     | 2/3/5@461/769 (Acura)                    | none                                          | no            | bar byte-identical to hondademo4                                                                              |
| hyundaidemo4                     | fade 5s                            | 1/3/4/5@461/993/1201 (Hyundai)           | SUVs · Sedans · Electrified                   | no            | slick-in-hidden-tabs caveat; 40px pad in responsive tiers                                                     |
| jaguardemo3 (serves dealer19076) | fade 5s                            | 2/3/4@461/769 (Buick)                    | none                                          | no            | photo-card bar, hover overlay, tagline below name                                                             |
| landroverdemo4                   | fade 5s                            | 2/3/4@461/769 (Buick)                    | none                                          | no            | same JLR photo-card template; LR-specific slick CSS path                                                      |
| lexusdemo4                       | fade 5s, 9 slides                  | 1/2/3/5@401/601/992 (Lexus)              | 3 tabs (Performance commented, 4 bars in DOM) | no            | est-MPG line, FA chevron arrows                                                                               |
| lexusdemo7 (serves dealer22691)  | fade 5s                            | 1/2/3/5@401/601/992 (Lexus)              | 4 tabs incl Performance                       | no            | only Lexus demo with Performance live                                                                         |
| lincolndemo4                     | fade 5s, 6 slides                  | 2/3/4@461/993 (Lincoln)                  | none                                          | no            | heading-italic "Select A Vehicle"; lincolndemo5 aliases here                                                  |
| maseratidemo1                    | bg video + search                  | none                                     | —                                             | —             | zero sliders                                                                                                  |
| maseratidemo2                    | fade 5s, 13 slides                 | none                                     | —                                             | —             | hero only                                                                                                     |
| maseratidemo3                    | fade 5s, 15 slides                 | none                                     | —                                             | —             | 2nd Bootstrap fade rotator (#carousel-maserati, featured GranTurismo)                                         |
| maseratidemo4                    | fade 5s                            | 1-up centerMode 20% → 23%@992 (new)      | none                                          | no            | wordmark above car, full-height 100px round arrows                                                            |
| mbdemo1                          | fade 5s, 3 slides                  | none                                     | —                                             | —             | hero only                                                                                                     |
| mbdemo2                          | fade 5s, 3 slides                  | none                                     | —                                             | —             | hero only                                                                                                     |
| mbdemo3                          | fade 5s, 3 slides                  | none                                     | —                                             | —             | hero only                                                                                                     |
| mbdemo4                          | fade 5s, 3 slides                  | none                                     | —                                             | —             | hero only; all 4 MB demos slider-free beyond hero                                                             |
| minidemo6                        | none (search widget only)          | none                                     | —                                             | —             | empty shell site, zero sliders                                                                                |
| mitsubishidemo4                  | fade 5s below bar, 13 slides       | 2/3/5@461/769 (Acura)                    | none                                          | no            | flat strip, ColorMatched cutouts, hover .85 → .9                                                              |
| nissandemo4                      | search-led; fade banner mid-page   | 1/2/3/5@401/601/992 (Lexus)              | Popular · Cars · SUVs · Trucks                | no            | + quick-nav-5 centerMode 3-up@9% (Lexus quick-nav recipe); data-count zero-stock redirect; a11y tabindex shim |
| nissandemo5                      | search-led; fade mid-page col-md-7 | 1/2/3/5@401/601/992 (Lexus)              | Popular · Cars · SUVs · Trucks                | no            | opacity/height-0 until init then 1s fade-in                                                                   |
| porschedemo4                     | static intro tiles + search band   | none                                     | —                                             | —             | zero sliders; quick-nav strings are just image filenames                                                      |
| powersportsdemo1                 | fade 5s (true top hero)            | brands 2/3/6@461/769 (new, `.brandsNav`) | none                                          | no            | grayscale logos color-on-hover; static quickNav row                                                           |
| powersportsdemo2                 | search-led; boxed fade mid-page    | 2/3/5@461/993 (new)                      | none                                          | no            | category tiles, BebasNeue labels, dealer-hosted cutouts                                                       |
| powersportsdemo3                 | bg video                           | none                                     | —                                             | —             | zero sliders; static parallax CTA tiles                                                                       |
| powersportsdemo4                 | bg video                           | none                                     | —                                             | —             | zero sliders                                                                                                  |
| subarudemo4                      | fade 5s, arrows only (no dots)     | 2/3/4/5@540/992/1200 (Chevrolet)         | 5 icon tabs (SVG in labels)                   | corpcell: yes | 3 carousels: hero + #carousel-CorporateCell fade + corpcell slick 1/2/3@540/1200 dots, infinite:false         |
| toyotademo4                      | fade 5s, arrows only               | 1/2/3/5@401/601/992 (Lexus)              | 5 tabs, red #BB162B underline                 | no            | est-MPG + data-count; static quick-nav tiles                                                                  |
| toyotademo5                      | fade 5s, arrows only               | 1/2/3/5@401/601/992 (Lexus)              | 5 tabs, red underline                         | no            | twin of demo4 minus quick-nav                                                                                 |
| toyotademo6                      | fade 5s, arrows only               | 1/2/3/5@401/601/992 (Lexus)              | 5 boxed tab tiles, red 5px top border         | no            | boxed gray/white tab-tile strip                                                                               |
| toyotademo7                      | fade 5s, arrows only               | 1/2/3/5@401/601/992 (Lexus)              | 5 boxed tab tiles                             | no            | + quick-nav tiles, hours accordion                                                                            |
| toyotademo9                      | static intro (no hero carousel)    | 2/3/5@461/769 (Acura)                    | none                                          | no            | leanest page: one slick total; est-MPG + data-count; never drops below 2-up                                   |

### 10.7 Limitations

Honesty about what this sweep is not:

- **Static HTML only.** No live-browser pass has run on the 53 new sites — the same
  limitation as §9's inner-page sweep. Anything runtime-injected (the pause control of §5,
  for instance) is invisible here.
- **Looks are read from markup and CSS, not screenshots.** The 14 new dressings in §10.5 are
  derived from class names, inline styles and stylesheet rules; none have been captured for
  the Model Bar Library yet.
- **The Salesforce Knowledge reconciliation is still pending.** The probe is exhaustive over
  the naming convention, not over whatever the SKB article actually lists — a demo site on an
  unconventional hostname would be missed exactly the way `buickgmc`/`cdjr`/`group` were
  missed the first time.
- **Two alias targets are unanalyzed.** `chevroletdemo5` → `dealer17728` and `hyundaidemo6` →
  `dealer26244` land outside the demo naming set and were not fingerprinted.

## 11. The reference reconciliation — 2026-08-19 live pass

§1 and §10.7 both carry the same caveat: this census was probed, never reconciled — the
internal per-OEM model-bar reference that should be the authoritative roster had not been
checked against it. On 2026-08-19 that check ran. The reference names one example site per
OEM configuration; all **13** of those example links were fetched and fingerprinted live —
the same method as §1, pointed at the sites the reference itself holds up as canonical.

Headline: **11 of the 13 are reachable, 2 are dead; the library covers 5 of the 11 exactly
or as aliases; the 6 it does not cover are all non-slick** — and together they refute a
claim §4 made.

| Reference example              | What it actually runs                                                                              | Census / library status                          |
| ------------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| bmw1.dealeron.com              | Bootstrap tab panes, 20 models, static mobile stack — no slick anywhere                            | Gap — lands on bmwdemo1, filed "no model bar"    |
| alfaromeo3.dealeron.com        | Hostname alias of alfaromeodemo1 — same slick ladder tier-for-tier                                 | Covered (alias)                                  |
| gmdemo1.dealeron.com           | Hard-404 parking page — GM multi-make example offline                                              | Stale reference entry                            |
| gmcdemo4.dealeron.com          | Hard-404 parking page — GMC slick example offline                                                  | Stale reference entry                            |
| mazdadesign1.dealeron.com      | Hostname alias of mazdademo1 — same slick ladder exactly                                           | Covered (alias)                                  |
| porschedemo1.dealeron.com      | Hover-reveal photo-tile grid, static flex-wrap, 2 → 3@540 → 6@992 + All-Models banner tile         | Gap — non-slick                                  |
| infinitidemo1.dealeron.com     | Hover-reveal tile grid, 2 → 2@540 → 3@992, landscape photos, permanent 40% overlay                 | Gap — non-slick                                  |
| lexusoftucsonautomall.com      | slick on exactly the Acura tiers (2/3/5@461/769), Lexus-branded dressing                           | Covered (tiers) — dressing is a variant          |
| rydelllincoln.com              | slick on the Lincoln ladder; client breakpoint 991 puts 4-up at 992 vs the demo's 993              | Covered — one-pixel variance                     |
| coeurdalenenissan.com          | Replaced its slick bar with a static tabbed flex grid, 2/3/7@401/768; legacy slick CSS still ships | Gap — client drift off the reference description |
| infinitioflexington.com        | Black portrait-tile mosaic, static wrap, 2 → 2@540 → 3@992, hover CTA choreography                 | Gap — non-slick                                  |
| genesisofcartersville.com      | Vue3-platform carousel, 1 → 2@600 → 3@991, arrows suppressed when all items fit                    | Gap — new platform, no library ladder matches    |
| brunerchryslerdodgejeepram.com | slick near the CDJR ladder (1/3/6@461/992), five pipe-divided brand tabs incl. Fiat, no background | Covered — near-miss variant of CDJR              |

### 11.1 The correction: "no `.modelBarS`" never meant "no model bar"

§4 closed with "the 21 sites without `.modelBarS` do not have a model bar section on the
homepage at all." That was the fingerprint talking, not the pages — it detected the absence
of slick, not the absence of a model bar. The reference's own example links carry a family
of official non-slick model bars the fingerprint was blind to:

- **BMW (bmwdemo1)** — Bootstrap tab panes: 20 models, one pane each (text column beside a
  side-profile image), a text-only series-selector rail below the pane, and a mobile variant
  that abandons the widget entirely for a static stacked list of all 20 models. §7's example
  table files this very site as "Fade hero, no model bar on the page."
- **Porsche (porschedemo1)** — hover-reveal photo-tile grid: static flex-wrap, 2-across base
  → 3-across@540 → 6-across@992 plus a full-width All-Models banner tile; the model name is
  hidden at rest and revealed on hover with staggered Search New / Search Used links.
- **INFINITI (infinitidemo1)** — the same hover-reveal skeleton at 2 → 2@540 → 3@992,
  landscape photos, square corners, a permanent 40% overlay.
- **INFINITI client (infinitioflexington.com)** — a black portrait-tile mosaic on the same
  idea: full-bleed dark photo tiles, 2-across base → 3-across@992, bottom name-plus-chevron
  overlay, desktop hover choreography.

forddemo5's static grid (§10.5) was the first crack in the claim; this is the rest of the
family. §4 now carries a dated correction note pointing here — the original sentence stands
in place as the record of what the fingerprint alone supported.

### 11.2 Aliases confirmed, stale entries found

- **alfaromeo3.dealeron.com → alfaromeodemo1.** The "different code" concern dissolves: the
  reference's hostname is an alias of a demo already fingerprinted, and the ladder matches
  the library's Alfa Romeo section tier-for-tier.
- **mazdadesign1.dealeron.com → mazdademo1.** Same phenomenon; the category tabs and
  inventory-count line are dressing on the same single slick instance the library ships.
- **bmw1.dealeron.com → bmwdemo1** lands the same way, so the reference's BMW example is the
  census's own bmwdemo1 — which is what makes the §4/§7 mis-filing above an internal error
  rather than a roster gap.
- **gmdemo1 and gmcdemo4 are dead** — both return the platform's not-hosted 404 parking page
  with no redirect. The GM multi-make and GMC slick examples are offline and should be
  marked stale in any mirror of the reference. gmcdemo4's death opens no GMC gap: gmc1–2
  already sit on the Acura ladder, which the library ships.

### 11.3 Client drift, and the platform's next generation

- **coeurdalenenissan.com** no longer runs what the reference describes. The slick bar is
  gone — legacy `.modelBar` CSS still ships with no matching HTML — replaced by a static
  flex grid inside pipe-divided underline tabs, item widths 50% base → 33.33%@401 →
  14.2%@768: a 2/3/7 wrap ladder with a 7-up single row per tab that matches no known
  ladder. Client sites drift off the pattern the reference (and this demo-estate census)
  records.
- **genesisofcartersville.com** is the first sighting of the platform's next generation: a
  Vue3-platform page whose explore-models component renders dynamic body-type tabs feeding a
  carousel at 1 base → 2@600 → 3@991, auto-centering, with arrows suppressed whenever all
  items fit the viewport. No library ladder matches (the Genesis section is
  1/2/3/4@541/993/1201).

### 11.4 Client variants worth a note

- **Lexus on the Acura ladder** (lexusoftucsonautomall.com): the tiers are exactly the Acura
  ladder — fully covered — but Lexus ships its own dressing (hr-underlined centered heading,
  240×140 cutouts scaling 0.95 → 1 on hover, a 23-slide roster). A strip-label variant under
  the Acura section, not a new ladder.
- **Lincoln 992-vs-993** (rydelllincoln.com): the client's breakpoint is 991, so 4-up starts
  at 992 instead of the demo's 993 — a one-pixel variance. Its FOUC guard (opacity fade-in
  on init) and live ColorMatched cutout sourcing are the only new details.
- **CDJR-Fiat, no background** (brunerchryslerdodgejeepram.com): 1/3/6@461/992 with no
  background band, five pipe-divided brand tabs (Fiat included) and dim-siblings-on-hover.
  The divergent base-1 step never renders — the whole bar is hidden below 768px — so this
  lands as a variant note on the existing CDJR section rather than a new ladder.

### 11.5 Verdict

Every slick ladder in the reference is covered by the library — exactly, as an alias, or as
a one-step variant of a covered ladder; the library's slick coverage is effectively
complete. The uncovered remainder is entirely the non-slick family — the BMW tabs bar, the
Porsche and INFINITI tile grids, the Nissan tabbed static grid and the Genesis Vue3 carousel
— now being added to demo/model-bars.html as static-grid and tabs sections plus one
1/2/3@600/991 strip. Closing the gaps is catalog and demo-page work, not engine work.

## 12. The onboarding portal — the curated customer-facing roster (2026-08-19)

The public onboarding portal (`onboard.dealeron.com`, "Explore DealerOn Showcase Sites")
turned out to carry the _curated_ roster — the list customers are actually shown. It
resolves §10.7's roster caveat from the other direction:

- **110 entries, every one inside this census's roster.** The portal names them
  "<Brand> Showcase N", confirming the Showcase-program naming the internal sites list
  used. Nothing on the portal was missed by the combined probe + platform sweep.
- **The portal is a strict subset.** The deep probe tails (ford 8–14, cadillac 5–7,
  kia 4–5, the lexus 5–7 aliases…) do not appear on it — consistent with §10.1's
  finding that those are redirect aliases or internal-only copies.
- **Five portal entries had never been fingerprinted:** `preowneddemo1–4` and
  `darkthemedemo1`. Checked 2026-08-19 (static): all five are fade-hero-only
  homepages — no model bar, no slick anywhere. Expected for the genre: a pre-owned
  store has no OEM lineup to run a bar for. No library work follows.
- The portal also notes the **video hero templates are refreshed annually** — the
  first written cadence commitment for any of these assets.
