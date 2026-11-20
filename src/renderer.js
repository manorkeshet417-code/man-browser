'use strict';
const api = window.mb;
const INCOG = new URLSearchParams(location.search).has('incognito');
const $ = s => document.querySelector(s);
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

/* ================= icons ================= */
const ICONS = {
  back: '<path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>',
  forward: '<path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>',
  reload: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  stop: '<path d="M6 6l12 12M18 6L6 18"/>',
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M7 7l10 10M17 7L7 17"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  shield: '<path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
  download: '<path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M5 20h14"/>',
  history: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  bookmarks: '<path d="M7 3.5h10v17l-5-3.5-5 3.5z"/>',
  menu: '<circle cx="12" cy="5.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="18.5" r="1.4" fill="currentColor" stroke="none"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/>',
  warn: '<path d="M12 3.5l9 16H3z"/><path d="M12 10v4M12 17v.01"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.6 2.6 14.4 0 17M12 3.5c-2.6 2.6-2.6 14.4 0 17"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  sound: '<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  muted: '<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
  mask: '<path d="M3 11h18"/><path d="M6 11l2.2-5.5h7.6L18 11"/><circle cx="7.5" cy="15.5" r="2.8"/><circle cx="16.5" cy="15.5" r="2.8"/><path d="M10.3 15.3c1.1-.6 2.3-.6 3.4 0"/>',
  folder: '<path d="M3.5 6.5h6l2 2h9v10h-17z"/>',
  file: '<path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4"/>',
  pause: '<path d="M9 6v12M15 6v12"/>',
  play: '<path d="M8 5.5v13l10-6.5z"/>',
  spark: '<path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  user: '<circle cx="12" cy="8.5" r="4"/><path d="M4.5 20.5c0-4.2 3.4-6.8 7.5-6.8s7.5 2.6 7.5 6.8"/>',
  gift: '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8.5h14V12M12 8v12.5"/><path d="M12 8C10 4 6.5 4.5 7.5 7c.4 1 2.5 1 4.5 1zM12 8c2-4 5.5-3.5 4.5-1-.4 1-2.5 1-4.5 1z"/>',
};
const svg = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
function setIcon(node, name) {
  node.dataset.icon = name;
  const old = node.querySelector(':scope > svg');
  if (old) old.remove();
  node.insertAdjacentHTML('afterbegin', svg(name));
}
const paintIcons = () => document.querySelectorAll('[data-icon]').forEach(n => setIcon(n, n.dataset.icon));

/* ================= text ================= */
const ENGINES = {
  man: { name: 'Man Search', url: 'man://search.domain/?q=%s' }, // Man Browser sites + Wikipedia + links to the web
  google: { name: 'Google', url: 'https://www.google.com/search?q=%s' },
  duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s' },
  bing: { name: 'Bing', url: 'https://www.bing.com/search?q=%s' },
  brave: { name: 'Brave Search', url: 'https://search.brave.com/search?q=%s' },
};
const I18N = {
  en: {
    newTab: 'New tab', back: 'Back', forward: 'Forward', reload: 'Reload', stop: 'Stop', home: 'Home',
    addrPh: 'Search or type a web address', searchPh: 'Search the web', searchWith: 'Search with {n}',
    mostVisited: 'Most visited', bookmark: 'Bookmark this page', removeBm: 'Remove bookmark',
    downloads: 'Downloads', history: 'History', bookmarks: 'Bookmarks', menu: 'Menu', settings: 'Settings',
    blocked: 'Ad & tracker blocker', blockedHere: '{n} blocked on this page', blockedTotalN: '{n} ads & trackers blocked so far',
    newWindow: 'New window', incognito: 'New incognito window', find: 'Find in page', print: 'Print…',
    zoom: 'Zoom', zoomIn: 'Zoom in', zoomOut: 'Zoom out', zoomReset: 'Reset zoom', devtools: 'Developer tools',
    about: 'About', fullscreen: 'Full screen', reopen: 'Reopen closed tab', duplicate: 'Duplicate',
    mute: 'Mute tab', unmute: 'Unmute tab', close: 'Close', closeOthers: 'Close other tabs', closeRight: 'Close tabs after this one',
    newTabRight: 'New tab after this one', noHistory: 'No history yet', noDownloads: 'No downloads yet', noBookmarks: 'No bookmarks yet',
    searchHistory: 'Search history', clearHistory: 'Clear all', historyCleared: 'History cleared',
    open: 'Open', openNewTab: 'Open in new tab', showFolder: 'Show in folder', cancel: 'Cancel', pause: 'Pause', resume: 'Resume',
    paused: 'Paused', done: 'Done', failed: 'Failed', cancelled: 'Cancelled', remove: 'Remove',
    searchEngine: 'Search engine', homepage: 'Home page', homepageHint: 'Leave empty to use the new tab page',
    theme: 'Theme', themeSystem: 'System', themeLight: 'Light', themeDark: 'Dark', language: 'Language',
    adblock: 'Block ads & trackers', showBar: 'Show bookmarks bar',
    startup: 'On startup', startupNew: 'Open the new tab page', startupRestore: 'Continue where I left off',
    langHint: 'Menus, pages and websites switch right away', whatsNew: 'What’s new',
    updateBtn: 'Restart to update', updateReady: 'Man Browser {n} is ready. It installs when you restart or close the browser.',
    account: 'Account', signIn: 'Sign in', signUp: 'Create account', signOut: 'Sign out', username: 'Username', password: 'Password',
    confirmPassword: 'Confirm password', acctNote: 'You stay signed in until you sign out, even after closing the browser.',
    signedInAs: 'Signed in', devNote: 'You’re the Man Studio developer: you can use .man domains at manstudio.domain.',
    welcome: 'Welcome, {n}!', signedOut: 'Signed out',
    err_wrong: 'Wrong username or password.', err_locked: 'Too many wrong tries. Try again in 15 minutes.',
    err_taken: 'That username is already taken.', err_bad_username: 'Username: 3–24 letters or numbers (spaces, dots, - and _ are fine in the middle).',
    err_bad_password: 'Password: at least 8 characters.', err_mismatch: 'The passwords don’t match.',
    err_offline: 'No internet connection.', err_server: 'Something went wrong. Try again.',
    err_wrong_code: 'Wrong username or recovery code.', err_signed_out: 'You were signed out. Sign in again.',
    forgot: 'Forgot your password?', backToSignIn: '← Back to sign in', resetBtn: 'Set new password',
    resetText: 'Use the recovery code you saved when you made your account. You’ll get a new one after this.',
    recoveryCode: 'Recovery code', newPassword: 'New password', currentPassword: 'Current password',
    changePassword: 'Change password', passwordChanged: 'Password changed', passwordReset: 'Password reset — you’re signed in',
    recovery: 'Recovery code', noRecovery: '⚠ You don’t have a recovery code. If you forget your password, there’s no way back in. Make one now.',
    hasRecovery: 'If you forget your password, your recovery code lets you set a new one.', makeCode: 'Make a recovery code', newCode: 'Make a new code',
    newCodeConfirm: 'Make a new recovery code? The old one will stop working.',
    codeTitle: '🔑 Your recovery code', codeText: 'Save it somewhere safe (a note on paper, a password manager). It’s shown only now, and it’s the only way back in if you forget your password.',
    codeSaved: 'I saved it', copy: 'Copy', copied: 'Copied',
    openMail: '✉ Open Man Mail', openMailN: '✉ Open Man Mail ({n} new)', unreadN: '{n} unread', manMail: 'Man Mail (mail.domain)',
    clearData: 'Clear browsing data', clearDataHint: 'History, cookies, cache and site data', clearBtn: 'Clear', cleared: 'Browsing data cleared',
    today: 'Today', yesterday: 'Yesterday', morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening', night: 'Good night',
    errTitle: 'This page can’t be reached', retry: 'Try again',
    incogTitle: 'Incognito', incogText: 'Pages you open here aren’t saved to history, and cookies are deleted when you close all incognito windows.',
    findPh: 'Find in page', secure: 'Connection is secure', notSecure: 'Not secure',
    addedBm: 'Added to bookmarks', removedBm: 'Removed from bookmarks', downloadStarted: 'Downloading',
    aboutText: 'Man Browser {n} — by Man Studio. Chromium engine.',
    internalSite: 'Free Man Studio domain — works inside Man Browser', freeDomains: 'Free domains (manstudio.domain)',
    hubMenu: 'All of Man Browser (browser.domain)',
  },
  he: {
    newTab: 'כרטיסייה חדשה', back: 'אחורה', forward: 'קדימה', reload: 'רענון', stop: 'עצירה', home: 'דף הבית',
    addrPh: 'חפשו או הקלידו כתובת', searchPh: 'חיפוש ברשת', searchWith: 'חיפוש ב-{n}',
    mostVisited: 'האתרים שביקרתם הכי הרבה', bookmark: 'הוספה לסימניות', removeBm: 'הסרה מהסימניות',
    downloads: 'הורדות', history: 'היסטוריה', bookmarks: 'סימניות', menu: 'תפריט', settings: 'הגדרות',
    blocked: 'חוסם פרסומות ומעקבים', blockedHere: '{n} נחסמו בדף הזה', blockedTotalN: '{n} פרסומות ומעקבים נחסמו עד עכשיו',
    newWindow: 'חלון חדש', incognito: 'חלון גלישה בסתר', find: 'חיפוש בדף', print: 'הדפסה…',
    zoom: 'זום', zoomIn: 'הגדלה', zoomOut: 'הקטנה', zoomReset: 'איפוס גודל', devtools: 'כלי מפתחים',
    about: 'אודות', fullscreen: 'מסך מלא', reopen: 'פתיחה מחדש של כרטיסייה שנסגרה', duplicate: 'שכפול',
    mute: 'השתקת הכרטיסייה', unmute: 'ביטול ההשתקה', close: 'סגירה', closeOthers: 'סגירת שאר הכרטיסיות', closeRight: 'סגירת הכרטיסיות שאחריה',
    newTabRight: 'כרטיסייה חדשה אחריה', noHistory: 'אין עדיין היסטוריה', noDownloads: 'אין עדיין הורדות', noBookmarks: 'אין עדיין סימניות',
    searchHistory: 'חיפוש בהיסטוריה', clearHistory: 'מחיקת הכול', historyCleared: 'ההיסטוריה נמחקה',
    open: 'פתיחה', openNewTab: 'פתיחה בכרטיסייה חדשה', showFolder: 'הצגה בתיקייה', cancel: 'ביטול', pause: 'השהיה', resume: 'המשך',
    paused: 'מושהה', done: 'הסתיים', failed: 'נכשל', cancelled: 'בוטל', remove: 'הסרה',
    searchEngine: 'מנוע חיפוש', homepage: 'דף הבית', homepageHint: 'השאירו ריק בשביל דף הכרטיסייה החדשה',
    theme: 'ערכת נושא', themeSystem: 'לפי המערכת', themeLight: 'בהירה', themeDark: 'כהה', language: 'שפה',
    adblock: 'חסימת פרסומות ומעקבים', showBar: 'הצגת סרגל הסימניות',
    startup: 'בפתיחה', startupNew: 'לפתוח את דף הכרטיסייה החדשה', startupRestore: 'להמשיך מאיפה שהפסקתי',
    langHint: 'התפריטים, הדפים והאתרים מתחלפים מיד', whatsNew: 'מה חדש',
    updateBtn: 'הפעלה מחדש לעדכון', updateReady: 'Man Browser {n} מוכן. הוא יותקן כשתפעילו מחדש או תסגרו את הדפדפן.',
    account: 'חשבון', signIn: 'התחברות', signUp: 'יצירת חשבון', signOut: 'התנתקות', username: 'שם משתמש', password: 'סיסמה',
    confirmPassword: 'אימות סיסמה', acctNote: 'נשארים מחוברים עד שמתנתקים, גם אחרי שסוגרים את הדפדפן.',
    signedInAs: 'מחובר/ת', devNote: 'אתה המפתח של Man Studio: אפשר להשתמש בדומיינים ‎.man ב-manstudio.domain.',
    welcome: 'ברוך הבא, {n}!', signedOut: 'התנתקת',
    err_wrong: 'שם משתמש או סיסמה לא נכונים.', err_locked: 'יותר מדי ניסיונות שגויים. נסו שוב בעוד 15 דקות.',
    err_taken: 'שם המשתמש הזה כבר תפוס.', err_bad_username: 'שם משתמש: 3–24 אותיות או מספרים (רווחים, נקודות, - ו-_ מותרים באמצע).',
    err_bad_password: 'סיסמה: לפחות 8 תווים.', err_mismatch: 'הסיסמאות לא תואמות.',
    err_offline: 'אין חיבור לאינטרנט.', err_server: 'משהו השתבש. נסו שוב.',
    err_wrong_code: 'שם משתמש או קוד שחזור לא נכונים.', err_signed_out: 'התנתקת. התחבר/י שוב.',
    forgot: 'שכחת את הסיסמה?', backToSignIn: '← חזרה להתחברות', resetBtn: 'קביעת סיסמה חדשה',
    resetText: 'משתמשים בקוד השחזור ששמרת כשיצרת את החשבון. אחרי זה מקבלים קוד חדש.',
    recoveryCode: 'קוד שחזור', newPassword: 'סיסמה חדשה', currentPassword: 'הסיסמה הנוכחית',
    changePassword: 'שינוי סיסמה', passwordChanged: 'הסיסמה שונתה', passwordReset: 'הסיסמה אופסה — את/ה מחובר/ת',
    recovery: 'קוד שחזור', noRecovery: '⚠ אין לך קוד שחזור. אם תשכח/י את הסיסמה, לא תהיה דרך להיכנס. כדאי ליצור אחד עכשיו.',
    hasRecovery: 'אם תשכח/י את הסיסמה, קוד השחזור מאפשר לקבוע סיסמה חדשה.', makeCode: 'יצירת קוד שחזור', newCode: 'יצירת קוד חדש',
    newCodeConfirm: 'ליצור קוד שחזור חדש? הקוד הקודם יפסיק לעבוד.',
    codeTitle: '🔑 קוד השחזור שלך', codeText: 'שמור/י אותו במקום בטוח (על דף, או בתוכנה לשמירת סיסמאות). הוא מוצג רק עכשיו, והוא הדרך היחידה להיכנס אם שוכחים את הסיסמה.',
    codeSaved: 'שמרתי', copy: 'העתקה', copied: 'הועתק',
    openMail: '✉ פתיחת Man Mail', openMailN: '✉ פתיחת Man Mail ({n} חדשים)', unreadN: '{n} שלא נקראו', manMail: 'Man Mail (mail.domain)',
    clearData: 'ניקוי נתוני גלישה', clearDataHint: 'היסטוריה, עוגיות, מטמון ונתוני אתרים', clearBtn: 'ניקוי', cleared: 'נתוני הגלישה נוקו',
    today: 'היום', yesterday: 'אתמול', morning: 'בוקר טוב', afternoon: 'צהריים טובים', evening: 'ערב טוב', night: 'לילה טוב',
    errTitle: 'אי אפשר להגיע לדף הזה', retry: 'לנסות שוב',
    incogTitle: 'גלישה בסתר', incogText: 'דפים שתפתחו כאן לא נשמרים בהיסטוריה, והעוגיות נמחקות כשסוגרים את כל חלונות הגלישה בסתר.',
    findPh: 'חיפוש בדף', secure: 'החיבור מאובטח', notSecure: 'לא מאובטח',
    addedBm: 'נוסף לסימניות', removedBm: 'הוסר מהסימניות', downloadStarted: 'מוריד',
    aboutText: 'Man Browser {n} — מבית Man Studio. מנוע Chromium.',
    internalSite: 'דומיין חינמי של Man Studio — עובד בתוך Man Browser', freeDomains: 'דומיינים בחינם (manstudio.domain)',
    hubMenu: 'כל Man Browser (browser.domain)',
  },
};

const S = { settings: {}, bookmarks: [] };
let blockedTotal = 0, versions = {};
const t = (k, n) => {
  const L = I18N[S.settings.lang] || I18N.en;
  const s = L[k] ?? I18N.en[k] ?? k;
  return n == null ? s : s.replace('{n}', n);
};
const locale = () => (S.settings.lang === 'he' ? 'he-IL' : 'en-US');

/* ================= helpers ================= */
const ZOOMS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5];
const Z1 = ZOOMS.indexOf(1);

function hostOf(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } }
function prettyUrl(u) { try { return decodeURI(u); } catch { return u; } }
function colorFor(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return `hsl(${Math.abs(h) % 360} 55% 47%)`; }
function letterIcon(name) {
  const d = el('span', 'letter', ((name || '?').trim().charAt(0) || '?').toUpperCase());
  d.style.background = colorFor(name || '?');
  return d;
}
function iconFor(url, favicon, title) {
  const name = hostOf(url) || title;
  if (!favicon) return letterIcon(name);
  const img = new Image();
  img.alt = '';
  img.onerror = () => img.replaceWith(letterIcon(name));
  img.src = favicon;
  return img;
}
function fmtBytes(b) {
  if (!b) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB']; let i = 0;
  while (b >= 1024 && i < 3) { b /= 1024; i++; }
  return `${b.toFixed(i ? 1 : 0)} ${u[i]}`;
}
const debounce = (fn, ms) => { let tm; return (...a) => { clearTimeout(tm); tm = setTimeout(() => fn(...a), ms); }; };
let toastTimer;
function toast(msg, ms = 1800) {
  const n = $('#toast');
  n.textContent = msg; n.hidden = false;
  n.classList.remove('pop'); void n.offsetWidth; n.classList.add('pop');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { n.hidden = true; }, ms);
}

function searchUrl(q) { return (ENGINES[S.settings.engine] || ENGINES.google).url.replace('%s', encodeURIComponent(q)); }
function toUrl(input) {
  const q = String(input || '').trim();
  if (!q) return null;
  if (/^(https?|file|ftp|man):\/\//i.test(q) || /^(view-source|data|about|chrome|blob):/i.test(q)) return q;
  if (/^[a-z0-9.-]+\.domain(\/.*)?$/i.test(q)) return 'man://' + q.toLowerCase();
  if (/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/.*)?$/i.test(q)) return 'http://' + q;
  if (/^\d{1,3}(\.\d{1,3}){3}(:\d+)?(\/.*)?$/.test(q)) return 'http://' + q;
  if (!/\s/.test(q) && /^[^\s/?#]+\.[a-z]{2,}(:\d+)?([/?#].*)?$/i.test(q)) return 'https://' + q;
  return searchUrl(q);
}

/* ================= theme & language ================= */
const mq = matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const th = S.settings.theme;
  const dark = INCOG || th === 'dark' || (th !== 'light' && mq.matches);
  document.body.classList.toggle('incog', INCOG);
  document.body.classList.toggle('dark', dark && !INCOG);
  api.theme(dark);
}
mq.addEventListener('change', applyTheme);

function applyLang() {
  const he = S.settings.lang === 'he';
  document.documentElement.lang = he ? 'he' : 'en';
  document.documentElement.dir = he ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(n => { n.textContent = t(n.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(n => { n.placeholder = t(n.dataset.i18nPh); });
  document.querySelectorAll('[data-i18n-title]').forEach(n => { n.title = t(n.dataset.i18nTitle); });
  tabs.forEach(tb => { tb.el.querySelector('.x').title = t('close'); renderTab(tb); });
  if (active) updateToolbar();
  renderBar();
  renderNewTab();
  renderAccountBtn();
  if (panelName) renderPanel();
}

/* ================= tabs ================= */
let tabs = [], active = null, nextId = 1, dragTab = null, panelName = null;
const closedStack = [];
const downloads = new Map();
const addr = $('#addr');

function createTab(url, { activate = true, after = active, end = false, lazy = false } = {}) {
  const tab = {
    id: nextId++, title: '', url: '', favicon: null, loading: false, blocked: 0, zoom: Z1,
    wv: null, ready: false, isNew: true, error: null, audible: false, muted: false, pending: null, wcid: 0,
  };
  const e = el('div', 'tab');
  e.draggable = true;
  e.innerHTML = '<span class="fav"></span><span class="ttl"></span><button class="aud" hidden></button><button class="x"></button>';
  const x = e.querySelector('.x');
  setIcon(x, 'close'); x.title = t('close');
  tab.el = e;

  e.addEventListener('mousedown', ev => {
    if (ev.button === 1) { ev.preventDefault(); closeTab(tab); }
    else if (ev.button === 0 && !ev.target.closest('button')) select(tab);
  });
  x.addEventListener('click', ev => { ev.stopPropagation(); closeTab(tab); });
  e.querySelector('.aud').addEventListener('click', ev => { ev.stopPropagation(); toggleMute(tab); });
  e.addEventListener('contextmenu', ev => { ev.preventDefault(); tabMenu(tab, ev); });
  e.addEventListener('dragstart', ev => { dragTab = tab; ev.dataTransfer.effectAllowed = 'move'; e.classList.add('dragging'); });
  e.addEventListener('dragend', () => { dragTab = null; e.classList.remove('dragging'); saveSession(); });
  e.addEventListener('dragover', ev => {
    if (!dragTab || dragTab === tab) return;
    ev.preventDefault();
    const r = e.getBoundingClientRect();
    const rtl = document.documentElement.dir === 'rtl';
    const afterIt = (ev.clientX > r.left + r.width / 2) !== rtl;
    const from = tabs.indexOf(dragTab);
    tabs.splice(from, 1);
    tabs.splice(tabs.indexOf(tab) + (afterIt ? 1 : 0), 0, dragTab);
    if (tabs.indexOf(dragTab) !== from) tabs.forEach(tb => $('#tabs').appendChild(tb.el));
  });

  const idx = end || !after || !tabs.includes(after) ? tabs.length : tabs.indexOf(after) + 1;
  tabs.splice(idx, 0, tab);
  $('#tabs').insertBefore(e, tabs[idx + 1] ? tabs[idx + 1].el : null);

  if (url && lazy && !activate) {
    tab.pending = toUrl(url); tab.url = tab.pending; tab.isNew = false; tab.title = hostOf(tab.url) || tab.url;
  } else if (url) navigate(tab, url);
  renderTab(tab);
  if (activate || !active) select(tab);
  saveSession();
  return tab;
}

function renderTab(tab) {
  const e = tab.el;
  const title = tab.isNew ? t('newTab') : (tab.title || prettyUrl(tab.url));
  e.querySelector('.ttl').textContent = title;
  e.title = title;
  const key = tab.loading ? 'spin' : tab.isNew ? 'new' : (tab.favicon || 'globe');
  if (tab._fk !== key) {
    tab._fk = key;
    const f = e.querySelector('.fav');
    f.innerHTML = '';
    if (key === 'spin') f.appendChild(el('span', 'spin'));
    else if (key === 'new') f.innerHTML = INCOG ? svg('mask') : '';
    else if (key === 'globe') f.innerHTML = svg('globe');
    else {
      const img = new Image();
      img.onerror = () => { f.innerHTML = svg('globe'); };
      img.src = key;
      f.appendChild(img);
    }
  }
  const aud = e.querySelector('.aud');
  const showAud = tab.audible || tab.muted;
  aud.hidden = !showAud;
  if (showAud && aud.dataset.icon !== (tab.muted ? 'muted' : 'sound')) setIcon(aud, tab.muted ? 'muted' : 'sound');
  aud.title = t(tab.muted ? 'unmute' : 'mute');
}

function select(tab) {
  if (!tab) return;
  if (active !== tab) closeFind();
  active = tab;
  if (tab.pending) { const u = tab.pending; tab.pending = null; navigate(tab, u); }
  showActive();
  tab.el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  if (tab.isNew) addr.focus();
  else if (tab.wv) tab.wv.focus();
}

function showActive() {
  if (!active) return;
  for (const tb of tabs) {
    tb.el.classList.toggle('active', tb === active);
    if (tb.wv) tb.wv.classList.toggle('show', tb === active && !tb.isNew);
  }
  $('#newtab').hidden = !active.isNew;
  if (active.isNew) renderNewTab();
  showStatus('');
  renderError();
  updateToolbar();
}

function closeTab(tab) {
  const i = tabs.indexOf(tab);
  if (i < 0) return;
  if (!tab.isNew && tab.url) { closedStack.push(tab.url); if (closedStack.length > 25) closedStack.shift(); }
  tabs.splice(i, 1);
  tab.el.remove();
  if (tab.wv) tab.wv.remove();
  if (!tabs.length) { saveSession(true); window.close(); return; }
  if (active === tab) { active = null; select(tabs[Math.min(i, tabs.length - 1)]); }
  saveSession();
}

/* Free Man Studio domains: if such a name doesn't exist on the real internet, load it from man://
   Keep the endings in sync with main.js, server/src/index.js and src/registrar/app.js. */
const INTERNAL_RE = /^https?:\/\/([a-z0-9.-]+\.(?:fun|com|net|org|io|app|dev|xyz|site|online|game|me|blog|art|club|store|tech|co\.ms|ms|man|web|domain))(?::\d+)?(\/[^#]*)?/i;
const toMan = (host, p) => `man://${host.toLowerCase()}${p || '/'}`;
const displayUrl = u => (/^man:\/\//i.test(u) ? prettyUrl(u.slice(6)).replace(/\/$/, '') : prettyUrl(u));

function navigate(tab, input) {
  const url = toUrl(input);
  if (!url || !tab) return;
  const m = INTERNAL_RE.exec(url);
  if (!m) return loadIn(tab, url);
  api.resolve(m[1]).then(kind => loadIn(tab, kind === 'man' ? toMan(m[1], m[2]) : url), () => loadIn(tab, url));
}
function loadIn(tab, url) {
  if (!tabs.includes(tab)) return;
  tab.isNew = false; tab.error = null; tab.url = url; tab.pending = null;
  const wv = ensureWebview(tab);
  if (tab.ready) wv.loadURL(url).catch(() => {});
  else wv.src = url;
  renderTab(tab);
  if (tab === active) { showActive(); wv.focus(); }
}

function ensureWebview(tab) {
  if (tab.wv) return tab.wv;
  const wv = document.createElement('webview');
  wv.className = 'wv';
  wv.setAttribute('partition', INCOG ? 'incognito' : 'persist:main');
  wv.setAttribute('allowpopups', '');
  tab.wv = wv;
  const isActive = () => tab === active;
  const isWeb = u => /^(https?|man):/i.test(u);

  wv.addEventListener('dom-ready', () => {
    if (!tab.ready) { tab.ready = true; tab.wcid = wv.getWebContentsId(); }
    applyZoom(tab);
    if (isActive()) updateToolbar();
  });
  wv.addEventListener('did-start-loading', () => {
    tab.loading = true; tab.error = null; renderTab(tab);
    if (isActive()) { updateToolbar(); renderError(); }
  });
  wv.addEventListener('did-stop-loading', () => {
    tab.loading = false; renderTab(tab);
    if (isActive()) updateToolbar();
  });
  wv.addEventListener('did-navigate', e => {
    if (hostOf(e.url) !== hostOf(tab.url)) tab.favicon = null;
    tab.url = e.url; tab.blocked = 0;
    renderTab(tab);
    if (!INCOG && isWeb(e.url)) api.historyAdd(e.url, '');
    if (isActive()) updateToolbar();
    saveSession();
  });
  wv.addEventListener('did-navigate-in-page', e => {
    if (!e.isMainFrame) return;
    tab.url = e.url;
    if (!INCOG && isWeb(e.url)) api.historyAdd(e.url, tab.title);
    if (isActive()) updateToolbar();
    saveSession();
  });
  wv.addEventListener('page-title-updated', e => {
    tab.title = e.title; renderTab(tab);
    if (isActive()) document.title = e.title;
    if (!INCOG) api.historyUpdate(tab.url, { title: e.title });
  });
  wv.addEventListener('page-favicon-updated', e => {
    tab.favicon = (e.favicons && e.favicons[0]) || null;
    renderTab(tab);
    if (!INCOG && tab.favicon) api.historyUpdate(tab.url, { favicon: tab.favicon });
    const b = S.bookmarks.find(bm => bm.url === tab.url);
    if (b && tab.favicon && b.favicon !== tab.favicon) { b.favicon = tab.favicon; saveBookmarks(); renderBar(); }
  });
  wv.addEventListener('did-fail-load', e => {
    if (!e.isMainFrame || e.errorCode === -3) return;
    const m = INTERNAL_RE.exec(e.validatedURL || '');
    if ((e.errorCode === -105 || e.errorCode === -137) && m && tab._manTried !== m[1]) {
      tab._manTried = m[1]; // a link to a free domain inside a page
      wv.loadURL(toMan(m[1], m[2])).catch(() => {});
      return;
    }
    tab.error = { code: e.errorCode, desc: e.errorDescription, url: e.validatedURL || tab.url };
    tab.loading = false; renderTab(tab);
    if (isActive()) renderError();
  });
  wv.addEventListener('found-in-page', e => {
    if (isActive()) $('#find-count').textContent = `${e.result.activeMatchOrdinal || 0}/${e.result.matches || 0}`;
  });
  wv.addEventListener('media-started-playing', () => { tab.audible = true; renderTab(tab); });
  wv.addEventListener('media-paused', () => { tab.audible = false; renderTab(tab); });
  wv.addEventListener('update-target-url', e => { if (isActive()) showStatus(e.url); });
  wv.addEventListener('close', () => closeTab(tab));
  $('#views').appendChild(wv);
  return wv;
}

function toggleMute(tab) {
  if (!tab.wv || !tab.ready) return;
  tab.muted = !tab.muted;
  tab.wv.setAudioMuted(tab.muted);
  renderTab(tab);
}

function saveSession(now) {
  if (INCOG) return;
  clearTimeout(saveSession.tm);
  const send = () => api.session(tabs.filter(tb => !tb.isNew && tb.url).map(tb => tb.url));
  if (now) send(); else saveSession.tm = setTimeout(send, 250);
}

/* ================= toolbar ================= */
function updateToolbar() {
  const tab = active;
  if (!tab) return;
  const live = tab.wv && tab.ready && !tab.isNew;
  $('#back').disabled = !((tab.isNew && tab.wv) || (live && tab.wv.canGoBack()));
  $('#forward').disabled = !(live && tab.wv.canGoForward());
  const rl = $('#reload');
  if (rl.dataset.icon !== (tab.loading ? 'stop' : 'reload')) setIcon(rl, tab.loading ? 'stop' : 'reload');
  rl.title = t(tab.loading ? 'stop' : 'reload');
  if (document.activeElement !== addr) addr.value = tab.isNew ? '' : displayUrl(tab.url);

  const lock = $('#lock'), u = tab.isNew ? '' : tab.url;
  const kind = /^https:/i.test(u) ? 'lock' : /^http:/i.test(u) ? 'warn' : /^man:/i.test(u) ? 'spark' : 'search';
  if (lock.dataset.icon !== kind) setIcon(lock, kind);
  lock.className = { lock: 'secure', warn: 'insecure', spark: 'internal' }[kind] || '';
  lock.title = { lock: t('secure'), warn: t('notSecure'), spark: t('internalSite') }[kind] || '';

  const bm = !tab.isNew && S.bookmarks.some(b => b.url === tab.url);
  const star = $('#star');
  star.hidden = tab.isNew;
  star.classList.toggle('on', bm);
  star.title = t(bm ? 'removeBm' : 'bookmark');

  const zb = $('#zoom-badge'), z = ZOOMS[tab.zoom];
  zb.hidden = z === 1 || tab.isNew;
  zb.textContent = Math.round(z * 100) + '%';
  zb.title = t('zoomReset');
  updateShield();
  document.title = tab.isNew ? t('newTab') : (tab.title || tab.url);
}
function updateShield() {
  const s = $('#shield'), tab = active;
  s.hidden = !tab || tab.isNew;
  s.classList.toggle('off', !S.settings.adblock);
  $('#shield-count').textContent = S.settings.adblock && tab && tab.blocked ? tab.blocked : '';
  s.title = t('blocked');
}
function showStatus(url) {
  const s = $('#status');
  s.hidden = !url;
  if (url) s.textContent = prettyUrl(url);
}
function renderError() {
  const box = $('#error');
  const er = active && !active.isNew && active.error;
  box.hidden = !er;
  if (!er) return;
  $('#err-title').textContent = t('errTitle');
  $('#err-host').textContent = hostOf(er.url) || er.url;
  $('#err-desc').textContent = `${er.desc || 'ERROR'} (${er.code})`;
  $('#err-retry').textContent = t('retry');
}

function goBack() {
  const tab = active;
  if (!tab) return;
  if (tab.isNew && tab.wv) { tab.isNew = false; renderTab(tab); showActive(); return; }
  if (tab.ready && tab.wv.canGoBack()) tab.wv.goBack();
}
function goForward() { const tab = active; if (tab && tab.ready && !tab.isNew && tab.wv.canGoForward()) tab.wv.goForward(); }
function goHome() {
  if (!active) return;
  if (S.settings.homepage) return navigate(active, S.settings.homepage);
  active.isNew = true; active.error = null;
  renderTab(active); showActive(); addr.focus();
}
function reload(hard) {
  const tab = active;
  if (!tab || !tab.wv || tab.isNew || !tab.ready) return;
  if (tab.loading) return tab.wv.stop();
  if (tab.error) { const u = tab.error.url; tab.error = null; renderError(); tab.wv.loadURL(u).catch(() => {}); return; }
  if (hard) tab.wv.reloadIgnoringCache(); else tab.wv.reload();
}
function applyZoom(tab) { if (tab.wv && tab.ready) tab.wv.setZoomFactor(ZOOMS[tab.zoom]); }
function zoom(dir) {
  const tab = active;
  if (!tab || !tab.ready || tab.isNew) return;
  tab.zoom = dir === 0 ? Z1 : Math.max(0, Math.min(ZOOMS.length - 1, tab.zoom + dir));
  applyZoom(tab); updateToolbar();
  toast(`${t('zoom')}: ${Math.round(ZOOMS[tab.zoom] * 100)}%`, 1000);
}

/* ================= address bar & suggestions ================= */
let sugItems = [], sugIndex = -1, sugTyped = '', sugSeq = 0;
addr.addEventListener('focus', () => {
  if (active && !active.isNew) addr.value = /^man:/i.test(active.url) ? displayUrl(active.url) : active.url;
  setTimeout(() => addr.select(), 0);
});
addr.addEventListener('blur', () => { hideSuggest(); setTimeout(updateToolbar, 0); });
addr.addEventListener('input', async () => {
  const q = addr.value, seq = ++sugSeq;
  sugTyped = q; sugIndex = -1;
  if (!q.trim()) return hideSuggest();
  const res = await api.suggest(q);
  if (seq !== sugSeq) return;
  const first = toUrl(q), isSearch = first === searchUrl(q.trim());
  sugItems = [isSearch ? { kind: 'search', q: q.trim() } : { kind: 'go', url: first, title: q.trim() }];
  for (const r of res) if (r.url !== first && sugItems.length < 7) sugItems.push({ kind: 'url', ...r });
  if (!isSearch) sugItems.push({ kind: 'search', q: q.trim() });
  renderSuggest();
});
addr.addEventListener('keydown', e => {
  if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && sugItems.length) {
    e.preventDefault();
    sugIndex = e.key === 'ArrowDown' ? Math.min(sugItems.length - 1, sugIndex + 1) : Math.max(-1, sugIndex - 1);
    const it = sugItems[sugIndex];
    addr.value = !it ? sugTyped : it.kind === 'search' ? it.q : it.url;
    document.querySelectorAll('.sug').forEach((n, i) => n.classList.toggle('sel', i === sugIndex));
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const it = sugItems[sugIndex];
    const target = it ? (it.url || searchUrl(it.q)) : addr.value;
    hideSuggest();
    if (!String(target).trim()) return;
    if (e.altKey) createTab(target); else navigate(active, target);
    addr.blur();
  } else if (e.key === 'Escape') {
    hideSuggest();
    addr.value = active && !active.isNew ? active.url : '';
    addr.select();
  }
});
function renderSuggest() {
  const box = $('#suggest');
  box.innerHTML = '';
  sugItems.forEach((it, i) => {
    const r = el('div', 'sug' + (i === sugIndex ? ' sel' : ''));
    const ic = el('span', 'sic');
    if (it.kind === 'search') ic.innerHTML = svg('search');
    else if (it.kind === 'go') ic.innerHTML = svg('globe');
    else ic.appendChild(iconFor(it.url, it.favicon, it.title));
    const tx = el('div', 'st');
    if (it.kind === 'search') tx.append(el('span', 't', it.q), el('span', 'u', ' — ' + t('searchWith', (ENGINES[S.settings.engine] || ENGINES.google).name)));
    else tx.append(el('span', 't', it.title || prettyUrl(it.url)), el('span', 'u', ' — ' + prettyUrl(it.url).replace(/^https?:\/\/(www\.)?/, '')));
    r.append(ic, tx);
    r.addEventListener('mousedown', ev => {
      ev.preventDefault();
      hideSuggest();
      navigate(active, it.url || searchUrl(it.q));
      addr.blur();
    });
    box.appendChild(r);
  });
  box.hidden = !sugItems.length;
}
function hideSuggest() { $('#suggest').hidden = true; sugItems = []; sugIndex = -1; sugSeq++; }

/* ================= bookmarks ================= */
function saveBookmarks() { api.set('bookmarks', S.bookmarks); }
function toggleBookmark() {
  const tab = active;
  if (!tab || tab.isNew) return;
  const i = S.bookmarks.findIndex(b => b.url === tab.url);
  if (i >= 0) { S.bookmarks.splice(i, 1); toast(t('removedBm')); }
  else { S.bookmarks.push({ title: tab.title || hostOf(tab.url), url: tab.url, favicon: tab.favicon }); toast(t('addedBm')); }
  saveBookmarks(); renderBar(); updateToolbar();
  if (panelName === 'bookmarks') renderPanel();
}
function openFrom(ev, url) {
  if (ev.ctrlKey || ev.button === 1) createTab(url, { activate: false });
  else navigate(active, url);
}
function renderBar() {
  const bar = $('#bookmarks-bar');
  bar.hidden = !S.settings.showBar;
  document.body.classList.toggle('nobar', !S.settings.showBar);
  bar.innerHTML = '';
  for (const b of S.bookmarks) {
    const btn = el('button', 'bm');
    btn.title = `${b.title}\n${b.url}`;
    btn.append(iconFor(b.url, b.favicon, b.title), el('span', '', b.title));
    btn.addEventListener('click', ev => openFrom(ev, b.url));
    btn.addEventListener('auxclick', ev => { if (ev.button === 1) openFrom(ev, b.url); });
    btn.addEventListener('contextmenu', ev => bookmarkMenu(b, ev));
    bar.appendChild(btn);
  }
  if (!S.bookmarks.length) bar.appendChild(el('span', 'bar-empty', t('noBookmarks')));
}
async function bookmarkMenu(b, ev) {
  ev.preventDefault();
  const id = await api.menu([
    { id: 'open', label: t('open') }, { id: 'tab', label: t('openNewTab') }, { sep: 1 }, { id: 'rm', label: t('remove') },
  ], ev.clientX, ev.clientY);
  if (id === 'open') navigate(active, b.url);
  else if (id === 'tab') createTab(b.url);
  else if (id === 'rm') removeBookmark(b);
}
function removeBookmark(b) {
  S.bookmarks = S.bookmarks.filter(x => x !== b);
  saveBookmarks(); renderBar(); updateToolbar();
  if (panelName === 'bookmarks') renderPanel();
}

/* ================= menus ================= */
async function tabMenu(tab, ev) {
  const i = tabs.indexOf(tab);
  const id = await api.menu([
    { id: 'newAfter', label: t('newTabRight') }, { sep: 1 },
    { id: 'reload', label: t('reload'), enabled: tab.ready && !tab.isNew },
    { id: 'dup', label: t('duplicate'), enabled: !tab.isNew },
    { id: 'mute', label: t(tab.muted ? 'unmute' : 'mute'), enabled: tab.ready },
    { sep: 1 },
    { id: 'close', label: t('close'), accel: 'Ctrl+W' },
    { id: 'others', label: t('closeOthers'), enabled: tabs.length > 1 },
    { id: 'after', label: t('closeRight'), enabled: i < tabs.length - 1 },
    { sep: 1 },
    { id: 'reopen', label: t('reopen'), accel: 'Ctrl+Shift+T', enabled: closedStack.length > 0 },
  ], ev.clientX, ev.clientY);
  switch (id) {
    case 'newAfter': createTab(S.settings.homepage || null, { after: tab }); break;
    case 'reload': tab.wv.reload(); break;
    case 'dup': createTab(tab.url, { after: tab }); break;
    case 'mute': toggleMute(tab); break;
    case 'close': closeTab(tab); break;
    case 'others': tabs.filter(x => x !== tab).forEach(closeTab); break;
    case 'after': tabs.slice(i + 1).forEach(closeTab); break;
    case 'reopen': runCmd('reopen-tab'); break;
    default:
  }
}
async function mainMenu() {
  const r = $('#menu-btn').getBoundingClientRect();
  const z = active ? Math.round(ZOOMS[active.zoom] * 100) : 100;
  const id = await api.menu([
    { id: 'new-tab', label: t('newTab'), accel: 'Ctrl+T' },
    { id: 'new-window', label: t('newWindow'), accel: 'Ctrl+N' },
    { id: 'incognito', label: t('incognito'), accel: 'Ctrl+Shift+N' },
    { sep: 1 },
    { id: 'history', label: t('history'), accel: 'Ctrl+H' },
    { id: 'downloads', label: t('downloads'), accel: 'Ctrl+J' },
    { id: 'bookmarks', label: t('bookmarks') },
    { id: 'reopen-tab', label: t('reopen'), accel: 'Ctrl+Shift+T', enabled: closedStack.length > 0 },
    { id: 'hub', label: t('hubMenu') },
    { id: 'domains', label: t('freeDomains') },
    { id: 'mail', label: t('manMail') },
    { sep: 1 },
    { label: `${t('zoom')} (${z}%)`, sub: [
      { id: 'zoom-in', label: t('zoomIn'), accel: 'Ctrl+=' },
      { id: 'zoom-out', label: t('zoomOut'), accel: 'Ctrl+-' },
      { id: 'zoom-reset', label: t('zoomReset'), accel: 'Ctrl+0' },
    ] },
    { id: 'find', label: t('find'), accel: 'Ctrl+F' },
    { id: 'print', label: t('print'), accel: 'Ctrl+P' },
    { id: 'fullscreen', label: t('fullscreen'), accel: 'F11' },
    { sep: 1 },
    { id: 'settings', label: t('settings') },
    { id: 'whats-new', label: t('whatsNew') },
    { id: 'devtools', label: t('devtools'), accel: 'F12' },
    { id: 'about', label: t('about') },
  ], r.right - 260, r.bottom + 4);
  if (id === 'about') toast(t('aboutText', versions.app || '1.0.0') + ` (Chromium ${versions.chrome || ''})`, 4000);
  else if (id) runCmd(id);
}
async function shieldMenu() {
  const r = $('#shield').getBoundingClientRect();
  const id = await api.menu([
    { id: 'x', label: t('blockedHere', active ? active.blocked : 0), enabled: false },
    { id: 'x2', label: t('blockedTotalN', blockedTotal.toLocaleString(locale())), enabled: false },
    { sep: 1 },
    { id: 'toggle', label: t('adblock'), checked: !!S.settings.adblock },
  ], r.left, r.bottom + 4);
  if (id === 'toggle') {
    S.settings.adblock = !S.settings.adblock;
    api.set('settings', S.settings);
    updateShield();
    if (active && active.ready && !active.isNew) active.wv.reload();
  }
}

/* ================= find in page ================= */
const findbar = $('#findbar'), findInput = $('#find-input');
function openFind() {
  const tab = active;
  if (!tab || !tab.ready || tab.isNew) return;
  findbar.hidden = false;
  findInput.focus(); findInput.select();
  if (findInput.value) tab.wv.findInPage(findInput.value, { findNext: true });
}
function closeFind() {
  if (findbar.hidden) return;
  findbar.hidden = true;
  $('#find-count').textContent = '';
  if (active && active.ready) active.wv.stopFindInPage('clearSelection');
}
function findStep(forward) {
  const v = findInput.value;
  if (v && active && active.ready) active.wv.findInPage(v, { forward, findNext: false });
}
findInput.addEventListener('input', () => {
  if (!active || !active.ready) return;
  if (findInput.value) active.wv.findInPage(findInput.value, { findNext: true });
  else { active.wv.stopFindInPage('clearSelection'); $('#find-count').textContent = ''; }
});
findInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); findStep(!e.shiftKey); }
  else if (e.key === 'Escape') { closeFind(); if (active && active.wv) active.wv.focus(); }
});

/* ================= new tab page ================= */
function tickClock() {
  const now = new Date(), h = now.getHours();
  $('#nt-clock').textContent = now.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  const greet = t(h < 5 ? 'night' : h < 12 ? 'morning' : h < 18 ? 'afternoon' : h < 22 ? 'evening' : 'night');
  $('#nt-greet').textContent = `${greet} · ${now.toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })}`;
}
async function renderNewTab() {
  if (!active || !active.isNew) return;
  tickClock();
  $('#nt-incog').hidden = !INCOG;
  $('#nt-mv').hidden = INCOG;
  $('#nt-stats-text').textContent = t('blockedTotalN', blockedTotal.toLocaleString(locale()));
  if (INCOG) return;
  let sites = await api.topSites();
  if (sites.length < 8) sites = sites.concat(S.bookmarks.filter(b => !sites.some(s => hostOf(s.url) === hostOf(b.url)))).slice(0, 8);
  const tiles = $('#nt-tiles');
  tiles.innerHTML = '';
  for (const s of sites) {
    const a = el('button', 'tile');
    const ic = el('span', 'ic');
    ic.append(iconFor(s.url, s.favicon, s.title));
    a.append(ic, el('span', '', s.title || hostOf(s.url)));
    a.title = s.url;
    a.addEventListener('click', ev => openFrom(ev, s.url));
    a.addEventListener('auxclick', ev => { if (ev.button === 1) openFrom(ev, s.url); });
    tiles.appendChild(a);
  }
}
$('#nt-form').addEventListener('submit', e => {
  e.preventDefault();
  const v = $('#nt-search').value;
  if (v.trim()) { $('#nt-search').value = ''; navigate(active, v); }
});

/* ================= side panel ================= */
function togglePanel(name) { if (panelName === name) closePanel(); else { panelName = name; $('#panel').hidden = false; renderPanel(); } }
function closePanel() { panelName = null; $('#panel').hidden = true; }
function renderPanel() {
  const body = $('#panel-body');
  $('#panel-title').textContent = t(panelName);
  body.innerHTML = '';
  if (panelName === 'history') renderHistory(body);
  else if (panelName === 'downloads') renderDownloads(body);
  else if (panelName === 'bookmarks') renderBookmarks(body);
  else if (panelName === 'settings') renderSettings(body);
  else if (panelName === 'account') renderAccount(body);
}
function dayLabel(ts) {
  const d = new Date(ts), today = new Date();
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return t('today');
  if (d.toDateString() === y.toDateString()) return t('yesterday');
  return d.toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function smallBtn(icon, label, fn, cls = '') {
  const b = el('button', 'icon-btn sm ' + cls);
  setIcon(b, icon); b.title = label;
  b.addEventListener('click', e => { e.stopPropagation(); fn(); });
  return b;
}
function linkRow(url, title, favicon, sub, onRemove) {
  const r = el('div', 'row');
  const m = el('div', 'meta');
  m.append(el('div', 't', title || prettyUrl(url)), el('div', 's', sub));
  r.append(iconFor(url, favicon, title), m);
  if (onRemove) r.append(smallBtn('close', t('remove'), () => { onRemove(); r.remove(); }, 'act'));
  r.title = url;
  r.addEventListener('click', ev => openFrom(ev, url));
  r.addEventListener('auxclick', ev => { if (ev.button === 1) openFrom(ev, url); });
  return r;
}
function renderHistory(body) {
  if (INCOG) { body.append(el('div', 'empty', t('incogText'))); return; }
  const tools = el('div', 'p-tools');
  const inp = el('input', 'inp');
  inp.placeholder = t('searchHistory');
  const clr = el('button', 'btn ghost', t('clearHistory'));
  tools.append(inp, clr);
  const list = el('div');
  body.append(tools, list);
  const draw = async () => {
    const items = await api.historyQuery(inp.value);
    list.innerHTML = '';
    if (!items.length) { list.append(el('div', 'empty', t('noHistory'))); return; }
    let day = '';
    for (const h of items) {
      const d = dayLabel(h.time);
      if (d !== day) { day = d; list.append(el('div', 'day', d)); }
      const time = new Date(h.time).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
      list.append(linkRow(h.url, h.title, h.favicon, `${time} · ${hostOf(h.url)}`, () => api.historyRemove(h.time)));
    }
  };
  inp.addEventListener('input', debounce(draw, 150));
  clr.addEventListener('click', () => { api.historyClear(); toast(t('historyCleared')); draw(); });
  draw();
  setTimeout(() => inp.focus(), 50);
}
function renderBookmarks(body) {
  if (!S.bookmarks.length) { body.append(el('div', 'empty', t('noBookmarks'))); return; }
  for (const b of S.bookmarks) body.append(linkRow(b.url, b.title, b.favicon, hostOf(b.url), () => removeBookmark(b)));
}
function renderDownloads(body) {
  const list = [...downloads.values()].reverse();
  if (!list.length) { body.append(el('div', 'empty', t('noDownloads'))); return; }
  for (const d of list) {
    const r = el('div', 'row');
    const ic = el('span', 'dl-ic'); ic.innerHTML = svg('file');
    const m = el('div', 'meta');
    m.append(el('div', 't', d.name));
    const running = d.state === 'progressing' || d.state === 'paused';
    let status;
    if (running) {
      status = d.total ? `${fmtBytes(d.received)} / ${fmtBytes(d.total)}` : fmtBytes(d.received);
      if (d.state === 'paused') status += ' · ' + t('paused');
    } else {
      status = t(d.state === 'completed' ? 'done' : d.state === 'cancelled' ? 'cancelled' : 'failed');
      if (d.state === 'completed') status += ' · ' + fmtBytes(d.total || d.received);
    }
    m.append(el('div', 's', status));
    if (running) {
      const bar = el('div', 'pbar'), fill = el('i');
      if (d.total) fill.style.width = (100 * d.received / d.total).toFixed(1) + '%'; else bar.classList.add('indet');
      bar.append(fill); m.append(bar);
    }
    const acts = el('div', 'acts');
    if (d.state === 'completed') {
      acts.append(smallBtn('folder', t('showFolder'), () => api.dl('show', d.id, d.path)));
      r.title = t('open');
      r.addEventListener('click', () => api.dl('open', d.id, d.path));
    } else if (d.state === 'progressing') {
      acts.append(smallBtn('pause', t('pause'), () => api.dl('pause', d.id)), smallBtn('close', t('cancel'), () => api.dl('cancel', d.id)));
    } else if (d.state === 'paused') {
      acts.append(smallBtn('play', t('resume'), () => api.dl('resume', d.id)), smallBtn('close', t('cancel'), () => api.dl('cancel', d.id)));
    }
    r.append(ic, m, acts);
    body.append(r);
  }
}
function renderSettings(body) {
  const set = (k, v) => { S.settings[k] = v; api.set('settings', S.settings); };
  const row = (label, control, hint) => {
    const r = el('div', 'set'), l = el('div');
    l.append(el('div', 'sn', label));
    if (hint) l.append(el('div', 'hint', hint));
    r.append(l, control);
    body.append(r);
  };
  const select = (opts, val, on) => {
    const s = el('select');
    for (const [v, lab] of opts) { const o = el('option', '', lab); o.value = v; s.append(o); }
    s.value = val;
    s.addEventListener('change', () => on(s.value));
    return s;
  };
  const toggle = (val, on) => {
    const c = el('input', 'switch');
    c.type = 'checkbox'; c.checked = !!val;
    c.addEventListener('change', () => on(c.checked));
    return c;
  };
  row(t('language'), select([['en', 'English'], ['he', 'עברית']], S.settings.lang || 'en', v => {
    set('lang', v); applyLang();
    // built-in pages (free domains, what's new) re-render in the new language
    for (const tb of tabs) if (tb.ready && /^man:\/\/[^/]+\.domain\//i.test(tb.url)) tb.wv.reload();
  }), t('langHint'));
  if (!INCOG) row(t('startup'), select([['newtab', t('startupNew')], ['restore', t('startupRestore')]], S.settings.startup || 'newtab', v => set('startup', v)));
  row(t('searchEngine'), select(Object.entries(ENGINES).map(([k, e]) => [k, e.name]), S.settings.engine, v => set('engine', v)));
  const hp = el('input', 'inp');
  hp.value = S.settings.homepage || ''; hp.placeholder = 'https://…'; hp.spellcheck = false;
  hp.addEventListener('change', () => { const v = hp.value.trim(); set('homepage', v ? toUrl(v) : ''); hp.value = S.settings.homepage; });
  row(t('homepage'), hp, t('homepageHint'));
  row(t('theme'), select([['system', t('themeSystem')], ['light', t('themeLight')], ['dark', t('themeDark')]], S.settings.theme, v => { set('theme', v); applyTheme(); }));
  row(t('adblock'), toggle(S.settings.adblock, v => { set('adblock', v); updateShield(); }), t('blockedTotalN', blockedTotal.toLocaleString(locale())));
  row(t('showBar'), toggle(S.settings.showBar, v => { set('showBar', v); renderBar(); }));
  const cb = el('button', 'btn ghost', t('clearBtn'));
  cb.addEventListener('click', async () => { await api.clearData(); toast(t('cleared')); });
  row(t('clearData'), cb, t('clearDataHint'));
  body.append(el('div', 'about', `${t('aboutText', versions.app || '1.0.0')}\nChromium ${versions.chrome || ''} · Electron ${versions.electron || ''}`));
}

/* ================= downloads ================= */
function onDownload(d) {
  const isNew = !downloads.has(d.id);
  downloads.set(d.id, d);
  const n = [...downloads.values()].filter(x => x.state === 'progressing' || x.state === 'paused').length;
  const badge = $('#dl-badge');
  badge.hidden = !n; badge.textContent = n;
  if (isNew) {
    toast(`${t('downloadStarted')}: ${d.name}`);
    const btn = $('#dl-btn');
    btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
  }
  if (panelName === 'downloads') renderPanel();
}

/* ================= commands ================= */
const CMDS = {
  'new-tab': () => createTab(S.settings.homepage || null, { end: true }),
  'reopen-tab': () => { const u = closedStack.pop(); if (u) createTab(u); },
  'close-tab': () => active && closeTab(active),
  'next-tab': () => select(tabs[(tabs.indexOf(active) + 1) % tabs.length]),
  'prev-tab': () => select(tabs[(tabs.indexOf(active) - 1 + tabs.length) % tabs.length]),
  'new-window': () => api.newWindow(false),
  incognito: () => api.newWindow(true),
  'focus-address': () => { addr.focus(); addr.select(); },
  reload: () => reload(false),
  'hard-reload': () => reload(true),
  find: openFind,
  history: () => togglePanel('history'),
  downloads: () => togglePanel('downloads'),
  bookmarks: () => togglePanel('bookmarks'),
  settings: () => togglePanel('settings'),
  bookmark: toggleBookmark,
  'zoom-in': () => zoom(1),
  'zoom-out': () => zoom(-1),
  'zoom-reset': () => zoom(0),
  back: goBack,
  forward: goForward,
  home: goHome,
  fullscreen: () => api.fullscreen(),
  devtools: () => { const w = active && active.ready && active.wv; if (w) { if (w.isDevToolsOpened()) w.closeDevTools(); else w.openDevTools(); } },
  print: () => { if (active && active.ready && !active.isNew) active.wv.print(); },
  domains: () => createTab('man://manstudio.domain/'),
  'whats-new': () => createTab('man://whatsnew.domain/'),
  hub: () => createTab('man://browser.domain/'),
  mail: () => createTab('man://mail.domain/'),
  account: () => togglePanel('account'),
};
function runCmd(c) {
  if (c.startsWith('tab-')) { const n = +c.slice(4); select(n === 9 ? tabs[tabs.length - 1] : tabs[n - 1]); return; }
  if (CMDS[c]) CMDS[c]();
}

api.on('cmd', runCmd);
api.on('open-tab', (url, fg) => createTab(url, { activate: !!fg }));
api.on('search', q => createTab(searchUrl(q)));
api.on('blocked', wcid => {
  blockedTotal++;
  const tab = tabs.find(x => x.wcid === wcid);
  if (tab) { tab.blocked++; if (tab === active) updateShield(); }
});
api.on('download', onDownload);
api.on('fullscreen', on => document.body.classList.toggle('fs', !!on));
api.on('store-changed', (k, v) => {
  S[k] = v;
  if (k === 'settings') { applyTheme(); applyLang(); } else { renderBar(); updateToolbar(); if (panelName === 'bookmarks') renderPanel(); }
});

$('#back').addEventListener('click', goBack);
$('#forward').addEventListener('click', goForward);
$('#reload').addEventListener('click', () => reload(false));
$('#home').addEventListener('click', goHome);
$('#newtab-btn').addEventListener('click', () => runCmd('new-tab'));
$('#star').addEventListener('click', toggleBookmark);
$('#shield').addEventListener('click', shieldMenu);
$('#zoom-badge').addEventListener('click', () => zoom(0));
$('#dl-btn').addEventListener('click', () => togglePanel('downloads'));
$('#hist-btn').addEventListener('click', () => togglePanel('history'));
$('#bm-btn').addEventListener('click', () => togglePanel('bookmarks'));
$('#menu-btn').addEventListener('click', mainMenu);
$('#settings-btn').addEventListener('click', () => togglePanel('settings'));

/* ================= account ================= */
let account = null, accMode = 'login', shownCode = null, mailUnread = 0;
function renderAccountBtn() {
  const b = $('#account-btn');
  b.innerHTML = '';
  b.classList.toggle('dev', !!account && account.role === 'dev');
  if (account) {
    b.append(letterIcon(account.username));
    b.title = `${account.username}${account.role === 'dev' ? ' · DEV' : ''}${mailUnread ? ' · ' + t('unreadN', mailUnread) : ''}`;
    if (mailUnread || !account.recovery) b.append(el('i', 'acct-dot')); // unread mail, or no recovery code yet
  } else {
    b.innerHTML = svg('user');
    b.title = t('signIn');
  }
}
function reloadRegistrarTabs() {
  for (const tb of tabs) if (tb.ready && /^man:\/\/(manstudio|mail)\.domain\//i.test(tb.url)) tb.wv.reload();
}
// a recovery code is shown once: big, with Copy and "I saved it"
function codeCard(code) {
  const box = el('div', 'code-card');
  box.append(el('b', '', t('codeTitle')), el('div', 'acct-note', t('codeText')));
  const c = el('div', 'code', code);
  const row = el('div', 'code-row');
  const copy = el('button', 'btn ghost', t('copy'));
  copy.addEventListener('click', () => { navigator.clipboard.writeText(code).then(() => toast(t('copied'))).catch(() => {}); });
  const done = el('button', 'btn', t('codeSaved'));
  done.addEventListener('click', () => { shownCode = null; renderPanel(); });
  row.append(copy, done);
  box.append(c, row);
  return box;
}
function formOf(fields, submitLabel, onSubmit) {
  const form = el('form', 'acct-form');
  const inputs = {};
  for (const [key, label, type, ac, max] of fields) {
    const i = el('input', 'inp');
    i.type = type; i.autocomplete = ac; i.spellcheck = false; i.maxLength = max || 128;
    form.append(el('label', '', label), i);
    inputs[key] = i;
  }
  const err = el('div', 'acct-err');
  const go = el('button', 'btn', submitLabel);
  go.type = 'submit';
  form.append(err, go);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    err.textContent = '';
    go.disabled = true;
    try { const msg = await onSubmit(inputs); if (msg) err.textContent = msg; }
    finally { go.disabled = false; }
  });
  return { form, inputs };
}
function renderAccount(body) {
  if (shownCode) body.append(codeCard(shownCode));
  if (account) {
    const card = el('div', 'acct-card');
    card.append(letterIcon(account.username), el('div', 'name', account.username));
    if (account.role === 'dev') card.append(el('span', 'dev-badge', 'DEV · MAN STUDIO'), el('div', 'acct-note', t('devNote')));
    if (account.address) {
      const addr = el('button', 'acct-addr', '✉ ' + account.address);
      addr.title = t('copy');
      addr.addEventListener('click', () => navigator.clipboard.writeText(account.address).then(() => toast(t('copied'))).catch(() => {}));
      card.append(addr);
    }
    const mail = el('button', 'btn', mailUnread ? t('openMailN', mailUnread) : t('openMail'));
    mail.addEventListener('click', () => { closePanel(); createTab('man://mail.domain/'); });
    card.append(mail);
    body.append(card);

    // recovery code
    const rec = el('div', 'acct-section');
    rec.append(el('h4', '', t('recovery')));
    if (!account.recovery) rec.append(el('div', 'acct-warn', t('noRecovery')));
    else rec.append(el('div', 'acct-note left', t('hasRecovery')));
    const mk = el('button', account.recovery ? 'btn ghost' : 'btn', t(account.recovery ? 'newCode' : 'makeCode'));
    mk.addEventListener('click', async () => {
      if (account.recovery && !confirm(t('newCodeConfirm'))) return;
      const r = await api.newRecoveryCode();
      if (r && r.ok) { shownCode = r.recovery; renderPanel(); } else toast(t('err_' + ((r && r.error) || 'server')));
    });
    rec.append(mk);
    body.append(rec);

    // change password
    const cp = el('details', 'acct-section');
    cp.append(el('summary', '', t('changePassword')));
    const { form } = formOf([
      ['old', t('currentPassword'), 'password', 'current-password'],
      ['pw', t('newPassword'), 'password', 'new-password'],
      ['pw2', t('confirmPassword'), 'password', 'new-password'],
    ], t('changePassword'), async i => {
      if (i.pw.value !== i.pw2.value) return t('err_mismatch');
      const r = await api.changePassword(i.old.value, i.pw.value);
      if (r && r.ok) { toast(t('passwordChanged')); cp.open = false; i.old.value = i.pw.value = i.pw2.value = ''; return ''; }
      return t('err_' + ((r && r.error) || 'server'));
    });
    cp.append(form);
    body.append(cp);

    const out = el('button', 'btn ghost', t('signOut'));
    out.addEventListener('click', async () => { await api.signOut(); toast(t('signedOut')); });
    const end = el('div', 'acct-card');
    end.append(out, el('div', 'acct-note', t('acctNote')));
    body.append(end);
    return;
  }

  const seg = el('div', 'seg');
  for (const m of ['login', 'signup']) {
    const b = el('button', m === accMode ? 'on' : '', t(m === 'login' ? 'signIn' : 'signUp'));
    b.addEventListener('click', () => { accMode = m; renderPanel(); });
    seg.append(b);
  }
  body.append(seg);
  let f;
  if (accMode === 'reset') {
    body.append(el('div', 'acct-note left pad', t('resetText')));
    f = formOf([
      ['user', t('username'), 'text', 'username', 24],
      ['code', t('recoveryCode'), 'text', 'off', 40],
      ['pw', t('newPassword'), 'password', 'new-password'],
      ['pw2', t('confirmPassword'), 'password', 'new-password'],
    ], t('resetBtn'), async i => {
      if (i.pw.value !== i.pw2.value) return t('err_mismatch');
      const r = await api.resetPassword(i.user.value, i.code.value, i.pw.value);
      if (r && r.ok) { shownCode = r.recovery; accMode = 'login'; toast(t('passwordReset')); renderPanel(); return ''; }
      return t('err_' + ((r && r.error) || 'server'));
    });
    f.inputs.code.placeholder = 'XXXXX-XXXXX-XXXXX-XXXXX';
    f.inputs.code.classList.add('ltr');
  } else {
    const signup = accMode === 'signup';
    f = formOf([
      ['user', t('username'), 'text', 'username', 24],
      ['pw', t('password'), 'password', signup ? 'new-password' : 'current-password'],
      ...(signup ? [['pw2', t('confirmPassword'), 'password', 'new-password']] : []),
    ], t(signup ? 'signUp' : 'signIn'), async i => {
      if (signup && i.pw.value !== i.pw2.value) return t('err_mismatch');
      const r = await (signup ? api.signUp : api.signIn)(i.user.value, i.pw.value);
      if (r && r.ok) { if (r.recovery) shownCode = r.recovery; toast(t('welcome', r.account.username)); renderPanel(); return ''; }
      return t('err_' + ((r && r.error) || 'server'));
    });
  }
  body.append(f.form);
  const links = el('div', 'acct-links');
  const forgot = el('button', 'linkish', accMode === 'reset' ? t('backToSignIn') : t('forgot'));
  forgot.addEventListener('click', () => { accMode = accMode === 'reset' ? 'login' : 'reset'; renderPanel(); });
  links.append(forgot);
  body.append(links, el('div', 'acct-note', t('acctNote')));
  setTimeout(() => f.inputs.user.focus(), 50);
}
$('#account-btn').addEventListener('click', () => togglePanel('account'));
api.on('account-changed', a => {
  account = a;
  if (!a) mailUnread = 0;
  renderAccountBtn();
  if (panelName === 'account') renderPanel();
  reloadRegistrarTabs(); // manstudio.domain shows .man only to the dev; Man Mail shows the signed-in inbox
});
api.on('mail-unread', n => {
  if (n === mailUnread) return;
  mailUnread = n;
  renderAccountBtn();
  if (panelName === 'account' && !shownCode) renderPanel();
});
api.account().then(a => { account = a; renderAccountBtn(); });
api.mailUnread().then(n => { mailUnread = n || 0; renderAccountBtn(); });

/* automatic updates: main downloads in the background; we show a button when it's ready */
function showUpdate(version) {
  if (!version) return;
  const b = $('#update-btn');
  if (b.hidden) toast(t('updateReady', version), 5000);
  b.hidden = false;
  b.title = t('updateReady', version);
}
$('#update-btn').addEventListener('click', () => { saveSession(true); api.installUpdate(); });
api.on('update-ready', showUpdate);
api.updateStatus().then(showUpdate);
$('#panel-close').addEventListener('click', closePanel);
$('#find-prev').addEventListener('click', () => findStep(false));
$('#find-next').addEventListener('click', () => findStep(true));
$('#find-close').addEventListener('click', closeFind);
$('#err-retry').addEventListener('click', () => reload(false));
$('#tabs').addEventListener('dragover', e => { if (dragTab) e.preventDefault(); });
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!$('#panel').hidden) closePanel();
  else if (!findbar.hidden) closeFind();
});
window.addEventListener('beforeunload', () => saveSession(true));

/* ================= start ================= */
(async () => {
  const init = await api.init();
  S.settings = init.settings;
  S.bookmarks = init.bookmarks;
  blockedTotal = init.blockedTotal || 0;
  versions = init.versions || {};
  paintIcons();
  if (INCOG) $('#incog-badge').hidden = false;
  applyTheme();
  applyLang();
  const urls = init.urls || [];
  if (urls.length) urls.forEach((u, i) => createTab(u, { activate: i === 0, end: true, lazy: true }));
  else createTab(S.settings.homepage || null);
  setInterval(() => { if (active && active.isNew) tickClock(); }, 5000);
})();
