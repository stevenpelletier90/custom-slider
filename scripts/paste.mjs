// Generates copy-paste blocks for putting Custom Slider on a DealerOn page with
// NO hosted files — for the period before the two dist files live on FTP.
//
// The platform's page-level Custom HTML panel takes raw CSS in `styleCode` and
// verbatim HTML (script tags included) in `bodyBottomCode`, so the whole engine
// can be pasted into a page. This is a stopgap: it is per-page, so a fix means
// re-pasting every page that uses it. Hosted files remain the real answer.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const css = readFileSync('dist/custom-slider.css', 'utf8').trim();
const js = readFileSync('dist/custom-slider.js', 'utf8').trim();
mkdirSync('dist/paste', { recursive: true });

// 1. Style Only tab — RAW CSS, no <style> tags (the platform wraps it).
writeFileSync('dist/paste/1-style-only.css', css + '\n');

// 2. Body Section Bottom — verbatim HTML, so the script tag goes here. Bottom of
//    the body means the markup already exists, so no defer/DOMContentLoaded race.
writeFileSync(
  'dist/paste/2-body-bottom.html',
  `<!-- Custom Slider engine, pasted inline (no hosted file needed).\n` +
    `     Paste into: Page > Custom HTML > Body Section, Bottom.\n` +
    `     Only ONE copy per page, however many sliders the page has. -->\n` +
    `<script>\n${js}\n</script>\n`,
);

const kb = (s) => (gzipSync(Buffer.from(s)).length / 1024).toFixed(1);
console.log(`dist/paste/1-style-only.css     ${css.length} B raw  (${kb(css)} KB gzip)`);
console.log(`dist/paste/2-body-bottom.html   ${js.length} B raw  (${kb(js)} KB gzip)`);
console.log('\nPaste 1 into "Style Only, Head Section", 2 into "Body Section, Bottom".');
