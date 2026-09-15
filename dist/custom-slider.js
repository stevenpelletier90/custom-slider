(() => {
  // src/custom-slider.js
  var uidCounter = 0;
  var fmt = (tpl, vals) => tpl.replace(/\{(\w+)\}/g, (_, k) => vals[k]);
  var setDisabled = (el, on) => {
    if (on) el.setAttribute("aria-disabled", "true");
    else el.removeAttribute("aria-disabled");
  };
  var DEFAULTS = {
    autoplay: 0,
    // ms between advances; 0 = off
    rewind: true,
    // arrows wrap at the ends; false stops there
    step: "page",
    // 'slide' advances one card per arrow/autoplay tick (dealer model-bar feel); dots stay per-page either way
    drag: true,
    // mouse drag-to-scroll on the track; touch/pen swiping is native scrolling and unaffected
    gallery: false,
    // tabbed thumbnail-gallery variant
    fade: false,
    // stacked crossfade instead of a scrolling track (1-up hero); ignores drag/peek
    roledescription: "carousel",
    // set '' to omit (localization concerns)
    labels: {
      prev: "Previous slides",
      next: "Next slides",
      pause: "Stop automatic slide show",
      play: "Start automatic slide show",
      dots: "Choose slide",
      gotoSlide: "Go to slide {n}",
      gotoPage: "Go to slides {from}\u2013{to}",
      statusSingle: "Slide {n} of {total}",
      statusMulti: "Slides {from}\u2013{to} of {total}",
      // The fallback name for a slide in a non-list track with no heading of its
      // own. It was the one announced string built inline, so a site could
      // translate its status region and still have every slide announce "1 of 6"
      // in English (2026-09-15 review).
      slidePosition: "{n} of {total}",
      thumbs: "Choose photo",
      photo: "Photo {n}"
    }
  };
  var ICONS = {
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20"><path d="M15 4l-8 8 8 8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20"><path d="M9 4l8 8-8 8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16"><path d="M7 4h4v16H7zM13 4h4v16h-4z" fill="currentColor"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg>'
  };
  var CustomSlider = class _CustomSlider {
    constructor(root, options = {}) {
      this.root = root;
      this.track = root.querySelector(".cs-track");
      if (!this.track) {
        console.error("[custom-slider] missing required .cs-track element in", root);
        return;
      }
      this.slides = [...this.track.querySelectorAll(":scope > .cs-slide")];
      if (!this.slides.length) {
        console.error("[custom-slider] .cs-track has no .cs-slide children in", root);
        return;
      }
      this._snapshot = root.innerHTML;
      this.uid = `cs-${++uidCounter}`;
      this.opts = this._parseOptions(options);
      this.current = 0;
      this._target = null;
      this._pointerDown = false;
      this._rootAttrs = /* @__PURE__ */ new Map();
      if (this.opts.gallery) this._setRootAttr("data-cs-gallery", "");
      else if (this.root.hasAttribute("data-cs-gallery")) this._setRootAttr("data-cs-gallery", "false");
      if (this.opts.fade) this._setRootAttr("data-cs-fade-on", "");
      else if (this.root.hasAttribute("data-cs-fade")) this._setRootAttr("data-cs-fade", "false");
      this._prm = matchMedia("(prefers-reduced-motion: reduce)");
      this._ac = new AbortController();
      this._setupAria();
      this._buildControls();
      if (this.opts.gallery) this._buildGallery();
      if (!this.track.querySelector('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')) this.track.tabIndex = 0;
      this._listen();
      this._setupAutoplay();
      this._commit();
      root._cs = this;
    }
    static autoInit(scope = document) {
      return [...scope.querySelectorAll("[data-cs]")].filter((el) => !el._cs && el.dataset.csInit !== "manual").map((el) => new _CustomSlider(el));
    }
    /* ---- options ---------------------------------------------------------- */
    _parseOptions(js) {
      const d = this.root.dataset;
      const data = {};
      if (d.csAutoplay !== void 0) data.autoplay = parseInt(d.csAutoplay, 10) || 0;
      if (d.csRewind !== void 0) data.rewind = d.csRewind !== "false";
      if (d.csStep !== void 0) data.step = +d.csStep > 0 ? +d.csStep : d.csStep === "slide" ? "slide" : "page";
      if (d.csDrag !== void 0) data.drag = d.csDrag !== "false";
      if (d.csGallery !== void 0) data.gallery = d.csGallery !== "false";
      if (d.csFade !== void 0) data.fade = d.csFade !== "false";
      if (d.csRoledescription !== void 0) data.roledescription = d.csRoledescription;
      const dl = {};
      for (const k in d) if (k.length > 7 && k.startsWith("csLabel")) dl[k[7].toLowerCase() + k.slice(8)] = d[k];
      const opts = { ...DEFAULTS, ...data, ...js, labels: { ...DEFAULTS.labels, ...dl, ...js.labels || {} } };
      if (opts.step !== "page" && opts.step !== "slide") opts.step = Number.isInteger(+opts.step) && +opts.step > 0 ? +opts.step : "page";
      if (opts.gallery && opts.autoplay) {
        console.warn("[custom-slider] autoplay is ignored in gallery mode", this.root);
        opts.autoplay = 0;
      }
      if (opts.fade && opts.gallery) {
        console.warn("[custom-slider] fade is ignored in gallery mode", this.root);
        opts.fade = false;
      }
      if (opts.autoplay && !opts.rewind) {
        console.warn("[custom-slider] rewind:false is ignored with autoplay", this.root);
        opts.rewind = true;
      }
      return opts;
    }
    /* ---- ARIA setup ------------------------------------------------------- */
    // Remembers what the attribute WAS the first time the engine touches it, so
    // destroy() can put it back. Names alone were kept before, so an authored
    // role="group" or aria-roledescription the engine overwrote came back as
    // the engine's value (2026-09-15 review).
    _setRootAttr(name, value) {
      if (!this._rootAttrs.has(name)) this._rootAttrs.set(name, this.root.getAttribute(name));
      this.root.setAttribute(name, value);
    }
    _setupAria() {
      if (this.root.tagName !== "SECTION") this._setRootAttr("role", "region");
      if (this.opts.roledescription) this._setRootAttr("aria-roledescription", this.opts.roledescription);
      if (!this.root.hasAttribute("aria-label") && !this.root.hasAttribute("aria-labelledby")) {
        console.warn("[custom-slider] give the slider an aria-label or aria-labelledby", this.root);
      }
      if (this.opts.gallery) return;
      if (/^(UL|OL)$/.test(this.track.tagName)) {
        this.track.setAttribute("role", "list");
      } else {
        this.slides.forEach((s, i) => {
          s.setAttribute("role", "group");
          s.setAttribute("aria-roledescription", "slide");
          if (!s.hasAttribute("aria-label") && !s.hasAttribute("aria-labelledby")) {
            const h = s.querySelector("h2,h3,h4,h5,h6");
            if (h) {
              h.id || (h.id = `${this.uid}-h-${i}`);
              s.setAttribute("aria-labelledby", h.id);
            } else {
              s.setAttribute("aria-label", fmt(this.opts.labels.slidePosition, { n: i + 1, total: this.slides.length }));
            }
          }
        });
      }
    }
    /* ---- generated controls ------------------------------------------------ */
    _btn(cls, label, icon) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = cls;
      b.setAttribute("aria-label", label);
      b.innerHTML = icon;
      return b;
    }
    _buildControls() {
      const L = this.opts.labels;
      const c = document.createElement("div");
      c.className = "cs-controls";
      if (this.opts.autoplay > 0) {
        this.pauseBtn = this._btn("cs-pause", L.pause, ICONS.pause);
        this.pauseBtn.addEventListener(
          "click",
          () => {
            this.rotating ? this.pause() : this.play();
          },
          { signal: this._ac.signal }
        );
        c.append(this.pauseBtn);
      }
      const prev = this.prevBtn = this._btn("cs-arrow cs-arrow--prev", L.prev, ICONS.prev);
      prev.addEventListener(
        "click",
        () => {
          this.pause();
          this.prev();
        },
        { signal: this._ac.signal }
      );
      const next = this.nextBtn = this._btn("cs-arrow cs-arrow--next", L.next, ICONS.next);
      next.addEventListener(
        "click",
        () => {
          this.pause();
          this.next();
        },
        { signal: this._ac.signal }
      );
      c.append(prev, next);
      if (!this.opts.gallery) {
        this.dots = document.createElement("div");
        this.dots.className = "cs-dots";
        this.dots.setAttribute("role", "group");
        this.dots.setAttribute("aria-label", L.dots);
        c.append(this.dots);
      }
      this.status = document.createElement("div");
      this.status.className = "cs-status cs-sr-only";
      this.status.setAttribute("aria-live", "polite");
      c.append(this.status);
      this.root.insertBefore(c, this.track);
      this._controls = c;
      this._measure();
      this._rebuildDots();
    }
    /* ---- geometry ---------------------------------------------------------- */
    _measure() {
      if (this.opts.fade) {
        this.stride = 1;
        this.perView = 1;
        return;
      }
      const s = this.slides;
      const r0 = s[0].getBoundingClientRect();
      this.stride = s.length > 1 ? s[1].getBoundingClientRect().left - r0.left : r0.width || 1;
      if (this.stride <= 0) this.stride = r0.width || 1;
      this.perView = Math.max(1, parseInt(getComputedStyle(this.root).getPropertyValue("--cs-per-view"), 10) || 1);
    }
    // Index of the slide nearest scroll position x, read from real offsets
    // rather than index x stride. Several slides can share one offset - a
    // two-row grid stacks two per column - and the multiplication then drifts
    // by however many share it, desyncing the dots and the announced count
    // from where the track actually is. goTo() already scrolls to the slide's
    // measured position; this reverse mapping was the only arithmetic left.
    _at(x) {
      const t = this.track, origin = t.getBoundingClientRect().left - t.scrollLeft;
      let idx = 0, best = Infinity;
      this.slides.forEach((s, i) => {
        const d = Math.abs(s.getBoundingClientRect().left - origin - x);
        if (d < best) {
          best = d;
          idx = i;
        }
      });
      return idx;
    }
    _pages() {
      if (this.opts.fade) return this.slides.map((_, i) => i);
      const n = this.slides.length, v = this.perView;
      const last = Math.max(0, n - v);
      const starts = [];
      for (let i = 0; i < n; i += v) {
        const s = Math.min(i, last);
        if (starts[starts.length - 1] !== s) starts.push(s);
      }
      return starts;
    }
    _stops() {
      if (this.opts.fade) return this.slides.map((_, i) => i);
      const s = this.opts.step;
      if (s === "page") return this._pages();
      const n = s === "slide" ? 1 : s;
      const last = Math.max(0, this.slides.length - this.perView);
      const out = [];
      for (let i = 0; i < last; i += n) out.push(i);
      out.push(last);
      return out;
    }
    _nearest(arr) {
      const ref = this._target ?? this.current;
      let best = 0;
      arr.forEach((s, i) => {
        if (Math.abs(s - ref) < Math.abs(arr[best] - ref)) best = i;
      });
      return best;
    }
    _currentPage() {
      return this._nearest(this._pages());
    }
    /* ---- navigation --------------------------------------------------------- */
    goTo(n, { behavior } = {}) {
      if (this._pointerDown) return;
      n = Math.trunc(+n);
      if (!Number.isFinite(n)) return;
      n = Math.max(0, Math.min(this.slides.length - 1, n));
      if (this.opts.fade) {
        const moved = n !== this.current;
        this.current = n;
        this._target = null;
        this._updateUI();
        if (moved) this._emit("cs:change", { index: n, page: n, slidesInView: 1 });
        return;
      }
      const t = this.track;
      const pad = parseFloat(getComputedStyle(t).scrollPaddingLeft) || 0;
      const left = Math.max(0, Math.min(this.slides[n].getBoundingClientRect().left - t.getBoundingClientRect().left - t.clientLeft + t.scrollLeft - pad, t.scrollWidth - t.clientWidth));
      if (Math.abs(left - t.scrollLeft) < 1) {
        this._commit();
        return;
      }
      this._target = n;
      this._updateUI();
      t.scrollTo({
        left,
        // Gallery switches photos instantly (APG tabbed carousel); smooth
        // is for the card variants only, and never under reduced motion.
        behavior: behavior ?? (this._prm.matches || this.opts.gallery ? "auto" : "smooth")
      });
    }
    next() {
      const p = this._stops(), c = this._nearest(p);
      if (c >= p.length - 1) {
        if (this.opts.rewind) this.goTo(0);
        return;
      }
      this.goTo(p[c + 1]);
    }
    prev() {
      const p = this._stops(), c = this._nearest(p);
      if (c <= 0) {
        if (this.opts.rewind) this.goTo(p[p.length - 1]);
        return;
      }
      this.goTo(p[c - 1]);
    }
    /* ---- state: the single commit point -------------------------------------- */
    _listen() {
      const sig = this._ac.signal, t = this.track;
      if (this.opts.fade) {
        this._ro = new ResizeObserver(() => this._updateUI());
        this._ro.observe(t);
        return;
      }
      if ("onscrollend" in window) {
        t.addEventListener("scrollend", () => this._commit(), { signal: sig });
      } else {
        t.addEventListener(
          "scroll",
          () => {
            clearTimeout(this._debounce);
            this._debounce = setTimeout(() => this._commit(), 150);
          },
          { passive: true, signal: sig }
        );
      }
      t.addEventListener(
        "pointerdown",
        () => {
          this._pointerDown = true;
          this.pause?.();
        },
        { signal: sig }
      );
      addEventListener(
        "pointerup",
        () => {
          this._pointerDown = false;
        },
        { signal: sig }
      );
      addEventListener(
        "pointercancel",
        () => {
          this._pointerDown = false;
        },
        { signal: sig }
      );
      if (this.opts.drag) this._wireDrag();
      this._ro = new ResizeObserver(() => {
        cancelAnimationFrame(this._raf);
        this._raf = requestAnimationFrame(() => {
          this._measure();
          this._rebuildDots();
          this.goTo(this.current, { behavior: "auto" });
        });
      });
      this._ro.observe(t);
    }
    /* ---- mouse drag-to-scroll (touch/pen swiping is native scrolling) ------ */
    _wireDrag() {
      const sig = this._ac.signal, t = this.track;
      let startX = 0, startLeft = 0, far = false;
      t.setAttribute("data-cs-draggable", "");
      t.addEventListener(
        "pointerdown",
        (e) => {
          if (e.pointerType !== "mouse" || e.button !== 0) return;
          this._dragActive = true;
          this._dragMoved = false;
          far = false;
          startX = e.clientX;
          startLeft = t.scrollLeft;
          t.setAttribute("data-cs-dragging", "");
        },
        { signal: sig }
      );
      t.addEventListener(
        "pointermove",
        (e) => {
          if (!this._dragActive) return;
          const dx = e.clientX - startX;
          if (!this._dragMoved && Math.abs(dx) > 4) {
            this._dragMoved = true;
            t.style.scrollSnapType = "none";
            t.style.userSelect = "none";
          }
          if (!far && Math.abs(dx) > 10) {
            far = true;
            t.setPointerCapture(e.pointerId);
          }
          if (this._dragMoved) t.scrollLeft = startLeft - dx;
        },
        { signal: sig }
      );
      const end = () => {
        if (!this._dragActive) return;
        this._dragActive = false;
        t.removeAttribute("data-cs-dragging");
        if (!this._dragMoved) return;
        t.style.userSelect = "";
        this._pointerDown = false;
        this._measure();
        const from = this._at(startLeft);
        let to = this._at(t.scrollLeft);
        const moved = t.scrollLeft - startLeft;
        if (to === from && Math.abs(moved) > this.stride * 0.15) to = from + Math.sign(moved);
        this.goTo(to);
      };
      t.addEventListener("pointerup", end, { signal: sig });
      t.addEventListener("pointercancel", end, { signal: sig });
      addEventListener("pointerup", end, { signal: sig });
      t.addEventListener("dragstart", (e) => this._dragActive && e.preventDefault(), { signal: sig });
      t.addEventListener(
        "click",
        (e) => {
          if (far) {
            far = false;
            e.preventDefault();
            e.stopPropagation();
          }
        },
        { capture: true, signal: sig }
      );
    }
    _commit() {
      if (this.opts.fade) {
        this._measure();
        this._updateUI();
        return;
      }
      if (!this._dragActive && this.track.style.scrollSnapType) this.track.style.scrollSnapType = "";
      this._target = null;
      this._measure();
      const idx = this._at(this.track.scrollLeft);
      const changed = idx !== this.current;
      this.current = idx;
      this._updateUI();
      if (changed) {
        this._emit("cs:change", { index: idx, page: this._currentPage(), slidesInView: this.perView });
      }
    }
    _updateUI() {
      const fits = this._stops().length <= 1;
      if (!this._rootAttrs.has("data-cs-fits")) this._rootAttrs.set("data-cs-fits", this.root.getAttribute("data-cs-fits"));
      this.root.toggleAttribute("data-cs-fits", fits);
      if (this.prevBtn) this.prevBtn.hidden = this.nextBtn.hidden = fits;
      if (this.dots) this.dots.hidden = fits;
      if (this.pauseBtn) {
        this.pauseBtn.hidden = fits;
        if (fits !== this._fits) {
          this._fits = fits;
          fits ? this._suspend("fits") : this._unsuspend("fits");
        }
      }
      this._updateDots();
      this._updateArrows();
      this._updateStatus();
      if (this.opts.gallery) this._updateGallery();
      if (this.opts.fade) this._updateFade();
    }
    _updateFade() {
      this.slides.forEach((sl, i) => {
        const on = i === this.current;
        sl.classList.toggle("cs-slide--current", on);
        if (on || sl.contains(document.activeElement)) sl.removeAttribute("inert");
        else sl.setAttribute("inert", "");
      });
    }
    _updateArrows() {
      if (this.opts.rewind) return;
      const p = this._stops(), c = this._nearest(p);
      setDisabled(this.prevBtn, c <= 0);
      setDisabled(this.nextBtn, c >= p.length - 1);
    }
    _rebuildDots() {
      if (!this.dots) return;
      const L = this.opts.labels, pages = this._pages(), total = this.slides.length;
      const key = `${this.perView}:${pages.join()}`;
      if (this._dotsKey !== key) {
        this._dotsKey = key;
        this.dots.textContent = "";
        pages.forEach((start) => {
          const from = start + 1, to = Math.min(start + this.perView, total);
          const label = this.perView > 1 ? fmt(L.gotoPage, { from, to }) : fmt(L.gotoSlide, { n: from });
          const b = this._btn("cs-dot", label, "");
          b.addEventListener(
            "click",
            () => {
              this.pause();
              this.goTo(start);
            },
            { signal: this._ac.signal }
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
        b.classList.toggle("cs-dot--current", i === page);
        setDisabled(b, i === page);
      });
    }
    _updateStatus() {
      const L = this.opts.labels, total = this.slides.length;
      const cur = this._target ?? this.current;
      const from = cur + 1;
      const to = Math.min(cur + this.perView, total);
      this.status.textContent = this.perView > 1 ? fmt(L.statusMulti, { from, to, total }) : fmt(L.statusSingle, { n: from, total });
    }
    /* ---- autoplay --------------------------------------------------------- */
    _setupAutoplay() {
      if (!(this.opts.autoplay > 0)) return;
      const sig = this._ac.signal;
      this._suspended = /* @__PURE__ */ new Set();
      this._wasRotating = null;
      this.rotating = !this._prm.matches;
      this._prm.addEventListener("change", () => this._prm.matches && this.pause(), { signal: sig });
      this.root.addEventListener("pointerenter", () => this._suspend("hover"), { signal: sig });
      this.root.addEventListener("pointerleave", () => this._unsuspend("hover"), { signal: sig });
      this.root.addEventListener(
        "focusin",
        (e) => {
          if (this.pauseBtn.contains(e.target)) return;
          this.pause();
        },
        { signal: sig }
      );
      document.addEventListener(
        "visibilitychange",
        () => {
          document.hidden ? this._suspend("hidden") : this._unsuspend("hidden");
        },
        { signal: sig }
      );
      this._io = new IntersectionObserver(
        ([e]) => {
          e.isIntersecting ? this._unsuspend("offscreen") : this._suspend("offscreen");
        },
        { threshold: 0.25 }
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
      if (this.rotating === this._wasRotating) return;
      const first = this._wasRotating === null;
      this._wasRotating = this.rotating;
      this.status.setAttribute("aria-live", this.rotating ? "off" : "polite");
      const L = this.opts.labels;
      this.pauseBtn.setAttribute("aria-label", this.rotating ? L.pause : L.play);
      this.pauseBtn.innerHTML = this.rotating ? ICONS.pause : ICONS.play;
      if (!first) this._emit(this.rotating ? "cs:autoplay-start" : "cs:autoplay-stop", {});
    }
    /* ---- gallery (APG tabbed carousel) ------------------------------------ */
    _buildGallery() {
      const L = this.opts.labels, sig = this._ac.signal;
      this.track.setAttribute("aria-live", "polite");
      const list = document.createElement("div");
      list.className = "cs-thumbs";
      list.setAttribute("role", "tablist");
      list.setAttribute("aria-label", L.thumbs);
      this.tabs = this.slides.map((s, i) => {
        const img = s.querySelector("img");
        const name = img && img.alt || fmt(L.photo, { n: i + 1 });
        s.id || (s.id = `${this.uid}-panel-${i}`);
        s.setAttribute("role", "tabpanel");
        s.setAttribute("aria-label", name);
        s.tabIndex = 0;
        const b = this._btn("cs-thumb", name, "");
        b.id = `${this.uid}-tab-${i}`;
        b.setAttribute("role", "tab");
        b.setAttribute("aria-controls", s.id);
        if (img) {
          const thumb = document.createElement("img");
          thumb.src = img.currentSrc || img.src;
          thumb.alt = "";
          thumb.loading = "lazy";
          thumb.decoding = "async";
          b.append(thumb);
        }
        b.addEventListener(
          "click",
          () => {
            this.pause();
            this.goTo(i);
          },
          { signal: sig }
        );
        list.append(b);
        return b;
      });
      list.addEventListener(
        "keydown",
        (e) => {
          const n = this.tabs.length;
          let i = this.tabs.indexOf(e.target);
          if (i === -1) return;
          if (e.key === "ArrowRight") i = (i + 1) % n;
          else if (e.key === "ArrowLeft") i = (i - 1 + n) % n;
          else if (e.key === "Home") i = 0;
          else if (e.key === "End") i = n - 1;
          else return;
          e.preventDefault();
          this.tabs[i].focus();
          this.goTo(i);
        },
        { signal: sig }
      );
      this._syncThumbFade = () => {
        const max = list.scrollWidth - list.clientWidth - 1;
        const start = list.scrollLeft > 0, end = list.scrollLeft < max;
        list.setAttribute("data-cs-overflow", start && end ? "both" : end ? "end" : start ? "start" : "none");
      };
      list.addEventListener("scroll", this._syncThumbFade, { passive: true, signal: sig });
      this.root.append(list);
      this.thumbsEl = list;
      this._syncThumbFade();
    }
    _updateGallery() {
      const cur = this._target ?? this.current;
      const act = this.slides[cur];
      act.inert = false;
      this.slides.forEach((s, i) => {
        if (i === cur) return;
        if (s.contains(document.activeElement)) act.focus();
        s.inert = true;
      });
      this.tabs.forEach((b2, i) => {
        b2.setAttribute("aria-selected", String(i === cur));
        b2.tabIndex = i === cur ? 0 : -1;
      });
      const strip = this.thumbsEl, b = this.tabs[cur], m = 40;
      const br = b.getBoundingClientRect(), sr = strip.getBoundingClientRect();
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
      this._emit("cs:destroy", {});
      this._ac.abort();
      clearInterval(this._timer);
      clearTimeout(this._debounce);
      cancelAnimationFrame(this._raf);
      this._ro?.disconnect();
      this._io?.disconnect();
      this.root.innerHTML = this._snapshot;
      for (const [a, v] of this._rootAttrs) v === null ? this.root.removeAttribute(a) : this.root.setAttribute(a, v);
      delete this.root._cs;
    }
  };

  // src/auto.js
  window.CustomSlider = CustomSlider;
  var run = () => CustomSlider.autoInit();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
/*! patterns */
(function () {
  var wire = function () {
    try {
      document.querySelectorAll('[data-video-dialog]').forEach((root) => {
        const dlg = root.querySelector('.cargo-vdlg');
        const title = dlg.querySelector('.cargo-vdlg-title');
        const media = dlg.querySelector('.cargo-vdlg-media');
        const empty = media.innerHTML;
        root.querySelectorAll('[data-video]').forEach((poster) => {
          poster.addEventListener('click', () => {
            title.textContent = poster.dataset.video;
            dlg.setAttribute('aria-label', poster.dataset.video);
            const src = poster.dataset.videoSrc;
            if (!src) media.innerHTML = empty;
            else if (/youtube|youtu\.be|vimeo/.test(src)) media.innerHTML = '<iframe src="' + src + '" title="' + poster.dataset.video + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
            else media.innerHTML = '<video src="' + src + '" controls playsinline></video>';
            dlg.showModal();
          });
        });
        // Covers the Close button, the Escape key and a click on the backdrop with
        // one listener, because all three end in the same event.
        dlg.addEventListener('close', () => { media.innerHTML = empty; });
      });
    } catch (e) {
      console.error('custom-slider: the video pattern script failed', e);
    }
    try {
      document.querySelectorAll('[data-tabs]').forEach((wrap, w) => {
        const tabs = [...wrap.querySelectorAll('[role="tab"]')];
        const panes = [...wrap.querySelectorAll('[role="tabpanel"]')];
        // Re-id per widget, and find panes within this wrapper rather than by
        // getElementById. The markup ships fixed ids, so two of these on one page
        // would otherwise share them and each tab would drive the other's panes.
        tabs.forEach((t, i) => {
          const tid = 'cargo-tab-' + w + '-' + i;
          const pid = 'cargo-pane-' + w + '-' + i;
          t.id = tid;
          panes[i].id = pid;
          t.setAttribute('aria-controls', pid);
          panes[i].setAttribute('aria-labelledby', tid);
        });
        // The row scrolls sideways rather than wrapping, at every width. data-more
        // says which way there is more to see and is absent while the row fits, which
        // is what the CSS keys its left alignment and its edge fade on.
        const row = wrap.querySelector('[role="tablist"]');
        const edges = () => {
          const max = row.scrollWidth - row.clientWidth;
          if (max < 2) row.removeAttribute('data-more');
          else row.setAttribute('data-more', row.scrollLeft < 2 ? 'end' : row.scrollLeft > max - 2 ? 'start' : 'both');
        };
        // Strip-local math, never scrollIntoView(): the row sits inside the page, and
        // scrollIntoView() would scroll the PAGE to it as well.
        const reveal = (t) => {
          if (row.scrollWidth - row.clientWidth < 2) return;
          const to = t.getBoundingClientRect().left - row.getBoundingClientRect().left + row.scrollLeft - (row.clientWidth - t.offsetWidth) / 2;
          row.scrollTo({ left: Math.max(0, to), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        };
        row.addEventListener('scroll', edges, { passive: true });
        addEventListener('resize', edges);
        // picked marks a pane the reader switched to, which is what the fade in
        // the CSS keys on - the pane the page loads with is shown without it, so
        // nothing fades on load.
        const show = (i, picked) => {
          tabs.forEach((t, j) => {
            t.setAttribute('aria-selected', String(i === j));
            t.tabIndex = i === j ? 0 : -1;
            panes[j].hidden = i !== j;
            if (picked && i === j) panes[j].setAttribute('data-in', '');
          });
          if (picked) reveal(tabs[i]);
        };
        // The marker the CSS waits for: from here the tab row is a control that
        // works, so it may be presented. Set BEFORE show(0) so the row and the pane
        // hiding arrive in the same frame rather than the row appearing over three
        // open panes.
        wrap.setAttribute('data-tabs-on', '');
        tabs.forEach((t, i) => t.addEventListener('click', () => show(i, true)));
        wrap.addEventListener('keydown', (e) => {
          const i = tabs.indexOf(e.target);
          if (i < 0) return;
          const to = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
          if (to < 0) return;
          e.preventDefault();
          const n = (to + tabs.length) % tabs.length;
          show(n, true);
          tabs[n].focus();
        });
        show(0);
        edges();
      });
    } catch (e) {
      console.error('custom-slider: the tabs pattern script failed', e);
    }
    try {
      document.querySelectorAll('[data-bar]').forEach((root) => {
        const sync = () => {
          const bar = root.querySelector('.cs-dots');
          if (!bar) return;
          const dots = [...bar.children];
          bar.style.setProperty('--bar-count', dots.length || 1);
          bar.style.setProperty('--bar-index', Math.max(0, dots.findIndex((d) => d.classList.contains('cs-dot--current'))));
        };
        // Watch the carousel, not the dot row: the dots are built by the engine and
        // may not exist yet, whatever order the two scripts loaded in. The same
        // observer catches the class flipping on a page change and the children
        // being rebuilt when a breakpoint changes the page count.
        new MutationObserver(sync).observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
        sync();
      });
    } catch (e) {
      console.error('custom-slider: the models pattern script failed', e);
    }
    try {
      document.querySelectorAll('[data-filter-gallery]').forEach((wrap) => {
        const root = wrap.querySelector('.cs');
        const all = [...root.querySelectorAll('.cs-slide')].map((s) => s.cloneNode(true));
        wrap.querySelectorAll('[data-filter]').forEach((btn) => {
          btn.addEventListener('click', () => {
            const tag = btn.dataset.filter;
            wrap.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
            if (root._cs) root._cs.destroy();
            // Re-query AFTER destroy(). destroy() puts the root's original markup
            // back, so any element captured before it is now detached and writing
            // to it changes nothing you can see.
            const track = root.querySelector('.cs-track');
            track.replaceChildren(...all.filter((s) => !tag || s.querySelector('[data-tag]').dataset.tag === tag).map((s) => s.cloneNode(true)));
            new CustomSlider(root);
          });
        });
      });
    } catch (e) {
      console.error('custom-slider: the gallery-filter pattern script failed', e);
    }
    try {
      document.querySelectorAll('[data-video-dialog]').forEach((root) => {
        const dlg = root.querySelector('.cargo-vdlg');
        const title = dlg.querySelector('.cargo-vdlg-title');
        const media = dlg.querySelector('.cargo-vdlg-media');
        const empty = media.innerHTML;
        root.querySelectorAll('[data-video]').forEach((poster) => {
          poster.addEventListener('click', () => {
            title.textContent = poster.dataset.video;
            dlg.setAttribute('aria-label', poster.dataset.video);
            const src = poster.dataset.videoSrc;
            if (!src) media.innerHTML = empty;
            else if (/youtube|youtu\.be|vimeo/.test(src)) media.innerHTML = '<iframe src="' + src + '" title="' + poster.dataset.video + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
            else media.innerHTML = '<video src="' + src + '" controls playsinline></video>';
            dlg.showModal();
          });
        });
        // Covers the Close button, the Escape key and a click on the backdrop with
        // one listener, because all three end in the same event.
        dlg.addEventListener('close', () => { media.innerHTML = empty; });
      });
    } catch (e) {
      console.error('custom-slider: the media-gallery pattern script failed', e);
    }
    try {
      document.querySelectorAll('[data-lightbox]').forEach((wrap) => {
        const dlg = wrap.querySelector('dialog');
        const root = dlg.querySelector('.cs');
        wrap.querySelector('[data-lb-open]').addEventListener('click', () => {
          dlg.showModal();
          // Init AFTER the dialog is visible: a slider measured while display:none
          // has no width, so every slide would come out the same wrong size.
          if (!root._cs) new CustomSlider(root);
        });
        dlg.querySelector('[data-lb-close]').addEventListener('click', () => dlg.close());
      });
    } catch (e) {
      console.error('custom-slider: the lightbox pattern script failed', e);
    }
  };
  if (window.CustomSlider) window.CustomSlider.wirePatterns = wire;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
