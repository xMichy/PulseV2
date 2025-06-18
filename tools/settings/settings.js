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
                    // Invia la richiesta di eliminazione e renderizza di nuovo la lista con i dati aggiornati
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
        const allCookies = await window.api.invoke('settings:get-all-cookies');
        renderCookies(allCookies);
    }

    loadAndRenderCookies();
});