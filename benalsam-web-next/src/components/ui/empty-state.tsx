import { cn } from '@/lib/utils'
import { cva } from 'class-variance-authority'
import React from 'react'
import { Button } from './button'

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
        destructive: 'text-destructive',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
)

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'primary' | 'secondary' | 'destructive'
  icon?: React.ComponentType<{ className?: string }>
  title?: string
  description?: string
  action?: React.ReactNode
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(({ 
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
  )
})

EmptyState.displayName = 'EmptyState'

// Predefined empty states
export const EmptyStateList = React.forwardRef<HTMLDivElement, EmptyStateProps>(({ className, ...props }, ref) => {
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
  )
})

EmptyStateList.displayName = 'EmptyStateList'

export const EmptyStateSearch = React.forwardRef<HTMLDivElement, EmptyStateProps & { query?: string }>(({ className, query, ...props }, ref) => {
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
  )
})

EmptyStateSearch.displayName = 'EmptyStateSearch'

export const EmptyStateError = React.forwardRef<HTMLDivElement, EmptyStateProps & { onRetry?: () => void }>(({ className, onRetry, ...props }, ref) => {
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
  )
})

EmptyStateError.displayName = 'EmptyStateError'

// Profile-specific empty states
export const EmptyStateProfileListings = React.forwardRef<HTMLDivElement, EmptyStateProps & { isCurrentUser?: boolean; onCreateClick?: () => void }>(({ className, isCurrentUser, onCreateClick, ...props }, ref) => {
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
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      )}
      title={isCurrentUser ? "Henüz İlan Yok" : "Henüz İlan Bulunmuyor"}
      description={isCurrentUser ? "İlk ilanınızı oluşturarak başlayın!" : "Bu kullanıcının henüz yayınlanmış bir ilanı bulunmuyor."}
      action={
        isCurrentUser && onCreateClick && (
          <Button onClick={onCreateClick} className="btn-primary">
            İlan Oluştur
          </Button>
        )
      }
      {...props}
    />
  )
})

EmptyStateProfileListings.displayName = 'EmptyStateProfileListings'

export const EmptyStateProfileReviews = React.forwardRef<HTMLDivElement, EmptyStateProps & { isCurrentUser?: boolean }>(({ className, isCurrentUser, ...props }, ref) => {
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
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      )}
      title={isCurrentUser ? "Henüz Yorum Yok" : "Henüz Değerlendirme Yok"}
      description={isCurrentUser ? "Henüz bir değerlendirme almadınız." : "Bu kullanıcının henüz bir değerlendirmesi bulunmuyor."}
      {...props}
    />
  )
})

EmptyStateProfileReviews.displayName = 'EmptyStateProfileReviews'

export { 
  EmptyState, 
  emptyStateVariants 
}
