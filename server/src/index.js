// Man Studio free domains API — Cloudflare Worker + D1.
// Same calls as before: POST /rpc/<name> with a JSON body, JSON answer.
// Free endings. Keep in sync with main.js, src/renderer.js and src/registrar/app.js.
const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]{0,40}[a-z0-9])?\.(fun|com|net|org|io|app|dev|xyz|site|online|game|me|blog|art|club|store|tech|co\.ms|ms|man|web)$/;
const RESERVED = new Set(['manstudio', 'man-studio', 'www', 'admin', 'support', 'official']);
const MAX_PER_OWNER = 10;
const MAX_HTML = 300000;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, apikey',
  'Access-Control-Max-Age': '86400',
};
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS },
});

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(text ?? '')));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
const norm = d => String(d ?? '').trim().toLowerCase();
const now = () => new Date().toISOString();
const tokenOk = t => typeof t === 'string' && t.length >= 20;

async function check(db, d) {
  if (!DOMAIN_RE.test(d)) return 'invalid';
  if (RESERVED.has(d.split('.')[0])) return 'reserved';
  const row = await db.prepare('SELECT 1 FROM sites WHERE domain = ?').bind(d).first();
  return row ? 'taken' : 'ok';
}

const RPC = {
  async mb_site_check(db, a) { return check(db, norm(a.p_domain)); },

  async mb_site_get(db, a) {
    const d = norm(a.p_domain);
    await db.prepare('UPDATE sites SET views = views + 1 WHERE domain = ?').bind(d).run();
    const { results } = await db.prepare('SELECT domain, title, html, views, updated_at FROM sites WHERE domain = ?').bind(d).all();
    return results;
  },

  async mb_site_register(db, a) {
    const d = norm(a.p_domain);
    if (!tokenOk(a.p_token)) return 'bad_token';
    const st = await check(db, d);
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
    if (!tokenOk(a.p_token) || html.length > MAX_HTML) return false;
    const r = await db.prepare('UPDATE sites SET title = ?, html = ?, updated_at = ? WHERE domain = ? AND owner_hash = ?')
      .bind(String(a.p_title ?? '').slice(0, 120), html, now(), norm(a.p_domain), await sha256(a.p_token)).run();
    return r.meta.changes > 0;
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
    if (Number(req.headers.get('content-length') || 0) > MAX_HTML + 20000) return json({ error: 'too_big' }, 413);

    let args = {};
    try { args = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
    if (!args || typeof args !== 'object') args = {};
    try {
      return json(await RPC[m[1]](env.DB, args));
    } catch (e) {
      return json({ error: 'server_error' }, 500);
    }
  },
};
