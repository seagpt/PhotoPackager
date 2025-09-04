/**
 * PhotoPackager Web Edition - Production-Safe Logging System
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
 * Logger.js
 * Production-safe logging that prevents sensitive information leakage (ASAP-019)
 */

import { config } from './Config.js';

class Logger {
    constructor() {
        // Determine if we're in production mode
        this.isProduction = config.getEnvironment() === 'production';
        this.isDevelopment = config.getEnvironment() === 'development';
        this.isDebugMode = config.get('debug.enabled') || false;
        
        // In production, only show critical errors unless debug mode is explicitly enabled
        this.logLevel = this.isProduction && !this.isDebugMode ? 'error' : 'debug';
        
        // Store logs for potential debugging (limited buffer)
        this.logBuffer = [];
        this.maxBufferSize = 100;
        
        // Sanitization patterns for sensitive data
        this.sensitivePatterns = [
            /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi, // Email addresses
            /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card numbers
            /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
            /(api[_-]?key|apikey|auth|password|pwd|secret|token)[\s]*[:=][\s]*['"]?[^\s'"]+/gi, // API keys/passwords
            /\/users?\/\d+/gi, // User IDs in paths
            /[?&](token|auth|key|secret|password)=[^&]+/gi, // Query parameters with secrets
        ];
    }

    /**
     * Sanitize message to remove sensitive information (ASAP-019)
     */
    sanitize(message) {
        if (typeof message !== 'string') {
            return message;
        }
        
        let sanitized = message;
        this.sensitivePatterns.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '[REDACTED]');
        });
        
        return sanitized;
    }

    /**
     * Add to internal buffer for debugging
     */
    addToBuffer(level, args) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message: args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg, null, 2);
                    } catch {
                        return '[Object]';
                    }
                }
                return String(arg);
            }).join(' ')
        };
        
        this.logBuffer.push(entry);
        
        // Keep buffer size limited
        if (this.logBuffer.length > this.maxBufferSize) {
            this.logBuffer.shift();
        }
    }

    /**
     * Check if logging is allowed for given level
     */
    shouldLog(level) {
        const levels = {
            'debug': 0,
            'log': 1,
            'info': 2,
            'warn': 3,
            'error': 4
        };
        
        const currentLevel = levels[this.logLevel] || 0;
        const requestedLevel = levels[level] || 0;
        
        return requestedLevel >= currentLevel;
    }

    /**
     * Debug level logging (only in development)
     */
    debug(...args) {
        if (this.shouldLog('debug')) {
            const sanitizedArgs = args.map(arg => 
                typeof arg === 'string' ? this.sanitize(arg) : arg
            );
            console.debug('[DEBUG]', ...sanitizedArgs);
        }
        this.addToBuffer('debug', args);
    }

    /**
     * General logging (only in development)
     */
    log(...args) {
        if (this.shouldLog('log')) {
            const sanitizedArgs = args.map(arg => 
                typeof arg === 'string' ? this.sanitize(arg) : arg
            );
            console.log(...sanitizedArgs);
        }
        this.addToBuffer('log', args);
    }

    /**
     * Info level logging
     */
    info(...args) {
        if (this.shouldLog('info')) {
            const sanitizedArgs = args.map(arg => 
                typeof arg === 'string' ? this.sanitize(arg) : arg
            );
            console.info('[INFO]', ...sanitizedArgs);
        }
        this.addToBuffer('info', args);
    }

    /**
     * Warning level logging
     */
    warn(...args) {
        if (this.shouldLog('warn')) {
            const sanitizedArgs = args.map(arg => 
                typeof arg === 'string' ? this.sanitize(arg) : arg
            );
            console.warn('[WARN]', ...sanitizedArgs);
        }
        this.addToBuffer('warn', args);
    }

    /**
     * Error level logging (always shown)
     */
    error(...args) {
        // Always log errors, but sanitize them
        const sanitizedArgs = args.map(arg => {
            if (arg instanceof Error) {
                // Sanitize error messages and stack traces
                return {
                    message: this.sanitize(arg.message),
                    stack: this.isProduction ? '[Stack trace hidden in production]' : this.sanitize(arg.stack || '')
                };
            }
            return typeof arg === 'string' ? this.sanitize(arg) : arg;
        });
        
        console.error('[ERROR]', ...sanitizedArgs);
        this.addToBuffer('error', args);
    }

    /**
     * Performance timing (only in development)
     */
    time(label) {
        if (this.shouldLog('debug')) {
            console.time(label);
        }
    }

    timeEnd(label) {
        if (this.shouldLog('debug')) {
            console.timeEnd(label);
        }
    }

    /**
     * Table display (only in development)
     */
    table(data) {
        if (this.shouldLog('debug')) {
            console.table(data);
        }
    }

    /**
     * Get recent logs for debugging
     */
    getRecentLogs(count = 20) {
        return this.logBuffer.slice(-count);
    }

    /**
     * Clear log buffer
     */
    clearLogs() {
        this.logBuffer = [];
    }

    /**
     * Export logs for debugging
     */
    exportLogs() {
        return JSON.stringify(this.logBuffer, null, 2);
    }

    /**
     * Enable/disable debug mode at runtime
     */
    setDebugMode(enabled) {
        this.isDebugMode = enabled;
        this.logLevel = this.isProduction && !this.isDebugMode ? 'error' : 'debug';
        
        if (enabled) {
            this.info('Debug mode enabled');
        }
    }
}

// Create and export singleton instance
export const logger = new Logger();

// Only expose to window in development for debugging (browser only)
if (typeof window !== 'undefined' && logger.isDevelopment) {
    window.logger = logger;
}