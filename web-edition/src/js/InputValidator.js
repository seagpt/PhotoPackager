/**
 * PhotoPackager Web Edition - Input Validation System
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
 * InputValidator.js
 * Comprehensive input validation and sanitization system
 * Prevents malicious input and ensures data integrity
 */

export class InputValidator {
    constructor() {
        // CRITICAL: Reduced limits to prevent browser crashes
        this.maxFileSize = 100 * 1024 * 1024; // 100MB per file (was 500MB)
        this.maxTotalSize = 10 * 1024 * 1024 * 1024; // 10GB total (kept same)
        this.maxFileCount = 1000; // 1000 files max (was 2000)
        this.maxProjectNameLength = 100;
        this.maxStudioNameLength = 100;
        this.maxEmailLength = 254; // RFC 5321 limit
        this.maxUrlLength = 2048;
        
        // Allowed image file extensions
        this.allowedExtensions = new Set([
            'jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff', 'tif', 'gif',
            'arw', 'cr2', 'cr3', 'nef', 'dng', 'orf', 'rw2', 'pef',
            'srw', 'raf', '3fr', 'fff', 'iiq', 'rwl'
        ]);

        // Allowed MIME types
        this.allowedMimeTypes = new Set([
            'image/jpeg', 'image/png', 'image/webp', 'image/bmp',
            'image/tiff', 'image/gif'
        ]);

        // Dangerous file patterns
        this.dangerousPatterns = [
            /\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.scr$/i, /\.pif$/i,
            /\.com$/i, /\.js$/i, /\.vbs$/i, /\.jar$/i, /\.php$/i,
            /\.asp$/i, /\.jsp$/i, /\.pl$/i, /\.py$/i, /\.sh$/i
        ];

        // Path traversal patterns
        this.pathTraversalPatterns = [
            /\.\./g, /\.\\/g, /\.\//, /\/\./g, /\\\./g,
            /%2e%2e/gi, /%2f/gi, /%5c/gi, /%00/gi
        ];

        // ASAP-014: Dangerous folder patterns for directory traversal prevention
        this.dangerousFolderPatterns = [
            /^\//, // Absolute paths
            /\\\\/, // UNC paths
            /^[a-zA-Z]:/, // Windows drive letters
            /\0/, // Null bytes
            /\.\.[\/\\]/, // Parent directory references
            /[\/\\]\.\.[\/\\]/, // Mid-path parent references
            /[\/\\]\.$/, // Current directory at end
            /^\.$/, // Just current directory
            /^\.\./, // Starting with parent directory
            /system32/i, // Windows system directories
            /windows/i,
            /program files/i,
            /programdata/i,
            /users/i,
            /etc/i, // Unix system directories
            /var/i,
            /usr/i,
            /bin/i,
            /sbin/i,
            /root/i,
            /home/i,
            // Additional system folder patterns
            /system\s*volume\s*information/i,
            /\.ds_store/i,
            /thumbs\.db/i,
            /desktop\.ini/i
        ];

        // Magic byte signatures for image files (security validation)
        this.magicBytes = {
            'jpeg': [0xFF, 0xD8, 0xFF],
            'png': [0x89, 0x50, 0x4E, 0x47],
            'webp': [0x52, 0x49, 0x46, 0x46], // RIFF header
            'bmp': [0x42, 0x4D],
            'gif': [0x47, 0x49, 0x46],
            'tiff': [0x49, 0x49, 0x2A, 0x00] // Little-endian TIFF
        };
    }

    /**
     * Validate and sanitize project name
     */
    validateProjectName(name) {
        const result = { valid: false, value: '', errors: [] };

        if (!name || typeof name !== 'string') {
            result.errors.push('Project name is required');
            return result;
        }

        // Trim and check length
        const trimmed = name.trim();
        if (trimmed.length === 0) {
            result.errors.push('Project name cannot be empty');
            return result;
        }

        if (trimmed.length > this.maxProjectNameLength) {
            result.errors.push(`Project name must be ${this.maxProjectNameLength} characters or less`);
            return result;
        }

        // Sanitize dangerous characters
        let sanitized = this.sanitizeFileName(trimmed);
        
        // Ensure it's not just whitespace after sanitization
        if (sanitized.trim().length === 0) {
            result.errors.push('Project name contains only invalid characters');
            return result;
        }

        // Check for reserved names (Windows)
        const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
        if (reservedNames.includes(sanitized.toUpperCase())) {
            result.errors.push('Project name cannot be a system reserved word');
            return result;
        }

        result.valid = true;
        result.value = sanitized;
        return result;
    }

    /**
     * Validate and sanitize studio name
     */
    validateStudioName(name) {
        const result = { valid: false, value: '', errors: [] };

        if (!name || typeof name !== 'string') {
            // Studio name is optional, return default
            result.valid = true;
            result.value = 'Your Studio';
            return result;
        }

        const trimmed = name.trim();
        if (trimmed.length === 0) {
            result.valid = true;
            result.value = 'Your Studio';
            return result;
        }

        if (trimmed.length > this.maxStudioNameLength) {
            result.errors.push(`Studio name must be ${this.maxStudioNameLength} characters or less`);
            return result;
        }

        // Sanitize but allow more characters for display names
        const sanitized = this.sanitizeDisplayName(trimmed);

        result.valid = true;
        result.value = sanitized;
        return result;
    }

    /**
     * Validate email address
     */
    validateEmail(email) {
        const result = { valid: false, value: '', errors: [] };

        if (!email || typeof email !== 'string') {
            // Email is optional, return default
            result.valid = true;
            result.value = 'contact@yourstudio.com';
            return result;
        }

        const trimmed = email.trim();
        if (trimmed.length === 0) {
            result.valid = true;
            result.value = 'contact@yourstudio.com';
            return result;
        }

        if (trimmed.length > this.maxEmailLength) {
            result.errors.push(`Email must be ${this.maxEmailLength} characters or less`);
            return result;
        }

        // RFC 5322 compliant email regex (simplified)
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        
        if (!emailRegex.test(trimmed)) {
            result.errors.push('Please enter a valid email address');
            return result;
        }

        // Check for dangerous characters
        if (this.containsDangerousChars(trimmed)) {
            result.errors.push('Email contains invalid characters');
            return result;
        }

        result.valid = true;
        result.value = trimmed.toLowerCase();
        return result;
    }

    /**
     * Validate URL
     */
    validateUrl(url) {
        const result = { valid: false, value: '', errors: [] };

        if (!url || typeof url !== 'string') {
            // URL is optional, return default
            result.valid = true;
            result.value = 'https://yourstudio.com';
            return result;
        }

        const trimmed = url.trim();
        if (trimmed.length === 0) {
            result.valid = true;
            result.value = 'https://yourstudio.com';
            return result;
        }

        if (trimmed.length > this.maxUrlLength) {
            result.errors.push(`Website URL must be ${this.maxUrlLength} characters or less`);
            return result;
        }

        // Ensure URL has protocol
        let urlToValidate = trimmed;
        if (!/^https?:\/\//i.test(urlToValidate)) {
            urlToValidate = 'https://' + urlToValidate;
        }

        try {
            const urlObj = new URL(urlToValidate);
            
            // Only allow http and https protocols
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                result.errors.push('Only HTTP and HTTPS URLs are allowed');
                return result;
            }

            // Check for dangerous characters in hostname
            if (this.containsDangerousChars(urlObj.hostname)) {
                result.errors.push('URL contains invalid characters');
                return result;
            }

            result.valid = true;
            result.value = urlObj.toString();
            return result;
        } catch (e) {
            result.errors.push('Please enter a valid website URL');
            return result;
        }
    }

    /**
     * Validate quality settings
     */
    validateQuality(value, min = 30, max = 95, name = 'Quality') {
        const result = { valid: false, value: 85, errors: [] };

        if (value === undefined || value === null) {
            result.errors.push(`${name} is required`);
            return result;
        }

        const numValue = parseInt(value);
        if (isNaN(numValue)) {
            result.errors.push(`${name} must be a number`);
            return result;
        }

        if (numValue < min || numValue > max) {
            result.errors.push(`${name} must be between ${min} and ${max}`);
            return result;
        }

        result.valid = true;
        result.value = numValue;
        return result;
    }

    /**
     * Validate file array
     */
    validateFiles(files, options = {}) {
        const relaxed = options.relaxed || false;
        const result = { 
            valid: false, 
            validFiles: [], 
            errors: [], 
            warnings: [],
            stats: {
                totalSize: 0,
                totalCount: 0,
                validCount: 0,
                invalidCount: 0,
                oversizedCount: 0
            }
        };

        if (!files || !Array.isArray(files)) {
            result.errors.push('No files provided');
            return result;
        }

        if (files.length === 0) {
            result.errors.push('No files selected');
            return result;
        }

        if (files.length > this.maxFileCount) {
            result.errors.push(`Too many files selected. Maximum is ${this.maxFileCount} files`);
            return result;
        }

        let totalSize = 0;
        const validFiles = [];
        const oversizedFiles = [];
        const invalidFiles = [];

        for (const file of files) {
            const fileValidation = this.validateSingleFile(file, relaxed);
            
            if (fileValidation.valid) {
                // Add sanitized filename property for safe usage (ASAP-011)
                file.sanitizedName = this.sanitizeFileName(file.name);
                
                // ASAP-014: Add sanitized folder path for safe usage
                if (file.webkitRelativePath) {
                    file.sanitizedPath = this.sanitizeFolderPath(file.webkitRelativePath);
                }
                
                validFiles.push(file);
                totalSize += file.size;
            } else if (fileValidation.oversized) {
                oversizedFiles.push({
                    file,
                    size: this.formatFileSize(file.size),
                    maxSize: this.formatFileSize(this.maxFileSize)
                });
            } else {
                invalidFiles.push({
                    file,
                    reason: fileValidation.reason
                });
            }
        }

        // Check total size
        if (totalSize > this.maxTotalSize) {
            result.errors.push(`Total file size too large (${this.formatFileSize(totalSize)}). Maximum is ${this.formatFileSize(this.maxTotalSize)}`);
            return result;
        }

        // Add warnings for oversized files
        if (oversizedFiles.length > 0) {
            result.warnings.push(`${oversizedFiles.length} files are too large and will be skipped`);
        }

        // Add warnings for invalid files
        if (invalidFiles.length > 0) {
            result.warnings.push(`${invalidFiles.length} files are not supported and will be skipped`);
        }

        // Set stats
        result.stats = {
            totalSize,
            totalCount: files.length,
            validCount: validFiles.length,
            invalidCount: invalidFiles.length,
            oversizedCount: oversizedFiles.length
        };

        if (validFiles.length === 0) {
            result.errors.push('No valid image files found');
            return result;
        }

        result.valid = true;
        result.validFiles = validFiles;
        return result;
    }

    /**
     * Validate a single file
     */
    validateSingleFile(file, relaxed = false) {
        const result = { valid: false, oversized: false, reason: '' };

        if (!file || typeof file !== 'object') {
            result.reason = 'Invalid file object';
            return result;
        }

        // Check file size
        if (file.size > this.maxFileSize) {
            result.oversized = true;
            result.reason = `File too large (${this.formatFileSize(file.size)})`;
            return result;
        }

        // Check file name
        if (!file.name || typeof file.name !== 'string') {
            result.reason = 'Invalid file name';
            return result;
        }

        // Check for dangerous file patterns
        if (this.dangerousPatterns.some(pattern => pattern.test(file.name))) {
            result.reason = 'Potentially dangerous file type';
            return result;
        }

        // Check for path traversal attempts in filename (ASAP-014)
        if (this.pathTraversalPatterns.some(pattern => pattern.test(file.name))) {
            result.reason = 'Invalid file path';
            return result;
        }

        // ASAP-014: Check webkitRelativePath for directory traversal attacks
        if (file.webkitRelativePath) {
            if (this.pathTraversalPatterns.some(pattern => pattern.test(file.webkitRelativePath))) {
                result.reason = 'Invalid folder structure - path traversal detected';
                return result;
            }
            
            // Additional checks for dangerous folder patterns
            if (this.isDangerousFolderPath(file.webkitRelativePath)) {
                result.reason = 'Invalid folder structure - dangerous path detected';
                return result;
            }
        }

        // Check file extension (with relaxed mode support)
        const extension = this.getFileExtension(file.name);
        
        // In relaxed mode, also accept common image extensions even if not in strict list
        const isAllowedExtension = this.allowedExtensions.has(extension) || 
            (relaxed && /^(jpg|jpeg|png|gif|bmp|webp|tiff|tif|heic|heif|avif)$/i.test(extension));
            
        if (!isAllowedExtension) {
            result.reason = `Unsupported file format (.${extension})`;
            return result;
        }

        // Check MIME type if available (more lenient in relaxed mode)
        if (file.type && !relaxed) {
            // Strict MIME checking only in non-relaxed mode
            if (!this.allowedMimeTypes.has(file.type) && !extension.match(/^(arw|cr2|cr3|nef|dng|orf|rw2|pef|srw|raf|3fr|fff|iiq|rwl)$/i)) {
                result.reason = `Unsupported MIME type (${file.type})`;
                return result;
            }
        } else if (file.type && relaxed) {
            // In relaxed mode, only reject if MIME type is clearly not an image
            if (file.type && !file.type.startsWith('image/') && !extension.match(/^(arw|cr2|cr3|nef|dng|orf|rw2|pef|srw|raf|3fr|fff|iiq|rwl|heic|heif|avif)$/i)) {
                result.reason = `File does not appear to be an image (${file.type})`;
                return result;
            }
        }

        result.valid = true;
        return result;
    }

    /**
     * Validate file magic bytes (async) for additional security
     */
    async validateFileMagicBytes(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const arr = new Uint8Array(e.target.result);
                const isValidImage = this.checkMagicBytes(arr);
                resolve({ valid: isValidImage, reason: isValidImage ? '' : 'Invalid image file format' });
            };
            reader.onerror = () => resolve({ valid: false, reason: 'Could not read file' });
            reader.readAsArrayBuffer(file.slice(0, 32)); // Read first 32 bytes
        });
    }

    /**
     * Check if magic bytes match known image formats
     */
    checkMagicBytes(bytes) {
        for (const [format, signature] of Object.entries(this.magicBytes)) {
            if (signature.every((byte, index) => bytes[index] === byte)) {
                return true;
            }
        }
        
        // Special case for TIFF big-endian
        if (bytes[0] === 0x4D && bytes[1] === 0x4D && bytes[2] === 0x00 && bytes[3] === 0x2A) {
            return true;
        }
        
        // WebP needs additional validation (checks for WEBP after RIFF)
        if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
            return bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
        }
        
        return false;
    }

    /**
     * Sanitize file name for safe use - Enhanced for ASAP-011 security requirements
     */
    sanitizeFileName(name) {
        return name
            // Remove path traversal attempts (ASAP-011 requirement)
            .replace(/\.\.\/|\.\.\\|\.\.\//g, '') // Remove ../, ..\, ../
            .replace(/\.\./g, '') // Remove any remaining .. patterns
            
            // Remove script tags and dangerous HTML (ASAP-011 requirement)
            .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove <script> tags
            .replace(/<[^>]*>/g, '') // Remove any HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/vbscript:/gi, '') // Remove vbscript: protocol
            .replace(/data:/gi, '') // Remove data: protocol
            
            // Replace invalid filename characters (enhanced)
            .replace(/[<>:"/\\|?*\x00-\x1f\x7f-\x9f]/g, '_') // Include extended ASCII control chars
            .replace(/[#%&{}$!'"`@+]/g, '_') // Additional special characters
            .replace(/[\u0000-\u001f\u007f-\u009f]/g, '_') // Unicode control characters
            
            // Clean up dots and path separators
            .replace(/^\.+/, '') // Remove leading dots
            .replace(/\.+$/, '') // Remove trailing dots
            .replace(/[\/\\]+/g, '_') // Replace path separators
            
            // Normalize whitespace and underscores
            .replace(/\s+/g, '_') // Replace spaces with underscores
            .replace(/_+/g, '_') // Collapse multiple underscores
            .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
            
            // Final length and safety checks
            .substr(0, 255) // Limit length to filesystem limits
            .trim() || 'sanitized_filename'; // Provide fallback if empty
    }

    /**
     * Sanitize display name (more permissive)
     */
    sanitizeDisplayName(name) {
        return name
            .replace(/[<>"\x00-\x1f]/g, '') // Remove only truly dangerous characters
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    /**
     * Check for dangerous characters
     */
    containsDangerousChars(str) {
        // Look for script injection attempts
        const dangerousPatterns = [
            /<script/i, /<\/script>/i, /javascript:/i, /vbscript:/i,
            /on\w+\s*=/i, /expression\s*\(/i, /url\s*\(/i,
            /data:text\/html/i, /data:application\/javascript/i
        ];

        return dangerousPatterns.some(pattern => pattern.test(str));
    }

    /**
     * Get file extension
     */
    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    /**
     * ASAP-014: Check if folder path contains dangerous patterns
     */
    isDangerousFolderPath(path) {
        if (!path || typeof path !== 'string') {
            return false;
        }

        // Normalize path separators for consistent checking
        const normalizedPath = path.replace(/\\/g, '/');
        
        // Check against dangerous folder patterns
        if (this.dangerousFolderPatterns.some(pattern => pattern.test(normalizedPath))) {
            return true;
        }

        // Check path depth (prevent deeply nested attacks)
        const pathDepth = normalizedPath.split('/').length - 1;
        if (pathDepth > 20) { // Maximum 20 levels deep
            return true;
        }

        // Check for excessively long paths
        if (normalizedPath.length > 4096) { // Maximum 4KB path length
            return true;
        }

        // Check for hidden/system folder patterns
        const hiddenSystemPatterns = [
            /\/\$RECYCLE\.BIN/i,
            /\/System Volume Information/i,
            /\/\._/, // macOS resource forks
            /\/\.DS_Store/i,
            /\/Thumbs\.db/i,
            /\/desktop\.ini/i,
            /\/hiberfil\.sys/i,
            /\/pagefile\.sys/i,
            /\/swapfile\.sys/i
        ];

        if (hiddenSystemPatterns.some(pattern => pattern.test(normalizedPath))) {
            return true;
        }

        return false;
    }

    /**
     * ASAP-014: Sanitize folder path for safe usage
     */
    sanitizeFolderPath(path) {
        if (!path || typeof path !== 'string') {
            return 'Photos';
        }

        // Normalize and clean the path
        let cleanPath = path
            .replace(/\\/g, '/') // Normalize separators
            .replace(/\/+/g, '/') // Remove multiple slashes
            .replace(/^\/+/, '') // Remove leading slashes
            .replace(/\/+$/, '') // Remove trailing slashes
            .replace(/\.\.\//g, '') // Remove parent directory references with separator
            .replace(/\.\.$/g, '') // Remove parent directory at end
            .replace(/\.\./g, '') // Remove any remaining parent references
            .replace(/\/\.\//g, '/') // Remove current directory references
            .replace(/\/\.$/g, '') // Remove current directory at end
            .replace(/^\.\//, '') // Remove current directory at start
            .replace(/^\.$/g, '') // Remove if just current directory
            .replace(/[<>:"|?*\0]/g, '_') // Replace invalid characters
            .substring(0, 255); // Limit length
            
        // Final cleanup - remove any remaining consecutive slashes
        cleanPath = cleanPath.replace(/\/+/g, '/');
        
        // Remove trailing slash
        cleanPath = cleanPath.replace(/\/+$/, '');

        return cleanPath || 'Photos';
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Validate all form inputs
     */
    validateAllInputs(formData) {
        const results = {
            valid: true,
            errors: [],
            warnings: [],
            validatedData: {}
        };

        // Validate project name
        const projectNameResult = this.validateProjectName(formData.projectName);
        if (!projectNameResult.valid) {
            results.valid = false;
            results.errors.push(...projectNameResult.errors);
        } else {
            results.validatedData.projectName = projectNameResult.value;
        }

        // Validate studio name
        const studioNameResult = this.validateStudioName(formData.studioName);
        if (!studioNameResult.valid) {
            results.valid = false;
            results.errors.push(...studioNameResult.errors);
        } else {
            results.validatedData.studioName = studioNameResult.value;
        }

        // Validate email
        const emailResult = this.validateEmail(formData.studioEmail);
        if (!emailResult.valid) {
            results.valid = false;
            results.errors.push(...emailResult.errors);
        } else {
            results.validatedData.studioEmail = emailResult.value;
        }

        // Validate website
        const websiteResult = this.validateUrl(formData.studioWebsite);
        if (!websiteResult.valid) {
            results.valid = false;
            results.errors.push(...websiteResult.errors);
        } else {
            results.validatedData.studioWebsite = websiteResult.value;
        }

        // Validate quality settings
        const optimizedQualityResult = this.validateQuality(formData.optimizedQuality, 60, 95, 'Optimized quality');
        if (!optimizedQualityResult.valid) {
            results.valid = false;
            results.errors.push(...optimizedQualityResult.errors);
        } else {
            results.validatedData.optimizedQuality = optimizedQualityResult.value;
        }

        const compressedQualityResult = this.validateQuality(formData.compressedQuality, 30, 80, 'Compressed quality');
        if (!compressedQualityResult.valid) {
            results.valid = false;
            results.errors.push(...compressedQualityResult.errors);
        } else {
            results.validatedData.compressedQuality = compressedQualityResult.value;
        }

        // Validate max dimension
        const validDimensions = [1920, 2048, 2560];
        const maxDimension = parseInt(formData.compressedMaxDimension);
        if (!validDimensions.includes(maxDimension)) {
            results.valid = false;
            results.errors.push('Invalid compressed max dimension setting');
        } else {
            results.validatedData.compressedMaxDimension = maxDimension;
        }

        // Copy boolean values (already validated by HTML)
        results.validatedData.includeOriginals = !!formData.includeOriginals;
        results.validatedData.includeRaw = !!formData.includeRaw;
        results.validatedData.generateOptimizedJPG = !!formData.generateOptimizedJPG;
        results.validatedData.generateOptimizedWebP = !!formData.generateOptimizedWebP;
        results.validatedData.generateCompressedJPG = !!formData.generateCompressedJPG;
        results.validatedData.generateCompressedWebP = !!formData.generateCompressedWebP;
        
        // Copy string values (already validated by HTML select)
        results.validatedData.originalsAction = formData.originalsAction;
        results.validatedData.rawAction = formData.rawAction;
        results.validatedData.exifHandling = formData.exifHandling;

        return results;
    }

    /**
     * Get supported formats list
     */
    getSupportedFormats() {
        return {
            standard: ['JPG/JPEG', 'PNG', 'WebP', 'BMP', 'TIFF', 'GIF'],
            raw: ['ARW (Sony)', 'CR2/CR3 (Canon)', 'NEF (Nikon)', 'DNG (Adobe)', 'ORF (Olympus)', 'RW2 (Panasonic)', 'PEF (Pentax)', 'SRW (Samsung)', 'RAF (Fujifilm)', '3FR (Hasselblad)', 'FFF (Imacon)', 'IIQ (Phase One)', 'RWL (Leica)']
        };
    }
}

// Export singleton instance
export const inputValidator = new InputValidator();