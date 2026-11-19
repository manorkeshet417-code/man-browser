// Man Studio free domains + Man Browser accounts — Cloudflare Worker + D1.
// Every call: POST /rpc/<name> with a JSON body, JSON answer.

// Free endings. Keep in sync with main.js, src/renderer.js and src/registrar/app.js.
const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]{0,40}[a-z0-9])?\.(fun|com|net|org|io|app|dev|xyz|site|online|game|me|blog|art|club|store|tech|co\.ms|ms|man|web)$/;
const DEV_ONLY_TLDS = new Set(['man']); // only Man Studio (role 'dev') may register these
const RESERVED = new Set(['manstudio', 'man-studio', 'www', 'admin', 'support', 'official']);
const MAX_PER_OWNER = 10;
const MAX_HTML = 1800000;           // old JSON API (mb_site_update): up to ~1.8 MB
const MAX_BODY = 4 * 1024 * 1024;   // JSON requests
const MAX_SITE = 30 * 1024 * 1024;  // a site can be up to 30 MB of UTF-8 (raw PUT /site/<domain>)
const CHUNK = 900000;               // chars per row for the old JSON path (writeSite)

// accounts
const PBKDF2_ITERATIONS = 100000;
const DEV_UNAME = 'manstudio';   // "Man Studio", "man studio", "ManStudio"... all the same account
const MAX_FAILED = 10;           // wrong passwords before a short lock
const LOCK_MINUTES = 15;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, apikey, X-Owner-Key, X-Title',
  'Access-Control-Expose-Headers': 'X-Title, X-Size',
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

/* ---------- site storage: small sites in sites.html, big ones split into site_chunks rows ---------- */
async function readSite(db, d, countView) {
  const row = await db.prepare('SELECT title, html, chunks, size, views, updated_at FROM sites WHERE domain = ?').bind(d).first();
  if (!row) return null;
  if (countView) await db.prepare('UPDATE sites SET views = views + 1 WHERE domain = ?').bind(d).run();
  let html = row.html;
  if (row.chunks > 0) {
    const { results } = await db.prepare('SELECT data FROM site_chunks WHERE domain = ? ORDER BY idx').bind(d).all();
    if (results.every(r => typeof r.data === 'string')) html = results.map(r => r.data).join('');
    else {
      const parts = results.map(r => (typeof r.data === 'string' ? new TextEncoder().encode(r.data) : new Uint8Array(r.data)));
      const all = new Uint8Array(parts.reduce((n, x) => n + x.length, 0));
      let o = 0; for (const x of parts) { all.set(x, o); o += x.length; }
      html = new TextDecoder().decode(all);
    }
  }
  return { domain: d, title: row.title, html, views: row.views + (countView ? 1 : 0), updated_at: row.updated_at };
}
async function writeSite(db, d, title, html) {
  const t = now(), stmts = [db.prepare('DELETE FROM site_chunks WHERE domain = ?').bind(d)];
  if (html.length <= CHUNK) {
    stmts.push(db.prepare('UPDATE sites SET title = ?, html = ?, chunks = 0, size = ?, updated_at = ? WHERE domain = ?')
      .bind(title, html, html.length, t, d));
  } else {
    let n = 0;
    for (let i = 0; i < html.length; i += CHUNK, n++) {
      stmts.push(db.prepare('INSERT INTO site_chunks (domain, idx, data) VALUES (?, ?, ?)').bind(d, n, html.slice(i, i + CHUNK)));
    }
    stmts.push(db.prepare("UPDATE sites SET title = ?, html = '', chunks = ?, size = ?, updated_at = ? WHERE domain = ?")
      .bind(title, n, html.length, t, d));
  }
  await db.batch(stmts); // all or nothing
}
async function ownsSite(db, d, token) {
  if (!tokenOk(token)) return 'bad_token';
  const row = await db.prepare('SELECT owner_hash FROM sites WHERE domain = ?').bind(d).first();
  if (!row) return 'no_site';
  return row.owner_hash === await sha256(token) ? 'ok' : 'not_owner';
}

/* Big sites are streamed piece by piece: a free Worker has 128 MB of memory, so a 30 MB page
   must never be held in memory as a whole (it failed at 29 MB when it was). */
async function streamPublish(db, d, title, body) {
  // leftovers from an upload that died half way
  await db.prepare("DELETE FROM site_chunks WHERE domain LIKE ? || '#%'").bind(d).run();
  const tmp = `${d}#${randomHex(6)}`; // write under a temporary name, switch over at the end (all or nothing)
  // Pieces are stored as TEXT: binding bytes to D1 is far more expensive and hit the free CPU limit.
  const reader = body.getReader(), dec = new TextDecoder();
  let buf = '', n = 0, total = 0, first = '';
  const flush = async part => {
    if (n === 0) first = part;
    await db.prepare('INSERT INTO site_chunks (domain, idx, data) VALUES (?, ?, ?)').bind(tmp, n++, part).run();
  };
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (value) {
        total += value.length;
        if (total > MAX_SITE) throw Object.assign(new Error('too_big'), { tooBig: true });
        buf += dec.decode(value, { stream: true });
      }
      if (done) buf += dec.decode();
      while (buf.length >= CHUNK) { await flush(buf.slice(0, CHUNK)); buf = buf.slice(CHUNK); }
      if (done) { if (buf.length || n === 0) await flush(buf); break; }
    }
  } catch (e) {
    try { reader.cancel(); } catch { /* ignore */ }
    await db.prepare('DELETE FROM site_chunks WHERE domain = ?').bind(tmp).run();
    throw e;
  }
  const t = now();
  if (n === 1) { // small: keep it in the sites row like before
    await db.batch([
      db.prepare('DELETE FROM site_chunks WHERE domain IN (?, ?)').bind(d, tmp),
      db.prepare('UPDATE sites SET title = ?, html = ?, chunks = 0, size = ?, updated_at = ? WHERE domain = ?').bind(title, first, total, t, d),
    ]);
  } else {
    await db.batch([
      db.prepare('DELETE FROM site_chunks WHERE domain = ?').bind(d),
      db.prepare('UPDATE site_chunks SET domain = ? WHERE domain = ?').bind(d, tmp),
      db.prepare("UPDATE sites SET title = ?, html = '', chunks = ?, size = ?, updated_at = ? WHERE domain = ?").bind(title, n, total, t, d),
    ]);
  }
  return total;
}
function streamSite(db, d, row) {
  const enc = new TextEncoder();
  let i = 0;
  return new ReadableStream({
    async pull(ctrl) {
      if (row.chunks === 0) { ctrl.enqueue(enc.encode(row.html)); ctrl.close(); return; }
      if (i >= row.chunks) { ctrl.close(); return; }
      const r = await db.prepare('SELECT data FROM site_chunks WHERE domain = ? AND idx = ?').bind(d, i++).first();
      if (!r) return;
      ctrl.enqueue(typeof r.data === 'string' ? enc.encode(r.data) : new Uint8Array(r.data));
    },
  });
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
    // old browsers (before 1.4.0) load sites as JSON; a huge site would blow the Worker's memory that way
    const d = norm(a.p_domain);
    const row = await db.prepare('SELECT title, size FROM sites WHERE domain = ?').bind(d).first();
    if (row && row.size > 4 * 1024 * 1024) {
      return [{ domain: d, title: row.title, views: 0, updated_at: '',
        html: `<!doctype html><meta charset="utf-8"><title>${row.title || d}</title><body style="font:18px Segoe UI,sans-serif;display:grid;place-items:center;height:90vh;text-align:center"><div><h1>${d}</h1><p>This site is big. Update Man Browser to open it (⋮ menu → restart when the green update button appears).</p></div>` }];
    }
    const site = await readSite(db, d, true);
    return site ? [site] : [];
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
    if (html.length > MAX_HTML) { console.log('update refused: too big for JSON', d, html.length); return false; }
    const own = await ownsSite(db, d, a.p_token);
    if (own !== 'ok') { console.log('update refused:', own, JSON.stringify(d)); return false; }
    await writeSite(db, d, String(a.p_title ?? '').slice(0, 120), html);
    return true;
  },

  async mb_site_delete(db, a) {
    if (!tokenOk(a.p_token)) return false;
    const d = norm(a.p_domain);
    if (await ownsSite(db, d, a.p_token) !== 'ok') return false;
    await db.batch([
      db.prepare('DELETE FROM site_chunks WHERE domain = ?').bind(d),
      db.prepare('DELETE FROM sites WHERE domain = ?').bind(d),
    ]);
    return true;
  },

  async mb_sites_mine(db, a) {
    if (!tokenOk(a.p_token)) return [];
    // big sites come without html; the editor downloads them with GET /site/<domain>?noview=1
    const { results } = await db.prepare('SELECT domain, title, CASE WHEN chunks = 0 THEN html END AS html, chunks, size, views, updated_at FROM sites WHERE owner_hash = ? ORDER BY created_at')
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

    // raw site HTML: GET to show it, PUT (owner key in X-Owner-Key) to publish up to 30 MB
    const sm = /^\/site\/([a-z0-9.-]+)$/.exec(url.pathname);
    if (sm) {
      const d = norm(sm[1]);
      try {
        if (req.method === 'GET') {
          const row = await env.DB.prepare('SELECT title, html, chunks, size FROM sites WHERE domain = ?').bind(d).first();
          if (!row) return json({ error: 'no_site' }, 404);
          if (!url.searchParams.has('noview')) await env.DB.prepare('UPDATE sites SET views = views + 1 WHERE domain = ?').bind(d).run();
          return new Response(streamSite(env.DB, d, row), { headers: {
            'Content-Type': 'text/html; charset=utf-8', 'X-Title': encodeURIComponent(row.title || ''), 'X-Size': String(row.size || 0),
            'Cache-Control': 'no-store', ...CORS } });
        }
        if (req.method === 'PUT') {
          const len = Number(req.headers.get('content-length') || 0);
          if (len > MAX_SITE) { console.log('publish refused: too big', d, len); return json({ error: 'too_big', limit: MAX_SITE, size: len }, 413); }
          const own = await ownsSite(env.DB, d, req.headers.get('X-Owner-Key'));
          if (own !== 'ok') { console.log('publish refused:', own, d); return json({ error: own }, own === 'no_site' ? 404 : 403); }
          let title = '';
          try { title = decodeURIComponent(req.headers.get('X-Title') || ''); } catch { /* keep empty */ }
          if (!req.body) return json({ error: 'empty' }, 400);
          try {
            const size = await streamPublish(env.DB, d, title.slice(0, 120), req.body);
            return json({ ok: true, size });
          } catch (e) {
            if (e && e.tooBig) { console.log('publish refused: too big', d); return json({ error: 'too_big', limit: MAX_SITE }, 413); }
            throw e;
          }
        }
      } catch (e) {
        console.log('site error', req.method, d, String(e && e.message));
        return json({ error: 'server_error' }, 500);
      }
      return json({ error: 'not_found' }, 404);
    }

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
