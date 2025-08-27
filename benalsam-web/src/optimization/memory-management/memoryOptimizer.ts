// ===========================
// MEMORY OPTIMIZATION
// ===========================

// Memory optimization configuration
export const memoryOptimizationConfig = {
  // Memory thresholds
  thresholds: {
    critical: 100 * 1024 * 1024, // 100MB
    warning: 50 * 1024 * 1024,   // 50MB
    optimal: 20 * 1024 * 1024,   // 20MB
  },
  
  // Cache limits
  cacheLimits: {
    maxCacheSize: 10 * 1024 * 1024, // 10MB
    maxCacheItems: 1000,
    cacheTTL: 5 * 60 * 1000, // 5 minutes
  },
  
  // Component limits
  componentLimits: {
    maxVirtualizedItems: 1000,
    maxRenderedItems: 100,
    maxImageCache: 50,
  },
  
  // Event listener limits
  eventLimits: {
    maxEventListeners: 100,
    maxScrollListeners: 10,
    maxResizeListeners: 5,
  },
};

// Memory optimization utilities
export const memoryOptimizer = {
  // Monitor memory usage
  monitorMemoryUsage: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      
      const usage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      };
      
      console.log(`📊 Memory usage: ${(usage.used / 1024 / 1024).toFixed(2)}MB / ${(usage.limit / 1024 / 1024).toFixed(2)}MB (${usage.percentage.toFixed(1)}%)`);
      
      // Alert if memory usage is high
      if (usage.percentage > 80) {
        console.warn(`⚠️ High memory usage: ${usage.percentage.toFixed(1)}%`);
        memoryOptimizer.triggerCleanup();
      }
      
      return usage;
    }
    
    return null;
  },
  
  // Trigger memory cleanup
  triggerCleanup: () => {
    console.log('🧹 Triggering memory cleanup');
    
    // Clear caches
    memoryOptimizer.clearCaches();
    
    // Clear event listeners
    memoryOptimizer.clearEventListeners();
    
    // Clear image cache
    memoryOptimizer.clearImageCache();
    
    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
  },
  
  // Clear application caches
  clearCaches: () => {
    // Clear React Query cache
    if ((window as any).__REACT_QUERY_CACHE__) {
      (window as any).__REACT_QUERY_CACHE__.clear();
    }
    
    // Clear localStorage if too large
    try {
      const localStorageSize = new Blob(Object.values(localStorage)).size;
      if (localStorageSize > memoryOptimizationConfig.cacheLimits.maxCacheSize) {
        localStorage.clear();
        console.log('🗑️ Cleared localStorage due to size limit');
      }
    } catch (error) {
      console.warn('⚠️ Could not check localStorage size');
    }
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    console.log('🗑️ Application caches cleared');
  },
  
  // Clear event listeners
  clearEventListeners: () => {
    // This is a simplified version - in a real app, you'd track listeners
    console.log('🗑️ Event listeners cleanup triggered');
  },
  
  // Clear image cache
  clearImageCache: () => {
    // Clear browser image cache
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('image')) {
            caches.delete(cacheName);
          }
        });
      });
    }
    
    console.log('🗑️ Image cache cleared');
  },
  
  // Optimize component rendering
  optimizeComponentRendering: {
    // Virtual scrolling for large lists
    virtualizeList: (items: any[], itemHeight: number, containerHeight: number) => {
      const visibleCount = Math.ceil(containerHeight / itemHeight);
      const startIndex = Math.floor(window.scrollY / itemHeight);
      const endIndex = Math.min(startIndex + visibleCount, items.length);
      
      return {
        items: items.slice(startIndex, endIndex),
        startIndex,
        endIndex,
        totalHeight: items.length * itemHeight,
        offsetY: startIndex * itemHeight,
      };
    },
    
    // Debounce expensive operations
    debounce: (func: Function, delay: number) => {
      let timeoutId: NodeJS.Timeout;
      
      return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
      };
    },
    
    // Throttle frequent operations
    throttle: (func: Function, delay: number) => {
      let lastCall = 0;
      
      return (...args: any[]) => {
        const now = Date.now();
        
        if (now - lastCall >= delay) {
          lastCall = now;
          func.apply(null, args);
        }
      };
    },
    
    // Memoize expensive calculations
    memoize: <T extends (...args: any[]) => any>(func: T) => {
      const cache = new Map();
      
      return ((...args: Parameters<T>) => {
        const key = JSON.stringify(args);
        
        if (cache.has(key)) {
          return cache.get(key);
        }
        
        const result = func.apply(null, args);
        cache.set(key, result);
        
        // Limit cache size
        if (cache.size > memoryOptimizationConfig.cacheLimits.maxCacheItems) {
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
        
        return result;
      }) as T;
    },
  },
  
  // Optimize data structures
  optimizeDataStructures: {
    // Use WeakMap for object keys
    createWeakCache: () => {
      return new WeakMap();
    },
    
    // Use Set for unique values
    createUniqueSet: () => {
      return new Set();
    },
    
    // Use Map for key-value pairs
    createOptimizedMap: () => {
      return new Map();
    },
    
    // Flatten nested objects
    flattenObject: (obj: any, prefix = '') => {
      const flattened: any = {};
      
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          Object.assign(flattened, memoryOptimizer.optimizeDataStructures.flattenObject(value, `${prefix}${key}.`));
        } else {
          flattened[`${prefix}${key}`] = value;
        }
      });
      
      return flattened;
    },
  },
  
  // Optimize images
  optimizeImages: {
    // Lazy load images
    lazyLoadImage: (img: HTMLImageElement, src: string) => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            img.src = src;
            observer.unobserve(img);
          }
        });
      });
      
      observer.observe(img);
    },
    
    // Preload critical images
    preloadImage: (src: string) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    },
    
    // Optimize image size
    optimizeImageSize: (file: File, maxWidth: number, maxHeight: number): Promise<Blob> => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        const img = new Image();
        
        img.onload = () => {
          const { width, height } = img;
          let newWidth = width;
          let newHeight = height;
          
          if (width > maxWidth) {
            newWidth = maxWidth;
            newHeight = (height * maxWidth) / width;
          }
          
          if (newHeight > maxHeight) {
            newHeight = maxHeight;
            newWidth = (newWidth * maxHeight) / newHeight;
          }
          
          canvas.width = newWidth;
          canvas.height = newHeight;
          
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          
          canvas.toBlob(resolve, 'image/jpeg', 0.8);
        };
        
        img.src = URL.createObjectURL(file);
      });
    },
  },
  
  // Memory leak detection
  detectMemoryLeaks: {
    // Track component instances
    componentInstances: new Set(),
    
    // Register component instance
    registerComponent: (component: any) => {
      memoryOptimizer.detectMemoryLeaks.componentInstances.add(component);
    },
    
    // Unregister component instance
    unregisterComponent: (component: any) => {
      memoryOptimizer.detectMemoryLeaks.componentInstances.delete(component);
    },
    
    // Check for memory leaks
    checkForLeaks: () => {
      const instanceCount = memoryOptimizer.detectMemoryLeaks.componentInstances.size;
      
      if (instanceCount > 100) {
        console.warn(`⚠️ Potential memory leak: ${instanceCount} component instances`);
        memoryOptimizer.detectMemoryLeaks.componentInstances.clear();
      }
    },
  },
  
  // Performance monitoring
  performanceMonitor: {
    // Track memory usage over time
    memoryHistory: [] as number[],
    
    // Record memory usage
    recordMemoryUsage: () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usage = memory.usedJSHeapSize / 1024 / 1024; // MB
        
        memoryOptimizer.performanceMonitor.memoryHistory.push(usage);
        
        // Keep only last 100 records
        if (memoryOptimizer.performanceMonitor.memoryHistory.length > 100) {
          memoryOptimizer.performanceMonitor.memoryHistory.shift();
        }
      }
    },
    
    // Get memory usage trend
    getMemoryTrend: () => {
      const history = memoryOptimizer.performanceMonitor.memoryHistory;
      
      if (history.length < 2) return 'stable';
      
      const recent = history.slice(-10);
      const previous = history.slice(-20, -10);
      
      if (previous.length === 0) return 'stable';
      
      const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
      const previousAvg = previous.reduce((sum, val) => sum + val, 0) / previous.length;
      
      if (recentAvg > previousAvg * 1.2) return 'increasing';
      if (recentAvg < previousAvg * 0.8) return 'decreasing';
      return 'stable';
    },
  },
};

export default {
  memoryOptimizationConfig,
  memoryOptimizer,
};
