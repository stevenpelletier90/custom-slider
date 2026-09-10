// The 32 OEM brands on the platform, as presets for the one component.
//
// A preset is NOT a copy of a slider. It sets the ROSTER (which vehicles), the
// LADDER (how many across at each breakpoint), and - since 2026-09-09, where a
// brand has been measured - the VALUES that brand's live demo draws: a
// `styles` block of knob values keyed by look and by pattern. See
// docs/superpowers/specs/2026-09-09-oem-variants-design.md.
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
  const TIER_BOX = { base: 330, 768: 750, 992: 970, 1200: 1170 };

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
      // Playwright against the demo's own tabs pattern on 2026-09-09 - every
      // difference was a value, none was structure, which is what lets this be
      // a preset rather than a second pattern. The blue is the site's link
      // colour; on a real Chevy site a designer swaps it for the theme's.
      styles: {
        looks: {
          tile: { '--name-case': 'capitalize', '--name-color': '#333' },
        },
        patterns: {
          tabs: {
            props: { '--tab-size': '1.125em', '--tab-dim': '1', '--tab-line': '#006dc7', '--tab-rule': 'transparent', '--tab-divider': "'|'" },
            panes: ['Trucks', 'Electric', 'Crossovers/SUVs', 'Performance', 'Commercial'],
          },
        },
      },
      source: 'chevroletdemo1.dealeron.com, 2026-09-09',
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
      // (rgb(187, 22, 43) both, 3px), so there is no line colour independent
      // of the text to capture - --tab-line stays at the pattern default and
      // the added test drops that one assertion instead of inventing a value.
      // The rule under the tabs measured border-bottom-width: 0px, which
      // reads as transparent regardless of its border-bottom-color.
      styles: {
        looks: { tile: { '--name-color': '#333' } },
        patterns: {
          tabs: {
            props: { '--tab-dim': '1', '--tab-rule': 'transparent', '--tab-divider': "'|'" },
            panes: ['Popular', 'Cars & Minivan', 'Trucks', 'Crossovers & SUVs', 'Electrified'],
          },
        },
      },
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

  function perViewFor(ladder, minCard, gapPx = 8, look = 'tile') {
    const out = {};
    for (const [tier, box] of Object.entries(TIER_BOX)) {
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
    if (list) b.models = list;
  }

  globalThis.CARGO = Object.assign(globalThis.CARGO || {}, { BRANDS, perViewFor, TIER_BOX, CHROME, MARGIN });
})();
