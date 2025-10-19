import { useEffect } from 'react';

export const useMobileModalLock = (isOpen) => {
  useEffect(() => {
    if (isOpen) {
      // Chrome için daha agresif scroll lock
      const originalStyle = window.getComputedStyle(document.body).overflow;
      const originalPosition = window.getComputedStyle(document.body).position;
      const originalTop = window.getComputedStyle(document.body).top;
      
      // Chrome'da daha etkili olan yöntem
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = '0';
      
      return () => {
        document.body.style.overflow = originalStyle;
        document.body.style.position = originalPosition;
        document.body.style.width = '';
        document.body.style.top = originalTop;
      };
    }
  }, [isOpen]);
}; 