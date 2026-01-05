import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { logger } from '@/utils/production-logger';

export const usePerformanceMonitor = () => {
  const location = useLocation();
  const navigationStart = useRef(performance.now());
  const isFirstLoad = useRef(true);

  useEffect(() => {
    const navigationEnd = performance.now();
    const navigationTime = navigationEnd - navigationStart.current;
    
    // Only log in development and when performance monitoring is enabled
    const shouldLog = import.meta.env.DEV && false; // Disabled by default
    
    if (shouldLog) {
      logger.debug('[usePerformanceMonitor] Navigation', { pathname: location.pathname, time: `${navigationTime.toFixed(2)}ms` });
      
      // Track first load vs subsequent navigations
      if (isFirstLoad.current) {
        logger.debug('[usePerformanceMonitor] First page load completed');
        isFirstLoad.current = false;
      } else {
        logger.debug('[usePerformanceMonitor] Client-side navigation completed');
      }
    } else {
      // Just track first load status without logging
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
      }
    }
    
    // Update navigation start time for next navigation
    navigationStart.current = performance.now();
    
    // Track Core Web Vitals if available (silent)
    if ('web-vital' in window && shouldLog) {
      console.log('📈 Core Web Vitals tracking available');
    }
    
    // Track chunk loading performance
    const trackChunkPerformance = () => {
      const entries = performance.getEntriesByType('resource');
      const jsChunks = entries.filter(entry => 
        entry.name.includes('.js') && 
        entry.name.includes('chunk')
      );
      
      if (jsChunks.length > 0 && shouldLog) {
        logger.debug('[usePerformanceMonitor] Chunks loaded', { 
          chunks: jsChunks.map(chunk => ({
            name: chunk.name.split('/').pop(),
            duration: chunk.duration.toFixed(2) + 'ms',
            size: chunk.transferSize ? (chunk.transferSize / 1024).toFixed(2) + 'KB' : 'unknown'
          }))
        });
      }
    };
    
    // Wait a bit for chunks to load
    setTimeout(trackChunkPerformance, 100);
    
  }, [location.pathname]);
  
  // Track initial load performance
  useEffect(() => {
    if (document.readyState === 'complete') {
      const loadTime = performance.now();
      console.log(`🎯 Initial page load: ${loadTime.toFixed(2)}ms`);
    } else {
      window.addEventListener('load', () => {
        const loadTime = performance.now();
        logger.debug('[usePerformanceMonitor] Initial page load', { time: `${loadTime.toFixed(2)}ms` });
      });
    }
  }, []);
};

// Utility to measure component load time
export const useComponentLoadTime = (componentName) => {
  const startTime = useRef(performance.now());
  
  useEffect(() => {
    const loadTime = performance.now() - startTime.current;
    logger.debug('[usePerformanceMonitor] Component loaded', { componentName, time: `${loadTime.toFixed(2)}ms` });
  }, [componentName]);
};

// Utility to measure chunk load time
export const measureChunkLoad = (chunkName) => {
  const startTime = performance.now();
  
  return () => {
    const loadTime = performance.now() - startTime;
    logger.debug('[usePerformanceMonitor] Chunk loaded', { chunkName, time: `${loadTime.toFixed(2)}ms` });
  };
}; 