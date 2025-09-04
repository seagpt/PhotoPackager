/**
 * PhotoPackager Web Edition - Main Application Controller
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
 * main.js
 * Handles UI interactions, file processing coordination, and user flow
 */

import { ImageProcessor } from './js/ImageProcessor.js';
import { PackageBuilder } from './js/PackageBuilder.js';
import { inputValidator } from './js/InputValidator.js';
import { progressPersistence } from './js/ProgressPersistence.js';
import { performanceOptimizer } from './js/PerformanceOptimizer.js';
import { logger } from './js/Logger.js';
import './js/ErrorHandler.js'; // Initialize global error handler
import './js/AnalyticsManager.js'; // Initialize real analytics system
import { memoryMonitor } from './js/MemoryMonitor.js'; // Initialize memory monitoring
import { config } from './js/Config.js'; // Environment-based configuration
import { domSanitizer } from './js/DOMSanitizer.js'; // Input sanitization (ASAP-021)
import { loadingStateManager } from './js/LoadingStateManager.js'; // Loading state management
import { tooltipManager } from './js/TooltipManager.js'; // Tooltip management
import { keyboardShortcuts } from './js/KeyboardShortcuts.js'; // Keyboard shortcuts
import { dragDropManager } from './js/DragDropManager.js'; // Enhanced drag-drop feedback
import { focusManager } from './js/FocusManager.js'; // Focus and accessibility management
import { networkUtils } from './js/NetworkUtils.js'; // Network utilities with retry logic (ASAP-037)

class PhotoPackagerWebApp {
    constructor() {
        this.currentFiles = [];
        this.processor = null;
        this.packageBuilder = null;
        this.processing = false;
        this.startTime = null;
        this.currentSessionId = null;
        this.resumingSession = false;
        
        // Track event listeners for proper cleanup
        this.eventListeners = [];
        
        // Initialize configuration-based features
        this.initializeFromConfig();
        
        // Initialize UI
        this.initializeUI();
        this.bindEvents();
        
        // Track feature usage for initial settings
        this.bindFeatureTracking();
        
        // Add real-time input validation (ASAP-036)
        this.bindInputValidation();
        
        // Load saved settings
        this.loadSavedSettings();
        
        // Check for resumable sessions
        this.checkForResumableSessions();
        
        // CRITICAL: Cleanup handlers are added in bindEvents() as beforeUnloadHandler
    }

    /**
     * Initialize features based on configuration
     */
    initializeFromConfig() {
        // Update memory monitor thresholds from config
        if (window.memoryMonitor) {
            window.memoryMonitor.warningThreshold = config.get('processing.memoryWarningPercent') / 100;
            window.memoryMonitor.killSwitchThreshold = config.get('processing.memoryKillSwitchPercent') / 100;
            window.memoryMonitor.criticalThreshold = config.get('processing.memoryCriticalPercent') / 100;
            window.memoryMonitor.emergencyThreshold = config.get('processing.memoryEmergencyPercent') / 100;
        }
        
        // Update performance optimizer with config values
        if (window.performanceOptimizer) {
            window.performanceOptimizer.updateCanvasLimits({
                maxWidth: config.get('processing.maxCanvasWidth'),
                maxHeight: config.get('processing.maxCanvasHeight'),
                maxPixels: config.get('processing.maxCanvasPixels')
            });
        }
        
        // Enable/disable features based on configuration
        const featureFlags = config.getFeatureFlags();
        
        // Show/hide debug information
        if (featureFlags.showDebugInfo) {
            document.body.classList.add('debug-mode');
            config.log('Debug mode enabled:', config.getAll());
        }
        
        // Update footer with environment info
        this.updateFooterInfo();
        
        // Configure analytics
        if (window.analytics && !featureFlags.enableAnalytics) {
            window.analytics.disable();
        }
        
        // Configure error handler
        if (window.errorHandler) {
            window.errorHandler.showTechnicalDetails = config.get('errors.showTechnicalDetails');
            window.errorHandler.maxLogEntries = config.get('errors.maxErrorLogEntries');
        }
        
        config.log(`PhotoPackager initialized in ${config.getEnvironment()} mode`);
    }

    /**
     * Initialize UI elements and default values
     */
    initializeUI() {
        // Set default values
        document.getElementById('projectName').value = this.generateDefaultProjectName();
        
        // Initialize range sliders
        this.updateRangeValue('optimizedQuality');
        this.updateRangeValue('compressedQuality');
        
        // Check for mobile and adapt UI
        this.setupMobileSupport();
        
        // Show initial panel
        this.showPanel('dropZone');
    }

    /**
     * Setup mobile-specific support and UI adaptations
     */
    setupMobileSupport() {
        const isMobile = this.detectMobileDevice();
        
        if (isMobile) {
            document.body.classList.add('mobile-device');
            
            // Update drop zone for mobile
            const dropZone = document.getElementById('dropZone');
            if (dropZone) {
                // Hide drag & drop text on mobile and show mobile-friendly message
                const dropText = dropZone.querySelector('.drop-text');
                if (dropText) {
                    dropText.innerHTML = `
                        <h2>📱 Select Photos</h2>
                        <p>Tap the button below to select photos from your device</p>
                        <p class="mobile-note">💡 On mobile, you can select multiple photos at once</p>
                    `;
                }
                
                // Make the entire drop zone clickable on mobile
                this.addTrackedEventListener(dropZone, 'click', () => {
                    const folderInput = document.getElementById('folderInput');
                    if (folderInput) {
                        folderInput.click();
                    }
                });
                
                // Disable drag events on mobile (they don't work anyway)
                ['dragover', 'dragenter', 'dragleave', 'drop'].forEach(eventType => {
                    dropZone.addEventListener(eventType, (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }, { passive: false });
                });
            }
            
            // Update folder input for mobile
            const folderInput = document.getElementById('folderInput');
            if (folderInput) {
                // Enable multiple file selection and accept images
                folderInput.setAttribute('multiple', 'true');
                folderInput.setAttribute('accept', 'image/*');
                
                // Remove webkitdirectory if present (doesn't work well on mobile)
                folderInput.removeAttribute('webkitdirectory');
            }
            
            // Update select folder button text
            const selectBtn = document.getElementById('selectFolderBtn');
            if (selectBtn) {
                selectBtn.textContent = '📱 Select Photos';
                selectBtn.style.fontSize = '1.2rem';
                selectBtn.style.padding = '15px 30px';
            }
        }
    }

    /**
     * Update footer with version and environment info
     */
    updateFooterInfo() {
        // Update build date
        const buildDateEl = document.getElementById('buildDate');
        if (buildDateEl) {
            const today = new Date().toISOString().split('T')[0];
            buildDateEl.textContent = today;
        }
        
        // Update environment indicator
        const envEl = document.getElementById('environment');
        if (envEl) {
            const env = config.getEnvironment();
            if (env !== 'production') {
                envEl.textContent = `(${env})`;
                envEl.style.color = env === 'development' ? '#ff6600' : '#ffaa00';
            } else {
                envEl.style.display = 'none';
            }
        }
        
        // Update version from config
        const versionEl = document.querySelector('.app-version');
        if (versionEl) {
            const version = config.get('version', '2.0.0');
            versionEl.textContent = `v${version}`;
            versionEl.setAttribute('data-version', version);
        }
    }

    /**
     * Detect if running on mobile device
     */
    detectMobileDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        const mobileKeywords = [
            'android', 'iphone', 'ipad', 'ipod', 'blackberry', 
            'windows phone', 'mobile', 'opera mini', 'iemobile'
        ];
        
        const isMobileUserAgent = mobileKeywords.some(keyword => 
            userAgent.includes(keyword)
        );
        
        const isMobileScreen = window.innerWidth <= 768;
        const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        return isMobileUserAgent || (isMobileScreen && hasTouchSupport);
    }

    /**
     * Helper to add tracked event listeners for proper cleanup
     */
    addTrackedEventListener(element, event, handler, options) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (!element) return;
        
        element.addEventListener(event, handler, options);
        this.eventListeners.push({ element, event, handler, options });
    }

    /**
     * Bind all UI events
     */
    bindEvents() {
        // File selection events
        const dropZone = document.getElementById('dropZone');
        const folderInput = document.getElementById('folderInput');
        const selectFolderBtn = document.getElementById('selectFolderBtn');

        // Drag and drop events
        this.addTrackedEventListener(dropZone, 'dragover', this.handleDragOver.bind(this));
        this.addTrackedEventListener(dropZone, 'dragleave', this.handleDragLeave.bind(this));
        this.addTrackedEventListener(dropZone, 'drop', this.handleDrop.bind(this));
        
        // Folder selection
        this.addTrackedEventListener(selectFolderBtn, 'click', () => folderInput.click());
        this.addTrackedEventListener(folderInput, 'change', this.handleFolderSelect.bind(this));
        
        // Configuration events
        this.addTrackedEventListener('optimizedQuality', 'input', (e) => 
            this.updateRangeValue('optimizedQuality'));
        this.addTrackedEventListener('compressedQuality', 'input', (e) => 
            this.updateRangeValue('compressedQuality'));
        
        // Processing events
        this.addTrackedEventListener('startProcessingBtn', 'click', 
            this.startProcessing.bind(this));
        this.addTrackedEventListener('cancelProcessingBtn', 'click', 
            this.cancelProcessing.bind(this));
        
        // Completion events
        this.addTrackedEventListener('downloadPackageBtn', 'click', 
            this.downloadPackage.bind(this));
        this.addTrackedEventListener('startOverBtn', 'click', 
            this.startOver.bind(this));

        // Global beforeunload handler - prevent navigation during processing (ASAP-026)
        this.beforeUnloadHandler = (e) => {
            // If processing is active, warn user about losing progress
            if (this.processing) {
                const confirmationMessage = 'Processing is in progress. Leaving now will cancel the current operation and you may lose progress. Are you sure you want to leave?';
                
                // Modern browsers ignore custom messages, but still show a generic warning dialog.
                // The user will see a standard "Changes you made may not be saved" message.
                e.preventDefault();
                e.returnValue = confirmationMessage;
                return confirmationMessage;
            }
            
            // If not processing, just cleanup normally
            this.cleanup();
            // Cleanup performance optimizer
            if (performanceOptimizer && typeof performanceOptimizer.cleanup === 'function') {
                performanceOptimizer.cleanup();
            }
        };
        this.addTrackedEventListener(window, 'beforeunload', this.beforeUnloadHandler);
        
        // Handle page visibility changes for cleanup (ASAP-033)
        this.visibilityChangeHandler = () => {
            if (document.hidden && !this.processing) {
                // Light cleanup when page becomes hidden (not processing)
                this.lightCleanup();
            }
        };
        this.addTrackedEventListener(document, 'visibilitychange', this.visibilityChangeHandler);
    }

    /**
     * Handle drag over event
     */
    handleDragOver(e) {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'copy';
        }
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            dropZone.classList.add('drag-over');
        }
    }

    /**
     * Handle drag leave event
     */
    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById('dropZone').classList.remove('drag-over');
    }

    /**
     * Handle file drop event
     */
    async handleDrop(e) {
        e.preventDefault();
        document.getElementById('dropZone').classList.remove('drag-over');
        
        // Show loading state for drop zone
        loadingStateManager.setDropZoneLoading(true, 'Processing dropped files...');
        
        try {
            const items = Array.from(e.dataTransfer.items);
            const files = [];
            
            // Process dropped items
            for (const item of items) {
                if (item.kind === 'file') {
                    const entry = item.webkitGetAsEntry();
                    if (entry) {
                        const entryFiles = await this.processDirectoryEntry(entry);
                        files.push(...entryFiles);
                    }
                }
            }
            
            this.handleFiles(files);
        } catch (error) {
            logger.error('Error processing dropped files:', error);
            window.errorHandler?.handleError(error, 'handleDrop');
        } finally {
            // Hide loading state
            loadingStateManager.setDropZoneLoading(false);
        }
    }

    /**
     * Handle folder selection from input
     */
    handleFolderSelect(e) {
        // Show loading state for drop zone while processing
        loadingStateManager.setDropZoneLoading(true, 'Processing selected files...');
        
        try {
            const files = Array.from(e.target.files);
            this.handleFiles(files);
        } catch (error) {
            logger.error('Error processing selected files:', error);
            window.errorHandler?.handleError(error, 'handleFolderSelect');
        } finally {
            // Hide loading state after a brief delay to show feedback
            setTimeout(() => {
                loadingStateManager.setDropZoneLoading(false);
            }, 500);
        }
    }

    /**
     * Process directory entry recursively
     */
    async processDirectoryEntry(entry) {
        const files = [];
        
        if (entry.isFile) {
            const file = await this.getFileFromEntry(entry);
            if (this.isImageFile(file)) {
                files.push(file);
            }
        } else if (entry.isDirectory) {
            const reader = entry.createReader();
            const entries = await this.readAllDirectoryEntries(reader);
            
            for (const childEntry of entries) {
                const childFiles = await this.processDirectoryEntry(childEntry);
                files.push(...childFiles);
            }
        }
        
        return files;
    }

    /**
     * Get file from directory entry
     */
    async getFileFromEntry(entry) {
        return new Promise((resolve, reject) => {
            entry.file(resolve, reject);
        });
    }

    /**
     * Read all entries from directory reader
     */
    async readAllDirectoryEntries(reader) {
        const entries = [];
        
        const readEntries = () => {
            return new Promise((resolve, reject) => {
                reader.readEntries(resolve, reject);
            });
        };
        
        let batch;
        while ((batch = await readEntries()).length > 0) {
            entries.push(...batch);
        }
        
        return entries;
    }

    /**
     * Handle files selection
     */
    handleFiles(files) {
        try {
            if (files.length === 0) {
                window.errorHandler?.handleError('no_files_selected', new Error('No files found in the selected folder'));
                return;
            }

            // Validate files using InputValidator
            const validation = inputValidator.validateFiles(Array.from(files));
            
            if (!validation.valid) {
                window.errorHandler?.handleError('file_validation_error', new Error(validation.errors.join('; ')));
                return;
            }

            // Show warnings if any
            if (validation.warnings.length > 0) {
                validation.warnings.forEach(warning => {
                    window.errorHandler?.showWarning('File Processing Notice', warning);
                });
            }

            // Use validated files
            this.currentFiles = validation.validFiles.sort((a, b) => a.name.localeCompare(b.name));
            
            if (this.currentFiles.length === 0) {
                window.errorHandler?.handleError('no_valid_files', new Error('No supported image files found in the selection'));
                return;
            }
            
            // Log file stats
            config.log('File validation stats:', validation.stats);
            if (window.analytics) {
                window.analytics.trackFeatureUsage('files_selected', validation.stats.validCount);
            }
            
            // Announce to screen readers
            if (window.accessibilityManager) {
                const totalSize = this.currentFiles.reduce((sum, file) => sum + file.size, 0);
                window.accessibilityManager.announceFileSelection(this.currentFiles.length, totalSize);
            }
            
            // Check if we're resuming a session
            if (this.resumingSession && this.resumeSessionData) {
                this.handleSessionResume();
            } else {
                // Update UI for normal flow
                this.updateFilesSummary();
                this.showPanel('configPanel');
            }
            
        } catch (error) {
            window.errorHandler?.handleError('file_handling_error', error);
        }
    }

    /**
     * Check if file is an image
     */
    isImageFile(file) {
        const imageTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
            'image/bmp', 'image/tiff', 'image/gif'
        ];
        
        const imageExtensions = [
            '.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.tif', '.gif',
            '.arw', '.cr2', '.cr3', '.nef', '.dng', '.orf', '.rw2', '.pef', 
            '.srw', '.raf', '.3fr', '.fff', '.iiq', '.rwl'
        ];
        
        return imageTypes.includes(file.type) || 
               imageExtensions.some(ext => 
                   file.name.toLowerCase().endsWith(ext)
               );
    }

    /**
     * Update files summary in UI
     */
    updateFilesSummary() {
        const totalSize = this.currentFiles.reduce((sum, file) => sum + file.size, 0);
        const sizeMB = Math.round(totalSize / 1024 / 1024);
        
        // Update drop zone or add summary somewhere
        config.log(`Found ${this.currentFiles.length} images (${sizeMB} MB total)`);
    }

    /**
     * Start processing images
     */
    async startProcessing() {
        if (this.processing) return;
        
        // Comprehensive UI locking for processing session (ASAP-025)
        this.setProcessingUI(true);
        
        this.processing = true;
        this.startTime = Date.now();
        
        try {
            // Get and validate settings
            const rawSettings = this.getProcessingSettings();
            const validation = inputValidator.validateAllInputs(rawSettings);
            
            if (!validation.valid) {
                window.errorHandler?.handleError('settings_validation_error', new Error(validation.errors.join('\n')));
                this.processing = false;
                this.setProcessingUI(false);
                return;
            }
            
            const settings = validation.validatedData;
            
            // Perform memory pre-check before processing
            const memoryPreCheck = this.performMemoryPreCheck();
            if (!memoryPreCheck.canProceed) {
                window.errorHandler?.handleError('insufficient_memory', new Error(memoryPreCheck.message));
                this.processing = false;
                this.setProcessingUI(false);
                return;
            }
            
            // Track processing start
            if (window.analytics) {
                const totalSize = this.currentFiles.reduce((sum, file) => sum + file.size, 0);
                window.analytics.trackProcessingStart(this.currentFiles.length, totalSize);
            }
            
            // Validate at least one output is selected
            const hasAnyOutput = settings.includeOriginals || settings.includeRaw ||
                settings.generateOptimizedJPG || settings.generateOptimizedWebP ||
                settings.generateCompressedJPG || settings.generateCompressedWebP;
            
            if (!hasAnyOutput) {
                window.errorHandler?.handleError('no_output_selected', new Error('Please select at least one output option (originals, RAW files, or generated formats)'));
                this.processing = false;
                this.setProcessingUI(false);
                return;
            }
            
            // Save settings for next time
            this.saveSettings();
            
            // Initialize processor
            this.processor = new ImageProcessor({
                optimizedQuality: settings.optimizedQuality,
                compressedQuality: settings.compressedQuality,
                compressedMaxDimension: settings.compressedMaxDimension,
                exifHandling: settings.exifHandling,
                progressCallback: this.updateProgress.bind(this)
            });
            
            // Initialize package builder
            this.packageBuilder = new PackageBuilder({
                studioName: settings.studioName,
                studioWebsite: settings.studioWebsite,
                studioEmail: settings.studioEmail,
                projectName: settings.projectName
            });
            
            // Show progress panel
            this.showPanel('progressPanel');
            this.resetProgress();
            
            // Process files
            const results = await this.processor.processFilesBatch(this.currentFiles, settings);
            
            // Build package (with fallback if JSZip fails)
            await this.updateProgress({ stage: 'packaging', percent: 95 });
            
            try {
                const packageZip = await this.packageBuilder.buildPackage(results, settings);
                
                // Generate final ZIP
                await this.updateProgress({ stage: 'finalizing', percent: 98 });
                this.finalPackage = await packageZip.generateAsync({ type: 'blob' });
                
                // Track successful completion
                if (window.analytics) {
                    window.analytics.trackProcessingComplete(
                        results.processed,
                        Date.now() - this.startTime,
                        this.finalPackage.size
                    );
                }
            } catch (packageError) {
                logger.warn('Package creation failed, continuing without ZIP:', packageError);
                this.finalPackage = null;
                
                // Still track processing completion even without package
                if (window.analytics) {
                    window.analytics.trackProcessingComplete(
                        results.processed,
                        Date.now() - this.startTime,
                        0
                    );
                }
            }
            
            // Show completion regardless of packaging success
            config.log('Processing complete, showing completion panel:', results);
            this.showCompletion(results);
            
        } catch (error) {
            logger.error('Processing error:', error);
            logger.error('Error stack:', error.stack);
            
            // Track error
            if (window.analytics) {
                window.analytics.trackError('processing_error', error.message);
            }
            
            // Use error handler for better user experience
            window.errorHandler?.handleError('file_processing_error', error);
        } finally {
            this.processing = false;
            // Unlock UI after processing (ASAP-025)
            this.setProcessingUI(false);
        }
    }

    /**
     * Cancel ongoing processing
     */
    async cancelProcessing() {
        if (!this.processing) {
            return; // Nothing to cancel
        }

        try {
            // Show loading state on cancel button
            loadingStateManager.setButtonLoading('#cancelProcessingBtn', true);
            
            // Show confirmation dialog
            const confirmed = await this.showCancelConfirmation();
            if (!confirmed) {
                loadingStateManager.setButtonLoading('#cancelProcessingBtn', false);
                return; // User chose not to cancel
            }

            config.log('Cancelling processing...');

            // Set cancellation flag
            this.processing = false;
            this.cancelled = true;

            // Cancel performance optimizer processing
            if (performanceOptimizer) {
                performanceOptimizer.cancelProcessing();
            }

            // Cancel any ongoing progress persistence
            if (progressPersistence && this.currentSessionId) {
                await progressPersistence.deleteSession(this.currentSessionId);
            }

            // Update UI to cancelled state
            this.updateProgress({
                stage: 'cancelled',
                currentFile: 'Processing cancelled by user',
                percent: 0,
                current: 0
            });

            // Clear processing data
            this.currentFiles = [];
            this.processor = null;
            this.packageBuilder = null;
            this.startTime = null;
            this.currentSessionId = null;

            // Show cancellation message
            this.showPanel('dropZone');
            this.updatePanelMessage('dropZone', 
                '❌ Processing was cancelled. You can start over by selecting photos again.'
            );

            // Track cancellation in analytics
            if (window.analytics) {
                window.analytics.trackError('processing_cancelled', 'User cancelled processing');
            }

        } catch (error) {
            logger.error('Error during cancellation:', error);
            window.errorHandler?.handleError('cancellation_error', error);
        } finally {
            // Clear cancel button loading state
            loadingStateManager.setButtonLoading('#cancelProcessingBtn', false);
        }
    }

    /**
     * Show cancel confirmation dialog
     */
    async showCancelConfirmation() {
        return new Promise((resolve) => {
            if (!window.errorHandler) {
                // Fallback to native confirm
                resolve(confirm('Are you sure you want to cancel processing? All progress will be lost.'));
                return;
            }

            // Create custom confirmation modal
            const modal = document.createElement('div');
            modal.className = 'cancel-confirmation-overlay';
            modal.innerHTML = `
                <div class="cancel-confirmation-modal">
                    <div class="cancel-confirmation-header">
                        <h3>⚠️ Cancel Processing?</h3>
                    </div>
                    <div class="cancel-confirmation-body">
                        <p>Are you sure you want to cancel processing?</p>
                        <p><strong>All progress will be lost</strong> and you'll need to start over.</p>
                    </div>
                    <div class="cancel-confirmation-actions">
                        <button id="confirmCancel" class="btn btn-danger">Yes, Cancel</button>
                        <button id="continueProcessing" class="btn btn-secondary">Continue Processing</button>
                    </div>
                </div>
            `;

            // Add styles
            if (!document.getElementById('cancel-confirmation-styles')) {
                const styles = document.createElement('style');
                styles.id = 'cancel-confirmation-styles';
                styles.textContent = `
                    .cancel-confirmation-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.8);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 10001;
                    }
                    .cancel-confirmation-modal {
                        background: linear-gradient(135deg, #2a2a2a, #1f1f1f);
                        border: 2px solid #ff4444;
                        border-radius: 12px;
                        max-width: 400px;
                        width: 90%;
                        box-shadow: 0 20px 40px rgba(255, 68, 68, 0.3);
                    }
                    .cancel-confirmation-header {
                        padding: 20px;
                        border-bottom: 1px solid rgba(255, 68, 68, 0.2);
                    }
                    .cancel-confirmation-header h3 {
                        margin: 0;
                        color: #ff4444;
                        text-align: center;
                    }
                    .cancel-confirmation-body {
                        padding: 20px;
                        color: #cccccc;
                        text-align: center;
                    }
                    .cancel-confirmation-body strong {
                        color: #ff4444;
                    }
                    .cancel-confirmation-actions {
                        padding: 20px;
                        border-top: 1px solid rgba(255, 68, 68, 0.2);
                        display: flex;
                        gap: 10px;
                        justify-content: center;
                    }
                `;
                document.head.appendChild(styles);
            }

            // Add event listeners
            modal.querySelector('#confirmCancel').addEventListener('click', () => {
                modal.remove();
                resolve(true);
            });

            modal.querySelector('#continueProcessing').addEventListener('click', () => {
                modal.remove();
                resolve(false);
            });

            // Close on outside click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                    resolve(false);
                }
            });

            document.body.appendChild(modal);
        });
    }

    /**
     * Comprehensive UI state management during processing (ASAP-025)
     */
    setProcessingUI(processing) {
        // Disable/enable start processing button
        loadingStateManager.setButtonLoading('#startProcessingBtn', processing);
        
        // Disable/enable file selection to prevent changes during processing
        const fileSelectBtn = document.getElementById('selectFolderBtn');
        const fileInput = document.getElementById('fileInput');
        const dropZone = document.getElementById('dropZone');
        
        if (fileSelectBtn) fileSelectBtn.disabled = processing;
        if (fileInput) fileInput.disabled = processing;
        if (dropZone) {
            dropZone.style.pointerEvents = processing ? 'none' : 'auto';
            dropZone.classList.toggle('disabled', processing);
        }
        
        // Disable/enable all form inputs to prevent configuration changes during processing
        const formSelectors = [
            '#projectName', '#studioName', '#studioWebsite', '#studioEmail',
            '#includeOriginals', '#originalsAction', '#includeRaw', '#rawAction',
            '#generateOptimizedJPG', '#generateOptimizedWebP',
            '#generateCompressedJPG', '#generateCompressedWebP',
            '#optimizedQuality', '#compressedQuality', '#compressedMaxDimension'
        ];
        
        formSelectors.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.disabled = processing;
                element.classList.toggle('processing-disabled', processing);
            }
        });
        
        // Visual feedback for processing state
        const configPanel = document.getElementById('configPanel');
        if (configPanel) {
            configPanel.classList.toggle('processing-locked', processing);
        }
        
        config.log(`UI processing state: ${processing ? 'LOCKED' : 'UNLOCKED'}`);
    }

    /**
     * Get processing settings from UI
     */
    getProcessingSettings() {
        // Collect and sanitize all user inputs (ASAP-021)
        const rawInputs = {
            projectName: document.getElementById('projectName').value.trim(),
            studioName: document.getElementById('studioName').value.trim() || 'Your Studio',
            studioWebsite: document.getElementById('studioWebsite').value.trim() || 'https://yourstudio.com',
            studioEmail: document.getElementById('studioEmail').value.trim() || 'contact@yourstudio.com'
        };
        
        return {
            projectName: domSanitizer.sanitizeFileName(rawInputs.projectName),
            studioName: domSanitizer.sanitizeText(rawInputs.studioName),
            studioWebsite: domSanitizer.sanitizeText(rawInputs.studioWebsite),
            studioEmail: domSanitizer.sanitizeText(rawInputs.studioEmail),
            
            includeOriginals: document.getElementById('includeOriginals').checked,
            originalsAction: document.getElementById('originalsAction').value,
            includeRaw: document.getElementById('includeRaw').checked,
            rawAction: document.getElementById('rawAction').value,
            generateOptimizedJPG: document.getElementById('generateOptimizedJPG').checked,
            generateOptimizedWebP: document.getElementById('generateOptimizedWebP').checked,
            generateCompressedJPG: document.getElementById('generateCompressedJPG').checked,
            generateCompressedWebP: document.getElementById('generateCompressedWebP').checked,
            
            optimizedQuality: parseInt(document.getElementById('optimizedQuality').value),
            compressedQuality: parseInt(document.getElementById('compressedQuality').value),
            compressedMaxDimension: parseInt(document.getElementById('compressedMaxDimension').value),
            exifHandling: document.getElementById('exifHandling').value
        };
    }

    /**
     * Update progress display
     */
    async updateProgress(progress) {
        const currentFileEl = document.getElementById('currentFile');
        const progressCountEl = document.getElementById('progressCount');
        const progressBarEl = document.getElementById('progressBar');
        const progressPercentEl = document.getElementById('progressPercent');
        const timeRemainingEl = document.getElementById('timeRemaining');
        const filesProcessedEl = document.getElementById('filesProcessed');
        const totalSizeEl = document.getElementById('totalSize');
        const processingSpeedEl = document.getElementById('processingSpeed');
        
        if (progress.stage === 'packaging') {
            currentFileEl.textContent = 'Creating package structure...';
        } else if (progress.stage === 'finalizing') {
            currentFileEl.textContent = 'Finalizing ZIP file...';
        } else if (progress.currentFile) {
            currentFileEl.textContent = progress.currentFile;
        }
        
        if (progress.current && progress.total) {
            progressCountEl.textContent = `${progress.current} / ${progress.total}`;
            filesProcessedEl.textContent = progress.current.toString();
        }
        
        if (progress.percent) {
            progressBarEl.style.width = `${progress.percent}%`;
            progressPercentEl.textContent = `${progress.percent}%`;
        }
        
        // Calculate time remaining
        if (progress.elapsed && progress.current && progress.total) {
            const timePerFile = progress.elapsed / progress.current;
            const remainingFiles = progress.total - progress.current;
            const remainingTime = Math.round(remainingFiles * timePerFile / 1000);
            
            if (remainingTime > 60) {
                const minutes = Math.floor(remainingTime / 60);
                const seconds = remainingTime % 60;
                timeRemainingEl.textContent = `${minutes}m ${seconds}s remaining`;
            } else {
                timeRemainingEl.textContent = `${remainingTime}s remaining`;
            }
            
            // Processing speed
            const filesPerMinute = Math.round((progress.current / progress.elapsed) * 60000);
            processingSpeedEl.textContent = `${filesPerMinute} files/min`;
        }
        
        // Total size
        const totalSizeMB = Math.round(this.currentFiles.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024);
        totalSizeEl.textContent = `${totalSizeMB} MB`;
    }

    /**
     * Reset progress display
     */
    resetProgress() {
        document.getElementById('currentFile').textContent = 'Initializing...';
        document.getElementById('progressCount').textContent = `0 / ${this.currentFiles.length}`;
        document.getElementById('progressBar').style.width = '0%';
        document.getElementById('progressPercent').textContent = '0%';
        document.getElementById('timeRemaining').textContent = 'Calculating...';
        document.getElementById('filesProcessed').textContent = '0';
        document.getElementById('processingSpeed').textContent = '0 files/min';
    }

    /**
     * Show error message with retry option
     */
    showError(error) {
        const errorMessage = `Processing failed: ${error.message}\n\nWould you like to try again or start over?`;
        const retry = confirm(errorMessage);
        
        if (retry) {
            // Reset to config panel to allow user to try again
            this.showPanel('configPanel');
        } else {
            // Start completely over
            this.startOver();
        }
    }

    /**
     * Show completion panel
     */
    showCompletion(results) {
        const processingTime = Date.now() - this.startTime;
        
        // Update completion stats
        document.getElementById('finalFileCount').textContent = results.processed.toString();
        
        const minutes = Math.floor(processingTime / 60000);
        const seconds = Math.floor((processingTime % 60000) / 1000);
        document.getElementById('finalProcessingTime').textContent = `${minutes}m ${seconds}s`;
        
        // Show package info or processing status
        const downloadBtn = document.getElementById('downloadPackageBtn');
        if (this.finalPackage && this.finalPackage.size) {
            document.getElementById('finalPackageSize').textContent = `${Math.round(this.finalPackage.size / 1024 / 1024)} MB`;
            downloadBtn.textContent = '📦 Download Complete Package';
            downloadBtn.disabled = false;
            downloadBtn.style.opacity = '1';
        } else {
            document.getElementById('finalPackageSize').textContent = 'Package creation failed';
            downloadBtn.textContent = '⚠️ Download Unavailable (Check Console)';
            downloadBtn.disabled = true;
            downloadBtn.style.opacity = '0.6';
        }
        
        // Store processed results for potential individual file downloads
        this.processedResults = results;
        
        // Announce completion to screen readers
        if (window.accessibilityManager) {
            window.accessibilityManager.announceCompletion(results.processed, processingTime);
        }
        
        this.showPanel('completionPanel');
    }

    /**
     * Download final package
     */
    downloadPackage() {
        // Show loading state on download button
        loadingStateManager.setButtonLoading('#downloadPackageBtn', true);
        
        try {
            if (!this.finalPackage) {
                window.errorHandler?.showWarning(
                    'Download Unavailable',
                    'The package creation failed. This is likely due to a missing dependency (JSZip). Check the browser console for details.'
                );
                loadingStateManager.setButtonLoading('#downloadPackageBtn', false);
                return;
            }
            
            const settings = this.getProcessingSettings();
            const fileName = `${settings.projectName || 'PhotoPackage'}_Complete.zip`;
        
            // Create download link
            const url = URL.createObjectURL(this.finalPackage);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.click();
            
            // Clean up
            URL.revokeObjectURL(url);
            
            // Track successful download
            if (window.analytics) {
                window.analytics.trackFeatureUsage('package_downloaded', this.finalPackage.size);
            }
        } catch (error) {
            logger.error('Download failed:', error);
            window.errorHandler?.handleError('download_error', error);
        } finally {
            // Clear loading state
            loadingStateManager.setButtonLoading('#downloadPackageBtn', false);
        }
    }

    /**
     * Start over with new files
     */
    startOver() {
        // CRITICAL: Cleanup memory leaks before reset
        this.cleanup();
        
        // Reset state
        this.currentFiles = [];
        this.processor = null;
        this.packageBuilder = null;
        this.processing = false;
        this.finalPackage = null;
        
        // Reset UI
        this.showPanel('dropZone');
        document.getElementById('folderInput').value = '';
    }

    /**
     * Perform memory pre-check before batch processing
     */
    performMemoryPreCheck() {
        // Get current memory statistics
        const memStats = window.memoryMonitor?.getMemoryStats();
        if (!memStats || !memStats.supported) {
            // If memory API not supported, allow processing but log warning
            logger.warn('Memory monitoring not supported - proceeding without pre-check');
            return { canProceed: true, message: 'Memory monitoring unavailable' };
        }

        const currentUsage = memStats.current.usagePercent;
        const fileCount = this.currentFiles.length;
        const totalFileSizeMB = this.currentFiles.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024);
        
        // Estimate memory requirements
        // Rule of thumb: processing requires ~3-4x file size in memory (original + processed + canvas buffers)
        const estimatedMemoryMB = totalFileSizeMB * 4;
        const availableMemoryMB = (memStats.current.limitMB - memStats.current.usedMB);
        
        // Calculate predicted peak usage
        const predictedUsagePercent = currentUsage + ((estimatedMemoryMB / memStats.current.limitMB) * 100);
        
        config.log(`Memory pre-check: Current ${currentUsage.toFixed(1)}%, Estimated need ${estimatedMemoryMB.toFixed(0)}MB, Predicted peak ${predictedUsagePercent.toFixed(1)}%`);
        
        // Check against thresholds
        if (predictedUsagePercent > 90) {
            return {
                canProceed: false,
                message: `Insufficient memory for batch processing. Current usage: ${currentUsage.toFixed(1)}%, Estimated peak: ${predictedUsagePercent.toFixed(1)}%. Please process fewer files (current: ${fileCount}, recommended: ${Math.max(1, Math.floor(fileCount / 3))}) or close other applications.`
            };
        }
        
        if (predictedUsagePercent > 80) {
            // Warning level - suggest smaller batch but allow processing
            const recommendedCount = Math.max(1, Math.floor(fileCount / 2));
            logger.warn(`Memory warning: Predicted usage ${predictedUsagePercent.toFixed(1)}%. Consider processing ${recommendedCount} files at a time instead of ${fileCount}.`);
        }
        
        // Additional checks for large batches using config values
        const maxBatchSize = config.get('processing.maxBatchSize', 100);
        const maxFileSizeMB = config.get('processing.maxFileSizeMB', 500);
        
        if (fileCount > maxBatchSize) {
            return {
                canProceed: false,
                message: `Large batch detected (${fileCount} files). Please process ${maxBatchSize} files or fewer at a time to prevent memory issues and browser crashes.`
            };
        }
        
        if (totalFileSizeMB > maxFileSizeMB) {
            return {
                canProceed: false,
                message: `Large file size detected (${totalFileSizeMB.toFixed(0)}MB total). Please process ${maxFileSizeMB}MB or less at a time to prevent memory issues.`
            };
        }
        
        return { 
            canProceed: true, 
            message: `Memory pre-check passed. Predicted peak usage: ${predictedUsagePercent.toFixed(1)}%` 
        };
    }

    /**
     * CRITICAL: Cleanup method to prevent memory leaks
     */
    /**
     * Remove all tracked event listeners
     */
    removeAllEventListeners() {
        this.eventListeners.forEach(({ element, event, handler, options }) => {
            try {
                element.removeEventListener(event, handler, options);
            } catch (e) {
                logger.warn('Failed to remove event listener:', e);
            }
        });
        this.eventListeners = [];
    }

    cleanup() {
        // Enhanced session cleanup for proper resource management (ASAP-033)
        
        // Remove all tracked event listeners
        this.removeAllEventListeners();
        
        // Cleanup final package blob URL
        if (this.finalPackage && this.finalPackage instanceof Blob) {
            URL.revokeObjectURL(this.finalPackage);
            this.finalPackage = null;
        }
        
        // Cleanup all object URLs that might be lingering
        this.currentFiles.forEach(file => {
            if (file.url && file.url.startsWith('blob:')) {
                URL.revokeObjectURL(file.url);
            }
        });
        
        // Cleanup performance optimizer
        if (performanceOptimizer && typeof performanceOptimizer.cleanup === 'function') {
            performanceOptimizer.cleanup();
        }
        
        // Cleanup memory monitor
        if (memoryMonitor && typeof memoryMonitor.cleanup === 'function') {
            memoryMonitor.cleanup();
        }
        
        // Cleanup error handler
        if (window.errorHandler && typeof window.errorHandler.cleanup === 'function') {
            window.errorHandler.cleanup();
        }
        
        // Cleanup all UI managers (ASAP-033)
        if (window.tooltipManager && typeof window.tooltipManager.cleanup === 'function') {
            window.tooltipManager.cleanup();
        }
        
        if (window.dragDropManager && typeof window.dragDropManager.cleanup === 'function') {
            window.dragDropManager.cleanup();
        }
        
        if (window.analytics && typeof window.analytics.cleanup === 'function') {
            window.analytics.cleanup();
        }
        
        if (window.focusManager && typeof window.focusManager.cleanup === 'function') {
            window.focusManager.cleanup();
        }
        
        if (window.loadingStateManager && typeof window.loadingStateManager.cleanup === 'function') {
            window.loadingStateManager.cleanup();
        }
        
        if (window.keyboardShortcuts && typeof window.keyboardShortcuts.cleanup === 'function') {
            window.keyboardShortcuts.cleanup();
        }
        
        // Cleanup network utils (ASAP-037)
        if (networkUtils && typeof networkUtils.cleanup === 'function') {
            networkUtils.cleanup();
        }
        
        // Clear processing state
        this.processing = false;
        this.startTime = null;
        this.currentSessionId = null;
        this.resumingSession = false;
        
        // Clear stored progress persistence
        if (progressPersistence && typeof progressPersistence.clearSession === 'function') {
            progressPersistence.clearSession();
        }
        
        // Force garbage collection hint
        if (window.gc) {
            window.gc();
        }
        
        // Clear file references and processor instances
        this.currentFiles = [];
        this.processor = null;
        this.packageBuilder = null;
        
        logger.log('🧹 Session cleanup completed');
    }

    /**
     * Light cleanup for non-critical situations like page visibility changes (ASAP-033)
     */
    lightCleanup() {
        // Only cleanup memory-intensive resources, not the entire session
        
        // Force garbage collection hint
        if (window.gc) {
            window.gc();
        }
        
        // Clear any temporary blob URLs that aren't the final package
        this.currentFiles.forEach(file => {
            if (file.tempUrl && file.tempUrl.startsWith('blob:') && file.tempUrl !== this.finalPackage) {
                URL.revokeObjectURL(file.tempUrl);
                delete file.tempUrl;
            }
        });
        
        logger.log('🧹 Light cleanup completed (page visibility change)');
    }

    /**
     * Bind real-time input validation for immediate user feedback (ASAP-036)
     */
    bindInputValidation() {
        // Project name validation
        const projectNameInput = document.getElementById('projectName');
        if (projectNameInput) {
            this.addTrackedEventListener(projectNameInput, 'input', (e) => {
                this.validateInputInRealTime('projectName', e.target.value);
            });
        }

        // Studio name validation  
        const studioNameInput = document.getElementById('studioName');
        if (studioNameInput) {
            this.addTrackedEventListener(studioNameInput, 'input', (e) => {
                this.validateInputInRealTime('studioName', e.target.value);
            });
        }

        // Studio email validation
        const studioEmailInput = document.getElementById('studioEmail');
        if (studioEmailInput) {
            this.addTrackedEventListener(studioEmailInput, 'input', (e) => {
                this.validateInputInRealTime('studioEmail', e.target.value);
            });
        }

        // Studio website validation
        const studioWebsiteInput = document.getElementById('studioWebsite');
        if (studioWebsiteInput) {
            this.addTrackedEventListener(studioWebsiteInput, 'input', (e) => {
                this.validateInputInRealTime('studioWebsite', e.target.value);
            });
        }

        // Quality range validation
        const optimizedQualityInput = document.getElementById('optimizedQuality');
        if (optimizedQualityInput) {
            this.addTrackedEventListener(optimizedQualityInput, 'input', (e) => {
                this.validateQualityInRealTime('optimizedQuality', e.target.value);
            });
        }

        const compressedQualityInput = document.getElementById('compressedQuality');
        if (compressedQualityInput) {
            this.addTrackedEventListener(compressedQualityInput, 'input', (e) => {
                this.validateQualityInRealTime('compressedQuality', e.target.value);
            });
        }
    }

    /**
     * Validate individual input fields in real-time (ASAP-036)
     */
    validateInputInRealTime(fieldName, value) {
        let result;
        let errorElementId;
        
        switch (fieldName) {
            case 'projectName':
                result = inputValidator.validateProjectName(value);
                errorElementId = 'projectName-error';
                break;
            case 'studioName':
                result = inputValidator.validateStudioName(value);
                errorElementId = 'studioName-error';
                break;
            case 'studioEmail':
                result = inputValidator.validateEmail(value);
                errorElementId = 'studioEmail-error';
                break;
            case 'studioWebsite':
                result = inputValidator.validateUrl(value);
                errorElementId = 'studioWebsite-error';
                break;
        }
        
        if (result) {
            this.showFieldValidationResult(fieldName, result, errorElementId);
        }
    }

    /**
     * Validate quality settings in real-time (ASAP-036)
     */
    validateQualityInRealTime(fieldName, value) {
        let result;
        let errorElementId;
        
        switch (fieldName) {
            case 'optimizedQuality':
                result = inputValidator.validateQuality(value, 60, 95, 'Optimized quality');
                errorElementId = 'optimizedQuality-error';
                break;
            case 'compressedQuality':
                result = inputValidator.validateQuality(value, 30, 90, 'Compressed quality');
                errorElementId = 'compressedQuality-error';
                break;
        }
        
        if (result) {
            this.showFieldValidationResult(fieldName, result, errorElementId);
        }
    }

    /**
     * Show validation result for individual field (ASAP-036)
     */
    showFieldValidationResult(fieldName, result, errorElementId) {
        const inputElement = document.getElementById(fieldName);
        let errorElement = document.getElementById(errorElementId);
        
        // Create error element if it doesn't exist
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = errorElementId;
            errorElement.className = 'field-error';
            errorElement.style.cssText = 'color: #e74c3c; font-size: 12px; margin-top: 4px; display: none;';
            
            if (inputElement && inputElement.parentNode) {
                inputElement.parentNode.appendChild(errorElement);
            }
        }
        
        if (result.valid) {
            // Valid input - remove error styling
            inputElement?.classList.remove('input-error');
            inputElement?.classList.add('input-valid');
            errorElement.style.display = 'none';
        } else {
            // Invalid input - show error styling
            inputElement?.classList.remove('input-valid');
            inputElement?.classList.add('input-error');
            errorElement.textContent = result.errors[0] || 'Invalid input';
            errorElement.style.display = 'block';
        }
    }

    /**
     * Legacy method - beforeunload handling is now done in bindEvents()
     * with proper processing state awareness
     */

    /**
     * Show specific panel
     */
    showPanel(panelId) {
        const panels = ['dropZone', 'configPanel', 'progressPanel', 'completionPanel'];
        panels.forEach(id => {
            document.getElementById(id).style.display = id === panelId ? 'block' : 'none';
        });
        
        // Update accessibility information
        if (window.accessibilityManager) {
            window.accessibilityManager.updatePanelVisibility(panelId);
        }
    }

    /**
     * Update range slider value display
     */
    updateRangeValue(rangeName) {
        const range = document.getElementById(rangeName);
        const valueSpan = document.getElementById(rangeName + 'Value');
        if (range && valueSpan) {
            valueSpan.textContent = range.value;
        }
    }

    /**
     * Generate default project name based on current date
     */
    generateDefaultProjectName() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        return `PhotoShoot_${year}-${month}-${day}`;
    }

    /**
     * Load saved settings from localStorage
     */
    loadSavedSettings() {
        try {
            const saved = localStorage.getItem('photopackager-settings');
            if (saved) {
                const settings = JSON.parse(saved);
                
                // Restore settings to UI
                Object.keys(settings).forEach(key => {
                    const element = document.getElementById(key);
                    if (element) {
                        if (element.type === 'checkbox') {
                            element.checked = settings[key];
                        } else {
                            element.value = settings[key];
                        }
                    }
                });
                
                // Update range displays
                this.updateRangeValue('optimizedQuality');
                this.updateRangeValue('compressedQuality');
            }
        } catch (error) {
            logger.error('Error loading saved settings:', error);
        }
    }

    /**
     * Save current settings to localStorage
     */
    saveSettings() {
        try {
            const settings = this.getProcessingSettings();
            localStorage.setItem('photopackager-settings', JSON.stringify(settings));
        } catch (error) {
            logger.error('Error saving settings:', error);
        }
    }
    
    /**
     * Bind feature usage tracking events
     */
    bindFeatureTracking() {
        // Track checkbox changes
        const checkboxes = [
            'includeOriginals', 'includeRaw', 'generateOptimizedJPG',
            'generateOptimizedWebP', 'generateCompressedJPG', 'generateCompressedWebP'
        ];
        
        checkboxes.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.addTrackedEventListener(element, 'change', (e) => {
                    if (window.analytics) {
                        window.analytics.trackFeatureUsage(id, e.target.checked);
                    }
                });
            }
        });
        
        // Track select changes
        const selects = [
            'originalsAction', 'rawAction', 'compressedMaxDimension', 'exifHandling'
        ];
        
        selects.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.addTrackedEventListener(element, 'change', (e) => {
                    if (window.analytics) {
                        window.analytics.trackFeatureUsage(id, e.target.value);
                    }
                });
            }
        });
        
        // Track quality slider changes (debounced)
        const qualitySliders = ['optimizedQuality', 'compressedQuality'];
        let debounceTimeout = {};
        
        qualitySliders.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.addTrackedEventListener(element, 'input', (e) => {
                    clearTimeout(debounceTimeout[id]);
                    debounceTimeout[id] = setTimeout(() => {
                        if (window.analytics) {
                            window.analytics.trackFeatureUsage(id, parseInt(e.target.value));
                        }
                    }, 1000); // 1 second debounce
                });
            }
        });
    }
    
    /**
     * Check for resumable sessions on app start
     */
    async checkForResumableSessions() {
        try {
            // Show global loading while checking for sessions
            loadingStateManager.showGlobalLoading('Checking for resumable sessions...');
            
            const resumableSessions = await progressPersistence.checkForResumableSessions();
            
            if (resumableSessions.length > 0) {
                // Show resume dialog
                const result = await progressPersistence.showResumeDialog(resumableSessions);
                
                if (result.action === 'resume' && result.sessionId) {
                    await this.resumeSession(result.sessionId);
                } else {
                    // Clean up if user chose to start new
                    await progressPersistence.cleanupOldSessions();
                }
            }
        } catch (error) {
            logger.error('Failed to check for resumable sessions:', error);
        } finally {
            // Hide global loading
            loadingStateManager.hideGlobalLoading();
        }
    }

    /**
     * Resume a processing session
     */
    async resumeSession(sessionId) {
        try {
            // Show loading while resuming session
            loadingStateManager.showGlobalLoading('Resuming session...');
            
            const sessionData = await progressPersistence.resumeSession(sessionId);
            
            // Restore session state
            this.currentSessionId = sessionId;
            this.resumingSession = true;
            
            // Note: File objects can't be serialized, so we'll show a message
            // asking the user to re-select the same folder
            window.errorHandler?.showWarning(
                'Resume Session',
                'To resume processing, please re-select the same photo folder you were processing before.',
                [{
                    text: 'Select Folder',
                    action: () => {
                        this.resumeFromFolderSelection(sessionData);
                    }
                }]
            );
            
        } catch (error) {
            logger.error('Failed to resume session:', error);
            window.errorHandler?.handleError('session_resume_error', error);
        }
    }

    /**
     * Resume from folder selection with session data
     */
    resumeFromFolderSelection(sessionData) {
        try {
            // Validate session data
            if (!sessionData || !sessionData.settings) {
                throw new Error('Invalid session data');
            }

            // Restore settings
            this.restoreSettings(sessionData.settings);
            
            // Set resume flag for when files are selected
            this.resumeSessionData = sessionData;
            this.resumingSession = true;
            
            // Show guidance message
            this.showPanel('dropZone');
            this.updatePanelMessage('dropZone', 
                `🔄 Resuming session with ${sessionData.files?.length || 0} files. Please select the same folder to continue.`
            );
            
            // Trigger folder selection
            const selectBtn = document.getElementById('selectFolderBtn');
            if (selectBtn) {
                selectBtn.click();
            } else {
                throw new Error('Folder selection button not found');
            }

        } catch (error) {
            logger.error('Failed to resume from folder selection:', error);
            window.errorHandler?.handleError('resume_folder_error', error);
            
            // Reset resume state on error
            this.resumingSession = false;
            this.resumeSessionData = null;
        } finally {
            // Hide loading overlay
            loadingStateManager.hideGlobalLoading();
        }
    }

    /**
     * Handle session resume after files are selected
     */
    /**
     * Handle session resume with enhanced file validation
     * HIGH-011: Improved file matching and validation logic
     */
    async handleSessionResume() {
        try {
            const sessionData = this.resumeSessionData;
            
            logger.info('Handling session resume with file validation...');
            
            // HIGH-011: Enhanced file validation with multiple criteria
            const sessionFileCount = sessionData.files?.length || 0;
            const selectedFileCount = this.currentFiles.length;
            
            // Create file signatures for matching (name + size)
            const sessionFileSignatures = new Set();
            const selectedFileSignatures = new Set();
            
            if (sessionData.files) {
                sessionData.files.forEach(file => {
                    sessionFileSignatures.add(`${file.name}_${file.size || 0}`);
                });
            }
            
            this.currentFiles.forEach(file => {
                selectedFileSignatures.add(`${file.name}_${file.size}`);
            });
            
            // Calculate match percentage
            const matchingFiles = new Set([...sessionFileSignatures].filter(sig => 
                selectedFileSignatures.has(sig)));
            const matchPercentage = sessionFileSignatures.size > 0 ? 
                (matchingFiles.size / sessionFileSignatures.size) * 100 : 0;
            
            logger.info(`File matching: ${matchingFiles.size}/${sessionFileSignatures.size} files match (${matchPercentage.toFixed(1)}%)`);
            
            // Determine validation result
            if (matchPercentage >= 80) {
                // Good match - proceed with resume
                logger.info('Good file match, proceeding with resume');
                this.proceedWithResume(sessionData);
                
            } else if (matchPercentage >= 50) {
                // Partial match - warn user but allow proceed
                window.errorHandler?.showWarning(
                    'Partial File Match',
                    `Only ${matchPercentage.toFixed(1)}% of session files match (${matchingFiles.size}/${sessionFileSignatures.size}). This might be a different folder or some files may have been moved. Continue anyway?`,
                    [
                        { text: 'Continue Resume', action: () => this.proceedWithResume(sessionData) },
                        { text: 'Start New Session', action: () => this.cancelResume() }
                    ]
                );
                
            } else {
                // Poor match - recommend starting new
                window.errorHandler?.showWarning(
                    'File Mismatch Detected',
                    `Very few files match the previous session (${matchPercentage.toFixed(1)}%). This appears to be a different folder. Starting a new session is recommended.`,
                    [
                        { text: 'Force Resume Anyway', action: () => this.proceedWithResume(sessionData) },
                        { text: 'Start New Session', action: () => this.cancelResume() }
                    ]
                );
            }
            
        } catch (error) {
            logger.error('Failed to handle session resume:', error);
            this.cancelResume();
        }
    }

    /**
     * Proceed with session resume
     * HIGH-011: Enhanced file matching and progress restoration
     */
    async proceedWithResume(sessionData) {
        try {
            logger.info('Proceeding with session resume...');
            
            // HIGH-011: More robust file matching using multiple criteria
            const completedFiles = new Set(sessionData.completedFiles || []);
            const originalFileCount = this.currentFiles.length;
            
            // Create a map of session files by name and size for better matching
            const sessionFiles = new Map();
            if (sessionData.files) {
                sessionData.files.forEach(file => {
                    const key = `${file.name}_${file.size || 0}`;
                    sessionFiles.set(key, file);
                });
            }
            
            // Filter out completed files with better matching
            this.currentFiles = this.currentFiles.filter(file => {
                const fileKey = `${file.name}_${file.size}`;
                const isCompleted = completedFiles.has(file.name) || 
                                   completedFiles.has(fileKey) ||
                                   sessionFiles.has(fileKey) && sessionFiles.get(fileKey).completed;
                
                if (isCompleted) {
                    logger.debug(`Skipping completed file: ${file.name}`);
                }
                
                return !isCompleted;
            });
            
            const remainingFileCount = this.currentFiles.length;
            const skippedCount = originalFileCount - remainingFileCount;
            
            logger.info(`Resume: ${originalFileCount} files selected, ${skippedCount} already completed, ${remainingFileCount} remaining`);
            
            // Update UI with remaining files
            this.updateFilesSummary();
            
            // HIGH-011: Enhanced resume confirmation with better messaging
            const remainingCount = this.currentFiles.length;
            const completedCount = skippedCount;
            
            if (remainingCount === 0) {
                // All files completed - session was already finished
                window.errorHandler?.showWarning(
                    'Session Already Complete',
                    `All ${completedCount} files from this session have already been processed. No additional processing needed.`,
                    [
                        { text: 'Start New Session', action: () => this.cancelResume() },
                        { text: 'View Results', action: () => this.showPanel('configPanel') }
                    ]
                );
            } else {
                // Files remaining - show resume options
                let message = `Session progress restored: ${completedCount} files completed, ${remainingCount} remaining.`;
                if (sessionData.settings) {
                    message += ' Previous settings have been restored.';
                }
                
                window.errorHandler?.showWarning(
                    'Ready to Resume Processing',
                    message,
                    [
                        { text: 'Resume Processing', action: () => this.startProcessing() },
                        { text: 'Review Settings', action: () => this.showPanel('configPanel') },
                        { text: 'Start New Instead', action: () => this.cancelResume() }
                    ]
                );
            }
            
            // Clear resume state flags
            this.resumingSession = false;
            
        } catch (error) {
            logger.error('Failed to proceed with resume:', error);
            this.cancelResume();
        }
    }

    /**
     * Cancel session resume
     */
    cancelResume() {
        this.resumingSession = false;
        this.resumeSessionData = null;
        this.currentSessionId = null;
        
        // Show normal config panel
        this.updateFilesSummary();
        this.showPanel('configPanel');
        
        // Clear any resume messages
        this.updatePanelMessage('dropZone', 'Drop your photos here or click to select');
    }

    /**
     * Update panel message (helper for resume guidance)
     */
    updatePanelMessage(panelId, message) {
        const panel = document.getElementById(panelId);
        if (panel) {
            const messageEl = panel.querySelector('.panel-message') || 
                             panel.querySelector('p') ||
                             panel.querySelector('.drop-text');
            if (messageEl) {
                messageEl.textContent = message;
                messageEl.style.color = '#00aeff';
                messageEl.style.fontWeight = 'bold';
            }
        }
    }

    /**
     * Restore settings from session data
     */
    restoreSettings(settings) {
        Object.keys(settings).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = settings[key];
                } else {
                    element.value = settings[key];
                }
            }
        });
        
        // Update range displays
        this.updateRangeValue('optimizedQuality');
        this.updateRangeValue('compressedQuality');
    }

    /**
     * Get current progress data for persistence
     */
    getCurrentProgressData() {
        if (!this.processing) return null;
        
        return {
            sessionId: this.currentSessionId,
            status: 'in_progress',
            files: this.currentFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
            settings: this.getProcessingSettings(),
            startTime: this.startTime,
            totalFiles: this.currentFiles.length,
            timestamp: Date.now()
        };
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.photoPackagerApp = new PhotoPackagerWebApp();
});