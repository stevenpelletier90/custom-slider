# Backlog — known, not actioned

Findings from reviews and audits that were triaged as non-blocking and left for a deliberate
decision. Each changes engine behaviour, the frozen contract, or a documented "never do this". Dates
are when they were found; check the code before acting on one, some may since have been fixed or
overtaken. Work that IS agreed sits in `roadmap.md`; the rules themselves are in `../CLAUDE.md` and
`../README.md`.

Pruned 2026-09-15 after an outside review re-found four of these: the size boundary (`>=` since the
raise), `data-cs-fits` on destroy and `data-cs-gallery="false"` were fixed and are gone from here;
the IntersectionObserver "threshold does nothing" item was measured on all three engines and was
never a bug (a single 0.25 threshold reports nothing at 0.1, and its entry's `isIntersecting` is
false below the crossing). `docs/history.md` has the dates.

Pruned again 2026-09-15 after a third outside review, and once more after its follow-up, which was
right that a stale finding here becomes an instruction to the next review agent. Also gone: the
copy-panel `<style>` entry — the panel has had three buttons for a while, each copying the form its
destination field can hold (`wb-copy-css` hands over `state.cssText`, raw), and only the combined
display box carries the tags, which is what makes the finished page readable. Gone: the
gallery-thumbs `cloneNode` entry (the gallery has built a fresh `document.createElement('img')`
since before that review — the finding was already stale when it was written down). The
IntersectionObserver line above now has a measurement in BOTH directions behind it, not just the
ascending one — see `docs/history.md`.

Pruned 2026-10-27, item by item with Steven. Fixed and gone, each with a check that fails without
it: the restart-while-hovered gap, `demo/index.html` scrolling sideways at 320, `looks.js` replacing
`CARGO`, `role="list"` in the authored markup, and the colour popover (`npm run a11y` never opened
it; it also split across the settings columns, which nobody had filed). The popover went in two
steps: the top layer fixed the split, and its commit claimed the crowded rows fixed too, on axe's
word alone — the picker had not moved, axe had stopped seeing it, because its target-size rule
ignores a `position: fixed` box. The 24px rows fixed the crowding, and `scripts/a11y.mjs` now takes
the picker out of the top layer so axe looks at what a person does. Stale and gone: "Generated SVGs
lack trailing newline" (no `.svg` is tracked) and the gallery focus-guard entry (fixed before the
rename; `tests/engine.test.mjs` holds it on all three engines now). The gallery's two live regions
were listed twice and are one entry under Manual QA, where the listening pass settles them. The
gallery `aria-roledescription` entry stays, reworded as the spec decision it is.

## 2026-09-15 — the phone pass, a decided no

- **Peek on phones: measured no** (Steven, 2026-09-15). The phone pass proposed a phone-tier
  `--cs-peek` default per card strip so a strip reads as scrollable. It is the bug this repo already
  removed once: `--cs-peek` has one value at every width, and the old `%root% { --cs-peek: 1.5em }`
  under 768 left 1.5em on phones while the Peek field read `0px` — a knob that lies, which is what
  `tests/controls.test.mjs` exists to catch. Measured at 320 after the arrow change, a card strip
  slide is 175px inside a 250px container with a 37.6px arrow channel showing each side; a 1.5em
  sliver each side takes the card to 127px (−27%) to say what the two visible arrows already say.
  The honest phone-only route if this ever comes back is a `--cs-peek-phone` prop on the pattern,
  the same shape as `--tab-size-phone` / `--tab-pad-phone`, with the pattern sheet overriding
  `.cs-track`'s `padding-inline` and `scroll-padding-inline` under 576 — a new knob row on about
  twelve patterns. Not the media-query override.

## 2026-09-15 — first Firefox/WebKit run of the engine contract

- Firefox gives every scroll container its own tab stop, focusable children or not, so on Firefox
  the track is one extra Tab press between the dots and the cards (the engine sets `tabIndex = 0` on
  the track only when nothing inside is focusable, and never `-1`). Chromium and WebKit do not.
  `tests/engine.test.mjs` tolerates the stop; taking it away would be `track.tabIndex = -1` when the
  track holds focusable content, a frozen-contract addition that needs a keyboard-user decision (the
  stop is also how a Firefox user arrow-scrolls the strip without a card).
- Safari's plain Tab skips links; the tab-order test presses Option+Tab there. Not an engine matter,
  recorded so the next person does not chase it.

## Manual QA still open (needs a person)

- MANUAL QA remaining (needs Steven/humans, spec §11): live NVDA/VoiceOver pass (status-region
  wording + gallery announcements); Windows Firefox at 125-150% DPI; Tab-into-cards in stable
  Safari; one pre-26.2-iOS device (scrollend fallback).
- The NVDA/VoiceOver pass is the one that also settles the gallery's two polite live regions: the
  track (per APG's tabbed carousel) and `.cs-status`. APG's own tabbed example has only the one
  (checked 2026-08-31). No amount of further static review can answer whether they double-announce —
  a person has to listen to it. If they do, the option on the table is suppressing `.cs-status`
  updates in gallery mode.
- `escUrl` through a real DealerOn styleCode round-trip (2026-09-15). The generated markup is proven
  safe in `tests/builder.test.mjs`, but the platform's server-side processing has enough documented
  weirdness that one actual paste / minify / save / reload cycle is worth doing before calling it
  production-proven.
- The thumb rail's `scroll-behavior: auto` shield on a real iOS Safari, Android WebView or in-app
  browser (2026-09-15). The three automated engines cover the behaviour; that compatibility CSS
  exists for environments none of them is.

## Minor findings for final review triage

- slider.css: .cs-arrow uses physical `top`/translateY while siblings use logical inset-*
  (consistency nit, plan-mandated).
- slider.css: some sizes hardcoded (dot hit box 24px, pause 36px, thumb radius 4px) vs exposed
  --cs-* knobs (plan-mandated).

## 2026-09-04 — workbench panel, deferred by Steven

- The spec row "unitless number → native number input"
  (`docs/specs/2026-09-04-workbench-controls-design.md`) was not built; those knobs stay text rows.

## 2026-08-31 — deep audit backlog (found during the Custom Slider rename, NOT actioned)

Four parallel audits (engine/contract, docs-vs-code, Context7 toolchain, Context7 web platform).
Everything below is PRE-EXISTING — the rename was proved behaviour-neutral by replaying its token
map over HEAD and diffing. Each item is left for a deliberate decision because it changes engine
behaviour, the frozen a11y contract, or a documented "never do this".

ENGINE / PLATFORM (cited to MDN + BCD via Context7):

- RESOLVED (2026-09-08, extended 2026-09-15), kept as the record of why the rule reads the way it
  does: `behavior: 'auto'` defers to the computed `scroll-behavior`, so a host page shipping
  `* { scroll-behavior: smooth }` animated the reduced-motion branch. Both scrollers now declare
  `scroll-behavior: auto` themselves - the track then, the thumb rail on 2026-09-15 - which is not a
  brush against "never set scroll-behavior on the track": that rule forbids `smooth`, and `auto` is
  what keeps the per-call decision in JS's hands. `tests/engine.test.mjs` holds both.
- Gallery tabpanels omit `aria-roledescription="slide"`, which APG's carousel-2-tablist example
  sets. Not a defect: the design spec chose it (`specs/2026-07-13-custom-slider-design.md`, "Main
  slides: `role="tabpanel"`, **no** `aria-roledescription="slide"`") without recording why, and the
  engine marks it where it sets the role. Reopening it is a contract decision.
- Current dot uses `aria-disabled`; MDN says `aria-current="true"` is the attribute for "current
  item in a set". NOTE: the `aria-disabled` choice is DOCUMENTED as deliberate in README and
  CLAUDE.md — changing it is a contract decision.

BUILD (measured):

- `--mangle-props='^_' --reserve-props='^(_cs|_stops)$'` measures 6177 -> 5958 B gzip (-219 B). Not
  applied: `dist/` is committed, so one new internal property reshuffles every mangled name and
  produces a large unreviewable dist diff, and it is the one change here that can break at runtime.
  We are 479 B under budget, so there is no pressure to take that trade.

DEMO (pre-existing, needs Steven's CMS knowledge):

- Three patterns (cards +21.5px, grid +42.8px, tabs +147.3px) grow taller in a host page with heavy
  typography — the repo's own "every card sets its own font-size and line-height" rule. Verified
  identical before/after the rename against a worktree of b08b990, so pre-existing, not a
  regression.
