import { useEffect, useRef, useCallback } from 'react';
import { apiService } from '../services/api';

export interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  mountTime: number;
  pageLoadTime: number;
  userInteractions: UserInteraction[];
  memoryUsage?: number;
  bundleSize?: number;
}

export interface UserInteraction {
  type: 'click' | 'scroll' | 'input' | 'navigation';
  target: string;
  timestamp: number;
  duration?: number;
}

export interface PerformanceData {
  url: string;
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  firstInputDelay?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private interactions: UserInteraction[] = [];
  private startTime: number = 0;
  private isMonitoring: boolean = false;

  startMonitoring(componentName: string) {
    this.startTime = performance.now();
    this.isMonitoring = true;
    
    // Page load metrics
    this.capturePageLoadMetrics();
    
    // User interaction tracking
    this.setupInteractionTracking();
    
    console.log(`🔍 Performance monitoring started for: ${componentName}`);
  }

  stopMonitoring(componentName: string): PerformanceMetrics {
    if (!this.isMonitoring) {
      throw new Error('Performance monitoring not started');
    }

    const endTime = performance.now();
    const renderTime = endTime - this.startTime;
    
    const metrics: PerformanceMetrics = {
      componentName,
      renderTime,
      mountTime: renderTime,
      pageLoadTime: this.getPageLoadTime(),
      userInteractions: [...this.interactions],
      memoryUsage: this.getMemoryUsage(),
      bundleSize: this.getBundleSize()
    };

    this.metrics.push(metrics);
    this.isMonitoring = false;
    this.interactions = [];
    
    console.log(`✅ Performance monitoring completed for: ${componentName}`, metrics);
    
    // Send metrics to backend
    this.sendMetricsToBackend(metrics);
    
    return metrics;
  }

  private capturePageLoadMetrics() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      const pageLoadData: PerformanceData = {
        url: window.location.href,
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
        largestContentfulPaint: this.getLargestContentfulPaint(),
        cumulativeLayoutShift: this.getCumulativeLayoutShift(),
        firstInputDelay: this.getFirstInputDelay()
      };

      console.log('📊 Page load metrics:', pageLoadData);
    }
  }

  private getPageLoadTime(): number {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return navigation.loadEventEnd - navigation.loadEventStart;
    }
    return 0;
  }

  private getMemoryUsage(): number | undefined {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return undefined;
  }

  private getBundleSize(): number | undefined {
    // This would need to be calculated during build time
    // For now, return undefined
    return undefined;
  }

  private getLargestContentfulPaint(): number | undefined {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry?.startTime);
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      }) as any;
    }
    return undefined;
  }

  private getCumulativeLayoutShift(): number | undefined {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      return new Promise((resolve) => {
        let cls = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          }
          resolve(cls);
        });
        observer.observe({ entryTypes: ['layout-shift'] });
      }) as any;
    }
    return undefined;
  }

  private getFirstInputDelay(): number | undefined {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            resolve((entry as any).processingStart - (entry as any).startTime);
            break;
          }
        });
        observer.observe({ entryTypes: ['first-input'] });
      }) as any;
    }
    return undefined;
  }

  private setupInteractionTracking() {
    if (typeof window === 'undefined') return;

    const trackInteraction = (type: UserInteraction['type'], target: string, duration?: number) => {
      this.interactions.push({
        type,
        target,
        timestamp: Date.now(),
        duration
      });
    };

    // Click tracking
    document.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).tagName + (e.target as HTMLElement).className;
      trackInteraction('click', target);
    });

    // Scroll tracking
    let scrollTimeout: NodeJS.Timeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        trackInteraction('scroll', 'document');
      }, 100);
    });

    // Input tracking
    document.addEventListener('input', (e) => {
      const target = (e.target as HTMLElement).tagName + (e.target as HTMLElement).className;
      trackInteraction('input', target);
    });
  }

  private async sendMetricsToBackend(metrics: PerformanceMetrics) {
    try {
      await apiService.trackFrontendMetrics({
        componentName: metrics.componentName,
        renderTime: metrics.renderTime,
        mountTime: metrics.mountTime,
        pageLoadTime: metrics.pageLoadTime,
        userInteractions: metrics.userInteractions,
        memoryUsage: metrics.memoryUsage,
        bundleSize: metrics.bundleSize,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to send performance metrics to backend:', error);
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  clearMetrics() {
    this.metrics = [];
    this.interactions = [];
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

export const usePerformanceMonitoring = (componentName: string) => {
  const isMonitoring = useRef(false);

  const startMonitoring = useCallback(() => {
    if (!isMonitoring.current) {
      performanceMonitor.startMonitoring(componentName);
      isMonitoring.current = true;
    }
  }, [componentName]);

  const stopMonitoring = useCallback(() => {
    if (isMonitoring.current) {
      const metrics = performanceMonitor.stopMonitoring(componentName);
      isMonitoring.current = false;
      return metrics;
    }
    return null;
  }, [componentName]);

  useEffect(() => {
    startMonitoring();
    
    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  return {
    startMonitoring,
    stopMonitoring,
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    clearMetrics: performanceMonitor.clearMetrics.bind(performanceMonitor)
  };
};

export default performanceMonitor; 