/**
 * UnreadBadge Component
 * 
 * Displays unread message count badge
 * Configurable max display number (default: 9+)
 */

import { UNREAD_MAX_DISPLAY } from '@/config/messaging'

interface UnreadBadgeProps {
  count: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'minimal'
  maxDisplay?: number
}

export function UnreadBadge({ 
  count, 
  size = 'md', 
  variant = 'default',
  maxDisplay = UNREAD_MAX_DISPLAY 
}: UnreadBadgeProps) {
  if (count <= 0) return null

  const sizeClasses = {
    sm: 'h-4 w-4 text-[10px]',
    md: 'h-5 w-5 text-xs',
    lg: 'h-6 w-6 text-sm'
  }

  const variantClasses = {
    default: 'bg-red-500 text-white',
    outline: 'bg-white dark:bg-gray-900 text-red-500 border-2 border-red-500',
    minimal: 'bg-red-500/10 text-red-500'
  }

  const displayCount = count > maxDisplay ? `${maxDisplay}+` : count

  return (
    <span 
      className={`
        ${sizeClasses[size]} 
        ${variantClasses[variant]}
        rounded-full font-bold flex items-center justify-center flex-shrink-0
      `}
      aria-label={`${count} okunmamış mesaj`}
    >
      {displayCount}
    </span>
  )
}

export default UnreadBadge

