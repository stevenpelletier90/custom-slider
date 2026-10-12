# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## What this is

A dependency-free scroll-snap carousel (`cs`) built to replace third-party slider libraries on
DealerOn CMS sites. Two shipped files, no runtime dependencies. `npm run size` prints the byte
figures and is the authority — every figure written down elsewhere goes stale.

`README.md` is the public API reference (markup contract, options, CSS custom properties, JS API,
accessibility behaviors, verification checklist) — read it before changing anything user-facing.
Design rationale lives in `docs/specs/` (start with `2026-07-13-custom-slider-design.md`). Work
agreed but not started is `docs/roadmap.md`; findings triaged as non-blocking and left for a
decision are `docs/backlog.md`; the dated evidence behind the rules here is `docs/history.md`.

**What this repo can actually replace is `docs/coverage.md`** — one row per replacement code, not
per brand. The list of codes is not ours: it is the Salesforce Knowledge article "Model Bar
Replacement Codes" (000001851), 49 codes in scope across 24 OEM sections — the article lists 56, but
the seven GM multi-make combinations are work the team no longer does (2026-09-15) and are recorded
at the foot of the ledger, counted nowhere. A brand is the wrong unit (GM ships ten; CDJR ships one
code across four marques this repo holds as four presets), and ten of the 49 are not carousels at
all — static grids and tabbed lists, where swapping in a slider is a design decision rather than a
measurement. A row moves to **Replacement built** when a preset in `brands.js` gains a `styles`
block and a `source`; the state is `brands.js` and that file is the readable view. Measure one, add
its row.

## Commands

```bash
npm run build          # src → dist via esbuild (bundle+minify JS, minify CSS), then appends the generated card styles to the CSS and the pattern structure + scripts to both
npm run size           # build + gzip budget gate — FAILS at ≥ 6656 B total
npm run validate       # stylelint (files + generated) + eslint + markdownlint + prettier --check + check:looks + check:vendor + typecheck  (fast; run before committing)
npm run typecheck      # tsc (pinned typescript devDependency) over jsconfig.json: src, demo, scripts AND tests, held at zero errors; types/globals.d.ts declares what the engine hangs on the page (el._cs, window.CustomSlider)
npm run test           # @playwright/test browser checks on Chromium (`npx playwright test --list` for the count), starts its own server on 8137 (reuses one already running)
npm run test:browsers  # tests/engine.test.mjs on Firefox and WebKit (npx playwright install firefox webkit once)
npm run a11y           # axe over every pattern and page state; needs `npm run serve` up; not a gate, run it after rail or demo-page changes
npm run check:looks    # asserts the demo data holds: 17 old skins -> 7 components, 32 brand presets, no cramped preset
npm run lint:css:generated # stylelints the CSS the copy panel ships (the card/pattern rules that live in JS template literals)
npm run lint:css:fix   # stylelint --fix on src/**/*.css and demo/assets/*.css
npm run lint:js:fix    # eslint --fix on src/**/*.js, demo/assets/*.js and scripts/
npm run format         # prettier --write .
npm run serve          # esbuild static server on http://127.0.0.1:8137 (for Lighthouse/demo)
```

Run `validate` and `test` before committing, and the README "Verification checklist" browser sweep
before shipping; a size check alone is not verification.

Files Claude edits are auto-fixed by the user-level PostToolUse hook
(`~/.claude/hooks/format-on-edit.mjs`, shared by every repo), which runs whichever of stylelint,
eslint, markdownlint-cli2 and prettier this repo has installed. This repo defines no hook of its
own. It never blocks; `npm run validate` is the real gate.

`.github/workflows/validate.yml` runs `validate`, `size` and `test` on every push and pull request
(Chromium), and a second job runs `test:browsers` — `tests/engine.test.mjs` alone on Firefox and
WebKit, the engine's contract where its Safari and Firefox decisions actually execute. After a push,
watch both until green. `.github/workflows/a11y.yml` is the third: `npm run a11y` (axe over every
pattern, the brands page, the two catalogue pages at 390, both themes, both dialogs) on any change
to `src/`, `dist/`, `demo/` or the build scripts. It became a gate on 2026-09-15 — as "a deliberate
run" it drifted for a week exiting non-zero on a deleted selector, and a nightly job would report a
contrast regression only after it had merged and deployed. It stays out of `npm run validate`, which
is the fast local command: this one needs a browser and a server. Run it locally after any change to
the rail or the demo pages rather than waiting for CI.

Path-specific rules live in `.claude/rules/` and load when Claude reads or edits a matching file.

## Architecture

**`dist/` is checked in** (though `.prettierignore`d). Rebuild and commit `dist/` in the same commit
as any `src/` change; `demo/index.html` loads `../dist/*`, so a demo check without a build is
meaningless.

## Hard constraints

**The HTML is the stable API; the engine is an implementation detail.** Class names (`cs`, `-track`,
`-slide`, generated control classes), data attributes, `--cs-*` properties, `cs:*` event payloads,
public methods and accessibility behaviors are a frozen contract — sites can't be edited when the
engine changes (README "Swapping the engine later"). Add freely; rename or repurpose nothing.

Where it came from: James Jin (senior web dev) required the HTML contract to be the stable API, all
behaviour to ship via two centrally hosted files, and engines to be swappable behind it so dealer
sites never need editing. It froze when the four files went on the shared path on 2026-09-08; the
2026-08-31 rename was possible only because nothing was hosted yet. The repo is public by Steven's
choice, so DealerOn colleagues can see it.

## Conventions

- Formatting: Prettier, `printWidth: 200`, single quotes in JS / double in CSS. Long single-line
  statements in the engine are the formatter's output — leave them unwrapped.
- CSS: stylelint standard + `recess-order` (property order enforced). Kebab-case selectors with BEM
  `--` modifiers. Logical properties (`inline-size`, `inset-inline`) are the house style.
- Missing markup fails loudly: `console.error` for a missing track/slides, `console.warn` for a
  missing `aria-label` or a conflicting option combination. Keep that pattern for new validation.
- Extending behavior belongs in page script, not the engine — listen for `cs:change` (bubbles from
  the root) or read the instance at `element._cs`. The two video patterns carry their own `<dialog>`
  and handler inside the emitted snippet (`patterns.js`) — the reference example: wiring ships with
  the copied code, not the demo.
- A request naming a demo site means one slider on it; confirm which before touching code ("the
  Chevrolet demo" meant the tabbed model bar, and a hero built instead was reverted, 2026-09-14).
  "Measure" means computed styles at rest, on hover, mid-transition and after a click, plus what
  surrounds the widget (heading, button, gaps). Steven judges by watching the live page. Keep the
  engine's a11y choices (solid dots, dots on phones, bare chevron, native scroll) unless he says
  otherwise.
