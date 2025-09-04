/**
 * PhotoPackager Web Edition - Performance Optimization System
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
 * PerformanceOptimizer.js
 * Advanced performance optimization for handling large photo batches
 * Memory management, batch processing, and browser performance monitoring
 */

import { config } from './Config.js';
import { logger } from './Logger.js';

export class PerformanceOptimizer {
    constructor() {
        this.maxMemoryUsage = 0.8; // 80% of available memory
        this.batchSize = 10; // Process 10 files at a time initially
        this.adaptiveBatchSizing = true;
        this.processingQueue = [];
        this.completedFiles = [];
        this.failedFiles = [];
        this.currentBatch = [];
        this.isProcessing = false;
        this.lastProcessingTime = 0;
        this.memoryPressureDetected = false;
        this.pressureDetectionInterval = null;
        
        // ASAP-027: Race condition prevention
        this.processingLock = false;
        this.cancelRequested = false;
        this.pauseRequested = false;
        this.activePromises = new Set(); // Track active async operations
        this.processingId = null; // Unique ID for current processing session
        
        // Performance monitoring
        this.performanceMetrics = {
            filesProcessed: 0,
            totalProcessingTime: 0,
            averageFileTime: 0,
            memoryPeakUsage: 0,
            gcCount: 0,
            failureRate: 0
        };
        
        this.setupPerformanceMonitoring();
    }

    /**
     * Setup performance monitoring and memory management
     * HIGH-002: Added interval leak prevention
     */
    setupPerformanceMonitoring() {
        // HIGH-002: Prevent multiple intervals if called multiple times
        if (this.memoryMonitor) {
            clearInterval(this.memoryMonitor);
            this.memoryMonitor = null;
        }
        
        // Monitor memory usage
        this.memoryMonitor = setInterval(() => {
            this.checkMemoryUsage();
        }, 5000);

        // Monitor performance metrics - HIGH-001: Enhanced PerformanceObserver setup
        if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
            try {
                this.performanceObserver = new PerformanceObserver((list) => {
                    try {
                        this.analyzePerformanceEntries(list.getEntries());
                    } catch (e) {
                        logger.warn('Error analyzing performance entries:', e);
                    }
                });
                
                this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
                logger.info('PerformanceObserver initialized successfully');
                
            } catch (e) {
                logger.warn('PerformanceObserver initialization failed:', e);
                this.performanceObserver = null; // Ensure it's null if creation failed
            }
        }

        // Detect memory pressure events
        if ('memory' in performance) {
            this.detectMemoryPressure();
        }

        // Cleanup on page unload
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                this.cleanup();
            });
        }
    }

    /**
     * Check current memory usage and adjust processing accordingly
     */
    checkMemoryUsage() {
        if (!('memory' in performance)) return { safe: true, usage: 0 };

        const memInfo = performance.memory;
        const usageRatio = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
        
        // Update peak usage
        if (usageRatio > this.performanceMetrics.memoryPeakUsage) {
            this.performanceMetrics.memoryPeakUsage = usageRatio;
        }

        // Check if we're approaching memory limits
        if (usageRatio > this.maxMemoryUsage) {
            this.memoryPressureDetected = true;
            this.reduceMemoryPressure();
            return { safe: false, usage: usageRatio };
        }

        // If memory usage is low, we can potentially increase batch size
        if (usageRatio < 0.5 && this.adaptiveBatchSizing) {
            this.adjustBatchSize('increase');
        }

        return { safe: true, usage: usageRatio };
    }

    /**
     * Detect memory pressure and adjust processing
     * HIGH-002: Added interval leak prevention
     */
    detectMemoryPressure() {
        // HIGH-002: Prevent multiple intervals if called multiple times
        if (this.pressureDetectionInterval) {
            clearInterval(this.pressureDetectionInterval);
            this.pressureDetectionInterval = null;
        }
        
        let lastUsage = 0;
        this.pressureDetectionInterval = setInterval(() => {
            if (!('memory' in performance)) return;
            
            const currentUsage = performance.memory.usedJSHeapSize;
            const growth = currentUsage - lastUsage;
            
            // If memory is growing rapidly, reduce batch size
            if (growth > 50 * 1024 * 1024) { // 50MB growth
                this.adjustBatchSize('decrease');
                this.suggestGarbageCollection();
            }
            
            lastUsage = currentUsage;
        }, 10000);
    }

    /**
     * Reduce memory pressure through various strategies
     */
    reduceMemoryPressure() {
        // Immediate actions
        this.adjustBatchSize('decrease');
        this.suggestGarbageCollection();
        this.clearUnusedCanvases();
        
        // Notify user if memory is critically low
        if (this.memoryPressureDetected) {
            window.errorHandler?.showWarning(
                'High Memory Usage',
                'Processing has been slowed to prevent browser crashes. Consider processing fewer files at once.',
                [{
                    text: 'Reduce File Count',
                    action: () => this.suggestFileReduction()
                }]
            );
        }
    }

    /**
     * Adjust batch size based on performance and memory
     */
    adjustBatchSize(direction) {
        const minBatch = 2;
        const maxBatch = 50;
        
        if (direction === 'decrease') {
            this.batchSize = Math.max(minBatch, Math.floor(this.batchSize * 0.7));
            config.log(`Reduced batch size to ${this.batchSize} due to memory pressure`);
        } else if (direction === 'increase') {
            this.batchSize = Math.min(maxBatch, Math.floor(this.batchSize * 1.3));
            config.log(`Increased batch size to ${this.batchSize} for better performance`);
        }
    }

    /**
     * HIGH-005: Aggressive garbage collection with multiple strategies
     */
    suggestGarbageCollection() {
        logger.debug('Suggesting garbage collection...');
        
        // Strategy 1: Force GC if available (Chrome DevTools, Node.js --expose-gc)
        if (this.forceGarbageCollection()) {
            return;
        }
        
        // Strategy 2: Create memory pressure patterns
        this.createMemoryPressure();
        
        // Strategy 3: Clear caches and temporary objects
        this.clearTemporaryReferences();
        
        // Strategy 4: Schedule delayed GC attempts
        this.scheduleDelayedGC();
    }

    /**
     * HIGH-005: Force garbage collection using multiple methods
     */
    forceGarbageCollection() {
        let gcForced = false;
        
        // Method 1: Standard window.gc (Chrome DevTools)
        if (window.gc && typeof window.gc === 'function') {
            try {
                window.gc();
                this.performanceMetrics.gcCount++;
                gcForced = true;
                logger.debug('Forced GC via window.gc()');
            } catch (e) {
                logger.debug('window.gc() failed:', e.message);
            }
        }
        
        // Method 2: Alternative GC methods (Experimental)
        if (!gcForced && window.CollectGarbage && typeof window.CollectGarbage === 'function') {
            try {
                window.CollectGarbage();
                gcForced = true;
                logger.debug('Forced GC via CollectGarbage()');
            } catch (e) {
                logger.debug('CollectGarbage() failed:', e.message);
            }
        }
        
        return gcForced;
    }

    /**
     * HIGH-005: Enhanced memory pressure with multiple patterns
     */
    createMemoryPressure() {
        // Pattern 1: Large array allocation/deallocation
        setTimeout(() => {
            const tempArrays = [];
            for (let i = 0; i < 20; i++) {
                tempArrays.push(new ArrayBuffer(2 * 1024 * 1024)); // 2MB each
            }
            tempArrays.length = 0; // Clear references
            logger.debug('Memory pressure created via large arrays');
        }, 0);
        
        // Pattern 2: Object creation/cleanup cycle  
        setTimeout(() => {
            const tempObjects = [];
            for (let i = 0; i < 1000; i++) {
                tempObjects.push({
                    data: new Uint8Array(1024), // 1KB each
                    timestamp: Date.now(),
                    id: Math.random()
                });
            }
            tempObjects.forEach(obj => {
                obj.data = null;
                obj.timestamp = null;
                obj.id = null;
            });
            tempObjects.length = 0;
            logger.debug('Memory pressure created via object cycling');
        }, 50);
    }

    /**
     * HIGH-005: Clear temporary references that might prevent GC
     */
    clearTemporaryReferences() {
        // Clear any cached canvases
        this.clearUnusedCanvases();
        
        // Clear processing queues of completed items
        this.completedFiles = this.completedFiles.filter(file => file.keepInMemory);
        this.failedFiles = this.failedFiles.filter(file => file.keepInMemory);
        
        // Clear old performance metrics
        if (this.performanceMetrics.history && this.performanceMetrics.history.length > 100) {
            this.performanceMetrics.history = this.performanceMetrics.history.slice(-50);
        }
        
        logger.debug('Cleared temporary references for GC');
    }

    /**
     * HIGH-005: Schedule multiple delayed GC attempts
     */
    scheduleDelayedGC() {
        // Multiple delayed attempts to catch GC opportunities
        const delays = [100, 500, 1000, 2000];
        
        delays.forEach(delay => {
            setTimeout(() => {
                this.forceGarbageCollection();
            }, delay);
        });
        
        logger.debug('Scheduled delayed GC attempts');
    }

    /**
     * HIGH-008: Perform comprehensive memory pre-check before batch processing
     */
    async performMemoryPreCheck(files) {
        logger.info('Performing memory pre-check for batch processing...');
        
        // Check 1: Current memory usage
        const currentMemory = this.getCurrentMemoryUsage();
        if (currentMemory.usagePercent > 70) {
            return {
                safe: false,
                reason: `Current memory usage is ${currentMemory.usagePercent.toFixed(1)}%. Please close other browser tabs or restart your browser to free up memory before processing large batches.`
            };
        }
        
        // Check 2: Estimate memory requirements for batch
        const memoryEstimate = this.estimateBatchMemoryUsage(files);
        const availableMemory = performance.memory ? 
            (performance.memory.jsHeapSizeLimit - performance.memory.usedJSHeapSize) / (1024 * 1024) : 
            1000; // Default 1GB if memory API unavailable
            
        if (memoryEstimate.totalMB > availableMemory * 0.8) { // Use 80% of available
            return {
                safe: false,
                reason: `Estimated memory needed: ${memoryEstimate.totalMB.toFixed(0)}MB, but only ${availableMemory.toFixed(0)}MB available. Try processing fewer files at once (current: ${files.length}, suggested: ${memoryEstimate.suggestedBatchSize}).`
            };
        }
        
        // Check 3: Individual file size warnings
        const largeFiles = files.filter(f => f.size > 50 * 1024 * 1024); // Files > 50MB
        if (largeFiles.length > 3) {
            return {
                safe: false,
                reason: `Too many large files detected (${largeFiles.length} files > 50MB). Large images require significant memory. Please process large files in smaller batches.`
            };
        }
        
        // Check 4: Browser-specific limits
        const browserLimits = this.getBrowserCanvasLimits();
        const potentiallyProblematicFiles = files.filter(file => {
            // Estimate if file might create large canvas (rough estimate: assume square image)
            const estimatedPixels = Math.sqrt(file.size / 3); // Rough RGB estimate
            return estimatedPixels > browserLimits.maxDimension * 0.8;
        });
        
        if (potentiallyProblematicFiles.length > 0) {
            logger.warn(`${potentiallyProblematicFiles.length} files may require canvas scaling due to size`);
        }
        
        logger.info(`Memory pre-check passed: ${memoryEstimate.totalMB.toFixed(0)}MB estimated, ${availableMemory.toFixed(0)}MB available`);
        
        return {
            safe: true,
            estimate: memoryEstimate,
            availableMemory,
            warnings: potentiallyProblematicFiles.length > 0 ? 
                [`${potentiallyProblematicFiles.length} large files will be automatically scaled down`] : []
        };
    }

    /**
     * HIGH-008: Estimate memory usage for a batch of files
     */
    estimateBatchMemoryUsage(files) {
        let totalEstimatedMB = 0;
        let maxSingleFileMB = 0;
        
        files.forEach(file => {
            // Rough memory estimation:
            // - File size (compressed) * 3 for RGB decompression
            // - Canvas operations require ~2-3x more memory temporarily
            // - Add overhead for processing, thumbnails, etc.
            const fileSizeMB = file.size / (1024 * 1024);
            const estimatedMemoryMB = fileSizeMB * 8; // Conservative multiplier
            
            totalEstimatedMB += estimatedMemoryMB;
            maxSingleFileMB = Math.max(maxSingleFileMB, estimatedMemoryMB);
        });
        
        // Add base processing overhead
        totalEstimatedMB += 50; // 50MB base overhead
        
        // Calculate suggested batch size if current estimate is too high
        const maxRecommendedMB = 800; // 800MB max recommended
        let suggestedBatchSize = files.length;
        if (totalEstimatedMB > maxRecommendedMB && files.length > 1) {
            suggestedBatchSize = Math.floor((maxRecommendedMB / totalEstimatedMB) * files.length);
            suggestedBatchSize = Math.max(1, suggestedBatchSize); // At least 1 file
        }
        
        return {
            totalMB: totalEstimatedMB,
            maxSingleFileMB,
            averageFileMB: totalEstimatedMB / files.length,
            suggestedBatchSize,
            fileCount: files.length
        };
    }

    /**
     * HIGH-008: Get current memory usage with fallback
     */
    getCurrentMemoryUsage() {
        if (performance.memory) {
            const usedMB = performance.memory.usedJSHeapSize / (1024 * 1024);
            const limitMB = performance.memory.jsHeapSizeLimit / (1024 * 1024);
            return {
                usedMB,
                limitMB,
                usagePercent: (usedMB / limitMB) * 100
            };
        }
        
        // Fallback: estimate based on general indicators
        return {
            usedMB: 200, // Conservative estimate
            limitMB: 1000,
            usagePercent: 20
        };
    }

    /**
     * Clear unused canvas elements and image references
     */
    clearUnusedCanvases() {
        // Find and clean up orphaned canvases
        const canvases = document.querySelectorAll('canvas');
        canvases.forEach(canvas => {
            if (!canvas.parentNode || canvas.parentNode === document.body) {
                canvas.width = canvas.height = 0;
                if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
            }
        });
    }

    /**
     * Process files in optimized batches
     * ASAP-027: Fixed race conditions with processing lock
     */
    async processFilesBatch(files, settings, progressCallback) {
        // ASAP-027: Prevent multiple concurrent processing sessions
        if (this.processingLock) {
            throw new Error('Processing already in progress. Please wait for current operation to complete.');
        }
        
        this.processingLock = true;
        this.cancelRequested = false;
        this.pauseRequested = false;
        this.processingId = `processing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        logger.info(`Starting processing session: ${this.processingId}`);
        
        // HIGH-008: Pre-check memory before starting batch processing
        const memoryCheck = await this.performMemoryPreCheck(files);
        if (!memoryCheck.safe) {
            this.processingLock = false;
            throw new Error(memoryCheck.reason);
        }
        
        try {
            this.processingQueue = [...files];
            this.completedFiles = [];
            this.failedFiles = [];
            this.isProcessing = true;
            
            const startTime = performance.now();
            let processedCount = 0;
        
            while (this.processingQueue.length > 0) {
                // ASAP-027: Check for cancellation/pause requests
                if (this.cancelRequested) {
                    logger.info(`Processing session ${this.processingId} cancelled by user`);
                    break;
                }
                
                if (this.pauseRequested) {
                    logger.info(`Processing session ${this.processingId} paused, waiting for resume`);
                    await this.waitForResume();
                    continue;
                }
                
                // Check memory before each batch
                const memoryCheck = this.checkMemoryUsage();
                if (!memoryCheck.safe) {
                    await this.waitForMemoryRecovery();
                }
                
                // Create current batch
                this.currentBatch = this.processingQueue.splice(0, this.batchSize);
                
                // Process batch with performance monitoring
                const batchStartTime = performance.now();
                const batchResults = await this.processBatch(this.currentBatch, settings, progressCallback, processedCount);
                const batchTime = performance.now() - batchStartTime;
                
                // Update metrics
                this.updatePerformanceMetrics(this.currentBatch.length, batchTime);
                
                // Merge results
                this.completedFiles.push(...batchResults.success);
                this.failedFiles.push(...batchResults.failed);
                processedCount += this.currentBatch.length;
                
                // Update progress
                if (progressCallback) {
                    const progress = {
                        current: processedCount,
                        total: files.length,
                        percent: Math.round((processedCount / files.length) * 90), // Max 90% during processing
                        elapsed: performance.now() - startTime,
                        currentFile: `Processed ${processedCount} of ${files.length} files`
                    };
                    await progressCallback(progress);
                }
                
                // Adaptive batch sizing based on performance
                if (this.adaptiveBatchSizing) {
                    this.adaptBatchSizeToPerformance(batchTime, this.currentBatch.length);
                }
                
                // Yield control to prevent UI blocking
                await this.yieldToMainThread();
            }
            
            const totalTime = performance.now() - startTime;
            
            logger.info(`Processing session ${this.processingId} completed: ${this.completedFiles.length} files processed, ${this.failedFiles.length} failed, ${totalTime.toFixed(2)}ms total`);
            
            return {
                success: this.completedFiles,
                failed: this.failedFiles,
                totalTime,
                cancelled: this.cancelRequested
            };
            
        } catch (error) {
            logger.error(`Processing session ${this.processingId} failed:`, error);
            throw error;
        } finally {
            // ASAP-027: Ensure cleanup happens regardless of success/failure
            this.isProcessing = false;
            this.processingLock = false;
            this.currentBatch = [];
            this.cancelRequested = false;
            this.pauseRequested = false;
            
            // Cancel any remaining promises
            this.activePromises.forEach(promise => {
                if (promise.cancel) {
                    promise.cancel();
                }
            });
            this.activePromises.clear();
            
            logger.info(`Processing session ${this.processingId} cleanup complete`);
            this.processingId = null;
        }
    }

    /**
     * Process a single batch of files
     */
    async processBatch(batch, settings, progressCallback, offset) {
        const success = [];
        const failed = [];
        
        // Use Promise.allSettled for parallel processing within batch
        const batchPromises = batch.map(async (file, index) => {
            try {
                performance.mark(`file-start-${offset + index}`);
                
                const result = await this.processFile(file, settings);
                
                performance.mark(`file-end-${offset + index}`);
                performance.measure(`file-processing-${offset + index}`, 
                    `file-start-${offset + index}`, `file-end-${offset + index}`);
                
                success.push({ file, result });
                
                // Update progress for individual file
                if (progressCallback) {
                    await progressCallback({
                        currentFile: file.name,
                        current: offset + index + 1
                    });
                }
                
            } catch (error) {
                failed.push({ file, error: error.message });
                logger.error(`Failed to process ${file.name}:`, error);
                
                // Track error in analytics
                if (window.analytics) {
                    window.analytics.trackError('file_processing_error', `${file.name}: ${error.message}`);
                }
            }
        });
        
        // Wait for all files in batch to complete
        await Promise.allSettled(batchPromises);
        
        return { success, failed };
    }

    /**
     * Calculate safe canvas dimensions based on available memory and browser limits
     */
    calculateCanvasLimits(originalWidth, originalHeight) {
        // Browser-specific canvas limits
        const browserLimits = this.getBrowserCanvasLimits();
        
        // Memory-based limits
        const memoryLimits = this.getMemoryBasedLimits();
        
        // Calculate effective limits
        const maxWidth = Math.min(browserLimits.maxDimension, memoryLimits.maxWidth, originalWidth);
        const maxHeight = Math.min(browserLimits.maxDimension, memoryLimits.maxHeight, originalHeight);
        const maxPixels = Math.min(browserLimits.maxPixels, memoryLimits.maxPixels);
        
        // Calculate scale factor needed
        let scale = 1;
        
        // Check dimension limits
        if (originalWidth > maxWidth || originalHeight > maxHeight) {
            scale = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
        }
        
        // Check pixel count limit
        const totalPixels = originalWidth * originalHeight;
        if (totalPixels > maxPixels) {
            const pixelScale = Math.sqrt(maxPixels / totalPixels);
            scale = Math.min(scale, pixelScale);
        }
        
        // Calculate final dimensions
        const finalWidth = Math.floor(originalWidth * scale);
        const finalHeight = Math.floor(originalHeight * scale);
        
        // Validate final dimensions
        if (finalWidth <= 0 || finalHeight <= 0) {
            throw new Error('Image dimensions too small after scaling');
        }
        
        // Log scaling if significant
        if (scale < 0.9) {
            config.log(`Scaling image from ${originalWidth}x${originalHeight} to ${finalWidth}x${finalHeight} (${(scale * 100).toFixed(1)}%) due to browser/memory limits`);
        }
        
        return {
            width: finalWidth,
            height: finalHeight,
            scale: scale,
            originalWidth,
            originalHeight,
            scalingApplied: scale < 1,
            scalingReason: this.getScalingReason(scale, originalWidth, originalHeight, maxWidth, maxHeight, maxPixels)
        };
    }

    /**
     * Get browser-specific canvas limits
     * HIGH-007: Enhanced with absolute maximum dimension limits
     */
    getBrowserCanvasLimits() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        // HIGH-007: Absolute maximum dimension limit to prevent browser crashes
        const ABSOLUTE_MAX_DIMENSION = 20000;
        const ABSOLUTE_MAX_PIXELS = 400000000; // 20000 * 20000
        
        // Default conservative limits
        let limits = {
            maxDimension: 8192,
            maxPixels: 67108864 // 8192 * 8192
        };
        
        // Browser-specific adjustments
        if (userAgent.includes('chrome')) {
            limits.maxDimension = 16384;
            limits.maxPixels = 268435456; // 16384 * 16384
        } else if (userAgent.includes('firefox')) {
            limits.maxDimension = 11180;
            limits.maxPixels = 124960000; // ~11180 * 11180
        } else if (userAgent.includes('safari')) {
            limits.maxDimension = 8192;
            limits.maxPixels = 67108864;
        } else if (userAgent.includes('edge')) {
            limits.maxDimension = 16384;
            limits.maxPixels = 268435456;
        }
        
        // Mobile adjustments
        if (this.isMobileDevice()) {
            limits.maxDimension = Math.min(limits.maxDimension, 4096);
            limits.maxPixels = Math.min(limits.maxPixels, 16777216); // 4096 * 4096
        }
        
        // HIGH-007: Apply absolute maximum limits to prevent crashes
        limits.maxDimension = Math.min(limits.maxDimension, ABSOLUTE_MAX_DIMENSION);
        limits.maxPixels = Math.min(limits.maxPixels, ABSOLUTE_MAX_PIXELS);
        
        logger.debug(`Canvas limits: ${limits.maxDimension}x${limits.maxDimension} max, ${Math.floor(limits.maxPixels / 1000000)}M pixels max`);
        
        return limits;
    }

    /**
     * Get memory-based canvas limits
     */
    getMemoryBasedLimits() {
        let memoryFactor = 1;
        
        // Check available memory
        if ('memory' in performance) {
            const memInfo = performance.memory;
            const usageRatio = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
            
            if (usageRatio > 0.8) {
                memoryFactor = 0.5; // Reduce to 50% when memory is tight
            } else if (usageRatio > 0.6) {
                memoryFactor = 0.75; // Reduce to 75% when memory is getting high
            }
        }
        
        // Base limits adjusted by memory factor
        const baseLimits = this.getBrowserCanvasLimits();
        
        return {
            maxWidth: Math.floor(baseLimits.maxDimension * memoryFactor),
            maxHeight: Math.floor(baseLimits.maxDimension * memoryFactor),
            maxPixels: Math.floor(baseLimits.maxPixels * memoryFactor)
        };
    }

    /**
     * Check if device is mobile
     */
    isMobileDevice() {
        return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent);
    }

    /**
     * Get human-readable scaling reason
     */
    getScalingReason(scale, origWidth, origHeight, maxWidth, maxHeight, maxPixels) {
        if (scale >= 1) return 'No scaling needed';
        
        const reasons = [];
        
        if (origWidth > maxWidth) reasons.push(`width exceeds limit (${origWidth} > ${maxWidth})`);
        if (origHeight > maxHeight) reasons.push(`height exceeds limit (${origHeight} > ${maxHeight})`);
        
        const totalPixels = origWidth * origHeight;
        if (totalPixels > maxPixels) {
            reasons.push(`pixel count exceeds limit (${totalPixels.toLocaleString()} > ${maxPixels.toLocaleString()})`);
        }
        
        return reasons.join(', ') || 'Memory conservation';
    }

    /**
     * Process a single file with memory-efficient canvas operations
     */
    async processFile(file, settings) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            let canvas = null;
            let ctx = null;
            let url = null;
            
            const cleanup = () => {
                if (canvas) {
                    canvas.width = canvas.height = 0;
                    canvas = null;
                    ctx = null;
                }
                if (url) {
                    URL.revokeObjectURL(url);
                    url = null;
                }
                img.src = '';
                img.onload = null;
                img.onerror = null;
            };
            
            img.onload = () => {
                try {
                    // Apply sophisticated canvas dimension limits
                    const dimensionLimits = this.calculateCanvasLimits(img.width, img.height);
                    const scale = dimensionLimits.scale;
                    
                    canvas = document.createElement('canvas');
                    canvas.width = dimensionLimits.width;
                    canvas.height = dimensionLimits.height;
                    
                    ctx = canvas.getContext('2d');
                    if (!ctx) {
                        const canvasError = new Error('Cannot create image processing canvas - your browser may be low on memory');
                        canvasError.isCanvasError = true;
                        throw canvasError;
                    }
                    
                    // Draw with memory-efficient settings
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'medium';
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    // Store dimensions before cleanup (with null checks)
                    const dimensions = {
                        width: canvas ? canvas.width : 0,
                        height: canvas ? canvas.height : 0
                    };
                    
                    // Generate result blob
                    if (!canvas) {
                        cleanup();
                        reject(new Error('Canvas was null before blob generation'));
                        return;
                    }
                    
                    canvas.toBlob((blob) => {
                        // Cleanup is done after we use the blob
                        if (blob) {
                            const result = {
                                name: file.name,
                                size: blob.size,
                                blob: blob,
                                width: dimensions.width,
                                height: dimensions.height
                            };
                            cleanup();
                            resolve(result);
                        } else {
                            cleanup();
                            const blobError = new Error(`Cannot create processed version of ${file.name} - the image may be corrupted or too large`);
                            blobError.isBlobError = true;
                            blobError.fileName = file.name;
                            reject(blobError);
                        }
                    }, 'image/jpeg', settings.optimizedQuality / 100);
                    
                } catch (error) {
                    cleanup();
                    reject(error);
                }
            };
            
            img.onerror = () => {
                cleanup();
                const loadError = new Error(`Cannot open ${file.name} - the file may be corrupted or in an unsupported format`);
                loadError.isLoadError = true;
                loadError.fileName = file.name;
                reject(loadError);
            };
            
            // Load image with object URL for memory efficiency
            url = URL.createObjectURL(file);
            img.src = url;
        });
    }

    /**
     * Wait for memory recovery before continuing processing
     */
    async waitForMemoryRecovery() {
        return new Promise((resolve) => {
            const checkMemory = () => {
                const memoryCheck = this.checkMemoryUsage();
                if (memoryCheck.safe || memoryCheck.usage < 0.7) {
                    this.memoryPressureDetected = false;
                    resolve();
                } else {
                    // Wait and try again
                    setTimeout(checkMemory, 2000);
                }
            };
            
            // Force garbage collection attempt
            this.suggestGarbageCollection();
            setTimeout(checkMemory, 1000);
        });
    }

    /**
     * Yield control to main thread to prevent UI blocking
     */
    async yieldToMainThread() {
        return new Promise(resolve => {
            if ('scheduler' in window && 'postTask' in window.scheduler) {
                // Use Scheduler API if available
                window.scheduler.postTask(() => resolve(), { priority: 'background' });
            } else {
                // Fallback to setTimeout
                setTimeout(resolve, 0);
            }
        });
    }

    /**
     * Adapt batch size based on processing performance
     */
    adaptBatchSizeToPerformance(batchTime, batchSize) {
        const timePerFile = batchTime / batchSize;
        const targetTimePerFile = 2000; // 2 seconds per file target
        
        if (timePerFile > targetTimePerFile * 1.5) {
            // Too slow, reduce batch size
            this.adjustBatchSize('decrease');
        } else if (timePerFile < targetTimePerFile * 0.5) {
            // Fast enough, can increase batch size
            this.adjustBatchSize('increase');
        }
    }

    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(filesCount, processingTime) {
        this.performanceMetrics.filesProcessed += filesCount;
        this.performanceMetrics.totalProcessingTime += processingTime;
        this.performanceMetrics.averageFileTime = this.performanceMetrics.totalProcessingTime / this.performanceMetrics.filesProcessed;
    }

    /**
     * Analyze performance entries for optimization
     */
    analyzePerformanceEntries(entries) {
        entries.forEach(entry => {
            if (entry.name.includes('file-processing')) {
                // Track individual file processing times
                const processingTime = entry.duration;
                if (processingTime > 5000) { // Slow file processing
                    logger.warn(`Slow file processing detected: ${processingTime}ms`);
                }
            }
        });
    }

    /**
     * Get current performance metrics
     */
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            currentBatchSize: this.batchSize,
            memoryPressure: this.memoryPressureDetected,
            queueLength: this.processingQueue.length,
            isProcessing: this.isProcessing
        };
    }

    /**
     * Suggest file count reduction based on performance
     */
    suggestFileReduction() {
        const memoryCheck = this.checkMemoryUsage();
        let suggestedMax = 100;
        
        if (memoryCheck.usage > 0.8) {
            suggestedMax = 25;
        } else if (memoryCheck.usage > 0.6) {
            suggestedMax = 50;
        } else if (memoryCheck.usage > 0.4) {
            suggestedMax = 75;
        }
        
        window.errorHandler?.showWarning(
            'Optimize File Count',
            `For optimal performance, consider processing ${suggestedMax} files or fewer at once based on your browser's memory capacity.`,
            [{
                text: 'Got It',
                action: () => {}
            }]
        );
    }

    /**
     * Cleanup resources (race-condition safe)
     * ASAP-027: Enhanced cleanup with race condition protection
     */
    cleanup() {
        logger.info(`Cleaning up PerformanceOptimizer${this.processingId ? ` for session: ${this.processingId}` : ''}`);
        
        // Clear memory monitoring interval
        if (this.memoryMonitor) {
            clearInterval(this.memoryMonitor);
            this.memoryMonitor = null;
        }
        
        // HIGH-001: Enhanced PerformanceObserver cleanup to prevent memory leaks
        if (this.performanceObserver) {
            try {
                this.performanceObserver.disconnect();
                logger.info('PerformanceObserver disconnected successfully');
            } catch (e) {
                // Observer might already be disconnected or in an invalid state
                logger.warn('PerformanceObserver disconnect failed (may already be disconnected):', e);
            } finally {
                // Always set to null to ensure garbage collection
                this.performanceObserver = null;
            }
        }
        
        // ASAP-027: Cancel any active processing first
        this.cancelRequested = true;
        this.pauseRequested = false;
        
        // Cancel active promises
        this.activePromises.forEach(promise => {
            if (promise.cancel) {
                promise.cancel();
            }
        });
        this.activePromises.clear();
        
        // Clear all processing data
        this.clearUnusedCanvases();
        this.processingQueue = [];
        this.currentBatch = [];
        this.completedFiles = [];
        this.failedFiles = [];
        this.isProcessing = false;
        this.processingLock = false;
        
        // Clear memory pressure detection interval
        if (this.pressureDetectionInterval) {
            clearInterval(this.pressureDetectionInterval);
            this.pressureDetectionInterval = null;
        }
        
        logger.info('PerformanceOptimizer cleanup complete');
        this.processingId = null;
    }

    /**
     * PUBLIC: Start memory monitoring (for testing and external control)
     * HIGH-002: Safe public interface to start monitoring
     */
    startMemoryMonitoring() {
        logger.info('Starting memory monitoring...');
        
        // Use existing setup method which has leak prevention
        if (!this.memoryMonitor) {
            this.memoryMonitor = setInterval(() => {
                this.checkMemoryUsage();
            }, 5000);
            logger.info('Memory monitoring started');
        } else {
            logger.warn('Memory monitoring already active');
        }
    }

    /**
     * PUBLIC: Stop memory monitoring (for testing and external control)
     * HIGH-002: Safe public interface to stop monitoring
     */
    stopMemoryMonitoring() {
        logger.info('Stopping memory monitoring...');
        
        if (this.memoryMonitor) {
            clearInterval(this.memoryMonitor);
            this.memoryMonitor = null;
            logger.info('Memory monitoring stopped');
        } else {
            logger.warn('Memory monitoring was not active');
        }
    }

    /**
     * PUBLIC: Check if instance is active (has intervals running)
     * HIGH-002: For testing memory leak prevention
     */
    get isActive() {
        return !!(this.memoryMonitor || this.pressureDetectionInterval);
    }

    /**
     * Pause processing (race-condition safe)
     * ASAP-027: Improved pause handling
     */
    pauseProcessing() {
        if (this.isProcessing) {
            logger.info(`Pausing processing session: ${this.processingId}`);
            this.pauseRequested = true;
            this.isProcessing = false;
        }
    }

    /**
     * Resume processing (race-condition safe)
     * ASAP-027: Improved resume handling
     */
    resumeProcessing() {
        if (this.pauseRequested && this.processingLock) {
            logger.info(`Resuming processing session: ${this.processingId}`);
            this.pauseRequested = false;
            this.isProcessing = true;
        }
    }

    /**
     * Cancel processing (race-condition safe)
     * ASAP-027: Improved cancel handling
     */
    cancelProcessing() {
        if (this.processingLock || this.isProcessing) {
            logger.info(`Cancelling processing session: ${this.processingId}`);
            this.cancelRequested = true;
            this.pauseRequested = false;
            this.isProcessing = false;
            
            // Clear queues to stop further processing
            this.processingQueue = [];
            this.currentBatch = [];
        }
    }

    /**
     * Wait for resume signal when paused
     * ASAP-027: New method for handling pause state
     */
    async waitForResume() {
        return new Promise((resolve) => {
            const checkResume = () => {
                if (!this.pauseRequested || this.cancelRequested) {
                    resolve();
                } else {
                    setTimeout(checkResume, 100); // Check every 100ms
                }
            };
            checkResume();
        });
    }

    /**
     * Update canvas limits from configuration
     */
    updateCanvasLimits(limits) {
        if (limits.maxWidth) {
            this.maxCanvasWidth = limits.maxWidth;
        }
        if (limits.maxHeight) {
            this.maxCanvasHeight = limits.maxHeight;
        }
        if (limits.maxPixels) {
            this.maxCanvasPixels = limits.maxPixels;
        }
        
        config.log(`Canvas limits updated: ${this.maxCanvasWidth}x${this.maxCanvasHeight}, max pixels: ${this.maxCanvasPixels.toLocaleString()}`);
    }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer();// Cache bust: 1756887424
