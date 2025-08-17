import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

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
      console.log(`🚀 Navigation to ${location.pathname}: ${navigationTime.toFixed(2)}ms`);
      
      // Track first load vs subsequent navigations
      if (isFirstLoad.current) {
        console.log('📊 First page load completed');
        isFirstLoad.current = false;
      } else {
        console.log('📊 Client-side navigation completed');
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
        console.log('📦 Chunks loaded:', jsChunks.map(chunk => ({
          name: chunk.name.split('/').pop(),
          duration: chunk.duration.toFixed(2) + 'ms',
          size: chunk.transferSize ? (chunk.transferSize / 1024).toFixed(2) + 'KB' : 'unknown'
        })));
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
        console.log(`🎯 Initial page load: ${loadTime.toFixed(2)}ms`);
      });
    }
  }, []);
};

// Utility to measure component load time
export const useComponentLoadTime = (componentName) => {
  const startTime = useRef(performance.now());
  
  useEffect(() => {
    const loadTime = performance.now() - startTime.current;
    console.log(`⚡ ${componentName} loaded in: ${loadTime.toFixed(2)}ms`);
  }, [componentName]);
};

// Utility to measure chunk load time
export const measureChunkLoad = (chunkName) => {
  const startTime = performance.now();
  
  return () => {
    const loadTime = performance.now() - startTime;
    console.log(`📦 ${chunkName} chunk loaded in: ${loadTime.toFixed(2)}ms`);
  };
}; 