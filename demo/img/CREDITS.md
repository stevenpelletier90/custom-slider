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

## Chrome model cutouts (`chrome-*.png`)

17 ChromeData (JD Power) licensed renders pulled 2026-08-27 from the model bar on
`chevroletdemo1.dealeron.com` — the platform's **Chrome Photo Builder** output:
angle 01, transparent PNG, `ColorMatched_01` at 320 and 640 wide (the Corvette and
BrightDrop come from the `Expanded` set; the shared Bolt art is a brand static with
no 640 variant).

**Internal demo use for DealerOn team presentation only.** On a production DealerOn
site do not copy these files — reference the renders through the platform:
`#CHROMEPHOTOPATH|StyleID|1|640p#`.

| Model | Files |
| --- | --- |
| Silverado EV | `chrome-silverado-ev.png` + `chrome-silverado-ev-640.png` |
| Silverado 1500 | `chrome-silverado-1500.png` + `chrome-silverado-1500-640.png` |
| Silverado 2500HD | `chrome-silverado-2500hd.png` + `chrome-silverado-2500hd-640.png` |
| Silverado 3500HD | `chrome-silverado-3500hd.png` + `chrome-silverado-3500hd-640.png` |
| Colorado | `chrome-colorado.png` + `chrome-colorado-640.png` |
| Bolt / Bolt EV | `chrome-bolt.png` |
| Equinox | `chrome-equinox.png` + `chrome-equinox-640.png` |
| Equinox EV | `chrome-equinox-ev.png` + `chrome-equinox-ev-640.png` |
| Blazer | `chrome-blazer.png` + `chrome-blazer-640.png` |
| Blazer EV | `chrome-blazer-ev.png` + `chrome-blazer-ev-640.png` |
| Trax | `chrome-trax.png` + `chrome-trax-640.png` |
| Trailblazer | `chrome-trailblazer.png` + `chrome-trailblazer-640.png` |
| Tahoe | `chrome-tahoe.png` + `chrome-tahoe-640.png` |
| Traverse | `chrome-traverse.png` + `chrome-traverse-640.png` |
| Suburban | `chrome-suburban.png` + `chrome-suburban-640.png` |
| Corvette | `chrome-corvette.png` + `chrome-corvette-640.png` |
| BrightDrop | `chrome-brightdrop.png` + `chrome-brightdrop-640.png` |

## Known gap — the "Explore Chevrolet models" example

Its six cards (`model-*.jpg`) are still Unsplash stand-ins carrying real Chevrolet
model names, so a card labelled "Malibu" is not a Malibu. The cutout examples above
were moved onto genuine Chrome Photo Builder renders; this one was not, because its
card design is a portrait cover-crop photo and the renders are landscape cutouts on
transparency. Fixing it properly means pulling six real images from the DealerOn
library. Until then, treat those labels as placeholder text.
