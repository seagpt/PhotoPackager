/**
 * PhotoPackager Web Edition - DOM Sanitizer
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
 * DOMSanitizer.js
 * Comprehensive input sanitization for XSS prevention (ASAP-021)
 */

import { config } from './Config.js';

export class DOMSanitizer {
    constructor() {
        // Configuration for sanitization policies
        this.config = {
            allowedTags: ['b', 'i', 'u', 'strong', 'em', 'br', 'p', 'span'],
            allowedAttributes: ['class', 'id'],
            maxLength: 10000 // Maximum string length to process
        };
    }

    /**
     * Sanitize HTML content to prevent XSS attacks (ASAP-021)
     */
    sanitizeHTML(input) {
        if (!input || typeof input !== 'string') {
            return '';
        }

        // Truncate overly long inputs
        if (input.length > this.config.maxLength) {
            input = input.substring(0, this.config.maxLength);
        }

        return input
            // Remove script tags completely
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            
            // Remove dangerous event handlers
            .replace(/\son\w+\s*=\s*[^>]*>/gi, '>')
            
            // Remove javascript: and data: protocols
            .replace(/javascript:/gi, '')
            .replace(/data:(?!image\/)/gi, '') // Allow data: for images only
            .replace(/vbscript:/gi, '')
            
            // Remove potentially dangerous tags
            .replace(/<(iframe|object|embed|applet|meta|link|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
            .replace(/<(iframe|object|embed|applet|meta|link|style)[^>]*\/?>/gi, '')
            
            // Remove form elements that could be used for attacks
            .replace(/<(form|input|textarea|select|button)[^>]*>[\s\S]*?<\/\1>/gi, '')
            .replace(/<(form|input|textarea|select|button)[^>]*\/?>/gi, '')
            
            // Escape remaining HTML entities
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    /**
     * Sanitize text content (no HTML allowed)
     */
    sanitizeText(input) {
        if (!input || typeof input !== 'string') {
            return '';
        }

        // Truncate overly long inputs
        if (input.length > this.config.maxLength) {
            input = input.substring(0, this.config.maxLength);
        }

        return input
            // Remove all HTML tags
            .replace(/<[^>]*>/g, '')
            
            // Escape HTML entities
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            
            // Remove control characters except newlines and tabs
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
            
            // Normalize whitespace
            .trim();
    }

    /**
     * Sanitize file names and paths
     */
    sanitizeFileName(input) {
        if (!input || typeof input !== 'string') {
            return 'sanitized_file';
        }

        return input
            // Remove path traversal
            .replace(/\.\.\/|\.\.\\|\.\.\//g, '')
            .replace(/\.\./g, '')
            
            // Remove dangerous characters
            .replace(/[<>:"/\\|?*\x00-\x1f\x7f-\x9f]/g, '_')
            .replace(/[#%&{}$!'"`@+]/g, '_')
            
            // Remove scripts and HTML
            .replace(/<[^>]*>/g, '')
            .replace(/javascript:/gi, '')
            
            // Clean up
            .replace(/\s+/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '')
            .substring(0, 255)
            .trim() || 'sanitized_file';
    }

    /**
     * Safe DOM content setting - prevents XSS
     */
    setTextContent(element, text) {
        if (!element) return;
        
        // Use textContent instead of innerHTML for safety
        element.textContent = this.sanitizeText(text);
    }

    /**
     * Safe DOM HTML setting with sanitization
     */
    setInnerHTML(element, html) {
        if (!element) return;
        
        // Sanitize HTML before setting
        const sanitizedHTML = this.sanitizeHTML(html);
        element.innerHTML = sanitizedHTML;
    }

    /**
     * Create safe HTML elements
     */
    createElement(tagName, options = {}) {
        const element = document.createElement(tagName);
        
        // Set text content safely
        if (options.text) {
            this.setTextContent(element, options.text);
        }
        
        // Set HTML content safely
        if (options.html) {
            this.setInnerHTML(element, options.html);
        }
        
        // Set attributes safely
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                // Sanitize attribute values
                const sanitizedValue = this.sanitizeText(value);
                element.setAttribute(key, sanitizedValue);
            });
        }
        
        // Set CSS classes safely
        if (options.className) {
            element.className = this.sanitizeText(options.className);
        }
        
        return element;
    }

    /**
     * Validate and sanitize form inputs
     */
    sanitizeFormInput(input) {
        if (!input || typeof input !== 'object') {
            return {};
        }

        const sanitized = {};
        
        Object.entries(input).forEach(([key, value]) => {
            // Sanitize the key name
            const sanitizedKey = this.sanitizeText(key);
            
            // Sanitize the value based on type
            if (typeof value === 'string') {
                sanitized[sanitizedKey] = this.sanitizeText(value);
            } else if (typeof value === 'number') {
                sanitized[sanitizedKey] = isNaN(value) ? 0 : value;
            } else if (typeof value === 'boolean') {
                sanitized[sanitizedKey] = Boolean(value);
            } else {
                // For complex types, convert to string and sanitize
                sanitized[sanitizedKey] = this.sanitizeText(String(value));
            }
        });

        return sanitized;
    }

    /**
     * Sanitize error messages before display
     */
    sanitizeErrorMessage(message) {
        if (!message || typeof message !== 'string') {
            return 'An error occurred';
        }

        // Remove technical details that could be exploited
        return this.sanitizeText(message)
            .replace(/file:\/\/[^\s]*/g, '[file path]') // Remove file paths
            .replace(/https?:\/\/[^\s]*/g, '[URL]') // Remove URLs
            .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]') // Remove IP addresses
            .replace(/[a-zA-Z]:[\\\/][^\s]*/g, '[path]') // Remove Windows paths
            .substring(0, 500); // Limit length
    }

    /**
     * Log sanitization events for monitoring
     */
    logSanitization(type, original, sanitized) {
        if (original !== sanitized) {
            config.log(`Sanitization applied (${type}): Content was modified for security`);
            
            // Track in analytics if available
            if (window.analytics) {
                window.analytics.trackError('content_sanitized', type);
            }
        }
    }
}

// Export singleton instance
export const domSanitizer = new DOMSanitizer();

// Make it globally available for emergency use
if (typeof window !== 'undefined') {
    window.domSanitizer = domSanitizer;
}