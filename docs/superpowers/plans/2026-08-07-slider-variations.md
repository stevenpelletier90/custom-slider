# Slider Variations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved 2026-08-07 slider-variations spec: a `data-step="slide"` engine option, a Chrome-cutout model bar, whole-card-clickable Featured Vehicles, a faded-peek section, a mixed-image-sizes section, and a stock/base section + TOC on the demo page.

**Architecture:** The engine stays a frozen contract — every variation is authored HTML + site CSS on `demo/index.html`. The single engine change (Task 1) is additive: `next()`/`prev()`/`_updateArrows()` generalize from the page-start list to a "stops" list (page starts, or every reachable index in slide mode). Dots remain per-page everywhere.

**Tech Stack:** Vanilla JS/CSS, esbuild (`npm run build`), no test framework — verification is `npm run validate`, `npm run size`, and the README browser checklist.

## Global Constraints

- Byte budget: `npm run size` must stay **under 6144 B** gzip for dist JS+CSS combined; measure, never estimate (gzip locality lies).
- The HTML contract is frozen: **adding** attributes/classes is allowed; renaming or repurposing is not.
- Rebuild and commit `dist/` **in the same commit** whenever `src/` changes.
- Never: CSS `scroll-behavior` on the track; `inert`/`aria-hidden` on off-screen cards; Chromium-only platform features; `scroll-snap-stop: always`; live region on the track; engine-injected slide content; `scrollIntoView()` on thumbs.
- Formatting: Prettier `printWidth: 200`, single quotes JS / double CSS; the PostToolUse hook auto-fixes, `npm run validate` is the gate before every commit.
- Git: stage **explicit paths only** (never `git add -A`/`.`); imperative single-line commit subjects matching `git log --oneline`; work on master.
- Demo images: `width`/`height` attributes always; below-the-fold images `loading="lazy" decoding="async"`; `sizes` sized to ONE slide's rendered width.
- All new interactive styling: visible focus ring (inset when inside the clipping track), hover effects gated behind `@media (prefers-reduced-motion: no-preference)` when they animate.

---

### Task 1: Engine `data-step="slide"` option

**Files:**

- Modify: `src/dl-carousel.js` (DEFAULTS ~line 23, `_parseOptions` ~line 101, `_currentPage`/`_pages` area ~line 233, `next`/`prev` ~line 283, `_updateArrows` ~line 373)
- Modify: `README.md` (options table, engine-swap contract list)
- Modify: `CLAUDE.md` ("Pages, not slides" paragraph)
- Modify (generated): `dist/dl-carousel.js`, `dist/dl-carousel.css`

**Interfaces:**

- Produces: `opts.step` (`'page'` default | `'slide'`), data attribute `data-step="slide"`, internal `_stops()` and `_nearest(arr)` helpers. Task 3's demo markup consumes `data-step="slide"`.

- [ ] **Step 1: Add the option to DEFAULTS and `_parseOptions`**

In `DEFAULTS`, after `rewind: true,`:

```js
  step: 'page', // 'slide' advances one card per arrow/autoplay tick (dealer model-bar feel); dots stay per-page either way
```

In `_parseOptions`, after the `d.rewind` line:

```js
if (d.step !== undefined) data.step = d.step === 'slide' ? 'slide' : 'page';
```

- [ ] **Step 2: Generalize navigation over a stops list**

Replace `_currentPage()` with a `_nearest` helper plus the two list builders (keep `_pages()` unchanged):

```js
  _stops() {
    // What the arrows step through: page starts (default), or every reachable
    // start index in slide mode (the last start is clamped like _pages does).
    if (this.opts.step !== 'slide') return this._pages();
    const last = Math.max(0, this.slides.length - this.perView);
    return Array.from({ length: last + 1 }, (_, i) => i);
  }

  _nearest(arr) {
    const ref = this._target ?? this.current;
    let best = 0;
    arr.forEach((s, i) => {
      if (Math.abs(s - ref) < Math.abs(arr[best] - ref)) best = i;
    });
    return best;
  }

  _currentPage() {
    return this._nearest(this._pages());
  }
```

Replace the bodies of `next()`, `prev()`, and `_updateArrows()` to use `_stops()`:

```js
  next() {
    const p = this._stops(),
      c = this._nearest(p);
    if (c >= p.length - 1) {
      if (this.opts.rewind) this.goTo(0); // rewind past the end
      return;
    }
    this.goTo(p[c + 1]);
  }

  prev() {
    const p = this._stops(),
      c = this._nearest(p);
    if (c <= 0) {
      if (this.opts.rewind) this.goTo(p[p.length - 1]); // rewind before the start
      return;
    }
    this.goTo(p[c - 1]);
  }
```

```js
  _updateArrows() {
    if (this.opts.rewind) return; // wrapping arrows never disable
    const p = this._stops(),
      c = this._nearest(p);
    setDisabled(this.prevBtn, c <= 0);
    setDisabled(this.nextBtn, c >= p.length - 1);
  }
```

Dots (`_rebuildDots`/`_updateDots`), `_commit`'s `page:` payload, and `goTo` are untouched — pages stay the dot/status model.

- [ ] **Step 3: Build, measure, validate**

Run: `npm run size` (builds first). Expected: PASS, total under 6144 B — record the new number. Then `npm run validate`. Expected: clean.

- [ ] **Step 4: Manual behavior check**

Run `npm run serve`; on `http://127.0.0.1:8137/demo/` open DevTools console:
`document.querySelector('.demo-vehicles')._dlCarousel.opts.step` → `'page'` (default unchanged); arrows on every existing section behave exactly as before. Temporarily set `data-step="slide"` on the vehicles carousel in DevTools Elements + re-init is NOT needed — instead verify via a scratch construction: `new DLCarousel(Object.assign(document.querySelector('.demo-vehicles'),{}),{})` is invasive, so just trust Task 3's real consumer + the default-path check here.

- [ ] **Step 5: Update docs**

README options table, after the `rewind` row:

```markdown
| `step` | `data-step="slide"` | `"page"` | `"slide"` advances one card per arrow click / autoplay tick instead of a full page; dots still represent pages |
```

README "Swapping the engine later" item 2: add `data-step` to the honored-attribute list (`data-autoplay`, `data-rewind`, `data-step`, `data-gallery`, …).

CLAUDE.md "Pages, not slides." paragraph: append: `data-step="slide"` switches arrows/autoplay to one-card steps (dots stay per-page); per-view remains CSS-only.

- [ ] **Step 6: Commit**

```bash
git add src/dl-carousel.js dist/dl-carousel.js dist/dl-carousel.css README.md CLAUDE.md
git commit -m "Add data-step=slide: arrows advance one card at a time"
```

---

### Task 2: Chevrolet model bar section (assets + markup + CSS)

**Files:**

- Create: `demo/img/chrome-silverado-1500.png` (+7 more models, each with a `-640` variant — 16 PNGs)
- Modify: `demo/img/CREDITS.md`, `demo/index.html`

**Interfaces:**

- Consumes: `data-step="slide"` from Task 1.
- Produces: section `id="modelbar"` (Task 6's TOC links to it), classes `demo-modelbar`, `demo-modelbar-card`.

- [ ] **Step 1: Download the Chrome cutouts**

The 8 models and their source URLs on `https://www.karlchevrolet.com` (harvested from its public `/model-research.html`; swap the size segment `320`→`640` for the retina variant — availability of both sizes already verified by HEAD probe):

| Local name (`demo/img/chrome-<x>.png`) | 320 path                                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| silverado-1500                         | `/assets/stock/ColorMatched_01/Transparent/320/cc_2026CHT27_01_320/cc_2026CHT272005325_01_320_GXD.png` |
| colorado                               | `/assets/stock/ColorMatched_01/Transparent/320/cc_2025CHT35_01_320/cc_2025CHT351988091_01_320_GAL.png` |
| tahoe                                  | `/assets/stock/ColorMatched_01/Transparent/320/cc_2025CHS11_01_320/cc_2025CHS111993882_01_320_GAZ.png` |
| suburban                               | `/assets/stock/ColorMatched_01/Transparent/320/cc_2025CHS27_01_320/cc_2025CHS272072222_01_320_G6M.png` |
| traverse                               | `/assets/stock/ColorMatched_01/Transparent/320/cc_2025CHS29_01_320/cc_2025CHS292054976_01_320_GXD.png` |
| equinox                                | `/assets/stock/ColorMatched_01/Transparent/320/cc_2025CHS15_01_320/cc_2025CHS152039753_01_320_G1W.png` |
| trailblazer                            | `/assets/stock/ColorMatched_01/Transparent/320/cc_2025CHS08_01_320/cc_2025CHS081951446_01_320_GKN.png` |
| trax                                   | `/assets/stock/ColorMatched_01/Transparent/320/cc_2025CHS32_01_320/cc_2025CHS321968848_01_320_GB0.png` |

Download each 320 file to `demo/img/chrome-<name>.png` and its 640 sibling (replace both `320` path segments AND the `_320` filename tokens with `640`) to `demo/img/chrome-<name>-640.png` with a PowerShell loop over the table. After download, print each file's pixel dimensions (`Add-Type -AssemblyName System.Drawing; [System.Drawing.Image]::FromFile(...)` → `.Width`/`.Height`) and byte size.

- [ ] **Step 2: Spot-check the images**

View at least 2 of the 16 with the Read tool (they render visually): confirm transparent-background front-left cutouts, no watermark, correct model. Note the real 320-file dimensions — the `width`/`height` attributes in Step 4 must be the measured values (expected ≈320×240; if a file's height differs, use its own numbers).

- [ ] **Step 3: Update CREDITS.md**

Append:

```markdown
## Chrome model cutouts

`chrome-*.png` are ChromeData (JD Power) licensed library renders served through
the DealerOn platform (Chrome Photo Builder, angle 1, transparent PNG at 320/640),
fetched from a live DealerOn storefront. Internal demo use for DealerOn team
presentation; on a production DealerOn site reference them with
`#CHROMEPHOTOPATH|StyleID|1|640p#` instead of copying files.
```

- [ ] **Step 4: Add the section markup**

In `demo/index.html`, after the `demo-models-section` section, add (all 8 slides follow the first's shape — model name, href slug, file, alt year: Silverado 1500 is 2026, all others 2025; `width`/`height` = measured Step 2 values):

```html
<section class="demo-section demo-modelbar-section demo-wide" id="modelbar">
  <h2 id="modelbar-h">Chevrolet model bar</h2>
  <div class="dl-carousel demo-modelbar" data-slider data-step="slide" aria-labelledby="modelbar-h">
    <ul class="dl-carousel-track">
      <li class="dl-carousel-slide">
        <a class="demo-modelbar-card" href="#silverado-1500" aria-label="Explore the Silverado 1500">
          <img
            src="img/chrome-silverado-1500.png"
            srcset="img/chrome-silverado-1500.png 320w, img/chrome-silverado-1500-640.png 640w"
            sizes="(min-width: 1024px) 250px, (min-width: 640px) 30vw, 45vw"
            width="320"
            height="240"
            alt="2026 Chevrolet Silverado 1500"
            loading="lazy"
            decoding="async"
          />
          <p>Silverado 1500</p>
        </a>
      </li>
      <!-- colorado, tahoe, suburban, traverse, equinox, trailblazer, trax — same shape -->
    </ul>
  </div>
  <details>
    <summary>How this variant is built</summary>
    <p>
      The dealer "model bar": <code>data-step="slide"</code> advances one card per arrow click (the slick <code>slidesToScroll: 1</code> feel), the whole card is the link, dots are hidden with site
      CSS (arrows + swipe remain — matching every production model bar we sampled). Images are ChromeData cutouts from the Chrome Photo Builder (angle 1, transparent PNG); on a DealerOn site reference
      them as <code>#CHROMEPHOTOPATH|StyleID|1|640p#</code> and re-theme with <code>--dlc-*</code> per OEM.
    </p>
  </details>
</section>
```

- [ ] **Step 5: Add the section CSS**

In the demo `<style>` block, after the `.demo-model-card:focus-visible` rule:

```css
/* Model bar — dealer-style strip of cutouts: one card per arrow step
   (data-step="slide"), whole card is the link, dots hidden (arrows +
   swipe remain), gutter arrows like the other sections. */
.demo-modelbar {
  --dlc-per-view: 2;
  --dlc-gap: 0.5rem;
  --dlc-controls-space: 0px; /* keep the unit — unitless 0 breaks the arrow-centering calc */
  --dlc-arrow-bg: transparent;
  --dlc-arrow-fg: #262626;
  padding-inline: calc(var(--dlc-arrow-size) + 0.25rem);
}
@media (min-width: 640px) {
  .demo-modelbar {
    --dlc-per-view: 3;
  }
}
@media (min-width: 1024px) {
  .demo-modelbar {
    --dlc-per-view: 5;
  }
}
.demo-modelbar .dl-carousel-dots {
  display: none;
}
.demo-modelbar .dl-carousel-arrow--prev {
  inset-inline-start: 0;
}
.demo-modelbar .dl-carousel-arrow--next {
  inset-inline-end: 0;
}
.demo-modelbar-card {
  display: block;
  color: #262626;
  text-align: center;
  text-decoration: none;
}
.demo-modelbar-card img {
  inline-size: 100%;
  block-size: auto;
}
.demo-modelbar-card p {
  margin: 0;
  font-weight: 600;
}
.demo-modelbar-card:hover img,
.demo-modelbar-card:focus-visible img {
  transform: scale(1.05);
}
@media (prefers-reduced-motion: no-preference) {
  .demo-modelbar-card img {
    transition: transform 0.3s ease-out;
  }
}
/* inset ring — the track clips anything drawn outside the slide */
.demo-modelbar-card:focus-visible {
  outline: 3px solid var(--dlc-focus);
  outline-offset: -3px;
}
```

- [ ] **Step 6: Verify in the browser**

`npm run serve` → at 1280px: 5 cutouts per view, one card per arrow click, wrap at the ends, no dots, hover zoom (and none under emulated reduced motion); at 640/375: 3/2 per view; Tab reaches each card with a visible inset ring; swipe still works.

- [ ] **Step 7: Validate and commit**

`npm run validate` → clean.

```bash
git add demo/index.html demo/img/CREDITS.md demo/img/chrome-silverado-1500.png demo/img/chrome-silverado-1500-640.png demo/img/chrome-colorado.png demo/img/chrome-colorado-640.png demo/img/chrome-tahoe.png demo/img/chrome-tahoe-640.png demo/img/chrome-suburban.png demo/img/chrome-suburban-640.png demo/img/chrome-traverse.png demo/img/chrome-traverse-640.png demo/img/chrome-equinox.png demo/img/chrome-equinox-640.png demo/img/chrome-trailblazer.png demo/img/chrome-trailblazer-640.png demo/img/chrome-trax.png demo/img/chrome-trax-640.png
git commit -m "Add Chevrolet model bar demo (Chrome Photo Builder cutouts, data-step=slide)"
```

---

### Task 3: Featured Vehicles — whole card clickable

**Files:**

- Modify: `demo/index.html` (CSS block + the vehicles `<details>` copy)

**Interfaces:** none new — pure CSS on the existing section.

- [ ] **Step 1: Add the stretched-link CSS**

After the `.demo-card-body a` rule (`~line 127`):

```css
/* Whole card clickable (stretched link): the existing "View details" link
   grows an ::after over the card. Its focus ring moves to the card box —
   drawn inset because the track clips outset rings (WCAG 2.4.7 kept). */
.demo-vehicles .demo-card-body a::after {
  content: '';
  position: absolute;
  inset: 0;
}
.demo-vehicles .demo-card-body a:focus-visible {
  outline: none;
}
.demo-vehicles .demo-card-body a:focus-visible::after {
  outline: 3px solid var(--dlc-focus);
  outline-offset: -3px;
}
```

- [ ] **Step 2: Document it in the section's details block**

Add to the vehicles `<details>` (after the `srcset` paragraph):

```html
<p>
  The whole card is clickable via a stretched link: the card's "View details" <code>&lt;a&gt;</code> carries an <code>::after</code> covering the card (<code>position: absolute; inset: 0</code> on a
  <code>position: relative</code> card). Keep the link's <code>aria-label</code> short — it is the card's accessible name.
</p>
```

- [ ] **Step 3: Verify in the browser**

Click anywhere on a vehicle photo → navigates to the `#vehicle-n` href; text in the overlay is behind the link (expected with stretched links); Tab to a card link → full-card inset ring visible; swipe/drag on touch emulation still scrolls without navigating (native scroll never fires the click).

- [ ] **Step 4: Validate and commit**

`npm run validate` → clean.

```bash
git add demo/index.html
git commit -m "Make the whole Featured Vehicles card clickable (stretched link)"
```

---

### Task 4: Faded peek section

**Files:**

- Modify: `demo/index.html` (new section + CSS; reuses `img/photo-*.jpg` — no new images)

**Interfaces:**

- Produces: section `id="peek"`, class `demo-peek` (Task 6's TOC links to it).

- [ ] **Step 1: Add the section CSS**

```css
/* Faded peek — a sliver of the neighboring slides shows at each edge
   (--dlc-peek, stock engine knob) and fades out via a mask on the track:
   same technique the gallery thumb strip uses. At the ends the fade covers
   empty peek padding, so nothing readable is ever lost. Pure CSS, no JS. */
.demo-peek {
  --dlc-per-view: 1;
  --dlc-peek: 12vw;
  --dlc-arrow-bg: transparent;
  --dlc-arrow-fg: #262626;
  padding-inline: calc(var(--dlc-arrow-size) + 0.25rem);
}
@media (min-width: 1024px) {
  .demo-peek {
    --dlc-per-view: 2;
    --dlc-peek: 6rem;
  }
}
.demo-peek .dl-carousel-arrow--prev {
  inset-inline-start: 0;
}
.demo-peek .dl-carousel-arrow--next {
  inset-inline-end: 0;
}
.demo-peek .dl-carousel-track {
  mask-image: linear-gradient(to right, transparent, #000 var(--dlc-peek), #000 calc(100% - var(--dlc-peek)), transparent);
}
.demo-peek img {
  border-radius: 8px;
}
```

- [ ] **Step 2: Add the section markup** (after the model bar section; alts copied from the gallery slides, all lazy — below the fold)

```html
<section class="demo-section demo-wide" id="peek">
  <h2 id="peek-h">Faded peek</h2>
  <div class="dl-carousel demo-peek" data-slider aria-labelledby="peek-h">
    <ul class="dl-carousel-track">
      <li class="dl-carousel-slide"><img src="img/photo-1.jpg" width="1200" height="750" alt="Blue Chevrolet Camaro in the desert at dusk" loading="lazy" decoding="async" /></li>
      <li class="dl-carousel-slide"><img src="img/photo-2.jpg" width="1200" height="750" alt="White Ford Mustang in a neon-lit parking garage" loading="lazy" decoding="async" /></li>
      <li class="dl-carousel-slide"><img src="img/photo-3.jpg" width="1200" height="750" alt="Hands on the steering wheel at dusk" loading="lazy" decoding="async" /></li>
      <li class="dl-carousel-slide"><img src="img/photo-4.jpg" width="1200" height="750" alt="Audi R8 tail lights on a city street at sunset" loading="lazy" decoding="async" /></li>
      <li class="dl-carousel-slide"><img src="img/photo-5.jpg" width="1200" height="750" alt="Technician topping up engine oil" loading="lazy" decoding="async" /></li>
      <li class="dl-carousel-slide"><img src="img/photo-6.jpg" width="1200" height="750" alt="Classic BMW grilles lined up in a museum" loading="lazy" decoding="async" /></li>
    </ul>
  </div>
  <details>
    <summary>How this variant is built</summary>
    <p>
      Two stock knobs and one mask: <code>--dlc-peek</code> (engine CSS — pads the track and shifts the snap points so a sliver of each neighbor stays visible) plus a <code>mask-image</code> gradient
      on the track whose fade width equals the peek. No page script, no engine changes, safe under reduced motion.
    </p>
  </details>
</section>
```

- [ ] **Step 3: Verify in the browser**

Mid-strip: both edges show a faded sliver of the neighboring photos; at slide 1 the left edge shows only faded-out padding (no content loss); arrows sit in the gutters un-faded; dots work; keyboard: the track takes a tab stop (no links in slides) with a visible ring, arrow keys scroll it.

- [ ] **Step 4: Validate and commit**

`npm run validate` → clean.

```bash
git add demo/index.html
git commit -m "Add faded peek demo section (peek knob + track mask)"
```

---

### Task 5: Mixed image sizes section

**Files:**

- Create: `demo/img/mixed-1.jpg` … `mixed-5.jpg` (crops of the existing vehicle photos; `vehicle-6.jpg` reused as-is for the sixth card)
- Modify: `demo/index.html`, `demo/img/CREDITS.md`

**Interfaces:**

- Produces: section `id="mixed"`, class `demo-mixed`.

- [ ] **Step 1: Generate deliberately mismatched derivatives**

Run from the repo root (scratchpad script is fine — the images are the deliverable, the script is not committed). All crops fit inside the 800×500 sources:

```powershell
Add-Type -AssemblyName System.Drawing
function Crop($in, $out, $x, $y, $w, $h) {
  $img = [System.Drawing.Image]::FromFile((Resolve-Path $in))
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.DrawImage($img, (New-Object System.Drawing.Rectangle(0, 0, $w, $h)), (New-Object System.Drawing.Rectangle($x, $y, $w, $h)), [System.Drawing.GraphicsUnit]::Pixel)
  $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
  $p = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $p.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]78)
  $bmp.Save($out, $enc, $p); $g.Dispose(); $bmp.Dispose(); $img.Dispose()
}
Crop 'demo/img/vehicle-1.jpg' 'demo/img/mixed-1.jpg' 150 0 500 500
Crop 'demo/img/vehicle-2.jpg' 'demo/img/mixed-2.jpg' 200 0 375 500
Crop 'demo/img/vehicle-3.jpg' 'demo/img/mixed-3.jpg' 0 75 800 350
Crop 'demo/img/vehicle-4.jpg' 'demo/img/mixed-4.jpg' 80 10 640 480
Crop 'demo/img/vehicle-5.jpg' 'demo/img/mixed-5.jpg' 250 0 300 500
```

- [ ] **Step 2: Spot-check the crops**

View `mixed-2.jpg` and `mixed-3.jpg` with the Read tool: sensible framing (car not amputated), correct dimensions, small file sizes (each well under its source). CREDITS.md: append `` `mixed-*.jpg` are crops of the `vehicle-*.jpg` files above (same Unsplash sources). ``

- [ ] **Step 3: Add the section CSS**

```css
/* Mixed image sizes — the default card recipe is indifferent to source
   dimensions: a fixed aspect-ratio box + object-fit: cover normalizes
   whatever the CMS user uploads (use contain for cutouts/logos). */
.demo-mixed {
  --dlc-per-view: 1;
  --dlc-arrow-bg: transparent;
  --dlc-arrow-fg: #262626;
  padding-inline: calc(var(--dlc-arrow-size) + 0.25rem);
}
@media (min-width: 640px) {
  .demo-mixed {
    --dlc-per-view: 2;
  }
}
@media (min-width: 1024px) {
  .demo-mixed {
    --dlc-per-view: 3;
  }
}
.demo-mixed .dl-carousel-arrow--prev {
  inset-inline-start: 0;
}
.demo-mixed .dl-carousel-arrow--next {
  inset-inline-end: 0;
}
.demo-mixed .demo-card img {
  aspect-ratio: 4 / 3;
  inline-size: 100%;
  block-size: auto;
  object-fit: cover;
}
```

- [ ] **Step 4: Add the section markup** (after the peek section; each caption states the ragged source size — that's the demonstration)

```html
<section class="demo-section demo-wide" id="mixed">
  <h2 id="mixed-h">Mixed image sizes</h2>
  <div class="dl-carousel demo-mixed" data-slider aria-labelledby="mixed-h">
    <ul class="dl-carousel-track">
      <li class="dl-carousel-slide">
        <article class="demo-card">
          <img src="img/mixed-1.jpg" width="500" height="500" alt="Black Porsche Panamera, square crop" loading="lazy" decoding="async" />
          <h3>500 × 500 source</h3>
          <p>Square upload — cover-cropped to 4:3.</p>
        </article>
      </li>
      <li class="dl-carousel-slide">
        <article class="demo-card">
          <img src="img/mixed-2.jpg" width="375" height="500" alt="Blue BMW 4 Series coupe, portrait crop" loading="lazy" decoding="async" />
          <h3>375 × 500 source</h3>
          <p>Portrait upload — same rendered box.</p>
        </article>
      </li>
      <li class="dl-carousel-slide">
        <article class="demo-card">
          <img src="img/mixed-3.jpg" width="800" height="350" alt="White Ford Expedition on a desert road, wide crop" loading="lazy" decoding="async" />
          <h3>800 × 350 source</h3>
          <p>Wide banner upload — same rendered box.</p>
        </article>
      </li>
      <li class="dl-carousel-slide">
        <article class="demo-card">
          <img src="img/mixed-4.jpg" width="640" height="480" alt="White Honda CR-V near snowy mountains, 4:3 crop" loading="lazy" decoding="async" />
          <h3>640 × 480 source</h3>
          <p>Already 4:3 — renders untouched.</p>
        </article>
      </li>
      <li class="dl-carousel-slide">
        <article class="demo-card">
          <img src="img/mixed-5.jpg" width="300" height="500" alt="White Nissan GT-R, tall narrow crop" loading="lazy" decoding="async" />
          <h3>300 × 500 source</h3>
          <p>Tall narrow upload — same rendered box.</p>
        </article>
      </li>
      <li class="dl-carousel-slide">
        <article class="demo-card">
          <img src="img/vehicle-6.jpg" width="800" height="500" alt="Light blue Fiat 500 parked beside a stone building" loading="lazy" decoding="async" />
          <h3>800 × 500 source</h3>
          <p>Standard landscape upload.</p>
        </article>
      </li>
    </ul>
  </div>
  <details>
    <summary>The recipe (why nothing here breaks)</summary>
    <p>
      Every card image gets <code>aspect-ratio: 4 / 3; inline-size: 100%; object-fit: cover;</code> — the box is fixed, the source fills it, and any upload dimensions render identically. Keep real
      <code>width</code>/<code>height</code> attributes (CLS stays 0) and prefer uniform assets anyway: cover-cropping costs edges, and consistent art always looks better than rescued art. Use
      <code>object-fit: contain</code> instead for cutouts and logos.
    </p>
  </details>
</section>
```

- [ ] **Step 5: Verify in the browser**

All six cards render identical 4:3 boxes at every breakpoint; no layout shift while lazy images arrive (width/height honored); captions match the actual file dims.

- [ ] **Step 6: Validate and commit**

`npm run validate` → clean.

```bash
git add demo/index.html demo/img/CREDITS.md demo/img/mixed-1.jpg demo/img/mixed-2.jpg demo/img/mixed-3.jpg demo/img/mixed-4.jpg demo/img/mixed-5.jpg
git commit -m "Add mixed image sizes demo section (aspect-box cover recipe)"
```

---

### Task 6: Stock/base section, TOC, README pointer, spec status

**Files:**

- Modify: `demo/index.html`, `README.md`, `docs/superpowers/specs/2026-08-07-slider-variations-design.md`

**Interfaces:**

- Consumes: section ids `modelbar`, `peek`, `mixed` from Tasks 2/4/5; adds ids `vehicles`, `models`, `gallery`, `reviews`, `stock` to the existing sections.

- [ ] **Step 1: Add ids to existing sections**

`<section class="demo-section demo-wide" id="vehicles">`, `…demo-models-section demo-wide" id="models">`, `…demo-section" id="gallery">`, `…demo-section" id="reviews">`.

- [ ] **Step 2: Add the TOC nav** (directly under the intro `<p>`)

```html
<nav class="demo-toc" aria-label="On this page">
  <a href="#vehicles">Featured vehicles</a> · <a href="#modelbar">Model bar</a> · <a href="#models">Model cards</a> · <a href="#peek">Faded peek</a> · <a href="#mixed">Mixed image sizes</a> ·
  <a href="#gallery">Gallery</a> · <a href="#reviews">Reviews</a> · <a href="#stock">Stock look</a>
</nav>
```

CSS: `.demo-toc { margin-block: 1rem; } .demo-toc a { color: #1a5fb4; }`

- [ ] **Step 3: Add the stock section** (after reviews, before the footer)

```html
<section class="demo-section" id="stock">
  <h2 id="stock-h">Stock look — the base</h2>
  <p>Everything above is site CSS over this. Untouched engine defaults: overlaid dark arrows, per-page dots in reserved space (CLS 0), snap scrolling.</p>
  <div class="dl-carousel" data-slider aria-labelledby="stock-h">
    <ul class="dl-carousel-track">
      <li class="dl-carousel-slide">
        <article class="demo-card">
          <h3>Default controls</h3>
          <p>Arrows overlay the content edges; dots live in space the CSS reserved before JS ran.</p>
        </article>
      </li>
      <li class="dl-carousel-slide">
        <article class="demo-card">
          <h3>One knob per look</h3>
          <p>Every visual above this section is <code>--dlc-*</code> custom properties and plain site CSS.</p>
        </article>
      </li>
      <li class="dl-carousel-slide">
        <article class="demo-card">
          <h3>Works without JS</h3>
          <p>The track is a native scroll-snap container — disable JavaScript and it still swipes.</p>
        </article>
      </li>
      <li class="dl-carousel-slide">
        <article class="demo-card">
          <h3>Start here</h3>
          <p>Copy the markup below, add <code>--dlc-per-view</code> breakpoints, then restyle.</p>
        </article>
      </li>
    </ul>
  </div>
  <details>
    <summary>Copy-paste HTML — the base for every variation</summary>
    <pre><code>&lt;link rel="stylesheet" href="dl-carousel.css"&gt;
&lt;script src="dl-carousel.js" defer&gt;&lt;/script&gt;

&lt;div class="dl-carousel my-slider" data-slider aria-label="Describe the strip"&gt;
  &lt;ul class="dl-carousel-track"&gt;
    &lt;li class="dl-carousel-slide"&gt;…card content…&lt;/li&gt;
  &lt;/ul&gt;
&lt;/div&gt;</code></pre>
  </details>
</section>
```

- [ ] **Step 4: Add the `data-step` row to the vehicles data-attribute table**

```html
<tr>
  <td><code>data-step="slide"</code></td>
  <td>page</td>
  <td>Arrows/autoplay advance one card at a time (see the model bar)</td>
</tr>
```

- [ ] **Step 5: README pointer + spec status**

README: in the intro (after the "Rewind instead of infinite loop" paragraph) add: `The demo page (demo/index.html) doubles as the variation catalog — every section is a copy-paste recipe over the same two files.`

Spec (`docs/superpowers/specs/2026-08-07-slider-variations-design.md`): change the Status line to `Status: **approved 2026-08-07** (Steven) — decisions: D6 approved; model bar uses Chrome Photo Builder cutouts (Steven's call, supersedes the SVG-silhouette recommendation); packaging = recipes only; D1 confirmed Featured Vehicles only.`

- [ ] **Step 6: Verify, validate, commit**

Browser: every TOC link lands on its section; stock section shows default arrows/dots; keyboard order intact. `npm run validate` → clean.

```bash
git add demo/index.html README.md docs/superpowers/specs/2026-08-07-slider-variations-design.md
git commit -m "Add stock base section and demo TOC; record spec decisions"
```

---

### Task 7: Full verification pass (README checklist)

**Files:** none planned — fixes go where the findings point.

- [ ] **Step 1: `npm run size`** — under budget (dist unchanged since Task 1's number).
- [ ] **Step 2: Lighthouse** on `http://127.0.0.1:8137/demo/` — accessibility 100, CLS 0; performance may dip from added image weight — record the number, investigate only if CLS/a11y regress.
- [ ] **Step 3: Keyboard-only walk** — every carousel: tab order pause → prev → next → dots (where visible) → cards/track; new stops: vehicles stretched links (inset ring), model bar cards (inset ring), peek track (ring), TOC links. No trap, no invisible focus.
- [ ] **Step 4: Reduced-motion emulation** — no hover zoom transitions (model bar), no smooth scrolling, reviews autoplay never starts.
- [ ] **Step 5: Screenshots at 375 / 768 / 1280** — per-view counts: vehicles 1/2/3, model bar 2/3/5, peek 1/1/2, mixed 1/2/3; nothing overflows; arrows never cover card text illegibly.
- [ ] **Step 6: JavaScript disabled** — every strip (including the three new ones) still scrolls and shows all content.
- [ ] **Step 7: `dlc:change` still fires** — console: listener on `.demo-modelbar` logs index increments of 1 per arrow click.
- [ ] **Step 8: Fix anything found** (root cause, not suppression), re-run the affected checks, then commit fixes with explicit paths and a subject describing the fix.
