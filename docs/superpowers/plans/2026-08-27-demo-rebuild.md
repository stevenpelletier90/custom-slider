# Demo Rebuild Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking. This
> repo has **no test framework** (deliberate — `CLAUDE.md`, spec §1 non-goals).
> Verification is `npm run validate`, `npm run size`, and browser checks. Do not
> invent a test harness.

**Goal:** Replace three overlapping demo pages with one workbench: one component
per pattern, a settings panel wired to the engine's own `--dlc-*` properties, a
brand picker that presets those settings, and a code panel generated from them.

**Architecture:** A settings object per pattern, applied with
`el.style.setProperty()`, and a template string that reads the same object back
out as the code panel. No framework, no build step, no reactivity.

**Spec:** `docs/superpowers/specs/2026-08-27-demo-rebuild-design.md`

## Global Constraints

- **Breakpoints are 768 / 992 / 1200.** Never 461 / 539 / 599 / 990 / 1440.
- **The engine does not change.** `src/` and `dist/` are untouched by this work.
  Byte budget stays at its current 6137 / 6144.
- **The HTML contract is frozen** (`CLAUDE.md` → Hard constraints): class names,
  `data-*`, `--dlc-*`, `dlc:*` events, public methods.
- **No new dependency.** Same dependency-free HTML/CSS/JS.
- **Scope guard:** settings object + `setProperty` loop + template string. If the
  implementation wants a framework, stop and re-open the design.
- **`scripts/check-recipes.mjs` is deleted only in Task 6**, after generation
  lands. Removing it earlier leaves a window with nothing catching drift.

---

### Task 1: Collapse the 17 looks into a component set

**Files:**

- Create: `demo/assets/looks.js` — the component set + per-look settings

**Interfaces:**

- Produces: `LOOKS`, an object keyed by look id. Each entry is
  `{ id, label, markup(model), css, settings }` where `settings` are the
  `--dlc-*` defaults that look needs. Tasks 2–4 consume `LOOKS`.

- [ ] **Step 1: Enumerate the 17 and record why each merges or survives**

There are two skin systems today. `SKINS` in `scripts/build-model-bars.mjs`
holds 13; the brands page adds `white`, `counts`, `spotlight`, `tile`.

Known merges, from inspecting `cardCss` — all four style only
`.my-modelbar-card` with `display: block` and differ solely in the strip
background:

| Merge into           | Absorbs                                                     | Evidence              |
| -------------------- | ----------------------------------------------------------- | --------------------- |
| `tile` (cutout tile) | `band-gray`, `band-flat`, `band-dark`, `cdjr-dark`, `white` | strip background only |

Survive as their own component (different markup, not different colour):

`photo-card` (flex; copy/name/shop/tag) · `tall-tile` (name above, CTA below) ·
`wordmark-dark` (wordmark element) · `logo-strip` (flex, own card background) ·
`location-card` (flex; name/visit) · `name-top-chip` (flex)

Still to inspect and place: `category-tile`, `brand-logo`, `photo-overlay`,
`counts`, `spotlight`.

- [ ] **Step 2: Write `demo/assets/looks.js`**

One entry per surviving component. Background, text colour and card background
become settings, not separate looks.

```js
export const LOOKS = {
  tile: {
    label: 'Cutout tile',
    settings: { '--strip-bg': 'transparent', '--name-color': '#222' },
    css: `.dlx-card { display: block; text-align: center; text-decoration: none; color: var(--name-color); }
.dlx-card img { inline-size: 100%; block-size: auto; }
.dlx-card p { margin: 0.25rem 0 0; font-size: 0.95rem; }`,
    markup: (m) => `<a class="dlx-card" href="${m.href}"><img src="${m.img}" width="320" height="240" alt="${m.alt}"><p>${m.name}</p></a>`,
  },
  // ...one per surviving component
};
```

- [ ] **Step 3: Verify no look was lost**

Run a script that asserts every one of the 17 old skin ids maps to either a
`LOOKS` entry or a documented merge. Fail loudly on an unmapped id — silently
dropping a look is the failure mode this task exists to prevent.

- [ ] **Step 4: Commit**

---

### Task 2: The workbench shell, with one pattern working end to end

**Files:**

- Modify: `demo/index.html` — becomes the workbench
- Create: `demo/assets/workbench.js`

**Interfaces:**

- Consumes: `LOOKS` from Task 1
- Produces: `applySettings(root, settings)` and `renderCode(pattern, settings)`,
  used by every later task

- [ ] **Step 1: The settings object and how it is applied**

```js
// The settings ARE custom properties, so applying them is one line each and the
// browser does the rendering. This is the whole state model - resist adding to it.
const applySettings = (root, s) => {
  for (const [k, v] of Object.entries(s.props)) root.style.setProperty(k, v);
  for (const [k, v] of Object.entries(s.data)) v == null ? root.removeAttribute(k) : root.setAttribute(k, v);
};
```

- [ ] **Step 2: Generate the code from the same object**

```js
// Reading the same object back out is what makes the code panel incapable of
// drifting from the preview - they are one source rendered twice.
const renderCode = (pattern, s) => ({
  html: pattern.markup(s),
  css: [
    `.my-slider { ${Object.entries(s.props)
      .map(([k, v]) => `${k}: ${v};`)
      .join(' ')} }`,
    ...bpRules(s),
    LOOKS[s.look].css,
  ].join('\n\n'),
});
```

- [ ] **Step 3: Build the UI — model bar only for now**

Pattern picker (reuse the existing solo-mode list), stage, settings panel,
code panel. Card-style chooser renders **thumbnails**, not a dropdown.

- [ ] **Step 4: Verify in the browser**

Serve, then confirm: changing "how many across" updates the preview AND the code
block; the code block pasted into a bare page reproduces the preview; no console
errors. **Cache-bust `demo/assets/*` when checking** — a stale `demo.js` cost
real time twice in the session that produced this plan.

- [ ] **Step 5: `npm run validate`, then commit**

---

### Task 3: Port the remaining patterns

**Files:**

- Modify: `demo/index.html`, `demo/assets/workbench.js`

Patterns, one component each: model bar · model bar tabbed · card row · hero ·
gallery · two-row grid · peek · video.

- [ ] **Step 1: Port each pattern's markup and defaults from the current
      `demo/index.html`,** dropping the hand-written `.my-*` recipes — those are
      generated now.

- [ ] **Step 2: Two-row grid keeps one slide per column.** One slide is one
      scroll stop; the flat-slides version is why the dots desynced.

- [ ] **Step 3: Verify every pattern** — advances on `next()`, dots track pages,
      no console errors, no horizontal overflow at 390 / 768 / 1280.

- [ ] **Step 4: Commit**

---

### Task 4: All 32 brand presets

**Files:**

- Create: `demo/assets/brands.js`

- [ ] **Step 1: One row per brand**

```js
// A preset is VALUES on the one component - never a second component.
// `measured` is the date the live site was last checked.
export const BRANDS = {
  ford: { label: 'Ford', look: 'tile', perView: { base: 2, 768: 3, 992: 5 }, gap: '1rem', measured: '2026-08-18' },
  // ...32 total
};
```

Ladders come from the corrected values in `scripts/build-model-bars.mjs` — the
`-1` conversion fix, snapped to 768 / 992 / 1200. Rosters and images come from
`demo/img/oem/<brand>/`, which stays.

- [ ] **Step 2: Wire the picker.** Selecting a brand writes its values into the
      settings object and re-applies. It must not create a second component —
      assert in review that no brand adds markup.

- [ ] **Step 3: Verify** all 32 load, render, and produce code; images resolve;
      no console errors.

- [ ] **Step 4: Commit**

---

### Task 5: The guide

**Files:**

- Modify: `demo/index.html`

- [ ] **Step 1:** Short prose per setting — what it does, when to change it.

- [ ] **Step 2:** The rules that are not obvious: slides-per-view is CSS not JS;
      one slide is one scroll stop; never `transition: all`; keep the unit on a
      zero length. Link to `docs/research/2026-08-18-oem-demo-slider-census.md`
      for where the defaults came from.

- [ ] **Step 3: Commit**

---

### Task 6: Delete what the workbench replaces

Only after Tasks 1–5 are verified.

**Files:**

- Delete: `demo/model-bars.html`, `demo/brands.html`
- Delete: `docs/catalog/` entirely
- Delete: `scripts/build-model-bars.mjs`, `scripts/check-recipes.mjs`
- Delete: `docs/superpowers/plans/2026-07-13-custom-slider.md`,
  `2026-08-07-slider-variations.md`, `2026-08-18-slider-catalog.md`
- Modify: `package.json` (drop `check:recipes` from `validate`), `README.md`,
  `CLAUDE.md`

- [ ] **Step 1: Confirm nothing links to the deleted pages**

```bash
grep -rn 'model-bars.html\|brands.html\|docs/catalog' --include='*.html' --include='*.md' --include='*.mjs' . | grep -v node_modules
```

Expected: no hits outside the files being deleted.

- [ ] **Step 2: Delete, then `npm run validate` and `npm run size`**

Size must be unchanged — nothing in `src/` moved.

- [ ] **Step 3: Update `README.md` and `CLAUDE.md`** to describe the workbench,
      and remove the recipe-parity section — that guarantee is now structural.

- [ ] **Step 4: Commit**

---

## Self-Review

**Spec coverage:** workbench (2, 3), all 32 presets (4), visual look chooser
(1, 2), guide (5), deletions (6), generated code (2). The scope guard is a
global constraint. Covered.

**Placeholders:** Task 1 Step 1 names five looks still to place
(`category-tile`, `brand-logo`, `photo-overlay`, `counts`, `spotlight`). That is
deliberate — the spec says the final set comes from inspecting all 17, and Step 3
fails loudly on any unmapped id rather than letting one vanish. Every other step
carries its actual content.

**Type consistency:** `LOOKS` entries are `{ id, label, markup, css, settings }`
throughout; `applySettings` and `renderCode` keep the same signatures in Tasks 2–4.

**Known risk:** Task 3 is the largest single step — eight patterns. If it runs
long, split per pattern rather than batching, so each is independently
verifiable.
