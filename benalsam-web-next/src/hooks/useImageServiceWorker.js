import { useEffect, useState, useCallback } from 'react';

export const useImageServiceWorker = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [registration, setRegistration] = useState(null);

  // Check if service workers are supported
  useEffect(() => {
    setIsSupported('serviceWorker' in navigator);
  }, []);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    // Service worker'ı geçici olarak devre dışı bırakıyoruz
    console.log('🖼️ Image Service Worker temporarily disabled');
    return false;
  }, []);

  // Unregister service worker
  const unregisterServiceWorker = useCallback(async () => {
    if (!registration) return false;

    try {
      await registration.unregister();
      setRegistration(null);
      setIsRegistered(false);
      console.log('🗑️ Image Service Worker unregistered');
      return true;
    } catch (error) {
      console.error('❌ Failed to unregister Image Service Worker:', error);
      return false;
    }
  }, [registration]);

  // Clear image cache
  const clearImageCache = useCallback(async () => {
    if (!registration || !registration.active) {
      console.warn('No active Image Service Worker');
      return false;
    }

    try {
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            console.log('🗑️ Image cache cleared successfully');
            resolve(true);
          } else {
            console.error('❌ Failed to clear image cache');
            resolve(false);
          }
        };

        registration.active.postMessage(
          { type: 'CLEAR_IMAGE_CACHE' },
          [messageChannel.port2]
        );
      });
    } catch (error) {
      console.error('❌ Error clearing image cache:', error);
      return false;
    }
  }, [registration]);

  // Get cache info
  const getCacheInfo = useCallback(async () => {
    if (!isSupported) return null;

    try {
      const cacheNames = await caches.keys();
      const imageCache = cacheNames.find(name => name.includes('image'));
      
      if (imageCache) {
        const cache = await caches.open(imageCache);
        const keys = await cache.keys();
        return {
          name: imageCache,
          size: keys.length,
          keys: keys.map(req => req.url)
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting cache info:', error);
      return null;
    }
  }, [isSupported]);

  // Optimize image URL
  const getOptimizedImageUrl = useCallback((originalUrl, options = {}) => {
    if (!isRegistered) return originalUrl;

    // Blob URL'leri için özel kontrol - parametre ekleme
    if (originalUrl.startsWith('blob:')) {
      return originalUrl;
    }

    const {
      format = 'webp',
      quality = 80,
      width,
      height,
      useServiceWorker = true
    } = options;

    if (!useServiceWorker) {
      // Fallback to URL parameters
      try {
        const url = new URL(originalUrl, window.location.origin);
        url.searchParams.set('format', format);
        url.searchParams.set('quality', quality.toString());
        if (width) url.searchParams.set('w', width.toString());
        if (height) url.searchParams.set('h', height.toString());
        return url.toString();
      } catch (error) {
        console.warn('URL parse error for image optimization:', error);
        return originalUrl;
      }
    }

    // Use service worker optimization
    try {
      const url = new URL('/image-optimizer-sw.js', window.location.origin);
      url.searchParams.set('optimize', 'true');
      url.searchParams.set('url', originalUrl);
      url.searchParams.set('format', format);
      url.searchParams.set('quality', quality.toString());
      if (width) url.searchParams.set('w', width.toString());
      if (height) url.searchParams.set('h', height.toString());
      
      return url.toString();
    } catch (error) {
      console.warn('URL parse error for service worker optimization:', error);
      return originalUrl;
    }
  }, [isRegistered]);

  // Preload images
  const preloadImages = useCallback(async (imageUrls, options = {}) => {
    if (!isRegistered) return;

    const { format = 'webp', quality = 80 } = options;
    
    try {
      // Blob URL'leri filtrele - bunlar preload edilemez
      const nonBlobUrls = imageUrls.filter(url => !url.startsWith('blob:'));
      const blobUrls = imageUrls.filter(url => url.startsWith('blob:'));
      
      if (blobUrls.length > 0) {
        console.log(`🖼️ Skipping ${blobUrls.length} blob URLs for preloading`);
      }
      
      const optimizedUrls = nonBlobUrls.map(url => 
        getOptimizedImageUrl(url, { format, quality })
      );

      // Preload optimized images
      const preloadPromises = optimizedUrls.map(url => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(url);
          img.onerror = () => resolve(null);
          img.src = url;
        });
      });

      const results = await Promise.allSettled(preloadPromises);
      const successful = results.filter(result => result.status === 'fulfilled' && result.value);
      
      console.log(`🖼️ Preloaded ${successful.length}/${nonBlobUrls.length} optimized images`);
      return successful.map(result => result.value);
    } catch (error) {
      console.error('❌ Error preloading images:', error);
      return [];
    }
  }, [isRegistered, getOptimizedImageUrl]);

  // Auto-register on mount
  useEffect(() => {
    if (isSupported && !isRegistered) {
      registerServiceWorker();
    }
  }, [isSupported, isRegistered, registerServiceWorker]);

  return {
    isSupported,
    isRegistered,
    isUpdating,
    registration,
    registerServiceWorker,
    unregisterServiceWorker,
    clearImageCache,
    getCacheInfo,
    getOptimizedImageUrl,
    preloadImages
  };
}; 