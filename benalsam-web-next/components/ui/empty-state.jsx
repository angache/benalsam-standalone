import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import React from 'react';
import { Button } from './button';

const emptyStateVariants = cva(
  'flex flex-col items-center justify-center text-center p-8',
  {
    variants: {
      size: {
        sm: 'p-4',
        default: 'p-8',
        lg: 'p-12',
      },
      variant: {
        default: 'text-muted-foreground',
        primary: 'text-primary',
        secondary: 'text-secondary',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
);

const EmptyState = React.forwardRef(({ 
  className, 
  size, 
  variant,
  icon: Icon,
  title,
  description,
  action,
  children,
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(emptyStateVariants({ size, variant, className }))}
      {...props}
    >
      {Icon && (
        <div className="mb-4">
          <Icon className="h-12 w-12 opacity-50" />
        </div>
      )}
      
      {title && (
        <h3 className="text-lg font-semibold mb-2">
          {title}
        </h3>
      )}
      
      {description && (
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          {description}
        </p>
      )}
      
      {action && (
        <div className="mb-4">
          {action}
        </div>
      )}
      
      {children}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

// Predefined empty states
const EmptyStateList = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <EmptyState
      ref={ref}
      className={cn('min-h-[200px]', className)}
      icon={({ className }) => (
        <svg
          className={className}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      )}
      title="Henüz liste yok"
      description="Henüz hiçbir öğe eklenmemiş. İlk öğeyi ekleyerek başlayın."
      {...props}
    />
  );
});

EmptyStateList.displayName = 'EmptyStateList';

const EmptyStateSearch = React.forwardRef(({ className, query, ...props }, ref) => {
  return (
    <EmptyState
      ref={ref}
      className={cn('min-h-[300px]', className)}
      icon={({ className }) => (
        <svg
          className={className}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      )}
      title={`"${query}" için sonuç bulunamadı`}
      description="Farklı anahtar kelimeler deneyin veya filtreleri değiştirin."
      {...props}
    />
  );
});

EmptyStateSearch.displayName = 'EmptyStateSearch';

const EmptyStateError = React.forwardRef(({ className, onRetry, ...props }, ref) => {
  return (
    <EmptyState
      ref={ref}
      className={cn('min-h-[200px]', className)}
      variant="destructive"
      icon={({ className }) => (
        <svg
          className={className}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      )}
      title="Bir hata oluştu"
      description="Veriler yüklenirken beklenmeyen bir hata oluştu."
      action={
        onRetry && (
          <Button onClick={onRetry} variant="outline">
            Tekrar Dene
          </Button>
        )
      }
      {...props}
    />
  );
});

EmptyStateError.displayName = 'EmptyStateError';

export { 
  EmptyState, 
  EmptyStateList, 
  EmptyStateSearch, 
  EmptyStateError, 
  emptyStateVariants 
};
