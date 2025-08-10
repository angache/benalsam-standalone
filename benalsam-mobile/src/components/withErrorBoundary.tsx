import React, { ComponentType } from 'react';
import ErrorBoundary from './ErrorBoundary';

interface WithErrorBoundaryOptions {
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
  enableLogging?: boolean;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

/**
 * Higher-order component that wraps a component with an ErrorBoundary
 * 
 * @param Component - The component to wrap
 * @param options - ErrorBoundary configuration options
 * @returns Wrapped component with error boundary
 * 
 * @example
 * ```tsx
 * const SafeMyComponent = withErrorBoundary(MyComponent, {
 *   onError: (error, errorInfo) => {
 *     console.log('Component error:', error);
 *   },
 *   enableLogging: true,
 * });
 * ```
 */
export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
): ComponentType<P> {
  const WrappedComponent = (props: P) => {
    return (
      <ErrorBoundary
        fallback={options.fallback}
        onError={options.onError}
        enableLogging={options.enableLogging}
        resetKeys={options.resetKeys}
        resetOnPropsChange={options.resetOnPropsChange}
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  // Set display name for better debugging
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

/**
 * Hook-like function for easier usage with functional components
 * 
 * @param options - ErrorBoundary configuration options
 * @returns Function that wraps JSX with ErrorBoundary
 * 
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const withErrorHandling = useErrorBoundary({
 *     onError: (error) => console.log(error),
 *   });
 * 
 *   return withErrorHandling(
 *     <div>My component content</div>
 *   );
 * };
 * ```
 */
export function useErrorBoundary(options: WithErrorBoundaryOptions = {}) {
  return (children: React.ReactNode) => (
    <ErrorBoundary
      fallback={options.fallback}
      onError={options.onError}
      enableLogging={options.enableLogging}
      resetKeys={options.resetKeys}
      resetOnPropsChange={options.resetOnPropsChange}
    >
      {children}
    </ErrorBoundary>
  );
}

export default withErrorBoundary; 