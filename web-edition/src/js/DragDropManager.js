/**
 * PhotoPackager Web Edition - Enhanced Drag & Drop Manager
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
 * DragDropManager.js
 * Enhanced drag-and-drop functionality with visual feedback
 * Provides file type validation, visual cues, and smooth animations
 */

class DragDropManager {
    constructor() {
        this.dropZone = null;
        this.dragCounter = 0;
        this.validFileTypes = new Set([
            // Image types
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp',
            'image/tiff', 'image/gif', 'image/svg+xml',
            // RAW formats (detected by extension)
            'application/octet-stream', // Many RAW files appear as this
            '' // Files without detected MIME type (for RAW files)
        ]);
        
        this.validExtensions = [
            '.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.tif', '.gif',
            '.arw', '.cr2', '.cr3', '.nef', '.dng', '.orf', '.rw2', '.pef',
            '.srw', '.raf', '.3fr', '.fff', '.iiq', '.rwl'
        ];
        
        this.dragState = {
            isDragging: false,
            dragCount: 0,
            hasValidFiles: false,
            invalidFileCount: 0,
            validFileCount: 0,
            totalFileCount: 0
        };
        
        this.init();
    }

    /**
     * Initialize drag-and-drop manager
     */
    init() {
        this.dropZone = document.getElementById('dropZone');
        if (!this.dropZone) {
            logger.warn('Drop zone not found, drag-drop manager disabled');
            return;
        }
        
        this.setupGlobalDragListeners();
        this.setupDropZoneListeners();
        this.createFeedbackElements();
    }

    /**
     * Setup global drag listeners to detect when files enter/leave the window
     */
    setupGlobalDragListeners() {
        // Global drag enter - show drop zone highlight when files enter window
        document.addEventListener('dragenter', (e) => {
            e.preventDefault();
            this.dragCounter++;
            
            if (this.dragCounter === 1 && this.hasFiles(e)) {
                this.showGlobalDragFeedback();
            }
        });

        // Global drag leave - hide when all files leave window
        document.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.dragCounter--;
            
            if (this.dragCounter === 0) {
                this.hideGlobalDragFeedback();
            }
        });

        // Global drag over - prevent default to allow drop
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (e.dataTransfer) {
                e.dataTransfer.dropEffect = 'copy';
            }
        });

        // Global drop - hide feedback and let drop zone handle
        document.addEventListener('drop', (e) => {
            this.dragCounter = 0;
            this.hideGlobalDragFeedback();
        });
    }

    /**
     * Setup drop zone specific listeners
     */
    setupDropZoneListeners() {
        // Drop zone drag enter
        this.dropZone.addEventListener('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleDropZoneDragEnter(e);
        });

        // Drop zone drag over
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleDropZoneDragOver(e);
        });

        // Drop zone drag leave
        this.dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleDropZoneDragLeave(e);
        });

        // Drop zone drop
        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleDropZoneDrop(e);
        });
    }

    /**
     * Create feedback elements for enhanced visual feedback
     */
    createFeedbackElements() {
        // Create file count indicator
        const fileCountEl = document.createElement('div');
        fileCountEl.className = 'drag-file-count';
        fileCountEl.style.display = 'none';
        this.dropZone.appendChild(fileCountEl);
        
        // Create file type indicator
        const fileTypeEl = document.createElement('div');
        fileTypeEl.className = 'drag-file-types';
        fileTypeEl.style.display = 'none';
        this.dropZone.appendChild(fileTypeEl);
        
        // Create progress indicator for file analysis
        const progressEl = document.createElement('div');
        progressEl.className = 'drag-progress';
        progressEl.innerHTML = `
            <div class="drag-progress-bar">
                <div class="drag-progress-fill"></div>
            </div>
            <div class="drag-progress-text">Analyzing files...</div>
        `;
        progressEl.style.display = 'none';
        this.dropZone.appendChild(progressEl);
    }

    /**
     * Check if drag event contains files
     * @param {DragEvent} e
     * @returns {boolean}
     */
    hasFiles(e) {
        if (!e.dataTransfer) return false;
        
        // Check for files in dataTransfer
        return e.dataTransfer.types.includes('Files') || 
               e.dataTransfer.types.includes('application/x-moz-file');
    }

    /**
     * Analyze dragged files for type validation
     * @param {DragEvent} e
     */
    async analyzeDraggedFiles(e) {
        if (!e.dataTransfer) return;
        
        const items = Array.from(e.dataTransfer.items);
        let validCount = 0;
        let invalidCount = 0;
        let totalCount = 0;
        
        for (const item of items) {
            if (item.kind === 'file') {
                totalCount++;
                
                // Check MIME type and file extension
                const file = item.getAsFile();
                if (file && this.isValidImageFile(file)) {
                    validCount++;
                } else {
                    invalidCount++;
                }
            }
        }
        
        this.dragState = {
            isDragging: true,
            hasValidFiles: validCount > 0,
            validFileCount: validCount,
            invalidFileCount: invalidCount,
            totalFileCount: totalCount
        };
        
        this.updateDropZoneFeedback();
    }

    /**
     * Check if file is a valid image file
     * @param {File} file
     * @returns {boolean}
     */
    isValidImageFile(file) {
        // Check MIME type
        if (this.validFileTypes.has(file.type)) {
            return true;
        }
        
        // Check file extension for RAW files and others
        const fileName = file.name.toLowerCase();
        return this.validExtensions.some(ext => fileName.endsWith(ext));
    }

    /**
     * Show global drag feedback (subtle page-wide indication)
     */
    showGlobalDragFeedback() {
        document.body.classList.add('drag-active');
        
        // Pulse the drop zone to draw attention
        if (this.dropZone) {
            this.dropZone.classList.add('drag-target');
        }
    }

    /**
     * Hide global drag feedback
     */
    hideGlobalDragFeedback() {
        document.body.classList.remove('drag-active');
        
        if (this.dropZone) {
            this.dropZone.classList.remove('drag-target');
        }
    }

    /**
     * Handle drop zone drag enter
     * @param {DragEvent} e
     */
    handleDropZoneDragEnter(e) {
        this.dropZone.classList.add('drag-over');
        this.analyzeDraggedFiles(e);
    }

    /**
     * Handle drop zone drag over
     * @param {DragEvent} e
     */
    handleDropZoneDragOver(e) {
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = this.dragState.hasValidFiles ? 'copy' : 'none';
        }
    }

    /**
     * Handle drop zone drag leave
     * @param {DragEvent} e
     */
    handleDropZoneDragLeave(e) {
        // Only remove styling if we're actually leaving the drop zone
        // (not just moving between child elements)
        if (!this.dropZone.contains(e.relatedTarget)) {
            this.dropZone.classList.remove('drag-over', 'drag-valid', 'drag-invalid');
            this.hideFeedbackElements();
            
            this.dragState.isDragging = false;
        }
    }

    /**
     * Handle drop zone drop
     * @param {DragEvent} e
     */
    handleDropZoneDrop(e) {
        this.dropZone.classList.remove('drag-over', 'drag-valid', 'drag-invalid', 'drag-target');
        this.hideFeedbackElements();
        
        this.dragState.isDragging = false;
        
        // Let the main app handle the actual file processing
        // This is just for visual feedback
    }

    /**
     * Update drop zone feedback based on drag state
     */
    updateDropZoneFeedback() {
        const { hasValidFiles, validFileCount, invalidFileCount, totalFileCount } = this.dragState;
        
        // Apply appropriate CSS classes
        this.dropZone.classList.toggle('drag-valid', hasValidFiles && invalidFileCount === 0);
        this.dropZone.classList.toggle('drag-invalid', !hasValidFiles || invalidFileCount > 0);
        this.dropZone.classList.toggle('drag-mixed', hasValidFiles && invalidFileCount > 0);
        
        // Update file count display
        this.updateFileCountDisplay();
        
        // Update file type display
        this.updateFileTypeDisplay();
        
        // Show feedback elements
        this.showFeedbackElements();
    }

    /**
     * Update file count display
     */
    updateFileCountDisplay() {
        const fileCountEl = this.dropZone.querySelector('.drag-file-count');
        if (!fileCountEl) return;
        
        const { validFileCount, invalidFileCount, totalFileCount } = this.dragState;
        
        let message = '';
        if (totalFileCount === 0) {
            message = 'No files detected';
        } else if (invalidFileCount === 0) {
            message = `${validFileCount} valid image${validFileCount !== 1 ? 's' : ''}`;
        } else if (validFileCount === 0) {
            message = `${invalidFileCount} unsupported file${invalidFileCount !== 1 ? 's' : ''}`;
        } else {
            message = `${validFileCount} valid, ${invalidFileCount} unsupported`;
        }
        
        fileCountEl.textContent = message;
        fileCountEl.className = `drag-file-count ${validFileCount > 0 ? 'valid' : 'invalid'}`;
    }

    /**
     * Update file type display
     */
    updateFileTypeDisplay() {
        const fileTypeEl = this.dropZone.querySelector('.drag-file-types');
        if (!fileTypeEl) return;
        
        const { hasValidFiles, validFileCount, invalidFileCount } = this.dragState;
        
        let message = '';
        let className = 'drag-file-types';
        
        if (hasValidFiles && invalidFileCount === 0) {
            message = '✓ Ready to process';
            className += ' valid';
        } else if (!hasValidFiles) {
            message = '⚠ No supported image files';
            className += ' invalid';
        } else {
            message = '⚠ Some files will be skipped';
            className += ' mixed';
        }
        
        fileTypeEl.textContent = message;
        fileTypeEl.className = className;
    }

    /**
     * Show feedback elements
     */
    showFeedbackElements() {
        const fileCountEl = this.dropZone.querySelector('.drag-file-count');
        const fileTypeEl = this.dropZone.querySelector('.drag-file-types');
        
        if (fileCountEl) {
            fileCountEl.style.display = 'block';
            fileCountEl.style.opacity = '1';
        }
        
        if (fileTypeEl) {
            fileTypeEl.style.display = 'block';
            fileTypeEl.style.opacity = '1';
        }
    }

    /**
     * Hide feedback elements
     */
    hideFeedbackElements() {
        const fileCountEl = this.dropZone.querySelector('.drag-file-count');
        const fileTypeEl = this.dropZone.querySelector('.drag-file-types');
        const progressEl = this.dropZone.querySelector('.drag-progress');
        
        if (fileCountEl) {
            fileCountEl.style.opacity = '0';
            setTimeout(() => {
                if (fileCountEl.style.opacity === '0') {
                    fileCountEl.style.display = 'none';
                }
            }, 300);
        }
        
        if (fileTypeEl) {
            fileTypeEl.style.opacity = '0';
            setTimeout(() => {
                if (fileTypeEl.style.opacity === '0') {
                    fileTypeEl.style.display = 'none';
                }
            }, 300);
        }
        
        if (progressEl) {
            progressEl.style.display = 'none';
        }
    }

    /**
     * Enhanced drag counter management for nested elements
     */
    resetDragCounter() {
        this.dragCounter = 0;
    }

    /**
     * Cleanup drag-drop manager
     */
    cleanup() {
        document.body.classList.remove('drag-active');
        
        if (this.dropZone) {
            this.dropZone.classList.remove('drag-over', 'drag-valid', 'drag-invalid', 'drag-mixed', 'drag-target');
        }
        
        this.hideFeedbackElements();
        this.dragState.isDragging = false;
    }
}

// Create and export singleton instance
export const dragDropManager = new DragDropManager();

// Global cleanup on page unload
window.addEventListener('beforeunload', () => {
    dragDropManager.cleanup();
});