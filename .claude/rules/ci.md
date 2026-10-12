---
paths:
  - ".github/workflows/**"
  - "scripts/a11y.mjs"
---

# CI

**Accessibility is a required check, not a good intention.** `.github/workflows/a11y.yml` runs on
every push and pull request with NO path filter, decides relevance itself, and always ends in one
job, `a11y gate`, that resolves green or red. That shape is deliberate: a workflow filtered with
`on.pull_request.paths` is SKIPPED for an irrelevant PR, and a required check that never runs sits
Pending forever and wedges the merge it was meant to guard. `a11y gate` is the context to mark
required in branch protection. The relevance list must include everything the audit can SEE, which
is wider than it looks: the root `index.html` (a11y.mjs walks it by name), and `package-lock.json`
(it pins the playwright and axe-core that produce the verdict) were both missing from the first cut.

**CI checks that the committed `dist/` matches source** (`git diff --exit-code -- dist`, after the
build). Without it a `src/` change with a forgotten rebuild passed everything: `npm run size`
rebuilds `dist` on the runner and the tests then measure that fresh build, while the repo went on
serving the stale committed bytes to every dealer page and to the demo (2026-09-15 review). It is
the only step that looks at what is actually in the repo rather than at what CI just built.
