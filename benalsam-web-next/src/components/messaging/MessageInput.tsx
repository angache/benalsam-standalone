/**
 * MessageInput Component
 * 
 * Message input area with send button and emoji support
 * Auto-focuses and handles keyboard shortcuts
 */

'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Send, Smile, MoreVertical } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
  placeholder?: string
  autoFocus?: boolean
}

export function MessageInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = 'Mesajınızı yazın...',
  autoFocus = true
}: MessageInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus on mount and after send
  useEffect(() => {
    if (autoFocus && !disabled && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus, disabled])

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim()) {
        onSend()
      }
    }
  }

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend()
    }
  }

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black flex-shrink-0">
      <div className="flex items-center gap-2 max-w-4xl mx-auto">
        {/* Emoji button */}
        {!value.trim() && (
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors flex-shrink-0">
            <Smile className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        )}

        {/* Input field */}
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full pr-12 py-6 text-base rounded-full border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500"
          />
        </div>
        
        {/* Send button or more options */}
        {value.trim() ? (
          <button
            onClick={handleSend}
            disabled={disabled}
            className="p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 rounded-full transition-colors flex-shrink-0"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        ) : (
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors flex-shrink-0">
            <MoreVertical className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        )}
      </div>
    </div>
  )
}

export default MessageInput

