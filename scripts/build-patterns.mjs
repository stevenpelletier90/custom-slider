// Builds the pattern half of the shared files and appends it to dist:
// every pattern's structural CSS behind a `/*! patterns */` marker in both
// stylesheets, and the six pattern scripts behind the same marker in both
// scripts. Spec: docs/specs/2026-09-14-shared-pattern-structure-design.md.
//
// Why: a pasted snippet used to carry three kinds of thing, and only one of
// them was the dealer's. The knob values on the root differ per site; the
// tab row's forty lines of rules and its script are the same bytes on every
// site that pastes the pattern, and a pasted copy can never be fixed. The
// platform makes it worse: Style Only rides inline in every page, so every
// pasted line is paid for on every view, while a line in the linked file is
// paid for once per site. Same argument, same mechanism as the card styles
// (build-cards.mjs): generated from the SAME PATTERNS object the builder
// draws with, never hand-written, so the file cannot disagree with the
// preview.
//
// Scoping. Each pattern's outermost element carries data-cargo="<id>" -
// htmlFor() puts it on the wrap where the pattern has one, else on the
// carousel root - and every shared rule hangs off that attribute at the LOWEST
// specificity that still beats the engine:
//   %wrap%     -> [data-cargo="id"]                    (0,1,0)
//   %root%     -> [data-cargo="id"]:where(.cs)         (0,1,0)  rootless pattern
//              -> :where([data-cargo="id"]) .cs        (0,1,0)  under a wrap
//   .cargo-x   -> :where([data-cargo="id"]) .cargo-x   (0,1,0) + the rest
// The engine's own rules are (0,1,0) and lose on source order, which is
// deterministic because this section is appended after them in the same
// file. A designer's rule under their slider's name (`.my-bar-wrap .cargo-tabs
// [role="tab"]`) is one class higher and wins in any order - which is the
// sanctioned way to restyle a pattern on one site, and the only one. A
// pattern's own prop defaults (--tab-size and friends) land at (0,0,0) on
// :where([data-cargo="id"]) so the snippet's own declarations always beat
// them; engine-keyed props (--cs-gap) stay in the snippet as deltas, because
// the engine's `.cs` default is (0,1,0) and would beat a (0,0,0) here.
//
// Run from `npm run build`, after build-cards.mjs. lint-generated-css.mjs
// imports the two builders below to lint exactly what ships.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';

export const MARK = '/*! patterns */';

// The demo assets are classic scripts hanging off globalThis (ES modules are
// blocked over file://). Evaluate them into one sandbox, the way check-looks
// and the lint do. patterns.js needs BRANDS; nothing here needs a DOM.
export function loadCargo() {
  const noop = () => {};
  const sandbox = {};
  sandbox.document = {
    getElementById: () => null,
    querySelectorAll: () => [],
    querySelector: () => null,
    createElement: () => ({ style: {}, setAttribute: noop, append: noop }),
    addEventListener: noop,
  };
  sandbox.addEventListener = noop;
  sandbox.getComputedStyle = () => ({ getPropertyValue: () => '', fontSize: '16px' });
  sandbox.location = { hash: '' };
  sandbox.history = { replaceState: noop };
  for (const f of ['looks.js', 'brands.js', 'patterns.js']) {
    new Function('globalThis', 'document', 'window', readFileSync(`demo/assets/${f}`, 'utf8')).call(sandbox, sandbox, sandbox.document, sandbox);
  }
  return sandbox.CARGO;
}

// The same four structural families workbench.js's hasWrap() names.
export const hasWrap = (id, p) => !!(p.panes || p.filters || p.cardGrid || id === 'lightbox');

// The builder's own token pass (cssFor's scope()), with the pattern attribute
// as the root. Comments come out first: they are for whoever reads
// patterns.js, and a comment in the shipped sheet is bytes on every site.
export const scopeShared = (css, id, wrap) => {
  const attr = `[data-cargo="${id}"]`;
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\n/gm, '')
    .replace(/(^|[{}\n,]\s*)(%root%|%wrap%|\.cargo[\w-]*)/g, (_, pre, tok) => {
      if (tok === '%wrap%') return `${pre}${attr}`;
      if (tok === '%root%') return wrap ? `${pre}:where(${attr}) .cs` : `${pre}${attr}:where(.cs)`;
      return `${pre}:where(${attr}) ${tok}`;
    });
};

export function patternsCss(CARGO) {
  const { PATTERNS, PHOTO_CAPTION_CSS, PHOTO_LINK_CSS } = CARGO;
  const out = [];
  for (const [id, p] of Object.entries(PATTERNS)) {
    const wrap = hasWrap(id, p);
    const own = Object.entries(p.props ?? {}).filter(([k]) => !k.startsWith('--cs-') && !k.startsWith('--cargo-'));
    const parts = [];
    if (own.length) parts.push(`:where([data-cargo="${id}"]) {\n${own.map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}`);
    // The photo patterns' caption and link rules ship here unconditionally.
    // The snippet used to add them only once a slide had a caption or a
    // link, because a pasted rule matching nothing is a dead line on every
    // page view; a shared rule matching nothing costs nothing.
    const css = [p.css || '', (p.css || '').includes('cargo-photo') ? `${PHOTO_CAPTION_CSS}\n${PHOTO_LINK_CSS}` : ''].filter(Boolean).join('\n');
    if (css.trim()) parts.push(scopeShared(css, id, wrap));
    if (parts.length) out.push(`/* ---- ${p.label} (${id}) ---- */`, ...parts);
  }
  return out.join('\n') + '\n';
}

// Every pattern script, each inside its own try/catch so a script that throws
// logs which pattern it was and the next one still runs, behind the same
// readiness guard the copy panel used to wrap each in. Appended after the
// engine's own auto-init, so nothing here can stop a carousel starting.
//
// The whole pass is also published as CustomSlider.wirePatterns(), for markup
// added after the page loaded - the builder's preview frame re-renders its
// stage on every change, and the Patterns and Brands pages build theirs from
// script. It re-runs every pattern script over the whole document, so call it
// once per batch of new markup, never per render of markup that is already
// wired (a tab wired twice answers a key twice). A dealer page never needs
// to call it.
export function patternsJs(CARGO) {
  const { PATTERNS } = CARGO;
  const runs = [];
  for (const [id, p] of Object.entries(PATTERNS)) {
    if (!p.script) continue;
    runs.push(`    try {\n${p.script.replace(/^/gm, '      ')}\n    } catch (e) {\n      console.error('custom-slider: the ${id} pattern script failed', e);\n    }`);
  }
  return [
    '(function () {',
    '  var wire = function () {',
    runs.join('\n'),
    '  };',
    '  if (window.CustomSlider) window.CustomSlider.wirePatterns = wire;',
    "  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);",
    '  else wire();',
    '})();',
  ].join('\n');
}

async function main() {
  const CARGO = loadCargo();
  const css = patternsCss(CARGO);
  const js = patternsJs(CARGO);
  const cssPretty = (await transform(css, { loader: 'css' })).code;
  const cssMin = (await transform(css, { loader: 'css', minify: true })).code;
  const jsPretty = js;
  const jsMin = (await transform(js, { loader: 'js', minify: true, target: 'es2020' })).code;
  // Strip any patterns half a previous build appended, so this is idempotent.
  // The marker is load-bearing: scripts/size.mjs splits on it in both files to
  // weigh the ENGINE alone against its budget.
  const strip = (text) => text.replace(/\s*\/\*! patterns \*\/[\s\S]*$/, '');
  for (const [file, half] of [
    ['dist/custom-slider.css', cssPretty],
    ['dist/custom-slider.min.css', cssMin],
    ['dist/custom-slider.js', jsPretty],
    ['dist/custom-slider.min.js', jsMin],
  ]) {
    const base = strip(readFileSync(file, 'utf8'));
    writeFileSync(file, `${base.trimEnd()}\n${MARK}\n${half.trimEnd()}\n`);
  }
  const n = Object.keys(CARGO.PATTERNS).length;
  const scripted = Object.values(CARGO.PATTERNS).filter((p) => p.script).length;
  console.log(`dist: + ${n} pattern structures (${cssMin.length} B of CSS) and ${scripted} pattern scripts (${jsMin.length} B of JS)`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
