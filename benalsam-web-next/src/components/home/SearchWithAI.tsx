/**
 * Search with AI Component
 * 
 * Search bar with AI-powered suggestions
 */

'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Sparkles, TrendingUp, Clock, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'

interface Suggestion {
  text: string
  type: 'trending' | 'recent' | 'popular' | 'ai'
  count?: number
}

export default function SearchWithAI() {
  const router = useRouter()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Fetch AI suggestions from backend API
  const { data: apiSuggestions } = useQuery({
    queryKey: ['ai-suggestions', searchQuery],
    queryFn: async () => {
      try {
        const params = new URLSearchParams()
        if (searchQuery && searchQuery.length >= 2) {
          params.set('q', searchQuery)
        }
        
        const response = await fetch(`/api/ai-suggestions?${params}`)
        if (!response.ok) return []
        
        const result = await response.json()
        return result.success ? result.data.suggestions : []
      } catch (err) {
        console.log('ℹ️ AI suggestions API not available')
        return []
      }
    },
    enabled: showSuggestions, // Only fetch when dropdown is open
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })

  // Group API suggestions by type
  const groupedSuggestions = useMemo(() => {
    if (!apiSuggestions || apiSuggestions.length === 0) {
      return { recent: [], trending: [], ai: [], popular: [] }
    }
    
    return {
      recent: apiSuggestions.filter((s: any) => s.type === 'recent'),
      trending: apiSuggestions.filter((s: any) => s.type === 'trending'),
      ai: apiSuggestions.filter((s: any) => s.type === 'ai'),
      popular: apiSuggestions.filter((s: any) => s.type === 'popular'),
    }
  }, [apiSuggestions])

  const { recent: recentSearches, trending: trendingSearches, ai: aiSuggestions, popular: popularKeywords } = groupedSuggestions

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Track search via API route
      fetch('/api/track-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery.trim(),
          userId: user?.id,
        })
      }).catch(() => {}) // Silent fail

      router.push(`/ara?q=${encodeURIComponent(searchQuery.trim())}`)
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (text: string) => {
    setSearchQuery(text)
    setShowSuggestions(false)
    
    // Track search via API route
    fetch('/api/track-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: text,
        source: 'suggestion',
        userId: user?.id,
      })
    }).catch(() => {}) // Silent fail

    router.push(`/ara?q=${encodeURIComponent(text)}`)
  }

  // Check if we have any suggestions to show
  const hasSuggestions = useMemo(() => {
    const has = (
      (recentSearches && recentSearches.length > 0) ||
      (trendingSearches && trendingSearches.length > 0) ||
      (aiSuggestions && aiSuggestions.length > 0) ||
      (popularKeywords && popularKeywords.length > 0)
    )
    console.log('🔍 hasSuggestions:', has, {
      recent: recentSearches?.length || 0,
      trending: trendingSearches?.length || 0,
      ai: aiSuggestions?.length || 0,
      popular: popularKeywords?.length || 0,
      showSuggestions
    })
    return has
  }, [recentSearches, trendingSearches, aiSuggestions, popularKeywords, showSuggestions])

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
              setShowSuggestions(true) // Always show when typing
            }}
            onFocus={() => {
              setShowSuggestions(true) // Always show on focus
              console.log('🔍 Search input focused, showSuggestions:', true)
            }}
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
      {showSuggestions && hasSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-2xl border border-border z-50 max-h-[500px] overflow-y-auto">
          <div className="p-4">
            {/* Recent Searches */}
            {recentSearches && recentSearches.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground mb-2">
                  <Clock className="w-3 h-3" />
                  <span>Son Aramalarınız</span>
                </div>
                {recentSearches.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={`recent-${index}`}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className="w-full text-left px-3 py-2 hover:bg-accent rounded-md transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                      <span className="text-sm group-hover:text-primary">{suggestion.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Trending Searches */}
            {trendingSearches && trendingSearches.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground mb-2">
                  <TrendingUp className="w-3 h-3" />
                  <span>Trend Aramalar</span>
                </div>
                {trendingSearches.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={`trending-${index}`}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className="w-full text-left px-3 py-2 hover:bg-accent rounded-md transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-4 h-4 text-orange-500 group-hover:text-primary" />
                        <span className="text-sm group-hover:text-primary">{suggestion.text}</span>
                      </div>
                      {suggestion.count && (
                        <span className="text-xs text-muted-foreground">{suggestion.count} arama</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* AI Suggestions */}
            {aiSuggestions.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground mb-2">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span>AI Önerileri</span>
                </div>
                {aiSuggestions.map((suggestion, index) => (
                  <button
                    key={`ai-${index}`}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className="w-full text-left px-3 py-2 hover:bg-accent rounded-md transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-primary group-hover:text-primary" />
                      <span className="text-sm group-hover:text-primary">{suggestion.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Popular Keywords */}
            {!searchQuery && popularKeywords.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground mb-2">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  <span>Popüler Aramalar</span>
                </div>
                {popularKeywords.slice(0, 5).map((suggestion, index) => (
                  <button
                    key={`popular-${index}`}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className="w-full text-left px-3 py-2 hover:bg-accent rounded-md transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-yellow-500 group-hover:text-primary" />
                      <span className="text-sm group-hover:text-primary">{suggestion.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
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

