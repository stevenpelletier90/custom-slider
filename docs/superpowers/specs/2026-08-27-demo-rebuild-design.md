# Demo rebuild — one slider, settings, and a guide

Date: 2026-08-27 · Status: design, awaiting review

## The problem

The demo grew one page per question instead of one page per job.

| Artifact                                                             |      Lines | Live carousels |
| -------------------------------------------------------------------- | ---------: | -------------: |
| `demo/index.html` — pattern catalog                                  |      4,447 |            179 |
| `demo/model-bars.html` — "Model Bar Library"                         |      5,766 |            256 |
| `demo/brands.html` — "Find your brand"                               |      5,324 |            266 |
| `docs/catalog/model-bar-library.html` — **also** "Model Bar Library" |      1,170 |              0 |
| `docs/catalog/oem-slider-census.html`                                |      1,641 |              0 |
| `docs/superpowers/plans/*.md` — finished work logs                   |      3,386 |              — |
| **total**                                                            | **21,734** |        **701** |

Two different files are titled "Model Bar Library". Every page renders every
strip on load, which is why they are five thousand lines each.

**The deeper fault is what they contain.** The library ships 54 rendered
variants built from 13 card looks and 21 size ladders. The ladders are barely
distinct — six of them are all "2 on a phone, 3 on a tablet, N on desktop",
differing only in the final count or one breakpoint:

```
2 → 3 → 5 @ 460/768        2 → 3 → 4 @ 460/992
2 → 3 → 4 @ 460/768        2 → 3 → 5 @ 460/992
2 → 3 → 6 @ 460/768        2 → 3 → 6 @ 460/992
```

That is one slider. The thing that changes is a number — and that number is
already `--dlc-per-view`, a setting the engine has always had. We built 54
copies of roughly 13 things and called a difference of one integer a different
slider.

It is also confusing at the point of use. The pages are organised by car brand,
so someone building a Mazda site is offered "the Acura ladder". That label is
meaningless to them. We published our research notes as if they were a menu.

## Principles

1. **The engine is the frame.** It is 5.9 KB, correct, and stays as it is. The
   demo exists to show how to configure it, not to pre-bake configurations.
2. **Research informs the defaults; it is not the interface.** The census
   earned its keep by telling us what good defaults are. It then gets out of
   the way, into `docs/`, as the reasoning behind the numbers.
3. **Best practice beats observed practice.** Breakpoints are **768 / 992 /
   1200** — the Bootstrap 3 grid the DealerOn platform actually runs, measured
   in its CSS bundle. The estate's 461 / 539 / 599 / 990 / 1440 are other
   people's arbitrary choices, and several were an off-by-one in a slick
   conversion. What people did does not get a vote on what is correct.
4. **One of everything.** If two things differ only by a value, they are one
   thing with a setting.
5. **Nothing appears twice.** A pattern lives in exactly one place.

## What we build

### A. The workbench (replaces all three demo pages)

One page. For each pattern: a live example at its defaults, a settings panel,
and the code for whatever is currently on screen.

**Patterns** — one of each, no per-OEM variants:

| Pattern           | What it is                                 |
| ----------------- | ------------------------------------------ |
| Model bar         | Strip of model cutouts, arrows only        |
| Model bar, tabbed | The same strip under body-style tabs       |
| Card row          | Vehicle / service / offer cards            |
| Hero              | Full-width, crossfade, autoplay            |
| Gallery           | Thumbnail-tabbed photo viewer              |
| Two-row grid      | One slide per column, two cards stacked    |
| Peek              | A sliver of the neighbouring slide showing |
| Video             | Poster cards opening a dialog              |

**Settings** — every one of these is an existing engine knob. Nothing new is
invented:

- Per view at each breakpoint (`--dlc-per-view` under 768 / 992 / 1200)
- `--dlc-gap`, `--dlc-peek`
- Arrows: `--dlc-arrow-size`, `-fg`, `-bg`, `-fg-hover`, `-bg-hover`
- Dots: `--dlc-dot-size`, `-fg`, `-current`, or hidden
- `--dlc-transition`
- Behaviour: `data-step`, `data-autoplay`, `data-rewind`, `data-drag`

**Card styles** — the 13 hand-made skins collapse to the ones that are
genuinely different components rather than different values:

`cutout tile` · `split photo card` · `tall photo tile` · `logo strip` ·
`category tile`

**Brand preset** — a dropdown that sets the settings above. It is a shortcut,
not a separate slider, and it copies nothing. Choosing a brand changes numbers
and a card style; it never produces a new component.

### B. Generated code, not maintained code

The code panel is produced from the settings currently applied. It therefore
**cannot** drift from the preview — they are the same values rendered twice.

This removes a whole class of defect. `scripts/check-recipes.mjs` exists only
because the current recipes are hand-written beside the live examples; once the
code is generated, that checker has nothing to guard and is deleted with the
pages it was written for.

### C. The guide

Short prose next to the workbench: what each setting does, which ones matter,
and the two or three rules that are not obvious (slides-per-view is CSS not JS;
one slide is one scroll stop; never `transition: all`). Enough that someone can
reach a look we never anticipated.

## What is deleted

- `demo/model-bars.html`, `demo/brands.html` — the by-brand libraries. No
  redirect stubs; the URLs go.
- `docs/catalog/model-bar-library.html`, `docs/catalog/oem-slider-census.html`,
  `docs/catalog/build-library.mjs`, `docs/catalog/capture.mjs`,
  `docs/catalog/encode.mjs`, `docs/catalog/shots/`
- `scripts/build-model-bars.mjs` — the generator for the deleted pages
- `scripts/check-recipes.mjs` — guarded hand-written recipes that no longer exist
- `docs/superpowers/plans/*.md` — 3,386 lines of logs for work that shipped

## What is kept, untouched

- `src/`, `dist/` — the engine. No changes in this work.
- `README.md` — the API reference, updated only where the demo is described.
- `docs/research/2026-08-18-oem-demo-slider-census.md` — the research record,
  which is now purely a record: it explains where the defaults came from.
- `docs/cms-implementation.md`, `docs/cms-no-hosting.md`.
- `demo/img/` — the OEM renders the workbench still shows.

## Non-goals

- No engine changes. If a look needs one, that is a separate piece of work.
- No new dependency. The workbench is the same dependency-free HTML/CSS/JS.
- Not preserving the 21 observed ladders. They collapse into the setting that
  produced them.
- Not a design-system or theme builder. It configures this one engine.

## Open question for review

**Brand presets: which brands, and what does each preset actually set?** The
census has 32. Presets are cheap (a few numbers each) but each one is a claim
that we know that brand's correct look. Options: ship presets only for brands
we have shipped work for; ship all 32; or ship none at first and add them when
a ticket needs one. Recommend the last — it keeps the first version honest and
the data is in `docs/` when a brand comes up.
