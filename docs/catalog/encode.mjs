// Entity-encode a catalog page so it survives charset-less hosting: every
// character above 0x7E becomes a numeric HTML entity. Idempotent — pure-ASCII
// input comes back unchanged. Usage: node encode.mjs <file> [...more files]
import fs from 'node:fs';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: node encode.mjs <file> [...more files]');
  process.exit(1);
}
for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  // the u flag walks code points, so surrogate pairs encode as one entity
  const after = before.replace(/[^\x00-\x7F]/gu, (c) => '&#' + c.codePointAt(0) + ';');
  if (after !== before) {
    fs.writeFileSync(file, after);
    console.log(`${file}: encoded`);
  } else {
    console.log(`${file}: already pure ASCII`);
  }
}
