import { useState, useRef, useCallback } from 'react';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { haptic } from '../utils/hapticFeedback';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface SwipeConfig {
  threshold?: number; // Minimum swipe distance (default: 50)
  velocity?: number; // Minimum velocity (default: 500)
  hapticFeedback?: boolean; // Enable haptic feedback (default: true)
}

export interface SwipeCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

export const useSwipeGestures = (
  callbacks: SwipeCallbacks,
  config: SwipeConfig = {}
) => {
  const {
    threshold = 50,
    velocity = 500,
    hapticFeedback = true,
  } = config;

  const [isSwiping, setIsSwiping] = useState(false);
  const startPosition = useRef({ x: 0, y: 0 });

  const handleGestureEvent = useCallback((event: any) => {
    const { nativeEvent } = event;
    
    if (nativeEvent.state === State.BEGAN) {
      startPosition.current = {
        x: nativeEvent.x,
        y: nativeEvent.y,
      };
      setIsSwiping(true);
      callbacks.onSwipeStart?.();
    }

    if (nativeEvent.state === State.END) {
      const deltaX = nativeEvent.x - startPosition.current.x;
      const deltaY = nativeEvent.y - startPosition.current.y;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      const velocityX = Math.abs(nativeEvent.velocityX);
      const velocityY = Math.abs(nativeEvent.velocityY);

      // Determine swipe direction
      let direction: SwipeDirection | null = null;

      if (absDeltaX > absDeltaY && absDeltaX > threshold && velocityX > velocity) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else if (absDeltaY > absDeltaX && absDeltaY > threshold && velocityY > velocity) {
        direction = deltaY > 0 ? 'down' : 'up';
      }

      if (direction) {
        // Trigger haptic feedback
        if (hapticFeedback) {
          haptic.light();
        }

        // Execute callback
        switch (direction) {
          case 'left':
            callbacks.onSwipeLeft?.();
            break;
          case 'right':
            callbacks.onSwipeRight?.();
            break;
          case 'up':
            callbacks.onSwipeUp?.();
            break;
          case 'down':
            callbacks.onSwipeDown?.();
            break;
        }
      }

      setIsSwiping(false);
      callbacks.onSwipeEnd?.();
    }
  }, [callbacks, threshold, velocity, hapticFeedback]);

  return {
    isSwiping,
    handleGestureEvent,
  };
};

// Convenience hook for simple swipe detection
export const useSimpleSwipe = (
  onSwipe: (direction: SwipeDirection) => void,
  config?: SwipeConfig
) => {
  const callbacks: SwipeCallbacks = {
    onSwipeLeft: () => onSwipe('left'),
    onSwipeRight: () => onSwipe('right'),
    onSwipeUp: () => onSwipe('up'),
    onSwipeDown: () => onSwipe('down'),
  };

  return useSwipeGestures(callbacks, config);
};

export default useSwipeGestures; 