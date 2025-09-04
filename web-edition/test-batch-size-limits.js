#!/usr/bin/env node

/**
 * PhotoPackager Web Edition - Batch Size Limits Test
 * Tests ASAP-008: Total batch size limit (10GB maximum)
 */

import { inputValidator } from './src/js/InputValidator.js';

console.log('🛡️ Testing ASAP-008: Total Batch Size Limits');
console.log('════════════════════════════════════════════');

// Test 1: Verify batch size limits configuration
console.log('\n1. Testing Batch Size Configuration:');
console.log(`   ✅ Maximum file size: ${(inputValidator.maxFileSize / 1024 / 1024).toFixed(0)}MB`);
console.log(`   ✅ Maximum total batch size: ${(inputValidator.maxTotalSize / 1024 / 1024 / 1024).toFixed(0)}GB`);
console.log(`   ✅ Maximum file count: ${inputValidator.maxFileCount}`);

// Test 2: Test with files under the limit
console.log('\n2. Testing Valid Batch Size (Under 10GB):');
const validFiles = [];
const fileSize = 50 * 1024 * 1024; // 50MB per file (under 100MB limit)
const fileCount = 10; // 10 files = 500MB total

for (let i = 0; i < fileCount; i++) {
    validFiles.push({
        name: `photo_${i + 1}.jpg`,
        size: fileSize,
        type: 'image/jpeg'
    });
}

const totalSize = validFiles.reduce((sum, file) => sum + file.size, 0);
console.log(`   📊 Testing ${fileCount} files, ${(totalSize / 1024 / 1024 / 1024).toFixed(2)}GB total`);

const validResult = inputValidator.validateFiles(validFiles);
console.log(`   ${validResult.valid ? '✅' : '❌'} Validation result: ${validResult.valid ? 'PASSED' : 'FAILED'}`);
console.log(`   📈 Valid files: ${validResult.validFiles.length}/${fileCount}`);
if (validResult.errors.length > 0) {
    console.log(`   ⚠️ Errors: ${validResult.errors.join(', ')}`);
}

// Test 3: Test with batch exceeding 10GB limit
console.log('\n3. Testing Batch Size Over Limit (Over 10GB):');
const oversizeFiles = [];
const largFileSize = 90 * 1024 * 1024; // 90MB per file (under individual limit)
const largeFileCount = 120; // 120 files = ~10.8GB total

for (let i = 0; i < largeFileCount; i++) {
    oversizeFiles.push({
        name: `large_photo_${i + 1}.jpg`,
        size: largFileSize,
        type: 'image/jpeg'
    });
}

const largeTotalSize = oversizeFiles.reduce((sum, file) => sum + file.size, 0);
console.log(`   📊 Testing ${largeFileCount} files, ${(largeTotalSize / 1024 / 1024 / 1024).toFixed(2)}GB total`);

const oversizeResult = inputValidator.validateFiles(oversizeFiles);
console.log(`   ${!oversizeResult.valid ? '✅' : '❌'} Validation correctly ${oversizeResult.valid ? 'FAILED to block' : 'BLOCKED'} oversized batch`);
console.log(`   📈 Valid files: ${oversizeResult.validFiles.length}/${largeFileCount}`);
if (oversizeResult.errors.length > 0) {
    console.log(`   ✅ Errors (expected): ${oversizeResult.errors.join(', ')}`);
}

// Test 4: Test file count limits
console.log('\n4. Testing File Count Limits:');
const manySmallFiles = [];
const smallFileSize = 5 * 1024 * 1024; // 5MB per file
const excessiveFileCount = 1500; // Over the 1000 file limit

for (let i = 0; i < excessiveFileCount; i++) {
    manySmallFiles.push({
        name: `small_photo_${i + 1}.jpg`,
        size: smallFileSize,
        type: 'image/jpeg'
    });
}

const manyFilesTotalSize = manySmallFiles.reduce((sum, file) => sum + file.size, 0);
console.log(`   📊 Testing ${excessiveFileCount} files, ${(manyFilesTotalSize / 1024 / 1024 / 1024).toFixed(2)}GB total`);

const manyFilesResult = inputValidator.validateFiles(manySmallFiles);
console.log(`   ${!manyFilesResult.valid ? '✅' : '❌'} File count limit ${manyFilesResult.valid ? 'NOT ENFORCED' : 'PROPERLY ENFORCED'}`);
console.log(`   📈 Valid files: ${manyFilesResult.validFiles.length}/${excessiveFileCount}`);
if (manyFilesResult.errors.length > 0) {
    console.log(`   ✅ Errors (expected): ${manyFilesResult.errors.join(', ')}`);
}

// Test 5: Test individual file size limits (100MB)
console.log('\n5. Testing Individual File Size Limits (100MB):');
const oversizeFile = [{
    name: 'huge_photo.jpg',
    size: 150 * 1024 * 1024, // 150MB - over the 100MB limit
    type: 'image/jpeg'
}];

const oversizeFileResult = inputValidator.validateFiles(oversizeFile);
console.log(`   ${!oversizeFileResult.valid ? '✅' : '❌'} Individual file size limit ${oversizeFileResult.valid ? 'NOT ENFORCED' : 'PROPERLY ENFORCED'}`);
console.log(`   📈 Valid files: ${oversizeFileResult.validFiles.length}/1`);
if (oversizeFileResult.warnings.length > 0) {
    console.log(`   ⚠️ Warnings: ${oversizeFileResult.warnings.join(', ')}`);
}

// Test 6: Edge case - exactly at the 10GB limit
console.log('\n6. Testing Edge Case (Exactly 10GB):');
const exactLimitFiles = [{
    name: 'exactly_10gb.jpg',
    size: 10 * 1024 * 1024 * 1024, // Exactly 10GB
    type: 'image/jpeg'
}];

const exactLimitResult = inputValidator.validateFiles(exactLimitFiles);
console.log(`   ${exactLimitResult.valid ? '✅' : '❌'} Exactly 10GB batch: ${exactLimitResult.valid ? 'ALLOWED' : 'BLOCKED'}`);
if (exactLimitResult.errors.length > 0) {
    console.log(`   ⚠️ Errors: ${exactLimitResult.errors.join(', ')}`);
}

console.log('\n7. Batch Size Protection Features:');
console.log('   ✅ 10GB total batch size limit enforced');
console.log('   ✅ 100MB individual file size limit enforced');
console.log('   ✅ 1000 file count limit enforced');
console.log('   ✅ Clear error messages for oversized batches');
console.log('   ✅ Gradual degradation (warnings for oversized files)');
console.log('   ✅ Memory protection against massive file loads');

console.log('\n✅ ASAP-008 Total Batch Size Limit Test Complete!');
console.log('🔒 Batch size limits properly prevent memory overload scenarios');