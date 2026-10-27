// What a real screen reader says about the demo's own patterns - NVDA under
// Chromium on Windows, VoiceOver under WebKit on macOS (playwright.sr.config.mjs).
// On demand only: .github/workflows/screen-reader.yml, or `npm run test:sr`
// on a desktop nobody is using, because the screen reader listens to the
// whole machine.
//
// Playwright drives the page - focus, arrow keys - and the screen reader only
// listens, so nothing here depends on NVDA's and VoiceOver's different keys,
// or on Tab skipping links in WebKit. Every phrase lands in heard.json,
// attached to the run.
//
// 2026-10-27 decided three things on NVDA's word (docs/history.md); they are
// asserted here on NVDA, where they were heard. VoiceOver's first run is for
// listening: recorded, not asserted. The thumbnail change runs three ways -
// as shipped, with the status region silenced, with the panels' live region
// silenced - because it announced "Slide 2 of 6" and never the photo's name,
// and because whether the gallery's two live regions double up is open.
import { screenReaderTest as test } from '@guidepup/playwright';
import assert from 'node:assert/strict';

// ?sr=status-off or ?sr=track-off silences one of the media gallery's two
// polite live regions from the moment the engine creates it.
const SILENCE = () => {
  const v = new URLSearchParams(location.search).get('sr');
  if (!v) return;
  const sel = `[data-cargo="media-gallery"] ${v === 'status-off' ? '.cs-status' : '.cs-track'}`;
  const off = () => document.querySelectorAll(sel).forEach((el) => el.getAttribute('aria-live') !== 'off' && el.setAttribute('aria-live', 'off'));
  new MutationObserver(off).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-live'] });
};

test('what a screen reader says about the demo patterns', async ({ page, screenReader }, testInfo) => {
  const nvda = process.platform === 'win32';
  const heard = [];
  await page.addInitScript(SILENCE);

  const open = async (variant = '') => {
    await page.goto(`/demo/patterns.html${variant ? `?sr=${variant}` : ''}`, { waitUntil: 'load' });
    await page.locator('[data-cargo="media-gallery"] .cs-thumb').first().waitFor();
    await page.waitForTimeout(800);
    await screenReader.navigateToWebContent();
  };
  const listen = async (what, act, ms = 2000) => {
    await screenReader.clearSpokenPhraseLog();
    await act();
    await page.waitForTimeout(ms);
    const said = (await screenReader.spokenPhraseLog()).map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
    heard.push({ what, said });
    console.log(`${what}: ${JSON.stringify(said)}`);
    return said.join(' | ');
  };
  const focus = (sel) => () => page.focus(sel);

  await open();
  const card = await listen('model bar: first card', focus('[data-cargo="modelbar"] .cs-slide a'));
  const dot = await listen('cards: current dot', focus('[data-cargo="cards"] .cs-dot--current'));
  await listen('cards: other dot', focus('[data-cargo="cards"] .cs-dot:not(.cs-dot--current)'));
  const panel = await listen('media gallery: the photo showing', focus('[data-cargo="media-gallery"] .cs-slide:not([inert])'));
  await listen('media gallery: its thumbnail', focus('[data-cargo="media-gallery"] .cs-thumb[aria-selected="true"]'));

  for (const variant of ['', 'status-off', 'track-off']) {
    await open(variant);
    await page.focus('[data-cargo="media-gallery"] .cs-thumb[aria-selected="true"]');
    await page.waitForTimeout(1000);
    for (let i = 1; i <= 2; i++) await listen(`thumbnail change ${i}, ${variant || 'as shipped'}`, () => page.keyboard.press('ArrowRight'), 3000);
  }

  await testInfo.attach('heard.json', { body: JSON.stringify({ reader: nvda ? 'NVDA' : 'VoiceOver', heard }, null, 2), contentType: 'application/json' });

  if (nvda) {
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
