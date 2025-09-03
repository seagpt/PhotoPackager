/**
 * AccessibilityManager.js
 * Comprehensive accessibility support for PhotoPackager
 * Handles keyboard navigation, ARIA updates, and screen reader support
 */

export class AccessibilityManager {
    constructor() {
        this.currentFocusIndex = 0;
        this.focusableElements = [];
        this.keyboardNavigationEnabled = false;
        this.liveRegion = null;
        this.setupAccessibility();
    }

    /**
     * Initialize accessibility features
     */
    setupAccessibility() {
        this.createLiveRegion();
        this.setupKeyboardNavigation();
        this.setupProgressAnnouncements();
        this.setupErrorAnnouncements();
        this.updateFocusableElements();
        
        // Update focusable elements when DOM changes
        const observer = new MutationObserver(() => {
            this.updateFocusableElements();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'hidden', 'disabled']
        });
    }

    /**
     * Create ARIA live region for announcements
     */
    createLiveRegion() {
        this.liveRegion = document.createElement('div');
        this.liveRegion.setAttribute('aria-live', 'polite');
        this.liveRegion.setAttribute('aria-atomic', 'true');
        this.liveRegion.className = 'live-region sr-only';
        this.liveRegion.id = 'live-region';
        document.body.appendChild(this.liveRegion);
    }

    /**
     * Announce message to screen readers
     */
    announce(message, priority = 'polite') {
        if (!this.liveRegion) return;
        
        // Clear and set new message
        this.liveRegion.setAttribute('aria-live', priority);
        this.liveRegion.textContent = '';
        
        // Small delay to ensure screen readers pick up the change
        setTimeout(() => {
            this.liveRegion.textContent = message;
        }, 100);
        
        // Clear after announcement
        setTimeout(() => {
            this.liveRegion.textContent = '';
        }, 3000);
    }

    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Detect keyboard navigation
            if (e.key === 'Tab') {
                this.keyboardNavigationEnabled = true;
                document.body.classList.add('keyboard-nav');
            }
            
            this.handleKeyboardShortcuts(e);
        });
        
        // Disable keyboard nav indicator on mouse use
        document.addEventListener('mousedown', () => {
            this.keyboardNavigationEnabled = false;
            document.body.classList.remove('keyboard-nav');
        });
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'o': // Open folder
                    e.preventDefault();
                    this.triggerFolderSelection();
                    this.announce('Opening folder selection dialog');
                    break;
                    
                case 'enter': // Start processing
                case 'return':
                    if (this.isConfigPanelVisible()) {
                        e.preventDefault();
                        this.triggerProcessing();
                        this.announce('Starting photo processing');
                    }
                    break;
                    
                case 's': // Save settings (if applicable)
                    e.preventDefault();
                    this.saveCurrentSettings();
                    this.announce('Settings saved');
                    break;
                    
                case 'r': // Reset/Start over
                    e.preventDefault();
                    if (confirm('Start over with new photos?')) {
                        this.triggerStartOver();
                        this.announce('Starting over with new photos');
                    }
                    break;
            }
        }
        
        // Escape key
        if (e.key === 'Escape') {
            this.handleEscape();
        }
        
        // Arrow key navigation in drop zone
        if (e.target.id === 'dropZone') {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.triggerFolderSelection();
            }
        }
    }

    /**
     * Update focusable elements list
     */
    updateFocusableElements() {
        const selector = 'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
        this.focusableElements = Array.from(document.querySelectorAll(selector))
            .filter(el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden' && !el.hidden;
            });
    }

    /**
     * Setup progress announcements
     */
    setupProgressAnnouncements() {
        // Monitor progress updates
        const progressObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.id === 'currentFile' && mutation.type === 'childList') {
                    const filename = mutation.target.textContent;
                    if (filename && !filename.includes('Initializing') && !filename.includes('Creating')) {
                        this.announce(`Processing ${filename}`);
                    }
                }
                
                if (mutation.target.id === 'progressPercent' && mutation.type === 'childList') {
                    const percent = mutation.target.textContent;
                    if (percent && percent !== '0%') {
                        // Announce progress every 25%
                        const numPercent = parseInt(percent);
                        if (numPercent % 25 === 0) {
                            this.announce(`Progress: ${percent} complete`);
                        }
                    }
                }
            });
        });
        
        // Observe progress elements when they exist
        const startObserving = () => {
            const currentFile = document.getElementById('currentFile');
            const progressPercent = document.getElementById('progressPercent');
            
            if (currentFile) {
                progressObserver.observe(currentFile, { childList: true, subtree: true });
            }
            if (progressPercent) {
                progressObserver.observe(progressPercent, { childList: true, subtree: true });
            }
        };
        
        // Start observing immediately and when DOM changes
        startObserving();
        setTimeout(startObserving, 1000);
    }

    /**
     * Setup error announcements
     */
    setupErrorAnnouncements() {
        // Listen for error modal visibility changes
        const errorObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.id === 'error-overlay' && mutation.attributeName === 'style') {
                    const display = mutation.target.style.display;
                    if (display === 'flex') {
                        const title = document.getElementById('error-title')?.textContent;
                        const message = document.getElementById('error-message')?.textContent;
                        this.announce(`Error: ${title}. ${message}`, 'assertive');
                        
                        // Focus on the error dialog
                        setTimeout(() => {
                            const errorModal = document.querySelector('.error-modal');
                            if (errorModal) {
                                errorModal.focus();
                            }
                        }, 100);
                    }
                }
            });
        });
        
        // Start observing when error overlay exists
        setTimeout(() => {
            const errorOverlay = document.getElementById('error-overlay');
            if (errorOverlay) {
                errorObserver.observe(errorOverlay, { attributes: true });
            }
        }, 1000);
    }

    /**
     * Helper methods for keyboard shortcuts
     */
    triggerFolderSelection() {
        const selectBtn = document.getElementById('selectFolderBtn');
        if (selectBtn && !selectBtn.disabled) {
            selectBtn.click();
        }
    }

    triggerProcessing() {
        const processBtn = document.getElementById('startProcessingBtn');
        if (processBtn && !processBtn.disabled) {
            processBtn.click();
        }
    }

    triggerStartOver() {
        const startOverBtn = document.getElementById('startOverBtn');
        if (startOverBtn && !startOverBtn.disabled) {
            startOverBtn.click();
        } else if (window.photoPackagerApp) {
            window.photoPackagerApp.startOver();
        }
    }

    saveCurrentSettings() {
        if (window.photoPackagerApp) {
            window.photoPackagerApp.saveSettings();
        }
    }

    isConfigPanelVisible() {
        const configPanel = document.getElementById('configPanel');
        return configPanel && configPanel.style.display !== 'none';
    }

    handleEscape() {
        // Close modals
        const errorOverlay = document.getElementById('error-overlay');
        if (errorOverlay && errorOverlay.style.display === 'flex') {
            const closeBtn = document.getElementById('error-close');
            if (closeBtn) closeBtn.click();
            return;
        }
        
        // Close cookie modal
        const cookieModal = document.getElementById('cookie-management-modal');
        if (cookieModal) {
            const closeBtn = document.getElementById('close-cookie-modal');
            if (closeBtn) closeBtn.click();
            return;
        }
        
        // Remove warnings
        const warnings = document.querySelectorAll('.warning-toast');
        warnings.forEach(warning => warning.remove());
    }

    /**
     * Add ARIA labels to elements dynamically
     */
    enhanceAriaLabels() {
        // Progress bar
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.setAttribute('role', 'progressbar');
            progressBar.setAttribute('aria-valuemin', '0');
            progressBar.setAttribute('aria-valuemax', '100');
            
            const updateProgress = () => {
                const percent = document.getElementById('progressPercent')?.textContent?.replace('%', '') || '0';
                progressBar.setAttribute('aria-valuenow', percent);
                progressBar.setAttribute('aria-valuetext', `${percent} percent complete`);
            };
            
            // Update initially and on changes
            updateProgress();
            const observer = new MutationObserver(updateProgress);
            const progressPercent = document.getElementById('progressPercent');
            if (progressPercent) {
                observer.observe(progressPercent, { childList: true, subtree: true });
            }
        }
        
        // File count and stats
        const progressCount = document.getElementById('progressCount');
        if (progressCount) {
            progressCount.setAttribute('aria-live', 'polite');
            progressCount.setAttribute('aria-atomic', 'true');
        }
        
        // Current file being processed
        const currentFile = document.getElementById('currentFile');
        if (currentFile) {
            currentFile.setAttribute('aria-live', 'polite');
            currentFile.setAttribute('aria-atomic', 'true');
        }
    }

    /**
     * Add tooltips with proper ARIA support
     */
    addTooltips() {
        const tooltips = {
            'optimizedQuality': 'Higher values produce better quality but larger files',
            'compressedQuality': 'Lower values produce smaller files for web sharing',
            'compressedMaxDimension': 'Maximum width or height for compressed images',
            'exifHandling': 'Controls what metadata is kept in processed images',
            'includeOriginals': 'Include unmodified original files in the package',
            'includeRaw': 'Include RAW files if present in the selected folder',
            'generateOptimizedJPG': 'Create high-quality JPG versions',
            'generateOptimizedWebP': 'Create high-quality WebP versions (smaller than JPG)',
            'generateCompressedJPG': 'Create smaller JPG versions for web/social media',
            'generateCompressedWebP': 'Create smaller WebP versions for web/social media'
        };
        
        Object.entries(tooltips).forEach(([id, tooltip]) => {
            const element = document.getElementById(id);
            if (element) {
                element.setAttribute('data-tooltip', tooltip);
                element.setAttribute('aria-describedby', `${id}-tooltip`);
                
                // Create hidden description
                const description = document.createElement('div');
                description.id = `${id}-tooltip`;
                description.className = 'sr-only';
                description.textContent = tooltip;
                element.parentNode.appendChild(description);
            }
        });
    }

    /**
     * Announce file selection results
     */
    announceFileSelection(fileCount, totalSize) {
        const sizeText = totalSize > 1024 * 1024 * 1024 
            ? `${Math.round(totalSize / 1024 / 1024 / 1024)} GB`
            : `${Math.round(totalSize / 1024 / 1024)} MB`;
            
        this.announce(`${fileCount} photos selected, total size ${sizeText}. Configuration options are now available.`);
    }

    /**
     * Announce processing completion
     */
    announceCompletion(processedCount, processingTime) {
        const minutes = Math.floor(processingTime / 60000);
        const seconds = Math.floor((processingTime % 60000) / 1000);
        const timeText = minutes > 0 ? `${minutes} minutes and ${seconds} seconds` : `${seconds} seconds`;
        
        this.announce(`Processing complete! ${processedCount} photos processed in ${timeText}. Download button is now available.`, 'assertive');
    }

    /**
     * Setup form validation announcements
     */
    setupFormValidation() {
        const inputs = document.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            input.addEventListener('invalid', (e) => {
                const label = document.querySelector(`label[for="${input.id}"]`)?.textContent || input.id;
                this.announce(`Validation error in ${label}: ${e.target.validationMessage}`, 'assertive');
            });
            
            input.addEventListener('input', () => {
                // Clear previous error styling
                input.classList.remove('error');
                const errorMsg = input.parentNode.querySelector('.error-message');
                if (errorMsg) errorMsg.remove();
            });
        });
    }

    /**
     * Add role and state information to dynamic content
     */
    setupDynamicContent() {
        // Panel transitions
        const panels = ['dropZone', 'configPanel', 'progressPanel', 'completionPanel'];
        
        panels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.setAttribute('aria-hidden', 'true');
            }
        });
        
        // Show initial panel
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            dropZone.setAttribute('aria-hidden', 'false');
            dropZone.setAttribute('aria-current', 'step');
        }
    }

    /**
     * Update panel visibility with proper ARIA
     */
    updatePanelVisibility(visiblePanelId) {
        const panels = ['dropZone', 'configPanel', 'progressPanel', 'completionPanel'];
        const stepNames = {
            'dropZone': 'File Selection',
            'configPanel': 'Configuration',
            'progressPanel': 'Processing',
            'completionPanel': 'Complete'
        };
        
        panels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel) {
                const isVisible = panelId === visiblePanelId;
                panel.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
                
                if (isVisible) {
                    panel.setAttribute('aria-current', 'step');
                    const stepName = stepNames[panelId] || panelId;
                    this.announce(`Now on step: ${stepName}`);
                    
                    // Focus on the first focusable element in the panel
                    setTimeout(() => {
                        const firstFocusable = panel.querySelector('input, button, select, textarea, [tabindex]:not([tabindex="-1"])');
                        if (firstFocusable) {
                            firstFocusable.focus();
                        }
                    }, 100);
                } else {
                    panel.removeAttribute('aria-current');
                }
            }
        });
    }
}

// Initialize accessibility manager
document.addEventListener('DOMContentLoaded', () => {
    window.accessibilityManager = new AccessibilityManager();
    
    // Enhance elements after initialization
    setTimeout(() => {
        window.accessibilityManager.enhanceAriaLabels();
        window.accessibilityManager.addTooltips();
        window.accessibilityManager.setupFormValidation();
        window.accessibilityManager.setupDynamicContent();
    }, 1000);
});