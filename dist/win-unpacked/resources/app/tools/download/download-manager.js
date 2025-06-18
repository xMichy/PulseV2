// tools/download/download-manager.js
document.addEventListener('DOMContentLoaded', () => {
    const downloadBtn = document.getElementById('downloadBtn');
    const closeBtn = document.getElementById('close-download-sidebar');
    const mainContent = document.getElementById('main-content');
    const downloadList = document.getElementById('download-list');

    const toggleSidebar = () => mainContent.classList.toggle('sidebar-visible');
    
    downloadBtn.addEventListener('click', toggleSidebar);
    closeBtn.addEventListener('click', toggleSidebar);

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

    const renderDownloadItem = (itemData, fromHistory = false) => {
        const { id, fileName, totalBytes, state, path, completionTime } = itemData;
        const item = document.createElement('div');
        item.id = id;
        item.className = 'download-item';
        item.dataset.totalBytes = totalBytes;

        const isFinished = state === 'completed' || state === 'cancelled' || state === 'interrupted';

        item.innerHTML = `
            <div class="download-icon">${getIconForFile(fileName)}</div>
            <div class="download-details">
                <div class="file-name">${fileName || 'N/D'}</div>
                <div class="progress-bar" style="display: ${isFinished ? 'none' : 'flex'};"><div class="progress"></div></div>
                <div class="download-info">
                    <span class="progress-text">Inizializzazione...</span>
                    <span class="speed-text"></span>
                </div>
                <div class="download-time"><span class="time-text"></span></div>
                <div class="progress-actions" style="display: ${isFinished ? 'none' : 'block'};">
                    <button class="cancel-btn">Annulla</button>
                </div>
                <div class="download-actions" style="display: ${isFinished ? 'block' : 'none'};">
                    <button class="open-file" disabled>Apri file</button>
                    <button class="show-in-folder" disabled>Mostra nella cartella</button>
                    <button class="remove-item">Rimuovi</button>
                </div>
            </div>`;

        item.querySelector('.cancel-btn').addEventListener('click', () => window.api.send('cancel-download', id));
        item.querySelector('.remove-item').addEventListener('click', async () => {
            await window.api.invoke('downloads:remove-from-history', id);
            item.remove();
        });

        if (fromHistory) {
            downloadList.appendChild(item);
        } else {
            downloadList.prepend(item);
        }
        
        if (isFinished) {
            finalizeDownloadItemInUI(itemData);
        }
    };

    const finalizeDownloadItemInUI = (itemData) => {
        const { id, state, path, completionTime } = itemData;
        const item = document.getElementById(id);
        if (!item) return;

        item.querySelector('.progress-bar').style.display = 'none';
        item.querySelector('.download-time').style.display = 'none';
        item.querySelector('.progress-actions').style.display = 'none';
        item.querySelector('.speed-text').style.display = 'none';

        const progressText = item.querySelector('.progress-text');
        const actions = item.querySelector('.download-actions');
        actions.style.display = 'block';

        if (state === 'completed') {
            progressText.textContent = `Completato - ${new Date(completionTime).toLocaleDateString()}`;
            const openBtn = actions.querySelector('.open-file');
            const showBtn = actions.querySelector('.show-in-folder');
            openBtn.disabled = false;
            showBtn.disabled = false;
            openBtn.addEventListener('click', () => window.api.send('download-action', { action: 'open', path }));
            showBtn.addEventListener('click', () => window.api.send('download-action', { action: 'show', path }));
        } else {
            progressText.textContent = `Download non riuscito: ${state}`;
        }
    };

    const loadDownloadHistory = async () => {
        const history = await window.api.invoke('downloads:get-history');
        downloadList.innerHTML = '';
        history.forEach(itemData => renderDownloadItem(itemData, true));
    };

    window.api.handleDownloadStarted((itemData) => {
        renderDownloadItem(itemData, false);
    });

    window.api.handleDownloadProgress(({ id, receivedBytes, speed, timeRemaining }) => {
        const item = document.getElementById(id);
        if (!item) return;
        const progressBar = item.querySelector('.progress');
        const progressText = item.querySelector('.progress-text');
        const speedText = item.querySelector('.speed-text');
        const timeText = item.querySelector('.time-text');
        const totalBytes = parseFloat(item.dataset.totalBytes);
        const percent = totalBytes > 0 ? (receivedBytes / totalBytes) * 100 : 0;
        progressBar.style.width = `${percent}%`;
        progressText.textContent = `${(receivedBytes / 1048576).toFixed(2)} MB / ${(totalBytes / 1048576).toFixed(2)} MB`;
        speedText.textContent = formatSpeed(speed);
        timeText.textContent = formatTime(timeRemaining);
    });

    window.api.handleDownloadComplete((itemData) => {
        finalizeDownloadItemInUI(itemData);
    });

    loadDownloadHistory();
});