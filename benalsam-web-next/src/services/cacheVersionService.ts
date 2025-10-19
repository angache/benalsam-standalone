/**
 * Cache Version Service
 * Kategori değişikliklerini otomatik algılayıp cache'i temizlemek için
 */

import { categoriesServiceClient } from '@/lib/apiClient'

// Cache version storage keys
const CACHE_VERSION_KEYS = {
  CATEGORIES: 'categories_version',
  CATEGORY_COUNTS: 'category_counts_version',
  LISTINGS: 'listings_version'
}

/**
 * Cache version kontrolü yap (sadece uygulama açıldığında)
 */
export const checkCacheVersion = async (cacheKey: string): Promise<boolean> => {
  if (typeof window === 'undefined') return false

  try {
    console.log(`🔄 Checking cache version for: ${cacheKey}`)
    
    // Local storage'dan mevcut version'ı al
    const localVersion = localStorage.getItem(`${cacheKey}_version`) || '0'
    
    // Sadece uygulama açıldığında kontrol et (session-based)
    const sessionKey = `${cacheKey}_session_check`
    const hasCheckedThisSession = sessionStorage.getItem(sessionKey)
    
    if (hasCheckedThisSession) {
      console.log(`⏰ Cache version already checked this session: ${cacheKey}`)
      return false
    }
    
    // Categories Service'den güncel version'ı al
    const response = await categoriesServiceClient.get<{ 
      success: boolean
      version?: number
      data?: { version: number }
    }>('/api/v1/categories/version')
    
    const serverVersion = response.version || response.data?.version
    
    if (!serverVersion) {
      console.warn(`⚠️ Version check failed for ${cacheKey}`)
      return false
    }
    
    // Version karşılaştır
    if (localVersion !== serverVersion.toString()) {
      console.log(`🔄 Version changed for ${cacheKey}: ${localVersion} → ${serverVersion}`)
      
      // Cache temizle
      clearCache(cacheKey)
      
      // Yeni version'ı kaydet
      localStorage.setItem(`${cacheKey}_version`, serverVersion.toString())
      sessionStorage.setItem(sessionKey, 'true')
      
      return true
    }
    
    // Version aynı, session'ı işaretle
    sessionStorage.setItem(sessionKey, 'true')
    console.log(`✅ Cache version up to date: ${cacheKey}`)
    
    return false
    
  } catch (error) {
    console.error(`❌ Error checking cache version for ${cacheKey}:`, error)
    return false
  }
}

/**
 * Cache'i temizle
 */
export const clearCache = (cacheKey: string) => {
  if (typeof window === 'undefined') return

  try {
    console.log(`🗑️ Clearing cache for: ${cacheKey}`)
    
    // Local storage'dan ilgili cache'leri temizle
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.includes(cacheKey)) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
      console.log(`🗑️ Removed: ${key}`)
    })
    
  } catch (error) {
    console.error(`❌ Error clearing cache for ${cacheKey}:`, error)
  }
}

/**
 * Kategori cache version kontrolü
 */
export const checkCategoriesVersion = async (): Promise<boolean> => {
  return await checkCacheVersion(CACHE_VERSION_KEYS.CATEGORIES)
}

/**
 * Category counts cache version kontrolü
 */
export const checkCategoryCountsVersion = async (): Promise<boolean> => {
  return await checkCacheVersion(CACHE_VERSION_KEYS.CATEGORY_COUNTS)
}

/**
 * Listings cache version kontrolü
 */
export const checkListingsVersion = async (): Promise<boolean> => {
  return await checkCacheVersion(CACHE_VERSION_KEYS.LISTINGS)
}

/**
 * Tüm cache'leri temizle
 */
export const clearAllCache = () => {
  if (typeof window === 'undefined') return

  try {
    console.log('🗑️ Clearing all cache')
    
    Object.values(CACHE_VERSION_KEYS).forEach(key => {
      clearCache(key)
    })
    
    // Version bilgilerini de temizle
    const versionKeys = Object.values(CACHE_VERSION_KEYS).map(key => `${key}_version`)
    
    versionKeys.forEach(key => {
      localStorage.removeItem(key)
    })
    
    // Session storage'ı temizle
    Object.values(CACHE_VERSION_KEYS).forEach(key => {
      const sessionKey = `${key}_session_check`
      sessionStorage.removeItem(sessionKey)
    })
    
    console.log('✅ All cache cleared')
    
  } catch (error) {
    console.error('❌ Error clearing all cache:', error)
  }
}

/**
 * Cache durumunu kontrol et
 */
export const getCacheStatus = () => {
  if (typeof window === 'undefined') return {}

  const status: Record<string, any> = {}
  
  Object.values(CACHE_VERSION_KEYS).forEach(key => {
    const version = localStorage.getItem(`${key}_version`) || '0'
    const sessionKey = `${key}_session_check`
    const hasCheckedThisSession = sessionStorage.getItem(sessionKey)
    
    status[key] = {
      version: parseInt(version),
      checkedThisSession: !!hasCheckedThisSession,
      lastCheck: hasCheckedThisSession ? 'Bu session' : 'Hiç kontrol edilmedi'
    }
  })
  
  return status
}

/**
 * Manuel cache temizleme (debug için)
 */
export const forceClearCache = (cacheKey: string) => {
  if (typeof window === 'undefined') return

  console.log(`🔧 Force clearing cache: ${cacheKey}`)
  clearCache(cacheKey)
  
  // Version'ı sıfırla
  localStorage.removeItem(`${cacheKey}_version`)
  
  // Session'ı da temizle
  const sessionKey = `${cacheKey}_session_check`
  sessionStorage.removeItem(sessionKey)
}

// Debug fonksiyonları (development'ta)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).cacheVersionService = {
    checkCategoriesVersion,
    checkCategoryCountsVersion,
    checkListingsVersion,
    clearAllCache,
    getCacheStatus,
    forceClearCache
  }
}

