'use strict';
const { contextBridge, ipcRenderer } = require('electron');

const CHANNELS = ['cmd', 'open-tab', 'search', 'blocked', 'download', 'store-changed', 'fullscreen', 'update-ready', 'account-changed', 'mail-unread'];

contextBridge.exposeInMainWorld('mb', {
  init: () => ipcRenderer.invoke('init'),
  set: (key, val) => ipcRenderer.send('store:set', key, val),
  on: (ch, fn) => { if (CHANNELS.includes(ch)) ipcRenderer.on(ch, (_e, ...a) => fn(...a)); },
  menu: (items, x, y) => ipcRenderer.invoke('menu', items, x, y),
  theme: dark => ipcRenderer.send('theme', dark),
  historyAdd: (url, title) => ipcRenderer.send('history:add', { url, title }),
  historyUpdate: (url, patch) => ipcRenderer.send('history:update', url, patch),
  historyQuery: q => ipcRenderer.invoke('history:query', q),
  historyRemove: time => ipcRenderer.send('history:remove', time),
  historyClear: () => ipcRenderer.send('history:clear'),
  suggest: q => ipcRenderer.invoke('suggest', q),
  topSites: () => ipcRenderer.invoke('top-sites'),
  session: urls => ipcRenderer.send('session', urls),
  dl: (action, id, p) => ipcRenderer.send('dl', action, id, p),
  newWindow: incog => ipcRenderer.send('new-window', incog),
  fullscreen: () => ipcRenderer.send('fullscreen'),
  clearData: () => ipcRenderer.invoke('clear-data'),
  resolve: host => ipcRenderer.invoke('resolve', host),
  updateStatus: () => ipcRenderer.invoke('update-status'),
  installUpdate: () => ipcRenderer.send('update-install'),
  account: () => ipcRenderer.invoke('account:get'),
  signUp: (username, password) => ipcRenderer.invoke('account:signup', username, password),
  signIn: (username, password) => ipcRenderer.invoke('account:login', username, password),
  signOut: () => ipcRenderer.invoke('account:logout'),
  resetPassword: (username, code, password) => ipcRenderer.invoke('account:reset', username, code, password),
  newRecoveryCode: () => ipcRenderer.invoke('account:recovery-new'),
  changePassword: (oldPassword, newPassword) => ipcRenderer.invoke('account:change-password', oldPassword, newPassword),
  mailUnread: () => ipcRenderer.invoke('mail:unread'),
  manSearch: q => ipcRenderer.invoke('man-search', q),
});
