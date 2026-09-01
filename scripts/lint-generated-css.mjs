// Lints the CSS that actually ships to a dealer.
//
// `npm run lint:css` only sees .css FILES. But every card and pattern rule in
// this project lives in a JS template literal in demo/assets/*.js — about 15 KB
// of CSS, and it is precisely the CSS the copy panel hands to a designer to
// paste onto a live site. None of it was linted. All three CSS defects found in
// the 2026-09-01 design review (a <span> styled as a block with no
// `display: block`, an unclipped hover transform, and rem on a Bootstrap 3 host)
// were in that unlinted 15 KB.
//
// Rather than parse the template literals out — which would lint a fragment
// full of %root% tokens that is not valid CSS — this runs the real generator.
// cssFor() is the single producer of shipped CSS (see CLAUDE.md, "Code parity
// is structural"), so linting its output cannot drift from what is copied.
//
// Run from `npm run validate`.

import { readFileSync } from 'node:fs';
import stylelint from 'stylelint';

// The demo assets are classic scripts hanging off globalThis (ES modules are
// blocked over file://, and the demo has to open by double-click). Evaluate
// them the way check-looks.mjs does, into one shared sandbox.
const sandbox = {};
// workbench.js reaches for a few elements at load time and bails out when the
// stage is absent — which is the path patterns.html uses too. Give it just
// enough DOM to reach that guard; anything it would touch afterwards is behind
// the `if (!stage) return`.
const noop = () => {};
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

for (const f of ['looks.js', 'brands.js', 'cms-paths.js', 'workbench.js']) {
  new Function('globalThis', 'document', 'window', readFileSync(`demo/assets/${f}`, 'utf8')).call(sandbox, sandbox, sandbox.document, sandbox);
}
const { PATTERNS, LOOKS, renderPattern, renderLook } = sandbox.CARGO;

// One sheet per pattern and per card look, named so a failure says which.
const sheets = [...Object.keys(PATTERNS).map((id) => [`pattern “${id}”`, renderPattern(id, 'demo').css]), ...Object.keys(LOOKS).map((id) => [`look “${id}”`, renderLook(id, 'demo').css])];

let problems = 0;
for (const [name, css] of sheets) {
  const res = await stylelint.lint({ code: css, config: JSON.parse(readFileSync('.stylelintrc.generated.json', 'utf8')) });
  for (const r of res.results) {
    for (const w of r.warnings) {
      problems++;
      // The generated line, so the offending rule is greppable in the source
      // even though the line number belongs to the assembled sheet.
      const line = css.split('\n')[w.line - 1] ?? '';
      console.error(`  ${name} ${w.line}:${w.column} [${w.rule}] ${w.text}`);
      console.error(`    ${line.trim().slice(0, 140)}`);
    }
  }
}

if (problems) {
  console.error(`\nlint-generated-css: ${problems} problem(s) in the CSS the copy panel ships.`);
  process.exit(1);
}
console.log(`lint-generated-css: ${sheets.length} generated sheets clean (${Object.keys(PATTERNS).length} patterns, ${Object.keys(LOOKS).length} looks).`);
