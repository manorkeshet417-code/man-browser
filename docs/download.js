// Development of Man Browser has stopped (decided 20 Nov 2026), so the launch was cancelled:
// download buttons stay off and a notice explains why. The old countdown/launch code is in git history.
const HE = document.documentElement.lang === 'he';
const T = HE
  ? { btn: 'ההורדה לא זמינה', title: 'הפיתוח של Man Browser הופסק', text: 'הפיתוח הופסק בגלל כל מיני חששות וסיבות פנימיות. ההשקה בוטלה וההורדה לא זמינה.' }
  : { btn: 'Download unavailable', title: 'Development of Man Browser has stopped', text: 'Development stopped because of various concerns and internal reasons. The launch was cancelled and downloads are not available.' };

document.querySelectorAll('[data-download]').forEach(a => {
  a.removeAttribute('href');
  a.classList.add('locked');
  a.setAttribute('aria-disabled', 'true');
  a.textContent = T.btn;
});
document.querySelectorAll('[data-prelaunch-hide]').forEach(e => { e.hidden = true; });
document.querySelectorAll('[data-version]').forEach(e => { e.textContent = '1.9.0'; });

// the notice, under the main buttons and in the download box
function notice() {
  const n = document.createElement('div');
  n.className = 'stopped';
  n.setAttribute('role', 'status');
  const b = document.createElement('b'); b.textContent = T.title;
  const p = document.createElement('span'); p.textContent = T.text;
  n.append(b, p);
  return n;
}
const cta = document.querySelector('.cta');
if (cta) cta.insertAdjacentElement('afterend', notice());
const dl = document.querySelector('.download .btn');
if (dl) dl.insertAdjacentElement('afterend', notice());
