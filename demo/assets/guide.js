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
  // Keep in step with _parseOptions() in src/dl-carousel.js, and with the two
  // attributes read outside it: data-slider and data-init, which autoInit()
  // looks at before any instance exists.
  const OPTIONS = [
    ['data-slider', '—', 'Marks the element for auto-init on DOMContentLoaded. Without it you must construct the slider yourself.'],
    ['data-init="manual"', '—', 'Opts this slider out of auto-init, for when page script needs to control when it starts.'],
    ['data-autoplay', '0', 'Milliseconds between advances. Adds the pause button, which comes first in the tab order. Never starts under reduced motion.'],
    ['data-rewind', 'true', 'Arrows wrap around at the ends. <code>false</code> stops there and <code>aria-disabled</code>s the end arrow. Ignored with autoplay, which needs the wrap.'],
    [
      'data-step',
      'page',
      'How far one arrow click moves: a full page, <code>slide</code> for one card, or a number for that many cards. Dots stay per-page either way, and the last stop is always the end.',
    ],
    ['data-drag', 'true', 'Mouse drag-to-scroll on the track. Touch and pen swiping is native scrolling and is unaffected. <code>false</code> opts out.'],
    ['data-gallery', 'false', 'The tabbed thumbnail gallery. Thumbs are generated from the slide images as a real tab list with arrow keys.'],
    ['data-fade', 'false', 'Stacked crossfade instead of a scrolling track — 1-up heroes only. No drag, no peek. Ignored with <code>data-gallery</code>.'],
    ['data-roledescription', 'carousel', 'The announced role description. Set it to an empty string to omit it, which some localisations want.'],
  ];

  const API = [
    ['new DLCarousel(el, opts)', 'Construct one yourself. The class is <code>Slider</code> in source and <code>window.DLCarousel</code> on the page; both names are part of the API.'],
    [
      'DLCarousel.autoInit(scope)',
      'Initialise every <code>[data-slider]</code> under <code>scope</code> that is not already running and not <code>data-init="manual"</code>. Runs itself on DOMContentLoaded.',
    ],
    ['next()', 'Advance one stop.'],
    ['prev()', 'Go back one stop.'],
    ['goTo(n, { behavior })', 'Jump to slide index <code>n</code>. <code>behavior</code> overrides the scroll behaviour for this call.'],
    ['play() / pause()', 'Start and stop autoplay.'],
    ['destroy()', 'Remove every listener and observer, restore the original markup.'],
    ['element._dlCarousel', 'The instance, for page script that needs to reach in.'],
    [
      '{ labels: {…} }',
      'Constructor-only. Overrides every announced string (prev, next, pause, play, dots, gotoSlide, gotoPage, statusSingle, statusMulti, thumbs, photo) — the way to localise a slider. There is no data attribute for it.',
    ],
  ];

  const EVENTS = [
    ['dlc:change', '<code>{ index, page, slidesInView }</code> — fired from _commit(), once the scroll has settled on a stop.'],
    ['dlc:autoplay-start', 'Rotation started, or restarted from the play button.'],
    ['dlc:autoplay-stop', 'Rotation stopped. Only a real stop fires this — hover, focus and drag <em>suspend</em> rotation without changing whether it is playing, so they emit nothing.'],
    ['dlc:destroy', 'The instance tore itself down.'],
  ];

  // Behaviours that look like bugs and are not. Every one of these was a real
  // fix; changing it back breaks screen-reader output or a browser.
  const A11Y = [
    'All cards stay in the tab order and the accessibility tree. Off-screen cards are never <code>inert</code> or <code>aria-hidden</code> in the multi-card variants — hiding them corrupts the announced counts.',
    'A <code>&lt;ul&gt;</code> track gets <code>role="list"</code> put back at init. The <code>list-style: none</code> the design needs makes WebKit drop list semantics, which silently kills the "N of 6" announcement in Safari with VoiceOver.',
    'Dots are one per <strong>page</strong>, and are plain buttons rather than tabs. The current dot is <code>aria-disabled</code> but stays focusable.',
    'When every slide already fits, the arrows and dots are hidden and the root gains <code>data-fits</code>. Controls that cannot move anything must not be focusable, and a one-of-one dot group announces a choice that is not one.',
    'The live region is a separate terse status ("Slides 4–6 of 12"), never the track itself — a live track would read out every card on a multi-card move.',
    'Nothing rotates under <code>prefers-reduced-motion</code>, and scroll behaviour is resolved per call rather than set in CSS, because Safari hijacks intended-instant programmatic scrolls.',
    'The engine injects controls only. Every heading, link and image comes from your HTML, so the content is there for search engines and with JavaScript off.',
  ];

  const LIMITS = [
    'Left-to-right only in v1.',
    'No infinite loop and no cloned slides: the ends rewind, or stop with <code>data-rewind="false"</code>. Cloning would duplicate content for search engines and confuse screen readers.',
    '<code>data-gallery</code> with <code>data-autoplay</code> is unsupported — autoplay is ignored and warns in the console.',
    '<code>data-gallery</code> with <code>data-fade</code> is unsupported — fade is ignored and warns in the console.',
    'Slides-per-view is CSS only, by design. There is no JavaScript breakpoint option and there will not be one.',
  ];

  const MARKUP = `<div class="my-slider dl-carousel" data-slider aria-label="New vehicles">
  <ul class="dl-carousel-track">
    <li class="dl-carousel-slide">
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
    const block = css.slice(css.indexOf('.dl-carousel{') >= 0 ? css.indexOf('.dl-carousel{') : css.indexOf('.dl-carousel {'));
    const rows = [];
    // Minified CSS drops the comments, so fall back to the source-order name
    // and value alone rather than inventing a description.
    for (const m of block.matchAll(/(--dlc-[\w-]+)\s*:\s*([^;}]+)[;}]/g)) {
      if (rows.some((r) => r[0] === m[1])) continue;
      rows.push([m[1], `<code>${esc(m[2].trim())}</code>`]);
      if (rows.length > 40) break;
    }
    return rows;
  }

  const NOTES = {
    '--dlc-per-view': 'Slides visible at once. Set it per breakpoint in a media query — this is the only way to change how many are across.',
    '--dlc-gap': 'Space between slides.',
    '--dlc-peek': 'Sliver of the next slide left visible at the edges. Zero turns it off.',
    '--dlc-arrow-size': 'Arrow tap target. Keep it at 44px or above to stay a WCAG-sized target.',
    '--dlc-arrow-fg': 'Arrow glyph colour.',
    '--dlc-arrow-bg': 'Arrow background. <code>transparent</code> gives the gutter-arrow look the model bars use.',
    '--dlc-arrow-fg-hover': 'Arrow glyph colour on hover.',
    '--dlc-arrow-bg-hover': 'Arrow background on hover.',
    '--dlc-dot-size': 'Drawn dot size. The hit box stays 24px regardless (WCAG 2.5.8).',
    '--dlc-dot-fg': 'Inactive dot. The default meets 3:1 on white.',
    '--dlc-dot-current': 'Current dot.',
    '--dlc-controls-space':
      'Height reserved for the dot row. This reservation is why the slider scores CLS 0 — never remove it, and never set <code>padding</code> or <code>padding-block</code> on the root, which would wipe it.',
    '--dlc-thumb-w': 'Gallery thumbnail width.',
    '--dlc-thumb-h': 'Gallery thumbnail height.',
    '--dlc-focus': 'Focus ring colour.',
    '--dlc-transition': 'Duration and easing for control state changes.',
  };

  async function render() {
    const el = document.getElementById('g-body');
    if (!el) return;
    let props = [];
    try {
      props = propsFrom(await fetch('../dist/dl-carousel.css').then((r) => r.text()));
    } catch {
      /* opened over file:// with fetch blocked — the rest of the guide still renders */
    }
    const propRows = props.map(([name, val]) => [name, val, NOTES[name] ?? '']);

    el.innerHTML = `
      <section id="g-markup"><h3>The markup contract</h3>
        <p>This is the whole of it. Class names, data attributes and the <code>--dlc-*</code> properties are frozen — sites cannot be edited when the engine changes, so things get added, never renamed.</p>
        <pre class="g-code"><code>${globalThis.DLX.hl.html(MARKUP)}</code></pre>
        ${list([
          'Root: <code>dl-carousel</code>, plus <code>data-slider</code> for auto-init, plus an <code>aria-label</code> or <code>aria-labelledby</code>.',
          'Track: one <code>.dl-carousel-track</code> child — a <code>&lt;ul&gt;</code> for cards, a <code>&lt;div&gt;</code> for <code>data-gallery</code>.',
          'Slides: <code>.dl-carousel-slide</code> children.',
          'Images: always give <code>width</code> and <code>height</code>. First visible image eager, later ones <code>loading="lazy" decoding="async"</code>, and <code>sizes</code> set to one slide\'s rendered width.',
          'Anything missing fails loudly in the console at init rather than silently doing nothing.',
        ])}
      </section>

      <section id="g-options"><h3>Options</h3>
        <p>All set as attributes on the root. The workbench writes these for you; this is what they mean.</p>
        ${table(['Attribute', 'Default', 'What it does'], OPTIONS)}
      </section>

      <section id="g-props"><h3>CSS custom properties</h3>
        <p>Every knob the engine has. ${props.length ? `Read live from the <code>dist/dl-carousel.css</code> this page is running, so the ${props.length} below are the ones that actually ship.` : 'Open this page over HTTP to list them from the shipped stylesheet.'} Override them on the root or any wrapper.</p>
        ${props.length ? table(['Property', 'Default', 'Notes'], propRows) : ''}
      </section>

      <section id="g-a11y"><h3>Accessibility — please don't "fix" these</h3>
        <p>Each of these looks like an oversight and is not. They are fixes for real bugs, and reverting one breaks screen-reader output or a browser.</p>
        ${list(A11Y)}
      </section>

      <section id="g-api"><h3>JavaScript API</h3>
        <p>Only needed if you are extending behaviour. Do that from page script rather than by editing the engine.</p>
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

  globalThis.DLX = Object.assign(globalThis.DLX || {}, { guide: { render, OPTIONS } });
})();
