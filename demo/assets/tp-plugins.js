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
  const { createPlugin, parseRecord, ClassName, BladeController, BladeApi } = CARGO.tp;

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

      // Up/down step the number: plain 1, Shift 10, Alt 0.1.
      this.view.num.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        e.preventDefault();
        const by = (e.shiftKey ? 10 : e.altKey ? 0.1 : 1) * (e.key === 'ArrowUp' ? 1 : -1);
        this.view.num.value = tidy(parseFloat(this.view.num.value || '0') + by);
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

  // Order matters: the pool unshifts each plugin as it is registered, so the
  // LAST one here is the first asked to accept a binding. Tweakpane's own
  // string input accepts any string and would otherwise draw every length row
  // as a plain text field.
  CARGO.tpPlugins = [NotePlugin, LookPickerPlugin, LengthPlugin];
})();
