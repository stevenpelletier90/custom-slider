# Workbench on Tweakpane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the workbench's hand-built settings panel with one Tweakpane pane (folders in decision order, a length control with units, a colour control with alpha and swatches, preview pinned), and move the tests to the Playwright test runner, without changing anything the copy panel emits.

**Architecture:** `workbench.js` keeps its state object, its `okValue()` gate, `setProp`, `render()`/`restyle()` and every piece of decision logic in `buildPanel()`; only the DOM-building calls change, to a thin adapter (`demo/assets/pane.js`) over a Tweakpane `Pane`. Tweakpane v4 is ES-module only and the demo must open over `file://`, so esbuild bundles it plus `@tweakpane/core` into a committed IIFE under `demo/assets/vendor/` that exposes `CARGO.tp`. Three plugins written against the documented plugin API (`demo/assets/tp-plugins.js`) supply what Tweakpane lacks: a note blade, a card-style picker blade, a length input, a colour input.

**Tech Stack:** Tweakpane 4.x + @tweakpane/core, esbuild (already present), @playwright/test 1.62.1 (same version as the installed `playwright`).

**Spec:** `docs/superpowers/specs/2026-09-04-workbench-controls-design.md`

## Global Constraints

- The engine (`src/`, `dist/`) does not change. `npm run size` must print the same numbers before and after.
- `cssFor()` and `htmlFor()` output for a given state is byte-identical before and after (the paste-parity test in `tests/builder.test.mjs` proves it).
- The demo stays classic scripts on `globalThis.CARGO` and must open over `file://` (double-click `demo/index.html`).
- Every colour the panel stores is `#rrggbb`, legacy `rgba(r, g, b, a)`, or `transparent`. Never modern `rgb(r g b / a)`. Never a bare `0` length: zero is stored as `0.1px`.
- Lengths use `px`, `em`, `%`, `vw`. `rem` is never offered.
- Commit style: sentence-case imperative subject, a body that says why, ending with the two trailer lines used in this repo (see `git log -3`).
- Stage files by explicit path. Never `git add -A` or `git add .`.
- Run `npm run validate` and `npm test` before every commit. Both green or no commit.
- Windows: write files with the Write tool, never through a bash heredoc (backslashes get eaten).

---

## File map

| File                                    | Responsibility                                                                                                                         |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `playwright.config.mjs`                 | Test runner config: `webServer` on 8137, serial per file, traces on retry.                                                             |
| `tests/helpers.mjs`                     | Page helpers. Loses `serve()`/`launch()`; `setField`/knob readers target the Tweakpane DOM.                                            |
| `tests/*.test.mjs`                      | Ported to `@playwright/test`; every finding tag (F0xx) kept.                                                                           |
| `demo/assets/vendor/tweakpane.entry.js` | ESM entry: imports `Pane` and all of `@tweakpane/core`, assigns `globalThis.CARGO.tp`.                                                 |
| `demo/assets/vendor/tweakpane.js`       | **Generated** IIFE, committed.                                                                                                         |
| `scripts/build-vendor.mjs`              | Builds the IIFE; `--check` compares against the committed file and exits 1 on drift.                                                   |
| `demo/assets/tp-plugins.js`             | Classic script. Four plugins on `CARGO.tpPlugins`: `note` (blade), `lookpicker` (blade), `length` (input), `colour` (input).           |
| `demo/assets/pane.js`                   | Classic script. `CARGO.pane`: creates the `Pane`, registers plugins, and exposes `folder/text/length/colour/list/bool/int/note/looks`. |
| `demo/assets/workbench.js`              | `buildPanel()` calls the adapter. `section/control/valueRow/colorRow/enumSelect/stepper` are deleted.                                  |
| `demo/assets/ui.css`                    | `--tp-*` theme mapping, the settings/preview two-column layout, sticky preview, plugin styles.                                         |
| `demo/index.html`                       | Loads vendor + plugins + adapter; the panel and preview markup regrouped.                                                              |
| `package.json`                          | New devDependencies, `build`, `check:vendor`, `test`, `test:ui`.                                                                       |
| `CLAUDE.md`, `README.md`                | Test paragraph, vendor build, the measured test time.                                                                                  |

---

### Task 1: Move the tests to the Playwright test runner

**Files:**

- Create: `playwright.config.mjs`
- Modify: `package.json` (devDependencies, `scripts.test`, `scripts.test:ui`)
- Modify: `tests/helpers.mjs`
- Modify: `tests/builder.test.mjs`, `tests/content.test.mjs`, `tests/controls.test.mjs`, `tests/dots.test.mjs`, `tests/editor.test.mjs`, `tests/fade.test.mjs`, `tests/labels.test.mjs`, `tests/recipes.test.mjs`, `tests/settings.test.mjs`

**Interfaces:**

- Produces: `tests/helpers.mjs` exports `ORIGIN` (string, `http://127.0.0.1:8137`), `openBuilder(browser, width?)`, and everything it exports today except `serve` and `launch`.

- [ ] **Step 1: Record the baseline**

Run: `npm test 2>&1 | grep "^ℹ "`
Expected: `tests 150`, `pass 150`, `fail 0`. Note the `duration_ms`.

- [ ] **Step 2: Install the runner at the version already installed**

Run: `npm i -D @playwright/test@1.62.1`
Expected: `package.json` gains `"@playwright/test": "^1.62.1"`. `node -e "console.log(require('@playwright/test/package.json').version)"` prints `1.62.1`.

- [ ] **Step 3: Write the config**

Create `playwright.config.mjs`:

```js
// The test runner. Same Chromium the tests always used, now with workers,
// a trace on the first retry, and a server the runner starts itself.
//
// reuseExistingServer: CLAUDE.md is explicit that a second server must never
// be started on 8137 - if `npm run serve` is already answering, that one is
// used. The port is fixed rather than random so helpers.mjs can export ORIGIN
// as a constant that beforeAll hooks can read without a fixture.
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  testMatch: '**/*.test.mjs',
  // Each file shares one page across its tests (they build on each other),
  // so files run serially inside and in parallel across workers.
  fullyParallel: false,
  workers: process.env.CI ? 2 : undefined,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:8137',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run serve',
    url: 'http://127.0.0.1:8137/demo/index.html',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
```

- [ ] **Step 4: Point `npm test` at it**

In `package.json` `scripts`, replace the `test` line and add one:

```json
"test": "playwright test",
"test:ui": "playwright test --ui",
```

- [ ] **Step 5: Slim the helpers**

In `tests/helpers.mjs`: delete the header comment's "No new dependencies" paragraph, the `TYPES` map, `DEV`, `devServerUp()`, `serve()` and `launch()`, and the `node:http`/`node:fs/promises`/`node:path` imports. Add at the top:

```js
// Shared rig for the browser tests, run by @playwright/test
// (playwright.config.mjs starts the server and hands each file a browser).
export const ORIGIN = 'http://127.0.0.1:8137';
```

Change `openBuilder` so the origin is no longer a parameter:

```js
export async function openBuilder(browser, width = 1200) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${ORIGIN}/demo/index.html`, { waitUntil: 'load' });
  await stageReady(page);
  return { ctx, page, errors };
}
```

Change `engineFiles` to take no argument and use `ORIGIN`.

- [ ] **Step 6: Port one file, `tests/dots.test.mjs`, and run it alone**

The port is the same in every file. Replace the imports and hooks:

```js
// before
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { serve, launch, openBuilder, ... } from './helpers.mjs';

let server, browser, page, errors;
before(async () => {
  server = await serve();
  browser = await launch();
  ({ page, errors } = await openBuilder(browser, server.origin, 1500));
});
after(async () => {
  await browser?.close();
  await server?.close();
});

// after
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { openBuilder, ... } from './helpers.mjs';

test.describe.configure({ mode: 'serial' });

let page, errors;
test.beforeAll(async ({ browser }) => {
  ({ page, errors } = await openBuilder(browser, 1500));
});
```

Then `describe(` → `test.describe(` throughout, and any `server.origin` → `ORIGIN` (import it). `assert` stays: the assertions do not change, so the port cannot quietly change what is checked.

Run: `npx playwright test tests/dots.test.mjs`
Expected: every test in the file passes; the runner prints the server start line once.

- [ ] **Step 7: Port the other eight files the same way**

Run: `grep -ln "node:test" tests/*.mjs`
Expected: no output.

Run: `npm test 2>&1 | tail -5`
Expected: `150 passed`. Note the wall time printed on the last line.

- [ ] **Step 8: Lint and commit**

Run: `npm run validate`
Expected: green (eslint already covers `tests/**/*.mjs`; `playwright.config.mjs` at the root is picked up by `format:check`).

```bash
git add playwright.config.mjs package.json package-lock.json tests/helpers.mjs tests/builder.test.mjs tests/content.test.mjs tests/controls.test.mjs tests/dots.test.mjs tests/editor.test.mjs tests/fade.test.mjs tests/labels.test.mjs tests/recipes.test.mjs tests/settings.test.mjs
git commit -F - <<'EOF'
Run the tests under the Playwright runner

Same 150 checks, same Chromium, same assertions. The runner starts the
demo server itself, runs files across workers, and keeps a trace when a
test fails on retry - instead of a number and a guess. node --test was
"no new dependencies", which was a constraint nobody had asked for.

Wall time: <before> ms under node --test, <after> under playwright test.
EOF
```

(Fill both numbers from steps 1 and 7. Add the repo's two trailer lines.)

---

### Task 2: Bundle Tweakpane into a classic script

**Files:**

- Create: `demo/assets/vendor/tweakpane.entry.js`
- Create: `scripts/build-vendor.mjs`
- Create (generated): `demo/assets/vendor/tweakpane.js`
- Modify: `package.json` (devDependencies, `build`, `check:vendor`, `validate`)
- Modify: `eslint.config.js:12` (ignore the generated file)
- Modify: `.prettierignore` (ignore the generated file)
- Modify: `demo/index.html` (script tag)
- Test: `tests/vendor.test.mjs`

**Interfaces:**

- Produces: `globalThis.CARGO.tp` = `{ Pane, ...everything @tweakpane/core exports }` on the demo page, defined before `workbench.js` runs.

- [ ] **Step 1: Write the failing test**

Create `tests/vendor.test.mjs`:

```js
// The pane library reaches the page as a classic script. Tweakpane v4 ships
// ES modules only, and ES modules are blocked over file://, which the demo
// must open from. So esbuild bundles it into an IIFE that is committed, and
// this proves the page can see it before any control is built on it.
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { openBuilder } from './helpers.mjs';

test.describe.configure({ mode: 'serial' });

let page;
test.beforeAll(async ({ browser }) => {
  ({ page } = await openBuilder(browser));
});

test('CARGO.tp carries Pane and the core plugin API', async () => {
  const have = await page.evaluate(() => {
    const tp = globalThis.CARGO?.tp;
    return tp ? ['Pane', 'createPlugin', 'parseRecord', 'ClassName', 'BladeController', 'BladeApi'].filter((k) => typeof tp[k] === 'function') : [];
  });
  assert.deepEqual(have, ['Pane', 'createPlugin', 'parseRecord', 'ClassName', 'BladeController', 'BladeApi']);
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx playwright test tests/vendor.test.mjs`
Expected: FAIL, `have` is `[]`.

- [ ] **Step 3: Install**

Run: `npm i -D tweakpane @tweakpane/core`
Then: `node -e "console.log(require('tweakpane/package.json').version, require('@tweakpane/core/package.json').version)"`
Expected: both `4.x`. If the majors differ, pin `@tweakpane/core` to the version `node_modules/tweakpane/package.json` lists under `dependencies`.

- [ ] **Step 4: Write the entry**

Create `demo/assets/vendor/tweakpane.entry.js`:

```js
// Bundled by scripts/build-vendor.mjs into ./tweakpane.js (an IIFE), which is
// what demo/index.html loads. Everything the pane and its plugins need hangs
// off CARGO.tp, so demo/assets/pane.js and tp-plugins.js stay classic scripts.
import { Pane } from 'tweakpane';
import * as core from '@tweakpane/core';

globalThis.CARGO ??= {};
globalThis.CARGO.tp = { Pane, ...core };
```

- [ ] **Step 5: Write the build script**

Create `scripts/build-vendor.mjs`:

```js
// Builds demo/assets/vendor/tweakpane.js from tweakpane.entry.js.
//
// `--check` rebuilds to memory and compares with the committed file, so
// `npm run validate` fails on a stale bundle the same way the tests fail on
// a stale dist/. GitHub Pages serves the repo as-is, which is why the output
// is committed at all.
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';

const OUT = 'demo/assets/vendor/tweakpane.js';
const check = process.argv.includes('--check');

const result = await build({
  entryPoints: ['demo/assets/vendor/tweakpane.entry.js'],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  minify: true,
  legalComments: 'inline',
  write: !check,
  outfile: check ? undefined : OUT,
  banner: { js: '/*! tweakpane + @tweakpane/core, bundled by scripts/build-vendor.mjs - do not edit */' },
});

if (check) {
  const fresh = result.outputFiles[0].text;
  let committed = '';
  try {
    committed = readFileSync(OUT, 'utf8');
  } catch {
    /* missing counts as stale */
  }
  if (fresh !== committed) {
    console.error(`build-vendor: ${OUT} is stale - run \`npm run build\` and commit it.`);
    process.exit(1);
  }
  console.log(`build-vendor: ${OUT} is current (${committed.length} B).`);
} else {
  console.log(`${OUT}: ${readFileSync(OUT, 'utf8').length} B`);
}
```

- [ ] **Step 6: Wire the scripts**

In `package.json`:

```json
"build": "<existing build command> && node scripts/build-vendor.mjs",
"check:vendor": "node scripts/build-vendor.mjs --check",
"validate": "npm run lint:css && npm run lint:css:generated && npm run lint:js && npm run format:check && npm run check:looks && npm run check:vendor",
```

Add `'demo/assets/vendor/tweakpane.js'` to the `ignores` array in `eslint.config.js:12`. Add `demo/assets/vendor/tweakpane.js` under "Generated files" in `.prettierignore`.

- [ ] **Step 7: Build and load it**

Run: `npm run build`
Expected: the last line prints `demo/assets/vendor/tweakpane.js: <N> B`.

In `demo/index.html`, before the `<script src="assets/workbench.js"` line (find it with `grep -n "workbench.js" demo/index.html`), add:

```html
<!-- The pane library, bundled to a classic script (see assets/vendor/tweakpane.entry.js). -->
<script src="assets/vendor/tweakpane.js"></script>
```

- [ ] **Step 8: Run the test to see it pass**

Run: `npx playwright test tests/vendor.test.mjs`
Expected: PASS.

Run: `npm run validate && npm test`
Expected: both green, 151 passed.

- [ ] **Step 9: Commit**

```bash
git add demo/assets/vendor/tweakpane.entry.js demo/assets/vendor/tweakpane.js scripts/build-vendor.mjs package.json package-lock.json eslint.config.js .prettierignore demo/index.html tests/vendor.test.mjs
git commit -F - <<'EOF'
Bundle Tweakpane into a classic script the demo can load over file://

v4 ships ES modules only. esbuild bundles it with @tweakpane/core into a
committed IIFE that assigns CARGO.tp, and check:vendor fails validate on
a stale copy the way the tests fail on a stale dist/.
EOF
```

---

### Task 3: The pane adapter and its theme

**Files:**

- Create: `demo/assets/pane.js`
- Modify: `demo/assets/ui.css` (append a `/* ---- pane ---- */` block)
- Modify: `demo/index.html` (script tag after the vendor bundle, before `workbench.js`)
- Test: `tests/pane.test.mjs`

**Interfaces:**

- Produces `globalThis.CARGO.pane` with:
  - `create(container: HTMLElement): void` — disposes any previous pane, creates a new one in `container`, registers `CARGO.tpPlugins` if present.
  - `dispose(): void`
  - `folder(title: string, opts?: { expanded?: boolean }): Folder` — returns a Tweakpane `FolderApi`.
  - `text(folder, label: string, value: string, onInput: (v: string) => void, opts?: { placeholder?: string, note?: string }): BindingApi`
  - `int(folder, label, value: number, onChange: (n: number) => void, opts: { min, max, step, note? })`
  - `list(folder, label, value: string, options: [value, label][], onChange: (v: string) => void, opts?: { note?, disabled? })`
  - `bool(folder, label, value: boolean, onChange: (b: boolean) => void, opts?: { note? })`
  - `note(folder, text: string): BladeApi` — a paragraph (plugin from Task 4; until then falls back to a `separator` blade so the adapter loads).
  - `length`, `colour`, `looks` are added in Tasks 4, 6, 7.
- Every control binds to its own `{ v }` object, so the existing handlers in `buildPanel()` keep owning `state`.

- [ ] **Step 1: Write the failing test**

Create `tests/pane.test.mjs`:

```js
// The adapter between buildPanel() and Tweakpane. Each control binds to a
// private { v } and calls back, so state stays owned by the handlers that
// already exist - the pane is a view, never a second owner of a value.
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { openBuilder } from './helpers.mjs';

test.describe.configure({ mode: 'serial' });

let page;
test.beforeAll(async ({ browser }) => {
  ({ page } = await openBuilder(browser));
});

test('text, int, list and bool call back with the typed value', async () => {
  const got = await page.evaluate(async () => {
    const { pane } = globalThis.CARGO;
    const box = document.createElement('div');
    document.body.append(box);
    pane.create(box);
    const f = pane.folder('Probe');
    const out = {};
    pane.text(f, 'T', 'a', (v) => (out.t = v));
    pane.int(f, 'I', 1, (n) => (out.i = n), { min: 1, max: 8, step: 1 });
    pane.list(
      f,
      'L',
      'x',
      [
        ['x', 'Ex'],
        ['y', 'Why'],
      ],
      (v) => (out.l = v),
    );
    pane.bool(f, 'B', false, (b) => (out.b = b));
    const row = (label) => [...box.querySelectorAll('.tp-lblv')].find((r) => r.querySelector('.tp-lblv_l')?.textContent.trim() === label);
    const fire = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));
    const t = row('T').querySelector('input');
    t.value = 'b';
    fire(t, 'change');
    const i = row('I').querySelector('input');
    i.value = '3';
    fire(i, 'change');
    const l = row('L').querySelector('select');
    l.value = 'y';
    fire(l, 'change');
    const b = row('B').querySelector('input[type=checkbox]');
    b.checked = true;
    fire(b, 'change');
    await new Promise((r) => setTimeout(r, 50));
    pane.dispose();
    box.remove();
    return out;
  });
  assert.deepEqual(got, { t: 'b', i: 3, l: 'y', b: true });
});

test('the pane is themed to the demo, not to the library default', async () => {
  const bg = await page.evaluate(() => getComputedStyle(document.querySelector('#wb-settings')).getPropertyValue('--tp-base-background-color').trim());
  assert.notEqual(bg, '', 'no --tp-* variables on the settings container');
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx playwright test tests/pane.test.mjs`
Expected: FAIL, `CARGO.pane` undefined.

- [ ] **Step 3: Write the adapter**

Create `demo/assets/pane.js`:

```js
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
    for (const plugin of CARGO.tpPlugins ?? []) pane.registerPlugin(plugin);
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

  CARGO.pane = {
    create,
    dispose,
    folder,
    text,
    int,
    list,
    bool,
    note,
    get pane() {
      return pane;
    },
  };
})();
```

- [ ] **Step 4: Theme it and load it**

Append to `demo/assets/ui.css`:

```css
/* ---- pane ----------------------------------------------------------------
   Tweakpane is themed through its own custom properties. They are set on the
   settings container and mapped to the demo's tokens, so the pane follows
   the light/dark switch with no script and never shows the library's dark
   dev-tool default. The full list is in node_modules/tweakpane/dist/tweakpane.css. */
#wb-settings {
  --tp-base-background-color: var(--surface);
  --tp-base-shadow-color: transparent;
  --tp-base-font-family: var(--sans);
  --tp-base-border-radius: 6px;
  --tp-container-background-color: var(--sunken);
  --tp-container-background-color-hover: var(--glyph-bg);
  --tp-container-background-color-focus: var(--glyph-bg);
  --tp-container-background-color-active: var(--glyph-bg);
  --tp-container-foreground-color: var(--ink);
  --tp-groove-foreground-color: var(--rule);
  --tp-input-background-color: var(--paper);
  --tp-input-background-color-hover: var(--paper);
  --tp-input-background-color-focus: var(--surface);
  --tp-input-background-color-active: var(--surface);
  --tp-input-foreground-color: var(--ink);
  --tp-label-foreground-color: var(--ink-soft);
  --tp-button-background-color: var(--glyph-bg);
  --tp-button-background-color-hover: var(--glyph-soft);
  --tp-button-background-color-focus: var(--glyph-soft);
  --tp-button-background-color-active: var(--glyph-mid);
  --tp-button-foreground-color: var(--ink);
  --tp-monitor-background-color: var(--paper);
  --tp-monitor-foreground-color: var(--ink-soft);
  --tp-blade-value-width: 11rem;
  --tp-blade-horizontal-padding: 0.5rem;
}

#wb-settings .tp-dfwv {
  inline-size: 100%;
  min-inline-size: 0;
}
```

Check each `--tp-*` name against `grep -o "\-\-tp-[a-z-]*" node_modules/tweakpane/dist/tweakpane.css | sort -u`; drop any this build does not define and add `--tp-*-color-*` states it does. The `.tp-dfwv` selector is the pane root's class; confirm with the same grep for `tp-dfwv`.

In `demo/index.html`, after the vendor `<script>` from Task 2 and before `workbench.js`:

```html
<script src="assets/pane.js"></script>
```

- [ ] **Step 5: Run the test to see it pass**

Run: `npx playwright test tests/pane.test.mjs`
Expected: PASS ×2.

- [ ] **Step 6: Lint, run everything, commit**

Run: `npm run validate && npm test`
Expected: green, 153 passed. (`lint:css` covers `demo/assets/*.css`; if `recess-order` reorders the `--tp-*` block, accept the fix from `npm run lint:css:fix`.)

```bash
git add demo/assets/pane.js demo/assets/ui.css demo/index.html tests/pane.test.mjs
git commit -F - <<'EOF'
Add the pane adapter, themed to the demo

CARGO.pane is the one place the workbench talks to Tweakpane. Each
control binds to a private { v } and calls back, so state keeps the
owners it has; a structural change can throw the pane away and rebuild.
The --tp-* variables map to the demo's own tokens so the pane follows
the theme switch and never shows the library's dark default.
EOF
```

---

### Task 4: Two blade plugins: a note, and the card-style picker

**Files:**

- Create: `demo/assets/tp-plugins.js`
- Modify: `demo/assets/pane.js` (add `looks`)
- Modify: `demo/assets/ui.css` (plugin styles; move `.wb-looks`/`.wb-look`/`.wb-look-icon` rules under `.tp-lookv`)
- Modify: `demo/index.html` (script tag between vendor and pane)
- Test: `tests/pane.test.mjs` (two more tests)

**Interfaces:**

- Produces `CARGO.tpPlugins`: an array of plugin objects (`note`, `lookpicker`, later `length`, `colour`).
- `pane.note(folder, text)` now renders a `<p class="tp-notev">`.
- `pane.looks(folder, looks: Record<id, { label, icon, note }>, current: id, onPick: (id) => void): BladeApi` renders the seven thumbnails.

- [ ] **Step 1: Read the plugin contract from the installed package**

Run: `grep -n "export declare function createPlugin\|export declare class BladeController\|export declare class BladeApi\|export declare function parseRecord\|export declare function ClassName\|interface ViewProps\b" node_modules/@tweakpane/core/dist/index.d.ts | head`
Expected: all six present. Open the `BladeController` constructor signature and the `BladePlugin` type (`grep -n "interface BladePlugin" -A 20 node_modules/@tweakpane/core/dist/index.d.ts`). The code below follows the official plugin template for v4; if a name differs in this build, use the build's name.

- [ ] **Step 2: Write the failing tests**

Append to `tests/pane.test.mjs`:

```js
test('a note is a paragraph in the folder', async () => {
  const text = await page.evaluate(() => {
    const { pane } = globalThis.CARGO;
    const box = document.createElement('div');
    document.body.append(box);
    pane.create(box);
    pane.note(pane.folder('Probe'), 'Hello there');
    const t = box.querySelector('p.tp-notev')?.textContent;
    pane.dispose();
    box.remove();
    return t;
  });
  assert.equal(text, 'Hello there');
});

test('the card-style picker shows every look and reports a click', async () => {
  const got = await page.evaluate(async () => {
    const { pane, LOOKS } = globalThis.CARGO;
    const box = document.createElement('div');
    document.body.append(box);
    pane.create(box);
    let picked = null;
    pane.looks(pane.folder('Probe'), LOOKS, 'tile', (id) => (picked = id));
    const btns = [...box.querySelectorAll('.tp-lookv button')];
    const pressed = btns.filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset.look);
    btns.find((b) => b.dataset.look === 'vcard').click();
    await new Promise((r) => setTimeout(r, 20));
    pane.dispose();
    box.remove();
    return { count: btns.length, pressed, picked };
  });
  assert.equal(got.count, 7);
  assert.deepEqual(got.pressed, ['tile']);
  assert.equal(got.picked, 'vcard');
});
```

(Confirm the look ids with `node -e "const s={};new Function('globalThis',require('fs').readFileSync('demo/assets/looks.js','utf8')).call(s,s);console.log(Object.keys(s.CARGO.LOOKS))"` and use two real ones.)

- [ ] **Step 3: Run them to see them fail**

Run: `npx playwright test tests/pane.test.mjs`
Expected: the two new tests FAIL (`p.tp-notev` missing; `pane.looks` is not a function).

- [ ] **Step 4: Write the plugins file**

Create `demo/assets/tp-plugins.js`:

```js
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
```

If `p.required.raw` is not a parser in this build, use `p.required.object` for `looks` and `p.required.function` for `onPick`; `grep -n "raw\|function:" node_modules/@tweakpane/core/dist/index.d.ts | head` shows which exist.

- [ ] **Step 5: Add `looks` to the adapter**

In `demo/assets/pane.js`, before the `CARGO.pane = {` line:

```js
const looks = (parent, LOOKS, current, onPick) => parent.addBlade({ view: 'lookpicker', looks: LOOKS, current, onPick });
```

and add `looks` to the exported object.

- [ ] **Step 6: Styles and the script tag**

In `demo/assets/ui.css`, rename the selectors `.wb-looks` → `.tp-lookv`, `.wb-look` → `.tp-lookv button`, `.wb-look-icon` → `.tp-lookv_icon` (the `ClassName('look')` helper emits `tp-lookv` for the element and `tp-lookv_icon` for the part; confirm with `grep -n "function ClassName" -A 12 node_modules/@tweakpane/core/dist/index.js`). Add:

```css
.tp-notev {
  margin: 0.35rem 0 0.5rem;
  font-size: 0.8rem;
  line-height: 1.45;
  color: var(--ink-soft);
}
```

In `demo/index.html`, between the vendor script and `pane.js`:

```html
<script src="assets/tp-plugins.js"></script>
```

- [ ] **Step 7: Run the tests to see them pass**

Run: `npx playwright test tests/pane.test.mjs`
Expected: PASS ×4.

- [ ] **Step 8: Lint, run everything, commit**

Run: `npm run validate && npm test`
Expected: green, 155 passed. The old `.wb-look` buttons still render from `buildPanel()` until Task 5; that is fine, the CSS rename only affects the plugin's own markup.

```bash
git add demo/assets/tp-plugins.js demo/assets/pane.js demo/assets/ui.css demo/index.html tests/pane.test.mjs
git commit -F - <<'EOF'
Add the note and card-style picker blades

Two small plugins, written against the documented plugin API, before the
bigger ones: a paragraph inside a folder, and the seven thumbnails a
card style is chosen from. They prove the plugin route works on this
bundle before the length and colour inputs depend on it.
EOF
```

---

### Task 5: Build the panel on the pane

**Files:**

- Modify: `demo/assets/workbench.js` (`buildPanel()`, delete `section`, `control`, `valueRow`, `colorRow`, `enumSelect`, `stepper`; keep `knobNote`, `knobLabel`, `knobDefault`, `defaultFor`, `setProp`, `okValue`, `wantsLength`, `ENUMS`)
- Modify: `tests/helpers.mjs` (`setField`)
- Modify: `tests/controls.test.mjs` (`knob`, `hasKnob`, `colorKnob`)
- Modify: `demo/assets/ui.css` (delete `.wb-row`, `.wb-color`, `.wb-chip`, `.wb-wide`, `.wb-note`, `.wb-bad`, `.wb-input-bad`, the `#wb-settings` columns block, `.ui-panel h3` rules)

**Interfaces:**

- Consumes `CARGO.pane` (Task 3/4).
- Produces: the settings panel is one `Pane` inside `#wb-settings`. Rows are Tweakpane `.tp-lblv` elements whose `.tp-lblv_l` text is the label; the value input is `.tp-lblv_v input` (text/number) or `select` (list) or `input[type=checkbox]`.

- [ ] **Step 1: Update the test helpers to the pane's DOM, and watch them fail**

In `tests/helpers.mjs` replace `setField`:

```js
// A row by its label, in the pane. Tweakpane commits a text input on change
// (Enter or blur), not on every keystroke, so the fill is followed by Enter.
export const rowByLabel = (page, label) => page.locator(`#wb-settings .tp-lblv:has(.tp-lblv_l:text-is("${label}"))`).first();

export const setField = async (page, label, value) => {
  const input = rowByLabel(page, label).locator('input').first();
  await input.fill(value);
  await input.press('Enter');
  await page.waitForTimeout(120);
  return input;
};
```

In `tests/controls.test.mjs` replace the three readers:

```js
// The value a knob displays, by its row label.
const knob = (page, label) =>
  page.evaluate((l) => {
    const row = [...document.querySelectorAll('#wb-settings .tp-lblv')].find((r) => r.querySelector('.tp-lblv_l')?.textContent.trim() === l);
    if (!row) return null;
    const el = row.querySelector('input, select');
    return el ? (el.type === 'checkbox' ? String(el.checked) : el.value) : null;
  }, label);

const hasKnob = async (page, label) => (await knob(page, label)) !== null;

// Until the colour plugin lands (Task 7) a colour row is a text row.
const colorKnob = knob;
```

Run: `npm test`
Expected: many failures in `controls`, `settings`, `builder`, `dots`, `editor`: the rows are not in the pane yet. This is the red state.

- [ ] **Step 2: Rewrite `buildPanel()`**

Keep every decision and every comment in `buildPanel()`; change only how a control is made. The mapping, applied throughout:

| Today                                                                                           | On the pane                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `panel.replaceChildren()`                                                                       | `if (!pane.create(panel)) return;` (from `CARGO.pane`, aliased as `pane` at the top of the file; null means the vendor bundle is missing)                                                                                                                                                                                                                                                      |
| `const grid = document.createElement('div')` … `panel.append(section('How many across', grid))` | `const grid = pane.folder('How many across')` … nothing to append                                                                                                                                                                                                                                                                                                                              |
| `grid.append(control(TIER_LABEL[key], input, note, warn))` with the number input                | `pane.int(grid, TIER_LABEL[key], state.perView[key], (n) => { state.perView[key] = n; render(); }, { min: 1, max: 8, step: 1, note })`                                                                                                                                                                                                                                                         |
| a `<p class="wb-note">`                                                                         | `pane.note(folder, text)`                                                                                                                                                                                                                                                                                                                                                                      |
| brand `<select class="wb-wide">`                                                                | `pane.list(folder, 'Brand', state.brand ?? '', [['', 'Start from the default'], ...Object.entries(BRANDS).map(([id, b]) => [id, b.label])], (v) => { …existing change handler body with `sel.value`→`v`… })`                                                                                                                                                                                   |
| the `.wb-looks` buttons loop                                                                    | `pane.looks(folder, LOOKS, state.look, (id) => { …existing click handler body… })`; the `if (id === state.look) return;` guard stays first                                                                                                                                                                                                                                                     |
| `colorRow(label, key, store)`                                                                   | `pane.text(folder, label, store[key] ?? '', (v) => { setProp(store, key, v); restyle(); }, { placeholder: String(knobDefault(key) ?? ''), note: knobNote(key) })` (Task 7 swaps this for `pane.colour`)                                                                                                                                                                                        |
| `valueRow(label, key, store, after)`                                                            | `pane.text(folder, label, store[key] ?? '', (v) => { if (!okValue(key, v)) { pane.flag(b, wantsLength(key) ? 'Needs a unit — try 1em or 16px, and 0.1px rather than 0.' : 'Not a value the slider can use.'); return; } pane.flag(b, ''); setProp(store, key, v); render(); after?.(); }, { placeholder, note })` where `b` is the returned binding (declare with `let b; b = pane.text(...)`) |
| `control(label, enumSelect(k, store))`                                                          | `pane.list(folder, knobLabel(k), String(store[k]).trim(), ENUMS[k], (v) => { store[k] = v; render(); })`                                                                                                                                                                                                                                                                                       |
| the `step` `<select>`                                                                           | `pane.list(beh, label, state.data['data-cs-step'] ?? 'page', [['page','a full page'],['slide','1 card'],['2','2 cards'],['3','3 cards'],['4','4 cards']], (v) => {…})`                                                                                                                                                                                                                         |
| `auto` number input                                                                             | `pane.int(beh, 'Rotate every (ms)', +(state.data['data-cs-autoplay'] ?? 0), (n) => {…existing change body with `auto.value`→`n`…}, { min: 0, max: 60000, step: 500, note })`                                                                                                                                                                                                                   |
| `ends` `<select>` with `disabled`                                                               | `pane.list(beh, label, state.data['data-cs-rewind'] ?? '', [...], handler, { note, disabled: autoplaying })`                                                                                                                                                                                                                                                                                   |
| each checkbox                                                                                   | `pane.bool(beh, label, checked, (b) => {…existing change body with `x.checked`→`b`…}, { note })`                                                                                                                                                                                                                                                                                               |
| tab-name text inputs                                                                            | `pane.text(names, \`Tab ${i + 1}\`, name, (v) => {…}, { placeholder: p.panes[i] })`                                                                                                                                                                                                                                                                                                            |

Add `flag` to `demo/assets/pane.js` (a validation message under a row, replacing `.wb-bad`):

```js
// A message under a row, or none. Replaces the old .wb-bad span: the value
// is refused by okValue() and the field says why instead of going quiet.
const flag = (binding, message) => {
  let el = binding.element.querySelector('.tp-flagv');
  if (!message) return void el?.remove();
  if (!el) {
    el = document.createElement('p');
    el.className = 'tp-flagv';
    binding.element.append(el);
  }
  el.textContent = message;
  binding.element.querySelector('input')?.setAttribute('aria-invalid', 'true');
};
```

and export it; style `.tp-flagv` in `ui.css` with the old `.wb-bad` rules (`grep -n "^\.wb-bad" -A 8 demo/assets/ui.css`).

Section order stays as today in this task (Task 6 reorders); the goal here is parity.

Delete `section`, `control`, `valueRow`, `colorRow`, `enumSelect`, `stepper` and the `NUM` regex. `knobNote`, `knobLabel`, `knobDefault`, `defaultFor`, `setProp`, `okValue`, `wantsLength`, `ENUMS` stay: `cssFor()` and the lint script use them. Keep the "declared ABOVE `if (!stage) return`" rule from CLAUDE.md for anything `cssFor()` touches.

- [ ] **Step 3: Delete the CSS the old rows used**

In `demo/assets/ui.css` delete the rules for `.wb-row`, `.wb-row > span`, `.wb-row input…`, `.wb-color`, `.wb-chip`, `.wb-wide`, `.wb-note`, `.wb-bad`, `.wb-input-bad`, the `#wb-settings { columns … }` block and `#wb-settings > section…`, `.ui-panel h3`, `.ui-panel section + section h3`, `.ui-panel section:first-child h3`. Run `grep -n "wb-row\|wb-color\|wb-chip\|wb-wide\|wb-note\|wb-bad\|wb-input-bad" demo/assets/*.js demo/*.html` and expect only the content editor's own uses (which keep their rules) — if the content editor (`buildContent`) shares `.wb-row`/`.wb-note`, keep those two rules and only delete the rest.

- [ ] **Step 4: Run the suite until green**

Run: `npm test`
Expected: 155 passed. Common failures and the fix:

- A test types into a field and expects the preview to change with no Enter: it now goes through `setField`, which presses Enter. If a test calls `.fill()` directly, add `.press('Enter')`.
- `label:has(> span:text-is(...))` selectors left in a test file: replace with `rowByLabel`.
- A label that had a `·` or parenthesis: `text-is` is exact; copy the label from `buildPanel()`.

- [ ] **Step 5: Look at it**

Run: `npm run serve` in the background, then screenshot `http://127.0.0.1:8137/demo/index.html` at 1440×900 (`npx playwright screenshot --viewport-size=1440,900 http://127.0.0.1:8137/demo/index.html shot-1440.png`). Confirm: every section is a folder, the card-style thumbnails render in their folder, no row is unlabeled, light theme colours match the page. Fix anything visibly wrong before committing.

- [ ] **Step 6: Lint and commit**

Run: `npm run validate`
Expected: green. `lint:js` will report any now-unused helper; delete it rather than silencing.

```bash
git add demo/assets/workbench.js demo/assets/pane.js demo/assets/ui.css tests/helpers.mjs tests/controls.test.mjs
git commit -F - <<'EOF'
Build the settings panel on the pane

buildPanel() keeps every decision it made and every comment that says
why; only the DOM calls change, to CARGO.pane. The seven row builders
and their CSS are gone. Same sections, same order, same 155 checks.
EOF
```

---

### Task 6: Folders in decision order, preview pinned

**Files:**

- Modify: `demo/assets/workbench.js` (`buildPanel()` order, `expanded` flags, folder-state memory)
- Modify: `demo/index.html` (the `.ui-panel` and `.wb-stage`/`.ui-spec` markup)
- Modify: `demo/assets/ui.css` (two-column work area, sticky preview)
- Test: `tests/layout.test.mjs`

**Interfaces:**

- Produces: folders titled, in order, `Brand and card style`, `How many across`, `This card style`, `Arrows and dots`, `Behaviour`, `Tab names` (tabbed patterns only), `Advanced`. `Advanced` and `Tab names` start collapsed. Folder open/closed state is stored under `localStorage['cs-folders']` as `{ [title]: boolean }`.

- [ ] **Step 1: Write the failing test**

Create `tests/layout.test.mjs`:

```js
// The panel reads in the order decisions get made, nothing splits, and the
// preview stays on screen while the settings scroll.
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { openBuilder, pick } from './helpers.mjs';

test.describe.configure({ mode: 'serial' });

const titles = (page) => page.evaluate(() => [...document.querySelectorAll('#wb-settings .tp-fldv')].map((f) => f.querySelector('.tp-fldv_t')?.textContent.trim()));
const expanded = (page, title) =>
  page.evaluate((t) => [...document.querySelectorAll('#wb-settings .tp-fldv')].find((f) => f.querySelector('.tp-fldv_t')?.textContent.trim() === t)?.classList.contains('tp-fldv-expanded'), title);

test('folders come in decision order on the model bar', async ({ browser }) => {
  const { page } = await openBuilder(browser, 1440);
  await pick(page, 'modelbar');
  assert.deepEqual(await titles(page), ['Brand and card style', 'How many across', 'This card style', 'Arrows and dots', 'Behaviour', 'Advanced']);
  assert.equal(await expanded(page, 'Advanced'), false, 'Advanced starts closed');
  assert.equal(await expanded(page, 'Brand and card style'), true);
});

test('the preview is pinned at 1440 and in flow at 1024', async ({ browser }) => {
  for (const [w, want] of [
    [1440, 'sticky'],
    [1024, 'static'],
  ]) {
    const { page } = await openBuilder(browser, w);
    const pos = await page.evaluate(() => getComputedStyle(document.querySelector('.ui-preview')).position);
    assert.equal(pos, want, `at ${w}`);
  }
});
```

Confirm the folder class names (`tp-fldv`, `tp-fldv_t`, `tp-fldv-expanded`) with `grep -o "tp-fldv[a-z_-]*" node_modules/tweakpane/dist/tweakpane.css | sort -u`.

- [ ] **Step 2: Run it to see it fail**

Run: `npx playwright test tests/layout.test.mjs`
Expected: FAIL on order and on `.ui-preview` not existing.

- [ ] **Step 3: Reorder `buildPanel()`**

Move the blocks so the folders are created in this order, with these titles and flags:

1. `pane.folder('Brand and card style')`: the brand list, its note, the look picker, the look note. (Today's "Brand preset" and "Card style", merged.)
2. `pane.folder('How many across')`: the four tier ints, the crossfade note, then `Gap`, `Peek`, `Card text size` (moved here from "Arrows and spacing": they are about fit, not arrows).
3. `pane.folder('This card style')`: the `lookProps` knobs, as today.
4. `pane.folder('Arrows and dots')`: arrow colours, size, the media-query notes, `Room for the dots`, dot size and colours, thumbnail knobs, crossfade time.
5. `pane.folder('Behaviour')`: as today.
6. `pane.folder('Tab names', { expanded: false })`: tabbed patterns only.
7. `pane.folder('Advanced', { expanded: false })`: focus ring, control transition, `Paste the card styles too` and its note (moved from Behaviour: it is about the page, not the slider).

Remember folder state. In `demo/assets/pane.js` change `folder`:

```js
const KEY = 'cs-folders';
const remembered = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}');
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
```

(`fold` is the FolderApi event in v4; confirm with `grep -n "'fold'" node_modules/tweakpane/dist/tweakpane.js | head -2`.)

The test's `openBuilder` uses a fresh context, so remembered state does not leak between tests.

- [ ] **Step 4: Regroup the markup**

In `demo/index.html`, wrap the panel and the preview in one work area. The `.ui-panel` div stays as is; the `<h3 class="ui-sr">Live preview</h3>`, the `.wb-stage` div and the `.ui-spec` div move together into:

```html
<div class="ui-work">
  <div class="ui-panel">…unchanged…</div>
  <div class="ui-preview">
    <h3 class="ui-sr">Live preview</h3>
    <div class="wb-stage">…unchanged…</div>
    <div class="ui-spec" id="wb-spec" role="status">…unchanged…</div>
  </div>
</div>
```

- [ ] **Step 5: Lay it out**

Append to `demo/assets/ui.css` (and delete the old `.ui-panel` "across the top of the work column" comment block at `ui.css:291-309`):

```css
/* ---- work area ----------------------------------------------------------
   Settings in one column, the preview beside it and pinned, so a change is
   seen without scrolling back up. Below 1200px the preview goes back above
   the settings and stays in flow: a laptop keeps its height. */
.ui-work {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.5rem;
}

.ui-preview {
  position: static;
  min-inline-size: 0;
}

@media (min-width: 1200px) {
  .ui-work {
    grid-template-columns: minmax(22rem, 26rem) minmax(0, 1fr);
    align-items: start;
  }

  .ui-panel {
    order: 0;
  }

  .ui-preview {
    position: sticky;
    top: 1rem;
    order: 1;
  }
}

@media (max-width: 1199.98px) {
  .ui-preview {
    order: -1;
  }
}
```

The preview frame widths (390/750/970/1170) are the iframe's own; at 1440 the preview column is about 1000px wide, so the 1170 button must let the frame scroll inside `.wb-stage` (`overflow-x: auto` on `.wb-stage` if it is not already; check `grep -n "^\.wb-stage" -A 8 demo/assets/ui.css`).

- [ ] **Step 6: Run the tests to see them pass, then look**

Run: `npx playwright test tests/layout.test.mjs`
Expected: PASS ×2.

Screenshot at 1440×900 and 1024×900 as in Task 5 step 5. Confirm the preview is beside the folders at 1440 and above them at 1024, and that scrolling the page at 1440 keeps the preview in view.

- [ ] **Step 7: Full suite, lint, commit**

Run: `npm run validate && npm test`
Expected: green, 157 passed. `controls.test.mjs` finds rows by label, not by section, so the moves do not break it; if a test asserted a section heading, update it to the folder title.

```bash
git add demo/assets/workbench.js demo/assets/pane.js demo/index.html demo/assets/ui.css tests/layout.test.mjs
git commit -F - <<'EOF'
Put the folders in decision order and pin the preview

Brand and card style first, because it sets the column count and the
look that everything under it edits. Gap, peek and text size move to
"How many across" - they are about fit, not arrows. Advanced starts
closed. The preview sits beside the settings from 1200px and stays on
screen, so a change is seen without scrolling back up.
EOF
```

---

### Task 7: The length input: number + unit

**Files:**

- Modify: `demo/assets/tp-plugins.js` (add `LengthPlugin`)
- Modify: `demo/assets/pane.js` (add `length`)
- Modify: `demo/assets/workbench.js` (`buildPanel()`: `wantsLength(key)` single-length knobs use `pane.length`)
- Modify: `demo/assets/ui.css` (`.tp-lenv` styles)
- Test: `tests/length.test.mjs`

**Interfaces:**

- `pane.length(folder, label, value: string, onChange: (v: string) => void, opts: { placeholder, note, fontPx: () => number | null })` — `fontPx` returns the card's resolved font size in px from the preview, or null if the frame is not ready.
- Stored/emitted value: `'<number><unit>'`; a zero is stored as `'0.1px'`.
- A "single length" is a value matching `/^-?\d*\.?\d+(px|em|%|vw)$/`. Anything else (multi-value, `calc()`, keywords, `rem`) keeps `pane.text`.

- [ ] **Step 1: Write the failing tests**

Create `tests/length.test.mjs`:

```js
// A length is a number and a unit, and switching the unit converts where a
// conversion is exact. The store still holds '0.5em' - the shape okValue()
// and cssFor() already understand - so nothing the copy panel emits changes.
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { openBuilder, pick, rowByLabel, copyParts } from './helpers.mjs';

test.describe.configure({ mode: 'serial' });

let page;
test.beforeAll(async ({ browser }) => {
  ({ page } = await openBuilder(browser, 1440));
  await pick(page, 'modelbar');
});

const num = (label) => rowByLabel(page, label).locator('input[type=text], input[type=number]').first();
const unit = (label) => rowByLabel(page, label).locator('select').first();

test('Gap is a number with a unit list, and the copied CSS carries the pair', async () => {
  await num('Gap').fill('12');
  await unit('Gap').selectOption('px');
  await num('Gap').press('Enter');
  await page.waitForTimeout(120);
  const { css } = await copyParts(page);
  assert.match(css, /--cs-gap:\s*12px/);
});

test('px to em converts off the card font size', async () => {
  await num('Gap').fill('16');
  await unit('Gap').selectOption('px');
  await num('Gap').press('Enter');
  await unit('Gap').selectOption('em');
  await page.waitForTimeout(120);
  const fontPx = await page.evaluate(() => parseFloat(getComputedStyle(globalThis.CARGO.sdoc().querySelector('.cs')).fontSize));
  assert.equal(await num('Gap').inputValue(), String(+(16 / fontPx).toFixed(3)));
  const { css } = await copyParts(page);
  assert.match(css, new RegExp(`--cs-gap:\\s*${+(16 / fontPx).toFixed(3)}em`));
});

test('a typed zero stores 0.1px, never a bare 0', async () => {
  await num('Gap').fill('0');
  await num('Gap').press('Enter');
  await page.waitForTimeout(120);
  const { css } = await copyParts(page);
  assert.doesNotMatch(css, /--cs-gap:\s*0(px)?\s*;/);
  assert.match(css, /--cs-gap:\s*0\.1px/);
});

test('switching to % keeps the number and changes only the unit', async () => {
  await num('Gap').fill('5');
  await unit('Gap').selectOption('em');
  await num('Gap').press('Enter');
  await unit('Gap').selectOption('%');
  await page.waitForTimeout(120);
  assert.equal(await num('Gap').inputValue(), '5');
  const { css } = await copyParts(page);
  assert.match(css, /--cs-gap:\s*5%/);
});

test('a multi-value knob stays a text field', async () => {
  await pick(page, 'models');
  const sel = await rowByLabel(page, 'Plate padding').locator('select').count();
  assert.equal(sel, 0);
});
```

(`Plate padding` is a lookProps knob on the tile look with default `6% 6% 1%`; confirm the label with `grep -n "plate-pad" demo/assets/workbench.js`.)

- [ ] **Step 2: Run them to see them fail**

Run: `npx playwright test tests/length.test.mjs`
Expected: FAIL, no `select` in the Gap row.

- [ ] **Step 3: Write the plugin**

Append to `demo/assets/tp-plugins.js` before the `CARGO.tpPlugins = [` line:

```js
/* ---- length: number + unit -------------------------------------------- */

const UNITS = ['px', 'em', '%', 'vw'];
const LEN = /^(-?\d*\.?\d+)(px|em|%|vw)$/;
const lenCls = ClassName('len');

// Split '0.5em' into ['0.5', 'em']; anything else is not a single length.
const splitLen = (v) => {
  const m = LEN.exec(String(v ?? '').trim());
  return m ? [m[1], m[2]] : null;
};

// Round the way the stepper did: to the decimals in play, so 0.1 steps
// never drift into 0.30000000000000004.
const tidy = (n, dp = 3) => String(+n.toFixed(dp));

class LengthView {
  constructor(doc, config) {
    this.element = doc.createElement('div');
    this.element.classList.add(lenCls());
    config.viewProps.bindClassModifiers(this.element);
    this.num = doc.createElement('input');
    this.num.type = 'text';
    this.num.inputMode = 'decimal';
    this.num.classList.add(lenCls('n'));
    this.unit = doc.createElement('select');
    this.unit.classList.add(lenCls('u'));
    for (const u of UNITS) {
      const o = doc.createElement('option');
      o.value = o.textContent = u;
      this.unit.append(o);
    }
    this.element.append(this.num, this.unit);
  }
  show([n, u]) {
    this.num.value = n;
    this.unit.value = u;
  }
}

class LengthController {
  constructor(doc, config) {
    this.value = config.value;
    this.viewProps = config.viewProps;
    this.fontPx = config.fontPx;
    this.view = new LengthView(doc, { viewProps: this.viewProps });
    this.view.show(splitLen(this.value.rawValue) ?? ['', 'px']);
    this.value.emitter.on('change', () => this.view.show(splitLen(this.value.rawValue) ?? ['', 'px']));

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

  // Empty means "back to the default" - the writer hands '' to setProp,
  // which already restores it. A zero ships as 0.1px: the platform minifier
  // strips the unit off a 0 and the engine's calc() cannot use a bare 0.
  commit() {
    const raw = this.view.num.value.trim();
    if (raw === '') return void (this.value.rawValue = '');
    const n = parseFloat(raw);
    if (!Number.isFinite(n)) return;
    this.value.rawValue = n === 0 ? '0.1px' : `${tidy(n)}${this.view.unit.value}`;
  }

  // px<->em converts off the card's resolved font size; % and vw have no
  // fixed reference, so the number stays and only the unit moves.
  switchUnit() {
    const cur = splitLen(this.value.rawValue);
    const to = this.view.unit.value;
    if (!cur) return this.commit();
    const [n, from] = [parseFloat(cur[0]), cur[1]];
    const px = this.fontPx?.();
    let next = n;
    if (px && from === 'px' && to === 'em') next = n / px;
    else if (px && from === 'em' && to === 'px') next = n * px;
    this.view.num.value = tidy(next);
    this.commit();
  }
}

const LengthPlugin = createPlugin({
  id: 'length',
  type: 'input',
  accept(value, params) {
    if (typeof value !== 'string') return null;
    const r = parseRecord(params, (p) => ({ view: p.required.constant('length'), fontPx: p.optional.raw }));
    return r ? { initialValue: value, params: r } : null;
  },
  binding: {
    reader: () => (v) => String(v ?? ''),
    writer: () => (target, v) => target.write(v),
  },
  controller(args) {
    return new LengthController(args.document, { value: args.value, viewProps: args.viewProps, fontPx: args.params.fontPx });
  },
});
```

Add `LengthPlugin` to the `CARGO.tpPlugins` array. If `p.optional.raw` is not available use `p.optional.function` (see Task 4 step 4's note).

- [ ] **Step 4: The adapter and the panel**

In `demo/assets/pane.js`, add and export:

```js
const length = (parent, label, value, on, opts = {}) => {
  const b = bind(parent, label, { v: value ?? '' }, { view: 'length', fontPx: opts.fontPx }, on);
  const input = b.element.querySelector('input');
  if (input && opts.placeholder != null) input.placeholder = opts.placeholder;
  if (opts.note) b.element.title = opts.note;
  return b;
};
```

In `workbench.js`, above `if (!stage) return` if it is not already there, add a reader for the card font size (the preview iframe's document is `CARGO.sdoc()`):

```js
// The card's resolved font size, for px<->em conversion in the length
// control. Null before the frame has painted, and the control then keeps
// the number and changes only the unit.
const cardFontPx = () => {
  const root = sroot?.();
  return root ? parseFloat(getComputedStyle(root).fontSize) || null : null;
};
```

Then in `buildPanel()`, wherever a knob goes through the `valueRow` replacement from Task 5, choose the control off the value shape:

```js
const knobRow = (folder, label, key, store, after) => {
  const cur = store[key] ?? '';
  const opts = { placeholder: String(knobDefault(key) ?? ''), note: knobNote(key) };
  const on = (v) => {
    if (v !== '' && !okValue(key, v)) return void pane.flag(b, wantsLength(key) ? 'Needs a unit — try 1em or 16px, and 0.1px rather than 0.' : 'Not a value the slider can use.');
    pane.flag(b, '');
    setProp(store, key, v);
    render();
    after?.();
  };
  let b;
  b = /^-?\d*\.?\d+(px|em|%|vw)$/.test(String(knobDefault(key) ?? cur).trim()) ? pane.length(folder, label, cur, on, { ...opts, fontPx: cardFontPx }) : pane.text(folder, label, cur, on, opts);
  return b;
};
```

and use `knobRow` for every former `valueRow` call. The shape is decided off the DEFAULT, as `okValue()` does, so a knob added to a look is covered the day it ships.

- [ ] **Step 5: Style it**

Append to `demo/assets/ui.css`:

```css
.tp-lenv {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 4.2rem;
  gap: 0.25rem;
}

.tp-lenv_n,
.tp-lenv_u {
  min-inline-size: 0;
  font: inherit;
  color: var(--tp-input-foreground-color);
  background: var(--tp-input-background-color);
  border: 0;
  border-radius: var(--tp-base-border-radius, 6px);
  block-size: var(--tp-blade-unit-size, 20px);
  padding-inline: 0.4rem;
}
```

- [ ] **Step 6: Run the tests to see them pass**

Run: `npx playwright test tests/length.test.mjs`
Expected: PASS ×5.

Run: `npm test`
Expected: green. The Gap/Peek/arrow-size rows are now length rows: any test that filled `Gap` with a full string like `1.5em` through `setField` now fails, because the row has a number and a select. Update those calls to `setLength(page, 'Gap', '1.5', 'em')` and add to `tests/helpers.mjs`:

```js
export const setLength = async (page, label, n, unit) => {
  const row = rowByLabel(page, label);
  await row.locator('select').selectOption(unit);
  const input = row.locator('input').first();
  await input.fill(n);
  await input.press('Enter');
  await page.waitForTimeout(120);
};
```

Every test that changes is one that guarded a finding; re-read its comment and keep the assertion it makes. (F003/F022/F028 in `builder.test.mjs` are the zero and empty cases: the length control's `commit()` covers them, and the test must still prove it in the COPIED CSS.)

- [ ] **Step 7: Lint and commit**

Run: `npm run validate && npm test`
Expected: green.

```bash
git add demo/assets/tp-plugins.js demo/assets/pane.js demo/assets/workbench.js demo/assets/ui.css tests/length.test.mjs tests/helpers.mjs tests/builder.test.mjs
git commit -F - <<'EOF'
Give lengths a number and a unit

A single length is a number box and a px/em/%/vw list; px<->em
converts off the card's resolved font size, % and vw keep the number.
Which knob gets it is read off the shape of its default, as okValue()
does, so a knob added to a look is covered the day it ships. The store
still holds '0.5em' and a typed 0 still becomes 0.1px, so nothing the
copy panel emits changes.
EOF
```

(Add any other test files you touched to the `git add` line.)

---

### Task 8: The colour input: alpha, swatches, normalised output

**Files:**

- Modify: `demo/assets/tp-plugins.js` (add `ColourPlugin`)
- Modify: `demo/assets/pane.js` (add `colour`, `swatches`)
- Modify: `demo/assets/workbench.js` (`buildPanel()`: colour knobs use `pane.colour`; swatch list built per render)
- Modify: `demo/assets/ui.css` (`.tp-colv` styles)
- Modify: `tests/controls.test.mjs` (`colorKnob` reads the colour row's text field)
- Test: `tests/colour.test.mjs`

**Interfaces:**

- `pane.colour(folder, label, value: string, onChange: (v: string) => void, opts: { placeholder, note, swatches: () => string[] })`.
- Output is always `#rrggbb`, legacy `rgba(r, g, b, a)` with `a` in `0..1` (at most 2 decimals), or `transparent`. `''` means "back to the default". `currentcolor`, `inherit`, `var(...)` and anything unparseable fall through to `pane.text`.
- `pane.swatches(list: string[])` sets the swatch list every colour control reads.

- [ ] **Step 1: Write the failing tests**

Create `tests/colour.test.mjs`:

```js
// A colour control that can show every value the field can hold, and that
// hands the platform the notation it keeps: #rrggbb, legacy rgba(), or
// transparent - never modern rgb(r g b / a).
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { openBuilder, pick, rowByLabel, copyParts } from './helpers.mjs';

test.describe.configure({ mode: 'serial' });

let page;
test.beforeAll(async ({ browser }) => {
  ({ page } = await openBuilder(browser, 1440));
  await pick(page, 'modelbar');
});

const field = (label) => rowByLabel(page, label).locator('input[type=text]').first();
const type = async (label, v) => {
  await field(label).fill(v);
  await field(label).press('Enter');
  await page.waitForTimeout(120);
};

test('a typed hex, rgba and transparent all keep a swatch', async () => {
  for (const v of ['#16324f', 'rgba(0, 0, 0, 0.5)', 'transparent']) {
    await type('Arrow background', v);
    const bg = await rowByLabel(page, 'Arrow background')
      .locator('.tp-colv_sw')
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    assert.notEqual(bg, '', `${v} has no swatch`);
  }
});

test('the picker writes legacy notation and the copied CSS carries it', async () => {
  await type('Arrow background', 'rgb(0 0 0 / 0.5)');
  const { css } = await copyParts(page);
  assert.match(css, /--cs-arrow-bg:\s*rgba\(0, 0, 0, 0\.5\)/);
  assert.doesNotMatch(css, /rgb\(0 0 0/);
});

test('alpha 1 is hex, alpha 0 is transparent', async () => {
  await type('Arrow background', 'rgba(22, 50, 79, 1)');
  let { css } = await copyParts(page);
  assert.match(css, /--cs-arrow-bg:\s*#16324f/);
  await type('Arrow background', 'rgba(22, 50, 79, 0)');
  ({ css } = await copyParts(page));
  assert.match(css, /--cs-arrow-bg:\s*transparent/);
});

test('a swatch click writes the field, and the swatches include the colours in use', async () => {
  await type('Arrow colour', '#abcdef');
  const sw = rowByLabel(page, 'Arrow background').locator('.tp-colv_list button[data-colour="#abcdef"]');
  assert.equal(await sw.count(), 1, 'the arrow colour is offered as a swatch on the other rows');
  await sw.click();
  await page.waitForTimeout(120);
  assert.equal(await field('Arrow background').inputValue(), '#abcdef');
});

test('Clear puts the default back and drops the declaration', async () => {
  await type('Arrow background', '#123456');
  await rowByLabel(page, 'Arrow background').locator('.tp-colv_clear').click();
  await page.waitForTimeout(120);
  const { css } = await copyParts(page);
  assert.doesNotMatch(css, /--cs-arrow-bg:\s*#123456/);
});

test('currentcolor stays a text field', async () => {
  await type('Arrow colour', 'currentcolor');
  await page.waitForTimeout(120);
  const { css } = await copyParts(page);
  assert.match(css, /--cs-arrow-fg:\s*currentcolor/);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx playwright test tests/colour.test.mjs`
Expected: FAIL, `.tp-colv_sw` not found.

- [ ] **Step 3: Write the plugin**

Append to `demo/assets/tp-plugins.js` before `CARGO.tpPlugins = [`:

```js
/* ---- colour: text field + swatch + popover picker + swatches ------------ */

const colCls = ClassName('col');

// Parse anything the field can hold into {r,g,b,a} or null. The browser
// does the parsing: a colour it can set on an element is a colour.
const probe = document.createElement('span');
const parse = (v) => {
  const s = String(v ?? '').trim();
  if (!s || /^(currentcolor|inherit|initial|unset)$/i.test(s) || s.includes('var(')) return null;
  if (/^transparent$/i.test(s)) return { r: 0, g: 0, b: 0, a: 0 };
  probe.style.color = '';
  probe.style.color = s;
  if (!probe.style.color) return null;
  document.body.append(probe);
  const m = /rgba?\(([^)]+)\)/.exec(getComputedStyle(probe).color);
  probe.remove();
  if (!m) return null;
  const [r, g, b, a = '1'] = m[1]
    .split(/[,\s/]+/)
    .filter(Boolean)
    .map(Number);
  return { r, g, b, a };
};

// Always the platform's notation: hex when opaque, legacy rgba() otherwise,
// transparent at zero. stylelint on the copy panel requires legacy form
// and the platform minifier keeps it.
const format = ({ r, g, b, a }) => {
  if (a <= 0) return 'transparent';
  if (a >= 1) return `#${[r, g, b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')}`;
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${+a.toFixed(2)})`;
};

class ColourView {
  constructor(doc, config) {
    this.element = doc.createElement('div');
    this.element.classList.add(colCls());
    config.viewProps.bindClassModifiers(this.element);
    this.sw = doc.createElement('button');
    this.sw.type = 'button';
    this.sw.classList.add(colCls('sw'));
    this.sw.title = 'Pick a colour';
    this.text = doc.createElement('input');
    this.text.type = 'text';
    this.text.spellcheck = false;
    this.text.classList.add(colCls('t'));
    this.clear = doc.createElement('button');
    this.clear.type = 'button';
    this.clear.classList.add(colCls('clear'));
    this.clear.textContent = '×';
    this.clear.title = 'Back to the default';
    this.pop = doc.createElement('div');
    this.pop.classList.add(colCls('pop'));
    this.pop.hidden = true;
    // The native picker does the spectrum; the alpha is a range beside it.
    this.native = doc.createElement('input');
    this.native.type = 'color';
    this.alpha = doc.createElement('input');
    this.alpha.type = 'range';
    this.alpha.min = '0';
    this.alpha.max = '1';
    this.alpha.step = '0.01';
    this.alpha.setAttribute('aria-label', 'Opacity');
    this.list = doc.createElement('div');
    this.list.classList.add(colCls('list'));
    this.pop.append(this.native, this.alpha, this.list);
    this.element.append(this.sw, this.text, this.clear, this.pop);
  }
  show(v) {
    this.text.value = v;
    const c = parse(v);
    this.sw.style.setProperty('--sw', c ? format(c) : 'transparent');
    if (c) {
      this.native.value = format({ ...c, a: 1 });
      this.alpha.value = String(c.a);
    }
  }
  swatches(list) {
    this.list.replaceChildren();
    for (const v of list) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.colour = v;
      b.title = v;
      b.style.setProperty('--sw', v);
      this.list.append(b);
    }
  }
}

class ColourController {
  constructor(doc, config) {
    this.value = config.value;
    this.viewProps = config.viewProps;
    this.view = new ColourView(doc, { viewProps: this.viewProps });
    this.view.show(this.value.rawValue);
    this.value.emitter.on('change', () => this.view.show(this.value.rawValue));
    const v = this.view;
    v.text.addEventListener('change', () => {
      const c = parse(v.text.value);
      this.value.rawValue = c ? format(c) : v.text.value.trim();
    });
    v.clear.addEventListener('click', () => (this.value.rawValue = ''));
    v.sw.addEventListener('click', () => {
      v.pop.hidden = !v.pop.hidden;
      if (!v.pop.hidden) v.swatches(config.swatches?.() ?? []);
    });
    const fromPicker = () => {
      const c = parse(v.native.value);
      if (c) this.value.rawValue = format({ ...c, a: parseFloat(v.alpha.value) });
    };
    v.native.addEventListener('input', fromPicker);
    v.alpha.addEventListener('input', fromPicker);
    v.list.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-colour]');
      if (b) this.value.rawValue = b.dataset.colour;
    });
    doc.addEventListener(
      'pointerdown',
      (e) => {
        if (!v.element.contains(e.target)) v.pop.hidden = true;
      },
      { signal: (this.ac = new AbortController()).signal },
    );
    this.viewProps.handleDispose(() => this.ac.abort());
  }
}

const ColourPlugin = createPlugin({
  id: 'colour',
  type: 'input',
  accept(value, params) {
    if (typeof value !== 'string') return null;
    const r = parseRecord(params, (p) => ({ view: p.required.constant('colour'), swatches: p.optional.raw }));
    return r ? { initialValue: value, params: r } : null;
  },
  binding: {
    reader: () => (v) => String(v ?? ''),
    writer: () => (target, v) => target.write(v),
  },
  controller(args) {
    return new ColourController(args.document, { value: args.value, viewProps: args.viewProps, swatches: args.params.swatches });
  },
});
```

Add `ColourPlugin` to `CARGO.tpPlugins`.

The native `<input type="color">` is used ONLY for the spectrum, inside the popover, with the alpha range beside it and the text field always authoritative: what the old row got wrong was making the native input the whole control. Every value the field can hold now has a swatch (`--sw`), which the old row could not do.

- [ ] **Step 4: The adapter and the panel**

In `demo/assets/pane.js`:

```js
let swatchList = [];
const swatches = (list) => (swatchList = [...new Set(list.filter(Boolean))]);
const colour = (parent, label, value, on, opts = {}) => {
  const b = bind(parent, label, { v: value ?? '' }, { view: 'colour', swatches: () => swatchList }, on);
  const input = b.element.querySelector('input[type=text]');
  if (input && opts.placeholder != null) input.placeholder = opts.placeholder;
  if (opts.note) b.element.title = opts.note;
  return b;
};
```

Export `colour` and `swatches`. In `workbench.js`, every former `colorRow` call becomes `pane.colour(folder, label, store[key] ?? '', (v) => { setProp(store, key, v); restyle(); }, { placeholder: String(knobDefault(key) ?? ''), note: knobNote(key) })`. In `restyle()` (and at the end of `buildPanel()`), rebuild the swatch list:

```js
// Every colour set on this slider, plus the preset's, plus transparent:
// pulling the arrow colour from the badge colour is one click.
pane.swatches([
  ...Object.values(BRANDS[state.brand]?.colours ?? {}),
  ...Object.values({ ...state.props, ...state.lookProps }).filter((v) => /^#|^rgba?\(|^transparent$/.test(String(v))),
  'transparent',
]);
```

(`BRANDS[id].colours` may not exist; check `grep -n "colour\|color" demo/assets/brands.js | head -3` and drop that spread if presets carry no colours.)

Update `colorKnob` in `tests/controls.test.mjs` to read `row.querySelector('input[type=text]')?.value`.

- [ ] **Step 5: Style it**

Append to `demo/assets/ui.css`:

```css
.tp-colv {
  position: relative;
  display: grid;
  grid-template-columns: 1.4rem minmax(0, 1fr) 1.2rem;
  gap: 0.25rem;
  align-items: center;
}

.tp-colv_sw,
.tp-colv_list button {
  inline-size: 1.4rem;
  block-size: 1.4rem;
  padding: 0;
  cursor: pointer;
  background:
    linear-gradient(var(--sw, transparent), var(--sw, transparent)),
    repeating-conic-gradient(#ccc 0 25%, #fff 0 50%) 0 0 / 8px 8px;
  border: 1px solid var(--rule);
  border-radius: 4px;
}

.tp-colv_t {
  min-inline-size: 0;
  font: inherit;
  font-family: var(--mono);
  color: var(--tp-input-foreground-color);
  background: var(--tp-input-background-color);
  border: 0;
  border-radius: var(--tp-base-border-radius, 6px);
  block-size: var(--tp-blade-unit-size, 20px);
  padding-inline: 0.4rem;
}

.tp-colv_clear {
  padding: 0;
  font: inherit;
  color: var(--ink-soft);
  cursor: pointer;
  background: none;
  border: 0;
}

.tp-colv_pop {
  position: absolute;
  inset-inline-start: 0;
  top: calc(100% + 0.25rem);
  z-index: 3;
  display: grid;
  gap: 0.5rem;
  padding: 0.6rem;
  background: var(--surface);
  border: 1px solid var(--rule);
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
}

.tp-colv_list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}
```

- [ ] **Step 6: Run the tests to see them pass**

Run: `npx playwright test tests/colour.test.mjs`
Expected: PASS ×6.

Run: `npm test`
Expected: green. `controls.test.mjs`'s `colorKnob` tests and any `setField` on a colour label still work: the colour row's first `input` is the text field.

- [ ] **Step 7: Look, lint, commit**

Screenshot at 1440 with a colour popover open (click the Arrow background swatch first, via a short Playwright script) and confirm it is legible in both themes (`document.documentElement.dataset.theme = 'dark'` before the second shot).

Run: `npm run validate && npm test`
Expected: green.

```bash
git add demo/assets/tp-plugins.js demo/assets/pane.js demo/assets/workbench.js demo/assets/ui.css tests/colour.test.mjs tests/controls.test.mjs
git commit -F - <<'EOF'
Give colours a swatch that can tell the truth, and a picker with alpha

Every value the field can hold now has a swatch - transparent and an
rgba() included, which the native input could never show. The picker
is a popover: spectrum, opacity, and swatches drawn from the preset and
from every colour already on this slider. Whatever the picker or the
field says, the store gets #rrggbb, legacy rgba(), or transparent.
EOF
```

---

### Task 9: State export on Keep, docs, and the measured numbers

**Files:**

- Modify: `demo/assets/workbench.js` (Keep saves `pane.pane.exportState()`; folder state already remembered)
- Modify: `CLAUDE.md` (the `npm test` paragraph, the demo assets list, the vendor build)
- Modify: `README.md` (the verification checklist mentions of `node --test`, if any)
- Modify: `.superpowers/sdd/progress.md` is git-ignored; nothing to do there.

- [ ] **Step 1: Keep saves the pane state beside the settings**

Find the Keep handler (`grep -n "wb-keep" demo/assets/workbench.js`). Where it writes the kept settings to `localStorage`, add the pane's state under the same key's object as `pane: CARGO.pane.pane?.exportState() ?? null`. Nothing reads it yet: it is the hook the shareable-link follow-on will use, and `exportState()` is the reason it costs one line now.

- [ ] **Step 2: Docs**

In `CLAUDE.md`:

- The `npm test` line in Commands: `node --test + playwright` → `@playwright/test: <N> browser checks, starts its own server on 8137 (reuses one already running)`.
- The paragraph starting "**`npm test` is a gate, and it is not optional.**": replace "It is `node --test` plus the playwright that was already a devDependency — no new dependencies, ~14 seconds, one browser." with "It runs under `@playwright/test` — workers, a trace on retry, and `npm run test:ui` to step through a failure — and takes about <measured> seconds." Update the file count and check count.
- The demo assets list in "Three demo pages": add `pane.js` (the one place the workbench talks to Tweakpane), `tp-plugins.js` (note, card-style picker, length and colour controls), `vendor/tweakpane.js` (generated by `scripts/build-vendor.mjs`, committed, checked by `npm run check:vendor`).
- Add one paragraph under Architecture: "**The settings panel is a Tweakpane pane, and the engine knows nothing about it.** `buildPanel()` decides which controls exist and what a change does; `pane.js` decides how one is drawn. Every control binds to a private `{ v }` and calls back, so `state` keeps its owners and a structural change throws the pane away and rebuilds. Lengths and colours are plugins in `tp-plugins.js`; both normalise on the way out (a zero to `0.1px`, a colour to hex/legacy `rgba()`/`transparent`) so what they store is what `okValue()` and the platform already accept."

In `README.md`, `grep -n "node --test\|node:test" README.md` and update any hit to `@playwright/test`.

- [ ] **Step 3: Measure and finish**

Run: `npm run validate && npm test 2>&1 | tail -3 && npm run size | tail -4`
Expected: green; the size numbers are identical to the ones at the start of Task 1 (`6330 B` total at the time of writing). Put the measured test time in CLAUDE.md.

```bash
git add demo/assets/workbench.js CLAUDE.md README.md
git commit -F - <<'EOF'
Record the pane in the docs, and keep its state with the settings

Keep now stores pane.exportState() beside the kept settings - nothing
reads it yet; it is the hook a shareable link will use. CLAUDE.md says
what the panel is built on, where the vendor bundle comes from, and
what the tests cost now that they run under the Playwright runner.
EOF
git push origin master
```

---

## Self-review

**Spec coverage.** §0 vendor bundle → Task 2. §1 state model (bind to `state`, rebuild on structural change, `restyle` fast path) → Tasks 3, 5. §2 control table → Tasks 5 (native), 7 (length), 8 (colour); look picker and note blades → Task 4. §3 layout, order, sticky, theming → Tasks 3 (theme), 6. §4 runner → Task 1; the "pixel checks become `toHaveScreenshot`" line is NOT in this plan: the existing pixel-parity tests compare two live renders, which needs no baseline files and is stronger; the spec's baseline idea is dropped, and that is a deliberate deviation. `controls.test.mjs` rewrite → Task 5. §5 export on Keep → Task 9; the shareable link is a follow-on per the spec. Error handling: stale bundle → Task 2's `check:vendor`; missing bundle at runtime → Task 3's `create()` returns null with a message and Task 5's `buildPanel()` returns early on it.

**Placeholders.** None: every code step has its code; the two "confirm the class name with grep" notes are verification steps, not gaps.

**Type consistency.** `pane.text(parent, label, value, on, opts)`, `pane.int(parent, label, value, on, opts)`, `pane.list(parent, label, value, options, on, opts)`, `pane.bool(parent, label, value, on, opts)`, `pane.note(parent, text)`, `pane.looks(parent, LOOKS, current, onPick)`, `pane.length(parent, label, value, on, opts)`, `pane.colour(parent, label, value, on, opts)`, `pane.flag(binding, message)`, `pane.swatches(list)`, `pane.folder(title, opts)`, `pane.create(container)`, `pane.dispose()`, `pane.pane` are used with the same shapes in Tasks 3–9. `rowByLabel`, `setField`, `setLength` in helpers match their uses in Tasks 5, 7, 8. Plugin ids `note`, `lookpicker`, `length`, `colour` match `view:` values everywhere.
