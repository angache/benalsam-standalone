// ===========================
// VENDOR SPLITTING OPTIMIZATION
// ===========================

// Vendor splitting configuration for optimal bundle optimization
export const vendorSplittingConfig = {
  // Core React ecosystem
  reactCore: [
    'react',
    'react-dom',
    'react-router-dom',
    '@remix-run/react',
  ],
  
  // UI libraries
  uiLibraries: [
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-select',
    '@radix-ui/react-tabs',
    '@radix-ui/react-toast',
    '@radix-ui/react-tooltip',
    'lucide-react',
    'class-variance-authority',
    'clsx',
    'tailwind-merge',
  ],
  
  // State management
  stateManagement: [
    'zustand',
    '@tanstack/react-query',
    '@tanstack/react-query-devtools',
  ],
  
  // Form handling
  formHandling: [
    'react-hook-form',
    '@hookform/resolvers',
    'zod',
    'react-select',
  ],
  
  // Database and API
  databaseApi: [
    '@supabase/supabase-js',
    '@supabase/auth-helpers-react',
    'axios',
    'swr',
  ],
  
  // Utilities
  utilities: [
    'lodash',
    'date-fns',
    'framer-motion',
    'react-intersection-observer',
    'react-virtualized',
  ],
  
  // Development tools (only in dev)
  developmentTools: [
    'vite',
    '@vitejs/plugin-react',
    'eslint',
    'prettier',
    '@types/react',
    '@types/react-dom',
  ],
};

// Vendor chunk optimization strategy
export const vendorChunkStrategy = {
  // Critical vendors (load immediately)
  critical: [
    'react',
    'react-dom',
    'react-router-dom',
  ],
  
  // Important vendors (preload)
  important: [
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    'lucide-react',
    'zustand',
    '@tanstack/react-query',
  ],
  
  // Normal vendors (prefetch)
  normal: [
    'react-hook-form',
    '@hookform/resolvers',
    'zod',
    '@supabase/supabase-js',
    'axios',
  ],
  
  // Heavy vendors (lazy load)
  heavy: [
    'framer-motion',
    'react-virtualized',
    'lodash',
    'date-fns',
  ],
};

// Vendor optimization utilities
export const vendorOptimizer = {
  // Analyze vendor dependencies
  analyzeVendorDependencies: (dependencies: any) => {
    const analysis = {
      totalVendors: 0,
      totalSize: 0,
      vendorCategories: {
        reactCore: 0,
        uiLibraries: 0,
        stateManagement: 0,
        formHandling: 0,
        databaseApi: 0,
        utilities: 0,
        developmentTools: 0,
      },
      largestVendors: [] as any[],
      duplicateVendors: [] as string[],
    };
    
    Object.entries(dependencies).forEach(([name, info]: [string, any]) => {
      analysis.totalVendors++;
      analysis.totalSize += info.size || 0;
      
      // Categorize vendors
      if (vendorSplittingConfig.reactCore.includes(name)) {
        analysis.vendorCategories.reactCore++;
      } else if (vendorSplittingConfig.uiLibraries.includes(name)) {
        analysis.vendorCategories.uiLibraries++;
      } else if (vendorSplittingConfig.stateManagement.includes(name)) {
        analysis.vendorCategories.stateManagement++;
      } else if (vendorSplittingConfig.formHandling.includes(name)) {
        analysis.vendorCategories.formHandling++;
      } else if (vendorSplittingConfig.databaseApi.includes(name)) {
        analysis.vendorCategories.databaseApi++;
      } else if (vendorSplittingConfig.utilities.includes(name)) {
        analysis.vendorCategories.utilities++;
      } else if (vendorSplittingConfig.developmentTools.includes(name)) {
        analysis.vendorCategories.developmentTools++;
      }
      
      // Track largest vendors
      if (info.size > 100 * 1024) { // > 100KB
        analysis.largestVendors.push({ name, size: info.size });
      }
    });
    
    // Sort largest vendors by size
    analysis.largestVendors.sort((a, b) => b.size - a.size);
    
    return analysis;
  },
  
  // Optimize vendor chunks
  optimizeVendorChunks: (vendors: any[]) => {
    const optimized = {
      critical: [] as any[],
      important: [] as any[],
      normal: [] as any[],
      heavy: [] as any[],
    };
    
    vendors.forEach(vendor => {
      if (vendorChunkStrategy.critical.includes(vendor.name)) {
        optimized.critical.push(vendor);
      } else if (vendorChunkStrategy.important.includes(vendor.name)) {
        optimized.important.push(vendor);
      } else if (vendorChunkStrategy.heavy.includes(vendor.name)) {
        optimized.heavy.push(vendor);
      } else {
        optimized.normal.push(vendor);
      }
    });
    
    return optimized;
  },
  
  // Generate vendor loading strategy
  generateVendorLoadingStrategy: (vendors: any[]) => {
    const strategy = {
      immediate: [] as string[],
      preload: [] as string[],
      prefetch: [] as string[],
      lazy: [] as string[],
    };
    
    vendors.forEach(vendor => {
      if (vendorChunkStrategy.critical.includes(vendor.name)) {
        strategy.immediate.push(vendor.name);
      } else if (vendorChunkStrategy.important.includes(vendor.name)) {
        strategy.preload.push(vendor.name);
      } else if (vendorChunkStrategy.heavy.includes(vendor.name)) {
        strategy.lazy.push(vendor.name);
      } else {
        strategy.prefetch.push(vendor.name);
      }
    });
    
    return strategy;
  },
  
  // Remove duplicate vendors
  removeDuplicateVendors: (vendors: any[]) => {
    const seen = new Set();
    const unique = [];
    
    for (const vendor of vendors) {
      if (!seen.has(vendor.name)) {
        seen.add(vendor.name);
        unique.push(vendor);
      }
    }
    
    return unique;
  },
  
  // Tree shake unused vendors
  treeShakeVendors: (vendors: any[], usedImports: string[]) => {
    return vendors.filter(vendor => {
      // Check if vendor is actually used
      return usedImports.some(importPath => 
        importPath.includes(vendor.name) || 
        vendor.name.includes(importPath.split('/')[0])
      );
    });
  },
};

// Vendor preloading strategy
export const vendorPreloadingStrategy = {
  // Preload critical vendors
  preloadCritical: () => {
    const criticalVendors = vendorChunkStrategy.critical;
    
    criticalVendors.forEach(vendor => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'script';
      link.href = `/assets/${vendor}-vendor-[hash].js`;
      document.head.appendChild(link);
    });
  },
  
  // Prefetch important vendors
  prefetchImportant: () => {
    const importantVendors = vendorChunkStrategy.important;
    
    importantVendors.forEach(vendor => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'script';
      link.href = `/assets/${vendor}-vendor-[hash].js`;
      document.head.appendChild(link);
    });
  },
  
  // Lazy load heavy vendors
  lazyLoadHeavy: () => {
    const heavyVendors = vendorChunkStrategy.heavy;
    
    heavyVendors.forEach(vendor => {
      // Load on demand
      const loadVendor = () => {
        return import(/* webpackChunkName: "heavy-vendor" */ vendor);
      };
      
      // Store for later use
      (window as any)[`lazy_${vendor}`] = loadVendor;
    });
  },
};

// Vendor performance monitoring
export const vendorPerformanceMonitor = {
  // Track vendor loading times
  trackVendorLoading: (vendorName: string) => {
    const startTime = performance.now();
    
    return {
      start: () => {
        console.log(`📦 Loading vendor: ${vendorName}`);
      },
      end: () => {
        const loadTime = performance.now() - startTime;
        console.log(`✅ Vendor loaded: ${vendorName} (${loadTime.toFixed(2)}ms)`);
        
        // Report to analytics
        if ((window as any).gtag) {
          (window as any).gtag('event', 'vendor_load', {
            vendor_name: vendorName,
            load_time: loadTime,
          });
        }
      },
    };
  },
  
  // Monitor vendor bundle size
  monitorVendorSize: (vendors: any[]) => {
    const totalSize = vendors.reduce((sum, vendor) => sum + (vendor.size || 0), 0);
    const averageSize = totalSize / vendors.length;
    
    console.log(`📊 Vendor bundle analysis:`);
    console.log(`   Total vendors: ${vendors.length}`);
    console.log(`   Total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Average size: ${(averageSize / 1024).toFixed(2)}KB`);
    
    // Alert if bundle is too large
    if (totalSize > 2 * 1024 * 1024) { // > 2MB
      console.warn(`⚠️ Vendor bundle is large: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
    }
  },
};

export default {
  vendorSplittingConfig,
  vendorChunkStrategy,
  vendorOptimizer,
  vendorPreloadingStrategy,
  vendorPerformanceMonitor,
};
