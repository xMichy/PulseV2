// Michele Galliani
// tools/download/download-manager.js
document.addEventListener('DOMContentLoaded', () => {
    const downloadList = document.getElementById('download-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const mainContent = document.getElementById('main-content');

    // La logica per pulire la cronologia rimane qui
    clearHistoryBtn.addEventListener('click', async () => {
        if (confirm('Sei sicuro di voler cancellare tutta la cronologia dei download?')) {
            try {
                await window.api.invoke('downloads:clear-history');
                downloadList.innerHTML = '<div class="no-downloads">Nessun download nella cronologia</div>';
            } catch (error) {
                console.error('Errore nella pulizia della cronologia:', error);
            }
        }
    });

    // Funzione per caricare e renderizzare la cronologia
    const loadDownloadHistory = async () => {
        try {
            const history = await window.api.invoke('downloads:get-history');
            downloadList.innerHTML = ''; // Pulisci sempre prima di renderizzare
            if (history && history.length > 0) {
                history.forEach(createOrUpdateItemUI);
            } else {
                downloadList.innerHTML = '<div class="no-downloads">Nessun download nella cronologia</div>';
            }
        } catch (error) {
            console.error('Errore nel caricamento della cronologia download:', error);
            downloadList.innerHTML = '<div class="error">Errore nel caricamento della cronologia</div>';
        }
    };
    
    // RIPRISTINO: Usa un MutationObserver per caricare la cronologia
    // solo quando la sidebar diventa visibile.
    const downloadObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.attributeName === 'class' && mainContent.classList.contains('sidebar-visible')) {
                loadDownloadHistory();
            }
        }
    });

    if (mainContent) {
        downloadObserver.observe(mainContent, { attributes: true });
    }
    
    // Caricamento iniziale se la sidebar è già visibile all'avvio
    if (mainContent.classList.contains('sidebar-visible')) {
        loadDownloadHistory();
    }

    const formatSpeed = (bytesPerSecond) => {
        if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`;
        if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
        return `${(bytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`;
    };
    const formatTime = (seconds) => {
        if (seconds === Infinity || isNaN(seconds) || seconds < 0) return '--';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${h}h ${m}m rimasti`;
        if (m > 0) return `${m}m ${s}s rimasti`;
        return `${s}s rimasti`;
    };
    const getIconForFile = (fileName) => {
        if (!fileName) return '📁';
        const ext = fileName.split('.').pop().toLowerCase();
        if (['pdf'].includes(ext)) return '📄';
        if (['zip', 'rar', '7z'].includes(ext)) return '📦';
        if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return '🖼️';
        if (['exe', 'msi'].includes(ext)) return '⚙️';
        return '📁';
    };

    const createOrUpdateItemUI = (itemData) => {
        const { id, fileName, totalBytes, state, path } = itemData;
        let item = document.getElementById(id);
        if (!item) {
            item = document.createElement('div');
            item.id = id;
            item.className = 'download-item';
            downloadList.prepend(item);
        }
        item.dataset.totalBytes = totalBytes;
        const isFinished = ['completed', 'cancelled', 'interrupted'].includes(state);

        item.innerHTML = `
            <div class="download-icon">${getIconForFile(fileName)}</div>
            <div class="download-details">
                <div class="file-name">${fileName || 'N/D'}</div>
                <div class="progress-bar" style="display: ${isFinished ? 'none' : 'flex'};"><div class="progress"></div></div>
                <div class="download-info">
                    <span class="progress-text">${isFinished ? (state === 'completed' ? `Completato` : `Fallito: ${state}`) : 'Inizializzazione...'}</span>
                    <span class="speed-text" style="display: ${isFinished ? 'none' : 'block'};"></span>
                </div>
                <div class="download-time" style="display: ${isFinished ? 'none' : 'block'};"><span class="time-text"></span></div>
                <div class="progress-actions" style="display: ${isFinished ? 'none' : 'block'};">
                    <button class="cancel-btn">Annulla</button>
                </div>
                <div class="download-actions" style="display: ${isFinished ? 'block' : 'none'};">
                    <button class="open-file" ${state !== 'completed' ? 'disabled' : ''}>Apri file</button>
                    <button class="show-in-folder" ${state === 'completed' ? '' : 'disabled'}>Mostra cartella</button>
                    <button class="remove-item">Rimuovi</button>
                </div>
            </div>`;

        if (!isFinished) {
            item.querySelector('.cancel-btn').addEventListener('click', () => window.api.send('cancel-download', id));
        } else if (state === 'completed') {
            item.querySelector('.open-file').addEventListener('click', () => window.api.send('download-action', { action: 'open', path }));
            item.querySelector('.show-in-folder').addEventListener('click', () => window.api.send('download-action', { action: 'show', path }));
        }
        item.querySelector('.remove-item').addEventListener('click', async () => {
            await window.api.invoke('downloads:remove-from-history', id);
            item.remove();
        });
    };

    window.api.handleDownloadStarted((itemData) => {
        if (downloadList.querySelector('.no-downloads')) downloadList.innerHTML = '';
        createOrUpdateItemUI(itemData);
    });
    window.api.handleDownloadProgress(({ id, receivedBytes, speed, timeRemaining }) => {
        const item = document.getElementById(id);
        if (!item) return;
        const totalBytes = item.dataset.totalBytes;
        item.querySelector('.progress').style.width = `${(receivedBytes / totalBytes) * 100}%`;
        item.querySelector('.progress-text').textContent = `${(receivedBytes / 1048576).toFixed(2)} MB / ${(totalBytes / 1048576).toFixed(2)} MB`;
        item.querySelector('.speed-text').textContent = formatSpeed(speed);
        item.querySelector('.time-text').textContent = formatTime(timeRemaining);
    });
    window.api.handleDownloadComplete((itemData) => {
        createOrUpdateItemUI(itemData);
    });
});