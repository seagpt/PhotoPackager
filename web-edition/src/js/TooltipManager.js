/**
 * PhotoPackager Web Edition - Tooltip Management System
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
 * TooltipManager.js
 * Manages tooltips for all form controls and interactive elements
 * Provides accessible, responsive tooltips with proper positioning
 */

class TooltipManager {
    constructor() {
        this.tooltips = new Map();
        this.activeTooltip = null;
        this.tooltipElement = null;
        
        // Tooltip data for all form controls
        this.tooltipData = {
            // Project Settings
            'projectName': {
                title: 'Project Name',
                content: 'This name will be used for the folder structure and README file. Use descriptive names like "Smith_Wedding_2025" for easy organization.',
                trigger: 'hover focus'
            },
            'studioName': {
                title: 'Studio Name',
                content: 'Your photography studio or business name. This appears in the client README file for professional branding.',
                trigger: 'hover focus'
            },
            'studioWebsite': {
                title: 'Website URL',
                content: 'Your studio\'s website URL. Include https:// for proper linking. This helps clients find your other work.',
                trigger: 'hover focus'
            },
            'studioEmail': {
                title: 'Contact Email',
                content: 'Professional email address for client inquiries. This appears in the README file for easy client contact.',
                trigger: 'hover focus'
            },
            
            // File Options
            'includeOriginals': {
                title: 'Include Original Files',
                content: 'Include unmodified original photos in the delivery package. Recommended for professional deliveries.',
                trigger: 'hover focus'
            },
            'originalsAction': {
                title: 'Original Files Action',
                content: 'Copy: Keeps original files in their current location (safest). Leave: Excludes originals from the package.',
                trigger: 'hover focus'
            },
            'includeRaw': {
                title: 'Include RAW Files',
                content: 'Include camera RAW files (.CR2, .NEF, .ARW, etc.) in the package. Useful for professional clients who may want to edit.',
                trigger: 'hover focus'
            },
            'rawAction': {
                title: 'RAW Files Action',
                content: 'Copy: Includes RAW files in package. Leave: Excludes RAW files to save space and processing time.',
                trigger: 'hover focus'
            },
            'generateOptimizedJPG': {
                title: 'Generate Optimized JPG',
                content: 'Creates high-quality JPG versions optimized for print and professional use. Maintains excellent image quality.',
                trigger: 'hover focus'
            },
            'generateOptimizedWebP': {
                title: 'Generate Optimized WebP',
                content: 'Creates high-quality WebP versions with better compression than JPG. Modern format with excellent quality.',
                trigger: 'hover focus'
            },
            'generateCompressedJPG': {
                title: 'Generate Compressed JPG',
                content: 'Creates smaller JPG versions perfect for web use, social media sharing, and email attachments.',
                trigger: 'hover focus'
            },
            'generateCompressedWebP': {
                title: 'Generate Compressed WebP',
                content: 'Creates smaller WebP versions with superior compression. Perfect for modern web browsers and fast loading.',
                trigger: 'hover focus'
            },
            
            // Quality Settings
            'optimizedQuality': {
                title: 'Optimized Quality Level',
                content: 'Quality level for optimized versions (60-95). Higher values mean better quality but larger files. 85 is recommended for most uses.',
                trigger: 'hover focus'
            },
            'compressedQuality': {
                title: 'Compressed Quality Level',
                content: 'Quality level for compressed versions (30-80). Lower values create smaller files for web use. 65 balances quality and size.',
                trigger: 'hover focus'
            },
            'compressedMaxDimension': {
                title: 'Compressed Maximum Size',
                content: 'Maximum width or height for compressed images. Larger images are resized proportionally. 2048px works well for most displays.',
                trigger: 'hover focus'
            },
            
            // Metadata Options
            'exifHandling': {
                title: 'EXIF Data Handling',
                content: 'Controls what metadata is kept in processed images. "Preserve All" keeps camera settings, date, and location data.',
                trigger: 'hover focus'
            },
            
            // Buttons
            'selectFolderBtn': {
                title: 'Select Photo Folder',
                content: 'Click to browse and select a folder containing your photos. Supports JPG, PNG, WebP, RAW files, and more formats.',
                trigger: 'hover focus'
            },
            'startProcessingBtn': {
                title: 'Start Processing',
                content: 'Begin processing your photos with the selected settings. This will create optimized versions and package everything.',
                trigger: 'hover focus'
            },
            'downloadPackageBtn': {
                title: 'Download Package',
                content: 'Download the complete photo package as a ZIP file containing all processed images and documentation.',
                trigger: 'hover focus'
            },
            'cancelProcessingBtn': {
                title: 'Cancel Processing',
                content: 'Stop the current processing operation. You can start over with different settings if needed.',
                trigger: 'hover focus'
            },
            'startOverBtn': {
                title: 'Start Over',
                content: 'Clear all current work and start fresh with new photos. Previous work will be lost.',
                trigger: 'hover focus'
            }
        };
        
        this.init();
    }

    /**
     * Initialize the tooltip system
     */
    init() {
        this.createTooltipElement();
        this.attachEventListeners();
        this.initializeTooltips();
    }

    /**
     * Create the main tooltip element
     */
    createTooltipElement() {
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.className = 'tooltip';
        this.tooltipElement.style.display = 'none';
        this.tooltipElement.innerHTML = `
            <div class="tooltip-arrow"></div>
            <div class="tooltip-title"></div>
            <div class="tooltip-content"></div>
        `;
        document.body.appendChild(this.tooltipElement);
    }

    /**
     * Attach global event listeners
     */
    attachEventListeners() {
        // Hide tooltip when scrolling or clicking elsewhere
        document.addEventListener('scroll', this.hideTooltip.bind(this), true);
        document.addEventListener('click', (e) => {
            if (!e.target.closest('[data-tooltip]') && !e.target.closest('.tooltip')) {
                this.hideTooltip();
            }
        });
        
        // Hide tooltip on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideTooltip();
            }
        });
        
        // Hide tooltip on window resize
        window.addEventListener('resize', this.hideTooltip.bind(this));
    }

    /**
     * Initialize tooltips for all elements
     */
    initializeTooltips() {
        Object.keys(this.tooltipData).forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                this.addTooltip(element, this.tooltipData[elementId]);
            }
        });
    }

    /**
     * Add tooltip to an element
     * @param {HTMLElement} element - Element to add tooltip to
     * @param {Object} config - Tooltip configuration
     */
    addTooltip(element, config) {
        element.setAttribute('data-tooltip', 'true');
        element.setAttribute('data-tooltip-id', element.id);
        
        // Store config for later use
        this.tooltips.set(element, config);
        
        // Add event listeners based on trigger
        if (config.trigger.includes('hover')) {
            element.addEventListener('mouseenter', (e) => this.showTooltip(e, element, config));
            element.addEventListener('mouseleave', () => this.hideTooltip());
        }
        
        if (config.trigger.includes('focus')) {
            element.addEventListener('focus', (e) => this.showTooltip(e, element, config));
            element.addEventListener('blur', () => this.hideTooltip());
        }
        
        if (config.trigger.includes('click')) {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.activeTooltip === element) {
                    this.hideTooltip();
                } else {
                    this.showTooltip(e, element, config);
                }
            });
        }
    }

    /**
     * Show tooltip for an element
     * @param {Event} event - Triggering event
     * @param {HTMLElement} element - Target element
     * @param {Object} config - Tooltip configuration
     */
    showTooltip(event, element, config) {
        if (this.activeTooltip === element) return;
        
        // Hide any existing tooltip
        this.hideTooltip();
        
        // Set tooltip content
        const titleEl = this.tooltipElement.querySelector('.tooltip-title');
        const contentEl = this.tooltipElement.querySelector('.tooltip-content');
        
        titleEl.textContent = config.title;
        contentEl.textContent = config.content;
        
        // Show tooltip
        this.tooltipElement.style.display = 'block';
        this.activeTooltip = element;
        
        // Position tooltip
        this.positionTooltip(element);
        
        // Add active class for styling
        element.classList.add('tooltip-active');
        
        // Set up auto-hide for mobile devices
        if (this.isMobileDevice()) {
            setTimeout(() => {
                if (this.activeTooltip === element) {
                    this.hideTooltip();
                }
            }, 4000); // Hide after 4 seconds on mobile
        }
    }

    /**
     * Hide the active tooltip
     */
    hideTooltip() {
        if (!this.activeTooltip) return;
        
        this.tooltipElement.style.display = 'none';
        this.activeTooltip.classList.remove('tooltip-active');
        this.activeTooltip = null;
    }

    /**
     * Position tooltip relative to target element
     * @param {HTMLElement} element - Target element
     */
    positionTooltip(element) {
        const rect = element.getBoundingClientRect();
        const tooltip = this.tooltipElement;
        const arrow = tooltip.querySelector('.tooltip-arrow');
        
        // Reset classes
        tooltip.className = 'tooltip';
        
        // Get tooltip dimensions
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Calculate positions
        let top, left, position;
        
        // Try positioning above first
        if (rect.top - tooltipRect.height - 10 > 0) {
            position = 'top';
            top = rect.top - tooltipRect.height - 10;
            left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        }
        // Try positioning below
        else if (rect.bottom + tooltipRect.height + 10 < viewportHeight) {
            position = 'bottom';
            top = rect.bottom + 10;
            left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        }
        // Try positioning to the right
        else if (rect.right + tooltipRect.width + 10 < viewportWidth) {
            position = 'right';
            top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
            left = rect.right + 10;
        }
        // Fall back to left
        else {
            position = 'left';
            top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
            left = rect.left - tooltipRect.width - 10;
        }
        
        // Ensure tooltip stays within viewport
        if (left < 10) left = 10;
        if (left + tooltipRect.width > viewportWidth - 10) {
            left = viewportWidth - tooltipRect.width - 10;
        }
        if (top < 10) top = 10;
        if (top + tooltipRect.height > viewportHeight - 10) {
            top = viewportHeight - tooltipRect.height - 10;
        }
        
        // Apply positioning
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
        tooltip.classList.add(`tooltip-${position}`);
    }

    /**
     * Check if device is mobile
     * @returns {boolean}
     */
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0);
    }

    /**
     * Add tooltip to element dynamically
     * @param {string|HTMLElement} selector - Element or selector
     * @param {Object} config - Tooltip configuration
     */
    addDynamicTooltip(selector, config) {
        const element = typeof selector === 'string' 
            ? document.querySelector(selector)
            : selector;
            
        if (element) {
            this.addTooltip(element, config);
        }
    }

    /**
     * Remove tooltip from element
     * @param {string|HTMLElement} selector - Element or selector
     */
    removeTooltip(selector) {
        const element = typeof selector === 'string' 
            ? document.querySelector(selector)
            : selector;
            
        if (element && this.tooltips.has(element)) {
            element.removeAttribute('data-tooltip');
            element.removeAttribute('data-tooltip-id');
            element.classList.remove('tooltip-active');
            
            // Remove event listeners (would need more complex tracking)
            this.tooltips.delete(element);
            
            if (this.activeTooltip === element) {
                this.hideTooltip();
            }
        }
    }

    /**
     * Cleanup tooltip system
     */
    cleanup() {
        this.hideTooltip();
        
        if (this.tooltipElement) {
            this.tooltipElement.remove();
            this.tooltipElement = null;
        }
        
        this.tooltips.clear();
        this.activeTooltip = null;
    }
}

// Create and export singleton instance
export const tooltipManager = new TooltipManager();

// Global cleanup on page unload
window.addEventListener('beforeunload', () => {
    tooltipManager.cleanup();
});