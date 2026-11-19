'use strict';
const {
  app, BrowserWindow, ipcMain, session, Menu, shell, clipboard, dialog, nativeTheme, webContents, protocol, net,
} = require('electron');
const path = require('path');
const fs = require('fs');
const dns = require('dns');

/* Free internal domains (man://) — sites live in our Cloudflare Worker + D1 (server/), real internet domains always win */
protocol.registerSchemesAsPrivileged([
  { scheme: 'man', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);
const DOMAINS_API = 'https://manstudio-domains.manstudiosupport.workers.dev';
const REGISTRAR = 'manstudio.domain';
// built-in pages served from the app package (their <html lang> follows the browser's language setting)
const INTERNAL_PAGES = {
  'manstudio.domain': path.join(__dirname, 'src', 'registrar'),
  'whatsnew.domain': path.join(__dirname, 'src', 'whatsnew'),
  'search.domain': path.join(__dirname, 'src', 'search'), // Man Search
  'browser.domain': path.join(__dirname, 'src', 'hub'),   // all of Man Browser in one place
};
const WHATS_NEW = 'man://whatsnew.domain/';
// commands the browser.domain page may run
const HUB_CMDS = new Set(['settings', 'account', 'history', 'downloads', 'bookmarks', 'new-tab', 'new-window', 'incognito',
  'reopen-tab', 'find', 'zoom-in', 'zoom-out', 'zoom-reset', 'fullscreen', 'print', 'devtools']);
// Free endings. Keep in sync with server/src/index.js, src/renderer.js and src/registrar/app.js.
const INTERNAL_TLD = /\.(fun|com|net|org|io|app|dev|xyz|site|online|game|me|blog|art|club|store|tech|co\.ms|ms|man|web|domain)$/i;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
};
const GOOGLE_LOGIN = /^https:\/\/accounts\.google\.com\//i;
const FIREFOX_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0';
const dnsCache = new Map();
function realDomainExists(host) {
  host = String(host || '').toLowerCase();
  const c = dnsCache.get(host);
  if (c && Date.now() - c.t < 5 * 60e3) return Promise.resolve(c.ok);
  return Promise.race([
    dns.promises.lookup(host).then(() => true, () => false),
    new Promise(r => setTimeout(() => r(true), 4000)), // slow DNS: assume real, never hijack
  ]).then(ok => { dnsCache.set(host, { ok, t: Date.now() }); return ok; });
}
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
function infoPage(title, text, link) {
  return `<!doctype html><meta charset="utf-8"><title>${esc(title)}</title><style>
body{margin:0;height:100vh;display:grid;place-items:center;font:15px/1.5 "Segoe UI",system-ui,sans-serif;background:#f5f6f8;color:#1f2328;text-align:center}
@media(prefers-color-scheme:dark){body{background:#18191d;color:#e8e9ed}}
h1{font-size:28px;margin:0 0 8px}a{display:inline-block;margin-top:18px;padding:10px 20px;border-radius:20px;background:#3d6df2;color:#fff;text-decoration:none;font-weight:600}
</style><div><h1>${esc(title)}</h1><div>${esc(text)}</div>${link ? `<a href="${esc(link.href)}">${esc(link.label)}</a>` : ''}</div>`;
}
const html = (body, status = 200) => new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });

async function manHandler(req) {
  const u = new URL(req.url);
  const host = u.hostname.toLowerCase();
  // Only the registrar page may read the signed-in account (other man:// sites are other origins,
  // and this answer has no CORS header, so they can't read it).
  if (host === REGISTRAR && u.pathname === '/api/account') {
    const a = store.account;
    return new Response(JSON.stringify(a ? { username: a.username, role: a.role, session: a.token } : null),
      { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  }
  if (host === REGISTRAR && u.pathname === '/api/dns') {
    const exists = await realDomainExists(u.searchParams.get('host'));
    return new Response(JSON.stringify({ exists }), { headers: { 'content-type': 'application/json' } });
  }
  const dir = INTERNAL_PAGES[host];
  if (dir) {
    let p = decodeURIComponent(u.pathname);
    if (p === '/' || !path.extname(p)) p = '/index.html';
    const file = path.normalize(path.join(dir, p));
    if (!file.startsWith(dir)) return html('Not found', 404);
    try {
      const ext = path.extname(file);
      let body = await fs.promises.readFile(file);
      if (ext === '.html') {
        const lang = store.settings.lang === 'he' ? 'he' : 'en';
        body = body.toString('utf8').replace('<html lang="en">', `<html lang="${lang}">`)
          .replace('{{VERSION}}', app.getVersion());
      }
      return new Response(body, { headers: { 'content-type': MIME[ext] || 'application/octet-stream', 'cache-control': 'no-store' } });
    } catch { return html(infoPage('404', p), 404); }
  }
  if (host.endsWith('.domain')) return html(infoPage(host, 'This address is reserved.', { href: `man://${REGISTRAR}/`, label: REGISTRAR }), 404);
  try {
    // streamed straight through: sites can be up to 30 MB. Sites have pages: man://x.fun/about, /style.css …
    const pagePath = u.pathname.replace(/^\/+/, '');
    const r = await net.fetch(`${DOMAINS_API}/site/${encodeURIComponent(host)}${pagePath ? '/' + pagePath : ''}`, { cache: 'no-store' });
    if (r.ok) {
      const ext = path.extname(r.headers.get('x-path') || pagePath).toLowerCase();
      const type = { '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
        '.svg': 'image/svg+xml', '.txt': 'text/plain', '.xml': 'application/xml' }[ext] || 'text/html';
      return new Response(r.body, { headers: { 'content-type': type + '; charset=utf-8', 'cache-control': 'no-store' } });
    }
    if (r.status !== 404) throw new Error('status ' + r.status);
    let err = '';
    try { err = (await r.json()).error; } catch { /* ignore */ }
    if (err === 'no_page') {
      return html(infoPage('404', `There's no page /${pagePath} on ${host}.`, { href: `man://${host}/`, label: `Go to ${host}` }), 404);
    }
    return html(infoPage(host, 'This domain is free! Grab it at manstudio.domain.', { href: `man://${REGISTRAR}/?d=${encodeURIComponent(host)}`, label: 'Get this domain' }), 404);
  } catch {
    return html(infoPage(host, 'Could not reach the Man Studio domain service. Check your internet connection.'), 502);
  }
}

app.setName('Man Browser');
if (process.env.MB_PROFILE) app.setPath('userData', process.env.MB_PROFILE); // isolated profile for tests
const SHOT = process.env.MB_SHOT; // test hook: save a screenshot then quit

/* ---------------- storage ---------------- */
const DATA_FILE = path.join(app.getPath('userData'), 'browser-data.json');
const DEFAULT_SETTINGS = {
  engine: 'google', homepage: '', theme: 'system', lang: 'en',
  adblock: true, showBar: true,
  startup: 'newtab', // 'newtab' = open on the new tab page, 'restore' = reopen the tabs from last time
};
const DEFAULT_BOOKMARKS = [
  { title: 'YouTube', url: 'https://www.youtube.com/' },
  { title: 'Wikipedia', url: 'https://www.wikipedia.org/' },
  { title: 'GitHub', url: 'https://github.com/' },
  { title: 'Gmail', url: 'https://mail.google.com/' },
  { title: 'Claude', url: 'https://claude.ai/' },
  { title: 'Free domains', url: 'man://manstudio.domain/' },
];
let store = { settings: { ...DEFAULT_SETTINGS }, bookmarks: DEFAULT_BOOKMARKS.slice(), history: [], session: [], blockedTotal: 0 };
try {
  const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8').replace(/^﻿/, ''));
  store = { ...store, ...d, settings: { ...DEFAULT_SETTINGS, ...(d.settings || {}) } };
  delete store.settings.restore; // 1.0 always reopened old tabs; from 1.1 the default is the new tab page
} catch { /* first run */ }

// Chromium's own language (navigator.language, built-in texts) follows the setting; English by default.
app.commandLine.appendSwitch('lang', store.settings.lang === 'he' ? 'he' : 'en-US');
const acceptLanguages = () => (store.settings.lang === 'he' ? 'he-IL,he,en-US,en' : 'en-US,en');

let saveTimer = null;
function saveNow() {
  clearTimeout(saveTimer); saveTimer = null;
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE + '.tmp', JSON.stringify(store));
    fs.renameSync(DATA_FILE + '.tmp', DATA_FILE);
  } catch (e) { console.error('save failed', e); }
}
function save() { if (!saveTimer) saveTimer = setTimeout(saveNow, 800); }

/* ---------------- labels for native menus ---------------- */
const L = {
  en: {
    openLinkTab: 'Open link in new tab', copyLink: 'Copy link address', downloadLink: 'Download link',
    openImgTab: 'Open image in new tab', saveImg: 'Save image', copyImg: 'Copy image',
    copy: 'Copy', cut: 'Cut', paste: 'Paste', selectAll: 'Select all', searchFor: s => `Search for “${s}”`,
    back: 'Back', forward: 'Forward', reload: 'Reload', viewSource: 'View page source', inspect: 'Inspect',
    allow: 'Allow', block: 'Block', permAsk: (o, p) => `${o} wants to ${p}`,
    leave: 'Leave', stay: 'Stay', leaveQ: 'Leave site?', leaveD: 'Changes you made may not be saved.',
    perms: {
      media: 'use your camera and microphone', geolocation: 'know your location',
      notifications: 'show notifications', 'clipboard-read': 'read your clipboard', midi: 'use MIDI devices',
    },
  },
  he: {
    openLinkTab: 'פתיחת הקישור בכרטיסייה חדשה', copyLink: 'העתקת כתובת הקישור', downloadLink: 'הורדת הקישור',
    openImgTab: 'פתיחת התמונה בכרטיסייה חדשה', saveImg: 'שמירת התמונה', copyImg: 'העתקת התמונה',
    copy: 'העתקה', cut: 'גזירה', paste: 'הדבקה', selectAll: 'בחירת הכול', searchFor: s => `חיפוש ”${s}“`,
    back: 'אחורה', forward: 'קדימה', reload: 'רענון', viewSource: 'הצגת קוד המקור', inspect: 'בדיקת רכיב',
    allow: 'אישור', block: 'חסימה', permAsk: (o, p) => `${o} מבקש ${p}`,
    leave: 'לעזוב', stay: 'להישאר', leaveQ: 'לעזוב את האתר?', leaveD: 'ייתכן שהשינויים שעשית לא יישמרו.',
    perms: {
      media: 'להשתמש במצלמה ובמיקרופון', geolocation: 'לדעת את המיקום שלך',
      notifications: 'להציג התראות', 'clipboard-read': 'לקרוא את הלוח', midi: 'להשתמש בהתקני MIDI',
    },
  },
};
const T = () => L[store.settings.lang] || L.en;

/* ---------------- ad & tracker blocking ---------------- */
const AD_HOSTS = new Set(`
doubleclick.net googlesyndication.com googleadservices.com google-analytics.com googletagmanager.com
googletagservices.com adservice.google.com adnxs.com adsrvr.org advertising.com taboola.com outbrain.com
criteo.com criteo.net pubmatic.com rubiconproject.com openx.net amazon-adsystem.com scorecardresearch.com
quantserve.com quantcount.com moatads.com hotjar.com connect.facebook.net ads-twitter.com analytics.twitter.com
bat.bing.com adform.net smartadserver.com yieldmo.com teads.tv zedo.com media.net revcontent.com mgid.com
popads.net propellerads.com exoclick.com adcolony.com applovin.com chartbeat.com chartbeat.net crwdcntrl.net
bluekai.com demdex.net everesttech.net casalemedia.com indexww.com sharethrough.com 33across.com lijit.com
sovrn.com contextweb.com adsafeprotected.com doubleverify.com serving-sys.com ads.yahoo.com analytics.yahoo.com
adroll.com bidswitch.net turn.com mathtag.com rlcdn.com agkn.com krxd.net tapad.com adsymptotic.com
yieldlab.net smaato.net inmobi.com adhigh.net onetag-sys.com 3lift.com triplelift.com gumgum.com
omnitagjs.com trafficjunky.net juicyads.com hilltopads.net adcash.com clickadu.com popcash.net
mc.yandex.ru adfox.ru an.yandex.ru ads.linkedin.com px.ads.linkedin.com ads.tiktok.com analytics.tiktok.com
static.ads-twitter.com pixel.facebook.com an.facebook.com ads.pinterest.com ct.pinterest.com
`.split(/\s+/).filter(Boolean));

function isAd(u) {
  let host;
  try { host = new URL(u).hostname; } catch { return false; }
  while (host) {
    if (AD_HOSTS.has(host)) return true;
    const i = host.indexOf('.');
    if (i < 0) break;
    host = host.slice(i + 1);
  }
  return false;
}

/* ---------------- helpers ---------------- */
const hostOf = wc => (wc && wc.getType && wc.getType() === 'webview' ? wc.hostWebContents : wc);
const winOf = wc => { const h = hostOf(wc); return h && !h.isDestroyed() ? BrowserWindow.fromWebContents(h) : null; };
const isIncog = wc => !!(winOf(wc) && winOf(wc).incognito);
function sendHost(wc, ...args) { const h = hostOf(wc); if (h && !h.isDestroyed()) h.send(...args); }

const COLORS = {
  light: { bg: '#dfe3ea', fg: '#1f2328' },
  dark: { bg: '#1c1d22', fg: '#e8e9ed' },
  incog: { bg: '#241b35', fg: '#efeaf8' },
};

/* ---------------- sessions (cookies, downloads, permissions) ---------------- */
const downloads = new Map();
let dlId = 0;
const permMemory = new Map();
const readySessions = new WeakSet();

function setupSession(ses) {
  if (readySessions.has(ses)) return;
  readySessions.add(ses);
  ses.protocol.handle('man', manHandler);
  ses.setUserAgent(app.userAgentFallback, acceptLanguages());

  // Google refuses to sign in inside apps built on Electron ("This browser or app may not be secure"),
  // but supports Firefox. On Google's sign-in pages only, Man Browser presents itself as Firefox.
  ses.webRequest.onBeforeSendHeaders({ urls: ['https://accounts.google.com/*'] }, (d, cb) => {
    const h = d.requestHeaders;
    h['User-Agent'] = FIREFOX_UA;
    for (const k of Object.keys(h)) if (/^sec-ch-ua/i.test(k)) delete h[k]; // Firefox doesn't send client hints
    cb({ requestHeaders: h });
  });

  ses.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] }, (d, cb) => {
    if (store.settings.adblock && d.resourceType !== 'mainFrame' && isAd(d.url)) {
      store.blockedTotal++;
      const wc = d.webContentsId ? webContents.fromId(d.webContentsId) : null;
      if (wc && !wc.isDestroyed()) sendHost(wc, 'blocked', d.webContentsId);
      return cb({ cancel: true });
    }
    cb({});
  });

  ses.setPermissionRequestHandler((wc, perm, cb, details) => {
    if (['fullscreen', 'clipboard-sanitized-write', 'pointerLock'].includes(perm)) return cb(true);
    const lab = T();
    if (!lab.perms[perm]) return cb(false);
    let origin = '';
    try { origin = new URL(details.requestingUrl || wc.getURL()).host; } catch { /* ignore */ }
    const key = `${origin}|${perm}`;
    if (permMemory.has(key)) return cb(permMemory.get(key));
    dialog.showMessageBox(winOf(wc), {
      type: 'question', buttons: [lab.allow, lab.block], defaultId: 1, cancelId: 1,
      title: 'Man Browser', message: lab.permAsk(origin, lab.perms[perm]),
    }).then(r => { const ok = r.response === 0; permMemory.set(key, ok); cb(ok); }).catch(() => cb(false));
  });

  ses.on('will-download', (_e, item, wc) => {
    const dir = app.getPath('downloads');
    const name = item.getFilename() || 'download';
    const ext = path.extname(name), base = path.basename(name, ext);
    let p = path.join(dir, name), n = 1;
    while (fs.existsSync(p)) p = path.join(dir, `${base} (${n++})${ext}`);
    item.setSavePath(p);
    const id = ++dlId;
    const send = state => sendHost(wc, 'download', {
      id, name: path.basename(p), path: p, url: item.getURL(),
      received: item.getReceivedBytes(), total: item.getTotalBytes(),
      state: state || (item.isPaused() ? 'paused' : 'progressing'),
    });
    downloads.set(id, { item, send });
    send();
    item.on('updated', (_ev, st) => send(st === 'interrupted' ? 'interrupted' : undefined));
    item.once('done', (_ev, st) => send(st));
  });
}

/* ---------------- keyboard shortcuts (work even when a page has focus) ---------------- */
function shortcut(i) {
  if (i.type !== 'keyDown') return null;
  const k = (i.key || '').toLowerCase(), c = i.control || i.meta, s = i.shift, a = i.alt;
  if (c && !a) {
    if (k === 't') return s ? 'reopen-tab' : 'new-tab';
    if (k === 'w' || k === 'f4') return 'close-tab';
    if (k === 'n') return s ? 'incognito' : 'new-window';
    if (k === 'tab') return s ? 'prev-tab' : 'next-tab';
    if (k === 'pagedown') return 'next-tab';
    if (k === 'pageup') return 'prev-tab';
    if (k === 'l') return 'focus-address';
    if (k === 'r') return s ? 'hard-reload' : 'reload';
    if (k === 'f5') return 'hard-reload';
    if (k === 'f') return 'find';
    if (k === 'h') return 'history';
    if (k === 'j') return 'downloads';
    if (k === 'd') return 'bookmark';
    if (k === 'p') return 'print';
    if (k === '=' || k === '+') return 'zoom-in';
    if (k === '-' || k === '_') return 'zoom-out';
    if (k === '0' && !s) return 'zoom-reset';
    const m = /^Digit([1-9])$/.exec(i.code || '');
    if (m && !s) return 'tab-' + m[1];
  }
  if (a && !c && !s) {
    if (k === 'arrowleft') return 'back';
    if (k === 'arrowright') return 'forward';
    if (k === 'home') return 'home';
    if (k === 'd') return 'focus-address';
  }
  if (!c && !a && !s) {
    if (k === 'f5') return 'reload';
    if (k === 'f6') return 'focus-address';
    if (k === 'f11') return 'fullscreen';
    if (k === 'f12') return 'devtools';
    if (k === 'browserback') return 'back';
    if (k === 'browserforward') return 'forward';
  }
  return null;
}

/* ---------------- page context menu ---------------- */
function contextMenu(wc, p) {
  const lab = T();
  const open = (u, fg = false) => sendHost(wc, 'open-tab', u, fg);
  const sep = { type: 'separator' };
  const t = [];
  if (p.linkURL) {
    t.push({ label: lab.openLinkTab, click: () => open(p.linkURL) },
      { label: lab.copyLink, click: () => clipboard.writeText(p.linkURL) },
      { label: lab.downloadLink, click: () => wc.downloadURL(p.linkURL) }, sep);
  }
  if (p.mediaType === 'image' && p.srcURL) {
    t.push({ label: lab.openImgTab, click: () => open(p.srcURL) },
      { label: lab.saveImg, click: () => wc.downloadURL(p.srcURL) },
      { label: lab.copyImg, click: () => wc.copyImageAt(p.x, p.y) }, sep);
  }
  if (p.isEditable) {
    t.push({ label: lab.cut, enabled: p.editFlags.canCut, click: () => wc.cut() },
      { label: lab.copy, enabled: p.editFlags.canCopy, click: () => wc.copy() },
      { label: lab.paste, enabled: p.editFlags.canPaste, click: () => wc.paste() },
      { label: lab.selectAll, click: () => wc.selectAll() }, sep);
  } else if (p.selectionText && p.selectionText.trim()) {
    const s = p.selectionText.trim().replace(/\s+/g, ' ');
    t.push({ label: lab.copy, click: () => wc.copy() },
      { label: lab.searchFor(s.length > 32 ? s.slice(0, 32) + '…' : s), click: () => sendHost(wc, 'search', s) }, sep);
  }
  const nh = wc.navigationHistory;
  t.push({ label: lab.back, enabled: nh.canGoBack(), click: () => nh.goBack() },
    { label: lab.forward, enabled: nh.canGoForward(), click: () => nh.goForward() },
    { label: lab.reload, click: () => wc.reload() }, sep,
    { label: lab.viewSource, click: () => open('view-source:' + wc.getURL(), true) },
    { label: lab.inspect, click: () => wc.inspectElement(p.x, p.y) });
  Menu.buildFromTemplate(t).popup({ window: winOf(wc) });
}

app.on('web-contents-created', (_e, wc) => {
  const type = wc.getType();
  if (type !== 'webview' && type !== 'window') return;
  wc.on('before-input-event', (ev, input) => {
    if (type === 'window' && !BrowserWindow.fromWebContents(wc)) return; // devtools etc.
    const c = shortcut(input);
    if (!c) return;
    ev.preventDefault();
    sendHost(wc, 'cmd', c);
  });
  if (type === 'webview') {
    // keep navigator.userAgent in step with the headers on Google's sign-in pages
    wc.on('did-start-navigation', (details, legacyUrl, _inPlace, legacyMain) => {
      const url = (details && details.url) || legacyUrl;
      const main = details && 'isMainFrame' in details ? details.isMainFrame : legacyMain;
      if (!main || !url) return;
      const ua = GOOGLE_LOGIN.test(url) ? FIREFOX_UA : app.userAgentFallback;
      if (wc.getUserAgent() !== ua) wc.setUserAgent(ua);
    });
    wc.setWindowOpenHandler(({ url, disposition }) => {
      sendHost(wc, 'open-tab', url, disposition !== 'background-tab');
      return { action: 'deny' };
    });
    wc.on('context-menu', (_ev, p) => contextMenu(wc, p));
    // browser.domain's tool buttons link to man://browser.domain/cmd/<name>: run that browser command.
    // Only the browser.domain page itself may do this, never another site.
    wc.on('will-navigate', (ev, url) => {
      const m = /^man:\/\/browser\.domain\/cmd\/([a-z-]+)$/i.exec(url);
      if (!m) return;
      ev.preventDefault();
      if (!/^man:\/\/browser\.domain\//i.test(wc.getURL())) return;
      if (HUB_CMDS.has(m[1])) sendHost(wc, 'cmd', m[1]);
    });
    // A page asked "are you sure you want to leave?". Electron would silently cancel the navigation,
    // so ask the person like Chrome does.
    wc.on('will-prevent-unload', ev => {
      const lab = T();
      const r = dialog.showMessageBoxSync(winOf(wc), {
        type: 'question', buttons: [lab.leave, lab.stay], defaultId: 0, cancelId: 1,
        title: 'Man Browser', message: lab.leaveQ, detail: lab.leaveD,
      });
      if (r === 0) ev.preventDefault(); // leave anyway
    });
  }
});

/* ---------------- windows ---------------- */
const initialUrls = new Map(); // host webContents id -> urls to open
const sessions = new Map();    // host webContents id -> open tab urls

function isDarkPref() {
  const th = store.settings.theme;
  return th === 'dark' || (th === 'system' && nativeTheme.shouldUseDarkColors);
}

function createWindow({ incognito = false, urls = [] } = {}) {
  const c = incognito ? COLORS.incog : isDarkPref() ? COLORS.dark : COLORS.light;
  const icon = path.join(__dirname, 'assets', 'icon.png');
  const win = new BrowserWindow({
    width: 1280, height: 840, minWidth: 520, minHeight: 360, show: false,
    title: 'Man Browser', backgroundColor: c.bg,
    ...(fs.existsSync(icon) ? { icon } : {}),
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: c.bg, symbolColor: c.fg, height: 40 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true, contextIsolation: true, nodeIntegration: false, spellcheck: true,
    },
  });
  win.incognito = incognito;
  const id = win.webContents.id;
  initialUrls.set(id, urls);
  win.loadFile(path.join(__dirname, 'src', 'index.html'), incognito ? { query: { incognito: '1' } } : undefined);
  // Show as soon as Chromium says it's ready, but never stay invisible: in 1.1.1 'ready-to-show'
  // sometimes never fired, leaving a hidden window that swallowed every later launch.
  const reveal = () => { if (!win.isDestroyed() && !win.isVisible()) win.show(); };
  win.once('ready-to-show', reveal);
  win.webContents.once('did-finish-load', reveal);
  setTimeout(reveal, 2500);
  if (SHOT) win.webContents.on('console-message', (_e, level, msg) => console.log('[renderer]', msg));
  win.on('enter-full-screen', () => win.webContents.send('fullscreen', true));
  win.on('leave-full-screen', () => win.webContents.send('fullscreen', false));
  win.on('close', () => {
    if (incognito) return;
    const others = BrowserWindow.getAllWindows().filter(w => w !== win && !w.incognito);
    if (others.length) sessions.delete(id); // keep the last normal window's tabs for next launch
  });
  win.on('closed', () => {
    initialUrls.delete(id);
    if (incognito && !BrowserWindow.getAllWindows().some(w => w.incognito)) {
      const ses = session.fromPartition('incognito');
      ses.clearStorageData().catch(() => {});
      ses.clearCache().catch(() => {});
    }
  });
  return win;
}

function persistSession() {
  if (SHOT) return;
  store.session = [...sessions.values()].filter(a => a && a.length);
  saveNow();
}

/* ---------------- IPC ---------------- */
ipcMain.handle('init', e => ({
  settings: store.settings, bookmarks: store.bookmarks, blockedTotal: store.blockedTotal,
  urls: initialUrls.get(e.sender.id) || [],
  versions: { app: app.getVersion(), chrome: process.versions.chrome, electron: process.versions.electron },
}));

ipcMain.on('store:set', (e, key, val) => {
  if (key !== 'settings' && key !== 'bookmarks') return;
  store[key] = val;
  if (key === 'settings') {
    nativeTheme.themeSource = val.theme || 'system';
    // websites get the new language right away (Accept-Language)
    for (const p of ['persist:main', 'incognito']) session.fromPartition(p).setUserAgent(app.userAgentFallback, acceptLanguages());
  }
  save();
  for (const w of BrowserWindow.getAllWindows()) if (w.webContents !== e.sender) w.webContents.send('store-changed', key, val);
});

ipcMain.on('theme', (e, dark) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (!w) return;
  const c = w.incognito ? COLORS.incog : dark ? COLORS.dark : COLORS.light;
  try { w.setTitleBarOverlay({ color: c.bg, symbolColor: c.fg, height: 40 }); w.setBackgroundColor(c.bg); } catch { /* ignore */ }
});

ipcMain.on('history:add', (e, { url, title }) => {
  if (isIncog(e.sender) || typeof url !== 'string') return;
  const H = store.history, now = Date.now(), last = H[H.length - 1];
  if (last && last.url === url && now - last.time < 30 * 60e3) { last.time = now; if (title) last.title = title; }
  else H.push({ url, title: title || '', time: now });
  if (H.length > 5000) H.splice(0, H.length - 5000);
  save();
});
ipcMain.on('history:update', (e, url, patch) => {
  if (isIncog(e.sender)) return;
  const H = store.history;
  for (let i = H.length - 1; i >= Math.max(0, H.length - 50); i--) {
    if (H[i].url !== url) continue;
    if (patch.title) H[i].title = String(patch.title).slice(0, 300);
    if (patch.favicon && String(patch.favicon).length < 2000) H[i].favicon = String(patch.favicon);
    save();
    break;
  }
});
ipcMain.handle('history:query', (_e, q) => {
  q = String(q || '').toLowerCase();
  const out = [];
  for (let i = store.history.length - 1; i >= 0 && out.length < 600; i--) {
    const h = store.history[i];
    if (!q || h.url.toLowerCase().includes(q) || (h.title || '').toLowerCase().includes(q)) out.push(h);
  }
  return out;
});
ipcMain.on('history:remove', (_e, time) => { store.history = store.history.filter(h => h.time !== time); save(); });
ipcMain.on('history:clear', () => { store.history = []; save(); });

ipcMain.handle('suggest', (_e, query) => {
  const q = String(query || '').toLowerCase().trim();
  if (!q) return [];
  const strip = u => u.toLowerCase().replace(/^https?:\/\/(www\.)?/, '');
  const found = new Map();
  const add = (o, score) => {
    const cur = found.get(o.url);
    if (cur) { cur.score += score; if (!cur.title && o.title) cur.title = o.title; if (!cur.favicon && o.favicon) cur.favicon = o.favicon; return; }
    found.set(o.url, { url: o.url, title: o.title || '', favicon: o.favicon || null, score });
  };
  const match = o => strip(o.url).includes(q) || (o.title || '').toLowerCase().includes(q);
  for (const b of store.bookmarks) if (match(b)) add(b, 60 + (strip(b.url).startsWith(q) ? 40 : 0));
  const H = store.history;
  for (let i = H.length - 1, n = 0; i >= 0 && n < 4000; i--, n++) {
    if (match(H[i])) add(H[i], 4 + (strip(H[i].url).startsWith(q) ? 12 : 0));
  }
  return [...found.values()].sort((a, b) => b.score - a.score).slice(0, 6);
});

ipcMain.handle('top-sites', () => {
  const m = new Map(), H = store.history;
  for (let i = Math.max(0, H.length - 3000); i < H.length; i++) {
    let u;
    try { u = new URL(H[i].url); } catch { continue; }
    if (!/^https?:$/.test(u.protocol)) continue;
    const host = u.hostname.replace(/^www\./, '');
    const e = m.get(u.origin) || { url: u.origin + '/', title: '', favicon: null, n: 0, host };
    e.n++;
    if (H[i].favicon) e.favicon = H[i].favicon;
    if (u.pathname === '/' && H[i].title) e.title = H[i].title;
    m.set(u.origin, e);
  }
  return [...m.values()].sort((a, b) => b.n - a.n).slice(0, 8)
    .map(e => ({ url: e.url, title: e.title || e.host, favicon: e.favicon }));
});

/* ---------------- Man Browser account (stays signed in: the session token is saved in browser-data.json) ---------------- */
async function accountApi(fn, body) {
  const r = await net.fetch(`${DOMAINS_API}/rpc/${fn}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  return r.json();
}
const publicAccount = () => (store.account ? { username: store.account.username, role: store.account.role } : null);
function accountChanged() {
  saveNow();
  for (const w of BrowserWindow.getAllWindows()) w.webContents.send('account-changed', publicAccount());
}
async function accountSignIn(kind, username, password) {
  try {
    const res = await accountApi(kind === 'signup' ? 'acct_signup' : 'acct_login', { username, password });
    if (!res || !res.ok) return { error: (res && res.error) || 'server' };
    store.account = { token: res.token, username: res.user.username, role: res.user.role };
    accountChanged();
    return { ok: true, account: publicAccount() };
  } catch { return { error: 'offline' }; }
}
async function refreshAccount() {
  if (!store.account) return;
  try {
    const res = await accountApi('acct_me', { token: store.account.token });
    if (res && res.ok) {
      if (res.user.role !== store.account.role || res.user.username !== store.account.username) {
        Object.assign(store.account, res.user);
        accountChanged();
      }
    } else if (res && res.error === 'signed_out') { store.account = null; accountChanged(); }
  } catch { /* offline: keep the saved account */ }
}
ipcMain.handle('account:get', () => publicAccount());
ipcMain.handle('account:signup', (_e, username, password) => accountSignIn('signup', username, password));
ipcMain.handle('account:login', (_e, username, password) => accountSignIn('login', username, password));
ipcMain.handle('account:logout', async () => {
  const token = store.account && store.account.token;
  store.account = null;
  accountChanged();
  if (token) accountApi('acct_logout', { token }).catch(() => {});
  return true;
});

// decide whether a typed host is a real website or a free Man Studio domain
ipcMain.handle('resolve', async (_e, host) => {
  host = String(host || '').toLowerCase();
  if (host.endsWith('.domain')) return 'man';
  if (!INTERNAL_TLD.test(host)) return 'web';
  return (await realDomainExists(host)) ? 'web' : 'man';
});

ipcMain.on('session',(e, urls) => { if (!isIncog(e.sender) && Array.isArray(urls)) sessions.set(e.sender.id, urls); });

ipcMain.handle('menu', (e, items, x, y) => new Promise(resolve => {
  const build = list => list.map(it => (it.sep ? { type: 'separator' } : {
    label: it.label, enabled: it.enabled !== false, accelerator: it.accel, registerAccelerator: false,
    ...(it.checked !== undefined ? { type: 'checkbox', checked: !!it.checked } : {}),
    ...(it.sub ? { submenu: build(it.sub) } : { click: () => resolve(it.id) }),
  }));
  Menu.buildFromTemplate(build(items)).popup({
    window: BrowserWindow.fromWebContents(e.sender), x: Math.round(x), y: Math.round(y),
    callback: () => setTimeout(() => resolve(null), 150),
  });
}));

ipcMain.on('dl', (_e, action, id, p) => {
  const d = downloads.get(id);
  if (action === 'open' && p) shell.openPath(p);
  else if (action === 'show' && p) shell.showItemInFolder(p);
  else if (d && action === 'cancel') d.item.cancel();
  else if (d && action === 'pause') { d.item.pause(); d.send(); }
  else if (d && action === 'resume') { d.item.resume(); d.send(); }
});

/* ---------------- automatic updates (GitHub Releases of manorkeshet417-code/man-browser) ----------------
   Only the installed version (Setup EXE) updates itself; the portable EXE can't replace itself. */
let updateReady = null;
function setupUpdates() {
  if (!app.isPackaged || (SHOT && !process.env.MB_TEST_UPDATE)) return;
  if (process.env.PORTABLE_EXECUTABLE_FILE) return; // portable build
  let autoUpdater;
  try { ({ autoUpdater } = require('electron-updater')); } catch { return; }
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = !SHOT; // a downloaded update installs when the browser closes (never in tests)
  autoUpdater.on('update-downloaded', info => {
    updateReady = info.version;
    for (const w of BrowserWindow.getAllWindows()) w.webContents.send('update-ready', info.version);
    if (SHOT) console.log('[update] downloaded', info.version);
  });
  autoUpdater.on('error', err => console.error('[update] error', err && err.message));
  if (SHOT) {
    autoUpdater.on('update-available', info => console.log('[update] available', info.version));
    autoUpdater.on('update-not-available', info => console.log('[update] none, latest is', info.version));
  }
  const check = () => autoUpdater.checkForUpdates().catch(err => console.error('[update] check failed', err && err.message));
  setTimeout(check, 8000);              // shortly after start
  setInterval(check, 4 * 60 * 60e3);    // and every 4 hours while open
  ipcMain.on('update-install', () => { persistSession(); autoUpdater.quitAndInstall(true, true); });
}
ipcMain.handle('update-status', () => updateReady);

ipcMain.on('new-window', (_e, incog) => createWindow({ incognito: !!incog }));
ipcMain.on('fullscreen', e => { const w = BrowserWindow.fromWebContents(e.sender); if (w) w.setFullScreen(!w.isFullScreen()); });
ipcMain.handle('clear-data', async e => {
  const incog = isIncog(e.sender);
  const ses = session.fromPartition(incog ? 'incognito' : 'persist:main');
  await ses.clearStorageData();
  await ses.clearCache();
  if (!incog) { store.history = []; save(); }
  return true;
});

/* ---------------- app lifecycle ---------------- */
const urlsFromArgv = argv => argv.filter(a => /^https?:\/\//i.test(a));

if (!SHOT && !app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', (_e, argv) => {
    const urls = urlsFromArgv(argv);
    const win = BrowserWindow.getAllWindows().find(w => !w.incognito);
    if (!win) return createWindow({ urls });
    if (!win.isVisible()) win.show();
    if (win.isMinimized()) win.restore();
    win.focus();
    if (urls.length) urls.forEach(u => win.webContents.send('open-tab', u, true));
    else win.webContents.send('cmd', 'new-tab');
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    nativeTheme.themeSource = store.settings.theme || 'system';
    app.userAgentFallback = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome} Safari/537.36`;
    setupSession(session.fromPartition('persist:main'));
    setupSession(session.fromPartition('incognito'));
    setupUpdates();
    refreshAccount();

    const argUrls = urlsFromArgv(process.argv);
    if (process.env.MB_URL) argUrls.push(process.env.MB_URL);
    // After every update, show the "What's new" page once
    if ((!SHOT || process.env.MB_TEST_WHATSNEW) && store.lastVersion !== app.getVersion()) {
      argUrls.unshift(WHATS_NEW);
      store.lastVersion = app.getVersion();
      saveNow();
    }
    const saved = store.settings.startup === 'restore' && !SHOT ? (store.session || []).filter(a => a && a.length) : [];
    if (saved.length) saved.forEach((urls, i) => createWindow({ urls: i === 0 ? argUrls.concat(urls) : urls }));
    else createWindow({ urls: argUrls, incognito: process.env.MB_INCOG === '1' });

    if (SHOT) {
      setTimeout(async () => {
        try {
          const w = BrowserWindow.getAllWindows()[0];
          if (process.env.MB_CMD) {
            for (const c of process.env.MB_CMD.split(',')) {
              if (c.startsWith('open:')) w.webContents.send('open-tab', c.slice(5), true);
              else w.webContents.send('cmd', c);
              await new Promise(r => setTimeout(r, +(process.env.MB_GAP || 900)));
            }
          }
          if (process.env.MB_DUMP) console.log('[dump]', await w.webContents.executeJavaScript(process.env.MB_DUMP).catch(e => 'ERR ' + e));
          const img = await w.webContents.capturePage();
          fs.writeFileSync(SHOT, img.toPNG());
        } catch (err) { console.error(err); }
        app.exit(0);
      }, +(process.env.MB_SHOT_DELAY || 7000));
    }
  });

  app.on('before-quit', persistSession);
  app.on('window-all-closed', () => { persistSession(); app.quit(); });
}
