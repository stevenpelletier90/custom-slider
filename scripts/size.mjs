// Byte-budget gate: dist JS+CSS must stay under 5 KB gzip TOTAL (spec §2).
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const BUDGET = 5120;
const files = ['dist/slider.min.js', 'dist/slider.min.css'];
let total = 0;
for (const f of files) {
  const gz = gzipSync(readFileSync(f), { level: 9 }).length;
  total += gz;
  console.log(`${f}: ${gz} B gzip`);
}
console.log(`total: ${total} B gzip (budget ${BUDGET})`);
if (total > BUDGET) {
  console.error('FAIL: over the 5 KB gzip budget');
  process.exit(1);
}
