/**
 * AnalyticsManager.js
 * Privacy-compliant analytics system for PhotoPackager Web Edition
 * Tracks usage metrics without collecting personal information
 */

export class AnalyticsManager {
    constructor() {
        this.endpoint = '/api/analytics';
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.metrics = {
            photosProcessed: 0,
            totalSizeProcessed: 0,
            processingTime: 0,
            errors: 0,
            completedSessions: 0
        };
    }

    /**
     * Generate anonymous session ID (no personal data)
     */
    generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    /**
     * Track page view / session start
     */
    trackSessionStart() {
        this.sendEvent('session_start', {
            userAgent: navigator.userAgent.substring(0, 100), // Limited UA string
            screenResolution: `${screen.width}x${screen.height}`,
            timestamp: Date.now(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
    }

    /**
     * Track photo processing start
     */
    trackProcessingStart(fileCount, totalSize) {
        this.sendEvent('processing_start', {
            fileCount: fileCount,
            totalSize: Math.round(totalSize / 1024 / 1024), // Size in MB
            timestamp: Date.now()
        });
    }

    /**
     * Track successful processing completion
     */
    trackProcessingComplete(photosProcessed, processingTime, outputSize) {
        this.metrics.photosProcessed += photosProcessed;
        this.metrics.totalSizeProcessed += outputSize;
        this.metrics.processingTime += processingTime;
        this.metrics.completedSessions++;

        this.sendEvent('processing_complete', {
            photosProcessed: photosProcessed,
            processingTimeMs: processingTime,
            outputSizeMB: Math.round(outputSize / 1024 / 1024),
            timestamp: Date.now()
        });
    }

    /**
     * Track processing errors
     */
    trackError(errorType, errorMessage) {
        this.metrics.errors++;
        
        this.sendEvent('processing_error', {
            errorType: errorType,
            errorMessage: errorMessage.substring(0, 200), // Limit error message length
            timestamp: Date.now()
        });
    }

    /**
     * Track feature usage
     */
    trackFeatureUsage(feature, value) {
        this.sendEvent('feature_usage', {
            feature: feature,
            value: value,
            timestamp: Date.now()
        });
    }

    /**
     * Track session end
     */
    trackSessionEnd() {
        const sessionDuration = Date.now() - this.startTime;
        
        this.sendEvent('session_end', {
            sessionDuration: sessionDuration,
            photosProcessed: this.metrics.photosProcessed,
            totalSizeProcessed: this.metrics.totalSizeProcessed,
            completedSessions: this.metrics.completedSessions,
            errors: this.metrics.errors,
            timestamp: Date.now()
        });
    }

    /**
     * Send event to analytics endpoint (privacy-compliant)
     */
    async sendEvent(eventType, data) {
        try {
            // Only send if user has consented to analytics
            if (!this.hasAnalyticsConsent()) {
                return;
            }

            const payload = {
                sessionId: this.sessionId,
                eventType: eventType,
                data: data,
                url: window.location.pathname,
                referrer: document.referrer ? new URL(document.referrer).hostname : 'direct',
                timestamp: Date.now()
            };

            // For now, log to console (replace with actual endpoint)
            console.log('📊 Analytics Event:', payload);

            // Uncomment when backend is ready:
            /*
            await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            */

        } catch (error) {
            console.error('Analytics error:', error);
        }
    }

    /**
     * Check if user has consented to analytics
     */
    hasAnalyticsConsent() {
        return localStorage.getItem('analytics_consent') === 'true';
    }

    /**
     * Set analytics consent
     */
    setAnalyticsConsent(consent) {
        localStorage.setItem('analytics_consent', consent.toString());
        if (consent) {
            this.trackSessionStart();
        }
    }

    /**
     * Get current session metrics
     */
    getSessionMetrics() {
        return {
            ...this.metrics,
            sessionDuration: Date.now() - this.startTime,
            sessionId: this.sessionId
        };
    }
}

// Global instance
window.analytics = new AnalyticsManager();

// Track session end on page unload
window.addEventListener('beforeunload', () => {
    window.analytics.trackSessionEnd();
});

// Track page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        window.analytics.trackSessionEnd();
    } else {
        window.analytics.trackSessionStart();
    }
});