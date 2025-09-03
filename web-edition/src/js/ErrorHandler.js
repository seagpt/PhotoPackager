/**
 * ErrorHandler.js
 * Comprehensive error handling and user feedback system
 * Provides user-friendly error messages and recovery options
 */

export class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.setupGlobalErrorHandling();
        this.initializeErrorUI();
    }

    /**
     * Set up global error handling
     */
    setupGlobalErrorHandling() {
        // Handle unhandled JavaScript errors
        window.addEventListener('error', (event) => {
            this.handleError('javascript_error', event.error || new Error(event.message), {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError('promise_rejection', event.reason, {
                promise: event.promise
            });
        });

        // Handle memory errors
        this.setupMemoryMonitoring();
    }

    /**
     * Monitor memory usage and warn users
     */
    setupMemoryMonitoring() {
        if ('memory' in performance) {
            setInterval(() => {
                const memInfo = performance.memory;
                const usedPercent = (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100;
                
                if (usedPercent > 90) {
                    this.showWarning(
                        'High Memory Usage',
                        'Your browser is using a lot of memory. Consider processing fewer files at once.',
                        [{
                            text: 'Reduce File Count',
                            action: () => this.suggestFileReduction()
                        }]
                    );
                }
            }, 10000); // Check every 10 seconds
        }
    }

    /**
     * Initialize error UI components
     */
    initializeErrorUI() {
        const errorContainer = document.createElement('div');
        errorContainer.id = 'error-container';
        errorContainer.innerHTML = `
            <div id="error-overlay" class="error-overlay" style="display: none;">
                <div class="error-modal">
                    <div class="error-header">
                        <span class="error-icon">⚠️</span>
                        <h3 id="error-title">Error</h3>
                        <button id="error-close" class="error-close">&times;</button>
                    </div>
                    <div class="error-body">
                        <div id="error-message">An error occurred</div>
                        <details id="error-details" style="display: none;">
                            <summary>Technical Details</summary>
                            <pre id="error-stack"></pre>
                        </details>
                    </div>
                    <div class="error-actions" id="error-actions"></div>
                </div>
            </div>
        `;
        document.body.appendChild(errorContainer);
        this.addErrorStyles();
        this.bindErrorEvents();
    }

    /**
     * Add error modal styles
     */
    addErrorStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            .error-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease;
            }

            .error-modal {
                background: linear-gradient(135deg, #2a2a2a, #1f1f1f);
                border: 2px solid #ff4444;
                border-radius: 15px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(255, 68, 68, 0.3);
            }

            .error-header {
                padding: 1.5rem;
                border-bottom: 1px solid rgba(255, 68, 68, 0.2);
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .error-icon {
                font-size: 2rem;
                filter: drop-shadow(0 0 8px #ff4444);
            }

            .error-header h3 {
                color: #ff4444;
                margin: 0;
                flex: 1;
            }

            .error-close {
                background: none;
                border: none;
                color: #cccccc;
                font-size: 2rem;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .error-close:hover {
                color: #ffffff;
                background: rgba(255, 68, 68, 0.2);
                border-radius: 50%;
            }

            .error-body {
                padding: 1.5rem;
                color: #cccccc;
            }

            .error-message {
                font-size: 1.1rem;
                line-height: 1.6;
                margin-bottom: 1rem;
            }

            .error-details summary {
                cursor: pointer;
                color: #00aeff;
                margin-top: 1rem;
            }

            .error-details pre {
                background: #0a0a0a;
                padding: 1rem;
                border-radius: 8px;
                margin-top: 0.5rem;
                font-size: 0.9rem;
                overflow-x: auto;
                color: #ff8888;
            }

            .error-actions {
                padding: 1.5rem;
                border-top: 1px solid rgba(255, 68, 68, 0.2);
                display: flex;
                gap: 1rem;
                justify-content: flex-end;
                flex-wrap: wrap;
            }

            .error-btn {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1rem;
                transition: all 0.3s ease;
            }

            .error-btn-primary {
                background: #00aeff;
                color: white;
            }

            .error-btn-primary:hover {
                background: #0088cc;
                transform: translateY(-2px);
            }

            .error-btn-secondary {
                background: #666666;
                color: white;
            }

            .error-btn-secondary:hover {
                background: #777777;
            }

            .warning-toast {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #ff8800, #ff6600);
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 10px;
                box-shadow: 0 8px 20px rgba(255, 136, 0, 0.4);
                z-index: 9999;
                max-width: 400px;
                animation: slideIn 0.5s ease;
            }

            .warning-toast .warning-title {
                font-weight: bold;
                margin-bottom: 0.5rem;
            }

            .warning-toast .warning-actions {
                margin-top: 1rem;
                display: flex;
                gap: 0.5rem;
            }

            .warning-btn {
                padding: 0.5rem 1rem;
                background: rgba(255, 255, 255, 0.2);
                border: none;
                border-radius: 5px;
                color: white;
                cursor: pointer;
                font-size: 0.9rem;
            }

            .warning-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            @media (max-width: 768px) {
                .error-modal {
                    width: 95%;
                    margin: 1rem;
                }

                .error-actions {
                    flex-direction: column;
                }

                .warning-toast {
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    /**
     * Bind error modal events
     */
    bindErrorEvents() {
        document.getElementById('error-close').addEventListener('click', () => {
            this.hideError();
        });

        document.getElementById('error-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'error-overlay') {
                this.hideError();
            }
        });
    }

    /**
     * Handle different types of errors
     */
    handleError(type, error, context = {}) {
        const errorInfo = {
            type,
            error,
            context,
            timestamp: new Date(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        this.logError(errorInfo);
        this.showUserFriendlyError(errorInfo);

        // Track error in analytics
        if (window.analytics) {
            window.analytics.trackError(type, error.message || error.toString());
        }
    }

    /**
     * Log error to internal log
     */
    logError(errorInfo) {
        this.errorLog.unshift(errorInfo);
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.pop();
        }

        // Also log to console in development
        console.error('PhotoPackager Error:', errorInfo);
    }

    /**
     * Show user-friendly error message
     */
    showUserFriendlyError(errorInfo) {
        const { type, error } = errorInfo;
        let title, message, actions, showDetails = false;

        switch (type) {
            case 'file_processing_error':
                title = 'Photo Processing Error';
                message = this.getFileProcessingErrorMessage(error);
                actions = [
                    { text: 'Try Again', action: () => this.retryProcessing(), primary: true },
                    { text: 'Skip File', action: () => this.skipCurrentFile() },
                    { text: 'Start Over', action: () => this.restartProcessing() }
                ];
                break;

            case 'memory_error':
                title = 'Memory Limit Reached';
                message = 'Your browser has run out of memory. Try processing fewer files at once.';
                actions = [
                    { text: 'Reduce Files', action: () => this.suggestFileReduction(), primary: true },
                    { text: 'Continue Anyway', action: () => this.hideError() }
                ];
                break;

            case 'file_too_large':
                title = 'File Too Large';
                message = `The file "${error.fileName}" is too large to process efficiently. Consider reducing the file size or excluding it from processing.`;
                actions = [
                    { text: 'Skip This File', action: () => this.skipLargeFile(), primary: true },
                    { text: 'Try Anyway', action: () => this.processLargeFile() }
                ];
                break;

            case 'unsupported_file':
                title = 'Unsupported File Format';
                message = `The file "${error.fileName}" is not a supported image format. PhotoPackager supports JPG, PNG, WebP, RAW, and other common image formats.`;
                actions = [
                    { text: 'Skip File', action: () => this.skipUnsupportedFile(), primary: true },
                    { text: 'View Supported Formats', action: () => this.showSupportedFormats() }
                ];
                break;

            case 'javascript_error':
                title = 'Application Error';
                message = 'An unexpected error occurred in the application. This might be due to a browser compatibility issue.';
                actions = [
                    { text: 'Reload App', action: () => window.location.reload(), primary: true },
                    { text: 'Report Issue', action: () => this.reportIssue(errorInfo) }
                ];
                showDetails = true;
                break;

            case 'network_error':
                title = 'Connection Error';
                message = 'Unable to connect to required services. Check your internet connection.';
                actions = [
                    { text: 'Retry', action: () => this.retryConnection(), primary: true },
                    { text: 'Work Offline', action: () => this.enableOfflineMode() }
                ];
                break;

            default:
                title = 'Unexpected Error';
                message = 'An unexpected error occurred. Please try again.';
                actions = [
                    { text: 'Try Again', action: () => this.hideError(), primary: true },
                    { text: 'Report Issue', action: () => this.reportIssue(errorInfo) }
                ];
                showDetails = true;
        }

        this.showError(title, message, actions, showDetails ? errorInfo : null);
    }

    /**
     * Get specific error message for file processing errors
     */
    getFileProcessingErrorMessage(error) {
        if (error.message.includes('canvas')) {
            return 'Unable to process the image due to canvas limitations. The image might be corrupted or too large.';
        } else if (error.message.includes('memory')) {
            return 'Not enough memory to process this image. Try closing other browser tabs or processing fewer files.';
        } else if (error.message.includes('decode')) {
            return 'Unable to decode the image file. The file might be corrupted or in an unsupported format.';
        } else {
            return 'An error occurred while processing the image. Please try again or skip this file.';
        }
    }

    /**
     * Show error modal
     */
    showError(title, message, actions = [], errorInfo = null) {
        document.getElementById('error-title').textContent = title;
        document.getElementById('error-message').innerHTML = message;
        
        // Show technical details if provided
        if (errorInfo) {
            document.getElementById('error-details').style.display = 'block';
            document.getElementById('error-stack').textContent = 
                errorInfo.error.stack || errorInfo.error.toString();
        } else {
            document.getElementById('error-details').style.display = 'none';
        }

        // Add action buttons
        const actionsContainer = document.getElementById('error-actions');
        actionsContainer.innerHTML = '';
        actions.forEach(action => {
            const button = document.createElement('button');
            button.className = `error-btn ${action.primary ? 'error-btn-primary' : 'error-btn-secondary'}`;
            button.textContent = action.text;
            button.onclick = () => {
                this.hideError();
                if (action.action) action.action();
            };
            actionsContainer.appendChild(button);
        });

        document.getElementById('error-overlay').style.display = 'flex';
    }

    /**
     * Hide error modal
     */
    hideError() {
        document.getElementById('error-overlay').style.display = 'none';
    }

    /**
     * Show warning toast
     */
    showWarning(title, message, actions = []) {
        // Remove existing warnings
        const existingWarnings = document.querySelectorAll('.warning-toast');
        existingWarnings.forEach(w => w.remove());

        const warning = document.createElement('div');
        warning.className = 'warning-toast';
        warning.innerHTML = `
            <div class="warning-title">${title}</div>
            <div class="warning-message">${message}</div>
            <div class="warning-actions">
                ${actions.map(action => `
                    <button class="warning-btn" data-action="${action.text}">
                        ${action.text}
                    </button>
                `).join('')}
                <button class="warning-btn" data-action="dismiss">Dismiss</button>
            </div>
        `;

        document.body.appendChild(warning);

        // Bind action events
        warning.addEventListener('click', (e) => {
            if (e.target.classList.contains('warning-btn')) {
                const actionText = e.target.dataset.action;
                const action = actions.find(a => a.text === actionText);
                
                if (actionText === 'dismiss') {
                    warning.remove();
                } else if (action && action.action) {
                    action.action();
                    warning.remove();
                }
            }
        });

        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            if (document.body.contains(warning)) {
                warning.remove();
            }
        }, 10000);
    }

    /**
     * Recovery action methods
     */
    retryProcessing() {
        if (window.photoPackagerApp) {
            window.photoPackagerApp.startProcessing();
        }
    }

    skipCurrentFile() {
        // Implementation would depend on processing architecture
        console.log('Skipping current file...');
    }

    restartProcessing() {
        if (window.photoPackagerApp) {
            window.photoPackagerApp.startOver();
        }
    }

    suggestFileReduction() {
        this.showWarning(
            'Reduce File Count',
            'To prevent memory issues, try processing 50 files or fewer at once.',
            [{
                text: 'Got It',
                action: () => {}
            }]
        );
    }

    reportIssue(errorInfo) {
        const subject = encodeURIComponent(`PhotoPackager Error Report: ${errorInfo.type}`);
        const body = encodeURIComponent(`
Error Type: ${errorInfo.type}
Time: ${errorInfo.timestamp}
Error Message: ${errorInfo.error.message || errorInfo.error}
Stack: ${errorInfo.error.stack || 'N/A'}
User Agent: ${errorInfo.userAgent}
URL: ${errorInfo.url}
Context: ${JSON.stringify(errorInfo.context, null, 2)}
        `);
        
        const mailtoLink = `mailto:steven.seagondollar@dropshockdigital.com?subject=${subject}&body=${body}`;
        window.open(mailtoLink);
    }

    /**
     * Get error statistics
     */
    getErrorStats() {
        const stats = {};
        this.errorLog.forEach(error => {
            stats[error.type] = (stats[error.type] || 0) + 1;
        });
        return stats;
    }

    /**
     * Clear error log
     */
    clearErrorLog() {
        this.errorLog = [];
    }
}

// Global error handler instance
window.errorHandler = new ErrorHandler();