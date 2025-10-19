import { useEffect } from 'react';

export const useModalScrollLock = (isOpen) => {
  useEffect(() => {
    if (isOpen) {
      // Body scroll'unu engelle
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Modal kapandığında scroll'u geri aç
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);
}; 