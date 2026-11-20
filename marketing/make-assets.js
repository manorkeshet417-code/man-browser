// Renders the Man Browser logo files and banners into marketing/.
// Run from man-browser/:  npx electron marketing/make-assets.js
const { app, BrowserWindow, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

const OUT = __dirname;
const ICON = path.join(__dirname, '..', 'build', 'icon.png'); // the app icon (made by build/make-icon.js)
const iconData = 'file:///' + ICON.replace(/\\/g, '/');

async function render(html, width, height, file) {
  const win = new BrowserWindow({ width, height, show: false, useContentSize: true, webPreferences: { offscreen: true } });
  const tmp = path.join(app.getPath('temp'), `mb-marketing-${Date.now()}.html`);
  fs.writeFileSync(tmp, html);
  await win.loadFile(tmp);
  fs.unlinkSync(tmp);
  await new Promise(r => setTimeout(r, 700));
  const img = await win.webContents.capturePage({ x: 0, y: 0, width, height });
  fs.writeFileSync(path.join(OUT, 'banners', file), img.resize({ width, height }).toPNG());
  win.destroy();
  console.log('wrote', file);
}

const page = (w, h, body) => `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: ${w}px; height: ${h}px; overflow: hidden; }
  body { font-family: "Segoe UI Variable Display", "Segoe UI", sans-serif; color: #fff;
    background: radial-gradient(1200px 700px at 20% 10%, #6d28d9 0%, transparent 60%),
                radial-gradient(900px 600px at 90% 100%, #e0337e 0%, transparent 60%), #160b33; }
  .row { display: flex; align-items: center; height: 100%; }
  h1 { font-weight: 800; letter-spacing: -2px; line-height: 1; }
  p { opacity: .85; }
  .chips { display: flex; flex-wrap: wrap; gap: 12px; }
  .chip { padding: 10px 18px; border-radius: 999px; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.18); font-size: 22px; }
</style></head><body>${body}</body></html>`;

for (const d of ['logo', 'banners']) fs.mkdirSync(path.join(OUT, d), { recursive: true });
app.on('window-all-closed', () => {}); // each render closes its window: don't quit in between
app.whenReady().then(async () => {
  // 1) logo PNGs in common sizes (from the app icon)
  const icon = nativeImage.createFromPath(ICON);
  for (const s of [1024, 512, 256, 128, 64, 32]) {
    fs.writeFileSync(path.join(OUT, 'logo', `logo-${s}.png`), icon.resize({ width: s, height: s, quality: 'best' }).toPNG());
    console.log('wrote', `logo-${s}.png`);
  }

  // 2) wide banner 1920x1080 (store hero / video thumbnail)
  await render(page(1920, 1080, `<div class="row" style="padding: 0 150px; gap: 90px">
    <img src="${iconData}" style="width: 420px; height: 420px">
    <div>
      <h1 style="font-size: 150px">Man Browser</h1>
      <p style="font-size: 44px; margin: 26px 0 40px">Fast. Private. Yours.</p>
      <div class="chips">
        <span class="chip">🛡 Blocks ads</span><span class="chip">✦ Free domains</span><span class="chip">✨ Build sites without code</span>
        <span class="chip">🔎 Man Search</span><span class="chip">✉ Man Mail</span><span class="chip">🔄 Updates itself</span>
      </div>
    </div></div>`), 1920, 1080, 'banner-1920x1080.png');

  // 3) social preview 1200x630 (links shared on WhatsApp, Discord, X...)
  await render(page(1200, 630, `<div class="row" style="padding: 0 90px; gap: 56px">
    <img src="${iconData}" style="width: 260px; height: 260px">
    <div><h1 style="font-size: 96px">Man Browser</h1>
      <p style="font-size: 32px; margin-top: 18px">The browser by Man Studio.<br>Free domains, ad blocking and more.</p></div></div>`), 1200, 630, 'social-1200x630.png');

  // 4) Hebrew banner
  await render(page(1920, 1080, `<div class="row" dir="rtl" style="padding: 0 150px; gap: 90px">
    <img src="${iconData}" style="width: 420px; height: 420px">
    <div>
      <h1 style="font-size: 150px; letter-spacing: -1px">Man Browser</h1>
      <p style="font-size: 50px; margin: 26px 0 40px">מהיר. פרטי. שלך.</p>
      <div class="chips">
        <span class="chip">🛡 חוסם פרסומות</span><span class="chip">✦ דומיינים בחינם</span><span class="chip">✨ בונים אתר בלי קוד</span>
        <span class="chip">🔎 Man Search</span><span class="chip">✉ Man Mail</span><span class="chip">🔄 מתעדכן לבד</span>
      </div>
    </div></div>`), 1920, 1080, 'banner-he-1920x1080.png');

  app.exit(0);
});
