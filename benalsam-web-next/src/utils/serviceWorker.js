// Service Worker Registration
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      console.log('Service Worker registered successfully:', registration);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            showUpdateNotification();
          }
        });
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
};

// Show update notification
const showUpdateNotification = () => {
  if (confirm('Yeni bir güncelleme mevcut. Şimdi yenilemek istiyor musunuz?')) {
    window.location.reload();
  }
};

// Unregister service worker
export const unregisterServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.unregister();
      console.log('Service Worker unregistered');
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
    }
  }
};

// Check if service worker is supported
export const isServiceWorkerSupported = () => {
  return 'serviceWorker' in navigator;
};

// Get service worker registration
export const getServiceWorkerRegistration = async () => {
  if ('serviceWorker' in navigator) {
    try {
      return await navigator.serviceWorker.ready;
    } catch (error) {
      console.error('Failed to get service worker registration:', error);
      return null;
    }
  }
  return null;
};

// Clear all caches
export const clearAllCaches = async () => {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('All caches cleared');
    } catch (error) {
      console.error('Failed to clear caches:', error);
    }
  }
};

// Cache management utilities
export const cacheManager = {
  // Add to cache
  async addToCache(cacheName, request, response) {
    if ('caches' in window) {
      try {
        const cache = await caches.open(cacheName);
        await cache.put(request, response);
        return true;
      } catch (error) {
        console.error('Failed to add to cache:', error);
        return false;
      }
    }
    return false;
  },

  // Get from cache
  async getFromCache(request) {
    if ('caches' in window) {
      try {
        return await caches.match(request);
      } catch (error) {
        console.error('Failed to get from cache:', error);
        return null;
      }
    }
    return null;
  },

  // Delete from cache
  async deleteFromCache(request) {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => 
            caches.open(cacheName).then(cache => cache.delete(request))
          )
        );
        return true;
      } catch (error) {
        console.error('Failed to delete from cache:', error);
        return false;
      }
    }
    return false;
  }
};
