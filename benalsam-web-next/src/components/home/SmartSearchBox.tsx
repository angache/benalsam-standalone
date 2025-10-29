/**
 * SmartSearchBox Component
 * Search with autocomplete, history, and suggestions
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Clock, TrendingUp, X, Smartphone, Home, Car, Shirt } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const POPULAR_SEARCHES = [
  'iPhone 15 Pro',
  'Satılık Daire',
  'Kiralık Ev',
  'Araba',
  'Laptop',
  'PS5',
  'MacBook',
  'Apple Watch',
]

const CATEGORIES_QUICK = [
  { name: 'Elektronik', icon: Smartphone, color: 'text-blue-600' },
  { name: 'Emlak', icon: Home, color: 'text-green-600' },
  { name: 'Vasıta', icon: Car, color: 'text-purple-600' },
  { name: 'Moda', icon: Shirt, color: 'text-pink-600' },
]

export default function SmartSearchBox() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load search history
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const history = JSON.parse(localStorage.getItem('searchHistory') || '[]')
      setSearchHistory(history.slice(0, 5))
    }
  }, [])

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return

    // Save to history
    const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 5)
    setSearchHistory(newHistory)
    if (typeof window !== 'undefined') {
      localStorage.setItem('searchHistory', JSON.stringify(newHistory))
    }

    // Navigate
    router.push(`/ilanlar?q=${encodeURIComponent(searchQuery)}`)
    setIsFocused(false)
    setQuery('')
  }

  const clearHistory = () => {
    setSearchHistory([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem('searchHistory')
    }
  }

  const filteredSuggestions = query.length > 0
    ? POPULAR_SEARCHES.filter(s => s.toLowerCase().includes(query.toLowerCase()))
    : []

  const showSuggestions = isFocused && (filteredSuggestions.length > 0 || searchHistory.length > 0 || !query)

  return (
    <div ref={containerRef} className="relative max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors z-10" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch(query)
            }
          }}
          placeholder="Ne arıyorsunuz? (iPhone, Daire, Araba...)"
          className="pl-12 pr-32 h-14 text-base shadow-lg border-2 focus-visible:border-primary"
        />
        <Button
          size="lg"
          onClick={() => handleSearch(query)}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-10"
        >
          Ara
        </Button>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border-2 border-primary/20 rounded-lg shadow-xl z-50 max-h-[400px] overflow-y-auto"
          >
            {/* Search History */}
            {searchHistory.length > 0 && !query && (
              <div className="p-3 border-b">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Son Aramalar
                  </div>
                  <button
                    onClick={clearHistory}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Temizle
                  </button>
                </div>
                {searchHistory.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(item)}
                    className="w-full text-left px-3 py-2 hover:bg-muted rounded flex items-center gap-2 text-sm"
                  >
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    {item}
                  </button>
                ))}
              </div>
            )}

            {/* Filtered Suggestions */}
            {filteredSuggestions.length > 0 && (
              <div className="p-3 border-b">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <TrendingUp className="w-4 h-4" />
                  Öneriler
                </div>
                {filteredSuggestions.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(item)}
                    className="w-full text-left px-3 py-2 hover:bg-muted rounded flex items-center gap-2 text-sm"
                  >
                    <Search className="w-3 h-3 text-muted-foreground" />
                    {item}
                  </button>
                ))}
              </div>
            )}

            {/* Popular Searches */}
            {!query && (
              <div className="p-3 border-b">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <TrendingUp className="w-4 h-4" />
                  Popüler Aramalar
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.slice(0, 6).map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(item)}
                      className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full text-xs transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Category Links */}
            {!query && (
              <div className="p-3">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Hızlı Erişim
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES_QUICK.map((cat, index) => {
                    const Icon = cat.icon
                    return (
                      <button
                        key={index}
                        onClick={() => router.push(`/ilanlar?categories=${cat.name}`)}
                        className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm transition-colors"
                      >
                        <Icon className={`w-5 h-5 ${cat.color}`} />
                        {cat.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

