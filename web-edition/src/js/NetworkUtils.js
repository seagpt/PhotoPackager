/**
 * PhotoPackager Web Edition - Network Utilities
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
 * NetworkUtils.js
 * Robust network request handling with timeout, retry logic, and exponential backoff (ASAP-037)
 */

export class NetworkUtils {
    constructor() {
        this.defaultTimeout = 10000; // 10 seconds
        this.maxRetries = 3;
        this.baseDelay = 1000; // 1 second base delay for exponential backoff
        this.maxDelay = 30000; // 30 seconds max delay
    }

    /**
     * Create an AbortController with timeout (ASAP-037)
     * @param {number} timeout - Timeout in milliseconds
     * @returns {AbortController}
     */
    createTimeoutController(timeout = this.defaultTimeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, timeout);
        
        // Store timeout ID for cleanup
        controller.timeoutId = timeoutId;
        return controller;
    }

    /**
     * Calculate exponential backoff delay with jitter (ASAP-037)
     * @param {number} attempt - Current attempt number (0-based)
     * @param {number} baseDelay - Base delay in milliseconds
     * @param {number} maxDelay - Maximum delay in milliseconds
     * @returns {number} Delay in milliseconds
     */
    calculateBackoffDelay(attempt, baseDelay = this.baseDelay, maxDelay = this.maxDelay) {
        const exponentialDelay = baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
        const delay = Math.min(exponentialDelay + jitter, maxDelay);
        return Math.floor(delay);
    }

    /**
     * Sleep for specified duration
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Check if error is retryable (ASAP-037)
     * @param {Error} error - Error to check
     * @param {Response} response - Response object (if available)
     * @returns {boolean}
     */
    isRetryableError(error, response = null) {
        // Network errors (no response)
        if (!response) {
            // Timeout, connection errors, DNS errors
            if (error.name === 'AbortError' || 
                error.code === 'NETWORK_ERROR' || 
                error.message.includes('Failed to fetch') ||
                error.message.includes('NetworkError') ||
                error.message.includes('timeout')) {
                return true;
            }
            return false;
        }

        // HTTP status codes that are retryable
        const retryableStatusCodes = [
            408, // Request Timeout
            429, // Too Many Requests
            500, // Internal Server Error
            502, // Bad Gateway
            503, // Service Unavailable
            504, // Gateway Timeout
            507, // Insufficient Storage
            509, // Bandwidth Limit Exceeded
            510  // Not Extended
        ];

        return retryableStatusCodes.includes(response.status);
    }

    /**
     * Robust fetch with timeout and retry logic (ASAP-037)
     * @param {string} url - URL to fetch
     * @param {Object} options - Fetch options
     * @param {Object} retryOptions - Retry configuration
     * @returns {Promise<Response>}
     */
    async fetchWithRetry(url, options = {}, retryOptions = {}) {
        const {
            maxRetries = this.maxRetries,
            timeout = this.defaultTimeout,
            baseDelay = this.baseDelay,
            maxDelay = this.maxDelay,
            retryOn = null, // Custom retry condition function
            onRetry = null  // Callback for retry attempts
        } = retryOptions;

        let lastError = null;
        let lastResponse = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            const controller = this.createTimeoutController(timeout);
            
            try {
                // Merge abort signal with existing options
                const fetchOptions = {
                    ...options,
                    signal: controller.signal
                };

                const response = await fetch(url, fetchOptions);
                
                // Clear timeout since request completed
                if (controller.timeoutId) {
                    clearTimeout(controller.timeoutId);
                }

                // Check if response is successful or if we should retry
                if (response.ok) {
                    return response;
                }

                lastResponse = response;
                lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);

                // Check if this status code is retryable
                const shouldRetry = retryOn ? retryOn(lastError, response, attempt) : 
                                             this.isRetryableError(lastError, response);
                
                if (!shouldRetry || attempt === maxRetries) {
                    throw lastError;
                }

            } catch (error) {
                // Clear timeout
                if (controller.timeoutId) {
                    clearTimeout(controller.timeoutId);
                }

                lastError = error;
                lastResponse = null;

                // Check if this error is retryable
                const shouldRetry = retryOn ? retryOn(error, null, attempt) : 
                                             this.isRetryableError(error, null);

                if (!shouldRetry || attempt === maxRetries) {
                    throw error;
                }
            }

            // Calculate delay for next attempt
            if (attempt < maxRetries) {
                const delay = this.calculateBackoffDelay(attempt, baseDelay, maxDelay);
                
                if (onRetry) {
                    onRetry(lastError, attempt + 1, delay);
                }

                logger.log(`🔄 Network request retry ${attempt + 1}/${maxRetries} in ${delay}ms for ${url}`);
                await this.sleep(delay);
            }
        }

        // This should never be reached, but just in case
        throw lastError || new Error('Network request failed after all retry attempts');
    }

    /**
     * JSON request with retry logic (ASAP-037)
     * @param {string} url - URL to fetch
     * @param {Object} data - Data to send (will be JSON stringified)
     * @param {Object} options - Additional fetch options
     * @param {Object} retryOptions - Retry configuration
     * @returns {Promise<Object>} Parsed JSON response
     */
    async postJSON(url, data = null, options = {}, retryOptions = {}) {
        const fetchOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (data) {
            fetchOptions.body = JSON.stringify(data);
        }

        const response = await this.fetchWithRetry(url, fetchOptions, retryOptions);
        
        // Parse JSON response
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return { success: response.ok, status: response.status };
    }

    /**
     * GET request with retry logic (ASAP-037)
     * @param {string} url - URL to fetch
     * @param {Object} options - Fetch options
     * @param {Object} retryOptions - Retry configuration
     * @returns {Promise<Response>}
     */
    async get(url, options = {}, retryOptions = {}) {
        const fetchOptions = {
            method: 'GET',
            ...options
        };

        return await this.fetchWithRetry(url, fetchOptions, retryOptions);
    }

    /**
     * Check network connectivity (ASAP-037)
     * @returns {Promise<boolean>}
     */
    async checkConnectivity() {
        try {
            // Try to fetch a small resource
            const response = await this.fetchWithRetry('data:text/plain;base64,dGVzdA==', {
                method: 'GET',
                cache: 'no-cache'
            }, {
                maxRetries: 1,
                timeout: 3000
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Batch multiple requests with retry logic (ASAP-037)
     * @param {Array} requests - Array of request configurations
     * @param {Object} options - Batch options
     * @returns {Promise<Array>} Array of results
     */
    async batchRequests(requests, options = {}) {
        const {
            concurrency = 3,
            failFast = false,
            retryOptions = {}
        } = options;

        const results = [];
        const errors = [];

        // Process requests in batches to limit concurrency
        for (let i = 0; i < requests.length; i += concurrency) {
            const batch = requests.slice(i, i + concurrency);
            const batchPromises = batch.map(async (request, index) => {
                try {
                    const result = await this.fetchWithRetry(
                        request.url,
                        request.options || {},
                        { ...retryOptions, ...request.retryOptions }
                    );
                    return { success: true, result, index: i + index };
                } catch (error) {
                    const errorResult = { success: false, error, index: i + index };
                    if (failFast) {
                        throw errorResult;
                    }
                    return errorResult;
                }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);

            // If any failed and we're in fail-fast mode, stop processing
            if (failFast && batchResults.some(r => !r.success)) {
                break;
            }
        }

        return results;
    }

    /**
     * Cleanup method
     */
    cleanup() {
        // No persistent resources to cleanup in this utility
        logger.log('🧹 NetworkUtils cleanup completed');
    }
}

// Create and export singleton instance
export const networkUtils = new NetworkUtils();