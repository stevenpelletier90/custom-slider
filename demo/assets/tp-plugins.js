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

  CARGO.tpPlugins = [NotePlugin, LookPickerPlugin];
})();
