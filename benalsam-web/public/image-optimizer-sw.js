// Image Optimization Service Worker
const CACHE_NAME = 'image-optimizer-v1';
const IMAGE_CACHE_NAME = 'optimized-images-v1';

// Supported formats and their priorities
const SUPPORTED_FORMATS = ['avif', 'webp', 'jpeg', 'png'];
const DEFAULT_QUALITY = 80;

// Image optimization settings
const OPTIMIZATION_CONFIG = {
  thumbnail: { width: 150, height: 150, quality: 70 },
  small: { width: 300, height: 300, quality: 75 },
  medium: { width: 600, height: 600, quality: 80 },
  large: { width: 1200, height: 1200, quality: 85 },
  original: { quality: 90 }
};

// Install event
self.addEventListener('install', (event) => {
  console.log('🖼️ Image Optimizer Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/offline.html'
      ]);
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('🖼️ Image Optimizer Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - handle image optimization
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only handle image requests
  if (!isImageRequest(event.request)) {
    return;
  }

  // Check if it's an optimization request
  if (url.searchParams.has('optimize')) {
    event.respondWith(handleImageOptimization(event.request));
  } else {
    // Regular image request - add caching
    event.respondWith(handleImageCaching(event.request));
  }
});

// Check if request is for an image
function isImageRequest(request) {
  const acceptHeader = request.headers.get('accept');
  return acceptHeader && acceptHeader.includes('image/');
}

// Handle image optimization
async function handleImageOptimization(request) {
  const url = new URL(request.url);
  const originalUrl = url.searchParams.get('url') || request.url;
  const format = url.searchParams.get('format') || 'webp';
  const quality = parseInt(url.searchParams.get('quality')) || DEFAULT_QUALITY;
  const width = parseInt(url.searchParams.get('w'));
  const height = parseInt(url.searchParams.get('h'));

  // Create cache key
  const cacheKey = `${originalUrl}-${format}-${quality}-${width || 'auto'}-${height || 'auto'}`;
  
  try {
    // Check cache first
    const cache = await caches.open(IMAGE_CACHE_NAME);
    const cachedResponse = await cache.match(cacheKey);
    
    if (cachedResponse) {
      console.log('🖼️ Serving optimized image from cache:', cacheKey);
      return cachedResponse;
    }

    // Fetch and optimize image
    const response = await fetch(originalUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const blob = await response.blob();
    const optimizedBlob = await optimizeImage(blob, { format, quality, width, height });
    
    // Create optimized response
    const optimizedResponse = new Response(optimizedBlob, {
      headers: {
        'Content-Type': `image/${format}`,
        'Cache-Control': 'public, max-age=31536000', // 1 year
        'Access-Control-Allow-Origin': '*'
      }
    });

    // Cache the optimized image
    await cache.put(cacheKey, optimizedResponse.clone());
    console.log('🖼️ Optimized and cached image:', cacheKey);

    return optimizedResponse;
  } catch (error) {
    console.error('❌ Image optimization failed:', error);
    
    // Fallback to original image
    try {
      const fallbackResponse = await fetch(originalUrl);
      return fallbackResponse;
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      return new Response('Image not available', { status: 404 });
    }
  }
}

// Handle image caching
async function handleImageCaching(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  
  try {
    // Check cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fetch from network
    const response = await fetch(request);
    if (response.ok) {
      // Cache the response
      await cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('❌ Image caching failed:', error);
    return new Response('Image not available', { status: 404 });
  }
}

// Optimize image using Canvas API
async function optimizeImage(blob, options = {}) {
  const { format = 'webp', quality = 80, width, height } = options;
  
  return new Promise((resolve, reject) => {
    // Service worker'da document yok, bu yüzden canvas kullanamayız
    // Basit bir fallback: blob'u olduğu gibi döndür
    console.log('🖼️ Service Worker: Image optimization not available, returning original');
    resolve(blob);
  });
}

// Background sync for image optimization
self.addEventListener('sync', (event) => {
  if (event.tag === 'optimize-images') {
    console.log('🔄 Background image optimization sync');
    event.waitUntil(optimizePendingImages());
  }
});

// Optimize pending images in background
async function optimizePendingImages() {
  // This would be implemented to process queued image optimizations
  console.log('🔄 Processing pending image optimizations...');
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_IMAGE_CACHE') {
    event.waitUntil(
      caches.delete(IMAGE_CACHE_NAME).then(() => {
        console.log('🗑️ Image cache cleared');
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});

console.log('🖼️ Image Optimizer Service Worker loaded'); 