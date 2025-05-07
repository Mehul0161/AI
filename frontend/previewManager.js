class PreviewManager {
    constructor() {
        this.previewUrl = null;
        this.isLoading = false;
        this.retryCount = 0;
        this.maxRetries = 10;
        this.retryInterval = 5000; // 5 seconds
    }

    setPreviewUrl(url) {
        console.log('[PreviewManager] Setting preview URL:', url);
        this.previewUrl = url;
        this.startPreviewCheck();
    }

    startPreviewCheck() {
        if (!this.previewUrl) {
            console.error('[PreviewManager] No preview URL set');
            return;
        }

        this.isLoading = true;
        this.retryCount = 0;
        this.checkPreviewAvailability();
    }

    async checkPreviewAvailability() {
        if (this.retryCount >= this.maxRetries) {
            console.log('[PreviewManager] Max retries reached, showing error');
            this.handlePreviewError('Preview server taking too long to start. Please try refreshing in a few moments.');
            return;
        }

        try {
            console.log(`[PreviewManager] Checking preview availability (attempt ${this.retryCount + 1}/${this.maxRetries})`);
            const response = await fetch(this.previewUrl);
            
            if (response.ok) {
                console.log('[PreviewManager] Preview server is ready');
                this.handlePreviewReady();
            } else {
                throw new Error(`Server returned ${response.status}`);
            }
        } catch (error) {
            console.log(`[PreviewManager] Preview not ready yet: ${error.message}`);
            this.retryCount++;
            setTimeout(() => this.checkPreviewAvailability(), this.retryInterval);
        }
    }

    handlePreviewReady() {
        this.isLoading = false;
        const previewFrame = document.getElementById('previewFrame');
        const previewLoading = document.getElementById('previewLoading');
        const previewError = document.getElementById('previewError');

        if (previewFrame) {
            previewFrame.src = this.previewUrl;
            previewFrame.style.display = 'block';
        }
        if (previewLoading) {
            previewLoading.style.display = 'none';
        }
        if (previewError) {
            previewError.style.display = 'none';
        }
    }

    handlePreviewError(message) {
        this.isLoading = false;
        const previewFrame = document.getElementById('previewFrame');
        const previewLoading = document.getElementById('previewLoading');
        const previewError = document.getElementById('previewError');

        if (previewFrame) {
            previewFrame.style.display = 'none';
        }
        if (previewLoading) {
            previewLoading.style.display = 'none';
        }
        if (previewError) {
            previewError.textContent = message;
            previewError.style.display = 'block';
        }
    }
}

// Create a singleton instance
const previewManager = new PreviewManager();
export default previewManager; 