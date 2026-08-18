// Generates demo/model-bars.html — the live model-bar library. Every distinct
// breakpoint ladder found in the OEM demo census rendered as a working
// dl-carousel, each with a complete copy-paste pair. Generated so the twelve
// near-identical sections cannot drift; the rendered ladder and the taught
// ladder come from the same row (a hand-edited page got those out of sync
// once — see the seven-agent review notes in the census doc).
//
//   node scripts/build-model-bars.mjs
//
// Commit the output alongside this script. Source of truth for the ladder
// data: docs/research/2026-08-18-oem-demo-slider-census.md.
import fs from 'node:fs';

const VARIANTS = [
  {
    key: 'acura',
    toc: 'Acura',
    sites: 13,
    demos: 'acura 1-3, ford 2-3, gmc 1-2, honda 2-3, kia 2-3, mitsubishi 1-2',
    ladder: [
      [0, 2],
      [461, 3],
      [769, 5],
    ],
    dots: false,
    why: 'The most common ladder in the estate.',
  },
  {
    key: 'chevrolet',
    toc: 'Chevrolet',
    sites: 11,
    demos: 'cadillac 1-3, chevrolet 1-3, subaru 1-3, volvo 1-2',
    ladder: [
      [0, 2],
      [540, 3],
      [992, 4],
      [1200, 5],
    ],
    dots: false,
    why: 'The GM ladder — an extra rung smooths the climb to five-up.',
  },
  {
    key: 'lexus',
    toc: 'Lexus',
    sites: 6,
    demos: 'lexus 1-3, nissan 2-3, toyota 1',
    ladder: [
      [0, 1],
      [401, 2],
      [601, 3],
      [992, 5],
    ],
    dots: false,
    why: 'Drops to a single card on the narrowest phones.',
  },
  {
    key: 'buick',
    toc: 'Buick',
    sites: 5,
    demos: 'buick 1-2, jaguar 1, landrover 1, landrover 3',
    ladder: [
      [0, 2],
      [461, 3],
      [769, 4],
    ],
    dots: false,
    why: 'Four-up ceiling — roomier cards than the five-up brands.',
  },
  {
    key: 'genesis',
    toc: 'Genesis',
    sites: 5,
    demos: 'genesis 1-3, vw 1-2',
    ladder: [
      [0, 1],
      [541, 2],
      [993, 3],
      [1201, 4],
    ],
    dots: false,
    why: 'A gentle four-step climb, one card at a time.',
  },
  {
    key: 'lincoln',
    toc: 'Lincoln',
    sites: 3,
    demos: 'lincoln 1-3',
    ladder: [
      [0, 2],
      [461, 3],
      [993, 4],
    ],
    dots: false,
    why: 'Holds three cards across a wide tablet range.',
  },
  {
    key: 'ford',
    toc: 'Ford',
    sites: 2,
    demos: 'ford 1, honda 1',
    ladder: [
      [0, 1],
      [461, 3],
      [992, 5],
    ],
    dots: false,
    why: 'Jumps 1 → 3 in one step; no two-up state at all.',
  },
  {
    key: 'hyundai',
    toc: 'Hyundai',
    sites: 2,
    demos: 'hyundai 2-3',
    ladder: [
      [0, 1],
      [461, 3],
      [993, 4],
      [1201, 5],
    ],
    dots: false,
    why: 'Also skips two-up on the way from phone to tablet.',
  },
  {
    key: 'mazda',
    toc: 'Mazda',
    sites: 2,
    demos: 'mazda 1-2',
    ladder: [
      [0, 1],
      [769, 2],
      [992, 3],
    ],
    dots: true,
    why: 'One of only three model bars in the estate that shows dots.',
  },
  {
    key: 'toyota',
    toc: 'Toyota',
    sites: 2,
    demos: 'toyota 2-3',
    ladder: [
      [0, 1],
      [541, 2],
    ],
    dots: false,
    why: 'The largest cards anywhere — never more than two across.',
  },
  {
    key: 'alfaromeo',
    toc: 'Alfa Romeo',
    sites: 1,
    demos: 'alfaromeo 1',
    ladder: [
      [0, 1],
      [541, 2],
      [993, 3],
      [1201, 4],
      [1801, 6],
    ],
    dots: false,
    why: 'Six-up, but only past 1800px — the widest breakpoint in the estate.',
  },
  {
    key: 'audi',
    toc: 'Audi',
    sites: 1,
    demos: 'audi 1',
    ladder: [
      [0, 1],
      [361, 2],
      [769, 3],
      [993, 4],
      [1201, 6],
    ],
    dots: false,
    why: 'Five rungs, the most granular ladder anywhere.',
  },
];

// Same roster and attributes as the demo page's model bar.
const MODELS = [
  ['silverado-1500', 'Silverado 1500', '2026 Chevrolet Silverado 1500'],
  ['colorado', 'Colorado', '2025 Chevrolet Colorado'],
  ['tahoe', 'Tahoe', '2025 Chevrolet Tahoe'],
  ['suburban', 'Suburban', '2025 Chevrolet Suburban'],
  ['traverse', 'Traverse', '2025 Chevrolet Traverse'],
  ['equinox', 'Equinox', '2025 Chevrolet Equinox'],
  ['trailblazer', 'Trailblazer', '2025 Chevrolet Trailblazer'],
  ['trax', 'Trax', '2025 Chevrolet Trax'],
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ladderText = (l) => l.map(([bp, n], i) => (i === 0 ? `base ${n}` : `&ge;${bp}px ${n}`)).join(' &middot; ');

// The live ladder and the taught ladder are the same rows rendered two ways —
// they cannot disagree.
const liveLadderCss = (v) =>
  v.ladder
    .map(([bp, n], i) =>
      i === 0 ? `      .mb-${v.key} {\n        --dlc-per-view: ${n};\n      }` : `      @media (min-width: ${bp}px) {\n        .mb-${v.key} {\n          --dlc-per-view: ${n};\n        }\n      }`,
    )
    .join('\n');

const recipeCss = (v) => {
  const rungs = v.ladder
    .map(([bp, n], i) => (i === 0 ? `.my-modelbar { --dlc-per-view: ${n}; --dlc-peek: 60px; --dlc-gap: 0.5rem; }` : `@media (min-width: ${bp}px) { .my-modelbar { --dlc-per-view: ${n}; } }`))
    .join('\n');
  const dots = v.dots
    ? `/* This bar is one of the three in the estate that keeps its dots - nothing to hide. */`
    : `/* Arrows only - hide the dots and reclaim the space they reserved. */\n.my-modelbar .dl-carousel-dots { display: none; }\n.my-modelbar { --dlc-controls-space: 0px; }`;
  return `/* ${v.toc} ladder - ${v.sites === 1 ? '1 site runs' : `${v.sites} sites run`} exactly this. */\n${rungs}\n\n${dots}\n\n.my-modelbar-card { display: block; color: inherit; text-align: center; text-decoration: none; }\n.my-modelbar-card img { inline-size: 100%; block-size: auto; object-fit: contain; }\n.my-modelbar-card p { margin: 0.25rem 0 0; font-weight: 600; }`;
};

const RECIPE_HTML = `<div class="my-modelbar dl-carousel" data-slider data-step="slide" aria-label="Explore our lineup">
  <ul class="dl-carousel-track">
    <li class="dl-carousel-slide">
      <a class="my-modelbar-card" href="/new-inventory/index.htm?model=Silverado" aria-label="Explore the Silverado 1500">
        <img src="#CHROMEPHOTOPATH|StyleID|1|640p#" width="320" height="240" alt="2026 Chevrolet Silverado 1500">
        <p>Silverado 1500</p>
      </a>
    </li>
    <!-- repeat the <li> for each model -->
  </ul>
</div>`;

const slides = MODELS.map(
  ([slug, name, alt]) => `            <li class="dl-carousel-slide">
              <a class="demo-mb-card" href="index.html#modelbar" aria-label="Explore the ${name}">
                <img src="img/chrome-${slug}.png" srcset="img/chrome-${slug}.png 320w, img/chrome-${slug}-640.png 640w" sizes="(min-width: 1024px) 250px, (min-width: 640px) 30vw, 45vw" width="320" height="240" alt="${alt}" loading="lazy" decoding="async" />
                <p>${name}</p>
              </a>
            </li>`,
).join('\n');

const section = (v) => `      <section class="demo-section demo-wide" id="${v.key}">
        <h2 id="${v.key}-h">The ${v.toc} ladder &mdash; ${v.sites === 1 ? '1 site' : `${v.sites} sites`}</h2>
        <p class="demo-sub">${v.why} Runs on ${esc(v.demos)}. Cards per view: ${ladderText(v.ladder)}.</p>
        <div class="dl-carousel demo-mb ${v.dots ? 'demo-mb--dots' : 'demo-mb--nodots'} mb-${v.key}" data-slider data-step="slide" aria-labelledby="${v.key}-h">
          <ul class="dl-carousel-track">
${slides}
          </ul>
        </div>
        <details>
          <summary>Copy this ladder</summary>
          <p class="copy-lead">
            <strong>Copy this.</strong> The HTML goes in a Custom HTML block; the CSS goes in the page's <em>Style Only</em> box. Add
            <a href="index.html#start">the slider itself</a> first &mdash; once per page.
          </p>
          <p class="code-label">HTML</p>
          <pre><code>${esc(RECIPE_HTML)}</code></pre>
          <p class="code-label">CSS</p>
          <pre><code>${esc(recipeCss(v))}</code></pre>
        </details>
      </section>`;

const page = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Custom Slider — model bar library</title>
    <meta name="description" content="Every distinct OEM model bar breakpoint ladder rendered live with the dependency-free scroll-snap slider, each with copy-paste code." />
    <!-- inline so the page makes no request the repo can't serve (a missing favicon was a 404 in the console) -->
    <link
      rel="icon"
      href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%23262626'/><rect x='5' y='11' width='14' height='10' rx='2' fill='%23fff'/><rect x='21' y='13' width='6' height='6' rx='2' fill='%23949494'/></svg>"
    />
    <link rel="stylesheet" href="../dist/dl-carousel.css" />
    <script src="../dist/dl-carousel.js" defer></script>
    <style>
      /* Page chrome matches demo/index.html — slider styling lives in the library CSS. */
      body {
        font-family: system-ui, sans-serif;
        margin: 0;
        color: #222;
        line-height: 1.5;
      }
      main {
        max-width: 72rem;
        margin: 0 auto;
        padding: 1rem;
      }
      .demo-section {
        margin-block: 3rem;
      }
      .demo-lede {
        max-width: 68ch;
        margin: 0.75rem 0;
      }
      .demo-sub {
        max-width: 68ch;
        margin: 0.35rem 0 1rem;
        color: #3c4043;
      }
      .demo-toc {
        margin-block: 1rem;
      }
      .demo-toc a,
      main a {
        color: #1a5fb4;
      }
      .demo-wide {
        position: relative;
        inset-inline-start: 50%;
        inline-size: min(1440px, 100vw - 2rem);
        transform: translateX(-50%);
      }
      pre {
        padding: 1rem;
        overflow-x: auto;
        color: #222;
        background: #f6f6f6;
        border-radius: 6px;
      }
      .copy-lead {
        margin-block-start: 1rem;
      }
      .code-label {
        margin: 0.9rem 0 0.3rem;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #5f6368;
      }
      .code-wrap {
        position: relative;
      }
      .code-copy {
        position: absolute;
        inset-block-start: 0.5rem;
        inset-inline-end: 0.5rem;
        padding: 0.35rem 0.7rem;
        font: inherit;
        font-size: 0.8rem;
        color: #16324f;
        cursor: pointer;
        background: #fff;
        border: 1px solid #c4ced8;
        border-radius: 4px;
      }
      .code-copy:hover {
        background: #eef2f6;
      }
      .code-copy:focus-visible {
        outline: 3px solid #16324f;
        outline-offset: 2px;
      }
      .code-copy[data-copied] {
        color: #1f6f4a;
        border-color: #1f6f4a;
      }
      /* The live skin is the copy-paste recipe verbatim (renamed .demo-mb so
         this page's chrome can't leak into anyone's paste) — what renders is
         what the panel teaches, nothing more. */
      .demo-mb {
        --dlc-peek: 60px;
        --dlc-gap: 0.5rem;
      }
      .demo-mb--nodots .dl-carousel-dots {
        display: none;
      }
      .demo-mb--nodots {
        --dlc-controls-space: 0px;
      }
      .demo-mb-card {
        display: block;
        color: inherit;
        text-align: center;
        text-decoration: none;
      }
      .demo-mb-card img {
        inline-size: 100%;
        block-size: auto;
        object-fit: contain;
      }
      .demo-mb-card p {
        margin: 0.25rem 0 0;
        font-weight: 600;
      }
      /* One ladder per variant — the same rows the copy panels teach. */
${VARIANTS.map(liveLadderCss).join('\n')}
    </style>
  </head>
  <body>
    <main>
      <h1>Model bar library</h1>
      <p class="demo-lede">
        <strong>All 55 model bars across the 76 OEM demo sites are one design</strong> &mdash; arrows, swipe, one card per step, a sliver of the next card peeking, and never autoplay. The only
        brand-to-brand difference is how many cards show at each width. Every strip below is that one design running live on a different brand&rsquo;s ladder; resize the window and watch the counts
        change.
      </p>
      <p class="demo-lede">
        Each section carries its complete copy-paste pair. Do the <a href="index.html#start">Start here</a> step from the main demo once per page first. For screenshots of the real sites instead, see
        the <a href="../docs/catalog/model-bar-library.html">screenshot library</a> and the <a href="../docs/catalog/oem-slider-census.html">census</a>.
      </p>

      <nav class="demo-toc" aria-label="On this page">
${VARIANTS.map((v) => `        <a href="#${v.key}">${v.toc} (${v.sites})</a> &middot;`).join('\n')}
        <a href="#outliers">The outliers</a>
      </nav>

${VARIANTS.map(section).join('\n\n')}

      <section class="demo-section" id="outliers">
        <h2>The outliers &mdash; not this design</h2>
        <p class="demo-sub">Four census entries are not the standard model bar. Each one is already demonstrated live on the main page.</p>
        <ul>
          <li><strong>Kia demo 1</strong> and the <strong>Lexus quick-nav</strong> are centre-mode: the active card sits centred with neighbours peeking. That is the <a href="index.html#peek">peek pattern</a> with the peek turned right up.</li>
          <li><strong>Hyundai demo 1</strong> folds the lineup into two rows &mdash; the <a href="index.html#grid">two-row grid</a>.</li>
          <li><strong>Subaru&rsquo;s strip</strong> is content cards stepping a whole page at a time &mdash; the default behaviour shown by <a href="index.html#vehicles">featured vehicles</a>.</li>
        </ul>
      </section>

      <p>Back to <a href="index.html">the main demo</a>. Ladder data: <a href="https://github.com/stevenpelletier90/custom-slider/blob/master/docs/research/2026-08-18-oem-demo-slider-census.md">the OEM demo slider census</a>, fingerprinted 18 Aug 2026.</p>
    </main>
    <script>
      // Copy buttons on every code sample — same behaviour as the main demo:
      // added by script so the authored markup stays clean, and a reader with
      // JS off just sees normal code they can select by hand.
      addEventListener('DOMContentLoaded', () => {
        for (const pre of document.querySelectorAll('details pre')) {
          // Read the label FIRST: once the <pre> is moved inside the wrapper it
          // is an only child, so previousElementSibling is null and every button
          // ends up named "Copy code".
          const label = pre.previousElementSibling?.classList.contains('code-label') ? pre.previousElementSibling.textContent.trim() : 'code';

          const wrap = document.createElement('div');
          wrap.className = 'code-wrap';
          pre.parentNode.insertBefore(wrap, pre);
          wrap.appendChild(pre);

          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'code-copy';
          btn.textContent = 'Copy';
          btn.setAttribute('aria-label', \`Copy \${label}\`);
          wrap.appendChild(btn);

          btn.addEventListener('click', async () => {
            const text = pre.textContent;
            try {
              await navigator.clipboard.writeText(text);
            } catch {
              // Clipboard API needs a secure context; fall back for file:// and http://
              const ta = document.createElement('textarea');
              ta.value = text;
              ta.style.position = 'fixed';
              ta.style.opacity = '0';
              document.body.appendChild(ta);
              ta.select();
              document.execCommand('copy');
              ta.remove();
            }
            btn.textContent = 'Copied';
            btn.dataset.copied = '';
            clearTimeout(btn._t);
            btn._t = setTimeout(() => {
              btn.textContent = 'Copy';
              delete btn.dataset.copied;
            }, 1600);
          });
        }
      });
    </script>
  </body>
</html>
`;

fs.writeFileSync('demo/model-bars.html', page);
console.log('demo/model-bars.html written:', VARIANTS.length, 'variants');
