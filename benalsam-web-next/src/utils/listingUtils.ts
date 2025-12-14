/**
 * Listing Utility Functions
 * 
 * Shared utility functions for listing operations
 */

import { Star, Crown, Zap } from 'lucide-react'

export interface PremiumBadge {
  icon: typeof Star
  label: string
  color: string
}

/**
 * Get premium badges for a listing
 */
export function getPremiumBadges(listing: {
  id: string
  title: string
  is_featured?: boolean
  is_showcase?: boolean
  is_urgent_premium?: boolean
}): PremiumBadge[] {
  const badges: PremiumBadge[] = []
  
  if (listing.is_featured) {
    badges.push({
      icon: Star,
      label: 'Öne Çıkan',
      color: 'bg-yellow-500 hover:bg-yellow-600'
    })
  }
  
  if (listing.is_showcase) {
    badges.push({
      icon: Crown,
      label: 'Vitrin',
      color: 'bg-purple-500 hover:bg-purple-600'
    })
  }
  
  if (listing.is_urgent_premium) {
    badges.push({
      icon: Zap,
      label: 'Acil Premium',
      color: 'bg-red-500 hover:bg-red-600'
    })
  }
  
  return badges
}

/**
 * Get results message for listings
 */
export function getResultsMessage(
  isLoading: boolean,
  error: Error | null,
  totalCount: number
): string {
  if (isLoading) return 'Yükleniyor...'
  if (error) return 'Hata oluştu'
  if (totalCount === 0) return 'İlan bulunamadı'
  if (totalCount === 1) return '1 ilan bulundu'
  return `${totalCount.toLocaleString('tr-TR')} ilan bulundu`
}

/**
 * Get grid class names based on view type
 */
export function getGridClassName(view: 'grid-2' | 'grid-3' | 'grid-4' | 'list'): string {
  switch (view) {
    case 'list':
      return "flex flex-col gap-4 transition-all duration-300"
    case 'grid-2':
      return "grid grid-cols-1 sm:grid-cols-2 gap-6 transition-all duration-300"
    case 'grid-3':
      return "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 transition-all duration-300"
    case 'grid-4':
      return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-all duration-300"
    default:
      return "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 transition-all duration-300"
  }
}

