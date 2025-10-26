/**
 * Search with AI Component
 * 
 * Search bar with AI-powered suggestions
 */

'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SearchWithAI() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/ara?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // AI suggestion examples (will be replaced with real AI service)
  const aiSuggestions = searchQuery.length > 2 ? [
    { text: `${searchQuery} satın al`, type: 'search' },
    { text: `${searchQuery} fiyatları`, type: 'search' },
    { text: `İkinci el ${searchQuery}`, type: 'search' },
  ] : []

  return (
    <div className="relative">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-colors">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Search className="w-6 h-6 text-gray-400" />
          </div>
          
          <Input
            type="text"
            placeholder="Ne arıyorsunuz? (örn: iPhone 13, kiralık daire, laptop)"
            className="w-full pl-14 pr-32 py-6 text-base border-0 bg-transparent focus-visible:ring-0"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowSuggestions(e.target.value.length > 0)
            }}
            onFocus={() => setShowSuggestions(searchQuery.length > 0)}
          />
          
          <Button
            type="submit"
            size="lg"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 text-white"
            style={{ backgroundColor: 'var(--primary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary)' }}
          >
            <Search className="w-5 h-5 mr-2" />
            Ara
          </Button>
        </div>
      </form>

      {/* AI Suggestions Dropdown */}
      {showSuggestions && aiSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-2">
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>AI Önerileri</span>
            </div>
            
            {aiSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  setSearchQuery(suggestion.text)
                  setShowSuggestions(false)
                  router.push(`/ara?q=${encodeURIComponent(suggestion.text)}`)
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{suggestion.text}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  )
}

