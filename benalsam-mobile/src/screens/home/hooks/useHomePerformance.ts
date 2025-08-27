// ===========================
// USE HOME PERFORMANCE HOOK
// ===========================

import { useState, useEffect, useRef, useCallback } from 'react';
import { performanceService } from '../../../services/performanceService';
import { HomePerformance, HomeAnalytics } from '../types';

const useHomePerformance = () => {
  const [performance, setPerformance] = useState<HomePerformance>({
    isLoading: false,
    isRefreshing: false,
    hasError: false,
    errorMessage: undefined,
    loadTime: 0,
    renderCount: 0
  });

  const [analytics, setAnalytics] = useState<HomeAnalytics>({
    screenViewTime: 0,
    interactions: {
      listingViews: 0,
      categoryClicks: 0,
      searchClicks: 0,
      createClicks: 0,
      bannerClicks: 0
    },
    performance: {
      loadTime: 0,
      renderTime: 0,
      memoryUsage: 0
    }
  });

  const startTimeRef = useRef<number>(0);
  const renderStartTimeRef = useRef<number>(0);
  const screenViewStartTimeRef = useRef<number>(0);

  // Start performance tracking
  const startPerformanceTracking = useCallback(() => {
    startTimeRef.current = performanceService.getCurrentTime();
    renderStartTimeRef.current = performanceService.getCurrentTime();
    screenViewStartTimeRef.current = performanceService.getCurrentTime();
    
    setPerformance(prev => ({
      ...prev,
      isLoading: true,
      loadTime: 0,
      renderCount: 0
    }));
  }, []);

  // End loading tracking
  const endLoadingTracking = useCallback(() => {
    const loadTime = performanceService.getCurrentTime() - startTimeRef.current;
    
    setPerformance(prev => ({
      ...prev,
      isLoading: false,
      loadTime
    }));

    setAnalytics(prev => ({
      ...prev,
      performance: {
        ...prev.performance,
        loadTime
      }
    }));

    // Track performance metrics
    performanceService.trackMetric('home_screen_load_time', loadTime);
  }, []);

  // Track render performance
  const trackRenderPerformance = useCallback(() => {
    const renderTime = performanceService.getCurrentTime() - renderStartTimeRef.current;
    
    setPerformance(prev => ({
      ...prev,
      renderCount: prev.renderCount + 1
    }));

    setAnalytics(prev => ({
      ...prev,
      performance: {
        ...prev.performance,
        renderTime
      }
    }));

    // Track render performance
    performanceService.trackMetric('home_screen_render_time', renderTime);
    
    // Reset render start time
    renderStartTimeRef.current = performanceService.getCurrentTime();
  }, []);

  // Track interaction
  const trackInteraction = useCallback((type: keyof HomeAnalytics['interactions']) => {
    setAnalytics(prev => ({
      ...prev,
      interactions: {
        ...prev.interactions,
        [type]: prev.interactions[type] + 1
      }
    }));

    // Track interaction analytics
    performanceService.trackEvent(`home_screen_${type}`, {
      timestamp: new Date().toISOString()
    });
  }, []);

  // Set error state
  const setError = useCallback((error: string) => {
    setPerformance(prev => ({
      ...prev,
      hasError: true,
      errorMessage: error
    }));

    // Track error
    performanceService.trackError('home_screen_error', {
      error,
      timestamp: new Date().toISOString()
    });
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setPerformance(prev => ({
      ...prev,
      hasError: false,
      errorMessage: undefined
    }));
  }, []);

  // Set refreshing state
  const setRefreshing = useCallback((isRefreshing: boolean) => {
    setPerformance(prev => ({
      ...prev,
      isRefreshing
    }));
  }, []);

  // Track screen view time
  useEffect(() => {
    const interval = setInterval(() => {
      const screenViewTime = performanceService.getCurrentTime() - screenViewStartTimeRef.current;
      
      setAnalytics(prev => ({
        ...prev,
        screenViewTime
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Track memory usage
  useEffect(() => {
    const interval = setInterval(() => {
      const memoryUsage = performanceService.getMemoryUsage();
      
      setAnalytics(prev => ({
        ...prev,
        performance: {
          ...prev.performance,
          memoryUsage
        }
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const totalViewTime = performanceService.getCurrentTime() - screenViewStartTimeRef.current;
      
      // Track final analytics
      performanceService.trackEvent('home_screen_exit', {
        totalViewTime,
        interactions: analytics.interactions,
        performance: analytics.performance,
        timestamp: new Date().toISOString()
      });
    };
  }, [analytics]);

  return {
    performance,
    analytics,
    startPerformanceTracking,
    endLoadingTracking,
    trackRenderPerformance,
    trackInteraction,
    setError,
    clearError,
    setRefreshing
  };
};

export default useHomePerformance;
