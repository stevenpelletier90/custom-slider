// The one place the workbench talks to Tweakpane.
//
// buildPanel() in workbench.js decides WHICH controls exist and what a change
// does; this file decides how a control is drawn. Every control binds to its
// own { v } and calls back, so `state` keeps the owners it has now - the pane
// is a view of a value, never a second writer of it. That is also why a
// structural change (pattern, look, preset) can throw the whole pane away and
// rebuild: nothing lives in it.
//
// Classic script on purpose: the demo opens over file://.
(() => {
  const CARGO = (globalThis.CARGO ??= {});
  const tp = () => CARGO.tp;

  let pane = null;

  const create = (container) => {
    dispose();
    // A stale checkout over file:// can be missing the vendor bundle. Say so
    // in the panel's place rather than leave it blank; the preview, editor
    // and code panel do not depend on the pane and keep working.
    if (!tp()) {
      container.textContent = 'The settings panel could not load: demo/assets/vendor/tweakpane.js is missing. Run npm run build.';
      return null;
    }
    pane = new (tp().Pane)({ container });
    // Pane#registerPlugin() takes a plugin BUNDLE ({ id, plugin } or { id,
    // plugins: [...] }), not a raw BladePlugin/InputBindingPlugin - it reads
    // `t.plugin`/`t.plugins` and otherwise silently registers nothing, which
    // then surfaces later as "No matching view" when a blade tries to use it.
    // CARGO.tpPlugins stays a flat array of the plugins tp-plugins.js builds
    // with createPlugin(); this is the one place that wraps it for the API
    // Tweakpane actually exposes.
    if (CARGO.tpPlugins?.length) pane.registerPlugin({ id: 'cargo', plugins: CARGO.tpPlugins });
    return pane;
  };

  const dispose = () => {
    pane?.dispose();
    pane = null;
  };

  const folder = (title, opts = {}) => pane.addFolder({ title, expanded: opts.expanded ?? true });

  // Tweakpane's text input commits on change (Enter or blur). The workbench
  // used to update on every keystroke; the preview now updates on commit,
  // which is what a pane user expects and what keeps a colour drag cheap.
  const bind = (parent, label, obj, opts, on) => {
    const b = parent.addBinding(obj, 'v', { label, ...opts });
    b.on('change', (ev) => on(ev.value));
    return b;
  };

  const text = (parent, label, value, on, opts = {}) => {
    const b = bind(parent, label, { v: value ?? '' }, { view: 'text' }, on);
    const input = b.element.querySelector('input');
    if (input && opts.placeholder != null) input.placeholder = opts.placeholder;
    if (opts.note) b.element.title = opts.note;
    return b;
  };

  const int = (parent, label, value, on, opts) => {
    const b = bind(parent, label, { v: value }, { min: opts.min, max: opts.max, step: opts.step ?? 1, format: (n) => String(Math.round(n)) }, (n) => on(Math.round(n)));
    if (opts.note) b.element.title = opts.note;
    return b;
  };

  const list = (parent, label, value, options, on, opts = {}) => {
    const map = {};
    for (const [v, l] of options) map[l] = v;
    const b = bind(parent, label, { v: value }, { options: map }, on);
    // Tweakpane's list view names each <option> only by its display text, not
    // its bound value - the select's own selectedIndex is what it reads back.
    // Set the DOM value too, in the same order, so the native element (and
    // anything that queries it, like a test) reflects the raw value as well.
    const selectEl = b.element.querySelector('select');
    if (selectEl) [...selectEl.options].forEach((o, i) => options[i] && (o.value = options[i][0]));
    if (opts.note) b.element.title = opts.note;
    if (opts.disabled) b.disabled = true;
    return b;
  };

  const bool = (parent, label, value, on, opts = {}) => {
    const b = bind(parent, label, { v: !!value }, {}, on);
    if (opts.note) b.element.title = opts.note;
    return b;
  };

  // A paragraph. The `note` blade comes from tp-plugins.js; before that file
  // exists a separator keeps the adapter loadable.
  const note = (parent, textContent) => (CARGO.tpPlugins?.some((p) => p.id === 'note') ? parent.addBlade({ view: 'note', text: textContent }) : parent.addBlade({ view: 'separator' }));

  // The seven card-style thumbnails. The `lookpicker` blade comes from
  // tp-plugins.js; it owns its own click handling and calls back on pick.
  const looks = (parent, LOOKS, current, onPick) => parent.addBlade({ view: 'lookpicker', looks: LOOKS, current, onPick });

  CARGO.pane = {
    create,
    dispose,
    folder,
    text,
    int,
    list,
    bool,
    note,
    looks,
    get pane() {
      return pane;
    },
  };
})();
