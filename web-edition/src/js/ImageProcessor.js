/**
 * PhotoPackager Web Edition - Core Image Processing Engine
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
 * ImageProcessor.js
 * Core image processing engine ported from PhotoPackager Python version
 * Handles streaming processing of large photo batches with performance optimization
 */

import { performanceOptimizer } from './PerformanceOptimizer.js';
import { logger } from './Logger.js';
import { domSanitizer } from './DOMSanitizer.js';

export class ImageProcessor {
    constructor(options = {}) {
        this.options = {
            optimizedQuality: 85,
            compressedQuality: 65,
            compressedMaxDimension: 2048,
            exifHandling: 'preserve',
            progressCallback: null,
            processingTimeout: 30000, // 30 seconds per operation
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
     * CRITICAL: Wrap operations with timeout to prevent infinite loops
     */
    withTimeout(promise, operation = 'operation') {
        return Promise.race([
            promise,
            new Promise((_, reject) =>
                setTimeout(() => {
                    const timeoutError = new Error(`Processing timeout: ${operation} took longer than ${this.options.processingTimeout / 1000} seconds`);
                    timeoutError.isTimeout = true;
                    timeoutError.operation = operation;
                    reject(timeoutError);
                }, this.options.processingTimeout)
            )
        ]);
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
            
            // Files are already processed by PerformanceOptimizer
            // Extract and organize the results properly
            
            // Map the optimized results to the expected output structure
            if (optimizedResults.results && optimizedResults.results.length > 0) {
                optimizedResults.results.forEach((result, index) => {
                    const sequenceNumber = index + 1;
                    const fileName = this.generateFileName(result.name, sequenceNumber, settings.projectName);
                    
                    // The PerformanceOptimizer creates optimized JPEGs by default
                    if (settings.generateOptimizedJPG) {
                        results.outputs.optimizedJPG.push({
                            blob: result.blob,
                            name: fileName + '.jpg',
                            size: result.size,
                            type: 'image/jpeg'
                        });
                    }
                    
                    // For other formats, we'll need to process them separately
                    // This prevents double processing while still generating all requested formats
                    if (settings.generateOptimizedWebP || settings.generateCompressedJPG || settings.generateCompressedWebP) {
                        // Only process additional formats if requested
                        this.processAdditionalFormats(result, fileName, settings, results);
                    }
                });
            }
            
            // Add failed files to results
            results.errors.push(...optimizedResults.failures.map(f => ({
                file: f.file.name,
                error: f.error
            })));
            
            results.processed = optimizedResults.processed;
            results.totalSizeProcessed = optimizedResults.results ? 
                optimizedResults.results.reduce((sum, r) => sum + (r.size || 0), 0) : 0;
            
            // Return here - we've processed everything via optimizer
            return results;
            
        } catch (error) {
            // Fallback to original processing if optimizer fails
            logger.warn('Performance optimizer failed, falling back to standard processing:', error);
            return await this.fallbackProcessing(files, settings, results, startTime);
        }
    }

    /**
     * Process additional formats from existing processed result
     * This prevents double processing while generating all requested formats
     */
    async processAdditionalFormats(existingResult, fileName, settings, results) {
        try {
            // Create image from existing blob to generate other formats
            const img = new Image();
            const url = URL.createObjectURL(existingResult.blob);
            
            await new Promise((resolve, reject) => {
                img.onload = () => {
                    URL.revokeObjectURL(url); // Clean up URL after loading
                    resolve();
                };
                img.onerror = () => {
                    URL.revokeObjectURL(url); // Clean up URL on error
                    reject(new Error('Failed to load existing result image'));
                };
                img.src = url;
            });
            
            // Create canvas from existing processed image
            const canvas = document.createElement('canvas');
            canvas.width = existingResult.width || img.width;
            canvas.height = existingResult.height || img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            // Clear image reference for garbage collection
            img.src = '';
            img.onload = null;
            img.onerror = null;
            
            // Generate additional formats
            if (settings.generateOptimizedWebP) {
                const webpResult = await this.withTimeout(
                    this.createOptimizedVersion(canvas, fileName + '.webp', 'image/webp', this.options.optimizedQuality),
                    `creating optimized WebP for ${existingResult.name}`
                );
                results.outputs.optimizedWebP.push(webpResult);
            }

            if (settings.generateCompressedJPG || settings.generateCompressedWebP) {
                const compressedCanvas = await this.resizeCanvas(canvas, this.options.compressedMaxDimension);
                
                if (settings.generateCompressedJPG) {
                    const compressedJpg = await this.withTimeout(
                        this.createOptimizedVersion(compressedCanvas, fileName + '_compressed.jpg', 'image/jpeg', this.options.compressedQuality),
                        `creating compressed JPG for ${existingResult.name}`
                    );
                    results.outputs.compressedJPG.push(compressedJpg);
                }
                
                if (settings.generateCompressedWebP) {
                    const compressedWebp = await this.withTimeout(
                        this.createOptimizedVersion(compressedCanvas, fileName + '_compressed.webp', 'image/webp', this.options.compressedQuality),
                        `creating compressed WebP for ${existingResult.name}`
                    );
                    results.outputs.compressedWebP.push(compressedWebp);
                }
            }
            
            // Clean up
            URL.revokeObjectURL(url);
            canvas.width = canvas.height = 0;
            
        } catch (error) {
            logger.warn(`Failed to generate additional formats for ${existingResult.name}:`, error);
            // Don't throw - this is non-critical since we have the main optimized version
        }
    }

    /**
     * Fallback processing when PerformanceOptimizer fails
     */
    async fallbackProcessing(files, settings, results, startTime) {
        const endTime = Date.now();

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            try {
                // Update progress
                if (this.options.progressCallback) {
                    const progress = {
                        current: i + 1,
                        total: files.length,
                        percent: Math.round(((i + 1) / files.length) * 90), // Max 90% during processing
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
                logger.error(`Error processing ${file.name}:`, error);
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
            const canvas = await this.withTimeout(
                this.loadImageToCanvas(file), 
                `loading image ${file.name}`
            );
            const originalCtx = canvas.getContext('2d');

            // Generate optimized versions
            if (settings.generateOptimizedJPG) {
                results.outputs.optimizedJPG = await this.withTimeout(
                    this.createOptimizedVersion(canvas, fileName + '.jpg', 'image/jpeg', this.options.optimizedQuality),
                    `creating optimized JPG for ${file.name}`
                );
            }

            if (settings.generateOptimizedWebP) {
                results.outputs.optimizedWebP = await this.withTimeout(
                    this.createOptimizedVersion(canvas, fileName + '.webp', 'image/webp', this.options.optimizedQuality),
                    `creating optimized WebP for ${file.name}`
                );
            }

            // Generate compressed versions
            if (settings.generateCompressedJPG) {
                const compressedCanvas = await this.withTimeout(
                    this.resizeCanvas(canvas, this.options.compressedMaxDimension),
                    `resizing canvas for ${file.name}`
                );
                results.outputs.compressedJPG = await this.withTimeout(
                    this.createOptimizedVersion(compressedCanvas, fileName + '_compressed.jpg', 'image/jpeg', this.options.compressedQuality),
                    `creating compressed JPG for ${file.name}`
                );
            }

            if (settings.generateCompressedWebP) {
                const compressedCanvas = await this.withTimeout(
                    this.resizeCanvas(canvas, this.options.compressedMaxDimension),
                    `resizing canvas for ${file.name}`
                );
                results.outputs.compressedWebP = await this.withTimeout(
                    this.createOptimizedVersion(compressedCanvas, fileName + '_compressed.webp', 'image/webp', this.options.compressedQuality),
                    `creating compressed WebP for ${file.name}`
                );
            }

            // Clean up canvas
            canvas.width = canvas.height = 0;

        } catch (error) {
            // Use user-friendly error handling
            if (window.errorHandler) {
                window.errorHandler.handleError('file_processing_error', error, { 
                    fileName: file.name, 
                    fileSize: file.size,
                    settings: settings
                });
            } else {
                logger.error(`Error processing image ${file.name}:`, error);
            }
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
            
            img.onload = async () => {
                try {
                    // Clean up URL first
                    URL.revokeObjectURL(url);
                    
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // HIGH-009: Get orientation BEFORE setting canvas dimensions
                    const orientation = await this.getImageOrientation(file);
                    
                    // HIGH-009: Set canvas dimensions based on orientation
                    if ([6, 7, 8].includes(orientation)) {
                        // 90° or 270° rotations need swapped dimensions
                        canvas.width = img.height;
                        canvas.height = img.width;
                    } else {
                        canvas.width = img.width;
                        canvas.height = img.height;
                    }
                    
                    // Apply EXIF rotation with correct dimensions
                    await this.applyImageOrientation(ctx, img, canvas, file, orientation);
                    
                    // Clean up image reference
                    img.src = '';
                    img.onload = null;
                    img.onerror = null;
                    
                    resolve(canvas);
                } catch (error) {
                    // Clean up on error
                    img.src = '';
                    img.onload = null;
                    img.onerror = null;
                    reject(error);
                }
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                // Clean up image reference
                img.src = '';
                img.onload = null;
                img.onerror = null;
                reject(new Error('Failed to load image'));
            };
            
            img.src = url;
        });
    }

    /**
     * Apply EXIF orientation to canvas
     * HIGH-009: Fixed canvas dimension handling and transformation matrix
     */
    async applyImageOrientation(ctx, img, canvas, file, orientation = null) {
        try {
            // Use pre-calculated orientation if provided, otherwise get it
            const exifOrientation = orientation || await this.getImageOrientation(file);
            
            logger.debug(`Applying EXIF orientation ${exifOrientation} to image`);
            
            // Apply transformation based on orientation
            switch (exifOrientation) {
                case 1:
                    // Normal - no transformation needed
                    ctx.drawImage(img, 0, 0);
                    break;
                case 2:
                    // Flip horizontal
                    ctx.scale(-1, 1);
                    ctx.drawImage(img, -canvas.width, 0);
                    break;
                case 3:
                    // Rotate 180°
                    ctx.translate(canvas.width, canvas.height);
                    ctx.rotate(Math.PI);
                    ctx.drawImage(img, 0, 0);
                    break;
                case 4:
                    // Flip vertical
                    ctx.scale(1, -1);
                    ctx.drawImage(img, 0, -canvas.height);
                    break;
                case 5:
                    // Rotate 270° and flip horizontal (transpose)
                    ctx.scale(-1, 1);
                    ctx.rotate(-Math.PI / 2);
                    ctx.drawImage(img, -canvas.width, 0);
                    break;
                case 6:
                    // Rotate 90° CW
                    ctx.translate(canvas.width, 0);
                    ctx.rotate(Math.PI / 2);
                    ctx.drawImage(img, 0, 0);
                    break;
                case 7:
                    // Rotate 90° CW and flip horizontal (transverse)
                    ctx.translate(canvas.width, canvas.height);
                    ctx.scale(-1, 1);
                    ctx.rotate(Math.PI / 2);
                    ctx.drawImage(img, 0, 0);
                    break;
                case 8:
                    // Rotate 270° CW (90° CCW)
                    ctx.translate(0, canvas.height);
                    ctx.rotate(-Math.PI / 2);
                    ctx.drawImage(img, 0, 0);
                    break;
                default:
                    // Unknown orientation - draw normally
                    logger.warn(`Unknown EXIF orientation: ${exifOrientation}, drawing normally`);
                    ctx.drawImage(img, 0, 0);
            }
        } catch (error) {
            // Fallback to normal drawing if EXIF reading fails
            logger.warn('EXIF orientation reading failed, drawing image normally:', error);
            ctx.drawImage(img, 0, 0);
        }
    }

    /**
     * Get EXIF orientation from image file
     */
    async getImageOrientation(file) {
        return new Promise((resolve) => {
            try {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const view = new DataView(e.target.result);
                    const orientation = this.parseEXIFOrientation(view);
                    resolve(orientation);
                };
                reader.onerror = () => resolve(1); // Default orientation
                reader.readAsArrayBuffer(file.slice(0, 64 * 1024)); // Read first 64KB for EXIF
            } catch (error) {
                resolve(1); // Default orientation on error
            }
        });
    }

    /**
     * Parse EXIF orientation from binary data
     * HIGH-009: Enhanced with better error handling and bounds checking
     */
    parseEXIFOrientation(view) {
        try {
            // Check if it's a JPEG file
            if (view.byteLength < 2 || view.getUint16(0, false) !== 0xFFD8) {
                logger.debug('Not a JPEG file, defaulting to orientation 1');
                return 1;
            }
            
            let offset = 2;
            let marker;
            let little = false;

            while (offset < view.byteLength - 2) {
                marker = view.getUint16(offset, false);
                offset += 2;

                if (marker === 0xFFE1) { // APP1 segment (EXIF)
                    if (offset + 4 >= view.byteLength) break;
                    
                    const segmentLength = view.getUint16(offset, false);
                    const exifOffset = offset + 2;
                    
                    // Check for "Exif" identifier
                    if (exifOffset + 6 >= view.byteLength || 
                        view.getUint32(exifOffset, false) !== 0x45786966) {
                        offset += segmentLength;
                        continue;
                    }

                    const tiffOffset = exifOffset + 6;
                    
                    // Check bounds for TIFF header
                    if (tiffOffset + 8 >= view.byteLength) break;
                    
                    const endian = view.getUint16(tiffOffset, false);
                    little = endian === 0x4949; // Intel (little endian)
                    
                    // Verify TIFF magic number
                    if (view.getUint16(tiffOffset + 2, little) !== 0x002A) {
                        logger.debug('Invalid TIFF magic number');
                        break;
                    }

                    const ifdOffset = view.getUint32(tiffOffset + 4, little);
                    
                    // Check IFD bounds
                    if (tiffOffset + ifdOffset + 2 >= view.byteLength) break;
                    
                    const entryCount = view.getUint16(tiffOffset + ifdOffset, little);
                    
                    // Sanity check for entry count
                    if (entryCount > 100 || tiffOffset + ifdOffset + 2 + (entryCount * 12) > view.byteLength) {
                        logger.debug('Invalid IFD entry count or size');
                        break;
                    }

                    for (let i = 0; i < entryCount; i++) {
                        const entryOffset = tiffOffset + ifdOffset + 2 + (i * 12);
                        
                        // Check bounds for entry
                        if (entryOffset + 12 > view.byteLength) break;
                        
                        const tag = view.getUint16(entryOffset, little);
                        
                        if (tag === 0x0112) { // Orientation tag
                            const orientation = view.getUint16(entryOffset + 8, little);
                            
                            // Validate orientation value (should be 1-8)
                            if (orientation >= 1 && orientation <= 8) {
                                logger.debug(`Found EXIF orientation: ${orientation}`);
                                return orientation;
                            } else {
                                logger.debug(`Invalid orientation value: ${orientation}, using default`);
                                return 1;
                            }
                        }
                    }
                    
                    // Found EXIF section but no orientation tag
                    logger.debug('EXIF found but no orientation tag, using default');
                    return 1;
                    
                } else if ((marker & 0xFF00) !== 0xFF00) {
                    // Not a valid marker
                    break;
                } else {
                    // Skip this segment
                    if (offset >= view.byteLength) break;
                    const segmentLength = view.getUint16(offset, false);
                    offset += segmentLength;
                }
            }
            
            logger.debug('No EXIF orientation found, using default');
            return 1;
            
        } catch (error) {
            logger.warn('Error parsing EXIF orientation:', error);
            return 1; // Safe default
        }
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
     * Generate sequential file name with sanitization (ASAP-011)
     */
    generateFileName(originalName, sequenceNumber, projectName) {
        const paddedNumber = sequenceNumber.toString().padStart(3, '0');
        // Sanitize project name to prevent directory traversal and script injection
        const baseName = domSanitizer.sanitizeFileName(projectName || 'PhotoPackage');
        return `${paddedNumber}-${baseName}`;
    }

    /**
     * Get file extension from filename - sanitized for security (ASAP-011)
     */
    getFileExtension(fileName) {
        const lastDot = fileName.lastIndexOf('.');
        if (lastDot === -1) return '';
        
        let extension = fileName.substring(lastDot);
        
        // Sanitize extension to prevent malicious filenames
        extension = extension
            .toLowerCase() // Normalize case
            .replace(/[^a-z0-9.]/g, '') // Remove non-alphanumeric chars except dots
            .substring(0, 10); // Limit extension length
            
        // Validate extension is in allowed list
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.tif', '.svg', '.nef', '.cr2', '.dng', '.arw', '.orf', '.rw2'];
        
        if (allowedExtensions.includes(extension)) {
            return extension;
        }
        
        // Default to .jpg for unknown extensions to prevent dangerous file types
        return '.jpg';
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
     * Aggressive garbage collection with memory pressure hints
     */
    async forceGarbageCollection() {
        // Create temporary memory pressure to encourage GC
        this.createMemoryPressure();
        
        // Small delay to allow cleanup operations to complete
        await new Promise(resolve => setTimeout(resolve, 16)); // One frame at 60fps
        
        // Multiple GC calls for aggressive cleanup
        if (window.gc && typeof window.gc === 'function') {
            try {
                // Call GC multiple times for thoroughness
                for (let i = 0; i < 3; i++) {
                    window.gc();
                    await new Promise(resolve => setTimeout(resolve, 5));
                }
            } catch (e) {
                logger.warn('Explicit GC call failed:', e);
            }
        }
        
        // Additional memory pressure techniques
        this.triggerMemoryCleanup();
    }

    /**
     * Create memory pressure to encourage garbage collection
     */
    createMemoryPressure() {
        // Create and immediately release large objects to trigger GC
        const tempObjects = [];
        try {
            for (let i = 0; i < 20; i++) {
                tempObjects.push(new ArrayBuffer(1024 * 1024)); // 1MB each
            }
        } catch (e) {
            // Out of memory - that's actually good for triggering GC
        }
        
        // Clear references immediately
        tempObjects.length = 0;
        
        // Force array to be collected
        setTimeout(() => {
            // Ensure tempObjects is truly unreachable
        }, 0);
    }

    /**
     * Trigger various memory cleanup mechanisms
     */
    triggerMemoryCleanup() {
        // Clear any cached DOM measurements
        if (window.getComputedStyle) {
            document.body.offsetHeight; // Force layout recalc
        }
        
        // Clear any URL object references
        const urls = document.querySelectorAll('[src^="blob:"]');
        urls.forEach(el => {
            try {
                URL.revokeObjectURL(el.src);
            } catch (e) {
                // Already revoked or invalid
            }
        });
        
        // Hint to browser about memory pressure
        if ('memory' in performance) {
            const memInfo = performance.memory;
            if (memInfo.usedJSHeapSize > memInfo.jsHeapSizeLimit * 0.8) {
                // We're using >80% of available heap
                logger.warn('High memory usage detected, triggering aggressive cleanup');
                
                // Additional cleanup strategies
                this.emergencyMemoryCleanup();
            }
        }
    }

    /**
     * Emergency memory cleanup for critical situations
     */
    emergencyMemoryCleanup() {
        // Clear any global caches
        if (window.caches) {
            caches.keys().then(names => {
                names.forEach(name => {
                    if (name.includes('temp') || name.includes('processing')) {
                        caches.delete(name);
                    }
                });
            });
        }
        
        // Clear any stored blobs in global scope
        if (window.URL && window.URL.revokeObjectURL) {
            // This is a bit aggressive but necessary for emergency cleanup
            const scripts = document.getElementsByTagName('script');
            Array.from(scripts).forEach(script => {
                if (script.src && script.src.startsWith('blob:')) {
                    URL.revokeObjectURL(script.src);
                }
            });
        }
        
        // Force style recalculation to clear cached styles
        document.documentElement.style.display = 'none';
        document.documentElement.offsetHeight; // Trigger reflow
        document.documentElement.style.display = '';
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