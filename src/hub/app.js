'use strict';
/* browser.domain — everything Man Browser has in one place: its built-in pages, its tools, its shortcuts.
   Tool buttons go to man://browser.domain/cmd/<name>; Man Browser runs the command (only from this page). */
const $ = s => document.querySelector(s);
const lang = document.documentElement.lang === 'he' ? 'he' : 'en';
document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
const version = document.body.dataset.version && !document.body.dataset.version.includes('{') ? document.body.dataset.version : '';

const T = {
  en: {
    sub: 'Everything in Man Browser, in one place.', pages: 'Man Browser pages', tools: 'Tools', keys: 'Keyboard shortcuts',
    foot: 'browser.domain · Man Browser by Man Studio',
  },
  he: {
    sub: 'כל מה שיש ב-Man Browser, במקום אחד.', pages: 'הדפים של Man Browser', tools: 'כלים', keys: 'קיצורי מקלדת',
    foot: 'browser.domain · Man Browser מבית Man Studio',
  },
}[lang];

// built-in pages (addresses that exist only in Man Browser)
const PAGES = [
  { addr: 'browser.domain', icon: '🧭', en: ['This page', 'All of Man Browser in one place'], he: ['הדף הזה', 'כל Man Browser במקום אחד'] },
  { addr: 'manstudio.domain', icon: '✦', en: ['Free domains', 'Get a free domain and build a site, no code needed'], he: ['דומיינים בחינם', 'לוקחים דומיין בחינם ובונים אתר, גם בלי קוד'] },
  { addr: 'mail.domain', icon: '✉️', en: ['Man Mail', 'Your inbox: name@man.mail'], he: ['Man Mail', 'תיבת הדואר שלך: name@man.mail'] },
  { addr: 'search.domain', icon: '🔎', en: ['Man Search', 'Search Man Browser sites, Wikipedia and the web'], he: ['Man Search', 'חיפוש באתרי Man Browser, בוויקיפדיה וברשת'] },
  { addr: 'whatsnew.domain', icon: '🎁', en: ['What’s new', 'Everything that changed in each update'], he: ['מה חדש', 'כל מה שהשתנה בכל עדכון'] },
];

// tools: each one is a Man Browser command
const TOOLS = [
  ['settings', '⚙️', 'Settings', 'הגדרות'],
  ['account', '👤', 'Account', 'חשבון'],
  ['history', '🕘', 'History', 'היסטוריה'],
  ['downloads', '⬇️', 'Downloads', 'הורדות'],
  ['bookmarks', '🔖', 'Bookmarks', 'סימניות'],
  ['new-tab', '➕', 'New tab', 'כרטיסייה חדשה'],
  ['new-window', '🪟', 'New window', 'חלון חדש'],
  ['incognito', '🕶️', 'Incognito window', 'חלון גלישה בסתר'],
  ['reopen-tab', '↩️', 'Reopen closed tab', 'פתיחה מחדש של כרטיסייה'],
  ['find', '🔍', 'Find in page', 'חיפוש בדף'],
  ['zoom-in', '➕', 'Zoom in', 'הגדלה'],
  ['zoom-out', '➖', 'Zoom out', 'הקטנה'],
  ['zoom-reset', '🔁', 'Reset zoom', 'איפוס גודל'],
  ['fullscreen', '⛶', 'Full screen', 'מסך מלא'],
  ['print', '🖨️', 'Print', 'הדפסה'],
  ['devtools', '🛠️', 'Developer tools', 'כלי מפתחים'],
];

const KEYS = [
  ['Ctrl+T', 'New tab', 'כרטיסייה חדשה'], ['Ctrl+W', 'Close tab', 'סגירת כרטיסייה'],
  ['Ctrl+Shift+T', 'Reopen closed tab', 'פתיחה מחדש של כרטיסייה'], ['Ctrl+Tab', 'Next tab', 'הכרטיסייה הבאה'],
  ['Ctrl+1 … 9', 'Go to tab', 'מעבר לכרטיסייה'], ['Ctrl+N', 'New window', 'חלון חדש'],
  ['Ctrl+Shift+N', 'Incognito window', 'גלישה בסתר'], ['Ctrl+L / F6', 'Address bar', 'שורת הכתובת'],
  ['Ctrl+R / F5', 'Reload', 'רענון'], ['Alt+← / Alt+→', 'Back / Forward', 'אחורה / קדימה'],
  ['Ctrl+F', 'Find in page', 'חיפוש בדף'], ['Ctrl+D', 'Bookmark this page', 'הוספה לסימניות'],
  ['Ctrl+H', 'History', 'היסטוריה'], ['Ctrl+J', 'Downloads', 'הורדות'],
  ['Ctrl+= / Ctrl+-', 'Zoom in / out', 'הגדלה / הקטנה'], ['Ctrl+0', 'Reset zoom', 'איפוס גודל'],
  ['Ctrl+P', 'Print', 'הדפסה'], ['F11', 'Full screen', 'מסך מלא'], ['F12', 'Developer tools', 'כלי מפתחים'],
];

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

$('#sub').textContent = T.sub;
$('#ver').textContent = version ? 'v' + version : '';
$('#ver').hidden = !version;
$('#h-pages').textContent = T.pages;
$('#h-tools').textContent = T.tools;
$('#h-keys').textContent = T.keys;
$('#foot').textContent = T.foot;

for (const p of PAGES) {
  const [name, desc] = p[lang];
  const a = el('a', 'card');
  a.href = `man://${p.addr}/`;
  const tx = el('div');
  tx.append(el('b', '', name), el('span', 'addr', p.addr), el('span', 'd', desc));
  a.append(el('div', 'ic', p.icon), tx);
  $('#pages').append(a);
}
for (const [cmd, icon, en, he] of TOOLS) {
  const a = el('a', 'card');
  a.href = `man://browser.domain/cmd/${cmd}`; // Man Browser catches this and runs the command
  const tx = el('div');
  tx.append(el('b', '', lang === 'he' ? he : en));
  a.append(el('div', 'ic', icon), tx);
  $('#tools').append(a);
}
for (const [k, en, he] of KEYS) {
  const row = el('div', 'key');
  row.append(el('span', '', lang === 'he' ? he : en), el('kbd', '', k));
  $('#keys').append(row);
}
