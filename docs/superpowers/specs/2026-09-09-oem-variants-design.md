# OEM variants — a brand sets values, and the patterns page shows them

2026-09-09. Approved in principle by Steven after the chevroletdemo1 spike; this
document is the design he reviews before the plan is written.

## The problem

The library has every structure (the rail) and every card (the seven looks), but
one look per pattern. Chevrolet's tabbed model bar and the default tabbed model
bar are the same structure and the same card and do not look alike, and there
is nowhere in the demo that shows the Chevrolet one. A designer building a Chevy
site starts from a generic strip and re-derives the OEM's values by eye, every
time.

## What the spike established

The live bar on `chevroletdemo1.dealeron.com` was measured with Playwright
against the demo's `tabs` pattern at the same width. Every difference is a
**value**; none is structural:

| chevroletdemo1                                            | Default `tabs`               | Kind                                |
| --------------------------------------------------------- | ---------------------------- | ----------------------------------- |
| Tab text 18px bold, inactive tabs not dimmed              | 14px, inactive at 65%        | Missing knob (size, dim)            |
| Active tab: 2px line in `#006dc7`, the site's link colour | 2px `currentcolor` border    | Missing knob (line colour)          |
| A grey `\|` between tabs                                  | Nothing                      | Missing knob (divider text)         |
| No rule under the tab row                                 | 1px `#e2e5ea` rule           | Missing knob (rule colour)          |
| Name capitalised, `#333`, pulled up under the cutout      | `none`, `#222`, 6% plate pad | Existing knobs on the tile look     |
| Five across from 1200; five body-style tabs               | Four; three tabs             | Already the Chevrolet preset's data |
| ChevySans throughout                                      | The host's font              | Inherits. Correctly not a knob      |
| No arrows                                                 | Arrows                       | Engine fits state, not a style      |

This agrees with the census (`docs/research/2026-08-18-oem-demo-slider-census.md`):
across 76 hosts the variety is "skin, not structure". A skin is values.

## The decision

**A variant is a set of knob values.** It is never a CSS block. Where an OEM
needs a value that has no knob, the knob is added to the look or the pattern.

Why not a CSS block per OEM, which is the smaller-looking change:

- It recreates a fixed bug class. F039–F077 were knobs lying because a value lived
  in a pattern's CSS instead of its props. An OEM block overriding a knob is the
  same failure once per OEM, and the copied code would disagree with the panel.
- It cannot be reset, gated by `okValue()`, or covered by the existing knob tests.
  Values can, for free.
- Nothing measured needs it.

**A variant never changes markup.** Picking Chevrolet on the tabbed model bar
gives you the tabbed model bar in Chevrolet's values. This keeps the half of the
2026-09-08 decision that was right (a preset used to call `applyLook()` and swap
the element tree under you).

**This reverses the other half of that decision, on purpose.** `brands.js` says
presets carry no colour because a DealerOn site's colours come from its theme.
With variants, the preset supplies the OEM's values and the designer overrides
them, which is what a knob is for. The note in `brands.js` is rewritten to say
so; it is not left contradicting the code.

## Data

Each entry in `BRANDS` may carry a `styles` block. Values only, keyed the same
way the workbench already splits state:

```js
chevrolet: {
  label: 'Chevrolet',
  look: 'tile',
  ladder: [[0, 2], [539, 3], [992, 4], [1200, 5]],
  styles: {
    // Card values, keyed by LOOK. Applied when that look is on screen, so the
    // plain model bar and the tabbed one share them.
    looks: {
      tile: { '--name-case': 'capitalize', '--name-color': '#333' },
    },
    // Pattern values, keyed by PATTERN. Only what that structure adds.
    patterns: {
      tabs: {
        props: { '--tab-size': '1.125em', '--tab-dim': '1', '--tab-line': '#006dc7', '--tab-rule': 'transparent', '--tab-divider': '"|"' },
        panes: ['Trucks', 'Electric', 'Crossovers/SUVs', 'Performance', 'Commercial'],
      },
    },
  },
  source: 'chevroletdemo1.dealeron.com, measured 2026-09-09',
}
```

Rules, enforced by `npm run validate` (see Gates):

- Every key under `looks.<L>` is a key of `LOOKS[L].settings`.
- Every key under `patterns.<P>.props` is a key of `PATTERNS[P].props` or of
  `ENGINE_DEFAULTS`.
- `panes` is the one non-property field, because tab names are content the
  preset sets the same way it sets the roster. No other structural field is
  accepted.
- Every value renders through `cssFor()` and survives `okValue()`.
- A brand with a `styles` block names its `source`.

A brand without `styles` behaves exactly as today: roster and ladder.

## The five tab knobs

The `tabs` pattern's tab styling is hardcoded in its `css`. These move to
`props` so a control shows them and a variant can set them. Names and defaults
match what the CSS does now, so an untouched pattern ships the same picture:

| Prop            | Default        | Chevrolet     | Where it lands                                     |
| --------------- | -------------- | ------------- | -------------------------------------------------- |
| `--tab-size`    | `1em`          | `1.125em`     | `font-size` on `[role="tab"]`                      |
| `--tab-dim`     | `0.65`         | `1`           | `opacity` on an unselected tab                     |
| `--tab-line`    | `currentcolor` | `#006dc7`     | `border-block-end-color` on the selected tab       |
| `--tab-rule`    | `#e2e5ea`      | `transparent` | `border-block-end-color` on `.cargo-tabs`          |
| `--tab-divider` | `none`         | `"\|"`        | `content` on `[role="tab"] + [role="tab"]::before` |

The divider is a pseudo-element on the tab list, drawn at `--tab-dim` opacity
in `currentcolor`, so the markup does not change and `none` draws nothing. This
is the one knob whose value is a string; `okValue()` must accept a quoted string
for `content` and refuse it everywhere else.

`knobLabel()` gets plain-words labels for the five: Tab text size, Dim unselected
tabs, Selected tab line, Rule under the tabs, Between tabs.

## Applying a variant

In the Brand handler in `buildPanel()`, after the roster and ladder:

1. `styles.looks[state.look]` is written over `state.lookProps`. Keys starting
   `--cs-` go to `state.props` through the same rule `applyLook()` uses, so
   engine properties a variant sets are edited where the panel edits them.
2. `styles.patterns[state.pattern].props` is written over `state.props`.
3. `styles.patterns[state.pattern].panes` replaces `state.panes` when present.
4. "Start from the default" puts back the pattern's and look's own values for
   every key a variant touched, and only those. The existing test "Start from
   the default undoes the whole preset" extends to cover them.

`defaultFor(key, store)` returns the brand's value when a brand is picked and
supplies that key, otherwise the pattern's or look's. So a knob's reset goes
back to the variant, which is the baseline the designer chose. The delta filter
in `cssFor()` is a different comparison and does not change: it reads
`cssDefaults()` (the look's settings and the engine's), never the brand, so a
variant's values differ from it and reach the copied CSS, which is the point.

A variant is applied when picked and not re-applied on load. `SAVED` already
remembers `brand`; restoring it must not overwrite edits made after picking
it, which is the rule the roster already follows.

## Where the brand list is offered

Today: on a card that takes cutouts, because the preset swaps the roster. That
stays. Additionally, on any pattern for which at least one brand carries values
for that pattern or for its look, the list is offered with only those brands.
Read off the data, never a list of pattern ids.

The note under the list says what the pick did, in words: "Five across from
1200, five body-style tabs, blue selected-tab line, names capitalised. Measured
on chevroletdemo1." Built from the applied keys and the brand's `source`, not
hand-written per brand.

## The display area

`demo/patterns.html` is it. Under a pattern's default stage, one extra stage
per brand that carries values for it, each captioned with the brand and a
link into the builder. `renderPattern(id, cls, { brand })` gains the third
argument; `gallery.js` loops brands the same way it loops patterns. The
catalogue index at the top gets one tile per variant, so "the Chevrolet tabbed
bar" is findable without scrolling.

Deep link: `index.html#tabs?brand=chevrolet` opens the builder on that pattern
with the variant applied. `#pattern/look` stays gone.

## Gates

- `scripts/check-looks.mjs`: the key rules above, and that every `styles` block
  has a `source`.
- `scripts/lint-generated-css.mjs`: renders every pattern × variant through
  `cssFor()`, so a value that fails `okValue()` or stylelint fails `validate`.
- `scripts/build-cards.mjs` is untouched. Variants add no CSS to `dist/`.

## Tests (`tests/variants.test.mjs`)

Each is checked to fail against the code from before it.

- Picking Chevrolet on `tabs` turns the selected tab line `#006dc7` in the
  preview, and the copied CSS carries `--tab-line: #006dc7`.
- The five tab knobs show the value the slider is using, before and after a
  pick (the F039 rule).
- Resetting a knob under a brand goes to the brand's value; Start from the
  default goes to the pattern's.
- The brand list is absent on the logo strip until a brand carries values for
  it; present on `tabs` with only the brands that do.
- `patterns.html` renders one stage per variant, and the Chevrolet `tabs`
  stage's copied snippet matches it pixel for pixel on the hostile host
  (paste parity, the same helper `builder` uses).
- An untouched `tabs` pattern ships byte-identical CSS to before the knobs
  were added.

## Scope

First ship: the five tab knobs and Chevrolet's values for `tile` and `tabs`,
from the spike's measurements. That proves the whole path on the one variant
Steven named.

Further OEMs are added one at a time by the same method — measure the live demo
with Playwright, write the values, cite the source — and each is its own
commit. If a measured OEM turns out to need something that is not a value,
that is the trigger to revisit this spec, not to add a CSS block.

Not in scope:

- Font family. It inherits from the site, which is correct.
- A variant that swaps the pattern or the look.
- Reading a live site's theme colours. The builder cannot see the page it is
  pasted into; the OEM value is a starting point the designer overrides.
- A capture script under `scripts/`. The spike's inline Playwright is enough
  for one brand at a time; add tooling when the count justifies it.
