# Breakpoint Conversion Fix — Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking. This
> repo has **no test framework** (deliberate — `CLAUDE.md`, spec §1 non-goals), so
> tasks verify with `npm run validate`, `npm run size`, byte-comparison of
> regenerated output, and the browser checklist in `README.md`. Do not invent a
> test harness.

**Goal:** Correct a systematic off-by-one in every model-bar breakpoint ladder,
at its source, so recipes stop shipping sliders that flip one pixel away from
the page grid they sit on.

**Architecture:** `scripts/build-model-bars.mjs` holds 21 ladders as
`[minWidth, perView]` pairs and generates `demo/model-bars.html` and
`demo/brands.html`. The min-width values were hand-derived from live slick
configs with a `+1` rule that is wrong. Fix the data and remove the arithmetic,
then regenerate. No generated file is edited directly.

**Tech Stack:** Node ESM build script, esbuild, Prettier, stylelint, ESLint.

**Spec:** This plan's findings are recorded inline below rather than in a
separate spec — the investigation is summarized in "Evidence" and the full
per-site measurements live in `docs/research/2026-08-18-oem-demo-slider-census.md`.

## Evidence (why this change is correct)

1. **slick source**, `slick-carousel@1.8.1/slick/slick.js:619` —
   `if (respondToWidth < _.breakpoints[breakpoint])`. A **strict** `<`. So
   `breakpoint: 768` applies _below_ 768; the tier above starts at exactly
   **768**, not 769.
2. **Measured live** — on `acurademo1.dealeron.com`, viewport 767 renders 3-up
   and 768 renders 5-up.
3. **Five sites cross-checked** (acura, chevrolet, lincoln, ferrari, genesis
   demos): every recorded min-width is exactly **+1** of the real switch point.
   The underlying slick configs in the census matched reality 5/5 — only the
   derived min-widths are wrong.
4. **The data contradicts itself**, which rules out "faithful record": the same
   real breakpoint appears as both `N` and `N+1` across entries —
   `540`/`541`, `600`/`601`, `768`/`769`, `991`/`992`/`993`, `1200`/`1201`.
5. **Consequence** — at exactly 768px (iPad portrait) a `769px` recipe holds the
   slider in its phone tier while a Bootstrap 3 page has already flipped to `md`.

## Global Constraints

- **Platform grid is Bootstrap 3.4.7: `768 / 992 / 1200`.** Measured in the
  DealerOn CSS bundle on chevroletdemo1 and forddemo1. **There is no `576`
  breakpoint** — do not introduce one.
- **`demo/model-bars.html` and `demo/brands.html` are generated.** Never edit
  them by hand; change `scripts/build-model-bars.mjs` and regenerate.
- **The HTML contract is frozen** (`CLAUDE.md` → Hard constraints). This change
  touches only CSS media-query values inside recipes, not class names, data
  attributes, or `--dlc-*` names.
- **Byte budget: < 6144 B gzip, currently 6098 B — 46 B of headroom.** This
  change must not touch `src/`, so the budget must not move at all.
- **The census's raw max-width tables are the trustworthy record.** Preserve them
  verbatim; only _derived_ min-width claims get corrected.

---

### Task 1: Correct the ladder data and remove the arithmetic

**Files:**

- Modify: `scripts/build-model-bars.mjs` — the 21 `ladder:` arrays (L541–L872)
  and `recipeCss()` (L1014–L1035)

**Interfaces:**

- Produces: ladder pairs stay `[minWidth, perView]`, so `recipeCss()` and
  `liveCss` need no signature change. Only the numbers move.

**The conversion rule, stated once:** a slick `breakpoint: N` means the tier
above begins at `min-width: N`. The recorded values are all `N+1`. Subtract 1,
then snap any result that lands exactly 1px below a platform grid tier
(768/992/1200) up onto that tier, because our engine reads min-width directly
and has no slick quirk to reproduce.

- [ ] **Step 1: Apply the corrected map**

| recorded | →               | why                          |
| -------- | --------------- | ---------------------------- |
| 361      | 360             | −1                           |
| 401      | 400             | −1                           |
| 461      | 460             | −1                           |
| 541      | 540             | −1                           |
| 601      | 600             | −1                           |
| 769      | 768             | −1, lands on grid `md`       |
| 993      | 992             | −1, lands on grid `lg`       |
| 1201     | 1200            | −1, lands on grid `xl`       |
| 1441     | 1440            | −1                           |
| 1801     | 1800            | −1                           |
| 540      | 539             | −1                           |
| 600      | 599             | −1                           |
| 768      | 767 → **768**   | −1 then snap up to grid `md` |
| 992      | 991 → **992**   | −1 then snap up to grid `lg` |
| 991      | 990             | −1 (2px from grid — no snap) |
| 1200     | 1199 → **1200** | −1 then snap up to grid `xl` |

Net effect: `769→768`, `993→992`, `1201→1200`, `461→460`, `541→540`, `601→600`,
`401→400`, `361→360`, `1441→1440`, `1801→1800`, `991→990`; and `540→539`,
`600→599`; while `768`, `992`, `1200` stay put (−1 then snapped back).

- [ ] **Step 2: Add a comment above `VARIANTS` recording the rule**

```js
// Ladder values are MIN-WIDTHS for `--dlc-per-view`, derived from each site's
// live slick config. The rule: slick compares `windowWidth < breakpoint`
// (slick.js:619, strict <), so `breakpoint: N` means the tier ABOVE starts at
// exactly min-width N — NOT N+1. An earlier hand-conversion added 1 at every
// rung, which put every strip one pixel out of step with the Bootstrap 3 grid
// (768/992/1200) the platform actually uses; at 768px — iPad portrait — the
// page went md while the slider stayed on its phone tier.
// Where a corrected value lands 1px under a grid tier it is snapped onto it:
// our engine reads min-width directly and has no slick quirk to reproduce.
// Raw max-width configs are preserved verbatim in the census; see
// docs/research/2026-08-18-oem-demo-slider-census.md.
```

- [ ] **Step 3: Regenerate and confirm the values landed**

```bash
node scripts/build-model-bars.mjs
npx prettier --write demo/model-bars.html demo/brands.html
grep -c 'min-width: 769px\|min-width: 993px\|min-width: 1201px\|min-width: 461px\|min-width: 541px\|min-width: 1441px\|min-width: 1801px\|min-width: 601px\|min-width: 401px\|min-width: 361px' demo/model-bars.html demo/brands.html
```

Expected: `0` for both files.

- [ ] **Step 4: Confirm the generator is still deterministic**

```bash
node scripts/build-model-bars.mjs && npx prettier --write demo/model-bars.html demo/brands.html && git status --porcelain demo/
```

Expected: running it twice leaves no further diff — output is stable.

- [ ] **Step 5: Gates**

```bash
npm run validate && npm run size
```

Expected: validate clean; size unchanged at **6098 B** (nothing in `src/` moved).

- [ ] **Step 6: Commit**

```bash
git add scripts/build-model-bars.mjs demo/model-bars.html demo/brands.html
git commit -F <message file>
```

---

### Task 2: Fix `demo/index.html`'s own recipes

**Files:**

- Modify: `demo/index.html` — hand-written; 12 off-by-one occurrences and the
  arbitrary `640`/`1024` pairs inside `<pre><code>` recipe blocks

- [ ] **Step 1: Correct the off-by-one values in recipes AND in the matching
      live `.demo-*` CSS**

Both must move together or the preview stops matching the snippet — the exact
defect Pete reported. `769 → 768` throughout.

- [ ] **Step 2: Move the arbitrary card ladders onto the platform grid**

The eight card recipes use `640`/`1024`, which come from neither the census nor
the platform. `640 → 768`, `1024 → 992`. Apply to the recipe and to the live
`.demo-*` rule for the same example.

- [ ] **Step 3: Verify preview still matches snippet**

Serve the repo and, for each edited example, confirm the rendered
`--dlc-per-view` at 767/768/991/992/1199/1200 matches what the recipe declares.

- [ ] **Step 4: Gates + commit**

```bash
npm run validate
git add demo/index.html
```

---

### Task 3: Correct the guidance that propagates the bug

**Files:**

- Modify: `docs/cms-implementation.md:187-193` and `:206`
- Modify: `docs/cms-no-hosting.md:51`

- [ ] **Step 1: Replace the wrong conversion rule**

Current text says slick breakpoints are max-width and warns that hand conversion
"is where this goes wrong" — then does it wrong. Replace with: slick compares
`windowWidth < breakpoint`, so `breakpoint: N` → `min-width: N`. Keep the
"don't re-derive, copy the tabulated ladder" advice — it is good advice, it was
just pointing at bad numbers.

- [ ] **Step 2: Fix the two example snippets**

`@media (min-width: 769px)` → `@media (min-width: 768px)` in both docs.

- [ ] **Step 3: Commit**

---

### Task 4: Correct the two derived claims in the census

**Files:**

- Modify: `docs/research/2026-08-18-oem-demo-slider-census.md` §10.3 and §11.4

- [ ] **Step 1: Fix §10.3** — "the only ladder with a 1441 tier" → the tier is
      **1440**.

- [ ] **Step 2: Fix §11.4** — the Lincoln "992 vs 993" note is wrong on both
      numbers; rydelllincoln's `991` puts 4-up at **991** vs the demo's **992**.

- [ ] **Step 3: Leave every max-width table untouched.** They matched live
      configs 5/5 and are the trustworthy record.

- [ ] **Step 4: Commit**

---

## Self-Review

**Spec coverage:** every finding maps to a task — generator data (1),
`index.html` recipes (2), the guidance that propagates it (3), the two wrong
derived claims (4). The census's raw tables are explicitly out of scope by
decision, not omission.

**Placeholder scan:** the conversion map is fully enumerated; no "TBD", no
"handle edge cases". Task 2's exact per-example edits are the one place values
are described by rule rather than listed, because the live/recipe pairs must be
read together at edit time.

**Type consistency:** ladder pairs keep the `[minWidth, perView]` shape
throughout, so `recipeCss()` and `liveCss` are untouched structurally.

**Known scope boundary:** `demo/index.html`'s deeper parity problem — its
recipes teach different components than the live examples render (different card
design for vehicles; the models recipe omits the progress bar and its page JS) —
is **not** in this plan. It needs the single-source treatment `model-bars.html`
already has and is its own piece of work.
