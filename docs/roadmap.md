# Docket

Work agreed but not started. Findings that are known but not yet decided are in `backlog.md`; the
dated evidence behind the standing rules is in `history.md`.

Raised by Steven, 2026-09-08.

## 1. One editing process for vehicles, whatever the pattern

**Make the classes the same across patterns**, so adding, editing or removing a vehicle is the same
job every time. A designer who learns it on the model bar should not have to relearn it on the grid
or the tabbed bar.

### DONE 2026-09-08 — the vocabulary half

It was NOT already true. Eight places drew a card role under a name nothing else used, so the same
edit was a different job each time:

| Where           | Role                    | Was                                 | Now                                           |
| --------------- | ----------------------- | ----------------------------------- | --------------------------------------------- |
| `location` look | the address line        | a bare `<p>`, **no class at all**   | `.cargo-sub`                                  |
| `split` look    | the button              | `.cargo-pill`                       | `.cargo-cta`                                  |
| `models`        | the name over the photo | bare `<h3>`                         | `.cargo-name`                                 |
| `service`       | name and blurb          | bare `<h3>` / `<p>`                 | `.cargo-name` / `.cargo-sub`                  |
| `reviews`       | reviewer, date, quote   | bare `<strong>` / `<small>` / `<p>` | `.cargo-name` / `.cargo-sub` / `.cargo-quote` |
| `mixed`         | name and blurb          | bare `<h3>` / `<p>`                 | `.cargo-name` / `.cargo-sub`                  |
| `stock`         | name and blurb          | bare `<h3>` / `<p>`                 | `.cargo-name` / `.cargo-sub`                  |
| `card-gallery`  | name and sub            | bare `<h3>` / `<p>`                 | `.cargo-name` / `.cargo-sub`                  |

Every CSS rule moved from the element selector to the class in the same edit, and the computed
styling of each was re-measured after: margins, colours, sizes and `models`' absolute-positioned
gradient caption all unchanged.

Two gates hold it. `check-looks.mjs` fails a LOOK that renders a name, sub or button without the
shared class (verified: restoring `.cargo-pill` prints "split: renders a button but does not call it
.cargo-cta"). A browser test walks all 21 patterns and fails any slide carrying a heading or
paragraph with no `cargo-` class — it is what found `models`, `service` and `reviews`, which the
audit had missed.

**Deliberately NOT done: the element and the depth.** `<p>` and `<span>` both carry `.cargo-name`
across the set, and `.cargo-media` wraps the image in only two looks. Unifying those means rewriting
seven looks' CSS and re-proving pixel parity at three widths, to change nothing a designer does —
they edit the text inside the class either way.

**Still open: the CMS claim.** Searched every doc; the only platform class names recorded anywhere
are `.corpcell-slider`, `.carousel-model` and `vehicle-image-carousel`, from the OEM census.
**Nothing in this repo names a CMS `cargo-` convention**, so "interchangeable with what the CMS
already uses" is unverified and needs checking against a live dealer page before it is repeated.

## 2. Replacement code → settings

**New.** More replacement codes are coming. The builder should accept one and work backwards from
it: paste a replacement code in, and the tool fills in every setting it implies and shows the result
in the code preview.

Today the builder only runs forwards — settings produce a snippet. This is the inverse, and it needs
a map from replacement code to the settings it stands for. Relevant:
`#LOADCUSTOMFILE|Responsive|Apps|customSlider|<name>#` loads `…/<name>.html` from the shared folder,
and those files may carry their own `<style>`.

## 3. Audit the library, and test it

Full pass over the pattern/look library plus tests for what it claims.

### The brand tracker — superseded by `docs/coverage.md` (2026-09-15)

Started 2026-09-15 (Steven: "get every single replacement code converted to this new slider … make
sure to address all of them") as one row per brand preset in `brands.js`, with the live column taken
from the 2026-08-18 census.

**Both halves of that turned out to be wrong, and the table below is kept only as the record of
it.** The authority on which codes exist is the Salesforce Knowledge article "Model Bar Replacement
Codes" (000001851), which Steven supplied on 2026-09-15: it lists 56 codes, of which **49 are in
scope** — not 33. (The seven GM multi-make combinations are work the team no longer does.) A brand
is not the unit — GM ships ten in-scope codes and CDJR ships one code covering four marques this
repo holds as four presets. And the census's live column had drifted: every example link has now
been re-read in Chromium, which found three dead hosts, ten codes that are not carousels at all, and
one article row that contradicts the page it points at.

`docs/coverage.md` is the live ledger now: one row per code, with the status vocabulary, the
evidence behind each row, and how it is kept true. Tick a row there by measuring it — the state is
still `brands.js`.

The table that follows is the 2026-08-18 census reading, superseded.

| Brand      | Demos | Live homepage bar (census)                                  | Status                                                    |
| ---------- | ----- | ----------------------------------------------------------- | --------------------------------------------------------- |
| Cadillac   | 3     | 3 tabs, 5-up on a `bg-main` band                            | **Measured** 2026-09-14, phone tier and band 2026-09-15   |
| Chevrolet  | 3     | 5 tabs, 5-up                                                | **Measured** 2026-09-14 — phone tier not yet (same `\|`?) |
| Ford       | 3     | demo1: 4 tabs in a bordered box; demo2-3: plain 5-up        | **Measured** 2026-09-14 (demo1 only)                      |
| Toyota     | 3     | demo1: 5 tabs; demo2-3: 4 tabs, 2-up                        | **Measured** 2026-09-10 (demo1 only)                      |
| Genesis    | 3     | 3 tabs, 4-up                                                | preset only                                               |
| Honda      | 3     | demo1: 4 tabs; demo2-3: plain 5-up                          | preset only                                               |
| Hyundai    | 3     | demo1: 3 tabs + `rows: 2`; demo2: plain; demo3: 3 tabs      | preset only                                               |
| Kia        | 3     | demo1: 3 tabs, centre-mode; demo2: 3 tabs; demo3: plain     | preset only                                               |
| Lexus      | 3     | 4 tabs, 5-up; demo2 also quick-nav + gallery (`.galleryS`)  | preset only                                               |
| Nissan     | 3     | demo2-3: 4 tabs, 5-up; demo1: none                          | preset only                                               |
| Subaru     | 3     | 5 tabs, 5-up + `.corpcell-slider` card strip                | preset only                                               |
| Volkswagen | 2     | 3 tabs, 4-up                                                | preset only                                               |
| Volvo      | 2     | 3 tabs, 5-up                                                | preset only                                               |
| Acura      | 3     | plain 5-up                                                  | preset only                                               |
| Alfa Romeo | 1     | plain 6-up, 3:5 portraits (the `portrait` look)             | preset only                                               |
| Audi       | 1     | plain 6-up                                                  | preset only                                               |
| Buick      | 2     | plain 4-up                                                  | preset only                                               |
| GMC        | 2     | plain 5-up                                                  | preset only                                               |
| Jaguar     | 1     | plain 4-up                                                  | preset only                                               |
| Land Rover | 3     | demo1, 3: plain 4-up; demo2: none                           | preset only                                               |
| Lincoln    | 3     | plain 4-up                                                  | preset only                                               |
| Mazda      | 2     | plain 3-up + `.filtering` (not a content slider)            | preset only                                               |
| Mitsubishi | 3     | demo1-2: plain 5-up; demo3: none                            | preset only                                               |
| BMW        | 3     | none — fade hero only                                       | decide: drop the preset, or keep as a roster              |
| Chrysler   | 1     | none — fade hero only                                       | decide                                                    |
| Dodge      | 1     | none — fade hero only                                       | decide                                                    |
| Fiat       | 1     | none — fade hero only (roster is Chevrolet's, and says so)  | decide                                                    |
| Infiniti   | 2     | none on the homepage; QX60 page has 8 tabbed card carousels | decide                                                    |
| Jeep       | 2     | none — fade hero only                                       | decide                                                    |
| MINI       | 3     | none; Countryman page has the one autoplaying card strip    | decide                                                    |
| Porsche    | 3     | none — fade hero only                                       | decide                                                    |
| RAM        | 2     | none — fade hero only                                       | decide                                                    |

Inner-page replacement codes (census §9), none measured yet:

| Code (as the census names it)                                    | Where                                         | Demo pattern     | Status       |
| ---------------------------------------------------------------- | --------------------------------------------- | ---------------- | ------------ |
| Certified-service tile carousel, 3-up, arrows + dots (GM shared) | buick / cadillac / chevrolet / gmc `/service` | `cards`          | not measured |
| Tabbed feature-card carousels, 3-up under Bootstrap tabs         | infinitidemo1 QX60 page                       | `tabs`           | not measured |
| Trim-card strip, 4-up, arrows only                               | kiademo1 Telluride                            | `cards`          | not measured |
| Synced filterable gallery (fade + thumbs + `slickFilter`)        | kiademo1 Telluride                            | `gallery-filter` | not measured |
| Mixed photo + video gallery                                      | kiademo1 Telluride                            | `media-gallery`  | not measured |
| Centre-mode technology strip, 3-up, 160px centre padding         | nissandemo1 Rogue                             | `peek`           | not measured |
| Autoplaying feature cards, 3-up                                  | minidemo1 Countryman                          | `cards`          | not measured |
| Sitewide incentive chrome (fade banner + 3-up offer strip)       | subarudemo1, every inner page                 | `hero` + `cards` | not measured |
| Service hero promo rotator, 2 slides                             | lexusdemo1 `/service.aspx`                    | `hero`           | not measured |

What a measurement is (the rule that held on all four so far): knob values only, read off the live
page at 1280/800/390 — never markup, script, units or a CSS block. What no knob can say becomes a
knob; what needs structure is a new pattern. A brand's `words` carry the platform classes (Cadillac:
`bg-main`, `heading-lg`) and the theme does the colouring — the band's colour is the site's, never a
value (2026-09-15).

## 4. Patterns vs styles — decide it from evidence, not from vibes

`docs/catalog/` is empty of any statement of what each pattern and each look is FOR, and that gap is
what let the taxonomy drift.

What is established:

- **`modelbar` and `cards` are the same pattern** with a different card style pre-picked. Measured:
  model bar + Vehicle card produces byte-identical structure to Vehicle cards (`cargo-vcard`,
  `cs-sm-2 cs-md-3`, same skeleton).
- **No pattern curates the style picker.** `workbench.js` calls `pane.looks(style, LOOKS, …)` — all
  seven, always, on all four style-taking patterns. A Location card renders happily inside a
  Trucks/SUVs/Crossovers tab bar and means nothing.
- **Changing the style never breaks a structure.** All seven keep the tabbed bar's tablist, 3 tabs,
  3 panels and 24 slides.

**The axis that actually matters, and the one nobody wrote down: what CONTENT a look is built for.**
Some are for model cutouts — transparent PNGs of vehicles, no crop. Some are for ordinary
photography, cropped to an aspect. Some work with either. That is the real distinction, not whether
a card "feels vehicle-ish", and it decides both which looks belong on which patterns and which of
them should have been patterns in the first place. A split photo card is not a model bar.

### Examined 2026-09-08 — the evidence

**They are not styles.** `looks.js:9-12` already says it: "What survives here is the set that
differs in MARKUP — a split card is not a stacked card with different numbers, and no property turns
one into the other." All seven emit different element trees. `wordmark` drops `.cargo-media`
entirely; `portrait` puts the name BEFORE the image; `logo` emits one `<img>` and no text node;
`split` adds `.cargo-copy` / `.cargo-blurb` / `.cargo-pill`.

**Content type, from the CSS that decides it:**

| Look     | Content       | Deciding declaration                                                          |
| -------- | ------------- | ----------------------------------------------------------------------------- |
| tile     | CUTOUT        | `object-fit: contain`, `aspect-ratio: auto`, `--plate-bg` behind transparency |
| wordmark | CUTOUT        | `object-fit: contain`, no `aspect-ratio` at all                               |
| vcard    | PHOTO         | `aspect-ratio: 4/3` + `object-fit: cover`, hard-coded                         |
| split    | PHOTO         | source: "wants a photograph, not a transparent cutout on a coloured panel"    |
| portrait | PHOTO         | `3/5` + `cover`; source records drawing it on cutouts as a mistake            |
| logo     | NOT A VEHICLE | source: "It draws MARKS, so it is drawn with marks"                           |
| location | NOT A VEHICLE | source: "Not a vehicle card at all"                                           |

**The fact that settles which looks belong where: all four look-taking patterns ship CUTOUTS.**
Verified at the byte level — `chrome-*.webp` carry the VP8X alpha flag; `vehicle-*.png` are PNG
colour-type 6 with corner alpha 0. So a crop-to-aspect look applied to modelbar / cards / grid /
tabs crops transparent pixels rather than the vehicle. **Five of the seven are wrong on all four.**
Only the two CUTOUT looks belong. (Caveat: `modelsFor()` at `workbench.js:928` swaps the roster
entirely under a brand preset or edited content, so the rule is about the DEFAULT roster.)

**More structural twins**, beyond modelbar/cards: `mixed`, `service`, `reviews` and `stock` are one
shape — no structural keys, own `slides()`, identical ladders, differing only in slide markup and
`minCard`. `hero` and `peek` are another. `gallery` is the bare member of a `track:'div'` family
that `gallery-filter`, `media-gallery` and `lightbox` extend.

### DONE 2026-09-08, first pass — the picker, filtered

Design in `docs/specs/2026-09-08-library-taxonomy-design.md`.

1. **The third axis is in the data.** Every look declares `content` and `crop`; `check-looks.mjs`
   fails on a look without one (verified: removing one prints "tile: missing content").
2. **A mismatch is surfaced, never hidden.** A crop that would actually trim is called out in the
   settings panel AND the copy panel, in real numbers — "This card crops every picture to 1:1.67
   tall. Yours are 1.33:1 wide, so their sides will be trimmed." Measured, so `cards` + `vcard`
   stays silent. Never a gate.
3. **`logo` and `location` became rail entries**, and the picker was filtered to cards of the same
   family.
4. **The axes are named for what they are** — the rail is "Start from".

### DONE 2026-09-08, second pass — there is no picker

Steven, on seeing the filtered version: "the tabbed bar should not have nested styles, those styles
need to be their own pattern… model bar should not have card styles. The different patterns are the
card styles basically."

That is the right end state and the first pass had stopped one step short. A look owns MARKUP —
`looks.js` says so in its own header — so a control that swaps one look for another does not restyle
the slider, it replaces it, and it was doing that from inside a structural pattern.

- **All seven cards are rail entries.** `wordmark`, `portrait` (tall tile with CTA) and `split`
  joined `modelbar`/tile, `cards`/vcard, `logostrip` and `locations`. Each carries the roster its
  card is built for, which is what the look's own `demoModels` already said: services for the split
  card, Alfa's 3:5 portraits for the tall tile.
- **The picker is deleted**, not hidden: `pane.looks()`, the `lookpicker` blade in `tp-plugins.js`
  and the `.tp-lookv` rules in `ui.css` are gone, and the deep-link form is `#pattern`, never
  `#pattern/look`. A test walks every pattern and fails if a picker reappears.
- **Brand follows the card's content type.** A preset swaps in that marque's cutouts, so the OEM
  list is drawn where the card takes a cutout — `tile`, `vcard`, `wordmark` — and nowhere else. Read
  off `content`, never a list of ids, so a card added later is classified the day it ships.
- **Two-row grid became a Rows setting** (1–3), beside "how many across", on every pattern that
  draws cards into a track. It was the model bar with `pairUp: true` and a two-rung ladder, so
  choosing it meant leaving the pattern you had picked.
- **The "Every card style" grid is off `patterns.html`.** All seven are in the pattern grid above
  it; showing a card twice, once as itself and once as a style of something else, was the muddle
  being fixed.

Also fixed on the way: `gallery.js` linked every card as `#modelbar/<id>`, dead links the moment the
picker was filtered and meaningless once it went.

**Still open** — item 2 (replacement codes) above, and the CMS half of item 1.

## 5. Bootstrap 5 breakpoints

Raised by Steven, 2026-09-15: "we need to move away from [Bootstrap 3 breakpoints] in favor of BS5
media query breakpoints and match those, we are eventually switching the platform to bootstrap 5."

### DONE 2026-09-15 — six tiers, two grids

The contract question was decided the way the inventory below suggested: the four old column classes
keep their names and numbers, and the two Bootstrap 5 tiers ship as `cs-576-N` and `cs-1400-N`,
named by width so no class is a guess about which grid it came from. Every ladder is six rungs (the
new two filled from their neighbours, so an untouched slider emits what it always did), the builder
has six width buttons and a **Grid** select that draws the preview in either platform's container
and clamps a preset against it, and `check-looks` clamps every preset against both. The tabbed bar's
phone knobs moved from 768 to 576, where Cadillac's live bar actually switches.
`tests/tiers.test.mjs` holds it; CLAUDE.md "Six tiers, two grids" has the rules.

Still open from the inventory: the platform's `hidden-xs` class in a brand's tab words (Bootstrap 5
spells it `d-none d-sm-inline`) — a word, so it changes with the platform, and there is no Bootstrap
5 site to measure it on yet.

Not started — it is a contract question before it is a find-and-replace. Inventory of where a
Bootstrap 3 number lives today (grep for `767.98|991.98|min-width: 992|750|970|1170` and the
`cs-{xs,sm,md,lg}` names):

- **The column classes are the frozen HTML contract.** `scripts/build-cards.mjs` emits
  `cs-xs-N / cs-sm-N / cs-md-N / cs-lg-N` at 0 / 768 / 992 / 1200 and README documents them. In
  Bootstrap 5 those NAMES mean different widths: `sm` is 576, `md` 768, `lg` 992, `xl` 1200,
  `xxl` 1400. Renaming is forbidden ("add freely; rename or repurpose nothing"), so the BS5 set is a
  new ladder of classes alongside the old, or the old names keep their numbers and the README says
  so. Decide this first; everything below follows it.
- **Container widths.** `TIER_BOX` in `brands.js` (330 / 750 / 970 / 1170) drives `perViewFor()`'s
  clamp; the preview frame in `workbench.js` reproduces the same three with `#wb-live-root` media
  queries and the width buttons; `tests/helpers.mjs` boxes the hostile host at 1170. Bootstrap 5's
  are 540 / 720 / 960 / 1140 / 1320 (five, and the phone tier gets a 540 box at 576+).
- **Pattern and look media queries.** `patterns.js`: the tabbed bar's tablet tier at 991.98 and
  phone tier at 767.98 (`--*-narrow`, `--*-phone`), the photo card's 4:3 phone crop, the models
  card's 56px arrow at 992+, four 36px phone arrows; `looks.js` three phone rules; `workbench.js`
  `cssFor()`'s gutter rule. The `.98` boundaries are already Bootstrap 5's own convention; the
  numbers 768 / 992 / 1200 exist in both grids, so these survive. What changes is a possible 576
  tier: Cadillac's live bar switches at 540, nearer BS5's `sm` than the 768 the phone knob sits on
  today.
- **Platform classes the previews stand in for.** `hidden-xs` (phone-only tab words, a BS3 class;
  BS5 is `d-none d-sm-inline`), `.lead` at 768, in `workbench.js` and `tests/helpers.mjs`. A brand's
  `words` that name a platform class would change with the platform — one more reason they are
  words, not CSS.
- **The `[minWidth, perView]` ladders in `brands.js`** are the OEMs' real slick configs, recorded
  verbatim for the audit, and stay; `perViewFor()` reads them at whichever tiers the platform has.

The census itself stays as is — it records what the demos ran in August 2026.
