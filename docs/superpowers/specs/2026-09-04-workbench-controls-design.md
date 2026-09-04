# Workbench controls: Tweakpane owns the panel

**Date:** 2026-09-04
**Status:** approved in conversation, awaiting spec review
**Touches:** the demo (`demo/`), `tests/`, `package.json`, `scripts/`. The engine
(`src/`, `dist/`), the look definitions (`looks.js`), `cssFor()`/`htmlFor()` and
the copied output are out of scope and must not change.

## Why

The settings panel is the product now, and three things about it cost a designer
time on every visit:

- **The colour control is the OS picker.** `<input type="color">` cannot show
  `transparent` or an `rgba()`, so those rows fall back to a checkered chip and a
  text field, and the panel reads as two different tools. Nothing offers a
  swatch to click, and copying a colour out means selecting text.
- **Lengths are typed with their unit.** `0.5em`, `44px`, `6% 6% 1%`: the field
  accepts anything, `okValue()` refuses the bad ones silently, and a designer who
  thinks in pixels has to know the card is sized in `em`.
- **Seven sections in four wrapping columns.** "Arrows and spacing" splits across
  a column break, "This card style" runs fourteen rows, the preview is below the
  panel so every change means scrolling, and the order (how many across, then
  brand, then card style) is not the order anyone decides things in.

Decisions made 2026-09-04: the ENGINE is dependency-free; the demo and the tests
use whatever library does the job properly. One system owns the panel, not two
mixed on a page. That system is **Tweakpane v4**: a maintained pane library
built for exactly this (bind a value, get a control), with folders, tabs, a
colour picker with alpha, a plugin API for the controls it lacks, and JSON
state export/import.

## Non-goals

- No change to what is copied. `cssFor()` output for a given state is
  byte-identical before and after; the paste-parity test proves it.
- No change to the engine, its budget, or `dist/`.
- No framework. The demo stays classic scripts on `globalThis.CARGO` and opens
  over `file://`.
- No auto-conversion of settings someone kept: a kept `44px` stays `44px`.

## 0. Getting Tweakpane onto a `file://` page

Tweakpane v4 ships as an ES module only (v3 had a script-tag build). ES modules
are blocked over `file://`, and the demo must open by double-click. So:

- `tweakpane` and `@tweakpane/core` are devDependencies.
- `scripts/build-vendor.mjs` bundles `demo/assets/vendor/tweakpane.entry.js`
  (which imports `Pane` and our plugins) with esbuild into an IIFE at
  `demo/assets/vendor/tweakpane.js`, assigning `globalThis.CARGO.Pane`. The
  output is committed, like `dist/`, because GitHub Pages serves the repo as-is.
- `npm run build` runs it. `npm run validate` fails if the committed bundle is
  stale (rebuild to a temp path and compare), the same way `dist/` is guarded
  by the tests.
- `index.html` loads it as a classic script before `workbench.js`.

## 1. State model: bind Tweakpane straight to `state`

`state.props` and `state.lookProps` are plain objects of CSS custom property
strings. Tweakpane binds to an object key and reads/writes through a plugin's
`reader`/`writer`, so the stored value keeps its current shape (`'0.5em'`,
`'#16324f'`, `'transparent'`) and `okValue()`, `cssFor()`, `setProp` and the
placeholder/fallback logic do not change.

- One `Pane` in the settings column, container set to `#wb-settings`.
- `render()` still rebuilds the panel on a structural change (pattern, look,
  brand preset): dispose the pane, build it again from the same tables that
  build it today. Value-only changes go through `pane.on('change')` →
  `setProp` → `restyle()`, the fast path that keeps the colour drag at 0.5 ms.
- Keep / Reset / the session store are unchanged; Keep may additionally save
  `pane.exportState()` so folder open/closed state survives.

## 2. Controls, one plugin each where Tweakpane has no native fit

| Knob shape (decided off the default, as `okValue()` does today) | Control                                                               |
| --------------------------------------------------------------- | --------------------------------------------------------------------- |
| Colour (hex, rgb/rgba, `transparent`, `currentcolor`)           | **Colour plugin** (section 2a) wrapping Tweakpane's picker with alpha |
| Single length (`0.5em`, `44px`)                                 | **Length plugin** (section 2b): number + unit                         |
| Closed set (`ENUMS`)                                            | native `options` list                                                 |
| Unitless number (`--name-weight`, `--zoom`)                     | native number with `step`                                             |
| Integer count (columns per tier, rotate ms)                     | native number, `step: 1`, `min`                                       |
| Boolean (dots, outside arrows, paste cards)                     | native checkbox                                                       |
| Multi-value, `calc()`, keywords (`6% 6% 1%`, `auto`, `none`)    | native text (`view: 'text'`) with the accepted units as the hint      |

### 2a. Colour plugin

Tweakpane's picker handles the spectrum, hue and alpha. The plugin exists for
the reader/writer and the two values the picker can't represent:

- **Reader**: `transparent` → `rgba(0, 0, 0, 0)`; `#222` → `#222222`;
  `rgba()`/`rgb()`/hex parsed. `currentcolor`, `inherit`, `var()` mark the
  binding as text-only (falls through to `view: 'text'`) so nothing is lost.
- **Writer** normalises to the platform's form before storing: `#rrggbb` when
  alpha is 1, legacy `rgba(r, g, b, a)` otherwise, `transparent` when alpha is 0. This is deliberate regardless of what the picker emits: the stylelint
  rules on the copy panel require legacy notation, and the platform minifier
  keeps it.
- **Swatches**: a row of buttons under the picker, rebuilt on `render()`: the
  brand preset's colours, then every distinct colour set on this slider, then
  `transparent`. Click writes the value.
- **Clear** (a button beside the field): back to the default, same as today's
  emptied field, so the emitted CSS drops the declaration.
- **Copy**: the text field is selectable; no separate copy button.

### 2b. Length plugin

- Number field with the existing stepper semantics (1 / Shift 10 / Alt 0.1)
  and a unit list: `px`, `em`, `%`, `vw`. No `rem` (README: Bootstrap 3 sets
  `html { font-size: 10px }`, so it ships at 62.5%).
- **Switching unit converts** where exact: px↔em off the card's resolved font
  size read from the preview iframe (`--cargo-font` on the root). `%` and `vw`
  have no fixed reference: switching keeps the number, changes the unit, and
  the field hint says so.
- **Writer**: `number + unit`, with the zero rule: a typed `0` stores `0.1px`
  (the tile look already documents why), never a bare `0`.
- If the iframe isn't ready for a conversion, keep the number, change the unit.

## 3. Layout: folders in decision order, preview pinned

```
┌ Patterns rail ┐ ┌──────── settings: one Pane ─────────┐ ┌── preview (sticky) ──┐
│ Model bar     │ │ [Keep these settings] [Reset]        │ │ [390][750][970][1170] │
│ Vehicle cards │ │ ▾ 1  Brand and card style            │ │                       │
│ …             │ │ ▾ 2  How many across, gap, peek      │ │   live slider         │
│               │ │ ▾ 3  This card style                 │ │                       │
│               │ │ ▾ 4  Arrows and dots                 │ │  spec line / warnings │
│               │ │ ▾ 5  Behaviour                       │ └───────────────────────┘
│               │ │ ▸    Advanced                        │
│               │ └──────────────────────────────────────┘
│               │   Slide content  ·  Code  ·  Add the files   (unchanged, below)
```

- Each step is a Tweakpane **folder**; "Advanced" (today's "Everything else")
  and "Tab names" start `expanded: false`. Folders never split.
- **Order** is the order decisions get made. The brand preset moves to the top
  because it sets the card style and the column count, and today it sits under
  the columns it overrides.
- The card-style picker (seven thumbnails) is a **custom blade** plugin so it
  keeps its icons; it lives in folder 1.
- **The preview is `position: sticky`** in a second column from 1200px up,
  with the width buttons and the spec line inside it. Below 1200px it sits
  above the pane, not sticky.
- **Theme**: Tweakpane is themed through `--tp-*` variables set on the
  container, mapped to the `ui.css` tokens for light and dark, so `theme.js`
  needs no extra work. The pane's default dark dev-tool look is not shipped.

## 4. Test runner: @playwright/test

`node --test` plus hand-launched Chromium becomes the Playwright test runner.
Same browser, same checks, ported file by file.

- `playwright.config.mjs`: `webServer` starts `npm run serve` and waits;
  `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`; `reporter:
'list'` locally, HTML on demand.
- `tests/helpers.mjs` loses its server and `launchBrowser()`; tests take
  `page` from the fixture.
- **Pixel checks become `toHaveScreenshot`**: the shared-vs-inline card parity
  and the seven-looks-at-three-widths proof get checked-in baselines under
  `tests/__screenshots__/`, so the "proved pixel-identical" claim runs on
  every `npm test`.
- `controls.test.mjs` (a control shows what the slider is using, F039–F077) is
  rewritten against the pane's DOM: every finding keeps its tag, and each
  rewritten check is run against the OLD panel first to confirm it still
  catches what it did.
- `npm test` → `playwright test`; `npm run test:ui` → `playwright test --ui`.
  Wall time is measured and recorded in CLAUDE.md when it lands.

## 5. Sharing settings (comes with Tweakpane, kept small)

`pane.exportState()` gives a JSON of every binding. Two uses, both cheap:

- **Keep these settings** stores it beside `state` so folder state survives.
- **Copy a link**: the same JSON, compressed, in the URL hash; opening the link
  restores the pane. Uniqueness and size are the only things to watch; it is
  a follow-on, not part of the first landing.

## Error handling

- Vendor bundle missing (a stale checkout over `file://`): `workbench.js`
  guards `CARGO.Pane` and shows one message in the settings column instead of
  a blank panel. Everything else on the page (preview, content editor, code)
  still works because the state object does not depend on the pane.
- Colour that will not parse: falls to a text binding; nothing is dropped.
- Conversion without a readable font size: keep the number, change the unit.
- `okValue()` remains the single gate; no plugin adds a second one.

## Testing

- **Paste parity**: for each pattern, `cssFor('.my-slider')` before and after
  is identical for the same state.
- **Colour plugin**: `rgba(0, 0, 0, 0.5)` binds with a swatch; a picked colour
  with alpha 1 stores `#rrggbb`; with alpha 0.5 stores legacy `rgba()`; alpha 0
  stores `transparent`; Clear restores the default and the emitted CSS drops
  the declaration; `currentcolor` stays a text field.
- **Length plugin**: `16px` → em → field reads `1` `em`, store holds `1em`;
  typed `0` stores `0.1px`; switching to `%` keeps the number.
- **Layout**: folders in the specified order; Advanced closed on first load;
  preview sticky at 1440 and static at 1024.
- **Vendor guard**: `npm run validate` fails on a stale bundle.
- **All 150 existing checks** pass under the new runner before any panel
  change is merged. Runner migration is its own commit.

## Order of work

1. Runner migration (section 4), all green, one commit.
2. Vendor bundle and build/validate guard (section 0).
3. Pane skeleton bound to `state` with native controls only, old panel removed,
   `controls.test.mjs` ported. Screenshot before and after at 1440 and 1024.
4. Folders, order, sticky preview, theming (section 3).
5. Length plugin (2b), then colour plugin (2a), each with its tests.
6. Update CLAUDE.md: the test paragraph's "no new dependencies" line, the
   vendor build, the measured test time.
