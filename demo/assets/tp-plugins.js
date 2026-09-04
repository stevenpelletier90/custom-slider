// Tweakpane plugins for what the pane has no native control for.
//
// Written against the plugin API that ships in @tweakpane/core (exposed on
// CARGO.tp by the vendor bundle), following the official plugin template:
// a plugin is `createPlugin({ id, type, accept, controller, api })`, a blade
// controller extends BladeController and owns a view, and a view is a class
// with an `element`. Nothing here reaches into the library's internals.
//
// Classic script on purpose: the demo opens over file://.
(() => {
  const CARGO = (globalThis.CARGO ??= {});
  // Same guard as pane.js: a stale checkout over file:// can be missing the
  // vendor bundle, and pane.create() already shows "The settings panel could
  // not load..." for that case - this file must not throw before it runs.
  const tp = CARGO.tp;
  if (!tp) return;
  const { createPlugin, parseRecord, ClassName, BladeController, BladeApi } = tp;

  /* ---- note: a paragraph inside a folder ------------------------------- */

  const noteCls = ClassName('note');

  class NoteView {
    constructor(doc, config) {
      this.element = doc.createElement('p');
      this.element.classList.add(noteCls());
      this.element.textContent = config.text;
      config.viewProps.bindClassModifiers(this.element);
    }
  }

  class NoteController extends BladeController {
    constructor(doc, config) {
      super({ blade: config.blade, view: new NoteView(doc, { text: config.text, viewProps: config.viewProps }), viewProps: config.viewProps });
    }
  }

  const NotePlugin = createPlugin({
    id: 'note',
    type: 'blade',
    accept(params) {
      const r = parseRecord(params, (p) => ({ view: p.required.constant('note'), text: p.required.string }));
      return r ? { params: r } : null;
    },
    controller(args) {
      return new NoteController(args.document, { blade: args.blade, viewProps: args.viewProps, text: args.params.text });
    },
    api(args) {
      return args.controller instanceof NoteController ? new BladeApi(args.controller) : null;
    },
  });

  /* ---- lookpicker: the seven card-style thumbnails ---------------------- */

  const lookCls = ClassName('look');

  class LookView {
    constructor(doc, config) {
      this.element = doc.createElement('div');
      this.element.classList.add(lookCls());
      config.viewProps.bindClassModifiers(this.element);
      this.buttons = new Map();
      for (const [id, look] of Object.entries(config.looks)) {
        const b = doc.createElement('button');
        b.type = 'button';
        b.dataset.look = id;
        b.title = look.note ?? look.label;
        b.innerHTML = `<span class="${lookCls('icon')}">${look.icon}</span><span>${look.label}</span>`;
        this.element.append(b);
        this.buttons.set(id, b);
      }
      this.select(config.current);
    }

    select(id) {
      for (const [k, b] of this.buttons) b.setAttribute('aria-pressed', String(k === id));
    }
  }

  class LookController extends BladeController {
    constructor(doc, config) {
      const view = new LookView(doc, { looks: config.looks, current: config.current, viewProps: config.viewProps });
      super({ blade: config.blade, view, viewProps: config.viewProps });
      this.current = config.current;
      view.element.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-look]');
        if (!b) return;
        this.current = b.dataset.look;
        view.select(this.current);
        config.onPick(this.current);
      });
    }
  }

  const LookPickerPlugin = createPlugin({
    id: 'lookpicker',
    type: 'blade',
    accept(params) {
      const r = parseRecord(params, (p) => ({
        view: p.required.constant('lookpicker'),
        looks: p.required.raw,
        current: p.required.string,
        onPick: p.required.raw,
      }));
      return r ? { params: r } : null;
    },
    controller(args) {
      return new LookController(args.document, { blade: args.blade, viewProps: args.viewProps, looks: args.params.looks, current: args.params.current, onPick: args.params.onPick });
    },
    api(args) {
      return args.controller instanceof LookController ? new BladeApi(args.controller) : null;
    },
  });

  /* ---- length: number + unit -------------------------------------------- */

  // rem is deliberately absent. It is locked to <html>, and Bootstrap 3 - what
  // the storefronts run - sets `html { font-size: 10px }`, so every rem shipped
  // at 62.5% on a real dealer page. Offering it in a picker would be offering
  // the bug.
  const UNITS = ['px', 'em', '%', 'vw'];
  const LEN = /^(-?\d*\.?\d+)(px|em|%|vw)$/;
  const lenCls = ClassName('len');

  // Split '0.5em' into ['0.5', 'em']; anything else is not a single length.
  const splitLen = (v) => {
    const m = LEN.exec(String(v ?? '').trim());
    return m ? [m[1], m[2]] : null;
  };

  // Round to the decimals in play, so an 0.1 step never drifts into
  // 0.30000000000000004 and a px->em conversion is a number a person can read.
  const tidy = (n, dp = 3) => String(+n.toFixed(dp));

  class LengthView {
    constructor(doc, config) {
      this.element = doc.createElement('div');
      this.element.classList.add(lenCls());
      config.viewProps.bindClassModifiers(this.element);
      // The default the field falls back to when it is cleared, split the same
      // way the value is: the number greys out in the box and the unit list
      // shows the unit, so an empty row still says what it will ship.
      this.fallback = splitLen(config.placeholder);
      this.num = doc.createElement('input');
      this.num.type = 'text';
      this.num.inputMode = 'decimal';
      this.num.autocomplete = 'off';
      this.num.classList.add(lenCls('n'));
      this.num.placeholder = this.fallback ? this.fallback[0] : (config.placeholder ?? '');
      this.unit = doc.createElement('select');
      this.unit.classList.add(lenCls('u'));
      // Which switches convert and which do not, said on the control rather
      // than left to be discovered by a strip that changed size. px and em have
      // a fixed relationship - the card's own text size - and % and vw are
      // relative to boxes this list cannot resolve, so switching to one of
      // those keeps the number and means something different by it.
      this.unit.title = 'px and em convert into each other, off the card text size. % and vw have no fixed reference: the number stays as typed and only the unit changes.';
      for (const u of UNITS) {
        const o = doc.createElement('option');
        o.value = o.textContent = u;
        this.unit.append(o);
      }
      config.viewProps.bindDisabled(this.num);
      config.viewProps.bindDisabled(this.unit);
      this.element.append(this.num, this.unit);
    }

    // What the slider is actually using, never what was typed at it: a value
    // the box cannot represent leaves the number empty rather than showing a
    // stale one, and the unit falls back to the default's own.
    show(raw) {
      const cur = splitLen(raw);
      this.num.value = cur ? cur[0] : '';
      this.unit.value = cur ? cur[1] : (this.fallback?.[1] ?? 'px');
    }
  }

  class LengthController {
    constructor(doc, config) {
      this.value = config.value;
      this.viewProps = config.viewProps;
      this.fontPx = config.fontPx;
      // What a typed 0 stores. 0.1px by default: a bare `0` is what the
      // platform's minifier makes of `0px`, and the engine's calc() cannot use
      // it - the same broken slider F003 shipped. A knob whose own default IS a
      // zero length (Peek is off at 0px) passes that default in instead, so
      // turning it off goes back to the engine's value and costs no
      // declaration rather than shipping a 0.1px nobody asked for.
      this.zero = config.zero || '0.1px';
      this.view = new LengthView(doc, { viewProps: this.viewProps, placeholder: config.placeholder });
      this.view.show(this.value.rawValue);
      this.was = this.view.unit.value;
      this.value.emitter.on('change', () => {
        this.view.show(this.value.rawValue);
        this.was = this.view.unit.value;
      });

      // Up/down step the number: plain 1, Shift 10, Alt 0.1. Stepping stops at
      // zero, because it is held down and nobody holds an arrow key meaning to
      // arrive at a negative gap - which okValue() would pass and cssFor()
      // would ship. A negative TYPED into the box is still allowed, as it was
      // before: a negative margin-shaped value is somebody's deliberate answer
      // to a layout, and this control does not get to overrule it.
      this.view.num.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        e.preventDefault();
        const by = (e.shiftKey ? 10 : e.altKey ? 0.1 : 1) * (e.key === 'ArrowUp' ? 1 : -1);
        this.view.num.value = tidy(Math.max(0, parseFloat(this.view.num.value || '0') + by));
        this.commit();
      });
      this.view.num.addEventListener('change', () => this.commit());
      this.view.unit.addEventListener('change', () => this.switchUnit());
      this.viewProps.handleDispose(() => {});
    }

    // Empty means "back to the default" - the writer hands '' on, and setProp()
    // already restores it. Anything that is not a number is not a length and
    // cannot be stored as one: the box is redrawn from the value instead, so
    // the row never shows a number the slider is not using.
    commit() {
      const raw = this.view.num.value.trim();
      if (raw === '') return void (this.value.rawValue = '');
      const n = parseFloat(raw);
      if (!Number.isFinite(n)) return void this.view.show(this.value.rawValue);
      const next = n === 0 ? this.zero : `${tidy(n)}${this.view.unit.value}`;
      // A value that has not changed emits nothing, so a typed `2.0` or `wide`
      // would sit in the box unanswered. Redraw either way.
      this.value.rawValue = next;
      this.view.show(this.value.rawValue);
    }

    // px<->em converts off the card's resolved font size; % and vw have no
    // fixed reference, so the number stays and only the unit moves. The number
    // converted is the one IN THE BOX, typed-but-uncommitted included - the
    // list is reached with a value in mind, not after pressing Enter on it.
    //
    // A zero commits nothing: zero is the same length in every unit, so there
    // is no new value to store, and storing one would either substitute 0.1px
    // for a knob that is legitimately off or write the unit back over the one
    // just chosen. The list simply remembers which unit the next number takes.
    switchUnit() {
      const to = this.view.unit.value;
      const from = this.was;
      this.was = to;
      const n = parseFloat(this.view.num.value);
      const px = this.fontPx?.();
      if (Number.isFinite(n) && px) {
        if (from === 'px' && to === 'em') this.view.num.value = tidy(n / px);
        else if (from === 'em' && to === 'px') this.view.num.value = tidy(n * px);
      }
      if (parseFloat(this.view.num.value) === 0) return;
      this.commit();
    }
  }

  const LengthPlugin = createPlugin({
    id: 'length',
    type: 'input',
    accept(value, params) {
      if (typeof value !== 'string') return null;
      const r = parseRecord(params, (p) => ({
        view: p.required.constant('length'),
        fontPx: p.optional.raw,
        placeholder: p.optional.string,
        zero: p.optional.string,
      }));
      return r ? { initialValue: value, params: r } : null;
    },
    binding: {
      reader: () => (v) => String(v ?? ''),
      writer: () => (target, v) => target.write(v),
    },
    controller(args) {
      return new LengthController(args.document, {
        value: args.value,
        viewProps: args.viewProps,
        fontPx: args.params.fontPx,
        placeholder: args.params.placeholder,
        zero: args.params.zero,
      });
    },
  });

  /* ---- colour: a text field, a swatch, and a picker with alpha ---------- */

  // ClassName('col') is `tp-colv`, which is also the prefix Tweakpane's OWN
  // colour view uses: the bundle ships `.tp-colv{position:relative}` (which is
  // what this row wants anyway) and `.tp-colv_t{flex:1;margin-left:4px}`. The
  // prefix stays - the row IS a colour row, and that is what the styles and the
  // tests name - but the text field is `_txt`, so a rule written for a control
  // this build never draws cannot land 4px of margin on it.
  const colCls = ClassName('col');

  // Parse anything the field can hold into {r,g,b,a}, or null when it is not a
  // colour this control can show. The BROWSER does the parsing: a value it will
  // set on an element is a colour and one it refuses is not, which is shorter
  // and more honest than a regex over eight notations - and it is the same
  // parser the preview is about to use.
  //
  // The keyword list comes first because `currentcolor` and `inherit` ARE valid
  // colour values: computing them would resolve them against this panel and
  // hand back a swatch of the wrong colour, when what they mean is "whatever
  // the dealer's page says". They stay as typed, with no swatch colour.
  //
  // The probe is display:none so it can never add a line box to the page;
  // `color` is a computed value, resolved with or without a layout box, so a
  // named colour still comes back as rgb(). It joins the document only for the
  // read and is removed on every path out of the function.
  const probe = document.createElement('span');
  probe.style.display = 'none';
  const parse = (v) => {
    const s = String(v ?? '').trim();
    if (!s || /^(currentcolor|inherit|initial|unset|revert)$/i.test(s) || s.includes('var(')) return null;
    if (/^transparent$/i.test(s)) return { r: 0, g: 0, b: 0, a: 0 };
    probe.style.color = '';
    probe.style.color = s;
    if (!probe.style.color) return null;
    document.body.append(probe);
    const m = /rgba?\(([^)]+)\)/.exec(getComputedStyle(probe).color);
    probe.remove();
    if (!m) return null;
    // The default is the NUMBER 1: the map runs before the destructuring, so an
    // rgb() with no alpha falls through to it unconverted, and a string here
    // would fail the finite check below on every opaque colour.
    const [r, g, b, a = 1] = m[1]
      .split(/[,\s/]+/)
      .filter(Boolean)
      .map(Number);
    return Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b) && Number.isFinite(a) ? { r, g, b, a } : null;
  };

  // Always the platform's notation: a hex when it is opaque, legacy rgba() when
  // it is not, `transparent` at zero. Never modern `rgb(r g b / a)` - stylelint
  // holds the copy panel to the legacy form (color-function-notation: legacy),
  // the format hook rewrites it back, and it is the notation the platform's own
  // minifier keeps. Alpha is rounded BEFORE the zero test, so an alpha that
  // rounds away leaves `transparent` rather than an rgba() ending in 0.
  const format = ({ r, g, b, a }) => {
    const A = Math.min(1, Math.max(0, +Number(a).toFixed(2)));
    if (A <= 0) return 'transparent';
    const hex = (n) =>
      Math.round(Math.min(255, Math.max(0, n)))
        .toString(16)
        .padStart(2, '0');
    if (A >= 1) return `#${hex(r)}${hex(g)}${hex(b)}`;
    return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${A})`;
  };

  class ColourView {
    constructor(doc, config) {
      this.doc = doc;
      this.element = doc.createElement('div');
      this.element.classList.add(colCls());
      config.viewProps.bindClassModifiers(this.element);
      // What an empty field falls back to, parsed once: the row shows the
      // colour the slider is ACTUALLY using rather than an empty box, the same
      // way a length row greys the default number into its placeholder.
      this.fallback = parse(config.placeholder);
      this.sw = doc.createElement('button');
      this.sw.type = 'button';
      this.sw.classList.add(colCls('sw'));
      this.sw.title = 'Pick a colour';
      this.sw.setAttribute('aria-expanded', 'false');
      this.text = doc.createElement('input');
      this.text.type = 'text';
      this.text.spellcheck = false;
      this.text.autocomplete = 'off';
      this.text.classList.add(colCls('txt'));
      this.text.placeholder = config.placeholder ?? '';
      this.clear = doc.createElement('button');
      this.clear.type = 'button';
      this.clear.classList.add(colCls('clear'));
      this.clear.textContent = '×';
      this.clear.title = 'Back to the default';
      this.pop = doc.createElement('div');
      this.pop.classList.add(colCls('pop'));
      this.pop.hidden = true;
      // The native input does the spectrum and nothing else. Making it the
      // WHOLE control is what the old row got wrong: it cannot hold an alpha,
      // it cannot hold `transparent`, and it cannot show a value it did not
      // produce - so it answered every one of those with black.
      this.native = doc.createElement('input');
      this.native.type = 'color';
      this.native.classList.add(colCls('sp'));
      this.alpha = doc.createElement('input');
      this.alpha.type = 'range';
      this.alpha.min = '0';
      this.alpha.max = '1';
      this.alpha.step = '0.01';
      // Full, not the range's own midpoint: a row whose value this control
      // cannot read would otherwise open its picker at 50% opacity and turn the
      // first click on the spectrum into a half-transparent colour.
      this.alpha.value = '1';
      this.alpha.classList.add(colCls('a'));
      // Three sections, each said in a word: an unlabelled colour well reads as
      // a black bar when the value is `transparent`, which is exactly the
      // moment somebody needs to know what it is.
      this.caps = ['Colour', 'Opacity', 'Colours on this slider'].map((t) => {
        const p = doc.createElement('p');
        p.className = colCls('cap');
        p.textContent = t;
        return p;
      });
      this.list = doc.createElement('div');
      this.list.classList.add(colCls('list'));
      this.pop.append(this.caps[0], this.native, this.caps[1], this.alpha, this.caps[2], this.list);
      this.element.append(this.sw, this.text, this.clear, this.pop);
      config.viewProps.bindDisabled(this.text);
      config.viewProps.bindDisabled(this.sw);
      config.viewProps.bindDisabled(this.clear);
    }

    // What the slider is using, never what was typed at it. An empty field
    // falls back to the default; a value this control cannot read - a
    // currentcolor, a var() - keeps its text and loses the swatch colour rather
    // than being redrawn as a colour it is not.
    show(v) {
      const s = String(v ?? '');
      this.text.value = s;
      const c = parse(s) ?? (s.trim() ? null : this.fallback);
      this.sw.style.setProperty('--sw', c ? format(c) : 'transparent');
      if (!c) return;
      this.native.value = format({ ...c, a: 1 });
      this.alpha.value = String(c.a);
    }

    swatches(list) {
      this.list.replaceChildren();
      for (const v of list) {
        const b = this.doc.createElement('button');
        b.type = 'button';
        b.dataset.colour = v;
        b.title = v;
        b.setAttribute('aria-label', v);
        b.style.setProperty('--sw', v);
        this.list.append(b);
      }
      this.caps[2].hidden = !list.length;
    }
  }

  class ColourController {
    constructor(doc, config) {
      this.value = config.value;
      this.viewProps = config.viewProps;
      const v = (this.view = new ColourView(doc, { viewProps: this.viewProps, placeholder: config.placeholder }));
      v.show(this.value.rawValue);
      this.value.emitter.on('change', () => v.show(this.value.rawValue));

      // The text field is authoritative: whatever it holds is what the store
      // gets, normalised when it is a colour and verbatim when it is not.
      // okValue() in workbench.js is still the single gate on what SHIPS, so a
      // value this control cannot read is stored and dropped there rather than
      // being refused here, which would leave the field showing one value while
      // the slider ran another.
      v.text.addEventListener('change', () => this.commit(parse(v.text.value), v.text.value.trim()));
      v.clear.addEventListener('click', () => this.commit(null, ''));
      v.sw.addEventListener('click', () => (v.pop.hidden ? this.open(config.swatches) : this.close()));
      // The spectrum and the opacity are one value, so either moving commits
      // both. rawValue is what the change goes through, which is what keeps a
      // whole drag on the fast path: workbench.js restyles the frame's
      // stylesheet and never rebuilds the stage.
      const fromPicker = () => {
        const c = parse(v.native.value);
        if (c) this.commit({ ...c, a: parseFloat(v.alpha.value) });
      };
      v.native.addEventListener('input', fromPicker);
      v.alpha.addEventListener('input', fromPicker);
      v.list.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-colour]');
        if (!b) return;
        this.commit(parse(b.dataset.colour), b.dataset.colour);
        this.close(true);
      });
      v.element.addEventListener('keydown', (e) => e.key === 'Escape' && !v.pop.hidden && (e.stopPropagation(), this.close(true)));

      this.ac = new AbortController();
      doc.addEventListener(
        'pointerdown',
        (e) => {
          // The pane is thrown away and rebuilt on every structural change, so
          // a row that is no longer on the page takes its listener off itself -
          // handleDispose covers the ordinary path, this covers every other.
          if (!v.element.isConnected) return this.ac.abort();
          if (!v.element.contains(e.target)) this.close();
        },
        { signal: this.ac.signal },
      );
      this.viewProps.handleDispose(() => this.ac.abort());
    }

    // A value equal to the one already stored emits no change, so a typed
    // `RGB(0 0 0/.5)` or a second click on the same swatch would sit in the box
    // unanswered. Redraw either way.
    commit(colour, raw = '') {
      this.value.rawValue = colour ? format(colour) : raw;
      this.view.show(this.value.rawValue);
    }

    open(swatches) {
      // Read at the moment it opens, so a colour set on another row a second
      // ago is already offered here - no row has to be told, and nothing has to
      // be rebuilt to carry it.
      this.view.swatches(swatches?.() ?? []);
      this.view.pop.hidden = false;
      this.view.sw.setAttribute('aria-expanded', 'true');
    }

    close(focus) {
      this.view.pop.hidden = true;
      this.view.sw.setAttribute('aria-expanded', 'false');
      // Only when the popover was dismissed from inside it: focus follows the
      // keyboard back to the control that opened it, and never jumps for a
      // click that landed somewhere else on the page.
      if (focus) this.view.sw.focus();
    }
  }

  const ColourPlugin = createPlugin({
    id: 'colour',
    type: 'input',
    accept(value, params) {
      if (typeof value !== 'string') return null;
      const r = parseRecord(params, (p) => ({
        view: p.required.constant('colour'),
        swatches: p.optional.raw,
        placeholder: p.optional.string,
      }));
      return r ? { initialValue: value, params: r } : null;
    },
    binding: {
      reader: () => (v) => String(v ?? ''),
      writer: () => (target, v) => target.write(v),
    },
    controller(args) {
      return new ColourController(args.document, {
        value: args.value,
        viewProps: args.viewProps,
        swatches: args.params.swatches,
        placeholder: args.params.placeholder,
      });
    },
  });

  // Order matters: the pool unshifts each plugin as it is registered, so the
  // LAST one here is the first asked to accept a binding. Tweakpane's own
  // string input accepts any string and would otherwise draw every length row
  // as a plain text field.
  CARGO.tpPlugins = [NotePlugin, LookPickerPlugin, LengthPlugin, ColourPlugin];
})();
