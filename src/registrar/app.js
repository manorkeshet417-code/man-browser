'use strict';
/* manstudio.domain — free internal domains for Man Browser (our Cloudflare Worker + D1, see server/) */
const API = 'https://manstudio-domains.manstudiosupport.workers.dev';
const $ = s => document.querySelector(s);
const NAME_RE = /^[a-z0-9]([a-z0-9-]{0,40}[a-z0-9])?$/;
// Free endings. Keep in sync with server/src/index.js, main.js and src/renderer.js.
// `real: true` = also a real internet ending, so names that already exist online are refused.
const TLDS = [
  { tld: 'fun', real: true }, { tld: 'com', real: true }, { tld: 'net', real: true }, { tld: 'org', real: true },
  { tld: 'io', real: true }, { tld: 'app', real: true }, { tld: 'dev', real: true }, { tld: 'xyz', real: true },
  { tld: 'site', real: true }, { tld: 'online', real: true }, { tld: 'game', real: true }, { tld: 'me', real: true },
  { tld: 'blog', real: true }, { tld: 'art', real: true }, { tld: 'club', real: true }, { tld: 'store', real: true },
  { tld: 'tech', real: true }, { tld: 'co.ms', real: true }, { tld: 'ms', real: true },
  { tld: 'man', real: false }, { tld: 'web', real: false },
];
const TLD_RE = new RegExp(`^([a-z0-9-]+)\\.(${TLDS.map(x => x.tld.replace('.', '\\.')).join('|')})$`, 'i');

const TEXT = {
  en: {
    navMine: 'My domains', navRecent: 'New sites', heroTitle: 'Get a free domain. Build a site in seconds.',
    heroSub: 'Pick a name, claim it for free, and edit your site right here. It opens for everyone using Man Browser.',
    namePh: 'your-name', check: 'Check',
    comNote: '* Endings with a star are also real internet endings: they work only for names that don’t already exist online. Real websites always win. .man and .web are Man Browser only. Free domains open only inside Man Browser.',
    available: '{d} is available!', register: 'Get it free', taken: '{d} is already taken', visit: 'Visit',
    invalid: 'Use 1–42 letters, numbers or dashes (no dash at the start or end).', reserved: '{d} is reserved',
    real: '{d} already exists on the real internet, so it can’t be a free domain.', limit: 'You already have 10 domains — that’s the limit.',
    error: 'Something went wrong. Check your internet connection.', registered: '{d} is yours!',
    mineTitle: 'My domains', none: 'No domains yet — search for one above.', edit: 'Edit', views: '{n} visits',
    keyTitle: 'Owner key (your password for your domains)',
    keyText: 'Your domains are tied to this key. Copy it somewhere safe — if you clear browsing data you’ll need it to edit your sites again.',
    copy: 'Copy', copied: 'Key copied', keyPh: 'Paste a saved key', useKey: 'Use this key', keyBad: 'That key is too short',
    editing: 'Editing', close: 'Close', titlePh: 'Site title', save: 'Save', saved: 'Saved — your site is live',
    saveFail: 'Could not save', delete: 'Delete domain', confirmDel: 'Delete {d}? Anyone can register it after that.',
    deleted: 'Domain deleted', confirmTpl: 'Replace your code with this template?', unsaved: 'Unsaved changes',
    tplBlank: 'Template: blank', tplPersonal: 'Template: personal page', tplGame: 'Template: game studio', tplLinks: 'Template: link list',
    recentTitle: 'Newest free sites', noneRecent: 'Be the first to register a domain!',
    footer: 'manstudio.domain · by Man Studio · Free domains work only inside Man Browser',
  },
  he: {
    navMine: 'הדומיינים שלי', navRecent: 'אתרים חדשים', heroTitle: 'דומיין בחינם. אתר בכמה שניות.',
    heroSub: 'בוחרים שם, לוקחים אותו בחינם ועורכים את האתר כאן. הוא נפתח לכל מי שמשתמש ב-Man Browser.',
    namePh: 'השם-שלך', check: 'בדיקה',
    comNote: '* סיומות עם כוכבית קיימות גם באינטרנט האמיתי: הן עובדות רק לשמות שעוד לא קיימים שם. אתרים אמיתיים תמיד קודמים. ‎.man ו-‎.web שייכות רק ל-Man Browser. הדומיינים החינמיים נפתחים רק בתוך Man Browser.',
    available: '{d} פנוי!', register: 'לקחת בחינם', taken: '{d} כבר תפוס', visit: 'כניסה',
    invalid: 'אפשר 1–42 אותיות באנגלית, מספרים או מקפים (בלי מקף בהתחלה או בסוף).', reserved: '{d} שמור',
    real: '{d} כבר קיים באינטרנט האמיתי, ולכן אי אפשר לקחת אותו.', limit: 'יש לך כבר 10 דומיינים — זה המקסימום.',
    error: 'משהו השתבש. בדקו את החיבור לאינטרנט.', registered: '{d} שלך!',
    mineTitle: 'הדומיינים שלי', none: 'עוד אין לך דומיינים — חפשו אחד למעלה.', edit: 'עריכה', views: '{n} כניסות',
    keyTitle: 'מפתח בעלים (הסיסמה לדומיינים שלך)',
    keyText: 'הדומיינים שלך קשורים למפתח הזה. שמרו אותו במקום בטוח — אם תנקו את נתוני הגלישה תצטרכו אותו כדי לערוך שוב.',
    copy: 'העתקה', copied: 'המפתח הועתק', keyPh: 'הדביקו מפתח שמור', useKey: 'שימוש במפתח', keyBad: 'המפתח קצר מדי',
    editing: 'עורכים את', close: 'סגירה', titlePh: 'כותרת האתר', save: 'שמירה', saved: 'נשמר — האתר באוויר',
    saveFail: 'השמירה נכשלה', delete: 'מחיקת הדומיין', confirmDel: 'למחוק את {d}? אחרי זה כל אחד יוכל לקחת אותו.',
    deleted: 'הדומיין נמחק', confirmTpl: 'להחליף את הקוד בתבנית הזו?', unsaved: 'יש שינויים שלא נשמרו',
    tplBlank: 'תבנית: ריקה', tplPersonal: 'תבנית: דף אישי', tplGame: 'תבנית: סטודיו משחקים', tplLinks: 'תבנית: רשימת קישורים',
    recentTitle: 'האתרים החינמיים החדשים', noneRecent: 'היו הראשונים לקחת דומיין!',
    footer: 'manstudio.domain · מבית Man Studio · הדומיינים החינמיים עובדים רק בתוך Man Browser',
  },
};
// The language follows the browser's Settings (main.js writes it into <html lang>); English by default.
const lang = document.documentElement.lang === 'he' ? 'he' : 'en';
const t = (k, vars = {}) => (TEXT[lang][k] || TEXT.en[k] || k).replace(/\{(\w)\}/g, (_, v) => vars[v] ?? '');
function applyLang() {
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-t]').forEach(n => { n.textContent = t(n.dataset.t); });
  document.querySelectorAll('[data-tp]').forEach(n => { n.placeholder = t(n.dataset.tp); });
  fillTemplates();
}
function fillTlds() {
  const sel = $('#tld'), pills = $('#tlds');
  for (const { tld, real } of TLDS) {
    const o = document.createElement('option');
    o.value = tld; o.textContent = '.' + tld;
    sel.append(o);
    const p = document.createElement('button');
    p.type = 'button'; p.className = 'pill'; p.textContent = '.' + tld + (real ? '*' : '');
    p.addEventListener('click', () => { sel.value = tld; $('#name').focus(); });
    pills.append(p);
  }
}

/* ---------- owner key ---------- */
function getKey() {
  let k = '';
  try { k = localStorage.getItem('ms_owner_key') || ''; } catch { /* ignore */ }
  if (k.length < 20) {
    k = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, '');
    try { localStorage.setItem('ms_owner_key', k); } catch { /* ignore */ }
  }
  return k;
}
let ownerKey = getKey();

/* ---------- helpers ---------- */
async function rpc(fn, args) {
  const r = await fetch(`${API}/rpc/${fn}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(args || {}),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let toastT;
function toast(msg) {
  const n = $('#toast');
  n.textContent = msg; n.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { n.hidden = true; }, 2200);
}
const goTo = d => { location.href = `man://${d}/`; };

/* ---------- templates ---------- */
const TEMPLATES = {
  personal: (d, title) => `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: "Segoe UI", sans-serif;
         background: linear-gradient(135deg, #7c3aed, #db2777); color: white; text-align: center; }
  .card { background: rgba(255,255,255,.12); padding: 48px 56px; border-radius: 28px; backdrop-filter: blur(10px); }
  h1 { font-size: 48px; margin: 0 0 8px; }
  p { font-size: 18px; opacity: .9; }
  a { color: white; font-weight: 600; }
</style>
</head>
<body>
  <div class="card">
    <h1>👋 ${esc(title)}</h1>
    <p>Welcome to my site on <b>${esc(d)}</b></p>
    <p>Made with <a href="man://manstudio.domain/">manstudio.domain</a></p>
  </div>
</body>
</html>`,
  game: (d, title) => `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<style>
  body { margin: 0; font-family: "Segoe UI", sans-serif; background: #0d0b14; color: #eee; }
  header { padding: 80px 24px; text-align: center; background: radial-gradient(circle at top, #3b1d7a, #0d0b14 70%); }
  h1 { font-size: 56px; margin: 0; letter-spacing: 2px; }
  .games { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; max-width: 900px; margin: 30px auto; padding: 0 20px; }
  .game { background: #1a1626; border-radius: 16px; padding: 22px; border: 1px solid #2d2640; }
  .game h3 { margin: 0 0 6px; color: #a78bfa; }
  button { margin-top: 12px; padding: 10px 18px; border: 0; border-radius: 10px; background: #7c3aed; color: white; font-weight: 600; cursor: pointer; }
</style>
</head>
<body>
  <header><h1>🎮 ${esc(title)}</h1><p>Indie games made with love</p></header>
  <div class="games">
    <div class="game"><h3>Game One</h3><p>A short description of your first game.</p><button onclick="alert('Coming soon!')">Play</button></div>
    <div class="game"><h3>Game Two</h3><p>A short description of another game.</p><button onclick="alert('Coming soon!')">Play</button></div>
  </div>
</body>
</html>`,
  links: (d, title) => `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<style>
  body { margin: 0; min-height: 100vh; font-family: "Segoe UI", sans-serif; background: #f4f1fb; display: flex; justify-content: center; }
  main { width: min(420px, 92vw); padding: 60px 0; text-align: center; }
  .avatar { width: 96px; height: 96px; border-radius: 50%; margin: 0 auto 14px; background: linear-gradient(135deg,#7c3aed,#db2777); }
  a { display: block; margin: 12px 0; padding: 16px; border-radius: 14px; background: white; color: #222; text-decoration: none; font-weight: 600; box-shadow: 0 4px 14px rgba(60,30,120,.1); }
  a:hover { transform: translateY(-2px); }
</style>
</head>
<body>
  <main>
    <div class="avatar"></div>
    <h1>${esc(title)}</h1>
    <a href="https://www.youtube.com/">▶ My YouTube</a>
    <a href="https://github.com/">💻 My GitHub</a>
    <a href="man://manstudio.domain/">✦ Get your own free domain</a>
  </main>
</body>
</html>`,
  blank: (d, title) => `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
</head>
<body>
  <h1>${esc(title)}</h1>
</body>
</html>`,
};
function fillTemplates() {
  const s = $('#ed-template'), cur = s.value;
  s.innerHTML = '';
  for (const [v, k] of [['', '…'], ['personal', 'tplPersonal'], ['game', 'tplGame'], ['links', 'tplLinks'], ['blank', 'tplBlank']]) {
    const o = document.createElement('option');
    o.value = v; o.textContent = v ? t(k) : '—';
    s.append(o);
  }
  s.value = cur || '';
}

/* ---------- search & register ---------- */
function setResult(cls, html) {
  const r = $('#result');
  r.className = 'result ' + cls; r.innerHTML = html; r.hidden = false;
}
async function check() {
  const name = $('#name').value.trim().toLowerCase();
  const d = `${name}.${$('#tld').value}`;
  if (!NAME_RE.test(name)) return setResult('bad', `<span>${esc(t('invalid'))}</span>`);
  setResult('', '<span>…</span>');
  try {
    const [st, dnsRes] = await Promise.all([
      rpc('mb_site_check', { p_domain: d }),
      fetch(`/api/dns?host=${encodeURIComponent(d)}`).then(r => r.json()).catch(() => ({ exists: false })),
    ]);
    if (st === 'taken') {
      setResult('bad', `<b>${esc(t('taken', { d }))}</b><button class="ghost" id="r-visit">${esc(t('visit'))}</button>`);
      $('#r-visit').onclick = () => goTo(d);
    } else if (st === 'reserved') setResult('bad', `<b>${esc(t('reserved', { d }))}</b>`);
    else if (st !== 'ok') setResult('bad', `<span>${esc(t('invalid'))}</span>`);
    else if (dnsRes.exists) setResult('bad', `<span>${esc(t('real', { d }))}</span>`);
    else {
      setResult('ok', `<b>✓ ${esc(t('available', { d }))}</b><button class="primary" id="r-reg">${esc(t('register'))}</button>`);
      $('#r-reg').onclick = () => register(d);
    }
  } catch { setResult('bad', `<span>${esc(t('error'))}</span>`); }
}
async function register(d) {
  const title = d.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  try {
    const st = await rpc('mb_site_register', { p_domain: d, p_token: ownerKey, p_title: title, p_html: TEMPLATES.personal(d, title) });
    if (st === 'ok') {
      toast(t('registered', { d }));
      $('#result').hidden = true; $('#name').value = '';
      await loadMine();
      openEditor(mine.find(s => s.domain === d));
      loadRecent();
    } else if (st === 'limit') setResult('bad', `<span>${esc(t('limit'))}</span>`);
    else if (st === 'taken') setResult('bad', `<b>${esc(t('taken', { d }))}</b>`);
    else setResult('bad', `<span>${esc(t('invalid'))}</span>`);
  } catch { setResult('bad', `<span>${esc(t('error'))}</span>`); }
}

/* ---------- my domains ---------- */
let mine = [];
async function loadMine() {
  const list = $('#mine-list');
  try { mine = await rpc('mb_sites_mine', { p_token: ownerKey }); } catch { mine = []; }
  $('#mine-count').textContent = mine.length ? `${mine.length}/10` : '';
  list.innerHTML = '';
  if (!mine.length) { list.innerHTML = `<div class="empty">${esc(t('none'))}</div>`; return; }
  for (const s of mine) {
    const row = document.createElement('div');
    row.className = 'site';
    row.innerHTML = `<div class="ic">${esc(s.domain[0].toUpperCase())}</div>
      <div class="meta"><b>${esc(s.domain)}</b><span>${esc(s.title || '')} · ${esc(t('views', { n: s.views }))}</span></div>
      <button class="ghost small" data-a="visit">${esc(t('visit'))}</button>
      <button class="primary small" data-a="edit">${esc(t('edit'))}</button>`;
    row.querySelector('[data-a=visit]').onclick = () => goTo(s.domain);
    row.querySelector('[data-a=edit]').onclick = () => openEditor(s);
    list.append(row);
  }
}

/* ---------- editor ---------- */
let editing = null, dirty = false;
const preview = () => { $('#ed-preview').srcdoc = $('#ed-code').value; };
let previewT;
function openEditor(s) {
  if (!s) return;
  editing = s; dirty = false;
  $('#editor').hidden = false;
  $('#ed-domain').textContent = s.domain;
  $('#ed-title').value = s.title || '';
  $('#ed-code').value = s.html || '';
  $('#ed-status').textContent = '';
  $('#ed-template').value = '';
  preview();
  $('#editor').scrollIntoView({ behavior: 'smooth' });
}
function markDirty() { dirty = true; $('#ed-status').textContent = t('unsaved'); }
$('#ed-code').addEventListener('input', () => { markDirty(); clearTimeout(previewT); previewT = setTimeout(preview, 300); });
$('#ed-title').addEventListener('input', markDirty);
$('#ed-code').addEventListener('keydown', e => {
  if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '  '); }
  if (e.key === 's' && e.ctrlKey) { e.preventDefault(); save(); }
});
$('#ed-template').addEventListener('change', e => {
  const k = e.target.value;
  if (!k || !editing) return;
  if ($('#ed-code').value.trim() && !confirm(t('confirmTpl'))) { e.target.value = ''; return; }
  $('#ed-code').value = TEMPLATES[k](editing.domain, $('#ed-title').value || editing.domain);
  markDirty(); preview();
});
async function save() {
  if (!editing) return;
  try {
    const ok = await rpc('mb_site_update', { p_domain: editing.domain, p_token: ownerKey, p_title: $('#ed-title').value, p_html: $('#ed-code').value });
    if (!ok) throw new Error('denied');
    editing.title = $('#ed-title').value; editing.html = $('#ed-code').value; dirty = false;
    $('#ed-status').textContent = t('saved'); toast(t('saved'));
    loadMine();
  } catch { $('#ed-status').textContent = t('saveFail'); }
}
$('#ed-save').onclick = save;
$('#ed-visit').onclick = () => editing && goTo(editing.domain);
$('#ed-close').onclick = () => { $('#editor').hidden = true; editing = null; };
$('#ed-delete').onclick = async () => {
  if (!editing || !confirm(t('confirmDel', { d: editing.domain }))) return;
  try {
    await rpc('mb_site_delete', { p_domain: editing.domain, p_token: ownerKey });
    toast(t('deleted'));
    $('#editor').hidden = true; editing = null;
    loadMine(); loadRecent();
  } catch { toast(t('error')); }
};
window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

/* ---------- recent ---------- */
async function loadRecent() {
  const box = $('#recent-list');
  let rows = [];
  try { rows = await rpc('mb_sites_recent', {}); } catch { /* offline */ }
  box.innerHTML = rows.length ? '' : `<div class="empty">${esc(t('noneRecent'))}</div>`;
  for (const r of rows) {
    const a = document.createElement('a');
    a.className = 'chip'; a.href = `man://${r.domain}/`;
    a.innerHTML = `${esc(r.domain)}${r.title ? `<small>${esc(r.title)}</small>` : ''}`;
    box.append(a);
  }
}

/* ---------- key box ---------- */
$('#key').value = ownerKey;
$('#copy-key').onclick = async () => { try { await navigator.clipboard.writeText(ownerKey); toast(t('copied')); } catch { $('#key').select(); } };
$('#use-key').onclick = () => {
  const k = $('#key-in').value.trim();
  if (k.length < 20) return toast(t('keyBad'));
  ownerKey = k;
  try { localStorage.setItem('ms_owner_key', k); } catch { /* ignore */ }
  $('#key').value = k; $('#key-in').value = '';
  loadMine();
};

/* ---------- start ---------- */
$('#search').addEventListener('submit', e => { e.preventDefault(); check(); });
fillTlds();
applyLang();
loadMine();
loadRecent();
const want = new URLSearchParams(location.search).get('d');
if (want) {
  const m = TLD_RE.exec(want);
  if (m) { $('#name').value = m[1].toLowerCase(); $('#tld').value = m[2].toLowerCase(); check(); }
}
