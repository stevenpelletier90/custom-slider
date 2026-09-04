// The adapter between buildPanel() and Tweakpane. Each control binds to a
// private { v } and calls back, so state stays owned by the handlers that
// already exist - the pane is a view, never a second owner of a value.
import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { openBuilder } from './helpers.mjs';

test.describe.configure({ mode: 'serial' });

let page, errors;
test.beforeAll(async ({ browser }) => {
  ({ page, errors } = await openBuilder(browser));
});

test('text, int, list and bool call back with the typed value', async () => {
  const got = await page.evaluate(async () => {
    const { pane } = globalThis.CARGO;
    const box = document.createElement('div');
    document.body.append(box);
    pane.create(box);
    const f = pane.folder('Probe');
    const out = {};
    pane.text(f, 'T', 'a', (v) => (out.t = v));
    pane.int(f, 'I', 1, (n) => (out.i = n), { min: 1, max: 8, step: 1 });
    pane.list(
      f,
      'L',
      'x',
      [
        ['x', 'Ex'],
        ['y', 'Why'],
      ],
      (v) => (out.l = v),
    );
    pane.bool(f, 'B', false, (b) => (out.b = b));
    const row = (label) => [...box.querySelectorAll('.tp-lblv')].find((r) => r.querySelector('.tp-lblv_l')?.textContent.trim() === label);
    const fire = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));
    const t = row('T').querySelector('input');
    t.value = 'b';
    fire(t, 'change');
    const i = row('I').querySelector('input');
    i.value = '3';
    fire(i, 'change');
    const l = row('L').querySelector('select');
    l.value = 'y';
    fire(l, 'change');
    const b = row('B').querySelector('input[type=checkbox]');
    b.checked = true;
    fire(b, 'change');
    await new Promise((r) => setTimeout(r, 50));
    pane.dispose();
    box.remove();
    return out;
  });
  assert.deepEqual(got, { t: 'b', i: 3, l: 'y', b: true });
});

test('the pane is themed to the demo, not to the library default', async () => {
  const bg = await page.evaluate(() => getComputedStyle(document.querySelector('#wb-settings')).getPropertyValue('--tp-base-background-color').trim());
  assert.notEqual(bg, '', 'no --tp-* variables on the settings container');
});

test('a note is a paragraph in the folder', async () => {
  const text = await page.evaluate(() => {
    const { pane } = globalThis.CARGO;
    const box = document.createElement('div');
    document.body.append(box);
    pane.create(box);
    pane.note(pane.folder('Probe'), 'Hello there');
    const t = box.querySelector('p.tp-notev')?.textContent;
    pane.dispose();
    box.remove();
    return t;
  });
  assert.equal(text, 'Hello there');
});

test('the card-style picker shows every look and reports a click', async () => {
  const got = await page.evaluate(async () => {
    const { pane, LOOKS } = globalThis.CARGO;
    const box = document.createElement('div');
    document.body.append(box);
    pane.create(box);
    let picked = null;
    pane.looks(pane.folder('Probe'), LOOKS, 'tile', (id) => (picked = id));
    const btns = [...box.querySelectorAll('.tp-lookv button')];
    const pressed = btns.filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset.look);
    btns.find((b) => b.dataset.look === 'vcard').click();
    await new Promise((r) => setTimeout(r, 20));
    pane.dispose();
    box.remove();
    return { count: btns.length, pressed, picked };
  });
  assert.equal(got.count, 7);
  assert.deepEqual(got.pressed, ['tile']);
  assert.equal(got.picked, 'vcard');
});

test.describe('nothing threw', () => {
  test('no page errors', () => {
    assert.deepEqual(errors, []);
  });
});
