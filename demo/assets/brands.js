// The 32 OEM brands on the platform, as presets for the one component.
//
// A preset is NOT a copy of a slider. It sets the ROSTER (which vehicles), the
// LADDER (how many across at each breakpoint), and - since 2026-09-09, where a
// brand has been measured - the VALUES that brand's live demo draws: a
// `styles` block of knob values keyed by look and by pattern. See
// docs/specs/2026-09-09-oem-variants-design.md.
//
// What a preset never does is change MARKUP. It used to apply `look` as well,
// and a look owns an element tree: picking Alfa Romeo on the model bar
// reordered the name above the photo, added a CTA button, went dark and
// cropped 3:5 - you chose a pattern from the rail and got a different one
// back. The census this file cites (docs/research/2026-08-18-oem-demo-slider-
// census.md) says the variety across OEMs is "skin, not structure", and a skin
// is values, which is exactly what `styles` holds. `look` stays in each entry
// as a suggestion the panel offers in words.
//
// `ladder` is the brand's REAL slick config, recorded verbatim as
// [minWidth, perView] pairs, so it stays auditable against the census. It is
// deliberately not what gets emitted: perViewFor() reads each ladder at the
// platform's own Bootstrap 3 tiers (768 / 992 / 1200) and clamps anything that
// would squeeze a card below the width its content needs.
//
// Colour: a `styles` block may carry a brand's hex (Chevrolet's tab line is
// its link blue) because the live site draws it. It is a starting value the
// designer overrides with the site's theme colour, not a claim about the
// theme - the builder cannot see the page it is pasted into. A brand with no
// `styles` block sets no colour at all, which is why the arrow/gap controls
// sit right next to the picker.

(() => {
  // Bootstrap 3's own .container widths, measured in the DealerOn CSS bundle -
  // the box a slider on a real page actually gets. Not the viewport, and not
  // this demo's stage, which is why the workbench's fit warning is checked
  // against the rendered card rather than against these numbers.
  // The look's own horizontal chrome comes off separately - see CHROME.
  // base is 330, not 360: below 768 Bootstrap 3's .container has no width, it
  // is fluid with 15px of padding each side, so a 360px phone hands the
  // slider 330px. 360 is the SCREEN, and mixing a screen width into a table
  // of container widths credited every phone with 30px it does not have.
  //
  // Two grids since 2026-09-15: the platform runs Bootstrap 3 today and is
  // moving to Bootstrap 5, whose .container is a little narrower at every
  // tier (720 / 960 / 1140) and has two tiers of its own, 576 (540px) and
  // 1400 (1320px). The builder's grid toggle picks one; presets are checked
  // against both. Bootstrap 3 has no rule at 576 or 1400, so there the box is
  // what the tier below gives (fluid at 576, 1170 at 1400). Bootstrap 5's
  // container pads 12px a side, not 15, so a 360px phone hands it 336.
  const TIER_BOX = {
    bs3: { base: 330, 576: 546, 768: 750, 992: 970, 1200: 1170, 1400: 1170 },
    bs5: { base: 336, 576: 540, 768: 720, 992: 960, 1200: 1140, 1400: 1320 },
  };

  // The vehicles each brand actually shows, from the cutouts in demo/img/oem.
  // [folder, [[file, width, height, name], ...]] - real intrinsic sizes,
  // because they vary a lot between brands (Lexus ships 240x140, Genesis
  // 640x360, Alfa Romeo 300x500 portraits) and the wrong width/height
  // attribute is a layout shift on a real page.
  //
  // Thirty-one of the 32 have imagery. Only Fiat falls back to the Chevrolet
  // cutouts, and says so in the picker rather than pretending otherwise.
  const ROSTERS = {
    bmw: [
      'bmw',
      [
        ['3-series.png', 320, 240, '3 Series'],
        ['i4.png', 320, 240, 'i4'],
        ['ix.png', 320, 240, 'iX'],
        ['x3.png', 320, 240, 'X3'],
        ['x5.png', 320, 240, 'X5'],
      ],
    ],
    cadillac: [
      'cadillac',
      [
        ['ct5-v.png', 320, 240, 'CT5-V'],
        ['escalade-esv.png', 320, 240, 'Escalade ESV'],
        ['escalade-iq.png', 320, 240, 'Escalade IQ'],
        ['escalade-iql.png', 320, 240, 'Escalade IQL'],
        ['escalade.png', 320, 240, 'Escalade'],
      ],
    ],
    honda: [
      'honda',
      [
        ['passport.png', 320, 240, 'Passport'],
        ['pilot.png', 320, 240, 'Pilot'],
        ['prologue.png', 320, 240, 'Prologue'],
      ],
    ],
    infiniti: ['infiniti', [['qx80.png', 320, 240, 'QX80']]],
    jaguar: [
      'jaguar',
      [
        ['f-pace.png', 320, 240, 'F-PACE'],
        ['f-type.png', 320, 240, 'F-TYPE'],
      ],
    ],
    landrover: [
      'landrover',
      [
        ['defender.png', 320, 240, 'Defender'],
        ['range-rover.png', 320, 240, 'Range Rover'],
      ],
    ],
    mitsubishi: ['mitsubishi', [['outlander.png', 320, 240, 'Outlander']]],
    porsche: [
      'porsche',
      [
        ['911.png', 320, 240, '911'],
        ['cayenne.png', 320, 240, 'Cayenne'],
      ],
    ],
    subaru: [
      'subaru',
      [
        ['ascent.png', 320, 240, 'Ascent'],
        ['outback.png', 320, 240, 'Outback'],
      ],
    ],
    volkswagen: ['volkswagen', [['atlas.png', 320, 240, 'Atlas']]],
    volvo: ['volvo', [['ex90.png', 320, 240, 'EX90']]],
    gmc: [
      'gmc',
      [
        ['sierra-1500.png', 320, 240, 'Sierra 1500'],
        ['sierra-hd.png', 320, 240, 'Sierra HD'],
        ['terrain.png', 320, 240, 'Terrain'],
        ['acadia.png', 320, 240, 'Acadia'],
        ['yukon.png', 320, 240, 'Yukon'],
        ['canyon.png', 320, 240, 'Canyon'],
      ],
    ],
    kia: [
      'kia',
      [
        ['k4.png', 320, 240, 'K4'],
        ['k5.png', 320, 240, 'K5'],
        ['seltos.png', 320, 240, 'Seltos'],
        ['sportage.png', 320, 240, 'Sportage'],
        ['sorento.png', 320, 240, 'Sorento'],
        ['telluride.png', 320, 240, 'Telluride'],
        ['sorento-hybrid.png', 320, 240, 'Sorento Hybrid'],
        ['niro.png', 320, 240, 'Niro'],
        ['ev6.png', 320, 240, 'EV6'],
        ['ev9.png', 320, 240, 'EV9'],
        ['niro-ev.png', 320, 240, 'Niro EV'],
        ['niro-plug-in-hybrid.png', 320, 240, 'Niro Plug-In Hybrid'],
      ],
    ],
    mini: [
      'mini',
      [
        ['hardtop-2-door.png', 320, 240, 'Hardtop 2 Door'],
        ['countryman.png', 320, 240, 'Countryman'],
      ],
    ],
    nissan: [
      'nissan',
      [
        ['rogue.png', 320, 240, 'Rogue'],
        ['rogue-phev.png', 320, 240, 'Rogue PHEV'],
        ['kicks.png', 320, 240, 'Kicks'],
        ['murano.png', 320, 240, 'Murano'],
        ['pathfinder.png', 320, 240, 'Pathfinder'],
        ['armada.png', 320, 240, 'Armada'],
        ['sentra.png', 320, 240, 'Sentra'],
        ['altima.png', 320, 240, 'Altima'],
        ['versa.png', 320, 240, 'Versa'],
        ['frontier.png', 320, 240, 'Frontier'],
        ['z.png', 320, 240, 'Z'],
      ],
    ],
    acura: [
      'acura',
      [
        ['integra.png', 320, 240, 'Integra'],
        ['tlx.png', 320, 240, 'TLX'],
        ['adx.png', 320, 240, 'ADX'],
        ['rdx.png', 320, 240, 'RDX'],
        ['zdx.png', 480, 300, 'ZDX'],
        ['mdx.png', 320, 240, 'MDX'],
      ],
    ],
    lexus: [
      'lexus',
      [
        ['ux-hybrid.png', 240, 140, 'UX Hybrid'],
        ['nx.png', 240, 140, 'NX'],
        ['nx-hybrid.png', 240, 140, 'NX Hybrid'],
        ['rz.png', 240, 140, 'RZ'],
        ['rx.png', 240, 140, 'RX'],
        ['gx.png', 240, 140, 'GX'],
      ],
    ],
    buick: [
      'buick',
      [
        ['envista.png', 320, 240, 'Envista'],
        ['encore-gx.png', 320, 240, 'Encore GX'],
        ['envision.png', 320, 240, 'Envision'],
        ['enclave.png', 320, 240, 'Enclave'],
      ],
    ],
    audi: [
      'audi',
      [
        ['e-tron-gt.webp', 420, 180, 'e-tron GT'],
        ['q4-e-tron.webp', 420, 180, 'Q4 e-tron'],
        ['q6-e-tron.webp', 420, 180, 'Q6 e-tron'],
        ['q3.webp', 420, 180, 'Q3'],
        ['q5.webp', 420, 180, 'Q5'],
        ['q7.webp', 420, 180, 'Q7'],
      ],
    ],
    genesis: [
      'genesis',
      [
        ['g70.png', 400, 225, 'G70'],
        ['g80.png', 400, 225, 'G80'],
        ['g90.png', 400, 225, 'G90'],
        ['gv60.png', 640, 360, 'GV60'],
        ['gv70.png', 400, 225, 'GV70'],
        ['gv80.png', 400, 225, 'GV80'],
      ],
    ],
    lincoln: [
      'lincoln',
      [
        ['navigator.png', 320, 240, 'Navigator'],
        ['aviator.png', 320, 240, 'Aviator'],
        ['nautilus.png', 320, 240, 'Nautilus'],
        ['corsair.png', 320, 240, 'Corsair'],
      ],
    ],
    ford: [
      'ford',
      [
        ['mustang.png', 320, 240, 'Mustang'],
        ['mach-e.png', 320, 240, 'Mach-E'],
        ['escape.png', 320, 240, 'Escape'],
        ['explorer.png', 320, 240, 'Explorer'],
        ['bronco.png', 320, 240, 'Bronco'],
        ['f-150.png', 320, 240, 'F-150'],
      ],
    ],
    hyundai: [
      'hyundai',
      [
        ['kona.png', 340, 213, 'Kona'],
        ['tucson.png', 340, 213, 'Tucson'],
        ['santa-fe.png', 340, 213, 'Santa Fe'],
        ['palisade.png', 340, 213, 'Palisade'],
        ['ioniq-5.png', 340, 213, 'IONIQ 5'],
        ['elantra.png', 340, 213, 'Elantra'],
      ],
    ],
    mazda: [
      'mazda',
      [
        ['cx-30.png', 480, 209, 'CX-30'],
        ['cx-5.png', 480, 209, 'CX-5'],
        ['cx-50.png', 480, 209, 'CX-50'],
        ['cx-90.png', 480, 209, 'CX-90'],
        ['mazda3-sedan.png', 480, 209, 'Mazda3 Sedan'],
        ['mx-5-miata.png', 480, 209, 'MX-5 Miata'],
      ],
    ],
    // Cutouts from the folder toyotademo1's own model bar reads
    // (brand-toyota/Homepage/model-bar/2026/angular-left, 29 models at
    // 518x220). The picture-based JPGs that were here until 2026-09-10 were the
    // split card's photographs, and a brand roster is only ever drawn on a
    // cutout card - so they were the wrong asset class on every card that
    // could show them.
    toyota: [
      'toyota',
      [
        ['rav4.png', 518, 220, 'RAV4'],
        ['highlander.png', 518, 220, 'Highlander'],
        ['4runner.png', 518, 220, '4Runner'],
        ['corolla.png', 518, 220, 'Corolla'],
        ['corolla-hatchback.png', 518, 220, 'Corolla Hatchback'],
        ['camry.png', 518, 220, 'Camry'],
        ['tacoma.png', 518, 220, 'Tacoma'],
        ['tundra.png', 518, 220, 'Tundra'],
        ['landcruiser.png', 518, 220, 'Land Cruiser'],
        ['grand-highlander.png', 518, 220, 'Grand Highlander'],
      ],
    ],
    // The mb-*.png cutouts alfaromeodemo1 ships beside its tall portrait
    // photographs (brand-alfa-romeo/homepage/model-bar/2025, 580x344). The
    // 300x500 ar-*.jpg portraits that were here until 2026-09-10 are the tall
    // tile's own art, and a brand roster is only ever drawn on a cutout card.
    alfaromeo: [
      'alfaromeo',
      [
        ['mb-tonale-sprint.png', 580, 344, 'Tonale'],
        ['mb-tonale-hybrid.png', 580, 344, 'Tonale Hybrid'],
        ['mb-giulia-sprint.png', 580, 344, 'Giulia'],
        ['mb-stelvio-veloce.png', 580, 344, 'Stelvio'],
        ['mb-giulia-qv.png', 580, 344, 'Giulia Quadrifoglio'],
        ['mb-stelvio-qv.png', 580, 344, 'Stelvio Quadrifoglio'],
      ],
    ],
    chevrolet: [
      '',
      [
        ['chrome-silverado-1500.webp', 320, 240, 'Silverado 1500'],
        ['chrome-colorado.webp', 320, 240, 'Colorado'],
        ['chrome-tahoe.webp', 320, 240, 'Tahoe'],
        ['chrome-suburban.webp', 320, 240, 'Suburban'],
        ['chrome-traverse.webp', 320, 240, 'Traverse'],
        ['chrome-trax.webp', 320, 240, 'Trax'],
        ['chrome-equinox.webp', 320, 240, 'Equinox'],
        ['chrome-trailblazer.webp', 320, 240, 'Trailblazer'],
      ],
    ],
    chrysler: [
      'cdjr',
      [
        ['chrysler-pacifica.png', 480, 360, 'Pacifica'],
        ['chrysler-voyager.png', 480, 360, 'Voyager'],
      ],
    ],
    dodge: [
      'cdjr',
      [
        ['dodge-charger.png', 480, 360, 'Charger'],
        ['dodge-durango.png', 480, 360, 'Durango'],
      ],
    ],
    jeep: [
      'cdjr',
      [
        ['jeep-wrangler.png', 480, 360, 'Wrangler'],
        ['jeep-grand-cherokee.png', 480, 360, 'Grand Cherokee'],
      ],
    ],
    ram: [
      'cdjr',
      [
        ['ram-1500.png', 480, 360, 'Ram 1500'],
        ['ram-2500.png', 480, 360, 'Ram 2500'],
      ],
    ],
  };

  const roster = (id, label) => {
    const entry = ROSTERS[id];
    if (!entry) return null;
    const [folder, items] = entry;
    return items.map(([file, w, h, name]) => ({
      img: folder ? `img/oem/${folder}/${file}` : `img/${file}`,
      w,
      h,
      name,
      mark: label,
      alt: `${label} ${name}`,
      sub: 'In stock now',
      blurb: `Explore the ${label} ${name}.`,
      href: `/searchnew.aspx?Model=${encodeURIComponent(name)}`,
    }));
  };

  const BRANDS = {
    acura: {
      label: 'Acura',
      look: 'tile',
      ladder: [
        [0, 2],
        [460, 3],
        [768, 5],
      ],
      demos: 3,
    },
    alfaromeo: {
      label: 'Alfa Romeo',
      look: 'portrait',
      ladder: [
        [0, 1],
        [540, 2],
        [992, 3],
        [1200, 4],
        [1800, 6],
      ],
      demos: 1,
      note: 'The most styled bar we surveyed — tall dark tiles with a browse button.',
    },
    audi: {
      label: 'Audi',
      look: 'tile',
      ladder: [
        [0, 1],
        [360, 2],
        [768, 3],
        [992, 4],
        [1200, 6],
      ],
      demos: 1,
      note: 'Steps the count five times as the screen grows — more steps than any other brand, and the clearest case for snapping to the platform’s own four widths.',
    },
    bmw: { label: 'BMW', look: 'tile', ladder: null, demos: 3 },
    buick: {
      label: 'Buick',
      look: 'tile',
      ladder: [
        [0, 2],
        [460, 3],
        [768, 4],
      ],
      demos: 2,
    },
    cadillac: {
      label: 'Cadillac',
      look: 'tile',
      ladder: [
        [0, 2],
        [539, 3],
        [992, 4],
        [1200, 5],
      ],
      demos: 3,
      note: 'The same counts as Chevrolet, on a black band with spaced capitals — same layout, different dress.',
      // The variant: what cadillacdemo1 draws, as knob values, measured with
      // Playwright at 1280/800/390 on 2026-09-14, the third tabbed bar of the
      // day. Chevrolet's dress on a black band, the note above turned out to
      // be exactly right - and the band is the one thing no knob had.
      //
      // The page is a 14px Cadillac Gothic body, white on a #0a0a0a section
      // (the platform's bg-cta band, overridden by the section's own rule):
      // - "Explore The Cadillac Lineup" in heading-lg (Cadillac Gothic Wide,
      //   32px, 400, uppercase, 0.15em of tracking), 13px over the tabs;
      // - three 18px tabs in the body font, white at full strength, 10px over
      //   and under the label and 15px a side, 32px apart with a `|` at the
      //   body size between them (hidden below 540 on the live page), a 2px
      //   #ddd line under the picked one that grows from the centre on hover
      //   and on pick over 0.15s, the same easing as Chevrolet's, and no rule
      //   under the row; 20px from the row to the cars;
      // - slides butt together, the cutout drawn at 85% (0.9 on hover, 0.1s
      //   ease-in), the lightning badge baked into the electric cutouts;
      // - the name 16px, 400, uppercase, white, 2px under the cutout;
      // - arrows: the brand's own white chevron SVG, 22px wide at 0.75 opacity,
      //   full on hover, in a 35px channel; a picked pane fades in over 0.15s;
      // - "Explore All New Inventory" 42px under the bar, a white outline
      //   button 14px 32px in the theme's btn-lg, which the theme draws that
      //   way on any bg-main band.
      // Kept on purpose: the engine's chevron and scroll physics, the band
      // padding at the platform's tablet tier (35px) below 768 too, where
      // the live section leaves 30, and one car per view on a phone where
      // the live bar squeezes two 138px cards under the tile's 150px floor.
      // The band's black is NOT here: the live page's section rule paints
      // it, and on a dealer page bg-main is whatever the theme says.
      styles: {
        looks: {
          tile: {
            '--name-color': '#fff',
            '--name-case': 'uppercase',
            '--name-size': '1.14em',
            '--name-weight': '400',
            '--name-leading': '1.4286',
            '--name-gap': '0.13em',
            '--plate-pad': '5.6% 7.5% 0',
            '--img-hover-scale': '1.06',
            '--img-hover-speed': '0.1s',
            '--strip-pad-x': 'var(--cs-arrow-size)',
          },
        },
        patterns: {
          tabs: {
            props: {
              '--cs-gap': '0.1px',
              '--cs-arrow-size': '2.5em',
              '--cs-arrow-fg': 'rgba(255, 255, 255, 0.75)',
              '--cs-arrow-fg-hover': '#fff',
              '--cs-arrow-bg-hover': 'transparent',
              '--tab-size': '1.29em',
              '--tab-weight': '400',
              '--tab-leading': '1.4286',
              '--tab-dim': '1',
              '--tab-line': '#ddd',
              '--tab-line-grow': '0.15s',
              '--tab-rule': 'transparent',
              '--tab-divider': "'|'",
              '--tab-divider-size': '0.78',
              '--tab-gap': '1.78em',
              // 10px over and under the label, 15px a side, in the 18px tab's
              // em; the 2px line sits in the bottom 10 the way the live one
              // does (bottom: 0 on a 10px-padded link).
              '--tab-pad': '0.56em 0.83em',
              '--tab-row-gap': '1.43em',
              '--tab-fade': '0.15s',
              '--title-gap': '0.41em',
              '--more-gap': '3em',
              // No band colour: the wrap wears bg-main and the site paints it
              // (cadillacdemo1's own section rule makes that #0a0a0a there;
              // a dealer's theme decides on a dealer's page).
              '--bar-pad': '7.14em',
              '--bar-pad-narrow': '2.5em',
              // Below 768: the live bar drops to 16px tabs (1.14em of the
              // 14px body) and hides the `|`, measured at 390 on 2026-09-15.
              // Its own switch is at 540; the platform's phone tier is the
              // nearest one the pattern has.
              '--tab-size-phone': '1.14em',
              '--tab-divider-phone': 'none',
            },
            // Phone-short names, in the platform's own hidden-xs span (the
            // [bracket] convention htmlFor() reads, and the reason Ford's bar
            // is the one that fits a 390 screen at its measured size). The
            // WIDE label is unchanged - what is in brackets is only dropped
            // below 768. Type alone could not close this gap: five of these
            // labels need 5px at 320 to sit on one line, so the words are
            // what had to give (2026-09-15, Steven: fit within the viewport).
            panes: ['Electric', '[Crossovers/]SUVs', 'Sedans'],
            // bg-main makes the wrap the platform's dark band: white text and
            // the white outline button come from the theme, not from here.
            words: { title: 'Explore The Cadillac Lineup', titleClass: 'heading-lg', moreText: 'Explore All New Inventory', moreHref: '/searchnew.aspx', wrapClass: 'bg-main' },
          },
        },
      },
      // PREVIEW ONLY. Cadillac sites set Cadillac Gothic on the whole body
      // (and Cadillac Gothic Wide on heading-lg, named in theme.css below),
      // from a sheet DealerOn's CDN serves with Access-Control-Allow-Origin: *
      // (checked 2026-09-14).
      font: { family: 'Cadillac Gothic', css: 'https://cdn.dealeron.com/assets/fonts/cadillac-gothic/fonts.min.css' },
      // PREVIEW ONLY: cadillacdemo1's four theme tokens and its own rules for
      // the classes the snippet names. The snippet carries none.
      theme: {
        '--cta-background-color': '#171473',
        '--cta-font-color': '#fff',
        '--cta-hover-color': '#221dad',
        '--main-color': '#282828',
        css: '.heading-lg{font-family:"Cadillac Gothic Wide",sans-serif;font-size:32px;font-weight:400;line-height:1.1;text-transform:uppercase;letter-spacing:0.15em}.btn{font-weight:400;text-transform:uppercase;border-radius:0;transition:background-color 200ms linear,color 200ms linear,border-color 200ms linear}.btn-lg{padding:14px 32px;font-size:14px;line-height:1.3333}.btn-cta{color:#000;background-color:transparent;border-color:#000}.bg-main .btn-cta{color:#fff;background-color:transparent;border-color:#fff}.bg-main .btn-cta:hover,.bg-main .btn-cta:focus{color:#282828;background-color:#fff;border-color:#fff}',
      },
      source: 'cadillacdemo1.dealeron.com, 2026-09-14',
    },
    chevrolet: {
      label: 'Chevrolet',
      look: 'tile',
      ladder: [
        [0, 2],
        [539, 3],
        [992, 4],
        [1200, 5],
      ],
      demos: 3,
      note: 'Since Nov 2025 the official bar is the tabbed version; the plain slick look was deprecated and its sites migrated.',
      // The variant: what chevroletdemo1 draws, as knob values. Measured with
      // Playwright against the demo's own tabs pattern on 2026-09-09 and
      // again, more closely, on 2026-09-14 - every difference was a value,
      // none was structure, which is what lets this be a preset rather than a
      // second pattern. The blue is the site's link colour; on a real Chevy
      // site a designer swaps it for the theme's.
      //
      // The 2026-09-14 pass, at 1280/800/390 with the site's own computed
      // styles (the raw numbers are in that commit):
      // - tab label 18px on a 14px body = 1.29em (the first pass wrote
      //   1.125em, which is 18 over a 16px body the site does not have),
      //   wrapped in <b> so 700, colour #222, no dimming, 16px under 480;
      // - divider `|` is its own list item in #767676 at the body size;
      // - no rule under the row, 2px #006dc7 under the selected tab;
      // - slides butt together (no gap) and the cutout is drawn at 85%
      //   (transform: scale(.85), 0.9 on hover) - as padding that is 7.5% a
      //   side and 5.6% on top, bottom 0, which lands the car and the name
      //   within a pixel of the live bar;
      // - name 16px = 1.14em, 600, #333, capitalised;
      // - arrows (shown on a pane with more than five models) #666.
      //
      // The afternoon pass the same day, after the bar still did not look
      // like the live one - motion and spacing, which the morning never
      // measured (Steven: "it's the animations, the spacing"):
      // - the cutout grows in 0.1s, not the look's 0.25s;
      // - the name sits 2px under the cutout on a 17.6px line (0.14em gap on
      //   the 14px body, line-height 1.1), which took 9px off the bar's height;
      // - 31px between one tab and the next (1.7em of the 18px tab), the row
      //   57px tall (0.75em of vertical padding), the divider at the body's
      //   14px (0.78em of the tab);
      // - a picked pane fades in over 0.15s (Bootstrap's .fade);
      // - the arrows turn the link blue on hover, on no background - the
      //   engine's default hover is white on a dark circle, which is not what
      //   the live bar does;
      // - "View Our Lineup" over the bar and a blue "Explore All New
      //   Inventory" button under it, both the pattern's own words; only the
      //   button's blue is Chevrolet's.
      // Kept on purpose: the engine's bare chevron (the live icon is a chevron
      // in a circle) and the engine's scroll physics (slick's 500ms slide).
      styles: {
        looks: {
          tile: {
            '--name-case': 'capitalize',
            '--name-color': '#333',
            '--name-size': '1.14em',
            '--plate-pad': '5.6% 7.5% 0',
            '--img-hover-scale': '1.06',
            '--img-hover-speed': '0.1s',
            '--name-gap': '0.14em',
            '--name-leading': '1.1',
          },
        },
        patterns: {
          tabs: {
            props: {
              '--cs-gap': '0.1px',
              '--cs-arrow-fg': '#666',
              // The site's own button colour, not its hex: the live bar draws
              // the arrow hover and the tab line from var(--cta-background-
              // color), a token every DealerOn theme defines (checked on the
              // Chevrolet, Toyota, BMW and Ford demos, 2026-09-14). Named the
              // same way here, the preset is right on any Chevrolet site, and
              // the builder's preview resolves it from `theme` below.
              '--cs-arrow-fg-hover': 'var(--cta-background-color)',
              '--cs-arrow-bg-hover': 'transparent',
              '--tab-size': '1.29em',
              '--tab-weight': '700',
              '--tab-dim': '1',
              '--tab-line': 'var(--cta-background-color)',
              '--tab-rule': 'transparent',
              '--tab-divider': "'|'",
              '--tab-divider-color': '#767676',
              '--tab-gap': '1.7em',
              // 0.75em above and below the label, plus the 2px line's own
              // room under it (the line sits inside the padding since
              // 2026-09-14): 13.5 + 2 = 15.5px of the 18px tab.
              '--tab-pad': '0.75em 1.1em 0.86em',
              '--tab-divider-size': '0.78',
              '--tab-fade': '0.15s',
              // The line under a picked OR hovered tab (an ::after on the live
              // link: `li.active a::after, li a:hover::after`) grows from the
              // centre over 0.15s, cubic-bezier(0.215, 0.61, 0.355, 1), and
              // shrinks back when the pointer leaves an unselected tab.
              '--tab-line-grow': '0.15s',
            },
            // Phone-short names, in the platform's own hidden-xs span (the
            // [bracket] convention htmlFor() reads, and the reason Ford's bar
            // is the one that fits a 390 screen at its measured size). The
            // WIDE label is unchanged - what is in brackets is only dropped
            // below 768. Type alone could not close this gap: five of these
            // labels need 5px at 320 to sit on one line, so the words are
            // what had to give (2026-09-15, Steven: fit within the viewport).
            panes: ['Trucks', 'Electric', '[Crossovers/]SUVs', 'Perf[ormance]', 'Comm[ercial]'],
          },
        },
      },
      // PREVIEW ONLY. The typeface Chevrolet sites load, from the stylesheet
      // DealerOn's CDN serves it from (Access-Control-Allow-Origin: *, checked
      // 2026-09-14). The builder's frame and the Brands page borrow it so the
      // bar is judged in the font it will wear; it never reaches cssFor(), so
      // the copied code names no font - the site already has it.
      font: { family: 'ChevySans', css: 'https://cdn.dealeron.com/assets/fonts/chevy-sans/fonts.min.css' },
      // PREVIEW ONLY, like the font: the four theme tokens chevroletdemo1's
      // :root defines (read 2026-09-14). The builder's frame and the Brands
      // page set them so a value written as var(--cta-background-color)
      // draws this blue here; on a real Chevrolet site the theme supplies
      // them and the copied code carries none of these hexes.
      theme: {
        '--cta-background-color': '#006dc7',
        '--cta-font-color': '#fff',
        '--cta-hover-color': '#0e4180',
        '--main-color': '#262626',
        // The site's own heading and button rules, read off chevroletdemo1's
        // theme layer the same day, so the preview draws the h1 class and the
        // btn-cta class the way that site does: headings 600 and capitalised
        // in ChevySans, buttons bold with a 2px border, an 8px radius and
        // 8px 20px of padding, 18px at btn-lg. Preview only - the snippet
        // names the classes and the site supplies exactly these.
        css: '.h1{font-weight:600;text-transform:capitalize}.btn{padding:8px 20px;font-weight:700;border-width:2px;border-radius:8px;transition:all 250ms ease-in-out}.btn-lg{padding:8px 20px;font-size:18px;line-height:1.3333}',
      },
      source: 'chevroletdemo1.dealeron.com, 2026-09-14',
    },
    chrysler: {
      label: 'Chrysler',
      look: 'tile',
      ladder: [
        [0, 2],
        [460, 3],
        [992, 6],
      ],
      demos: 1,
      note: 'Six across on a desktop, the widest of any brand we surveyed — shared with Dodge, Jeep and Ram.',
    },
    dodge: {
      label: 'Dodge',
      look: 'tile',
      ladder: [
        [0, 2],
        [460, 3],
        [992, 6],
      ],
      demos: 1,
    },
    fiat: {
      label: 'Fiat',
      look: 'tile',
      ladder: [
        [0, 2],
        [460, 3],
        [992, 6],
      ],
      demos: 1,
    },
    ford: {
      label: 'Ford',
      look: 'tile',
      ladder: [
        [0, 1],
        [460, 3],
        [992, 5],
      ],
      demos: 3,
      note: 'Ford’s demo sites run three different counts; this is the most common of them. The other two match Acura and Chevrolet.',
      // The variant: what forddemo1 draws, as knob values, measured with
      // Playwright at 1280/800/390 on 2026-09-14 the same afternoon as the
      // Chevrolet re-measure. The same tabbed pattern in a different dress -
      // every difference was a value, none was structure.
      //
      // The page is a 14px Arial body:
      // - "Something for Everyone" in the platform's h1 class (antennaRegular,
      //   500), a lead paragraph under it in `lead text-muted` (21px, 300,
      //   #777), 10px under the heading and 42px under the lead;
      // - the row and the panes sit in a 1px #ccc box; the panes get 30px of
      //   padding inside it (15px below 992);
      // - four cells that share the row equally, 16px uppercase, 400, #000,
      //   line-height 1.4286, 10px over and 15px under the label plus a 5px
      //   line OVER the picked one in #2a8bbe (a literal in the site's CSS,
      //   not a token); unpicked cells on #f0f0f0 with a 1px #ccc rule under
      //   them and between them, the picked one white and rule-less; hover
      //   draws no line; tabs go to 12px below 992;
      // - slides butt together, the cutout is drawn at 85% (0.9 on hover,
      //   0.1s ease-in) - the same 5.6% 7.5% 0 padding that lands Chevrolet's;
      // - the name 15px, 700, #333, on a 21.4px line, pulled 3px up into the
      //   cutout's transparent margin (-15px on the live p);
      // - arrows only on a pane with more than five models: slick's own 35px
      //   glyph in #6c6c6c at 0.75 opacity (#919191 on white), full strength
      //   on hover, in a 35px channel each side of the cars;
      // - a picked pane fades in over 0.15s (Bootstrap's .fade);
      // - "Explore All New Models" 46px under the bar, in btn btn-cta btn-lg.
      // Kept on purpose: the engine's bare chevron (the live glyph is slick's
      // arrow), the engine's scroll physics (slick's 500ms slide), the theme's
      // own btn-lg padding (the live page pads that one button 10px 25px 14px
      // with a site-scoped rule the snippet must not copy), and the name's
      // desktop gap at every width (the live bar drops the -15px below 992).
      styles: {
        looks: {
          tile: {
            '--name-color': '#333',
            '--name-size': '1.07em',
            '--name-weight': '700',
            '--name-leading': '1.4286',
            '--name-gap': '-0.2em',
            '--plate-pad': '5.6% 7.5% 0',
            '--img-hover-scale': '1.06',
            '--img-hover-speed': '0.1s',
            // The arrow channel is exactly the arrow's width on the live bar.
            '--strip-pad-x': 'var(--cs-arrow-size)',
          },
        },
        patterns: {
          tabs: {
            props: {
              '--cs-gap': '0.1px',
              '--cs-arrow-size': '2.5em',
              '--cs-arrow-fg': '#919191',
              '--cs-arrow-fg-hover': '#6c6c6c',
              '--cs-arrow-bg-hover': 'transparent',
              '--tab-flex': '1 1 0%',
              '--tab-size': '1.14em',
              '--tab-size-narrow': '0.86em',
              '--tab-weight': '400',
              '--tab-leading': '1.4286',
              '--tab-case': 'uppercase',
              '--tab-color': '#000',
              '--tab-selected': '#000',
              '--tab-dim': '1',
              '--tab-bg': '#f0f0f0',
              '--tab-selected-bg': '#fff',
              '--tab-line': '#2a8bbe',
              '--tab-line-hover': 'transparent',
              // 5px over the picked tab, in the 16px tab's em, and room for it
              // in the padding: 10 + 5 over the label, 15 under, 5 a side.
              '--tab-line-size': '0.31em',
              '--tab-line-inset': '0 auto',
              '--tab-pad': '0.94em 0.31em',
              // The same 15px over and under, in the 12px tab's em.
              '--tab-pad-narrow': '1.25em 0.42em',
              // DEPARTURE from the live bar, 2026-09-15. forddemo1 keeps its
              // cells at 12px all the way down and crushes four of them across
              // a 320px screen - 70px each, a label under the platform's own
              // smallest type and a cell too narrow to aim at. The row scrolls
              // under 576 now, so the cells no longer have to fit four across:
              // the phone tier puts them back at the body's 14px, with the
              // live 15px over and under and 5px a side measured in THAT em.
              '--tab-size-phone': '1em',
              '--tab-pad-phone': '1.07em 0.36em',
              // Ford's row is butted cells, not spaced tabs - `--tab-gap` is
              // 0.1px by measurement - so it takes the pattern's tighter phone
              // gap back out. Without this the phone tier gave its four cells
              // gaps they have never had, which pushed a row that fitted 248px
              // exactly to 258 and started it scrolling.
              '--tab-gap-phone': '0.1px',
              '--tab-gap': '0.1px',
              '--tab-rule': 'transparent',
              '--tab-cell-rule': '#ccc',
              '--tab-cell-divider': '#ccc',
              '--tab-row-gap': '0.1px',
              '--tab-fade': '0.15s',
              '--box-border': '1px solid #ccc',
              '--box-pad': '2.14em',
              '--box-pad-narrow': '1.07em',
              '--title-gap': '0.28em',
              '--more-gap': '3.29em',
            },
            // The live tabs shorten on a phone: the bracketed part is the
            // platform's hidden-xs span (see htmlFor).
            panes: ['SUVs [& Crossovers]', 'Trucks [& Vans]', '[All] Electric', 'Cars'],
            words: { title: 'Something for Everyone', lead: 'See our full lineup of vehicles and find the one that best fits you.', moreText: 'Explore All New Models', moreHref: '/searchnew.aspx' },
          },
        },
      },
      // PREVIEW ONLY. Ford sites set antennaRegular on headings alone (the
      // body stays Arial), from a stylesheet DealerOn's CDN serves with
      // Access-Control-Allow-Origin: * (checked 2026-09-14). `headings` keeps
      // it off the preview's body; theme.css below names it on .h1.
      font: { family: 'antennaRegular', css: 'https://cdn.dealeron.com/assets/fonts/fordantenna/fonts.min.css', headings: true },
      // PREVIEW ONLY: forddemo1's four theme tokens and its own rules for the
      // classes the snippet names - headings in antenna at 500, buttons at
      // 400 with a 5px radius and a 0.3s ease. The snippet carries none.
      theme: {
        '--cta-background-color': '#257aa7',
        '--cta-font-color': '#fff',
        '--cta-hover-color': '#196893',
        '--main-color': '#1c394f',
        css: '.h1{font-family:antennaRegular,Arial,Helvetica,sans-serif;font-weight:500}.btn{font-weight:400;border-radius:5px;transition:0.3s ease-in-out}',
      },
      source: 'forddemo1.dealeron.com, 2026-09-14',
    },
    gmc: {
      label: 'GMC',
      look: 'tile',
      ladder: [
        [0, 2],
        [460, 3],
        [768, 5],
      ],
      demos: 2,
    },
    genesis: {
      label: 'Genesis',
      look: 'tile',
      ladder: [
        [0, 1],
        [540, 2],
        [992, 3],
        [1200, 4],
      ],
      demos: 3,
      note: 'Ships an inventory count under each name. The newest sites show fewer across and hide the arrows when every model already fits.',
    },
    honda: {
      label: 'Honda',
      look: 'tile',
      ladder: [
        [0, 1],
        [460, 3],
        [992, 5],
      ],
      demos: 3,
    },
    hyundai: {
      label: 'Hyundai',
      look: 'tile',
      ladder: [
        [0, 1],
        [460, 3],
        [992, 4],
        [1200, 5],
      ],
      demos: 3,
    },
    infiniti: { label: 'Infiniti', look: 'tile', ladder: null, demos: 2 },
    jaguar: {
      label: 'Jaguar',
      look: 'tile',
      ladder: [
        [0, 2],
        [460, 3],
        [768, 4],
      ],
      demos: 1,
    },
    jeep: {
      label: 'Jeep',
      look: 'tile',
      ladder: [
        [0, 2],
        [460, 3],
        [992, 6],
      ],
      demos: 2,
    },
    kia: {
      label: 'Kia',
      look: 'tile',
      ladder: [
        [0, 2],
        [460, 3],
        [768, 5],
      ],
      demos: 3,
    },
    landrover: {
      label: 'Land Rover',
      look: 'tile',
      ladder: [
        [0, 2],
        [460, 3],
        [768, 4],
      ],
      demos: 3,
    },
    lexus: {
      label: 'Lexus',
      look: 'tile',
      ladder: [
        [0, 1],
        [400, 2],
        [600, 3],
        [992, 5],
      ],
      demos: 3,
      note: 'A soft gray gradient band behind spaced capitals; a centered underlined heading above.',
    },
    lincoln: {
      label: 'Lincoln',
      look: 'tile',
      ladder: [
        [0, 2],
        [460, 3],
        [992, 4],
      ],
      demos: 3,
      note: 'A flat light-gray band. Some client builds switch to four across one pixel earlier than the demo sites do — same counts either way.',
    },
    mini: { label: 'MINI', look: 'tile', ladder: null, demos: 3 },
    mazda: {
      label: 'Mazda',
      look: 'tile',
      ladder: [
        [0, 1],
        [768, 2],
        [992, 3],
      ],
      demos: 2,
      note: 'Name above the car, inventory chip below — and the only bar we surveyed that keeps its dots.',
    },
    mitsubishi: {
      label: 'Mitsubishi',
      look: 'tile',
      ladder: [
        [0, 2],
        [460, 3],
        [768, 5],
      ],
      demos: 3,
    },
    nissan: {
      label: 'Nissan',
      look: 'tile',
      ladder: [
        [0, 1],
        [400, 2],
        [600, 3],
        [992, 5],
      ],
      demos: 3,
    },
    porsche: { label: 'Porsche', look: 'tile', ladder: null, demos: 3 },
    ram: {
      label: 'RAM',
      look: 'tile',
      ladder: [
        [0, 2],
        [460, 3],
        [992, 6],
      ],
      demos: 2,
    },
    subaru: {
      label: 'Subaru',
      look: 'tile',
      ladder: [
        [0, 2],
        [539, 3],
        [992, 4],
        [1200, 5],
      ],
      demos: 3,
    },
    toyota: {
      label: 'Toyota',
      // toyotademo1 runs a tabbed cutout bar on the Chevrolet template
      // (measured 2026-09-10: slidesToShow 5, 3 under 991, 2 under 600, 1 under
      // 400, four body-style tabs). toyotademo2's split photo cards are what the
      // census recorded and are still on that site; the tile is the one a
      // roster of cutouts is for.
      look: 'tile',
      ladder: [
        [0, 1],
        [400, 2],
        [600, 3],
        [991, 5],
      ],
      demos: 3,
      note: 'toyotademo1 runs the tabbed cutout bar in body-style tabs; toyotademo2 still shows the older split photo cards.',
      // Measured on toyotademo1 2026-09-10 the same way Chevrolet's were; the
      // raw computed values are in the commit that added this. Knob values
      // only - see the spec's "What measuring an OEM demo may and may not
      // bring in". The live markup does not match the brief's predicted
      // selectors (no #modelBarNav/.stat-tab-link on this build) - the tabs
      // are #myTab > li > a[role="tab"][data-toggle="tab"], dividers are bare
      // `<li role="presentation">|</li>`, no .text-muted - but it is the same
      // tabbed-model-bar feature, just a different template build. The active
      // tab's border-bottom-color measured identical to its own text color
      // (rgb(187, 22, 43) both, 3px) - Toyota colours the SELECTED TAB'S TEXT
      // and the line follows it via currentcolor, which is exactly what
      // --tab-selected + the untouched --tab-line: currentcolor reproduce.
      // The rule under the tabs measured border-bottom-width: 0px, which
      // reads as transparent regardless of its border-bottom-color.
      // --tab-weight 400 read off the same tabs on 2026-09-14, when the knob
      // was added (the labels are plain <a>s at the body weight, unlike
      // Chevrolet's <b>). The rest of Toyota's values are still the
      // 2026-09-10 pass; a closer re-measure like Chevrolet's is its own task.
      styles: {
        looks: { tile: { '--name-color': '#333' } },
        patterns: {
          tabs: {
            props: { '--tab-weight': '400', '--tab-dim': '1', '--tab-selected': '#bb162b', '--tab-rule': 'transparent', '--tab-divider': "'|'" },
            // Phone-short names, in the platform's own hidden-xs span (the
            // [bracket] convention htmlFor() reads, and the reason Ford's bar
            // is the one that fits a 390 screen at its measured size). The
            // WIDE label is unchanged - what is in brackets is only dropped
            // below 768. Type alone could not close this gap: five of these
            // labels need 5px at 320 to sit on one line, so the words are
            // what had to give (2026-09-15, Steven: fit within the viewport).
            panes: ['Popular', 'Cars[ & Minivan]', 'Trucks', '[Crossovers & ]SUVs', 'Electrified'],
          },
        },
      },
      // PREVIEW ONLY, as for Chevrolet. toyotademo1's body is ToyotaType-Book
      // and its bold is synthesised - the CDN sheet defines each cut as its
      // own family at weight normal - so the preview using font-weight on the
      // Book face is exactly what the site does.
      font: { family: 'ToyotaType-Book', css: 'https://cdn.dealeron.com/assets/fonts/ToyotaType/fonts.min.css' },
      source: 'toyotademo1.dealeron.com, 2026-09-10',
    },
    volkswagen: {
      label: 'Volkswagen',
      look: 'tile',
      ladder: [
        [0, 1],
        [540, 2],
        [992, 3],
        [1200, 4],
      ],
      demos: 2,
      note: 'A tile of colour behind each car, one featured in navy — the same counts as Genesis in a different card style.',
    },
    volvo: {
      label: 'Volvo',
      look: 'tile',
      ladder: [
        [0, 2],
        [539, 3],
        [992, 4],
        [1200, 5],
      ],
      demos: 2,
    },
  };

  // What the brand's own config shows at a given viewport width.
  const perAt = (ladder, w) => ladder.reduce((acc, [min, per]) => (w >= min ? per : acc), ladder[0][1]);

  // Read a ladder at the platform's tiers, then refuse any count that would
  // put the card under the width its content needs. The clamp is why a preset
  // never lands cramped: Acura really does run 5-across from 768px, which is a
  // 140px card - narrower than a cutout with a name under it can be.
  // Horizontal space a look takes before any card is drawn. The cutout tile
  // reserves the arrow gutter on both sides (--strip-pad-x is one arrow plus
  // 0.25rem, and --cs-arrow-size defaults to 44px), which is 96px that never
  // belongs to a card. Leaving it out of the clamp is what let Acura's real
  // 5-across ladder through at 768px as a 134px card - measured in the browser,
  // where the workbench's own fit warning caught it.
  const CHROME = { tile: 96, portrait: 48, logo: 32, location: 32 };

  // Headroom above minCard. An arithmetic model cannot predict a rendered card
  // to the pixel - borders, sub-pixel rounding and the scrollbar all move it a
  // few px - and presets clamped to land exactly ON the minimum came out a
  // handful of pixels under it in the browser every time. Clamp to comfortably
  // over instead: a preset that is one notch roomier than the OEM shipped is a
  // far smaller problem than one that arrives already cramped.
  const MARGIN = 12;

  // `grid` is which platform container the clamp is judged against (see
  // TIER_BOX); the ladder itself is read at the same screen widths either way.
  function perViewFor(ladder, minCard, gapPx = 8, look = 'tile', grid = 'bs3') {
    const out = {};
    for (const [tier, box] of Object.entries(TIER_BOX[grid] ?? TIER_BOX.bs3)) {
      const w = tier === 'base' ? 390 : +tier;
      const usable = box - (CHROME[look] ?? 0);
      let n = perAt(ladder, w);
      while (n > 1 && (usable - (n - 1) * gapPx) / n < minCard + MARGIN) n--;
      out[tier === 'base' ? 'base' : +tier] = n;
    }
    return out;
  }

  // Attach each brand's own vehicles. A brand with none keeps `models` unset,
  // and the workbench falls back to the Chevrolet roster.
  for (const [id, b] of Object.entries(BRANDS)) {
    const list = roster(id, b.label);
    // "In stock now" is demo filler under every name. A MEASURED brand's
    // rows carry what its live bar shows, and neither measured bar shows a
    // line under the name - with it, the Chevrolet card ran 17px taller than
    // chevroletdemo1's. A designer who wants a sub line types one in step 1.
    if (list && b.styles) for (const m of list) m.sub = '';
    if (list) b.models = list;
  }

  globalThis.CARGO = Object.assign(globalThis.CARGO || {}, { BRANDS, perViewFor, TIER_BOX, CHROME, MARGIN });
})();
