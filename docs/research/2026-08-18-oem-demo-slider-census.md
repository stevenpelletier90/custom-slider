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
