// The index: every pattern once, live, at its own defaults.
//
// It does NOT re-implement anything. workbench.js exposes renderPattern(),
// which is the same cssFor()/htmlFor() pair the workbench itself uses with a
// different class passed in — so an example here cannot drift from the same
// example in the builder, for exactly the reason the copy panel cannot drift
// from the preview.

(() => {
  const { PATTERNS, renderPattern } = globalThis.DLX;
  const grid = document.getElementById('gx-grid');
  if (!grid || !renderPattern) return;

  const styleEl = document.getElementById('gx-css');
  const css = [];
  const live = [];

  for (const [id, p] of Object.entries(PATTERNS)) {
    const cls = `gx-${id}`;
    const { css: sheet, html } = renderPattern(id, cls);
    css.push(sheet);

    const card = document.createElement('section');
    card.className = 'gx-card';
    card.innerHTML = `
      <div class="gx-head">
        <span class="wb-glyph wb-glyph--${id}"></span>
        <div>
          <h2>${p.label}</h2>
          <p>${p.blurb}</p>
        </div>
        <a class="ui-btn" href="index.html#${id}">Open in the builder</a>
      </div>
      <div class="gx-stage"></div>`;
    card.querySelector('.gx-stage').innerHTML = html;
    grid.append(card);
  }

  styleEl.textContent = css.join('\n\n');

  // Init after every example is in the DOM, so each measures a real width.
  for (const root of grid.querySelectorAll('.dl-carousel')) {
    if (!root.dataset.init) live.push(new globalThis.DLCarousel(root));
  }

  // The few patterns that need page script get it here too, once each.
  const scripts = new Set();
  for (const p of Object.values(PATTERNS)) if (p.script) scripts.add(p.script);
  for (const s of scripts) {
    try {
      new Function(s)();
    } catch (e) {
      console.error('pattern script failed on the index', e);
    }
  }
})();
