// A small syntax highlighter for the code panels, in Monokai.
//
// Deliberately hand-written rather than pulled from a CDN: this page has to
// work opened straight off disk, and a carousel that ships with no runtime
// dependencies should not need one to show you its own source.
//
// Every tokeniser here works the same way - String.split with a capturing
// group, so odd indexes are matches and even indexes are the text between.
// That guarantees every character is accounted for and escaped exactly once,
// which a .replace() chain does not: the text it skips stays raw, and raw text
// in an innerHTML is how a highlighter turns into an injection.

(() => {
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
  const esc = (s) => s.replace(/[&<>]/g, (c) => ESC[c]);
  const t = (cls, text) => `<span class="t-${cls}">${esc(text)}</span>`;

  // Alternate: matched groups get the class, everything else is escaped text.
  const alt = (src, re, fn) =>
    src
      .split(re)
      .map((p, i) => (i % 2 ? fn(p) : esc(p)))
      .join('');

  const value = (s) => alt(s, /(#[0-9a-fA-F]{3,8}\b|\b-?\d*\.?\d+(?:px|rem|em|%|s|ms|fr|vw|vh|deg|ch)?\b)/, (p) => t('n', p));
  const decls = (s) =>
    s
      .split(/([\w-]+\s*:)/)
      .map((p, i) => (i % 2 ? t('p', p) : value(p)))
      .join('');
  const selector = (s) => alt(s, /([.#:][\w-]+|\*)/, (p) => t('sel', p));

  // Braces are counted rather than pattern-matched, because the same token
  // shape means "property" inside a rule and "element selector" outside one.
  function css(src) {
    let depth = 0;
    return src
      .split(/(\/\*[\s\S]*?\*\/)/)
      .map((chunk, ci) => {
        if (ci % 2) return t('c', chunk);
        let out = '';
        const re = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(@[\w-]+)|([{}])|([^{}"'@]+)/g;
        let m;
        while ((m = re.exec(chunk))) {
          if (m[1]) out += t('s', m[1]);
          else if (m[2]) out += t('k', m[2]);
          else if (m[3]) {
            depth += m[3] === '{' ? 1 : -1;
            out += esc(m[3]);
          } else out += depth > 0 ? decls(m[4]) : selector(m[4]);
        }
        return out;
      })
      .join('');
  }

  function tag(src) {
    let named = false;
    return src
      .split(/("[^"]*"|[\w:-]+)/)
      .map((p, i) => {
        if (!(i % 2)) return esc(p);
        if (p[0] === '"') return t('s', p);
        if (named) return t('attr', p);
        named = true;
        return t('tag', p);
      })
      .join('');
  }

  const html = (src) =>
    src
      .split(/(<!--[\s\S]*?-->|<[^>]*>)/)
      .map((p, i) => (!(i % 2) ? esc(p) : p.startsWith('<!--') ? t('c', p) : tag(p)))
      .join('');

  const KEYWORDS =
    /\b(const|let|var|function|class|return|if|else|for|while|new|this|null|true|false|typeof|instanceof|of|in|static|get|set|try|catch|await|async|export|import|default|extends|delete|void)\b/;

  const js = (src) =>
    src
      .split(/(\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/)
      .map((p, i) => (i % 2 ? t(p[0] === '/' ? 'c' : 's', p) : alt(p, KEYWORDS, (k) => t('k', k))))
      .join('');

  // The workbench panel is a <style> block followed by markup, so it needs both.
  const snippet = (src) =>
    src
      .split(/(<style>[\s\S]*?<\/style>|<script>[\s\S]*?<\/script>)/)
      .map((p, i) => {
        if (!(i % 2)) return html(p);
        return p.startsWith('<style>') ? tag('<style>') + css(p.slice(7, -8)) + tag('</style>') : tag('<script>') + js(p.slice(8, -9)) + tag('</script>');
      })
      .join('');

  globalThis.CARGO = Object.assign(globalThis.CARGO || {}, { hl: { css, js, html, snippet } });
})();
