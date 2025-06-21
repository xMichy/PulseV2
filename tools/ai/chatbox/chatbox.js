document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');

    // Intercetta i click sui link nella chat
    chatMessages.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            const url = e.target.href;
            // Lancia un evento personalizzato per aprire il link in una nuova scheda
            window.dispatchEvent(new CustomEvent('open-new-tab', { detail: { url } }));
        }
    });

    const addMessage = (sender, text, isHtml = false) => {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}`;
        if (isHtml) {
            messageElement.innerHTML = text;
        } else {
            messageElement.textContent = text;
        }
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return messageElement;
    };

    const handleSend = async () => {
        const messageText = chatInput.value.trim();
        if (!messageText) return;

        addMessage('user', messageText);
        chatInput.value = '';
        chatInput.style.height = 'auto'; // Reset height

        const thinkingMessage = addMessage('ai', '...'); // Placeholder for AI response
        thinkingMessage.classList.add('thinking');

        try {
            const response = await window.api.sendChatMessage(messageText);
            // marked è disponibile globalmente grazie allo script in index.html
            const htmlResponse = marked.parse(response);
            thinkingMessage.innerHTML = htmlResponse; // Use innerHTML to render formatted content
            thinkingMessage.classList.remove('thinking');
        } catch (error) {
            thinkingMessage.textContent = `Errore: ${error.message}`;
            thinkingMessage.classList.remove('thinking');
            thinkingMessage.style.color = '#ff6b6b';
        }
    };

    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    // Auto-resize textarea
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = `${chatInput.scrollHeight}px`;
    });
}); 