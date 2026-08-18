# Slider Catalog + Fade Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fade/hero mode to dl-carousel — the estate's most deployed slider pattern (68/76 OEM demo sites) that the library cannot currently do — plus the demo sections, breakpoint recipes, and docs that make the catalog usable.

**Architecture:** CSS keeps owning layout and physics; the fade mode is the one place that changes, because a stacked crossfade cannot ride a scroll-snap track. Slides pile into a single CSS grid cell and JS toggles opacity + `inert`. Everything else in this plan is authored HTML, site CSS, and documentation — zero engine bytes.

**Tech Stack:** Vanilla ES2022, esbuild, stylelint + eslint + prettier. No runtime dependencies. **No test framework** — this is deliberate (spec §1 non-goals). Verification is `npm run validate`, `npm run size`, and scripted browser assertions via Playwright against a local server.

**Spec:** [docs/superpowers/specs/2026-08-18-slider-catalog-design.md](../specs/2026-08-18-slider-catalog-design.md)
**Research:** [docs/research/2026-08-18-oem-demo-slider-census.md](../../research/2026-08-18-oem-demo-slider-census.md)

## Global Constraints

Copied verbatim from CLAUDE.md and the spec. Every task's requirements implicitly include these.

- **Byte budget: < 6144 B gzip for `dist` JS+CSS combined**, enforced by `npm run size`. Projected after this plan: 5913. If the final build exceeds 6144, **do not raise the gate** — stop and surface it as its own decision.
- **`dist/` is checked into git.** Rebuild and commit `dist/` in the same commit whenever `src/` changes.
- **The HTML is the stable API.** Adding is fine; renaming or repurposing class names, data attributes, `--dlc-*` properties, `dlc:*` payloads, or public methods is not.
- **Never set CSS `scroll-behavior` on the track.** Every scroll passes `behavior` per call, resolved from `prefers-reduced-motion` at call time.
- **Never `inert`/`aria-hidden` off-screen cards in multi-card variants.** The fade carve-out in Task 3 applies to 1-up fade mode only, exactly as `gallery` mode already does.
- **Never use Chromium-only platform features** (`::scroll-marker`, `scrollsnapchange`, `scroll-state()`, `scrollIntoView({container})`).
- **Never inject slide content.** The engine generates controls only.
- **Formatting:** Prettier `printWidth: 200`, single quotes JS / double CSS. Long single-line statements are the formatter's output — don't hand-wrap.
- **Missing markup fails loudly:** `console.error` for missing track/slides, `console.warn` for a missing `aria-label` or conflicting options.
- All listeners register with `{ signal: this._ac.signal }` from the one `AbortController`; `destroy()` must still fully tear down.

## Verification harness (used by several tasks)

There is no test runner. Where a task says "browser-verify", use this loop:

```bash
# from the repo root, in a background shell
python3 -m http.server 8139 --bind 127.0.0.1
```

Then drive assertions with Playwright `browser_evaluate` against `http://127.0.0.1:8139/<page>`, asserting concrete DOM state (opacity, `inert`, computed height, `scrollLeft`, focus location). Stop the server when done: `pkill -f "http.server 8139"`.

Scratch verification pages live in the scratchpad directory, **never committed** — they are not a test suite and must not become one.

---

### Task 1: Diagnose and fix the video-testimonials grabber bug

**REQUIRED SUB-SKILL:** Use superpowers:systematic-debugging. The symptom was reported in the 2026-08-11 sync but never characterized. **Do not write a fix before reproducing it.**

**Files:**

- Modify (only if the diagnosis points here): `src/dl-carousel.js` `_wireDrag()` — currently around lines 372–441
- Modify (if the cause is section CSS): `demo/index.html` `.demo-video-*` rules

**Interfaces:**

- Consumes: nothing
- Produces: nothing consumed by later tasks. Independent — ships first so it is not blocked behind the catalog work.

- [x] **Step 1: Reproduce before theorizing**

Serve the demo and drag the `#video` section specifically, comparing against a known-good section (`#vehicles`). Sweep these conditions — the bug was reported on the video section, which differs from other sections in that its slides contain two nested `<button>`s:

```
- viewport 375 / 768 / 1280
- drag started ON the poster button vs. on the card gap
- drag started on the "Click to watch" button
- slow drag (< 4px, under the click threshold) vs. fast drag
- release inside vs. outside the track
```

Record for each: does the track move, does the dialog open when it should not, does the cursor stay `grabbing` after release, does the click get suppressed when it should not.

- [x] **Step 2: Write the diagnosis down before fixing**

State the root cause in one sentence, naming the exact line. Prime suspects, in order — the video section is the only one whose slides are entirely covered by buttons:

1. `_wireDrag()`'s trailing-click suppression cancels the _poster button's_ click, so a genuine tap never opens the dialog.
2. The 4 px threshold never trips because the pointer is captured by the nested button.
3. `data-dragging`'s `cursor: grabbing !important` outlives the gesture on a target that was removed or re-rendered.

If the reproduction shows none of these, the diagnosis is whatever it actually shows — do not force it into this list.

- [x] **Step 3: Fix the root cause, not the symptom**

Fix at the line named in Step 2. Do not add a `data-drag="false"` opt-out to the video section — that hides the bug, and per the census the same nested-button anatomy will recur in any card carousel whose whole card is interactive.

- [x] **Step 4: Verify the fix and the non-regression**

Re-run every condition from Step 1. Then confirm the behaviors the drag feature exists to protect, on `#vehicles` and `#cards`:

```
- a real drag still scrolls and settles snap-aligned
- a drag that crosses a card link does NOT navigate
- a plain click on a card link DOES navigate
- cursor is `grab` at rest, `grabbing` mid-drag, `grab` after release
```

- [x] **Step 5: Validate, rebuild if src changed, commit**

```bash
npm run validate
npm run size          # only if src/ changed; must still pass
git add -A && git commit -m "Fix grabber interaction on video testimonial cards"
```

If `src/` changed, `dist/` must be in the same commit.

---

### Task 2: Video testimonials — real video and stop-on-close

**RESOLVED 2026-08-18 (Steven): YouTube demo video.** Original blocker text: to spec open question 2: a YouTube/Vimeo URL, or a self-hosted file added to `demo/`. `ffmpeg` is not installed on this machine, so a clip cannot be generated locally, and downloading one requires explicit permission. **Implement the stop-on-close logic first (steps 1–3) — that is not blocked. Only the asset swap in step 4 waits.**

**Files:**

- Modify: `demo/index.html` — dialog markup at line 1685, dialog page script at lines 1716–1732

**Interfaces:**

- Consumes: nothing
- Produces: nothing consumed by later tasks

- [x] **Step 1: Make the dialog handle both embed types**

Replace the placeholder `<div class="demo-video-frame">` contents so the dialog can hold either an `<iframe>` (YouTube/Vimeo) or a `<video>`. Keep the existing `.demo-video-frame` aspect box.

- [x] **Step 2: Stop playback on close — the actual deliverable**

Tony's report is that video keeps playing after the modal closes. Both paths must be handled, because the recipe sites copy is the iframe one:

```js
const stopPlayback = () => {
  // <video>: pause and rewind so reopening starts from the top.
  const v = dialog.querySelector('video');
  if (v) {
    v.pause();
    v.currentTime = 0;
  }
  // <iframe>: there is no cross-origin pause API without the vendor SDK.
  // Clearing src is the universal stop — restore it on the next open.
  const f = dialog.querySelector('iframe');
  if (f && f.src) {
    f.dataset.src = f.src;
    f.removeAttribute('src');
  }
};
// `close` fires for every path: the close button, Esc, and backdrop click.
dialog.addEventListener('close', stopPlayback);
```

Wire the open handler to restore `src` from `dataset.src` before `showModal()`.

- [x] **Step 3: Browser-verify the iframe path (not blocked on the asset)**

Serve the demo, open the dialog, then close it three ways — close button, Esc, backdrop click — asserting after each:

```js
// expected after every close path:
// iframe has no src attribute, and dataset.src still holds the original
!dialog.querySelector('iframe').hasAttribute('src') && !!dialog.querySelector('iframe').dataset.src;
```

Then reopen and assert `src` is restored. **Assert all three close paths** — a `click`-only handler passes the button test and fails Esc, which is exactly the reported bug.

- [x] **Step 4: Swap in the real asset (after Steven answers)**

Drop in the chosen embed. If self-hosted, add the file under `demo/` and credit it in `demo/img/CREDITS.md`. Re-verify with the real asset that playback actually starts and actually stops — with a `<video>`, assert `video.paused === true` and `video.currentTime === 0` after close, having confirmed it was playing first (an assertion against a non-playing video is vacuous).

- [x] **Step 5: Update the details block and commit**

The section's "How this variant is built" text currently says the dialog ships a placeholder and tells readers to "remember to stop playback on close." Replace that with the implemented recipe.

```bash
npm run validate
git add -A && git commit -m "Add real video to testimonials demo and stop playback on close"
```

---

### Task 3: Fade engine mode

**Files:**

- Modify: `src/dl-carousel.js` — `DEFAULTS`, `_parseOptions()`, constructor, `_measure()`, `goTo()`, `_commit()`, `_updateUI()`, new `_updateFade()`, `_listen()`, `_pages()`, `_stops()`
- Modify: `src/dl-carousel.css` — append the fade block
- Modify: `dist/dl-carousel.js`, `dist/dl-carousel.css` (rebuilt, same commit)
- Modify: `README.md` — options table, CSS properties, accessibility section

**Interfaces:**

- Consumes: nothing
- Produces: `data-fade` / `fade: true` option; `--dlc-fade-ms` CSS property; `.is-current` class on the active slide. Task 4 consumes all three.

A working prototype of this task measured **+263 B gzip (5913/6144)** and passed core browser checks. The code below is that prototype.

- [x] **Step 1: Record the baseline**

```bash
npm run size    # expect: total: 5650 B gzip (budget 6144)
```

Write the number down. Step 8 compares against it.

- [x] **Step 2: Add the option**

In `DEFAULTS`, after the `gallery` line:

```js
  fade: false, // stacked crossfade instead of a scrolling track (1-up hero); ignores drag/peek
```

In `_parseOptions()`, after the `gallery` line:

```js
if (d.fade !== undefined) data.fade = d.fade !== 'false';
```

In the constructor, after the `data-gallery` mirror:

```js
// Fade stacks the slides; CSS needs the attribute before first paint.
if (this.opts.fade) this._setRootAttr('data-fade', '');
```

- [x] **Step 3: Short-circuit the scroll geometry**

`_measure()` — fade has no scroll geometry at all:

```js
  _measure() {
    // Stacked fade has no scroll geometry: one slide shown, stride unused.
    if (this.opts.fade) {
      this.stride = 1;
      this.perView = 1;
      return;
    }
    const s = this.slides;
```

`_pages()` and `_stops()` — one stop per slide:

```js
  _pages() {
    if (this.opts.fade) return this.slides.map((_, i) => i);
```

```js
  _stops() {
    if (this.opts.fade) return this.slides.map((_, i) => i); // every slide is its own stop
    if (this.opts.step !== 'slide') return this._pages();
```

- [x] **Step 4: Make `goTo()` commit inline**

This is the one deliberate exception to "`_commit()` is the only place `this.current` changes" — in fade nothing scrolls, so `scrollend` never fires and `_commit()` would never run. Insert immediately after the `n = Math.max(...)` clamp in `goTo()`:

```js
// Fade mode never scrolls, so scrollend never fires — commit inline.
if (this.opts.fade) {
  const moved = n !== this.current;
  this.current = n;
  this._target = null;
  this._updateUI();
  if (moved) this._emit('dlc:change', { index: n, page: n, slidesInView: 1 });
  return;
}
```

And at the top of `_commit()`, so the constructor's initial call still paints state:

```js
// Fade has no scroll position to read state from; goTo is the commit point.
if (this.opts.fade) {
  this._measure();
  this._updateUI();
  return;
}
```

- [x] **Step 5: Skip scroll and drag wiring**

At the top of `_listen()`, after `const sig = ..., t = ...`:

```js
// Fade never scrolls: no scrollend/scroll commit, no drag gesture.
if (this.opts.fade) {
  this._ro = new ResizeObserver(() => this._updateUI());
  this._ro.observe(t);
  return;
}
```

The observer still joins the existing teardown scheme — `destroy()` already disconnects `this._ro`.

- [x] **Step 6: Add `_updateFade()` and hook it up**

In `_updateUI()`, after the gallery line:

```js
if (this.opts.fade) this._updateFade();
```

New method, placed immediately before `_updateArrows()`:

```js
  _updateFade() {
    // Stacked slides overlap, so every non-current one must leave the tab order
    // and the a11y tree — the one place hiding slides is correct outside gallery
    // mode. Never inert a slide holding focus (it would strand the caret).
    this.slides.forEach((sl, i) => {
      const on = i === this.current;
      sl.classList.toggle('is-current', on);
      if (on || sl.contains(document.activeElement)) sl.removeAttribute('inert');
      else sl.setAttribute('inert', '');
    });
  }
```

- [x] **Step 7: Add the CSS**

Append to `src/dl-carousel.css`:

```css
/* ---- fade mode ---------------------------------------------------------- */

/* Stacked crossfade for 1-up heroes. The track stops being a scroll container
   entirely; slides pile up in one grid cell so the tallest defines the height
   (no absolute positioning = no collapsed box, no CLS). JS owns .is-current. */
.dl-carousel[data-fade] .dl-carousel-track {
  display: grid;
  padding: 0;
  overflow: hidden;
  scroll-snap-type: none;
}

.dl-carousel[data-fade] .dl-carousel-slide {
  grid-area: 1 / 1;
  opacity: 0;
  transition: opacity var(--dlc-fade-ms, 500ms) ease;
}

.dl-carousel[data-fade] .dl-carousel-slide.is-current {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .dl-carousel[data-fade] .dl-carousel-slide {
    transition: none;
  }
}
```

- [x] **Step 8: Warn on the unsupported combination**

Fade is 1-up only. In the constructor, next to the existing gallery/autoplay conflict warning:

```js
if (this.opts.fade && this.opts.gallery) console.warn('[dl-carousel] data-fade is ignored in gallery mode');
```

- [x] **Step 9: Build and check the budget**

```bash
npm run size
```

Expected: `total: 5913 B gzip (budget 6144)`. **If it exceeds 6144, stop** — do not raise the gate; surface it per Global Constraints.

- [x] **Step 10: Browser-verify**

Build a scratch page (scratchpad, not committed) with a 3-slide `data-fade` carousel carrying `data-autoplay="1000"` and a link inside each slide. Assert:

```
- exactly one slide at opacity 1, the other two at 0
- `inert` present on non-current slides only
- track height stable across transitions (the CLS claim)
- track scrollLeft stays 0 (nothing scrolls)
- next() and goTo(n) both move `.is-current`
- pause button rendered and first in tab order
- one dot per slide
- Tab never lands on a link inside a non-current slide
```

Then re-check under emulated `prefers-reduced-motion: reduce`: no auto-rotation, no opacity transition.

- [x] **Step 11: Document it in the README**

Add to the options table:

```
| `fade` | `data-fade` | `false` | Stacked crossfade instead of a scrolling track; 1-up hero only, ignored with `gallery` |
```

Add `--dlc-fade-ms` to the CSS custom properties list. Add to "Accessibility behavior (by design — don't 'fix' these)":

```
- Fade: slides are stacked, so every non-current slide is `inert` — the same
  carve-out gallery mode has, and the reason the multi-card "never inert" rule
  does not apply here. A slide containing focus is never inerted.
```

Add `data-fade` to the "Swapping the engine later" attribute list, since it is now part of the frozen contract.

- [x] **Step 12: Validate and commit**

```bash
npm run validate
npm run size
git add src/ dist/ README.md
git commit -m "Add fade mode for 1-up hero carousels"
```

---

### Task 4: Hero demo section

**Files:**

- Modify: `demo/index.html` — new `#hero` section, section CSS, TOC entry

**Interfaces:**

- Consumes: `data-fade`, `--dlc-fade-ms`, `.is-current` from Task 3
- Produces: the `.demo-hero` recipe referenced by Task 7's docs

- [x] **Step 1: Build the section**

Full-bleed 1-up hero matching the estate anatomy (census §3): whole-slide link, `<picture>` with mobile/desktop `srcset`, `data-autoplay="5000"`, dots. Reuse existing `demo/img/photo-*.jpg` — no new assets.

Place it **first** among the demo sections: it is the pattern 68/76 sites lead with, and the catalog should open with it.

- [x] **Step 2: Make the pause control genuinely compliant**

The platform's is 16 × 6 px. Ours must be **at least 24 × 24 CSS px** (WCAG 2.5.8 AA) with a visible focus ring. Set this in the section CSS via the existing `--dlc-*` knobs; do not special-case it in the engine.

- [x] **Step 3: Add the comparison table to the details block**

This section's teaching value is that it is an accessible replacement, so state what it fixes — pause button size, real `<button>` dots vs. `<li role="button">`, a terse status region vs. `aria-live="off"`, and reduced-motion handling. Cite the census doc.

- [x] **Step 4: Browser-verify**

```
- CLS = 0 on load (the grid-stacking claim, measured not assumed)
- pause button ≥ 24x24, first in tab order, actually stops rotation
- rotation does not start under emulated prefers-reduced-motion
- with JS disabled, all hero slides are visible and readable as a stack
```

- [x] **Step 5: Add the TOC entry and commit**

```bash
npm run validate
git add demo/index.html && git commit -m "Add accessible fade hero demo section"
```

---

### Task 5: Model bar breakpoint recipes

**Files:**

- Modify: `demo/index.html` — details block on the existing `#modelbar` section

**Interfaces:**

- Consumes: nothing
- Produces: the ladder table referenced by Task 7's CMS docs

- [x] **Step 1: Add the ladder table**

slick breakpoints are max-width; `--dlc-per-view` media queries are min-width. **These are the inverted values — use them verbatim; re-deriving them by hand is where this goes wrong.**

| Sites | OEM demos                                                  | `--dlc-per-view` ladder (min-width)              |
| ----- | ---------------------------------------------------------- | ------------------------------------------------ |
| 13    | acura1-3, ford2-3, gmc1-2, honda2-3, kia2-3, mitsubishi1-2 | base 2; ≥461px 3; ≥769px 5                       |
| 11    | cadillac1-3, chevrolet1-3, subaru1-3, volvo1-2             | base 2; ≥540px 3; ≥992px 4; ≥1200px 5            |
| 6     | lexus1-3, nissan2-3, toyota1                               | base 1; ≥401px 2; ≥601px 3; ≥992px 5             |
| 5     | buick1-2, jaguar1, landrover1, landrover3                  | base 2; ≥461px 3; ≥769px 4                       |
| 5     | genesis1-3, vw1-2                                          | base 1; ≥541px 2; ≥993px 3; ≥1201px 4            |
| 3     | lincoln1-3                                                 | base 2; ≥461px 3; ≥993px 4                       |
| 2     | ford1, honda1                                              | base 1; ≥461px 3; ≥992px 5                       |
| 2     | hyundai2-3                                                 | base 1; ≥461px 3; ≥993px 4; ≥1201px 5            |
| 2     | mazda1-2                                                   | base 1; ≥769px 2; ≥992px 3                       |
| 2     | toyota2-3                                                  | base 1; ≥541px 2                                 |
| 1     | alfaromeo1                                                 | base 1; ≥541px 2; ≥993px 3; ≥1201px 4; ≥1801px 6 |
| 1     | audi1                                                      | base 1; ≥361px 2; ≥769px 3; ≥993px 4; ≥1201px 6  |
| 1     | kia1                                                       | base 1; ≥769px 3                                 |

- [x] **Step 2: Show one worked example in full**

Give the top ladder (13 sites) as complete copy-paste CSS so the pattern is unambiguous:

```css
.my-modelbar {
  --dlc-per-view: 2;
}
@media (min-width: 461px) {
  .my-modelbar {
    --dlc-per-view: 3;
  }
}
@media (min-width: 769px) {
  .my-modelbar {
    --dlc-per-view: 5;
  }
}
```

- [x] **Step 3: Record what the census validated**

One short paragraph: `slidesToScroll: 1` on 53/55 sites is what `data-step="slide"` reproduces; `centerPadding: 60px` on 53/55 is `--dlc-peek`; `autoplay: false` on 55/55 is why no card strip in this library auto-rotates. Link the census doc.

- [x] **Step 4: Commit**

```bash
npm run validate
git add demo/index.html && git commit -m "Document the 14 OEM model-bar breakpoint ladders"
```

---

### Task 6: Tabbed model bar (generalised from Kia Demo One)

**Files:**

- Modify: `demo/index.html` — extend the existing `#modelbar-tabs` section or add `#modelbar-kia`, plus page script for the background transition

**Interfaces:**

- Consumes: the existing `[data-tabs]` APG tabs page script (lines ~1737+), the existing `.demo-modelbar` recipe
- Produces: nothing

- [x] **Step 1: Build the three tabbed strips**

kiademo1 runs **3 `.modelBarS` instances, one per body-style tab**: SUV/CUV/MPV, Hybrid/Electric, Sedan. The existing tabbed model bar already proves carousels auto-init correctly inside `[hidden]` panes (prior spec D7) — reuse that page script, do not write a second one.

Use the kia1 ladder from Task 5: base 1; ≥769px 3.

- [x] **Step 2: Add the background transition**

Cross-fade the section background when the tab changes. Per the house rule this is **page script, not engine** — listen for the tab change in the existing tabs script and swap a class on the section.

Guard it with `prefers-reduced-motion` — under reduce, swap instantly with no transition.

- [x] **Step 3: Note what was deliberately not copied**

kiademo1's own model bar uses `centerMode: true`, which is out of scope (spec D9). The rebuild approximates its edge treatment with `--dlc-peek`. Say so in the details block so the difference is not read as a bug.

- [x] **Step 4: Browser-verify**

```
- each tab's strip measures correctly when revealed (arrows step by one card)
- arrow keys move tab selection; focus never lands in a hidden pane
- background transition does not animate under prefers-reduced-motion
```

- [x] **Step 5: Commit**

```bash
npm run validate
git add demo/index.html && git commit -m "Add Kia Demo One tabbed model bar with background transition"
```

---

### Task 7: CMS instructions

**Files:**

- Create: `docs/cms-implementation.md`

**Interfaces:**

- Consumes: the recipes from Tasks 4, 5, 6
- Produces: nothing

**Nothing deploys this round** (spec D6, Steven 2026-08-18). This task writes the document only.

- [x] **Step 1: Write the document**

Cover, in this order:

```
1. What the two files are and where they go
2. The minimum markup contract (root + track + slides + aria-label)
3. Replacement codes, and which ones do NOT resolve inside blocks
4. Picking a variation: hero / model bar / card strip, with the ladder table pointer
5. Theming per OEM with --dlc-* (no engine edits, ever)
6. What NOT to do: no control markup in the CMS, no slide content injected by script,
   no per-site engine forks
```

- [x] **Step 2: State the deployment status explicitly at the top**

A reader must not mistake this for a live runbook. Open with a line saying the files are not on FTP yet and this documents the intended process.

- [x] **Step 3: Commit**

```bash
npm run validate
git add docs/cms-implementation.md && git commit -m "Add CMS implementation instructions"
```

---

### Task 8: Team catalog Artifact

**Files:**

- Create: scratchpad HTML (not committed), published via the Artifact tool

**Interfaces:**

- Consumes: `docs/research/2026-08-18-oem-demo-slider-census.md` as the source of truth
- Produces: a private shareable URL for Steven

**REQUIRED SUB-SKILL:** Load `artifact-design` before writing the page.

- [ ] **Step 1: Build the catalog page**

Present, from the census: the 5 selectors, the fade-hero finding, the 14 ladders keyed by OEM, the accessibility comparison, and a support-status column (supported / new this round / out of scope). This is the "cataloguing and organizing ones that are the same for diff OEMs" the team asked for.

- [ ] **Step 2: Publish and hand over the link**

The markdown census stays the source of truth; the Artifact is its presentation layer. Do not create a second copy of the data in `demo/` — that page is the copy-paste recipe catalog and must stay that.

---

### Task 9: Full verification pass

**REQUIRED SUB-SKILL:** Use superpowers:verification-before-completion. Evidence before assertions — run the commands and show the output.

- [ ] **Step 1: Run the gates**

```bash
npm run validate
npm run size
```

- [ ] **Step 2: Run the full README verification checklist**

All seven items, not a subset: size gate; Lighthouse a11y 100 / perf ≈ 100 / CLS 0; keyboard-only tab order; autoplay pause/stop/restart and reduced-motion; screenshots at 375 / 768 / 1280; JS-disabled pass; the Firefox-at-125 %, Safari-tab-into-cards, and pre-2025-iPhone spot checks.

- [ ] **Step 3: Report honestly**

State which checks passed, which were skipped and why (e.g. no pre-2025 iPhone available), and the final gzip number. Do not report completion for anything not actually run.

## Self-Review

**Spec coverage:** D1 → Task 3. D2 → Task 4. D3 → Task 5. D4 → Task 6. D5.1 → Task 1. D5.2 → Task 2. D6 → Task 7. D7 → Task 8. D8 (defer variants file) and D9 (out of scope) are non-actions and correctly have no task. §5 verification → Task 9.

**Known blockers, surfaced rather than papered over:** Task 1 needs the bug symptom or a reproduction sweep; Task 2 step 4 needs Steven's asset decision. Both are called out in place, and neither blocks the tasks around them.

**Type/name consistency:** `data-fade`, `--dlc-fade-ms`, and `.is-current` are defined in Task 3 and consumed under those exact names in Tasks 4 and 6. `_updateFade()` is the only new method name and appears identically in Task 3 steps 6 and 10.
