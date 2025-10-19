// Lazy imports for heavy libraries to reduce initial bundle size

// Maps - only load when needed
export const loadLeaflet = () => import('leaflet');
export const loadReactLeaflet = () => import('react-leaflet');

// Image editing - only load when needed  
export const loadCropper = () => import('cropperjs');
export const loadReactCropper = () => import('react-cropper');

// QR Code - only load when needed
export const loadQRCode = () => import('qrcode');
export const loadReactQRCode = () => import('react-qr-code');

// OTP - only load when needed
export const loadOTP = () => import('otplib');

// Date picker - only load when needed
export const loadDatePicker = () => import('react-day-picker');

// Carousel - only load when needed
export const loadCarousel = () => import('embla-carousel-react');

// Image compression - only load when needed
export const loadImageCompression = () => import('browser-image-compression');

// Conditional loading based on feature flags
export const loadFeature = async (featureName) => {
  switch (featureName) {
    case 'maps':
      return Promise.all([loadLeaflet(), loadReactLeaflet()]);
    case 'image-editing':
      return Promise.all([loadCropper(), loadReactCropper()]);
    case 'qr-code':
      return Promise.all([loadQRCode(), loadReactQRCode()]);
    case 'otp':
      return loadOTP();
    case 'date-picker':
      return loadDatePicker();
    case 'carousel':
      return loadCarousel();
    case 'image-compression':
      return loadImageCompression();
    default:
      throw new Error(`Unknown feature: ${featureName}`);
  }
};
