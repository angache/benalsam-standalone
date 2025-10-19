// Cloudinary image optimization utilities
// Optimize Cloudinary URLs for better performance

const CLOUDINARY_BASE_URL = 'https://res.cloudinary.com/classibuy/image/upload/';

// Cloudinary transformation presets
export const CLOUDINARY_PRESETS = {
  // Thumbnail sizes
  thumbnail: 'w_150,h_150,c_fill,q_auto,f_auto',
  small: 'w_300,h_300,c_fill,q_auto,f_auto',
  medium: 'w_600,h_600,c_fill,q_auto,f_auto',
  large: 'w_1200,h_1200,c_fill,q_auto,f_auto',
  
  // Listing card images
  listingCard: 'w_400,h_300,c_fill,q_auto,f_auto',
  
  // Hero images
  hero: 'w_1920,h_1080,c_fill,q_auto,f_auto',
  
  // Avatar images
  avatar: 'w_100,h_100,c_fill,q_auto,f_auto',
  
  // Gallery images
  gallery: 'w_800,h_600,c_fill,q_auto,f_auto',
};

// Get optimized Cloudinary URL
export const getOptimizedCloudinaryUrl = (publicId, preset = 'medium', options = {}) => {
  if (!publicId) return null;
  
  // Remove base URL if already present
  const cleanPublicId = publicId.replace(CLOUDINARY_BASE_URL, '');
  
  // Build transformation string from preset key
  let transformation = CLOUDINARY_PRESETS[preset] || CLOUDINARY_PRESETS.medium;
  
  // Add custom options
  if (options.width) transformation += `,w_${options.width}`;
  if (options.height) transformation += `,h_${options.height}`;
  if (options.quality) transformation += `,q_${options.quality}`;
  if (options.format) transformation += `,f_${options.format}`;
  if (options.crop) transformation += `,c_${options.crop}`;
  
  return `${CLOUDINARY_BASE_URL}${transformation}/${cleanPublicId}`;
};

// Get responsive Cloudinary URLs for different screen sizes
export const getResponsiveCloudinaryUrls = (publicId, options = {}) => {
  if (!publicId) return {};
  
  return {
    mobile: getOptimizedCloudinaryUrl(publicId, 'small', options),
    tablet: getOptimizedCloudinaryUrl(publicId, 'medium', options),
    desktop: getOptimizedCloudinaryUrl(publicId, 'large', options),
    original: getOptimizedCloudinaryUrl(publicId, 'auto', options),
  };
};

// Check if URL is a Cloudinary URL
export const isCloudinaryUrl = (url) => {
  return url && url.includes('res.cloudinary.com');
};

// Extract public ID from Cloudinary URL
export const extractCloudinaryPublicId = (url) => {
  if (!isCloudinaryUrl(url)) return null;
  
  const parts = url.split('/');
  const uploadIndex = parts.findIndex(part => part === 'upload');
  
  if (uploadIndex === -1 || uploadIndex >= parts.length - 1) return null;
  
  return parts.slice(uploadIndex + 2).join('/');
};

// Generate srcset for responsive images
export const generateCloudinarySrcSet = (publicId, options = {}) => {
  if (!publicId) return '';
  
  const sizes = [
    { width: 300, preset: 'small' },
    { width: 600, preset: 'medium' },
    { width: 1200, preset: 'large' },
    { width: 1920, preset: 'hero' },
  ];
  
  return sizes
    .map(size => {
      const url = getOptimizedCloudinaryUrl(publicId, size.preset, options);
      return `${url} ${size.width}w`;
    })
    .join(', ');
};

// Lazy load optimization for Cloudinary images
export const preloadCloudinaryImage = (publicId, preset = 'medium') => {
  if (!publicId) return Promise.resolve();
  
  const url = getOptimizedCloudinaryUrl(publicId, preset);
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

// Batch preload multiple Cloudinary images
export const preloadCloudinaryImages = async (images, preset = 'medium') => {
  const promises = images.map(image => 
    preloadCloudinaryImage(image.publicId || image, preset)
  );
  
  try {
    await Promise.all(promises);
    return true;
  } catch (error) {
    console.warn('Some images failed to preload:', error);
    return false;
  }
};

// WebP optimization for Cloudinary
export const getWebPOptimizedUrl = (publicId, preset = 'medium') => {
  return getOptimizedCloudinaryUrl(publicId, preset, { format: 'webp' });
};

// Fallback for non-WebP browsers
export const getFallbackUrl = (publicId, preset = 'medium') => {
  return getOptimizedCloudinaryUrl(publicId, preset, { format: 'auto' });
};

export default {
  getOptimizedCloudinaryUrl,
  getResponsiveCloudinaryUrls,
  isCloudinaryUrl,
  extractCloudinaryPublicId,
  generateCloudinarySrcSet,
  preloadCloudinaryImage,
  preloadCloudinaryImages,
  getWebPOptimizedUrl,
  getFallbackUrl,
  CLOUDINARY_PRESETS,
};
