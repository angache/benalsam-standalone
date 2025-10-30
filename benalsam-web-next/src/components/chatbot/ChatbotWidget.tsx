/**
 * ChatbotWidget Component
 * Main chatbot widget with minimize/expand functionality
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Minimize2, Maximize2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  processUserMessage,
  getQuickReplies,
  loadChatHistory,
  saveChatHistory,
  clearChatHistory,
  trackChatbotEvent,
  type ChatMessage,
  type ChatContext
} from '@/services/chatbotService'
import { ChatbotMessages } from './ChatbotMessages'
import { ChatbotInput } from './ChatbotInput'
import { ChatbotSuggestions } from './ChatbotSuggestions'
import { ChatbotHeader } from './ChatbotHeader'

export default function ChatbotWidget() {
  const pathname = usePathname()
  const { user } = useAuth()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load chat history on mount
  useEffect(() => {
    const history = loadChatHistory()
    if (history.length > 0) {
      setMessages(history)
    } else {
      // Send welcome message
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: '👋 Merhaba! Ben Benalsam asistanıyım.\n\nSize nasıl yardımcı olabilirim?',
        timestamp: new Date(),
        relatedQuestions: [
          'İlan nasıl veririm?',
          'Ücretsiz mi?',
          'Nasıl çalışır?'
        ]
      }
      setMessages([welcomeMessage])
    }
  }, [])

  // Save history when messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages)
    }
  }, [messages])

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Track open/close events
  useEffect(() => {
    if (isOpen) {
      trackChatbotEvent('open', { pathname })
    } else {
      trackChatbotEvent('close', { pathname })
    }
  }, [isOpen, pathname])

  // Get chat context
  const context: ChatContext = {
    currentPage: pathname,
    userLoggedIn: !!user,
    previousQuestions: messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .slice(-5)
  }

  // Handle user message
  const handleSendMessage = (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    
    // Track message
    trackChatbotEvent('message', { content, pathname })

    // Show typing indicator
    setIsTyping(true)

    // Simulate thinking delay (300-800ms for natural feel)
    const thinkingTime = 300 + Math.random() * 500
    setTimeout(() => {
      // Process and get response
      const response = processUserMessage(content, context)
      setMessages(prev => [...prev, response])
      setIsTyping(false)
    }, thinkingTime)
  }

  // Handle quick reply
  const handleQuickReply = (question: string) => {
    handleSendMessage(question)
  }

  // Clear chat
  const handleClearChat = () => {
    clearChatHistory()
    const welcomeMessage: ChatMessage = {
      id: 'welcome_new',
      role: 'assistant',
      content: '👋 Sohbet temizlendi! Size nasıl yardımcı olabilirim?',
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }

  // Get quick replies
  const quickReplies = getQuickReplies(context)

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              size="lg"
              onClick={() => setIsOpen(true)}
              className="w-16 h-16 rounded-full shadow-2xl bg-gradient-to-br from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 relative group"
            >
              <MessageCircle className="w-7 h-7 text-white" />
              
              {/* Pulse animation */}
              <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
              
              {/* Notification badge */}
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                !
              </span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 60 : 600
            }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 w-[380px] bg-card border-2 border-primary/20 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <ChatbotHeader
              isMinimized={isMinimized}
              onMinimize={() => setIsMinimized(!isMinimized)}
              onClose={() => setIsOpen(false)}
              onClear={handleClearChat}
              messageCount={messages.length}
            />

            {/* Chat Content */}
            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
                  <ChatbotMessages messages={messages} isTyping={isTyping} />
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Suggestions */}
                {messages.length <= 2 && (
                  <ChatbotSuggestions
                    suggestions={quickReplies}
                    onSelect={handleQuickReply}
                  />
                )}

                {/* Input */}
                <ChatbotInput onSend={handleSendMessage} />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

