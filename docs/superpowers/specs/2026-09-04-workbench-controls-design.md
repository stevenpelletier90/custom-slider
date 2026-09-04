# Workbench controls: colour, units, layout, test runner

**Date:** 2026-09-04
**Status:** approved in conversation, awaiting spec review
**Touches:** the demo (`demo/`), `tests/`, `package.json`. The engine (`src/`,
`dist/`), the look definitions (`looks.js`), `cssFor()`/`htmlFor()` and the
copied output are out of scope and must not change.

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

The rule that the demo must be dependency-free was never a rule: the ENGINE is
dependency-free, the demo can use whatever makes it better (Steven, 2026-09-04).
Same for the tests: "no new devDependencies" was a constraint we set ourselves,
not one anyone asked for.

## Non-goals

- No change to what is copied. `cssFor()` output for a given state is
  byte-identical before and after; the paste-parity test proves it.
- No change to the engine, its budget, or `dist/`.
- No move to a framework (React, Vue). The demo stays classic scripts on
  `globalThis.CARGO` so it opens over `file://`.
- No auto-conversion of existing saved settings: a kept `44px` stays `44px`.

## 1. Colour rows: Coloris

Coloris (mdbassit/coloris, MIT, vanilla ES6, ~10 KB) attaches to a text input
and adds a swatch button beside it. The text field stays the source of truth,
which is the property `colorRow()` already has, so `setProp` and `restyle()` are
unchanged.

- **Vendored**, not linked: `demo/assets/vendor/coloris.min.js` and
  `coloris.min.css`, loaded as classic scripts from `index.html`. The demo runs
  over `file://` and on GitHub Pages, so `node_modules` is never served.
- **One global init** in `workbench.js` after the panel is built:
  `format: 'mixed'` (emits `#rrggbb`, or legacy `rgba()` when alpha is under 1,
  which is the form the platform minifier keeps), `alpha: true`,
  `formatToggle: true`, `clearButton: true` (clear = fall back to the default,
  same as today's empty field), `themeMode` following `theme.js`, `parent` set
  to the settings column so the dialog scrolls with it.
- **Swatches** are rebuilt on every `render()`: the brand preset's colours
  first, then every distinct colour currently set on this slider, then
  `transparent`. A designer pulling the arrow colour from the badge colour is
  one click.
- **Rows that can't be a swatch** (`currentcolor`, `inherit`, a `var()`) keep
  working: Coloris only parses what it can and leaves the text alone. The
  `wb-chip` fallback and the hidden-swatch dance in `colorRow()` are deleted.
- **Copy** is the field itself, plus the format toggle to get hex or rgba as
  needed. No separate copy button.

Dark mode: Coloris has `themeMode: 'light' | 'dark'`. `theme.js` owns the
demo's mode (a manual toggle, not only `prefers-color-scheme`), so it calls
`Coloris({ themeMode })` on load and again on each toggle. The picker's dialog
colours are overridden once in `ui.css` to the demo's own tokens.

## 2. Length rows: number + unit

A new `lengthRow(label, key, store)` replaces the free-text row for any knob
whose default is a **single** length. `okValue()` already decides "is this a
length" off the shape of the default; the same predicate picks the row type, so
a knob added to a look gets the right control the day it ships.

- **Number box** keeps the arrow-key stepper (1 / Shift 10 / Alt 0.1).
- **Unit dropdown**: `px`, `em`, `%`, `vw`. `rem` is not offered (README:
  Bootstrap 3 sets `html { font-size: 10px }`, so it ships at 62.5%).
- **Switching unit converts** where a conversion is exact: px↔em uses the
  card's resolved font size read off the preview (`--cargo-font` on the root,
  `getComputedStyle` in the iframe), so `16px` becomes `1em`. `%` and `vw`
  have no fixed reference, so switching to or from them keeps the number and
  changes the unit only, and the row's hint says so once.
- **Stored value is unchanged in shape**: the store still holds `'0.5em'`, so
  `okValue()`, `cssFor()` and the placeholder logic need no change. The zero
  rule holds: a typed `0` stores as `0.1px` with the same note the tile look
  already carries, never a bare `0`.
- **Not converted**: multi-value knobs (`6% 6% 1%`), `calc()`, keywords
  (`auto`, `none`, `normal`) and numbers with no unit (`--name-weight`,
  `--zoom`) keep the text row. The text row gains a placeholder listing the
  units accepted.

## 3. Panel layout: steps down one column, preview pinned

`index.html` and `ui.css` change; `workbench.js` changes only the order it
appends sections and wraps each in a `<details>`.

```
┌ Patterns rail ┐ ┌───────── settings (one column) ─────────┐ ┌── preview (sticky) ──┐
│ Model bar     │ │ ▾ 1  Brand and card style               │ │ [390][750][970][1170] │
│ Vehicle cards │ │ ▾ 2  How many across, gap, peek         │ │                       │
│ …             │ │ ▾ 3  This card style                    │ │   live slider         │
│               │ │ ▾ 4  Arrows and dots                    │ │                       │
│               │ │ ▾ 5  Behaviour                          │ │  spec line / warnings │
│               │ │ ▸    Advanced                           │ └───────────────────────┘
│               │ └─────────────────────────────────────────┘
│               │   Slide content  ·  Code  ·  Add the files   (unchanged, below)
```

- **Order** is the order decisions get made: what brand and card, then how
  many fit, then how the card looks, then the controls, then motion. The
  brand preset moves up because it sets the card style and the column count,
  and today it sits under the columns it overrides.
- **Sections never split.** Each is a `<details open>` with the heading as
  `<summary>`; "Advanced" (today's "Everything else") and "Tab names" start
  closed. Open/closed state is remembered per section in `localStorage`.
- **The preview is `position: sticky`** in a second column from 1200px up,
  with the width buttons and the spec line inside it. Below 1200px it goes
  back above the column, not sticky, so a laptop keeps its height.
- **Keep / Reset** stay at the top of the settings column.
- **Row width** is fixed for the column, so labels stop wrapping to two lines
  ("Arrow background · hover") and the number + unit pair fits.

## 4. Test runner: @playwright/test

`node --test` plus hand-launched Chromium becomes the Playwright test runner.
Same browser, same checks, ported file by file.

- `playwright.config.mjs`: `webServer` starts `npm run serve` (the esbuild
  server) and waits for it; `workers` default; `trace: 'on-first-retry'`,
  `screenshot: 'only-on-failure'`; `reporter: 'list'` locally, HTML on demand.
- `tests/helpers.mjs` loses its own server and `launchBrowser()`; each test
  gets `page` from the fixture.
- **Pixel checks become `toHaveScreenshot`**: the shared-vs-inline card parity
  and the seven-looks-at-three-widths check that `build-cards.mjs` documents
  as "proved pixel-identical" get a checked-in baseline under
  `tests/__screenshots__/`, so the proof runs on every `npm test` instead of
  once by hand.
- **Every existing test keeps its finding tag** (F003, F022…) in its name.
- `npm test` → `playwright test`. `npm run test:ui` → `playwright test --ui`
  for debugging. The ~14 s wall time should fall with workers; measured, not
  assumed, and recorded in CLAUDE.md when it lands.

## 5. What from Tweakpane is worth taking, and what it would cost

Steven asked for the pane-library option to be broken down after B ships.
Checked against the v4 docs:

| Element                         | Feasible?     | Notes                                                                                                                                                                                         |
| ------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Folders / tabs for the sections | Yes, but moot | Section 3 delivers the same with `<details>` and no library.                                                                                                                                  |
| Colour input with alpha         | Yes           | Equivalent to Coloris, but without a format toggle or swatches; Coloris is the better fit for a text-first field.                                                                             |
| Number input with step / slider | Partly        | Unitless. A unit would need a custom plugin (the docs show the plugin API) or a paired list; section 2 does it in ~60 lines without one.                                                      |
| List / select                   | Yes           | Same as today's `<select>` for `ENUMS`.                                                                                                                                                       |
| Whole-pane takeover             | **No, as-is** | v4 is ES-module only (v3 had a script tag). The demo must open over `file://` as classic scripts. It would need an esbuild step to bundle Tweakpane into an IIFE under `demo/assets/vendor/`. |
| Theming                         | Yes           | CSS variables (`--tp-*`) on the container; would still be a second visual language beside `ui.css`.                                                                                           |
| Preset export / import (JSON)   | Yes, useful   | `pane.exportState()` / `importState()`. The one thing the current panel lacks; could back "Keep these settings" and a shareable URL. Worth a spike on its own after B.                        |

Verdict: nothing in A is blocked, and one piece (state export) is worth a spike.
None of it should be taken before B lands, because B's rows and steps already
cover the visible wins, and the whole-pane option would rewrite `controls.test.mjs`
against a DOM the library owns.

## Error handling

- Coloris fails to load (offline `file://` with a missing vendor file): the
  text field still works; the swatch button is simply absent. `workbench.js`
  guards `typeof Coloris === 'function'`.
- A unit conversion that cannot read the preview font size (iframe not ready)
  keeps the number and changes the unit only, same as the `%`/`vw` path.
- `okValue()` remains the single gate; nothing in this spec adds a second one.

## Testing

- **Paste parity**: for each pattern, `cssFor('.my-slider')` before and after
  is identical for the same state. Runs as a unit-level check in the runner.
- **Colour row** (new): typing `rgba(0, 0, 0, 0.5)` shows a swatch; picking a
  swatch writes the field and the preview; Clear restores the default and the
  emitted CSS drops the declaration.
- **Length row** (new): `16px` → switch to em → field reads `1` `em` and the
  store holds `1em`; typed `0` stores `0.1px`; switching to `%` keeps the number.
- **Layout**: sections are in the specified order; none is split; Advanced is
  closed on first load; the preview is sticky at 1440 and static at 1024.
- **All 150 existing checks** pass under the new runner before any control
  changes are merged. Runner migration is its own commit.

## Order of work

1. Runner migration (section 4), all green, one commit.
2. Layout (section 3): order, `<details>`, sticky preview. Screenshot before and
   after at 1440 and 1024.
3. Length rows (section 2).
4. Colour rows (section 1).
5. Update CLAUDE.md: the "no new dependencies" line in the test paragraph, the
   vendor folder, and the measured test time.
