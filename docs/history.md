# History — dated evidence behind the standing rules

Measured figures, finding IDs and the incidents that CLAUDE.md used to carry as rationale. The rules
they anchor stay in `../CLAUDE.md`; the evidence lives here so it is out of the default context load
but not lost. Moved out of CLAUDE.md on 2026-09-10, out of the git-ignored SDD ledger on 2026-09-14.

rationale. The rules they anchored stay in CLAUDE.md; the evidence lives here.

- Sizes at the time: engine 6.2 KB gzip (JS 4.9 + CSS 1.4) against the 6656 B budget; the stylesheet
  also carried 2 KB of card styles, so a site downloaded 8.2 KB.
- Demo: the rail held 21 starting points. `patterns.html` used to carry a second "Every card style"
  grid (gone — every card is a pattern). `looks.js`'s 7 components collapsed the census's 17 OEM
  "skins", most of which differed only in values.
- Install panel: building the file name back up from a kind (`custom-slider.${kind}`) once saved
  minified bytes as `custom-slider.css` — why each button's `data-file` names the file.
- 2026-09-08: the "Paste the card styles too" switch went (an inlined copy can never be fixed; it
  was a no-op on most patterns). Two stylesheets only ever saved bytes on a site using no card
  style, and there are none.
- 2026-09-08 taxonomy end state: `pane.looks()`, the `lookpicker` blade and the `.tp-lookv` rules
  removed. Nesting the picker inside a structural pattern had made a tabbed bar look as though it
  owned a decision about cards.
- 2026-09-08 third axis (`content`/`crop`); 2026-09-09 the brand control also appears wherever a
  brand carries measured values. Crop-warning anchor: "a photo card on a cutout roster is wrong"
  flagged `cards` + `vcard`, which is a 640×480 cutout in a 4/3 card — aspects agreeing, trimming
  nothing.
- 2026-09-09 brand variants: the spike measured chevroletdemo1 against the `tabs` pattern and found
  every difference was a value, which moved the tab row's five values out of hardcoded CSS into
  props (F039). 2026-09-10: the Brand list left the settings panel (spec
  `2026-09-10-brands-page-design.md`).
- 2026-09-14, afternoon, Chevrolet tabbed bar: the morning pass measured static values and the bar
  still did not look like chevroletdemo1's (Steven: "it's the animations, the spacing"). Measured
  live at 1280 with computed styles, hover states, a mid-flight tab switch and a mid-flight slide:
  cutout grows 0.85→0.90 in 0.1s ease-in (ours 0.25s); name 2px under the cutout on a 17.6px line
  (ours 6.4px on 21.5px, the bar 9px taller); 31px between tab labels with the `|` at the 14px body
  size (ours 3.5px and 18px); tab row 57.7px (ours 51.6); a picked pane fades in over 0.15s
  (Bootstrap `.fade`); arrows `#666` turning `#006dc7` on hover on no background (ours went white on
  a dark circle, the engine default); "View Our Lineup" h3 above and a blue "Explore All New
  Inventory" button below. All became values: `--img-hover-speed`, `--name-gap`, `--name-leading` on
  the tile, `--tab-gap`, `--tab-pad`, `--tab-divider-size`, `--tab-fade`, `--title-*`, `--more-*` on
  the tabbed bar, two hover values in the preset. The heading and button are the pattern's own words
  (an h2, a real link), emitted only when filled. Kept on purpose: the engine's bare chevron (the
  live icon is a chevron in a circle), the engine's scroll physics (slick's 500ms), the
  reduced-motion rule (the fade and the zoom never play for a reader who asked for none). The
  `.vehicleModelsItem:not(:hover)` dimming rule in the live CSS matches no element on the live page.
  A first cut of the divider offset resolved `--tab-gap` in the divider's own em (14px) instead of
  the tab's (18px) and sat 3px off centre, which is why `--tab-divider-size` is a fraction, not a
  length. The axe audit's one finding (the tall tile's current dot on `patterns.html`, 1.43:1) is
  the same before and after this work. Missed by that pass and caught by Steven: the live tab line
  is an `::after` on the link (2px, `#006dc7`, `left: 50%; width: 0` at rest, `left: 0; width: 100%`
  selected, width and left over 0.15s `cubic-bezier(0.215, 0.61, 0.355, 1)`), so it grows out from
  the centre on a switch; ours was a border colour flipping. The line is now a box over the tab's
  transparent 2px border with `--tab-line-grow` (0s by default), under reduced-motion:
  no-preference. Steven then saw it on hover, not just on a click: the live rule is
  `li.active a::after, li a:hover::after`, so the pointer alone grows the line and leaving shrinks
  it back; ours has the hover half too.
- 2026-09-14, theme: Steven asked whether the heading and button would override a site's theme. They
  would have: the snippet shipped `--more-bg: #006dc7`, the button's size and radius, the heading's
  size and weight, and a literal `#006dc7` for the tab line and arrow hover. Read off the live
  pages, every DealerOn theme defines four tokens on `:root` (`--cta-background-color`,
  `--cta-font-color`, `--cta-hover-color`, `--main-color`; checked on the Chevrolet, Toyota, BMW and
  Ford demos), and the live bar draws its tab line and arrow hover from
  `var(--cta-background-color)` and its button from `.btn.btn-cta.btn-lg`. The snippet now names the
  classes (`h2.h1.cargo-title`, `a.btn.btn-cta.btn-lg`) and the token, and ships no size, weight or
  colour for either; the four `--title-*`/`--more-*` knobs went. The preview frame, the
  Patterns/Brands stages and the tests' hostile host carry the theme layer as stand-ins (the demo's
  navy, Chevrolet's `theme` in `brands.js` overriding it), marked preview-only like the font;
  `check-looks` holds `theme` to those four keys as hexes. Then, so the preview still shows the
  brand's heading weight and button shape without the snippet carrying them: `theme.css`, the site's
  own rules for `.h1`/`.btn`/`.btn-lg`/`.btn-cta` only (check-looks refuses any other selector), a
  sheet in the frame's head and scoped onto the brand's Brands-page stages; Chevrolet's are headings
  600 capitalised, buttons bold with a 2px border, 8px radius and 8px 20px padding.
- 2026-09-14, Brands page code: each measured stage shows and copies its three parts, from
  `renderSnippet()` in `workbench.js` - the builder's own
  `cssFor`/`toCms(htmlFor)`/`guarded(script)` under the pattern's own slider name - so the two pages
  cannot hand out two Chevrolet bars; a test compares the Brands page text with the builder's code
  box byte for byte. The first cut differed in every image path: `brands.html` did not load
  `cms-paths.js`, so `toCms()` fell back to `#MISCPATH#` placeholders where the builder names the
  platform files.
- 2026-09-14, `patterns.js`: the 21 pattern definitions and their example rosters (970 lines) came
  out of `workbench.js` (4,509 lines, most of it builder UI) into their own classic script beside
  `looks.js` and `brands.js`, so a new replacement code is an entry in a data file. A
  cross-reference script proved the cut: the region reached back for `clamp` and `BRANDS` only, and
  the builder reached forward for `PATTERNS`, the six rosters, the two photo rules, the video dialog
  markup and `escTab` - all now on `globalThis.CARGO`. The two gates that read `PATTERNS` off source
  text read `patterns.js`; `ENGINE_DEFAULTS` stays in the builder. The shared-structure move
  (pattern rules and scripts into the linked files, the snippet down to values and markup) is
  specced in `docs/specs/2026-09-14-shared-pattern-structure-design.md` and not started; measured
  for it: chevroletdemo1 serves its whole theme as 287 KB of inline `<style>` in a 469 KB page, so
  Style Only CSS is paid for on every page view and never cached.
- 2026-09-14, shared pattern structure shipped (Steven's four answers are in the spec). The first
  run left every wrap without its `data-cargo` attribute: a `sed` over the four wrap lines matched
  only the lightbox's, so the shared rules matched nothing, the tabs drew in the UA button font and
  six tests failed the same way - the fix was three `Edit`s, and the lesson is the standing one
  about `sed` and template literals. The preview frame and the two catalogue pages build markup
  after the deferred engine file has already run its pattern pass, which is why the pass is
  published as `CustomSlider.wirePatterns()` and called once per build there; eval'ing the pattern
  source as before would have wired every tab twice against the shipped copy. Measured after: the
  Chevrolet tabbed bar's paste is 39 lines / 436 B gzipped (was 56 lines / 1 020 B plus a 793 B
  script); the shared files carry 2.7 KB of pattern CSS and 1.3 KB of scripts gzipped; the engine is
  unchanged at 6 364 B. The axe audit's one finding is the same as before.
- 2026-09-14, Ford tabbed bar (forddemo1): the second measured brand on the tabs pattern, and the
  first test of "add the knob, never a second pattern". Its bar is the same shape as Chevrolet's -
  heading, tabs, five cutouts, button - dressed as a row of cells that share the width on #f0f0f0,
  the picked one white with a 5px line on TOP and none on hover, 1px #ccc rules between cells and
  under the unpicked ones, the row and the panes in a 1px #ccc box with 30px inside it (15 below
  992), a `lead text-muted` paragraph under the heading, tabs at 16px that drop to 12px below 992
  and shorten on a phone through `hidden-xs` spans. Twenty knobs came out of it, each defaulting to
  what the literal was so the untouched bar and Chevrolet's draw the same. Three things moved that
  are worth knowing: `--tab-pad` is the whole padding shorthand now (the 1.1em side padding was a
  literal), the picked tab's line sits inside the padding instead of over a reserved 2px border
  (Chevrolet's preset carries the 2px as `0.86em` of bottom padding, row still 57px), and the
  heading and lead rules are `.cargo-title:is(h2)` / `.cargo-lead:is(p)` because the platform's own
  `.h1` and `.lead` margins tie a scoped class rule at (0,1,0) and which sheet the page emits last
  is undocumented - measured in the frame: the heading wore the theme's 20px top margin until the
  element name broke the tie. The tablet tier needed its own values (`--tab-size-narrow`,
  `--tab-pad-narrow`, `--box-pad-narrow`, defaulting to the wide knob): the tab's padding is in its
  own em, so a tab that shrinks there pulls its padding in, and the live row went from 53px to 40
  instead of 47 until the narrow padding existed. A filled row takes no arrow channel on the strip
  (`cssFor()` reads the grow off `--tab-flex`): padding the cells would only narrow them. Kept on
  purpose, as with Chevrolet: the engine's chevron and scroll physics, the theme's own `btn-lg`
  padding (the live page pads that one button with a site-scoped rule), and the desktop name gap at
  every width. Ford's `font` is `headings: true` - antenna on the headings, Arial body - so the
  preview no longer sets a brand font on the body for it. Playwright's `goto` to the same path with
  a new hash is a same-document navigation: forty minutes went to a "stale" preview that was the
  browser never reloading, fixed by going through about:blank.
- 2026-09-14, Cadillac tabbed bar (cadillacdemo1), the third of the day: Chevrolet's row in white on
  a black band, exactly what the preset's note had guessed from the census. Two things no knob had,
  and both turned out to be words rather than CSS: the band is the platform's own `bg-main` on the
  wrap, which is what turns the text white and the `.btn-cta` into the white outline the theme draws
  on a band - so `words` grew `wrapClass` and `titleClass` (the heading wears `heading-lg` there,
  not `h1`), both held to class names by check-looks. The band's own colour is the one knob added
  (`--bar-bg`, on `%wrap%:is(.bg-main)` so it beats `.bg-main` in either sheet order, defaulting to
  `var(--main-color)`, which is what bg-main paints anyway, so an untouched band changes nothing)
  with `--bar-pad`/`--bar-pad-narrow` as `padding-block` - the first cut was `padding` and the lint
  gate caught `7.14em 0` being refused as a two-value length, which was the right refusal: a band is
  as wide as its block and the page's container insets it. The lightning badge on the electric
  cutouts is baked into the PNGs; the `.vehicleModelsItem` hover-dim rule in the site's CSS matches
  nothing in its own markup (measured: every card stays at opacity 1), so neither became a knob.
  Kept on purpose: the divider at every width (the live one is hidden-xxs, gone below 540), 18px
  tabs on a phone (live: 16 below 540), and 35px of band padding below 768 where the live section
  leaves 30.
- 2026-09-15, Cadillac, the day after: `--bar-bg` is gone. Steven: "the background color will come
  from the website" - the wrap wears `bg-main` and the theme paints it, and a knob defaulting to
  `var(--main-color)` on `%wrap%:is(.bg-main)` at (0,2,0) would have overridden any site whose theme
  paints `bg-main` something else (cadillacdemo1's own section rule is exactly that: it turns the
  platform's band #0a0a0a). The Reference already said a colour band is page furniture, not a slider
  setting. The brands page showed the problem first: its `.gx-stage .bg-main` stand-in ties the
  shared rule at (0,2,0) and won on order, so the band there was #282828 while the workbench drew
  #0a0a0a. The two "kept on purpose" phone items reversed once Steven asked for "more mobile
  friendly": at 390 the live bar draws 16px tabs and no `|`, ours drew 18px and a `|` dangling at
  the start of the wrapped second row. Two phone-tier knobs on the pattern (`--tab-size-phone`,
  `--tab-divider-phone`, at the platform's 768 tier - the live switch is at 540, not a platform
  tier), defaulting to the tablet values so no other bar moves. Still kept: one car per view on a
  phone (the live bar squeezes two 138px cards under the tile's 150px floor plus the 12px margin,
  which is `perViewFor()`'s clamp doing its job) and 35px of band padding below 768. The preview's
  `heading-lg` stand-in draws 32px at every width where the live theme drops to 28px on a phone;
  preview only, and `check-looks` holds `theme.css` to plain class selectors, so a media query there
  is a gate change, left alone.
- 2026-09-15, an outside review (eight findings, pasted by Steven) and the hardening pass it earned.
  Held: the constructor's `step` bypassed the data-attribute normalisation and `_stops()` loops
  `i += n`, so `{ step: 0 }` hung the page (checked on the merged options now, 65 B); `destroy()`
  kept only the NAMES of root attributes it added, so an authored `role="group"` came back as the
  engine's `region` (a Map of original values now, and the test compares values); `scripts/a11y.mjs`
  still clicked the look picker deleted on 09-08 and had exited non-zero for a week with nobody
  seeing it, because it is not in CI (walks the rail and brands.html now); `data-cs-gallery="false"`
  reserved the thumb strip (the `:not()` the fade pin uses, NOT the engine-set marker the review
  proposed - the space must exist before JS runs or every gallery shifts at init); the size gate
  weighed the engine alone while every pattern ships in the same files (a second guard on the two
  files whole, 16 KiB); four backlog entries were already fixed. Rejected after measuring: the
  IntersectionObserver "threshold does nothing" claim, in the backlog since 08-31 and repeated by
  the review. A probe on Chromium, Firefox and WebKit shows a single 0.25 threshold reports nothing
  at 0.1 and its entry's `isIntersecting` is false below the crossing, so the original line was
  right; a test now holds it. Added: the engine contract file runs on Firefox and WebKit
  (`npm run test:browsers`, its own CI job), which found on its first run that Firefox tabs to the
  track (backlog) and that Playwright's WebKit never tabs into a link. Every new test was run
  against the previous `dist` first; the observer test passing there is what exposed the wrong
  claim. The audit's last finding, the lead paragraph in the platform's `text-muted` (#777 on white,
  4.47:1, Ford's live class), was Steven's call: "it shouldn't keep text-muted", so the lead wears
  `lead` alone and takes the body colour.
- 2026-09-15, Bootstrap 5 tiers (Steven: "we need to move away from [Bootstrap 3 breakpoints] in
  favor of BS5 media query breakpoints"). The three numbers the platform uses today (768 / 992
  / 1200) are Bootstrap 5's too, under different letters; what Bootstrap 5 adds is 576 and 1400, and
  what it changes is the container (720 / 960 / 1140, plus 540 and 1320). The contract decided the
  shape: `cs-sm-N` means 768 on every site that has it and cannot be renamed, and Bootstrap 5's `sm`
  means 576, so the two new tiers are `cs-576-N` and `cs-1400-N` - named by width, because a second
  alphabet on the same element would make every class a guess about which grid it came from. Every
  ladder is six rungs (`fullLadder()` fills 576 from the phone rung and 1400 from the desktop rung;
  a rung equal to the one below emits no class, so 205 tests that pin
  `cs-xs-2 cs-sm-3 cs-md-4 cs-lg-5` passed untouched), the builder has six width buttons and a Grid
  select that draws the frame in either container and clamps a preset against it (`html[data-grid]`;
  saved with the width), and check-looks clamps every preset against both grids. Cadillac's preset
  now reads its real ladder at 576 - two across on a wide phone where the day before it was one at
  every phone width - and the tabbed bar's phone knobs moved from 768 to 576, which is where its
  live bar switches (540). Two tests named the old "Phone · under 768" label and were the only
  failures.
- 2026-09-15, the phone pass. Screenshots of the four measured tabbed bars and the model bar at 320
  and 390 on `brands.html`, then Playwright measurements of every pattern at 320 / 390 / 600 / 700 /
  992 / 1200. Deliberate departures from every live bar we measured, recorded here because the rule
  is that measured values are the floor, not the ceiling:
  - **The tab row never wraps.** It was `flex-wrap: wrap`, and the divider glyph hangs off the tab
    that FOLLOWS it, so every wrapped row started with a `|` dangling in the margin. Measured before
    the change: Chevrolet's five body styles sat on 5 lines at 320, 4 at 390 and **2 at 600, 700 and
    992** - so this was never only a phone bug, which is why the fix is not in a media query. The
    row is now `nowrap` + `overflow-x: auto` at every width; a row that fits scrolls nowhere and
    stays centred, so no desktop bar moved. `data-more` (set by the pattern script) is what turns on
    the left alignment, the `flex: 0 0 auto` and the edge fade, and it is set only while the row
    actually overflows - centring a scroller that overflows puts its own first tab out of reach, and
    fading an edge with nothing past it is a lie. Chevrolet's bar lost 57px of height at 600
    and 700.
  - **No scroll-snap on the tab row.** Tried first, reverted the same hour: the snap area is the
    tab's border box, so the browser scrolled its `--tab-gap` margin off and every bar rested
    14-15px in with the start fade lit. A tab is not a slide.
  - **The fade is unprefixed `mask-image` only.** A browser without it drops the declaration and the
    cut-off tab is still the cue, so it does not earn the `-webkit-` copy `::-webkit-scrollbar` does
    (`property-no-vendor-prefix` would have needed an exception for a decoration).
  - **Every card strip shrinks its arrows on a phone**: 36px under 768 (five looks and `models` had
    no phone rule at all) and 32px under 576. The arrow channel is
    `calc(var(--cs-arrow-size) + 0.4em)` a side, so at 320 the slide went **151px → 175px** on the
    six strips that had none, and 167 → 175 on the four that had the 768 rule. Full-bleed patterns
    (hero, the galleries, the lightbox, peek, video) overlay their arrows on the picture and get no
    width back, so they keep 44px rather than trade tap target for nothing.
  - **Ford's cells go back up to the body size on a phone** (`--tab-size-phone: 1em`,
    `--tab-pad-phone: 1.07em 0.36em`). forddemo1 keeps them at 12px all the way down and crushes
    four across a 320 screen at 70px each; the row scrolls now, so they no longer have to fit. The
    knob is new and Ford is its only user.
  - **No `--title-gap-phone` or `--tab-row-gap-phone`**, which the plan asked for. Measured at 320
    on all four bars the heading gap is already 10-13px and the row gap 14-20; what makes the bar
    tall on a phone is the platform's own heading class wrapping "View Our Lineup" onto two 32px
    lines, which is the theme's. A knob nothing would be set to is a panel row that teaches nobody
    anything.
  - **`brands.html` scrolled sideways 30px at 320**: the brand tile is a flex row and its badge is
    `flex: none`, so once the logo, gap, badge and padding took 134 of a 144px tile the name held
    its min-content width and pushed the badge out the side. `.bb-tile { flex-wrap: wrap }` -
    wrapping is not shrinking, the badge still never squeezes.
  - Still open: `demo/index.html` scrolls sideways 52px at 320. `.ui-widths` is a 339px inline-flex
    segmented control of six width buttons; the workbench is a desktop tool and its narrowest frame
    button is 390, so nothing there can even show 320. Not fixed, not in the phone pass's scope.
  - The three new checks in `tests/layout.test.mjs` drive the catalogue pages at a real 320 viewport
    rather than the builder frame, for the same reason: the builder cannot go below 390. Each was
    run against the code before it - the sideways check failed on brands at 30px, the wrap check on
    nine bar/width pairs, the arrow check on eight strips at 36px.
- Rows: "Two-row grid" was a rail entry that was the model bar with `pairUp: true` and a two-rung
  ladder, so "can I have two rows" meant leaving the chosen pattern and losing its settings.
- Lightbox: the one pattern whose point is covering the page demonstrated itself inside a box until
  `openOverlay()`.
- Video: both video patterns shipped a placeholder div and a comment, so the address had to be typed
  into the pasted markup by hand.
- Looks/patterns collapse: a first pass dropped ten patterns along with the looks and they had to be
  restored.
- Code parity: with the frame at 750, editing "992 and up" changed nothing visible until the
  `--cs-per-view` pin. The previous demo hand-wrote recipes beside the live examples and needed
  `check-recipes.mjs` (deleted) to catch the drift.
- `rem`: card names rendered 10px where the demo showed 16; the reserved dot row fell to 25px
  against a 24px dot hit box.
- Box model (fixed 2026-09-08): the frame simulated `html { font-size: 10px }` but not
  `* { box-sizing: border-box }` (verified in `bootstrap@3.4.1` `dist/css/bootstrap.css` line 1069,
  `*:before, *:after` on the next line). Measured at Desktop before the fix, seven patterns had
  cards hanging out of their slides: `reviews` by 37px (out of the frame, cut by
  `html{overflow:hidden}`), `stock` 30.78, `locations` 17.5; `cards`, `mixed` and `service` by
  exactly their two 1px borders — why a bottom border was missing and reappeared on scroll.
  `hostHtml()` lacked both rules too, so paste-parity compared two documents consistently wrong
  together.
- Fill (fixed 2026-09-08): Fill only widened the frame, the container rules held the slider at
  1170px, so Fill and Desktop drew the same picture.
- Generated-CSS lint: about 15 KB of card/pattern rules live in template literals.
- `npm test` origin: the spec listed a test framework as a non-goal, which held while the engine was
  the only thing shipping. Three findings — F003 (`--cs-gap: 0px` surviving the platform minifier as
  unitless `0`), F022 (a cleared field emitting `--cs-gap: ;`), F028 (a typed `10`) — were the same
  broken slider reached three ways; only the third was caught by a person. The suite ran ~50 s then;
  `recipes` caught one recipe being wrong before it shipped. A 21-pattern sweep at every width took
  minutes and was dropped. The `engine` checks were manual checklist steps before; the `install`
  name/bytes check exists because the Download button once saved minified code under the readable
  name.
- Two entry points: the old split was `Slider` in source, `DLCarousel` on the page.
- Engine linked: `docs/cms-no-hosting.md` and `scripts/paste.mjs` were the escape hatch written when
  nothing was hosted; both deleted 2026-09-08 once the four files went up, and because the script
  emitted code onto live dealer pages with no test.
- Folders: `Advanced` and `Tab names` used to start closed, remembered in
  `localStorage['cs-folders']` (gone — a stale entry would re-collapse a folder that no longer has a
  toggle). Tweakpane's own click listener is registered first, which is why a same-element capture
  listener cannot beat it.
- 2026-09-02 readiness review: `.name.cs` measured with the sheets swapped — service cards went from
  347.6px at three per view to 1070.8px at one. `:where()`: with the shared sheet first the
  designer's colour won, with theirs first it was silently ignored; `weaken()` costs 26 B gzip in
  the cards half; weakening the whole-selector rule reverted the tall tile's `--cs-arrow-bg` to the
  engine's dark value (dark arrow on a dark strip); all seven card styles proved pixel-identical
  across three widths before and after. Shared names: the first strip took the second's 3em gap. Six
  knobs caught lying at once (F039–F077). The `if (!stage) return` TDZ trap was caught once by the
  gate.
- `scroll-behavior: auto` (2026-09-08): on a host with `* { scroll-behavior: smooth }` instant sat
  at 0 after a frame and crawled to 590px over ~700ms; declaring `auto` restores per-call control
  for 5 B gzip (instant lands in one frame, explicit smooth still animates).
- `.cs-track::-webkit-scrollbar`: looks like 20 free bytes; `scrollbar-width` support is Chrome 121
  / Firefox 64 / Safari 18.2 but `webview_android: false`.
- Fade shipped 2026-08-18.
- Byte-budget anchor: merging two duplicate rules once made the CSS bigger because it separated a
  selector from its sibling.
- `_commit()` optimistic UI: without it dots/tabs/status moved ~900 ms after a click, when the
  scroll settled.
