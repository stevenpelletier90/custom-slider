# OEM demo slider census — 76 DealerOn demo sites

Date: 2026-08-18 · Method: scripted fingerprint of all 76 rendered homepages, plus live
runtime verification in a real browser on representative sites.

Prompted by the 2026-08-11 Creative Solutions sync: "here is a link to a bunch we might need
to start cataloguing and organizing ones that are the same both for diff OEMs etc."

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
3. **The model bar needs no rework.** The census validates it as shipped.
4. **Center-mode remains low priority.** 3 instances estate-wide.
5. **Unsupported edge case:** `rows: 2` (hyundaidemo1) — a two-row grid slider.
