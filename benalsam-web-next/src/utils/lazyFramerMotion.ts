/**
 * Lazy loading wrapper for framer-motion to reduce initial bundle size
 * This helps improve TBT (Total Blocking Time) by deferring animation library loading
 */

import React, { lazy, Suspense, ComponentType, ReactNode } from 'react'

// Lazy load framer-motion components
export const LazyMotion = lazy(() => 
  import('framer-motion').then(module => ({ 
    default: module.motion 
  }))
)

// Lazy AnimatePresence wrapper
export const LazyAnimatePresence = ({ 
  children, 
  ...props 
}: { 
  children: ReactNode
  [key: string]: any 
}) => {
  const [AnimatePresenceComponent, setAnimatePresenceComponent] = React.useState<React.ComponentType<any> | null>(null)

  React.useEffect(() => {
    import('framer-motion').then((module) => {
      setAnimatePresenceComponent(() => module.AnimatePresence)
    })
  }, [])

  if (!AnimatePresenceComponent) {
    return React.createElement(React.Fragment, null, children)
  }

  return React.createElement(AnimatePresenceComponent, props, children)
}

// Fallback component for when framer-motion is loading
export const MotionFallback = ({ children, ...props }: { children: ReactNode; [key: string]: any }) => {
  return React.createElement('div', props, children)
}

// Wrapper component for lazy motion
export const LazyMotionWrapper = ({ 
  children, 
  fallback = null,
  className,
  onClick,
  ...motionProps 
}: { 
  children: ReactNode
  fallback?: ReactNode
  className?: string
  onClick?: () => void
  [key: string]: any 
}) => {
  const [motionLoaded, setMotionLoaded] = React.useState(false)
  const [MotionComponent, setMotionComponent] = React.useState<React.ComponentType<any> | null>(null)

  React.useEffect(() => {
    // Load framer-motion on mount
    import('framer-motion').then((module) => {
      setMotionComponent(() => module.motion.div)
      setMotionLoaded(true)
    })
  }, [])

  // If motion not loaded yet, use fallback
  if (!motionLoaded || !MotionComponent) {
    return React.createElement('div', { className, onClick }, children)
  }

  // Use motion component with props
  return React.createElement(
    MotionComponent,
    { className, onClick, ...motionProps },
    children
  )
}

// Hook for conditional framer-motion usage
export const useLazyMotion = () => {
  const [motion, setMotion] = React.useState<typeof import('framer-motion').motion | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    import('framer-motion').then(module => {
      setMotion(module.motion)
      setIsLoading(false)
    })
  }, [])

  return { motion, isLoading }
}

// Re-export motion variants for common animations (lightweight, no lazy loading needed)
export const motionVariants = {
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
  },
  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 }
  }
}

