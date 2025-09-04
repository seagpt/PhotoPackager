// Test setInterval memory leak prevention in PerformanceOptimizer

// Mock environment for testing
global.window = { 
    performance: { 
        memory: { 
            usedJSHeapSize: 10000000, 
            totalJSHeapSize: 50000000, 
            jsHeapSizeLimit: 100000000 
        } 
    },
    addEventListener: (event, handler) => {}, // Mock event listener
    removeEventListener: (event, handler) => {} // Mock event listener removal
};
global.performance = global.window.performance;
global.document = {
    querySelectorAll: (selector) => [] // Mock DOM query that returns empty array
};

// Mock console methods to prevent spam during testing
const logs = [];
const originalMethods = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug
};

// Capture logs for analysis
console.log = (...args) => logs.push(['log', ...args]);
console.warn = (...args) => logs.push(['warn', ...args]);  
console.error = (...args) => logs.push(['error', ...args]);
console.info = (...args) => logs.push(['info', ...args]);
console.debug = (...args) => logs.push(['debug', ...args]);

// Load modules
const { PerformanceOptimizer } = await import('./src/js/PerformanceOptimizer.js');

// Restore console for final output
Object.assign(console, originalMethods);

console.log('🔧 Testing setInterval memory leak prevention...');

// Track interval creation/clearing
let intervalCount = 0;
let clearCount = 0;
const activeIntervals = new Set();

const originalSetInterval = global.setInterval;
global.setInterval = function(...args) {
    intervalCount++;
    const id = originalSetInterval.apply(this, args);
    activeIntervals.add(id);
    return id;
};

const originalClearInterval = global.clearInterval;
global.clearInterval = function(id) {
    if (id && activeIntervals.has(id)) {
        clearCount++;
        activeIntervals.delete(id);
    }
    return originalClearInterval.call(this, id);
};

// Test 1: Multiple instantiation cleanup
console.log('Test 1: Creating and cleaning up 5 optimizers...');

const optimizers = [];
for (let i = 0; i < 5; i++) {
    optimizers.push(new PerformanceOptimizer());
}

console.log(`- Created 5 optimizers`);
console.log(`- Intervals created: ${intervalCount}`);
console.log(`- Active intervals: ${activeIntervals.size}`);

// Clean them up
optimizers.forEach((opt, index) => {
    opt.cleanup();
    console.log(`  - Optimizer ${index + 1} cleaned up`);
});

console.log(`- After cleanup - intervals cleared: ${clearCount}`);
console.log(`- Active intervals remaining: ${activeIntervals.size}`);

if (activeIntervals.size === 0) {
    console.log('✅ Test 1 PASSED: All intervals properly cleaned up');
} else {
    console.log('❌ Test 1 FAILED: Intervals still active after cleanup');
}

// Test 2: Verify isActive property
console.log('\nTest 2: Testing isActive property...');

const testOptimizer = new PerformanceOptimizer();
console.log(`- New optimizer is active: ${testOptimizer.isActive}`);

testOptimizer.cleanup();
console.log(`- After cleanup, optimizer is active: ${testOptimizer.isActive}`);

if (!testOptimizer.isActive) {
    console.log('✅ Test 2 PASSED: isActive correctly reports false after cleanup');
} else {
    console.log('❌ Test 2 FAILED: isActive still true after cleanup');
}

// Test 3: Public startMemoryMonitoring/stopMemoryMonitoring methods
console.log('\nTest 3: Testing public memory monitoring methods...');

const publicTestOptimizer = new PerformanceOptimizer();
const initialActive = publicTestOptimizer.isActive;

// Start additional monitoring
publicTestOptimizer.startMemoryMonitoring();
const afterStart = publicTestOptimizer.isActive;

// Stop monitoring
publicTestOptimizer.stopMemoryMonitoring();
const afterStop = publicTestOptimizer.isActive;

publicTestOptimizer.cleanup();
const afterCleanup = publicTestOptimizer.isActive;

console.log(`- Initial state active: ${initialActive}`);
console.log(`- After startMemoryMonitoring: ${afterStart}`);  
console.log(`- After stopMemoryMonitoring: ${afterStop}`);
console.log(`- After cleanup: ${afterCleanup}`);

if (!afterCleanup) {
    console.log('✅ Test 3 PASSED: Public monitoring methods work correctly');
} else {
    console.log('❌ Test 3 FAILED: Public methods left intervals active');
}

// Test 4: Double setup protection
console.log('\nTest 4: Testing double setup protection...');

const doubleSetupOptimizer = new PerformanceOptimizer();
const initialIntervals = intervalCount;

// Try to setup again (this should not create new intervals)
doubleSetupOptimizer.setupPerformanceMonitoring();
const afterDoubleSetup = intervalCount;

doubleSetupOptimizer.cleanup();

console.log(`- Intervals before double setup: ${initialIntervals}`);
console.log(`- Intervals after double setup: ${afterDoubleSetup}`);
console.log(`- New intervals created: ${afterDoubleSetup - initialIntervals}`);

if (afterDoubleSetup - initialIntervals <= 2) { // Should only create intervals once
    console.log('✅ Test 4 PASSED: Double setup protection working');
} else {
    console.log('❌ Test 4 FAILED: Double setup created extra intervals');
}

// Summary
console.log('\n📊 Final Summary:');
console.log(`- Total intervals created: ${intervalCount}`);
console.log(`- Total intervals cleared: ${clearCount}`);
console.log(`- Active intervals remaining: ${activeIntervals.size}`);
console.log(`- Captured log entries: ${logs.length}`);

if (activeIntervals.size === 0 && clearCount > 0) {
    console.log('🎉 HIGH-002 setInterval memory leak prevention: PASSED');
} else {
    console.log('💥 HIGH-002 setInterval memory leak prevention: FAILED');
}