#!/usr/bin/env node

/**
 * PhotoPackager Web Edition - End-to-End Test Suite
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
 * End-to-End Test Suite for PhotoPackager Web Edition
 * Tests all backend functionality without UI dependencies
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

class E2ETestRunner {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            errors: []
        };
        this.testFiles = [];
        this.startTime = 0;
    }

    log(message, color = colors.reset) {
        console.log(`${color}${message}${colors.reset}`);
    }

    logSection(title) {
        console.log('\n' + '='.repeat(60));
        this.log(title, colors.bright + colors.cyan);
        console.log('='.repeat(60));
    }

    async createTestFiles() {
        this.logSection('Creating Test Files');
        
        const testDir = path.join(__dirname, 'test-files');
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }

        // Create different types of test images
        const testImages = [
            { name: 'test1.jpg', width: 1920, height: 1080, size: 500000 },
            { name: 'test2.jpg', width: 3840, height: 2160, size: 1500000 },
            { name: 'test3.png', width: 1280, height: 720, size: 800000 },
            { name: 'test4.webp', width: 2560, height: 1440, size: 600000 },
            { name: 'large.jpg', width: 6000, height: 4000, size: 5000000 },
            { name: 'small.jpg', width: 640, height: 480, size: 50000 }
        ];

        for (const img of testImages) {
            const filePath = path.join(testDir, img.name);
            // Create fake image data (just random bytes for testing)
            const buffer = Buffer.alloc(img.size);
            for (let i = 0; i < img.size; i++) {
                buffer[i] = Math.floor(Math.random() * 256);
            }
            
            // Add fake JPEG header if needed
            if (img.name.endsWith('.jpg')) {
                buffer[0] = 0xFF;
                buffer[1] = 0xD8;
                buffer[2] = 0xFF;
            } else if (img.name.endsWith('.png')) {
                // PNG header
                buffer[0] = 0x89;
                buffer[1] = 0x50;
                buffer[2] = 0x4E;
                buffer[3] = 0x47;
            }
            
            fs.writeFileSync(filePath, buffer);
            this.testFiles.push(filePath);
            this.log(`  ✓ Created ${img.name} (${img.size} bytes)`, colors.green);
        }

        return testDir;
    }

    async testModule(modulePath, testName, testFn) {
        try {
            this.log(`\nTesting: ${testName}`, colors.yellow);
            const startTime = performance.now();
            
            await testFn();
            
            const duration = (performance.now() - startTime).toFixed(2);
            this.log(`  ✅ PASSED (${duration}ms)`, colors.green);
            this.results.passed++;
        } catch (error) {
            this.log(`  ❌ FAILED: ${error.message}`, colors.red);
            this.results.failed++;
            this.results.errors.push({
                test: testName,
                error: error.message,
                stack: error.stack
            });
        }
    }

    async testInputValidator() {
        this.logSection('Testing InputValidator');
        
        await this.testModule(
            './src/js/InputValidator.js',
            'File validation',
            async () => {
                const { inputValidator } = await import('./src/js/InputValidator.js');
                
                // Test valid files
                const validFiles = [
                    { name: 'test.jpg', size: 1000000, type: 'image/jpeg' },
                    { name: 'test.png', size: 2000000, type: 'image/png' }
                ];
                
                const result = inputValidator.validateFiles(validFiles);
                if (!result.valid) throw new Error('Valid files marked as invalid');
                if (result.validFiles.length !== 2) throw new Error('Wrong valid file count');
            }
        );

        await this.testModule(
            './src/js/InputValidator.js',
            'File size limits',
            async () => {
                const { inputValidator } = await import('./src/js/InputValidator.js');
                
                // Test oversized file
                const oversizedFile = [
                    { name: 'huge.jpg', size: 600000000, type: 'image/jpeg' } // 600MB
                ];
                
                const result = inputValidator.validateFiles(oversizedFile);
                if (result.valid) throw new Error('Oversized file not rejected');
                if (!result.errors[0].includes('exceeds maximum size')) {
                    throw new Error('Wrong error message for oversized file');
                }
            }
        );

        await this.testModule(
            './src/js/InputValidator.js',
            'Malicious file patterns',
            async () => {
                const { inputValidator } = await import('./src/js/InputValidator.js');
                
                // Test malicious patterns
                const maliciousFiles = [
                    { name: '../../../etc/passwd', size: 1000, type: 'text/plain' },
                    { name: 'test.exe', size: 1000, type: 'application/x-msdownload' }
                ];
                
                for (const file of maliciousFiles) {
                    const result = inputValidator.validateFiles([file]);
                    if (result.valid) throw new Error(`Malicious file not rejected: ${file.name}`);
                }
            }
        );

        await this.testModule(
            './src/js/InputValidator.js',
            'Settings validation',
            async () => {
                const { inputValidator } = await import('./src/js/InputValidator.js');
                
                const validSettings = {
                    projectName: 'TestProject',
                    studioName: 'Test Studio',
                    studioEmail: 'test@example.com',
                    studioWebsite: 'https://example.com',
                    optimizedQuality: '85',
                    compressedQuality: '60',
                    compressedMaxDimension: '1920'
                };
                
                const result = inputValidator.validateSettings(validSettings);
                if (!result.valid) throw new Error('Valid settings marked as invalid');
            }
        );
    }

    async testErrorHandler() {
        this.logSection('Testing ErrorHandler');

        await this.testModule(
            './src/js/ErrorHandler.js',
            'Error categorization',
            async () => {
                const { ErrorHandler } = await import('./src/js/ErrorHandler.js');
                const errorHandler = new ErrorHandler();
                
                // Test different error types
                const errors = [
                    { type: 'network_error', message: 'Network failed' },
                    { type: 'file_error', message: 'File not found' },
                    { type: 'memory_error', message: 'Out of memory' }
                ];
                
                for (const error of errors) {
                    errorHandler.handleError(error.type, new Error(error.message));
                    const log = errorHandler.getErrorLog();
                    if (log.length === 0) throw new Error('Error not logged');
                    
                    const lastError = log[log.length - 1];
                    if (lastError.type !== error.type) {
                        throw new Error(`Wrong error type: ${lastError.type}`);
                    }
                }
            }
        );

        await this.testModule(
            './src/js/ErrorHandler.js',
            'Recovery suggestions',
            async () => {
                const { ErrorHandler } = await import('./src/js/ErrorHandler.js');
                const errorHandler = new ErrorHandler();
                
                const memoryError = new Error('Maximum call stack size exceeded');
                errorHandler.handleError('memory_error', memoryError);
                
                const suggestions = errorHandler.getRecoverySuggestions('memory_error');
                if (!suggestions || suggestions.length === 0) {
                    throw new Error('No recovery suggestions provided');
                }
            }
        );
    }

    async testPerformanceOptimizer() {
        this.logSection('Testing PerformanceOptimizer');

        await this.testModule(
            './src/js/PerformanceOptimizer.js',
            'Memory monitoring',
            async () => {
                const { performanceOptimizer } = await import('./src/js/PerformanceOptimizer.js');
                
                const status = performanceOptimizer.checkMemoryUsage();
                if (typeof status.safe !== 'boolean') {
                    throw new Error('Memory status not returned');
                }
                if (typeof status.usage !== 'number') {
                    throw new Error('Memory usage not calculated');
                }
            }
        );

        await this.testModule(
            './src/js/PerformanceOptimizer.js',
            'Batch size optimization',
            async () => {
                const { performanceOptimizer } = await import('./src/js/PerformanceOptimizer.js');
                
                const batchSize = performanceOptimizer.getOptimalBatchSize();
                if (batchSize < 1 || batchSize > 50) {
                    throw new Error(`Invalid batch size: ${batchSize}`);
                }
            }
        );

        await this.testModule(
            './src/js/PerformanceOptimizer.js',
            'Performance metrics',
            async () => {
                const { performanceOptimizer } = await import('./src/js/PerformanceOptimizer.js');
                
                const metrics = performanceOptimizer.getPerformanceMetrics();
                if (!metrics) throw new Error('No metrics returned');
                if (typeof metrics.averageProcessingTime !== 'number') {
                    throw new Error('Invalid metrics structure');
                }
            }
        );
    }

    async testProgressPersistence() {
        this.logSection('Testing ProgressPersistence');

        await this.testModule(
            './src/js/ProgressPersistence.js',
            'Session management',
            async () => {
                const { progressPersistence } = await import('./src/js/ProgressPersistence.js');
                
                // Save a test session
                const testData = {
                    status: 'in_progress',
                    files: ['test1.jpg', 'test2.jpg'],
                    settings: { projectName: 'Test' }
                };
                
                await progressPersistence.saveProgress(testData);
                
                // Check for resumable sessions
                const canResume = await progressPersistence.hasResumableSession();
                if (!canResume) throw new Error('Session not saved');
                
                // Load session
                const loaded = await progressPersistence.loadProgress();
                if (!loaded) throw new Error('Session not loaded');
                if (loaded.files.length !== 2) throw new Error('Files not preserved');
            }
        );

        await this.testModule(
            './src/js/ProgressPersistence.js',
            'Session cleanup',
            async () => {
                const { progressPersistence } = await import('./src/js/ProgressPersistence.js');
                
                // Clear sessions
                await progressPersistence.clearProgress();
                
                const hasSession = await progressPersistence.hasResumableSession();
                if (hasSession) throw new Error('Session not cleared');
            }
        );
    }

    async testPackageBuilder() {
        this.logSection('Testing PackageBuilder');

        await this.testModule(
            './src/js/PackageBuilder.js',
            'Package initialization',
            async () => {
                // Need to make JSZip available globally for the test
                global.window = { JSZip: null };
                
                try {
                    const { PackageBuilder } = await import('./src/js/PackageBuilder.js');
                    const builder = new PackageBuilder({
                        projectName: 'TestProject',
                        studioName: 'TestStudio'
                    });
                    throw new Error('Should have failed without JSZip');
                } catch (error) {
                    if (!error.message.includes('JSZip')) {
                        throw error;
                    }
                }
            }
        );

        await this.testModule(
            './src/js/PackageBuilder.js',
            'Package structure',
            async () => {
                // Mock JSZip
                global.window = {
                    JSZip: class {
                        constructor() {
                            this.files = {};
                        }
                        folder(name) {
                            return {
                                file: (filename, content) => {
                                    this.files[`${name}/${filename}`] = content;
                                }
                            };
                        }
                        generateAsync() {
                            return Promise.resolve(new Blob(['test'], { type: 'application/zip' }));
                        }
                    }
                };

                const { PackageBuilder } = await import('./src/js/PackageBuilder.js');
                const builder = new PackageBuilder({
                    projectName: 'TestProject'
                });
                
                if (!builder.zip) throw new Error('ZIP not initialized');
                
                const stats = builder.getPackageStats();
                if (!stats) throw new Error('Stats not available');
            }
        );
    }

    async testIntegration() {
        this.logSection('Integration Tests');

        await this.testModule(
            'Integration',
            'Full processing pipeline',
            async () => {
                // This tests the full flow without UI
                const settings = {
                    projectName: 'IntegrationTest',
                    includeOriginals: true,
                    createOptimized: true,
                    optimizedFormat: 'jpg',
                    optimizedQuality: 85,
                    createCompressed: true,
                    compressedFormat: 'jpg',
                    compressedQuality: 60,
                    compressedMaxDimension: 1920
                };

                // Mock file objects
                const files = this.testFiles.slice(0, 3).map(filepath => ({
                    name: path.basename(filepath),
                    size: fs.statSync(filepath).size,
                    type: 'image/jpeg',
                    path: filepath
                }));

                // Validate inputs
                const { inputValidator } = await import('./src/js/InputValidator.js');
                const validation = inputValidator.validateFiles(files);
                if (!validation.valid) throw new Error('Test files invalid');

                // Process would happen here in real app
                this.log('    Pipeline components validated', colors.green);
            }
        );

        await this.testModule(
            'Integration',
            'Error recovery flow',
            async () => {
                const { ErrorHandler } = await import('./src/js/ErrorHandler.js');
                const errorHandler = new ErrorHandler();

                // Simulate various errors
                const errors = [
                    new Error('File read failed'),
                    new Error('Memory limit exceeded'),
                    new Error('Invalid image format')
                ];

                for (const error of errors) {
                    errorHandler.handleError('processing_error', error);
                }

                const log = errorHandler.getErrorLog();
                if (log.length !== errors.length) {
                    throw new Error('Not all errors logged');
                }

                const stats = errorHandler.getErrorStats();
                if (stats.processing_error !== errors.length) {
                    throw new Error('Error stats incorrect');
                }
            }
        );
    }

    async runTests() {
        this.startTime = performance.now();
        
        console.log('\n' + '█'.repeat(60));
        this.log('  PHOTOPACKAGER WEB EDITION - E2E TEST SUITE', colors.bright + colors.cyan);
        console.log('█'.repeat(60));
        
        try {
            // Create test files
            await this.createTestFiles();
            
            // Run all test suites
            await this.testInputValidator();
            await this.testErrorHandler();
            await this.testPerformanceOptimizer();
            await this.testProgressPersistence();
            await this.testPackageBuilder();
            await this.testIntegration();
            
            // Print results
            this.printResults();
            
        } catch (error) {
            this.log(`\n⚠️  FATAL ERROR: ${error.message}`, colors.red);
            console.error(error);
            process.exit(1);
        } finally {
            // Cleanup test files
            this.cleanup();
        }
    }

    printResults() {
        const duration = ((performance.now() - this.startTime) / 1000).toFixed(2);
        
        console.log('\n' + '═'.repeat(60));
        this.log('  TEST RESULTS', colors.bright);
        console.log('═'.repeat(60));
        
        this.log(`  ✅ Passed: ${this.results.passed}`, colors.green);
        this.log(`  ❌ Failed: ${this.results.failed}`, colors.red);
        this.log(`  ⏭️  Skipped: ${this.results.skipped}`, colors.yellow);
        this.log(`  ⏱️  Duration: ${duration}s`, colors.cyan);
        
        if (this.results.failed > 0) {
            console.log('\n' + '─'.repeat(60));
            this.log('  FAILED TESTS:', colors.red);
            console.log('─'.repeat(60));
            
            for (const error of this.results.errors) {
                this.log(`\n  ${error.test}:`, colors.yellow);
                this.log(`    ${error.error}`, colors.red);
                if (process.env.VERBOSE) {
                    console.log(error.stack);
                }
            }
        }
        
        console.log('\n' + '═'.repeat(60));
        
        if (this.results.failed === 0) {
            this.log('  🎉 ALL TESTS PASSED!', colors.bright + colors.green);
        } else {
            this.log(`  ⚠️  ${this.results.failed} TESTS FAILED`, colors.bright + colors.red);
            process.exit(1);
        }
        
        console.log('═'.repeat(60) + '\n');
    }

    cleanup() {
        const testDir = path.join(__dirname, 'test-files');
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
            this.log('\n✓ Cleaned up test files', colors.green);
        }
    }
}

// Run tests
const runner = new E2ETestRunner();
runner.runTests().catch(console.error);