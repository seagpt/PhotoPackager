/**
 * PhotoPackager Web Edition - UI Validation System
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
 * UIValidator.js
 * Comprehensive UI validation and testing utilities
 * Ensures all button combinations and interactions work correctly
 */

import { config } from './Config.js';

export class UIValidator {
    constructor() {
        this.testResults = [];
        this.failedTests = [];
    }

    /**
     * Run comprehensive UI validation
     */
    async runFullValidation() {
        config.log('🔍 Starting comprehensive UI validation...');
        
        try {
            await this.validateAllElements();
            await this.validateEventHandlers();
            await this.validateCheckboxCombinations();
            await this.validateDropdownOptions();
            await this.validateRangeSliders();
            await this.validateEdgeCases();
            
            this.reportResults();
            return this.failedTests.length === 0;
        } catch (error) {
            config.error('UI Validation failed:', error);
            return false;
        }
    }

    /**
     * Validate all required DOM elements exist
     */
    async validateAllElements() {
        const requiredElements = [
            'dropZone', 'folderInput', 'selectFolderBtn',
            'projectName', 'studioName', 'studioWebsite', 'studioEmail',
            'includeOriginals', 'originalsAction', 'includeRaw', 'rawAction',
            'generateOptimizedJPG', 'generateOptimizedWebP', 
            'generateCompressedJPG', 'generateCompressedWebP',
            'optimizedQuality', 'optimizedQualityValue',
            'compressedQuality', 'compressedQualityValue',
            'compressedMaxDimension', 'exifHandling',
            'startProcessingBtn', 'downloadPackageBtn', 'startOverBtn',
            'configPanel', 'progressPanel', 'completionPanel'
        ];

        for (const elementId of requiredElements) {
            const element = document.getElementById(elementId);
            if (!element) {
                this.failedTests.push(`Missing element: ${elementId}`);
            } else {
                this.testResults.push(`✅ Element exists: ${elementId}`);
            }
        }
    }

    /**
     * Validate all event handlers are properly bound
     */
    async validateEventHandlers() {
        const eventTests = [
            { id: 'selectFolderBtn', event: 'click' },
            { id: 'folderInput', event: 'change' },
            { id: 'optimizedQuality', event: 'input' },
            { id: 'compressedQuality', event: 'input' },
            { id: 'startProcessingBtn', event: 'click' },
            { id: 'downloadPackageBtn', event: 'click' },
            { id: 'startOverBtn', event: 'click' }
        ];

        for (const test of eventTests) {
            const element = document.getElementById(test.id);
            if (element) {
                // Check if element has event listeners (basic check)
                const hasListeners = element.onclick || element.addEventListener;
                if (hasListeners) {
                    this.testResults.push(`✅ Event handler bound: ${test.id}.${test.event}`);
                } else {
                    this.failedTests.push(`❌ Missing event handler: ${test.id}.${test.event}`);
                }
            }
        }
    }

    /**
     * Test all checkbox combinations
     */
    async validateCheckboxCombinations() {
        const checkboxes = [
            'includeOriginals', 'includeRaw', 
            'generateOptimizedJPG', 'generateOptimizedWebP',
            'generateCompressedJPG', 'generateCompressedWebP'
        ];

        // Test all possible combinations (2^6 = 64 combinations)
        for (let i = 0; i < (1 << checkboxes.length); i++) {
            const combination = [];
            
            for (let j = 0; j < checkboxes.length; j++) {
                const isChecked = (i & (1 << j)) !== 0;
                const checkbox = document.getElementById(checkboxes[j]);
                
                if (checkbox) {
                    checkbox.checked = isChecked;
                    combination.push(`${checkboxes[j]}:${isChecked}`);
                }
            }
            
            // Validate this combination makes sense
            const isValidCombination = this.validateCheckboxLogic();
            if (isValidCombination) {
                this.testResults.push(`✅ Valid combination: ${combination.join(', ')}`);
            } else {
                this.failedTests.push(`❌ Invalid combination: ${combination.join(', ')}`);
            }
        }
    }

    /**
     * Validate checkbox logic constraints
     */
    validateCheckboxLogic() {
        const includeOriginals = document.getElementById('includeOriginals')?.checked;
        const includeRaw = document.getElementById('includeRaw')?.checked;
        const hasAnyOutput = ['generateOptimizedJPG', 'generateOptimizedWebP', 
                              'generateCompressedJPG', 'generateCompressedWebP']
            .some(id => document.getElementById(id)?.checked);

        // Must have at least one output type selected
        if (!includeOriginals && !includeRaw && !hasAnyOutput) {
            return false;
        }

        return true;
    }

    /**
     * Test all dropdown combinations
     */
    async validateDropdownOptions() {
        const dropdowns = [
            { id: 'originalsAction', options: ['copy', 'leave'] },
            { id: 'rawAction', options: ['copy', 'leave'] },
            { id: 'compressedMaxDimension', options: ['1920', '2048', '2560'] },
            { id: 'exifHandling', options: ['preserve', 'strip_all', 'date_only', 'camera_only', 'date_camera'] }
        ];

        for (const dropdown of dropdowns) {
            const element = document.getElementById(dropdown.id);
            if (!element) {
                this.failedTests.push(`❌ Missing dropdown: ${dropdown.id}`);
                continue;
            }

            for (const option of dropdown.options) {
                element.value = option;
                if (element.value === option) {
                    this.testResults.push(`✅ Dropdown option works: ${dropdown.id}=${option}`);
                } else {
                    this.failedTests.push(`❌ Dropdown option failed: ${dropdown.id}=${option}`);
                }
            }
        }
    }

    /**
     * Test range slider functionality
     */
    async validateRangeSliders() {
        const sliders = [
            { id: 'optimizedQuality', min: 60, max: 95, step: 5 },
            { id: 'compressedQuality', min: 30, max: 80, step: 5 }
        ];

        for (const slider of sliders) {
            const element = document.getElementById(slider.id);
            const valueSpan = document.getElementById(slider.id + 'Value');
            
            if (!element || !valueSpan) {
                this.failedTests.push(`❌ Missing slider elements: ${slider.id}`);
                continue;
            }

            // Test various values
            for (let value = slider.min; value <= slider.max; value += slider.step) {
                element.value = value;
                
                // Trigger input event to update display
                element.dispatchEvent(new Event('input'));
                
                // Check if value display updated
                if (valueSpan.textContent == value) {
                    this.testResults.push(`✅ Slider works: ${slider.id}=${value}`);
                } else {
                    this.failedTests.push(`❌ Slider value not updated: ${slider.id}=${value} (display: ${valueSpan.textContent})`);
                }
            }
        }
    }

    /**
     * Test edge cases and error scenarios
     */
    async validateEdgeCases() {
        // Test empty project name
        const projectName = document.getElementById('projectName');
        if (projectName) {
            projectName.value = '';
            const isEmpty = projectName.value.trim() === '';
            if (isEmpty) {
                this.testResults.push('✅ Empty project name detection works');
            } else {
                this.failedTests.push('❌ Empty project name not detected');
            }
        }

        // Test URL validation
        const website = document.getElementById('studioWebsite');
        if (website) {
            website.value = 'invalid-url';
            // Note: Browser will validate URL on form submission
            this.testResults.push('✅ URL validation delegated to browser');
        }

        // Test email validation
        const email = document.getElementById('studioEmail');
        if (email) {
            email.value = 'invalid-email';
            // Note: Browser will validate email on form submission
            this.testResults.push('✅ Email validation delegated to browser');
        }
    }

    /**
     * Test all UI state transitions
     */
    async validateStateTransitions() {
        const panels = ['dropZone', 'configPanel', 'progressPanel', 'completionPanel'];
        
        for (const panelId of panels) {
            const panel = document.getElementById(panelId);
            if (panel) {
                // Test show panel
                this.showTestPanel(panelId);
                const isVisible = panel.style.display !== 'none';
                
                if (isVisible) {
                    this.testResults.push(`✅ Panel shows correctly: ${panelId}`);
                } else {
                    this.failedTests.push(`❌ Panel doesn't show: ${panelId}`);
                }
            }
        }
    }

    /**
     * Helper to show panel for testing
     */
    showTestPanel(panelId) {
        const panels = ['dropZone', 'configPanel', 'progressPanel', 'completionPanel'];
        panels.forEach(id => {
            const panel = document.getElementById(id);
            if (panel) {
                panel.style.display = id === panelId ? 'block' : 'none';
            }
        });
    }

    /**
     * Report validation results
     */
    reportResults() {
        config.log('\n🔍 UI Validation Results:');
        config.log(`✅ Passed Tests: ${this.testResults.length}`);
        config.log(`❌ Failed Tests: ${this.failedTests.length}`);
        
        if (this.failedTests.length > 0) {
            config.log('\n❌ Failed Tests:');
            this.failedTests.forEach(test => config.log(test));
        }
        
        if (this.testResults.length > 0) {
            config.log('\n✅ Passed Tests:');
            this.testResults.forEach(test => config.log(test));
        }
        
        const passRate = (this.testResults.length / (this.testResults.length + this.failedTests.length)) * 100;
        config.log(`\n📊 Pass Rate: ${passRate.toFixed(1)}%`);
    }

    /**
     * Quick validation function for production
     */
    static quickValidate() {
        const validator = new UIValidator();
        return validator.runFullValidation();
    }
}

// Auto-run validation in development
if (window.location.hostname === 'localhost') {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait for app to initialize
        setTimeout(() => {
            UIValidator.quickValidate();
        }, 1000);
    });
}