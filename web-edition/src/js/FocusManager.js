/**
 * PhotoPackager Web Edition - Focus Management System
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
 * FocusManager.js
 * Manages focus states and keyboard navigation for accessibility
 * Implements focus trapping, logical tab order, and visual focus indicators
 */

class FocusManager {
    constructor() {
        this.focusableElements = [];
        this.currentFocusIndex = -1;
        this.focusTraps = new Map();
        this.lastFocusedElement = null;
        this.focusVisible = true;
        
        // Selectors for focusable elements
        this.focusableSelectors = [
            'button:not([disabled]):not([tabindex="-1"])',
            'input:not([disabled]):not([tabindex="-1"])',
            'select:not([disabled]):not([tabindex="-1"])',
            'textarea:not([disabled]):not([tabindex="-1"])',
            'a[href]:not([tabindex="-1"])',
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable="true"]:not([tabindex="-1"])'
        ];
        
        this.init();
    }

    /**
     * Initialize focus management system
     */
    init() {
        this.setupFocusVisibility();
        this.setupGlobalFocusHandlers();
        this.setupKeyboardNavigation();
        this.updateFocusableElements();
        this.addFocusIndicators();
    }

    /**
     * Setup focus visibility detection (mouse vs keyboard)
     */
    setupFocusVisibility() {
        // Track if user is using keyboard for navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ' || e.key.startsWith('Arrow')) {
                this.focusVisible = true;
                document.body.classList.add('focus-visible');
            }
        });

        // Hide focus indicators when using mouse
        document.addEventListener('mousedown', () => {
            this.focusVisible = false;
            document.body.classList.remove('focus-visible');
        });

        // Re-enable focus visibility when using keyboard
        document.addEventListener('focusin', (e) => {
            if (this.focusVisible) {
                e.target.classList.add('keyboard-focused');
            } else {
                e.target.classList.remove('keyboard-focused');
            }
        });

        document.addEventListener('focusout', (e) => {
            e.target.classList.remove('keyboard-focused');
        });
    }

    /**
     * Setup global focus event handlers
     */
    setupGlobalFocusHandlers() {
        // Track focus changes
        document.addEventListener('focusin', (e) => {
            this.lastFocusedElement = e.target;
            this.updateCurrentFocusIndex(e.target);
        });

        // Handle focus lost
        document.addEventListener('focusout', (e) => {
            // Small delay to see if focus moved to another element
            setTimeout(() => {
                if (!document.activeElement || document.activeElement === document.body) {
                    this.handleFocusLost();
                }
            }, 10);
        });

        // Handle visibility change (browser tab switching)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.lastFocusedElement) {
                // Restore focus when returning to tab
                setTimeout(() => {
                    if (!document.activeElement || document.activeElement === document.body) {
                        this.restoreFocus();
                    }
                }, 100);
            }
        });
    }

    /**
     * Setup keyboard navigation handlers
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Handle Escape key to exit focus traps or close modals
            if (e.key === 'Escape') {
                this.handleEscapeKey(e);
            }
            
            // Handle Tab navigation in focus traps
            if (e.key === 'Tab') {
                this.handleTabNavigation(e);
            }
            
            // Handle arrow key navigation for related controls
            if (e.key.startsWith('Arrow')) {
                this.handleArrowNavigation(e);
            }
            
            // Handle Enter/Space for activation
            if (e.key === 'Enter' || e.key === ' ') {
                this.handleActivation(e);
            }
        });
    }

    /**
     * Update list of focusable elements
     */
    updateFocusableElements() {
        const selector = this.focusableSelectors.join(', ');
        this.focusableElements = Array.from(document.querySelectorAll(selector))
            .filter(el => this.isElementVisible(el) && !this.isElementInTrap(el));
        
        // Sort by tab order (considering tabindex)
        this.focusableElements.sort((a, b) => {
            const aIndex = parseInt(a.getAttribute('tabindex')) || 0;
            const bIndex = parseInt(b.getAttribute('tabindex')) || 0;
            
            if (aIndex !== bIndex) {
                return aIndex - bIndex;
            }
            
            // If same tabindex, maintain DOM order
            return Array.from(document.querySelectorAll('*')).indexOf(a) - 
                   Array.from(document.querySelectorAll('*')).indexOf(b);
        });
    }

    /**
     * Check if element is visible and focusable
     * @param {Element} element
     * @returns {boolean}
     */
    isElementVisible(element) {
        if (!element.offsetParent && element !== document.body) return false;
        
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0';
    }

    /**
     * Check if element is within a focus trap
     * @param {Element} element
     * @returns {boolean}
     */
    isElementInTrap(element) {
        for (const [trapContainer] of this.focusTraps) {
            if (trapContainer.contains(element)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Create a focus trap within a container
     * @param {Element} container - Container element to trap focus within
     * @param {Object} options - Configuration options
     */
    createFocusTrap(container, options = {}) {
        const {
            initialFocus = null,
            returnFocus = true,
            allowEscape = true
        } = options;

        // Find focusable elements within the container
        const focusableElements = Array.from(
            container.querySelectorAll(this.focusableSelectors.join(', '))
        ).filter(el => this.isElementVisible(el));

        if (focusableElements.length === 0) {
            logger.warn('Focus trap created with no focusable elements');
            return null;
        }

        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        // Store trap data
        const trapData = {
            container,
            focusableElements,
            firstFocusable,
            lastFocusable,
            previousFocus: document.activeElement,
            returnFocus,
            allowEscape
        };

        this.focusTraps.set(container, trapData);

        // Add focus trap styling
        container.classList.add('focus-trap');

        // Set initial focus
        const focusTarget = initialFocus || firstFocusable;
        if (focusTarget) {
            setTimeout(() => focusTarget.focus(), 10);
        }

        // Add event listeners for trap behavior
        const trapKeyHandler = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    // Shift+Tab: moving backwards
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    // Tab: moving forwards
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
            
            if (e.key === 'Escape' && allowEscape) {
                this.removeFocusTrap(container);
            }
        };

        container.addEventListener('keydown', trapKeyHandler);
        trapData.keyHandler = trapKeyHandler;

        return trapData;
    }

    /**
     * Remove a focus trap
     * @param {Element} container - Container element with focus trap
     */
    removeFocusTrap(container) {
        const trapData = this.focusTraps.get(container);
        if (!trapData) return;

        // Remove event listener
        if (trapData.keyHandler) {
            container.removeEventListener('keydown', trapData.keyHandler);
        }

        // Remove styling
        container.classList.remove('focus-trap');

        // Return focus if requested
        if (trapData.returnFocus && trapData.previousFocus) {
            trapData.previousFocus.focus();
        }

        // Remove from traps map
        this.focusTraps.delete(container);

        // Update focusable elements
        this.updateFocusableElements();
    }

    /**
     * Handle escape key press
     * @param {KeyboardEvent} e
     */
    handleEscapeKey(e) {
        // Check if we're in a focus trap
        const activeTraps = Array.from(this.focusTraps.entries())
            .filter(([container, data]) => container.contains(document.activeElement));
        
        if (activeTraps.length > 0) {
            const [container, data] = activeTraps[activeTraps.length - 1]; // Get innermost trap
            if (data.allowEscape) {
                this.removeFocusTrap(container);
                e.preventDefault();
                e.stopPropagation();
            }
        }
    }

    /**
     * Handle tab navigation
     * @param {KeyboardEvent} e
     */
    handleTabNavigation(e) {
        // Tab navigation is handled by focus traps if active
        // This method can be extended for custom tab behavior
        this.updateCurrentFocusIndex(document.activeElement);
    }

    /**
     * Handle arrow key navigation for related controls
     * @param {KeyboardEvent} e
     */
    handleArrowNavigation(e) {
        const target = e.target;
        
        // Handle range input arrow keys (already handled by browser)
        if (target.type === 'range') {
            return;
        }
        
        // Handle radio button group navigation
        if (target.type === 'radio') {
            this.handleRadioGroupNavigation(e);
            return;
        }
        
        // Handle custom group navigation (elements with same name or data-group)
        const groupName = target.getAttribute('data-group') || target.name;
        if (groupName) {
            this.handleGroupNavigation(e, groupName);
        }
    }

    /**
     * Handle radio button group navigation
     * @param {KeyboardEvent} e
     */
    handleRadioGroupNavigation(e) {
        const currentRadio = e.target;
        const radioGroup = Array.from(
            document.querySelectorAll(`input[type="radio"][name="${currentRadio.name}"]`)
        ).filter(radio => this.isElementVisible(radio));

        if (radioGroup.length <= 1) return;

        const currentIndex = radioGroup.indexOf(currentRadio);
        let nextIndex;

        switch (e.key) {
            case 'ArrowDown':
            case 'ArrowRight':
                nextIndex = (currentIndex + 1) % radioGroup.length;
                break;
            case 'ArrowUp':
            case 'ArrowLeft':
                nextIndex = (currentIndex - 1 + radioGroup.length) % radioGroup.length;
                break;
            default:
                return;
        }

        e.preventDefault();
        radioGroup[nextIndex].focus();
        radioGroup[nextIndex].checked = true;
    }

    /**
     * Handle group navigation for elements with data-group attribute
     * @param {KeyboardEvent} e
     * @param {string} groupName
     */
    handleGroupNavigation(e, groupName) {
        const groupElements = Array.from(
            document.querySelectorAll(`[data-group="${groupName}"]`)
        ).filter(el => this.isElementVisible(el));

        if (groupElements.length <= 1) return;

        const currentIndex = groupElements.indexOf(e.target);
        let nextIndex;

        switch (e.key) {
            case 'ArrowDown':
            case 'ArrowRight':
                nextIndex = (currentIndex + 1) % groupElements.length;
                break;
            case 'ArrowUp':
            case 'ArrowLeft':
                nextIndex = (currentIndex - 1 + groupElements.length) % groupElements.length;
                break;
            default:
                return;
        }

        e.preventDefault();
        groupElements[nextIndex].focus();
    }

    /**
     * Handle Enter/Space activation
     * @param {KeyboardEvent} e
     */
    handleActivation(e) {
        const target = e.target;
        
        // Let buttons handle their own activation
        if (target.tagName === 'BUTTON') {
            return;
        }
        
        // Handle checkbox/radio with Space
        if ((target.type === 'checkbox' || target.type === 'radio') && e.key === ' ') {
            // Browser handles this automatically
            return;
        }
        
        // Handle custom clickable elements
        if (target.hasAttribute('data-clickable') || target.getAttribute('role') === 'button') {
            e.preventDefault();
            target.click();
        }
    }

    /**
     * Update current focus index in focusable elements array
     * @param {Element} element
     */
    updateCurrentFocusIndex(element) {
        this.currentFocusIndex = this.focusableElements.indexOf(element);
    }

    /**
     * Handle focus lost (when no element has focus)
     */
    handleFocusLost() {
        // If we have a last focused element, try to restore it
        if (this.lastFocusedElement && document.contains(this.lastFocusedElement)) {
            this.lastFocusedElement.focus();
        } else if (this.focusableElements.length > 0) {
            // Focus the first focusable element
            this.focusableElements[0].focus();
        }
    }

    /**
     * Restore focus to last focused element or first focusable element
     */
    restoreFocus() {
        if (this.lastFocusedElement && document.contains(this.lastFocusedElement)) {
            this.lastFocusedElement.focus();
        } else {
            this.focusFirst();
        }
    }

    /**
     * Focus the first focusable element
     */
    focusFirst() {
        this.updateFocusableElements();
        if (this.focusableElements.length > 0) {
            this.focusableElements[0].focus();
        }
    }

    /**
     * Focus the next focusable element
     */
    focusNext() {
        this.updateFocusableElements();
        if (this.focusableElements.length === 0) return;
        
        const nextIndex = (this.currentFocusIndex + 1) % this.focusableElements.length;
        this.focusableElements[nextIndex].focus();
    }

    /**
     * Focus the previous focusable element
     */
    focusPrevious() {
        this.updateFocusableElements();
        if (this.focusableElements.length === 0) return;
        
        const prevIndex = (this.currentFocusIndex - 1 + this.focusableElements.length) % 
                         this.focusableElements.length;
        this.focusableElements[prevIndex].focus();
    }

    /**
     * Add visual focus indicators and skip links
     */
    addFocusIndicators() {
        // Ensure skip link functionality
        const skipLink = document.querySelector('.skip-link');
        if (skipLink) {
            skipLink.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = skipLink.getAttribute('href').substring(1);
                const target = document.getElementById(targetId);
                if (target) {
                    target.setAttribute('tabindex', '-1');
                    target.focus();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    
                    // Remove tabindex after focus (to restore natural tab order)
                    target.addEventListener('blur', () => {
                        target.removeAttribute('tabindex');
                    }, { once: true });
                }
            });
        }
    }

    /**
     * Announce text to screen readers
     * @param {string} text - Text to announce
     * @param {string} priority - Announcement priority ('polite' or 'assertive')
     */
    announce(text, priority = 'polite') {
        // Create or get existing live region
        let liveRegion = document.getElementById('screen-reader-announcements');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'screen-reader-announcements';
            liveRegion.className = 'sr-only';
            liveRegion.setAttribute('aria-live', priority);
            liveRegion.setAttribute('aria-atomic', 'true');
            document.body.appendChild(liveRegion);
        }
        
        // Update the live region
        liveRegion.textContent = text;
        
        // Clear after announcement
        setTimeout(() => {
            if (liveRegion.textContent === text) {
                liveRegion.textContent = '';
            }
        }, 1000);
    }

    /**
     * Set up focus management for a specific panel/section
     * @param {string} panelId - ID of the panel
     * @param {Object} options - Configuration options
     */
    setupPanelFocus(panelId, options = {}) {
        const panel = document.getElementById(panelId);
        if (!panel) return;
        
        const {
            trapFocus = false,
            initialFocus = null,
            announceOnShow = true
        } = options;
        
        // Show panel handler
        const showPanel = () => {
            if (announceOnShow) {
                const title = panel.querySelector('h1, h2, h3, h4, h5, h6')?.textContent || 
                             'Panel opened';
                this.announce(`${title} opened`);
            }
            
            if (trapFocus) {
                this.createFocusTrap(panel, { initialFocus });
            } else if (initialFocus) {
                const focusElement = typeof initialFocus === 'string' 
                    ? panel.querySelector(initialFocus) 
                    : initialFocus;
                if (focusElement) {
                    setTimeout(() => focusElement.focus(), 10);
                }
            }
        };
        
        // Hide panel handler
        const hidePanel = () => {
            if (trapFocus) {
                this.removeFocusTrap(panel);
            }
        };
        
        return { showPanel, hidePanel };
    }

    /**
     * Cleanup focus manager
     */
    cleanup() {
        // Remove all focus traps
        for (const container of this.focusTraps.keys()) {
            this.removeFocusTrap(container);
        }
        
        // Remove focus visibility classes
        document.body.classList.remove('focus-visible');
        
        // Clear references
        this.focusableElements = [];
        this.lastFocusedElement = null;
        this.currentFocusIndex = -1;
    }
}

// Create and export singleton instance
export const focusManager = new FocusManager();

// Make available globally
window.focusManager = focusManager;

// Global cleanup on page unload
window.addEventListener('beforeunload', () => {
    focusManager.cleanup();
});