// Shared demo-page behavior for demo/index.html and demo/model-bars.html —
// one copy instead of a script block duplicated into each page by hand.
// Page-specific scripts (tabs, video modal, file-copy buttons, thumb drag)
// stay inline in the page that owns them.

// Copy buttons on every code sample. Added by script so the authored
// markup stays clean, and so a reader with JS off just sees normal code
// they can select by hand.
addEventListener('DOMContentLoaded', () => {
  // One polite status region for every copy button: the visual "Copied"
  // swap is silent to a screen reader; this announces it.
  const status = document.createElement('p');
  status.className = 'demo-vh';
  status.setAttribute('role', 'status');
  document.body.append(status);
  const announce = (msg) => {
    // Clear first so copying the same block twice re-announces.
    status.textContent = '';
    requestAnimationFrame(() => {
      status.textContent = msg;
    });
  };

  for (const pre of document.querySelectorAll('details pre')) {
    // Read the label FIRST: once the <pre> is moved inside the wrapper it
    // is an only child, so previousElementSibling is null and every button
    // ends up named "Copy code".
    const label = pre.previousElementSibling?.classList.contains('code-label') ? pre.previousElementSibling.textContent.trim() : 'code';

    const wrap = document.createElement('div');
    wrap.className = 'code-wrap';
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-copy';
    btn.textContent = 'Copy';
    // Named by what it copies, so a screen reader hears "Copy HTML"
    // rather than twenty-nine identical "Copy" buttons.
    btn.setAttribute('aria-label', `Copy ${label}`);
    wrap.appendChild(btn);

    btn.addEventListener('click', async () => {
      const text = pre.textContent;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Clipboard API needs a secure context; fall back for file:// and http://
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      btn.textContent = 'Copied';
      btn.dataset.copied = '';
      announce(`Copied ${label} to the clipboard`);
      clearTimeout(btn._t);
      btn._t = setTimeout(() => {
        btn.textContent = 'Copy';
        delete btn.dataset.copied;
      }, 1600);
    });
  }
});

// TOC scrollspy: mark the section currently on screen with
// aria-current="true" so a long page keeps its sense of place. Progressive
// enhancement — with JS off the TOC is still a plain list of links.
addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('.demo-toc a[href^="#"]');
  const byTarget = new Map();
  for (const a of links) {
    const target = document.getElementById(decodeURIComponent(a.hash.slice(1)));
    if (target) byTarget.set(target, a);
  }
  if (!byTarget.size) return;
  let current = null;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        current?.removeAttribute('aria-current');
        current = byTarget.get(e.target);
        current?.setAttribute('aria-current', 'true');
      }
    },
    // A thin band just above centre screen decides "where you are" —
    // whole-viewport intersection would light several sections at once.
    { rootMargin: '-40% 0px -55% 0px' },
  );
  for (const target of byTarget.keys()) io.observe(target);
});
