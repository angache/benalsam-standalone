/**
 * ChatbotSuggestions Component
 * Quick reply suggestion buttons
 */

'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface ChatbotSuggestionsProps {
  suggestions: string[]
  onSelect: (suggestion: string) => void
}

export function ChatbotSuggestions({ suggestions, onSelect }: ChatbotSuggestionsProps) {
  if (suggestions.length === 0) return null

  return (
    <div className="px-4 pb-4 border-t bg-card/50">
      <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
        <Sparkles className="w-3 h-3" />
        <span>Hızlı Sorular:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(suggestion)}
            className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-xs font-medium transition-colors border border-primary/20"
          >
            {suggestion}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

