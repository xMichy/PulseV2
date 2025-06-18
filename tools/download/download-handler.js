// tools/download/download-handler.js

const { ipcMain, shell, session } = require('electron');

const activeDownloads = new Map();

async function setupDownloadHandler(mainWindow) {
  console.log('[HANDLER] Funzione setupDownloadHandler avviata.');
  const { default: Store } = await import('electron-store');
  const store = new Store();
  console.log('[HANDLER] Electron-store importato e inizializzato.');

  const ses = session.defaultSession;

  ses.on('will-download', (event, item, webContents) => {
    // ... tutta la logica di gestione del download (questa parte è già corretta)
    const downloadId = `download-${Date.now()}-${Math.random()}`;
    const totalBytes = item.getTotalBytes();
    activeDownloads.set(downloadId, { item, lastBytes: 0, lastTime: Date.now() });
    mainWindow.webContents.send('download-started', { id: downloadId, fileName: item.getFilename(), totalBytes: totalBytes });
    item.on('updated', (event, state) => {
        if (state === 'progressing') {
            const receivedBytes = item.getReceivedBytes();
            const downloadState = activeDownloads.get(downloadId);
            if (downloadState) {
                const now = Date.now();
                const timeDiff = (now - downloadState.lastTime) / 1000;
                const bytesDiff = receivedBytes - downloadState.lastBytes;
                const speed = timeDiff > 0.5 ? bytesDiff / timeDiff : 0;
                const remainingBytes = totalBytes - receivedBytes;
                const timeRemaining = speed > 0 ? remainingBytes / speed : Infinity;
                downloadState.lastBytes = receivedBytes;
                downloadState.lastTime = now;
                mainWindow.webContents.send('download-progress', { id: downloadId, receivedBytes, speed, timeRemaining });
            }
        }
    });
    item.on('done', (event, state) => {
      activeDownloads.delete(downloadId);
      const newEntry = { id: downloadId, fileName: item.getFilename(), path: item.getSavePath(), totalBytes: item.getTotalBytes(), state: state, completionTime: new Date().toISOString() };
      if (state === 'completed' || state === 'cancelled' || state === 'interrupted') {
          const history = store.get('downloadHistory', []);
          history.unshift(newEntry);
          store.set('downloadHistory', history);
      }
      mainWindow.webContents.send('download-complete', newEntry);
    });
  });

  ipcMain.on('download-action', (event, { action, path }) => {
    if (action === 'open') shell.openPath(path).catch(err => console.error("Failed to open path:", err));
    if (action === 'show') shell.showItemInFolder(path);
  });

  ipcMain.on('cancel-download', (event, downloadId) => {
    const download = activeDownloads.get(downloadId);
    if (download) download.item.cancel();
  });

  ipcMain.handle('downloads:get-history', () => {
      const history = store.get('downloadHistory', []);
      // DEBUG: Log per vedere se questo handler viene mai chiamato
      console.log(`[HANDLER] Richiesta cronologia ricevuta. Trovati ${history.length} elementi.`);
      return history;
  });

  ipcMain.handle('downloads:remove-from-history', (event, downloadId) => {
      let history = store.get('downloadHistory', []);
      history = history.filter(item => item.id !== downloadId);
      store.set('downloadHistory', history);
      console.log(`[HANDLER] Rimosso ${downloadId} dalla cronologia.`);
      return history;
  });
}


module.exports = { setupDownloadHandler };