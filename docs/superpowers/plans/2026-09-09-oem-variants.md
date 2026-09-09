# OEM Variants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A brand preset can carry an OEM's knob values, picking it applies them, and the patterns page shows every pattern × brand that has them — starting with Chevrolet on the tabbed model bar.

**Architecture:** A variant is a `styles` block on a `BRANDS` entry holding values keyed by look and by pattern; `applyBrand()` in `workbench.js` writes them over `state.lookProps` / `state.props` the same way `applyLook()` already does; `cssFor()` and `htmlFor()` are untouched, so the copied code cannot drift from the preview. The five tab styling values move out of the `tabs` pattern's hardcoded CSS into `props` so a control shows them. `renderPattern()` takes a brand so `patterns.html` and the generated-CSS lint both walk the variants.

**Tech Stack:** Plain classic-script JS in `demo/assets/`, Tweakpane via `pane.js`, `@playwright/test`, stylelint, Node ESM scripts.

**Spec:** `docs/superpowers/specs/2026-09-09-oem-variants-design.md`

## Global Constraints

- A variant is knob values only. Never a CSS block, never a markup change, never a pattern or look swap.
- Every key in a `styles` block is an existing knob (`LOOKS[L].settings` key, or `PATTERNS[P].props` / `ENGINE_DEFAULTS` key). `panes` is the only non-property field.
- Lengths are `em`, never `rem`; colours are hex or legacy `rgba()`; a zero length is written `0.1px`. `.stylelintrc*.json` enforce this on generated CSS.
- Anything `cssFor()`/`htmlFor()` calls is declared ABOVE `if (!stage) return` in `workbench.js` (the path `patterns.html` and `lint-generated-css.mjs` take).
- `demo/assets/*.js` are classic scripts hanging off `globalThis.CARGO` — no `import`/`export`.
- The divider value is single-quoted (`'|'`): `okStored()` refuses `"`.
- Run `npm run validate` and `npm test` before every commit. Stage files by explicit path, never `git add -A` / `.`.
- Prettier `printWidth: 200`; the PostToolUse hook formats edited files, so re-read a file before a second Edit on the same region.
- Commit messages match `git log --oneline -5` style: one imperative subject line, no prefix tag, ending with the session's `Co-Authored-By` / `Claude-Session` trailers.
- Deep-link form is `#pattern` or `#pattern?brand=id`. `#pattern/look` stays gone.

---

## File map

| File                             | Responsibility in this plan                                                                                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `demo/assets/workbench.js`       | Tab props on the `tabs` pattern; generic pattern-prop knobs; `applyBrand()`; brand list scope and note; `defaultFor()`; `renderPattern(id, cls, opts)`; deep link |
| `demo/assets/brands.js`          | Chevrolet `styles` + `source`; header note rewritten                                                                                                              |
| `demo/assets/guide.js`           | `CARD_NOTES` entries for the five tab props (tooltip text)                                                                                                        |
| `demo/assets/gallery.js`         | One stage per variant, one index tile per variant                                                                                                                 |
| `demo/assets/ui.css`             | `.gx-variant` caption style                                                                                                                                       |
| `scripts/check-looks.mjs`        | `styles` key rules, `source` rule, tab-prop notes rule                                                                                                            |
| `scripts/lint-generated-css.mjs` | Renders every pattern × variant sheet                                                                                                                             |
| `tests/variants.test.mjs`        | New: every behaviour the spec lists                                                                                                                               |
| `tests/controls.test.mjs`        | Existing preset-reset test extended                                                                                                                               |
| `CLAUDE.md`                      | One paragraph on variants, replacing the "presets carry no colour" claim                                                                                          |

---

### Task 1: The five tab knobs

The `tabs` pattern's tab styling is hardcoded in its `css` (`demo/assets/workbench.js` lines 572–584). Move the five values into `props`, reference them from the CSS, and draw them in the panel. Pattern props that are not `--cs-*` / `--cargo-*` have never had a knob loop (only `state.lookProps` does, lines 2878–2889), so this task adds one and it is generic.

**Files:**

- Modify: `demo/assets/workbench.js` — `PATTERNS.tabs` (~559–584), `KNOB_LABELS` (~2360), the knob loop (~2878), the `names` folder (~2615, ~2862)
- Modify: `demo/assets/guide.js` — `CARD_NOTES` (~257)
- Modify: `scripts/check-looks.mjs` — after the `CARD_NOTES` gate (~148)
- Test: `tests/variants.test.mjs` (create)

**Interfaces:**

- Produces: `PATTERNS.tabs.props` holds `--tab-size`, `--tab-dim`, `--tab-line`, `--tab-rule`, `--tab-divider`. `drawKnobs(folder, store, keys)` in `workbench.js` draws a colour / list / value knob per key. Panel folder titled **Tabs** (was "Tab names") holds the tab-name fields then the five knobs.

- [ ] **Step 1: Write the failing test**

Create `tests/variants.test.mjs`:

```js
// OEM variants: a brand preset that carries values, and the knobs it needs.
// Spec: docs/superpowers/specs/2026-09-09-oem-variants-design.md
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { openBuilder, pick, rowByLabel, stageFrame, copyParts } from './helpers.mjs';

test.describe.configure({ mode: 'serial' });

let browser, page, errors;

test.beforeAll(async ({ browser: b }) => {
  browser = b;
  ({ page, errors } = await openBuilder(browser, 1500));
});

// The value a knob displays, by row label - same reading as controls.test.mjs.
const knob = (page, label) =>
  page.evaluate((l) => {
    const row = [...document.querySelectorAll('#wb-settings .tp-lblv')].find((r) => r.querySelector('.tp-lblv_l')?.textContent.trim() === l);
    if (!row) return null;
    const len = row.querySelector('.tp-lenv');
    if (len) {
      const n = len.querySelector('input').value;
      return n === '' ? '' : n + len.querySelector('select').value;
    }
    const el = row.querySelector('input[type="text"], input, select');
    return el ? el.value : null;
  }, label);

// What the tab row is actually drawing in the preview frame.
const tabStyles = (page) =>
  page.evaluate(() => {
    const d = globalThis.CARGO.sdoc();
    const list = d.querySelector('.cargo-tabs');
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const sel = tabs.find((t) => t.getAttribute('aria-selected') === 'true');
    const other = tabs.find((t) => t !== sel);
    const w = d.defaultView;
    return {
      size: w.getComputedStyle(sel).fontSize,
      dim: w.getComputedStyle(other).opacity,
      line: w.getComputedStyle(sel).borderBottomColor,
      colour: w.getComputedStyle(sel).color,
      rule: w.getComputedStyle(list).borderBottomColor,
      divider: w.getComputedStyle(other, '::before').content,
    };
  });

test.describe('the tab row has knobs', () => {
  test('the five tab knobs show what the untouched tabs pattern is drawing', async () => {
    await pick(page, 'tabs');
    assert.equal(await knob(page, 'Tab text size'), '1em');
    assert.equal(await knob(page, 'Dim unselected tabs'), '0.65');
    assert.equal(await knob(page, 'Selected tab line'), 'currentcolor');
    assert.equal(await knob(page, 'Rule under the tabs'), '#e2e5ea');
    assert.equal(await knob(page, 'Between tabs'), 'none');
    const s = await tabStyles(page);
    // Same picture as before the knobs existed: 14px inherits the frame's body,
    // 0.65 dim, line in the text colour, the #e2e5ea rule, no divider.
    assert.equal(s.dim, '0.65');
    assert.equal(s.line, s.colour);
    assert.equal(s.rule, 'rgb(226, 229, 234)');
    assert.equal(s.divider, 'none');
    assert.deepEqual(errors, []);
  });

  test('a tab knob reaches the preview and the copied CSS', async () => {
    await pick(page, 'tabs');
    const row = rowByLabel(page, 'Rule under the tabs');
    const input = row.locator('input[type="text"]').first();
    await input.fill('#ff0000');
    await input.press('Enter');
    await page.waitForTimeout(150);
    assert.equal((await tabStyles(page)).rule, 'rgb(255, 0, 0)');
    const { css } = await copyParts(page);
    assert.match(css, /--tab-rule: #ff0000;/);
    assert.deepEqual(errors, []);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx playwright test tests/variants.test.mjs`
Expected: FAIL — `knob(page, 'Tab text size')` returns `null` (no such row).

- [ ] **Step 3: Move the five values into props and reference them from the CSS**

In `demo/assets/workbench.js`, `PATTERNS.tabs`, change `props` and `css`:

```js
      props: {
        '--cs-gap': '0.5em',
        '--cs-controls-space': '0.1px',
        '--cs-arrow-bg': 'transparent',
        '--cs-arrow-fg': '#262626',
        // The tab row's own values. They were literals in the css below until
        // 2026-09-09, which meant no control showed them - the F039 shape - and
        // a brand variant had nothing to set. Defaults are what the literals
        // were, so an untouched pattern draws the same row.
        '--tab-size': '1em',
        '--tab-dim': '0.65',
        '--tab-line': 'currentcolor',
        '--tab-rule': '#e2e5ea',
        // A string, single-quoted: okStored() refuses a value holding a double
        // quote, so '"|"' would survive the session and vanish on reload.
        '--tab-divider': 'none',
      },
      hideDots: true,
      panes: ['Trucks', 'SUVs', 'Crossovers'],
      css: `.cargo-tabs { display: flex; flex-wrap: wrap; gap: 0.25em; justify-content: center; margin-block-end: 1em; border-block-end: 1px solid var(--tab-rule); }
.cargo-tabs [role="tab"] { padding: 0.6em 1.1em; font: inherit; font-size: var(--tab-size); font-weight: 600; line-height: 1.55; color: inherit; cursor: pointer; background: none; border: 0; border-block-end: 2px solid transparent; opacity: var(--tab-dim); }
.cargo-tabs [role="tab"][aria-selected="true"] { border-block-end-color: var(--tab-line); opacity: 1; }
/* The divider sits on the tab that FOLLOWS it, outside its own box, so it
   never widens the hit target. none draws nothing. */
.cargo-tabs [role="tab"] + [role="tab"]::before { position: absolute; inset-inline-start: -0.125em; content: var(--tab-divider); color: currentcolor; opacity: var(--tab-dim); transform: translateX(-50%); }
.cargo-tabs [role="tab"] + [role="tab"] { position: relative; }
.cargo-pane[hidden] { display: none; }
```

Keep the existing phone media query block that follows. The `font: inherit` shorthand must come BEFORE `font-size: var(--tab-size)` or it resets it — that order is deliberate.

- [ ] **Step 4: Add labels and notes**

In `KNOB_LABELS` (`workbench.js` ~2360) add:

```js
    '--tab-size': 'Tab text size',
    '--tab-dim': 'Dim unselected tabs',
    '--tab-line': 'Selected tab line',
    '--tab-rule': 'Rule under the tabs',
    '--tab-divider': 'Between tabs',
```

In `demo/assets/guide.js` `CARD_NOTES` add:

```js
    '--tab-size': 'Size of the tab labels. <code>1em</code> matches the page’s body text; Chevrolet runs them a step larger.',
    '--tab-dim': 'How faded an unselected tab is, 0 to 1. <code>1</code> shows every tab at full strength and leaves the line to mark the selected one.',
    '--tab-line': 'Colour of the 2px line under the selected tab. <code>currentcolor</code> uses the text colour; a hex pins it to a brand colour.',
    '--tab-rule': 'Colour of the 1px rule under the whole tab row. <code>transparent</code> removes it.',
    '--tab-divider': 'Text drawn between tabs, in quotes — <code>\'|\'</code> for the Chevrolet bar. <code>none</code> draws nothing.',
```

- [ ] **Step 5: Draw pattern-prop knobs generically**

In `buildPanel()` (`workbench.js`), rename the tab folder and add a generic knob helper. Replace:

```js
const names = p.panes ? pane.folder('Tab names') : null;
```

with:

```js
// "Tabs", not "Tab names": since 2026-09-09 it holds the tab row's own
// knobs under the names, and a folder called "names" with a colour in it
// is a folder nobody looks in for the colour.
const names = p.panes ? pane.folder('Tabs') : null;
```

Above `buildPanel()`, next to `colourKnob`, add:

```js
// One knob per key, the control read off the value's shape: a colour gets
// the picker, a closed set a list, anything else the length/text control.
// Shared by the look's settings and a pattern's own props, so a knob added
// to either is drawn the same way the day it ships.
const drawKnobs = (folder, store, keys) => {
  for (const k of keys) {
    const v = store[k];
    if (/^#|rgb|transparent/.test(v)) colourKnob(folder, knobLabel(k), k, store);
    else if (ENUMS[k])
      pane.list(folder, knobLabel(k), String(v).trim(), ENUMS[k], (picked) => {
        store[k] = picked;
        render();
      });
    else valueKnob(folder, knobLabel(k), k, store);
  }
};
```

Replace the lookProps loop (`if (knobs) { for (const k of Object.keys(state.lookProps)) {...} }`) with:

```js
if (knobs) drawKnobs(knobs, state.lookProps, Object.keys(state.lookProps));
```

Directly after the `if (p.panes) { ... }` block that draws the `Tab N` fields, add:

```js
// A pattern's OWN props - the tab row's values today. Engine (--cs-*) and
// shared (--cargo-*) properties are drawn by their named rows elsewhere;
// what is left is what the pattern added, and it goes in the pattern's
// folder where one exists, or its own.
const ownProps = Object.keys(p.props ?? {}).filter((k) => !k.startsWith('--cs-') && !k.startsWith('--cargo-'));
if (ownProps.length) drawKnobs(names ?? pane.folder('This pattern'), state.props, ownProps);
```

- [ ] **Step 6: Gate the notes in check-looks**

In `scripts/check-looks.mjs`, after the existing `CARD_NOTES` loop over `LOOKS`, add:

```js
// A pattern's own props are knobs too (the tab row's, since 2026-09-09), and
// the builder shows CARD_NOTES as their tooltip - so the same rule holds.
const wbSrc = readFileSync('demo/assets/workbench.js', 'utf8');
for (const [, prop] of wbSrc.matchAll(/'(--(?!cs-|cargo-)[a-z0-9-]+)':\s*'[^']*',?\s*(?:\/\/[^\n]*)?\n/g)) {
  if (Object.values(LOOKS).some((l) => prop in (l.settings ?? {}))) continue; // already checked above
  if (!guideSrc.includes(`'${prop}':`)) {
    console.error(`  pattern prop ${prop} has no entry in CARD_NOTES (demo/assets/guide.js) — a knob nobody can look up`);
    bad++;
  }
}
```

Run `node scripts/check-looks.mjs` and confirm it reports only the tab props if the guide entries are missing, and passes with them present. If the regex catches a non-prop key in `workbench.js`, narrow it — the aim is every `'--x': 'value'` pair in a `props:` map.

- [ ] **Step 7: Run the new tests and the gates**

Run: `npx playwright test tests/variants.test.mjs`
Expected: both PASS.

Run: `npm run validate`
Expected: clean. If `lint:css:generated` flags property order in the new divider rule, reorder to recess-order (position, inset, content, color, opacity, transform is already that order).

Run: `npm test`
Expected: all pass. `tests/layout.test.mjs` "every section is open" iterates `tabs` by title and is unaffected by the rename; if any test asserts the literal "Tab names", update it to "Tabs".

- [ ] **Step 8: Commit**

```bash
git add demo/assets/workbench.js demo/assets/guide.js scripts/check-looks.mjs tests/variants.test.mjs
git commit -m "Give the tab row its five knobs"
```

---

### Task 2: Chevrolet's values in brands.js, gated

**Files:**

- Modify: `demo/assets/brands.js` — header comment (lines 1–37), `chevrolet` entry (~408)
- Modify: `scripts/check-looks.mjs` — the brand loop (~163–195)

**Interfaces:**

- Produces: `BRANDS.chevrolet.styles = { looks: { tile: {...} }, patterns: { tabs: { props: {...}, panes: [...] } } }` and `BRANDS.chevrolet.source` (string). `check-looks` fails on a `styles` key that is not a knob.

- [ ] **Step 1: Write the failing gate**

In `scripts/check-looks.mjs`, inside `for (const [id, b] of brands) {` after the label/look checks and BEFORE `if (b.ladder === null) continue;`, add:

```js
// A variant (2026-09-09) is knob VALUES and nothing else. Every key has to
// be a knob that exists, or the value is written to nothing and the preset
// claims a change it never makes. `panes` is the one non-property field:
// tab names are content, set the way the roster is.
if (b.styles != null) {
  if (typeof b.source !== 'string' || !b.source.trim()) {
    console.error(`  ${id}: has styles but no source — say which live site the values were measured on`);
    bad++;
  }
  for (const [lk, vals] of Object.entries(b.styles.looks ?? {})) {
    if (!LOOKS[lk]) {
      console.error(`  ${id}: styles.looks.${lk} names a look that does not exist`);
      bad++;
      continue;
    }
    for (const k of Object.keys(vals)) {
      if (!(k in LOOKS[lk].settings) && !k.startsWith('--cs-')) {
        console.error(`  ${id}: styles.looks.${lk} sets ${k}, which the ${lk} look has no knob for`);
        bad++;
      }
    }
  }
  for (const [pid, entry] of Object.entries(b.styles.patterns ?? {})) {
    const props = PATTERN_PROPS[pid];
    if (!props) {
      console.error(`  ${id}: styles.patterns.${pid} names a pattern that does not exist`);
      bad++;
      continue;
    }
    for (const field of Object.keys(entry)) {
      if (field !== 'props' && field !== 'panes') {
        console.error(`  ${id}: styles.patterns.${pid}.${field} — a variant carries props and panes only, never structure`);
        bad++;
      }
    }
    for (const k of Object.keys(entry.props ?? {})) {
      if (!(k in props) && !ENGINE_KEYS.has(k)) {
        console.error(`  ${id}: styles.patterns.${pid} sets ${k}, which the ${pid} pattern has no knob for`);
        bad++;
      }
    }
    if (entry.panes && !PATTERN_PANES.has(pid)) {
      console.error(`  ${id}: styles.patterns.${pid} sets panes on a pattern with no tabs`);
      bad++;
    }
  }
}
```

`PATTERN_PROPS`, `ENGINE_KEYS` and `PATTERN_PANES` need `workbench.js`, which `check-looks` does not load (it has no DOM). Read them off the source text instead, above the brand loop:

```js
// The patterns' props and the engine defaults, read off workbench.js as text:
// check-looks has no DOM to load it with, and the maps are literal objects.
const wbText = readFileSync('demo/assets/workbench.js', 'utf8');
const patternsText = wbText.slice(wbText.indexOf('const PATTERNS = {'), wbText.indexOf('/* ---- ', wbText.indexOf('const PATTERNS = {')));
const PATTERN_PROPS = {};
const PATTERN_PANES = new Set();
for (const m of patternsText.matchAll(/\n    ([a-z-]+|'[a-z-]+'): \{([\s\S]*?)\n    \},/g)) {
  const pid = m[1].replace(/'/g, '');
  const body = m[2];
  PATTERN_PROPS[pid] = Object.fromEntries([...(body.match(/props: \{[\s\S]*?\}/)?.[0] ?? '').matchAll(/'(--[a-z0-9-]+)'/g)].map(([, k]) => [k, true]));
  if (/\n      panes: \[/.test(body)) PATTERN_PANES.add(pid);
}
const ENGINE_KEYS = new Set([...(wbText.match(/const ENGINE_DEFAULTS = \{[\s\S]*?\n  \};/)?.[0] ?? '').matchAll(/'(--cs-[a-z0-9-]+)'/g)].map(([, k]) => k));
if (!Object.keys(PATTERN_PROPS).length || !ENGINE_KEYS.size) {
  console.error('  check-looks: could not read PATTERNS or ENGINE_DEFAULTS out of workbench.js — the text scan needs updating');
  bad++;
}
```

Verify the slice boundary: `grep -n "/\* ---- " demo/assets/workbench.js` and confirm the first section marker after `const PATTERNS = {` ends the map. If the file uses a different end marker, use the line `  };` that closes `PATTERNS` (search for `\n  };\n` after the start index) instead.

Then add a deliberately wrong entry to `demo/assets/brands.js` `chevrolet`:

```js
      styles: { patterns: { tabs: { props: { '--tab-nonsense': '1' } } } },
      source: 'x',
```

Run: `node scripts/check-looks.mjs`
Expected: FAIL with `chevrolet: styles.patterns.tabs sets --tab-nonsense, which the tabs pattern has no knob for`.

- [ ] **Step 2: Write Chevrolet's real values**

Replace the wrong entry with:

```js
    chevrolet: {
      label: 'Chevrolet',
      look: 'tile',
      ladder: [
        [0, 2],
        [539, 3],
        [992, 4],
        [1200, 5],
      ],
      demos: 3,
      note: 'Since Nov 2025 the official bar is the tabbed version; the plain slick look was deprecated and its sites migrated.',
      // The variant: what chevroletdemo1 draws, as knob values. Measured with
      // Playwright against the demo's own tabs pattern on 2026-09-09 - every
      // difference was a value, none was structure, which is what lets this be
      // a preset rather than a second pattern. The blue is the site's link
      // colour; on a real Chevy site a designer swaps it for the theme's.
      styles: {
        looks: {
          tile: { '--name-case': 'capitalize', '--name-color': '#333' },
        },
        patterns: {
          tabs: {
            props: { '--tab-size': '1.125em', '--tab-dim': '1', '--tab-line': '#006dc7', '--tab-rule': 'transparent', '--tab-divider': "'|'" },
            panes: ['Trucks', 'Electric', 'Crossovers/SUVs', 'Performance', 'Commercial'],
          },
        },
      },
      source: 'chevroletdemo1.dealeron.com, measured 2026-09-09',
    },
```

Run: `node scripts/check-looks.mjs`
Expected: PASS.

- [ ] **Step 3: Rewrite the header note in brands.js**

Replace lines 1–37 of `demo/assets/brands.js` (everything before `(() => {`) with:

```js
// The 32 OEM brands on the platform, as presets for the one component.
//
// A preset is NOT a copy of a slider. It sets the ROSTER (which vehicles), the
// LADDER (how many across at each breakpoint), and - since 2026-09-09, where a
// brand has been measured - the VALUES that brand's live demo draws: a
// `styles` block of knob values keyed by look and by pattern. See
// docs/superpowers/specs/2026-09-09-oem-variants-design.md.
//
// What a preset never does is change MARKUP. It used to apply `look` as well,
// and a look owns an element tree: picking Alfa Romeo on the model bar
// reordered the name above the photo, added a CTA button, went dark and
// cropped 3:5 - you chose a pattern from the rail and got a different one
// back. The census this file cites (docs/research/2026-08-18-oem-demo-slider-
// census.md) says the variety across OEMs is "skin, not structure", and a skin
// is values, which is exactly what `styles` holds. `look` stays in each entry
// as a suggestion the panel offers in words.
//
// `ladder` is the brand's REAL slick config, recorded verbatim as
// [minWidth, perView] pairs, so it stays auditable against the census. It is
// deliberately not what gets emitted: perViewFor() reads each ladder at the
// platform's own Bootstrap 3 tiers (768 / 992 / 1200) and clamps anything that
// would squeeze a card below the width its content needs.
//
// Colour: a `styles` block may carry a brand's hex (Chevrolet's tab line is
// its link blue) because the live site draws it. It is a starting value the
// designer overrides with the site's theme colour, not a claim about the
// theme - the builder cannot see the page it is pasted into. A brand with no
// `styles` block sets no colour at all, which is why the arrow/gap controls
// sit right next to the picker.
```

- [ ] **Step 4: Run the gates and commit**

Run: `npm run validate`
Expected: clean.

```bash
git add demo/assets/brands.js scripts/check-looks.mjs
git commit -m "Chevrolet carries its measured values, and validate checks every key is a knob"
```

---

### Task 3: Picking a brand applies its values

**Files:**

- Modify: `demo/assets/workbench.js` — new `applyBrand()` beside `applyLook()` (~965); Brand handler and `brandable` in `buildPanel()` (~2608, ~2705–2790); `defaultFor()` (~2438); `describe()` (~2706)
- Modify: `tests/controls.test.mjs` — "Start from the default undoes the whole preset" (~107)
- Test: `tests/variants.test.mjs`

**Interfaces:**

- Consumes: `BRANDS[id].styles` from Task 2; `--tab-*` props from Task 1.
- Produces: `applyBrand(id)` — sets `state.brand`, `state.count`, `state.perView`, and writes the variant's values into `state.lookProps` / `state.props` / `state.panes`; `null` puts every touched key back to the pattern's and look's own values. Declared ABOVE `if (!stage) return`. `brandValue(key, store)` returns the picked brand's value for a key or `undefined`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/variants.test.mjs`:

```js
const selectBrand = async (page, id) => {
  await rowByLabel(page, 'Brand').locator('select').selectOption(id);
  await page.waitForTimeout(200);
};

test.describe('a brand applies its values', () => {
  test('Chevrolet on the tabbed bar draws the blue line and ships it', async () => {
    await pick(page, 'tabs');
    await selectBrand(page, 'chevrolet');
    const s = await tabStyles(page);
    assert.equal(s.line, 'rgb(0, 109, 199)');
    assert.equal(s.dim, '1');
    assert.equal(s.rule, 'rgba(0, 0, 0, 0)');
    assert.equal(s.divider, '"|"');
    assert.equal(await knob(page, 'Selected tab line'), '#006dc7');
    assert.equal(await knob(page, 'Name case'), 'capitalize');
    const tabs = await page.evaluate(() => [...globalThis.CARGO.sdoc().querySelectorAll('.cargo-tabs [role="tab"]')].map((t) => t.textContent.trim()));
    assert.deepEqual(tabs, ['Trucks', 'Electric', 'Crossovers/SUVs', 'Performance', 'Commercial']);
    const { css } = await copyParts(page);
    assert.match(css, /--tab-line: #006dc7;/);
    assert.match(css, /--name-case: capitalize;/);
    assert.deepEqual(errors, []);
  });

  test('the same brand on the plain model bar brings the card values and nothing about tabs', async () => {
    await pick(page, 'modelbar');
    await selectBrand(page, 'chevrolet');
    assert.equal(await knob(page, 'Name case'), 'capitalize');
    const { css } = await copyParts(page);
    assert.match(css, /--name-case: capitalize;/);
    assert.doesNotMatch(css, /--tab-/);
  });

  test('resetting a knob goes back to the brand; Start from the default goes back to the pattern', async () => {
    await pick(page, 'tabs');
    await selectBrand(page, 'chevrolet');
    const row = rowByLabel(page, 'Selected tab line');
    const input = row.locator('input[type="text"]').first();
    await input.fill('#123456');
    await input.press('Enter');
    await page.waitForTimeout(150);
    assert.equal((await tabStyles(page)).line, 'rgb(18, 52, 86)');
    await input.fill('');
    await input.press('Enter');
    await page.waitForTimeout(150);
    assert.equal((await tabStyles(page)).line, 'rgb(0, 109, 199)', 'clearing the field should fall back to the brand value');
    await selectBrand(page, '');
    const s = await tabStyles(page);
    assert.equal(s.line, s.colour, 'Start from the default should put the pattern value back');
    assert.equal(s.dim, '0.65');
    assert.equal(await knob(page, 'Name case'), 'none');
    const tabs = await page.evaluate(() => [...globalThis.CARGO.sdoc().querySelectorAll('.cargo-tabs [role="tab"]')].map((t) => t.textContent.trim()));
    assert.deepEqual(tabs, ['Trucks', 'SUVs', 'Crossovers']);
    assert.deepEqual(errors, []);
  });

  test('the brand list is offered only where a brand has something to give', async () => {
    await pick(page, 'logostrip');
    assert.equal(await rowByLabel(page, 'Brand').count(), 0, 'no brand carries values for the logo strip');
    await pick(page, 'tabs');
    const opts = await rowByLabel(page, 'Brand')
      .locator('select')
      .evaluate((s) => [...s.options].map((o) => o.value).filter(Boolean));
    assert.ok(opts.includes('chevrolet'));
    assert.ok(opts.length >= 32, 'a cutout card offers every brand, because every brand has a roster');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx playwright test tests/variants.test.mjs`
Expected: the four new tests FAIL (line stays `currentcolor`, tabs stay three).

- [ ] **Step 3: Add applyBrand() and brandValue()**

In `workbench.js`, directly after `applyLook()` (after its closing `};` ~line 985), add:

```js
// What the picked brand says a knob should be, or undefined. Read off the
// brand's styles for the LOOK on screen and the PATTERN on screen, which is
// the same split the state keeps: card values by look, the rest by pattern.
const brandValue = (key, store) => {
  const s = BRANDS[state.brand]?.styles;
  if (!s) return undefined;
  if (store === state.lookProps) return s.looks?.[state.look]?.[key];
  return s.patterns?.[state.pattern]?.props?.[key] ?? s.looks?.[state.look]?.[key];
};

// A preset sets the roster, the ladder and - where the brand has been
// measured - its values. Never markup: see the note at the top of brands.js.
// Values land where the panel edits them: a card value in lookProps, unless
// it is an engine --cs-* property, which applyLook() already moves to props
// for the same reason; a pattern value in props; tab names in panes.
//
// null is "Start from the default": every key a variant could have touched
// goes back to the pattern's or look's own value, and only those - a knob the
// designer set that no brand ever supplies is theirs to keep.
const applyBrand = (id) => {
  const p = PATTERNS[state.pattern];
  const prev = BRANDS[state.brand]?.styles;
  state.brand = id && BRANDS[id] ? id : null;
  const b = BRANDS[state.brand];
  const undo = (s) => {
    if (!s) return;
    for (const k of Object.keys(s.looks?.[state.look] ?? {})) {
      if (k.startsWith('--cs-')) {
        if (k in (p.props ?? {})) state.props[k] = p.props[k];
        else if (k in LOOKS[state.look].settings) state.props[k] = LOOKS[state.look].settings[k];
        else delete state.props[k];
      } else state.lookProps[k] = LOOKS[state.look].settings[k];
    }
    for (const k of Object.keys(s.patterns?.[state.pattern]?.props ?? {})) {
      if (k in (p.props ?? {})) state.props[k] = p.props[k];
      else delete state.props[k];
    }
    if (s.patterns?.[state.pattern]?.panes) state.panes = null;
  };
  undo(prev);
  if (!b) {
    state.perView = { ...(p.perView ?? LOOKS[state.look].perView) };
    state.count = p.models.length;
    return;
  }
  if (b.models) state.count = b.models.length;
  state.perView = b.ladder ? perViewFor(b.ladder, LOOKS[state.look].minCard, gapPx(), state.look) : { ...LOOKS[state.look].perView };
  const s = b.styles;
  if (!s) return;
  for (const [k, v] of Object.entries(s.looks?.[state.look] ?? {})) {
    if (k.startsWith('--cs-')) state.props[k] = v;
    else if (k in state.lookProps) state.lookProps[k] = v;
  }
  Object.assign(state.props, s.patterns?.[state.pattern]?.props ?? {});
  const panes = s.patterns?.[state.pattern]?.panes;
  if (panes && p.panes) state.panes = [...panes];
};
```

`perViewFor` comes off `CARGO` at the top of the file; `gapPx` is declared at ~line 1121, below this point, which is fine because `applyBrand()` only calls it at run time (from the panel, the deep link or `renderPattern()`), all of which happen after the whole script has executed. Do not move it below `if (!stage) return` — `renderPattern()` needs it on the `patterns.html` path.

- [ ] **Step 4: Use it in the Brand handler**

In `buildPanel()`, replace the body of the `pane.list(style, 'Brand', ...)` callback. Keep `rememberDiscard('the preset'); state.content = null; clearContent();` and replace everything from `const b = BRANDS[state.brand];` down to (not including) `rebuild(() => {` with:

```js
applyBrand(v || null);
```

Delete the long comment block about `applyLook(b.look)` inside the handler — its content now lives on `applyBrand()` and in `brands.js`.

Also delete `state.brand = v || null;` at the top of the callback (`applyBrand` sets it), but keep it before `rememberDiscard` if `rememberDiscard` reads `state.brand` — check with `grep -n "const rememberDiscard" -A 8`.

- [ ] **Step 5: Extend where the list is offered, and what the note says**

Replace:

```js
const brandable = !!p.look && String(LOOKS[p.look].content).includes('cutout');
```

with:

```js
// Two doors. A cutout card takes every brand, because every brand has a
// roster. Any other pattern takes the brands that carry values for it or
// for its card - read off the data, never a list of pattern ids.
const takesCutouts = !!p.look && String(LOOKS[p.look].content).includes('cutout');
const brandsFor = Object.entries(BRANDS).filter(([, b]) => takesCutouts || b.styles?.patterns?.[state.pattern] || (state.look && b.styles?.looks?.[state.look]));
const brandable = brandsFor.length > 0;
```

In the `pane.list(style, 'Brand', ...)` call, replace `...Object.entries(BRANDS).map(([id, b]) => [id, b.label])` with `...brandsFor.map(([id, b]) => [id, b.label])`.

Note `style` is created as `p.look ? pane.folder(...) : null` — a pattern with no look but a variant would have no folder. Change it to:

```js
const style = p.look || brandable ? pane.folder(brandable ? (p.look ? 'Brand and cards' : 'Brand') : 'The card') : null;
```

In `describe()`, after the `counts` line, build the sentence from what was applied:

```js
const applied = [];
const s = b.styles;
if (s?.patterns?.[state.pattern]?.panes) applied.push(`${s.patterns[state.pattern].panes.length} tabs`);
const keys = [...Object.keys(s?.looks?.[state.look] ?? {}), ...Object.keys(s?.patterns?.[state.pattern]?.props ?? {})];
if (keys.length) applied.push(keys.map((k) => knobLabel(k).toLowerCase()).join(', '));
const measured = s ? ` ${applied.length ? `Also sets ${applied.join(' and ')}.` : ''} Measured on ${b.source}.` : '';
```

and append `${measured}` to both returned strings. Update the no-brand sentence to: `'Sets the vehicles and how many cards across, from what that brand actually ships — and, where a brand has been measured, the values its live bar draws. Everything stays yours to change.'`

- [ ] **Step 6: Make a knob's reset go to the brand**

Replace `defaultFor`:

```js
const defaultFor = (key, store) => brandValue(key, store) ?? (store === state.lookProps ? LOOKS[state.look]?.settings?.[key] : PATTERNS[state.pattern].props?.[key]);
```

`knobDefault()` (~1209) is what the placeholder and the length control read; it does not go through `defaultFor`. Leave it — the placeholder shows the pattern's value, which is what "clear this field" names in the copy; the brand value is what clearing actually restores, and the test in Step 1 holds that.

- [ ] **Step 7: Extend the existing preset test**

In `tests/controls.test.mjs`, the test "Start from the default undoes the whole preset" picks `cards` and the first brand. Add after the `assert.equal(after.cls, name, ...)` line:

```js
// 2026-09-09: a brand can carry values. On the vcard the first brand
// carries none, so this holds that the reset leaves the look's knobs
// exactly where they started rather than at a brand's.
const props = await page.evaluate(() => ({ ...globalThis.CARGO.state.lookProps }));
const own = await page.evaluate(() => globalThis.CARGO.LOOKS[globalThis.CARGO.state.look].settings);
for (const k of Object.keys(props)) if (!k.startsWith('--cs-')) assert.equal(props[k], own[k], `${k} did not come back to the look's own value`);
```

Check that `state` and `LOOKS` are on `globalThis.CARGO` (`grep -n "^    state,\|    LOOKS," demo/assets/workbench.js` around the export at ~1721). If `state` is not exported, export it there as `state,` — tests already read `sdoc`, and exposing state for reads is in keeping.

- [ ] **Step 8: Run everything**

Run: `npx playwright test tests/variants.test.mjs tests/controls.test.mjs`
Expected: PASS.

Run: `npm run validate && npm test`
Expected: clean, all pass.

- [ ] **Step 9: Commit**

```bash
git add demo/assets/workbench.js tests/variants.test.mjs tests/controls.test.mjs
git commit -m "Picking a brand applies its measured values, and the reset puts them back"
```

---

### Task 4: The patterns page shows every variant, and the lint walks them

**Files:**

- Modify: `demo/assets/workbench.js` — `renderPattern` (~1728); the boot hash read (~3973) and `hashchange` (~3807)
- Modify: `demo/assets/gallery.js` — the pattern loop (~22–70) and the index (~71)
- Modify: `demo/assets/ui.css` — after `.gx-head p` (~1979)
- Modify: `scripts/lint-generated-css.mjs` — `sheets` / `markup` (~70–73)
- Test: `tests/variants.test.mjs`

**Interfaces:**

- Consumes: `applyBrand()` from Task 3.
- Produces: `renderPattern(id, cls, { brand } = {})`. `CARGO.variantsOf(id)` returns the brand ids that carry values for pattern `id` or its look. Deep link `#tabs?brand=chevrolet`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/variants.test.mjs`:

```js
import { ORIGIN, hostHtml, engineFiles, readSlider } from './helpers.mjs';

test.describe('the patterns page shows the variants', () => {
  test('one stage per brand that carries values, with a tile in the index', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(`${ORIGIN}/demo/patterns.html`, { waitUntil: 'load' });
    await p.waitForSelector('#p-tabs .cs-slide');
    const found = await p.evaluate(() => ({
      stage: !!document.querySelector('#p-tabs-chevrolet .cs'),
      caption: document.querySelector('#p-tabs-chevrolet .gx-variant')?.textContent.trim(),
      tile: !!document.querySelector('.gx-tile[href="#p-tabs-chevrolet"]'),
      builderLink: document.querySelector('#p-tabs-chevrolet a.ui-btn')?.getAttribute('href'),
      line: (() => {
        const t = document.querySelector('#p-tabs-chevrolet [role="tab"][aria-selected="true"]');
        return t && getComputedStyle(t).borderBottomColor;
      })(),
      noneOnLogo: !document.querySelector('#p-logostrip-chevrolet'),
    }));
    assert.equal(found.stage, true, 'no Chevrolet stage under the tabbed bar');
    assert.match(found.caption ?? '', /Chevrolet/);
    assert.equal(found.tile, true);
    assert.equal(found.builderLink, 'index.html#tabs?brand=chevrolet');
    assert.equal(found.line, 'rgb(0, 109, 199)');
    assert.equal(found.noneOnLogo, true);
    assert.deepEqual(errs, []);
    await ctx.close();
  });

  test('the deep link opens the builder on the variant', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 900 } });
    const p = await ctx.newPage();
    await p.goto(`${ORIGIN}/demo/index.html#tabs?brand=chevrolet`, { waitUntil: 'load' });
    await p.waitForSelector('#wb-stage');
    await p.frameLocator('#wb-stage').locator('.cs-slide').first().waitFor({ state: 'attached', timeout: 15000 });
    const brand = await rowByLabel(p, 'Brand').locator('select').inputValue();
    assert.equal(brand, 'chevrolet');
    assert.equal((await tabStyles(p)).line, 'rgb(0, 109, 199)');
    await ctx.close();
  });

  test('the Chevrolet tabbed bar pastes onto a hostile host the way the page shows it', async () => {
    await pick(page, 'tabs');
    await selectBrand(page, 'chevrolet');
    const parts = await copyParts(page);
    const engine = await engineFiles();
    const host = await browser.newPage();
    await host.setContent(hostHtml({ ...engine, css: parts.css, html: parts.html, js: parts.js }), { waitUntil: 'load' });
    const hostLine = await host.evaluate(() => getComputedStyle(document.querySelector('[role="tab"][aria-selected="true"]')).borderBottomColor);
    assert.equal(hostLine, 'rgb(0, 109, 199)');
    const slider = await readSlider(host);
    assert.ok(slider && slider.width > 0);
    await host.close();
  });
});
```

Move the `import` to the top of the file with the other import (ESM imports hoist, but keep the file tidy — merge into the existing `from './helpers.mjs'` line).

- [ ] **Step 2: Run to verify failure**

Run: `npx playwright test tests/variants.test.mjs`
Expected: the three new tests FAIL (`#p-tabs-chevrolet` missing; deep link leaves Brand empty).

- [ ] **Step 3: renderPattern takes a brand, and variantsOf() says which exist**

In the `globalThis.CARGO = Object.assign(...)` block in `workbench.js` (~1728), replace `renderPattern`:

```js
    // `brand` draws the pattern in that brand's measured values - the
    // patterns page shows one stage per variant, and the generated-CSS lint
    // walks the same list, so a variant that pastes badly fails validate.
    renderPattern(id, cls, { brand = null } = {}) {
      loadPattern(id);
      if (brand) applyBrand(brand);
      return { css: cssFor(`.${cls}`), html: htmlFor(cls) };
    },
    // The brands that carry values for a pattern or for its card, in the
    // order brands.js lists them. Read off the data, never a list of ids.
    variantsOf(id) {
      const look = PATTERNS[id].look;
      return Object.entries(BRANDS)
        .filter(([, b]) => b.styles?.patterns?.[id] || (look && b.styles?.looks?.[look]))
        .map(([bid]) => bid);
    },
    BRANDS,
```

Check `BRANDS` is not already exported there; if it is, leave the existing line.

- [ ] **Step 4: The deep link**

In `workbench.js`, replace both hash reads. At boot (~3973):

```js
const [seg] = location.hash.slice(1).split('/');
const [id, query] = seg.split('?');
const wantBrand = new URLSearchParams(query ?? '').get('brand');
loadPattern(PATTERNS[id] ? id : 'modelbar');
restoreSettings();
restoreContent();
// A deep link to a variant wins over remembered edits: the link named the
// brand, and a page that opens on something else is a broken link.
if (wantBrand && BRANDS[wantBrand]) applyBrand(wantBrand);
```

In the `hashchange` listener (~3807):

```js
addEventListener('hashchange', () => {
  const [seg] = location.hash.slice(1).split('/');
  const [id, query] = seg.split('?');
  const wantBrand = new URLSearchParams(query ?? '').get('brand');
  if (PATTERNS[id] && id !== state.pattern) goToPattern(id, false);
  if (wantBrand && BRANDS[wantBrand] && wantBrand !== state.brand) {
    applyBrand(wantBrand);
    buildPanel();
    buildContent();
    render();
  }
});
```

`goToPattern(id, writeHash)` writes `'#' + id` — leave that; a brand pick does not rewrite the hash.

- [ ] **Step 5: The patterns page**

In `demo/assets/gallery.js`, change the destructure to `const { PATTERNS, renderPattern, variantsOf, BRANDS, SHORT } = globalThis.CARGO;` and, inside the pattern loop, directly after `index.push([...])`, add:

```js
// Every brand measured for this pattern, as its own stage under the
// default. Built by the same generator with the brand applied, so the
// Chevrolet bar here is the Chevrolet bar the builder hands over.
for (const bid of variantsOf(id)) {
  const vcls = `gx-${id}-${bid}`;
  const v = renderPattern(id, vcls, { brand: bid });
  css.push(v.css);
  const vcard = document.createElement('section');
  vcard.className = 'gx-card gx-card--variant';
  vcard.id = `p-${id}-${bid}`;
  vcard.innerHTML = `
      <div class="gx-head">
        <span class="wb-glyph wb-glyph--${id}"></span>
        <div>
          <h2><span class="gx-variant">${BRANDS[bid].label}</span> ${p.label}</h2>
          <p>As ${BRANDS[bid].label} draws it. ${BRANDS[bid].source ? `Measured on ${BRANDS[bid].source}.` : ''}</p>
        </div>
        <a class="ui-btn" href="index.html#${id}?brand=${bid}">Open in the builder</a>
      </div>
      <div class="gx-stage"></div>`;
  vcard.querySelector('.gx-stage').innerHTML = v.html;
  grid.append(vcard);
  index.push([`p-${id}-${bid}`, `${BRANDS[bid].label} ${SHORT?.[id] ?? p.label}`, `wb-glyph--${id}`, '']);
}
```

The lightbox special case above it keys on `id === 'lightbox'` and runs before this loop; a lightbox variant does not exist, so nothing to add.

In `demo/assets/ui.css`, after the `.gx-head p` rule:

```css
.gx-variant {
  padding: 0.1em 0.5em;
  margin-inline-end: 0.3em;
  font-size: 0.7em;
  font-weight: 600;
  vertical-align: middle;
  color: var(--ui-accent-fg, #fff);
  background: var(--ui-accent, #16324f);
  border-radius: 999px;
}
```

Check the token names actually used in `ui.css` (`grep -n "^  --ui-" demo/assets/ui.css | head`) and use the accent pair it defines; the fallbacks are only a guard.

- [ ] **Step 6: The lint walks the variants**

In `scripts/lint-generated-css.mjs`, change the destructure to include `variantsOf`, and replace the `sheets` and `markup` definitions:

```js
const variantSheets = Object.keys(PATTERNS).flatMap((id) => variantsOf(id).map((bid) => [`pattern “${id}” × ${bid}`, renderPattern(id, 'demo', { brand: bid })]));
const sheets = [
  ...Object.keys(PATTERNS).map((id) => [`pattern “${id}”`, renderPattern(id, 'demo').css]),
  ...variantSheets.map(([name, r]) => [name, r.css]),
  ...Object.keys(LOOKS).map((id) => [`look “${id}”`, renderLook(id, 'demo').css]),
];
const markup = [
  ...Object.keys(PATTERNS).map((id) => [`pattern “${id}”`, renderPattern(id, 'demo').html]),
  ...variantSheets.map(([name, r]) => [name, r.html]),
  ...Object.keys(LOOKS).map((id) => [`look “${id}”`, renderLook(id, 'demo').html]),
];
```

Update the closing `console.log` to include `${variantSheets.length} variants`.

- [ ] **Step 7: Run everything**

Run: `npx playwright test tests/variants.test.mjs`
Expected: PASS.

Run: `npm run validate && npm test`
Expected: clean; the lint line reports 1 variant.

Open `http://127.0.0.1:8137/demo/patterns.html#p-tabs-chevrolet` (`npm run serve`) and look: a Chevrolet stage under the tabbed bar with five tabs, the blue line, `|` dividers, no rule, capitalised names.

- [ ] **Step 8: Commit**

```bash
git add demo/assets/workbench.js demo/assets/gallery.js demo/assets/ui.css scripts/lint-generated-css.mjs tests/variants.test.mjs
git commit -m "Show every measured brand under its pattern, and lint what it pastes"
```

---

### Task 5: Say so in CLAUDE.md

**Files:**

- Modify: `CLAUDE.md` — the paragraph beginning "**A card is built for a KIND OF PICTURE**" (add a paragraph after it)

- [ ] **Step 1: Add the paragraph**

After the "A card is built for a KIND OF PICTURE" paragraph, add:

```markdown
**A BRAND VARIANT IS KNOB VALUES, never a CSS block and never markup** (2026-09-09). `brands.js` entries may carry `styles` — card values keyed by look, pattern values keyed by pattern, plus tab names — measured on that OEM's live demo and cited in `source`. `applyBrand()` writes them where the panel edits them, `defaultFor()` makes a knob's reset go back to the brand and "Start from the default" go back to the pattern, and `renderPattern(id, cls, { brand })` draws them on `patterns.html` (one stage per variant) and in `lint-generated-css.mjs` (one sheet per variant). `check-looks.mjs` fails on a key that is not an existing knob. The spike that settled this measured chevroletdemo1 against the `tabs` pattern and found every difference was a value, which is also why the tab row's five values moved out of hardcoded CSS into props: a value in a pattern's CSS is a knob that lies (F039). When an OEM needs something no knob provides, add the knob to the look or pattern. If it needs structure, that is a new pattern, not a variant. Spec: `docs/superpowers/specs/2026-09-09-oem-variants-design.md`.
```

Also in the paragraph "**EVERY CARD IS A RAIL ENTRY...**", the sentence "the deep-link form is `#pattern`, never `#pattern/look`" becomes "the deep-link form is `#pattern` or `#pattern?brand=id`, never `#pattern/look`".

- [ ] **Step 2: Format check and commit**

Run: `npx prettier --check CLAUDE.md`

```bash
git add CLAUDE.md
git commit -m "Record how a brand variant works"
```

---

## Self-review

**Spec coverage.** Data block and rules → Task 2. Five tab knobs with labels → Task 1. Applying (four numbered steps, `defaultFor`, delta filter untouched, not re-applied on load) → Task 3 (`restoreSettings` is untouched, so a remembered brand is not re-applied; the deep link is the one deliberate exception and is stated). Where the list is offered, the note → Task 3 Step 5. Display area, index tile, deep link → Task 4. Gates → Task 2 (keys, source) and Task 4 (lint walks variants). Tests → each listed test maps to Task 1, 3 or 4; "renders the same tab row as before" is Task 1's first test. `brands.js` note rewritten → Task 2 Step 3. Scope: Chevrolet only.

**Placeholder scan.** None; every code step carries its code. Two "check and adjust" instructions (the `PATTERNS` text-slice boundary in Task 2, the ui.css token names in Task 4) name the exact command to run and what to do with the answer.

**Type consistency.** `applyBrand(id | null)`, `brandValue(key, store)`, `renderPattern(id, cls, { brand })`, `variantsOf(id)` → `string[]`, `drawKnobs(folder, store, keys)` are used with the same names and shapes across Tasks 1, 3 and 4. `tabStyles`, `knob`, `selectBrand` are defined once in `tests/variants.test.mjs` before use.
