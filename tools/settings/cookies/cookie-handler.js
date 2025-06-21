// tools/settings/cookies/cookie-handler.js
const { ipcMain, session } = require('electron');

async function setupCookieHandlers(mainWindow) {
  ipcMain.handle('settings:get-all-cookies', async () => {
    console.log('[BACKEND] Richiesta per tutti i cookie ricevuta.');
    try {
      const cookies = await session.defaultSession.cookies.get({});
      console.log(`[BACKEND] Trovati ${cookies.length} cookie.`);
      return cookies;
    } catch (error) {
      console.error('[BACKEND] Errore nel recuperare i cookie:', error);
      return []; // Restituisci un array vuoto in caso di errore
    }
  });

  ipcMain.handle('settings:delete-cookie', async (event, { url, name }) => {
    console.log(`[BACKEND] Richiesta di eliminazione per il cookie: ${name} da ${url}`);
    try {
      await session.defaultSession.cookies.remove(url, name);
      console.log(`[BACKEND] Cookie ${name} eliminato.`);
      // Ritorna la lista aggiornata
      const cookies = await session.defaultSession.cookies.get({});
      console.log(`[BACKEND] Restituiti ${cookies.length} cookie dopo l'eliminazione.`);
      return cookies;
    } catch (error) {
      console.error(`[BACKEND] Errore nell'eliminare il cookie ${name}:`, error);
      return session.defaultSession.cookies.get({}); // Tenta comunque di restituire la lista
    }
  });
}

module.exports = { setupCookieHandlers };