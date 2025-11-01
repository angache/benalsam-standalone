/**
 * Category Counts Cache Service
 * Caches category listing counts with version control
 */

import { cacheVersionService } from './cacheVersionService'

const CACHE_KEY = 'benalsam_category_counts'
const VERSION_KEY = 'category_counts_version'
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

interface CategoryCountsCache {
  counts: Record<number, number>
  timestamp: number
  version: string
}

class CategoryCountsCacheService {
  /**
   * Get category counts with cache
   */
  async getCategoryCounts(
    categoryIds: number[],
    fetchFn: () => Promise<Record<number, number>>
  ): Promise<Record<number, number>> {
    const perfStart = performance.now()
    console.log('🚀 [PERF] CategoryCountsCache.getCounts started', {
      categoryIds: categoryIds.length,
      timestamp: new Date().toISOString()
    })

    try {
      // Check if version changed
      const versionStart = performance.now()
      const versionChanged = await cacheVersionService.hasVersionChanged(VERSION_KEY)
      const versionTime = Math.round(performance.now() - versionStart)
      console.log('🔍 [PERF] Version check completed', { 
        versionTime: `${versionTime}ms`,
        versionChanged 
      })

      // Get cached data
      const cacheStart = performance.now()
      const cached = this.getFromCache()
      const cacheTime = Math.round(performance.now() - cacheStart)

      // If version changed, clear cache
      if (versionChanged && cached) {
        console.log('🔄 [CACHE] Version changed, clearing category counts cache')
        this.clearCache()
      }

      // Check if cache is valid
      if (cached && !versionChanged && this.isCacheValid(cached)) {
        console.log('📦 [PERF] Cache check completed', {
          cacheTime: `${cacheTime}ms`,
          cacheHit: true,
          countsCount: Object.keys(cached.counts).length
        })

        // Check if we have all requested category counts
        const missingIds = categoryIds.filter(id => cached.counts[id] === undefined)
        
        if (missingIds.length === 0) {
          const totalTime = Math.round(performance.now() - perfStart)
          console.log('✅ [PERF] Category counts loaded from cache', {
            countsCount: categoryIds.length,
            totalTime: `${totalTime}ms`
          })
          return cached.counts
        }

        // Fetch only missing counts
        console.log('⚠️ [CACHE] Partial cache hit, fetching missing counts', {
          missing: missingIds.length
        })
      } else {
        console.log('📦 [PERF] Cache check completed', {
          cacheTime: `${cacheTime}ms`,
          cacheHit: false,
          reason: cached ? 'expired' : 'empty'
        })
      }

      // Fetch fresh data
      const fetchStart = performance.now()
      const freshCounts = await fetchFn()
      const fetchTime = Math.round(performance.now() - fetchStart)
      console.log('🌐 [PERF] Fresh data fetched', {
        fetchTime: `${fetchTime}ms`,
        countsCount: Object.keys(freshCounts).length
      })

      // Merge with cached data if exists
      const mergedCounts = cached ? { ...cached.counts, ...freshCounts } : freshCounts

      // Update cache
      this.saveToCache(mergedCounts)

      // Update version timestamp
      await cacheVersionService.updateVersionTimestamp(VERSION_KEY)

      const totalTime = Math.round(performance.now() - perfStart)
      console.log('✅ [PERF] Category counts loaded and cached', {
        countsCount: Object.keys(mergedCounts).length,
        totalTime: `${totalTime}ms`
      })

      return mergedCounts
    } catch (error) {
      console.error('❌ [ERROR] CategoryCountsCache.getCounts failed:', error)
      // Return empty counts on error
      return {}
    }
  }

  /**
   * Get counts from localStorage
   */
  private getFromCache(): CategoryCountsCache | null {
    if (typeof window === 'undefined') return null

    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) return null

      return JSON.parse(cached)
    } catch (error) {
      console.error('Error reading category counts cache:', error)
      return null
    }
  }

  /**
   * Save counts to localStorage
   */
  private saveToCache(counts: Record<number, number>): void {
    if (typeof window === 'undefined') return

    try {
      const cache: CategoryCountsCache = {
        counts,
        timestamp: Date.now(),
        version: Date.now().toString()
      }

      localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
    } catch (error) {
      console.error('Error saving category counts cache:', error)
    }
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(cache: CategoryCountsCache): boolean {
    const age = Date.now() - cache.timestamp
    return age < CACHE_DURATION
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(CACHE_KEY)
  }

  /**
   * Force refresh - clear cache and version
   */
  async forceRefresh(): Promise<void> {
    this.clearCache()
    await cacheVersionService.clearVersionTimestamp(VERSION_KEY)
  }
}

export const categoryCountsCacheService = new CategoryCountsCacheService()

