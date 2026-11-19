# Man Browser

A fast, private desktop web browser for Windows by **Man Studio**, built on Chromium (Electron).

- Tabs, smart address bar, bookmarks, history, downloads, incognito windows
- Built-in ad & tracker blocker
- English and Hebrew (right-to-left)
- **Free domains**: claim a name like `yourname.fun` or `yourname.man` at `manstudio.domain` and build a site right inside the browser
- Updates itself automatically

## Download

Get the latest **ManBrowser-Setup** from [Releases](../../releases/latest). The installed version updates itself.
The portable EXE runs without installing but doesn't update itself.

> Windows may show "Windows protected your PC" because the app isn't code-signed yet. Click **More info → Run anyway**.

## Develop

```powershell
npm install
npm start          # run from source
npm run dist       # build dist\ManBrowser-Setup-x.y.z.exe and the portable EXE
```

`server/` is the free-domains API (Cloudflare Worker + D1): `npx wrangler deploy` inside `server/`.

### Releasing an update

1. Bump `version` in `package.json` and add an entry at the top of `CHANGELOG` in `src/whatsnew/app.js`.
2. `npm run dist`
3. Create a GitHub release tagged `vX.Y.Z` and upload `ManBrowser-Setup-X.Y.Z.exe`, its `.blockmap`, `latest.yml` and the portable EXE.

Installed browsers pick the release up within a few hours (or on next start).
