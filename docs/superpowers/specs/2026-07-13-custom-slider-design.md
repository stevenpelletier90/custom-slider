# Custom Slider — Design

**Date:** 2026-07-13
**Status:** Approved section-by-section in brainstorming; pending full-spec review
**Owner:** Steven Pelletier

## 1. Problem & goal

DealerOn sites currently depend on third-party carousel libraries (Splide-class) that the
team can't confidently maintain or customize. Build a small, dependency-free
slider/carousel library in vanilla HTML/CSS/JS that the company owns outright, covering
only the features actually used. Ships into DealerOn's custom CMS.

**v1 deliverable:** one demo page with 3 documented variations + usage README.

**Non-goals for v1:** npm publishing, framework wrappers, Splide feature parity (no fade
mode, no grid, no video, no infinite loop), test framework.

## 2. Requirements

- **Maintainability first.** Plain ES modules + one CSS file. No build step required to
  read or use `src/`. Themed entirely via CSS custom properties. A mid-level dev should
  understand the whole engine in an afternoon.
- **Accessibility.** WAI-ARIA APG carousel pattern (Grouped variant for multi-card,
  Tabbed variant for the gallery), full keyboard support, WCAG 2.2.2-compliant autoplay
  pause control, `prefers-reduced-motion` honored for both autoplay and scroll animation.
- **SEO.** All slide content in the initial server HTML (nothing JS-injected), no cloned
  duplicate content (rewind, not loop), content readable/scrollable with JS disabled.
- **Performance.** Zero CLS on init (pre-JS and post-JS render pixel-identical),
  CSS-driven layout and motion, zero dependencies, **byte budget < 5 KB gzip total
  (JS + CSS)**. Comparisons: Glider.js 2.9 KB, Embla core 6.7 KB, Splide 15.8 KB gzip.
- **Target browsers:** evergreen Chrome/Edge/Firefox/Safari + iOS/Android. Everything
  core is Baseline (scroll-snap ~95 % global, `inert` ~93 %); `scrollend` has a
  debounce fallback for pre-26.2 iOS Safari.

## 3. Decisions made (with rationale)

| Decision                                                                                                                 | Choice                                                                                     | Why                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| 3 demo variations                                                                                                        | Multi-card carousel; thumbnail gallery; autoplay multi-card                                | User-selected; covers responsive per-view, sync, and autoplay — no fade/hero mode needed                                |
| End-of-track behavior                                                                                                    | **Rewind** (animate back to slide 1)                                                       | No cloned slides → clean SEO, sane screen readers, ~half the engine code                                                |
| Architecture                                                                                                             | **CSS scroll-snap engine**                                                                 | Browser owns physics (touch/drag/momentum/snap); JS only wires controls/state/sync/autoplay; scrollable without JS      |
| Packaging                                                                                                                | `src/` ES module (canonical) + `dist/` minified classic script that auto-inits `[data-cs]` | CMS blocks need one self-contained file; devs get the module                                                            |
| Responsive slides-per-view                                                                                               | CSS only: `--cs-per-view` overridden in media queries                                      | No JS breakpoint config, no resize listeners, no CLS                                                                    |
| Controls                                                                                                                 | JS-generated prev/next/dots/pause                                                          | No dead buttons without JS; arrows overlay the track and dot-row space is reserved in CSS → CLS 0.000                   |
| `aria-roledescription="carousel"`                                                                                        | Keep, overridable via option                                                               | APG-conformant; option allows localization or removal (Roselli's JAWS double-announce concern)                          |
| Thumbnail activation                                                                                                     | Automatic (arrow-focus switches photo)                                                     | Conventional for galleries; instant under reduced-motion                                                                |
| Chromium-only platform features (`::scroll-marker`, `scrollsnapchange`, `scroll-state()`, `scrollIntoView({container})`) | **Not used**                                                                               | Verified Chromium-only as of July 2026; core must be cross-engine                                                       |
| `scroll-snap-stop`                                                                                                       | `normal` (never `always`)                                                                  | `always` blocks multi-slide flicks and was implicated in Firefox bug 1959811; adds no value (iOS already limits flicks) |

## 4. Repo layout

```
custom-slider/
├─ src/
│  ├─ custom-slider.js      # the whole engine — one ES module, heavily commented
│  └─ custom-slider.css     # all layout + theming via CSS custom properties
├─ dist/             # built by one esbuild command; checked in
│  ├─ custom-slider.js  # classic script for CMS paste-in, auto-initializes
│  └─ custom-slider.css
├─ demo/index.html   # the 3 variations + copy-paste usage docs
├─ docs/superpowers/specs/
├─ package.json      # esbuild devDependency + build/size scripts only
└─ README.md         # options reference + verification checklist
```

## 5. Usage contract

**CMS editor (declarative):** include the two dist files once; paste blocks like:

```html
<section class="cs" data-cs data-cs-autoplay="4000" aria-label="Customer reviews">
  <ul class="cs-track">
    <li class="cs-slide">…real content, real links, real images…</li>
    …
  </ul>
</section>
```

The dist script runs `CustomSlider.autoInit()` on `DOMContentLoaded`: finds every
`[data-cs]`, reads data-attributes, wires it up.

**Developer (imperative):** `import { CustomSlider } from './custom-slider.js'`;
`new CustomSlider(el, options)`. Precedence: JS options > data-attributes > defaults.

**Options (v1):** `autoplay` (ms interval, 0/absent = off), `gallery` (bool — tabbed
variant), `label` strings bundle (all UI text, for localization), `roledescription`
(string|null). Layout knobs (`--cs-per-view`, `--cs-gap`, `--cs-peek`, arrow/dot theme
vars) are CSS custom properties, not JS options.

**Events:** `cs:change` (detail: index, slidesInView), `cs:autoplay-start`,
`cs:autoplay-stop`, `cs:destroy` — all CustomEvents on the root element, for
customization without editing the engine. Public methods: `goTo(n)`, `next()`, `prev()`,
`pause()`, `play()`, `destroy()`.

## 6. Engine design (`custom-slider.js`, ~6 sections)

1. **options** — merge defaults ← data-attrs ← JS options (~20 lines).
2. **setup** — validate markup, apply ARIA per variation (§7), generate controls.
   DOM/tab order: [pause (autoplay only, always first)] → prev → next → dots → track.
   Activating a control never moves focus.
3. **state (single commit point)** — current index commits in one place: a `scrollend`
   handler (`'onscrollend' in window`), else a ~150 ms debounced `scroll` fallback.
   `currentIndex = Math.round(track.scrollLeft / stride)` where `stride` = slide width +
   gap (read via `getBoundingClientRect`/`getComputedStyle` on demand; recomputed on
   `ResizeObserver`). All input paths (buttons, drag, autoplay, thumbs) converge here;
   `cs:change`, dot state, disabled states, and status-region text update only here.
   Optional eager dot updates mid-drag via `IntersectionObserver {root: track,
threshold: 0.6}` — cosmetic only.
4. **goTo(n)** — idempotent (`if n === current && settled, return` — `scrollend` never
   fires if position doesn't change). Computes its own snap target (never trusts browser
   re-snap after programmatic scroll — WebKit 160622):
   `left = clamp(slides[n].offsetLeft - scrollPaddingLeft, 0, scrollWidth - clientWidth)`
   then `track.scrollTo({left, behavior})` with
   `behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'`
   resolved at call time. **No CSS `scroll-behavior` anywhere** (Safari hijacks
   intended-instant writes). Never `scrollIntoView` on the main track (scrolls ancestors,
   yanks the page). Never issue programmatic scrolls while a pointer is down on the track.
   `next()`/`prev()` step by `slidesInView`; `next()` past the end rewinds to 0.
5. **autoplay** — `setInterval` → `next()`. Pauses on `pointerenter`, `focusin`,
   `visibilitychange` (hidden tab), and off-screen (IntersectionObserver on root).
   Hover/pointer pause resumes on leave; **focus or explicit interaction stops rotation
   permanently — only the pause/play button restarts it** (APG). Under
   `prefers-reduced-motion: reduce`, rotation never starts. The pause button is a real
   `<button>`, first in tab order, name toggles "Stop automatic slide show" /
   "Start automatic slide show", **no `aria-pressed`**.
6. **gallery sync** — strictly one-directional: thumb activation → `main.goTo(i)`;
   main's `scrollend` commit → `aria-selected` + roving tabindex on thumbs + keep active
   thumb visible via strip-local scroll math (or `scrollIntoView({block:'nearest',
inline:'nearest'})` on the strip only). The strip's own scroll events drive nothing;
   idempotent `goTo` is the structural feedback-loop breaker.

`destroy()` removes listeners/observers/generated controls and restores original markup.

## 7. Accessibility contract

**Container (all):** labeled `<section>` (→ implicit `region`) +
`aria-roledescription="carousel"` (configurable) + `aria-label` naming the content
("Featured vehicles" — never the word "carousel" in the label).

**Multi-card (variations 1 & 3):**

- Slides: plain `<ul>/<li>` list semantics **or** `role="group"` +
  `aria-roledescription="slide"` on divs — never both on one element. Each labeled via
  `aria-labelledby` → card heading (fallback `aria-label="3 of 10"`).
- **All cards stay in the a11y tree and tab order — no `inert`, no `aria-hidden`, no
  `tabindex="-1"`** (Chrome accessible-carousel guidance: hiding corrupts announced item
  counts; focus natively scrolls cards into view). `scroll-padding-inline` ensures a
  focus-scrolled card clears the snap edge.
- Dots: APG **Grouped** variant — `role="group" aria-label="Choose slide"` wrapping real
  `<button>`s; current dot `aria-disabled="true"` (stays focusable). **Not** tablist
  semantics. **One dot per page**, not per slide (page = `slidesInView` slides; page
  count = `ceil(count / slidesInView)`, last page clamps to the track end). Button names
  match the status wording: "Go to slides 4–6" (single-per-view: "Go to slide 4"). Dot
  count recomputes when `--cs-per-view` changes across a breakpoint (ResizeObserver).
- Track itself not focusable (it has focusable children; buttons satisfy WCAG 2.1.1).
- Status region (hidden, terse: "Slides 4–6 of 12"), updated at the commit point;
  `aria-live="polite"` normally, `"off"` while auto-rotating, `aria-atomic="false"`.

**Thumbnail gallery (variation 2) — APG Tabbed carousel, in full:**

- Authored markup stays one list (the main slides). Thumbnails are **JS-generated** from
  each slide's first `<img>` (they are controls, like dots — not content, so nothing
  indexable is duplicated): `role="tablist"` → `role="tab"` `<button>`s each containing a
  copy of the image with empty `alt`, tab named from the source image's `alt` (fallback
  "Photo N"). Roving tabindex (active 0, rest −1), Left/Right/Home/End, `aria-selected`,
  `aria-controls`; automatic activation. Thumb strip space reserved in CSS (no CLS).
- Main slides: `role="tabpanel"`, **no** `aria-roledescription="slide"`, one logically
  visible; non-visible panels get JS-managed HTML `inert` (never on a panel containing
  focus), applied at the same commit point. Wrapper `aria-live` toggling per APG.

**Motion:** every programmatic scroll resolves `behavior` from
`prefers-reduced-motion` at call time; reduced motion ⇒ instant jumps and no autoplay.

## 8. CSS design (`custom-slider.css`)

```css
.cs-track {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory; /* on the track, never the root scroller */
  gap: var(--cs-gap, 1rem);
  scroll-padding-inline: var(--cs-peek, 0px);
  overscroll-behavior-x: contain; /* no scroll chaining / back-gesture */
  scrollbar-width: none;
}
.cs-track::-webkit-scrollbar {
  display: none;
} /* older WebKit */
.cs-slide {
  flex: 0 0 calc((100% - (var(--cs-per-view) - 1) * var(--cs-gap, 1rem)) / var(--cs-per-view)); /* explicit basis — Safari snap-item sizing */
  scroll-snap-align: start;
  scroll-snap-stop: normal;
}
```

- `--cs-per-view: 1` → `2` → `3` in plain media queries per variation; thumbnails strip
  uses a small fixed basis. Partial next-card peek (`--cs-peek`) on mobile as the
  scrollability affordance (scrollbar is hidden — buttons/dots/keyboard remain, plus peek).
- Arrows absolutely positioned over the track; dot-row height reserved — JS injecting
  controls shifts nothing (CLS 0.000 by construction).
- Every visual knob is a `--cs-*` custom property. Theming never touches the engine.
- Pre-JS state is a correctly laid-out, swipeable, snap-scrolling strip.

## 9. SEO / images

- All slide content (headings, links, images) in initial HTML with real `src`/`srcset`.
  Googlebot renders but never scrolls; horizontally-overflowed content is indexed at
  full weight. No clones ⇒ every heading/link exists exactly once.
- Initially-visible images eager; `fetchpriority="high"` on the first image only when
  the carousel is above the fold; slides beyond view `loading="lazy" decoding="async"`;
  `width`/`height` on every `img`; `sizes` describes one slide's rendered width per
  breakpoint — never `100vw`.
- No carousel structured data (ItemList rich results don't apply; vehicle-listing rich
  result removed by Google 2025-09).

## 10. Demo page

`demo/index.html`, opens from disk, self-contained (local SVG placeholder images):

1. **"Featured vehicles"** — multi-card, 1→2→3 per view.
2. **"Vehicle photos"** — thumbnail gallery (tabbed).
3. **"Customer reviews"** — autoplay multi-card with pause button.

Each section: live slider + exact copy-paste HTML + a table of its options. Footer
notes the no-JS behavior and links the README verification checklist.

## 11. Verification plan

- Lighthouse on demo: accessibility 100, performance ~100, CLS 0.000 in a trace.
- Playwright keyboard-only walkthrough: tab order (pause → prev → next → dots → cards),
  tablist arrow keys, focus never trapped/lost; autoplay stops on focus and never
  auto-restarts; reduced-motion emulation ⇒ no autoplay, instant jumps.
- Screenshots at 375 / 768 / 1280.
- `npm run size` prints min+gzip for JS+CSS and **fails > 5 KB total**.
- QA spot-checks (from verified research): Windows Firefox at 125–150 % DPI (bug
  1959811 residue); Tab into cards in stable Safari (scroll-padding focus quirk, fixed
  only in Safari 27 beta — add `scroll-margin` on slides if needed); one pre-26.2-iOS
  device exercising the `scrollend` debounce fallback; NVDA/VoiceOver pass to validate
  status-region wording.

## 12. Risks & mitigations

| Risk                                              | Mitigation                                                                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| iOS flicks advance ~1 slide (WebKit 243582, open) | Buttons/dots are primary traversal, not decoration; modest slide counts in demo                                           |
| Safari re-snap after programmatic scroll          | `goTo` computes exact snap position itself; `scrollend` is the only "done" signal                                         |
| Older-iOS dealer audience                         | Mandatory scrollend fallback; QA on one such device                                                                       |
| CMS strips attributes or reorders markup          | Engine validates markup on init and fails loudly with a console message naming what's missing                             |
| Future CSS carousel primitives go cross-engine    | JS mirrors native semantics (button/dot state) so it could later delegate behind `@supports`; explicitly out of scope now |
