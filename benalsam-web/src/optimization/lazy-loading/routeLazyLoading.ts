// ===========================
// ROUTE LAZY LOADING OPTIMIZATION
// ===========================

import { lazy, Suspense } from 'react';

// Route lazy loading configuration
export const routeLazyLoadingConfig = {
  // Critical routes (load immediately)
  critical: [
    'HomePage',
    'SearchResultsPage',
    'ListingDetailPage',
  ],
  
  // Important routes (preload)
  important: [
    'AuthPage',
    'ProfilePage',
    'MyListingsPage',
  ],
  
  // Normal routes (prefetch)
  normal: [
    'EditListingPage',
    'ConversationPage',
    'OffersPage',
    'SettingsPage',
  ],
  
  // Heavy routes (lazy load)
  heavy: [
    'CreateListingPage',
    'PremiumPage',
    'AdminPage',
    'AnalyticsPage',
  ],
};

// Route loading strategy
export const routeLoadingStrategy = {
  // Immediate loading
  immediate: (component: any) => component,
  
  // Lazy loading with suspense
  lazy: (importFn: () => Promise<any>) => {
    const LazyComponent = lazy(importFn);
    
    return (props: any) => (
      <Suspense fallback={<RouteLoadingFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  },
  
  // Preload strategy
  preload: (importFn: () => Promise<any>) => {
    // Start loading immediately but don't render
    const preloadPromise = importFn();
    
    return (props: any) => {
      const LazyComponent = lazy(() => preloadPromise);
      
      return (
        <Suspense fallback={<RouteLoadingFallback />}>
          <LazyComponent {...props} />
        </Suspense>
      );
    };
  },
};

// Route lazy loading utilities
export const routeLazyLoader = {
  // Create lazy route component
  createLazyRoute: (routeName: string, importPath: string) => {
    const importFn = () => import(/* webpackChunkName: "[request]" */ importPath);
    
    if (routeLazyLoadingConfig.critical.includes(routeName)) {
      return routeLoadingStrategy.immediate(importFn);
    } else if (routeLazyLoadingConfig.important.includes(routeName)) {
      return routeLoadingStrategy.preload(importFn);
    } else {
      return routeLoadingStrategy.lazy(importFn);
    }
  },
  
  // Preload route
  preloadRoute: (routeName: string, importPath: string) => {
    const importFn = () => import(/* webpackChunkName: "[request]" */ importPath);
    
    // Start preloading
    const preloadPromise = importFn();
    
    // Store for later use
    (window as any)[`preloaded_${routeName}`] = preloadPromise;
    
    console.log(`📦 Preloading route: ${routeName}`);
    
    return preloadPromise;
  },
  
  // Preload multiple routes
  preloadRoutes: (routes: Array<{ name: string; path: string }>) => {
    routes.forEach(route => {
      routeLazyLoader.preloadRoute(route.name, route.path);
    });
  },
  
  // Get preloaded route
  getPreloadedRoute: (routeName: string) => {
    return (window as any)[`preloaded_${routeName}`];
  },
  
  // Clear preloaded routes
  clearPreloadedRoutes: () => {
    Object.keys(window).forEach(key => {
      if (key.startsWith('preloaded_')) {
        delete (window as any)[key];
      }
    });
  },
};

// Route loading fallback component
const RouteLoadingFallback = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

// Route performance monitoring
export const routePerformanceMonitor = {
  // Track route loading time
  trackRouteLoading: (routeName: string) => {
    const startTime = performance.now();
    
    return {
      start: () => {
        console.log(`🛣️ Loading route: ${routeName}`);
      },
      end: () => {
        const loadTime = performance.now() - startTime;
        console.log(`✅ Route loaded: ${routeName} (${loadTime.toFixed(2)}ms)`);
        
        // Report to analytics
        if ((window as any).gtag) {
          (window as any).gtag('event', 'route_load', {
            route_name: routeName,
            load_time: loadTime,
          });
        }
      },
    };
  },
  
  // Monitor route bundle size
  monitorRouteSize: (routes: any[]) => {
    const totalSize = routes.reduce((sum, route) => sum + (route.size || 0), 0);
    const averageSize = totalSize / routes.length;
    
    console.log(`📊 Route bundle analysis:`);
    console.log(`   Total routes: ${routes.length}`);
    console.log(`   Total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Average size: ${(averageSize / 1024).toFixed(2)}KB`);
    
    // Alert if route bundle is too large
    if (totalSize > 1 * 1024 * 1024) { // > 1MB
      console.warn(`⚠️ Route bundle is large: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
    }
  },
};

// Route optimization utilities
export const routeOptimizer = {
  // Analyze route dependencies
  analyzeRouteDependencies: (routes: any[]) => {
    const analysis = {
      totalRoutes: routes.length,
      totalSize: 0,
      routeCategories: {
        critical: 0,
        important: 0,
        normal: 0,
        heavy: 0,
      },
      largestRoutes: [] as any[],
      duplicateRoutes: [] as string[],
    };
    
    routes.forEach(route => {
      analysis.totalSize += route.size || 0;
      
      // Categorize routes
      if (routeLazyLoadingConfig.critical.includes(route.name)) {
        analysis.routeCategories.critical++;
      } else if (routeLazyLoadingConfig.important.includes(route.name)) {
        analysis.routeCategories.important++;
      } else if (routeLazyLoadingConfig.heavy.includes(route.name)) {
        analysis.routeCategories.heavy++;
      } else {
        analysis.routeCategories.normal++;
      }
      
      // Track largest routes
      if (route.size > 50 * 1024) { // > 50KB
        analysis.largestRoutes.push({ name: route.name, size: route.size });
      }
    });
    
    // Sort largest routes by size
    analysis.largestRoutes.sort((a, b) => b.size - a.size);
    
    return analysis;
  },
  
  // Optimize route loading
  optimizeRouteLoading: (routes: any[]) => {
    const optimized = {
      critical: [] as any[],
      important: [] as any[],
      normal: [] as any[],
      heavy: [] as any[],
    };
    
    routes.forEach(route => {
      if (routeLazyLoadingConfig.critical.includes(route.name)) {
        optimized.critical.push(route);
      } else if (routeLazyLoadingConfig.important.includes(route.name)) {
        optimized.important.push(route);
      } else if (routeLazyLoadingConfig.heavy.includes(route.name)) {
        optimized.heavy.push(route);
      } else {
        optimized.normal.push(route);
      }
    });
    
    return optimized;
  },
  
  // Generate route loading strategy
  generateRouteLoadingStrategy: (routes: any[]) => {
    const strategy = {
      immediate: [] as string[],
      preload: [] as string[],
      prefetch: [] as string[],
      lazy: [] as string[],
    };
    
    routes.forEach(route => {
      if (routeLazyLoadingConfig.critical.includes(route.name)) {
        strategy.immediate.push(route.name);
      } else if (routeLazyLoadingConfig.important.includes(route.name)) {
        strategy.preload.push(route.name);
      } else if (routeLazyLoadingConfig.heavy.includes(route.name)) {
        strategy.lazy.push(route.name);
      } else {
        strategy.prefetch.push(route.name);
      }
    });
    
    return strategy;
  },
};

export default {
  routeLazyLoadingConfig,
  routeLoadingStrategy,
  routeLazyLoader,
  routePerformanceMonitor,
  routeOptimizer,
};
