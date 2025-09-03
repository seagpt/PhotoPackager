/**
 * PerformanceOptimizer.js
 * Advanced performance optimization for handling large photo batches
 * Memory management, batch processing, and browser performance monitoring
 */

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
     */
    setupPerformanceMonitoring() {
        // Monitor memory usage
        this.memoryMonitor = setInterval(() => {
            this.checkMemoryUsage();
        }, 5000);

        // Monitor performance metrics
        if ('performance' in window && 'memory' in performance) {
            this.performanceObserver = new PerformanceObserver((list) => {
                this.analyzePerformanceEntries(list.getEntries());
            });
            
            try {
                this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
            } catch (e) {
                console.warn('PerformanceObserver not fully supported:', e);
            }
        }

        // Detect memory pressure events
        if ('memory' in performance) {
            this.detectMemoryPressure();
        }

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
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
     */
    detectMemoryPressure() {
        let lastUsage = 0;
        const checkInterval = setInterval(() => {
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
            console.log(`Reduced batch size to ${this.batchSize} due to memory pressure`);
        } else if (direction === 'increase') {
            this.batchSize = Math.min(maxBatch, Math.floor(this.batchSize * 1.3));
            console.log(`Increased batch size to ${this.batchSize} for better performance`);
        }
    }

    /**
     * Suggest garbage collection (non-blocking)
     */
    suggestGarbageCollection() {
        // Force garbage collection if available (Chrome DevTools)
        if (window.gc && typeof window.gc === 'function') {
            try {
                window.gc();
                this.performanceMetrics.gcCount++;
            } catch (e) {
                // GC not available or failed
            }
        }
        
        // Alternative: Create memory pressure to trigger GC
        this.createMemoryPressure();
    }

    /**
     * Create temporary memory pressure to encourage GC
     */
    createMemoryPressure() {
        // Create and release large objects to encourage GC
        setTimeout(() => {
            const tempArrays = [];
            for (let i = 0; i < 10; i++) {
                tempArrays.push(new ArrayBuffer(1024 * 1024)); // 1MB each
            }
            // Let them be garbage collected
            tempArrays.length = 0;
        }, 0);
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
     */
    async processFilesBatch(files, settings, progressCallback) {
        this.processingQueue = [...files];
        this.completedFiles = [];
        this.failedFiles = [];
        this.isProcessing = true;
        
        const startTime = performance.now();
        let processedCount = 0;
        
        try {
            while (this.processingQueue.length > 0) {
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
                        percent: Math.round((processedCount / files.length) * 100),
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
            
        } finally {
            this.isProcessing = false;
            this.currentBatch = [];
        }
        
        const totalTime = performance.now() - startTime;
        this.performanceMetrics.totalProcessingTime += totalTime;
        this.performanceMetrics.filesProcessed += processedCount;
        this.performanceMetrics.averageFileTime = this.performanceMetrics.totalProcessingTime / this.performanceMetrics.filesProcessed;
        this.performanceMetrics.failureRate = this.failedFiles.length / files.length;
        
        return {
            processed: this.completedFiles.length,
            failed: this.failedFiles.length,
            results: this.completedFiles,
            failures: this.failedFiles,
            metrics: this.performanceMetrics
        };
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
                console.error(`Failed to process ${file.name}:`, error);
                
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
     * Process a single file with memory-efficient canvas operations
     */
    async processFile(file, settings) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            let canvas = null;
            let ctx = null;
            
            const cleanup = () => {
                if (canvas) {
                    canvas.width = canvas.height = 0;
                    canvas = null;
                    ctx = null;
                }
                img.src = '';
            };
            
            img.onload = () => {
                try {
                    // Create canvas with size limits
                    const maxDimension = 4096; // Limit canvas size
                    const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
                    
                    canvas = document.createElement('canvas');
                    canvas.width = Math.floor(img.width * scale);
                    canvas.height = Math.floor(img.height * scale);
                    
                    ctx = canvas.getContext('2d');
                    if (!ctx) {
                        throw new Error('Could not create canvas context');
                    }
                    
                    // Draw with memory-efficient settings
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'medium';
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    // Generate result blob
                    canvas.toBlob((blob) => {
                        cleanup();
                        if (blob) {
                            resolve({
                                name: file.name,
                                size: blob.size,
                                blob: blob,
                                width: canvas.width,
                                height: canvas.height
                            });
                        } else {
                            reject(new Error('Failed to generate image blob'));
                        }
                    }, 'image/jpeg', settings.optimizedQuality / 100);
                    
                } catch (error) {
                    cleanup();
                    reject(error);
                }
            };
            
            img.onerror = () => {
                cleanup();
                reject(new Error(`Failed to load image: ${file.name}`));
            };
            
            // Load image with object URL for memory efficiency
            const url = URL.createObjectURL(file);
            img.src = url;
            
            // Clean up object URL after load
            img.addEventListener('load', () => URL.revokeObjectURL(url), { once: true });
            img.addEventListener('error', () => URL.revokeObjectURL(url), { once: true });
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
                    console.warn(`Slow file processing detected: ${processingTime}ms`);
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
     * Cleanup resources
     */
    cleanup() {
        if (this.memoryMonitor) {
            clearInterval(this.memoryMonitor);
        }
        
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }
        
        this.clearUnusedCanvases();
        this.processingQueue = [];
        this.currentBatch = [];
        this.completedFiles = [];
        this.failedFiles = [];
    }

    /**
     * Pause processing (for memory recovery or user intervention)
     */
    pauseProcessing() {
        this.isProcessing = false;
    }

    /**
     * Resume processing
     */
    resumeProcessing() {
        this.isProcessing = true;
    }

    /**
     * Cancel current processing
     */
    cancelProcessing() {
        this.processingQueue = [];
        this.currentBatch = [];
        this.isProcessing = false;
    }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer();