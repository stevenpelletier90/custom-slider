// The Brands page: the library browsed by OEM. Built by the same generator as
// the builder and the patterns page (renderPattern), so a Chevrolet bar here
// is the Chevrolet bar the builder hands over. Spec:
// docs/specs/2026-09-10-brands-page-design.md

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

  // Every pid actually rendered onto the page, filled in as the grid is
  // built, so the script pass below can run only those patterns' scripts
  // instead of every pattern's whether it appears here or not.
  const rendered = new Set();

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
    // A roster-only brand with no cutouts of its own (only Fiat, of the 32)
    // draws the Chevrolet default set, and the note used to say "from Fiat's
    // demo sites" over six Chevrolets - true of the ladder, false of the
    // cars. The appended sentence says which part is whose.
    const note = measured.length
      ? `Measured on ${esc(b.source ?? '')}.`
      : `${esc(b.label)}'s vehicles and how many across, from its demo sites. Values not measured yet.${b.models ? '' : ` ${esc(b.label)} has no cutout roster of its own, so the cars below are the default ones — the count and the layout are ${esc(b.label)}'s, the vehicles are not.`}`;
    // A brand that names the font its sites load (brands.js `font`) is shown
    // in it: the stylesheet is linked once per brand and the family goes on
    // each of its stages as an inline style - page scaffolding, the same as
    // the stage's own Arial, and nothing the generator emits. The copied
    // code stays font-free, since the site the snippet lands on already
    // loads the font.
    const fontNote = b.font ? ` Shown in ${esc(b.font.family)}, which its sites already load; the copied code names no font.` : '';
    sec.innerHTML = `<div class="gx-head"><img class="bb-logo" src="img/logo-${id}.png" width="116" height="100" alt="" loading="lazy"><div><h2>${esc(b.label)}</h2><p class="bb-note">${note}${fontNote}</p>${b.note ? `<p class="bb-note">${esc(b.note)}</p>` : ''}</div></div>`;
    if (b.font?.css) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = b.font.css;
      document.head.append(link);
    }
    for (const pid of measured.length ? measured : ['modelbar']) {
      rendered.add(pid);
      const cls = `bb-${id}-${pid}`;
      const r = renderPattern(pid, cls, { brand: id });
      css.push(r.css);
      const block = document.createElement('div');
      block.className = 'bb-block';
      block.innerHTML = `<div class="bb-block-head"><h3>${esc(SHORT?.[pid] ?? PATTERNS[pid].label)}</h3><a class="ui-btn" href="index.html#${pid}?brand=${id}">Open in the builder</a></div><div class="gx-stage bb-stage" data-pattern="${pid}"></div>`;
      const stage = block.querySelector('.bb-stage');
      stage.innerHTML = r.html;
      if (b.font) stage.style.fontFamily = `${b.font.family}, Arial, Helvetica, sans-serif`;
      // The brand's theme tokens (brands.js `theme`), page scaffolding the
      // same way: a value written as var(--cta-background-color) draws the
      // brand's own here. ui.css carries the demo's stand-in values.
      for (const [k, v] of Object.entries(b.theme ?? {})) if (k !== 'css') stage.style.setProperty(k, v);
      // The brand's own heading and button rules (theme.css), scoped to its
      // stages: each selector gets the stage in front of it, so Chevrolet's
      // bold button does not restyle Toyota's stage further down.
      if (b.theme?.css) {
        css.push(
          b.theme.css
            .split('}')
            .filter((r) => r.trim())
            .map((r) => {
              const [sel, body] = r.split('{');
              return `${sel
                .split(',')
                .map((s) => `#b-${id} .bb-stage ${s.trim()}`)
                .join(', ')} {${body}}`;
            })
            .join('\n'),
        );
      }
      sec.append(block);
    }
    grid.append(sec);
  }

  styleEl.textContent = css.join('\n\n');

  for (const root of document.querySelectorAll('.bb-stage .cs')) {
    if (!root.dataset.csInit) new globalThis.CustomSlider(root);
  }
  const scripts = new Set();
  for (const pid of rendered) {
    const p = PATTERNS[pid];
    if (p.script) scripts.add(p.script);
  }
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
  // Webfonts land after first paint and reflow the page under a scroll that
  // already happened, so a deep link can settle short of the section it named
  // - re-run once everything (including the fonts) has actually loaded.
  addEventListener('load', gotoHash);
  addEventListener('hashchange', gotoHash);
})();
