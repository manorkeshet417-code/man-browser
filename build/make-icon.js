// Renders the Man Browser icon to build/icon.png (1024px). Run: npx electron build/make-icon.js
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const SIZE = 1024;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="${SIZE}" height="${SIZE}">
  <!-- Man Browser: a bold "M" with an orbit ring passing behind and in front of it, and a spark riding the orbit -->
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3b1d8f"/><stop offset=".5" stop-color="#6d28d9"/><stop offset="1" stop-color="#e0337e"/>
    </linearGradient>
    <radialGradient id="glow" cx=".28" cy=".2" r=".75">
      <stop offset="0" stop-color="#8fb4ff" stop-opacity=".55"/><stop offset="1" stop-color="#8fb4ff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="m" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e9e2ff"/>
    </linearGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#7dd3fc"/><stop offset=".5" stop-color="#ffffff"/><stop offset="1" stop-color="#fbcfe8"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#1a0b4d" flood-opacity=".45"/>
    </filter>
    <clipPath id="front"><rect x="0" y="540" width="1024" height="600"/></clipPath>
  </defs>
  <rect x="64" y="64" width="896" height="896" rx="220" fill="url(#bg)"/>
  <rect x="64" y="64" width="896" height="896" rx="220" fill="url(#glow)"/>
  <rect x="80" y="80" width="864" height="864" rx="206" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="4"/>

  <!-- orbit, back half (behind the M) -->
  <g transform="rotate(-20 512 540)">
    <ellipse cx="512" cy="540" rx="372" ry="128" fill="none" stroke="url(#ring)" stroke-width="34" opacity=".55"/>
  </g>

  <!-- the M -->
  <path d="M302 712 V352 L512 566 L722 352 V712" fill="none" stroke="url(#m)" stroke-width="104"
        stroke-linecap="round" stroke-linejoin="round" filter="url(#shadow)"/>

  <!-- orbit, front half (over the M) -->
  <g transform="rotate(-20 512 540)">
    <ellipse cx="512" cy="540" rx="372" ry="128" fill="none" stroke="url(#ring)" stroke-width="34" clip-path="url(#front)"/>
  </g>

  <!-- spark on the orbit -->
  <g transform="translate(860 318)">
    <circle r="70" fill="#fff" opacity=".16"/>
    <path d="M0 -62 C8 -16 16 -8 62 0 C16 8 8 16 0 62 C-8 16 -16 8 -62 0 C-16 -8 -8 -16 0 -62Z" fill="#fff"/>
  </g>
</svg>`;

app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: SIZE, height: SIZE, show: false, frame: false, transparent: true, useContentSize: true,
    webPreferences: { offscreen: true } });
  win.webContents.setZoomFactor(1);
  await win.loadURL('data:text/html,' + encodeURIComponent(
    `<html><body style="margin:0;background:transparent;overflow:hidden">${svg}</body></html>`));
  await new Promise(r => setTimeout(r, 600));
  const img = await win.webContents.capturePage({ x: 0, y: 0, width: SIZE, height: SIZE });
  // cut the rounded square out so the corners are transparent (anti-aliased edge)
  const { nativeImage } = require('electron');
  const sized = img.resize({ width: SIZE, height: SIZE });
  const px = sized.toBitmap(); // BGRA
  const L = 64, R = 960, RAD = 220;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const cx = Math.min(Math.max(x + 0.5, L + RAD), R - RAD), cy = Math.min(Math.max(y + 0.5, L + RAD), R - RAD);
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) - RAD; // <0 inside
      const a = Math.max(0, Math.min(1, 0.5 - d));
      const i = (y * SIZE + x) * 4;
      px[i + 3] = Math.round(px[i + 3] * a);
      if (a < 1) { px[i] = Math.round(px[i] * a); px[i + 1] = Math.round(px[i + 1] * a); px[i + 2] = Math.round(px[i + 2] * a); }
    }
  }
  const out = path.join(__dirname, 'icon.png');
  fs.writeFileSync(out, nativeImage.createFromBitmap(px, { width: SIZE, height: SIZE }).toPNG());
  console.log('icon written', out, img.getSize());
  app.exit(0);
});
