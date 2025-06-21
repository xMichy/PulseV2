// Michele Galliani
// tools/settings/settings.js
document.addEventListener('DOMContentLoaded', () => {
    const cookieContainer = document.getElementById('cookie-list-container');

    const renderCookies = (cookies) => {
        cookieContainer.innerHTML = ''; // Pulisci la lista precedente

        if (cookies.length === 0) {
            cookieContainer.innerHTML = '<p>Nessun cookie trovato.</p>';
            return;
        }

        // Raggruppa i cookie per dominio
        const groupedByDomain = cookies.reduce((acc, cookie) => {
            const domain = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain;
            if (!acc[domain]) {
                acc[domain] = [];
            }
            acc[domain].push(cookie);
            return acc;
        }, {});

        // Crea gli elementi HTML
        for (const domain in groupedByDomain) {
            const cookiesForDomain = groupedByDomain[domain];
            
            const detailsElement = document.createElement('details');
            detailsElement.className = 'domain-item';
            
            const summaryElement = document.createElement('summary');
            summaryElement.className = 'domain-summary';
            summaryElement.innerHTML = `
                <span class="domain-name">${domain}</span>
                <span class="cookie-count">${cookiesForDomain.length} cookie(s)</span>
            `;
            
            const detailsContent = document.createElement('div');
            detailsContent.className = 'cookie-details';

            cookiesForDomain.forEach(cookie => {
                const cookieEntry = document.createElement('div');
                cookieEntry.className = 'cookie-entry';
                cookieEntry.innerHTML = `<span class="cookie-name">${cookie.name}</span>`;

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Elimina';
                deleteBtn.className = 'delete-cookie-btn';
                deleteBtn.onclick = async () => {
                    const url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
                    // RIPRISTINO: Usa la chiamata 'invoke' generica, che ora funziona
                    const updatedCookies = await window.api.invoke('settings:delete-cookie', { url, name: cookie.name });
                    renderCookies(updatedCookies);
                };
                
                cookieEntry.appendChild(deleteBtn);
                detailsContent.appendChild(cookieEntry);
            });
            
            detailsElement.appendChild(summaryElement);
            detailsElement.appendChild(detailsContent);
            cookieContainer.appendChild(detailsElement);
        }
    };

    // Carica i cookie all'avvio della pagina
    async function loadAndRenderCookies() {
        console.log('[FRONTEND] Tentativo di caricare i cookie...');
        cookieContainer.innerHTML = '<p>Caricamento cookie...</p>';
        try {
            const allCookies = await window.api.invoke('settings:get-all-cookies');
            console.log('[FRONTEND] Ricevuti dati dal backend:', allCookies);
            if (allCookies) {
                console.log(`[FRONTEND] Rendering di ${allCookies.length} cookie.`);
                renderCookies(allCookies);
            } else {
                console.warn('[FRONTEND] Ricevuto un valore nullo o undefined dal backend.');
                cookieContainer.innerHTML = '<p class="error">Impossibile caricare i cookie (dati non validi).</p>';
            }
        } catch (error) {
            console.error('[FRONTEND] Errore API nel caricamento dei cookie:', error);
            cookieContainer.innerHTML = '<p class="error">Impossibile caricare i cookie (errore API).</p>';
        }
    }

    loadAndRenderCookies();
});