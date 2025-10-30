/**
 * ChatbotMessages Component
 * Display chat messages with rich formatting
 */

'use client'

import { motion } from 'framer-motion'
import { Bot, User, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import type { ChatMessage } from '@/services/chatbotService'
import { trackChatbotEvent } from '@/services/chatbotService'

interface ChatbotMessagesProps {
  messages: ChatMessage[]
  isTyping: boolean
}

export function ChatbotMessages({ messages, isTyping }: ChatbotMessagesProps) {
  const router = useRouter()

  const handleActionClick = (action: ChatMessage['action']) => {
    if (!action) return
    
    trackChatbotEvent('action_click', { action })

    switch (action.type) {
      case 'navigate':
        router.push(action.value)
        break
      case 'external':
        window.open(action.value, '_blank')
        break
      case 'modal':
        // Trigger modal open (integrate with your modal system)
        console.log('Open modal:', action.value)
        break
      case 'copy':
        navigator.clipboard.writeText(action.value)
        break
    }
  }

  return (
    <>
      {messages.map((message, index) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
        >
          {/* Avatar */}
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
            ${message.role === 'assistant' 
              ? 'bg-gradient-to-br from-primary to-purple-600' 
              : 'bg-gradient-to-br from-blue-500 to-cyan-500'
            }
          `}>
            {message.role === 'assistant' ? (
              <Bot className="w-5 h-5 text-white" />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>

          {/* Message Bubble */}
          <div className={`flex-1 max-w-[75%] ${message.role === 'user' ? 'items-end' : ''}`}>
            <div className={`
              rounded-2xl p-3 shadow-sm
              ${message.role === 'assistant' 
                ? 'bg-card border' 
                : 'bg-primary text-primary-foreground'
              }
            `}>
              {/* Message Content */}
              <div className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </div>

              {/* Action Button */}
              {message.action && (
                <Button
                  size="sm"
                  variant={message.role === 'assistant' ? 'default' : 'secondary'}
                  onClick={() => handleActionClick(message.action)}
                  className="mt-3 w-full gap-2"
                >
                  {message.action.label}
                  <ExternalLink className="w-3 h-3" />
                </Button>
              )}

              {/* Related Questions */}
              {message.relatedQuestions && message.relatedQuestions.length > 0 && (
                <div className="mt-3 pt-3 border-t space-y-2">
                  <p className="text-xs text-muted-foreground">İlgili sorular:</p>
                  {message.relatedQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        // Trigger as new user message
                        const event = new CustomEvent('chatbot:quick-reply', { 
                          detail: question 
                        })
                        window.dispatchEvent(event)
                      }}
                      className="block w-full text-left text-xs px-2 py-1.5 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                    >
                      💡 {question}
                    </button>
                  ))}
                </div>
              )}

              {/* Timestamp */}
              <div className={`text-[10px] mt-2 ${
                message.role === 'assistant' 
                  ? 'text-muted-foreground' 
                  : 'text-primary-foreground/70'
              }`}>
                {message.timestamp.toLocaleTimeString('tr-TR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Typing Indicator */}
      {isTyping && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="bg-card border rounded-2xl p-3 shadow-sm">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </motion.div>
      )}
    </>
  )
}

