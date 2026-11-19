// Man Studio free domains + Man Browser accounts — Cloudflare Worker + D1.
// Every call: POST /rpc/<name> with a JSON body, JSON answer.

// Free endings. Keep in sync with main.js, src/renderer.js and src/registrar/app.js.
const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]{0,40}[a-z0-9])?\.(fun|com|net|org|io|app|dev|xyz|site|online|game|me|blog|art|club|store|tech|co\.ms|ms|man|web)$/;
const DEV_ONLY_TLDS = new Set(['man']); // only Man Studio (role 'dev') may register these
const RESERVED = new Set(['manstudio', 'man-studio', 'www', 'admin', 'support', 'official']);
const MAX_PER_OWNER = 10;
const MAX_HTML = 1800000;       // ~1.8 MB per site (D1 rows can hold up to 2 MB)
const MAX_BODY = 4 * 1024 * 1024; // the JSON request can be bigger than the HTML (escaped quotes/newlines)

// accounts
const PBKDF2_ITERATIONS = 100000;
const DEV_UNAME = 'manstudio';   // "Man Studio", "man studio", "ManStudio"... all the same account
const MAX_FAILED = 10;           // wrong passwords before a short lock
const LOCK_MINUTES = 15;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, apikey',
  'Access-Control-Max-Age': '86400',
};
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS },
});

const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const unhex = h => new Uint8Array(h.match(/../g).map(x => parseInt(x, 16)));
async function sha256(text) {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(text ?? ''))));
}
const randomHex = n => hex(crypto.getRandomValues(new Uint8Array(n)));
async function pbkdf2(password, saltHex, iterations) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unhex(saltHex), iterations }, key, 256));
}
function sameHex(a, b) { // constant-time compare
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

const norm = d => String(d ?? '').trim().toLowerCase();
const now = () => new Date().toISOString();
const tokenOk = t => typeof t === 'string' && t.length >= 20;
const cleanName = u => String(u ?? '').trim().replace(/\s+/g, ' ');
const unameOf = u => cleanName(u).toLowerCase().replace(/[\s._-]+/g, '');
const USERNAME_RE = /^[\p{L}\p{N}][\p{L}\p{N} ._-]{1,22}[\p{L}\p{N}]$/u;
const publicUser = u => ({ username: u.username, role: u.role });

async function userFromToken(db, token) {
  if (!tokenOk(token)) return null;
  const th = await sha256(token);
  const u = await db.prepare('SELECT u.id, u.username, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?')
    .bind(th).first();
  if (u) await db.prepare('UPDATE sessions SET last_used = ? WHERE token_hash = ?').bind(now(), th).run();
  return u || null;
}
async function newSession(db, userId) {
  const token = randomHex(32);
  await db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, last_used) VALUES (?, ?, ?, ?)')
    .bind(await sha256(token), userId, now(), now()).run();
  return token;
}

async function check(db, d, user) {
  if (!DOMAIN_RE.test(d)) return 'invalid';
  const isDev = !!user && user.role === 'dev';
  if (RESERVED.has(d.split('.')[0]) && !isDev) return 'reserved'; // e.g. manstudio.fun: only Man Studio may take it
  const tld = d.slice(d.indexOf('.') + 1);
  if (DEV_ONLY_TLDS.has(tld) && !isDev) return 'dev_only';
  const row = await db.prepare('SELECT 1 FROM sites WHERE domain = ?').bind(d).first();
  return row ? 'taken' : 'ok';
}

const RPC = {
  /* ---------- accounts ---------- */
  async acct_signup(db, a) {
    const username = cleanName(a.username), uname = unameOf(a.username), password = String(a.password ?? '');
    if (!USERNAME_RE.test(username)) return { error: 'bad_username' };
    if (password.length < 8 || password.length > 128) return { error: 'bad_password' };
    let role = 'user';
    if (uname === DEV_UNAME) {
      const open = await db.prepare("SELECT value FROM meta WHERE key = 'dev_signup_open'").first();
      if (!open || open.value !== '1') return { error: 'taken' };
      role = 'dev';
    }
    const salt = randomHex(16);
    const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
    let id;
    try {
      const r = await db.prepare('INSERT INTO users (username, uname, pass_hash, salt, iterations, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(username, uname, hash, salt, PBKDF2_ITERATIONS, role, now()).run();
      id = r.meta.last_row_id;
    } catch { return { error: 'taken' }; }
    if (role === 'dev') await db.prepare("UPDATE meta SET value = '0' WHERE key = 'dev_signup_open'").run();
    return { ok: true, token: await newSession(db, id), user: { username, role } };
  },

  async acct_login(db, a) {
    const u = await db.prepare('SELECT * FROM users WHERE uname = ?').bind(unameOf(a.username)).first();
    if (!u) return { error: 'wrong' };
    if (u.locked_until && u.locked_until > now()) return { error: 'locked' };
    const ok = sameHex(await pbkdf2(String(a.password ?? ''), u.salt, u.iterations), u.pass_hash);
    if (!ok) {
      const failed = u.failed + 1;
      const lock = failed >= MAX_FAILED ? new Date(Date.now() + LOCK_MINUTES * 60e3).toISOString() : null;
      await db.prepare('UPDATE users SET failed = ?, locked_until = ? WHERE id = ?').bind(lock ? 0 : failed, lock, u.id).run();
      return { error: lock ? 'locked' : 'wrong' };
    }
    await db.prepare('UPDATE users SET failed = 0, locked_until = NULL WHERE id = ?').bind(u.id).run();
    return { ok: true, token: await newSession(db, u.id), user: publicUser(u) };
  },

  async acct_me(db, a) {
    const u = await userFromToken(db, a.token);
    return u ? { ok: true, user: publicUser(u) } : { error: 'signed_out' };
  },

  async acct_logout(db, a) {
    if (tokenOk(a.token)) await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(a.token)).run();
    return { ok: true };
  },

  /* ---------- free domains ---------- */
  async mb_site_check(db, a) {
    return check(db, norm(a.p_domain), await userFromToken(db, a.p_session));
  },

  async mb_site_get(db, a) {
    const d = norm(a.p_domain);
    await db.prepare('UPDATE sites SET views = views + 1 WHERE domain = ?').bind(d).run();
    const { results } = await db.prepare('SELECT domain, title, html, views, updated_at FROM sites WHERE domain = ?').bind(d).all();
    return results;
  },

  async mb_site_register(db, a) {
    const d = norm(a.p_domain);
    if (!tokenOk(a.p_token)) return 'bad_token';
    const st = await check(db, d, await userFromToken(db, a.p_session));
    if (st !== 'ok') return st;
    const h = await sha256(a.p_token);
    const { n } = await db.prepare('SELECT COUNT(*) AS n FROM sites WHERE owner_hash = ?').bind(h).first();
    if (n >= MAX_PER_OWNER) return 'limit';
    const html = String(a.p_html ?? '');
    if (html.length > MAX_HTML) return 'too_big';
    try {
      await db.prepare('INSERT INTO sites (domain, title, html, owner_hash, views, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)')
        .bind(d, String(a.p_title ?? '').slice(0, 120), html, h, now(), now()).run();
    } catch { return 'taken'; }
    return 'ok';
  },

  async mb_site_update(db, a) {
    const html = String(a.p_html ?? '');
    const d = norm(a.p_domain);
    if (!tokenOk(a.p_token)) { console.log('update refused: bad token', d); return false; }
    if (html.length > MAX_HTML) { console.log('update refused: too big', d, html.length); return false; }
    const h = await sha256(a.p_token);
    const r = await db.prepare('UPDATE sites SET title = ?, html = ?, updated_at = ? WHERE domain = ? AND owner_hash = ?')
      .bind(String(a.p_title ?? '').slice(0, 120), html, now(), d, h).run();
    if (r.meta.changes > 0) return true;
    const row = await db.prepare('SELECT owner_hash FROM sites WHERE domain = ?').bind(d).first();
    console.log('update refused:', row ? 'not the owner' : 'no such site', JSON.stringify(d), 'html', html.length, 'token', String(a.p_token).length);
    return false;
  },

  async mb_site_delete(db, a) {
    if (!tokenOk(a.p_token)) return false;
    const r = await db.prepare('DELETE FROM sites WHERE domain = ? AND owner_hash = ?')
      .bind(norm(a.p_domain), await sha256(a.p_token)).run();
    return r.meta.changes > 0;
  },

  async mb_sites_mine(db, a) {
    if (!tokenOk(a.p_token)) return [];
    const { results } = await db.prepare('SELECT domain, title, html, views, updated_at FROM sites WHERE owner_hash = ? ORDER BY created_at')
      .bind(await sha256(a.p_token)).all();
    return results;
  },

  async mb_sites_recent(db) {
    const { results } = await db.prepare('SELECT domain, title, created_at FROM sites ORDER BY created_at DESC LIMIT 24').all();
    return results;
  },
};

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const url = new URL(req.url);
    if (url.pathname === '/' && req.method === 'GET') return json({ service: 'manstudio.domain', ok: true });

    const m = /^\/rpc\/([a-z_]+)$/.exec(url.pathname);
    if (!m || req.method !== 'POST' || !RPC[m[1]]) return json({ error: 'not_found' }, 404);
    const size = Number(req.headers.get('content-length') || 0);
    if (size > MAX_BODY) { console.log('rejected: request too big', m[1], size); return json({ error: 'too_big', limit: MAX_HTML }, 413); }

    let args = {};
    try { args = await req.json(); } catch { console.log('rejected: bad json', m[1], size); return json({ error: 'bad_json' }, 400); }
    if (!args || typeof args !== 'object') args = {};
    try {
      return json(await RPC[m[1]](env.DB, args));
    } catch (e) {
      console.log('server error', m[1], String(e && e.message));
      return json({ error: 'server_error' }, 500);
    }
  },
};
