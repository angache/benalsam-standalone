import { useEffect, useCallback } from 'react';

// Performance monitoring hook
export const usePerformance = () => {
  // Track Core Web Vitals
  const trackCoreWebVitals = useCallback(() => {
    if ('PerformanceObserver' in window) {
      // LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        if (lastEntry) {
          const lcp = lastEntry.startTime;
          console.log('🚀 LCP:', lcp, 'ms');
          
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
      } catch (e) {
        console.warn('LCP observer failed:', e);
      }

      // FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fid = entry.processingStart - entry.startTime;
          console.log('⚡ FID:', fid, 'ms');
          
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
      } catch (e) {
        console.warn('FID observer failed:', e);
      }

      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            console.log('📐 CLS:', clsValue);
            
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
      } catch (e) {
        console.warn('CLS observer failed:', e);
      }
    }
  }, []);

  // Track page load performance
  const trackPageLoad = useCallback(() => {
    if ('performance' in window) {
      window.addEventListener('load', () => {
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

            console.log('📊 Page Load Metrics:', metrics);
            
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
      });
    }
  }, []);

  // Track resource loading performance
  const trackResourceTiming = useCallback(() => {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          // Track slow resources (> 1 second)
          if (entry.duration > 1000) {
            console.log('🐌 Slow Resource:', entry.name, entry.duration, 'ms');
            
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
      } catch (e) {
        console.warn('Resource observer failed:', e);
      }
    }
  }, []);

  // Track memory usage (if available)
  const trackMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
        
        console.log('💾 Memory Usage:', usedMB, 'MB /', totalMB, 'MB');
        
        // Alert if memory usage is high
        if (usedMB > 100) {
          console.warn('⚠️ High memory usage detected:', usedMB, 'MB');
        }
      }, 30000); // Check every 30 seconds
    }
  }, []);

  useEffect(() => {
    trackCoreWebVitals();
    trackPageLoad();
    trackResourceTiming();
    trackMemoryUsage();
  }, [trackCoreWebVitals, trackPageLoad, trackResourceTiming, trackMemoryUsage]);

  return {
    trackCoreWebVitals,
    trackPageLoad,
    trackResourceTiming,
    trackMemoryUsage,
  };
};

export default usePerformance;
