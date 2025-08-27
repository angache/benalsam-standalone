// ===========================
// USE PERFORMANCE MONITORING HOOK
// ===========================

import React from 'react';
import { PerformanceHookResult } from '../types';
import metricsService from '../services/MetricsService';
import metricsCollector from '../utils/metricsCollector';

export const usePerformanceMonitoring = (): PerformanceHookResult => {
  const [state, setState] = React.useState(metricsService.getState());

  React.useEffect(() => {
    // Subscribe to metrics service updates
    const unsubscribe = metricsService.subscribe((newState) => {
      setState(newState);
    });

    // Initialize metrics collection if not already done
    if (!metricsCollector.getStatus().enabled) {
      metricsCollector.initialize();
    }

    // Set up Core Web Vitals collection
    metricsCollector.onLCP((metric) => {
      metricsService.collectMetric(metric);
    });

    metricsCollector.onFCP((metric) => {
      metricsService.collectMetric(metric);
    });

    metricsCollector.onCLS((metric) => {
      metricsService.collectMetric(metric);
    });

    metricsCollector.onTTFB((metric) => {
      metricsService.collectMetric(metric);
    });

    metricsCollector.onINP((metric) => {
      metricsService.collectMetric(metric);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  // Update metrics when they change (with reduced frequency)
  React.useEffect(() => {
    const updateMetrics = () => {
      // Check for manual CLS value
      const manualCLS = metricsService.getManualCLS();
      const currentMetrics = metricsService.getMetrics();
      
      // If manual CLS is set and different from current CLS
      if (manualCLS > 0 && currentMetrics.CLS !== manualCLS) {
        metricsService.setManualCLS(manualCLS);
      }
    };

    // Update immediately
    updateMetrics();

    // Set up interval to check for updates (reduced frequency)
    const interval = setInterval(updateMetrics, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Reset function
  const reset = React.useCallback(() => {
    metricsService.reset();
  }, []);

  // Force send function
  const forceSend = React.useCallback((route?: string) => {
    const targetRoute = route || window.location.pathname;
    metricsService.forceSend(targetRoute);
  }, []);

  return {
    metrics: state.metrics,
    score: state.score,
    isGood: state.isGood,
    isComplete: state.isComplete,
    hasEnoughData: state.hasEnoughData,
    reset,
    forceSend,
  };
};

// Hook for manual performance tracking
export const useManualPerformanceTracking = () => {
  const [isTracking, setIsTracking] = React.useState(false);
  const [trackedMetrics, setTrackedMetrics] = React.useState<any>({});

  const startTracking = React.useCallback(() => {
    setIsTracking(true);
    setTrackedMetrics({});
    console.log('📊 Manual performance tracking started');
  }, []);

  const stopTracking = React.useCallback(() => {
    setIsTracking(false);
    console.log('📊 Manual performance tracking stopped');
  }, []);

  const trackMetric = React.useCallback((name: string, value: number) => {
    if (isTracking) {
      setTrackedMetrics(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  }, [isTracking]);

  const getTrackedMetrics = React.useCallback(() => {
    return trackedMetrics;
  }, [trackedMetrics]);

  return {
    isTracking,
    trackedMetrics,
    startTracking,
    stopTracking,
    trackMetric,
    getTrackedMetrics,
  };
};

// Hook for performance insights
export const usePerformanceInsights = () => {
  const [insights, setInsights] = React.useState<string[]>([]);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);

  React.useEffect(() => {
    const updateInsights = () => {
      const currentInsights = metricsService.getPerformanceInsights();
      const currentSuggestions = metricsService.getOptimizationSuggestions();
      
      setInsights(currentInsights);
      setSuggestions(currentSuggestions);
    };

    // Update immediately
    updateInsights();

    // Update when metrics change
    const unsubscribe = metricsService.subscribe(() => {
      updateInsights();
    });

    return unsubscribe;
  }, []);

  return {
    insights,
    suggestions,
  };
};

// Hook for service status
export const useServiceStatus = () => {
  const [status, setStatus] = React.useState(metricsService.getServiceStatus());

  React.useEffect(() => {
    const updateStatus = () => {
      setStatus(metricsService.getServiceStatus());
    };

    // Update immediately
    updateStatus();

    // Update periodically
    const interval = setInterval(updateStatus, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return status;
};

// Hook for performance trends
export const usePerformanceTrends = (historySize: number = 10) => {
  const [trends, setTrends] = React.useState<{
    scores: number[];
    trend: 'improving' | 'declining' | 'stable';
    average: number;
  }>({
    scores: [],
    trend: 'stable',
    average: 0,
  });

  React.useEffect(() => {
    const updateTrends = () => {
      const currentScore = metricsService.calculateScore();
      
      setTrends(prev => {
        const newScores = [...prev.scores, currentScore].slice(-historySize);
        const average = newScores.reduce((sum, score) => sum + score, 0) / newScores.length;
        
        // Calculate trend
        let trend: 'improving' | 'declining' | 'stable' = 'stable';
        if (newScores.length >= 3) {
          const recent = newScores.slice(-3);
          const previous = newScores.slice(-6, -3);
          
          if (previous.length >= 3) {
            const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
            const previousAvg = previous.reduce((sum, score) => sum + score, 0) / previous.length;
            
            if (recentAvg > previousAvg + 5) trend = 'improving';
            else if (recentAvg < previousAvg - 5) trend = 'declining';
          }
        }
        
        return {
          scores: newScores,
          trend,
          average: Math.round(average),
        };
      });
    };

    // Update when metrics change
    const unsubscribe = metricsService.subscribe(() => {
      updateTrends();
    });

    return unsubscribe;
  }, [historySize]);

  return trends;
};
