// Lazy loading wrapper for framer-motion to reduce initial bundle size
import { lazy } from 'react';

// Lazy load framer-motion components
export const LazyMotion = lazy(() => import('framer-motion').then(module => ({ default: module.motion })));
export const LazyAnimatePresence = lazy(() => import('framer-motion').then(module => ({ default: module.AnimatePresence })));

// Lazy motion variants for common animations
export const lazyMotionVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideIn: {
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 100, opacity: 0 }
  },
  scaleIn: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 }
  }
};

// Hook for lazy loading framer-motion
export const useLazyMotion = () => {
  const [motion, setMotion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    import('framer-motion').then(module => {
      setMotion(module.motion);
      setIsLoading(false);
    });
  }, []);

  return { motion, isLoading };
};

// Fallback component for when framer-motion is loading
export const MotionFallback = ({ children, ...props }) => {
  return <div {...props}>{children}</div>;
};
