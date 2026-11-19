'use strict';
/* "What's new" page. Opens by itself once after every update.
   To add a release: put a new entry at the TOP of CHANGELOG and bump "version" in package.json. */
const CHANGELOG = [
  {
    version: '1.4.1',
    date: '2026-11-19',
    items: [
      { icon: '🔑', en: ['Sign in with Google', 'Google used to refuse sign-in in Man Browser. Now you can sign in to your Google account, and with it to YouTube, Gmail and the rest.'],
        he: ['התחברות עם גוגל', 'גוגל סירב בעבר להתחברות ב-Man Browser. עכשיו אפשר להתחבר לחשבון גוגל, ודרכו גם ליוטיוב, ל-Gmail ולשאר השירותים.'] },
    ],
  },
  {
    version: '1.4.0',
    date: '2026-11-19',
    items: [
      { icon: '🗂️', en: ['Sites up to 30 MB', 'A free site can now be up to 30 MB, so big projects with lots of code fit too.'],
        he: ['אתרים עד 30 MB', 'אתר חינמי יכול להיות עכשיו עד 30 MB, כך שגם פרויקטים גדולים עם הרבה קוד נכנסים.'] },
    ],
  },
  {
    version: '1.3.1',
    date: '2026-11-19',
    items: [
      { icon: '📦', en: ['Bigger sites', 'Sites can now be up to 1.8 MB (was 0.3 MB), so bigger code publishes too.'],
        he: ['אתרים גדולים יותר', 'אתר יכול להיות עכשיו עד 1.8 MB (במקום 0.3 MB), כך שגם קוד גדול מתפרסם.'] },
      { icon: '⬆', en: ['Upload an .html file', 'In the site editor, “Upload .html” puts a file from your computer on your site in one click.'],
        he: ['העלאת קובץ ‎.html', 'בעורך האתר, "העלאת קובץ ‎.html" מעלה קובץ מהמחשב לאתר בלחיצה אחת.'] },
      { icon: '💬', en: ['Clear messages', 'If a site can’t be published, the editor now says why (for example, how big it is) instead of retrying forever.'],
        he: ['הודעות ברורות', 'אם אי אפשר לפרסם אתר, העורך אומר עכשיו למה (למשל כמה הוא שוקל) במקום לנסות שוב בלי סוף.'] },
    ],
  },
  {
    version: '1.3.0',
    date: '2026-11-19',
    items: [
      { icon: '✨', en: ['Build a site without code', 'At manstudio.domain, sites now open in a no-code builder: pick a look, then add headers, text, images, buttons, links, cards and YouTube videos. Prefer code? Switch to the Code tab.'],
        he: ['בונים אתר בלי קוד', 'ב-manstudio.domain האתרים נפתחים עכשיו בבנייה בלי קוד: בוחרים עיצוב ומוסיפים כותרות, טקסט, תמונות, כפתורים, קישורים, כרטיסים וסרטוני יוטיוב. מעדיפים קוד? עוברים ללשונית קוד.'] },
      { icon: '🚀', en: ['Changes publish by themselves', 'Every change to your site goes live automatically. No more edits that never got published.'],
        he: ['השינויים מתפרסמים לבד', 'כל שינוי באתר עולה לאוויר אוטומטית. אין יותר עריכות שלא פורסמו.'] },
      { icon: '🧭', en: ['Changing the address always works', 'Fixed: after editing a site, the address bar and the Visit button could do nothing. Pages that ask “Leave site?” now show a real question.'],
        he: ['שינוי כתובת תמיד עובד', 'תוקן: אחרי עריכת אתר, שורת הכתובת והכפתור "כניסה" לפעמים לא עשו כלום. דפים ששואלים "לעזוב את האתר?" מציגים עכשיו שאלה אמיתית.'] },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-11-19',
    items: [
      { icon: '👤', en: ['Man Browser accounts', 'Create an account with a username and password from the new account button in the toolbar. You stay signed in, even after closing the browser.'],
        he: ['חשבונות Man Browser', 'יוצרים חשבון עם שם משתמש וסיסמה מכפתור החשבון החדש בשורת הכלים. נשארים מחוברים, גם אחרי שסוגרים את הדפדפן.'] },
      { icon: '✦', en: ['.man belongs to Man Studio', 'The .man ending is now reserved for Man Studio. All the other free endings stay open to everyone.'],
        he: ['‎.man שייכת ל-Man Studio', 'הסיומת ‎.man שמורה עכשיו ל-Man Studio. כל שאר הסיומות החינמיות נשארות פתוחות לכולם.'] },
      { icon: '🛠️', en: ['Opens every time', 'Fixed a bug where Man Browser could start without showing its window, so clicking the icon seemed to do nothing.'],
        he: ['נפתח בכל פעם', 'תוקן באג שבו Man Browser יכל להיפתח בלי להציג חלון, כך שלחיצה על האייקון כאילו לא עשתה כלום.'] },
    ],
  },
  {
    version: '1.1.1',
    date: '2026-11-19',
    items: [
      { icon: '🔄', en: ['Automatic updates', 'Man Browser now downloads new versions by itself. When one is ready, a green “Restart to update” button appears. Or just close the browser and it installs on its own.'],
        he: ['עדכונים אוטומטיים', 'Man Browser מוריד עכשיו גרסאות חדשות לבד. כשגרסה מוכנה, מופיע כפתור ירוק "הפעלה מחדש לעדכון". אפשר גם פשוט לסגור את הדפדפן והעדכון יותקן לבד.'] },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-11-19',
    items: [
      { icon: '🌐', en: ['17 more free domain endings', 'Now you can get .net, .org, .io, .app, .dev, .xyz, .site, .online, .game, .me, .blog, .art, .club, .store and .tech, plus .man and .web, which exist only in Man Browser.'],
        he: ['17 סיומות דומיין חינמיות חדשות', 'עכשיו אפשר לקחת ‎.net, ‎.org, ‎.io, ‎.app, ‎.dev, ‎.xyz, ‎.site, ‎.online, ‎.game, ‎.me, ‎.blog, ‎.art, ‎.club, ‎.store ו-‎.tech, וגם ‎.man ו-‎.web שקיימות רק ב-Man Browser.'] },
      { icon: '⚙️', en: ['Settings button and language choice', 'A Settings button sits next to the menu. Language is the first option, and everything starts in English.'],
        he: ['כפתור הגדרות ובחירת שפה', 'כפתור ההגדרות נמצא ליד התפריט. השפה היא האפשרות הראשונה, והכול מתחיל באנגלית.'] },
      { icon: '🏠', en: ['Starts on the new tab page', 'Man Browser no longer reopens your old tabs (like YouTube) by itself. Want it back? Settings → On startup.'],
        he: ['נפתח בדף הכרטיסייה החדשה', 'Man Browser כבר לא פותח לבד את הכרטיסיות הישנות (כמו יוטיוב). רוצים את זה בחזרה? הגדרות ← בפתיחה.'] },
      { icon: '🎁', en: ['This page', 'After every update, this page shows what changed.'],
        he: ['הדף הזה', 'אחרי כל עדכון, הדף הזה מראה מה השתנה.'] },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-11-19',
    items: [
      { icon: '🚀', en: ['Man Browser is here', 'Tabs, a smart address bar, bookmarks, history, downloads, incognito windows and an ad & tracker blocker.'],
        he: ['Man Browser יצא', 'כרטיסיות, שורת כתובת חכמה, סימניות, היסטוריה, הורדות, גלישה בסתר וחוסם פרסומות ומעקבים.'] },
      { icon: '✦', en: ['Free domains at manstudio.domain', 'Claim a free name and build your own site right inside the browser.'],
        he: ['דומיינים בחינם ב-manstudio.domain', 'לוקחים שם בחינם ובונים אתר משלכם ישר בתוך הדפדפן.'] },
    ],
  },
];

const TEXT = {
  en: { title: 'What’s new in Man Browser', sub: 'Here’s everything that changed in this update.', latest: 'New', foot: 'You can open this page any time from the ⋮ menu → What’s new.' },
  he: { title: 'מה חדש ב-Man Browser', sub: 'כל מה שהשתנה בעדכון הזה.', latest: 'חדש', foot: 'אפשר לפתוח את הדף הזה בכל זמן מהתפריט ⋮ ← מה חדש.' },
};
const lang = document.documentElement.lang === 'he' ? 'he' : 'en';
document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
const L = TEXT[lang];
const current = document.body.dataset.version && !document.body.dataset.version.includes('{') ? document.body.dataset.version : CHANGELOG[0].version;

document.getElementById('badge').textContent = 'v' + current;
document.getElementById('title').textContent = L.title;
document.getElementById('sub').textContent = L.sub;
document.getElementById('foot').textContent = L.foot;

const list = document.getElementById('list');
const fmt = d => new Date(d + 'T12:00:00').toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
for (const rel of CHANGELOG) {
  const sec = document.createElement('section');
  sec.className = 'release' + (rel.version === current ? '' : ' old');
  const head = document.createElement('div');
  head.className = 'rel-head';
  const h = document.createElement('h2');
  h.textContent = 'v' + rel.version;
  head.append(h);
  const right = document.createElement('div');
  if (rel.version === current) { const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = L.latest; right.append(tag, ' '); }
  const date = document.createElement('span'); date.className = 'dim'; date.textContent = fmt(rel.date);
  right.append(date);
  head.append(right);
  sec.append(head);
  for (const it of rel.items) {
    const [name, desc] = it[lang] || it.en;
    const row = document.createElement('div');
    row.className = 'item';
    const ic = document.createElement('div'); ic.className = 'ic'; ic.textContent = it.icon;
    const tx = document.createElement('div');
    const b = document.createElement('b'); b.textContent = name;
    const s = document.createElement('span'); s.textContent = desc;
    tx.append(b, s);
    row.append(ic, tx);
    sec.append(row);
  }
  list.append(sec);
}
