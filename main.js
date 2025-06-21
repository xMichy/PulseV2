// main.js
const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');

const { setupDownloadHandler } = require('./tools/download/download-handler.js');
const { setupCookieHandlers } = require('./tools/settings/cookies/cookie-handler.js');
const { setupAiHandlers } = require('./tools/ai/ai-handler.js');

// La funzione ora è 'async' per poter usare 'await'
async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'tools/tabs/default-icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true
    }
  });

  // La policy di sicurezza rimane per garantire la comunicazione con l'API di Google
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          // Policy più permissiva per un'esperienza di navigazione simile a un browser
          "default-src 'self' file: https: data: wss:",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:",
          "style-src 'self' 'unsafe-inline' https:",
          "img-src 'self' data: https: blob:",
          "font-src 'self' https: data:",
          "connect-src 'self' https: wss:",
          "object-src 'none'",
          "frame-src 'self' https: data:"
        ].join('; ')
      }
    });
  });

  // Attendiamo che i gestori del backend siano pronti...
  await setupDownloadHandler(mainWindow);
  await setupCookieHandlers(mainWindow);
  await setupAiHandlers(mainWindow);

  // ...E SOLO DOPO carichiamo la pagina!
  mainWindow.loadFile('index.html');
}

// Anche il blocco .then() ora chiama una funzione async
app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});