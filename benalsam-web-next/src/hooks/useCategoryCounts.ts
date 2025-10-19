'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { categoriesServiceClient } from '@/lib/apiClient'
import { checkCategoryCountsVersion } from '@/services/cacheVersionService'

// Cache configuration
const CACHE_KEY = 'category_counts_cache_v1'
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes
const RATE_LIMIT = 30 * 1000 // 30 seconds

interface CategoryCounts {
  [categoryId: string]: number
  all?: number
}

export const useCategoryCounts = () => {
  const [categoryCounts, setCategoryCounts] = useState<CategoryCounts>({})
  const [isLoading, setIsLoading] = useState(true)
  const lastFetchTime = useRef(0)
  const isInitialized = useRef(false)

  // Get cached data from localStorage
  const getCachedCategoryCounts = useCallback(() => {
    if (typeof window === 'undefined') return null

    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) return null
      
      const { data, timestamp } = JSON.parse(cached)
      const now = Date.now()
      
      // Check if cache is expired
      if (now - timestamp > CACHE_TTL) {
        localStorage.removeItem(CACHE_KEY)
        return null
      }

      // Guard: ignore partial caches (must contain 'all' or at least 2 keys)
      if (!data || typeof data !== 'object' || Object.keys(data).length < 2) {
        localStorage.removeItem(CACHE_KEY)
        return null
      }

      return data
    } catch (error) {
      console.error('Error reading from cache:', error)
      return null
    }
  }, [])

  // Set cached data to localStorage
  const setCachedCategoryCounts = useCallback((data: CategoryCounts) => {
    if (typeof window === 'undefined') return

    try {
      // Guard: don't cache empty objects
      if (!data || Object.keys(data).length === 0) {
        return
      }

      const cacheData = {
        data,
        timestamp: Date.now()
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
      console.log('💾 Category counts cached successfully')
    } catch (error) {
      console.error('Error writing to cache:', error)
    }
  }, [])

  // Fetch category counts from Categories Service
  const fetchCategoryCountsFromService = useCallback(async () => {
    try {
      const response = await categoriesServiceClient.get<{ 
        success: boolean
        data?: CategoryCounts
        counts?: CategoryCounts
      }>('/api/v1/categories/counts')
      
      if (response.counts) return response.counts
      if (response.data) return response.data
      
      return {}
    } catch (error) {
      console.error('Error fetching category counts from service:', error)
      return null
    }
  }, [])

  // Main fetch function
  const fetchCategoryCounts = useCallback(async () => {
    try {
      // 🔄 Backend'den version kontrolü yap (sadece ilk seferde)
      const versionChanged = await checkCategoryCountsVersion()
      if (versionChanged) {
        console.log('🔄 Category counts version changed, clearing cache')
        if (typeof window !== 'undefined') {
          localStorage.removeItem(CACHE_KEY)
        }
      }

      // Rate limiting check
      const now = Date.now()
      if (now - lastFetchTime.current < RATE_LIMIT) {
        console.log('⏱️ Rate limit active, using cached data')
        const cached = getCachedCategoryCounts()
        if (cached) return cached
      }

      // 1. Check local cache
      const localCached = getCachedCategoryCounts()
      if (localCached) {
        console.log('📦 Category counts loaded from local cache')
        return localCached
      }
      
      lastFetchTime.current = now
      
      // 2. Fetch from Categories Service
      const serviceCounts = await fetchCategoryCountsFromService()
      
      if (serviceCounts && Object.keys(serviceCounts).length > 0) {
        console.log('💾 Caching service counts:', serviceCounts)
        setCachedCategoryCounts(serviceCounts)
        return serviceCounts
      }
      
      return {}
    } catch (error) {
      console.error('Error in fetchCategoryCounts:', error)
      return {}
    }
  }, [getCachedCategoryCounts, fetchCategoryCountsFromService, setCachedCategoryCounts])

  // Get count for a specific category ID
  const getCategoryCount = useCallback((categoryId?: string | null) => {
    // Support: undefined/null or explicit 'all'
    const isAll = categoryId === undefined || categoryId === null || categoryId === 'all'
    
    if (isAll) {
      // Prefer 'all' from service; fallback to sum of numeric ids only
      if (categoryCounts && typeof categoryCounts.all === 'number') {
        return categoryCounts.all
      }
      return Object.entries(categoryCounts)
        .filter(([k]) => k !== 'all')
        .reduce((sum, [, v]) => sum + (typeof v === 'number' ? v : 0), 0)
    }

    const key = String(categoryId)
    const count = categoryCounts[key] || 0
    return count
  }, [categoryCounts])

  // Load category counts on mount
  useEffect(() => {
    const loadCategoryCounts = async () => {
      if (isInitialized.current) return
      
      setIsLoading(true)
      const counts = await fetchCategoryCounts()
      setCategoryCounts(counts)
      setIsLoading(false)
      isInitialized.current = true
    }
    
    loadCategoryCounts()
  }, [fetchCategoryCounts])

  // Calculate total listings
  const totalListings = useMemo(() => {
    if (categoryCounts.all) return categoryCounts.all
    return Object.values(categoryCounts).reduce((sum, count) => sum + (count || 0), 0)
  }, [categoryCounts])

  return {
    categoryCounts,
    getCategoryCount,
    isLoading,
    totalListings,
    clearCache: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(CACHE_KEY)
        isInitialized.current = false
      }
    },
    refresh: async () => {
      isInitialized.current = false
      lastFetchTime.current = 0
      setIsLoading(true)
      const counts = await fetchCategoryCounts()
      setCategoryCounts(counts)
      setIsLoading(false)
    }
  }
}

