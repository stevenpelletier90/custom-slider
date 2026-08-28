# Demo image credits

**The demo ships no third-party stock photography.** Every image in this folder
comes from the DealerOn platform itself, and every one of them is served by a
path that resolves on any dealer site — which is why the copy panel can hand a
designer working image sources instead of links into this repo.

There are three sources, and nothing else:

| Files | Source | What it is |
| --- | --- | --- |
| `vehicle-*.png`, `chrome-*.webp`, `oem/**` | `/assets/stock/…` | ChromeData (JD Power) ColorMatched and Expanded renders, licensed to DealerOn and served by the platform's own render service |
| `photo-*.jpg`, `mixed-1.jpg` … `mixed-3.jpg` | `/static/industry-automotive/…`, `/static/brand-<make>/…` | The shared library collections every dealer can see |
| `oem/**` (model-bar art) | `/static/brand-<make>/…` | OEM-syndicated model-bar photography |

The exact path behind each file is recorded in `demo/assets/cms-paths.js`, and
`node scripts/harvest-cms-paths.mjs` re-derives the whole map from the live
platform. Internal demo use for DealerOn work — these are licensed OEM and
ChromeData assets, not freely redistributable imagery.

Two notes on what the images are allowed to claim:

- **A card that names a vehicle shows that vehicle.** The used-inventory cards
  carry the model year in the ChromeData code behind each render, and the tall
  model cards use Alfa Romeo's 300×500 portrait art because it is the only real
  portrait model photography on the platform — and it is exactly the 3/5 the
  card crops to. Six Unsplash stand-ins captioned Silverado, Equinox, Tahoe,
  Malibu, Camaro and Corvette pictured none of those vehicles; they are gone.
- **The mixed-size example prints its real source dimensions.** Each card states
  the size of the file behind it and what the crop removed, so those numbers are
  load-bearing and have to match the files.

## Chrome model cutouts

`chrome-*.webp` (lossy WebP derivatives of the original `chrome-*.png` cutouts, which
were removed from the tree after conversion — see git history) are ChromeData
(JD Power) licensed library renders served through
the DealerOn platform (Chrome Photo Builder, angle 1, transparent PNG at 320/640),
fetched from a live DealerOn storefront. Internal demo use for DealerOn team
presentation; on a production DealerOn site reference them with
`#CHROMEPHOTOPATH|StyleID|1|640p#` instead of copying files.

These eight are the only images the copy panel maps by MODEL rather than by
bytes — the WebP conversion means no hash can equal the platform's PNG, so a
pasted Silverado is a current Silverado render that may wear a different colour
than the preview. Undoing the conversion to close that gap costs ~530 KB for a
difference nobody copying a stock cutout depends on.

## Where the copy panel's image paths come from

`demo/assets/cms-paths.js` maps every image here to the path the DealerOn
platform serves the same bytes from, and the code panel emits that instead of
the repo-relative `img/…` the preview uses. Regenerate it with
`node scripts/harvest-cms-paths.mjs`, which re-derives the whole map from the
live OEM demo estates and fails loudly rather than guessing.

Two platform sources, both global — no dealer id in the path, identical bytes on
every dealer domain, nothing to upload:

- `/assets/stock/…` — the ChromeData ColorMatched/Expanded render service (70 of
  the cutouts). Proved global by fetching each one from an unrelated dealer
  domain rather than the estate it was found on.
- `/static/brand-<make>/…` — the shared OEM model-bar collection (56 cutouts).
- `/static/industry-automotive/…` — the shared photography collection, which is
  where `photo-1.jpg` … `photo-6.jpg` now come from.

One finding worth recording so nobody repeats the search: `industry-automotive`
is people, service bays and scenery — it holds no vehicle beauty shots, and
querying it for a Silverado returns a green semi truck. Vehicle imagery
therefore comes from the render service and the `brand-<make>` collections
instead, which is why the used-inventory cards are ChromeData renders and the
tall model cards are OEM portrait art.

`#MISCPATH#<file>` is still what the copy panel emits for any image with no
platform equivalent. Nothing in the demo needs it now, but the rule stays: that
is the house convention for a dealer's own gallery upload, and a real listing
card ultimately wants that dealer's own inventory photo.

The Hyundai roster plus `bmw/x3.png` and `landrover/defender.png` were refreshed
on 2026-08-28 from the current platform renders: OEMs rotate model-year art, and
the August captures no longer matched anything being served, which would have
left the copy panel pointing at a render that had moved.

## Video testimonials

The video patterns embed nothing. A poster is a `<button>` that opens a native
`<dialog>` saying where the video would go, so the demo ships no third-party
iframe and no third-party video. On a production site, put the dealer's own
player inside that dialog — the engine is not involved either way.

## oem/ — brand-correct model images (added 19 Aug 2026)

`oem/<brand>/*.{png,webp,jpg}` are the OEM model-bar images each library strip's
own source demo site serves — DealerOn-licensed ColorMatched/stock cutouts
(`/assets/stock/…`) and OEM-syndicated model-bar art (`/static/brand-*/…`),
harvested one size per model from: acurademo1, lexusdemo1, buickdemo1,
audidemo1, genesisdemo1, lincolndemo1, forddemo2, hyundaidemo2, mazdademo1,
toyotademo2, alfaromeodemo1, and cdjrdemo1. Same asset class and license as the
`chrome-*.webp` Chevrolet cutouts above. Internal demo use only — these are OEM
marketing assets, not freely redistributable imagery.
