# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## What this is

DealerOn Slider (`dos`): a dependency-free scroll-snap carousel built to replace third-party slider
libraries on DealerOn CMS sites. Two shipped files, no runtime dependencies. `npm run size` prints
the byte figures and is the authority — every figure written down elsewhere goes stale. Until
2026-10-27 it was Custom Slider, prefix `cs`; specs, research and history entries written before
then keep those names, and README's rename map translates them.

`README.md` is the public API reference (markup contract, options, CSS custom properties, JS API,
accessibility behaviors, verification checklist) — read it before changing anything user-facing.
Design rationale lives in `docs/specs/` (start with `2026-07-13-custom-slider-design.md`). Work
agreed but not started is `docs/roadmap.md`; findings triaged as non-blocking and left for a
decision are `docs/backlog.md`; the dated evidence behind the rules here is `docs/history.md`.

**What this repo can actually replace is `docs/coverage.md`** — one row per replacement code, not
per brand (one brand ships several codes, and one code can span several presets). The list of codes
is not ours: it is the Salesforce Knowledge article "Model Bar Replacement Codes" (000001851). The
ledger's own table holds the counts in scope and built, and says which codes are out of scope (the
GM multi-make combinations the team no longer does) or are not carousels at all (a design decision,
not a measurement). A row moves to **Replacement built** when a preset in `brands.js` gains a
`styles` block and a `source`; the state is `brands.js`, the ledger is the readable view, and
`npm run check:looks` fails when the two disagree. Measure one, add its row.

## Commands

```bash
npm run build          # src → dist via esbuild (bundle+minify JS, minify CSS), then appends the generated card styles to the CSS and the pattern structure + scripts to both
npm run size           # build + gzip budget gate — FAILS at ≥ 6656 B total
npm run validate       # stylelint (files + generated) + eslint + markdownlint + prettier --check + check:looks + check:vendor + typecheck  (fast; run before committing)
npm run typecheck      # tsc (pinned typescript devDependency) over jsconfig.json: src, demo, scripts AND tests, held at zero errors; types/globals.d.ts declares what the engine hangs on the page (el._dos, window.DealerOnSlider)
npm run test           # @playwright/test browser checks on Chromium (`npx playwright test --list` for the count), starts its own server on 8137 (reuses one already running)
npm run test:browsers  # tests/engine.test.mjs on Firefox and WebKit (npx playwright install firefox webkit once)
npm run test:sr        # tests/*.sr.mjs: what NVDA (Windows) or VoiceOver (macOS) says about the demo; drives a real screen reader on the whole desktop — run it from .github/workflows/screen-reader.yml (on demand), not on a desktop in use
npm run a11y           # axe over every pattern and page state; needs `npm run serve` up; not a gate, run it after rail or demo-page changes
npm run check:looks    # asserts the demo data holds (old skins -> components, brand presets, no cramped preset) and prints the current counts
npm run lint:css:generated # stylelints the CSS the copy panel ships (the card/pattern rules that live in JS template literals)
npm run lint:css:fix   # stylelint --fix on src/**/*.css and demo/assets/*.css
npm run lint:js:fix    # eslint --fix on src/**/*.js, demo/assets/*.js and scripts/
npm run format         # prettier --write .
npm run serve          # esbuild static server on http://127.0.0.1:8137 (for Lighthouse/demo)
```

Run `validate` and `test` before committing; the browser sweep is the README "Verification
checklist".

`.github/workflows/validate.yml` runs `validate`, `size` and `test` on every push and pull request
(Chromium), and a second job runs `test:browsers` — `tests/engine.test.mjs` alone on Firefox and
WebKit, the engine's contract where its Safari and Firefox decisions actually execute.
`.github/workflows/a11y.yml` is the third: `npm run a11y` (axe over every pattern, the brands page,
the two catalogue pages at 390, both themes, every colour picker, both dialogs). It runs on every
push and pull request with no path filter, decides relevance itself (`src/`, `dist/`, `demo/`, the
root `index.html`, the build scripts, `scripts/a11y.mjs`, `package.json`, `package-lock.json` and
the workflow file) and always ends in the `a11y gate` job; `.claude/rules/ci.md` has why. It became
a gate on 2026-09-15 — as "a deliberate run" it drifted for a week exiting non-zero on a deleted
selector, and a nightly job would report a contrast regression only after it had merged and
deployed. It stays out of `npm run validate`, which is the fast local command: this one needs a
browser and a server. Run it locally after any change to the rail or the demo pages rather than
waiting for CI.

Path-specific rules live in `.claude/rules/` and load when Claude reads or edits a matching file.

## Architecture

**`dist/` is checked in** (though `.prettierignore`d). Rebuild and commit `dist/` in the same commit
as any `src/` change; `demo/index.html` loads `../dist/*`, so a demo check without a build is
meaningless.

## Hard constraints

**The HTML is the stable API; the engine is an implementation detail.** Class names (`dos`,
`-track`, `-slide`, generated control classes), data attributes, `--dos-*` properties, `dos:*` event
payloads, public methods and accessibility behaviors are a frozen contract — sites can't be edited
when the engine changes (README "Swapping the engine later"). Add freely; rename or repurpose
nothing.

Where it came from: James Jin (senior web dev) required the HTML contract to be the stable API, all
behaviour to ship via two centrally hosted files, and engines to be swappable behind it so dealer
sites never need editing. The repo was renamed from custom-slider on 2026-10-27 (`cs` → `dos`, new
folder `…/Apps/dealeronSlider/`), possible only because nothing was believed live on the hosted
copy; the contract is frozen again from the first upload of the `dealeron-slider` files. The repo is
public by Steven's choice, so DealerOn colleagues can see it.

## Conventions

- Formatting: Prettier, `printWidth: 200`, single quotes in JS / double in CSS. Long single-line
  statements in the engine are the formatter's output — leave them unwrapped.
- CSS: stylelint standard + `recess-order` (property order enforced). Kebab-case selectors with BEM
  `--` modifiers. Logical properties (`inline-size`, `inset-inline`) are the house style.
- Missing markup fails loudly: `console.error` for a missing track/slides, `console.warn` for a
  missing `aria-label` or a conflicting option combination. Keep that pattern for new validation.
- Extending behavior belongs in page script, not the engine — listen for `dos:change` (bubbles from
  the root) or read the instance at `element._dos`. The two video patterns carry their own
  `<dialog>` and handler inside the emitted snippet (`patterns.js`) — the reference example: wiring
  ships with the copied code, not the demo.
- A request naming a demo site means one slider on it; confirm which before touching code. "Measure"
  means computed styles at rest, on hover, mid-transition and after a click, plus what surrounds the
  widget (heading, button, gaps). Keep the engine's a11y choices (solid dots, dots on phones, bare
  chevron, native scroll) unless Steven says otherwise.
