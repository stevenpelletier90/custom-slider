// The reference: everything a designer has to know before putting a slider on
// a site. It is its own page (demo/reference.html) because it is read start to
// finish, unlike the builder, which is used one setting at a time.
//
// The custom-property table is NOT written out here. It is parsed from the
// dist CSS the page is actually running, so a knob added, renamed or
// re-defaulted in src shows up here the moment it ships, and a table row can
// never describe a property that no longer exists.
//
// The rest is prose, and nothing checks it. If you change an option, an event
// payload or an accessibility behaviour in src/, change it here in the same
// commit - there is no gate that will catch you.

(() => {
  // Every data attribute the engine reads, with the default it falls back to.
  // Keep in step with _parseOptions() in src/custom-slider.js, and with the two
  // attributes read outside it: data-cs and data-cs-init, which autoInit()
  // looks at before any instance exists.
  const OPTIONS = [
    ['data-cs', '—', 'Marks the element as a slider. The engine starts it on its own as soon as the page HTML has loaded. Without this attribute nothing happens until your own script starts it.'],
    [
      'data-cs-init="manual"',
      '—',
      'Stops the engine starting this one automatically, for when your script needs to choose the moment — a slider inside a dialog cannot measure itself until the dialog opens.',
    ],
    ['data-cs-autoplay', '0', 'Milliseconds between advances. Adds the pause button, which comes first in the tab order. Never starts under reduced motion.'],
    ['data-cs-rewind', 'true', 'Arrows wrap around at the ends. <code>false</code> stops there and <code>aria-disabled</code>s the end arrow. Ignored with autoplay, which needs the wrap.'],
    [
      'data-cs-step',
      'page',
      'How far one arrow click moves: a full screenful, <code>slide</code> for one card, or a number for that many cards. The dots stay one per screenful whatever you choose, and the last click always lands on the end rather than leaving a half-empty row.',
    ],
    ['data-cs-drag', 'true', 'Mouse drag-to-scroll on the track. Touch and pen swiping is native scrolling and is unaffected. <code>false</code> opts out.'],
    ['data-cs-gallery', 'false', 'The tabbed thumbnail gallery. Thumbs are generated from the slide images as a real tab list with arrow keys.'],
    [
      'data-cs-fade',
      'false',
      'Slides fade into each other instead of sliding. One slide at a time only, so it suits a full-width hero — the stylesheet pins it to one across, so the column classes and your own <code>--cs-per-view</code> are ignored here, and the strip is 1-up before the script runs rather than jumping on init. No drag, no peek. Ignored with <code>data-cs-gallery</code>.',
    ],
    ['data-cs-roledescription', 'carousel', 'The announced role description. Set it to an empty string to omit it, which some localisations want.'],
  ];

  const API = [
    ['new CustomSlider(el, opts)', 'Construct one yourself. The class is <code>CustomSlider</code> in source and <code>window.CustomSlider</code> on the page — one name either way.'],
    [
      'CustomSlider.autoInit(scope)',
      'Starts every <code>[data-cs]</code> inside <code>scope</code> that is not already running and has not opted out. The engine calls this itself once the page HTML has loaded; you only call it for markup you added later.',
    ],
    ['next()', 'Move forward by whatever the arrows are set to move — a page, one card, or a set number.'],
    ['prev()', 'Move back by the same amount.'],
    ['goTo(n, { behavior })', 'Jump to slide index <code>n</code>. <code>behavior</code> overrides the scroll behaviour for this call.'],
    ['play() / pause()', 'Start and stop autoplay.'],
    ['destroy()', 'Remove every listener and observer, restore the original markup.'],
    ['element._cs', 'The live slider object, if your own script on the page needs to reach it.'],
    [
      '{ labels: {…} }',
      'Constructor-only. Overrides every announced string (prev, next, pause, play, dots, gotoSlide, gotoPage, statusSingle, statusMulti, thumbs, photo) — the way to localise a slider. There is no data attribute for it.',
    ],
  ];

  const EVENTS = [
    ['cs:change', '<code>{ index, page, slidesInView }</code> — fires once the strip has finished moving and settled, not while it is still sliding.'],
    ['cs:autoplay-start', 'Rotation started, or restarted from the play button.'],
    ['cs:autoplay-stop', 'Rotation stopped. Only a real stop fires this — hover, focus and drag <em>suspend</em> rotation without changing whether it is playing, so they emit nothing.'],
    ['cs:destroy', 'The instance tore itself down.'],
  ];

  // Behaviours that look like bugs and are not. Every one of these was a real
  // fix; changing it back breaks screen-reader output or a browser.
  const A11Y = [
    'Every card stays reachable by keyboard and by a screen reader, including the ones scrolled out of sight. Hiding them would make the announced count wrong — “3 of 6” when there are twelve.',
    'A <code>&lt;ul&gt;</code> track gets <code>role="list"</code> put back at init. The <code>list-style: none</code> the design needs makes WebKit drop list semantics, which silently kills the "N of 6" announcement in Safari with VoiceOver.',
    'Dots are one per <strong>page</strong>, and are plain buttons rather than tabs. The current dot is <code>aria-disabled</code> but stays focusable.',
    'When every slide already fits, the arrows and dots are hidden and the root gains <code>data-cs-fits</code>. Controls that cannot move anything must not be focusable, and a one-of-one dot group announces a choice that is not one.',
    'A screen reader is told the position in one short line ("Slides 4–6 of 12") from a hidden element of its own. If the track itself announced changes, moving three cards would read all three out.',
    'Nothing rotates under <code>prefers-reduced-motion</code>, and scroll behaviour is resolved per call rather than set in CSS, because Safari animates CSS-set scrolling even when the move is meant to be instant.',
    'The engine injects controls only. Every heading, link and image comes from your HTML, so the content is there for search engines and with JavaScript off.',
  ];

  const LIMITS = [
    'Left-to-right only in v1.',
    'No infinite loop and no cloned slides: the ends rewind, or stop with <code>data-cs-rewind="false"</code>. Cloning would duplicate content for search engines and confuse screen readers.',
    '<code>data-cs-gallery</code> with <code>data-cs-autoplay</code> is unsupported — autoplay is ignored and warns in the console.',
    '<code>data-cs-gallery</code> with <code>data-cs-fade</code> is unsupported — fade is ignored and warns in the console.',
    'Slides-per-view is CSS only, by design. There is no JavaScript breakpoint option and there will not be one.',
    'Do not hide a slide with CSS to show different cards at different widths. A hidden slide is still in the list, so the announced total, the paging and the current position all count it — “Slides 1 to 3 of 6” with five on screen, and one arrow click landing on the slide nobody can see. Use <code>&lt;picture&gt;</code> for per-breakpoint artwork, or two sliders.',
  ];

  const MARKUP = `<div class="my-slider cs" data-cs aria-label="New vehicles">
  <ul class="cs-track">
    <li class="cs-slide">
      <!-- your content: headings, links, images -->
    </li>
    <!-- repeat one <li> per slide -->
  </ul>
</div>`;

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const table = (head, rows) =>
    `<div class="g-scroll"><table><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows
      .map((r) => `<tr>${r.map((c, i) => `<td>${i === 0 ? `<code>${esc(c)}</code>` : c}</td>`).join('')}</tr>`)
      .join('')}</tbody></table></div>`;

  const list = (items) => `<ul class="g-list">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;

  // Read the knobs out of the stylesheet this page is running, so the table is
  // the shipped CSS rather than a description of it.
  function propsFrom(css) {
    const block = css.slice(css.indexOf('.cs{') >= 0 ? css.indexOf('.cs{') : css.indexOf('.cs {'));
    const rows = [];
    // Minified CSS drops the comments, so fall back to the source-order name
    // and value alone rather than inventing a description.
    for (const m of block.matchAll(/(--cs-[\w-]+)\s*:\s*([^;}]+)[;}]/g)) {
      if (rows.some((r) => r[0] === m[1])) continue;
      rows.push([m[1], `<code>${esc(m[2].trim())}</code>`]);
      if (rows.length > 40) break;
    }
    return rows;
  }

  const NOTES = {
    '--cs-per-view': 'Slides visible at once. Set it per breakpoint in a media query — this is the only way to change how many are across.',
    '--cs-gap': 'Space between slides.',
    '--cs-peek': 'Sliver of the next slide left visible at the edges. Zero turns it off.',
    '--cs-arrow-size': 'How big the arrow button is. Keep it at 44px or more so it stays comfortable to tap on a phone.',
    '--cs-arrow-fg': 'Arrow glyph colour.',
    '--cs-arrow-bg': 'Arrow background. <code>transparent</code> leaves just the arrow shape, sitting in the space beside the cards instead of on a filled circle — how the model bars look.',
    '--cs-arrow-fg-hover': 'Arrow glyph colour on hover.',
    '--cs-arrow-bg-hover': 'Arrow background on hover.',
    '--cs-dot-size': 'How big the dot looks. The tappable area stays 24px whatever you set, so a small dot is still easy to hit.',
    '--cs-dot-fg': 'The dots you are not on. The default is dark enough to see against white.',
    '--cs-dot-current': 'The dot for the slide you are on.',
    '--cs-controls-space':
      'Height set aside for the dot row before the dots exist, so nothing on the page jumps when the slider starts. Never remove it, and never set <code>padding</code> or <code>padding-block</code> on the root — either one wipes the reservation and the dots land on the card text.',
    '--cs-thumb-w': 'Gallery thumbnail width.',
    '--cs-thumb-h': 'Gallery thumbnail height.',
    '--cs-thumb-hover-scale':
      'Zoom applied to a gallery thumbnail’s image on hover. The thumb box itself never moves, so neighbours stay put. <code>1</code> turns it off, and reduced motion drops it regardless.',
    '--cs-focus': 'Focus ring colour.',
    '--cs-transition': 'Duration and easing for control state changes.',
    '--cs-fade-ms': 'Crossfade duration in fade mode. Ignored unless <code>data-cs-fade</code> is set.',
  };

  // What each card property is FOR. A better label than `strip-pad-x` was not
  // enough on its own - "Side gutter" still does not say why a gutter exists -
  // and these were documented nowhere: the --cs-* table below is the engine's
  // knobs, and the card's own were only ever row labels in the builder.
  //
  // check-looks asserts every property in every look has an entry here, so a
  // new knob cannot ship undocumented.
  const CARD_NOTES = {
    '--strip-bg': 'Colour behind the whole row. <code>transparent</code> lets the page show through, which is what most brands want.',
    '--strip-pad': 'Space above the cards, inside that colour.',
    '--strip-pad-x': 'Space at the left and right ends. It reserves the channel the arrows sit in — without it a transparent arrow lands on top of the first vehicle instead of beside it.',
    '--name-color': 'Colour of the model name.',
    '--name-size': 'Size of the model name.',
    '--name-weight': 'How bold the model name is. 600 is the usual.',
    '--name-case': 'Leave the name as typed, or force capitals.',
    '--name-tracking': 'Letter spacing on the name. A little positive space suits all-capitals; leave it <code>normal</code> otherwise.',
    '--name-order': 'Whether the name sits under the photo or above it.',
    '--img-filter': 'A filter over the photo — <code>grayscale(1)</code> is the one that matters, for a logo strip that comes back to colour on hover.',
    '--img-aspect': 'Forces every photo to one shape, so a row of differently sized uploads still lines up. <code>auto</code> leaves each as it comes.',
    '--img-hover-scale': 'How far the photo zooms when the pointer is over it. <code>1</code> is off. The frame never changes size, so nothing around it moves.',
    '--plate-bg': 'A coloured panel drawn behind the vehicle cutout.',
    '--plate-pad': 'How much of that panel shows around the vehicle. The cutouts already carry their own transparent margin, so this stays small unless the panel is a real colour.',
    '--card-bg': "The card's own background, behind the photo and text.",
    '--card-radius': 'Corner rounding on the card.',
    '--card-fg': 'Text colour inside the card. Looks that bring a dark background set this so the text stays readable on it.',
    '--price-color': 'Colour of the price line under the title.',
    '--mark-size': 'Height of the wordmark image above the vehicle.',
    '--pill-bg': "Background of the rounded label on the split card's copy side.",
    '--pill-fg': 'Text colour of that label.',
    '--cta-bg': 'Background of the button.',
    '--cta-fg': 'Text colour of the button.',
  };

  // Built by walking LOOKS, so the table is the card styles that actually ship.
  // The "used by" column is the point: 23 properties in one list tells a
  // designer nothing about which apply to the card they picked - --plate-pad is
  // the cutout tile only, --cta-bg is two looks.
  function cardRows() {
    const LOOKS = globalThis.CARGO?.LOOKS;
    if (!LOOKS) return [];
    const seen = new Map();
    for (const look of Object.values(LOOKS)) {
      for (const [prop, value] of Object.entries(look.settings ?? {})) {
        // --cs-* set by a look is an ENGINE property; it is in the table above.
        if (prop.startsWith('--cs-')) continue;
        if (!seen.has(prop)) seen.set(prop, { value, looks: [] });
        seen.get(prop).looks.push(look.label);
      }
    }
    return [...seen].map(([prop, { value, looks }]) => [
      prop,
      `<code>${esc(value)}</code>`,
      looks.length === Object.keys(LOOKS).length ? 'every card style' : looks.join(', '),
      CARD_NOTES[prop] ?? '',
    ]);
  }

  async function render() {
    const el = document.getElementById('g-body');
    if (!el) return;
    const cards = cardRows();
    let props = [];
    try {
      props = propsFrom(await fetch('../dist/custom-slider.css').then((r) => r.text()));
    } catch {
      /* opened over file:// with fetch blocked — the rest of the guide still renders */
    }
    const propRows = props.map(([name, val]) => [name, val, NOTES[name] ?? '']);

    el.innerHTML = `
      <section id="g-markup"><h3>The markup contract</h3>
        <p>This is the whole of it. Class names, data attributes and the <code>--cs-*</code> properties are frozen — sites cannot be edited when the engine changes, so things get added, never renamed.</p>
        <pre class="g-code"><code>${globalThis.CARGO.hl.html(MARKUP)}</code></pre>
        ${list([
          'Root: <code>cs</code>, plus <code>data-cs</code> for auto-init, plus an <code>aria-label</code> or <code>aria-labelledby</code>.',
          'Track: one <code>.cs-track</code> child — a <code>&lt;ul&gt;</code> for cards, a <code>&lt;div&gt;</code> for <code>data-cs-gallery</code>.',
          'Slides: <code>.cs-slide</code> children.',
          'Images: always give <code>width</code> and <code>height</code>. First visible image eager, later ones <code>loading="lazy" decoding="async"</code>, and <code>sizes</code> set to one slide\'s rendered width.',
          'Anything missing fails loudly in the console at init rather than silently doing nothing.',
        ])}
      </section>

      <section id="g-classes"><h3>Ready-made card classes</h3>
        <p>The stylesheet carries seven card styles and a set of column classes, so a slider can be written by hand as markup alone. Name a card style and a column ladder on the same element as
        <code>cs</code>:</p>
        <pre class="g-code"><code>${esc('<div class="cs cargo-tile cs-xs-2 cs-sm-3 cs-md-4 cs-lg-5" data-cs aria-label="Our models">')}</code></pre>
        ${table(
          ['Class', 'What it is'],
          [
            ['cargo-tile', 'Cutout tile — a vehicle cutout with its name under it. The workhorse.'],
            ['cargo-vcard', 'Vehicle card — photo, title, price, on a card background.'],
            ['cargo-wordmark', 'Wordmark above — the model wordmark over the vehicle.'],
            ['cargo-split', 'Split photo card — photo one side, copy the other.'],
            ['cargo-portrait', 'Tall tile with a call to action.'],
            ['cargo-logo', 'Logo panel — a grid of brand logos.'],
            ['cargo-location', 'Location card — address and hours.'],
            ['cs-xs-N', 'Cards across on a phone. N is 1 to 8.'],
            ['cs-sm-N', 'Cards across from 768px up.'],
            ['cs-md-N', 'Cards across from 992px up.'],
            ['cs-lg-N', 'Cards across from 1200px up.'],
          ],
        )}
        <p class="g-sub">To change something about a card style, set the property from the table below on your own slider — you do not need to copy the whole style. The builder writes only what you
        changed, which is why the code it gives you is a few lines rather than forty.</p>
      </section>

      <section id="g-options"><h3>Options</h3>
        <p>All set as attributes on the root. The workbench writes these for you; this is what they mean.</p>
        ${table(['Attribute', 'Default', 'What it does'], OPTIONS)}
      </section>

      <section id="g-props"><h3>CSS custom properties</h3>
        <p>Every setting the engine has. ${props.length ? `Read live from the <code>dist/custom-slider.css</code> this page is running, so the ${props.length} below are the ones that actually ship.` : 'Open this page over HTTP to list them from the shipped stylesheet.'} Override them on the root or any wrapper.</p>
        ${props.length ? table(['Property', 'Default', 'Notes'], propRows) : ''}
      </section>

      <section id="g-card-props"><h3>Card style properties</h3>
        <p><code>cs-*</code> is the machinery, <code>cargo-*</code> is the card, and the stylesheet ships both. These are the settings the card styles bring, the same ones the builder lists under
        <strong>This card style</strong>. Each is a CSS custom property: set it on your slider to change it. A card style only reads the ones in its own row of the <strong>Used by</strong> column.</p>
        ${cards.length ? table(['Property', 'Default', 'Used by', 'What it does'], cards) : '<p class="g-sub">Open this page over HTTP to list them.</p>'}
        <p class="g-sub">Two card styles also set the engine's own arrow colours, because they bring a dark background and the default arrows disappear on it.</p>
      </section>

      <section id="g-a11y"><h3>Accessibility — please don't "fix" these</h3>
        <p>Each of these looks like an oversight and is not. They are fixes for real bugs, and reverting one breaks screen-reader output or a browser.</p>
        ${list(A11Y)}
      </section>

      <section id="g-api"><h3>JavaScript API</h3>
        <p>Only needed if you are adding behaviour of your own. Do that from a script on the page rather than by editing the engine.</p>
        ${table(['Method', 'What it does'], API)}
        <p class="g-sub">Events, all bubbling from the root:</p>
        ${table(['Event', 'Detail'], EVENTS)}
      </section>

      <section id="g-cms"><h3>Putting it on a DealerOn site</h3>
        ${list([
          'The two engine files are linked with a <code>&lt;link&gt;</code> and a <code>&lt;script&gt;</code> in the <strong>Head Section</strong> tab — the one that takes HTML verbatim, not “Style Only, Head Section”, which takes raw CSS and would swallow a tag. They live at <code>/assets/shared/CustomHTMLFiles/Responsive/Apps/customSlider/</code>, one copy per site.',
          "Your slider's own CSS goes in <strong>Style Only</strong>, the markup in a <strong>Custom HTML</strong> block, and a pattern's script in <strong>Body Section, Bottom</strong>. The Build page has a Copy button per field, because the three cannot go in as one paste.",
          "<strong>Every slider on a page needs its own name.</strong> The name is a class on the root — <code>my-slider</code> — and it is what the CSS hangs off. Paste two sliders sharing a name and the second block's rules win for both, silently: a pair of model bars measured the first taking the second's gap, its slides going 208.6px to 180.6px. The Build page keeps that field next to its copy buttons.",
          'Style Only takes <strong>raw CSS</strong> — no <code>&lt;style&gt;</code> tags and no comments. A tag pasted into it is read as part of the first selector, so that rule is dropped and the settings it carried go with it, silently.',
          'Both engine files are shared — add them once per site, not once per slider. Several sliders on one page is fine and expected.',
          'Images: use the DealerOn library or dealer-owned assets, reference uploads through <code>#MISCPATH#</code>, and keep platform <code>/static/</code> paths literal.',
          'The platform is Bootstrap 3. Its grid breaks at <strong>768 / 992 / 1200</strong> — there is no 576. Match those so the strip flips where the page flips.',
        ])}
      </section>

      <section id="g-limits"><h3>Limits in v1</h3>
        ${list(LIMITS)}
      </section>`;
  }

  // NOTES and CARD_NOTES go out too: the builder shows them as tooltips on its
  // own knobs, so a designer does not have to leave the page to find out what a
  // setting does - and there is one set of words rather than two that drift.
  globalThis.CARGO = Object.assign(globalThis.CARGO || {}, { guide: { render, OPTIONS, NOTES, CARD_NOTES } });
})();
