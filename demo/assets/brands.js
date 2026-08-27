// The 32 OEM brands on the platform, as presets for the one component.
//
// A preset is NOT a copy of a slider. It is a set of values for the settings
// the workbench already exposes: how many cards across at each breakpoint, and
// which card style. That is the whole finding from the census - 24 brands ran
// 11 visual looks, 14 of them sharing a single one, and what actually differed
// between builds was the count and the card, not the carousel.
//
// `ladder` is the brand's REAL slick config, recorded verbatim as
// [minWidth, perView] pairs, so it stays auditable against the census:
// docs/research/2026-08-18-oem-demo-slider-census.md
//
// It is deliberately not what gets emitted. perViewFor() reads each ladder at
// the platform's own Bootstrap 3 tiers (768 / 992 / 1200) and clamps anything
// that would squeeze a card below the width its content needs. The OEM values
// - 460, 539, 540, 400, 600, 1440, 1800 - are one-off numbers from a dozen
// different agencies, and none of them line up with the grid the page around
// the slider is using. Reproducing them is how a strip ends up flipping to
// 5-across one tier before the page does.
//
// Colour is not in here on purpose. A DealerOn site's colours come from its
// own theme, not from a hardcoded OEM hex, so the picker sets layout and card
// style and leaves the two arrow colours to the site. That is also why the
// four arrow/gap controls sit right next to the picker.

(() => {
  // Bootstrap 3's own .container widths, measured in the DealerOn CSS bundle -
  // the box a slider on a real page actually gets. Not the viewport, and not
  // this demo's stage, which is why the workbench's fit warning is checked
  // against the rendered card rather than against these numbers.
  // The look's own horizontal chrome comes off separately - see CHROME.
  const TIER_BOX = { base: 360, 768: 750, 992: 970, 1200: 1170 };

  // The vehicles each brand actually shows, from the cutouts in demo/img/oem.
  // [folder, [[file, width, height, name], ...]] - real intrinsic sizes,
  // because they vary a lot between brands (Lexus ships 240x140, Genesis
  // 640x360, Alfa Romeo 300x500 portraits) and the wrong width/height
  // attribute is a layout shift on a real page.
  //
  // Twelve of the 32 have imagery. The rest fall back to the Chevrolet
  // cutouts and say so in the picker rather than pretending otherwise.
  const ROSTERS = {
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
        ['kona.png', 420, 260, 'Kona'],
        ['tucson.png', 420, 260, 'Tucson'],
        ['santa-fe.png', 320, 240, 'Santa Fe'],
        ['palisade.png', 320, 240, 'Palisade'],
        ['ioniq-5.png', 420, 260, 'IONIQ 5'],
        ['elantra.png', 420, 260, 'Elantra'],
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
    toyota: [
      'toyota',
      [
        ['camry.jpg', 800, 747, 'Camry'],
        ['corolla.jpg', 800, 744, 'Corolla'],
        ['rav4.jpg', 800, 744, 'RAV4'],
        ['tacoma.jpg', 800, 744, 'Tacoma'],
        ['tundra.jpg', 800, 744, 'Tundra'],
        ['4runner.jpg', 800, 744, '4Runner'],
      ],
    ],
    alfaromeo: [
      'alfaromeo',
      [
        ['tonale.jpg', 300, 500, 'Tonale'],
        ['tonale-hybrid.jpg', 300, 500, 'Tonale Hybrid'],
        ['giulia.jpg', 300, 500, 'Giulia'],
        ['stelvio.jpg', 300, 500, 'Stelvio'],
        ['giulia-quadrifoglio.jpg', 300, 500, 'Giulia Quadrifoglio'],
        ['stelvio-quadrifoglio.jpg', 300, 500, 'Stelvio Quadrifoglio'],
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
      note: 'The most styled bar in the estate — tall dark tiles with a browse button.',
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
      note: 'Five rungs, the most granular ladder anywhere — and the clearest case for snapping to the platform grid.',
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
      note: 'The GM ladder on a black band with spaced capitals — same layout as Chevrolet, different dress.',
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
      note: 'The CDJR ladder — six across on desktop, the widest in the estate.',
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
      note: 'Ford runs three different ladders across its demos; this is forddemo1. The others match Acura and Chevrolet.',
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
      note: 'Ships an inventory count under each name. The newest platform generation runs a shorter climb and hides its arrows when every model already fits.',
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
      note: 'A flat light-gray band. Client builds sometimes cut the 4-up tier at 992 instead of 993 — one pixel, same ladder.',
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
      note: 'Name above the car, inventory chip below — and the only bar in the estate that keeps its dots.',
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
      look: 'split',
      ladder: [
        [0, 1],
        [540, 2],
      ],
      demos: 3,
      note: 'Split photo cards — photo left, year and inventory count right, Shop Now pill. On the tabbed sites these group by body style.',
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
      note: 'A tile of colour behind each car, one featured in navy — the Genesis ladder wearing a different look.',
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
  // 0.25rem, and --dlc-arrow-size defaults to 44px), which is 96px that never
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

  globalThis.DLX = Object.assign(globalThis.DLX || {}, { BRANDS, perViewFor, perAt, TIER_BOX, CHROME, MARGIN });
})();
