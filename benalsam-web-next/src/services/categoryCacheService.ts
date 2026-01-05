import { Category } from './categoryService'
import { checkCategoriesVersion } from './cacheVersionService'
import { logger } from '@/utils/production-logger'

// Cache configuration
const CACHE_KEY = 'benalsam_categories_next_v1.0.0'
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes
const RATE_LIMIT = 60 * 1000 // 1 minute between API calls

interface CachedData {
  data: Category[]
  timestamp: number
  version: string
}

class CategoryCacheService {
  private lastFetchTime = 0
  private isFetching = false

  /**
   * Get categories from cache or API
   */
  async getCategories(fetchFn: () => Promise<Category[]>): Promise<Category[]> {
    const startTime = Date.now()
    try {
      logger.debug('[CategoryCache] getCategories started', {
        timestamp: new Date().toISOString()
      })

      // 🔄 Backend'den version kontrolü yap (sadece ilk seferde)
      const versionStart = Date.now()
      const versionChanged = await checkCategoriesVersion()
      const versionTime = Date.now() - versionStart
      
      logger.debug('[CategoryCache] Version check completed', {
        versionTime: `${versionTime}ms`,
        versionChanged
      })

      if (versionChanged) {
        logger.debug('[CategoryCache] Category version changed, clearing cache')
        this.clearCache()
      }

      // Check if we're already fetching
      if (this.isFetching) {
        logger.debug('[CategoryCache] Category fetch already in progress, waiting')
        await this.waitForFetch()
        return this.getCachedData()
      }

      // Check rate limiting
      const now = Date.now()
      if (now - this.lastFetchTime < RATE_LIMIT) {
        logger.debug('[CategoryCache] Rate limit active, using cached data', {
          timeSinceLastFetch: `${now - this.lastFetchTime}ms`
        })
        const cached = this.getCachedData()
        if (cached && cached.length > 0) {
          logger.debug('[CategoryCache] Returned cached data (rate limited)', {
            categoryCount: cached.length,
            totalTime: `${Date.now() - startTime}ms`
          })
          return cached
        }
      }

      // Try to get from cache first
      const cacheStart = Date.now()
      const cached = this.getCachedData()
      const cacheTime = Date.now() - cacheStart
      
      logger.debug('[CategoryCache] Cache check completed', {
        cacheTime: `${cacheTime}ms`,
        cacheHit: !!(cached && cached.length > 0),
        categoryCount: cached?.length || 0
      })

      if (cached && cached.length > 0) {
        logger.debug('[CategoryCache] Categories loaded from cache', {
          categoryCount: cached.length,
          totalTime: `${Date.now() - startTime}ms`
        })
        return cached
      }

      logger.debug('[CategoryCache] Cache miss - fetching from API')
      // Fetch from API
      return await this.fetchFromAPI(fetchFn)
    } catch (error) {
      const totalTime = Date.now() - startTime
      logger.error('[CategoryCache] Error in getCategories', {
        error,
        totalTime: `${totalTime}ms`
      })
      
      // Fallback to cached data if available
      const cached = this.getCachedData()
      if (cached && cached.length > 0) {
        logger.debug('[CategoryCache] Falling back to cached data', {
          categoryCount: cached.length,
          totalTime: `${totalTime}ms`
        })
        return cached
      }
      
      throw error
    }
  }

  /**
   * Fetch categories from API
   */
  private async fetchFromAPI(fetchFn: () => Promise<Category[]>): Promise<Category[]> {
    const startTime = Date.now()
    this.isFetching = true
    this.lastFetchTime = Date.now()

    try {
      logger.debug('[CategoryCache] Fetching categories from API', {
        timestamp: new Date().toISOString()
      })
      
      const fetchStart = Date.now()
      const categories = await fetchFn()
      const fetchTime = Date.now() - fetchStart
      
      logger.debug('[CategoryCache] API fetch completed', {
        fetchTime: `${fetchTime}ms`,
        categoryCount: categories.length
      })
      
      // Cache the data
      const cacheStart = Date.now()
      this.setCachedData(categories)
      const cacheTime = Date.now() - cacheStart
      
      const totalTime = Date.now() - startTime
      logger.debug('[CategoryCache] fetchFromAPI completed', {
        totalTime: `${totalTime}ms`,
        breakdown: {
          apiFetch: `${fetchTime}ms`,
          cacheSet: `${cacheTime}ms`
        },
        categoryCount: categories.length
      })
      
      return categories
    } catch (error) {
      const totalTime = Date.now() - startTime
      logger.error('[CategoryCache] Error fetching from API', {
        error,
        totalTime: `${totalTime}ms`
      })
      throw error
    } finally {
      this.isFetching = false
    }
  }

  /**
   * Get cached data from localStorage
   */
  private getCachedData(): Category[] {
    if (typeof window === 'undefined') return []

    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) return []

      const parsed: CachedData = JSON.parse(cached)
      
      // Check if cache is expired
      if (Date.now() - parsed.timestamp > CACHE_TTL) {
        logger.debug('[CategoryCache] Cache expired, will fetch fresh data')
        return []
      }

      // Check version compatibility
      if (parsed.version !== 'v1.0.0') {
        logger.debug('[CategoryCache] Cache version mismatch, clearing cache')
        this.clearCache()
        return []
      }

      return parsed.data
    } catch (error) {
      logger.error('[CategoryCache] Error reading cache', { error })
      this.clearCache()
      return []
    }
  }

  /**
   * Set data in cache
   */
  private setCachedData(categories: Category[]): void {
    if (typeof window === 'undefined') return

    try {
      const cacheData: CachedData = {
        data: categories,
        timestamp: Date.now(),
        version: 'v1.0.0'
      }
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
      logger.debug('[CategoryCache] Categories cached successfully')
    } catch (error) {
      logger.error('[CategoryCache] Error setting cache', { error })
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(CACHE_KEY)
      logger.debug('[CategoryCache] Category cache cleared')
    } catch (error) {
      logger.error('[CategoryCache] Error clearing cache', { error })
    }
  }

  /**
   * Refresh cache (force fetch from API)
   */
  async refresh(fetchFn: () => Promise<Category[]>): Promise<Category[]> {
    logger.debug('[CategoryCache] Forcing category refresh')
    this.clearCache()
    this.lastFetchTime = 0
    return await this.fetchFromAPI(fetchFn)
  }

  /**
   * Wait for current fetch to complete
   */
  private async waitForFetch(): Promise<void> {
    return new Promise((resolve) => {
      const checkFetching = () => {
        if (!this.isFetching) {
          resolve()
        } else {
          setTimeout(checkFetching, 100)
        }
      }
      checkFetching()
    })
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { hasCache: boolean; cacheAge: number | null; cacheSize: number } {
    if (typeof window === 'undefined') {
      return { hasCache: false, cacheAge: null, cacheSize: 0 }
    }

    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) {
        return { hasCache: false, cacheAge: null, cacheSize: 0 }
      }

      const parsed: CachedData = JSON.parse(cached)
      const cacheAge = Date.now() - parsed.timestamp
      const cacheSize = cached.length

      return {
        hasCache: true,
        cacheAge,
        cacheSize
      }
    } catch (error) {
      return { hasCache: false, cacheAge: null, cacheSize: 0 }
    }
  }
}

// Export singleton instance
export const categoryCacheService = new CategoryCacheService()
export default categoryCacheService

