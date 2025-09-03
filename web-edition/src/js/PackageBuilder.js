/**
 * PackageBuilder.js
 * Handles ZIP package creation and file organization
 * Replicates PhotoPackager's folder structure and packaging
 */

import JSZip from 'jszip';

export class PackageBuilder {
    constructor(options = {}) {
        this.options = {
            studioName: 'Your Studio',
            studioWebsite: 'https://yourstudio.com',
            studioEmail: 'contact@yourstudio.com',
            projectName: 'PhotoPackage',
            ...options
        };
        
        this.zip = new JSZip();
        this.packageStats = {
            totalFiles: 0,
            totalSize: 0,
            folders: []
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
                await originalsFolder.file(original.name, original.file);
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
                await rawFolder.file(rawFile.name, rawFile.file);
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
                    await jpgFolder.file(jpg.name, jpg.blob);
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
                    await webpFolder.file(webp.name, webp.blob);
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
                    await jpgFolder.file(jpg.name, jpg.blob);
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
                    await webpFolder.file(webp.name, webp.blob);
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
     * Generate ZIP file for download
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

        return await this.zip.generateAsync(zipOptions);
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
            const originalsZip = new JSZip();
            const folder = originalsZip.folder(`${packageName} - Export Originals`);
            
            for (const original of processedResults.outputs.originals) {
                if (original && original.file) {
                    await folder.file(original.name, original.file);
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
        this.zip = new JSZip();
        this.packageStats = {
            totalFiles: 0,
            totalSize: 0,
            folders: []
        };
    }
}