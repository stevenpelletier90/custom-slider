// What a real screen reader says about the demo's own patterns - NVDA under
// Chromium on Windows, VoiceOver under WebKit on macOS (playwright.sr.config.mjs).
// On demand only: .github/workflows/screen-reader.yml, or `npm run test:sr`
// on a desktop nobody is using, because the screen reader listens to the
// whole machine.
//
// Every key goes THROUGH the screen reader (screenReader.press). guidepup
// records speech per command it sent, so the first version - Playwright
// pressing keys, the reader only listening - recorded nothing at all on
// either reader, and its "no clickable" check passed on silence. Playwright
// only parks focus on a starting point; each step below must have heard
// something before anything is asserted about it. Every phrase, with the
// element that had focus, is written to heard.json in the run's artifacts.
//
// 2026-10-27 decided three things on NVDA's word (docs/history.md); they are
// asserted on NVDA, where they were heard. VoiceOver is recorded, not
// asserted, until it has been heard. The thumbnail change runs three ways -
// as shipped, with the status region silenced, with the panels' live region
// silenced - because it announced "Slide 2 of 6" and never the photo's name,
// and because whether the gallery's two live regions double up is open.
import { screenReaderTest as test } from '@guidepup/playwright';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';

// ?sr=status-off or ?sr=track-off silences one of the media gallery's two
// polite live regions from the moment the engine creates it.
const SILENCE = () => {
  const v = new URLSearchParams(location.search).get('sr');
  if (!v) return;
  const sel = `[data-cargo="media-gallery"] ${v === 'status-off' ? '.dos-status' : '.dos-track'}`;
  const off = () => document.querySelectorAll(sel).forEach((el) => el.getAttribute('aria-live') !== 'off' && el.setAttribute('aria-live', 'off'));
  new MutationObserver(off).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-live'] });
};

// Every phrase, not guidepup's default "initial": that keeps only the first
// thing said after each key, so on a thumbnail change NVDA's "Slide 2 of 6"
// could not be told from "Slide 2 of 6" said BEFORE the photo's name rather
// than instead of it (run 40540672054). Usage hints come along; nothing
// below asserts against one.
test.use({ screenReaderStartOptions: { capture: true } });

test('what a screen reader says about the demo patterns', async ({ page, screenReader }, testInfo) => {
  const nvda = process.platform === 'win32';
  // WebKit's plain Tab skips links; Option+Tab is its every-item key, as in
  // tests/engine.test.mjs. guidepup reads Alt as Option on macOS.
  const TAB = nvda ? 'Tab' : 'Alt+Tab';
  const heard = [];
  await page.addInitScript(SILENCE);

  const open = async (variant = '') => {
    await page.goto(`/demo/patterns.html${variant ? `?sr=${variant}` : ''}`, { waitUntil: 'load' });
    await page.locator('[data-cargo="media-gallery"] .dos-thumb').first().waitFor();
    await page.waitForTimeout(800);
    await screenReader.navigateToWebContent();
  };
  // The element with focus, named the way the checks below look for it.
  const focused = () =>
    page.evaluate(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return 'body';
      const cs = a.closest('[data-cargo]');
      const where = cs ? /** @type {HTMLElement} */ (cs).dataset.cargo : 'page';
      const what = a.matches('.dos-dot--current')
        ? 'current dot'
        : a.matches('.dos-dot')
          ? 'dot'
          : a.matches('.dos-slide')
            ? 'panel'
            : a.closest('.dos-slide')
              ? 'card'
              : a.matches('.dos-thumb')
                ? `thumb ${[...a.parentElement.children].indexOf(a) + 1}`
                : [...a.classList].find((c) => c.startsWith('dos-')) || a.tagName.toLowerCase();
      // Which slide shows and whether the status region is live, on every
      // slider step: under VoiceOver a Next press read only the button, and
      // without these the log could not say whether the slide moved and went
      // unannounced or never moved, nor whether the region had been switched.
      const g = /** @type {any} */ (cs)?._dos;
      const status = cs?.querySelector('.dos-status')?.getAttribute('aria-live');
      return `${where} ${what}${g ? `, showing ${g.current + 1}, status ${status}` : ''}`;
    });
  const press = async (key, step, ms = 1500) => {
    await screenReader.clearSpokenPhraseLog();
    await screenReader.press(key);
    await page.waitForTimeout(ms);
    const said = (await screenReader.spokenPhraseLog()).map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
    const at = await focused();
    heard.push({ step, key, at, said });
    console.log(`${step} | ${key} -> ${at}: ${JSON.stringify(said)}`);
  };
  // Park focus on the last focusable element before a pattern - the Tab path a
  // visitor takes into it - then Tab in through the screen reader.
  const tabInto = async (cargo, presses) => {
    await page.evaluate((cargo) => {
      const root = document.querySelector(`[data-cargo="${cargo}"]`);
      const all = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter((e) => !e.closest('[inert]') && e.getClientRects().length);
      const first = all.findIndex((e) => root.contains(e));
      document.querySelectorAll('[data-sr-start]').forEach((e) => e.removeAttribute('data-sr-start'));
      all[first - 1].setAttribute('data-sr-start', '');
    }, cargo);
    await page.focus('[data-sr-start]');
    await page.waitForTimeout(500);
    for (let i = 0; i < presses; i++) await press(TAB, `into ${cargo}`);
  };
  const saidAt = (at) =>
    heard
      .filter((h) => h.at === at || h.at.startsWith(`${at},`))
      .flatMap((h) => h.said)
      .join(' | ');

  try {
    await open();
    await tabInto('modelbar', 3);
    await tabInto('cards', 4);
    await tabInto('media-gallery', 4);
    // As shipped runs LAST: under VoiceOver it ran first twice and its arrow
    // key never moved off thumbnail 1, while both silenced variants moved -
    // last tells an order artefact from something in the shipped markup.
    // Each variant also changes photo with the Next arrow, where focus stays
    // on the arrow and only the live regions can say what changed.
    for (const variant of ['status-off', 'track-off', '']) {
      const name = variant || 'as shipped';
      await open(variant);
      await page.focus('[data-cargo="media-gallery"] .dos-thumb[aria-selected="true"]');
      await page.waitForTimeout(800);
      for (let i = 1; i <= 2; i++) await press('ArrowRight', `thumbnail change ${i}, ${name}`, 3000);
      await page.focus('[data-cargo="media-gallery"] .dos-arrow--next');
      await page.waitForTimeout(800);
      await press('Enter', `Next arrow, ${name}`, 3000);
    }
    // Next on a slider whose status region is never switched (the cards), and
    // on the autoplay hero, whose status is "off" while it rotates and goes
    // back to "polite" once focus inside stops it - the same switch VoiceOver
    // stopped hearing in the gallery (2026-10-27). If the cards announce and
    // the hero does not, every paused autoplay slider is silent on VoiceOver.
    await open();
    for (const cargo of ['cards', 'hero']) {
      await page.focus(`[data-cargo="${cargo}"] .dos-arrow--next`);
      await page.waitForTimeout(1000);
      await press('Enter', `Next arrow, ${cargo}`, 3000);
      await press('Enter', `Next arrow again, ${cargo}`, 3000);
    }
  } finally {
    const body = JSON.stringify({ reader: nvda ? 'NVDA' : 'VoiceOver', heard }, null, 2);
    writeFileSync(testInfo.outputPath('heard.json'), body);
    await testInfo.attach('heard.json', { body, contentType: 'application/json' });
  }

  assert.ok(
    heard.some((h) => h.said.length),
    'the screen reader said nothing at all - no check below could mean anything',
  );
  if (nvda) {
    const card = saidAt('modelbar card');
    const dot = saidAt('cards current dot');
    const panel = saidAt('media-gallery panel');
    for (const [what, s] of [
      ['the first model-bar card', card],
      ['the current dot', dot],
      ['the gallery photo', panel],
    ])
      assert.ok(s, `NVDA said nothing when focus reached ${what}`);
    // The track carries no click listener (71880fa): NVDA said "list,
    // clickable, with 8 items" before every strip.
    assert.doesNotMatch(card, /clickable/i, `the strip is still "clickable": ${card}`);
    // aria-current (40545a4): aria-disabled read "button, unavailable".
    assert.match(dot, /\bcurrent\b/i, `the current dot is not announced as current: ${dot}`);
    assert.doesNotMatch(dot, /unavailable/i, `the current dot still sounds disabled: ${dot}`);
    // aria-roledescription (45788d4): a bare tabpanel read "property page".
    assert.match(panel, /\bslide\b/i, `the gallery photo is not announced as a slide: ${panel}`);
    assert.doesNotMatch(panel, /property page/i, `the gallery photo is still a "property page": ${panel}`);
  }
});
