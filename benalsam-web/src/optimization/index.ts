// ===========================
// OPTIMIZATION INDEX
// ===========================

// Export all optimization modules
export * from './chunking/manualChunks';
export * from './chunking/vendorSplitting';
export * from './lazy-loading/routeLazyLoading';
export * from './memory-management/memoryOptimizer';

// Main optimization orchestrator
export const optimizationOrchestrator = {
  // Initialize all optimizations
  initialize: () => {
    console.log('🚀 Initializing enterprise-level optimizations');
    
    // Initialize memory monitoring
    const memoryInterval = setInterval(() => {
      const memoryUsage = require('./memory-management/memoryOptimizer').memoryOptimizer.monitorMemoryUsage();
      if (memoryUsage) {
        require('./memory-management/memoryOptimizer').memoryOptimizer.performanceMonitor.recordMemoryUsage();
      }
    }, 30000); // Every 30 seconds
    
    // Initialize memory leak detection
    const leakInterval = setInterval(() => {
      require('./memory-management/memoryOptimizer').memoryOptimizer.detectMemoryLeaks.checkForLeaks();
    }, 60000); // Every minute
    
    // Store intervals for cleanup
    (window as any).__optimizationIntervals = {
      memory: memoryInterval,
      leak: leakInterval,
    };
    
    console.log('✅ Enterprise optimizations initialized');
  },
  
  // Cleanup optimizations
  cleanup: () => {
    console.log('🧹 Cleaning up optimizations');
    
    const intervals = (window as any).__optimizationIntervals;
    if (intervals) {
      clearInterval(intervals.memory);
      clearInterval(intervals.leak);
      delete (window as any).__optimizationIntervals;
    }
    
    // Clear memory
    require('./memory-management/memoryOptimizer').memoryOptimizer.triggerCleanup();
    
    console.log('✅ Optimizations cleaned up');
  },
  
  // Get optimization status
  getStatus: () => {
    const memoryUsage = require('./memory-management/memoryOptimizer').memoryOptimizer.monitorMemoryUsage();
    const memoryTrend = require('./memory-management/memoryOptimizer').memoryOptimizer.performanceMonitor.getMemoryTrend();
    
    return {
      memoryUsage,
      memoryTrend,
      isInitialized: !!(window as any).__optimizationIntervals,
    };
  },
};

// Export default orchestrator
export default optimizationOrchestrator;
