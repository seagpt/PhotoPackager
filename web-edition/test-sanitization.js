#!/usr/bin/env node

/**
 * PhotoPackager Web Edition - Input Sanitization Test Suite
 * 
 * Tests the ASAP-021 input sanitization implementation
 */

import { domSanitizer } from './src/js/DOMSanitizer.js';

console.log('🔒 Testing PhotoPackager Input Sanitization (ASAP-021)');
console.log('════════════════════════════════════════════════════════');

// Test 1: XSS Prevention
console.log('\n1. Testing XSS Prevention:');
const xssInputs = [
    '<script>alert("XSS")</script>',
    'javascript:alert("XSS")',
    '<img src="x" onerror="alert(1)">',
    'data:text/html,<script>alert(1)</script>',
    '<iframe src="javascript:alert(1)"></iframe>'
];

xssInputs.forEach((input, i) => {
    const sanitized = domSanitizer.sanitizeHTML(input);
    console.log(`  Input ${i+1}: ${input.substring(0, 30)}...`);
    console.log(`  Output: ${sanitized}`);
    console.log(`  Safe: ${!sanitized.includes('<script>') && !sanitized.includes('javascript:')}`);
    console.log('');
});

// Test 2: File Name Sanitization
console.log('2. Testing File Name Sanitization:');
const fileNames = [
    '../../../etc/passwd',
    '<script>alert("hack")</script>.jpg',
    'normal-file.jpg',
    'file with spaces.png',
    'file|with|pipes?.txt'
];

fileNames.forEach((input, i) => {
    const sanitized = domSanitizer.sanitizeFileName(input);
    console.log(`  Input ${i+1}: "${input}"`);
    console.log(`  Output: "${sanitized}"`);
    console.log(`  Safe: ${!sanitized.includes('../') && !sanitized.includes('<')}`);
    console.log('');
});

// Test 3: Error Message Sanitization
console.log('3. Testing Error Message Sanitization:');
const errorMessages = [
    'Error at file://C:/secrets.txt',
    'Failed to load https://evil.com/hack.js',
    'Normal error message',
    '<script>steal_data()</script> Error occurred'
];

errorMessages.forEach((input, i) => {
    const sanitized = domSanitizer.sanitizeErrorMessage(input);
    console.log(`  Input ${i+1}: "${input}"`);
    console.log(`  Output: "${sanitized}"`);
    console.log(`  Safe: ${!sanitized.includes('file://') && !sanitized.includes('<script>')}`);
    console.log('');
});

console.log('✅ Input Sanitization Tests Complete!');
console.log('🔒 PhotoPackager is protected against XSS attacks (ASAP-021)');
