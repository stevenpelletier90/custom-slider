// Generates the demo's local SVG placeholder images (no external requests).
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = new URL('../demo/img/', import.meta.url);
mkdirSync(OUT, { recursive: true });

const svg = (w, h, bg, label) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${bg}"/>
  <text x="50%" y="50%" fill="#fff" font-family="system-ui,sans-serif" font-size="${Math.round(h / 8)}" text-anchor="middle" dominant-baseline="middle">${label}</text>
</svg>`;

['#4a6fa5', '#a54a6f', '#6fa54a', '#a5864a', '#4aa596', '#7a4aa5'].forEach((c, i) => writeFileSync(new URL(`vehicle-${i + 1}.svg`, OUT), svg(800, 500, c, `Vehicle ${i + 1}`)));
['#1f4e5f', '#2a637a', '#357895', '#408db0', '#2a7a5f', '#1f5f4e'].forEach((c, i) => writeFileSync(new URL(`photo-${i + 1}.svg`, OUT), svg(1200, 750, c, `Photo ${i + 1}`)));
console.log('wrote 12 SVGs to demo/img/');
