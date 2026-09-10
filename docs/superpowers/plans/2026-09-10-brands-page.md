# Brands Page and Variant Strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Browse the library by OEM — a Brands page with a tile per brand and a live section per measured brand, a variant chip strip in the builder, the patterns page back to one card per pattern — and Toyota measured as the second brand.

**Architecture:** Everything reads `BRANDS`/`PATTERNS` through the existing generator. `patternsOf(brand)` mirrors `variantsOf(pattern)`; `pickBrand(id)` is the one handler both the Brand list and the strip call; `brandbook.js` builds the Brands page the way `gallery.js` builds the patterns page. No engine change, no new CSS producer.

**Tech Stack:** Classic-script JS in `demo/assets/`, Tweakpane via `pane.js`, `@playwright/test`, stylelint, Node ESM scripts.

**Spec:** `docs/superpowers/specs/2026-09-10-brands-page-design.md`

## Global Constraints

- A measurement copies knob values only — colours, sizes, tab names, how many across. Never markup, script, units or a CSS block. `check-looks.mjs` fails on a `styles` key that is not an existing knob.
- Lengths are `em`, never `rem`, in anything the copy panel emits (demo chrome in `ui.css` may use `rem`). Colours hex or legacy `rgba()`. Zero lengths `0.1px`.
- `demo/assets/*.js` are classic scripts on `globalThis.CARGO`; the demo opens over `file://`.
- Anything `cssFor()`/`htmlFor()`/`renderPattern()` call is declared ABOVE `if (!stage) return` in `workbench.js`.
- Deep links: `index.html#<pattern>?brand=<id>`, `brands.html#<id>`, `patterns.html#p-<id>`.
- Every brand has `demo/img/logo-<id>.png` (116×100, all 32 present as of `d868720`+working tree).
- Run `npm run validate` and `npm test` before every commit. Stage by explicit path, never `git add -A` / `.`.
- Prettier `printWidth: 200`; the PostToolUse hook formats edited files — re-read before a second Edit on the same region. Never author a file through a bash heredoc; use Write/Edit.
- Commit style: one imperative subject, no prefix tag, then the two trailer lines the controller supplies.
- The working tree already holds uncommitted work (24 new `demo/img/logo-*.png`, `demo/assets/cms-paths.js` entries for them). Task 3 commits them.

---

## File map

| File                                               | Responsibility                                                                            |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `demo/assets/brands.js`                            | Toyota `styles` + `source` (Task 1)                                                       |
| `demo/assets/workbench.js`                         | `patternsOf()`, `pickBrand()`, the strip (Task 2)                                         |
| `demo/index.html`                                  | `#wb-variants` nav above the stage; Brands tab (Tasks 2, 3)                               |
| `demo/assets/ui.css`                               | `.wb-variants` chips; `.bb-*` Brands page rules; drop `.gx-card--variant` (Tasks 2, 3, 4) |
| `demo/brands.html`, `demo/assets/brandbook.js`     | The Brands page (Task 3)                                                                  |
| `demo/patterns.html`, `demo/reference.html`        | Brands tab in the nav (Task 3)                                                            |
| `scripts/check-looks.mjs`                          | Logo-per-brand gate (Task 3)                                                              |
| `demo/assets/gallery.js`                           | One card per pattern, "Also measured for" line (Task 4)                                   |
| `tests/variants.test.mjs`, `tests/brands.test.mjs` | Coverage (Tasks 1–4)                                                                      |
| `CLAUDE.md`                                        | Four demo pages; test counts (Task 5)                                                     |

---

### Task 1: Measure Toyota's tabbed bar and record its values

**Files:**

- Modify: `demo/assets/brands.js` — the `toyota` preset (~line 640)
- Test: `tests/variants.test.mjs`

**Interfaces:**

- Produces: `BRANDS.toyota.styles = { looks: { tile: {...} }, patterns: { tabs: { props: {...}, panes: [...] } } }` and `BRANDS.toyota.source`.

- [ ] **Step 1: Write the failing test**

Append to `tests/variants.test.mjs`, inside the `'a brand applies its values'` describe block (after the last test in it):

```js
test('Toyota is a second measured brand on the tabbed bar', async () => {
  await pick(page, 'tabs');
  const variants = await page.evaluate(() => globalThis.CARGO.variantsOf('tabs'));
  assert.ok(variants.includes('toyota'), `tabs variants: ${variants}`);
  await selectBrand(page, 'toyota');
  const s = await tabStyles(page);
  assert.notEqual(s.line, s.colour, 'Toyota should set its own selected-tab line colour');
  const tabs = await page.evaluate(() => [...globalThis.CARGO.sdoc().querySelectorAll('.cargo-tabs [role="tab"]')].map((t) => t.textContent.trim()));
  assert.ok(tabs.length >= 4, `expected Toyota's body-style tabs, got ${tabs}`);
  assert.deepEqual(errors, []);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx playwright test tests/variants.test.mjs -g "Toyota is a second"`
Expected: FAIL — `variantsOf('tabs')` is `['chevrolet']`.

- [ ] **Step 3: Measure the live bar**

Use the Playwright MCP tools (or `npx playwright` from a scratch script under `.superpowers/sdd/`). On `https://toyotademo1.dealeron.com/` at 1280px wide, scroll to the model bar (`.modelBarS.slick-initialized`, tabs are `a.stat-tab-link` inside `#modelBarNav`, same template as Chevrolet). Read with `getComputedStyle`:

| Measure                                                                | On                              | Becomes                              |
| ---------------------------------------------------------------------- | ------------------------------- | ------------------------------------ |
| tab `font-size` ÷ body `font-size`                                     | active `a.stat-tab-link`        | `--tab-size` in `em`, 3 decimals max |
| inactive tab `opacity`                                                 | an unselected `a.stat-tab-link` | `--tab-dim`                          |
| `::after` `background-color` of the active tab (the underline)         | active `a.stat-tab-link`        | `--tab-line` as 6-digit hex          |
| `border-bottom-color` of `#modelBarNav` (or `transparent` if none/0px) | `#modelBarNav`                  | `--tab-rule`                         |
| the divider `li.text-muted` text, or none                              | `#modelBarNav li.text-muted`    | `--tab-divider` as `"'               | '"` or omit |
| tab labels                                                             | `#modelBarNav a.stat-tab-link`  | `panes`                              |
| `.vehicleName` `text-transform`, `color`                               | first `.vehicleName`            | `--name-case`, `--name-color`        |

Record the values in the report with the raw computed strings beside them.

- [ ] **Step 4: Write the values**

In `demo/assets/brands.js`, add to the `toyota` entry after `note:`:

```js
      // Measured on toyotademo1 2026-09-10 the same way Chevrolet's were; the
      // raw computed values are in the commit that added this. Knob values
      // only - see the spec's "What measuring an OEM demo may and may not
      // bring in".
      styles: {
        looks: { tile: { /* --name-case / --name-color from Step 3 */ } },
        patterns: {
          tabs: {
            props: { /* --tab-* from Step 3; omit any that equals the pattern default */ },
            panes: [/* labels from Step 3 */],
          },
        },
      },
      source: 'toyotademo1.dealeron.com, 2026-09-10',
```

Only include a key whose value differs from the pattern's or look's default (`PATTERNS.tabs.props`, `LOOKS.tile.settings`). Run `node scripts/check-looks.mjs` — it must pass.

- [ ] **Step 5: Run the focused test, then the gates**

Run: `npx playwright test tests/variants.test.mjs`
Expected: all pass (the patterns page test counts `#p-tabs-chevrolet` only and still passes).

Run: `npm run validate && npm test`. The lint line now reports 4 variants (Toyota on `modelbar` and `tabs`).

- [ ] **Step 6: Commit**

```bash
git add demo/assets/brands.js tests/variants.test.mjs
git commit -m "Toyota carries its measured tab values"
```

---

### Task 2: `patternsOf()`, `pickBrand()` and the variant strip

**Files:**

- Modify: `demo/assets/workbench.js` — CARGO export block (~1844), the Brand list handler (~2890–2923), `buildPanel()` end
- Modify: `demo/index.html` — above `.wb-stage` (~line 99)
- Modify: `demo/assets/ui.css` — after `.wb-stage` rules
- Test: `tests/variants.test.mjs`

**Interfaces:**

- Produces: `CARGO.patternsOf(brand)` → pattern ids (rail order) for which `variantsOf(pid)` includes the brand. `pickBrand(id | null)` in `workbench.js` (module scope, below `applyBrand`, ABOVE `if (!stage) return` is not required — it touches DOM — but declare it before `buildPanel`). `<nav id="wb-variants">` with `button[data-brand]`, `aria-pressed`.

- [ ] **Step 1: Write the failing tests**

Append a new describe block to `tests/variants.test.mjs`:

```js
test.describe('the variant strip above the stage', () => {
  const chips = (page) => page.evaluate(() => [...document.querySelectorAll('#wb-variants button')].map((b) => [b.dataset.brand, b.getAttribute('aria-pressed')]));

  test('hidden where no brand is measured, shown with Default plus the brands on tabs', async () => {
    await pick(page, 'logostrip');
    assert.equal(await page.evaluate(() => document.getElementById('wb-variants').hidden), true);
    await pick(page, 'tabs');
    assert.equal(await page.evaluate(() => document.getElementById('wb-variants').hidden), false);
    const c = await chips(page);
    assert.equal(c[0][0], '');
    assert.ok(c.some(([b]) => b === 'chevrolet'));
    assert.ok(c.some(([b]) => b === 'toyota'));
  });

  test('a chip applies the brand, and the Brand list agrees', async () => {
    await pick(page, 'tabs');
    await selectBrand(page, '');
    await page.click('#wb-variants button[data-brand="chevrolet"]');
    await page.waitForTimeout(250);
    assert.equal((await tabStyles(page)).line, 'rgb(0, 109, 199)');
    assert.equal(await rowByLabel(page, 'Brand').locator('select').inputValue(), 'chevrolet');
    const pressed = (await chips(page)).find(([, p]) => p === 'true')[0];
    assert.equal(pressed, 'chevrolet');
    await selectBrand(page, '');
    assert.equal((await chips(page)).find(([, p]) => p === 'true')[0], '', 'Default should be pressed after Start from the default');
    assert.deepEqual(errors, []);
  });

  test('patternsOf mirrors variantsOf', async () => {
    const ok = await page.evaluate(() => {
      const { PATTERNS, BRANDS, variantsOf, patternsOf } = globalThis.CARGO;
      return Object.keys(BRANDS).every((b) => patternsOf(b).every((p) => variantsOf(p).includes(b))) && Object.keys(PATTERNS).every((p) => variantsOf(p).every((b) => patternsOf(b).includes(p)));
    });
    assert.equal(ok, true);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npx playwright test tests/variants.test.mjs -g "variant strip"`
Expected: FAIL — no `#wb-variants` element.

- [ ] **Step 3: The markup and CSS**

In `demo/index.html`, directly before `<div class="wb-stage">`:

```html
<!-- Measured brands for the pattern on screen. Filled by buildPanel();
                 a chip runs the same pickBrand() the Brand list runs, so the two
                 cannot disagree. Hidden when nothing is measured. -->
<nav id="wb-variants" class="wb-variants" aria-label="Measured brands for this pattern" hidden></nav>
```

In `demo/assets/ui.css`, after the `.wb-stage` block:

```css
.wb-variants {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-block-end: 0.6rem;
}

.wb-variants button {
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
  padding: 0.3rem 0.7rem 0.3rem 0.4rem;
  font: inherit;
  font-size: 0.85rem;
  color: var(--ink);
  cursor: pointer;
  background: var(--surface);
  border: 1px solid var(--rule);
  border-radius: 999px;
}

.wb-variants button img {
  inline-size: 1.6rem;
  block-size: auto;
}

.wb-variants button[aria-pressed='true'] {
  color: var(--paper);
  background: var(--ink);
  border-color: var(--ink);
}

.wb-variants button:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}
```

Check property order against `recess-order` with `npm run lint:css`.

- [ ] **Step 4: `patternsOf()` and `pickBrand()`**

In the CARGO export block, after `variantsOf(id) { … },`:

```js
    // The other direction: every pattern a brand has measured values for, in
    // rail order. The Brands page is built off this the way the patterns page
    // is built off variantsOf().
    patternsOf(bid) {
      return Object.keys(PATTERNS).filter((id) => this.variantsOf(id).includes(bid));
    },
```

`this` inside an object-literal method called as `CARGO.patternsOf(...)` is `CARGO`; in `gallery.js`/`brandbook.js` call it as `CARGO.patternsOf(id)` (not destructured) or destructure `variantsOf` and write the filter inline — pick one and be consistent; the test calls it as a destructured function, so implement it WITHOUT `this`: reference `variantsOf` through a local `const variantsOf = (id) => …` declared above the export block and used by both methods.

Extract the Brand list handler. Above `buildPanel()`:

```js
// Picking a brand, from the Brand list or from the strip above the stage.
// One function so the two cannot drift: both replace the roster, apply the
// brand's values (applyBrand) and rebuild.
const pickBrand = (id) => {
  rememberDiscard('the preset');
  state.content = null;
  clearContent();
  applyBrand(id || null);
  rebuild(() => {
    buildPanel();
    buildContent();
    render();
  });
};
```

Replace the body of the `pane.list(style, 'Brand', …, (v) => { … })` callback with `pickBrand(v)`, keeping the long comment about markup-never-changes above the call (move it onto `pickBrand`).

- [ ] **Step 5: Fill the strip in `buildPanel()`**

At the end of `buildPanel()` (after the last folder is built), add:

```js
// The strip above the stage: Default plus every brand measured for this
// pattern. Read off the same data as the Brand list, so a chip and a list
// entry are the same brand and the pressed chip is the selected option.
const strip = document.getElementById('wb-variants');
if (strip) {
  const ids = variantsOf(state.pattern);
  strip.hidden = ids.length === 0;
  strip.replaceChildren();
  if (ids.length) {
    for (const [bid, label] of [['', 'Default'], ...ids.map((b) => [b, BRANDS[b].label])]) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.brand = bid;
      btn.setAttribute('aria-pressed', String((state.brand ?? '') === bid || (!bid && !ids.includes(state.brand))));
      if (bid) {
        const img = document.createElement('img');
        img.src = `img/logo-${bid}.png`;
        img.alt = '';
        img.width = 116;
        img.height = 100;
        btn.append(img);
      }
      btn.append(label);
      btn.addEventListener('click', () => pickBrand(bid));
      strip.append(btn);
    }
  }
}
```

`variantsOf` must be callable here — see Step 4's local `const`.

- [ ] **Step 6: Run the tests and gates**

Run: `npx playwright test tests/variants.test.mjs tests/layout.test.mjs tests/controls.test.mjs`
Expected: PASS (the folder-order test is unaffected; the strip is outside the pane).

Run: `npm run validate && npm test`.

- [ ] **Step 7: Commit**

```bash
git add demo/assets/workbench.js demo/index.html demo/assets/ui.css tests/variants.test.mjs
git commit -m "A strip of measured brands above the stage, sharing the Brand list's handler"
```

---

### Task 3: The Brands page

**Files:**

- Create: `demo/brands.html`, `demo/assets/brandbook.js`, `tests/brands.test.mjs`
- Modify: `demo/index.html`, `demo/patterns.html`, `demo/reference.html` — the `.ui-tabs` nav
- Modify: `demo/assets/ui.css` — `.bb-*` rules
- Modify: `scripts/check-looks.mjs` — logo gate
- Commit also: the 24 new `demo/img/logo-*.png` and the `cms-paths.js` entries already in the working tree

**Interfaces:**

- Consumes: `CARGO.patternsOf`, `CARGO.variantsOf`, `CARGO.renderPattern(id, cls, { brand })`, `CARGO.BRANDS`, `CARGO.PATTERNS`, `CARGO.SHORT`.
- Produces: `brands.html` with `#bb-index` (tiles) and `#bb-grid` (sections `#b-<id>`).

- [ ] **Step 1: Write the failing tests**

Create `tests/brands.test.mjs`:

```js
// The Brands page: browse the library by OEM. Spec:
// docs/superpowers/specs/2026-09-10-brands-page-design.md
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { ORIGIN } from './helpers.mjs';

let page, errors;

test.beforeAll(async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  page = await ctx.newPage();
  errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${ORIGIN}/demo/brands.html`, { waitUntil: 'load' });
  await page.waitForSelector('#b-chevrolet .cs-slide');
});

test('every brand has a tile, measured ones first, each with its logo', async () => {
  const tiles = await page.evaluate(() =>
    [...document.querySelectorAll('#bb-index .gx-tile')].map((a) => ({
      id: a.getAttribute('href').slice(1),
      badge: a.querySelector('.bb-badge')?.textContent.trim(),
      img: a.querySelector('img')?.getAttribute('src'),
      ok: a.querySelector('img')?.naturalWidth > 0,
    })),
  );
  const brands = await page.evaluate(() => Object.keys(globalThis.CARGO.BRANDS));
  assert.equal(tiles.length, brands.length);
  const measured = await page.evaluate(() => Object.keys(globalThis.CARGO.BRANDS).filter((b) => globalThis.CARGO.patternsOf(b).length));
  assert.deepEqual(
    tiles
      .slice(0, measured.length)
      .map((t) => t.id)
      .sort(),
    measured.sort(),
    'measured brands lead',
  );
  for (const t of tiles) {
    assert.equal(t.img, `img/logo-${t.id}.png`);
    assert.equal(t.ok, true, `${t.id}: logo did not load`);
  }
  assert.match(tiles.find((t) => t.id === 'chevrolet').badge, /^\d+ patterns?$/);
  assert.equal(tiles.find((t) => t.id === 'kia').badge, 'roster only');
});

test('a measured brand has one live stage per pattern it is measured for', async () => {
  const got = await page.evaluate(() =>
    [...document.querySelectorAll('#b-chevrolet .bb-stage')].map((s) => ({
      pattern: s.dataset.pattern,
      live: !!s.querySelector('.cs[data-cs-init], .cs .cs-prev, .cs .cs-track'),
      link: s.parentElement.querySelector('a.ui-btn')?.getAttribute('href'),
    })),
  );
  const want = await page.evaluate(() => globalThis.CARGO.patternsOf('chevrolet'));
  assert.deepEqual(
    got.map((g) => g.pattern),
    want,
  );
  for (const g of got) {
    assert.equal(g.live, true, `${g.pattern}: stage is not a slider`);
    assert.equal(g.link, `index.html#${g.pattern}?brand=chevrolet`);
  }
  const line = await page.evaluate(
    () => document.querySelector('#b-chevrolet [role="tab"][aria-selected="true"]') && getComputedStyle(document.querySelector('#b-chevrolet [role="tab"][aria-selected="true"]')).borderBottomColor,
  );
  assert.equal(line, 'rgb(0, 109, 199)', 'the tabbed stage should draw Chevrolet values');
});

test('a roster-only brand shows its own cars on the model bar', async () => {
  const kia = await page.evaluate(() => {
    const s = document.querySelector('#b-kia .bb-stage');
    return {
      count: document.querySelectorAll('#b-kia .bb-stage').length,
      pattern: s?.dataset.pattern,
      first: s?.querySelector('.cs-slide img')?.getAttribute('src'),
      link: s?.parentElement.querySelector('a.ui-btn')?.getAttribute('href'),
      note: document.querySelector('#b-kia .bb-note')?.textContent,
    };
  });
  assert.equal(kia.count, 1);
  assert.equal(kia.pattern, 'modelbar');
  assert.match(kia.first ?? '', /oem\/kia\//);
  assert.equal(kia.link, 'index.html#modelbar?brand=kia');
  assert.match(kia.note ?? '', /not measured yet/i);
});

test('the deep link lands on the brand and nothing threw', async () => {
  await page.goto(`${ORIGIN}/demo/brands.html#toyota`, { waitUntil: 'load' });
  await page.waitForSelector('#b-toyota .cs-slide');
  await page.waitForTimeout(300);
  const near = await page.evaluate(() => Math.abs(document.getElementById('b-toyota').getBoundingClientRect().top) < 120);
  assert.equal(near, true);
  assert.deepEqual(errors, []);
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npx playwright test tests/brands.test.mjs`
Expected: FAIL — 404 on `brands.html`.

- [ ] **Step 3: The page**

Create `demo/brands.html` by copying `demo/patterns.html` and changing: `<title>Custom Slider — every brand</title>`; the description meta to "Every OEM the platform serves, with the patterns that have been measured on its own demo sites, live, and a link into the builder."; the nav gets `<a href="brands.html" aria-current="page">Brands</a>` after Patterns (and Patterns loses `aria-current`); the script list swaps `gallery.js` for `brandbook.js`; the main becomes:

```html
<main class="ui-doc gx-doc">
  <h2 class="ui-title">Every brand</h2>
  <p class="ui-blurb">
    Start from the dealer's OEM. A measured brand shows every pattern its own demo sites have been measured for, drawn in those values by the same generator the builder runs; the rest show their
    vehicles on the model bar until someone measures them. Open any of them in the builder to change it and copy the code.
  </p>
  <nav class="gx-index" id="bb-index" aria-label="Jump to a brand"></nav>
  <div id="bb-grid"></div>
  <style id="gx-css"></style>
</main>
```

Check where `patterns.html` puts its `<style id="gx-css">` and match it.

Add `<a href="brands.html">Brands</a>` after the Patterns link in `demo/index.html` and `demo/reference.html`.

- [ ] **Step 4: `brandbook.js`**

Create `demo/assets/brandbook.js`:

```js
// The Brands page: the library browsed by OEM. Built by the same generator as
// the builder and the patterns page (renderPattern), so a Chevrolet bar here
// is the Chevrolet bar the builder hands over. Spec:
// docs/superpowers/specs/2026-09-10-brands-page-design.md

(() => {
  const { PATTERNS, BRANDS, SHORT, renderPattern, patternsOf } = globalThis.CARGO;
  const grid = document.getElementById('bb-grid');
  const index = document.getElementById('bb-index');
  if (!grid || !index || !renderPattern) return;

  const styleEl = document.getElementById('gx-css');
  const css = [];
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

  // Measured brands first, then the rest alphabetically by label.
  const ids = Object.keys(BRANDS).sort((a, b) => {
    const ma = patternsOf(a).length > 0;
    const mb = patternsOf(b).length > 0;
    if (ma !== mb) return ma ? -1 : 1;
    return BRANDS[a].label.localeCompare(BRANDS[b].label);
  });

  for (const id of ids) {
    const b = BRANDS[id];
    const measured = patternsOf(id);
    const tile = document.createElement('a');
    tile.className = 'gx-tile bb-tile';
    tile.href = `#${id}`;
    tile.innerHTML = `<img src="img/logo-${id}.png" width="116" height="100" alt=""><span class="gx-tile-name">${esc(b.label)}</span><span class="bb-badge">${measured.length ? `${measured.length} pattern${measured.length === 1 ? '' : 's'}` : 'roster only'}</span>`;
    index.append(tile);

    const sec = document.createElement('section');
    sec.className = 'gx-card bb-section';
    sec.id = `b-${id}`;
    const note = measured.length ? `Measured on ${esc(b.source ?? '')}.` : `Vehicles and how many across, from ${esc(b.label)}'s demo sites. Values not measured yet.`;
    sec.innerHTML = `<div class="gx-head"><img class="bb-logo" src="img/logo-${id}.png" width="116" height="100" alt=""><div><h2>${esc(b.label)}</h2><p class="bb-note">${note}</p></div></div>`;
    for (const pid of measured.length ? measured : ['modelbar']) {
      const cls = `bb-${id}-${pid}`;
      const r = renderPattern(pid, cls, { brand: id });
      css.push(r.css);
      const block = document.createElement('div');
      block.className = 'bb-block';
      block.innerHTML = `<div class="bb-block-head"><h3>${esc(SHORT?.[pid] ?? PATTERNS[pid].label)}</h3><a class="ui-btn" href="index.html#${pid}?brand=${id}">Open in the builder</a></div><div class="gx-stage bb-stage" data-pattern="${pid}"></div>`;
      block.querySelector('.bb-stage').innerHTML = r.html;
      sec.append(block);
    }
    grid.append(sec);
  }

  styleEl.textContent = css.join('\n\n');

  for (const root of document.querySelectorAll('.bb-stage .cs')) {
    if (!root.dataset.csInit) new globalThis.CustomSlider(root);
  }
  const scripts = new Set();
  for (const p of Object.values(PATTERNS)) if (p.script) scripts.add(p.script);
  for (const s of scripts) {
    try {
      new Function(s)();
    } catch (e) {
      console.error('pattern script failed on the brands page', e);
    }
  }
})();
```

Confirm `renderPattern(id, cls, { brand })` leaves `state` reset for the next call (it calls `loadPattern` first — it does). Confirm `SHORT` is exported (it is).

- [ ] **Step 5: CSS**

In `demo/assets/ui.css`, after the `.gx-tile-name` rule:

```css
.bb-tile img {
  inline-size: 2.4rem;
  block-size: auto;
}

.bb-badge {
  padding: 0.1em 0.5em;
  font-size: 0.7em;
  font-weight: 600;
  color: var(--paper);
  background: var(--ink);
  border-radius: 999px;
}

.bb-logo {
  flex: none;
  inline-size: 3.5rem;
  block-size: auto;
}

.bb-block {
  margin-block-start: 1rem;
}

.bb-block-head {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  margin-block-end: 0.5rem;
}

.bb-block-head h3 {
  margin: 0;
  font-size: 1rem;
}
```

The `.gx-tile` rule may lay out its children in a way that needs a small adjustment for the badge (read it at ui.css ~1926); keep tiles the same size as on the patterns page.

- [ ] **Step 6: The logo gate**

In `scripts/check-looks.mjs`, inside `for (const [id, b] of brands) {` after the label check:

```js
if (!existsSync(`demo/img/logo-${id}.png`)) {
  console.error(`  ${id}: no demo/img/logo-${id}.png — the Brands page draws every brand by its mark`);
  bad++;
}
```

`existsSync` is already imported. Run `node scripts/check-looks.mjs` — passes with the 32 logos in the tree.

- [ ] **Step 7: Run the tests and gates; look at the page**

Run: `npx playwright test tests/brands.test.mjs`
Expected: PASS.

Run: `npm run validate && npm test`.

Open `http://127.0.0.1:8137/demo/brands.html` (`npm run serve`) in light and dark theme and take one screenshot each with Playwright into the SDD workspace; describe what you see in the report (tile grid, Chevrolet and Toyota sections first, a roster-only section further down).

- [ ] **Step 8: Commit**

```bash
git add demo/brands.html demo/assets/brandbook.js demo/index.html demo/patterns.html demo/reference.html demo/assets/ui.css scripts/check-looks.mjs tests/brands.test.mjs demo/assets/cms-paths.js demo/img/logo-*.png
git commit -m "A Brands page: the library browsed by OEM"
```

---

### Task 4: The patterns page back to one card per pattern

**Files:**

- Modify: `demo/assets/gallery.js` — remove the variant loop (~lines 71–95), add the "Also measured for" line
- Modify: `demo/assets/ui.css` — remove `.gx-card--variant`; add `.gx-also`
- Modify: `tests/variants.test.mjs` — the patterns-page test

**Interfaces:**

- Consumes: `CARGO.variantsOf`, `CARGO.BRANDS`.

- [ ] **Step 1: Rewrite the failing test**

In `tests/variants.test.mjs`, replace the test `'one stage per brand that carries values, with a tile in the index'` with:

```js
test('one card per pattern, with a link to the Brands page where a brand is measured', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`${ORIGIN}/demo/patterns.html`, { waitUntil: 'load' });
  await p.waitForSelector('#p-tabs .cs-slide');
  const found = await p.evaluate(() => ({
    nested: document.querySelectorAll('.gx-card--variant, #p-tabs-chevrolet').length,
    cards: document.querySelectorAll('.gx-card').length,
    patterns: Object.keys(globalThis.CARGO.PATTERNS).length,
    also: [...document.querySelectorAll('#p-tabs .gx-also a')].map((a) => [a.textContent.trim(), a.getAttribute('href')]),
    alsoOnLogo: document.querySelector('#p-logostrip .gx-also'),
    tiles: document.querySelectorAll('.gx-tile').length,
  }));
  assert.equal(found.nested, 0);
  assert.equal(found.cards, found.patterns);
  assert.equal(found.tiles, found.patterns);
  assert.ok(
    found.also.some(([t, h]) => t === 'Chevrolet' && h === 'brands.html#chevrolet'),
    `also: ${JSON.stringify(found.also)}`,
  );
  assert.equal(found.alsoOnLogo, null);
  assert.deepEqual(errs, []);
  await ctx.close();
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npx playwright test tests/variants.test.mjs -g "one card per pattern"`
Expected: FAIL — nested count is 1 or more.

- [ ] **Step 3: gallery.js**

Delete the `for (const bid of variantsOf(id)) { … }` block and its comment. In the card's `innerHTML`, after `<p>${p.blurb}</p>`, add:

```js
          ${variantsOf(id).length ? `<p class="gx-also">Also measured for ${variantsOf(id).map((bid) => `<a href="brands.html#${bid}">${BRANDS[bid].label}</a>`).join(', ')}</p>` : ''}
```

Remove the `.gx-card--variant` rule from `ui.css` and add after `.gx-head p`:

```css
.gx-also {
  margin: 0.3rem 0 0;
  font-size: 0.85em;
  color: var(--ink-soft);
}
```

- [ ] **Step 4: Run the tests and gates**

Run: `npx playwright test tests/variants.test.mjs` then `npm run validate && npm test`.

- [ ] **Step 5: Commit**

```bash
git add demo/assets/gallery.js demo/assets/ui.css tests/variants.test.mjs
git commit -m "One card per pattern again, pointing at the Brands page"
```

---

### Task 5: CLAUDE.md

**Files:**

- Modify: `CLAUDE.md` — "Three demo pages" paragraph; the test-count sentence; the "A BRAND VARIANT IS KNOB VALUES" paragraph

- [ ] **Step 1: Edit**

1. Change "**Three demo pages.**" to "**Four demo pages.**" and, after the `demo/patterns.html` sentence, add: "`demo/brands.html` browses the same library by OEM — every brand as a tile, a live section per measured brand built by `brandbook.js` from the same generator, and a model-bar stage for the rest." Add `brandbook.js` (the brands page) to the `demo/assets/` list after `gallery.js`.
2. In the "A BRAND VARIANT IS KNOB VALUES" paragraph, replace "draws them on `patterns.html` (one stage per variant)" with "draws them on `brands.html` (one section per measured brand, one stage per pattern) and as a chip strip above the builder's stage; `patterns.html` stays one card per pattern and links across". Append one sentence: "A measurement copies knob values only — never markup, script, units or a CSS block — so the engine's accessibility and the house CSS practices are never at risk from what a demo site does (spec `2026-09-10-brands-page-design.md`)."
3. Update the test count sentence to the real numbers from `npx playwright test --list` (files and checks) and add `brands` to the file list with "(the Brands page: tiles, sections, deep link)".

- [ ] **Step 2: Check and commit**

Run: `npx prettier --check CLAUDE.md`

```bash
git add CLAUDE.md
git commit -m "Record the Brands page and what a measurement may carry"
```

---

## Self-review

**Spec coverage.** Brands page (tiles, sections, roster-only stage, deep link, live init, scripts) → Task 3. Variant strip (markup, chips, shared `pickBrand`, pressed state) → Task 2. Patterns page back to one card with the link → Task 4. Toyota → Task 1. `patternsOf` → Task 2. Logo gate → Task 3. The measurement constraint → Task 5 records it; Task 1's Step 4 enforces it by construction (keys must be existing knobs). Tests listed in the spec → Tasks 1–4.

**Placeholder scan.** Task 1 Step 4 has comment placeholders inside the `styles` block by design: the values come from Step 3's measurement, and the table there says exactly which computed value becomes which key. Nothing else is deferred.

**Type consistency.** `patternsOf(bid)` → `string[]`; `variantsOf(id)` → `string[]`; `pickBrand(id | '' | null)`; `renderPattern(id, cls, { brand })`; `#wb-variants button[data-brand]` with `''` for Default; `#b-<id>`, `.bb-stage[data-pattern]`, `.bb-note`, `.bb-badge`, `#bb-index`, `#bb-grid` used identically in Task 3's test and code; `.gx-also` in Task 4's test and code.
