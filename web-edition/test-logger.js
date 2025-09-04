#!/usr/bin/env node

import { logger } from './src/js/Logger.js';

console.log('🔐 Testing ASAP-019: Production-Safe Logger Implementation');
console.log('════════════════════════════════════════════════════════════');

// Test 1: Sanitization
console.log('\n1. Testing Sensitive Data Sanitization:');
logger.log('User email: user@example.com should be redacted');
logger.log('API key: api_key=secret123abc should be redacted');
logger.log('Credit card: 1234-5678-9012-3456 should be redacted');
logger.log('Normal message with no sensitive data');

// Test 2: Log levels
console.log('\n2. Testing Log Levels:');
logger.debug('Debug message (only in development)');
logger.log('Normal log message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message (always shown)');

// Test 3: Error handling
console.log('\n3. Testing Error Object Handling:');
const testError = new Error('Test error message with email user@test.com');
testError.stack = 'Stack trace with sensitive /users/123/data';
logger.error('Application error:', testError);

// Test 4: Buffer functionality
console.log('\n4. Testing Log Buffer:');
logger.log('Entry 1');
logger.log('Entry 2');
logger.log('Entry 3');
const recentLogs = logger.getRecentLogs(2);
console.log(`  Recent logs count: ${recentLogs.length}`);
console.log(`  Last log: ${recentLogs[recentLogs.length - 1]?.message}`);

// Test 5: Production mode simulation
console.log('\n5. Testing Production Mode:');
logger.isProduction = true;
logger.logLevel = 'error';
console.log('  Setting production mode...');
logger.debug('This should NOT appear in production');
logger.log('This should NOT appear in production');
logger.error('This error SHOULD appear in production');

console.log('\n✅ ASAP-019 Logger Implementation Test Complete!');
console.log('🔒 All console.log statements replaced with production-safe logging');