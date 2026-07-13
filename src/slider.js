/**
 * Custom Slider — dependency-free scroll-snap carousel engine.
 *
 * The CSS (slider.css) owns layout and physics: the track is a native
 * scroll container with scroll-snap. This file only wires controls,
 * state, autoplay, and the gallery (tabbed) variant onto that.
 *
 * Markup contract (see README): .cs[data-slider] > .cs-track > .cs-slide+
 * Use <ul>/<li> for card carousels (list semantics announce counts),
 * plain <div>s for the gallery variant (slides become tabpanels).
 */

let uidCounter = 0;

const fmt = (tpl, vals) => tpl.replace(/\{(\w+)\}/g, (_, k) => vals[k]);

const DEFAULTS = {
  autoplay: 0,                  // ms between advances; 0 = off
  gallery: false,               // tabbed thumbnail-gallery variant
  roledescription: 'carousel',  // set '' to omit (localization concerns)
  labels: {
    prev: 'Previous slides',
    next: 'Next slides',
    pause: 'Stop automatic slide show',
    play: 'Start automatic slide show',
    dots: 'Choose slide',
    gotoSlide: 'Go to slide {n}',
    gotoPage: 'Go to slides {from}–{to}',
    statusSingle: 'Slide {n} of {total}',
    statusMulti: 'Slides {from}–{to} of {total}',
    thumbs: 'Choose photo',
    photo: 'Photo {n}',
  },
};

const ICONS = {
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20"><path d="M15 4l-8 8 8 8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20"><path d="M9 4l8 8-8 8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16"><path d="M7 4h4v16H7zM13 4h4v16h-4z" fill="currentColor"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg>',
};

export class Slider {
  constructor(root, options = {}) {
    this.root = root;
    this.track = root.querySelector('.cs-track');
    if (!this.track) {
      console.error('[custom-slider] missing required .cs-track element in', root);
      return;
    }
    this.slides = [...this.track.querySelectorAll(':scope > .cs-slide')];
    if (!this.slides.length) {
      console.error('[custom-slider] .cs-track has no .cs-slide children in', root);
      return;
    }

    this._snapshot = root.innerHTML;   // destroy() restores this
    this.uid = `cs-${++uidCounter}`;
    this.opts = this._parseOptions(options);
    this.current = 0;
    this._target = null;               // pending goTo destination (rapid clicks)
    this._pointerDown = false;
    this._addedRootAttrs = [];
    this._prm = matchMedia('(prefers-reduced-motion: reduce)');
    this._ac = new AbortController();

    this._setupAria();
    this._buildControls();
    this._listen();
    this._commit();
    root._csSlider = this;
  }

  static autoInit(scope = document) {
    return [...scope.querySelectorAll('[data-slider]')]
      .filter((el) => !el._csSlider)
      .map((el) => new Slider(el));
  }

  /* ---- options ---------------------------------------------------------- */

  _parseOptions(js) {
    const d = this.root.dataset;
    const data = {};
    if (d.autoplay !== undefined) data.autoplay = parseInt(d.autoplay, 10) || 0;
    if (d.gallery !== undefined) data.gallery = d.gallery !== 'false';
    if (d.roledescription !== undefined) data.roledescription = d.roledescription;
    const opts = { ...DEFAULTS, ...data, ...js, labels: { ...DEFAULTS.labels, ...(js.labels || {}) } };
    if (opts.gallery && opts.autoplay) {
      console.warn('[custom-slider] autoplay is ignored in gallery mode', this.root);
      opts.autoplay = 0;
    }
    return opts;
  }

  /* ---- ARIA setup ------------------------------------------------------- */

  _setRootAttr(name, value) {
    if (!this.root.hasAttribute(name)) this._addedRootAttrs.push(name);
    this.root.setAttribute(name, value);
  }

  _setupAria() {
    if (this.root.tagName !== 'SECTION') this._setRootAttr('role', 'region');
    if (this.opts.roledescription) this._setRootAttr('aria-roledescription', this.opts.roledescription);
    if (!this.root.hasAttribute('aria-label') && !this.root.hasAttribute('aria-labelledby')) {
      console.warn('[custom-slider] give the slider an aria-label or aria-labelledby', this.root);
    }
    if (this.opts.gallery) return; // gallery slides become tabpanels later
    // <ul>/<li> keeps list semantics (count announcements) — leave it alone.
    // Non-list slides get the APG grouped-carousel treatment instead.
    if (!/^(UL|OL)$/.test(this.track.tagName)) {
      this.slides.forEach((s, i) => {
        s.setAttribute('role', 'group');
        s.setAttribute('aria-roledescription', 'slide');
        if (!s.hasAttribute('aria-label') && !s.hasAttribute('aria-labelledby')) {
          const h = s.querySelector('h2,h3,h4,h5,h6');
          if (h) {
            h.id ||= `${this.uid}-h-${i}`;
            s.setAttribute('aria-labelledby', h.id);
          } else {
            s.setAttribute('aria-label', `${i + 1} of ${this.slides.length}`);
          }
        }
      });
    }
  }

  /* ---- generated controls ------------------------------------------------ */

  _btn(cls, label, icon) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.setAttribute('aria-label', label);
    b.innerHTML = icon;
    return b;
  }

  _buildControls() {
    const L = this.opts.labels;
    const c = document.createElement('div');
    c.className = 'cs-controls';
    const prev = this._btn('cs-arrow cs-arrow--prev', L.prev, ICONS.prev);
    prev.addEventListener('click', () => this.prev(), { signal: this._ac.signal });
    const next = this._btn('cs-arrow cs-arrow--next', L.next, ICONS.next);
    next.addEventListener('click', () => this.next(), { signal: this._ac.signal });
    c.append(prev, next);
    if (!this.opts.gallery) {
      this.dots = document.createElement('div');
      this.dots.className = 'cs-dots';
      this.dots.setAttribute('role', 'group');
      this.dots.setAttribute('aria-label', L.dots);
      c.append(this.dots);
    }
    // Terse hidden status ("Slides 4–6 of 12"). Separate region, NOT the
    // track: a live track would announce every card on multi-card moves.
    this.status = document.createElement('div');
    this.status.className = 'cs-status cs-sr-only';
    this.status.setAttribute('aria-live', 'polite');
    this.status.setAttribute('aria-atomic', 'false');
    c.append(this.status);
    // DOM order = tab order: [pause] → prev → next → dots → track.
    this.root.insertBefore(c, this.track);
    this._controls = c;
    this._measure();
    this._rebuildDots();
  }

  /* ---- geometry ---------------------------------------------------------- */

  _measure() {
    const s = this.slides;
    const r0 = s[0].getBoundingClientRect();
    this.stride = s.length > 1 ? s[1].getBoundingClientRect().left - r0.left : r0.width || 1;
    if (this.stride <= 0) this.stride = r0.width || 1; // LTR assumed (v1)
    this.perView = Math.max(1, parseInt(getComputedStyle(this.root).getPropertyValue('--cs-per-view'), 10) || 1);
  }

  _pages() {
    // Page start indexes, stepping by perView, last page clamped to the end.
    // n=7,v=3 → [0,3,4]; n=4,v=3 → [0,1]; n=6,v=3 → [0,3].
    const n = this.slides.length, v = this.perView;
    const last = Math.max(0, n - v);
    const starts = [];
    for (let i = 0; i < n; i += v) {
      const s = Math.min(i, last);
      if (starts[starts.length - 1] !== s) starts.push(s);
    }
    return starts;
  }

  _currentPage() {
    const ref = this._target ?? this.current;
    const p = this._pages();
    let best = 0;
    p.forEach((s, i) => { if (Math.abs(s - ref) < Math.abs(p[best] - ref)) best = i; });
    return best;
  }

  /* ---- navigation --------------------------------------------------------- */

  goTo(n, { behavior } = {}) {
    if (this._pointerDown) return; // never fight an active drag
    n = Math.max(0, Math.min(this.slides.length - 1, n));
    const t = this.track;
    // Compute the snap position ourselves — browsers (WebKit especially)
    // don't reliably re-snap after programmatic scrolls.
    const pad = parseFloat(getComputedStyle(t).scrollPaddingLeft) || 0;
    const left = Math.max(0, Math.min(
      this.slides[n].getBoundingClientRect().left - t.getBoundingClientRect().left
        - t.clientLeft + t.scrollLeft - pad,
      t.scrollWidth - t.clientWidth,
    ));
    if (Math.abs(left - t.scrollLeft) < 1) {
      this._commit(); // already there — scrollend won't fire, commit directly
      return;
    }
    this._target = n;
    t.scrollTo({
      left,
      behavior: behavior ?? (this._prm.matches ? 'auto' : 'smooth'),
    });
  }

  next() {
    const p = this._pages(), c = this._currentPage();
    this.goTo(c >= p.length - 1 ? 0 : p[c + 1]); // rewind past the end
  }

  prev() {
    const p = this._pages(), c = this._currentPage();
    this.goTo(c <= 0 ? p[p.length - 1] : p[c - 1]); // rewind before the start
  }

  /* ---- state: the single commit point -------------------------------------- */

  _listen() {
    const sig = this._ac.signal, t = this.track;
    if ('onscrollend' in window) {
      t.addEventListener('scrollend', () => this._commit(), { signal: sig });
    } else {
      // Fallback for engines without scrollend (e.g. iOS Safari < 26.2).
      t.addEventListener('scroll', () => {
        clearTimeout(this._debounce);
        this._debounce = setTimeout(() => this._commit(), 150);
      }, { passive: true, signal: sig });
    }
    t.addEventListener('pointerdown', () => {
      this._pointerDown = true;
      this.pause?.(); // user drag permanently stops autoplay (Task 4)
    }, { signal: sig });
    addEventListener('pointerup', () => { this._pointerDown = false; }, { signal: sig });
    addEventListener('pointercancel', () => { this._pointerDown = false; }, { signal: sig });
    this._ro = new ResizeObserver(() => {
      cancelAnimationFrame(this._raf);
      this._raf = requestAnimationFrame(() => {
        const before = this.perView;
        this._measure();
        if (this.perView !== before) this._rebuildDots();
        this.goTo(this.current, { behavior: 'auto' }); // re-align to a snap point
      });
    });
    this._ro.observe(t);
  }

  _commit() {
    this._target = null;
    this._measure();
    const idx = Math.max(0, Math.min(this.slides.length - 1, Math.round(this.track.scrollLeft / this.stride)));
    const changed = idx !== this.current;
    this.current = idx;
    this._updateDots();
    this._updateStatus();
    if (changed) {
      this._emit('cs:change', { index: idx, page: this._currentPage(), slidesInView: this.perView });
    }
  }

  _rebuildDots() {
    if (!this.dots) return;
    const L = this.opts.labels, pages = this._pages(), total = this.slides.length;
    if (this.dots.children.length !== pages.length) {
      this.dots.textContent = '';
      pages.forEach((start) => {
        const from = start + 1, to = Math.min(start + this.perView, total);
        const label = this.perView > 1 ? fmt(L.gotoPage, { from, to }) : fmt(L.gotoSlide, { n: from });
        const b = this._btn('cs-dot', label, '');
        b.addEventListener('click', () => this.goTo(start), { signal: this._ac.signal });
        this.dots.append(b);
      });
    }
    this._updateDots();
  }

  _updateDots() {
    if (!this.dots) return;
    const page = this._currentPage();
    [...this.dots.children].forEach((b, i) => {
      b.classList.toggle('cs-dot--current', i === page);
      // aria-disabled (not disabled): the current dot stays focusable.
      if (i === page) b.setAttribute('aria-disabled', 'true');
      else b.removeAttribute('aria-disabled');
    });
  }

  _updateStatus() {
    const L = this.opts.labels, total = this.slides.length;
    const from = this.current + 1;
    const to = Math.min(this.current + this.perView, total);
    this.status.textContent = this.perView > 1
      ? fmt(L.statusMulti, { from, to, total })
      : fmt(L.statusSingle, { n: from, total });
  }

  /* ---- misc ----------------------------------------------------------------- */

  _emit(type, detail) {
    this.root.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
  }

  destroy() {
    if (!this.track) return;
    this._emit('cs:destroy', {});
    this._ac.abort();
    clearInterval(this._timer);
    clearTimeout(this._debounce);
    cancelAnimationFrame(this._raf);
    this._ro?.disconnect();
    this._io?.disconnect();
    this.root.innerHTML = this._snapshot;
    for (const a of this._addedRootAttrs) this.root.removeAttribute(a);
    delete this.root._csSlider;
  }
}
