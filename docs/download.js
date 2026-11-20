// Point the download buttons straight at the newest installer (falls back to the releases page).
(async () => {
  try {
    const r = await fetch('https://api.github.com/repos/manorkeshet417-code/man-browser/releases/latest');
    if (!r.ok) return;
    const rel = await r.json();
    const setup = (rel.assets || []).find(a => /^ManBrowser-Setup-.*\.exe$/i.test(a.name));
    if (!setup) return;
    document.querySelectorAll('[data-download]').forEach(a => { a.href = setup.browser_download_url; });
    document.querySelectorAll('[data-version]').forEach(e => { e.textContent = rel.tag_name; });
  } catch { /* keep the releases-page link */ }
})();
