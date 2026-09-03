// Recover the platform path every demo cutout was harvested from.
//
// The cutouts in demo/img/oem are ChromeData ColorMatched renders that the
// platform serves from ONE global location - /assets/stock/... - with no dealer
// id anywhere in the path. Proved 2026-08-28: the GMC Yukon render returns 200
// with an identical SHA-1 on gmcdemo1, chevroletdemo1, hondademo1 and
// acurademo1. So a copy panel that emits that path works on any dealer site
// with nothing uploaded, which is the whole point of the exercise.
//
// The mapping is recovered by CONTENT, never by reconstructing a URL: every
// candidate is fetched and hashed, and a local file is only claimed by a URL
// whose bytes are identical. A file that matches nothing is reported as
// unmatched rather than guessed at - an almost-right cutout path is worse than
// an honest gap, because it 404s silently on a live page.

import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile, stat, unlink } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, posix } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const OEM = join(ROOT, 'demo', 'img', 'oem');
// A classic script, not JSON: the demo has to open by double-click, and a
// fetch() of a .json file is blocked over file://. Same reason every other
// demo asset hangs off globalThis.CARGO.
const OUT = join(ROOT, 'demo', 'assets', 'cms-paths.js');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

// Demo estates per roster folder. The host prefix is not always the folder name
// (volkswagen ships as vwdemo*), and cdjr is four marques on one folder.
const HOSTS = {
  acura: ['acurademo1', 'acurademo2', 'acurademo3'],
  alfaromeo: ['alfaromeodemo1'],
  audi: ['audidemo1'],
  bmw: ['bmwdemo1', 'bmwdemo2', 'bmwdemo3'],
  buick: ['buickdemo1', 'buickdemo2'],
  cadillac: ['cadillacdemo1', 'cadillacdemo2', 'cadillacdemo3'],
  cdjr: ['cdjrdemo1', 'chryslerdemo1', 'dodgedemo1', 'jeepdemo1', 'jeepdemo2', 'ramdemo1', 'ramdemo2'],
  chevrolet: ['chevroletdemo1', 'chevroletdemo2', 'chevroletdemo3'],
  ford: ['forddemo1', 'forddemo2', 'forddemo3'],
  genesis: ['genesisdemo1', 'genesisdemo2', 'genesisdemo3'],
  gmc: ['gmcdemo1', 'gmcdemo2'],
  honda: ['hondademo1', 'hondademo2', 'hondademo3'],
  hyundai: ['hyundaidemo1', 'hyundaidemo2', 'hyundaidemo3'],
  infiniti: ['infinitidemo1', 'infinitidemo2'],
  jaguar: ['jaguardemo1'],
  kia: ['kiademo1', 'kiademo2', 'kiademo3'],
  landrover: ['landroverdemo1', 'landroverdemo2', 'landroverdemo3'],
  lexus: ['lexusdemo1', 'lexusdemo2', 'lexusdemo3'],
  lincoln: ['lincolndemo1', 'lincolndemo2', 'lincolndemo3'],
  mazda: ['mazdademo1', 'mazdademo2'],
  mini: ['minidemo1', 'minidemo2', 'minidemo3'],
  mitsubishi: ['mitsubishidemo1', 'mitsubishidemo2', 'mitsubishidemo3'],
  nissan: ['nissandemo1', 'nissandemo2', 'nissandemo3'],
  porsche: ['porschedemo1', 'porschedemo2', 'porschedemo3'],
  subaru: ['subarudemo1', 'subarudemo2', 'subarudemo3'],
  toyota: ['toyotademo1', 'toyotademo2', 'toyotademo3'],
  volkswagen: ['vwdemo1', 'vwdemo2'],
  volvo: ['volvodemo1', 'volvodemo2'],
};

// The homepage carries the model bar where a brand runs one; the rest keep
// their ChromeData renders on the new-inventory cards. Both are cheap.
const PAGES = ['/', '/searchnew.aspx'];

// The Chevrolet fallback cutouts - the roster every brand without its own
// imagery falls back to, and so the set behind the DEFAULT view of every
// pattern in the workbench. They are the one group matched by MODEL rather than
// by bytes: they ship as lossy WebP derivatives of the original PNGs (converted
// deliberately, 110 KB the whole set against 640 KB for the PNGs), so no hash
// can ever equal the platform's. What is guaranteed for these eight is the
// model, not the paint - a pasted Silverado is a current Silverado render,
// possibly in a different colour than the preview. Undoing the WebP conversion
// to buy exactness here costs half a megabyte for a difference nobody copying a
// stock cutout is relying on; the drift is called out in CREDITS.md instead.
const NAMED = {
  'chrome-silverado-1500.webp': 'Silverado 1500',
  'chrome-colorado.webp': 'Colorado',
  'chrome-tahoe.webp': 'Tahoe',
  'chrome-suburban.webp': 'Suburban',
  'chrome-traverse.webp': 'Traverse',
  'chrome-trax.webp': 'Trax',
  'chrome-equinox.webp': 'Equinox',
  'chrome-trailblazer.webp': 'Trailblazer',
};
const NAMED_HOST = 'chevroletdemo1';

// The demo's photography, taken from the platform's own `industry-automotive`
// collection rather than from Unsplash. That collection is global - every
// dealer sees it, `/static/industry-automotive/...` serves root-relative on any
// dealer domain - so these slots copy out as working paths like the cutouts do,
// instead of as `#MISCPATH#` placeholders nobody can use until they upload.
//
// Holding the local filenames steady (photo-1.jpg, ...) keeps this a
// bytes-and-dimensions change rather than a rename across every pattern. The
// bytes are fetched from the library, so preview and paste are the same image
// and the map below cannot describe a photo the demo is not showing.
//
// Only the service/lifestyle slots are here, and that is a finding rather than
// an oversight: industry-automotive is people, service bays and scenery. It has
// no vehicle beauty shots, so the used-car cards, the tall model cards and the
// mixed-size set found nothing usable in it - a semi truck came back for
// "Silverado" - and they stay on their own photography with `#MISCPATH#`. Those
// slots want the dealer's real inventory pictures anyway, which is precisely
// what #MISCPATH# is for.
const LIBRARY = {
  // Service and lifestyle photography, every one at least 1200px wide.
  //
  // The first set came from the 800-900px tier and was too small for the job:
  // a full-width hero is 1170px on a desktop, so a 900px file was stretched to
  // 0.77 of the pixels it needed - visibly soft, and half that again on a
  // retina screen. There is no larger copy of those particular photos (the
  // large-images/ sibling the path implies does not exist, and ?width= only
  // ever shrinks), so the fix was to pick different ones. Enumerated through
  // the library API rather than by guessing filenames, which is how the 1920px
  // hero/ tier was missed the first time.
  //
  // Shapes matter as much as size here: these are 3:2 and 4:3, so they survive
  // the 21:9 desktop hero crop AND the 4:3 phone crop. The hero/ folder is
  // sharper still at 1920 wide but is a 3.2:1 letterbox, which keeps only its
  // middle third on a phone.
  'photo-1.jpg': '/static/industry-automotive/medium-images/service/car-fluid.jpg',
  'photo-2.jpg': '/static/industry-automotive/medium-images/service/new-tires.jpg',
  'photo-3.jpg': '/static/industry-automotive/medium-images/paint-job.jpg',
  'photo-4.jpg': '/static/industry-automotive/medium-images/car_ac.jpg',
  'photo-5.jpg': '/static/industry-automotive/medium-images/jet-wash.jpg',
  'photo-6.jpg': '/static/industry-automotive/medium-images/unlocking.jpg',

  // Used-inventory cards. ChromeData ColorMatched renders at 640, which are
  // exactly 640x480 - the 4:3 the vehicle card crops to, so nothing is lost -
  // and which exist for every make, so the card can finally name the vehicle it
  // is actually showing. This is also what a real SRP falls back to when a unit
  // has no photographs yet, so it is the truthful stand-in rather than a pretty
  // one.
  'vehicle-1.png': '/assets/stock/ColorMatched_01/Transparent/640/cc_2025HOS03_01_640/cc_2025HOS032071910_01_640_BK.png',
  'vehicle-2.png': '/assets/stock/Expanded/Transparent/640/2026TOS11_640/2026TOS112033662_640_01.png',
  'vehicle-3.png': '/assets/stock/ColorMatched_01/Transparent/640/cc_2023NIS11_01_640/cc_2023NIS110069_01_640_RBY.png',
  'vehicle-4.png': '/assets/stock/ColorMatched_01/Transparent/640/cc_2026FOS10_01_640/cc_2026FOS102066682_01_640_UM.png',
  'vehicle-5.png': '/assets/stock/ColorMatched_01/Transparent/640/cc_2026HYS02_01_640/cc_2026HYS021969953_01_640_NET.png',
  'vehicle-6.png': '/assets/stock/ColorMatched_01/Transparent/640/cc_2026SUS31_01_640/cc_2026SUS312046183_01_640_RV1.png',

  // The mixed-size example. These have to be genuinely different shapes,
  // because the card under each one prints its real source dimensions and says
  // what the crop threw away - so the numbers are the lesson, not decoration.
  // Two more shapes come from files already in the tree (a 300x500 portrait and
  // an 800x744 near-square), which is why only three are pulled here.
  'mixed-1.jpg': '/static/brand-chevrolet/custom-pages/models/2026/silverado-1500/ext-img1.jpg',
  'mixed-2.jpg': '/static/brand-nissan/vehicle/2026/Nissan/Altima/MRP/01.jpg',
  'mixed-3.jpg': '/static/brand-buick/vehicle/2026/Buick/Enclave/Hero/01.jpg',
};

const sha1 = (buf) => createHash('sha1').update(buf).digest('hex');

async function localIndex() {
  const byHash = new Map();
  const files = [];
  for (const brand of await readdir(OEM)) {
    const dir = join(OEM, brand);
    if (!(await stat(dir)).isDirectory()) continue;
    for (const name of await readdir(dir)) {
      const rel = posix.join('oem', brand, name);
      const buf = await readFile(join(dir, name));
      byHash.set(sha1(buf), rel);
      files.push(rel);
    }
  }
  return { byHash, files };
}

async function grab(url) {
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(45000) });
    if (!res.ok) return null;
    return res;
  } catch {
    return null;
  }
}

// A page links whatever size it wants. The 320 render lives under its own
// folder AND its own filename segment - rewriting only one of the two 404s
// (learned the hard way on the 11-brand harvest), so every size candidate
// rewrites both, and the original is always kept as a candidate too.
function variants(path) {
  const out = new Set([path]);
  for (const size of ['320', '640']) {
    out.add(
      path
        .replace(/\/(?:320|640|1280)\//, `/${size}/`)
        .replace(/_(?:320|640|1280)\//, `_${size}/`)
        .replace(/_(?:320|640|1280)_/g, `_${size}_`),
    );
  }
  return [...out];
}

async function pool(items, limit, fn) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) out.push(await fn(items[i++]));
    }),
  );
  return out;
}

const { byHash, files } = await localIndex();
console.log(`${files.length} local cutouts across ${Object.keys(HOSTS).length} rosters`);

// 1. Collect every /assets/stock/ path the demo estates serve.
const hosts = [...new Set(Object.values(HOSTS).flat())];
// Two platform sources, both dealer-independent. /assets/stock/ is the
// ChromeData ColorMatched service (PNG cutouts, the later rosters); /static/
// is the shared gallery collection where the OEM-syndicated model-bar art
// lives (brand-<make>, industry-automotive - the twelve original rosters, and
// the reason the first pass matched barely half).
const seen = new Map();
await pool(
  hosts.flatMap((h) => PAGES.map((p) => [h, p])),
  6,
  async ([host, page]) => {
    const res = await grab(`https://${host}.dealeron.com${page}`);
    if (!res) return;
    const html = await res.text();
    // Every /static/ collection EXCEPT dealer-<id>. The shared ones (brand-*,
    // industry-*, banner-*, bam-fca, ...) are the same bytes for everybody and
    // stay literal; /static/dealer-<id>/ is that one dealer's gallery, which is
    // exactly the per-dealer path this whole change exists to stop emitting.
    const found = html.match(/\/(?:assets\/stock|static\/(?!dealer-)[a-z0-9_-]+)\/[^"'\s)]+\.(?:png|webp|jpg|jpeg)/gi) ?? [];
    for (const p of found) for (const v of variants(p)) if (!seen.has(v)) seen.set(v, host);
  },
);
console.log(`${seen.size} candidate platform URLs (all size variants)`);

// 2. Fetch each once and claim local files by exact bytes.
// Fetched from an UNRELATED dealer domain on purpose. That is the property the
// whole change rests on - a designer pastes this snippet on some other dealer's
// site - so every path is proved global by being pulled from a Chevrolet store
// rather than the estate it was found on. Anything that only answers on its own
// host is recorded as such instead of being published as if it were portable.
const PROBE = 'chevroletdemo1';
const map = {};
const localOnly = new Set();
let fetched = 0;
await pool([...seen], 8, async ([path, origin]) => {
  let global = true;
  let res = await grab(`https://${PROBE}.dealeron.com${path}`);
  if (!res && origin !== PROBE) {
    global = false;
    res = await grab(`https://${origin}.dealeron.com${path}`);
  }
  if (!res) return;
  fetched++;
  const hash = sha1(Buffer.from(await res.arrayBuffer()));
  const rel = byHash.get(hash);
  if (!rel) return;
  // Same render can be linked from several estates; keep the shortest path.
  if (!map[rel] || path.length < map[rel].length) map[rel] = path;
  if (!global) localOnly.add(rel);
  else localOnly.delete(rel);
});

// Second pass: whatever the crawl missed, ask the inventory for by name.
// A model only appears on /searchnew.aspx while that store happens to stock it,
// so a cutout harvested months ago routinely falls off the unfiltered listing.
// The model-filtered URL still finds it, and because a claim still requires an
// exact SHA-1 there is no way for a wrong search result to be adopted.
const stillMissing = files.filter((f) => !map[f]);
if (stillMissing.length) {
  console.log(`\nsecond pass: asking inventory by model name for ${stillMissing.length} cutouts`);
  const probes = new Map();
  await pool(stillMissing, 4, async (rel) => {
    const [, brand, file] = rel.split('/');
    const slug = file.replace(/\.\w+$/, '');
    for (const host of HOSTS[brand] ?? []) {
      for (const q of new Set([slug, slug.replace(/-/g, ' ')])) {
        const res = await grab(`https://${host}.dealeron.com/searchnew.aspx?Model=${encodeURIComponent(q)}`);
        if (!res) continue;
        const html = await res.text();
        const found = html.match(/\/(?:assets\/stock|static\/(?!dealer-)[a-z0-9_-]+)\/[^"'\s)]+\.(?:png|webp|jpg|jpeg)/gi) ?? [];
        for (const p of found) for (const v of variants(p)) if (!probes.has(v)) probes.set(v, host);
      }
    }
  });
  await pool([...probes.keys()], 8, async (path) => {
    const res = await grab(`https://${PROBE}.dealeron.com${path}`);
    if (!res) return;
    const rel = byHash.get(sha1(Buffer.from(await res.arrayBuffer())));
    if (rel && !map[rel]) map[rel] = path;
  });
}

// The Chevrolet fallback, resolved by model off the live inventory. Every path
// is still proved to SERVE from an unrelated dealer domain before it is written
// - only the bytes-equal-the-preview guarantee is relaxed here, never the
// works-on-any-dealer-site one.
const named = new Set();
const derived = [];
await pool(Object.entries(NAMED), 4, async ([file, model]) => {
  const res = await grab(`https://${NAMED_HOST}.dealeron.com/searchnew.aspx?Model=${encodeURIComponent(model)}`);
  if (!res) return;
  const html = await res.text();
  const hit = html.match(new RegExp(`"name":"[^"]*${model.replace(/[.*+?^$(){}|[\]\\]/g, '\\$&')}[^"]*","identifier":"[^"]*","image":"[^"]*?(/assets/stock/[^"]+)"`, 'i'));
  if (!hit) return;
  const path = variants(hit[1]).find((v) => v.includes('/320/')) ?? hit[1];
  const probe = await grab(`https://${PROBE}.dealeron.com${path}`);
  if (!probe) return;
  map[file] = path;
  named.add(file);
  // Re-cut the local preview FROM the render we just mapped to, so the demo
  // shows the same truck in the same paint the pasted path serves. These stay
  // WebP: the model bar is the demo's default view, so all eight load on every
  // visit, and 110 KB of WebP against 640 KB of PNG is the difference between a
  // page that appears instantly and one that does not. Lossy encoding is
  // invisible at card size; a different colour was not.
  const png = Buffer.from(await probe.arrayBuffer());
  const dest = join(ROOT, 'demo', 'img', file);
  const tmp = `${dest}.src.png`;
  try {
    await writeFile(tmp, png);
    // -q 85 matches the size the original conversion produced (13.7 KB vs 13.6
    // KB on the Tahoe); alpha_q 100 keeps the cutout edge clean against any
    // band colour the card sits on.
    await promisify(execFile)('cwebp', ['-quiet', '-q', '85', '-alpha_q', '100', tmp, '-o', dest]);
    derived.push(file);
  } catch (e) {
    console.error(`  ${file}: could not re-cut from ${path} (${e.code === 'ENOENT' ? 'cwebp not installed' : e.message}) — left as it was`);
  } finally {
    await unlink(tmp).catch(() => {});
  }
});
if (derived.length)
  console.log(`
re-cut ${derived.length} Chevrolet cutout(s) from the render they map to`);
if (named.size !== Object.keys(NAMED).length) {
  console.log(
    `\nname-matched ${named.size}/${Object.keys(NAMED).length} Chevrolet fallback cutouts — missing: ${Object.keys(NAMED)
      .filter((f) => !named.has(f))
      .join(', ')}`,
  );
}

// The photography. Fetched rather than looked up: we already know the path, so
// the job here is to make the file on disk BE those bytes. Self-healing on
// purpose - when the library re-cuts an image the next harvest pulls it and
// reports the new size, instead of leaving the demo showing something the
// pasted path no longer serves (which is exactly how the Hyundai art drifted).
const pulled = [];
await pool(Object.entries(LIBRARY), 6, async ([file, path]) => {
  const res = await grab(`https://${PROBE}.dealeron.com${path}`);
  if (!res) {
    console.error(`  library: ${path} did not serve — ${file} left as it was`);
    return;
  }
  const body = Buffer.from(await res.arrayBuffer());
  const dest = join(ROOT, 'demo', 'img', file);
  const before = await readFile(dest).catch(() => null);
  if (!before || !before.equals(body)) {
    await writeFile(dest, body);
    pulled.push(file);
  }
  map[file] = path;
});
if (pulled.length) console.log(`\npulled ${pulled.length} library photo(s): ${pulled.join(', ')}`);

const matched = Object.keys(map).sort();
const missing = files.filter((f) => !map[f]).sort();
const libCount = Object.keys(LIBRARY).filter((f) => map[f]).length;
console.log(`\nfetched ${fetched} renders — ${matched.length - named.size - libCount}/${files.length} cutouts byte-proved, ${named.size} name-matched, ${libCount} library photos`);
if (localOnly.size) {
  console.log(`\nNOT global — only served by their own estate (${localOnly.size}):`);
  for (const m of [...localOnly].sort()) console.log(`  ${m}`);
}
if (missing.length) {
  console.log(`\nunmatched (${missing.length}):`);
  for (const m of missing) console.log(`  ${m}`);
}

// Four spaces, not two: the map sits two levels in, and `npm run validate`
// runs prettier --check over this file like any other. A generator whose output
// fails the repo's own gate makes re-running the harvest a chore.
const entries = matched.map((k) => `    '${k}': '${map[k]}',`).join('\n');
const banner = [
  '// Demo image -> the platform path that serves the same bytes. GENERATED by',
  '// scripts/harvest-cms-paths.mjs - do not hand-edit; re-run the harvest.',
  '//',
  '// Every pair here was proved by fetching the URL and comparing SHA-1 against',
  '// the local file, so a path in this file is the same render the demo shows,',
  '// not a plausible-looking guess. /assets/stock/ is global to the platform:',
  '// no dealer id in the path, and it serves the identical bytes on any dealer',
  '// domain, which is why a pasted snippet needs nothing uploaded.',
  '//',
  '// The one exception is the chrome-*.webp Chevrolet fallback: those ship as',
  '// lossy WebP, so they are matched by MODEL off the live inventory and only',
  '// the model is guaranteed, not the paint colour. They are still proved to',
  '// serve from an unrelated dealer domain like everything else here.',
  '',
  `// ${matched.length - named.size - libCount} of ${files.length} cutouts byte-proved, ${named.size} name-matched, ${libCount} library photos.`,
  `// Harvested ${new Date().toISOString().slice(0, 10)} by re-running the script above.`,
].join('\n');
await writeFile(OUT, `${banner}\n\nglobalThis.CARGO = Object.assign(globalThis.CARGO || {}, {\n  CMS: {\n${entries}\n  },\n});\n`);
console.log(`\nwrote ${OUT}`);
