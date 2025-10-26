/**
 * ChatHeader Component
 * 
 * Header for messaging chat interface
 * Shows user info, listing info, and action buttons
 */

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft, Home, Eye, User, MoreVertical } from 'lucide-react'
import { sanitizeText } from '@/utils/sanitize'

interface ChatHeaderProps {
  otherUser?: {
    id: string
    name: string
    avatar_url: string | null
  } | null
  listing?: {
    id: string
    title: string
  } | null
  onBack?: () => void
  onViewListing?: () => void
  onViewProfile?: () => void
  onGoHome?: () => void
  showBackButton?: boolean
}

export function ChatHeader({
  otherUser,
  listing,
  onBack,
  onViewListing,
  onViewProfile,
  onGoHome,
  showBackButton = false
}: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black flex-shrink-0">
      {/* Back button (mobile) */}
      {showBackButton && onBack && (
        <button
          onClick={onBack}
          className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      {/* User info */}
      <Avatar className="w-10 h-10">
        <AvatarImage src={otherUser?.avatar_url || ''} alt={otherUser?.name} />
        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
          {otherUser?.name?.[0] || 'U'}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{sanitizeText(otherUser?.name)}</p>
        {listing && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {listing.title}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        {onGoHome && (
          <button
            onClick={onGoHome}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors"
            title="Ana Sayfa"
          >
            <Home className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        )}

        {listing && onViewListing && (
          <button
            onClick={onViewListing}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors"
            title="İlanı Görüntüle"
          >
            <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        )}

        {otherUser && onViewProfile && (
          <button
            onClick={onViewProfile}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors"
            title="Profili Görüntüle"
          >
            <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        )}

        <button
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors"
          title="Diğer Seçenekler"
        >
          <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    </div>
  )
}

export default ChatHeader

