/**
 * PhotoPackager Web Edition - Loading State Manager
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
 * LoadingStateManager.js
 * Manages loading states for all async operations in PhotoPackager
 * Provides consistent loading UX across the application
 */

class LoadingStateManager {
    constructor() {
        this.activeStates = new Set();
        this.overlayElement = null;
        
        // Initialize overlay element
        this.createOverlayElement();
    }

    /**
     * Create the global loading overlay element
     */
    createOverlayElement() {
        this.overlayElement = document.createElement('div');
        this.overlayElement.className = 'loading-overlay';
        this.overlayElement.style.display = 'none';
        this.overlayElement.innerHTML = `
            <div class="spinner"></div>
            <div class="loading-text"></div>
        `;
        document.body.appendChild(this.overlayElement);
    }

    /**
     * Set loading state for a button
     * @param {string|HTMLElement} buttonSelector - Button selector or element
     * @param {boolean} loading - Whether to show loading state
     * @param {string} loadingText - Optional text to show while loading
     */
    setButtonLoading(buttonSelector, loading, loadingText = null) {
        const button = typeof buttonSelector === 'string' 
            ? document.querySelector(buttonSelector)
            : buttonSelector;
            
        if (!button) return;

        const stateKey = `button-${button.id || buttonSelector}`;

        if (loading) {
            // Store original text
            if (!button.dataset.originalText) {
                button.dataset.originalText = button.textContent;
            }
            
            // Apply loading state
            button.classList.add('btn-loading');
            button.disabled = true;
            
            if (loadingText) {
                button.textContent = loadingText;
            }
            
            this.activeStates.add(stateKey);
        } else {
            // Remove loading state
            button.classList.remove('btn-loading');
            button.disabled = false;
            
            // Restore original text
            if (button.dataset.originalText) {
                button.textContent = button.dataset.originalText;
                delete button.dataset.originalText;
            }
            
            this.activeStates.delete(stateKey);
        }
    }

    /**
     * Set loading state for the drop zone
     * @param {boolean} loading - Whether to show loading state
     * @param {string} loadingText - Text to show while loading
     */
    setDropZoneLoading(loading, loadingText = 'Processing files...') {
        const dropZone = document.getElementById('dropZone');
        if (!dropZone) return;

        const stateKey = 'dropzone';

        if (loading) {
            dropZone.classList.add('drop-zone-loading');
            // Update the loading text via CSS content
            const style = document.createElement('style');
            style.textContent = `.drop-zone-loading::after { content: "${loadingText}"; }`;
            style.id = 'dropzone-loading-style';
            document.head.appendChild(style);
            
            this.activeStates.add(stateKey);
        } else {
            dropZone.classList.remove('drop-zone-loading');
            
            // Remove the custom style
            const style = document.getElementById('dropzone-loading-style');
            if (style) {
                style.remove();
            }
            
            this.activeStates.delete(stateKey);
        }
    }

    /**
     * Set loading state for form inputs
     * @param {string|HTMLElement} containerSelector - Form container selector
     * @param {boolean} loading - Whether to show loading state
     */
    setFormLoading(containerSelector, loading) {
        const container = typeof containerSelector === 'string' 
            ? document.querySelector(containerSelector)
            : containerSelector;
            
        if (!container) return;

        const stateKey = `form-${container.id || containerSelector}`;

        if (loading) {
            container.classList.add('form-group-loading');
            
            // Disable all inputs within the container
            const inputs = container.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.disabled = true;
            });
            
            this.activeStates.add(stateKey);
        } else {
            container.classList.remove('form-group-loading');
            
            // Re-enable all inputs
            const inputs = container.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.disabled = false;
            });
            
            this.activeStates.delete(stateKey);
        }
    }

    /**
     * Set loading state for dialogs
     * @param {string|HTMLElement} dialogSelector - Dialog selector or element
     * @param {boolean} loading - Whether to show loading state
     */
    setDialogLoading(dialogSelector, loading) {
        const dialog = typeof dialogSelector === 'string' 
            ? document.querySelector(dialogSelector)
            : dialogSelector;
            
        if (!dialog) return;

        const stateKey = `dialog-${dialog.id || dialogSelector}`;

        if (loading) {
            dialog.classList.add('dialog-loading');
            this.activeStates.add(stateKey);
        } else {
            dialog.classList.remove('dialog-loading');
            this.activeStates.delete(stateKey);
        }
    }

    /**
     * Show global loading overlay
     * @param {string} message - Loading message to display
     */
    showGlobalLoading(message = 'Loading...') {
        if (!this.overlayElement) return;

        const textElement = this.overlayElement.querySelector('.loading-text');
        if (textElement) {
            textElement.textContent = message;
        }

        this.overlayElement.style.display = 'flex';
        this.activeStates.add('global-overlay');
    }

    /**
     * Hide global loading overlay
     */
    hideGlobalLoading() {
        if (!this.overlayElement) return;

        this.overlayElement.style.display = 'none';
        this.activeStates.delete('global-overlay');
    }

    /**
     * Set loading state for resume dialog specifically
     * @param {boolean} loading - Whether to show loading state
     */
    setResumeDialogLoading(loading) {
        const dialog = document.querySelector('.resume-dialog');
        if (!dialog) return;

        const stateKey = 'resume-dialog';

        if (loading) {
            dialog.classList.add('resume-dialog-loading');
            this.activeStates.add(stateKey);
        } else {
            dialog.classList.remove('resume-dialog-loading');
            this.activeStates.delete(stateKey);
        }
    }

    /**
     * Clear all loading states
     */
    clearAllStates() {
        // Remove all active loading classes
        this.activeStates.forEach(stateKey => {
            if (stateKey.startsWith('button-')) {
                const buttonId = stateKey.replace('button-', '');
                const button = document.getElementById(buttonId) || 
                               document.querySelector(buttonId);
                if (button) {
                    this.setButtonLoading(button, false);
                }
            } else if (stateKey === 'dropzone') {
                this.setDropZoneLoading(false);
            } else if (stateKey.startsWith('form-')) {
                const formId = stateKey.replace('form-', '');
                const form = document.getElementById(formId) ||
                            document.querySelector(formId);
                if (form) {
                    this.setFormLoading(form, false);
                }
            } else if (stateKey.startsWith('dialog-')) {
                const dialogId = stateKey.replace('dialog-', '');
                const dialog = document.getElementById(dialogId) ||
                              document.querySelector(dialogId);
                if (dialog) {
                    this.setDialogLoading(dialog, false);
                }
            } else if (stateKey === 'resume-dialog') {
                this.setResumeDialogLoading(false);
            } else if (stateKey === 'global-overlay') {
                this.hideGlobalLoading();
            }
        });

        this.activeStates.clear();
    }

    /**
     * Check if any loading states are active
     * @returns {boolean} True if any loading states are active
     */
    hasActiveStates() {
        return this.activeStates.size > 0;
    }

    /**
     * Get list of active loading states
     * @returns {Array<string>} Array of active state keys
     */
    getActiveStates() {
        return Array.from(this.activeStates);
    }

    /**
     * Cleanup - remove overlay element
     */
    cleanup() {
        if (this.overlayElement) {
            this.overlayElement.remove();
            this.overlayElement = null;
        }
        this.activeStates.clear();
    }
}

// Create and export singleton instance
export const loadingStateManager = new LoadingStateManager();

// Global cleanup on page unload
window.addEventListener('beforeunload', () => {
    loadingStateManager.cleanup();
});