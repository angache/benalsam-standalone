/**
 * Cache Version Service
 * Kategori değişikliklerini otomatik algılayıp cache'i temizlemek için
 * 
 * @author Benalsam Team
 * @date 2025-08-27
 */

import { supabase } from '@/lib/supabaseClient';

// Cache version storage keys
const CACHE_VERSION_KEYS = {
  CATEGORIES: 'categories_version',
  CATEGORY_COUNTS: 'category_counts_version',
  LISTINGS: 'listings_version'
};

/**
 * Cache version kontrolü yap (sadece uygulama açıldığında)
 * @param {string} cacheKey - Cache anahtarı
 * @returns {Promise<boolean>} - Version değişti mi?
 */
export const checkCacheVersion = async (cacheKey) => {
  try {
    console.log(`🔄 Checking cache version for: ${cacheKey}`);
    
    // Local storage'dan mevcut version'ı al
    const localVersion = localStorage.getItem(`${cacheKey}_version`) || '0';
    const lastCheck = localStorage.getItem(`${cacheKey}_last_check`) || '0';
    
    // Sadece uygulama açıldığında kontrol et (session-based)
    const sessionKey = `${cacheKey}_session_${Date.now()}`;
    const hasCheckedThisSession = sessionStorage.getItem(sessionKey);
    
    if (hasCheckedThisSession) {
      console.log(`⏰ Cache version already checked this session: ${cacheKey}`);
      return false;
    }
    
    // Backend'den güncel version'ı al
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1';
    const response = await fetch(`${apiUrl}/categories/version`);
    
    if (!response.ok) {
      console.warn(`⚠️ Failed to fetch version for ${cacheKey}:`, response.status);
      return false;
    }
    
    const { success, version } = await response.json();
    
    if (!success) {
      console.warn(`⚠️ Version check failed for ${cacheKey}`);
      return false;
    }
    
    // Version karşılaştır
    if (localVersion !== version.toString()) {
      console.log(`🔄 Version changed for ${cacheKey}: ${localVersion} → ${version}`);
      
      // Cache temizle
      clearCache(cacheKey);
      
      // Yeni version'ı kaydet
      localStorage.setItem(`${cacheKey}_version`, version.toString());
      sessionStorage.setItem(sessionKey, 'true');
      
      return true;
    }
    
    // Version aynı, session'ı işaretle
    sessionStorage.setItem(sessionKey, 'true');
    console.log(`✅ Cache version up to date: ${cacheKey}`);
    
    return false;
    
  } catch (error) {
    console.error(`❌ Error checking cache version for ${cacheKey}:`, error);
    return false;
  }
};

/**
 * Cache'i temizle
 * @param {string} cacheKey - Cache anahtarı
 */
export const clearCache = (cacheKey) => {
  try {
    console.log(`🗑️ Clearing cache for: ${cacheKey}`);
    
    // Local storage'dan ilgili cache'leri temizle
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(cacheKey)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Removed: ${key}`);
    });
    
    // React Query cache'ini de temizle (eğer varsa)
    if (window.queryClient) {
      window.queryClient.invalidateQueries({ queryKey: [cacheKey] });
      console.log(`🔄 React Query cache invalidated for: ${cacheKey}`);
    }
    
  } catch (error) {
    console.error(`❌ Error clearing cache for ${cacheKey}:`, error);
  }
};

/**
 * Kategori cache version kontrolü
 * @returns {Promise<boolean>} - Version değişti mi?
 */
export const checkCategoriesVersion = async () => {
  return await checkCacheVersion(CACHE_VERSION_KEYS.CATEGORIES);
};

/**
 * Category counts cache version kontrolü
 * @returns {Promise<boolean>} - Version değişti mi?
 */
export const checkCategoryCountsVersion = async () => {
  return await checkCacheVersion(CACHE_VERSION_KEYS.CATEGORY_COUNTS);
};

/**
 * Listings cache version kontrolü
 * @returns {Promise<boolean>} - Version değişti mi?
 */
export const checkListingsVersion = async () => {
  return await checkCacheVersion(CACHE_VERSION_KEYS.LISTINGS);
};

/**
 * Tüm cache'leri temizle
 */
export const clearAllCache = () => {
  try {
    console.log('🗑️ Clearing all cache');
    
    Object.values(CACHE_VERSION_KEYS).forEach(key => {
      clearCache(key);
    });
    
    // Version bilgilerini de temizle
    const versionKeys = Object.values(CACHE_VERSION_KEYS).map(key => `${key}_version`);
    
    versionKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Session storage'ı temizle
    Object.values(CACHE_VERSION_KEYS).forEach(key => {
      const sessionKey = `${key}_session_${Date.now()}`;
      sessionStorage.removeItem(sessionKey);
    });
    
    console.log('✅ All cache cleared');
    
  } catch (error) {
    console.error('❌ Error clearing all cache:', error);
  }
};

/**
 * Cache durumunu kontrol et
 * @returns {Object} - Cache durumu
 */
export const getCacheStatus = () => {
  const status = {};
  
  Object.values(CACHE_VERSION_KEYS).forEach(key => {
    const version = localStorage.getItem(`${key}_version`) || '0';
    const sessionKey = `${key}_session_${Date.now()}`;
    const hasCheckedThisSession = sessionStorage.getItem(sessionKey);
    
    status[key] = {
      version: parseInt(version),
      checkedThisSession: !!hasCheckedThisSession,
      lastCheck: hasCheckedThisSession ? 'Bu session' : 'Hiç kontrol edilmedi'
    };
  });
  
  return status;
};

/**
 * Manuel cache temizleme (debug için)
 */
export const forceClearCache = (cacheKey) => {
  console.log(`🔧 Force clearing cache: ${cacheKey}`);
  clearCache(cacheKey);
  
  // Version'ı sıfırla
  localStorage.removeItem(`${cacheKey}_version`);
  
  // Session'ı da temizle
  const sessionKey = `${cacheKey}_session_${Date.now()}`;
  sessionStorage.removeItem(sessionKey);
};

// Debug fonksiyonları (development'ta)
if (process.env.NODE_ENV === 'development') {
  window.cacheVersionService = {
    checkCategoriesVersion,
    checkCategoryCountsVersion,
    checkListingsVersion,
    clearAllCache,
    getCacheStatus,
    forceClearCache
  };
}
