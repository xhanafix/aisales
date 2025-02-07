class AISalesAssistant {
    constructor() {
        this.apiKey = localStorage.getItem('openRouterApiKey') || '';
        this.initializeElements();
        this.addEventListeners();
        this.updateApiKeyStatus();
    }

    initializeElements() {
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.saveApiKeyBtn = document.getElementById('saveApiKey');
        this.resetApiKeyBtn = document.getElementById('resetApiKey');
        this.apiKeyStatus = document.getElementById('apiKeyStatus');
        this.languageSelect = document.getElementById('languageSelect');
        this.productDetails = document.getElementById('productDetails');
        this.generateBtn = document.getElementById('generateBtn');
        this.progressContainer = document.querySelector('.progress-container');
        this.progressBar = document.querySelector('.progress-bar');
        this.outputText = document.getElementById('outputText');
        this.copyBtn = document.getElementById('copyBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
    }

    addEventListeners() {
        this.saveApiKeyBtn.addEventListener('click', () => this.saveApiKey());
        this.resetApiKeyBtn.addEventListener('click', () => this.resetApiKey());
        this.generateBtn.addEventListener('click', () => this.generateConversation());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        this.downloadBtn.addEventListener('click', () => this.downloadText());
    }

    updateApiKeyStatus() {
        if (this.apiKey) {
            this.apiKeyStatus.textContent = `API Key: Set (${this.maskApiKey(this.apiKey)})`;
            this.apiKeyStatus.classList.add('active');
            this.apiKeyInput.value = '';
            this.apiKeyInput.placeholder = 'API Key is saved';
        } else {
            this.apiKeyStatus.textContent = 'API Key: Not Set';
            this.apiKeyStatus.classList.remove('active');
            this.apiKeyInput.placeholder = 'Enter OpenRouter API Key';
        }
    }

    maskApiKey(key) {
        if (key.length <= 8) return '********';
        return key.substring(0, 4) + '...' + key.substring(key.length - 4);
    }

    saveApiKey() {
        const apiKey = this.apiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('openRouterApiKey', apiKey);
            this.apiKey = apiKey;
            this.updateApiKeyStatus();
            this.showNotification('API key saved successfully!', 'success');
        } else {
            this.showNotification('Please enter a valid API key', 'error');
        }
    }

    resetApiKey() {
        if (confirm('Are you sure you want to reset your API key? This action cannot be undone.')) {
            localStorage.removeItem('openRouterApiKey');
            this.apiKey = '';
            this.apiKeyInput.value = '';
            this.updateApiKeyStatus();
            this.showNotification('API key has been reset', 'success');
        }
    }

    async generateConversation() {
        if (!this.apiKey) {
            this.showNotification('Please set your API key first', 'error');
            return;
        }

        const productDetails = this.productDetails.value.trim();
        if (!productDetails) {
            this.showNotification('Please enter product details', 'error');
            return;
        }

        this.showProgress();
        
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'google/learnlm-1.5-pro-experimental:free',
                    messages: [
                        {
                            role: 'system',
                            content: `You are a professional sales assistant specializing in realistic sales conversations. 
                            Generate a natural conversation flow that includes:
                            1. Initial greeting and product introduction
                            2. At least 2-3 common customer objections (e.g., price concerns, need to consult spouse, comparing with competitors)
                            3. Customer indecision or hesitation moments
                            4. Professional objection handling by the seller
                            5. Price negotiation if applicable
                            6. Clear closing attempts
                            7. Follow-up arrangement if no immediate purchase
                            
                            Format each message starting with either "Seller:" or "Buyer:" followed by their message.
                            Make the conversation flow natural and realistic, not overly pushy or artificial.`
                        },
                        {
                            role: 'user',
                            content: `Generate a realistic sales conversation in ${this.languageSelect.value === 'en' ? 'English' : 'Bahasa Malaysia'} for the following product: ${productDetails}. 
                            Include natural objections, hesitation, and professional responses. Make sure each line starts with either "Seller:" or "Buyer:". 
                            The conversation should demonstrate professional sales techniques while remaining authentic and relatable.`
                        }
                    ]
                })
            });

            const data = await response.json();
            const conversation = data.choices[0].message.content;
            this.displayChatBubbles(conversation);
        } catch (error) {
            this.showNotification('Error generating conversation: ' + error.message, 'error');
        } finally {
            this.hideProgress();
        }
    }

    displayChatBubbles(conversation) {
        const outputContainer = this.outputText;
        outputContainer.innerHTML = '';
        
        // Split the conversation into lines and process each line
        const lines = conversation.split('\n').filter(line => line.trim());
        
        lines.forEach(line => {
            if (line.trim()) {
                const isSeller = line.toLowerCase().startsWith('seller:');
                const isBuyer = line.toLowerCase().startsWith('buyer:');
                
                if (isSeller || isBuyer) {
                    const messageText = line.substring(line.indexOf(':') + 1).trim();
                    const messageDiv = document.createElement('div');
                    messageDiv.className = `chat-message ${isSeller ? 'seller' : 'buyer'}`;
                    
                    messageDiv.innerHTML = `
                        <div class="chat-bubble">
                            <div class="chat-label">${isSeller ? 'Seller' : 'Buyer'}</div>
                            ${messageText}
                            <div class="message-actions">
                                <button class="copy-message" data-message="${messageText}">
                                    ${this.languageSelect.value === 'en' ? 'Copy' : 'Salin'}
                                </button>
                            </div>
                        </div>
                    `;
                    
                    // Add click event listener for the copy button
                    messageDiv.querySelector('.copy-message').addEventListener('click', (e) => {
                        const textToCopy = e.target.dataset.message;
                        navigator.clipboard.writeText(textToCopy)
                            .then(() => {
                                this.showNotification(
                                    this.languageSelect.value === 'en' ? 
                                    'Message copied!' : 
                                    'Teks disalin!', 
                                    'success'
                                );
                            })
                            .catch(() => {
                                this.showNotification(
                                    this.languageSelect.value === 'en' ? 
                                    'Failed to copy' : 
                                    'Gagal menyalin', 
                                    'error'
                                );
                            });
                    });

                    outputContainer.appendChild(messageDiv);
                }
            }
        });
    }

    showProgress() {
        this.progressContainer.style.display = 'block';
        this.progressBar.style.width = '90%';
    }

    hideProgress() {
        this.progressBar.style.width = '100%';
        setTimeout(() => {
            this.progressContainer.style.display = 'none';
            this.progressBar.style.width = '0%';
        }, 300);
    }

    async copyToClipboard() {
        try {
            const textToCopy = Array.from(this.outputText.querySelectorAll('.chat-message'))
                .map(msg => {
                    const label = msg.querySelector('.chat-label').textContent;
                    const content = msg.querySelector('.chat-bubble').textContent.replace(label, '').trim();
                    return `${label}: ${content}`;
                })
                .join('\n');
            
            await navigator.clipboard.writeText(textToCopy);
            this.showNotification('Copied to clipboard!', 'success');
        } catch (err) {
            this.showNotification('Failed to copy text', 'error');
        }
    }

    downloadText() {
        const textToDownload = Array.from(this.outputText.querySelectorAll('.chat-message'))
            .map(msg => {
                const label = msg.querySelector('.chat-label').textContent;
                const content = msg.querySelector('.chat-bubble').textContent.replace(label, '').trim();
                return `${label}: ${content}`;
            })
            .join('\n');

        const blob = new Blob([textToDownload], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sales-conversation.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new AISalesAssistant();
}); 