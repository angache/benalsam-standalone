import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';
import useAIPerformanceAnalysis from './useAIPerformanceAnalysis.js';
import { logger } from '@/utils/production-logger';

const useRoutePerformance = () => {
  const location = useLocation();
  const routeStartTime = useRef(Date.now());
  const routeMetrics = useRef({});
  const { addAnalysis } = useAIPerformanceAnalysis();

  useEffect(() => {
    // Route değiştiğinde yeni ölçüm başlat
    routeStartTime.current = Date.now();
    routeMetrics.current = {};

      // Route-specific performance tracking
  const trackRoutePerformance = () => {
    const routePath = location.pathname;
    const routeDuration = Date.now() - routeStartTime.current;

    // Route performance data
    const routeData = {
      path: routePath,
      timestamp: new Date().toISOString(),
      duration: routeDuration,
      metrics: routeMetrics.current
    };

    // Console'da göster (sadece debug modunda)
    const debugMode = process.env.NODE_ENV === 'development' && false; // Disabled by default
    if (debugMode) {
      console.group(`📊 Route Performance: ${routePath}`);
      logger.debug('[useRoutePerformance] Route Duration', { duration: `${routeDuration}ms` });
      logger.debug('[useRoutePerformance] Route Metrics', { metrics: routeMetrics.current });
      logger.debug('[useRoutePerformance] Route Type', { type: getRouteType(routePath) });
      console.groupEnd();
    }

    // AI Analysis'i çalıştır
    if (Object.keys(routeMetrics.current).length > 0) {
      addAnalysis(routeMetrics.current, routePath, routeDuration).catch(error => {
        logger.error('[useRoutePerformance] AI Analysis failed', { error });
      });
    }

    // TODO: Backend'e gönder
    // sendRoutePerformanceData(routeData);
  };

  // Route tipini belirle
  const getRouteType = (path) => {
    if (path === '/') return 'Home';
    if (path.startsWith('/profil/')) return 'Profile';
    if (path.startsWith('/ilan/')) return 'Listing Detail';
    if (path.startsWith('/ayarlar')) return 'Settings';
    if (path.startsWith('/mesajlar')) return 'Messages';
    if (path.startsWith('/envanter')) return 'Inventory';
    if (path.startsWith('/ilanlarim')) return 'My Listings';
    if (path.startsWith('/favorilerim')) return 'Favorites';
    if (path.startsWith('/takip-edilenler')) return 'Following';
    if (path.startsWith('/gonderdigim-teklifler')) return 'Sent Offers';
    if (path.startsWith('/aldigim-teklifler')) return 'Received Offers';
    if (path.startsWith('/premium')) return 'Premium';
    if (path.startsWith('/auth')) return 'Authentication';
    return 'Other';
  };

    // Route değişiminden 2 saniye sonra ölçümü tamamla
    const timeoutId = setTimeout(trackRoutePerformance, 2000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [location.pathname]);

  // Core Web Vitals'ı route-specific olarak yakala
  useEffect(() => {
    const routePath = location.pathname;

    const handleMetric = (metric) => {
      routeMetrics.current[metric.name] = {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta
      };

      // Only log in debug mode
      const debugMode = process.env.NODE_ENV === 'development' && false; // Disabled by default
      if (debugMode) {
        logger.debug('[useRoutePerformance] Metric', { metric: metric.name, routePath, value: `${metric.value}ms`, rating: metric.rating });
      }
    };

    // Route-specific metric listeners (reduced frequency)
    const unsubscribeLCP = onLCP(handleMetric);
    const unsubscribeINP = onINP(handleMetric);
    const unsubscribeCLS = onCLS(handleMetric);
    const unsubscribeFCP = onFCP(handleMetric);
    const unsubscribeTTFB = onTTFB(handleMetric);

    return () => {
      // Safe cleanup - check if functions exist before calling
      if (typeof unsubscribeLCP === 'function') unsubscribeLCP();
      if (typeof unsubscribeINP === 'function') unsubscribeINP();
      if (typeof unsubscribeCLS === 'function') unsubscribeCLS();
      if (typeof unsubscribeFCP === 'function') unsubscribeFCP();
      if (typeof unsubscribeTTFB === 'function') unsubscribeTTFB();
    };
  }, [location.pathname]);

  return {
    currentRoute: location.pathname,
    routeStartTime: routeStartTime.current,
    routeMetrics: routeMetrics.current
  };
};

export default useRoutePerformance;
