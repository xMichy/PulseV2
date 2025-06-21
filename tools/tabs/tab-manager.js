// tools/tabs/tab-manager.js
document.addEventListener('DOMContentLoaded', () => {
    const tabBar = document.getElementById('tab-bar');
    const newTabBtn = document.getElementById('new-tab-btn');
    const webviewContainer = document.getElementById('webview-container');

    const backBtn = document.getElementById('backBtn');
    const fwdBtn = document.getElementById('fwdBtn');
    const reloadBtn = document.getElementById('reloadBtn');
    const urlInput = document.getElementById('urlInput');
    const goBtn = document.getElementById('goBtn');
    const settingsBtn = document.getElementById('settingsBtn');

    let tabs = new Map();
    let activeTabId = null;

    const getActiveTab = () => tabs.get(activeTabId);

    const createNewTab = (url = 'https://www.google.com') => {
        const tabId = `tab-${Date.now()}`;
        
        const tabElement = document.createElement('div');
        tabElement.className = 'tab';
        tabElement.dataset.tabId = tabId;
        tabElement.innerHTML = `
            <img class="tab-icon" src="./tools/tabs/default-icon.png">
            <span class="tab-title">Nuova scheda</span>
            <button class="close-tab-btn">×</button>
        `;
        tabBar.insertBefore(tabElement, newTabBtn);

        const webview = document.createElement('webview');
        webview.className = 'webview';
        webview.setAttribute('src', url);
        // CORREZIONE DEFINITIVA: Usa un percorso relativo standard per il preload.
        // Questo è il modo corretto e non causa crash.
        webview.setAttribute('preload', './preload.js');

        tabs.set(tabId, { id: tabId, element: tabElement, webview: webview, title: 'Nuova scheda', isReady: false });

        webviewContainer.appendChild(webview);

        const onDomReady = () => {
            const tab = tabs.get(tabId);
            if (tab) {
                tab.isReady = true;
                if (tabId === activeTabId) {
                    updateNavControls();
                }
            }
        };

        webview.addEventListener('dom-ready', onDomReady);
        
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
            if (e.favicons && e.favicons.length > 0) {
                tabElement.querySelector('.tab-icon').src = e.favicons[0];
            } else {
                tabElement.querySelector('.tab-icon').src = './tools/tabs/default-icon.png';
            }
        });

        tabElement.addEventListener('click', () => switchToTab(tabId));
        tabElement.querySelector('.close-tab-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(tabId);
        });

        switchToTab(tabId);
    };

    const switchToTab = (tabId) => {
        activeTabId = tabId;
        tabs.forEach(tab => {
            const isActive = tab.id === tabId;
            tab.element.classList.toggle('active', isActive);
            tab.webview.classList.toggle('active', isActive);
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
                activeTabId = null; // Resetta l'ID attivo
                createNewTab();
            }
        }
    };

    const updateNavControls = () => {
        const tab = getActiveTab();
        if (tab && tab.isReady) {
            urlInput.value = tab.webview.getURL();
            backBtn.disabled = !tab.webview.canGoBack();
            fwdBtn.disabled = !tab.webview.canGoForward();
        } else {
            // Se la tab non è pronta, disabilita i controlli
            urlInput.value = '';
            backBtn.disabled = true;
            fwdBtn.disabled = true;
        }
    };
    
    // Gestori dei controlli di navigazione
    newTabBtn.addEventListener('click', () => createNewTab());
    backBtn.addEventListener('click', () => getActiveTab()?.webview.goBack());
    fwdBtn.addEventListener('click', () => getActiveTab()?.webview.goForward());
    reloadBtn.addEventListener('click', () => getActiveTab()?.webview.reload());
    
    const navigate = () => {
        const input = urlInput.value.trim();
        if (!input) {
            return;
        }

        let finalUrl;

        // Controlla se l'input è un URL valido (contiene un punto, niente spazi, o è localhost)
        const isUrl = (input.includes('.') && !/\s/.test(input)) || input.toLowerCase().startsWith('localhost');
        
        if (isUrl) {
            // Se è un URL ma manca il protocollo, lo aggiungiamo.
            if (!/^(https?|file):\/\//.test(input)) {
                finalUrl = 'https://' + input;
            } else {
                finalUrl = input;
            }
        } else {
            // Altrimenti, lo trattiamo come un termine di ricerca per Google.
            finalUrl = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
        }
        
        // Carica l'URL nella webview della scheda attiva.
        getActiveTab()?.webview.loadURL(finalUrl);
    };

    goBtn.addEventListener('click', navigate);

    urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            navigate();
        }
    });

    settingsBtn.addEventListener('click', () => {
        createNewTab('./tools/settings/settings.html');
    });

    // Inizializza con la prima scheda
    createNewTab();
});