// tools/settings/cookies/cookie-handler.js
const { ipcMain, session } = require('electron');

// MODIFICATO: La funzione ora è 'async'
async function setupCookieHandlers() {
  ipcMain.handle('settings:get-all-cookies', async () => {
    return await session.defaultSession.cookies.get({});
  });

  ipcMain.handle('settings:delete-cookie', async (event, { url, name }) => {
    await session.defaultSession.cookies.remove(url, name);
    return await session.defaultSession.cookies.get({});
  });
}

module.exports = { setupCookieHandlers };