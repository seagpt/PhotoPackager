/**
 * main.js
 * PhotoPackager Web Edition - Main Application Controller
 * Handles UI interactions, file processing coordination, and user flow
 */

import { ImageProcessor } from './js/ImageProcessor.js';
import { PackageBuilder } from './js/PackageBuilder.js';
import { inputValidator } from './js/InputValidator.js';
import { progressPersistence } from './js/ProgressPersistence.js';

class PhotoPackagerWebApp {
    constructor() {
        this.currentFiles = [];
        this.processor = null;
        this.packageBuilder = null;
        this.processing = false;
        this.startTime = null;
        this.currentSessionId = null;
        this.resumingSession = false;
        
        // Initialize UI
        this.initializeUI();
        this.bindEvents();
        
        // Track feature usage for initial settings
        this.bindFeatureTracking();
        
        // Load saved settings
        this.loadSavedSettings();
        
        // Check for resumable sessions
        this.checkForResumableSessions();
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
        
        // Show initial panel
        this.showPanel('dropZone');
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
        dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        dropZone.addEventListener('drop', this.handleDrop.bind(this));
        
        // Folder selection
        selectFolderBtn.addEventListener('click', () => folderInput.click());
        folderInput.addEventListener('change', this.handleFolderSelect.bind(this));
        
        // Configuration events
        document.getElementById('optimizedQuality').addEventListener('input', (e) => 
            this.updateRangeValue('optimizedQuality'));
        document.getElementById('compressedQuality').addEventListener('input', (e) => 
            this.updateRangeValue('compressedQuality'));
        
        // Processing events
        document.getElementById('startProcessingBtn').addEventListener('click', 
            this.startProcessing.bind(this));
        
        // Completion events
        document.getElementById('downloadPackageBtn').addEventListener('click', 
            this.downloadPackage.bind(this));
        document.getElementById('startOverBtn').addEventListener('click', 
            this.startOver.bind(this));
    }

    /**
     * Handle drag over event
     */
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        document.getElementById('dropZone').classList.add('drag-over');
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
    }

    /**
     * Handle folder selection from input
     */
    handleFolderSelect(e) {
        const files = Array.from(e.target.files);
        this.handleFiles(files);
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
            console.log('File validation stats:', validation.stats);
            if (window.analytics) {
                window.analytics.trackFeatureUsage('files_selected', validation.stats.validCount);
            }
            
            // Announce to screen readers
            if (window.accessibilityManager) {
                const totalSize = this.currentFiles.reduce((sum, file) => sum + file.size, 0);
                window.accessibilityManager.announceFileSelection(this.currentFiles.length, totalSize);
            }
            
            // Update UI
            this.updateFilesSummary();
            this.showPanel('configPanel');
            
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
        console.log(`Found ${this.currentFiles.length} images (${sizeMB} MB total)`);
    }

    /**
     * Start processing images
     */
    async startProcessing() {
        if (this.processing) return;
        
        this.processing = true;
        this.startTime = Date.now();
        
        try {
            // Get and validate settings
            const rawSettings = this.getProcessingSettings();
            const validation = inputValidator.validateAllInputs(rawSettings);
            
            if (!validation.valid) {
                window.errorHandler?.handleError('settings_validation_error', new Error(validation.errors.join('\n')));
                this.processing = false;
                return;
            }
            
            const settings = validation.validatedData;
            
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
            
            // Build package
            await this.updateProgress({ stage: 'packaging', percent: 95 });
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
            
            // Show completion
            this.showCompletion(results);
            
        } catch (error) {
            console.error('Processing error:', error);
            
            // Track error
            if (window.analytics) {
                window.analytics.trackError('processing_error', error.message);
            }
            
            // Use error handler for better user experience
            window.errorHandler?.handleError('file_processing_error', error);
        } finally {
            this.processing = false;
        }
    }

    /**
     * Get processing settings from UI
     */
    getProcessingSettings() {
        return {
            projectName: document.getElementById('projectName').value.trim(),
            studioName: document.getElementById('studioName').value.trim() || 'Your Studio',
            studioWebsite: document.getElementById('studioWebsite').value.trim() || 'https://yourstudio.com',
            studioEmail: document.getElementById('studioEmail').value.trim() || 'contact@yourstudio.com',
            
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
        const packageStats = this.packageBuilder.getPackageStats();
        
        // Update completion stats
        document.getElementById('finalFileCount').textContent = results.processed.toString();
        
        const minutes = Math.floor(processingTime / 60000);
        const seconds = Math.floor((processingTime % 60000) / 1000);
        document.getElementById('finalProcessingTime').textContent = `${minutes}m ${seconds}s`;
        
        document.getElementById('finalPackageSize').textContent = `${Math.round(this.finalPackage.size / 1024 / 1024)} MB`;
        
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
        if (!this.finalPackage) return;
        
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
    }

    /**
     * Start over with new files
     */
    startOver() {
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
            console.error('Error loading saved settings:', error);
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
            console.error('Error saving settings:', error);
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
                element.addEventListener('change', (e) => {
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
                element.addEventListener('change', (e) => {
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
                element.addEventListener('input', (e) => {
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
            console.error('Failed to check for resumable sessions:', error);
        }
    }

    /**
     * Resume a processing session
     */
    async resumeSession(sessionId) {
        try {
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
            console.error('Failed to resume session:', error);
            window.errorHandler?.handleError('session_resume_error', error);
        }
    }

    /**
     * Resume from folder selection with session data
     */
    resumeFromFolderSelection(sessionData) {
        // Restore settings
        this.restoreSettings(sessionData.settings);
        
        // Set resume flag for when files are selected
        this.resumeSessionData = sessionData;
        
        // Trigger folder selection
        document.getElementById('selectFolderBtn').click();
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