/**
 * PhotoPackager Web Edition - Memory Usage Monitor
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
 * MemoryMonitor.js
 * Advanced memory usage monitoring with user warnings and automatic cleanup
 */

import { config } from './Config.js';
import { logger } from './Logger.js';

export class MemoryMonitor {
    constructor() {
        this.isSupported = 'memory' in performance;
        this.monitorInterval = null;
        this.checkFrequency = 3000; // Check every 3 seconds
        this.warningThreshold = 0.75; // Warn at 75%
        this.killSwitchThreshold = 0.80; // Kill switch at 80%
        this.criticalThreshold = 0.85; // Critical at 85%
        this.emergencyThreshold = 0.92; // Emergency at 92%
        
        this.lastWarningTime = 0;
        this.warningCooldown = 30000; // 30 seconds between warnings
        
        this.memoryHistory = [];
        this.maxHistorySize = 50; // Keep last 50 readings
        
        this.callbacks = {
            warning: [],
            killSwitch: [],
            critical: [],
            emergency: []
        };
        
        // Start monitoring automatically
        this.startMonitoring();
    }

    /**
     * Start memory monitoring
     */
    startMonitoring() {
        if (!this.isSupported) {
            logger.warn('Performance.memory API not supported - memory monitoring disabled');
            return;
        }

        if (this.monitorInterval) {
            this.stopMonitoring();
        }

        config.log('Starting memory monitoring...');
        this.monitorInterval = setInterval(() => {
            this.checkMemoryUsage();
        }, this.checkFrequency);

        // Initial check
        this.checkMemoryUsage();
    }

    /**
     * Stop memory monitoring
     */
    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
    }

    /**
     * Check current memory usage and trigger warnings
     */
    checkMemoryUsage() {
        if (!this.isSupported) return null;

        const memInfo = performance.memory;
        const stats = {
            used: memInfo.usedJSHeapSize,
            total: memInfo.totalJSHeapSize,
            limit: memInfo.jsHeapSizeLimit,
            usedMB: Math.round(memInfo.usedJSHeapSize / 1024 / 1024),
            totalMB: Math.round(memInfo.totalJSHeapSize / 1024 / 1024),
            limitMB: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024),
            usagePercent: (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100,
            timestamp: Date.now()
        };

        // Add to history
        this.memoryHistory.push(stats);
        if (this.memoryHistory.length > this.maxHistorySize) {
            this.memoryHistory.shift();
        }

        // Check for memory pressure
        this.evaluateMemoryPressure(stats);

        return stats;
    }

    /**
     * Evaluate memory pressure and trigger appropriate responses
     */
    evaluateMemoryPressure(stats) {
        const usageRatio = stats.usagePercent / 100;
        const now = Date.now();
        const canWarn = now - this.lastWarningTime > this.warningCooldown;

        if (usageRatio >= this.emergencyThreshold) {
            // Emergency - immediate action required
            this.triggerEmergency(stats);
        } else if (usageRatio >= this.criticalThreshold) {
            // Critical - strong warning and cleanup
            this.triggerCritical(stats);
        } else if (usageRatio >= this.killSwitchThreshold) {
            // Kill switch at 80% - stop processing immediately
            this.triggerKillSwitch(stats);
        } else if (usageRatio >= this.warningThreshold && canWarn) {
            // Warning - inform user
            this.triggerWarning(stats);
            this.lastWarningTime = now;
        }
    }

    /**
     * Trigger warning level response
     */
    triggerWarning(stats) {
        logger.warn(`Memory usage warning: ${stats.usagePercent.toFixed(1)}% (${stats.usedMB}MB / ${stats.limitMB}MB)`);
        
        const message = `Memory usage is at ${stats.usagePercent.toFixed(1)}%. Consider processing fewer photos at once for better performance.`;
        
        if (window.errorHandler) {
            window.errorHandler.showWarning('High Memory Usage', message, [
                { text: 'Reduce File Count', action: () => this.suggestOptimizations() },
                { text: 'Continue', action: () => {} }
            ]);
        }

        // Execute warning callbacks
        this.callbacks.warning.forEach(callback => {
            try {
                callback(stats);
            } catch (e) {
                logger.error('Memory warning callback failed:', e);
            }
        });

        // Track in analytics
        if (window.analytics) {
            window.analytics.trackError('memory_warning', `${stats.usagePercent.toFixed(1)}%`);
        }
    }

    /**
     * Trigger kill switch at 80% memory usage
     */
    triggerKillSwitch(stats) {
        logger.error(`KILL SWITCH ACTIVATED: Memory usage at ${stats.usagePercent.toFixed(1)}% (${stats.usedMB}MB / ${stats.limitMB}MB)`);
        
        const message = `Memory kill switch activated at ${stats.usagePercent.toFixed(1)}%! Processing has been stopped to prevent browser crashes.`;
        
        if (window.errorHandler) {
            window.errorHandler.showError('Memory Kill Switch Activated', message, [
                { text: 'Clear Memory', action: () => this.forceCleanup() },
                { text: 'Reload Page', action: () => window.location.reload() }
            ]);
        }

        // Execute kill switch callbacks
        this.callbacks.killSwitch.forEach(callback => {
            try {
                callback(stats);
            } catch (e) {
                logger.error('Memory kill switch callback failed:', e);
            }
        });

        // Immediate actions: Stop processing immediately
        if (window.photoPackagerApp && window.photoPackagerApp.processing) {
            window.photoPackagerApp.cancelProcessing();
            config.log('PhotoPackager processing cancelled due to memory kill switch');
        }

        // Stop any active image processing
        if (window.imageProcessor) {
            window.imageProcessor.cancelAllProcessing();
        }

        // Emergency cleanup
        this.performCriticalCleanup();

        // Track in analytics
        if (window.analytics) {
            window.analytics.trackError('memory_kill_switch', `${stats.usagePercent.toFixed(1)}%`);
        }
    }

    /**
     * Trigger critical level response
     */
    triggerCritical(stats) {
        logger.error(`CRITICAL memory usage: ${stats.usagePercent.toFixed(1)}% (${stats.usedMB}MB / ${stats.limitMB}MB)`);
        
        const message = `Critical memory usage at ${stats.usagePercent.toFixed(1)}%! Processing will be slowed to prevent crashes.`;
        
        if (window.errorHandler) {
            window.errorHandler.showWarning('Critical Memory Usage', message, [
                { text: 'Force Cleanup', action: () => this.forceCleanup() },
                { text: 'Reduce Files', action: () => this.emergencyFileReduction() }
            ]);
        }

        // Execute critical callbacks
        this.callbacks.critical.forEach(callback => {
            try {
                callback(stats);
            } catch (e) {
                logger.error('Memory critical callback failed:', e);
            }
        });

        // Automatic cleanup
        this.performCriticalCleanup();
    }

    /**
     * Trigger emergency level response
     */
    triggerEmergency(stats) {
        logger.error(`EMERGENCY memory usage: ${stats.usagePercent.toFixed(1)}% - Taking immediate action!`);
        
        // Execute emergency callbacks
        this.callbacks.emergency.forEach(callback => {
            try {
                callback(stats);
            } catch (e) {
                logger.error('Memory emergency callback failed:', e);
            }
        });

        // Immediate emergency actions
        this.performEmergencyCleanup();
        
        // Stop processing if active
        if (window.photoPackagerApp && window.photoPackagerApp.processing) {
            window.photoPackagerApp.cancelProcessing();
        }
    }

    /**
     * Perform critical level cleanup
     */
    performCriticalCleanup() {
        // Force garbage collection
        if (window.gc) {
            try {
                for (let i = 0; i < 3; i++) {
                    window.gc();
                }
            } catch (e) {
                logger.warn('Force GC failed:', e);
            }
        }

        // Clear browser caches
        this.clearBrowserCaches();
        
        // Reduce processing batch size
        if (window.performanceOptimizer) {
            window.performanceOptimizer.adjustBatchSize('decrease');
        }
    }

    /**
     * Perform emergency cleanup
     */
    performEmergencyCleanup() {
        config.log('Performing emergency memory cleanup...');
        
        // Aggressive garbage collection
        this.performCriticalCleanup();
        
        // Clear all possible caches
        this.clearAllCaches();
        
        // Revoke all blob URLs
        this.revokeAllBlobUrls();
        
        // Clear DOM elements that might hold references
        this.clearDomReferences();
    }

    /**
     * Clear browser caches
     */
    async clearBrowserCaches() {
        try {
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            }
        } catch (e) {
            logger.warn('Failed to clear caches:', e);
        }
    }

    /**
     * Clear all possible caches
     */
    async clearAllCaches() {
        await this.clearBrowserCaches();
        
        // Clear localStorage (except essential data)
        try {
            const toKeep = ['analytics_consent', 'photopackager-settings'];
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (!toKeep.includes(key)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (e) {
            logger.warn('Failed to clear localStorage:', e);
        }
    }

    /**
     * Revoke all blob URLs to free memory
     */
    revokeAllBlobUrls() {
        try {
            // Find all elements with blob URLs
            const elementsWithBlobs = document.querySelectorAll('[src^="blob:"], [href^="blob:"]');
            elementsWithBlobs.forEach(el => {
                const url = el.src || el.href;
                if (url) {
                    URL.revokeObjectURL(url);
                    if (el.src) el.src = '';
                    if (el.href) el.href = '#';
                }
            });
        } catch (e) {
            logger.warn('Failed to revoke blob URLs:', e);
        }
    }

    /**
     * Clear DOM references that might hold memory
     */
    clearDomReferences() {
        try {
            // Clear any cached computed styles
            document.body.offsetHeight; // Force style recalc
            
            // Remove any temporary elements
            const tempElements = document.querySelectorAll('[data-temp="true"]');
            tempElements.forEach(el => el.remove());
            
        } catch (e) {
            logger.warn('Failed to clear DOM references:', e);
        }
    }

    /**
     * Suggest performance optimizations to user
     */
    suggestOptimizations() {
        const suggestions = [
            'Process photos in smaller batches (25-50 files)',
            'Close other browser tabs to free memory',
            'Use smaller image files when possible',
            'Restart your browser if problems persist'
        ];

        const message = 'To improve performance and prevent crashes:\n\n' + 
                       suggestions.map(s => `• ${s}`).join('\n');

        alert(message);
    }

    /**
     * Force immediate cleanup
     */
    forceCleanup() {
        this.performEmergencyCleanup();
        
        setTimeout(() => {
            const newStats = this.checkMemoryUsage();
            if (newStats) {
                alert(`Cleanup complete. Memory usage: ${newStats.usagePercent.toFixed(1)}%`);
            }
        }, 1000);
    }

    /**
     * Emergency file count reduction
     */
    emergencyFileReduction() {
        if (window.errorHandler) {
            window.errorHandler.showWarning(
                'Emergency Memory Management',
                'Please process 25 files or fewer at a time to prevent browser crashes.',
                [{ text: 'Got It', action: () => {} }]
            );
        }
    }

    /**
     * Add callback for memory events
     */
    onMemoryEvent(level, callback) {
        if (this.callbacks[level]) {
            this.callbacks[level].push(callback);
        }
    }

    /**
     * Remove callback for memory events
     */
    offMemoryEvent(level, callback) {
        if (this.callbacks[level]) {
            const index = this.callbacks[level].indexOf(callback);
            if (index !== -1) {
                this.callbacks[level].splice(index, 1);
            }
        }
    }

    /**
     * Get memory usage statistics
     */
    getMemoryStats() {
        if (!this.isSupported) {
            return { supported: false };
        }

        const current = this.checkMemoryUsage();
        const trend = this.getMemoryTrend();

        return {
            supported: true,
            current,
            trend,
            thresholds: {
                warning: this.warningThreshold * 100,
                killSwitch: this.killSwitchThreshold * 100,
                critical: this.criticalThreshold * 100,
                emergency: this.emergencyThreshold * 100
            },
            history: this.memoryHistory.slice(-10) // Last 10 readings
        };
    }

    /**
     * Get memory usage trend
     */
    getMemoryTrend() {
        if (this.memoryHistory.length < 5) {
            return { direction: 'stable', rate: 0 };
        }

        const recent = this.memoryHistory.slice(-5);
        const oldest = recent[0].usagePercent;
        const newest = recent[recent.length - 1].usagePercent;
        const rate = newest - oldest;

        let direction = 'stable';
        if (rate > 5) direction = 'increasing';
        else if (rate < -5) direction = 'decreasing';

        return { direction, rate };
    }

    /**
     * Cleanup monitoring
     */
    cleanup() {
        this.stopMonitoring();
        this.callbacks.warning = [];
        this.callbacks.killSwitch = [];
        this.callbacks.critical = [];
        this.callbacks.emergency = [];
        this.memoryHistory = [];
    }
}

// Export singleton instance
export const memoryMonitor = new MemoryMonitor();

// Make it globally available
if (typeof window !== 'undefined') {
    window.memoryMonitor = memoryMonitor;
}