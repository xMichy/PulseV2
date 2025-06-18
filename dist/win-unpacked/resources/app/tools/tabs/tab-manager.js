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
            <img class="tab-icon" src="default-icon.png">
            <span class="tab-title">Nuova scheda</span>
            <button class="close-tab-btn">×</button>
        `;
        tabBar.insertBefore(tabElement, newTabBtn);

        const webview = document.createElement('webview');
        webview.className = 'webview';
        webview.setAttribute('src', url);
        webviewContainer.appendChild(webview);

        tabs.set(tabId, { id: tabId, element: tabElement, webview: webview, title: 'Nuova scheda' });
        
        webview.addEventListener('did-navigate', (e) => {
            if (tabId === activeTabId) {
                urlInput.value = e.url;
                updateNavButtons();
            }
        });
        webview.addEventListener('page-title-updated', (e) => {
            tabElement.querySelector('.tab-title').textContent = e.title;
        });
        webview.addEventListener('page-favicon-updated', (e) => {
            if (e.favicons && e.favicons.length > 0) {
                tabElement.querySelector('.tab-icon').src = e.favicons[0];
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
        
        const activeTab = getActiveTab();
        if (activeTab) {
            urlInput.value = activeTab.webview.getURL();
            updateNavButtons();
        }
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
                createNewTab();
            }
        }
    };

    const updateNavButtons = () => {
        const tab = getActiveTab();
        if (tab) {
            backBtn.disabled = !tab.webview.canGoBack();
            fwdBtn.disabled = !tab.webview.canGoForward();
        }
    };
    
    // Gestori dei controlli di navigazione
    newTabBtn.addEventListener('click', () => createNewTab());
    backBtn.addEventListener('click', () => getActiveTab()?.webview.goBack());
    fwdBtn.addEventListener('click', () => getActiveTab()?.webview.goForward());
    reloadBtn.addEventListener('click', () => getActiveTab()?.webview.reload());
    
    goBtn.addEventListener('click', () => {
        let url = urlInput.value;
        if (!/^(https?|file):\/\//.test(url)) {
            url = 'https://' + url;
        }
        getActiveTab()?.webview.loadURL(url);
    });

    urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') goBtn.click();
    });

    // CORREZIONE: L'event listener per le impostazioni era nel posto sbagliato.
    // Ora è qui fuori, al suo posto.
    settingsBtn.addEventListener('click', () => {
        createNewTab('./tools/settings/settings.html');
    });

    // Inizializza con la prima scheda
    createNewTab();
});