import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import React from 'react';

const spinnerVariants = cva(
  'animate-spin rounded-full border-2 border-current border-t-transparent',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        default: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12',
      },
      variant: {
        default: 'text-primary',
        secondary: 'text-secondary',
        muted: 'text-muted-foreground',
        white: 'text-white',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
);

const LoadingSpinner = React.forwardRef(({ className, size, variant, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(spinnerVariants({ size, variant, className }))}
      {...props}
    />
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export { LoadingSpinner, spinnerVariants };
