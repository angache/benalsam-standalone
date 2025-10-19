'use client';

import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import React from 'react';

const skeletonVariants = cva(
  'animate-pulse rounded-md bg-muted',
  {
    variants: {
      variant: {
        default: 'bg-muted',
        card: 'bg-card',
        text: 'bg-muted-foreground/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Skeleton = React.forwardRef(({ className, variant, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(skeletonVariants({ variant, className }))}
      {...props}
    />
  );
});

Skeleton.displayName = 'Skeleton';

// Predefined skeleton components
const SkeletonText = React.forwardRef(({ className, lines = 1, ...props }, ref) => {
  return (
    <div ref={ref} className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
});

SkeletonText.displayName = 'SkeletonText';

const SkeletonCard = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border bg-card p-6 space-y-4',
        className
      )}
      {...props}
    >
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={3} />
      <div className="flex justify-between">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
});

SkeletonCard.displayName = 'SkeletonCard';

export { Skeleton, SkeletonText, SkeletonCard, skeletonVariants };
