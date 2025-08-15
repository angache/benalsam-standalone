// Browser-compatible image optimization utilities

// WebP optimization configuration
const WEBP_CONFIG = {
  quality: 0.8,
  effort: 6,
};

// Supported image formats
const SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png', 'webp'];

// Check if WebP is supported by the browser
export const isWebPSupported = () => {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

// Convert image to WebP format using Canvas API
export const convertToWebP = async (imageElement, options = {}) => {
  try {
    const config = { ...WEBP_CONFIG, ...options };
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    
    ctx.drawImage(imageElement, 0, 0);
    
    const webpDataUrl = canvas.toDataURL('image/webp', config.quality);
    return webpDataUrl;
  } catch (error) {
    console.error('WebP conversion failed:', error);
    return null;
  }
};

// Optimize image using Canvas API
export const optimizeImage = async (imageElement, originalFormat, options = {}) => {
  try {
    if (!SUPPORTED_FORMATS.includes(originalFormat.toLowerCase())) {
      console.warn(`Unsupported format: ${originalFormat}`);
      return imageElement.src;
    }

    // If WebP is supported, convert to WebP
    if (isWebPSupported()) {
      const webpDataUrl = await convertToWebP(imageElement, options);
      if (webpDataUrl) {
        return webpDataUrl;
      }
    }

    // Fallback: optimize original format
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    
    ctx.drawImage(imageElement, 0, 0);
    
    const optimizedDataUrl = canvas.toDataURL(`image/${originalFormat}`, 0.85);
    return optimizedDataUrl;
  } catch (error) {
    console.error('Image optimization failed:', error);
    return imageElement.src;
  }
};

// Generate responsive image sizes using Canvas API
export const generateResponsiveSizes = async (imageElement, sizes = []) => {
  try {
    const defaultSizes = [320, 640, 960, 1280, 1920];
    const imageSizes = sizes.length > 0 ? sizes : defaultSizes;
    
    const responsiveImages = await Promise.all(
      imageSizes.map(async (width) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const aspectRatio = imageElement.naturalHeight / imageElement.naturalWidth;
        const height = Math.round(width * aspectRatio);
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(imageElement, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/webp', WEBP_CONFIG.quality);
        
        return {
          width,
          src: dataUrl,
          size: dataUrl.length,
        };
      })
    );
    
    return responsiveImages;
  } catch (error) {
    console.error('Responsive image generation failed:', error);
    return [];
  }
};

// Create optimized image component props
export const createOptimizedImageProps = (src, alt, options = {}) => {
  const {
    sizes = '100vw',
    loading = 'lazy',
    decoding = 'async',
    ...rest
  } = options;

  return {
    src,
    alt,
    loading,
    decoding,
    sizes,
    ...rest,
  };
};

// Generate srcset for responsive images
export const generateSrcSet = (images, format = 'webp') => {
  return images
    .map(img => `${img.src} ${img.width}w`)
    .join(', ');
};

// Image optimization hook
export const useImageOptimization = () => {
  const optimizeImageFile = async (file, options = {}) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const optimizedBuffer = await optimizeImage(
        buffer,
        file.type.split('/')[1],
        options
      );
      
      return new Blob([optimizedBuffer], { type: 'image/webp' });
    } catch (error) {
      console.error('File optimization failed:', error);
      return file;
    }
  };

  const createOptimizedUrl = async (file, options = {}) => {
    const optimizedBlob = await optimizeImageFile(file, options);
    return URL.createObjectURL(optimizedBlob);
  };

  return {
    optimizeImageFile,
    createOptimizedUrl,
    isWebPSupported,
  };
};

// Preload critical images
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Lazy load images with intersection observer
export const useLazyImage = (src, options = {}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, ...options }
    );

    const imgElement = document.querySelector(`[data-src="${src}"]`);
    if (imgElement) {
      observer.observe(imgElement);
    }

    return () => observer.disconnect();
  }, [src, options]);

  useEffect(() => {
    if (imageSrc) {
      preloadImage(imageSrc)
        .then(() => setIsLoaded(true))
        .catch(setError);
    }
  }, [imageSrc]);

  return { imageSrc, isLoaded, error };
};
