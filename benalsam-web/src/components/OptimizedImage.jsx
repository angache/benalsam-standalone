import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useImageServiceWorker } from '@/hooks/useImageServiceWorker';

// Image optimization utilities
const getImageFormat = () => {
  if (typeof window === 'undefined') return 'webp';
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  
  // Check AVIF support
  if (ctx && ctx.getImageData) {
    try {
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, 1, 1);
      const data = ctx.getImageData(0, 0, 1, 1).data;
      if (data[0] === 255) return 'avif';
    } catch (e) {
      // AVIF not supported
    }
  }
  
  // Check WebP support
  const webpTest = new Image();
  webpTest.onload = webpTest.onerror = () => {
    if (webpTest.width === 1) return 'webp';
  };
  webpTest.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAADsAD+JaQAA3AAAAAA';
  
  return 'jpeg';
};

const generateBlurHash = async (src) => {
  try {
    const response = await fetch(src);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 32;
    canvas.height = 32;
    
    ctx.drawImage(bitmap, 0, 0, 32, 32);
    const imageData = ctx.getImageData(0, 0, 32, 32);
    
    // Simple blur hash generation (simplified version)
    let hash = '';
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const avg = Math.round((r + g + b) / 3);
      hash += avg.toString(16).padStart(2, '0');
    }
    
    return hash.substring(0, 20); // Return first 20 chars
  } catch (error) {
    return 'L5H2EC=PM%V%$qj=Wg\`15#a$7{^';
  }
};

const OptimizedImage = ({
  src,
  alt,
  className,
  width,
  height,
  sizes,
  priority = false,
  quality = 80,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
  fallbackSrc,
  loading = 'lazy',
  useServiceWorker = true,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [blurHash, setBlurHash] = useState(blurDataURL);
  const [imageFormat, setImageFormat] = useState('webp');
  const [optimizedSrc, setOptimizedSrc] = useState(src);
  const imgRef = useRef(null);
  const observerRef = useRef(null);
  
  const { getOptimizedImageUrl, isRegistered } = useImageServiceWorker();

  // Initialize image format and optimized src
  useEffect(() => {
    setImageFormat(getImageFormat());
    setOptimizedSrc(getOptimizedSrc());
  }, [src, imageFormat, quality, width, height, isRegistered]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority]);

  // Generate blur hash if not provided
  useEffect(() => {
    if (isInView && !blurHash && placeholder === 'blur' && src) {
      generateBlurHash(src).then(setBlurHash);
    }
  }, [isInView, blurHash, placeholder, src]);

  // Generate optimized src
  const getOptimizedSrc = () => {
    if (!src) return '';
    
    // Blob URL'leri için özel kontrol - parametre ekleme
    if (src.startsWith('blob:')) {
      return src;
    }
    
    // If it's already an optimized URL (CDN), return as is
    if (src.includes('cdn') || src.includes('optimized')) {
      return src;
    }
    
    // Service worker devre dışı, sadece URL parametreleri kullan
    try {
      const url = new URL(src, window.location.origin);
      url.searchParams.set('format', imageFormat);
      url.searchParams.set('quality', quality.toString());
      if (width) url.searchParams.set('w', width.toString());
      if (height) url.searchParams.set('h', height.toString());
      
      return url.toString();
    } catch (error) {
      // URL parse hatası durumunda orijinal src'yi döndür
      console.warn('URL parse error for image optimization:', error);
      return src;
    }
  };

  // Generate srcSet for responsive images
  const getSrcSet = () => {
    if (!src || !sizes) return '';
    
    // Blob URL'leri için srcSet desteklenmez
    if (src.startsWith('blob:')) {
      return '';
    }
    
    const breakpoints = [
      { width: 320, suffix: 'xs' },
      { width: 640, suffix: 'sm' },
      { width: 768, suffix: 'md' },
      { width: 1024, suffix: 'lg' },
      { width: 1280, suffix: 'xl' },
      { width: 1536, suffix: '2xl' }
    ];
    
    return breakpoints
      .map(({ width, suffix }) => {
        try {
          const optimizedSrc = getOptimizedSrc();
          const url = new URL(optimizedSrc);
          url.searchParams.set('w', width.toString());
          return `${url.toString()} ${width}w`;
        } catch (error) {
          console.warn('URL parse error for srcSet:', error);
          return '';
        }
      })
      .filter(Boolean)
      .join(', ');
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
  };

  // Show loading state
  if (!isInView && !priority) {
    return (
      <div
        ref={imgRef}
        className={cn(
          'bg-muted animate-pulse',
          className
        )}
        style={{
          width: width || '100%',
          height: height || '200px',
          backgroundImage: blurHash ? `url(data:image/svg+xml;base64,${btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="${width || 400}" height="${height || 300}">
              <rect width="100%" height="100%" fill="#f3f4f6"/>
              <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-size="14">Loading...</text>
            </svg>
          `)})` : undefined
        }}
      />
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-muted text-muted-foreground',
          className
        )}
        style={{ width, height }}
      >
        <ImageIcon className="w-8 h-8 mb-2" />
        <p className="text-xs text-center">Görsel yüklenemedi</p>
        {fallbackSrc && (
          <button
            onClick={handleRetry}
            className="mt-2 text-xs text-primary hover:underline"
          >
            Tekrar Dene
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={imgRef}>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-muted"
          >
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.img
        src={hasError && fallbackSrc ? fallbackSrc : optimizedSrc}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        width={width}
        height={height}
        sizes={sizes}
        srcSet={getSrcSet()}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          filter: blurHash && isLoading ? 'blur(10px)' : 'none',
          transform: blurHash && isLoading ? 'scale(1.1)' : 'scale(1)',
          transition: 'filter 0.3s ease-out, transform 0.3s ease-out'
        }}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage; 