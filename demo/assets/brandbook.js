// The Brands page: the library browsed by OEM. Built by the same generator as
// the builder and the patterns page (renderPattern), so a Chevrolet bar here
// is the Chevrolet bar the builder hands over. Spec:
// docs/superpowers/specs/2026-09-10-brands-page-design.md

(() => {
  const { PATTERNS, BRANDS, SHORT, renderPattern, patternsOf } = globalThis.CARGO;
  const grid = document.getElementById('bb-grid');
  const index = document.getElementById('bb-index');
  if (!grid || !index || !renderPattern) return;

  const styleEl = document.getElementById('gx-css');
  const css = [];
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

  // Measured brands first, then the rest alphabetically by label.
  const ids = Object.keys(BRANDS).sort((a, b) => {
    const ma = patternsOf(a).length > 0;
    const mb = patternsOf(b).length > 0;
    if (ma !== mb) return ma ? -1 : 1;
    return BRANDS[a].label.localeCompare(BRANDS[b].label);
  });

  for (const id of ids) {
    const b = BRANDS[id];
    const measured = patternsOf(id);
    const tile = document.createElement('a');
    tile.className = 'gx-tile bb-tile';
    tile.href = `#${id}`;
    tile.innerHTML = `<img src="img/logo-${id}.png" width="116" height="100" alt=""><span class="gx-tile-name">${esc(b.label)}</span><span class="bb-badge">${measured.length ? `${measured.length} pattern${measured.length === 1 ? '' : 's'}` : 'roster only'}</span>`;
    index.append(tile);

    const sec = document.createElement('section');
    sec.className = 'gx-card bb-section';
    sec.id = `b-${id}`;
    const note = measured.length ? `Measured on ${esc(b.source ?? '')}.` : `Vehicles and how many across, from ${esc(b.label)}'s demo sites. Values not measured yet.`;
    sec.innerHTML = `<div class="gx-head"><img class="bb-logo" src="img/logo-${id}.png" width="116" height="100" alt=""><div><h2>${esc(b.label)}</h2><p class="bb-note">${note}</p></div></div>`;
    for (const pid of measured.length ? measured : ['modelbar']) {
      const cls = `bb-${id}-${pid}`;
      const r = renderPattern(pid, cls, { brand: id });
      css.push(r.css);
      const block = document.createElement('div');
      block.className = 'bb-block';
      block.innerHTML = `<div class="bb-block-head"><h3>${esc(SHORT?.[pid] ?? PATTERNS[pid].label)}</h3><a class="ui-btn" href="index.html#${pid}?brand=${id}">Open in the builder</a></div><div class="gx-stage bb-stage" data-pattern="${pid}"></div>`;
      block.querySelector('.bb-stage').innerHTML = r.html;
      sec.append(block);
    }
    grid.append(sec);
  }

  styleEl.textContent = css.join('\n\n');

  for (const root of document.querySelectorAll('.bb-stage .cs')) {
    if (!root.dataset.csInit) new globalThis.CustomSlider(root);
  }
  const scripts = new Set();
  for (const p of Object.values(PATTERNS)) if (p.script) scripts.add(p.script);
  for (const s of scripts) {
    try {
      new Function(s)();
    } catch (e) {
      console.error('pattern script failed on the brands page', e);
    }
  }

  // A tile's href — and a shared deep link — carries the bare brand id
  // (#toyota), never the section's own id="b-toyota"; the "b-" is purely to
  // keep a brand id from colliding with an unrelated element id elsewhere on
  // the page. That mismatch means the browser's native fragment-scroll can
  // never resolve it, on load or on a same-document click, so both are
  // handled by hand. scroll-margin-block-start on .gx-card (which .bb-section
  // inherits) is what clears the sticky masthead.
  const gotoHash = () => document.getElementById(`b-${location.hash.slice(1)}`)?.scrollIntoView();
  gotoHash();
  addEventListener('hashchange', gotoHash);
})();
