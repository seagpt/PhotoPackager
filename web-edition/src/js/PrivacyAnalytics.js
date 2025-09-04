/**
 * PhotoPackager Web Edition - Privacy-First Analytics Implementation
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
 * PrivacyAnalytics.js
 * Privacy-first analytics implementation supporting Plausible and Umami
 * ZERO PII collection - no cookies, no fingerprinting, no tracking
 */

import { config } from './Config.js';
import { logger } from './Logger.js';

export class PrivacyAnalytics {
    constructor(config = {}) {
        // Configuration for analytics provider
        this.provider = config.provider || 'plausible'; // 'plausible', 'umami', or 'none'
        this.domain = config.domain || window.location.hostname;
        this.apiEndpoint = config.apiEndpoint || null;
        this.siteId = config.siteId || null; // For Umami
        
        // Privacy settings
        this.enabled = this.checkConsent();
        this.respectDNT = true; // Respect Do Not Track
        this.anonymizeIP = true; // Always anonymize IPs
        this.noCookies = true; // Never use cookies
        this.noFingerprinting = true; // No device fingerprinting
        
        // Session data (memory only, no persistence)
        this.sessionId = this.generateAnonymousId();
        this.sessionStart = Date.now();
        
        // Aggregated metrics (no individual tracking)
        this.metrics = {
            events: 0,
            errors: 0,
            duration: 0
        };
        
        // Initialize provider
        this.initializeProvider();
    }

    /**
     * Initialize the analytics provider
     */
    initializeProvider() {
        if (!this.enabled) {
            config.log('Analytics disabled - respecting user privacy');
            return;
        }

        switch (this.provider) {
            case 'plausible':
                this.initializePlausible();
                break;
            case 'umami':
                this.initializeUmami();
                break;
            case 'none':
                config.log('Analytics provider set to none');
                break;
            default:
                logger.warn('Unknown analytics provider:', this.provider);
        }
    }

    /**
     * Initialize Plausible Analytics
     */
    initializePlausible() {
        // Check if Plausible script is already loaded
        if (!window.plausible) {
            // Create Plausible queue
            window.plausible = window.plausible || function() { 
                (window.plausible.q = window.plausible.q || []).push(arguments);
            };
            
            // Load Plausible script
            const script = document.createElement('script');
            script.defer = true;
            script.dataset.domain = this.domain;
            script.src = this.apiEndpoint || 'https://plausible.io/js/script.js';
            
            // Add privacy attributes
            script.dataset.excludeParams = '/(.*)'; // Exclude all URL params
            script.dataset.cookiePolicy = 'strict'; // No cookies
            
            document.head.appendChild(script);
        }
        
        config.log('Plausible Analytics initialized');
    }

    /**
     * Initialize Umami Analytics
     */
    initializeUmami() {
        // Check if Umami script is already loaded
        if (!window.umami) {
            const script = document.createElement('script');
            script.async = true;
            script.defer = true;
            script.dataset.websiteId = this.siteId;
            script.src = this.apiEndpoint || 'https://analytics.umami.is/script.js';
            
            // Privacy settings
            script.dataset.doNotTrack = 'true';
            script.dataset.domains = this.domain;
            
            document.head.appendChild(script);
        }
        
        config.log('Umami Analytics initialized');
    }

    /**
     * Check if analytics should be enabled
     */
    checkConsent() {
        // Check Do Not Track
        if (this.respectDNT && navigator.doNotTrack === '1') {
            return false;
        }
        
        // Check for user consent (stored in localStorage)
        const consent = localStorage.getItem('analytics_consent');
        if (consent === 'denied') {
            return false;
        }
        
        // Default to enabled (can be changed to require explicit consent)
        return consent === 'granted' || consent === null;
    }

    /**
     * Generate anonymous session ID (no PII)
     */
    generateAnonymousId() {
        return 'anon_' + Math.random().toString(36).substring(2, 11);
    }

    /**
     * Track page view (no PII)
     */
    trackPageView(page = null) {
        if (!this.enabled) return;
        
        const pageUrl = page || window.location.pathname;
        
        switch (this.provider) {
            case 'plausible':
                if (window.plausible) {
                    window.plausible('pageview');
                }
                break;
            case 'umami':
                if (window.umami) {
                    window.umami.track('pageview', { url: pageUrl });
                }
                break;
        }
        
        this.metrics.events++;
    }

    /**
     * Track custom event (no PII)
     */
    trackEvent(eventName, props = {}) {
        if (!this.enabled) return;
        
        // Sanitize event name
        const safeName = this.sanitizeEventName(eventName);
        
        // Remove any PII from props
        const safeProps = this.sanitizeProperties(props);
        
        switch (this.provider) {
            case 'plausible':
                if (window.plausible) {
                    window.plausible(safeName, { props: safeProps });
                }
                break;
            case 'umami':
                if (window.umami) {
                    window.umami.track(safeName, safeProps);
                }
                break;
        }
        
        this.metrics.events++;
    }

    /**
     * Track processing metrics (aggregated only)
     */
    trackProcessing(data) {
        if (!this.enabled) return;
        
        // Only track aggregated metrics, no file names or paths
        const metrics = {
            file_count: data.fileCount || 0,
            total_size_mb: Math.round((data.totalSize || 0) / 1048576),
            duration_seconds: Math.round((data.duration || 0) / 1000),
            success_rate: data.successRate || 100,
            output_formats: data.outputFormats || []
        };
        
        this.trackEvent('processing_complete', metrics);
    }

    /**
     * Track errors (no sensitive data)
     */
    trackError(errorType, category = 'general') {
        if (!this.enabled) return;
        
        // Only track error type and category, no messages or stack traces
        this.trackEvent('error', {
            type: this.sanitizeEventName(errorType),
            category: this.sanitizeEventName(category)
        });
        
        this.metrics.errors++;
    }

    /**
     * Track feature usage (anonymous)
     */
    trackFeature(featureName, value = null) {
        if (!this.enabled) return;
        
        const data = {
            feature: this.sanitizeEventName(featureName)
        };
        
        // Only include value if it's not PII
        if (value !== null && typeof value !== 'string') {
            data.value = value;
        }
        
        this.trackEvent('feature_usage', data);
    }

    /**
     * Track performance metrics (no PII)
     */
    trackPerformance(metric, value) {
        if (!this.enabled) return;
        
        this.trackEvent('performance', {
            metric: this.sanitizeEventName(metric),
            value: Math.round(value)
        });
    }

    /**
     * Sanitize event name to prevent PII leakage
     */
    sanitizeEventName(name) {
        if (!name) return 'unknown';
        
        // Remove any potential PII patterns
        return String(name)
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')
            .replace(/_{2,}/g, '_')
            .substring(0, 50); // Limit length
    }

    /**
     * Sanitize properties to remove PII
     */
    sanitizeProperties(props) {
        const safe = {};
        const allowedTypes = ['number', 'boolean'];
        const blockedKeys = ['email', 'name', 'user', 'id', 'ip', 'address', 'phone', 'ssn'];
        
        for (const [key, value] of Object.entries(props)) {
            const lowerKey = key.toLowerCase();
            
            // Block keys that might contain PII
            if (blockedKeys.some(blocked => lowerKey.includes(blocked))) {
                continue;
            }
            
            // Only allow safe value types
            if (allowedTypes.includes(typeof value)) {
                safe[this.sanitizeEventName(key)] = value;
            } else if (Array.isArray(value)) {
                // Arrays of safe values only
                safe[this.sanitizeEventName(key)] = value
                    .filter(v => allowedTypes.includes(typeof v))
                    .slice(0, 10); // Limit array size
            } else if (typeof value === 'string') {
                // Only allow specific safe string values
                const safeStrings = ['true', 'false', 'yes', 'no', 'enabled', 'disabled'];
                if (safeStrings.includes(value.toLowerCase())) {
                    safe[this.sanitizeEventName(key)] = value.toLowerCase();
                }
            }
        }
        
        return safe;
    }

    /**
     * Get browser info without fingerprinting
     */
    getBrowserInfo() {
        // Only basic, non-identifying info
        const ua = navigator.userAgent.toLowerCase();
        
        let browser = 'unknown';
        if (ua.includes('chrome')) browser = 'chrome';
        else if (ua.includes('firefox')) browser = 'firefox';
        else if (ua.includes('safari')) browser = 'safari';
        else if (ua.includes('edge')) browser = 'edge';
        
        let os = 'unknown';
        if (ua.includes('windows')) os = 'windows';
        else if (ua.includes('mac')) os = 'mac';
        else if (ua.includes('linux')) os = 'linux';
        else if (ua.includes('android')) os = 'android';
        else if (ua.includes('ios')) os = 'ios';
        
        return { browser, os };
    }

    /**
     * Update user consent
     */
    updateConsent(granted) {
        localStorage.setItem('analytics_consent', granted ? 'granted' : 'denied');
        this.enabled = granted && this.checkConsent();
        
        if (!this.enabled) {
            config.log('Analytics disabled by user preference');
        } else {
            config.log('Analytics enabled with user consent');
            this.initializeProvider();
        }
    }

    /**
     * Disable analytics
     */
    disable() {
        this.enabled = false;
        config.log('Analytics disabled');
    }

    /**
     * Get privacy policy
     */
    getPrivacyInfo() {
        return {
            enabled: this.enabled,
            provider: this.provider,
            respectsDNT: this.respectDNT,
            anonymizesIP: this.anonymizeIP,
            usesCookies: !this.noCookies,
            usesFingerprinting: !this.noFingerprinting,
            dataCollected: [
                'Page views (URL path only)',
                'Anonymous events (no PII)',
                'Basic browser type (Chrome, Firefox, etc)',
                'Basic OS type (Windows, Mac, etc)',
                'Aggregated processing metrics',
                'Error types (no messages or stack traces)'
            ],
            dataNotCollected: [
                'IP addresses',
                'User identifiers',
                'Personal information',
                'File names or paths',
                'Error messages or stack traces',
                'Device fingerprints',
                'Cookies or tracking pixels',
                'Third-party tracking'
            ]
        };
    }

    /**
     * Clean up analytics
     */
    cleanup() {
        // Track session end
        if (this.enabled) {
            const duration = Date.now() - this.sessionStart;
            this.trackEvent('session_end', {
                duration_seconds: Math.round(duration / 1000),
                events: this.metrics.events,
                errors: this.metrics.errors
            });
        }
        
        // Clear session data
        this.metrics = { events: 0, errors: 0, duration: 0 };
    }
}

// Create and export singleton instance
export const privacyAnalytics = new PrivacyAnalytics({
    provider: 'plausible', // Default to Plausible
    domain: window.location.hostname,
    // For self-hosted, set apiEndpoint and siteId in config
});

// Make available globally for configuration
if (typeof window !== 'undefined') {
    window.privacyAnalytics = privacyAnalytics;
}