# Replacement-code coverage

What this repo can actually replace today, one row per replacement code.

The list of codes is not ours. It is the Salesforce Knowledge article **"Model Bar Replacement
Codes"** (article 000001851, last modified 2026-01-20,
[permalink](https://dealeron.my.salesforce.com/lightning/articles/Knowledge/Model-Bar-Replacement-Codes)),
read on 2026-09-15. That article is the authority on which codes exist; this file is the authority
on which of them we have built a replacement for. When the two disagree about a code, the article
wins and this file gets corrected — except where a row below says the article itself looks wrong,
which is a thing to raise with whoever owns it rather than to paper over.

The article lists 56 codes. Seven of them are GM multi-make combinations, which **the team no longer
does** (Steven, 2026-09-15) — they are listed at the bottom and counted nowhere.

**49 codes in scope. 8 built.** The other 41 are the work.

| Status                             |  N  | What it means                                                                                         |
| ---------------------------------- | :-: | ----------------------------------------------------------------------------------------------------- |
| **Replacement built**              |  8  | A measured preset in `brands.js` draws this code's bar. Ready to hand a designer.                     |
| **Pattern ready, not measured**    | 25  | The builder already has the right pattern; nobody has measured this OEM's version of it yet.          |
| **Needs a pattern we do not have** |  1  | The live code is a carousel, but a shape this builder cannot draw yet.                                |
| **Not a carousel**                 | 10  | The live code is a static grid or a tabbed list, not a slider. Replacing it is a decision, not a job. |
| **Example is dead**                |  3  | The article's example link 404s, so there is nothing left to measure from.                            |
| **Article looks wrong**            |  1  | The example link does not draw the bar its row describes.                                             |
| **Retired**                        |  1  | The article marks it deprecated. Not a gap.                                                           |

## Why this is keyed by CODE and not by brand

The tracker this replaces (`docs/roadmap.md` §3) had one row per brand preset — 33 of them — and
that count is wrong in both directions. GM ships **ten** in-scope codes; Toyota ships four, CDJR
four, Kia and Nissan three each. Meanwhile CDJR is **one** code family covering Chrysler, Dodge,
Jeep and Ram, which `brands.js` holds as four separate presets.

So the brand count made the job look like 33 items when it is 49, and made four presets look like
four gaps when they are one code. A row here is a thing a designer can be handed. That is the unit.

## How each column was established

Nothing in the table is inherited. The codes and their types, files and example links were read off
the article on 2026-09-15. Every example link was then loaded in Chromium the same day and read for
what it actually draws — slick instances, their `slidesToShow` and `responsive` ladder taken from
slick's own config, tab rows that drive panes, and the static markup where there is no carousel.

Two methodology notes, because both changed answers:

- **A quick pass produces false negatives.** The first sweep blocked images and fonts for speed and
  waited 3.5s. `gmcdemo1` came back with no slider at all, when a direct read of the same page finds
  its `.modelBarS` with 6 slides. Every host is re-read at full load before any row claims an
  absence.
- **A page must be scrolled before it is called empty.** A bar that initialises below the fold is
  indistinguishable from a bar that does not exist. Every "Not a carousel" row was walked to the
  bottom of the page first, and names the static element it found in place of a slider.

Where a row's evidence still reads only "live: N slick instances", that is the quick pass and is
enough to say a carousel is there — a false positive is far less likely than a false negative — but
not enough to measure from. Measuring is the next step for those rows regardless.

## The codes

| OEM        | Type                                  | Replacement code                                    | Example link                   | Our pattern | Status                         | Evidence                                                                                                                                                   |
| ---------- | ------------------------------------- | --------------------------------------------------- | ------------------------------ | ----------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cadillac   | Tabs                                  | `cadillac-model-bar`                                | cadillacdemo1                  | `tabs`      | Replacement built              | `brands.js` cadillac, measured 2026-09-14; roster taken to the bar's full 14 models 2026-09-15                                                             |
| Chevrolet  | Tabs                                  | `chevrolet-model-bar`                               | chevroletdemo1                 | `tabs`      | Replacement built              | `brands.js` chevrolet, measured 2026-09-14                                                                                                                 |
| Ford       | Slick Tabbed                          | `ford-model-bar-slick-tabbed-panels`                | forddemo1                      | `tabs`      | Replacement built              | `brands.js` ford, measured 2026-09-14; roster taken to the bar's full 12 models 2026-09-15                                                                 |
| Toyota     | Tabs v2                               | `toyota-modelbar-slick-tabbed-v2`                   | toyotademo4                    | `tabs`      | Replacement built              | `brands.js` toyota, measured from toyotademo1 2026-09-10, which draws this same bar; roster taken to its full 27 models 2026-09-15                         |
| GMC        | Tabs                                  | `gmc-model-bar`                                     | gmcdemo1                       | `modelbar`  | Replacement built              | `brands.js` gmc, measured 2026-09-15. The article types it Tabs; the live page draws a plain bar with no tab row                                           |
| Honda      | Slick                                 | `honda-model-bar-slick`                             | hondademo4                     | `modelbar`  | Replacement built              | `brands.js` honda, measured 2026-09-15 from hondademo2, which runs the same ten-slide bar on the same ladder                                               |
| Kia        | Tabs                                  | `kia-model-bar`                                     | kiademo2                       | `tabs`      | Replacement built              | `brands.js` kia, measured 2026-09-15 from kiademo2, the equal-card bar; roster taken to its full 18 models the same day                                    |
| Subaru     | Slick Tabs                            | `subaru-model-bar-slick`                            | subarudemo2                    | `tabs`      | Replacement built              | `brands.js` subaru, measured 2026-09-15 from subarudemo1, which is the same bar to the slide. Tab icons not carried — markup, not values                   |
| Acura      | Slick                                 | `acura-model-bar-slick`                             | acurademo1                     | `modelbar`  | Pattern ready, not measured    | 1 slick bar, 5@768:3,460:2                                                                                                                                 |
| Alfa Romeo | Slick                                 | `alfa-romeo-model-bar-cards`                        | alfaromeo3                     | `modelbar`  | Pattern ready, not measured    | 1 slick bar, 6 slides, 4@1800:4,1200:3,992:2,540:1                                                                                                         |
| Audi       | Slick                                 | `audi-model-bar-slick`                              | audidemo1                      | `modelbar`  | Pattern ready, not measured    | 1 slick bar, 6@1200:4,992:3,768:2,360:1                                                                                                                    |
| Buick      | Slick                                 | `buick-model-bar-slick`                             | buickdemo1                     | `modelbar`  | Pattern ready, not measured    | 1 slick bar, 4@768:3,460:2                                                                                                                                 |
| CDJR       | Tabs                                  | `cdjr-model-bar`                                    | cdjrdemo2                      | `tabs`      | Pattern ready, not measured    | 4 slick bars behind a tab row, 6@991:3,460:2                                                                                                               |
| CDJR       | Tabs                                  | `cdjr-fiat-model-bar`                               | cdjrdemo1                      | `tabs`      | Pattern ready, not measured    | 5 slick bars behind a tab row, 6@991:3,460:2                                                                                                               |
| CDJR       | Tabs (no colour background)           | `cdjr-model-bar-no-back`                            | cdjrdemo4                      | `tabs`      | Pattern ready, not measured    | 5 slick bars, 6@991:3,460:2                                                                                                                                |
| CDJR       | Tabs with Fiat (no colour background) | `cdjr-fiat-model-bar-no-back`                       | brunerchryslerdodgejeepram.com | `tabs`      | Pattern ready, not measured    | 4 slick bars, 5@991:3,460:1 — a live dealer site, not a demo host                                                                                          |
| Ford       | Slick                                 | `ford-model-bar-slick`                              | forddemo3                      | `modelbar`  | Pattern ready, not measured    | 1 slick bar, 5@768:3,460:2. Ford is measured, but from the tabbed code                                                                                     |
| Genesis    | Tabbed                                | `genesis-model-bar-tabbed`                          | genesisdemo1                   | `tabs`      | Pattern ready, not measured    | 3 slick bars, 4@1200:3,992:2,540:1                                                                                                                         |
| Honda      | Slick Tabbed                          | `honda-model-bar-slick-tabbed`                      | hondademo1                     | `tabs`      | Pattern ready, not measured    | 4 slick bars behind a tab row, 5@991:3,460:1                                                                                                               |
| Hyundai    | Slick                                 | `hyundai-model-bar-slick`                           | hyundaidemo1                   | `modelbar`  | Pattern ready, not measured    | 3 slick bars, `slidesToShow: 1`                                                                                                                            |
| Jaguar     | Slick                                 | `jaguar-model-bar-slick`                            | jaguardemo3                    | `modelbar`  | Pattern ready, not measured    | 1 slick bar, 5 slides, no tabs                                                                                                                             |
| Kia        | Slick                                 | `kia-model-bar-slick`                               | kiademo3                       | `modelbar`  | Pattern ready, not measured    | 1 slick bar, 5@768:3,460:2                                                                                                                                 |
| Land Rover | Slick                                 | `land-rover-model-bar-slick`                        | landroverdemo3                 | `modelbar`  | Pattern ready, not measured    | 1 slick bar, 4@768:3,460:2                                                                                                                                 |
| Lexus      | Slick                                 | `lexus-model-bar-slick2`                            | lexusoftucsonautomall.com      | `modelbar`  | Pattern ready, not measured    | 1 slick bar, 20 slides, 5@768:3,460:2 — a live dealer site                                                                                                 |
| Lexus      | Tabbed                                | `lexus-modelbar-slick-tabbed`                       | lexusdemo1                     | `tabs`      | Pattern ready, not measured    | 4 slick bars, 5@991:3,600:2,400:1                                                                                                                          |
| Lincoln    | Slick                                 | `lincoln-model-bar-slick`                           | lincolndemo2                   | `modelbar`  | Pattern ready, not measured    | 1 slick bar, 4@992:3,460:2                                                                                                                                 |
| Lincoln    | Slick v2                              | `lincoln-model-bar-slick2`                          | rydelllincoln.com              | `modelbar`  | Pattern ready, not measured    | 1 slick bar, 4 slides, 4@991:3,460:2 — a live dealer site                                                                                                  |
| Maserati   | Large Slick                           | `maserati-modelbar-slick`                           | maseratidemo4                  | `modelbar`  | Pattern ready, not measured    | 1 slick bar, 9 slides, 1@992:1 — one card at a time                                                                                                        |
| Mazda      | Slick Tabbed                          | `mazda-model-bar-slick-tabbed`                      | mazdadesign1                   | `tabs`      | Pattern ready, not measured    | 1 slick bar, 12 slides, 3@991:2,768:1. The host is `mazdadesign1`, which no census covered                                                                 |
| Mitsubishi | Slick                                 | `mitsubishi-model-bar-slick`                        | mitsubishidemo1                | `modelbar`  | Pattern ready, not measured    | 1 slick bar, 4@768:3,460:2                                                                                                                                 |
| Nissan     | Tabs                                  | `nissan-model-bar-bodystyle`                        | nissandemo5                    | `tabs`      | Pattern ready, not measured    | 4 slick bars, 5@991:3,600:2,400:1                                                                                                                          |
| Toyota     | Tabs v3                               | `toyota-modelbar-slick-tabbed-v3`                   | toyotademo2                    | `tabs`      | Pattern ready, not measured    | 4 tabs, 4 bars, 11/3/13/14 slides                                                                                                                          |
| Volkswagen | Tabs                                  | `volkswagen-model-bar-slick2`                       | vwdemo1                        | `tabs`      | Pattern ready, not measured    | 3 slick bars, 4@1200:3,992:2,540:1                                                                                                                         |
| Kia        | Tabs v2                               | `kia-model-bar-tabbed`                              | kiademo1                       | —           | Needs a pattern we do not have | Centre-mode: one large focused card, small peeking neighbours, only the centre car named, over a photographic backdrop. Structure, not values              |
| BMW        | Tabs                                  | `bmw-model-bar-desktop` (+ a second Model-Bar file) | bmw1                           | —           | Not a carousel                 | No slick after a full-page scroll. A 12-tab model selector (X1…X7, 2…7) over static panels                                                                 |
| Ford       | General                               | `ford-model-bar-2.0-alt`                            | forddemo5                      | —           | Not a carousel                 | Static `.modelBar`, 11 children, no slick                                                                                                                  |
| Genesis    | Tabbed Non-EV                         | `genesis-non-ev-model-bar-tabbed`                   | genesisofcartersville.com      | —           | Not a carousel                 | A different template again — `.info-model` blocks, no slick                                                                                                |
| INFINITI   | Tiles                                 | `infiniti-model-bar-v2`                             | infinitidemo1                  | —           | Not a carousel                 | Static `.modelbar-container` of `.modelbar-item` cards                                                                                                     |
| INFINITI   | Tiles (dark background)               | `infiniti-model-bar-black`                          | infinitioflexington.com        | —           | Not a carousel                 | The same static tiles on a dark band                                                                                                                       |
| Maserati   | Tiles                                 | `maserati-modelbar`                                 | maseratidemo1                  | —           | Not a carousel                 | Static `.modelBar`, 8 children                                                                                                                             |
| Mitsubishi | General                               | `mitsubishi-model-bar`                              | mitsubishidemo5                | —           | Not a carousel                 | Static `.model-bar`                                                                                                                                        |
| Nissan     | Slick                                 | `nissan-model-bar-slick`                            | coeurdalenenissan.com          | —           | Not a carousel                 | Static `.vehicleModels` + `.model-list` behind 5 tabs. Despite "Slick" in the name, no slick runs                                                          |
| Nissan     | Tabs                                  | `nissan-model-bar-tabbed`                           | nissandemo1                    | —           | Not a carousel                 | The same static tabbed list                                                                                                                                |
| Porsche    | Porsche                               | `porsche-model-bar`                                 | porschedemo1                   | —           | Not a carousel                 | Static `.model-container` + `.featured-model`                                                                                                              |
| GMC        | Slick                                 | `gmc-model-bar-slick`                               | gmcdemo4                       | `modelbar`  | Example is dead                | `gmcdemo4` returns 404                                                                                                                                     |
| Hyundai    | Tabs                                  | `hyundai-model-bar`                                 | hyundaidemo3                   | `tabs`      | Example is dead                | `hyundaidemo3` returns 404                                                                                                                                 |
| Toyota     | Tabs                                  | `toyota-modelbar-slick-tabbed`                      | toyotademo6                    | `tabs`      | Example is dead                | `toyotademo6` returns 404                                                                                                                                  |
| Toyota     | Slick                                 | `toyota-modelbar-slick`                             | toyotademo1                    | `modelbar`  | Article looks wrong            | `toyotademo1` draws the five-tab bar — same tabs, same 6/9/2/7/14 slide counts, same ladder as `toyotademo4` (Tabs v2). Nothing on it is a plain slick bar |
| Chevrolet  | Slick                                 | `chevrolet-model-bar-slick`                         | chevroletdemo1                 | `modelbar`  | Retired                        | The article marks it deprecated as of November 2025                                                                                                        |

## What the table says that the brand tracker could not

**Ten codes are not carousels.** "Tiles", "General" and Porsche's own type draw static grids, and
Nissan's two codes draw a static tabbed list on both of their example pages — including the one
called `nissan-model-bar-slick`. Our engine replaces _sliders_. Turning a static grid into a
carousel is a design change to the dealer's page, not a like-for-like swap, and it needs someone to
decide it is wanted before anyone measures anything. Until then these are not gaps and should not be
counted as work.

**Three example links are dead** — `gmcdemo4`, `hyundaidemo3`, `toyotademo6`. The census recorded
`gmcdemo4` as a parking page back in August; the other two are new here. Each one leaves its code
with nothing to measure from. (`gmdemo1` is dead too, but it only served multi-make, which is out of
scope.)

**One row of the article contradicts the page it points at.** `toyota-modelbar-slick` cites
`toyotademo1`, which draws the tabbed bar, identical to `toyotademo4`. That also means our own
Toyota preset — measured from `toyotademo1` and carrying the `tabs` pattern — belongs to the v2
tabbed code, which is how it is filed above.

**`gmcdemo1` has no tab row** although the article types its code as Tabs. It draws a single plain
bar of 6 models on the Acura ladder. Worth confirming with whoever maintains the code before the
measurement is filed against it.

## Keeping this true

A row moves to **Replacement built** when a preset in `brands.js` gains a `styles` block and a
`source` naming the page and date it was measured from — the same rule the presets already follow.
The state lives in `brands.js`; this file is the readable view of it.

That means this file can drift, and the only cheap guard is the one the repo already has a place
for: `scripts/check-looks.mjs` runs inside `npm run validate` and already fails on a brand preset
that names a knob which does not exist. Adding an assertion there — every brand carrying a `styles`
block and a `source` must appear in this file with status **Replacement built** — would make a
measurement that skips the ledger fail the build. It is a dozen lines and it only catches the
direction that matters, since a row cannot claim "built" without a preset behind it either. Not done
yet; it is a decision, not an oversight.

## Out of scope: the GM multi-make codes

The team no longer does multi-make bars (Steven, 2026-09-15), so these seven are recorded and not
counted. They are listed here because the article still ships them and anyone reading it will ask.

They were also the least buildable rows on the list: one names `gmdemo1`, which returns 404, and the
other six name no example link at all. There is no live page to measure and no ladder to read.

| Type | Replacement code                         | Example link  |
| ---- | ---------------------------------------- | ------------- |
| Tabs | `chevrolet-buick-gmc-model-bar`          | gmdemo1 (404) |
| Tabs | `buick-gmc-model-bar`                    | none given    |
| Tabs | `chevrolet-buick-model-bar`              | none given    |
| Tabs | `chevrolet-gmc-model-bar`                | none given    |
| Tabs | `chevrolet-cadillac-model-bar`           | none given    |
| Tabs | `chevrolet-buick-gmc-cadillac-model-bar` | none given    |
| Tabs | `buick-gmc-cadillac-model-bar`           | none given    |
