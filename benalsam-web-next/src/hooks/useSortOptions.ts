/**
 * useSortOptions Hook
 * 
 * Manages sort option state with toast notifications
 */

'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/components/ui/use-toast'
import type { SortOption } from './useFilteredListings'

const sortLabels: Record<SortOption, string> = {
  newest: 'En Yeni',
  price_low: 'En Ucuz',
  price_high: 'En Pahalı',
  popular: 'Popüler'
}

/**
 * Hook to manage sort options with toast notifications
 */
export function useSortOptions(defaultSort: SortOption = 'newest') {
  const { toast } = useToast()
  const [sortBy, setSortBy] = useState<SortOption>(defaultSort)
  
  const handleSortChange = useCallback((value: SortOption) => {
    setSortBy(value)
    toast({
      title: "🔄 Sıralama Değiştirildi",
      description: `İlanlar "${sortLabels[value]}" sıralamasına göre güncellendi`,
    })
  }, [toast])

  return { sortBy, setSortBy: handleSortChange }
}

