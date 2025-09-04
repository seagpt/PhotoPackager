/**
 * PhotoPackager Web Edition - Keyboard Shortcuts System
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
 * KeyboardShortcuts.js
 * Handles keyboard shortcuts for improved accessibility and power user workflow
 * Provides intuitive shortcuts for common actions
 */

class KeyboardShortcuts {
    constructor() {
        this.shortcuts = new Map();
        this.isEnabled = true;
        
        // Define keyboard shortcuts
        this.shortcutDefinitions = {
            // File operations
            'ctrl+o': {
                action: 'selectFolder',
                description: 'Open/Select folder',
                element: '#selectFolderBtn',
                callback: () => this.selectFolder()
            },
            'ctrl+shift+o': {
                action: 'selectFolder',
                description: 'Open/Select folder (alternate)',
                element: '#selectFolderBtn',
                callback: () => this.selectFolder()
            },
            
            // Processing operations
            'ctrl+enter': {
                action: 'startProcessing',
                description: 'Start processing',
                element: '#startProcessingBtn',
                callback: () => this.startProcessing(),
                requiresFiles: true
            },
            'f5': {
                action: 'startProcessing',
                description: 'Start processing (F5)',
                element: '#startProcessingBtn',
                callback: () => this.startProcessing(),
                requiresFiles: true
            },
            
            // Cancel operations
            'escape': {
                action: 'cancelOrClose',
                description: 'Cancel processing or close dialogs',
                callback: () => this.cancelOrClose()
            },
            'ctrl+c': {
                action: 'cancelProcessing',
                description: 'Cancel processing',
                element: '#cancelProcessingBtn',
                callback: () => this.cancelProcessing(),
                requiresProcessing: true
            },
            
            // Download operations
            'ctrl+s': {
                action: 'downloadPackage',
                description: 'Save/Download package',
                element: '#downloadPackageBtn',
                callback: () => this.downloadPackage(),
                requiresComplete: true
            },
            'ctrl+d': {
                action: 'downloadPackage',
                description: 'Download package',
                element: '#downloadPackageBtn',
                callback: () => this.downloadPackage(),
                requiresComplete: true
            },
            
            // Navigation and UI
            'ctrl+r': {
                action: 'startOver',
                description: 'Restart/Start over',
                element: '#startOverBtn',
                callback: () => this.startOver(),
                requiresConfirmation: true
            },
            'f1': {
                action: 'showHelp',
                description: 'Show keyboard shortcuts help',
                callback: () => this.showShortcutHelp()
            },
            'ctrl+/': {
                action: 'showHelp',
                description: 'Show keyboard shortcuts help',
                callback: () => this.showShortcutHelp()
            },
            
            // Quality adjustments (when focused on range inputs)
            'arrowup': {
                action: 'increaseQuality',
                description: 'Increase quality (when on quality slider)',
                callback: (e) => this.adjustQuality(e, 1),
                contextual: true
            },
            'arrowdown': {
                action: 'decreaseQuality',
                description: 'Decrease quality (when on quality slider)',
                callback: (e) => this.adjustQuality(e, -1),
                contextual: true
            },
            'arrowleft': {
                action: 'decreaseQuality',
                description: 'Decrease quality (when on quality slider)',
                callback: (e) => this.adjustQuality(e, -1),
                contextual: true
            },
            'arrowright': {
                action: 'increaseQuality',
                description: 'Increase quality (when on quality slider)',
                callback: (e) => this.adjustQuality(e, 1),
                contextual: true
            },
            
            // Toggle checkboxes
            'space': {
                action: 'toggleCheckbox',
                description: 'Toggle checkbox (when focused)',
                callback: (e) => this.toggleCheckbox(e),
                contextual: true
            }
        };
        
        this.init();
    }

    /**
     * Initialize keyboard shortcut system
     */
    init() {
        this.bindKeyboardEvents();
        this.createShortcutIndicators();
        this.showInitialHint();
    }

    /**
     * Bind keyboard event listeners
     */
    bindKeyboardEvents() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Prevent default behavior for our shortcuts
        document.addEventListener('keydown', (e) => {
            const key = this.getKeyString(e);
            if (this.shortcuts.has(key) && this.shouldPreventDefault(key, e)) {
                e.preventDefault();
            }
        });
    }

    /**
     * Handle keydown events
     * @param {KeyboardEvent} event
     */
    handleKeyDown(event) {
        if (!this.isEnabled) return;
        
        const key = this.getKeyString(event);
        const shortcut = this.shortcutDefinitions[key];
        
        if (shortcut) {
            // Check if shortcut is available in current context
            if (this.isShortcutAvailable(shortcut, event)) {
                event.preventDefault();
                
                // Highlight the target element briefly
                if (shortcut.element) {
                    this.highlightElement(shortcut.element);
                }
                
                // Execute the callback
                try {
                    shortcut.callback(event);
                    
                    // Track shortcut usage
                    if (window.analytics) {
                        window.analytics.trackFeatureUsage('keyboard_shortcut', key);
                    }
                } catch (error) {
                    logger.error(`Error executing keyboard shortcut ${key}:`, error);
                }
            }
        }
    }

    /**
     * Handle keyup events
     * @param {KeyboardEvent} event
     */
    handleKeyUp(event) {
        // Currently not used, but available for future features
    }

    /**
     * Get normalized key string from keyboard event
     * @param {KeyboardEvent} event
     * @returns {string}
     */
    getKeyString(event) {
        const parts = [];
        
        if (event.ctrlKey || event.metaKey) parts.push('ctrl');
        if (event.shiftKey) parts.push('shift');
        if (event.altKey) parts.push('alt');
        
        const key = event.key.toLowerCase();
        parts.push(key);
        
        return parts.join('+');
    }

    /**
     * Check if shortcut is available in current context
     * @param {Object} shortcut
     * @param {KeyboardEvent} event
     * @returns {boolean}
     */
    isShortcutAvailable(shortcut, event) {
        // Check if we're in an input field (except for contextual shortcuts)
        if (!shortcut.contextual && this.isInInputField(event.target)) {
            return false;
        }
        
        // Check contextual requirements
        if (shortcut.contextual) {
            return this.isContextualShortcutValid(shortcut, event);
        }
        
        // Check if files are required
        if (shortcut.requiresFiles && !window.photoPackagerApp?.currentFiles?.length) {
            return false;
        }
        
        // Check if processing is required
        if (shortcut.requiresProcessing && !window.photoPackagerApp?.processing) {
            return false;
        }
        
        // Check if completion is required
        if (shortcut.requiresComplete && !window.photoPackagerApp?.finalPackage) {
            return false;
        }
        
        // Check if element exists and is visible
        if (shortcut.element) {
            const element = document.querySelector(shortcut.element);
            if (!element || element.style.display === 'none' || element.disabled) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Check if contextual shortcut is valid
     * @param {Object} shortcut
     * @param {KeyboardEvent} event
     * @returns {boolean}
     */
    isContextualShortcutValid(shortcut, event) {
        const target = event.target;
        
        if (shortcut.action.includes('Quality') && target.type === 'range') {
            return true;
        }
        
        if (shortcut.action === 'toggleCheckbox' && target.type === 'checkbox') {
            return true;
        }
        
        return false;
    }

    /**
     * Check if we're currently in an input field
     * @param {Element} target
     * @returns {boolean}
     */
    isInInputField(target) {
        const inputTypes = ['input', 'textarea', 'select'];
        return inputTypes.includes(target.tagName.toLowerCase()) ||
               target.contentEditable === 'true';
    }

    /**
     * Check if we should prevent default behavior
     * @param {string} key
     * @param {KeyboardEvent} event
     * @returns {boolean}
     */
    shouldPreventDefault(key, event) {
        // Always prevent default for our custom shortcuts
        const shortcut = this.shortcutDefinitions[key];
        return shortcut && this.isShortcutAvailable(shortcut, event);
    }

    /**
     * Highlight element briefly when shortcut is used
     * @param {string} selector
     */
    highlightElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.classList.add('keyboard-shortcut-highlight');
            setTimeout(() => {
                element.classList.remove('keyboard-shortcut-highlight');
            }, 300);
        }
    }

    // Shortcut action implementations

    /**
     * Select folder shortcut
     */
    selectFolder() {
        const button = document.getElementById('selectFolderBtn');
        if (button && !button.disabled) {
            button.click();
        }
    }

    /**
     * Start processing shortcut
     */
    startProcessing() {
        const button = document.getElementById('startProcessingBtn');
        if (button && !button.disabled && window.photoPackagerApp?.currentFiles?.length) {
            button.click();
        }
    }

    /**
     * Cancel processing or close dialogs
     */
    cancelOrClose() {
        // First try to close any open tooltips
        if (window.tooltipManager) {
            window.tooltipManager.hideTooltip();
        }
        
        // Try to cancel processing if running
        const cancelBtn = document.getElementById('cancelProcessingBtn');
        if (cancelBtn && !cancelBtn.disabled && window.photoPackagerApp?.processing) {
            cancelBtn.click();
            return;
        }
        
        // Close any modal dialogs (if they exist)
        const modals = document.querySelectorAll('.modal, .dialog');
        modals.forEach(modal => {
            if (modal.style.display !== 'none') {
                const closeBtn = modal.querySelector('.close, .cancel, [data-dismiss]');
                if (closeBtn) {
                    closeBtn.click();
                }
            }
        });
    }

    /**
     * Cancel processing shortcut
     */
    cancelProcessing() {
        const button = document.getElementById('cancelProcessingBtn');
        if (button && !button.disabled && window.photoPackagerApp?.processing) {
            button.click();
        }
    }

    /**
     * Download package shortcut
     */
    downloadPackage() {
        const button = document.getElementById('downloadPackageBtn');
        if (button && !button.disabled && window.photoPackagerApp?.finalPackage) {
            button.click();
        }
    }

    /**
     * Start over shortcut
     */
    startOver() {
        const button = document.getElementById('startOverBtn');
        if (button && !button.disabled) {
            if (confirm('Are you sure you want to start over? This will clear all current work.')) {
                button.click();
            }
        }
    }

    /**
     * Adjust quality on range inputs
     * @param {KeyboardEvent} event
     * @param {number} direction - 1 for increase, -1 for decrease
     */
    adjustQuality(event, direction) {
        const target = event.target;
        if (target.type === 'range') {
            const currentValue = parseInt(target.value);
            const min = parseInt(target.min);
            const max = parseInt(target.max);
            const step = parseInt(target.step) || 1;
            
            const newValue = Math.max(min, Math.min(max, currentValue + (direction * step)));
            
            if (newValue !== currentValue) {
                target.value = newValue;
                target.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    }

    /**
     * Toggle checkbox
     * @param {KeyboardEvent} event
     */
    toggleCheckbox(event) {
        const target = event.target;
        if (target.type === 'checkbox') {
            target.checked = !target.checked;
            target.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    /**
     * Show keyboard shortcuts help
     */
    showShortcutHelp() {
        const helpContent = this.generateHelpContent();
        this.showHelpDialog(helpContent);
    }

    /**
     * Generate help content for shortcuts
     * @returns {string}
     */
    generateHelpContent() {
        const categories = {
            'File Operations': ['ctrl+o', 'ctrl+shift+o'],
            'Processing': ['ctrl+enter', 'f5', 'escape', 'ctrl+c'],
            'Download': ['ctrl+s', 'ctrl+d'],
            'Navigation': ['ctrl+r', 'f1', 'ctrl+/'],
            'Controls': ['arrowup', 'arrowdown', 'space']
        };
        
        let content = '<div class="keyboard-shortcuts-help">';
        content += '<h3>Keyboard Shortcuts</h3>';
        
        Object.entries(categories).forEach(([category, keys]) => {
            content += `<div class="shortcut-category">`;
            content += `<h4>${category}</h4>`;
            content += '<ul>';
            
            keys.forEach(key => {
                const shortcut = this.shortcutDefinitions[key];
                if (shortcut) {
                    const keyDisplay = key.replace('ctrl', '⌃').replace('shift', '⇧').replace('alt', '⌥');
                    content += `<li><kbd>${keyDisplay}</kbd> - ${shortcut.description}</li>`;
                }
            });
            
            content += '</ul></div>';
        });
        
        content += '<p><em>Note: Some shortcuts are only available in certain contexts.</em></p>';
        content += '</div>';
        
        return content;
    }

    /**
     * Show help dialog
     * @param {string} content
     */
    showHelpDialog(content) {
        // Create help dialog
        const dialog = document.createElement('div');
        dialog.className = 'keyboard-help-dialog';
        dialog.innerHTML = `
            <div class="help-dialog-backdrop"></div>
            <div class="help-dialog-content">
                ${content}
                <button class="help-dialog-close btn btn-secondary">Close</button>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Add event listeners
        const closeBtn = dialog.querySelector('.help-dialog-close');
        const backdrop = dialog.querySelector('.help-dialog-backdrop');
        
        const closeDialog = () => {
            dialog.remove();
        };
        
        closeBtn.addEventListener('click', closeDialog);
        backdrop.addEventListener('click', closeDialog);
        
        // Close on escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeDialog();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    /**
     * Create visual indicators for shortcuts
     */
    createShortcutIndicators() {
        const indicatorMap = {
            '#selectFolderBtn': 'Ctrl+O',
            '#startProcessingBtn': 'Ctrl+Enter',
            '#cancelProcessingBtn': 'Esc',
            '#downloadPackageBtn': 'Ctrl+S',
            '#startOverBtn': 'Ctrl+R'
        };
        
        Object.entries(indicatorMap).forEach(([selector, shortcut]) => {
            const element = document.querySelector(selector);
            if (element) {
                element.setAttribute('data-shortcut', shortcut);
            }
        });
    }

    /**
     * Show initial hint about shortcuts
     */
    showInitialHint() {
        // Only show once per session
        if (sessionStorage.getItem('keyboard-shortcuts-hint-shown')) {
            return;
        }
        
        setTimeout(() => {
            if (window.tooltipManager) {
                const hintTooltip = {
                    title: 'Keyboard Shortcuts Available',
                    content: 'Press F1 or Ctrl+/ to view all available keyboard shortcuts for faster workflow.',
                    trigger: 'manual'
                };
                
                // Show hint for a few seconds
                const body = document.body;
                window.tooltipManager.addDynamicTooltip(body, hintTooltip);
                // Note: This would need adjustment to the tooltip system to show temporarily
            }
            
            sessionStorage.setItem('keyboard-shortcuts-hint-shown', 'true');
        }, 2000);
    }

    /**
     * Enable keyboard shortcuts
     */
    enable() {
        this.isEnabled = true;
    }

    /**
     * Disable keyboard shortcuts
     */
    disable() {
        this.isEnabled = false;
    }

    /**
     * Toggle keyboard shortcuts
     */
    toggle() {
        this.isEnabled = !this.isEnabled;
    }

    /**
     * Cleanup keyboard shortcuts
     */
    cleanup() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        this.shortcuts.clear();
    }
}

// Create and export singleton instance
export const keyboardShortcuts = new KeyboardShortcuts();

// Make available globally for app reference
window.keyboardShortcuts = keyboardShortcuts;

// Global cleanup on page unload
window.addEventListener('beforeunload', () => {
    keyboardShortcuts.cleanup();
});