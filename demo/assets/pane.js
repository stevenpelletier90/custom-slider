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

  // A folder remembers whether it was open. buildPanel() throws the pane away
  // and builds a new one on every structural change - a pattern, a look, a
  // preset, a switch that adds a row - so without this, opening Advanced and
  // then picking a card style closed it again. Keyed by title rather than by
  // position, because the folders a pattern gets differ.
  const KEY = 'cs-folders';
  const remembered = () => {
    try {
      // Parsed, then checked: a stored "null" or "3" is valid JSON and neither
      // is a map. null in particular would throw on the very next property
      // read and take the whole panel build down with it.
      const v = JSON.parse(localStorage.getItem(KEY) ?? '{}');
      return v && typeof v === 'object' ? v : {};
    } catch {
      return {};
    }
  };
  const folder = (title, opts = {}) => {
    const f = pane.addFolder({ title, expanded: remembered()[title] ?? opts.expanded ?? true });
    f.on('fold', (ev) => {
      try {
        localStorage.setItem(KEY, JSON.stringify({ ...remembered(), [title]: ev.expanded }));
      } catch {
        /* storage blocked: the fold still works, it is just not remembered */
      }
    });
    return f;
  };

  // Tweakpane's text input commits on change (Enter or blur). The workbench
  // used to update on every keystroke; the preview now updates on commit,
  // which is what a pane user expects and what keeps a colour drag cheap.
  const bind = (parent, label, obj, opts, on) => {
    const b = parent.addBinding(obj, 'v', { label, ...opts });
    b.on('change', (ev) => on(ev.value));
    // Tweakpane draws the label as a <div class="tp-lblv_l">, not a <label
    // for>, so nothing connects it to the field: the panel's own rows used to
    // wrap both in one <label> and every input had a name from it. Without
    // this, ~40 controls in the settings panel are announced as "edit text,
    // blank". One place, because every row goes through here.
    b.element.querySelector('input, select')?.setAttribute('aria-label', label);
    return b;
  };

  const text = (parent, label, value, on, opts = {}) => {
    const b = bind(parent, label, { v: value ?? '' }, { view: 'text' }, on);
    const input = b.element.querySelector('input');
    if (input && opts.placeholder != null) input.placeholder = opts.placeholder;
    if (opts.note) b.element.title = opts.note;
    return b;
  };

  // `step` here is a rounding CONSTRAINT, not a spinner increment: Tweakpane
  // commits `origin + Math.round((v - origin) / step) * step`, so a step of 500
  // turns a typed 200 into 0. Pass the granularity the value may actually have,
  // never the amount an arrow key should move by. `max` is optional and clamps
  // when given - leave it out where the property has no upper bound, or a typed
  // value above it is silently changed rather than refused.
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

  // A message under a row, or none. Replaces the old .wb-bad span: the value
  // is refused by okValue() and the field says why instead of going quiet.
  let flags = 0;
  const flag = (binding, message) => {
    const input = binding.element.querySelector('input');
    let el = binding.element.querySelector('.tp-flagv');
    // Clearing takes the flag off the input too. The old mark() wrote
    // String(bad) on every keystroke, so a field fixed after a bad value
    // stopped announcing itself as invalid; leaving aria-invalid standing
    // would tell a screen reader the opposite of what the slider is using.
    if (!message) {
      input?.setAttribute('aria-invalid', 'false');
      input?.removeAttribute('aria-describedby');
      return void el?.remove();
    }
    if (!el) {
      el = document.createElement('p');
      el.className = 'tp-flagv';
      el.id = `tp-flag-${++flags}`;
      binding.element.append(el);
    }
    el.textContent = message;
    input?.setAttribute('aria-invalid', 'true');
    // The message is next to the field on screen; aria-describedby is what
    // puts it next to the field for a screen reader, which otherwise gets
    // "invalid" with no reason attached.
    input?.setAttribute('aria-describedby', el.id);
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
    flag,
    note,
    looks,
    get pane() {
      return pane;
    },
  };
})();
