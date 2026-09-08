# Docket

Work agreed but not started. Tracked in git on purpose — `.superpowers/sdd/progress.md`
is the build log and it is git-ignored, so anything a colleague needs to see cannot
live there.

Raised by Steven, 2026-09-08.

## 1. One editing process for vehicles, whatever the pattern

**Make the classes the same across patterns**, so adding, editing or removing a
vehicle is the same job every time. A designer who learns it on the model bar
should not have to relearn it on the grid or the tabbed bar.

### DONE 2026-09-08 — the vocabulary half

It was NOT already true. Eight places drew a card role under a name nothing else
used, so the same edit was a different job each time:

| Where | Role | Was | Now |
| --- | --- | --- | --- |
| `location` look | the address line | a bare `<p>`, **no class at all** | `.cargo-sub` |
| `split` look | the button | `.cargo-pill` | `.cargo-cta` |
| `models` | the name over the photo | bare `<h3>` | `.cargo-name` |
| `service` | name and blurb | bare `<h3>` / `<p>` | `.cargo-name` / `.cargo-sub` |
| `reviews` | reviewer, date, quote | bare `<strong>` / `<small>` / `<p>` | `.cargo-name` / `.cargo-sub` / `.cargo-quote` |
| `mixed` | name and blurb | bare `<h3>` / `<p>` | `.cargo-name` / `.cargo-sub` |
| `stock` | name and blurb | bare `<h3>` / `<p>` | `.cargo-name` / `.cargo-sub` |
| `card-gallery` | name and sub | bare `<h3>` / `<p>` | `.cargo-name` / `.cargo-sub` |

Every CSS rule moved from the element selector to the class in the same edit, and
the computed styling of each was re-measured after: margins, colours, sizes and
`models`' absolute-positioned gradient caption all unchanged.

Two gates hold it. `check-looks.mjs` fails a LOOK that renders a name, sub or
button without the shared class (verified: restoring `.cargo-pill` prints
"split: renders a button but does not call it .cargo-cta"). A browser test walks
all 19 patterns and fails any slide carrying a heading or paragraph with no
`cargo-` class — it is what found `models`, `service` and `reviews`, which the
audit had missed.

**Deliberately NOT done: the element and the depth.** `<p>` and `<span>` both
carry `.cargo-name` across the set, and `.cargo-media` wraps the image in only
two looks. Unifying those means rewriting seven looks' CSS and re-proving pixel
parity at three widths, to change nothing a designer does — they edit the text
inside the class either way.

**Still open: the CMS claim.** Searched every doc; the only platform class names
recorded anywhere are `.corpcell-slider`, `.carousel-model` and
`vehicle-image-carousel`, from the OEM census. **Nothing in this repo names a CMS
`cargo-` convention**, so "interchangeable with what the CMS already uses" is
unverified and needs checking against a live dealer page before it is repeated.

## 2. Replacement code → settings

**New.** More replacement codes are coming. The builder should accept one and
work backwards from it: paste a replacement code in, and the tool fills in every
setting it implies and shows the result in the code preview.

Today the builder only runs forwards — settings produce a snippet. This is the
inverse, and it needs a map from replacement code to the settings it stands for.
Relevant: `#LOADCUSTOMFILE|Responsive|Apps|customSlider|<name>#` loads
`…/<name>.html` from the shared folder, and those files may carry their own
`<style>`.

## 3. Audit the library, and test it

Full pass over the pattern/look library plus tests for what it claims.

## 4. Patterns vs styles — decide it from evidence, not from vibes

`docs/catalog/` is empty of any statement of what each pattern and each look is
FOR, and that gap is what let the taxonomy drift.

What is established:

- **`modelbar` and `cards` are the same pattern** with a different card style
  pre-picked. Measured: model bar + Vehicle card produces byte-identical
  structure to Vehicle cards (`cargo-vcard`, `cs-sm-2 cs-md-3`, same skeleton).
- **No pattern curates the style picker.** `workbench.js` calls
  `pane.looks(style, LOOKS, …)` — all seven, always, on all four style-taking
  patterns. A Location card renders happily inside a Trucks/SUVs/Crossovers tab
  bar and means nothing.
- **Changing the style never breaks a structure.** All seven keep the tabbed
  bar's tablist, 3 tabs, 3 panels and 24 slides.

**The axis that actually matters, and the one nobody wrote down: what CONTENT a
look is built for.** Some are for model cutouts — transparent PNGs of vehicles,
no crop. Some are for ordinary photography, cropped to an aspect. Some work with
either. That is the real distinction, not whether a card "feels vehicle-ish", and
it decides both which looks belong on which patterns and which of them should
have been patterns in the first place. A split photo card is not a model bar.

### Examined 2026-09-08 — the evidence

**They are not styles.** `looks.js:9-12` already says it: "What survives here is
the set that differs in MARKUP — a split card is not a stacked card with
different numbers, and no property turns one into the other." All seven emit
different element trees. `wordmark` drops `.cargo-media` entirely; `portrait`
puts the name BEFORE the image; `logo` emits one `<img>` and no text node;
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

**The fact that settles which looks belong where: all four look-taking patterns
ship CUTOUTS.** Verified at the byte level — `chrome-*.webp` carry the VP8X
alpha flag; `vehicle-*.png` are PNG colour-type 6 with corner alpha 0. So a
crop-to-aspect look applied to modelbar / cards / grid / tabs crops transparent
pixels rather than the vehicle. **Five of the seven are wrong on all four.**
Only the two CUTOUT looks belong. (Caveat: `modelsFor()` at `workbench.js:928`
swaps the roster entirely under a brand preset or edited content, so the rule is
about the DEFAULT roster.)

**More structural twins**, beyond modelbar/cards: `mixed`, `service`, `reviews`
and `stock` are one shape — no structural keys, own `slides()`, identical
ladders, differing only in slide markup and `minCard`. `hero` and `peek` are
another. `gallery` is the bare member of a `track:'div'` family that
`gallery-filter`, `media-gallery` and `lightbox` extend.

### DONE 2026-09-08 — all four shipped

Design in `docs/superpowers/specs/2026-09-08-library-taxonomy-design.md`.

1. **The third axis is in the data.** Every look declares `content` and `crop`;
   `check-looks.mjs` fails on a look without one (verified: removing one prints
   "tile: missing content").
2. **A mismatch is surfaced, never hidden.** The picker offers only same-family
   cards; a crop that would actually trim is called out in the settings panel
   AND the copy panel, in real numbers — "This card crops every picture to
   1:1.67 tall. Yours are 1.33:1 wide, so their sides will be trimmed."
   Measured, so `cards` + `vcard` stays silent. Never a gate.
3. **`logo` and `location` are rail entries.** 19 starting points; the picker
   drops to five on a vehicle pattern, and those two draw no picker (a family of
   one) and no OEM brand list (they are not vehicles).
4. **The axes are named for what they are** — the rail is "Start from", and the
   folder is "The card" where there is no brand to set.

Also fixed on the way: `gallery.js` linked every card as `#modelbar/<id>`, which
became two dead links the moment the picker was family-filtered.

**Still open** — item 2 (replacement codes) above, and the CMS half of item 1.
