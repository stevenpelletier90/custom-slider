# Slider catalog + fade hero — design

Date: 2026-08-18 · Status: **approved 2026-08-18** (Steven) — plan approved in chat; decisions
D1–D9 below are the agreed shape. Supersedes nothing; extends the 2026-08-07 variations spec.

Inputs: 2026-08-11 Creative Solutions sync action items, the design-team follow-up, and a new
census of all 76 DealerOn OEM demo sites:
[docs/research/2026-08-18-oem-demo-slider-census.md](../../research/2026-08-18-oem-demo-slider-census.md).

## 1. What changed since the last spec

The census overturned the assumption that drove the 2026-08-07 priority order. Fade was filed
there as a deferred nice-to-have. It is in fact the **most deployed slider pattern in the
estate — 68 of 76 sites** — and dl-carousel cannot do it. The prior research missed it because
it is a Bootstrap `carousel-fade` hero, while that research read slick configs, and `fade`
appears in **0 of 55** slick configs.

Second: the model bar is confirmed as a single canonical pattern across **55 sites**, varying
only by breakpoint ladder (14 distinct ladders, a closed set). It needs no rework — it needs
presets.

Guiding rule is unchanged: **the HTML is the frozen contract; variations are authored HTML +
site CSS.** One engine addition is proposed (D1), measured before approval.

## 2. Decisions

### D1 — Fade mode (engine, additive)

`data-fade` / `fade: true`. A stacked-slides mode: the track stops being a scroll container,
slides pile into one CSS grid cell, and opacity transitions between them.

- **Measured cost: +263 B gzip** (JS +163, CSS +100) → **5913 / 6144**, 231 B headroom left.
  Measured with `npm run size` on a working prototype, not estimated. Patch preserved at
  `scratchpad/fade-spike.patch`.
- **Why grid, not absolute positioning:** stacking in one grid cell keeps the tallest slide
  defining the track height, so the box never collapses and CLS stays 0. It also costs fewer
  bytes than `position: absolute; inset: 0` plus a height rule.
- **Code paths:** `_measure()` short-circuits (no scroll geometry; `perView` forced to 1);
  `goTo()` commits inline because **no scroll happens, so `scrollend` never fires** — this is
  the one place `_commit()` is not the sole commit point, and it is deliberate; `_listen()`
  skips scroll/scrollend/drag wiring entirely and observes resize only; `_pages()`/`_stops()`
  return one stop per slide.
- **Accessibility:** stacked slides physically overlap, so every non-current slide takes
  `inert`. This is a **carve-out from the "never inert off-screen cards" rule, and it is
  required, not optional** — the rule exists to protect announced counts in _multi-card_
  strips; fade is 1-up, the same carve-out `gallery` mode already has. A slide containing
  focus is never inerted.
- **Reduced motion:** the opacity transition is removed under `prefers-reduced-motion`.
- **Constraint:** fade is 1-up only. `--dlc-per-view > 1` with `data-fade` is a console warning.

Verified in-browser on the prototype: exactly one slide at opacity 1, `inert` on non-current
only, track height stable (no CLS), `scrollLeft` never moves, autoplay + pause + per-slide dots
all wired. **Not yet run through the full README checklist** — that happens during build, and
the 263 B figure may move slightly as a result.

### D2 — Hero demo section (the accessible replacement)

New full-bleed hero section rebuilding the platform pattern, deliberately fixing what it gets
wrong. This is the section that makes the ADA argument concrete:

| Platform hero                                         | dl-carousel hero                                      |
| ----------------------------------------------------- | ----------------------------------------------------- |
| pause button 16 × 6 px, `id="hiddenPlayPauseControl"` | full-size pause button, ≥ 24 × 24, first in tab order |
| dots are `<li role="button" tabindex="0">`            | real `<button>` dots, one per slide                   |
| `aria-live="off"` on the track                        | terse dedicated `.dl-carousel-status` region          |
| no reduced-motion handling observed                   | never auto-rotates under `prefers-reduced-motion`     |

Anatomy matches the estate: 1-up, whole-slide link, `<picture>` with mobile/desktop `srcset`,
5 s autoplay, dots. Uses existing demo images; no new licensing exposure.

### D3 — Model bar ladder recipes

Document all 14 ladders as copy-paste `--dlc-per-view` breakpoint blocks. slick breakpoints are
max-width and dl-carousel's are min-width, so **each ladder is inverted** when translated — the
recipes must ship pre-inverted, since that is exactly the step a builder would get wrong.

Presented as a table keyed by OEM, so a Cadillac build starts from the Cadillac ladder. No engine
change; no new class names (see D8).

### D4 — Kia Demo One model bar (08/11 action item)

Confirmed anatomy: **3 `.modelBarS` instances, one per body-style tab** (SUV/CUV/MPV,
Hybrid/Electric, Sedan), plus a background transition on tab change. We already ship the tabbed
model bar (D7 of the prior spec), so this is a skin plus the background transition, built as
page script per the house rule that behavior extensions live outside the engine.

Note: kiademo1's own model bar uses `centerMode: true` — out of scope per D9. The rebuild
approximates its edge treatment with `--dlc-peek`.

### D5 — Video testimonials fixes (08/11 action items)

1. **Grabber interaction bug** — symptom not yet reproduced; see open question 1. To be diagnosed
   via systematic-debugging before any fix is written.
2. **Real video + stop-on-close** — replace the placeholder frame with an actual embed and stop
   playback when the dialog closes. The current demo ships a placeholder and a written note to
   remember this; Tony flagged that the note is not enough.

These are independent of the catalog work and ship **first**, so they are not blocked behind it.

### D6 — CMS instructions (prepare, do not deploy)

Written documentation only: replacement codes, where the HTML and CSS live, how to drop a slider
into a block. **Nothing goes to FTP this round** (Steven, 2026-08-18). The doc is the deliverable;
deployment is a later, separate decision.

### D7 — Catalog page for the team

The census published as a shareable reference: every pattern, which OEMs use it, whether we
support it, and the gap list. This is the "cataloguing and organizing" Pete and Dylan asked for
and the artifact the team can use in a meeting.

Form: a published **Artifact** (private link Steven can share), generated from the census doc —
not a new page in `demo/`, which is the copy-paste recipe catalog and must stay that. The
markdown census in `docs/research/` remains the source of truth; the Artifact is its
presentation layer.

### D8 — No shipped variants CSS file yet (deferred again, deliberately)

The 2026-08-07 promotion criterion ("when 2–3 real sites adopt the same recipe verbatim") is
technically overwhelmed — 55 sites on one recipe. It is still deferred, for a reason that is not
about evidence:

**Class names in a shipped variants file join the frozen contract permanently.** Once a live site
uses `.dl-carousel--modelbar`, it can never be renamed or repurposed. Committing to permanent
names _before anything is deployed_ (D6: not FTP-ready) is the wrong order. Recipes are
reversible; a shipped contract is not.

Revised promotion criterion: **after** first real-site deployment, once the recipes have survived
contact with a production build.

### D9 — Out of scope

- **Center-mode snapping** — 3 instances estate-wide (kiademo1 model bar, lexusdemo2 quick-nav
  at 9 %, lexusdemo2 gallery at 20 %). Engine scroll math assumes `start` alignment; not worth
  the bytes when the hero is at 68.
- **`rows: 2` grid slider** (hyundaidemo1, 1 site) — a different layout primitive, not a carousel
  mode.
- **Auditing non-homepage pages** — the census covers homepages only.

## 3. Budget

|                    | B gzip          |
| ------------------ | --------------- |
| Current            | 5650            |
| D1 fade (measured) | +263            |
| **Projected**      | **5913 / 6144** |

231 B headroom remains. Everything else in this spec is demo/docs and costs zero engine bytes.
If the full verification pass pushes D1 over budget, the gate is **not** raised silently — that
returns as its own decision, per the hard constraint in CLAUDE.md.

## 4. Files touched

- `src/dl-carousel.js`, `src/dl-carousel.css` + rebuilt `dist/` in the same commit (D1 only)
- `demo/index.html` — hero section (D2), Kia model bar (D4), video fixes (D5), TOC
- `README.md` — `data-fade` option row, CSS property, the fade a11y carve-out
- `docs/` — census (written), this spec, CMS instructions (D6)
- `scripts/size.mjs` — budget note if D1's measured cost changes on final build

## 5. Verification

Full README checklist, not just the size gate. Fade-specific additions:

1. Screen reader: hero announces one slide, not all of them; count is correct.
2. Keyboard: pause → prev → next → dots → slide link; focus never lands on a hidden slide.
3. `prefers-reduced-motion`: no auto-rotation, no opacity transition.
4. CLS = 0 on the hero (the grid-stacking claim).
5. JS disabled: all hero slides visible and readable as a stack.
6. Safari + Firefox: `inert` support and grid stacking.

## 6. Open questions

1. **The grabber bug (D5.1): what is the actual symptom?** Not reproduced yet. Needed before a
   fix: what does it do wrong, on what device/browser, and on which section — the video
   testimonials specifically, or drag generally?
2. **Hero video:** which real video should the demo embed (D5.2) — a YouTube/Vimeo URL, or a
   self-hosted file we add to `demo/`?
