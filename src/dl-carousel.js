/**
 * Custom Slider — dependency-free scroll-snap carousel engine.
 *
 * The CSS (dl-carousel.css) owns layout and physics: the track is a native
 * scroll container with scroll-snap. This file only wires controls,
 * state, autoplay, and the gallery (tabbed) variant onto that.
 *
 * Markup contract (see README): .dl-carousel[data-slider] > .dl-carousel-track > .dl-carousel-slide+
 * Use <ul>/<li> for card carousels (list semantics announce counts),
 * plain <div>s for the gallery variant (slides become tabpanels).
 */

let uidCounter = 0;

const fmt = (tpl, vals) => tpl.replace(/\{(\w+)\}/g, (_, k) => vals[k]);

// aria-disabled (not disabled): current/end controls stay focusable.
const setDisabled = (el, on) => {
  if (on) el.setAttribute('aria-disabled', 'true');
  else el.removeAttribute('aria-disabled');
};

const DEFAULTS = {
  autoplay: 0, // ms between advances; 0 = off
  rewind: true, // arrows wrap at the ends; false stops there
  gallery: false, // tabbed thumbnail-gallery variant
  roledescription: 'carousel', // set '' to omit (localization concerns)
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
    this.track = root.querySelector('.dl-carousel-track');
    if (!this.track) {
      console.error('[dl-carousel] missing required .dl-carousel-track element in', root);
      return;
    }
    this.slides = [...this.track.querySelectorAll(':scope > .dl-carousel-slide')];
    if (!this.slides.length) {
      console.error('[dl-carousel] .dl-carousel-track has no .dl-carousel-slide children in', root);
      return;
    }

    this._snapshot = root.innerHTML; // destroy() restores this
    this.uid = `dlc-${++uidCounter}`;
    this.opts = this._parseOptions(options);
    this.current = 0;
    this._target = null; // pending goTo destination (rapid clicks)
    this._pointerDown = false;
    this._addedRootAttrs = [];
    // CSS reserves the thumb-strip space via [data-gallery] — mirror the JS
    // option onto the attribute so manual construction lays out correctly.
    if (this.opts.gallery) this._setRootAttr('data-gallery', '');
    this._prm = matchMedia('(prefers-reduced-motion: reduce)');
    this._ac = new AbortController();

    this._setupAria();
    this._buildControls();
    if (this.opts.gallery) this._buildGallery();
    this._listen();
    this._setupAutoplay();
    this._commit();
    root._dlCarousel = this;
  }

  static autoInit(scope = document) {
    return [...scope.querySelectorAll('[data-slider]')].filter((el) => !el._dlCarousel && el.dataset.init !== 'manual').map((el) => new Slider(el));
  }

  /* ---- options ---------------------------------------------------------- */

  _parseOptions(js) {
    const d = this.root.dataset;
    const data = {};
    if (d.autoplay !== undefined) data.autoplay = parseInt(d.autoplay, 10) || 0;
    if (d.rewind !== undefined) data.rewind = d.rewind !== 'false';
    if (d.gallery !== undefined) data.gallery = d.gallery !== 'false';
    if (d.roledescription !== undefined) data.roledescription = d.roledescription;
    const opts = { ...DEFAULTS, ...data, ...js, labels: { ...DEFAULTS.labels, ...(js.labels || {}) } };
    if (opts.gallery && opts.autoplay) {
      console.warn('[dl-carousel] autoplay is ignored in gallery mode', this.root);
      opts.autoplay = 0;
    }
    if (opts.autoplay && !opts.rewind) {
      console.warn('[dl-carousel] rewind:false is ignored with autoplay', this.root);
      opts.rewind = true;
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
      console.warn('[dl-carousel] give the slider an aria-label or aria-labelledby', this.root);
    }
    if (this.opts.gallery) return; // gallery slides become tabpanels later
    // <ul>/<li> carries the count announcements — but our own CSS sets
    // list-style:none, and WebKit strips list semantics from an unmarkered
    // list, so re-assert role="list" or Safari/VoiceOver announces nothing.
    // Non-list slides get the APG grouped-carousel treatment instead.
    if (/^(UL|OL)$/.test(this.track.tagName)) {
      this.track.setAttribute('role', 'list');
    } else {
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
    c.className = 'dl-carousel-controls';
    if (this.opts.autoplay > 0) {
      // WCAG 2.2.2: a visible pause mechanism, FIRST in the tab sequence.
      this.pauseBtn = this._btn('dl-carousel-pause', L.pause, ICONS.pause);
      this.pauseBtn.addEventListener(
        'click',
        () => {
          this.rotating ? this.pause() : this.play();
        },
        { signal: this._ac.signal },
      );
      c.append(this.pauseBtn);
    }
    const prev = (this.prevBtn = this._btn('dl-carousel-arrow dl-carousel-arrow--prev', L.prev, ICONS.prev));
    prev.addEventListener(
      'click',
      () => {
        this.pause();
        this.prev();
      },
      { signal: this._ac.signal },
    );
    const next = (this.nextBtn = this._btn('dl-carousel-arrow dl-carousel-arrow--next', L.next, ICONS.next));
    next.addEventListener(
      'click',
      () => {
        this.pause();
        this.next();
      },
      { signal: this._ac.signal },
    );
    c.append(prev, next);
    if (!this.opts.gallery) {
      this.dots = document.createElement('div');
      this.dots.className = 'dl-carousel-dots';
      this.dots.setAttribute('role', 'group');
      this.dots.setAttribute('aria-label', L.dots);
      c.append(this.dots);
    }
    // Terse hidden status ("Slides 4–6 of 12"). Separate region, NOT the
    // track: a live track would announce every card on multi-card moves.
    this.status = document.createElement('div');
    this.status.className = 'dl-carousel-status dl-carousel-sr-only';
    this.status.setAttribute('aria-live', 'polite');
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
    this.perView = Math.max(1, parseInt(getComputedStyle(this.root).getPropertyValue('--dlc-per-view'), 10) || 1);
  }

  _pages() {
    // Page start indexes, stepping by perView, last page clamped to the end.
    // n=7,v=3 → [0,3,4]; n=4,v=3 → [0,1]; n=6,v=3 → [0,3].
    const n = this.slides.length,
      v = this.perView;
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
    p.forEach((s, i) => {
      if (Math.abs(s - ref) < Math.abs(p[best] - ref)) best = i;
    });
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
    const left = Math.max(0, Math.min(this.slides[n].getBoundingClientRect().left - t.getBoundingClientRect().left - t.clientLeft + t.scrollLeft - pad, t.scrollWidth - t.clientWidth));
    if (Math.abs(left - t.scrollLeft) < 1) {
      this._commit(); // already there — scrollend won't fire, commit directly
      return;
    }
    this._target = n;
    // Optimistic update: selection state (tabs, dots, status) moves at
    // activation, per APG tabs — never after the scroll settles.
    this._updateUI();
    t.scrollTo({
      left,
      // Gallery switches photos instantly (APG tabbed carousel); smooth
      // is for the card variants only, and never under reduced motion.
      behavior: behavior ?? (this._prm.matches || this.opts.gallery ? 'auto' : 'smooth'),
    });
  }

  next() {
    const p = this._pages(),
      c = this._currentPage();
    if (c >= p.length - 1) {
      if (this.opts.rewind) this.goTo(0); // rewind past the end
      return;
    }
    this.goTo(p[c + 1]);
  }

  prev() {
    const p = this._pages(),
      c = this._currentPage();
    if (c <= 0) {
      if (this.opts.rewind) this.goTo(p[p.length - 1]); // rewind before the start
      return;
    }
    this.goTo(p[c - 1]);
  }

  /* ---- state: the single commit point -------------------------------------- */

  _listen() {
    const sig = this._ac.signal,
      t = this.track;
    if ('onscrollend' in window) {
      t.addEventListener('scrollend', () => this._commit(), { signal: sig });
    } else {
      // Fallback for engines without scrollend (e.g. iOS Safari < 26.2).
      t.addEventListener(
        'scroll',
        () => {
          clearTimeout(this._debounce);
          this._debounce = setTimeout(() => this._commit(), 150);
        },
        { passive: true, signal: sig },
      );
    }
    t.addEventListener(
      'pointerdown',
      () => {
        this._pointerDown = true;
        this.pause?.(); // user drag permanently stops autoplay (Task 4)
      },
      { signal: sig },
    );
    addEventListener(
      'pointerup',
      () => {
        this._pointerDown = false;
      },
      { signal: sig },
    );
    addEventListener(
      'pointercancel',
      () => {
        this._pointerDown = false;
      },
      { signal: sig },
    );
    this._ro = new ResizeObserver(() => {
      cancelAnimationFrame(this._raf);
      this._raf = requestAnimationFrame(() => {
        this._measure();
        this._rebuildDots(); // self-guarding: rebuilds only when pages/labels actually change
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
    this._updateUI();
    if (changed) {
      this._emit('dlc:change', { index: idx, page: this._currentPage(), slidesInView: this.perView });
    }
  }

  _updateUI() {
    this._updateDots();
    this._updateArrows();
    this._updateStatus();
    if (this.opts.gallery) this._updateGallery();
  }

  _updateArrows() {
    if (this.opts.rewind) return; // wrapping arrows never disable
    const page = this._currentPage(),
      last = this._pages().length - 1;
    setDisabled(this.prevBtn, page <= 0);
    setDisabled(this.nextBtn, page >= last);
  }

  _rebuildDots() {
    if (!this.dots) return;
    const L = this.opts.labels,
      pages = this._pages(),
      total = this.slides.length;
    const key = `${this.perView}:${pages.join()}`;
    if (this._dotsKey !== key) {
      this._dotsKey = key;
      this.dots.textContent = '';
      pages.forEach((start) => {
        const from = start + 1,
          to = Math.min(start + this.perView, total);
        const label = this.perView > 1 ? fmt(L.gotoPage, { from, to }) : fmt(L.gotoSlide, { n: from });
        const b = this._btn('dl-carousel-dot', label, '');
        b.addEventListener(
          'click',
          () => {
            this.pause();
            this.goTo(start);
          },
          { signal: this._ac.signal },
        );
        this.dots.append(b);
      });
    }
    this._updateDots();
  }

  _updateDots() {
    if (!this.dots) return;
    const page = this._currentPage();
    [...this.dots.children].forEach((b, i) => {
      b.classList.toggle('dl-carousel-dot--current', i === page);
      setDisabled(b, i === page);
    });
  }

  _updateStatus() {
    const L = this.opts.labels,
      total = this.slides.length;
    const cur = this._target ?? this.current;
    const from = cur + 1;
    const to = Math.min(cur + this.perView, total);
    this.status.textContent = this.perView > 1 ? fmt(L.statusMulti, { from, to, total }) : fmt(L.statusSingle, { n: from, total });
  }

  /* ---- autoplay --------------------------------------------------------- */

  _setupAutoplay() {
    if (!(this.opts.autoplay > 0)) return;
    const sig = this._ac.signal;
    this._suspended = new Set(); // temporary holds: hover / hidden / offscreen
    this._wasRotating = null;
    // Reduced motion: rotation never starts at all (APG example behavior),
    // and turning the OS setting on mid-session stops a rotation already
    // running — otherwise it kept going until the next page load.
    this.rotating = !this._prm.matches;
    this._prm.addEventListener('change', () => this._prm.matches && this.pause(), { signal: sig });
    this.root.addEventListener('pointerenter', () => this._suspend('hover'), { signal: sig });
    this.root.addEventListener('pointerleave', () => this._unsuspend('hover'), { signal: sig });
    // Keyboard focus anywhere in the carousel permanently stops rotation
    // (APG) — except on the pause button itself, so tabbing to it doesn't
    // flip the very state the user came to change.
    this.root.addEventListener(
      'focusin',
      (e) => {
        if (this.pauseBtn.contains(e.target)) return;
        this.pause();
      },
      { signal: sig },
    );
    document.addEventListener(
      'visibilitychange',
      () => {
        document.hidden ? this._suspend('hidden') : this._unsuspend('hidden');
      },
      { signal: sig },
    );
    this._io = new IntersectionObserver(
      ([e]) => {
        e.isIntersecting ? this._unsuspend('offscreen') : this._suspend('offscreen');
      },
      { threshold: 0.25 },
    );
    this._io.observe(this.root);
    this._syncRotation();
  }

  /** Permanently stop rotation (only the pause/play button restarts it). */
  pause() {
    if (!this.rotating) return;
    this.rotating = false;
    this._syncRotation();
  }

  play() {
    if (!(this.opts.autoplay > 0) || this.rotating) return;
    this.rotating = true;
    this._syncRotation();
  }

  _suspend(why) {
    this._suspended.add(why);
    this._syncRotation();
  }

  _unsuspend(why) {
    this._suspended.delete(why);
    this._syncRotation();
  }

  _syncRotation() {
    clearInterval(this._timer);
    if (this.rotating && this._suspended.size === 0) {
      this._timer = setInterval(() => this.next(), this.opts.autoplay);
    }
    // UI and events only on actual state change — rewriting the button's
    // children on every hover suspend can drop an in-flight click.
    if (this.rotating === this._wasRotating) return;
    const first = this._wasRotating === null;
    this._wasRotating = this.rotating;
    this.status.setAttribute('aria-live', this.rotating ? 'off' : 'polite');
    const L = this.opts.labels;
    this.pauseBtn.setAttribute('aria-label', this.rotating ? L.pause : L.play);
    this.pauseBtn.innerHTML = this.rotating ? ICONS.pause : ICONS.play;
    if (!first) this._emit(this.rotating ? 'dlc:autoplay-start' : 'dlc:autoplay-stop', {});
  }

  /* ---- gallery (APG tabbed carousel) ------------------------------------ */

  _buildGallery() {
    const L = this.opts.labels,
      sig = this._ac.signal;
    // Per APG tabbed-carousel: the panels wrapper is a polite live region.
    this.track.setAttribute('aria-live', 'polite');
    const list = document.createElement('div');
    list.className = 'dl-carousel-thumbs';
    list.setAttribute('role', 'tablist');
    list.setAttribute('aria-label', L.thumbs);
    this.tabs = this.slides.map((s, i) => {
      const img = s.querySelector('img');
      const name = (img && img.alt) || fmt(L.photo, { n: i + 1 });
      s.id ||= `${this.uid}-panel-${i}`;
      s.setAttribute('role', 'tabpanel'); // NO aria-roledescription="slide" here
      s.setAttribute('aria-label', name);
      // A tabpanel holding no focusable content needs its own tab stop, or the
      // photo is unreachable by keyboard. It also displaces the anonymous stop
      // Chrome synthesises on a scroll container that has no focusable
      // children — the track is one — so the strip announces its photo name
      // instead of an unnamed region. (inert keeps the other panels out.)
      s.tabIndex = 0;
      const b = this._btn('dl-carousel-thumb', name, '');
      b.id = `${this.uid}-tab-${i}`;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', s.id);
      if (img) {
        // Fresh element — cloning would carry site ids/classes/srcset onto
        // the thumb (duplicate-id and restyle hazards on consumer sites).
        const thumb = document.createElement('img');
        thumb.src = img.currentSrc || img.src;
        thumb.alt = ''; // decorative — the tab carries the name
        thumb.loading = 'lazy';
        thumb.decoding = 'async';
        b.append(thumb);
      }
      b.addEventListener(
        'click',
        () => {
          this.pause();
          this.goTo(i);
        },
        { signal: sig },
      );
      list.append(b);
      return b;
    });
    // Roving tabindex + automatic activation: arrow-focusing a tab shows it.
    list.addEventListener(
      'keydown',
      (e) => {
        const n = this.tabs.length;
        let i = this.tabs.indexOf(e.target);
        if (i === -1) return;
        if (e.key === 'ArrowRight') i = (i + 1) % n;
        else if (e.key === 'ArrowLeft') i = (i - 1 + n) % n;
        else if (e.key === 'Home') i = 0;
        else if (e.key === 'End') i = n - 1;
        else return;
        e.preventDefault();
        this.tabs[i].focus();
        this.goTo(i);
      },
      { signal: sig },
    );
    // The strip scrolls with its scrollbar hidden — expose "more thumbs this
    // way" via data-overflow so the CSS can fade the clipped edge instead of
    // leaving thumbnails looking sliced off (mobile especially).
    this._syncThumbFade = () => {
      const max = list.scrollWidth - list.clientWidth - 1;
      const start = list.scrollLeft > 0,
        end = list.scrollLeft < max;
      list.setAttribute('data-overflow', start && end ? 'both' : end ? 'end' : start ? 'start' : 'none');
    };
    list.addEventListener('scroll', this._syncThumbFade, { passive: true, signal: sig });
    this.root.append(list);
    this.thumbsEl = list;
    this._syncThumbFade();
  }

  _updateGallery() {
    const cur = this._target ?? this.current;
    const act = this.slides[cur];
    act.inert = false; // un-inert FIRST — focus() is a no-op on an inert node
    this.slides.forEach((s, i) => {
      if (i === cur) return;
      // Inerting the panel that holds focus would eject the user to <body>.
      // Hand focus to the panel that just became current instead: the ring
      // follows the photo on screen, and this one stops being the exception
      // that stays non-inert (two panels exposed to a screen reader at once).
      if (s.contains(document.activeElement)) act.focus();
      s.inert = true;
    });
    this.tabs.forEach((b, i) => {
      b.setAttribute('aria-selected', String(i === cur));
      b.tabIndex = i === cur ? 0 : -1;
    });
    // Keep the active thumb visible — strip-local math only; scrollIntoView
    // could scroll the PAGE (e.g. on init when the strip is below the fold).
    // The 40px margin clears the edge fade and peeks the neighboring thumb.
    const strip = this.thumbsEl,
      b = this.tabs[cur],
      m = 40;
    const br = b.getBoundingClientRect(),
      sr = strip.getBoundingClientRect();
    if (br.left - m < sr.left) strip.scrollBy({ left: br.left - sr.left - m });
    else if (br.right + m > sr.right) strip.scrollBy({ left: br.right - sr.right + m });
    this._syncThumbFade();
  }

  /* ---- misc ----------------------------------------------------------------- */

  _emit(type, detail) {
    this.root.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
  }

  destroy() {
    if (!this._ac) return;
    this._emit('dlc:destroy', {});
    this._ac.abort();
    clearInterval(this._timer);
    clearTimeout(this._debounce);
    cancelAnimationFrame(this._raf);
    this._ro?.disconnect();
    this._io?.disconnect();
    this.root.innerHTML = this._snapshot;
    for (const a of this._addedRootAttrs) this.root.removeAttribute(a);
    delete this.root._dlCarousel;
  }
}
