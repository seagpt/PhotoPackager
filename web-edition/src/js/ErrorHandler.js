/**
 * PhotoPackager Web Edition - Error Handling System
 * 
 * Copyright (c) 2025 DropShock Digital LLC
 * Created by Steven Seagondollar
 * 
 * Licensed under the MIT License:
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 * This file is part of PhotoPackager Web Edition, an open-source photo processing tool.
 * 
 * ErrorHandler.js
 * Comprehensive error handling and user feedback system
 * Provides user-friendly error messages and recovery options
 */

import { config } from './Config.js';
import { domSanitizer } from './DOMSanitizer.js';
import { logger } from './Logger.js';

export class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.eventListeners = []; // Track event listeners for cleanup
        this.setupGlobalErrorHandling();
        this.initializeErrorUI();
    }

    /**
     * Add tracked event listener for cleanup
     */
    addTrackedEventListener(element, event, handler, options) {
        element.addEventListener(event, handler, options);
        this.eventListeners.push({ element, event, handler, options });
    }

    /**
     * Set up global error handling
     */
    setupGlobalErrorHandling() {
        // Handle unhandled JavaScript errors (ASAP-029)
        const errorHandler = (event) => {
            // Prevent default browser error reporting
            event.preventDefault();
            
            this.handleError('javascript_error', event.error || new Error(event.message), {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
            
            return false; // Prevent default browser error handling
        };
        this.addTrackedEventListener(window, 'error', errorHandler);

        // Handle unhandled promise rejections (ASAP-029)
        const rejectionHandler = (event) => {
            // Prevent browser console warnings
            event.preventDefault();
            
            const reason = event.reason;
            const errorInfo = {
                promise: event.promise,
                reason: reason,
                stack: reason?.stack || 'No stack trace available'
            };
            
            this.handleError('promise_rejection', reason instanceof Error ? reason : new Error(String(reason)), errorInfo);
        };
        this.addTrackedEventListener(window, 'unhandledrejection', rejectionHandler);

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
        const closeHandler = () => {
            this.hideError();
        };
        this.addTrackedEventListener(document.getElementById('error-close'), 'click', closeHandler);

        const overlayHandler = (e) => {
            if (e.target.id === 'error-overlay') {
                this.hideError();
            }
        };
        this.addTrackedEventListener(document.getElementById('error-overlay'), 'click', overlayHandler);
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
        logger.error('PhotoPackager Error:', errorInfo);
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
                    { text: 'Smart Reduction', action: () => this.smartFileReduction(), primary: true },
                    { text: 'Memory Tips', action: () => this.showMemoryTips() },
                    { text: 'Emergency Reset', action: () => this.emergencyRecovery() }
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
                    { text: 'Try Recovery', action: () => this.emergencyRecovery(), primary: true },
                    { text: 'Reload App', action: () => window.location.reload() },
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

            case 'insufficient_memory':
                title = 'Insufficient Memory';
                message = error.message || 'Not enough memory available to process the selected files safely.';
                actions = [
                    { text: 'Smart Reduction', action: () => this.smartFileReduction(), primary: true },
                    { text: 'Memory Tips', action: () => this.showMemoryTips() },
                    { text: 'Emergency Reset', action: () => this.emergencyRecovery() }
                ];
                break;

            case 'promise_rejection':
                title = 'Unhandled Promise Error';
                message = 'An asynchronous operation failed unexpectedly. This could be due to network issues or processing errors.';
                actions = [
                    { text: 'Retry Processing', action: () => this.retryProcessing(), primary: true },
                    { text: 'Emergency Recovery', action: () => this.emergencyRecovery() },
                    { text: 'Report Issue', action: () => this.reportIssue(errorInfo) }
                ];
                showDetails = true;
                break;

            default:
                title = 'Unexpected Error';
                message = 'An unexpected error occurred. Please try again.';
                actions = [
                    { text: 'Retry Processing', action: () => this.retryProcessing(), primary: true },
                    { text: 'Emergency Recovery', action: () => this.emergencyRecovery() },
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
        // Sanitize all user inputs (ASAP-021)
        const sanitizedTitle = domSanitizer.sanitizeText(title);
        const sanitizedMessage = domSanitizer.sanitizeErrorMessage(message);
        
        document.getElementById('error-title').textContent = sanitizedTitle;
        domSanitizer.setTextContent(document.getElementById('error-message'), sanitizedMessage);
        
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

        // Create warning toast safely (ASAP-021)
        const warning = document.createElement('div');
        warning.className = 'warning-toast';
        
        // Create title element safely
        const titleDiv = domSanitizer.createElement('div', {
            className: 'warning-title',
            text: title
        });
        
        // Create message element safely
        const messageDiv = domSanitizer.createElement('div', {
            className: 'warning-message', 
            text: message
        });
        
        // Create actions container safely
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'warning-actions';
        
        // Add action buttons safely
        actions.forEach(action => {
            const button = domSanitizer.createElement('button', {
                className: 'warning-btn',
                text: action.text,
                attributes: {
                    'data-action': domSanitizer.sanitizeText(action.text)
                }
            });
            actionsDiv.appendChild(button);
        });
        
        // Add dismiss button
        const dismissBtn = domSanitizer.createElement('button', {
            className: 'warning-btn',
            text: 'Dismiss',
            attributes: { 'data-action': 'dismiss' }
        });
        actionsDiv.appendChild(dismissBtn);
        
        // Assemble warning
        warning.appendChild(titleDiv);
        warning.appendChild(messageDiv);
        warning.appendChild(actionsDiv);

        document.body.appendChild(warning);

        // Bind action events
        const warningClickHandler = (e) => {
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
        };
        this.addTrackedEventListener(warning, 'click', warningClickHandler);

        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            if (document.body.contains(warning)) {
                warning.remove();
            }
        }, 10000);
    }

    /**
     * Comprehensive error recovery mechanisms (ASAP-040)
     */
    
    /**
     * Attempt to recover from processing errors with intelligent retry
     */
    retryProcessing() {
        if (window.photoPackagerApp) {
            // Clear any error states first
            this.hideError();
            
            // Reset loading states
            if (window.loadingStateManager) {
                window.loadingStateManager.clearAllStates();
            }
            
            // Retry with current settings
            config.log('🔄 Attempting to retry processing with recovery mechanisms');
            window.photoPackagerApp.startProcessing();
        }
    }

    /**
     * Skip problematic file during processing
     */
    skipCurrentFile() {
        config.log('⏭️ Skipping current file due to processing error');
        
        if (window.photoPackagerApp && window.photoPackagerApp.processor) {
            // Notify processor to skip current file
            window.photoPackagerApp.processor.skipCurrentFile = true;
        }
        
        this.hideError();
    }

    /**
     * Restart processing from the beginning with cleanup
     */
    restartProcessing() {
        config.log('🔄 Restarting processing with full recovery cleanup');
        
        if (window.photoPackagerApp) {
            // Perform comprehensive cleanup
            this.performRecoveryCleanup();
            
            // Reset to initial state
            window.photoPackagerApp.startOver();
        }
        
        this.hideError();
    }

    /**
     * Comprehensive recovery cleanup (ASAP-040)
     */
    performRecoveryCleanup() {
        config.log('🧹 Performing comprehensive recovery cleanup');
        
        try {
            // Clear all loading states
            if (window.loadingStateManager) {
                window.loadingStateManager.clearAllStates();
            }
            
            // Reset processing state in main app
            if (window.photoPackagerApp) {
                window.photoPackagerApp.processing = false;
                window.photoPackagerApp.startTime = null;
                window.photoPackagerApp.currentSessionId = null;
            }
            
            // Clear memory monitor warnings
            if (window.memoryMonitor) {
                window.memoryMonitor.clearWarnings();
            }
            
            // Force garbage collection if available
            if (window.gc) {
                window.gc();
            }
            
            // Clear progress persistence
            if (window.progressPersistence) {
                window.progressPersistence.clearSession();
            }
            
            config.log('✅ Recovery cleanup completed');
            
        } catch (cleanupError) {
            logger.error('Recovery cleanup failed:', cleanupError);
        }
    }

    /**
     * Reduce file count with smart selection
     */
    smartFileReduction() {
        config.log('🎯 Performing smart file reduction for memory recovery');
        
        if (window.photoPackagerApp && window.photoPackagerApp.currentFiles) {
            const currentFiles = window.photoPackagerApp.currentFiles;
            const targetCount = Math.min(25, Math.floor(currentFiles.length / 2));
            
            // Keep smaller files and remove larger ones
            const sortedFiles = currentFiles.sort((a, b) => a.size - b.size);
            const reducedFiles = sortedFiles.slice(0, targetCount);
            
            window.photoPackagerApp.currentFiles = reducedFiles;
            
            this.showWarning(
                'File Count Reduced',
                `Reduced from ${currentFiles.length} to ${reducedFiles.length} files to prevent memory issues. You can process the remaining files in a separate batch.`,
                [{
                    text: 'Continue Processing',
                    action: () => this.retryProcessing(),
                    primary: true
                }, {
                    text: 'Start Over',
                    action: () => this.restartProcessing()
                }]
            );
        }
    }

    /**
     * Emergency recovery - full application reset
     */
    emergencyRecovery() {
        config.log('🚨 Initiating emergency recovery procedure');
        
        try {
            // Stop all processing
            if (window.photoPackagerApp) {
                window.photoPackagerApp.processing = false;
            }
            
            // Full cleanup
            this.performRecoveryCleanup();
            
            // Reset UI to initial state
            const panels = ['dropZone', 'configPanel', 'progressPanel', 'completionPanel'];
            panels.forEach(id => {
                const panel = document.getElementById(id);
                if (panel) {
                    panel.style.display = id === 'dropZone' ? 'block' : 'none';
                }
            });
            
            // Clear file inputs
            const fileInputs = document.querySelectorAll('input[type="file"]');
            fileInputs.forEach(input => input.value = '');
            
            // Reset form to defaults
            if (window.photoPackagerApp) {
                window.photoPackagerApp.currentFiles = [];
                window.photoPackagerApp.processor = null;
                window.photoPackagerApp.packageBuilder = null;
            }
            
            this.showWarning(
                'Emergency Recovery Complete',
                'The application has been reset to a stable state. You can now start a new processing session.',
                [{
                    text: 'Start Fresh',
                    action: () => {
                        this.hideError();
                        window.location.hash = ''; // Clear any URL state
                    },
                    primary: true
                }]
            );
            
        } catch (emergencyError) {
            logger.error('Emergency recovery failed:', emergencyError);
            this.showCriticalError();
        }
    }

    /**
     * Show critical error with browser refresh option
     */
    showCriticalError() {
        this.showError(
            'Critical Error',
            'A critical error has occurred. Please refresh the page to continue.',
            [{
                text: 'Refresh Page',
                action: () => window.location.reload(),
                primary: true
            }, {
                text: 'Report Issue',
                action: () => this.reportIssue()
            }],
            { 
                type: 'critical',
                error: 'Critical system failure requiring page refresh'
            }
        );
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

    /**
     * Show memory optimization tips
     */
    showMemoryTips() {
        const tips = [
            '• Close unused browser tabs and windows',
            '• Process photos in smaller batches (25-50 files)',
            '• Use smaller file sizes when possible',
            '• Restart your browser if problems persist',
            '• Consider using Chrome for better memory management'
        ];

        this.showWarning(
            'Memory Optimization Tips',
            'To free up memory and improve performance:\n\n' + tips.join('\n'),
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

    /**
     * Cleanup method to remove all event listeners
     */
    cleanup() {
        // Remove all tracked event listeners
        this.eventListeners.forEach(({ element, event, handler, options }) => {
            try {
                element.removeEventListener(event, handler, options);
            } catch (e) {
                logger.warn('Failed to remove event listener:', e);
            }
        });
        this.eventListeners = [];
        
        // Clear error log
        this.clearErrorLog();
    }
}

// Global error handler instance
window.errorHandler = new ErrorHandler();