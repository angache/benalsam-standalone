import { useState, useRef, useCallback } from 'react';
import { haptic } from '../utils/hapticFeedback';

export interface LongPressConfig {
  duration?: number; // Long press duration in ms (default: 500)
  hapticFeedback?: boolean; // Enable haptic feedback (default: true)
  hapticType?: 'light' | 'medium' | 'heavy'; // Haptic feedback type (default: 'medium')
}

export interface LongPressCallbacks {
  onLongPress?: () => void;
  onLongPressStart?: () => void;
  onLongPressEnd?: () => void;
  onPress?: () => void;
}

export const useLongPress = (
  callbacks: LongPressCallbacks,
  config: LongPressConfig = {}
) => {
  const {
    duration = 500,
    hapticFeedback = true,
    hapticType = 'medium',
  } = config;

  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredLongPress = useRef(false);

  const startLongPress = useCallback(() => {
    setIsLongPressing(true);
    hasTriggeredLongPress.current = false;
    callbacks.onLongPressStart?.();

    longPressTimer.current = setTimeout(() => {
      hasTriggeredLongPress.current = true;
      setIsLongPressing(false);
      
      // Trigger haptic feedback
      if (hapticFeedback) {
        haptic.trigger(hapticType);
      }
      
      callbacks.onLongPress?.();
    }, duration);
  }, [callbacks, duration, hapticFeedback, hapticType]);

  const endLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    setIsLongPressing(false);
    callbacks.onLongPressEnd?.();
  }, [callbacks]);

  const handlePressIn = useCallback(() => {
    startLongPress();
  }, [startLongPress]);

  const handlePressOut = useCallback(() => {
    endLongPress();
  }, [endLongPress]);

  const handlePress = useCallback(() => {
    // Sadece long press tetiklenmediyse normal press'i çalıştır
    if (!hasTriggeredLongPress.current) {
      callbacks.onPress?.();
    }
    hasTriggeredLongPress.current = false;
  }, [callbacks]);

  return {
    isLongPressing,
    handlers: {
      onPressIn: handlePressIn,
      onPressOut: handlePressOut,
      onPress: handlePress,
    },
  };
};

// Convenience hook for simple long press
export const useSimpleLongPress = (
  onLongPress: () => void,
  onPress?: () => void,
  config?: LongPressConfig
) => {
  const callbacks: LongPressCallbacks = {
    onLongPress,
    onPress,
  };

  return useLongPress(callbacks, config);
};

export default useLongPress; 