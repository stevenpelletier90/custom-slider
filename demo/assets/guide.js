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
    ['data-cs-fade', 'false', 'Slides fade into each other instead of sliding. One slide at a time only, so it suits a full-width hero. No drag, no peek. Ignored with <code>data-cs-gallery</code>.'],
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

  async function render() {
    const el = document.getElementById('g-body');
    if (!el) return;
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

      <section id="g-options"><h3>Options</h3>
        <p>All set as attributes on the root. The workbench writes these for you; this is what they mean.</p>
        ${table(['Attribute', 'Default', 'What it does'], OPTIONS)}
      </section>

      <section id="g-props"><h3>CSS custom properties</h3>
        <p>Every setting the engine has. ${props.length ? `Read live from the <code>dist/custom-slider.css</code> this page is running, so the ${props.length} below are the ones that actually ship.` : 'Open this page over HTTP to list them from the shipped stylesheet.'} Override them on the root or any wrapper.</p>
        ${props.length ? table(['Property', 'Default', 'Notes'], propRows) : ''}
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
          'The engine CSS goes in <strong>Style Only, Head Section</strong>; the engine JS in <strong>Body Section, Bottom</strong>, after the markup.',
          "Your slider's own CSS goes in <strong>Style Only</strong> too, and the markup in a <strong>Custom HTML</strong> block.",
          'Both engine files are shared — add them once per site, not once per slider. Several sliders on one page is fine and expected.',
          'Images: use the DealerOn library or dealer-owned assets, reference uploads through <code>#MISCPATH#</code>, and keep platform <code>/static/</code> paths literal.',
          'The platform is Bootstrap 3. Its grid breaks at <strong>768 / 992 / 1200</strong> — there is no 576. Match those so the strip flips where the page flips.',
        ])}
      </section>

      <section id="g-limits"><h3>Limits in v1</h3>
        ${list(LIMITS)}
      </section>`;
  }

  globalThis.CARGO = Object.assign(globalThis.CARGO || {}, { guide: { render, OPTIONS } });
})();
