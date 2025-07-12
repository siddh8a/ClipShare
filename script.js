class ClipboardSharing {
    constructor() {
        this.currentCode = null;
        this.accessedCode = null;
        this.database = firebase.database();
        this.listeners = new Map();
        
        this.initializeElements();
        this.bindEvents();
        this.updateConnectionStatus('connecting');
        this.testConnection();
    }

    initializeElements() {
        // Main elements
        this.clipboardText = document.getElementById('clipboardText');
        this.currentCodeDisplay = document.getElementById('currentCode');
        this.accessCodeInput = document.getElementById('accessCode');
        this.sharedText = document.getElementById('sharedText');
        this.sharedClipboard = document.getElementById('sharedClipboard');
        this.sharedCodeDisplay = document.getElementById('sharedCode');
        
        // Buttons
        this.generateCodeBtn = document.getElementById('generateCodeBtn');
        this.accessBtn = document.getElementById('accessBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.copyCodeBtn = document.getElementById('copyCodeBtn');
        this.copySharedBtn = document.getElementById('copySharedBtn');
        this.disconnectBtn = document.getElementById('disconnectBtn');
        
        // Status elements
        this.connectionStatus = document.getElementById('connectionStatus');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        
        // Error and loading
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        this.errorClose = document.getElementById('errorClose');
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    bindEvents() {
        // Button events
        this.generateCodeBtn.addEventListener('click', () => this.generateCode());
        this.accessBtn.addEventListener('click', () => this.accessClipboard());
        this.clearBtn.addEventListener('click', () => this.clearClipboard());
        this.copyCodeBtn.addEventListener('click', () => this.copyCode());
        this.copySharedBtn.addEventListener('click', () => this.copySharedText());
        this.disconnectBtn.addEventListener('click', () => this.disconnect());
        this.errorClose.addEventListener('click', () => this.hideError());

        // Text input events
        this.clipboardText.addEventListener('input', () => this.handleTextChange());
        this.accessCodeInput.addEventListener('input', (e) => this.formatCodeInput(e));
        this.accessCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.accessClipboard();
        });

        // Database connection events
        this.database.ref('.info/connected').on('value', (snapshot) => {
            if (snapshot.val() === true) {
                this.updateConnectionStatus('connected');
            } else {
                this.updateConnectionStatus('disconnected');
            }
        });
    }

    generateCode() {
        const characters = '0123456789';
        let code = '';
        
        for (let i = 0; i < 4; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        
        this.currentCode = code;
        this.currentCodeDisplay.textContent = code;
        
        // Initialize the clipboard data in Firebase
        this.initializeClipboardData(code);
        
        this.showSuccess(`Code ${code} generated successfully!`);
    }

    async initializeClipboardData(code) {
        try {
            const clipboardRef = this.database.ref(`clipboards/${code}`);
            await clipboardRef.set({
                content: this.clipboardText.value || '',
                lastUpdated: firebase.database.ServerValue.TIMESTAMP,
                active: true
            });
            
            // Listen for changes to this clipboard
            this.listenToClipboard(code, true);
        } catch (error) {
            this.showError('Failed to initialize clipboard: ' + error.message);
        }
    }





    formatCodeInput(e) {
        const input = e.target;
        let value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        if (value.length > 4) {
            value = value.slice(0, 4);
        }
        
        input.value = value;
        
        // Auto-access when 4 characters are entered
        if (value.length === 4) {
            setTimeout(() => this.accessClipboard(), 100);
        }
    }

    async accessClipboard() {
        const code = this.accessCodeInput.value.trim().toUpperCase();
        
        if (code.length !== 4) {
            this.showError('Please enter a valid 4-character code');
            return;
        }

        if (!/^[A-Z0-9]{4}$/.test(code)) {
            this.showError('Code must contain only uppercase letters and numbers');
            return;
        }

        this.showLoading();

        try {
            // Check if the clipboard exists
            const clipboardRef = this.database.ref(`clipboards/${code}`);
            const snapshot = await clipboardRef.once('value');
            
            if (!snapshot.exists()) {
                this.hideLoading();
                this.showError('Clipboard not found. Please check the code and try again.');
                return;
            }

            const data = snapshot.val();
            if (!data.active) {
                this.hideLoading();
                this.showError('This clipboard is no longer active.');
                return;
            }

            // Successfully accessed
            this.accessedCode = code;
            this.sharedCodeDisplay.textContent = code;
            this.sharedText.value = data.content || '';
            this.sharedClipboard.style.display = 'block';
            
            // Listen for real-time updates
            this.listenToClipboard(code, false);
            
            this.hideLoading();
            this.showSuccess(`Connected to clipboard ${code}`);
            
        } catch (error) {
            this.hideLoading();
            this.showError('Failed to access clipboard: ' + error.message);
        }
    }

    listenToClipboard(code, isOwner) {
        // Remove existing listener if any
        if (this.listeners.has(code)) {
            this.listeners.get(code).off();
        }

        const clipboardRef = this.database.ref(`clipboards/${code}`);
        
        const listener = clipboardRef.on('value', (snapshot) => {
            const data = snapshot.val() || {};
            const content = data.content || '';
            
            if (isOwner) {
                // For owner, update if content differs (avoid infinite loop)
                if (this.clipboardText.value !== content) {
                    this.clipboardText.value = content;
                }
            } else {
                // For accessors, always update the shared text
                this.sharedText.value = content;
            }
        });

        this.listeners.set(code, { ref: clipboardRef, off: () => clipboardRef.off('value', listener) });
    }

    async handleTextChange() {
        if (!this.currentCode) return;

        try {
            // Debounce the update to avoid too many writes
            clearTimeout(this.updateTimeout);
            this.updateTimeout = setTimeout(async () => {
                const clipboardRef = this.database.ref(`clipboards/${this.currentCode}`);
                await clipboardRef.update({
                    content: this.clipboardText.value,
                    lastUpdated: firebase.database.ServerValue.TIMESTAMP
                });
            }, 300);
        } catch (error) {
            this.showError('Failed to sync content: ' + error.message);
        }
    }

    async clearClipboard() {
        this.clipboardText.value = '';
        if (this.currentCode) {
            this.handleTextChange();
        }
    }

    async copyCode() {
        if (!this.currentCode) return;

        try {
            await navigator.clipboard.writeText(this.currentCode);
            this.showSuccess('Code copied to clipboard!');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = this.currentCode;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showSuccess('Code copied to clipboard!');
        }
    }

    async copySharedText() {
        try {
            await navigator.clipboard.writeText(this.sharedText.value);
            this.showSuccess('Content copied to clipboard!');
        } catch (error) {
            // Fallback for older browsers
            this.sharedText.select();
            document.execCommand('copy');
            this.showSuccess('Content copied to clipboard!');
        }
    }

    disconnect() {
        if (this.accessedCode) {
            // Remove listener
            if (this.listeners.has(this.accessedCode)) {
                this.listeners.get(this.accessedCode).off();
                this.listeners.delete(this.accessedCode);
            }

            this.accessedCode = null;
            this.accessCodeInput.value = '';
            this.sharedText.value = '';
            this.sharedClipboard.style.display = 'none';
            
            this.showSuccess('Disconnected from shared clipboard');
        }
    }

    async testConnection() {
        try {
            // Test database connection
            const testRef = this.database.ref('.info/serverTimeOffset');
            await testRef.once('value');
            this.updateConnectionStatus('connected');
        } catch (error) {
            this.updateConnectionStatus('disconnected');
            this.showError('Failed to connect to Firebase: ' + error.message);
        }
    }

    updateConnectionStatus(status) {
        this.statusIndicator.className = `status-indicator ${status}`;
        
        switch (status) {
            case 'connected':
                this.statusText.textContent = 'Connected';
                break;
            case 'disconnected':
                this.statusText.textContent = 'Disconnected';
                break;
            case 'connecting':
                this.statusText.textContent = 'Connecting...';
                break;
        }
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => this.hideError(), 5000);
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }

    showSuccess(message) {
        // Create a temporary success message (reusing error styling but different color)
        const successEl = document.createElement('div');
        successEl.className = 'error-message';
        successEl.style.background = 'rgba(34, 197, 94, 0.9)';
        successEl.innerHTML = `
            <div class="error-content">
                <i data-feather="check-circle"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(successEl);
        feather.replace();
        
        setTimeout(() => {
            successEl.remove();
        }, 3000);
    }

    showLoading() {
        this.loadingOverlay.style.display = 'flex';
    }

    hideLoading() {
        this.loadingOverlay.style.display = 'none';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ClipboardSharing();
});

// Handle page unload to clean up Firebase connections
window.addEventListener('beforeunload', () => {
    if (window.clipboardApp) {
        // Clean up listeners
        window.clipboardApp.listeners.forEach(listener => listener.off());
    }
});
(function () {
  
  const footer = document.createElement("div");
  footer.id = "clipshare-footer";
  footer.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    background: transparent;
    text-align: center;
    font-size: 12px;
    color: #ccc;
    padding: 8px 0;
    user-select: none;
    pointer-events: none;
    z-index: 9999;
    font-family: sans-serif;
  `;
  footer.innerHTML = "&copy; Developer : S!D";

  
  if (!document.getElementById("clipshare-footer")) {
    document.body.appendChild(footer);
  }

  
  const observer = new MutationObserver(() => {
    if (!document.getElementById("clipshare-footer")) {
      document.body.appendChild(footer.cloneNode(true));
    }
  });
  observer.observe(document.body, { childList: true });
})();
