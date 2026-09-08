// The index: every pattern once, live, at its own defaults.
//
// It does NOT re-implement anything. workbench.js exposes renderPattern(),
// which is the same cssFor()/htmlFor() pair the workbench itself uses with a
// different class passed in — so an example here cannot drift from the same
// example in the builder, for exactly the reason the copy panel cannot drift
// from the preview.

(() => {
  const { PATTERNS, renderPattern, SHORT } = globalThis.CARGO;
  const grid = document.getElementById('gx-grid');
  if (!grid || !renderPattern) return;

  const styleEl = document.getElementById('gx-css');
  const css = [];
  const live = [];
  // Twenty-four live sliders is fifteen screens of scrolling, and scrolling was
  // the only way to find one. These collect a tile per example for the index at
  // the top, which is the whole catalogue on one screen.
  const index = [];
  const lookIndex = [];

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
        </div>
        <a class="ui-btn" href="index.html#${id}">Open in the builder</a>
      </div>
      <div class="gx-stage"></div>`;
    card.querySelector('.gx-stage').innerHTML = html;
    // The lightbox card showed a closed trigger and nothing else - a button
    // reading "View all 6 photos" is not an example of a fullscreen gallery,
    // it is an example of a button. Open it in place instead: the `open`
    // attribute (never showModal, which would hijack a page of 26 cards) puts
    // the dialog in normal flow, and .gx-lb-inline unsets the centring it only
    // needs as a modal. The slider inside is data-cs-init="manual", so it is
    // constructed here for the same reason the pattern's own script does it on
    // click - a slider measured while hidden has no width to measure.
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

  // The card looks, same treatment. Each one is a real slider rather than a
  // picture of one, so what you see here is what the builder gives you.
  const looksGrid = document.getElementById('gx-looks');
  const { LOOKS, renderLook } = globalThis.CARGO;

  // Where a card can actually be opened. Every card used to link
  // index.html#modelbar/<id>, which stopped being true on 2026-09-08: the
  // builder's picker now offers only cards of the same family, so the logo
  // panel and the location card are not reachable on a model bar at all and
  // those two links pointed at a combination that no longer exists. Prefer a
  // pattern whose own default IS this card - the logo strip, the locations
  // strip - and fall back to the model bar for the vehicle cards.
  const openAt = (id) => {
    const own = Object.entries(PATTERNS).find(([, p]) => p.look === id);
    return own && own[1].look === id && !['modelbar', 'cards', 'grid', 'tabs'].includes(own[0]) ? `index.html#${own[0]}` : `index.html#modelbar/${id}`;
  };
  if (looksGrid && LOOKS && renderLook) {
    for (const [id, look] of Object.entries(LOOKS)) {
      const cls = `gl-${id}`;
      const { css: sheet, html } = renderLook(id, cls);
      css.push(sheet);

      const card = document.createElement('section');
      card.className = 'gx-card';
      card.id = `l-${id}`;
      card.innerHTML = `
        <div class="gx-head">
          <span class="wb-glyph"></span>
          <div>
            <h2>${look.label}</h2>
            <p>${look.note ?? ''}</p>
          </div>
          <a class="ui-btn" href="${openAt(id)}">Open in the builder</a>
        </div>
        <div class="gx-stage"></div>`;
      // A look that brings its own strip colour does not need a white card
      // behind it: that is a container around a container, and it read as a
      // white frame bolted onto the navy logo panel. The frame exists so
      // light-background cards stay legible on a dark page, and nothing else.
      if (/^#|rgb/.test(look.settings?.['--strip-bg'] ?? '')) card.querySelector('.gx-stage').classList.add('gx-stage--bare');
      card.querySelector('.wb-glyph').innerHTML = look.icon ?? '';
      card.querySelector('.gx-stage').innerHTML = html;
      looksGrid.append(card);
      lookIndex.push([`l-${id}`, look.label, '', look.icon ?? '']);
    }
  }

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
  drawIndex(document.getElementById('gx-look-index'), lookIndex);

  styleEl.textContent = css.join('\n\n');

  // Init after every example is in the DOM, so each measures a real width.
  // Both grids: a slider left uninitialised is a static row of cards that
  // silently claims the pattern does not scroll.
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
