/**
 * InputValidator.js
 * Comprehensive input validation and sanitization system
 * Prevents malicious input and ensures data integrity
 */

export class InputValidator {
    constructor() {
        this.maxFileSize = 500 * 1024 * 1024; // 500MB per file
        this.maxTotalSize = 10 * 1024 * 1024 * 1024; // 10GB total
        this.maxFileCount = 2000;
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
    validateFiles(files) {
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
            const fileValidation = this.validateSingleFile(file);
            
            if (fileValidation.valid) {
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
    validateSingleFile(file) {
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

        // Check for path traversal attempts
        if (this.pathTraversalPatterns.some(pattern => pattern.test(file.name))) {
            result.reason = 'Invalid file path';
            return result;
        }

        // Check file extension
        const extension = this.getFileExtension(file.name);
        if (!this.allowedExtensions.has(extension)) {
            result.reason = `Unsupported file format (.${extension})`;
            return result;
        }

        // Check MIME type if available (not all browsers provide accurate MIME types for all formats)
        if (file.type && !this.allowedMimeTypes.has(file.type) && !extension.match(/^(arw|cr2|cr3|nef|dng|orf|rw2|pef|srw|raf|3fr|fff|iiq|rwl)$/i)) {
            // Only strict MIME type checking for non-RAW formats
            result.reason = `Unsupported MIME type (${file.type})`;
            return result;
        }

        result.valid = true;
        return result;
    }

    /**
     * Sanitize file name for safe use
     */
    sanitizeFileName(name) {
        return name
            .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') // Replace invalid filename characters
            .replace(/^\.+/, '') // Remove leading dots
            .replace(/\.+$/, '') // Remove trailing dots
            .replace(/\s+/g, '_') // Replace spaces with underscores
            .replace(/_+/g, '_') // Collapse multiple underscores
            .substr(0, 255); // Limit length
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