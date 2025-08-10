import React, { useState, useEffect } from 'react';
import { Settings, Trash2, RefreshCw, Download, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useImageServiceWorker } from '@/hooks/useImageServiceWorker';
import { useImageFormat } from '@/hooks/useImageOptimization';

const ImageOptimizationDebug = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [cacheInfo, setCacheInfo] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [imageStats, setImageStats] = useState({
    totalImages: 0,
    optimizedImages: 0,
    cachedImages: 0,
    averageLoadTime: 0
  });

  const {
    isSupported,
    isRegistered,
    isUpdating,
    clearImageCache,
    getCacheInfo,
    getOptimizedImageUrl
  } = useImageServiceWorker();

  const supportedFormats = useImageFormat();

  // Toggle visibility with Ctrl+Shift+I
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        setIsVisible(!isVisible);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  // Load cache info
  useEffect(() => {
    if (isVisible) {
      loadCacheInfo();
      loadPerformanceMetrics();
    }
  }, [isVisible]);

  const loadCacheInfo = async () => {
    const info = await getCacheInfo();
    setCacheInfo(info);
  };

  const loadPerformanceMetrics = () => {
    // Get performance metrics from Performance API
    const navigation = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    const imageResources = resources.filter(r => r.initiatorType === 'img');

    const metrics = {
      pageLoadTime: navigation?.loadEventEnd - navigation?.loadEventStart || 0,
      domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart || 0,
      totalImages: imageResources.length,
      averageImageLoadTime: imageResources.length > 0 
        ? imageResources.reduce((sum, r) => sum + r.duration, 0) / imageResources.length 
        : 0,
      totalImageSize: imageResources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
    };

    setPerformanceMetrics(metrics);
    setImageStats({
      totalImages: metrics.totalImages,
      optimizedImages: imageResources.filter(r => r.name.includes('optimize')).length,
      cachedImages: imageResources.filter(r => r.transferSize === 0).length,
      averageLoadTime: metrics.averageImageLoadTime
    });
  };

  const handleClearCache = async () => {
    const success = await clearImageCache();
    if (success) {
      loadCacheInfo();
      loadPerformanceMetrics();
    }
  };

  const handleRefresh = () => {
    loadCacheInfo();
    loadPerformanceMetrics();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-y-auto">
      <Card className="bg-background/95 backdrop-blur-sm border-2 border-primary/20 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Image Optimization Debug
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-8 w-8 p-0"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Service Worker Status */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Service Worker Status</h4>
            <div className="flex items-center gap-2">
              <Badge variant={isSupported ? "default" : "destructive"}>
                {isSupported ? "Supported" : "Not Supported"}
              </Badge>
              <Badge variant={isRegistered ? "default" : "secondary"}>
                {isRegistered ? "Registered" : "Not Registered"}
              </Badge>
              {isUpdating && (
                <Badge variant="outline" className="animate-pulse">
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Updating
                </Badge>
              )}
            </div>
          </div>

          {/* Format Support */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Format Support</h4>
            <div className="flex gap-2">
              {Object.entries(supportedFormats).map(([format, supported]) => (
                <Badge key={format} variant={supported ? "default" : "secondary"}>
                  {format.toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>

          {/* Cache Info */}
          {cacheInfo && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Cache Info</h4>
              <div className="text-xs space-y-1">
                <p>Cache: {cacheInfo.name}</p>
                <p>Entries: {cacheInfo.size}</p>
                <p>Size: {(cacheInfo.size * 0.1).toFixed(1)} MB (estimated)</p>
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Performance</h4>
            <div className="text-xs space-y-1">
              <p>Page Load: {performanceMetrics.pageLoadTime?.toFixed(0)}ms</p>
              <p>DOM Ready: {performanceMetrics.domContentLoaded?.toFixed(0)}ms</p>
              <p>Total Images: {imageStats.totalImages}</p>
              <p>Optimized: {imageStats.optimizedImages}</p>
              <p>Cached: {imageStats.cachedImages}</p>
              <p>Avg Load Time: {imageStats.averageLoadTime?.toFixed(0)}ms</p>
              <p>Total Size: {(performanceMetrics.totalImageSize / 1024 / 1024).toFixed(2)}MB</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear Cache
            </Button>
          </div>

          {/* Info */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <div className="flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <div>
                <p>Press Ctrl+Shift+I to toggle</p>
                <p>Images are automatically optimized and cached</p>
                <p>Supported formats: AVIF → WebP → JPEG</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageOptimizationDebug; 