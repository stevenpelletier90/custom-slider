// The install panel - the four files, and what each button actually hands over.
//
// The Download button used to build its filename back up from a "css"/"js"
// attribute, against a map holding only the .min pair: Download on the
// custom-slider.min.css row saved the MINIFIED bytes under the name
// custom-slider.css. Four files go into one shared folder, so a designer who
// uploads what that button gave them puts minified code under the name meant
// for the readable build - and neither the page, the file, nor the folder says
// so. Nothing about it is visible in the rendered demo, which is why it took
// a browser test rather than a linter.
//
// Both halves are checked: the filename the browser is told, and the bytes
// behind it. Checked to fail against the code from before it was written -
// where the panel had two Downloads and both named the file custom-slider.<ext>
// whichever build they had actually fetched.
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { openBuilder, ORIGIN } from './helpers.mjs';

test.describe.configure({ mode: 'serial' });

let page, errors;

// The four files the shared folder holds. `npm run build` writes exactly these,
// so the panel has to offer exactly these or an upload taken from it leaves the
// folder short of one.
const DIST = ['custom-slider.css', 'custom-slider.js', 'custom-slider.min.css', 'custom-slider.min.js'];

test.beforeAll(async ({ browser }) => {
  ({ page, errors } = await openBuilder(browser));
});

// The file as the server hands it over - the same fetch the page itself makes.
const served = (name) => fetch(`${ORIGIN}/dist/${name}`).then((r) => r.text());

const saved = async (download) => ({ name: download.suggestedFilename(), body: await readFile(await download.path(), 'utf8') });

test.describe('the files the install panel hands over', () => {
  test('every Download saves the file its row is named after, byte for byte', async () => {
    // Walked by index, not by label: custom-slider.min.css has a row in BOTH
    // columns now, so a label selector matches two buttons.
    const buttons = page.locator('.ui-file [data-act="download"]');
    const n = await buttons.count();
    assert.ok(n, 'the install panel has no Download buttons at all');

    for (let i = 0; i < n; i++) {
      const btn = buttons.nth(i);
      const label = (await btn.evaluate((b) => b.closest('.ui-file').querySelector('code').textContent)).trim();
      const attr = await btn.getAttribute('data-file');

      const wait = page.waitForEvent('download');
      await btn.click();
      const file = await saved(await wait);

      // The name the browser is told to save under. Before the fix this came
      // back custom-slider.css for a row labelled custom-slider.min.css.
      assert.equal(file.name, label, `the ${label} row saves a file called ${file.name}`);
      assert.equal(attr, label, `the ${label} row asks for "${attr}" - data-file must name the file, never a kind`);

      // ...and the bytes behind that name, which a filename check alone would
      // miss: the right name over the wrong build is the same bug.
      assert.equal(file.body, await served(label), `${label} saved bytes that are not dist/${label}`);
    }
  });

  test('all four of the files that go in the shared folder are offered', async () => {
    const offered = await page.evaluate(() => [...document.querySelectorAll('[data-act="download"]')].map((b) => b.dataset.file));
    for (const name of DIST) assert.ok(offered.includes(name), `${name} has no Download in the install panel, so an upload taken from here leaves the folder short`);
  });

  // Asserted rather than assumed: every filename check above is worthless if
  // the four files turn out to be four copies of the same bytes.
  test('the readable build and the minified build are different files', async () => {
    const [css, min] = await Promise.all([served('custom-slider.css'), served('custom-slider.min.css')]);
    assert.match(css, /^\.cs \{\s/, 'dist/custom-slider.css is not the readable build');
    assert.match(min, /^\.cs\{/, 'dist/custom-slider.min.css is not the minified build');
  });

  test('Download all four saves each one, under its own name', async () => {
    const got = [];
    const collect = (d) => got.push(d);
    page.on('download', collect);
    await page.click('#wb-download-all');
    // The saves are spaced, so this waits rather than reading straight away.
    // Capped rather than an open loop, so a dead button fails instead of hangs.
    for (let i = 0; i < 100 && got.length < DIST.length; i++) await page.waitForTimeout(100);
    page.off('download', collect);

    const names = (await Promise.all(got.map(saved))).map((f) => f.name).sort();
    assert.deepEqual(names, DIST.slice().sort(), `Download all four saved ${names.length} file(s): ${names.join(', ') || 'none'}`);
  });
});

test.describe('the buttons the retag went through', () => {
  // data-file changed from a kind to a filename, and Copy and View read the
  // same attribute. Both would fail quietly: Copy puts the wrong wrapper on,
  // View reads the file as the wrong language - neither throws.
  test('View still shows the file it names, highlighted as CSS', async () => {
    await page.click('.ui-file:has(code:text-is("custom-slider.min.css")) [data-act="view"]');
    // The handler fetches before it fills the box, so the click resolves well
    // before the box does. Wait for the box, never for a timeout.
    await page.waitForSelector('#wb-file-view', { state: 'visible' });
    const shown = await page.evaluate(() => {
      const box = document.getElementById('wb-file-view');
      // t-sel is emitted only by the CSS tokeniser's selector pass, so its
      // presence is what says the file was read as CSS rather than as JS.
      return { hidden: box.hidden, text: box.querySelector('code').textContent, selectors: box.querySelectorAll('code .t-sel').length };
    });
    assert.equal(shown.hidden, false, 'View left the file box hidden');
    assert.match(shown.text, /^\.cs\{--cs-per-view/, 'View showed something that is not the minified stylesheet');
    assert.ok(shown.selectors > 0, 'the stylesheet came back with no selector highlighting, so it was read as the wrong language');
  });

  test('Copy wraps each file in the tag its CMS field takes', async () => {
    for (const [name, open] of [
      ['custom-slider.min.css', '<style>'],
      ['custom-slider.min.js', '<script>'],
    ]) {
      const row = `.ui-file:has(code:text-is("${name}")) [data-act="copy"]`;
      await page.click(row);
      // Same race as View: the fetch and the clipboard write both come after
      // the click. The button says "Copied" once the write has landed.
      await page.waitForSelector(`${row}:text-is("Copied")`);
      const text = await page.evaluate(() => navigator.clipboard.readText());
      assert.ok(text.startsWith(open), `Copy on ${name} does not open with ${open}`);
    }
  });

  // Eight buttons said "Download", "Copy" or "View" and nothing else - the
  // filename that tells them apart sits in a sibling <code> the button's own
  // name never reaches, so a screen reader's button list was three words over
  // and over and no way to pick one.
  test('every file button says which file it is', async () => {
    const names = await page.evaluate(() => [...document.querySelectorAll('.ui-get [data-file]')].map((b) => b.getAttribute('aria-label') ?? b.textContent.trim()));
    assert.ok(names.length >= 8, `only ${names.length} file buttons found in the install panel`);
    assert.deepEqual([...new Set(names)].sort(), names.slice().sort(), `two buttons share a name: ${names.join(', ')}`);
    for (const n of names) assert.match(n, /custom-slider\.(min\.)?(css|js)$/, `"${n}" does not name the file it acts on`);
  });

  // README.md "Deployment status - the one place it is written down" ends "do
  // not restate a status in them". The panel used to say the shared folder
  // still served the old dl-carousel build, which is a status, and one that
  // goes false the hour the upload lands with nothing to catch it. What
  // replaced it is a check the reader runs themselves, which never goes stale.
  test('the panel states no deployment status', async () => {
    const text = await page.evaluate(() => document.querySelector('.ui-get').textContent);
    assert.doesNotMatch(text, /dl-carousel/, 'the install panel names the old build, which is a deployment status README owns');
    assert.doesNotMatch(text, /not yet|still serves|has not been uploaded/i, 'the install panel claims a deployment state that will go stale');
    assert.match(text, /\.cs\{/, 'the self-check a reader runs instead of being told a status is gone');
  });

  test('no page errors along the way', () => {
    assert.deepEqual(errors, [], `the install panel threw: ${errors.join(' | ')}`);
  });
});
