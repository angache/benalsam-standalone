import React, { useState, useEffect } from 'react';
import { usePerformanceMonitoring } from '@/utils/performance';

interface PerformanceMonitorProps {
  showDetails?: boolean;
  className?: string;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  showDetails = false, 
  className = '' 
}) => {
  const { metrics, isGood, score } = usePerformanceMonitoring();
  const [isVisible, setIsVisible] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  useEffect(() => {
    // Show monitor after 3 seconds
    const timer = setTimeout(() => setIsVisible(true), 3000);
    
    // Force update every 2 seconds to show latest metrics
    const updateTimer = setInterval(() => {
      setForceUpdate(prev => prev + 1);
    }, 2000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(updateTimer);
    };
  }, []);

  if (!isVisible) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '🟢';
    if (score >= 70) return '🟡';
    return '🔴';
  };

  const formatMetric = (value: number | null, unit: string = 'ms') => {
    if (value === null) return 'N/A';
    return `${value}${unit}`;
  };

  const getMetricColor = (name: string, value: number | null) => {
    if (value === null) return 'text-gray-500';
    
    const thresholds = {
      LCP: { good: 2500, needsImprovement: 4000 },
      INP: { good: 200, needsImprovement: 500 },
      CLS: { good: 0.1, needsImprovement: 0.25 },
      FCP: { good: 1800, needsImprovement: 3000 },
      TTFB: { good: 800, needsImprovement: 1800 },
    };
    
    const threshold = thresholds[name as keyof typeof thresholds];
    if (!threshold) return 'text-gray-700';
    
    if (value <= threshold.good) return 'text-green-600';
    if (value <= threshold.needsImprovement) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            📊 Performance Monitor
          </h3>
          <div className={`text-lg font-bold ${getScoreColor(score)}`}>
            {getScoreEmoji(score)} {score}
          </div>
        </div>

        {showDetails && (
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">LCP:</span>
              <span className={getMetricColor('LCP', metrics.LCP)}>
                {formatMetric(metrics.LCP)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">INP:</span>
              <span className={getMetricColor('INP', metrics.INP)}>
                {formatMetric(metrics.INP)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">CLS:</span>
              <span className={getMetricColor('CLS', metrics.CLS)}>
                {formatMetric(metrics.CLS, '')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">FCP:</span>
              <span className={getMetricColor('FCP', metrics.FCP)}>
                {formatMetric(metrics.FCP)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">TTFB:</span>
              <span className={getMetricColor('TTFB', metrics.TTFB)}>
                {formatMetric(metrics.TTFB)}
              </span>
            </div>
          </div>
        )}

        <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">Status:</span>
            <span className={isGood ? 'text-green-600' : 'text-red-600'}>
              {isGood ? '🟢 Good' : '🔴 Needs Improvement'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
