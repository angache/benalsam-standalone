import { useState, useEffect, useCallback } from 'react';

// Image format detection
export const useImageFormat = () => {
  const [supportedFormats, setSupportedFormats] = useState({
    webp: false,
    avif: false,
    jpeg: true
  });

  useEffect(() => {
    const detectFormats = async () => {
      const formats = { webp: false, avif: false, jpeg: true };

      // Test WebP support
      const webpTest = new Image();
      webpTest.onload = () => { formats.webp = true; };
      webpTest.onerror = () => { formats.webp = false; };
      webpTest.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAADsAD+JaQAA3AAAAAA';

      // Test AVIF support
      const avifTest = new Image();
      avifTest.onload = () => { formats.avif = true; };
      avifTest.onerror = () => { formats.avif = false; };
      avifTest.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    };

    detectFormats();
  }, []);

  return supportedFormats;
};

// Image compression hook
export const useImageCompression = () => {
  const [isCompressing, setIsCompressing] = useState(false);

  const compressImage = useCallback(async (file, options = {}) => {
    const {
      maxSizeMB = 1,
      maxWidthOrHeight = 1920,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    setIsCompressing(true);

    try {
      // Create canvas for compression
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      return new Promise((resolve, reject) => {
        img.onload = () => {
          // Calculate new dimensions
          let { width, height } = img;
          
          if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
            if (width > height) {
              height = (height * maxWidthOrHeight) / width;
              width = maxWidthOrHeight;
            } else {
              width = (width * maxWidthOrHeight) / height;
              height = maxWidthOrHeight;
            }
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: `image/${format}`,
                  lastModified: Date.now()
                });

                console.log(`🖼️ Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
                setIsCompressing(false);
                resolve(compressedFile);
              } else {
                setIsCompressing(false);
                reject(new Error('Compression failed'));
              }
            },
            `image/${format}`,
            quality
          );
        };

        img.onerror = () => {
          setIsCompressing(false);
          reject(new Error('Failed to load image'));
        };

        img.src = URL.createObjectURL(file);
      });
    } catch (error) {
      setIsCompressing(false);
      console.error('Image compression error:', error);
      return file;
    }
  }, []);

  return { compressImage, isCompressing };
};

// Responsive image hook
export const useResponsiveImage = (src, sizes) => {
  const [srcSet, setSrcSet] = useState('');
  const [optimizedSrc, setOptimizedSrc] = useState(src);

  useEffect(() => {
    if (!src) return;

    const generateSrcSet = () => {
      const breakpoints = [
        { width: 320, suffix: 'xs' },
        { width: 640, suffix: 'sm' },
        { width: 768, suffix: 'md' },
        { width: 1024, suffix: 'lg' },
        { width: 1280, suffix: 'xl' },
        { width: 1536, suffix: '2xl' }
      ];

      const srcSetString = breakpoints
        .map(({ width }) => {
          const url = new URL(src, window.location.origin);
          url.searchParams.set('w', width.toString());
          return `${url.toString()} ${width}w`;
        })
        .join(', ');

      setSrcSet(srcSetString);
    };

    generateSrcSet();
  }, [src]);

  useEffect(() => {
    if (!src) return;

    // Generate optimized src with default quality
    const url = new URL(src, window.location.origin);
    url.searchParams.set('quality', '80');
    setOptimizedSrc(url.toString());
  }, [src]);

  return { srcSet, optimizedSrc };
};

// Image preloading hook
export const useImagePreload = () => {
  const [preloadedImages, setPreloadedImages] = useState(new Set());

  const preloadImage = useCallback((src) => {
    if (preloadedImages.has(src)) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        setPreloadedImages(prev => new Set([...prev, src]));
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }, [preloadedImages]);

  const preloadImages = useCallback(async (srcs) => {
    const promises = srcs.map(src => preloadImage(src));
    await Promise.allSettled(promises);
  }, [preloadImage]);

  return { preloadImage, preloadImages, preloadedImages };
};

// Image optimization utilities
export const imageOptimizationUtils = {
  // Get optimal format based on browser support
  getOptimalFormat: (supportedFormats) => {
    if (supportedFormats.avif) return 'avif';
    if (supportedFormats.webp) return 'webp';
    return 'jpeg';
  },

  // Generate blur hash placeholder
  generateBlurHash: async (src) => {
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
      
      let hash = '';
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const avg = Math.round((r + g + b) / 3);
        hash += avg.toString(16).padStart(2, '0');
      }
      
      return hash.substring(0, 20);
    } catch (error) {
      return 'L5H2EC=PM%V%$qj=Wg\`15#a$7{^';
    }
  },

  // Get image dimensions
  getImageDimensions: (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = URL.createObjectURL(file);
    });
  },

  // Validate image file
  validateImage: (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'Geçersiz dosya türü. Sadece JPEG, PNG, WebP ve AVIF desteklenir.' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'Dosya boyutu çok büyük. Maksimum 10MB olmalıdır.' };
    }

    return { valid: true };
  }
}; 