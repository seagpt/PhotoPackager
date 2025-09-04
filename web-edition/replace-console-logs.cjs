#!/usr/bin/env node

/**
 * Script to replace console.* statements with logger.* statements
 * Part of ASAP-019: Remove ALL console.log statements from production
 */

const fs = require('fs');
const path = require('path');

// Files to process
const filesToProcess = [
    'src/main.js',
    'src/js/MemoryMonitor.js', 
    'src/js/ProgressPersistence.js',
    'src/js/ImageProcessor.js',
    'src/js/PackageBuilder.js',
    'src/js/PerformanceOptimizer.js',
    'src/js/ErrorHandler.js',
    'src/js/AnalyticsManager.js',
    'src/js/NetworkUtils.js',
    'src/js/DragDropManager.js',
    'src/js/FocusManager.js',
    'src/js/KeyboardShortcuts.js',
    'src/js/PrivacyAnalytics.js'
];

const replacements = [
    // Direct console.log replacements
    { from: /console\.log\(/g, to: 'logger.log(' },
    { from: /console\.debug\(/g, to: 'logger.debug(' },
    { from: /console\.info\(/g, to: 'logger.info(' },
    { from: /console\.warn\(/g, to: 'logger.warn(' },
    { from: /console\.error\(/g, to: 'logger.error(' },
    { from: /console\.time\(/g, to: 'logger.time(' },
    { from: /console\.timeEnd\(/g, to: 'logger.timeEnd(' },
    { from: /console\.table\(/g, to: 'logger.table(' }
];

let totalReplacements = 0;

filesToProcess.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let fileReplacements = 0;
    
    // Check if logger is already imported
    const hasLoggerImport = content.includes("import { logger }") || 
                           content.includes("from './Logger.js'");
    
    // Apply replacements
    replacements.forEach(({ from, to }) => {
        const matches = content.match(from);
        if (matches) {
            fileReplacements += matches.length;
            content = content.replace(from, to);
        }
    });
    
    if (fileReplacements > 0) {
        // Add logger import if not present and replacements were made
        if (!hasLoggerImport && !content.includes('Logger.js')) {
            // Find the last import statement
            const importMatches = content.match(/^import .* from .*;$/gm);
            if (importMatches) {
                const lastImport = importMatches[importMatches.length - 1];
                const lastImportIndex = content.lastIndexOf(lastImport);
                const insertPosition = lastImportIndex + lastImport.length;
                
                // Determine correct path based on file location
                const loggerPath = filePath.startsWith('src/js/') ? './Logger.js' : './js/Logger.js';
                const importStatement = `\nimport { logger } from '${loggerPath}';`;
                
                content = content.slice(0, insertPosition) + importStatement + content.slice(insertPosition);
            }
        }
        
        // Write back the modified content
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ ${filePath}: ${fileReplacements} replacements`);
        totalReplacements += fileReplacements;
    } else {
        console.log(`⏭️  ${filePath}: No console statements found`);
    }
});

console.log(`\n🎯 Total replacements: ${totalReplacements}`);
console.log('✅ Console log replacement complete!');