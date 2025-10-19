import { useCallback } from 'react';

export const useHapticFeedback = () => {
  const triggerHaptic = useCallback((type = 'light') => {
    // Web'de haptic feedback simülasyonu
    // Gerçek haptic feedback için navigator.vibrate kullanılabilir
    if ('vibrate' in navigator) {
      const patterns = {
        light: 50,
        medium: 100,
        heavy: 200,
        success: [50, 50, 50],
        error: [100, 50, 100],
        warning: [100, 100],
      };
      
      const pattern = patterns[type] || patterns.light;
      navigator.vibrate(pattern);
    }

    // Visual feedback için CSS class ekleme
    const body = document.body;
    body.classList.add('haptic-feedback');
    
    setTimeout(() => {
      body.classList.remove('haptic-feedback');
    }, 150);
  }, []);

  const hapticSuccess = useCallback(() => triggerHaptic('success'), [triggerHaptic]);
  const hapticError = useCallback(() => triggerHaptic('error'), [triggerHaptic]);
  const hapticWarning = useCallback(() => triggerHaptic('warning'), [triggerHaptic]);
  const hapticLight = useCallback(() => triggerHaptic('light'), [triggerHaptic]);
  const hapticMedium = useCallback(() => triggerHaptic('medium'), [triggerHaptic]);
  const hapticHeavy = useCallback(() => triggerHaptic('heavy'), [triggerHaptic]);

  return {
    triggerHaptic,
    hapticSuccess,
    hapticError,
    hapticWarning,
    hapticLight,
    hapticMedium,
    hapticHeavy,
  };
}; 