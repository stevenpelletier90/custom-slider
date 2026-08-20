# Demo photo credits

Photos are from [Unsplash](https://unsplash.com) under the
[Unsplash License](https://unsplash.com/license) (free to use, no attribution
required — credited here anyway). Fetched via the Unsplash CDN with crop
parameters. Model-card photos are visual stand-ins, not the named Chevrolet
models (except the Camaro) — swap in official OEM assets for real use.

| File | Unsplash photo ID |
| --- | --- |
| vehicle-1.jpg | photo-1503376780353-7e6692767b70 |
| vehicle-2.jpg | photo-1502877338535-766e1452684a |
| vehicle-3.jpg | photo-1533473359331-0135ef1b58bf |
| vehicle-4.jpg | photo-1519641471654-76ce0107ad1b |
| vehicle-5.jpg | photo-1568605117036-5fe5e7bab0b7 |
| vehicle-6.jpg | photo-1549317661-bd32c8ce0db2 |
| photo-1.jpg | photo-1552519507-da3b142c6e3d |
| photo-2.jpg | photo-1533106418989-88406c7cc8ca |
| photo-3.jpg | photo-1449965408869-eaa3f722e40d |
| photo-4.jpg | photo-1493238792000-8113da705763 |
| photo-5.jpg | photo-1487754180451-c456f719a1fc |
| photo-6.jpg | photo-1526726538690-5cbf956ae2fd |
| model-silverado.jpg | photo-1533473359331-0135ef1b58bf |
| model-equinox.jpg | photo-1519641471654-76ce0107ad1b |
| model-tahoe.jpg | photo-1590362891991-f776e747a588 |
| model-malibu.jpg | photo-1571987502227-9231b837d92a |
| model-camaro.jpg | photo-1552519507-da3b142c6e3d |
| model-corvette.jpg | photo-1605559424843-9e4c228bf1c2 |

`mixed-*.jpg` are crops of the `vehicle-*.jpg` files above (same Unsplash sources),
deliberately mismatched dimensions for the "Mixed image sizes" demo section.

## Chrome model cutouts

`chrome-*.webp` (lossy WebP derivatives of the original `chrome-*.png` cutouts, which
were removed from the tree after conversion — see git history) are ChromeData
(JD Power) licensed library renders served through
the DealerOn platform (Chrome Photo Builder, angle 1, transparent PNG at 320/640),
fetched from a live DealerOn storefront. Internal demo use for DealerOn team
presentation; on a production DealerOn site reference them with
`#CHROMEPHOTOPATH|StyleID|1|640p#` instead of copying files.

## Video testimonial embed

The testimonials dialog embeds **Big Buck Bunny** (© Blender Foundation,
<https://peach.blender.org>) via `youtube-nocookie.com`, YouTube id `aqz-KE-bpKQ`.
It is Creative Commons Attribution licensed, so it is safe to ship in a public
demo — unlike a real dealer testimonial, which would not be. Nothing is
downloaded into this repo; the embed is a third-party iframe.

On a production site, swap the `data-video-id` on each trigger for the dealer's
own video. The stop-on-close wiring does not care which id it is.

## oem/ — brand-correct model images (added 19 Aug 2026)

`oem/<brand>/*.{png,webp,jpg}` are the OEM model-bar images each library strip's
own source demo site serves — DealerOn-licensed ColorMatched/stock cutouts
(`/assets/stock/…`) and OEM-syndicated model-bar art (`/static/brand-*/…`),
harvested one size per model from: acurademo1, lexusdemo1, buickdemo1,
audidemo1, genesisdemo1, lincolndemo1, forddemo2, hyundaidemo2, mazdademo1,
toyotademo2, alfaromeodemo1, and cdjrdemo1. Same asset class and license as the
`chrome-*.webp` Chevrolet cutouts above. Internal demo use only — these are OEM
marketing assets, not freely redistributable imagery.
