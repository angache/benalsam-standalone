/**
 * useViewPreference Hook
 * 
 * Manages view preference state with localStorage persistence
 */

'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/components/ui/use-toast'
import type { ViewType } from '@/components/home/ViewToggle'

/**
 * Hook to manage view preference with localStorage
 */
export function useViewPreference(defaultView: ViewType = 'grid-3') {
  const { toast } = useToast()
  
  // Load view preference from localStorage
  const [view, setView] = useState<ViewType>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('listingView') as ViewType) || defaultView
    }
    return defaultView
  })
  
  // Save view preference to localStorage
  const handleViewChange = useCallback((newView: ViewType) => {
    setView(newView)
    if (typeof window !== 'undefined') {
      localStorage.setItem('listingView', newView)
    }
    
    const viewLabels = {
      'grid-2': '2 Sütun',
      'grid-3': '3 Sütun',
      'grid-4': '4 Sütun',
      'list': 'Liste'
    }
    
    toast({
      title: "👁️ Görünüm Değiştirildi",
      description: `${viewLabels[newView]} görünümü aktif`,
    })
  }, [toast])

  return { view, setView: handleViewChange }
}

