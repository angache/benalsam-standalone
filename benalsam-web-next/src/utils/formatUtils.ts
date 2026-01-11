/**
 * Formatting Utilities
 * 
 * Centralized formatting functions for dates, prices, and other values
 * Prevents code duplication across components
 */

import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

/**
 * Format price with Turkish locale
 * 
 * @param price - Price value (number)
 * @param currency - Currency symbol (default: '₺')
 * @returns Formatted price string
 * 
 * @example
 * formatPrice(1000) // "1.000 ₺"
 * formatPrice(1500000) // "1.500.000 ₺"
 */
export function formatPrice(price: number | null | undefined, currency: string = '₺'): string {
  if (price === null || price === undefined) {
    return 'Fiyat belirtilmemiş'
  }
  
  if (typeof price !== 'number' || isNaN(price)) {
    return 'Fiyat belirtilmemiş'
  }

  return new Intl.NumberFormat('tr-TR').format(price) + ' ' + currency
}

/**
 * Format price with abbreviated values for large amounts
 * 
 * @param price - Price value (number)
 * @returns Formatted price string with abbreviations
 * 
 * @example
 * formatPriceAbbreviated(1000000) // "1 Mn ₺"
 * formatPriceAbbreviated(50000) // "50 Bin ₺"
 */
export function formatPriceAbbreviated(price: number | null | undefined): string {
  if (price === null || price === undefined) {
    return 'Fiyat belirtilmemiş'
  }
  
  if (typeof price !== 'number' || isNaN(price)) {
    return 'Fiyat belirtilmemiş'
  }

  if (price >= 1_000_000) {
    return `${(price / 1_000_000).toFixed(1)} Mn ₺`
  } else if (price >= 1_000) {
    return `${(price / 1_000).toFixed(0)} Bin ₺`
  }
  return `${price.toLocaleString('tr-TR')} ₺`
}

/**
 * Format date as relative time (e.g., "2 hours ago")
 * Uses date-fns formatDistanceToNow with Turkish locale
 * 
 * @param dateString - Date string or Date object
 * @param options - Additional formatting options
 * @returns Formatted relative date string
 * 
 * @example
 * formatDateRelative('2024-01-01T10:00:00Z') // "2 saat önce"
 */
export function formatDateRelative(
  dateString?: string | Date,
  options?: { addSuffix?: boolean }
): string {
  if (!dateString) return ''
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    if (isNaN(date.getTime())) return ''
    
    return formatDistanceToNow(date, {
      addSuffix: options?.addSuffix ?? true,
      locale: tr,
    })
  } catch {
    return ''
  }
}

/**
 * Format date as simple relative time (without date-fns dependency)
 * 
 * @param dateString - Date string
 * @returns Formatted relative time string
 * 
 * @example
 * formatDateSimple('2024-01-01T10:00:00Z') // "2 saat önce"
 */
export function formatDateSimple(dateString: string): string {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    const diffWeeks = Math.floor(diffDays / 7)
    const diffMonths = Math.floor(diffDays / 30)
    const diffYears = Math.floor(diffDays / 365)

    if (diffYears > 0) return `${diffYears} ${diffYears === 1 ? 'yıl' : 'yıl'} önce`
    if (diffMonths > 0) return `${diffMonths} ${diffMonths === 1 ? 'ay' : 'ay'} önce`
    if (diffWeeks > 0) return `${diffWeeks} ${diffWeeks === 1 ? 'hafta' : 'hafta'} önce`
    if (diffDays > 0) return `${diffDays} ${diffDays === 1 ? 'gün' : 'gün'} önce`
    if (diffHours > 0) return `${diffHours} ${diffHours === 1 ? 'saat' : 'saat'} önce`
    if (diffMins > 0) return `${diffMins} ${diffMins === 1 ? 'dakika' : 'dakika'} önce`
    return 'Az önce'
  } catch {
    return ''
  }
}

/**
 * Format listing price (handles listing object structure)
 * 
 * @param listing - Listing object with price or budget field
 * @returns Formatted price string
 */
export function formatListingPrice(listing: {
  price?: number | null
  budget?: number | null
  currency?: string
}): string {
  const price = listing.price ?? listing.budget
  const currency = listing.currency || '₺'
  return formatPrice(price, currency)
}

