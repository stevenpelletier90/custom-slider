// Shared demo-page behavior for demo/index.html and demo/model-bars.html —
// one copy instead of a script block duplicated into each page by hand.
// Page-specific scripts (tabs, video modal, file-copy buttons, thumb drag)
// stay inline in the page that owns them.

// Copy buttons on every code sample. Added by script so the authored
// markup stays clean, and so a reader with JS off just sees normal code
// they can select by hand.
addEventListener('DOMContentLoaded', () => {
  // One polite status region for every copy button: the visual "Copied"
  // swap is silent to a screen reader; this announces it.
  const status = document.createElement('p');
  status.className = 'demo-vh';
  status.setAttribute('role', 'status');
  document.body.append(status);
  const announce = (msg) => {
    // Clear first so copying the same block twice re-announces.
    status.textContent = '';
    requestAnimationFrame(() => {
      status.textContent = msg;
    });
  };

  for (const pre of document.querySelectorAll('details pre')) {
    // Read the label FIRST: once the <pre> is moved inside the wrapper it
    // is an only child, so previousElementSibling is null and every button
    // ends up named "Copy code".
    const label = pre.previousElementSibling?.classList.contains('code-label') ? pre.previousElementSibling.textContent.trim() : 'code';

    // Monokai highlighting: infer the language from the label and let the
    // vendored Prism (assets/vendor/prism.js, manual mode) tokenize it.
    // Copying is untouched — the button reads textContent, which stays the
    // raw code. With Prism absent the block simply stays light.
    if (window.Prism?.highlightElement) {
      const code = pre.querySelector('code');
      if (code) {
        const lang = /css/i.test(label) ? 'css' : /script|\bjs\b/i.test(label) ? 'javascript' : 'markup';
        code.classList.add(`language-${lang}`);
        pre.classList.add('code-dark');
        window.Prism.highlightElement(code);
      }
    }

    const wrap = document.createElement('div');
    wrap.className = 'code-wrap';
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-copy';
    btn.textContent = 'Copy';
    // Named by what it copies AND where: the look from the panel's summary
    // ("Copy this look — Cadillac's dark band…") or, failing that, the
    // section heading — so a screen reader's form-control list is not
    // fifty identical "Copy CSS" buttons.
    const sum = pre.closest('details')?.querySelector('summary')?.textContent.trim() ?? '';
    const context = sum.includes('—') ? sum.split('—').slice(1).join('—').trim() : (pre.closest('section')?.querySelector('h2, h3')?.textContent.split('—')[0].trim() ?? '');
    btn.setAttribute('aria-label', context ? `Copy ${label} — ${context}` : `Copy ${label}`);
    wrap.appendChild(btn);

    btn.addEventListener('click', async () => {
      const text = pre.textContent;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Clipboard API needs a secure context; fall back for file:// and http://
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      btn.textContent = 'Copied';
      btn.dataset.copied = '';
      announce(`Copied ${label} to the clipboard`);
      clearTimeout(btn._t);
      btn._t = setTimeout(() => {
        btn.textContent = 'Copy';
        delete btn.dataset.copied;
      }, 1600);
    });
  }
});

// Tabs ([data-tabs]): APG tabs pattern with automatic activation — arrow keys
// move focus AND selection, panes toggle via [hidden]. The carousels inside
// are untouched: each pane holds its own auto-inited instance, and the
// engine's ResizeObserver re-measures a strip when its pane is revealed.
addEventListener('DOMContentLoaded', () => {
  for (const wrap of document.querySelectorAll('[data-tabs]')) {
    const tabs = [...wrap.querySelectorAll('[role="tab"]')];
    const panes = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    const select = (i) => {
      tabs.forEach((t, j) => {
        t.setAttribute('aria-selected', String(i === j));
        t.tabIndex = i === j ? 0 : -1;
        panes[j].hidden = i !== j;
      });
      // Background transition on tab change (the Kia Demo One touch):
      // page script sets the index, CSS owns the colour and the fade.
      wrap.dataset.tab = i;
    };
    select(
      Math.max(
        0,
        tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'),
      ),
    );
    tabs.forEach((t, i) => t.addEventListener('click', () => select(i)));
    wrap.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
      const i = tabs.indexOf(e.target);
      if (i === -1) return;
      let n = null;
      if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = tabs.length - 1;
      if (n === null) return;
      e.preventDefault();
      tabs[n].focus();
      select(n);
    });
  }
});

// Floating section jump: a pill pinned bottom-right opening this page's own
// section list, built from the grouped structure so mid-page jumps never
// require scrolling back to the table of contents. Runs before the scrollspy
// wires up, so its links get spy highlighting too.
addEventListener('DOMContentLoaded', () => {
  const jump = document.createElement('details');
  jump.className = 'demo-jump';
  const summary = document.createElement('summary');
  summary.textContent = 'Sections';
  const panel = document.createElement('nav');
  panel.className = 'demo-jump-panel';
  panel.setAttribute('aria-label', 'Jump to section');
  const addLink = (sec, sub) => {
    // section title from h2 or h3; a sub-entry (a look inside a ladder)
    // links its own labelled heading
    const h = sub ?? sec.querySelector('h2, h3');
    if (!h) return;
    const a = document.createElement('a');
    a.href = `#${sub ? sub.id : sec.id}`;
    // trim the em-dash tail ("— 19 sites") so the list stays scannable
    a.textContent = h.textContent.split('—')[0].trim();
    if (sub) a.className = 'demo-jump-sub';
    panel.append(a);
  };
  const groups = document.querySelectorAll('.demo-group');
  if (groups.length) {
    for (const g of groups) {
      const title = g.querySelector('.demo-group-head h2');
      if (title) {
        const label = document.createElement('p');
        label.textContent = title.textContent;
        panel.append(label);
      }
      for (const sec of g.querySelectorAll(':scope > section.demo-section[id]')) {
        if (!sec.querySelector('h3')) continue;
        addLink(sec);
        // the looks inside a ladder — each has its own copy panel
        for (const h4 of sec.querySelectorAll('h4.strip-label[id]')) addLink(sec, h4);
      }
    }
  } else {
    // Pages without group bands (the brand directory) still get the pill,
    // built from the flat section list.
    const flat = document.querySelectorAll('main section.demo-section[id]');
    if (!flat.length) return;
    for (const sec of flat) addLink(sec);
  }
  jump.append(summary, panel);
  // Right after the skip link in DOM order: position: fixed keeps the pill
  // visually bottom-right, but a keyboard user reaches it as tab stop #2
  // instead of #320 (appended after the footer, it was effectively
  // unreachable mid-page).
  const skip = document.querySelector('.demo-skip');
  if (skip) skip.after(jump);
  else document.body.prepend(jump);
  // close on a jump, on Escape, or on a tap/click outside (phones have no
  // Escape key), so the pill never squats over the content
  panel.addEventListener('click', (e) => {
    if (e.target.closest('a')) jump.open = false;
  });
  jump.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && jump.open) {
      jump.open = false;
      summary.focus();
    }
  });
  document.addEventListener('pointerdown', (e) => {
    if (jump.open && !jump.contains(e.target)) jump.open = false;
  });
});

// Type-to-filter, shared by every page that carries a #demo-filter input:
// hides the sections whose text doesn't match and reports the count to a
// status region. Brand names buried in strip prose (Cadillac, Subaru…)
// match because the filter reads whole-section text, not headings.
addEventListener('DOMContentLoaded', () => {
  const q = document.getElementById('demo-filter');
  if (!q) return;
  const status = document.getElementById('demo-filter-count');
  const sections = [...document.querySelectorAll('main section.demo-section[id]')];
  q.addEventListener('input', () => {
    const term = q.value.trim().toLowerCase();
    let shown = 0;
    for (const sec of sections) {
      const hit = !term || sec.textContent.toLowerCase().includes(term);
      sec.hidden = !hit;
      if (hit) shown += 1;
    }
    if (status) status.textContent = term ? `${shown} of ${sections.length} sections shown` : '';
  });
});

// TOC scrollspy: mark the section currently on screen with
// aria-current="true" so a long page keeps its sense of place — in the
// table of contents AND the floating section jump. Progressive
// enhancement — with JS off the TOC is still a plain list of links.
addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('.demo-toc a[href^="#"], .demo-jump-panel a[href^="#"]');
  const byTarget = new Map();
  for (const a of links) {
    const target = document.getElementById(decodeURIComponent(a.hash.slice(1)));
    if (!target) continue;
    if (!byTarget.has(target)) byTarget.set(target, []);
    byTarget.get(target).push(a);
  }
  if (!byTarget.size) return;
  let current = [];
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        for (const a of current) a.removeAttribute('aria-current');
        current = byTarget.get(e.target) ?? [];
        // "location" is the ARIA token for "current place within an
        // environment" — exactly what a scrollspy marks.
        for (const a of current) a.setAttribute('aria-current', 'location');
      }
    },
    // A thin band just above centre screen decides "where you are" —
    // whole-viewport intersection would light several sections at once.
    { rootMargin: '-40% 0px -55% 0px' },
  );
  for (const target of byTarget.keys()) io.observe(target);
});

// Solo mode: show one example at a time. The catalog grew to nineteen sections
// and sixteen screens of scrolling, which is fine for browsing and poor for
// "show me the model bar". Reuses the same hidden-section mechanism the
// type-filter uses, and the picker links already point at section ids, so
// navigating IS selecting - no second set of controls to keep in sync.
//
// The filter wins while a search term is live: both features drive the same
// `hidden` flags, and this listener runs after the filter's, so without the
// early return below it would immediately re-show everything the search had
// just narrowed. Clearing the term hands control back to solo.
//
// Only runs where the page provides the toggle. The brand and model-bar
// libraries deliberately opt out: those exist for comparison, where seeing
// many strips at once is the point.
addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('demo-solo-toggle');
  if (!toggle) return;
  const sections = [...document.querySelectorAll('main section.demo-section[id]')];
  if (!sections.length) return;
  const status = document.getElementById('demo-solo-status');
  const filter = document.getElementById('demo-filter');
  const searching = () => !!filter?.value.trim();

  const currentSection = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    return sections.find((s) => s.id === id) || sections[0];
  };

  const apply = () => {
    if (searching()) return; // the filter owns visibility until the term clears
    if (!toggle.checked) {
      for (const s of sections) s.hidden = false;
      if (status) status.textContent = '';
      return;
    }
    const show = currentSection();
    for (const s of sections) s.hidden = s !== show;
    const name = show.querySelector('h2, h3')?.textContent.trim() ?? show.id;
    if (status) status.textContent = `${name} — ${sections.indexOf(show) + 1} of ${sections.length}`;
  };

  toggle.addEventListener('change', () => {
    // Re-checking the box while a search is live would do nothing visible,
    // because apply() defers to the filter. Clear the term so the intent lands.
    if (toggle.checked && searching()) {
      filter.value = '';
      filter.dispatchEvent(new Event('input'));
      return; // that input event re-runs apply() below
    }
    apply();
  });

  // Runs after the filter's own handler, so it sees the post-search state:
  // a live term short-circuits, a cleared one restores solo.
  filter?.addEventListener('input', apply);

  addEventListener('hashchange', apply);

  // Clicking the picker entry for the section already shown fires no
  // hashchange, so re-apply on any in-page link.
  for (const a of document.querySelectorAll('.demo-picker a[href^="#"], .demo-jump-panel a[href^="#"]')) {
    a.addEventListener('click', () => setTimeout(apply, 0));
  }

  apply();
});
