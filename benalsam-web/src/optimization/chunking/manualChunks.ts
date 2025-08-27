// ===========================
// MANUAL CHUNKS OPTIMIZATION
// ===========================

import type { ManualChunksOption } from 'rollup';

// Manual chunks configuration for optimal bundle splitting
export const createManualChunks: ManualChunksOption = (id) => {
  // Vendor libraries
  if (id.includes('node_modules')) {
    // React ecosystem
    if (id.includes('react') || id.includes('react-dom')) {
      return 'react-vendor';
    }
    
    // UI libraries
    if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('class-variance-authority')) {
      return 'ui-vendor';
    }
    
    // State management
    if (id.includes('zustand') || id.includes('@tanstack/react-query')) {
      return 'state-vendor';
    }
    
    // Form handling
    if (id.includes('react-hook-form') || id.includes('@hookform/resolvers') || id.includes('zod')) {
      return 'form-vendor';
    }
    
    // Routing
    if (id.includes('react-router') || id.includes('@remix-run')) {
      return 'router-vendor';
    }
    
    // Database and API
    if (id.includes('@supabase') || id.includes('axios') || id.includes('fetch')) {
      return 'api-vendor';
    }
    
    // Utilities
    if (id.includes('lodash') || id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
      return 'utils-vendor';
    }
    
    // Development tools
    if (id.includes('vite') || id.includes('@vitejs') || id.includes('eslint') || id.includes('prettier')) {
      return 'dev-vendor';
    }
    
    // Other vendor libraries
    return 'vendor';
  }
  
  // Application chunks
  if (id.includes('src/')) {
    // Pages
    if (id.includes('/pages/')) {
      if (id.includes('HomePage') || id.includes('SearchResultsPage')) {
        return 'home-pages';
      }
      if (id.includes('ListingDetailPage') || id.includes('EditListingPage')) {
        return 'listing-pages';
      }
      if (id.includes('AuthPage') || id.includes('ProfilePage')) {
        return 'auth-pages';
      }
      if (id.includes('ConversationPage') || id.includes('OffersPage')) {
        return 'communication-pages';
      }
      if (id.includes('SettingsPage') || id.includes('PremiumPage')) {
        return 'settings-pages';
      }
      return 'other-pages';
    }
    
    // Components
    if (id.includes('/components/')) {
      if (id.includes('Header') || id.includes('Footer') || id.includes('Sidebar')) {
        return 'layout-components';
      }
      if (id.includes('ListingCard') || id.includes('AdCard')) {
        return 'listing-components';
      }
      if (id.includes('Form') || id.includes('Modal')) {
        return 'form-components';
      }
      if (id.includes('Button') || id.includes('Input') || id.includes('Select')) {
        return 'ui-components';
      }
      return 'other-components';
    }
    
    // Services
    if (id.includes('/services/')) {
      if (id.includes('elasticsearch') || id.includes('listingService')) {
        return 'search-services';
      }
      if (id.includes('auth') || id.includes('user')) {
        return 'auth-services';
      }
      if (id.includes('conversation') || id.includes('offer')) {
        return 'communication-services';
      }
      return 'other-services';
    }
    
    // Hooks
    if (id.includes('/hooks/')) {
      return 'hooks';
    }
    
    // Utils
    if (id.includes('/utils/')) {
      if (id.includes('performance')) {
        return 'performance-utils';
      }
      if (id.includes('validation') || id.includes('formatting')) {
        return 'utility-utils';
      }
      return 'other-utils';
    }
    
    // Types
    if (id.includes('/types/') || id.endsWith('.d.ts')) {
      return 'types';
    }
  }
  
  // Default chunk
  return 'main';
};

// Chunk size optimization configuration
export const chunkSizeConfig = {
  // Maximum chunk size (in bytes)
  maxChunkSize: 500 * 1024, // 500KB
  
  // Minimum chunk size (in bytes)
  minChunkSize: 10 * 1024, // 10KB
  
  // Chunk size warning limit
  chunkSizeWarningLimit: 1000 * 1024, // 1MB
};

// Dynamic import optimization
export const dynamicImportConfig = {
  // Preload critical chunks
  preloadCritical: [
    'react-vendor',
    'ui-vendor',
    'home-pages',
    'layout-components',
  ],
  
  // Prefetch non-critical chunks
  prefetchNonCritical: [
    'listing-pages',
    'auth-pages',
    'communication-pages',
    'settings-pages',
  ],
  
  // Lazy load heavy chunks
  lazyLoadHeavy: [
    'create-listing',
    'vendor',
    'performance-utils',
  ],
};

// Chunk naming strategy
export const chunkNamingStrategy = {
  // Vendor chunks
  vendor: '[name]-vendor-[hash]',
  
  // Page chunks
  pages: '[name]-page-[hash]',
  
  // Component chunks
  components: '[name]-component-[hash]',
  
  // Service chunks
  services: '[name]-service-[hash]',
  
  // Utility chunks
  utils: '[name]-util-[hash]',
  
  // Default
  default: '[name]-[hash]',
};

// Chunk optimization utilities
export const chunkOptimizer = {
  // Analyze chunk dependencies
  analyzeDependencies: (chunks: any[]) => {
    const analysis = {
      totalChunks: chunks.length,
      totalSize: 0,
      averageSize: 0,
      largestChunk: null as any,
      smallestChunk: null as any,
      vendorChunks: [] as any[],
      appChunks: [] as any[],
    };
    
    chunks.forEach(chunk => {
      analysis.totalSize += chunk.size || 0;
      
      if (!analysis.largestChunk || chunk.size > analysis.largestChunk.size) {
        analysis.largestChunk = chunk;
      }
      
      if (!analysis.smallestChunk || chunk.size < analysis.smallestChunk.size) {
        analysis.smallestChunk = chunk;
      }
      
      if (chunk.name.includes('vendor')) {
        analysis.vendorChunks.push(chunk);
      } else {
        analysis.appChunks.push(chunk);
      }
    });
    
    analysis.averageSize = analysis.totalSize / analysis.totalChunks;
    
    return analysis;
  },
  
  // Optimize chunk splitting
  optimizeSplitting: (chunks: any[]) => {
    const optimizedChunks = [];
    const largeChunks = chunks.filter(chunk => chunk.size > chunkSizeConfig.maxChunkSize);
    
    for (const chunk of largeChunks) {
      // Split large chunks into smaller ones
      if (chunk.size > chunkSizeConfig.maxChunkSize * 2) {
        // Split into multiple chunks
        const splitCount = Math.ceil(chunk.size / chunkSizeConfig.maxChunkSize);
        for (let i = 0; i < splitCount; i++) {
          optimizedChunks.push({
            ...chunk,
            name: `${chunk.name}-part-${i + 1}`,
            size: Math.floor(chunk.size / splitCount),
          });
        }
      } else {
        optimizedChunks.push(chunk);
      }
    }
    
    // Add remaining chunks
    const smallChunks = chunks.filter(chunk => chunk.size <= chunkSizeConfig.maxChunkSize);
    optimizedChunks.push(...smallChunks);
    
    return optimizedChunks;
  },
  
  // Generate chunk loading strategy
  generateLoadingStrategy: (chunks: any[]) => {
    const strategy = {
      immediate: [] as string[],
      preload: [] as string[],
      prefetch: [] as string[],
      lazy: [] as string[],
    };
    
    chunks.forEach(chunk => {
      if (dynamicImportConfig.preloadCritical.includes(chunk.name)) {
        strategy.immediate.push(chunk.name);
      } else if (dynamicImportConfig.prefetchNonCritical.includes(chunk.name)) {
        strategy.preload.push(chunk.name);
      } else if (dynamicImportConfig.lazyLoadHeavy.includes(chunk.name)) {
        strategy.lazy.push(chunk.name);
      } else {
        strategy.prefetch.push(chunk.name);
      }
    });
    
    return strategy;
  },
};

export default {
  createManualChunks,
  chunkSizeConfig,
  dynamicImportConfig,
  chunkNamingStrategy,
  chunkOptimizer,
};
