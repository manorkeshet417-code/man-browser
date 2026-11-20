'use strict';
/* Man Mail (mail.domain): an inbox inside Man Browser. Every account is <name>@man.mail.
   Account notices (welcome, new sign-in, password changes) arrive here, and users can write to each other. */
const API = 'https://manstudio-domains.manstudiosupport.workers.dev';
const $ = s => document.querySelector(s);
const lang = document.documentElement.lang === 'he' ? 'he' : 'en';
document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
const T = {
  en: { soText: 'Sign in to your Man Browser account to use your inbox.', soBtn: 'Sign in', compose: '+ New message', inbox: 'Inbox', sent: 'Sent',
    empty: 'Choose a message', noMail: 'No messages here yet.', reply: 'Reply', del: 'Delete', newMsg: 'New message', to: 'To', subject: 'Subject',
    send: 'Send', cancel: 'Cancel', sentOk: 'Sent ✓', deleted: 'Deleted', you: 'You', confirmDel: 'Delete this message?',
    err_no_such_address: 'There’s no Man Mail address like that. Check the spelling (name@man.mail).', err_empty: 'Write something first.',
    err_too_long: 'The message is too long (up to 20,000 characters).', err_too_many: 'You sent 50 messages today. Try again tomorrow.',
    err_signed_out: 'You were signed out. Sign in again.', err_server: 'Something went wrong. Try again.' },
  he: { soText: 'צריך להתחבר לחשבון Man Browser כדי להשתמש בתיבת הדואר.', soBtn: 'התחברות', compose: '+ הודעה חדשה', inbox: 'דואר נכנס', sent: 'נשלחו',
    empty: 'בחרו הודעה', noMail: 'עוד אין כאן הודעות.', reply: 'תשובה', del: 'מחיקה', newMsg: 'הודעה חדשה', to: 'אל', subject: 'נושא',
    send: 'שליחה', cancel: 'ביטול', sentOk: 'נשלח ✓', deleted: 'נמחק', you: 'את/ה', confirmDel: 'למחוק את ההודעה?',
    err_no_such_address: 'אין כתובת Man Mail כזאת. בדקו את הכתיב (name@man.mail).', err_empty: 'כתבו משהו קודם.',
    err_too_long: 'ההודעה ארוכה מדי (עד 20,000 תווים).', err_too_many: 'שלחת היום 50 הודעות. נסו שוב מחר.',
    err_signed_out: 'התנתקת. התחבר/י שוב.', err_server: 'משהו השתבש. נסו שוב.' },
}[lang];
for (const [id, k] of [['so-text', 'soText'], ['so-btn', 'soBtn'], ['compose-btn', 'compose'], ['l-inbox', 'inbox'], ['l-sent', 'sent'],
  ['empty', 'empty'], ['r-reply', 'reply'], ['r-delete', 'del'], ['l-to', 'to'], ['l-subject', 'subject'], ['c-send', 'send'], ['c-cancel', 'cancel']]) $('#' + id).textContent = T[k];

let session = null, me = '', box = 'inbox', mails = [], openId = null;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rpc = (fn, body) => fetch(`${API}/rpc/${fn}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: session, ...body }) }).then(r => r.json());
const when = iso => {
  const d = new Date(iso), now = new Date(), loc = lang === 'he' ? 'he-IL' : 'en-US';
  return d.toDateString() === now.toDateString() ? d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString(loc, { day: 'numeric', month: 'short' });
};
let toastT;
function toast(msg) { const n = $('#toast'); n.textContent = msg; n.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { n.hidden = true; }, 2000); }

function show(which) { // 'empty' | 'read' | 'compose'
  $('#empty').hidden = which !== 'empty';
  $('#read').hidden = which !== 'read';
  $('#compose').hidden = which !== 'compose';
}

async function loadList() {
  const r = await rpc('mail_inbox', { box });
  if (r.error === 'signed_out') return signedOut();
  mails = r.mails || [];
  const list = $('#list');
  list.innerHTML = '';
  if (!mails.length) list.innerHTML = `<div class="empty-list">${esc(T.noMail)}</div>`;
  for (const m of mails) {
    const b = document.createElement('button');
    b.className = 'item' + (m.read ? '' : ' unread') + (m.id === openId ? ' on' : '');
    const who = box === 'sent' ? m.to : (m.from || m.from_name);
    b.innerHTML = `<span class="top"><span class="who">${esc(who)}</span><span>${esc(when(m.created_at))}</span></span>
      <span class="subj">${esc(m.subject)}</span><span class="prev">${esc(m.preview)}</span>`;
    b.addEventListener('click', () => openMail(m.id));
    list.append(b);
  }
  if (box === 'inbox') { $('#count').textContent = mails.filter(m => !m.read).length || ''; ping(); }
}

async function openMail(id) {
  const r = await rpc('mail_get', { id });
  if (!r.ok) return;
  openId = id;
  const m = r.mail;
  $('#r-subject').textContent = m.subject;
  $('#r-from').textContent = m.from ? (m.from === me ? T.you : `${m.from_name} <${m.from}>`) : m.from_name;
  $('#r-to').textContent = m.to === me ? T.you : m.to;
  $('#r-date').textContent = new Date(m.created_at).toLocaleString(lang === 'he' ? 'he-IL' : 'en-US');
  $('#r-body').textContent = m.body;
  $('#r-reply').hidden = !m.from || m.from === me;
  $('#r-reply').onclick = () => compose(m.from, m.subject.startsWith('Re: ') ? m.subject : 'Re: ' + m.subject,
    `\n\n— ${m.from_name}, ${new Date(m.created_at).toLocaleString()}:\n> ` + m.body.split('\n').join('\n> '));
  $('#r-delete').onclick = async () => {
    if (!confirm(T.confirmDel)) return;
    await rpc('mail_delete', { id: m.id });
    openId = null; show('empty'); toast(T.deleted); loadList();
  };
  show('read');
  loadList();
  location.hash = ''; // keep the address clean
  ping();
}

function compose(to = '', subject = '', body = '') {
  openId = null;
  $('#c-title').textContent = T.newMsg;
  $('#c-to').value = to; $('#c-subject').value = subject; $('#c-body').value = body; $('#c-err').textContent = '';
  show('compose');
  (to ? $('#c-body') : $('#c-to')).focus();
  if (to) $('#c-body').setSelectionRange(0, 0);
}
$('#compose-btn').onclick = () => compose();
$('#c-cancel').onclick = () => show('empty');
$('#compose').addEventListener('submit', async e => {
  e.preventDefault();
  $('#c-send').disabled = true;
  const r = await rpc('mail_send', { to: $('#c-to').value, subject: $('#c-subject').value, body: $('#c-body').value });
  $('#c-send').disabled = false;
  if (r.ok) { toast(T.sentOk); show('empty'); if (box === 'sent') loadList(); return; }
  $('#c-err').textContent = T['err_' + r.error] || T.err_server;
});
document.querySelectorAll('nav button').forEach(b => b.addEventListener('click', () => {
  box = b.dataset.box;
  document.querySelectorAll('nav button').forEach(x => x.classList.toggle('on', x === b));
  openId = null; show('empty'); loadList();
}));

// tell Man Browser to refresh the unread dot on the account button
function ping() { fetch('/api/mail-check', { cache: 'no-store' }).catch(() => {}); }

function signedOut() { $('#app').hidden = true; $('#signed-out').hidden = false; }
(async () => {
  let acct = null;
  try { acct = await fetch('/api/account', { cache: 'no-store' }).then(r => r.json()); } catch { /* ignore */ }
  if (!acct || !acct.session) return signedOut();
  session = acct.session;
  me = acct.address || '';
  $('#me').textContent = me;
  $('#app').hidden = false;
  show('empty');
  await loadList();
  const to = new URLSearchParams(location.search).get('to');
  if (to) compose(to);
  setInterval(() => { if ($('#compose').hidden) loadList(); }, 60000);
})();
