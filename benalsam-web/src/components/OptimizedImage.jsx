import React, { useState, useEffect, useRef } from 'react';
import { isWebPSupported, preloadImage, optimizeImage } from '@/utils/imageOptimization';

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
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState(placeholder);
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
        // Determine the best image source
        let imageSrc = src;
        
        // If WebP is supported and we have a WebP version, use it
        if (webpSupported && src.includes('.')) {
          const baseName = src.substring(0, src.lastIndexOf('.'));
          const webpSrc = `${baseName}.webp`;
          
          // Try to preload WebP version
          try {
            await preloadImage(webpSrc);
            imageSrc = webpSrc;
          } catch (error) {
            // Fallback to original source
            console.log('WebP not available, using original format');
          }
        }

        if (!isMounted) return;

        // Preload the image
        await preloadImage(imageSrc);
        
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
  }, [src, fallbackSrc, webpSupported, onLoad, onError]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = (error) => {
    setHasError(true);
    if (onError) {
      onError(error);
    }
  };

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      className={`${className} ${isLoaded ? 'loaded' : 'loading'}`}
      loading={loading}
      decoding={decoding}
      sizes={sizes}
      onLoad={handleLoad}
      onError={handleError}
      style={{
        opacity: isLoaded ? 1 : 0.7,
        transition: 'opacity 0.3s ease-in-out',
        filter: isLoaded ? 'none' : 'blur(2px)',
      }}
      {...props}
    />
  );
};

export default OptimizedImage; 