/**
 * ChatbotInput Component
 * Message input with send button
 */

'use client'

import { useState, useEffect } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ChatbotInputProps {
  onSend: (message: string) => void
}

export function ChatbotInput({ onSend }: ChatbotInputProps) {
  const [input, setInput] = useState('')

  // Listen for quick reply events
  useEffect(() => {
    const handleQuickReply = (e: CustomEvent) => {
      handleSend(e.detail)
    }
    
    window.addEventListener('chatbot:quick-reply' as any, handleQuickReply as any)
    return () => {
      window.removeEventListener('chatbot:quick-reply' as any, handleQuickReply as any)
    }
  }, [])

  const handleSend = (message?: string) => {
    const textToSend = message || input.trim()
    if (!textToSend) return

    onSend(textToSend)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-4 border-t bg-card">
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Mesajınızı yazın..."
          className="min-h-[44px] max-h-[120px] resize-none"
          rows={1}
        />
        <Button
          onClick={() => handleSend()}
          disabled={!input.trim()}
          className="h-[44px] px-4"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">
        Enter ile gönder, Shift+Enter ile yeni satır
      </p>
    </div>
  )
}

