# Library taxonomy — patterns, cards, and the content type nobody wrote down

2026-09-08. Approved by Steven after the examination in `docs/roadmap.md`.

## The problem

The library has THREE variables and the UI has controls for two.

1. **Structure** — one strip, two rows, tabs over panes, a filter bar, a lightbox,
   a grid of cards each holding a carousel. The rail.
2. **The card** — what one item looks like. The picker.
3. **What kind of picture the card takes** — a transparent cutout shown whole, an
   edge-to-edge photo cropped to an aspect, a logo mark, a storefront. **Nothing.**

Every complaint traces to the missing third: a split photo card offered on a model
bar, a brand preset changing the pattern, two rail entries that are the same
structure. Same omission, surfacing somewhere different each time.

## What the examination established

**These are not "styles".** `looks.js:9-12` already said so — "a split card is not
a stacked card with different numbers, and no property turns one into the other."
All seven emit different element trees. By the standard design-system test (could
an existing component serve this need as a variant?) they are components.

**Content type is encoded in the CSS, and only there:**

| Look | Content | Deciding declaration |
| --- | --- | --- |
| tile | cutout | `object-fit: contain`, `aspect-ratio: auto`, `--plate-bg` behind transparency |
| wordmark | cutout | `object-fit: contain`, no `aspect-ratio` at all |
| vcard | photo | `aspect-ratio: 4/3` + `object-fit: cover` |
| split | photo | source: "wants a photograph, not a transparent cutout on a coloured panel" |
| portrait | photo | `3/5` + `cover`; source records drawing it on cutouts as a past mistake |
| logo | mark | source: "It draws MARKS, so it is drawn with marks" |
| location | place | source: "Not a vehicle card at all" |

**Every look-taking pattern ships cutouts.** Verified at the byte level:
`chrome-*.webp` carry the VP8X alpha flag; `vehicle-*.png` are PNG colour-type 6
with corner alpha 0.

**But a mismatch is not automatically a defect.** `vehicle-*.png` are 640x480 and
`vcard` crops to 4/3 — the same ratio, so it trims nothing. The demo's own
flagship pairing is a cutout in a photo look and it is fine. **This is why the
rule must be about the CROP, not the category.**

## Design

### 1. Name the third variable in data

`content` on every look: `'cutout' | 'photo' | 'mark' | 'place'`.
`ships` on every pattern that carries a roster: the same vocabulary.

Nothing moves in the UI from this alone. It makes the constraint exist, which is
what makes it checkable and testable.

### 2. Surface a mismatch — never hide it

The picker says what each card takes. A mismatch warns in place, and again in the
copy panel's "what is in the box" list, because that is the last screen before the
code reaches a dealer.

**Never a hard gate.** `modelsFor()` (`workbench.js:928`) swaps the roster entirely
under a brand preset or edited content, so a strip can legitimately end up holding
photographs. A gate would sometimes hide the right answer — and would have flagged
`cards` + `vcard`, which is correct.

**The warning is earned, not categorical.** A `cover` crop on a transparent cutout
only trims when the aspects differ. Compare the look's crop aspect against the
roster's natural aspect and say what will actually happen:
"This card crops to 3:5. Your cutouts are 4:3, so their sides will be trimmed."
Silence when the aspects agree.

The risk this exists for: a cutout's transparent margin is part of its
composition — the set carries 13-17% below the vehicle, measured. Crop it and the
car sits jammed against the card edge. It renders without erroring and looks
cheap on a dealer's homepage, which is the class of defect this repo keeps
catching late.

### 3. Promote `logo` and `location` to rail entries

Neither is a vehicle card by its own source. `logo` emits one `<img>` and no text
node; `location` says "Not a vehicle card at all". They are miscategorised in both
directions — noise in every vehicle job (2 of 7 choices that cannot apply), and
undiscoverable for the job they are for.

The picker drops to five, all genuine alternatives for the same item.

### 4. Rename the axes in plain words

The rail is **"start from"**, the picker is **"the card"**. No design-system
jargon: the audience is a dealership web designer, not a design-systems
practitioner, and component/variant/pattern would swap one confusing pair of words
for another.

The rail keeps `modelbar` and `cards` as separate entries. They differ by card,
content type and roster (new-inventory hrefs vs used with prices) — two real
deliverables, not a taxonomy error the designer experiences.

## Explicitly rejected

- **Promoting all seven looks.** `grid` and `tabs` each take a card, so they would
  need seven variants apiece. Combinatorial.
- **Merging `modelbar` / `cards`.** Optimises the model at the expense of the task.
- **Hard-gating the picker.** Wrong whenever the roster changes; would flag the
  demo's own defaults.

## Testing

- Every look declares a `content`; every roster-carrying pattern declares `ships`.
  A missing one fails `check-looks.mjs`, the same way a look with no `minCard`
  does now.
- The crop warning appears when the aspects genuinely differ and is silent when
  they agree — `cards` + `vcard` must stay silent.
- `logo` and `location` are reachable from the rail and absent from the picker.
- The copy panel carries the warning when one is live.
