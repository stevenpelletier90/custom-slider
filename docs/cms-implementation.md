# Putting Custom Slider on a DealerOn site

> **Deployment status lives in ONE place:** the "Deployment status" section of
> [../README.md](../README.md). Short version as of 2026-09-02: the two URLs
> under `/assets/shared/CustomHTMLFiles/Responsive/Apps/customSlider/` answer
> 200 but serve the pre-rename dl-carousel build, so the current engine is not
> deployed yet. The README has the upload steps, the 21-day cache TTL, and the
> rename map. Do not restate a status here — three documents once gave three
> different answers.

> **No hosted files yet?** You do not have to wait — the whole engine can be
> pasted into a page today. See [cms-no-hosting.md](cms-no-hosting.md). Your
> markup and CSS do not change when the hosted files land.

## 1. What ships

Two files, no dependencies, no build step on the site side:

| File                | Gzip   | What it does                                                                                                              |
| ------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| `custom-slider.css` | 3.1 KB | Layout, scroll-snap physics, control styling — **plus** the card styles and column classes (1.4 KB engine + 2.0 KB cards) |
| `custom-slider.js`  | 4.9 KB | Wires controls, state, autoplay, fade, drag                                                                               |

A site downloads 7.8 KB for the pair, which is what the demo masthead prints.
`npm run size` is the authority — these figures come from it and go stale;
re-read them there rather than trusting this table.

Both come from `dist/` in this repo — never from `src/`, which is the readable
source and is not minified.

### Where they go

**Settled: the shared path**, `/assets/shared/CustomHTMLFiles/Responsive/Apps/customSlider/`,
alongside the platform's other shared slider code
(`/assets/shared/CustomHTMLFiles/slick/slick.min.js`). One copy, every site gets
fixes at once — which is the whole point of the frozen HTML contract: the engine
can be replaced underneath every site without touching a single page.

The folder exists and both filenames answer 200 today, serving the pre-rename
build; the upload replaces them in place. See "Deployment status" in
[../README.md](../README.md) for what is on it right now and the steps.

Per-dealer Media Gallery (`#MISCPATH#custom-slider.js`) remains the fallback if a
shared location is ever unavailable, but it pins each site to whatever version it
got and a fix means re-uploading to every one — treat it as temporary.

### How a page loads them

    <link rel="stylesheet" href="/assets/shared/CustomHTMLFiles/Responsive/Apps/customSlider/custom-slider.css">
    <script src="/assets/shared/CustomHTMLFiles/Responsive/Apps/customSlider/custom-slider.js" defer></script>

`defer` matters: the engine auto-initializes on `DOMContentLoaded`, and the CSS
already reserves the control space, so nothing shifts when the JS lands (CLS 0).

### Load it only on pages that use it

The two tags above are cheap (7.8 KB gzip for both files, cached after the
first page), so on a page or template you **know** contains a slider, link them
directly and be done. The question only gets interesting when the natural place
to load the engine is a **sitewide include** — then most pages on the site have
no slider and would pay for the files anyway. For that case, paste this once
into the sitewide Body Section, Bottom (or the footer include) instead of the
two tags:

    <script>
      (function () {
        var boot = function () {
          if (!document.querySelector('.cs')) return;
          var css = document.createElement('link');
          css.rel = 'stylesheet';
          css.href = '/assets/shared/CustomHTMLFiles/Responsive/Apps/customSlider/custom-slider.css';
          // PREPEND, never append: the engine stylesheet carries the default
          // --cs-* values at the same specificity as your recipe CSS, so it
          // must land BEFORE the page's Style Only CSS in the cascade.
          // Appended at the end of <head> it silently overrides every recipe
          // override (--cs-per-view snaps back to 1, peek to 0) — found live
          // on the spelletier test site, 2026-08-20.
          document.head.insertBefore(css, document.head.firstChild);
          var js = document.createElement('script');
          js.src = '/assets/shared/CustomHTMLFiles/Responsive/Apps/customSlider/custom-slider.js';
          document.head.appendChild(js);
        };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
        else boot();
      })();
    </script>

It looks for a `.cs` on the page and injects the stylesheet and script
only if it finds one. Pages with no slider load zero slider bytes.

Injecting the engine this late is fine because its entry point does not blindly
wait for `DOMContentLoaded`: it checks `document.readyState` and initializes
**immediately** when the document has already finished parsing (see
`src/auto.js`). A script tag added after the page loaded therefore still
auto-inits every `[data-cs]` — there is no event it sits waiting for.

**The trade-off is real.** On pages that _do_ have a slider, the CSS now starts
downloading only after the DOM is parsed — one extra round-trip — so the
un-upgraded stacked list can show briefly before the styles land. That is a
small layout shift the direct `<link>` + `defer` approach never has: its CSS
arrives before first paint and reserves the control space, which is why CLS
stays 0.

So: **direct tags on pages and templates known to contain a slider** (CLS 0,
no flash); **the conditional loader for the sitewide-include case**, where it
turns "every page pays 7.8 KB" into "only slider pages pay, slightly later".

### What about autoplay and fade?

There is nothing further to conditionally load. Autoplay and fade are not
separate resources or plugins — both ship inside the same two files
(4.9 KB JS + 3.1 KB CSS gzip, 7.8 KB combined), and both are gated
at runtime:

- Autoplay setup early-returns before creating any timer or observer when
  `data-cs-autoplay` is absent, so a page without it executes essentially none of
  the autoplay code.
- The fade transition CSS applies only under the `data-cs-fade-on` attribute,
  which the engine sets only when a block opts in with `data-cs-fade`. Without it
  the rules never match and the transition is inert.

A page that uses neither pays for neither beyond the bytes already counted
above. The conditional loader is the whole story.

## 2. The markup contract

Everything the engine needs, and nothing it generates for you:

    <div class="cs my-strip" data-cs aria-label="Featured vehicles">
      <ul class="cs-track">
        <li class="cs-slide">…authored content…</li>
        <li class="cs-slide">…authored content…</li>
      </ul>
    </div>

Rules that are not negotiable:

- **The engine never injects slide content.** Every heading, link, and image is
  authored in the block. That is what keeps the content indexable and readable
  with JS off.
- **Never author control markup.** Arrows, dots, the pause button and gallery
  thumbs are all generated. A block containing its own arrows will end up with two sets.
- Give the root an `aria-label` (or `aria-labelledby`). A missing one logs a
  console warning at init.
- Images need `width` and `height` — that is what holds CLS at 0 — with
  `loading="eager"` on what is visible at the narrowest tier (the hero's first
  slide also takes `fetchpriority="high"`) and `loading="lazy"` on everything
  below it. The builder emits this for you; an image inside a hidden tab pane or
  a closed dialog stays lazy, because an eager one there is fetched anyway.

## 3. Where the CSS goes

Per-site styling goes in **Style Only / Head Section (`styleCode`)**, which is
**raw CSS — no `<style>` tags and no comments.** The platform wraps and minifies
it. Do not put slider CSS in the block itself.

### The minifier's rules (live-tested on dealer 26900, 2026-08-20)

The styleCode minifier has two behaviors every recipe must respect:

- **Modern function values inside custom-property declarations fail the whole
  sheet.** `--cs-peek: clamp(32px, 9vw, 60px)` and
  `--cs-arrow-bg: rgb(0 0 0 / 40%)` each kill minification — and the
  storefront then **silently serves the last successfully-minified styleCode**
  (or nothing, if there was none). No error surfaces anywhere; your CSS just
  never appears. The same functions are fine in _normal_ properties
  (`width: clamp(...)`, `color: rgb(0 0 0 / 40%)`, slash-rgb in box-shadows) —
  the failure is specific to `--*:` declarations. Every recipe in the library
  therefore uses plain values and classic `rgba(r, g, b, a)` inside `--cs-*`
  declarations, with media queries instead of `clamp()`.
- **Zero lengths lose their unit** (`0px` → `0`), and a unitless `0` invalidates
  every `calc()` that reads the variable — in **every** browser, Chrome
  included. **Never write a zero length in a `--*` declaration; write `0.1px`.**
  The visible failure is not a stray arrow, it is the strip: `.cs-slide`'s
  `flex: 0 0 calc((100% - (var(--cs-per-view) - 1) * var(--cs-gap)) /
var(--cs-per-view))` falls back to `auto` and every card collapses to its
  content width. Measured 2026-09-02 in the same 750px host, three per view:
  `--cs-gap: 0.1px` gives a 249.9px slide, `--cs-gap: 0` gives 42.0px. Chromium
  and WebKit behave identically — an earlier version of this bullet called
  Chrome "lenient" here, which was wrong, and six patterns shipped `0px` on the
  strength of it. `0.1px` survives minification (it serves as `.1px`).

Also expect **site CSS to outrank recipe classes**: OEM styles commonly set
link decoration at id specificity (`#content-main a`), which beats
`.my-modelbar-card { text-decoration: none }`. If pasted card names come out
underlined, add one page-scoped rule:
`#content-main .my-modelbar-card { text-decoration: none; }`.

## 4. Picking a variation

Every variation is authored HTML plus site CSS over the same two files. The demo
page (`demo/index.html`) is a builder: pick the pattern, set how many are across
at each breakpoint and which card style it wears, and the code panel prints the
markup and CSS for exactly what is on screen. `demo/patterns.html` shows all
seventeen at once; `demo/reference.html` is the API.

| You want                         | Use                                              |
| -------------------------------- | ------------------------------------------------ |
| Rotating homepage banner         | `data-cs-fade` + `data-cs-autoplay="5000"`, 1-up |
| Model bar (cutouts, arrows only) | `data-cs-step="slide"`, dots hidden, `--cs-peek` |
| Model bar grouped by body style  | The above, one instance per tab pane             |
| Vehicle / service / offer cards  | Default page stepping, 1-2-3 per view            |
| Photo gallery with thumbnails    | `data-cs-gallery`                                |

**For a model bar, start from the brand preset.** The OEM demo estate shares one
anatomy and differs only in how many cards are across at each width. Every one of
the 32 brands is a preset in the builder (`demo/assets/brands.js` records each
brand's real slick config verbatim), read at the platform's own Bootstrap 3 tiers
— 768 / 992 / 1200 — rather than at the one-off breakpoints the original agencies
used. Pick the brand rather than re-deriving a ladder by hand.

If you ever do need to convert one yourself, the rule is: **slick's
`breakpoint: N` becomes `min-width: N`.** Not `N + 1`. slick compares
`windowWidth < breakpoint` (a strict `<`), so `breakpoint: 768` applies _below_
768 and the tier above starts at exactly 768. Adding 1 puts the strip one pixel
out of step with the platform's Bootstrap 3 grid (768 / 992 / 1200), and at
768px — iPad portrait — the page goes `md` while the slider is still on its
phone tier. That off-by-one was live in this repo until 2026-08-27.

## 5. Theming per OEM

Override custom properties in `styleCode`. Never edit the engine:

    .my-strip.cs {
      --cs-gap: 1em;
      --cs-peek: 60px;
      --cs-arrow-bg: rgba(11, 42, 74, 1);
      --cs-arrow-fg: #fff;
      --cs-dot-current: #0b2a4a;
    }

**`em`, never `rem`.** `rem` is locked to `<html>`, and Bootstrap 3 — what the
storefronts run — sets `html { font-size: 10px }`, so a `1rem` gap written here
ships at 62.5% of what it looked like. The repo's own linters fail on `rem` for
exactly this reason; the docs used to show it anyway.

**`.my-strip.cs`, not `.my-strip`.** A bare class ties with the engine's own
`.cs` and with the shared `.cargo-*` card styles, so source order decides — and
where the platform emits the aggregated Style Only sheet relative to a head
`<link>` is not documented. Adding `.cs` costs nothing and settles it.

Slides-per-view is not in that block: use the `cs-xs-N` / `cs-sm-N` /
`cs-md-N` / `cs-lg-N` classes on the root, which ship in the stylesheet.

Full list in the README under "CSS custom properties".

## 6. Replacement codes inside slider markup

The slider is ordinary block HTML, so the usual rules apply unchanged:

- **Tokenize dealer identity** — `#NAME#`, `#CITY#`, `#STATE#`, `#CONTACTUS#`
  (wide `#CONTACTUSW|#`, narrow `#CONTACTUSN|#`) — rather than hardcoding it.
- **`%(…)` SEO codes NEVER resolve inside a Custom HTML block.** They work only
  in the platform's own SEO fields. Do not put them in slide copy.
- **Uploaded images:** reference flat as `#MISCPATH#<file>`, never a hardcoded
  `/static/dealer-<id>/…`. Verify the served URL after uploading — subfolder
  behavior is per-dealer. Platform-shared assets
  (`/static/industry-automotive/…`, `/static/brand-<make>/…`) stay literal.
- **Vehicle cutouts for a model bar:** `#CHROMEPHOTOPATH|<StyleID>|<angle>|<size>#`
  — Style IDs from the Chrome Photo Builder. Angle 1 at 640 is what the demo uses.
- **The demo's copy panel already does this for you.** What you paste out of the
  workbench carries platform image paths, not the repo-relative ones the preview
  shows: `/assets/stock/…` (the ChromeData ColorMatched service) for the vehicle
  cutouts, `/static/brand-<make>/…` for the OEM model-bar art. Both are global —
  no dealer id in the path, identical bytes on every dealer domain — so a pasted
  model bar draws its cars with nothing uploaded to that dealer's gallery. Slots
  with no shared equivalent (the demo's photography) come out as
  `#MISCPATH#<file>`: that image is the dealer's to supply. The map lives in
  `demo/assets/cms-paths.js` and is regenerated by
  `node scripts/harvest-cms-paths.mjs`; OEMs rotate model-year art, so re-run it
  when a cutout starts 404ing rather than hand-editing a path.
- **Block storage is Windows-1252**, not Latin-1 — the distinction matters in
  the useful direction: curly quotes, en and em dashes, the ellipsis and the
  bullet are all IN 1252 and can be written literally. An arrow (`→`, U+2192),
  a star (`★`), emoji and non-Latin scripts are not; entity-encode those
  (`&#8594;`). `npm run validate` scans the generated markup and fails on any
  character outside the code page.
- Replacement codes do **not** resolve in hosted WordPress blogs. Use literal
  text there.

## 7. What not to do

- **Do not fork the engine per site.** If a site needs something the engine
  cannot do, that is a request against this repo, not a local copy. A forked
  copy silently opts that site out of every future fix.
- **Do not add slider CSS to the block.** It belongs in `styleCode`.
- **Do not rename the classes or data attributes.** `cs`,
  `-track`, `-slide`, the `data-*` options and the `--cs-*` properties are a
  frozen contract precisely so the engine can be swapped later without editing
  any site.
- **Do not add autoplay to a card strip.** Zero of the 55 OEM model bars
  autoplay. Rotation belongs on the hero and nowhere else.
- **Do not hide slides to "fix" screen-reader counts.** Off-screen cards stay in
  the accessibility tree deliberately.

## 8. After placing a slider

- Everything is Fastly edge-cached — hand out review links cache-busted (`?123`,
  any query value forces a miss), and clear your own browser cache before
  debugging anything "missing".
- Check it with the keyboard: Tab should reach pause → prev → next → dots →
  the cards, and focus should never disappear.
- Check it with JS disabled — the strip must still scroll and every slide must
  still be readable.
- Run the ADA scanner before closing the case.
