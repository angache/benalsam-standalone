/**
 * ConversationListItem Component
 * 
 * Displays a conversation preview in the conversation list
 * Shows user avatar, name, last message, and unread count
 */

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { sanitizeText, sanitizeListingTitle } from '@/utils/sanitize'

interface ConversationListItemProps {
  conversation: {
    id: string
    otherUser?: {
      id: string
      name: string
      avatar_url: string | null
    } | null
    listing?: {
      id: string
      title: string
      user_id: string
    } | null
    lastMessage?: {
      content: string
      created_at: string
      sender_id: string
      is_read: boolean
    } | null
    unreadCount: number
  }
  isSelected: boolean
  currentUserId?: string
  onClick: () => void
}

export function ConversationListItem({
  conversation,
  isSelected,
  currentUserId,
  onClick
}: ConversationListItemProps) {
  const isUnread = conversation.lastMessage && 
                   !conversation.lastMessage.is_read && 
                   conversation.lastMessage.sender_id !== currentUserId

  const formatMessageTime = (date: string) => {
    const messageDate = new Date(date)
    const now = new Date()
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else if (diffInHours < 48) {
      return 'Dün'
    } else {
      return messageDate.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short'
      })
    }
  }

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-3 p-4 cursor-pointer transition-colors
        ${isSelected 
          ? 'bg-gray-100 dark:bg-gray-900' 
          : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'
        }
      `}
    >
      {/* Avatar with unread indicator */}
      <div className="relative flex-shrink-0">
        <Avatar className="w-14 h-14">
          <AvatarImage src={conversation.otherUser?.avatar_url || ''} alt={conversation.otherUser?.name || 'User'} />
          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-lg">
            {conversation.otherUser?.name?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
        {isUnread && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-black"></div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name and Time */}
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <p className={`text-sm truncate ${isUnread ? 'font-bold' : 'font-semibold'}`}>
            {sanitizeText(conversation.otherUser?.name) || 'Kullanıcı'}
          </p>
          {conversation.lastMessage && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
              {formatMessageTime(conversation.lastMessage.created_at)}
            </span>
          )}
        </div>
        
        {/* Listing info with owner badge */}
        {conversation.listing && (
          <p className="text-xs truncate mb-1 flex items-center gap-1.5">
            {conversation.listing.user_id === conversation.otherUser?.id && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex-shrink-0">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                İlan Sahibi
              </span>
            )}
            <span className="text-gray-600 dark:text-gray-400 truncate">
              {sanitizeListingTitle(conversation.listing.title)}
            </span>
          </p>
        )}
        
        {/* Last message preview */}
        {conversation.lastMessage && (
          <p className={`
            text-xs truncate
            ${isUnread ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}
          `}>
            {conversation.lastMessage.sender_id === currentUserId && 'Siz: '}
            {sanitizeText(conversation.lastMessage.content)}
          </p>
        )}
      </div>

      {/* Unread badge */}
      {conversation.unreadCount > 0 && (
        <div className="bg-blue-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0">
          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
        </div>
      )}
    </div>
  )
}

export default ConversationListItem

