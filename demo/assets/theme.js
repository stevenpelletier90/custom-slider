// Theme toggle, shared by both demo pages.
//
// Three states, not two: "light", "dark", or nothing stored, which means
// follow the system. The inline script in the <head> applies a stored choice
// before first paint so a dark reload never flashes white; this file only
// handles the switching afterwards.

(() => {
  const root = document.documentElement;
  const btn = document.getElementById('ui-theme');
  if (!btn) return;

  const systemDark = () => matchMedia('(prefers-color-scheme: dark)').matches;
  const current = () => root.dataset.theme || (systemDark() ? 'dark' : 'light');

  const label = () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    btn.setAttribute('aria-label', `Switch to ${next} theme`);
    btn.textContent = current() === 'dark' ? '☀' : '◐';
  };

  btn.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try {
      localStorage.setItem('cs-theme', next);
    } catch {
      /* private mode: the choice just lasts this page view */
    }
    label();
  });

  // Follow the system while the reader has not made a choice of their own.
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (!root.dataset.theme) label();
  });

  label();

  // The byte count in the masthead, read from the files this page is running
  // rather than typed in - a number in a header that has gone stale is worse
  // than no number at all.
  const size = document.getElementById('ui-size');
  if (!size) return;
  // Gzipped, because that is the unit the byte budget is set in and what a
  // browser actually downloads. Raw bytes would read 19.8 KB and undersell the
  // engine by three times. CompressionStream does it in the page, so the figure
  // cannot drift from the files being served.
  const gz = async (file) => {
    const buf = await fetch(file).then((r) => r.arrayBuffer());
    if (!globalThis.CompressionStream) return buf.byteLength;
    const stream = new Blob([buf]).stream().pipeThrough(new CompressionStream('gzip'));
    return (await new Response(stream).blob()).size;
  };
  Promise.all(['../dist/custom-slider.css', '../dist/custom-slider.js'].map(gz))
    .then(([css, js]) => {
      size.textContent = `Two small files, ${((css + js) / 1024).toFixed(1)} KB in all — nothing else to install`;
    })
    .catch(() => {
      /* opened over file:// where fetch is blocked - leave the static text */
    });
})();
