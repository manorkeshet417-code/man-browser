'use strict';
/* Man Studio no-code site builder.
   A site is a list of blocks + a theme + a font. Builder.render() turns that into one HTML page and
   hides the block data inside it (<!--msb:...-->) so the site reopens in the builder next time. */
(function () {
  const THEMES = {
    violet: { bg: '#0f0b1e', surface: '#1c1530', text: '#f1edff', muted: '#b6abd6', accent: '#a78bfa', accent2: '#f472b6', dark: true },
    ocean: { bg: '#06141f', surface: '#0e2433', text: '#e6f6ff', muted: '#9cc3d6', accent: '#38bdf8', accent2: '#34d399', dark: true },
    sunset: { bg: '#fff7ed', surface: '#ffffff', text: '#3b1d0b', muted: '#8a5a3c', accent: '#f97316', accent2: '#e11d48', dark: false },
    forest: { bg: '#f3f7f0', surface: '#ffffff', text: '#1c2b1a', muted: '#5d6f58', accent: '#16a34a', accent2: '#0d9488', dark: false },
    candy: { bg: '#fdf2f8', surface: '#ffffff', text: '#3b0a2a', muted: '#9d5c84', accent: '#ec4899', accent2: '#8b5cf6', dark: false },
    mono: { bg: '#ffffff', surface: '#f4f4f5', text: '#18181b', muted: '#71717a', accent: '#18181b', accent2: '#52525b', dark: false },
  };
  const FONTS = {
    modern: '"Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif',
    rounded: '"Nunito", "Varela Round", "Segoe UI", system-ui, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: 'Consolas, "Cascadia Code", monospace',
  };

  // block types and their fields: [key, kind] where kind = text | long | url | lines
  const BLOCKS = {
    hero: { icon: '★', fields: [['title', 'text'], ['subtitle', 'long'], ['button', 'text'], ['link', 'url']] },
    text: { icon: '¶', fields: [['heading', 'text'], ['body', 'long']] },
    image: { icon: '🖼', fields: [['url', 'url'], ['caption', 'text']] },
    button: { icon: '⏺', fields: [['text', 'text'], ['link', 'url']] },
    links: { icon: '🔗', fields: [['heading', 'text'], ['items', 'lines']] },
    cards: { icon: '▦', fields: [['heading', 'text'], ['items', 'lines']] },
    video: { icon: '▶', fields: [['url', 'url']] },
    divider: { icon: '—', fields: [] },
    footer: { icon: '▁', fields: [['text', 'text']] },
  };

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = u => {
    u = String(u ?? '').trim();
    if (!u) return '';
    if (/^(https?:|man:|mailto:)/i.test(u)) return u;
    if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(u)) return 'https://' + u; // "youtube.com/x" → https://
    return '';
  };
  const lines = s => String(s ?? '').split('\n').map(x => x.trim()).filter(Boolean)
    .map(x => { const i = x.indexOf('|'); return i < 0 ? [x, ''] : [x.slice(0, i).trim(), x.slice(i + 1).trim()]; });
  const youtubeId = u => {
    const m = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i.exec(String(u || ''));
    return m ? m[1] : '';
  };
  let uid = 0;
  const newId = () => 'b' + Date.now().toString(36) + (uid++).toString(36);

  function blockHtml(b) {
    switch (b.type) {
      case 'hero': {
        const link = safeUrl(b.link);
        return `<header class="hero"><h1>${esc(b.title)}</h1>${b.subtitle ? `<p>${esc(b.subtitle).replace(/\n/g, '<br>')}</p>` : ''}${b.button && link ? `<a class="btn" href="${esc(link)}">${esc(b.button)}</a>` : ''}</header>`;
      }
      case 'text':
        return `<section class="block text">${b.heading ? `<h2>${esc(b.heading)}</h2>` : ''}${String(b.body || '').split(/\n{2,}/).filter(p => p.trim()).map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('')}</section>`;
      case 'image': {
        const u = safeUrl(b.url);
        return u ? `<figure class="block image"><img src="${esc(u)}" alt="${esc(b.caption)}">${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ''}</figure>` : '';
      }
      case 'button': {
        const u = safeUrl(b.link);
        return b.text ? `<div class="block center"><a class="btn" href="${esc(u || '#')}">${esc(b.text)}</a></div>` : '';
      }
      case 'links':
        return `<section class="block links">${b.heading ? `<h2>${esc(b.heading)}</h2>` : ''}${lines(b.items).map(([label, url]) => `<a class="link" href="${esc(safeUrl(url) || '#')}">${esc(label)}</a>`).join('')}</section>`;
      case 'cards':
        return `<section class="block">${b.heading ? `<h2>${esc(b.heading)}</h2>` : ''}<div class="cards">${lines(b.items).map(([title, desc]) => `<div class="card"><h3>${esc(title)}</h3>${desc ? `<p>${esc(desc)}</p>` : ''}</div>`).join('')}</div></section>`;
      case 'video': {
        const id = youtubeId(b.url);
        return id ? `<div class="block video"><iframe src="https://www.youtube.com/embed/${esc(id)}" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture"></iframe></div>` : '';
      }
      case 'divider': return '<hr class="block">';
      case 'footer': return `<footer>${esc(b.text)}</footer>`;
      default: return '';
    }
  }

  function render(state, title) {
    const th = THEMES[state.theme] || THEMES.violet;
    const font = FONTS[state.font] || FONTS.modern;
    const css = `
:root{--bg:${th.bg};--surface:${th.surface};--text:${th.text};--muted:${th.muted};--a:${th.accent};--a2:${th.accent2};color-scheme:${th.dark ? 'dark' : 'light'}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:17px/1.65 ${font}}
main{max-width:820px;margin:0 auto;padding:0 22px 40px}
.hero{text-align:center;padding:90px 22px 64px;margin:0 -22px 10px;background:radial-gradient(900px 380px at 50% -60px,color-mix(in srgb,var(--a) 35%,transparent),transparent 75%)}
.hero h1{font-size:clamp(34px,6vw,58px);line-height:1.08;margin:0 0 14px;letter-spacing:-1px}
.hero p{color:var(--muted);font-size:19px;margin:0 auto 26px;max-width:600px}
.block{margin:34px 0}h2{font-size:26px;margin:0 0 12px}.text p{margin:0 0 12px}
.btn{display:inline-block;padding:13px 26px;border-radius:14px;background:linear-gradient(135deg,var(--a),var(--a2));color:#fff;text-decoration:none;font-weight:700}
.btn:hover{filter:brightness(1.08)}.center{text-align:center}
.image{margin-inline:0}.image img{width:100%;border-radius:18px;display:block}.image figcaption{color:var(--muted);text-align:center;font-size:14px;margin-top:8px}
.links{display:flex;flex-direction:column;gap:10px;max-width:480px;margin-inline:auto;text-align:center}
.link{display:block;padding:15px;border-radius:14px;background:var(--surface);color:var(--text);text-decoration:none;font-weight:600;border:1px solid color-mix(in srgb,var(--text) 10%,transparent);transition:transform .15s}
.link:hover{transform:translateY(-2px);border-color:var(--a)}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
.card{background:var(--surface);border-radius:16px;padding:20px;border:1px solid color-mix(in srgb,var(--text) 10%,transparent)}
.card h3{margin:0 0 6px;color:var(--a)}.card p{margin:0;color:var(--muted);font-size:15.5px}
.video{position:relative;aspect-ratio:16/9}.video iframe{position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:18px}
hr.block{border:0;height:1px;background:color-mix(in srgb,var(--text) 15%,transparent)}
footer{text-align:center;color:var(--muted);font-size:14px;padding:30px 0 10px}`;
    const body = state.blocks.map(blockHtml).join('\n');
    const data = encodeURIComponent(JSON.stringify(state));
    return `<!doctype html>
<!--msb:${data}-->
<html dir="auto">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title || 'My site')}</title>
<style>${css}
</style>
</head>
<body>
<main>
${body}
</main>
</body>
</html>`;
  }

  function parse(html) {
    const m = /<!--msb:([^>]*?)-->/.exec(String(html || ''));
    if (!m) return null;
    try {
      const s = JSON.parse(decodeURIComponent(m[1]));
      if (!s || !Array.isArray(s.blocks)) return null;
      s.blocks.forEach(b => { if (!b.id) b.id = newId(); });
      return s;
    } catch { return null; }
  }
  const stripData = html => String(html || '').replace(/<!--msb:[^>]*?-->\n?/, '');

  function template(kind, title, domain) {
    const B = (type, f = {}) => ({ id: newId(), type, ...f });
    const t = title || domain || 'My site';
    switch (kind) {
      case 'game': return { v: 1, theme: 'violet', font: 'modern', blocks: [
        B('hero', { title: '🎮 ' + t, subtitle: 'Indie games made with love', button: 'Play now', link: 'man://manstudio.domain/' }),
        B('cards', { heading: 'Our games', items: 'Game One | A short description of your first game.\nGame Two | A short description of another game.' }),
        B('video', { url: '' }),
        B('footer', { text: `© ${t}` }),
      ] };
      case 'links': return { v: 1, theme: 'candy', font: 'rounded', blocks: [
        B('hero', { title: t, subtitle: 'All my links in one place' }),
        B('links', { items: '▶ My YouTube | https://www.youtube.com/\n💻 My GitHub | https://github.com/\n✦ Get your own free domain | man://manstudio.domain/' }),
      ] };
      case 'blank': return { v: 1, theme: 'mono', font: 'modern', blocks: [B('hero', { title: t })] };
      default: return { v: 1, theme: 'violet', font: 'modern', blocks: [
        B('hero', { title: '👋 ' + t, subtitle: `Welcome to my site on ${domain || ''}`, button: 'Contact me', link: 'mailto:' }),
        B('text', { heading: 'About me', body: 'Write a few words about yourself here.' }),
        B('footer', { text: 'Made with manstudio.domain' }),
      ] };
    }
  }

  /* ---------- the editor UI ---------- */
  function mount(root, state, onChange, t) {
    const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
    const changed = () => onChange(state);
    let openId = state.blocks[0] && state.blocks[0].id;

    function draw() {
      root.innerHTML = '';
      // theme + font
      const look = el('div', 'b-look');
      const sw = el('div', 'b-swatches');
      for (const [k, th] of Object.entries(THEMES)) {
        const s = el('button', 'b-swatch' + (state.theme === k ? ' on' : ''));
        s.type = 'button'; s.title = t('theme_' + k);
        s.style.background = `linear-gradient(135deg, ${th.accent}, ${th.accent2})`;
        s.style.outlineColor = th.accent;
        s.addEventListener('click', () => { state.theme = k; changed(); draw(); });
        sw.append(s);
      }
      const font = el('select', 'b-font');
      for (const k of Object.keys(FONTS)) { const o = el('option', '', t('font_' + k)); o.value = k; font.append(o); }
      font.value = state.font || 'modern';
      font.addEventListener('change', () => { state.font = font.value; changed(); });
      look.append(el('span', 'b-label', t('look')), sw, font);
      root.append(look);

      // blocks
      const list = el('div', 'b-list');
      state.blocks.forEach((b, i) => {
        const def = BLOCKS[b.type];
        if (!def) return;
        const card = el('div', 'b-block' + (openId === b.id ? ' open' : ''));
        const head = el('div', 'b-head');
        const name = el('button', 'b-name');
        name.type = 'button';
        name.append(el('span', 'b-ic', def.icon), el('span', '', t('block_' + b.type)), el('span', 'b-sum', summary(b)));
        name.addEventListener('click', () => { openId = openId === b.id ? null : b.id; draw(); });
        const tools = el('div', 'b-tools');
        const tool = (txt, title, fn, dis) => { const x = el('button', 'b-tool', txt); x.type = 'button'; x.title = title; x.disabled = !!dis; x.addEventListener('click', fn); tools.append(x); };
        tool('↑', t('moveUp'), () => { state.blocks.splice(i - 1, 0, state.blocks.splice(i, 1)[0]); changed(); draw(); }, i === 0);
        tool('↓', t('moveDown'), () => { state.blocks.splice(i + 1, 0, state.blocks.splice(i, 1)[0]); changed(); draw(); }, i === state.blocks.length - 1);
        tool('✕', t('removeBlock'), () => { state.blocks.splice(i, 1); changed(); draw(); });
        head.append(name, tools);
        card.append(head);
        if (openId === b.id && def.fields.length) {
          const form = el('div', 'b-fields');
          for (const [key, kind] of def.fields) {
            const lab = el('label', 'b-field');
            lab.append(el('span', '', t('f_' + key + (kind === 'lines' ? '_' + b.type : ''))));
            const input = kind === 'long' || kind === 'lines' ? el('textarea') : el('input');
            if (input.tagName === 'INPUT') input.type = kind === 'url' ? 'url' : 'text';
            if (kind === 'lines') { input.rows = 4; input.placeholder = t('ph_' + b.type); }
            if (kind === 'long') input.rows = 3;
            if (kind === 'url') input.placeholder = b.type === 'video' ? 'https://www.youtube.com/watch?v=…' : 'https://…';
            input.value = b[key] || '';
            input.addEventListener('input', () => { b[key] = input.value; changed(); card.querySelector('.b-sum').textContent = summary(b); });
            lab.append(input);
            if (kind === 'lines') lab.append(el('small', '', t('hint_lines')));
            form.append(lab);
          }
          card.append(form);
        }
        list.append(card);
      });
      if (!state.blocks.length) list.append(el('div', 'b-empty', t('noBlocks')));
      root.append(list);

      // add block
      const add = el('div', 'b-add');
      add.append(el('span', 'b-label', t('addBlock')));
      for (const [type, def] of Object.entries(BLOCKS)) {
        const x = el('button', 'b-addbtn');
        x.type = 'button';
        x.append(el('span', 'b-ic', def.icon), el('span', '', t('block_' + type)));
        x.addEventListener('click', () => {
          const nb = { id: newId(), type };
          if (type === 'button') { nb.text = t('block_button'); nb.link = ''; }
          if (type === 'footer') nb.text = '©';
          // new blocks go above a footer, so the footer stays at the bottom
          const last = state.blocks[state.blocks.length - 1];
          const at = last && last.type === 'footer' && type !== 'footer' ? state.blocks.length - 1 : state.blocks.length;
          state.blocks.splice(at, 0, nb);
          openId = nb.id;
          changed(); draw();
          root.querySelector('.b-block.open')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
        add.append(x);
      }
      root.append(add);
    }
    function summary(b) {
      const v = b.title || b.heading || b.text || b.caption || b.url || (b.items || '').split('\n')[0] || '';
      return v ? ' · ' + String(v).slice(0, 40) : '';
    }
    draw();
  }

  window.Builder = { render, parse, stripData, template, mount, THEMES, FONTS };
})();
