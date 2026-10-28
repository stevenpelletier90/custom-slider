# Custom Slider becomes DealerOn Slider (`cs` → `dos`)

Decided 2026-10-27 by Steven. The product is **DealerOn Slider**, and every name the HTML contract
exposes moves from `cs` to `dos`. This is the second rename of the contract; the first was
`dl-carousel` → `cs` on 2026-08-31.

## Why a frozen contract can move

The contract froze when the four files went up on the shared path (2026-09-08), because a page
linking them cannot be edited. The README's deployment status still records that nothing is believed
to be live on that path: the one known consumer is a designer test page on the older `dl-carousel`
classes. So, like 2026-08-31, nothing would break today. The freeze starts again on the new names
the day the `dealeron-slider` files go up.

## The map

| Was                                   | Now                                   |
| ------------------------------------- | ------------------------------------- |
| `cs` (root class)                     | `dos`                                 |
| `cs-*` (track, slide, controls, cols) | `dos-*`                               |
| `--cs-*`                              | `--dos-*`                             |
| `data-cs`, `data-cs-*`                | `data-dos`, `data-dos-*`              |
| `dataset.csFoo`                       | `dataset.dosFoo`                      |
| `cs:*` events                         | `dos:*`                               |
| `element._cs`                         | `element._dos`                        |
| `window.CustomSlider`                 | `window.DealerOnSlider`               |
| `custom-slider.{css,js,min.*}`        | `dealeron-slider.{css,js,min.*}`      |
| `…/Apps/customSlider/` (shared path)  | `…/Apps/dealeronSlider/` (new folder) |
| repo `custom-slider`                  | repo `dealeron-slider`                |

Kept on purpose:

- **`cargo-*` and `data-cargo`.** That prefix is the content layer (card looks, patterns), kept
  apart from the mechanism, and it never carried the old name.
- **Dated records.** `docs/history.md` entries before this one, `docs/specs/*` before this file and
  `docs/research/*` describe what was true when they were written, under the names of the time.
  Rewriting them would make the record wrong. Read them with the map above.
- **Local variables named `cs`.** Most hold a `getComputedStyle()` result (`cs.paddingLeft`); they
  are not part of any contract.
- **The old `customSlider/` folder** stays on FTP until Steven confirms nothing links it, then is
  deleted. The new files go into a new folder, so nothing overwrites a file a page might be using.

## Traps found before editing

- `src/custom-slider.js:153` reads label overrides with `k.startsWith('csLabel')`, then `k[7]` and
  `k.slice(8)`: 7 is the length of `csLabel`. `dosLabel` is 8, so a text swap alone silently drops
  every `data-*-label-*` attribute.
- The size gate had 20 B of headroom (6636 of 6656 B gzip). `dos` is one byte longer than `cs`
  wherever it appears in the engine.
- GitHub redirects git URLs after a repo rename but not the Pages site: the demo moves from
  `/custom-slider/` to `/dealeron-slider/` and the old address stops answering.

## Checklist

- [x] Deployments: 229 records on the one `github-pages` environment pruned to the live one
      (7366052962, 2349a97); the 6 failed workflow runs deleted. Live site byte-identical after.
- [x] Rename source files (`git mv`) and apply the map across src, demo, scripts, tests, types,
      current docs, `.claude/rules`, configs
- [x] Fix the `csLabel` offset by hand
- [x] Hand-edit README deployment status, the rename map, CLAUDE.md, a history entry
- [x] Residual grep: no `cs`-contract name left outside the kept list
- [x] `npm run build`, `npm run size` (gate), `npm run validate`, `npm run test`, `npm run a11y`
- [x] Browser check of the demo pages
- [x] Commit, push, CI green (8cf45d7: validate, browsers, a11y gate, Pages build)
- [x] Rename the GitHub repo and its homepage field; Pages answers at `/dealeron-slider/` with
      `dist/` byte-identical, and `/custom-slider/` is a 404 as expected
- [ ] Rename the local folder `~/Dev/custom-slider` → `~/Dev/dealeron-slider`
- [ ] Steven: rename `custom-slider` → `dealeron-slider` in `~/.claude` (`settings.json` ×5,
      `scripts/add-branch-rulesets.mjs`, `scripts/check-branch-protection.mjs`,
      `hooks/tool-rules.mjs` comment) — auto mode refused Claude editing its own config
- [ ] Steven: upload the four `dealeron-slider` files into `…/Apps/dealeronSlider/`
