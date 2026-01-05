import { useEffect, useCallback } from 'react';
import { logger } from '@/utils/production-logger';

// Performance monitoring hook
export const usePerformance = () => {
  // Track Core Web Vitals
  const trackCoreWebVitals = useCallback(() => {
    if ('PerformanceObserver' in window) {
      const observers = [];
      
      // LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        if (lastEntry) {
          const lcp = lastEntry.startTime;
          logger.debug('[usePerformance] LCP', { lcp: `${lcp}ms` });
          
          // Send to analytics
          if (window.gtag) {
            window.gtag('event', 'core_web_vital', {
              event_category: 'Web Vitals',
              event_label: 'LCP',
              value: Math.round(lcp),
              non_interaction: true,
            });
          }
        }
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        observers.push(lcpObserver);
      } catch (e) {
        logger.warn('[usePerformance] LCP observer failed', { error: e });
      }

      // FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fid = entry.processingStart - entry.startTime;
          logger.debug('[usePerformance] FID', { fid: `${fid}ms` });
          
          if (window.gtag) {
            window.gtag('event', 'core_web_vital', {
              event_category: 'Web Vitals',
              event_label: 'FID',
              value: Math.round(fid),
              non_interaction: true,
            });
          }
        });
      });
      
      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
        observers.push(fidObserver);
      } catch (e) {
        logger.warn('[usePerformance] FID observer failed', { error: e });
      }

      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            logger.debug('[usePerformance] CLS', { clsValue });
            
            if (window.gtag) {
              window.gtag('event', 'core_web_vital', {
                event_category: 'Web Vitals',
                event_label: 'CLS',
                value: Math.round(clsValue * 1000) / 1000,
                non_interaction: true,
              });
            }
          }
        });
      });
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        observers.push(clsObserver);
      } catch (e) {
        logger.warn('[usePerformance] CLS observer failed', { error: e });
      }
      
      // Return cleanup function
      return () => {
        observers.forEach(observer => {
          try {
            observer.disconnect();
          } catch (e) {
            logger.warn('[usePerformance] Error disconnecting observer', { error: e });
          }
        });
      };
    }
    return () => {}; // No-op cleanup if PerformanceObserver not available
  }, []);

  // Track page load performance
  const trackPageLoad = useCallback(() => {
    if ('performance' in window) {
      const handleLoad = () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0];
          if (navigation) {
            const metrics = {
              dns: navigation.domainLookupEnd - navigation.domainLookupStart,
              tcp: navigation.connectEnd - navigation.connectStart,
              ttfb: navigation.responseStart - navigation.requestStart,
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
              loadComplete: navigation.loadEventEnd - navigation.navigationStart,
            };

            logger.debug('[usePerformance] Page Load Metrics', { metrics });
            
            // Send to analytics
            if (window.gtag) {
              Object.entries(metrics).forEach(([key, value]) => {
                window.gtag('event', 'timing_complete', {
                  name: key,
                  value: Math.round(value),
                  event_category: 'Performance',
                });
              });
            }
          }
        }, 0);
      };
      
      window.addEventListener('load', handleLoad);
      
      // Return cleanup function
      return () => {
        window.removeEventListener('load', handleLoad);
      };
    }
    return () => {}; // No-op cleanup if performance API not available
  }, []);

  // Track resource loading performance
  const trackResourceTiming = useCallback(() => {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          // Track slow resources (> 1 second)
          if (entry.duration > 1000) {
            logger.debug('[usePerformance] Slow Resource', { name: entry.name, duration: `${entry.duration}ms` });
            
            if (window.gtag) {
              window.gtag('event', 'slow_resource', {
                event_category: 'Performance',
                event_label: entry.name,
                value: Math.round(entry.duration),
                non_interaction: true,
              });
            }
          }
        });
      });
      
      try {
        resourceObserver.observe({ entryTypes: ['resource'] });
        // Return cleanup function
        return () => {
          try {
            resourceObserver.disconnect();
          } catch (e) {
            logger.warn('[usePerformance] Error disconnecting resource observer', { error: e });
          }
        };
      } catch (e) {
        logger.warn('[usePerformance] Resource observer failed', { error: e });
        return () => {}; // No-op cleanup on error
      }
    }
    return () => {}; // No-op cleanup if PerformanceObserver not available
  }, []);

  // Track memory usage (if available)
  const trackMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const interval = setInterval(() => {
        const memory = performance.memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
        
        logger.debug('[usePerformance] Memory Usage', { usedMB: `${usedMB}MB`, totalMB: `${totalMB}MB` });
        
        // Alert if memory usage is high
        if (usedMB > 100) {
          logger.warn('[usePerformance] High memory usage detected', { usedMB: `${usedMB}MB` });
        }
      }, 30000); // Check every 30 seconds
      
      // Return cleanup function
      return () => clearInterval(interval);
    }
    return () => {}; // No-op cleanup if memory API not available
  }, []);

  useEffect(() => {
    // Start tracking and get cleanup functions
    const cleanupCoreWebVitals = trackCoreWebVitals();
    const cleanupPageLoad = trackPageLoad();
    const cleanupResourceTiming = trackResourceTiming();
    const cleanupMemoryUsage = trackMemoryUsage();
    
    // Return combined cleanup function
    return () => {
      if (cleanupCoreWebVitals) cleanupCoreWebVitals();
      if (cleanupPageLoad) cleanupPageLoad();
      if (cleanupResourceTiming) cleanupResourceTiming();
      if (cleanupMemoryUsage) cleanupMemoryUsage();
    };
  }, [trackCoreWebVitals, trackPageLoad, trackResourceTiming, trackMemoryUsage]);

  return {
    trackCoreWebVitals,
    trackPageLoad,
    trackResourceTiming,
    trackMemoryUsage,
  };
};

export default usePerformance;
