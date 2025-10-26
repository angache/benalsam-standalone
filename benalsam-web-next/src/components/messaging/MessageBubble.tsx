/**
 * MessageBubble Component
 * 
 * Displays a single message in a chat interface
 * Supports sender/receiver styling, avatars, and timestamps
 */

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { sanitizeText } from '@/utils/sanitize'
import type { Message } from '@/types'

interface MessageBubbleProps {
  message: Message
  isOwnMessage: boolean
  showAvatar?: boolean
  showTime?: boolean
  otherUser?: {
    name: string
    avatar_url: string | null
  }
}

export function MessageBubble({ 
  message, 
  isOwnMessage, 
  showAvatar = false, 
  showTime = false,
  otherUser 
}: MessageBubbleProps) {
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`flex items-end gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar (only for receiver) */}
      {showAvatar && !isOwnMessage && otherUser && (
        <Avatar className="w-6 h-6">
          <AvatarImage src={otherUser.avatar_url || ''} alt={otherUser.name} />
          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-xs">
            {otherUser.name?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message Content */}
      <div className={`
        flex flex-col
        ${isOwnMessage ? 'items-end' : 'items-start'}
        ${!showAvatar && !isOwnMessage ? 'ml-8' : ''}
      `}>
        <div className={`
          max-w-xs md:max-w-md lg:max-w-lg
          px-4 py-2.5 rounded-3xl break-words
          ${isOwnMessage 
            ? 'bg-blue-500 text-white rounded-br-md' 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
          }
        `}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {sanitizeText(message.content)}
          </p>
        </div>
        
        {showTime && (
          <p className={`
            text-xs text-gray-400 mt-1 px-2
            ${isOwnMessage ? 'text-right' : 'text-left'}
          `}>
            {formatTime(message.created_at)}
          </p>
        )}
      </div>
    </div>
  )
}

export default MessageBubble

