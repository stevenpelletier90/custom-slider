import fs from 'node:fs';
const SHOTS = process.argv[2],
  OUT = process.argv[3];

const SPEC = {
  acurademo1: {
    brand: 'Acura',
    n: 1,
    group: 'bar',
    shares: 13,
    ladder: [
      [0, 2],
      [461, 3],
      [769, 5],
    ],
    tabs: 0,
    dots: false,
    why: 'The most common ladder in the estate — 13 sites run exactly this.',
  },
  chevroletdemo1: {
    brand: 'Chevrolet',
    n: 1,
    group: 'tabs',
    shares: 11,
    ladder: [
      [0, 2],
      [540, 3],
      [992, 4],
      [1200, 5],
    ],
    tabs: 5,
    dots: false,
    why: 'Five body-style groups — the widest grouping anywhere in the estate.',
  },
  cadillacdemo1: {
    brand: 'Cadillac',
    n: 1,
    group: 'tabs',
    shares: 11,
    ladder: [
      [0, 2],
      [540, 3],
      [992, 4],
      [1200, 5],
    ],
    tabs: 3,
    dots: false,
    why: 'Same ladder as Chevrolet, three groups instead of five.',
  },
  lexusdemo1: {
    brand: 'Lexus',
    n: 1,
    group: 'tabs',
    shares: 6,
    ladder: [
      [0, 1],
      [401, 2],
      [601, 3],
      [992, 5],
    ],
    tabs: 4,
    dots: false,
    why: 'Drops to a single card on the narrowest phones.',
  },
  buickdemo1: {
    brand: 'Buick',
    n: 1,
    group: 'bar',
    shares: 5,
    ladder: [
      [0, 2],
      [461, 3],
      [769, 4],
    ],
    tabs: 0,
    dots: false,
    why: 'Four-up ceiling — roomier cards than the five-up brands.',
  },
  genesisdemo1: {
    brand: 'Genesis',
    n: 1,
    group: 'tabs',
    shares: 5,
    ladder: [
      [0, 1],
      [541, 2],
      [993, 3],
      [1201, 4],
    ],
    tabs: 3,
    dots: false,
    why: 'A gentle four-step climb, one card at a time.',
  },
  vwdemo1: {
    brand: 'Volkswagen',
    n: 1,
    group: 'tabs',
    shares: 5,
    ladder: [
      [0, 1],
      [541, 2],
      [993, 3],
      [1201, 4],
    ],
    tabs: 3,
    dots: false,
    why: 'Same ladder as Genesis; SUV / Sedan / Bus grouping.',
  },
  lincolndemo1: {
    brand: 'Lincoln',
    n: 1,
    group: 'bar',
    shares: 3,
    ladder: [
      [0, 2],
      [461, 3],
      [993, 4],
    ],
    tabs: 0,
    dots: false,
    why: 'Holds three cards across a wide tablet range.',
  },
  forddemo1: {
    brand: 'Ford',
    n: 1,
    group: 'tabs',
    shares: 2,
    ladder: [
      [0, 1],
      [461, 3],
      [992, 5],
    ],
    tabs: 4,
    dots: false,
    why: 'Jumps 1 → 3 in one step; no two-up state at all.',
  },
  hyundaidemo2: {
    brand: 'Hyundai',
    n: 2,
    group: 'bar',
    shares: 2,
    ladder: [
      [0, 1],
      [461, 3],
      [993, 4],
      [1201, 5],
    ],
    tabs: 0,
    dots: false,
    why: 'Also skips two-up on the way from phone to tablet.',
  },
  mazdademo1: {
    brand: 'Mazda',
    n: 1,
    group: 'bar',
    shares: 2,
    ladder: [
      [0, 1],
      [769, 2],
      [992, 3],
    ],
    tabs: 0,
    dots: true,
    why: 'One of only three model bars in the estate that shows dots.',
  },
  toyotademo2: {
    brand: 'Toyota',
    n: 2,
    group: 'bar',
    shares: 2,
    ladder: [
      [0, 1],
      [541, 2],
    ],
    tabs: 0,
    dots: false,
    why: 'The largest cards anywhere — never more than two across.',
  },
  alfaromeodemo1: {
    brand: 'Alfa Romeo',
    n: 1,
    group: 'bar',
    shares: 1,
    ladder: [
      [0, 1],
      [541, 2],
      [993, 3],
      [1201, 4],
      [1801, 6],
    ],
    tabs: 0,
    dots: false,
    why: 'Six-up, but only past 1800px — the widest breakpoint in the estate.',
  },
  audidemo1: {
    brand: 'Audi',
    n: 1,
    group: 'bar',
    shares: 1,
    ladder: [
      [0, 1],
      [361, 2],
      [769, 3],
      [993, 4],
      [1201, 6],
    ],
    tabs: 0,
    dots: false,
    why: 'Five rungs, the most granular ladder anywhere.',
  },
  kiademo1: {
    brand: 'Kia',
    n: 1,
    group: 'edge',
    shares: 1,
    ladder: [
      [0, 1],
      [769, 3],
    ],
    tabs: 3,
    dots: false,
    why: 'Centre-mode: the active card sits centred with neighbours peeking.',
  },
  lexusdemo2: {
    brand: 'Lexus',
    n: 2,
    group: 'edge',
    shares: 1,
    ladder: [
      [0, 1],
      [992, 3],
    ],
    tabs: 0,
    dots: false,
    why: 'A quick-nav strip, centre-mode with 9% padding. Not a model bar.',
  },
  hyundaidemo1: { brand: 'Hyundai', n: 1, group: 'edge', shares: 1, ladder: null, tabs: 3, dots: true, why: 'Two-row grid — a different layout primitive, not a carousel mode.' },
  subarudemo1: {
    brand: 'Subaru',
    n: 1,
    group: 'edge',
    shares: 3,
    ladder: [
      [0, 1],
      [540, 2],
      [1200, 3],
    ],
    tabs: 0,
    dots: true,
    why: 'A content-card strip that steps a whole page at a time, not one card.',
  },
};

const SUPPORT = {
  bar: { chip: 'have', label: 'Supported' },
  tabs: { chip: 'have', label: 'Supported' },
  edge: { chip: 'off', label: 'Out of scope' },
};
const OUT_OF_SCOPE = new Set(['kiademo1', 'lexusdemo2', 'hyundaidemo1']);

function recipe(s) {
  if (!s.ladder) return null;
  const cls = '.' + s.brand.toLowerCase().replace(/[^a-z]/g, '') + '-modelbar';
  let css = `${cls} { --dlc-per-view: ${s.ladder[0][1]}; }`;
  for (const [bp, n] of s.ladder.slice(1)) css += `\n@media (min-width: ${bp}px) { ${cls} { --dlc-per-view: ${n}; } }`;
  return css;
}
const ladderText = (s) => (!s.ladder ? '—' : s.ladder.map(([bp, n], i) => (i === 0 ? `${n}` : `≥${bp}px ${n}`)).join('  ·  '));

const manifest = JSON.parse(fs.readFileSync(`${SHOTS}/manifest.json`, 'utf8')).filter((r) => r.ok);
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const order = ['bar', 'tabs', 'edge'];
const GROUP_TITLE = {
  bar: { h: 'Plain model bars', p: 'One strip, arrows only, no grouping. 25 of the 55 sites look like this. The only thing separating them is how many cards they show at each width.' },
  tabs: { h: 'Grouped under tabs', p: 'The majority shape: 30 of the 55 sites stack several model bars behind body-style or fuel-type tabs. Each pane is its own independent strip.' },
  edge: { h: 'The outliers', p: 'Four strips that are not the standard model bar. Three are deliberately out of scope for the library; the Subaru strip is a different pattern we already support.' },
};

let cards = '';
for (const g of order) {
  const items = manifest.filter((m) => SPEC[m.host] && SPEC[m.host].group === g);
  if (!items.length) continue;
  cards += `\n  <section class="group">\n    <div class="group-head">\n      <h2>${GROUP_TITLE[g].h}</h2>\n      <p>${GROUP_TITLE[g].p}</p>\n    </div>\n`;
  for (const m of items) {
    const s = SPEC[m.host];
    const b64 = fs.readFileSync(m.file).toString('base64');
    const sup = OUT_OF_SCOPE.has(m.host) ? SUPPORT.edge : SUPPORT[s.group];
    const rec = recipe(s);
    cards += `    <article class="card">
      <figure>
        <img src="data:image/jpeg;base64,${b64}" alt="The ${esc(s.brand)} model bar as it renders at 1280px, showing ${esc(String(s.ladder ? s.ladder[s.ladder.length - 1][1] : 'several'))} vehicle cutouts across" width="${m.w}" height="${m.h}" loading="lazy" decoding="async" />
      </figure>
      <div class="card-body">
        <div class="card-head">
          <h3>${esc(s.brand)} <span class="demo-n">demo ${s.n}</span></h3>
          <span class="chip chip--${sup.chip}">${sup.label}</span>
        </div>
        <p class="why">${esc(s.why)}</p>
        <dl class="specs">
          <div><dt>Cards per view</dt><dd class="mono">${ladderText(s)}</dd></div>
          <div><dt>Grouping</dt><dd>${s.tabs ? s.tabs + ' tabs' : 'none'}</dd></div>
          <div><dt>Dots</dt><dd>${s.dots ? 'yes' : 'hidden'}</dd></div>
          <div><dt>Shared by</dt><dd>${s.shares} site${s.shares === 1 ? '' : 's'}</dd></div>
        </dl>
        ${rec ? `<details><summary>Build this</summary><pre><code>${esc(rec)}</code></pre><p class="note">Plus <code>data-step="slide"</code>, <code>--dlc-peek: 60px</code>, and dots hidden — the shared model-bar recipe.</p></details>` : ''}
        <a class="live" href="https://${m.host}.dealeron.com/" target="_blank" rel="noopener">Open ${m.host}.dealeron.com →</a>
      </div>
    </article>\n`;
  }
  cards += `  </section>\n`;
}
fs.writeFileSync(`${OUT}/cards.html`, cards);
console.log('cards built:', manifest.length);
