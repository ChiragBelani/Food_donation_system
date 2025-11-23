document.addEventListener('DOMContentLoaded', () => {
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatWindow = document.getElementById('chat-window');
    const closeChat = document.getElementById('close-chat');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    // Toggle Chat Window
    chatbotToggle.addEventListener('click', () => {
        chatWindow.classList.toggle('d-none');
        if (!chatWindow.classList.contains('d-none')) {
            chatInput.focus();
            scrollToBottom();
        }
    });

    closeChat.addEventListener('click', () => {
        chatWindow.classList.add('d-none');
    });

    // Shared Submit Handler
    async function handleChatSubmit(message) {
        if (!message) return;

        // Add User Message
        addMessage(message, 'user');
        chatInput.value = '';

        // Show Typing Indicator
        showTypingIndicator();

        try {
            // Send to Backend
            const response = await fetch('/chatbot/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();

            // Remove Typing Indicator
            removeTypingIndicator();

            // Add Bot Response
            if (data.success) {
                addMessage(data.reply, 'bot');
            } else {
                addMessage("Sorry, I'm having trouble connecting right now.", 'bot');
            }

        } catch (error) {
            console.error('Chatbot Error:', error);
            removeTypingIndicator();
            addMessage("Sorry, something went wrong. Please try again.", 'bot');
        }
    }

    // Send Message via Form
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        handleChatSubmit(message);
    });

    // Helper: Add Message to UI
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`, 'animate__animated', 'animate__fadeIn');

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
        contentDiv.textContent = text; // Text content for security (prevents XSS)

        const timeDiv = document.createElement('div');
        timeDiv.classList.add('message-time');
        timeDiv.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);

        // Insert before quick actions if they exist, otherwise append
        const quickActions = chatMessages.querySelector('.quick-actions');
        if (quickActions && sender === 'bot') {
            // If bot message, maybe we want to keep quick actions at the bottom? 
            // For now, let's just append to the message list container, but we might want to move quick actions to the bottom.
            // Actually, let's just append normally.
            chatMessages.insertBefore(messageDiv, quickActions);
            // Move quick actions to bottom
            chatMessages.appendChild(quickActions);
        } else {
            chatMessages.appendChild(messageDiv);
        }

        scrollToBottom();
    }

    // Helper: Show Typing Indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.classList.add('message', 'bot-message', 'typing-indicator-container');
        typingDiv.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        scrollToBottom();
    }

    // Helper: Remove Typing Indicator
    function removeTypingIndicator() {
        const typingDiv = document.getElementById('typing-indicator');
        if (typingDiv) {
            typingDiv.remove();
        }
    }

    // Helper: Scroll to Bottom
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Expose function for quick actions
    window.sendQuickMessage = (text) => {
        chatInput.value = text;
        chatForm.dispatchEvent(new Event('submit'));
    };
});
