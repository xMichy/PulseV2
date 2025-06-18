// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { setupDownloadHandler } = require('./tools/download/download-handler.js');
const { setupCookieHandlers } = require('./tools/settings/cookies/cookie-handler.js'); 

async function createWindow() {
  console.log('[MAIN] Inizio creazione finestra...');
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  console.log('[MAIN] Inizio configurazione handlers...');
  await setupDownloadHandler(mainWindow);
  await setupCookieHandlers(); 
  console.log('[MAIN] Configurazione handlers completata.');

  mainWindow.loadFile('index.html');
  console.log('[MAIN] Chiamata a loadFile(\'index.html\') eseguita.');
}

app.whenReady().then(async () => {
  console.log('[MAIN] App pronta. Chiamo createWindow...');
  await createWindow();

  app.on('activate', async function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});