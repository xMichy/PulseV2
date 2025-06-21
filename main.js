// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const { setupDownloadHandler } = require('./tools/download/download-handler.js');
const { setupCookieHandlers } = require('./tools/settings/cookies/cookie-handler.js'); 

// La funzione ora è 'async' per poter usare 'await'
async function createWindow() {
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

  // Attendiamo che i gestori del backend siano pronti...
  await setupDownloadHandler(mainWindow);
  await setupCookieHandlers(mainWindow); 

  // ...E SOLO DOPO carichiamo la pagina!
  mainWindow.loadFile('index.html');
}

// Anche il blocco .then() ora chiama una funzione async
app.whenReady().then(async () => {
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