// tools/download/download-manager.js
document.addEventListener('DOMContentLoaded', () => {
    const downloadBtn = document.getElementById('downloadBtn');
    const closeBtn = document.getElementById('close-download-sidebar');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const mainContent = document.getElementById('main-content');
    const downloadList = document.getElementById('download-list');

    const toggleSidebar = () => mainContent.classList.toggle('sidebar-visible');
    downloadBtn.addEventListener('click', toggleSidebar);
    closeBtn.addEventListener('click', toggleSidebar);

    // Gestione pulizia cronologia
    clearHistoryBtn.addEventListener('click', async () => {
        if (confirm('Sei sicuro di voler cancellare tutta la cronologia dei download?')) {
            try {
                await window.api.invoke('downloads:clear-history');
                downloadList.innerHTML = '<div class="no-downloads">Nessun download nella cronologia</div>';
                console.log('Cronologia download pulita');
            } catch (error) {
                console.error('Errore nella pulizia della cronologia:', error);
            }
        }
    });

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
        const { id, fileName, totalBytes, state, path, completionTime } = itemData;
        let item = document.getElementById(id);

        // Se l'elemento non esiste, lo creiamo da zero
        if (!item) {
            item = document.createElement('div');
            item.id = id;
            item.className = 'download-item';
            downloadList.prepend(item); // I nuovi download appaiono in cima
        }
        item.dataset.totalBytes = totalBytes;

        const isFinished = state === 'completed' || state === 'cancelled' || state === 'interrupted';

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

        // Aggiungi gli event listener
        if (!isFinished) {
            item.querySelector('.cancel-btn').addEventListener('click', () => window.api.send('cancel-download', id));
        } else {
            if (state === 'completed') {
                item.querySelector('.open-file').addEventListener('click', () => window.api.send('download-action', { action: 'open', path }));
                item.querySelector('.show-in-folder').addEventListener('click', () => window.api.send('download-action', { action: 'show', path }));
            }
        }
        item.querySelector('.remove-item').addEventListener('click', async () => {
            await window.api.invoke('downloads:remove-from-history', id);
            item.remove();
        });
    };

    const loadDownloadHistory = async () => {
        try {
            console.log('Caricamento cronologia download...');
            const history = await window.api.invoke('downloads:get-history');
            console.log('Cronologia caricata:', history);
            
            // Pulisci la lista prima di caricare
            downloadList.innerHTML = '';
            
            if (history && history.length > 0) {
                history.forEach(itemData => {
                    console.log('Aggiungendo item alla cronologia:', itemData);
                    createOrUpdateItemUI(itemData);
                });
            } else {
                console.log('Nessun download nella cronologia');
                // Aggiungi un messaggio se non ci sono download
                downloadList.innerHTML = '<div class="no-downloads">Nessun download nella cronologia</div>';
            }
        } catch (error) {
            console.error('Errore nel caricamento della cronologia download:', error);
            downloadList.innerHTML = '<div class="error">Errore nel caricamento della cronologia</div>';
        }
    };

    // Carica la cronologia immediatamente
    loadDownloadHistory();

    // Ricarica la cronologia quando la sidebar viene aperta
    downloadBtn.addEventListener('click', () => {
        // Aggiungi un piccolo delay per assicurarsi che la sidebar sia aperta
        setTimeout(() => {
            loadDownloadHistory();
        }, 100);
    });

    window.api.handleDownloadStarted((itemData) => {
        console.log('Download iniziato:', itemData);
        createOrUpdateItemUI(itemData);
    });

    window.api.handleDownloadProgress(({ id, receivedBytes, speed, timeRemaining }) => {
        const item = document.getElementById(id);
        if (!item) return;
        item.querySelector('.progress').style.width = `${(receivedBytes / item.dataset.totalBytes) * 100}%`;
        item.querySelector('.progress-text').textContent = `${(receivedBytes / 1048576).toFixed(2)} MB / ${(item.dataset.totalBytes / 1048576).toFixed(2)} MB`;
        item.querySelector('.speed-text').textContent = formatSpeed(speed);
        item.querySelector('.time-text').textContent = formatTime(timeRemaining);
    });

    window.api.handleDownloadComplete((itemData) => {
        console.log('Download completato:', itemData);
        createOrUpdateItemUI(itemData);
    });
});