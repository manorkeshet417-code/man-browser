'use strict';
/* Man Search: searches every free Man Browser site (Man Studio's own index), plus Wikipedia,
   with buttons to continue the search on the big web search engines. */
const API = 'https://manstudio-domains.manstudiosupport.workers.dev';
const $ = s => document.querySelector(s);
const lang = document.documentElement.lang === 'he' ? 'he' : 'en'; // follows Man Browser's language setting
document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';

const TEXT = {
  en: { go: 'Search', ph: 'Search Man Browser sites and the web', sites: 'Man Browser sites', wiki: 'Wikipedia', web: 'Search the web',
    noSites: 'No Man Browser site matches. Build one at manstudio.domain!', noWiki: 'Nothing on Wikipedia.',
    tagline: 'Search the free sites made in Man Browser, Wikipedia and the whole web.', home: 'home page',
    foot: 'Man Search · by Man Studio · Make it your search engine in Settings → Search engine' },
  he: { go: 'חיפוש', ph: 'חיפוש באתרי Man Browser וברשת', sites: 'אתרי Man Browser', wiki: 'ויקיפדיה', web: 'חיפוש ברשת',
    noSites: 'אין אתר Man Browser שמתאים. אפשר לבנות אחד ב-manstudio.domain!', noWiki: 'לא נמצא בוויקיפדיה.',
    tagline: 'חיפוש באתרים החינמיים שנבנו ב-Man Browser, בוויקיפדיה ובכל הרשת.', home: 'דף הבית',
    foot: 'Man Search · מבית Man Studio · אפשר להפוך אותו למנוע החיפוש בהגדרות ← מנוע חיפוש' },
};
const L = TEXT[lang];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

$('#go').textContent = L.go;
$('#q').placeholder = L.ph;
$('#h-sites').textContent = L.sites;
$('#h-wiki').textContent = L.wiki;
$('#h-web').textContent = L.web;
$('#tagline').textContent = L.tagline;
$('#foot').textContent = L.foot;

const WEB = [
  ['Google', 'https://www.google.com/search?q='],
  ['DuckDuckGo', 'https://duckduckgo.com/?q='],
  ['Bing', 'https://www.bing.com/search?q='],
  ['Brave Search', 'https://search.brave.com/search?q='],
  ['YouTube', 'https://www.youtube.com/results?search_query='],
];

async function sitesResults(q) {
  const box = $('#sites');
  box.innerHTML = '';
  let rows = [];
  try { rows = await (await fetch(`${API}/search?q=${encodeURIComponent(q)}`)).json(); } catch { /* offline */ }
  if (!Array.isArray(rows) || !rows.length) { box.innerHTML = `<p class="none">${esc(L.noSites)}</p>`; return; }
  for (const r of rows) {
    const url = `man://${r.domain}/${r.path || ''}`;
    // the server marks matches with [[ ]]; escape everything, then turn the marks into <b>
    const snip = esc(r.snippet || '').replace(/\[\[/g, '<b>').replace(/\]\]/g, '</b>');
    const div = document.createElement('div');
    div.className = 'res';
    div.innerHTML = `<span class="url">${esc(r.domain)}${r.path ? '/' + esc(r.path) : ''}</span>${r.domain.endsWith('.man') ? '<span class="badge">Man Studio</span>' : ''}
      <a class="title" href="${esc(url)}">${esc(r.title || r.domain)}</a><div class="snip">${snip}</div>`;
    box.append(div);
  }
}

async function wikiResults(q) {
  const box = $('#wiki');
  box.innerHTML = '';
  let hits = [];
  try {
    const u = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srlimit=5&srsearch=${encodeURIComponent(q)}`;
    hits = ((await (await fetch(u)).json()).query || {}).search || [];
  } catch { /* offline */ }
  if (!hits.length) { box.innerHTML = `<p class="none">${esc(L.noWiki)}</p>`; return; }
  for (const h of hits) {
    const url = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(h.title.replace(/ /g, '_'))}`;
    // Wikipedia's snippet has <span class="searchmatch">…</span>: keep only the text and bold the matches
    const tmp = document.createElement('div');
    tmp.innerHTML = String(h.snippet || '').replace(/<span class="searchmatch">/g, '[[').replace(/<\/span>/g, ']]');
    const snip = esc(tmp.textContent).replace(/\[\[/g, '<b>').replace(/\]\]/g, '</b>');
    const div = document.createElement('div');
    div.className = 'res';
    div.innerHTML = `<span class="url">${lang}.wikipedia.org</span><a class="title" href="${esc(url)}">${esc(h.title)}</a><div class="snip">${snip}…</div>`;
    box.append(div);
  }
}

function webButtons(q) {
  const box = $('#web');
  box.innerHTML = '';
  for (const [name, base] of WEB) {
    const a = document.createElement('a');
    a.href = base + encodeURIComponent(q);
    a.textContent = name;
    box.append(a);
  }
}

function run(q) {
  q = String(q || '').trim();
  document.body.classList.toggle('has-q', !!q);
  $('#results').hidden = !q;
  if (!q) return;
  document.title = `${q} - Man Search`;
  $('#q').value = q;
  sitesResults(q);
  wikiResults(q);
  webButtons(q);
}

$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const q = $('#q').value.trim();
  if (!q) return;
  history.pushState(null, '', '/?q=' + encodeURIComponent(q));
  run(q);
});
window.addEventListener('popstate', () => run(new URLSearchParams(location.search).get('q')));
run(new URLSearchParams(location.search).get('q'));
