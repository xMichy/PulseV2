// Michele Galliani
// tools/tabs/tab-manager.js - VERSIONE CHROME UI
document.addEventListener('DOMContentLoaded', () => {
    const tabBar = document.getElementById('tab-bar');
    const newTabBtn = document.getElementById('new-tab-btn');
    const webviewContainer = document.getElementById('webview-container');
    const backBtn = document.getElementById('backBtn');
    const fwdBtn = document.getElementById('fwdBtn');
    const reloadBtn = document.getElementById('reloadBtn');
    const urlInput = document.getElementById('urlInput');
    const settingsBtn = document.getElementById('settingsBtn');

    let tabs = new Map();
    let activeTabId = null;

    const getActiveTab = () => tabs.get(activeTabId);

    const createNewTab = (url = 'https://www.google.com') => {
        const tabId = `tab-${Date.now()}`;
        
        const tabElement = document.createElement('div');
        tabElement.className = 'tab';
        tabElement.dataset.tabId = tabId;
        
        // Nuova struttura HTML per la scheda stile Chrome
        tabElement.innerHTML = `
            <img class="tab-icon" src="./tools/tabs/default-icon.png">
            <span class="tab-title">Nuova scheda</span>
            <button class="tab-close-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z"/></svg>
            </button>
        `;
        // Inserisce la nuova scheda prima del pulsante "+"
        tabBar.insertBefore(tabElement, newTabBtn);

        const webview = document.createElement('webview');
        webview.className = 'webview';
        webview.setAttribute('src', url);
        webview.setAttribute('preload', './preload.js');
        
        webviewContainer.appendChild(webview);
        
        tabs.set(tabId, { id: tabId, element: tabElement, webview: webview, title: 'Nuova scheda', isReady: false });

        // Gestori eventi per la webview
        webview.addEventListener('dom-ready', () => {
            const tab = tabs.get(tabId);
            if (tab) tab.isReady = true;
            if (tabId === activeTabId) updateNavControls();
        });

        webview.addEventListener('did-navigate', (e) => {
            if (tabId === activeTabId) {
                urlInput.value = e.url;
                updateNavControls();
            }
        });

        webview.addEventListener('page-title-updated', (e) => {
            tabElement.querySelector('.tab-title').textContent = e.title;
        });

        webview.addEventListener('page-favicon-updated', (e) => {
            const icon = tabElement.querySelector('.tab-icon');
            if (e.favicons && e.favicons.length > 0) {
                icon.src = e.favicons[0];
            } else {
                icon.src = './tools/tabs/default-icon.png';
            }
        });

        // Gestori eventi per la scheda
        tabElement.addEventListener('click', () => switchToTab(tabId));
        tabElement.querySelector('.tab-close-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(tabId);
        });

        switchToTab(tabId);
        return tabId;
    };

    const switchToTab = (tabId) => {
        if (!tabs.has(tabId)) return;
        activeTabId = tabId;

        tabs.forEach(tab => {
            const isActive = tab.id === tabId;
            tab.element.classList.toggle('active', isActive);
            tab.webview.classList.toggle('hidden', !isActive); // Usa la classe .hidden
        });
        
        updateNavControls();
    };
    
    const closeTab = (tabId) => {
        const tabToClose = tabs.get(tabId);
        if (!tabToClose) return;

        tabToClose.element.remove();
        tabToClose.webview.remove();
        tabs.delete(tabId);

        if (activeTabId === tabId) {
            const remainingTabs = Array.from(tabs.keys());
            if (remainingTabs.length > 0) {
                switchToTab(remainingTabs[remainingTabs.length - 1]);
            } else {
                activeTabId = null;
                createNewTab(); // Crea una nuova scheda se non ne rimangono
            }
        }
    };

    const updateNavControls = () => {
        const tab = getActiveTab();
        if (tab && tab.isReady && tab.webview) {
            urlInput.value = tab.webview.getURL();
            backBtn.disabled = !tab.webview.canGoBack();
            fwdBtn.disabled = !tab.webview.canGoForward();
        } else {
            urlInput.value = '';
            backBtn.disabled = true;
            fwdBtn.disabled = true;
        }
    };
    
    // Gestori eventi dei controlli
    newTabBtn.addEventListener('click', () => createNewTab());
    backBtn.addEventListener('click', () => getActiveTab()?.webview.goBack());
    fwdBtn.addEventListener('click', () => getActiveTab()?.webview.goForward());
    reloadBtn.addEventListener('click', () => getActiveTab()?.webview.reload());
    
    const navigate = () => {
        const input = urlInput.value.trim();
        if (!input) return;

        let finalUrl;
        const isUrl = (input.includes('.') && !/\s/.test(input)) || input.toLowerCase().startsWith('localhost');
        
        if (isUrl) {
            finalUrl = (!/^(https?|file):\/\//.test(input)) ? 'https://' + input : input;
        } else {
            finalUrl = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
        }
        
        const activeWebview = getActiveTab()?.webview;
        if (activeWebview) {
            activeWebview.loadURL(finalUrl);
        }
    };

    urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') navigate();
    });

    settingsBtn.addEventListener('click', () => {
        createNewTab('./tools/settings/settings.html');
    });

    window.addEventListener('open-new-tab', (e) => {
        if (e.detail && e.detail.url) createNewTab(e.detail.url);
    });

    // Inizializza con la prima scheda
    createNewTab();
});