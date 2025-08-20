import React, { useState, useEffect, useRef } from 'react';
import { isWebPSupported, preloadImage } from '@/utils/imageOptimization';

const OptimizedImage = ({
  src,
  alt,
  className = '',
  loading = 'lazy',
  decoding = 'async',
  sizes = '100vw',
  fallbackSrc,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TG9hZGluZy4uLjwvdGV4dD48L3N2Zz4=',
  onLoad,
  onError,
  priority = false, // New prop for LCP images
  width,
  height,
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  const [showFallback, setShowFallback] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [webpSupported, setWebpSupported] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    // Check WebP support
    setWebpSupported(isWebPSupported());
  }, []);

  useEffect(() => {
    if (!src) return;

    let isMounted = true;

    const loadImage = async () => {
      try {
        // Skip loading for placeholder images that are known to fail
        if (src.includes('via.placeholder.com') || src.includes('source.boringavatars.com')) {
          setShowFallback(true);
          setHasError(true);
          if (onError) {
            onError(new Error('Placeholder image skipped'));
          }
          return;
        }

        // Simple approach: just preload the original image
        let imageSrc = src;
        
        if (!isMounted) return;

        // Add timeout for slow images
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Image load timeout')), 3000); // 3 second timeout
        });

        // Preload the image with timeout
        await Promise.race([preloadImage(imageSrc), timeoutPromise]);
        
        if (!isMounted) return;

        setCurrentSrc(imageSrc);
        setIsLoaded(true);
        setHasError(false);
        
        if (onLoad) {
          onLoad(imageSrc);
        }
      } catch (error) {
        if (!isMounted) return;

        console.error('Image load failed:', error);
        setHasError(true);
        
        // Try fallback source
        if (fallbackSrc && fallbackSrc !== src) {
          try {
            await preloadImage(fallbackSrc);
            setCurrentSrc(fallbackSrc);
            setIsLoaded(true);
            setHasError(false);
            
            if (onLoad) {
              onLoad(fallbackSrc);
            }
          } catch (fallbackError) {
            console.error('Fallback image also failed:', fallbackError);
            if (onError) {
              onError(error);
            }
          }
        } else {
          if (onError) {
            onError(error);
          }
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [src, fallbackSrc, onLoad, onError]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = (error) => {
    setHasError(true);
    if (onError) {
      onError(error);
    }
  };

  // Show fallback for placeholder images
  if (showFallback) {
    return (
      <div 
        className={`${className} bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center`}
        style={{
          width: width || '100%',
          height: height || '200px',
          aspectRatio: width && height ? `${width} / ${height}` : 'auto',
        }}
      >
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">📷</div>
          <div className="text-sm">Resim</div>
        </div>
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      className={`${className} ${isLoaded ? 'loaded' : 'loading'}`}
      loading={priority ? 'eager' : loading}
      decoding={priority ? 'sync' : decoding}
      sizes={sizes}
      width={width}
      height={height}
      onLoad={handleLoad}
      onError={handleError}
      style={{
        opacity: isLoaded ? 1 : 0.7,
        transition: 'opacity 0.3s ease-in-out',
        filter: isLoaded ? 'none' : 'blur(2px)',
        aspectRatio: width && height ? `${width} / ${height}` : 'auto',
      }}
      {...props}
    />
  );
};

export default OptimizedImage; 