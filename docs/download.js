// Download buttons: locked with a countdown until launch, then pointed straight at the newest installer.
// Launch: Saturday 21 November 2026, 19:00 Israel time (= 17:00 UTC). Change LAUNCH to move it.
const LAUNCH = Date.parse('2026-11-21T17:00:00Z');
const HE = document.documentElement.lang === 'he';
const T = HE
  ? { today: 'זמין היום ב-19:00', tomorrow: 'זמין מחר ב-19:00', later: 'זמין ב-21 בנובמבר, 19:00', launching: 'Man Browser יוצא בעוד', day: 'יום', days: 'ימים', yourTime: 'אצלך', at: 'ההורדה תיפתח ב-21 בנובמבר, 19:00 (שעון ישראל)' }
  : { today: 'Available today at 19:00', tomorrow: 'Available tomorrow at 19:00', later: 'Available 21 November, 19:00', launching: 'Man Browser launches in', day: 'day', days: 'days', yourTime: 'your time', at: 'Downloads open on 21 November at 19:00 Israel time' };
// "today" / "tomorrow" by the date in Israel
const israelDay = t => new Date(t).toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
function soonLabel() {
  const launchDay = israelDay(LAUNCH);
  if (israelDay(now()) === launchDay) return T.today;
  if (israelDay(now() + 864e5) === launchDay) return T.tomorrow;
  return T.later;
}

// for testing: ?launch=now shows the page as it will look after launch
const now = () => (new URLSearchParams(location.search).get('launch') === 'now' ? LAUNCH + 1 : Date.now());

function lock() {
  document.querySelectorAll('[data-download]').forEach(a => {
    if (!a.dataset.label) a.dataset.label = a.innerHTML;
    a.removeAttribute('href');
    a.classList.add('locked');
    a.setAttribute('aria-disabled', 'true');
    a.textContent = '⏳ ' + soonLabel();
  });
  document.querySelectorAll('[data-prelaunch-hide]').forEach(e => { e.hidden = true; });
  let bar = document.getElementById('countdown');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'countdown';
    bar.innerHTML = `<span class="cd-label"></span><b class="cd-time"></b><span class="cd-at"></span>`;
    const cta = document.querySelector('.cta');
    (cta || document.body).insertAdjacentElement(cta ? 'afterend' : 'afterbegin', bar);
    bar.querySelector('.cd-label').textContent = T.launching;
    // visitors outside Israel also see the launch time in their own time zone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const local = new Date(LAUNCH).toLocaleString(HE ? 'he-IL' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    bar.querySelector('.cd-at').textContent = T.at + (tz && tz !== 'Asia/Jerusalem' ? ` (${T.yourTime}: ${local})` : '');
  }
  const left = Math.max(0, LAUNCH - now());
  const s = Math.floor(left / 1000), d = Math.floor(s / 86400);
  const hms = [Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60].map(n => String(n).padStart(2, '0')).join(':');
  bar.querySelector('.cd-time').textContent = (d ? `${d} ${d === 1 ? T.day : T.days} ` : '') + hms;
}

async function unlock() {
  const bar = document.getElementById('countdown');
  if (bar) bar.remove();
  document.querySelectorAll('[data-prelaunch-hide]').forEach(e => { e.hidden = false; });
  document.querySelectorAll('[data-download]').forEach(a => {
    a.classList.remove('locked');
    a.removeAttribute('aria-disabled');
    a.href = 'https://github.com/manorkeshet417-code/man-browser/releases/latest';
    if (a.dataset.label) a.innerHTML = a.dataset.label;
  });
  try {
    const r = await fetch('https://api.github.com/repos/manorkeshet417-code/man-browser/releases/latest');
    if (!r.ok) return;
    const rel = await r.json();
    const setup = (rel.assets || []).find(x => /^ManBrowser-Setup-.*\.exe$/i.test(x.name));
    if (setup) document.querySelectorAll('[data-download]').forEach(a => { a.href = setup.browser_download_url; });
    document.querySelectorAll('[data-version]').forEach(e => { e.textContent = rel.tag_name; });
  } catch { /* keep the releases-page link */ }
}

if (now() < LAUNCH) {
  lock();
  const timer = setInterval(() => {
    if (now() >= LAUNCH) { clearInterval(timer); unlock(); } // opens by itself at 19:00, no reload needed
    else lock();
  }, 1000);
} else unlock();
