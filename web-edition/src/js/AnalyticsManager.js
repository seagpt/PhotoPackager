/**
 * PhotoPackager Web Edition - Privacy-Compliant Analytics Manager
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
 * AnalyticsManager.js
 * Privacy-compliant analytics system for PhotoPackager Web Edition
 * Tracks usage metrics without collecting personal information
 */

import { config } from './Config.js';
import { networkUtils } from './NetworkUtils.js';
import { privacyAnalytics } from './PrivacyAnalytics.js';
import { logger } from './Logger.js';

export class AnalyticsManager {
    constructor() {
        // Use the privacy-focused analytics provider
        this.analytics = privacyAnalytics;
        
        // Session tracking (anonymous)
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        
        // Aggregated metrics only (no individual tracking)
        this.metrics = {
            photosProcessed: 0,
            totalSizeProcessed: 0,
            processingTime: 0,
            errors: 0,
            completedSessions: 0,
            featuresUsed: new Set()
        };
        
        // Track initial page view
        this.analytics.trackPageView();
    }

    /**
     * Generate anonymous session ID (no personal data)
     */
    generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    /**
     * Track session start
     */
    trackSessionStart() {
        this.analytics.trackEvent('session_start', {
            screen_width: Math.round(screen.width / 100) * 100, // Round to nearest 100
            screen_height: Math.round(screen.height / 100) * 100
        });
    }

    /**
     * Track photo processing start
     */
    trackProcessingStart(fileCount, totalSize) {
        this.metrics.photosProcessed += fileCount;
        this.metrics.totalSizeProcessed += totalSize;
        
        this.analytics.trackEvent('processing_start', {
            file_count: fileCount,
            size_mb: Math.round(totalSize / 1024 / 1024) // Size in MB
        });
    }

    /**
     * Track successful processing completion
     */
    trackProcessingComplete(photosProcessed, processingTime, outputSize) {
        this.metrics.completedSessions++;
        this.metrics.processingTime += processingTime;
        
        this.analytics.trackProcessing({
            fileCount: photosProcessed,
            duration: processingTime,
            totalSize: outputSize,
            successRate: 100,
            outputFormats: this.getUsedFormats()
        });
    }

    /**
     * Track processing errors
     */
    trackError(errorType, errorMessage = null) {
        this.metrics.errors++;
        
        // Never send error messages (PII risk)
        this.analytics.trackError(errorType, this.categorizeError(errorType));
    }

    /**
     * Track feature usage
     */
    trackFeatureUsage(feature, value = null) {
        this.metrics.featuresUsed.add(feature);
        this.analytics.trackFeature(feature, value);
    }

    /**
     * Track session end
     */
    trackSessionEnd() {
        const sessionDuration = Date.now() - this.startTime;
        
        this.analytics.trackEvent('session_end', {
            duration_seconds: Math.round(sessionDuration / 1000),
            photos_processed: this.metrics.photosProcessed,
            sessions_completed: this.metrics.completedSessions,
            errors_count: this.metrics.errors
        });
    }

    /**
     * Get used output formats (for analytics)
     */
    getUsedFormats() {
        const formats = [];
        if (this.metrics.featuresUsed.has('generateOptimizedJPG')) formats.push('jpg');
        if (this.metrics.featuresUsed.has('generateOptimizedWebP')) formats.push('webp');
        if (this.metrics.featuresUsed.has('generateCompressedJPG')) formats.push('compressed_jpg');
        if (this.metrics.featuresUsed.has('generateCompressedWebP')) formats.push('compressed_webp');
        return formats;
    }

    /**
     * Categorize error types (no PII)
     */
    categorizeError(errorType) {
        if (!errorType) return 'unknown';
        
        const type = errorType.toLowerCase();
        if (type.includes('memory')) return 'memory';
        if (type.includes('file')) return 'file';
        if (type.includes('network')) return 'network';
        if (type.includes('process')) return 'processing';
        if (type.includes('cancel')) return 'cancellation';
        if (type.includes('validation')) return 'validation';
        if (type.includes('indexeddb')) return 'storage';
        return 'general';
    }

    /**
     * Track browser and OS distribution (anonymous)
     */
    trackBrowserOS() {
        const info = this.analytics.getBrowserInfo();
        this.analytics.trackEvent('environment', info);
    }

    /**
     * Legacy batch processing (now handled by PrivacyAnalytics)
     */
    async sendEvent(eventType, data) {
        try {
            // Only send if user has consented to analytics
            if (!this.hasAnalyticsConsent()) {
                config.log('📊 Analytics (no consent):', eventType, data);
                return;
            }

            const payload = {
                sessionId: this.sessionId,
                eventType: eventType,
                data: data,
                url: window.location.pathname,
                referrer: document.referrer ? new URL(document.referrer).hostname : 'direct',
                timestamp: Date.now(),
                version: '1.0.0-web'
            };

            // Add to batch queue
            this.batchQueue.push(payload);
            config.log('📊 Analytics Event Queued:', payload);

            // Flush if batch is full
            if (this.batchQueue.length >= this.maxBatchSize) {
                this.flushBatch();
            }

        } catch (error) {
            logger.error('Analytics error:', error);
        }
    }

    /**
     * Send batched events to endpoint
     */
    async flushBatch() {
        if (this.batchQueue.length === 0) return;

        const batch = [...this.batchQueue];
        this.batchQueue = [];

        try {
            const batchPayload = {
                events: batch,
                batchId: this.generateSessionId(),
                appName: 'PhotoPackager-Web',
                batchTimestamp: Date.now()
            };

            config.log('📊 Sending Analytics Batch:', batchPayload.events.length, 'events');

            // Use robust network utils with retry logic (ASAP-037)
            const requestOptions = {
                headers: {
                    'User-Agent': 'PhotoPackager-Web/1.0.0'
                }
            };

            const retryOptions = {
                maxRetries: 2,
                timeout: 8000,
                baseDelay: 1000,
                onRetry: (error, attempt, delay) => {
                    config.log(`📊 Analytics retry ${attempt}/2 in ${delay}ms:`, error.message);
                }
            };

            // Try primary endpoint with robust retry logic
            try {
                const response = await networkUtils.postJSON(
                    this.endpoint, 
                    batchPayload, 
                    requestOptions, 
                    retryOptions
                );
                config.log('📊 Analytics batch sent successfully to primary endpoint');
                
            } catch (primaryError) {
                config.log('📊 Primary endpoint failed after retries, trying fallback...');
                
                try {
                    // Try fallback endpoint with same retry logic
                    const response = await networkUtils.postJSON(
                        this.fallbackEndpoint, 
                        batchPayload, 
                        requestOptions, 
                        retryOptions
                    );
                    config.log('📊 Analytics batch sent successfully to fallback endpoint');
                    
                } catch (fallbackError) {
                    logger.warn('📊 Analytics batch failed on both endpoints:', fallbackError.message);
                    // Don't throw - analytics failures shouldn't break the app
                }
            }

        } catch (error) {
            logger.error('Analytics batch error:', error);
            // On error, don't re-queue to avoid infinite loops
        }
    }

    /**
     * Check if user has consented to analytics
     */
    hasAnalyticsConsent() {
        const consent = localStorage.getItem('analytics_consent');
        return consent !== 'denied';
    }

    /**
     * Set analytics consent
     */
    setAnalyticsConsent(consent) {
        this.analytics.updateConsent(consent);
        if (consent) {
            this.trackSessionStart();
            this.trackBrowserOS();
        }
    }
    
    /**
     * Disable analytics completely
     */
    disable() {
        this.analytics.disable();
    }
    
    /**
     * Get privacy information
     */
    getPrivacyInfo() {
        return this.analytics.getPrivacyInfo();
    }

    /**
     * Get current session metrics
     */
    getSessionMetrics() {
        return {
            ...this.metrics,
            sessionDuration: Date.now() - this.startTime,
            sessionId: this.sessionId,
            queuedEvents: this.batchQueue.length
        };
    }

    /**
     * Cleanup analytics resources
     */
    cleanup() {
        if (this.batchInterval) {
            clearInterval(this.batchInterval);
            this.batchInterval = null;
        }
        
        // Flush any remaining events
        this.flushBatch();
    }
}

// Global instance
window.analytics = new AnalyticsManager();

// Track session end on page unload
window.addEventListener('beforeunload', () => {
    window.analytics.trackSessionEnd();
    window.analytics.cleanup();
});

// Track page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        window.analytics.trackSessionEnd();
        window.analytics.flushBatch(); // Ensure events are sent when hidden
    } else {
        window.analytics.trackSessionStart();
    }
});

// Cleanup on page unload
window.addEventListener('unload', () => {
    window.analytics.cleanup();
});