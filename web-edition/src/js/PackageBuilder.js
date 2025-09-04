/**
 * PhotoPackager Web Edition - ZIP Package Builder
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
 * PackageBuilder.js
 * Handles ZIP package creation and file organization
 * Replicates PhotoPackager's folder structure and packaging
 */

import { config } from './Config.js';
import { logger } from './Logger.js';

// JSZip is loaded via CDN in index.html and made available globally

export class PackageBuilder {
    constructor(options = {}) {
        this.options = {
            studioName: 'Your Studio',
            studioWebsite: 'https://yourstudio.com',
            studioEmail: 'contact@yourstudio.com',
            projectName: 'PhotoPackage',
            ...options
        };
        
        // Use global JSZip from CDN
        if (typeof window.JSZip === 'undefined') {
            throw new Error('JSZip library not loaded. Please ensure JSZip CDN script is included.');
        }
        this.zip = new window.JSZip();
        this.packageStats = {
            totalFiles: 0,
            totalSize: 0,
            compressedSize: 0, // Added for zip bomb protection (ASAP-013)
            folders: []
        };
    }

    /**
     * Sanitize zip entry names for security (ASAP-011)
     */
    sanitizeZipEntryName(name) {
        if (!name) return 'sanitized_file';
        
        return name
            // Remove path traversal attempts
            .replace(/\.\.\/|\.\.\\|\.\.\//g, '')
            .replace(/\.\./g, '')
            
            // Remove dangerous characters for zip entries
            .replace(/[<>:"|?*\x00-\x1f\x7f-\x9f]/g, '_')
            .replace(/[\u0000-\u001f\u007f-\u009f]/g, '_')
            
            // Clean up path separators (convert to forward slashes)
            .replace(/\\/g, '/')
            .replace(/\/+/g, '/')
            .replace(/^\/+|\/+$/g, '')
            
            // Final safety checks
            .substring(0, 255) // Limit length
            .trim() || 'sanitized_file';
    }

    /**
     * Zip bomb protection - Check compression ratios and limits (ASAP-013)
     */
    checkZipBombProtection(packageStats) {
        const MAX_COMPRESSION_RATIO = 100; // Maximum 100:1 compression ratio
        const MAX_TOTAL_SIZE_GB = 50; // Maximum 50GB total uncompressed size
        const MAX_FILE_COUNT = 10000; // Maximum 10,000 files per package
        
        // Check file count limit
        if (packageStats.totalFiles > MAX_FILE_COUNT) {
            throw new Error(`Package exceeds maximum file limit (${packageStats.totalFiles}/${MAX_FILE_COUNT} files). This could indicate a zip bomb attack.`);
        }
        
        // Check total uncompressed size
        const totalSizeGB = packageStats.totalSize / (1024 * 1024 * 1024);
        if (totalSizeGB > MAX_TOTAL_SIZE_GB) {
            throw new Error(`Package exceeds maximum size limit (${totalSizeGB.toFixed(1)}GB/${MAX_TOTAL_SIZE_GB}GB). This could indicate a zip bomb attack.`);
        }
        
        // Calculate compression ratio (we'll update this during zip generation)
        if (packageStats.compressedSize && packageStats.totalSize > 0) {
            const compressionRatio = packageStats.totalSize / packageStats.compressedSize;
            if (compressionRatio > MAX_COMPRESSION_RATIO) {
                throw new Error(`Dangerous compression ratio detected (${compressionRatio.toFixed(1)}:1). This could be a zip bomb. Maximum allowed is ${MAX_COMPRESSION_RATIO}:1.`);
            }
        }
        
        return {
            safe: true,
            fileCount: packageStats.totalFiles,
            totalSizeGB: totalSizeGB,
            compressionRatio: packageStats.compressedSize ? (packageStats.totalSize / packageStats.compressedSize) : null
        };
    }

    /**
     * Build complete package from processed results
     */
    async buildPackage(processedResults, settings) {
        const packageName = settings.projectName || 'PhotoPackage';
        
        // Create main package folder
        const mainFolder = this.zip.folder(packageName);
        
        // Add files to appropriate folders
        await this.addOriginalFiles(mainFolder, processedResults.outputs.originals);
        await this.addRawFiles(mainFolder, processedResults.outputs.rawFiles);
        await this.addOptimizedFiles(mainFolder, processedResults.outputs);
        await this.addCompressedFiles(mainFolder, processedResults.outputs);
        
        // Generate README file
        await this.addReadmeFile(mainFolder, processedResults, settings);
        
        // Update package statistics
        this.updatePackageStats(processedResults);
        
        // Zip bomb protection check (ASAP-013)
        try {
            const protectionResult = this.checkZipBombProtection(this.packageStats);
            config.log('Zip bomb protection check passed:', protectionResult);
        } catch (error) {
            logger.error('Zip bomb protection triggered:', error.message);
            if (window.errorHandler) {
                window.errorHandler.showError('Package Security Warning', error.message, [
                    { text: 'Reduce Files', action: () => {} },
                    { text: 'Cancel', action: () => {} }
                ]);
            }
            throw error;
        }
        
        return this.zip;
    }

    /**
     * Add original files to Export Originals folder
     */
    async addOriginalFiles(mainFolder, originals) {
        if (!originals || originals.length === 0) return;
        
        const originalsFolder = mainFolder.folder('Export Originals');
        
        for (const original of originals) {
            if (original && original.file) {
                const sanitizedName = this.sanitizeZipEntryName(original.name);
                await originalsFolder.file(sanitizedName, original.file);
                this.packageStats.totalFiles++;
                this.packageStats.totalSize += original.file.size;
            }
        }
        
        this.packageStats.folders.push('Export Originals');
    }

    /**
     * Add RAW files to RAW Files folder
     */
    async addRawFiles(mainFolder, rawFiles) {
        if (!rawFiles || rawFiles.length === 0) return;
        
        const rawFolder = mainFolder.folder('RAW Files');
        
        for (const rawFile of rawFiles) {
            if (rawFile && rawFile.file) {
                const sanitizedName = this.sanitizeZipEntryName(rawFile.name);
                await rawFolder.file(sanitizedName, rawFile.file);
                this.packageStats.totalFiles++;
                this.packageStats.totalSize += rawFile.file.size;
            }
        }
        
        this.packageStats.folders.push('RAW Files');
    }

    /**
     * Add optimized files to Optimized Files folder
     */
    async addOptimizedFiles(mainFolder, outputs) {
        const hasOptimized = (outputs.optimizedJPG && outputs.optimizedJPG.length > 0) ||
                           (outputs.optimizedWebP && outputs.optimizedWebP.length > 0);
        
        if (!hasOptimized) return;
        
        const optimizedFolder = mainFolder.folder('Optimized Files');
        
        // Add Optimized JPGs
        if (outputs.optimizedJPG && outputs.optimizedJPG.length > 0) {
            const jpgFolder = optimizedFolder.folder('Optimized JPGs');
            for (const jpg of outputs.optimizedJPG) {
                if (jpg && jpg.blob) {
                    const sanitizedName = this.sanitizeZipEntryName(jpg.name);
                    await jpgFolder.file(sanitizedName, jpg.blob);
                    this.packageStats.totalFiles++;
                    this.packageStats.totalSize += jpg.size;
                }
            }
        }
        
        // Add Optimized WebPs
        if (outputs.optimizedWebP && outputs.optimizedWebP.length > 0) {
            const webpFolder = optimizedFolder.folder('Optimized WebPs');
            for (const webp of outputs.optimizedWebP) {
                if (webp && webp.blob) {
                    const sanitizedName = this.sanitizeZipEntryName(webp.name);
                    await webpFolder.file(sanitizedName, webp.blob);
                    this.packageStats.totalFiles++;
                    this.packageStats.totalSize += webp.size;
                }
            }
        }
        
        this.packageStats.folders.push('Optimized Files');
    }

    /**
     * Add compressed files to Compressed Files folder
     */
    async addCompressedFiles(mainFolder, outputs) {
        const hasCompressed = (outputs.compressedJPG && outputs.compressedJPG.length > 0) ||
                             (outputs.compressedWebP && outputs.compressedWebP.length > 0);
        
        if (!hasCompressed) return;
        
        const compressedFolder = mainFolder.folder('Compressed Files');
        
        // Add Compressed JPGs
        if (outputs.compressedJPG && outputs.compressedJPG.length > 0) {
            const jpgFolder = compressedFolder.folder('Compressed JPGs');
            for (const jpg of outputs.compressedJPG) {
                if (jpg && jpg.blob) {
                    const sanitizedName = this.sanitizeZipEntryName(jpg.name);
                    await jpgFolder.file(sanitizedName, jpg.blob);
                    this.packageStats.totalFiles++;
                    this.packageStats.totalSize += jpg.size;
                }
            }
        }
        
        // Add Compressed WebPs
        if (outputs.compressedWebP && outputs.compressedWebP.length > 0) {
            const webpFolder = compressedFolder.folder('Compressed WebPs');
            for (const webp of outputs.compressedWebP) {
                if (webp && webp.blob) {
                    const sanitizedName = this.sanitizeZipEntryName(webp.name);
                    await webpFolder.file(sanitizedName, webp.blob);
                    this.packageStats.totalFiles++;
                    this.packageStats.totalSize += webp.size;
                }
            }
        }
        
        this.packageStats.folders.push('Compressed Files');
    }

    /**
     * Generate and add README.txt file
     */
    async addReadmeFile(mainFolder, processedResults, settings) {
        const readmeContent = this.generateReadmeContent(processedResults, settings);
        await mainFolder.file('README.txt', readmeContent);
        this.packageStats.totalFiles++;
    }

    /**
     * Generate README.txt content matching PhotoPackager format
     */
    generateReadmeContent(processedResults, settings) {
        const date = new Date().toLocaleDateString();
        const time = new Date().toLocaleTimeString();
        
        let content = `
================================================================================
                              PHOTO PACKAGE DELIVERY
================================================================================

Package Created: ${date} at ${time}
Studio: ${this.options.studioName}
Website: ${this.options.studioWebsite}
Contact: ${this.options.studioEmail}

Project: ${settings.projectName || 'PhotoPackage'}

================================================================================
                                PACKAGE CONTENTS
================================================================================

This package contains ${processedResults.processed} processed images organized into
the following folders for your convenience:

`;

        // Add folder descriptions
        this.packageStats.folders.forEach(folder => {
            switch (folder) {
                case 'Export Originals':
                    content += `
📁 Export Originals/
   Contains high-resolution copies of your source images.
   • Perfect for printing, detailed editing, and archival purposes
   • Original quality and resolution maintained
   • Use these for any high-quality output needs

`;
                    break;
                    
                case 'Optimized Files':
                    content += `
📁 Optimized Files/
   Contains high-quality optimized versions of your images.
   • Reduced file sizes while maintaining excellent visual quality
   • Perfect for digital delivery, online galleries, and client viewing
   • Available in JPG and/or WebP formats
   • Ideal balance of quality and file size

`;
                    break;
                    
                case 'Compressed Files':
                    content += `
📁 Compressed Files/
   Contains smaller, web-optimized versions of your images.
   • Significantly reduced file sizes for web use and social media
   • Perfect for email attachments, websites, and social sharing
   • Available in JPG and/or WebP formats
   • Optimized for fast loading and easy sharing

`;
                    break;
            }
        });

        content += `
================================================================================
                            FILE NAMING CONVENTION
================================================================================

All files in this package use a consistent naming format:
   ### - ${settings.projectName || 'ProjectName'} . extension

Where:
   ### = Sequential number (001, 002, 003, etc.)
   extension = File type (.jpg, .webp, etc.)

This ensures all files sort in the correct order in your file browser.

================================================================================
                               USAGE RECOMMENDATIONS
================================================================================

🖼️  For Printing & Archives:    Use files from "Export Originals"
📱  For Digital Viewing:         Use files from "Optimized Files"  
🌐  For Web & Social Media:      Use files from "Compressed Files"

================================================================================
                                   SUPPORT
================================================================================

Questions about your photos or need additional formats?

📧 Email: ${this.options.studioEmail}
🌐 Website: ${this.options.studioWebsite}
📞 We're here to help with any questions about your images!

================================================================================
                        POWERED BY PHOTOPACKAGER WEB EDITION
                           © 2025 ${this.options.studioName}
================================================================================

Thank you for choosing ${this.options.studioName} for your photography needs!
We hope you love your photos!

Generated by PhotoPackager Web Edition
https://github.com/seagpt/PhotoPackager

`;

        return content.trim();
    }

    /**
     * Update package statistics
     */
    updatePackageStats(processedResults) {
        // Stats are updated during file addition
        // This method can be extended for additional calculations
    }

    /**
     * Generate ZIP file for download - With zip bomb protection (ASAP-013)
     */
    async generateZipFile(options = {}) {
        const zipOptions = {
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: {
                level: 6
            },
            ...options
        };

        // Generate the zip file
        const zipBlob = await this.zip.generateAsync(zipOptions);
        
        // Post-generation zip bomb protection check
        this.packageStats.compressedSize = zipBlob.size;
        
        try {
            const protectionResult = this.checkZipBombProtection(this.packageStats);
            config.log('Final zip bomb protection check passed:', protectionResult);
            
            // Log compression ratio for monitoring
            if (protectionResult.compressionRatio) {
                config.log(`Package compression ratio: ${protectionResult.compressionRatio.toFixed(2)}:1`);
                
                // Analytics tracking for suspicious compression ratios
                if (protectionResult.compressionRatio > 50) {
                    if (window.analytics) {
                        window.analytics.trackError('high_compression_ratio', `${protectionResult.compressionRatio.toFixed(1)}:1`);
                    }
                    config.log(`High compression ratio detected: ${protectionResult.compressionRatio.toFixed(1)}:1`);
                }
            }
            
        } catch (error) {
            logger.error('Final zip bomb protection check failed:', error.message);
            
            // Clean up the generated blob to prevent memory leaks
            if (zipBlob && window.URL) {
                window.URL.revokeObjectURL(zipBlob);
            }
            
            if (window.errorHandler) {
                window.errorHandler.showError('Package Security Error', error.message);
            }
            throw error;
        }

        return zipBlob;
    }

    /**
     * Get package statistics
     */
    getPackageStats() {
        return {
            ...this.packageStats,
            totalSizeMB: Math.round(this.packageStats.totalSize / 1024 / 1024 * 100) / 100
        };
    }

    /**
     * Create individual ZIP files for each folder type
     */
    async createSeparateZipFiles(processedResults, settings) {
        const zipFiles = {};
        const packageName = settings.projectName || 'PhotoPackage';

        // Create separate ZIP for each folder type
        if (processedResults.outputs.originals && processedResults.outputs.originals.length > 0) {
            const originalsZip = new window.JSZip();
            const folder = originalsZip.folder(`${packageName} - Export Originals`);
            
            for (const original of processedResults.outputs.originals) {
                if (original && original.file) {
                    const sanitizedName = this.sanitizeZipEntryName(original.name);
                    await folder.file(sanitizedName, original.file);
                }
            }
            
            zipFiles.originals = await originalsZip.generateAsync({ type: 'blob' });
        }

        // Similar for optimized and compressed files...
        // (Implementation can be extended based on needs)

        return zipFiles;
    }

    /**
     * Reset package builder for new package
     */
    reset() {
        this.zip = new window.JSZip();
        this.packageStats = {
            totalFiles: 0,
            totalSize: 0,
            compressedSize: 0, // Added for zip bomb protection (ASAP-013)
            folders: []
        };
    }
}