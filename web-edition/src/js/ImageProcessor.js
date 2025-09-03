/**
 * ImageProcessor.js
 * Core image processing engine ported from PhotoPackager Python version
 * Handles streaming processing of large photo batches with performance optimization
 */

import { performanceOptimizer } from './PerformanceOptimizer.js';

export class ImageProcessor {
    constructor(options = {}) {
        this.options = {
            optimizedQuality: 85,
            compressedQuality: 65,
            compressedMaxDimension: 2048,
            exifHandling: 'preserve',
            progressCallback: null,
            ...options
        };
        
        this.supportedFormats = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
            'image/bmp', 'image/tiff', 'image/tif'
        ];
        
        this.rawFormats = [
            '.arw', '.cr2', '.cr3', '.nef', '.dng', '.orf', '.rw2',
            '.pef', '.srw', '.raf', '.3fr', '.fff', '.iiq', '.rwl'
        ];
    }

    /**
     * Process a batch of files with performance-optimized streaming
     */
    async processFilesBatch(files, settings) {
        const results = {
            processed: 0,
            total: files.length,
            outputs: {
                originals: [],
                rawFiles: [],
                optimizedJPG: [],
                optimizedWebP: [],
                compressedJPG: [],
                compressedWebP: []
            },
            errors: [],
            totalSizeProcessed: 0
        };

        const startTime = Date.now();

        try {
            // Use performance optimizer for batch processing
            const optimizedResults = await performanceOptimizer.processFilesBatch(
                files, 
                settings, 
                this.options.progressCallback
            );
            
            // Process each successful result
            for (const result of optimizedResults.results) {
                try {
                    await this.processIndividualFile(result.file, settings, results);
                } catch (error) {
                    results.errors.push({
                        file: result.file.name,
                        error: error.message
                    });
                }
            }
            
            // Add failed files to results
            results.errors.push(...optimizedResults.failures.map(f => ({
                file: f.file.name,
                error: f.error
            })));
            
            results.processed = optimizedResults.processed;
            
        } catch (error) {
            // Fallback to original processing if optimizer fails
            console.warn('Performance optimizer failed, falling back to standard processing:', error);
            return await this.fallbackProcessing(files, settings, results, startTime);
        }

        const endTime = Date.now();

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            try {
                // Update progress
                if (this.options.progressCallback) {
                    const progress = {
                        current: i + 1,
                        total: files.length,
                        percent: Math.round(((i + 1) / files.length) * 100),
                        currentFile: file.name,
                        stage: 'processing',
                        elapsed: Date.now() - startTime
                    };
                    await this.options.progressCallback(progress);
                }

                // Process single file
                const fileResults = await this.processSingleFile(file, i + 1, settings);
                
                // Merge results
                Object.keys(fileResults.outputs).forEach(key => {
                    if (fileResults.outputs[key] && results.outputs[key]) {
                        results.outputs[key].push(fileResults.outputs[key]);
                    }
                });
                
                results.processed++;
                results.totalSizeProcessed += file.size;
                
                // Force garbage collection hint
                if (i % 10 === 0) {
                    await this.forceGarbageCollection();
                }
                
            } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
                results.errors.push({
                    file: file.name,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Process a single image file
     */
    async processSingleFile(file, sequenceNumber, settings) {
        const fileName = this.generateFileName(file.name, sequenceNumber, settings.projectName);
        const results = { outputs: {} };

        // Handle original file
        if (settings.includeOriginals && settings.originalsAction !== 'leave') {
            results.outputs.originals = {
                file: file,
                name: fileName + this.getFileExtension(file.name),
                originalName: file.name
            };
        }

        // Handle RAW files separately
        if (this.isRawFile(file.name)) {
            if (settings.includeRaw && settings.rawAction !== 'leave') {
                results.outputs.rawFiles = {
                    file: file,
                    name: fileName + this.getFileExtension(file.name),
                    originalName: file.name
                };
            }
            // Skip image processing for RAW files
            return results;
        }

        // Skip processing for unsupported formats
        if (!this.isSupportedFormat(file)) {
            return results;
        }

        try {
            // Load image into canvas for processing
            const canvas = await this.loadImageToCanvas(file);
            const originalCtx = canvas.getContext('2d');

            // Generate optimized versions
            if (settings.generateOptimizedJPG) {
                results.outputs.optimizedJPG = await this.createOptimizedVersion(
                    canvas, fileName + '.jpg', 'image/jpeg', this.options.optimizedQuality
                );
            }

            if (settings.generateOptimizedWebP) {
                results.outputs.optimizedWebP = await this.createOptimizedVersion(
                    canvas, fileName + '.webp', 'image/webp', this.options.optimizedQuality
                );
            }

            // Generate compressed versions
            if (settings.generateCompressedJPG) {
                const compressedCanvas = await this.resizeCanvas(canvas, this.options.compressedMaxDimension);
                results.outputs.compressedJPG = await this.createOptimizedVersion(
                    compressedCanvas, fileName + '_compressed.jpg', 'image/jpeg', this.options.compressedQuality
                );
            }

            if (settings.generateCompressedWebP) {
                const compressedCanvas = await this.resizeCanvas(canvas, this.options.compressedMaxDimension);
                results.outputs.compressedWebP = await this.createOptimizedVersion(
                    compressedCanvas, fileName + '_compressed.webp', 'image/webp', this.options.compressedQuality
                );
            }

            // Clean up canvas
            canvas.width = canvas.height = 0;

        } catch (error) {
            console.error(`Error processing image ${file.name}:`, error);
            throw error;
        }

        return results;
    }

    /**
     * Load image file into HTML5 Canvas
     */
    async loadImageToCanvas(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            const url = URL.createObjectURL(file);
            
            img.onload = () => {
                // Clean up URL first
                URL.revokeObjectURL(url);
                
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Apply EXIF rotation if needed
                this.applyImageOrientation(ctx, img, canvas);
                
                resolve(canvas);
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };
            
            img.src = url;
        });
    }

    /**
     * Apply EXIF orientation to canvas
     */
    applyImageOrientation(ctx, img, canvas) {
        // For now, draw normally without EXIF rotation
        // TODO: Implement EXIF orientation handling using exif-js library
        ctx.drawImage(img, 0, 0);
        
        // Note: Full EXIF orientation support would require:
        // 1. Reading EXIF data from file using exif-js
        // 2. Applying appropriate canvas transformations based on orientation value
        // 3. Handling all 8 possible orientation values (1-8)
        // This is a known limitation that should be documented
    }

    /**
     * Create optimized version of image
     */
    async createOptimizedVersion(canvas, fileName, mimeType, quality) {
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve({
                    blob: blob,
                    name: fileName,
                    size: blob.size,
                    type: mimeType
                });
            }, mimeType, quality / 100);
        });
    }

    /**
     * Resize canvas to maximum dimension while preserving aspect ratio
     */
    async resizeCanvas(sourceCanvas, maxDimension) {
        const { width: originalWidth, height: originalHeight } = sourceCanvas;
        
        // Calculate new dimensions
        let newWidth, newHeight;
        if (originalWidth > originalHeight) {
            newWidth = Math.min(maxDimension, originalWidth);
            newHeight = (originalHeight * newWidth) / originalWidth;
        } else {
            newHeight = Math.min(maxDimension, originalHeight);
            newWidth = (originalWidth * newHeight) / originalHeight;
        }

        // Create new canvas with resized dimensions
        const resizedCanvas = document.createElement('canvas');
        const ctx = resizedCanvas.getContext('2d');
        
        resizedCanvas.width = Math.round(newWidth);
        resizedCanvas.height = Math.round(newHeight);
        
        // Draw resized image
        ctx.drawImage(sourceCanvas, 0, 0, Math.round(newWidth), Math.round(newHeight));
        
        return resizedCanvas;
    }

    /**
     * Generate sequential file name
     */
    generateFileName(originalName, sequenceNumber, projectName) {
        const paddedNumber = sequenceNumber.toString().padStart(3, '0');
        const baseName = projectName || 'PhotoPackage';
        return `${paddedNumber}-${baseName}`;
    }

    /**
     * Get file extension from filename
     */
    getFileExtension(fileName) {
        return fileName.substring(fileName.lastIndexOf('.'));
    }

    /**
     * Check if file format is supported for processing
     */
    isSupportedFormat(file) {
        return this.supportedFormats.includes(file.type) || 
               this.supportedFormats.some(format => 
                   file.name.toLowerCase().endsWith(format.split('/')[1])
               );
    }

    /**
     * Check if file is a RAW format
     */
    isRawFile(fileName) {
        const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
        return this.rawFormats.includes(extension);
    }

    /**
     * Force garbage collection (hint to browser)
     */
    async forceGarbageCollection() {
        // Small delay to allow browser to clean up
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Force garbage collection if available (Chrome DevTools)
        if (window.gc) {
            window.gc();
        }
    }

    /**
     * Estimate processing time based on file sizes
     */
    estimateProcessingTime(files) {
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        const avgProcessingSpeed = 10 * 1024 * 1024; // 10MB per second estimate
        return Math.ceil(totalSize / avgProcessingSpeed);
    }

    /**
     * Get memory usage statistics
     */
    getMemoryStats() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        return null;
    }
}