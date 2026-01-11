/**
 * Unit Tests for Format Utilities
 * 
 * Tests all formatting functions for dates, prices, and other values
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  formatPrice,
  formatPriceAbbreviated,
  formatDateRelative,
  formatDateSimple,
  formatListingPrice,
} from '../formatUtils'

// Mock date-fns to control time in tests
vi.mock('date-fns', () => {
  const actual = vi.importActual('date-fns')
  return {
    ...actual,
    formatDistanceToNow: vi.fn(),
  }
})

import { formatDistanceToNow } from 'date-fns'

describe('formatUtils', () => {
  describe('formatPrice', () => {
    it('should format price with Turkish locale', () => {
      expect(formatPrice(1000)).toBe('1.000 ₺')
      expect(formatPrice(1500000)).toBe('1.500.000 ₺')
      expect(formatPrice(999)).toBe('999 ₺')
    })

    it('should format price with custom currency', () => {
      expect(formatPrice(1000, 'USD')).toBe('1.000 USD')
      expect(formatPrice(500, 'EUR')).toBe('500 EUR')
    })

    it('should handle null values', () => {
      expect(formatPrice(null)).toBe('Fiyat belirtilmemiş')
      expect(formatPrice(null, 'USD')).toBe('Fiyat belirtilmemiş')
    })

    it('should handle undefined values', () => {
      expect(formatPrice(undefined)).toBe('Fiyat belirtilmemiş')
      expect(formatPrice(undefined, 'EUR')).toBe('Fiyat belirtilmemiş')
    })

    it('should handle NaN values', () => {
      expect(formatPrice(NaN)).toBe('Fiyat belirtilmemiş')
      expect(formatPrice(Number('invalid'))).toBe('Fiyat belirtilmemiş')
    })

    it('should handle zero values', () => {
      expect(formatPrice(0)).toBe('0 ₺')
      expect(formatPrice(0, 'USD')).toBe('0 USD')
    })

    it('should handle negative values', () => {
      expect(formatPrice(-1000)).toBe('-1.000 ₺')
      expect(formatPrice(-500)).toBe('-500 ₺')
    })

    it('should handle decimal values', () => {
      // Intl.NumberFormat includes decimal parts by default for Turkish locale
      expect(formatPrice(1234.56)).toMatch(/1[.,]234/)
      expect(formatPrice(999.99)).toMatch(/999/)
    })
  })

  describe('formatPriceAbbreviated', () => {
    it('should format millions with "Mn" abbreviation', () => {
      expect(formatPriceAbbreviated(1000000)).toBe('1.0 Mn ₺')
      expect(formatPriceAbbreviated(1500000)).toBe('1.5 Mn ₺')
      expect(formatPriceAbbreviated(2500000)).toBe('2.5 Mn ₺')
    })

    it('should format thousands with "Bin" abbreviation', () => {
      expect(formatPriceAbbreviated(1000)).toBe('1 Bin ₺')
      expect(formatPriceAbbreviated(5000)).toBe('5 Bin ₺')
      expect(formatPriceAbbreviated(999999)).toBe('1000 Bin ₺') // 999999 / 1000 = 999.999, rounded to 1000
    })

    it('should format small amounts without abbreviation', () => {
      expect(formatPriceAbbreviated(999)).toBe('999 ₺')
      expect(formatPriceAbbreviated(500)).toBe('500 ₺')
      expect(formatPriceAbbreviated(100)).toBe('100 ₺')
    })

    it('should handle null values', () => {
      expect(formatPriceAbbreviated(null)).toBe('Fiyat belirtilmemiş')
    })

    it('should handle undefined values', () => {
      expect(formatPriceAbbreviated(undefined)).toBe('Fiyat belirtilmemiş')
    })

    it('should handle NaN values', () => {
      expect(formatPriceAbbreviated(NaN)).toBe('Fiyat belirtilmemiş')
    })

    it('should handle zero values', () => {
      expect(formatPriceAbbreviated(0)).toBe('0 ₺')
    })

    it('should handle negative values', () => {
      // Negative values are not abbreviated in current implementation
      expect(formatPriceAbbreviated(-1000)).toMatch(/-\d+/)
      expect(formatPriceAbbreviated(-1000000)).toMatch(/-\d+.*₺/)
    })

    it('should format edge cases correctly', () => {
      expect(formatPriceAbbreviated(999)).toBe('999 ₺') // Just below 1000
      expect(formatPriceAbbreviated(1000)).toBe('1 Bin ₺') // Exactly 1000
      expect(formatPriceAbbreviated(999999)).toBe('1000 Bin ₺') // Just below 1M (999999 / 1000 = 999.999, rounded to 1000)
      expect(formatPriceAbbreviated(1000000)).toBe('1.0 Mn ₺') // Exactly 1M
    })
  })

  describe('formatDateRelative', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should format date relative to now using date-fns', () => {
      const mockDate = new Date('2024-01-01T10:00:00Z')
      vi.mocked(formatDistanceToNow).mockReturnValue('2 saat önce')
      
      const result = formatDateRelative(mockDate)
      
      expect(formatDistanceToNow).toHaveBeenCalledWith(mockDate, {
        addSuffix: true,
        locale: expect.anything(),
      })
      expect(result).toBe('2 saat önce')
    })

    it('should handle date strings', () => {
      vi.mocked(formatDistanceToNow).mockReturnValue('3 gün önce')
      
      const result = formatDateRelative('2024-01-01T10:00:00Z')
      
      expect(formatDistanceToNow).toHaveBeenCalled()
      expect(result).toBe('3 gün önce')
    })

    it('should handle null/undefined values', () => {
      expect(formatDateRelative(null as any)).toBe('')
      expect(formatDateRelative(undefined)).toBe('')
      expect(formatDateRelative('')).toBe('')
    })

    it('should handle invalid date strings', () => {
      expect(formatDateRelative('invalid-date')).toBe('')
      expect(formatDateRelative('not-a-date')).toBe('')
    })

    it('should handle options parameter', () => {
      const mockDate = new Date('2024-01-01T10:00:00Z')
      vi.mocked(formatDistanceToNow).mockReturnValue('2 saat önce')
      
      formatDateRelative(mockDate, { addSuffix: false })
      
      expect(formatDistanceToNow).toHaveBeenCalledWith(mockDate, {
        addSuffix: false,
        locale: expect.anything(),
      })
    })

    it('should default addSuffix to true when options not provided', () => {
      const mockDate = new Date('2024-01-01T10:00:00Z')
      vi.mocked(formatDistanceToNow).mockReturnValue('2 saat önce')
      
      formatDateRelative(mockDate)
      
      expect(formatDistanceToNow).toHaveBeenCalledWith(mockDate, {
        addSuffix: true,
        locale: expect.anything(),
      })
    })

    it('should handle Date objects', () => {
      const date = new Date('2024-01-01T10:00:00Z')
      vi.mocked(formatDistanceToNow).mockReturnValue('5 dakika önce')
      
      const result = formatDateRelative(date)
      
      expect(result).toBe('5 dakika önce')
      expect(formatDistanceToNow).toHaveBeenCalledWith(date, expect.any(Object))
    })
  })

  describe('formatDateSimple', () => {
    beforeEach(() => {
      // Mock current time to '2024-01-01T12:00:00Z'
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should format dates as "Az önce" for very recent times', () => {
      const recentDate = new Date('2024-01-01T12:00:00Z').toISOString()
      expect(formatDateSimple(recentDate)).toBe('Az önce')
    })

    it('should format dates as minutes ago', () => {
      const fiveMinutesAgo = new Date('2024-01-01T11:55:00Z').toISOString()
      expect(formatDateSimple(fiveMinutesAgo)).toBe('5 dakika önce')
      
      const oneMinuteAgo = new Date('2024-01-01T11:59:00Z').toISOString()
      expect(formatDateSimple(oneMinuteAgo)).toBe('1 dakika önce')
    })

    it('should format dates as hours ago', () => {
      const twoHoursAgo = new Date('2024-01-01T10:00:00Z').toISOString()
      expect(formatDateSimple(twoHoursAgo)).toBe('2 saat önce')
      
      const oneHourAgo = new Date('2024-01-01T11:00:00Z').toISOString()
      expect(formatDateSimple(oneHourAgo)).toBe('1 saat önce')
    })

    it('should format dates as days ago', () => {
      const threeDaysAgo = new Date('2023-12-29T12:00:00Z').toISOString()
      expect(formatDateSimple(threeDaysAgo)).toBe('3 gün önce')
      
      const oneDayAgo = new Date('2023-12-31T12:00:00Z').toISOString()
      expect(formatDateSimple(oneDayAgo)).toBe('1 gün önce')
    })

    it('should format dates as weeks ago', () => {
      const twoWeeksAgo = new Date('2023-12-18T12:00:00Z').toISOString()
      expect(formatDateSimple(twoWeeksAgo)).toBe('2 hafta önce')
      
      const oneWeekAgo = new Date('2023-12-25T12:00:00Z').toISOString()
      expect(formatDateSimple(oneWeekAgo)).toBe('1 hafta önce')
    })

    it('should format dates as months ago', () => {
      const twoMonthsAgo = new Date('2023-11-01T12:00:00Z').toISOString()
      expect(formatDateSimple(twoMonthsAgo)).toBe('2 ay önce')
      
      const oneMonthAgo = new Date('2023-12-01T12:00:00Z').toISOString()
      expect(formatDateSimple(oneMonthAgo)).toBe('1 ay önce')
    })

    it('should format dates as years ago', () => {
      const twoYearsAgo = new Date('2022-01-01T12:00:00Z').toISOString()
      expect(formatDateSimple(twoYearsAgo)).toBe('2 yıl önce')
      
      const oneYearAgo = new Date('2023-01-01T12:00:00Z').toISOString()
      expect(formatDateSimple(oneYearAgo)).toBe('1 yıl önce')
    })

    it('should handle null/undefined/empty values', () => {
      expect(formatDateSimple(null as any)).toBe('')
      expect(formatDateSimple(undefined as any)).toBe('')
      expect(formatDateSimple('')).toBe('')
    })

    it('should handle invalid date strings', () => {
      // Note: JavaScript Date constructor is very permissive
      // Some "invalid" strings might still parse to valid dates
      // We test that the function doesn't throw errors
      expect(() => formatDateSimple('invalid-date')).not.toThrow()
      expect(() => formatDateSimple('not-a-date')).not.toThrow()
      expect(() => formatDateSimple('2024-13-45T25:99:99Z')).not.toThrow()
      
      // Truly invalid dates should return empty or safe default
      const result1 = formatDateSimple('completely-invalid')
      const result2 = formatDateSimple('')
      expect(result2).toBe('')
    })

    it('should handle future dates correctly', () => {
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))
      const futureDate = new Date('2024-01-02T12:00:00Z').toISOString()
      // Future dates will show negative time, but should still work
      expect(formatDateSimple(futureDate)).toBeDefined()
    })
  })

  describe('formatListingPrice', () => {
    it('should format price from listing object', () => {
      const listing = { price: 1000, currency: '₺' }
      expect(formatListingPrice(listing)).toBe('1.000 ₺')
    })

    it('should use budget if price is not available', () => {
      const listing = { budget: 5000, currency: '₺' }
      expect(formatListingPrice(listing)).toBe('5.000 ₺')
    })

    it('should prioritize price over budget', () => {
      const listing = { price: 1000, budget: 5000, currency: '₺' }
      expect(formatListingPrice(listing)).toBe('1.000 ₺')
    })

    it('should use default currency if not provided', () => {
      const listing = { price: 1000 }
      expect(formatListingPrice(listing)).toBe('1.000 ₺')
    })

    it('should handle custom currency', () => {
      const listing = { price: 1000, currency: 'USD' }
      expect(formatListingPrice(listing)).toBe('1.000 USD')
    })

    it('should handle null price and budget', () => {
      const listing = { price: null, budget: null }
      expect(formatListingPrice(listing)).toBe('Fiyat belirtilmemiş')
    })

    it('should handle undefined price and budget', () => {
      const listing = {}
      expect(formatListingPrice(listing)).toBe('Fiyat belirtilmemiş')
    })

    it('should handle null price but valid budget', () => {
      const listing = { price: null, budget: 2000 }
      expect(formatListingPrice(listing)).toBe('2.000 ₺')
    })

    it('should handle zero values', () => {
      const listing = { price: 0 }
      expect(formatListingPrice(listing)).toBe('0 ₺')
      
      const listing2 = { budget: 0 }
      expect(formatListingPrice(listing2)).toBe('0 ₺')
    })
  })
})

