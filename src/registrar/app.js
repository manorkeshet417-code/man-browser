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
  { tld: 'man', real: false, dev: true }, { tld: 'web', real: false },
];
// The signed-in Man Browser account (from the browser itself). `.man` belongs to Man Studio: only the dev sees it.
let account = null;
const isDev = () => !!account && account.role === 'dev';
const visibleTlds = () => TLDS.filter(x => !x.dev || isDev());
const TLD_RE = new RegExp(`^([a-z0-9-]+)\\.(${TLDS.map(x => x.tld.replace('.', '\\.')).join('|')})$`, 'i');

const TEXT = {
  en: {
    navMine: 'My domains', navRecent: 'New sites', heroTitle: 'Get a free domain. Build a site in seconds.',
    heroSub: 'Pick a name, claim it for free, and edit your site right here. It opens for everyone using Man Browser.',
    namePh: 'your-name', check: 'Check',
    comNote: '* Endings with a star are also real internet endings: they work only for names that don’t already exist online. Real websites always win. .web exists only in Man Browser. Free domains open only inside Man Browser.',
    devOnly: '.{d} belongs to Man Studio.', devPill: 'Man Studio only',
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
    modeBuilder: '✨ Builder', modeCode: '</> Code', publishNow: 'Publish now', saving: 'Publishing…',
    published: 'Published ✓ {n} — your site is live', saveFail: 'No connection to the server. Trying again…',
    tooBig: 'Your site is {n}. The limit is 30 MB. Tip: link to images (https://…) instead of pasting them into the code.',
    uploading: 'Uploading {n}…', loading: 'Opening…',
    pageLabel: 'Page', homePage: 'Home page (/)', addPage: '+ Add page', newPagePh: 'new page, e.g. about', delPage: 'Delete page',
    confirmDelPage: 'Delete the page /{d}?', pageAdded: 'Page /{d} added. Link to it with /{d}',
    tooManyPages: 'A site can have up to 50 pages.', siteFull: 'The whole site (all pages together) can be up to 30 MB.',
    bigCode: 'This site is {n}: too big to edit here (it would freeze the page). To change it, use “⬆ Upload .html” with the new file. The preview on the right shows the site.',
    notOwner: 'This browser doesn’t have the owner key for this site. Paste your saved key under “Owner key”.',
    upload: '⬆ Upload .html', uploaded: 'File loaded — publishing…',
    autoNote: 'Changes publish automatically.', toBuilder: 'Switch to the builder? Your code will be replaced with blocks.',
    look: 'Look', addBlock: 'Add a block', noBlocks: 'No blocks yet. Add one below.',
    moveUp: 'Move up', moveDown: 'Move down', removeBlock: 'Remove',
    theme_violet: 'Violet night', theme_ocean: 'Ocean', theme_sunset: 'Sunset', theme_forest: 'Forest', theme_candy: 'Candy', theme_mono: 'Clean',
    font_modern: 'Modern font', font_rounded: 'Rounded font', font_serif: 'Classic font', font_mono: 'Code font',
    block_hero: 'Header', block_text: 'Text', block_image: 'Image', block_button: 'Button', block_links: 'Links',
    block_cards: 'Cards', block_video: 'YouTube video', block_divider: 'Divider', block_footer: 'Footer',
    f_title: 'Title', f_subtitle: 'Subtitle', f_button: 'Button text', f_link: 'Button link', f_heading: 'Heading',
    f_body: 'Text', f_url: 'Link (URL)', f_caption: 'Caption', f_text: 'Text',
    f_items_links: 'Links', f_items_cards: 'Cards',
    ph_links: 'My YouTube | https://youtube.com\nMy game | man://mygame.fun', ph_cards: 'Fast | Loads in a second\nFree | Costs nothing',
    hint_lines: 'One per line. Use | between the two parts.',
    footer: 'manstudio.domain · by Man Studio · Free domains work only inside Man Browser',
    blocked: '{d} was removed by Man Studio and can’t be registered.',
    agree: 'By getting a domain you agree to the Terms of Use: no scams, malware, stolen content or anything illegal.',
    reportLink: 'Report a site', terms: 'Terms of Use', privacy: 'Privacy',
    reportTitle: 'Report a site', reportText: 'Tell Man Studio about a free site that is a scam, has malware, uses your work without permission, or breaks the rules. Man Studio reviews every report.',
    reportDomainPh: 'Site, e.g. something.fun', reportDetailsPh: 'What’s wrong? (optional, but it helps)', reportSend: 'Send report',
    reason: 'What’s the problem?', r_scam: 'Scam or fake login page', r_malware: 'Virus or harmful download', r_copyright: 'Uses my work without permission',
    r_hate: 'Hate, bullying or threats', r_adult: 'Adult content', r_illegal: 'Something else illegal', r_other: 'Other',
    reportSent: 'Thanks! Man Studio will look at it.', reportNoSite: 'There’s no free site called {d}.', reportTooMany: 'You sent a lot of reports today. Try again tomorrow.',
    reportsTitle: 'Reports (Man Studio only)', noReports: 'No open reports 🎉', reportsN: '{n} sites',
    nReports: '{n} reports', open: 'Open', dismiss: 'Keep site', remove: 'Remove site',
    confirmRemove: 'Remove {d} and block the name? This deletes the whole site and can’t be undone.',
    removed: '{d} was removed', dismissed: 'Reports closed', removePh: 'Remove any site, e.g. bad.fun', removeAny: 'Remove',
  },
  he: {
    navMine: 'הדומיינים שלי', navRecent: 'אתרים חדשים', heroTitle: 'דומיין בחינם. אתר בכמה שניות.',
    heroSub: 'בוחרים שם, לוקחים אותו בחינם ועורכים את האתר כאן. הוא נפתח לכל מי שמשתמש ב-Man Browser.',
    namePh: 'השם-שלך', check: 'בדיקה',
    comNote: '* סיומות עם כוכבית קיימות גם באינטרנט האמיתי: הן עובדות רק לשמות שעוד לא קיימים שם. אתרים אמיתיים תמיד קודמים. ‎.web קיימת רק ב-Man Browser. הדומיינים החינמיים נפתחים רק בתוך Man Browser.',
    devOnly: 'הסיומת ‎.{d} שייכת ל-Man Studio.', devPill: 'רק Man Studio',
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
    modeBuilder: '✨ בנייה בלי קוד', modeCode: '</> קוד', publishNow: 'פרסום עכשיו', saving: 'מפרסם…',
    published: 'פורסם ✓ {n} — האתר באוויר', saveFail: 'אין חיבור לשרת. מנסה שוב…',
    tooBig: 'האתר שוקל {n}. המקסימום הוא 30 MB. טיפ: לקשר לתמונות (https://…) במקום להדביק אותן בתוך הקוד.',
    uploading: 'מעלה {n}…', loading: 'פותח…',
    pageLabel: 'דף', homePage: 'דף הבית (/)', addPage: '+ הוספת דף', newPagePh: 'דף חדש, למשל about', delPage: 'מחיקת הדף',
    confirmDelPage: 'למחוק את הדף /{d}?', pageAdded: 'הדף /{d} נוסף. מקשרים אליו עם /{d}',
    tooManyPages: 'לאתר יכולים להיות עד 50 דפים.', siteFull: 'כל האתר יחד (כל הדפים) יכול להיות עד 30 MB.',
    bigCode: 'האתר שוקל {n}: גדול מדי לעריכה כאן (הדף היה נתקע). כדי לשנות אותו, משתמשים ב-“⬆ העלאת קובץ ‎.html” עם הקובץ החדש. התצוגה המקדימה מימין מראה את האתר.',
    notOwner: 'בדפדפן הזה אין את מפתח הבעלים של האתר. הדביקו את המפתח השמור תחת “מפתח בעלים”.',
    upload: '⬆ העלאת קובץ ‎.html', uploaded: 'הקובץ נטען — מפרסם…',
    autoNote: 'כל שינוי מתפרסם אוטומטית.', toBuilder: 'לעבור לבנייה בלי קוד? הקוד שלך יוחלף בבלוקים.',
    look: 'עיצוב', addBlock: 'הוספת בלוק', noBlocks: 'עוד אין בלוקים. הוסיפו אחד למטה.',
    moveUp: 'למעלה', moveDown: 'למטה', removeBlock: 'מחיקה',
    theme_violet: 'לילה סגול', theme_ocean: 'אוקיינוס', theme_sunset: 'שקיעה', theme_forest: 'יער', theme_candy: 'ממתק', theme_mono: 'נקי',
    font_modern: 'גופן מודרני', font_rounded: 'גופן מעוגל', font_serif: 'גופן קלאסי', font_mono: 'גופן קוד',
    block_hero: 'כותרת ראשית', block_text: 'טקסט', block_image: 'תמונה', block_button: 'כפתור', block_links: 'קישורים',
    block_cards: 'כרטיסים', block_video: 'סרטון יוטיוב', block_divider: 'קו מפריד', block_footer: 'שורה תחתונה',
    f_title: 'כותרת', f_subtitle: 'תת-כותרת', f_button: 'טקסט הכפתור', f_link: 'קישור הכפתור', f_heading: 'כותרת',
    f_body: 'טקסט', f_url: 'קישור (URL)', f_caption: 'כיתוב', f_text: 'טקסט',
    f_items_links: 'קישורים', f_items_cards: 'כרטיסים',
    ph_links: 'היוטיוב שלי | https://youtube.com\nהמשחק שלי | man://mygame.fun', ph_cards: 'מהיר | נטען בשנייה\nחינם | לא עולה כלום',
    hint_lines: 'אחד בכל שורה. שמים | בין שני החלקים.',
    footer: 'manstudio.domain · מבית Man Studio · הדומיינים החינמיים עובדים רק בתוך Man Browser',
    blocked: 'Man Studio הסירה את {d}, ואי אפשר לרשום אותו.',
    agree: 'כשלוקחים דומיין מסכימים לתנאי השימוש: בלי הונאות, וירוסים, תוכן גנוב או משהו לא חוקי.',
    reportLink: 'דיווח על אתר', terms: 'תנאי שימוש', privacy: 'פרטיות',
    reportTitle: 'דיווח על אתר', reportText: 'ספרו ל-Man Studio על אתר חינמי שהוא הונאה, מפיץ וירוסים, משתמש ביצירה שלכם בלי רשות או עובר על הכללים. Man Studio בודקת כל דיווח.',
    reportDomainPh: 'האתר, למשל something.fun', reportDetailsPh: 'מה הבעיה? (לא חובה, אבל זה עוזר)', reportSend: 'שליחת דיווח',
    reason: 'מה הבעיה?', r_scam: 'הונאה או דף כניסה מזויף', r_malware: 'וירוס או הורדה מזיקה', r_copyright: 'משתמש ביצירה שלי בלי רשות',
    r_hate: 'שנאה, בריונות או איומים', r_adult: 'תוכן למבוגרים', r_illegal: 'משהו אחר לא חוקי', r_other: 'אחר',
    reportSent: 'תודה! Man Studio תבדוק את זה.', reportNoSite: 'אין אתר חינמי בשם {d}.', reportTooMany: 'שלחת הרבה דיווחים היום. אפשר לנסות שוב מחר.',
    reportsTitle: 'דיווחים (רק Man Studio)', noReports: 'אין דיווחים פתוחים 🎉', reportsN: '{n} אתרים',
    nReports: '{n} דיווחים', open: 'פתיחה', dismiss: 'להשאיר', remove: 'להסיר את האתר',
    confirmRemove: 'להסיר את {d} ולחסום את השם? כל האתר יימחק ואי אפשר לבטל.',
    removed: '{d} הוסר', dismissed: 'הדיווחים נסגרו', removePh: 'הסרת כל אתר, למשל bad.fun', removeAny: 'הסרה',
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
  sel.innerHTML = ''; pills.innerHTML = '';
  for (const { tld, real, dev } of visibleTlds()) {
    const o = document.createElement('option');
    o.value = tld; o.textContent = '.' + tld;
    sel.append(o);
    const p = document.createElement('button');
    p.type = 'button'; p.className = 'pill' + (dev ? ' dev' : ''); p.textContent = '.' + tld + (real ? '*' : '');
    if (dev) p.title = t('devPill');
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
  if (!r.ok) {
    let code = 'http_' + r.status;
    try { code = (await r.json()).error || code; } catch { /* not JSON */ }
    const err = new Error(code); err.code = code; err.status = r.status;
    throw err;
  }
  return r.json();
}
const MAX_SITE_BYTES = 30 * 1024 * 1024; // same limit as the server (server/src/index.js MAX_SITE)
const byteSize = s => new Blob([s]).size; // real UTF-8 size (Hebrew letters take 2 bytes)
const fmtSize = n => (n >= 1024 * 1024 ? (n / 1024 / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
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
      rpc('mb_site_check', { p_domain: d, p_session: account && account.session }),
      fetch(`/api/dns?host=${encodeURIComponent(d)}`).then(r => r.json()).catch(() => ({ exists: false })),
    ]);
    if (st === 'taken') {
      setResult('bad', `<b>${esc(t('taken', { d }))}</b><button class="ghost" id="r-visit">${esc(t('visit'))}</button>`);
      $('#r-visit').onclick = () => goTo(d);
    } else if (st === 'reserved') setResult('bad', `<b>${esc(t('reserved', { d }))}</b>`);
    else if (st === 'dev_only') setResult('bad', `<b>${esc(t('devOnly', { d: d.split('.').slice(1).join('.') }))}</b>`);
    else if (st === 'blocked') setResult('bad', `<b>${esc(t('blocked', { d }))}</b>`);
    else if (st !== 'ok') setResult('bad', `<span>${esc(t('invalid'))}</span>`);
    else if (dnsRes.exists) setResult('bad', `<span>${esc(t('real', { d }))}</span>`);
    else {
      setResult('ok', `<b>✓ ${esc(t('available', { d }))}</b><button class="primary" id="r-reg">${esc(t('register'))}</button>` +
        `<small class="agree">${esc(t('agree'))} <a href="${TERMS_URL()}">${esc(t('terms'))}</a></small>`);
      $('#r-reg').onclick = () => register(d);
    }
  } catch { setResult('bad', `<span>${esc(t('error'))}</span>`); }
}
async function register(d) {
  const title = d.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  try {
    const st = await rpc('mb_site_register', { p_domain: d, p_token: ownerKey, p_session: account && account.session, p_title: title, p_html: Builder.render(Builder.template('personal', title, d), title) });
    if (st === 'ok') {
      toast(t('registered', { d }));
      $('#result').hidden = true; $('#name').value = '';
      await loadMine();
      openEditor(mine.find(s => s.domain === d));
      loadRecent();
    } else if (st === 'limit') setResult('bad', `<span>${esc(t('limit'))}</span>`);
    else if (st === 'taken') setResult('bad', `<b>${esc(t('taken', { d }))}</b>`);
    else if (st === 'dev_only') setResult('bad', `<b>${esc(t('devOnly', { d: d.split('.').slice(1).join('.') }))}</b>`);
    else if (st === 'blocked') setResult('bad', `<b>${esc(t('blocked', { d }))}</b>`);
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
      <div class="meta"><b>${esc(s.domain)}</b><span>${esc(s.title || '')} · ${esc(t('views', { n: s.views }))}${s.size ? ' · ' + fmtSize(s.size) : ''}</span></div>
      <button class="ghost small" data-a="visit">${esc(t('visit'))}</button>
      <button class="primary small" data-a="edit">${esc(t('edit'))}</button>`;
    row.querySelector('[data-a=visit]').onclick = () => goTo(s.domain);
    row.querySelector('[data-a=edit]').onclick = () => openEditor(s);
    list.append(row);
  }
}

/* ---------- editor: no-code builder + code, auto-publish ---------- */
// No "unsaved changes" guard here: Electron silently cancels navigation when a page blocks unload,
// which made Visit and the address bar do nothing. Instead every change is published automatically.
let editing = null, mode = 'builder', bstate = null, saveT = null, saving = false, pending = false;
const codeBox = () => $('#ed-code');
const BIG_CODE = 1024 * 1024; // above this, the code isn't put in the text box
let bigCode = null, previewUrl = null;
const getCode = () => (bigCode != null ? bigCode : codeBox().value);
function setCode(v) {
  v = String(v || '');
  const box = codeBox();
  if (v.length > BIG_CODE) {
    bigCode = v;
    box.value = '';
    box.readOnly = true;
    box.placeholder = t('bigCode', { n: fmtSize(byteSize(v)) }).replace('{n}', fmtSize(byteSize(v)));
    box.classList.add('big');
  } else {
    bigCode = null;
    box.readOnly = false;
    box.placeholder = '';
    box.classList.remove('big');
    box.value = v;
  }
}
const preview = () => {
  // a blob URL is much lighter than srcdoc for big pages
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(new Blob([getCode()], { type: 'text/html;charset=utf-8' })); // Hebrew shows right even without <meta charset>
  $('#ed-preview').removeAttribute('srcdoc');
  $('#ed-preview').src = previewUrl;
};
let previewT;
function setStatus(key, cls, n) { const s = $('#ed-status'); s.textContent = t(key, { n }); s.className = 'dim ' + (cls || ''); }
function setMode(m) {
  mode = m;
  $('#mode-builder').classList.toggle('on', m === 'builder');
  $('#mode-code').classList.toggle('on', m === 'code');
  $('#ed-builder').hidden = m !== 'builder';
  codeBox().hidden = m !== 'code';
}
function builderChanged() {
  setCode(Builder.render(bstate, $('#ed-title').value || (editing && editing.domain)));
  clearTimeout(previewT); previewT = setTimeout(preview, 150);
  scheduleSave();
}
async function openEditor(s) {
  if (!s) return;
  if (s.html == null) { // big site: download it first
    setStatus('loading');
    try {
      const r = await fetch(`${API}/site/${encodeURIComponent(s.domain)}?noview=1`, { cache: 'no-store' });
      if (!r.ok) throw new Error('http ' + r.status);
      s.html = await r.text();
    } catch { toast(t('error')); return; }
  }
  editing = s;
  curPath = '';
  $('#editor').hidden = false;
  $('#ed-domain').textContent = s.domain;
  showPage(s.title || '', s.html || '');
  setStatus('autoNote');
  $('#editor').scrollIntoView({ behavior: 'smooth' });
  loadPages();
}
// put one page's content into the editor (builder if it was made with blocks, otherwise code)
function showPage(title, html) {
  $('#ed-title').value = title;
  setCode(html);
  $('#ed-template').value = '';
  bstate = Builder.parse(html);
  if (bstate) { setMode('builder'); Builder.mount($('#ed-builder'), bstate, builderChanged, t); }
  else setMode('code');
  preview();
}

/* ---------- pages: a site is a home page + up to 50 more (man://site.fun/about, /games/one, /style.css …) ---------- */
let curPath = '', pagesList = [];
const pageUrl = (d, path) => `${API}/site/${encodeURIComponent(d)}${path ? '/' + path.split('/').map(encodeURIComponent).join('/') : ''}`;
async function loadPages() {
  if (!editing) return;
  try {
    const r = await fetch(`${API}/pages/${encodeURIComponent(editing.domain)}`, { cache: 'no-store' });
    pagesList = r.ok ? await r.json() : [{ path: '' }];
  } catch { pagesList = [{ path: '' }]; }
  fillPages();
}
function fillPages() {
  const sel = $('#ed-page');
  sel.innerHTML = '';
  for (const pg of pagesList) {
    const o = document.createElement('option');
    o.value = pg.path;
    o.textContent = pg.path ? '/' + pg.path : t('homePage');
    sel.append(o);
  }
  sel.value = curPath;
  $('#ed-delpage').disabled = !curPath;
}
async function openPage(path) {
  if (!editing || path === curPath) return;
  await save(); // keep what was typed on the page we're leaving
  if (path === '') { curPath = ''; showPage(editing.title || '', editing.html || ''); fillPages(); return; }
  setStatus('loading');
  try {
    const r = await fetch(pageUrl(editing.domain, path) + '?noview=1', { cache: 'no-store' });
    if (!r.ok) throw new Error('http ' + r.status);
    const html = await r.text();
    curPath = path;
    let title = '';
    try { title = decodeURIComponent(r.headers.get('X-Title') || ''); } catch { /* ignore */ }
    showPage(title, html);
    setStatus('autoNote');
  } catch { setStatus('saveFail', 'bad'); }
  fillPages();
}
const slugOf = v => String(v || '').trim().toLowerCase().replace(/^\/+|\/+$/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9._\-/]/g, '').slice(0, 80);
$('#ed-page').addEventListener('change', e => openPage(e.target.value));
$('#ed-addpage').onclick = async () => {
  if (!editing) return;
  const path = slugOf($('#ed-newpage').value);
  if (!path || path === 'index.html') { $('#ed-newpage').focus(); return; }
  $('#ed-newpage').value = '';
  if (pagesList.some(pg => pg.path === path)) { openPage(path); return; }
  if (pagesList.length > 50) { setStatus('tooManyPages', 'bad'); return; }
  await save();
  const title = path.split('/').pop().replace(/[-_.]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const html = Builder.render(Builder.template('page', title, editing.domain), title);
  try {
    await publish(editing.domain, title, html, false, path);
    pagesList.push({ path, size: html.length });
    pagesList.sort((a, b) => a.path.localeCompare(b.path));
    curPath = path;
    showPage(title, html);
    fillPages();
    toast(t('pageAdded', { d: path }));
  } catch (err) { setStatus(err && err.code === 'too_many_pages' ? 'tooManyPages' : 'saveFail', 'bad'); }
};
$('#ed-newpage').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#ed-addpage').click(); } });
$('#ed-delpage').onclick = async () => {
  if (!editing || !curPath || !confirm(t('confirmDelPage', { d: curPath }))) return;
  clearTimeout(saveT); saveT = null; pending = false; // nothing more may be saved to the page being deleted
  const gone = curPath;
  try {
    const r = await fetch(pageUrl(editing.domain, gone), { method: 'DELETE', headers: { 'X-Owner-Key': ownerKey } });
    if (!r.ok) throw new Error('http ' + r.status);
  } catch { toast(t('error')); return; }
  pagesList = pagesList.filter(pg => pg.path !== gone);
  curPath = '';
  showPage(editing.title || '', editing.html || '');
  fillPages();
  setStatus('autoNote');
};
function scheduleSave() {
  if (!editing) return;
  setStatus('saving');
  clearTimeout(saveT);
  saveT = setTimeout(save, getCode().length > 2e6 ? 3000 : 800);
}
async function publish(domain, title, html, keepalive, path = curPath) {
  const r = await fetch(pageUrl(domain, path), {
    method: 'PUT', keepalive: !!keepalive,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Owner-Key': ownerKey, 'X-Title': encodeURIComponent(title) },
    body: html,
  });
  let res = {};
  try { res = await r.json(); } catch { /* not JSON */ }
  if (r.ok && res.ok) return res;
  const err = new Error(res.error || 'http_' + r.status);
  err.code = res.error || 'http_' + r.status;
  throw err;
}
async function save() {
  if (!editing) return;
  clearTimeout(saveT);
  if (saving) { pending = true; return; }
  saving = true;
  const title = $('#ed-title').value, html = getCode();
  const size = byteSize(html);
  // too big: say so (and how big) instead of retrying forever
  if (size > MAX_SITE_BYTES) { setStatus('tooBig', 'bad', fmtSize(size)); saving = false; return; }
  if (size > 2e6) setStatus('uploading', '', fmtSize(size));
  try {
    await publish(editing.domain, title, html);
    if (!curPath) { editing.title = title; editing.html = html; editing.size = size; }
    setStatus('published', 'ok', new Date().toLocaleTimeString(lang === 'he' ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' }) + ' · ' + fmtSize(size));
  } catch (e) {
    const code = e && e.code;
    if (code === 'too_big') { setStatus('tooBig', 'bad', fmtSize(size)); return; }
    if (code === 'site_full') { setStatus('siteFull', 'bad'); return; }
    if (code === 'too_many_pages') { setStatus('tooManyPages', 'bad'); return; }
    if (code === 'not_owner' || code === 'bad_token' || code === 'no_site') { setStatus('notOwner', 'bad'); return; } // retrying won't help
    setStatus('saveFail', 'bad');
    saveT = setTimeout(save, 5000); // network problem: try again
  } finally {
    saving = false;
    if (pending) { pending = false; save(); }
  }
}
$('#mode-builder').onclick = () => {
  if (mode === 'builder' || !editing) return;
  if (!bstate) {
    if (getCode().trim() && !confirm(t('toBuilder'))) return;
    bstate = Builder.template('personal', $('#ed-title').value, editing.domain);
  }
  setMode('builder');
  Builder.mount($('#ed-builder'), bstate, builderChanged, t);
  builderChanged();
};
$('#mode-code').onclick = () => { if (editing) setMode('code'); };
// Upload an .html file: it replaces the code and publishes
$('#ed-upload').onclick = () => $('#ed-file').click();
$('#ed-file').addEventListener('change', async e => {
  const f = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!f || !editing) return;
  const text = await f.text();
  if (getCode().trim() && !confirm(t('confirmTpl'))) return;
  bstate = Builder.parse(text);
  if (bstate) { setMode('builder'); Builder.mount($('#ed-builder'), bstate, builderChanged, t); }
  else setMode('code');
  setCode(text);
  if (!$('#ed-title').value.trim()) {
    const m = /<title>([^<]*)<\/title>/i.exec(text);
    if (m) $('#ed-title').value = m[1].trim().slice(0, 120);
  }
  preview();
  setStatus('uploaded');
  save();
});
codeBox().addEventListener('input', () => {
  // hand-edited code no longer matches the blocks: drop the builder data so the code wins next time
  if (bstate || /<!--msb:/.test(codeBox().value)) {
    const pos = codeBox().selectionStart, before = codeBox().value.length;
    codeBox().value = Builder.stripData(codeBox().value);
    const p = Math.max(0, pos - (before - codeBox().value.length));
    codeBox().setSelectionRange(p, p);
    bstate = null;
  }
  clearTimeout(previewT); previewT = setTimeout(preview, 300);
  scheduleSave();
});
$('#ed-title').addEventListener('input', () => { if (mode === 'builder' && bstate) builderChanged(); else scheduleSave(); });
codeBox().addEventListener('keydown', e => {
  if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '  '); }
  if (e.key === 's' && e.ctrlKey) { e.preventDefault(); save(); }
});
$('#ed-template').addEventListener('change', e => {
  const k = e.target.value;
  if (!k || !editing) return;
  if (!confirm(t('confirmTpl'))) { e.target.value = ''; return; }
  if (mode === 'builder') {
    bstate = Builder.template(k, $('#ed-title').value, editing.domain);
    Builder.mount($('#ed-builder'), bstate, builderChanged, t);
    builderChanged();
  } else {
    bstate = null;
    setCode(TEMPLATES[k](editing.domain, $('#ed-title').value || editing.domain));
    preview(); scheduleSave();
  }
  e.target.value = '';
});
$('#ed-save').onclick = save;
// Leaving the page (address bar, link, closing the tab) right after an edit: send the last change
// with keepalive so it still reaches the server. Browsers allow up to 64 KB this way.
window.addEventListener('pagehide', () => {
  if (!editing || !saveT) return;
  clearTimeout(saveT); saveT = null;
  const html = getCode();
  if (html.length > 63000 || byteSize(html) > 63000) return;
  try { publish(editing.domain, $('#ed-title').value, html, true).catch(() => {}); } catch { /* ignore */ }
});
$('#ed-visit').onclick = async () => { if (!editing) return; await save(); goTo(editing.domain + (curPath ? '/' + curPath : '')); };
$('#ed-close').onclick = async () => { await save(); $('#editor').hidden = true; editing = null; loadMine(); };
$('#ed-delete').onclick = async () => {
  if (!editing || !confirm(t('confirmDel', { d: editing.domain }))) return;
  clearTimeout(saveT);
  try {
    await rpc('mb_site_delete', { p_domain: editing.domain, p_token: ownerKey });
    toast(t('deleted'));
    $('#editor').hidden = true; editing = null;
    loadMine(); loadRecent();
  } catch { toast(t('error')); }
};

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

/* ---------- legal pages (on the public website) ---------- */
const SITE = 'https://manorkeshet417-code.github.io/man-browser/';
const TERMS_URL = () => SITE + (lang === 'he' ? 'terms-he.html' : 'terms.html');
const PRIVACY_URL = () => SITE + (lang === 'he' ? 'privacy-he.html' : 'privacy.html');
$('#f-terms').href = TERMS_URL();
$('#f-privacy').href = PRIVACY_URL();

/* ---------- report a site (anyone) ---------- */
const REASONS = ['scam', 'malware', 'copyright', 'hate', 'adult', 'illegal', 'other'];
function showReport(domain) {
  const sel = $('#report-reason');
  sel.innerHTML = `<option value="" disabled selected>${esc(t('reason'))}</option>` +
    REASONS.map(r => `<option value="${r}">${esc(t('r_' + r))}</option>`).join('');
  $('#report-domain').value = domain || '';
  $('#report').hidden = false;
  $('#report').scrollIntoView({ behavior: 'smooth', block: 'start' });
  (domain ? sel : $('#report-domain')).focus();
}
$('#f-report').onclick = e => { e.preventDefault(); showReport(''); };
$('#report-form').addEventListener('submit', async e => {
  e.preventDefault();
  const d = $('#report-domain').value.trim().toLowerCase().replace(/^man:\/\/|^https?:\/\//, '').split('/')[0];
  const reason = $('#report-reason').value;
  if (!d || !reason) return;
  const btn = e.submitter; if (btn) btn.disabled = true;
  try {
    const r = await rpc('mb_report', { p_domain: d, reason, details: $('#report-details').value, p_session: account && account.session });
    if (r.ok) { toast(t('reportSent')); $('#report-details').value = ''; $('#report').hidden = true; }
    else if (r.error === 'no_site') toast(t('reportNoSite', { d }));
    else if (r.error === 'too_many') toast(t('reportTooMany'));
    else toast(t('error'));
  } catch { toast(t('error')); }
  if (btn) btn.disabled = false;
});

/* ---------- reports panel (Man Studio only) ---------- */
async function loadReports() {
  if (!isDev()) return;
  $('#reports').hidden = false;
  const box = $('#reports-list');
  let r;
  try { r = await rpc('dev_reports', { token: account.session }); } catch { box.textContent = t('error'); return; }
  const list = (r && r.reports) || [];
  $('#reports-count').textContent = list.length ? t('reportsN', { n: list.length }) : '';
  box.innerHTML = list.length ? '' : `<div class="empty">${esc(t('noReports'))}</div>`;
  for (const s of list) {
    const row = document.createElement('div');
    row.className = 'site report-row';
    const reasons = String(s.reasons || '').split(',').map(x => t('r_' + x)).join(' · ');
    const det = (s.details || []).map(x => `<li>${esc(x.details)}</li>`).join('');
    row.innerHTML = `<div class="info"><b>${esc(s.domain)}</b> <span class="dim">${esc(t('nReports', { n: s.n }))} · ${esc(reasons)}</span>` +
      (det ? `<ul class="dim">${det}</ul>` : '') + `</div>` +
      `<div class="row tight"><button class="ghost" data-a="open">${esc(t('open'))}</button>` +
      `<button class="ghost" data-a="dismiss">${esc(t('dismiss'))}</button><button class="danger" data-a="remove">${esc(t('remove'))}</button></div>`;
    row.querySelector('[data-a=open]').onclick = () => goTo(s.domain);
    row.querySelector('[data-a=dismiss]').onclick = async () => {
      try { await rpc('dev_dismiss', { token: account.session, p_domain: s.domain }); toast(t('dismissed')); } catch { toast(t('error')); }
      loadReports();
    };
    row.querySelector('[data-a=remove]').onclick = () => devRemove(s.domain, reasons);
    box.append(row);
  }
}
async function devRemove(d, reason) {
  if (!confirm(t('confirmRemove', { d }))) return;
  try {
    const r = await rpc('dev_remove', { token: account.session, p_domain: d, reason: reason || '' });
    toast(r.ok ? t('removed', { d }) : t('error'));
  } catch { toast(t('error')); }
  loadReports(); loadRecent(); loadMine();
}
$('#remove-form').addEventListener('submit', e => {
  e.preventDefault();
  const d = $('#remove-domain').value.trim().toLowerCase().replace(/^man:\/\/|^https?:\/\//, '').split('/')[0];
  if (d) devRemove(d, 'removed by Man Studio').then(() => { $('#remove-domain').value = ''; });
});

/* ---------- start ---------- */
$('#search').addEventListener('submit', e => { e.preventDefault(); check(); });
applyLang();
loadMine();
loadRecent();
(async () => {
  try { account = await fetch('/api/account', { cache: 'no-store' }).then(r => r.json()); } catch { account = null; }
  fillTlds();
  loadReports();
  const q = new URLSearchParams(location.search);
  if (q.has('report')) showReport(q.get('report'));
  const want = q.get('d');
  const m = want && TLD_RE.exec(want);
  if (m) {
    $('#name').value = m[1].toLowerCase();
    if (visibleTlds().some(x => x.tld === m[2].toLowerCase())) { $('#tld').value = m[2].toLowerCase(); check(); }
    else setResult('bad', `<b>${esc(t('devOnly', { d: m[2].toLowerCase() }))}</b>`);
  }
})();
