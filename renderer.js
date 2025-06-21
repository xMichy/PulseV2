document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.getElementById('main-content');
    
    // --- Gestione Sidebar Download ---
    const downloadBtn = document.getElementById('downloadBtn');
    const closeDownloadBtn = document.getElementById('close-download-sidebar');
    
    const toggleDownloadSidebar = () => {
        mainContent.classList.toggle('sidebar-visible');
        if (mainContent.classList.contains('ai-sidebar-visible')) {
            mainContent.classList.remove('ai-sidebar-visible');
        }
    };
    downloadBtn.addEventListener('click', toggleDownloadSidebar);
    closeDownloadBtn.addEventListener('click', toggleDownloadSidebar);

    // --- Gestione Sidebar AI Chat ---
    const aiChatBtn = document.getElementById('aiChatBtn');
    const closeAiChatBtn = document.getElementById('close-ai-chat-sidebar');
    
    const toggleAiChatSidebar = () => {
        mainContent.classList.toggle('ai-sidebar-visible');
        if (mainContent.classList.contains('sidebar-visible')) {
            mainContent.classList.remove('sidebar-visible');
        }
    };
    aiChatBtn.addEventListener('click', toggleAiChatSidebar);
    closeAiChatBtn.addEventListener('click', toggleAiChatSidebar);

    // NOTA: La gestione della sidebar dei download è ora completamente
    // contenuta e gestita da `download-manager.js` e `index.html`.
    // Il renderer principale non ha più bisogno di gestirla.
});
