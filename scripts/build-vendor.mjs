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
