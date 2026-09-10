// OEM variants: a brand preset that carries values, and the knobs it needs.
// Spec: docs/superpowers/specs/2026-09-09-oem-variants-design.md
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { openBuilder, pick, rowByLabel, stageFrame, copyParts } from './helpers.mjs';

test.describe.configure({ mode: 'serial' });

let browser, page, errors;

test.beforeAll(async ({ browser: b }) => {
  browser = b;
  ({ page, errors } = await openBuilder(browser, 1500));
});

// The value a knob displays, by row label - same reading as controls.test.mjs.
const knob = (page, label) =>
  page.evaluate((l) => {
    const row = [...document.querySelectorAll('#wb-settings .tp-lblv')].find((r) => r.querySelector('.tp-lblv_l')?.textContent.trim() === l);
    if (!row) return null;
    const len = row.querySelector('.tp-lenv');
    if (len) {
      const n = len.querySelector('input').value;
      return n === '' ? '' : n + len.querySelector('select').value;
    }
    const el = row.querySelector('input[type="text"], input, select');
    return el ? el.value : null;
  }, label);

// What the tab row is actually drawing in the preview frame.
const tabStyles = (page) =>
  page.evaluate(() => {
    const d = globalThis.CARGO.sdoc();
    const list = d.querySelector('.cargo-tabs');
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const sel = tabs.find((t) => t.getAttribute('aria-selected') === 'true');
    const other = tabs.find((t) => t !== sel);
    const w = d.defaultView;
    return {
      size: w.getComputedStyle(sel).fontSize,
      dim: w.getComputedStyle(other).opacity,
      line: w.getComputedStyle(sel).borderBottomColor,
      colour: w.getComputedStyle(sel).color,
      rule: w.getComputedStyle(list).borderBottomColor,
      divider: w.getComputedStyle(other, '::before').content,
    };
  });

test.describe('the tab row has knobs', () => {
  test('the five tab knobs show what the untouched tabs pattern is drawing', async () => {
    await pick(page, 'tabs');
    assert.equal(await knob(page, 'Tab text size'), '1em');
    assert.equal(await knob(page, 'Dim unselected tabs'), '0.65');
    assert.equal(await knob(page, 'Selected tab line'), 'currentcolor');
    assert.equal(await knob(page, 'Rule under the tabs'), '#e2e5ea');
    assert.equal(await knob(page, 'Between tabs'), 'none');
    const s = await tabStyles(page);
    // Same picture as before the knobs existed: 14px inherits the frame's body,
    // 0.65 dim, line in the text colour, the #e2e5ea rule, no divider.
    assert.equal(s.dim, '0.65');
    assert.equal(s.line, s.colour);
    assert.equal(s.rule, 'rgb(226, 229, 234)');
    assert.equal(s.divider, 'none');
    assert.deepEqual(errors, []);
  });

  test('a tab knob reaches the preview and the copied CSS', async () => {
    await pick(page, 'tabs');
    const row = rowByLabel(page, 'Rule under the tabs');
    const input = row.locator('input[type="text"]').first();
    await input.fill('#ff0000');
    await input.press('Enter');
    await page.waitForTimeout(150);
    assert.equal((await tabStyles(page)).rule, 'rgb(255, 0, 0)');
    const { css } = await copyParts(page);
    assert.match(css, /--tab-rule: #ff0000;/);
    assert.deepEqual(errors, []);
  });
});
