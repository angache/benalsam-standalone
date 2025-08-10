// Mobile-specific utility functions

// Validate Turkish phone number format
export const isValidTurkishPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Capitalize first letter
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Generate random ID for mobile
export const generateMobileId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Debounce function for mobile
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Check if device is online
export const isDeviceOnline = (): boolean => {
  return navigator.onLine !== false;
};

// Get device pixel ratio
export const getDevicePixelRatio = (): number => {
  return window.devicePixelRatio || 1;
};

// Format file size for mobile
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Check if image is cached
export const isImageCached = (url: string): boolean => {
  const img = new Image();
  img.src = url;
  return img.complete;
};

// Get mobile-friendly date format
export const formatMobileDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 24) {
    return dateObj.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (diffInHours < 48) {
    return 'Dün';
  } else {
    return dateObj.toLocaleDateString('tr-TR', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
}; 