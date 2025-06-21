// Michele Galliani
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Per messaggi senza risposta (Renderer -> Main)
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  
  // Per messaggi con risposta (Renderer <-> Main)
  invoke: (channel, data) => {
    return ipcRenderer.invoke(channel, data);
  },

  // API specifiche per i cookie
  getAllCookies: () => ipcRenderer.invoke('settings:get-all-cookies'),
  deleteCookie: (cookieData) => ipcRenderer.invoke('settings:delete-cookie', cookieData),

  // API specifiche per l'AI
  sendChatMessage: (message) => ipcRenderer.invoke('ai:chat', message),

  // Gestori specifici e chiari per ogni evento di download
  handleDownloadStarted: (callback) => {
    ipcRenderer.on('download-started', (event, ...args) => callback(...args));
  },
  handleDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, ...args) => callback(...args));
  },
  handleDownloadComplete: (callback) => {
    ipcRenderer.on('download-complete', (event, ...args) => callback(...args));
  },
  manageDownloads: (action, data) => ipcRenderer.invoke('manage-downloads', action, data),
  getDownloadHistory: () => ipcRenderer.invoke('get-download-history'),
  clearDownloadHistory: () => ipcRenderer.invoke('clear-download-history'),
  openDownloadsPage: () => ipcRenderer.send('open-downloads-page')
});