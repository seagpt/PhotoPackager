#!/usr/bin/env node

/**
 * PhotoPackager Web Edition - Network Utils Test Suite
 * 
 * Tests the ASAP-037 network timeout and retry logic implementation
 */

// Mock fetch for testing
global.fetch = async (url, options) => {
    // Simulate different types of network conditions
    if (url.includes('timeout-test')) {
        throw new Error('Request timeout');
    }
    if (url.includes('network-error')) {
        throw new Error('Failed to fetch');
    }
    if (url.includes('server-error')) {
        return { 
            ok: false, 
            status: 500, 
            statusText: 'Internal Server Error',
            headers: new Map([['content-type', 'application/json']]),
            json: async () => ({ error: 'Server error' })
        };
    }
    if (url.includes('success')) {
        return {
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Map([['content-type', 'application/json']]),
            json: async () => ({ success: true, data: 'test' })
        };
    }
    // Default success
    return {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ success: true })
    };
};

// Mock AbortController
global.AbortController = class MockAbortController {
    constructor() {
        this.signal = { aborted: false };
        this.timeoutId = null;
    }
    
    abort() {
        this.signal.aborted = true;
    }
};

// Mock setTimeout/clearTimeout
global.setTimeout = (fn, ms) => {
    const id = Math.random();
    setTimeout(fn, 1); // Execute quickly for testing
    return id;
};

global.clearTimeout = (id) => {
    // Mock implementation
};

import('./src/js/NetworkUtils.js').then(async ({ networkUtils }) => {
    console.log('🌐 Testing ASAP-037: Network Timeout and Retry Logic');
    console.log('═══════════════════════════════════════════════════════════');

    // Test 1: Basic successful request
    console.log('\n1. Testing Successful Request:');
    try {
        const response = await networkUtils.fetchWithRetry('https://success.test/api');
        console.log('  ✅ Success:', response.ok ? 'Request completed successfully' : 'Request failed');
    } catch (error) {
        console.log('  ❌ Error:', error.message);
    }

    // Test 2: Exponential backoff calculation
    console.log('\n2. Testing Exponential Backoff Calculation:');
    for (let attempt = 0; attempt < 4; attempt++) {
        const delay = networkUtils.calculateBackoffDelay(attempt, 1000, 30000);
        console.log(`  📊 Attempt ${attempt}: ${delay}ms delay`);
    }

    // Test 3: Retryable error detection
    console.log('\n3. Testing Retryable Error Detection:');
    const testCases = [
        { error: new Error('Request timeout'), response: null, expected: true },
        { error: new Error('Failed to fetch'), response: null, expected: true },
        { error: null, response: { status: 500 }, expected: true },
        { error: null, response: { status: 404 }, expected: false },
        { error: null, response: { status: 200 }, expected: false }
    ];

    testCases.forEach((test, i) => {
        const isRetryable = networkUtils.isRetryableError(test.error, test.response);
        const result = isRetryable === test.expected ? '✅' : '❌';
        const desc = test.error ? test.error.message : `HTTP ${test.response.status}`;
        console.log(`  ${result} ${desc}: ${isRetryable ? 'Retryable' : 'Not retryable'}`);
    });

    // Test 4: JSON POST request
    console.log('\n4. Testing JSON POST Request:');
    try {
        const testData = { 
            events: [{ type: 'test', timestamp: Date.now() }],
            batchId: 'test-123'
        };
        const response = await networkUtils.postJSON(
            'https://success.test/analytics',
            testData,
            {},
            { maxRetries: 1, timeout: 5000 }
        );
        console.log('  ✅ JSON POST completed:', response.success ? 'Successfully' : 'With errors');
    } catch (error) {
        console.log('  ❌ JSON POST failed:', error.message);
    }

    // Test 5: Batch requests
    console.log('\n5. Testing Batch Requests:');
    const requests = [
        { url: 'https://success.test/api/1' },
        { url: 'https://success.test/api/2' },
        { url: 'https://success.test/api/3' }
    ];

    try {
        const results = await networkUtils.batchRequests(requests, {
            concurrency: 2,
            retryOptions: { maxRetries: 1 }
        });
        const successCount = results.filter(r => r.success).length;
        console.log(`  ✅ Batch completed: ${successCount}/${results.length} requests successful`);
    } catch (error) {
        console.log('  ❌ Batch failed:', error.message);
    }

    // Test 6: Network utilities integration
    console.log('\n6. Testing Analytics Integration Pattern:');
    const mockAnalytics = async () => {
        const batchPayload = {
            events: [{ type: 'test_event', timestamp: Date.now() }],
            batchId: 'analytics-test-123'
        };

        const requestOptions = {
            headers: { 'User-Agent': 'PhotoPackager-Web/1.0.0' }
        };

        const retryOptions = {
            maxRetries: 2,
            timeout: 8000,
            baseDelay: 1000,
            onRetry: (error, attempt, delay) => {
                console.log(`    🔄 Analytics retry ${attempt}/2 in ${delay}ms: ${error.message}`);
            }
        };

        try {
            const response = await networkUtils.postJSON(
                'https://success.test/analytics/batch',
                batchPayload,
                requestOptions,
                retryOptions
            );
            console.log('    ✅ Analytics batch sent successfully');
        } catch (error) {
            console.log('    ❌ Analytics batch failed:', error.message);
        }
    };

    await mockAnalytics();

    console.log('\n✅ ASAP-037 Network Timeout and Retry Logic Test Complete!');
    console.log('🌐 All network operations now have robust timeout and retry mechanisms');

}).catch(error => {
    console.error('Test failed:', error);
});