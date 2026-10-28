---
paths:
  - "tests/**"
  - "playwright.config.mjs"
---

# Tests

**`npm test` is a gate, not optional.** `@playwright/test`, workers, `retries: 0` (so the configured
trace is `retain-on-failure`, since an on-retry one could never fire); about 90 seconds. Every test
names the finding it guards and was checked to fail against the code before it. One file per area
(`npx playwright test --list` for the count; a number written here went stale within a week):
`brands`, `builder` (copy-panel output, paste parity on a hostile host), `controls` (a knob shows
what the slider actually uses), `content`, `engine` (the engine's contract on authored markup —
no-JS, fits state, tab order, autoplay, reduced motion), `install` (saved name AND bytes; Copy hands
over the file with no tag; the panel neither states a deployment status nor offers a paste route),
`editor`, `dots`, `fade`, `settings`, `colour`, `labels`, `layout`, `length`, `pane`, `tiers`, `vendor`,
`variants` (measured brand values reaching preview and copied CSS), `recipes` (every Reference
restyle applied to a real pasted slider). It deliberately does NOT sweep every pattern at every
width — a gate nobody runs is not a gate.
