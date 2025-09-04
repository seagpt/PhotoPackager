/**
 * PhotoPackager Web Edition - Configuration Management
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
 * Config.js
 * Environment-based configuration system for PhotoPackager
 */

export class Config {
    constructor() {
        this.environment = this.detectEnvironment();
        this.config = this.loadConfiguration();
        
        // Make config globally available for debugging
        if (typeof window !== 'undefined') {
            window.photoPackagerConfig = this.config;
        }
        
        this.log(`PhotoPackager Config: Running in ${this.environment} mode`);
    }

    /**
     * Detect the current environment
     */
    detectEnvironment() {
        // Check for explicit environment variable (set by build process)
        if (typeof PHOTOPACKAGER_ENV !== 'undefined') {
            return PHOTOPACKAGER_ENV;
        }
        
        // Detect based on hostname (handle Node.js environments)
        if (typeof window === 'undefined' || !window.location) {
            // Node.js environment (testing) - default to development
            return 'development';
        }
        
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
            return 'development';
        }
        
        if (hostname.includes('staging') || hostname.includes('test')) {
            return 'staging';
        }
        
        if (hostname.includes('photopackager.dropshockdigital.com') || hostname.includes('github.io')) {
            return 'production';
        }
        
        // Default to development for safety
        return 'development';
    }

    /**
     * Load configuration based on environment
     */
    loadConfiguration() {
        const baseConfig = {
            // Application info
            appName: 'PhotoPackager',
            version: '1.0.0',
            buildDate: new Date().toISOString(),
            
            // Processing defaults
            processing: {
                defaultBatchSize: 25,
                maxBatchSize: 100,
                maxFileSizeMB: 500,
                timeoutMs: 300000, // 5 minutes per file
                
                // Memory thresholds
                memoryWarningPercent: 75,
                memoryKillSwitchPercent: 80,
                memoryCriticalPercent: 85,
                memoryEmergencyPercent: 92,
                
                // Canvas limits (will be overridden by browser detection)
                maxCanvasWidth: 8192,
                maxCanvasHeight: 8192,
                maxCanvasPixels: 16777216 // 4096x4096
            },
            
            // UI settings
            ui: {
                showAdvancedOptions: false,
                enableAnimations: true,
                autoSaveSettings: true,
                showDebugInfo: false
            },
            
            // Analytics and tracking
            analytics: {
                enabled: true,
                trackErrors: true,
                trackPerformance: true,
                trackUsage: false // Only anonymous usage patterns
            },
            
            // Error handling
            errors: {
                showTechnicalDetails: false,
                enableReporting: true,
                maxErrorLogEntries: 100
            }
        };

        // Environment-specific overrides
        const envConfigs = {
            development: {
                ui: {
                    showAdvancedOptions: true,
                    showDebugInfo: true
                },
                errors: {
                    showTechnicalDetails: true
                },
                analytics: {
                    enabled: false,
                    trackErrors: false,
                    trackPerformance: false
                }
            },
            
            staging: {
                ui: {
                    showAdvancedOptions: true,
                    showDebugInfo: true
                },
                errors: {
                    showTechnicalDetails: true
                },
                analytics: {
                    trackUsage: true
                }
            },
            
            production: {
                processing: {
                    defaultBatchSize: 50,
                    maxBatchSize: 200
                },
                ui: {
                    enableAnimations: true,
                    showDebugInfo: false
                },
                errors: {
                    showTechnicalDetails: false
                }
            }
        };

        // Merge base config with environment-specific config
        const envConfig = envConfigs[this.environment] || {};
        return this.deepMerge(baseConfig, envConfig);
    }

    /**
     * Deep merge two configuration objects
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    result[key] = this.deepMerge(target[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    }

    /**
     * Get configuration value by path (e.g., 'processing.maxBatchSize')
     */
    get(path, defaultValue = null) {
        const keys = path.split('.');
        let current = this.config;
        
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return defaultValue;
            }
        }
        
        return current;
    }

    /**
     * Set configuration value by path
     */
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = this.config;
        
        // Navigate to parent object
        for (const key of keys) {
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[lastKey] = value;
    }

    /**
     * Get the current environment
     */
    getEnvironment() {
        return this.environment;
    }

    /**
     * Check if running in development mode
     */
    isDevelopment() {
        return this.environment === 'development';
    }

    /**
     * Check if running in production mode
     */
    isProduction() {
        return this.environment === 'production';
    }

    /**
     * Conditional logging for production safety (ASAP-019)
     * NOTE: Config needs to work before Logger is initialized, so we have fallback
     */
    log(...args) {
        if (!this.isProduction()) {
            // Safe to use console.log here as it only runs in development
            // This is needed for bootstrapping before logger is available
            console.log(...args);
        }
    }
    
    /**
     * Warning logging with production safety
     */
    warn(...args) {
        if (!this.isProduction()) {
            console.warn(...args);
        }
    }
    
    /**
     * Error logging (always logged but sanitized in production via Logger)
     */
    error(...args) {
        // Errors are important enough to always log
        console.error(...args);
    }

    /**
     * Get all configuration
     */
    getAll() {
        return { ...this.config };
    }

    /**
     * Update configuration from user settings
     */
    updateFromUserSettings(userSettings) {
        if (userSettings.processing) {
            // Allow users to override certain processing settings
            const allowedKeys = ['defaultBatchSize', 'maxFileSizeMB'];
            for (const key of allowedKeys) {
                if (key in userSettings.processing) {
                    this.set(`processing.${key}`, userSettings.processing[key]);
                }
            }
        }
        
        if (userSettings.ui) {
            // Allow users to override UI settings
            const allowedKeys = ['enableAnimations', 'autoSaveSettings'];
            for (const key of allowedKeys) {
                if (key in userSettings.ui) {
                    this.set(`ui.${key}`, userSettings.ui[key]);
                }
            }
        }
    }

    /**
     * Apply browser-specific optimizations
     */
    applyBrowserOptimizations() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (userAgent.includes('chrome')) {
            // Chrome handles larger canvases better
            this.set('processing.maxCanvasWidth', 16384);
            this.set('processing.maxCanvasHeight', 16384);
            this.set('processing.maxCanvasPixels', 67108864); // 8192x8192
        } else if (userAgent.includes('firefox')) {
            // Firefox has stricter canvas limits
            this.set('processing.maxCanvasWidth', 11180);
            this.set('processing.maxCanvasHeight', 11180);
            this.set('processing.maxCanvasPixels', 124960000); // ~11180x11180
        } else if (userAgent.includes('safari')) {
            // Safari has conservative limits
            this.set('processing.maxCanvasWidth', 8192);
            this.set('processing.maxCanvasHeight', 8192);
            this.set('processing.maxCanvasPixels', 16777216); // 4096x4096
        }
        
        // Mobile device optimizations
        if (/android|iphone|ipad|ipod|blackberry|iemobile/i.test(userAgent)) {
            this.set('processing.defaultBatchSize', 10);
            this.set('processing.maxBatchSize', 25);
            this.set('processing.maxFileSizeMB', 100);
            this.set('ui.enableAnimations', false);
        }
    }

    /**
     * Get feature flags for current environment
     */
    getFeatureFlags() {
        return {
            enableMemoryMonitoring: true,
            enableProgressPersistence: true,
            enableCancelProcessing: true,
            enableAdvancedSettings: this.isDevelopment(),
            enableAnalytics: this.get('analytics.enabled'),
            enableErrorReporting: this.get('errors.enableReporting'),
            showDebugInfo: this.get('ui.showDebugInfo')
        };
    }
}

// Create and export singleton instance
export const config = new Config();

// Apply browser optimizations
config.applyBrowserOptimizations();

// Make globally available
if (typeof window !== 'undefined') {
    window.config = config;
}