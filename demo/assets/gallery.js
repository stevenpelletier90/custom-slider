// The index: every pattern once, live, at its own defaults.
//
// It does NOT re-implement anything. workbench.js exposes renderPattern(),
// which is the same cssFor()/htmlFor() pair the workbench itself uses with a
// different class passed in — so an example here cannot drift from the same
// example in the builder, for exactly the reason the copy panel cannot drift
// from the preview.

(() => {
  const { PATTERNS, renderPattern, variantsOf, BRANDS, SHORT } = globalThis.CARGO;
  const grid = document.getElementById('gx-grid');
  if (!grid || !renderPattern) return;

  const styleEl = document.getElementById('gx-css');
  const css = [];
  const live = [];
  // Twenty-four live sliders is fifteen screens of scrolling, and scrolling was
  // the only way to find one. These collect a tile per example for the index at
  // the top, which is the whole catalogue on one screen.
  const index = [];

  for (const [id, p] of Object.entries(PATTERNS)) {
    const cls = `gx-${id}`;
    const { css: sheet, html } = renderPattern(id, cls);
    css.push(sheet);

    const card = document.createElement('section');
    card.className = 'gx-card';
    // Anchored so the index above can reach it and so a link to one pattern is
    // shareable - patterns.html#p-service opens on the service cards.
    card.id = `p-${id}`;
    card.innerHTML = `
      <div class="gx-head">
        <span class="wb-glyph wb-glyph--${id}"></span>
        <div>
          <h2>${p.label}</h2>
          <p>${p.blurb}</p>
          ${
            variantsOf(id).length
              ? `<p class="gx-also">Also measured for ${variantsOf(id)
                  .map((bid) => `<a href="brands.html#${bid}">${BRANDS[bid].label}</a>`)
                  .join(', ')}</p>`
              : ''
          }
        </div>
        <a class="ui-btn" href="index.html#${id}">Open in the builder</a>
      </div>
      <div class="gx-stage"></div>`;
    card.querySelector('.gx-stage').innerHTML = html;
    grid.append(card);
    // The lightbox card showed a closed trigger and nothing else - a button
    // reading "View all 6 photos" is not an example of a fullscreen gallery,
    // it is an example of a button. Open it in place instead.
    //
    // AFTER the append, and that ordering is the whole trick: the slider is
    // data-cs-init="manual" precisely because one measured while hidden has no
    // width, so it has to be constructed once the dialog is both open AND in
    // the document. Built before either, it came out with no thumb strip and no
    // arrows - a static photo in a dark box, which is a different wrong example
    // from the one this replaced.
    //
    // `open`, never showModal(): a modal on a page of 26 cards would take the
    // page over. The trigger is HIDDEN rather than removed, because the
    // pattern's own script - which this page runs verbatim - binds a click to
    // it, and hiding also stops a click reaching showModal() on a dialog that
    // is already open, which throws.
    if (id === 'lightbox') {
      const dlg = card.querySelector('dialog');
      if (dlg) {
        dlg.classList.add('gx-lb-inline');
        dlg.open = true;
        card.querySelector('.cargo-lb-open')?.setAttribute('hidden', '');
        const root = dlg.querySelector('.cs');
        if (root && !root._cs && globalThis.CustomSlider) new globalThis.CustomSlider(root);
      }
    }
    index.push([`p-${id}`, SHORT?.[id] ?? p.label, `wb-glyph--${id}`, '']);
  }

  // A second grid used to follow this one, drawing each card LOOK on a borrowed
  // model bar under the heading "Every card style". It went on 2026-09-08 with
  // the style picker: every card is a pattern now, so all seven are already
  // above - and a card shown twice, once as itself and once as a style of
  // something else, is precisely the muddle that got fixed.
  //
  // The openAt() helper went with it. It existed to guess which pattern could
  // display a given card, which is a question with a one-word answer now.

  // The index. Built from what was just rendered rather than from a hand-kept
  // list, so a pattern cannot exist on the page without a tile pointing at it.
  const drawIndex = (host, rows) => {
    if (!host) return;
    for (const [href, label, glyph, icon] of rows) {
      const a = document.createElement('a');
      a.className = 'gx-tile';
      a.href = `#${href}`;
      a.innerHTML = `<span class="wb-glyph ${glyph}">${icon}</span><span class="gx-tile-name">${label}</span>`;
      host.append(a);
    }
  };
  drawIndex(document.getElementById('gx-index'), index);

  styleEl.textContent = css.join('\n\n');

  // Init after every example is in the DOM, so each measures a real width. A
  // slider left uninitialised is a static row of cards that silently claims the
  // pattern does not scroll.
  for (const root of document.querySelectorAll('.gx-stage .cs')) {
    if (!root.dataset.csInit) live.push(new globalThis.CustomSlider(root));
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
