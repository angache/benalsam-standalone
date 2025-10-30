/**
 * ChatbotHeader Component
 * Header with controls (minimize, close, clear)
 */

'use client'

import { Bot, X, Minimize2, Maximize2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChatbotHeaderProps {
  isMinimized: boolean
  onMinimize: () => void
  onClose: () => void
  onClear: () => void
  messageCount: number
}

export function ChatbotHeader({
  isMinimized,
  onMinimize,
  onClose,
  onClear,
  messageCount
}: ChatbotHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-primary to-purple-600 text-white p-4 flex items-center justify-between">
      {/* Left - Bot Info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-semibold">Benalsam Asistan</h3>
          <p className="text-xs text-white/80 flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Her zaman aktif
          </p>
        </div>
      </div>

      {/* Right - Controls */}
      <div className="flex items-center gap-1">
        {/* Clear Chat */}
        {messageCount > 1 && !isMinimized && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-8 w-8 p-0 text-white hover:bg-white/20"
            title="Sohbeti Temizle"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}

        {/* Minimize/Maximize */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMinimize}
          className="h-8 w-8 p-0 text-white hover:bg-white/20"
          title={isMinimized ? 'Genişlet' : 'Küçült'}
        >
          {isMinimized ? (
            <Maximize2 className="w-4 h-4" />
          ) : (
            <Minimize2 className="w-4 h-4" />
          )}
        </Button>

        {/* Close */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 text-white hover:bg-white/20"
          title="Kapat"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

