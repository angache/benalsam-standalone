import AsyncStorage from '@react-native-async-storage/async-storage';
import { safeGenerateListing as generateWithOpenAI } from './openaiService';
import { safeGenerateListing as generateWithGemini } from './geminiService';
import { safeGenerateListing as generateWithDeepSeek } from './deepseekService';
import { matchAICategory, CategorySuggestion } from './categoryMatcher';

// AI listing response interface
interface AIListingResponse {
  title: string;
  description: string;
  category: string;
  suggestedPrice: number;
  condition: string[];
  features: string[];
  tags: string[];
  categorySuggestions?: CategorySuggestion; // Kategori önerileri eklendi
}

// Cache item interface
interface CacheItem {
  data: AIListingResponse;
  timestamp: number;
  serviceUsed: string;
  size: number;
  hitCount: number;
}

// User usage interface (AsyncStorage için)
interface UserUsage {
  userId: string;
  monthKey: string;
  attempts: number;
  lastAttempt: number;
  isPremium: boolean;
}

// AI service configuration interface
interface AIServiceConfig {
  name: string;
  priority: number;
  generate: (userDescription: string) => Promise<AIListingResponse>;
  isAvailable: () => boolean;
  estimatedCostPerRequest: number; // Token maliyeti tahmini
}

// Cache configuration
const CACHE_KEY_PREFIX = 'ai_cache_';
const CACHE_KEYS_KEY = 'ai_cache_keys';
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 saat

// Kullanıcı kullanım limitleri
const USAGE_KEY_PREFIX = 'ai_usage_';
const FREE_ATTEMPTS_PER_MONTH = 30; // Ücretsiz kullanıcılar için aylık hak
const PREMIUM_ATTEMPTS_PER_MONTH = -1; // Premium kullanıcılar için sınırsız

// Memory cache (hızlı erişim için)
const memoryCache = new Map<string, CacheItem>();

// Batch processing queue
let batchQueue: Array<{
  userDescription: string;
  resolve: (result: { result: AIListingResponse; serviceUsed: string; isMockService: boolean; }) => void;
  reject: (error: Error) => void;
}> = [];

let isProcessingBatch = false;

// AI servislerinin konfigürasyonu - token optimizasyonu ile
const AI_SERVICES: AIServiceConfig[] = [
  {
    name: 'OpenAI',
    priority: 1,
    generate: generateWithOpenAI,
    isAvailable: () => !!process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    estimatedCostPerRequest: 0.0002
  },
  {
    name: 'Gemini',
    priority: 2,
    generate: generateWithGemini,
    isAvailable: () => !!process.env.EXPO_PUBLIC_GEMINI_API_KEY,
    estimatedCostPerRequest: 0.0001 // Daha ucuz
  },
  {
    name: 'DeepSeek',
    priority: 3,
    generate: generateWithDeepSeek,
    isAvailable: () => !!process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY,
    estimatedCostPerRequest: 0.00015
  }
];

// Kullanıcı kullanımını kontrol et - AsyncStorage ile
const checkUserUsage = async (userId: string, isPremium: boolean = false): Promise<{
  canUse: boolean;
  attemptsLeft: number;
  totalAttempts: number;
  currentMonth: string;
}> => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const usageKey = USAGE_KEY_PREFIX + userId + '_' + currentMonth;
    
    const usageData = await AsyncStorage.getItem(usageKey);
    let usage: UserUsage;
    
    if (usageData) {
      usage = JSON.parse(usageData);
    } else {
      usage = {
        userId,
        monthKey: currentMonth,
        attempts: 0,
        lastAttempt: Date.now(),
        isPremium
      };
    }
    
    // Premium kullanıcılar sınırsız
    if (isPremium) {
      return {
        canUse: true,
        attemptsLeft: -1, // Sınırsız
        totalAttempts: usage.attempts,
        currentMonth
      };
    }
    
    // Ücretsiz kullanıcılar için aylık limit kontrolü
    const attemptsLeft = FREE_ATTEMPTS_PER_MONTH - usage.attempts;
    const canUse = attemptsLeft > 0;
    
    console.log(`📊 Usage check for ${userId}: ${usage.attempts}/${FREE_ATTEMPTS_PER_MONTH} used, ${attemptsLeft} left`);
    
    return {
      canUse,
      attemptsLeft,
      totalAttempts: usage.attempts,
      currentMonth
    };
  } catch (error) {
    console.error('❌ Usage check error:', error);
    // Hata durumunda kullanıma izin ver
    return {
      canUse: true,
      attemptsLeft: 30,
      totalAttempts: 0,
      currentMonth: new Date().toISOString().slice(0, 7)
    };
  }
};

// Kullanıcı kullanımını kaydet - AsyncStorage ile
const recordUserUsage = async (userId: string, isPremium: boolean = false): Promise<void> => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const usageKey = USAGE_KEY_PREFIX + userId + '_' + currentMonth;
    
    const usageData = await AsyncStorage.getItem(usageKey);
    let usage: UserUsage;
    
    if (usageData) {
      usage = JSON.parse(usageData);
    } else {
      usage = {
        userId,
        monthKey: currentMonth,
        attempts: 0,
        lastAttempt: Date.now(),
        isPremium
      };
    }
    
    // Kullanımı artır
    usage.attempts += 1;
    usage.lastAttempt = Date.now();
    usage.isPremium = isPremium;
    
    await AsyncStorage.setItem(usageKey, JSON.stringify(usage));
    
    console.log(`📝 Usage recorded for ${userId}: ${usage.attempts} attempts this month`);
  } catch (error) {
    console.error('❌ Usage record error:', error);
  }
};

// Kullanıcı kullanım istatistiklerini al - AsyncStorage ile
export const getUserUsageStats = async (userId: string): Promise<{
  attempts: number;
  attemptsLeft: number;
  isPremium: boolean;
  canUse: boolean;
  currentMonth: string;
  monthlyLimit: number;
}> => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const usageKey = USAGE_KEY_PREFIX + userId + '_' + currentMonth;
    
    const usageData = await AsyncStorage.getItem(usageKey);
    let usage: UserUsage;
    
    if (usageData) {
      usage = JSON.parse(usageData);
    } else {
      usage = {
        userId,
        monthKey: currentMonth,
        attempts: 0,
        lastAttempt: Date.now(),
        isPremium: false // Mock kullanıcı için false
      };
    }
    
    const monthlyLimit = usage.isPremium ? PREMIUM_ATTEMPTS_PER_MONTH : FREE_ATTEMPTS_PER_MONTH;
    const attemptsLeft = usage.isPremium ? -1 : FREE_ATTEMPTS_PER_MONTH - usage.attempts;
    const canUse = usage.isPremium || attemptsLeft > 0;
    
    return {
      attempts: usage.attempts,
      attemptsLeft,
      isPremium: usage.isPremium,
      canUse,
      currentMonth,
      monthlyLimit
    };
  } catch (error) {
    console.error('❌ Usage stats error:', error);
    return {
      attempts: 0,
      attemptsLeft: 30,
      isPremium: false,
      canUse: true,
      currentMonth: new Date().toISOString().slice(0, 7),
      monthlyLimit: 30
    };
  }
};

// Cache kontrolü - AsyncStorage ile
const getCachedResponse = async (userDescription: string): Promise<AIListingResponse | null> => {
  const cacheKey = userDescription.toLowerCase().trim();
  
  try {
    // Önce memory cache'e bak
    const memoryCached = memoryCache.get(cacheKey);
    if (memoryCached && Date.now() - memoryCached.timestamp < CACHE_EXPIRY) {
      memoryCached.hitCount++;
      console.log('🎯 Memory cache hit for:', userDescription);
      return memoryCached.data;
    }
    
    // AsyncStorage'dan oku
    const storageKey = CACHE_KEY_PREFIX + cacheKey;
    const cachedData = await AsyncStorage.getItem(storageKey);
    
    if (cachedData) {
      const cacheItem: CacheItem = JSON.parse(cachedData);
      
      // Süre kontrolü
      if (Date.now() - cacheItem.timestamp < CACHE_EXPIRY) {
        cacheItem.hitCount++;
        
        // Memory cache'e ekle
        memoryCache.set(cacheKey, cacheItem);
        
        // AsyncStorage'ı güncelle
        await AsyncStorage.setItem(storageKey, JSON.stringify(cacheItem));
        
        console.log('🎯 Storage cache hit for:', userDescription);
        return cacheItem.data;
      } else {
        // Süresi dolmuş cache'i sil
        await AsyncStorage.removeItem(storageKey);
        memoryCache.delete(cacheKey);
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Cache read error:', error);
    return null;
  }
};

// Cache'e kaydet - AsyncStorage ile
const cacheResponse = async (userDescription: string, response: AIListingResponse, serviceUsed: string) => {
  const cacheKey = userDescription.toLowerCase().trim();
  const storageKey = CACHE_KEY_PREFIX + cacheKey;
  
  try {
    const cacheItem: CacheItem = {
      data: response,
      timestamp: Date.now(),
      serviceUsed: serviceUsed,
      size: JSON.stringify(response).length,
      hitCount: 1
    };
    
    // Memory cache'e ekle
    memoryCache.set(cacheKey, cacheItem);
    
    // AsyncStorage'a kaydet
    await AsyncStorage.setItem(storageKey, JSON.stringify(cacheItem));
    
    // Cache key'lerini güncelle
    const cacheKeys = await AsyncStorage.getItem(CACHE_KEYS_KEY) || '[]';
    const keys = JSON.parse(cacheKeys);
    if (!keys.includes(cacheKey)) {
      keys.push(cacheKey);
      await AsyncStorage.setItem(CACHE_KEYS_KEY, JSON.stringify(keys));
    }
    
    // Cache boyut kontrolü
    await checkCacheSize();
    
    console.log('💾 Cached response for:', userDescription);
  } catch (error) {
    console.error('❌ Cache save error:', error);
  }
};

// Cache boyut kontrolü
const checkCacheSize = async () => {
  try {
    const cacheKeys = await AsyncStorage.getItem(CACHE_KEYS_KEY) || '[]';
    const keys = JSON.parse(cacheKeys);
    
    let totalSize = 0;
    const validKeys = [];
    
    for (const key of keys) {
      const storageKey = CACHE_KEY_PREFIX + key;
      const cachedData = await AsyncStorage.getItem(storageKey);
      
      if (cachedData) {
        const cacheItem: CacheItem = JSON.parse(cachedData);
        
        // Süre kontrolü
        if (Date.now() - cacheItem.timestamp < CACHE_EXPIRY) {
          totalSize += cacheItem.size;
          validKeys.push(key);
        } else {
          // Süresi dolmuş cache'i sil
          await AsyncStorage.removeItem(storageKey);
          memoryCache.delete(key);
        }
      }
    }
    
    // Cache boyutu limitini aşıyorsa en eski cache'leri sil
    if (totalSize > MAX_CACHE_SIZE) {
      console.log('🧹 Cache size limit exceeded, cleaning old items...');
      
      // Hit count'a göre sırala (en az kullanılanları sil)
      const sortedKeys = validKeys.sort((a, b) => {
        const aData = memoryCache.get(a);
        const bData = memoryCache.get(b);
        return (aData?.hitCount || 0) - (bData?.hitCount || 0);
      });
      
      // En eski %20'yi sil
      const keysToRemove = sortedKeys.slice(0, Math.floor(sortedKeys.length * 0.2));
      
      for (const key of keysToRemove) {
        const storageKey = CACHE_KEY_PREFIX + key;
        await AsyncStorage.removeItem(storageKey);
        memoryCache.delete(key);
      }
      
      // Key listesini güncelle
      const remainingKeys = validKeys.filter(key => !keysToRemove.includes(key));
      await AsyncStorage.setItem(CACHE_KEYS_KEY, JSON.stringify(remainingKeys));
    }
  } catch (error) {
    console.error('❌ Cache size check error:', error);
  }
};

// Token optimizasyonu - kısa prompt
const optimizePrompt = (userDescription: string): string => {
  // Gereksiz kelimeleri çıkar
  const optimized = userDescription
    .replace(/\b(ve|ile|için|olan|bu|şu|o)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 80); // Maksimum 80 karakter (daha kısa)
  
  return optimized;
};

// Batch processing
const processBatch = async () => {
  if (isProcessingBatch || batchQueue.length === 0) return;
  
  isProcessingBatch = true;
  console.log(`🔄 Processing batch of ${batchQueue.length} requests...`);
  
  try {
    // Benzer istekleri grupla
    const groupedRequests = new Map<string, Array<{
      userDescription: string;
      resolve: (result: { result: AIListingResponse; serviceUsed: string; isMockService: boolean; }) => void;
      reject: (error: Error) => void;
    }>>();
    
    batchQueue.forEach(({ userDescription, resolve, reject }) => {
      const key = userDescription.toLowerCase().trim();
      if (!groupedRequests.has(key)) {
        groupedRequests.set(key, []);
      }
      groupedRequests.get(key)!.push({ userDescription, resolve, reject });
    });
    
    // Her grup için tek istek yap
    for (const [key, requests] of groupedRequests) {
      try {
        const result = await generateSingleListing(key);
        
        // Tüm benzer istekleri aynı sonuçla çöz
        requests.forEach(({ resolve }) => resolve(result));
      } catch (error) {
        requests.forEach(({ reject }) => reject(error as Error));
      }
    }
  } finally {
    batchQueue = [];
    isProcessingBatch = false;
  }
};

// Mock service as fallback - token optimizasyonu ile
const generateMockListing = (userDescription: string): AIListingResponse => {
  console.log('🤖 Using optimized mock service for:', userDescription);
  
  const optimizedDesc = optimizePrompt(userDescription);
  
  // Basit keyword matching - daha hızlı
  const keywords = optimizedDesc.toLowerCase().split(' ');
  const isPhone = keywords.some(k => ['iphone', 'samsung', 'telefon', 'android'].includes(k));
  const isComputer = keywords.some(k => ['macbook', 'laptop', 'bilgisayar', 'pc'].includes(k));
  const isCar = keywords.some(k => ['araba', 'otomobil', 'bmw', 'mercedes', 'audi'].includes(k));
  
  let category = 'Diğer';
  let suggestedPrice = 1000;
  
  if (isPhone) {
    category = 'Elektronik > Telefon';
    suggestedPrice = 15000;
  } else if (isComputer) {
    category = 'Elektronik > Bilgisayar';
    suggestedPrice = 25000;
  } else if (isCar) {
    category = 'Vasıta > Otomobil';
    suggestedPrice = 500000;
  }
  
  return {
    title: `${optimizedDesc.split(' ').slice(0, 2).join(' ')} Arıyorum`,
    description: `${optimizedDesc} almak istiyorum. Bütçem uygun, temiz ve sağlam olması önemli.`,
    category: category,
    suggestedPrice: suggestedPrice,
    condition: ['İkinci El'],
    features: ['Temiz', 'Sağlam'],
    tags: ['alım', 'arıyorum', 'uygun fiyat']
  };
};

// Fallback function
const generateFallbackListing = (userDescription: string): AIListingResponse => {
  return {
    title: `${userDescription} Arıyorum`,
    description: `${userDescription} almak istiyorum. Bütçem uygun.`,
    category: 'Diğer',
    suggestedPrice: 0,
    condition: ['İkinci El'],
    features: [],
    tags: []
  };
};

// AI response'ını kategori eşleştirme ile işle
const processAIResponseWithCategoryMatching = (response: AIListingResponse, userDescription: string): AIListingResponse => {
  try {
    console.log('🔍 Processing AI response with category matching...');
    console.log('📊 Original AI response:', JSON.stringify(response, null, 2));
    console.log('📊 Category from AI:', response.category);
    console.log('📊 Category type:', typeof response.category);
    console.log('📊 Category length:', response.category?.length);
    
    // AI'dan gelen kategoriyi mevcut kategorilere eşleştir
    const categorySuggestions = matchAICategory(response.category, userDescription);
    
    // En iyi kategori önerisini response'a ekle
    const processedResponse: AIListingResponse = {
      ...response,
      categorySuggestions
    };
    
    console.log('✅ Category matching completed:', {
      originalCategory: response.category,
      suggestedCategory: categorySuggestions.primary.categoryPath,
      confidence: categorySuggestions.primary.confidence
    });
    
    return processedResponse;
  } catch (error) {
    console.error('❌ Category matching failed:', error);
    // Hata durumunda orijinal response'ı döndür
    return response;
  }
};

// Tek ilan oluşturma - cache ve optimizasyon ile
const generateSingleListing = async (userDescription: string): Promise<{
  result: AIListingResponse;
  serviceUsed: string;
  isMockService: boolean;
}> => {
  console.log('🚀 Starting optimized AI generation...');
  
  // Cache kontrolü
  const cached = await getCachedResponse(userDescription);
  if (cached) {
    // Cache'den gelen response'ı da kategori eşleştirme ile işle
    const processedCached = processAIResponseWithCategoryMatching(cached, userDescription);
    return {
      result: processedCached,
      serviceUsed: 'Cache',
      isMockService: false
    };
  }
  
  // Token optimizasyonu
  const optimizedDescription = optimizePrompt(userDescription);
  console.log('📝 Optimized input:', optimizedDescription);
  
  // Kullanılabilir servisleri öncelik sırasına göre sırala
  const availableServices = AI_SERVICES
    .filter(service => service.isAvailable())
    .sort((a, b) => a.priority - b.priority);
  
  console.log('📋 Available services:', availableServices.map(s => `${s.name} ($${s.estimatedCostPerRequest})`));
  
  if (availableServices.length === 0) {
    console.log('⚠️ No AI services available, using mock service');
    const result = generateMockListing(userDescription);
    const processedResult = processAIResponseWithCategoryMatching(result, userDescription);
    await cacheResponse(userDescription, processedResult, 'Mock Service');
    return {
      result: processedResult,
      serviceUsed: 'Mock Service',
      isMockService: true
    };
  }
  
  // En ucuz servisten başla
  const sortedByCost = [...availableServices].sort((a, b) => a.estimatedCostPerRequest - b.estimatedCostPerRequest);
  
  // Her servisi sırayla dene
  for (const service of sortedByCost) {
    try {
      console.log(`🔄 Trying ${service.name} ($${service.estimatedCostPerRequest})...`);
      const result = await service.generate(optimizedDescription);
      
      // Kategori eşleştirme ile işle
      const processedResult = processAIResponseWithCategoryMatching(result, userDescription);
      
      console.log(`✅ ${service.name} succeeded!`);
      
      // Cache'e kaydet
      await cacheResponse(userDescription, processedResult, service.name);
      
      // Firebase kaydetme kaldırıldı
      
      return {
        result: processedResult,
        serviceUsed: service.name,
        isMockService: false
      };
    } catch (error) {
      console.error(`❌ ${service.name} failed:`, error);
      
      // Eğer bu son servis değilse, bir sonrakini dene
      if (service !== sortedByCost[sortedByCost.length - 1]) {
        console.log(`🔄 Switching to next service...`);
        continue;
      }
    }
  }
  
  // Tüm servisler başarısız oldu, mock servise geç
  console.log('💰 All AI services failed, using mock service');
  const result = generateMockListing(userDescription);
  const processedResult = processAIResponseWithCategoryMatching(result, userDescription);
  await cacheResponse(userDescription, processedResult, 'Mock Service (All AI services failed)');
  return {
    result: processedResult,
    serviceUsed: 'Mock Service (All AI services failed)',
    isMockService: true
  };
};

// Ana fonksiyon - kullanıcı sınırı ile
export const generateListingWithAI = async (
  userDescription: string, 
  userId: string, 
  isPremium: boolean = false
): Promise<{
  result: AIListingResponse;
  serviceUsed: string;
  isMockService: boolean;
  usageInfo?: {
    attempts: number;
    attemptsLeft: number;
    isPremium: boolean;
  };
}> => {
  console.log('🚀 Starting AI generation with usage limits...');
  
  // Kullanıcı kullanımını kontrol et
  const usageCheck = await checkUserUsage(userId, isPremium);
  
  if (!usageCheck.canUse) {
    throw new Error(`AI kullanım hakkınız doldu! Bu ay için ${FREE_ATTEMPTS_PER_MONTH} hak kullanıldı. Premium üyelik ile sınırsız kullanabilirsiniz.`);
  }
  
  // Kullanımı kaydet
  await recordUserUsage(userId, isPremium);
  
  // Batch processing için queue'ya ekle
  return new Promise((resolve, reject) => {
    batchQueue.push({ 
      userDescription, 
      resolve: (result) => {
        // Kullanım bilgisini ekle
        resolve({
          ...result,
          usageInfo: {
            attempts: usageCheck.totalAttempts + 1,
            attemptsLeft: usageCheck.attemptsLeft - 1,
            isPremium
          }
        });
      }, 
      reject 
    });
    
    // Batch'i işle
    setTimeout(processBatch, 100); // 100ms delay ile batch
  });
};

// Servis durumunu kontrol et - maliyet bilgisi ile
export const getAIServiceStatus = () => {
  return AI_SERVICES.map(service => ({
    name: service.name,
    available: service.isAvailable(),
    priority: service.priority,
    estimatedCost: service.estimatedCostPerRequest
  }));
};

// Belirli bir servisi zorla kullan
export const generateListingWithSpecificService = async (
  userDescription: string, 
  serviceName: string,
  userId: string,
  isPremium: boolean = false
): Promise<{
  result: AIListingResponse;
  serviceUsed: string;
  isMockService: boolean;
  usageInfo?: {
    attempts: number;
    attemptsLeft: number;
    isPremium: boolean;
  };
}> => {
  const service = AI_SERVICES.find(s => s.name.toLowerCase() === serviceName.toLowerCase());
  
  if (!service) {
    throw new Error(`Service ${serviceName} not found`);
  }
  
  if (!service.isAvailable()) {
    throw new Error(`Service ${serviceName} is not available (no API key)`);
  }
  
  // Kullanıcı kullanımını kontrol et
  const usageCheck = await checkUserUsage(userId, isPremium);
  
  if (!usageCheck.canUse) {
    throw new Error(`AI kullanım hakkınız doldu! Bu ay için ${FREE_ATTEMPTS_PER_MONTH} hak kullanıldı. Premium üyelik ile sınırsız kullanabilirsiniz.`);
  }
  
  // Kullanımı kaydet
  await recordUserUsage(userId, isPremium);
  
  try {
    console.log(`🎯 Using specific service: ${service.name} ($${service.estimatedCostPerRequest})`);
    const optimizedDescription = optimizePrompt(userDescription);
    const result = await service.generate(optimizedDescription);
    
    // Cache'e kaydet
    await cacheResponse(userDescription, result, service.name);
    
    return {
      result,
      serviceUsed: service.name,
      isMockService: false,
      usageInfo: {
        attempts: usageCheck.totalAttempts + 1,
        attemptsLeft: usageCheck.attemptsLeft - 1,
        isPremium
      }
    };
  } catch (error) {
    console.error(`❌ ${service.name} failed:`, error);
    throw error;
  }
};

// Cache istatistikleri - AsyncStorage ile
export const getCacheStats = async () => {
  try {
    const cacheKeys = await AsyncStorage.getItem(CACHE_KEYS_KEY) || '[]';
    const keys = JSON.parse(cacheKeys);
    
    let totalSize = 0;
    let validCount = 0;
    let totalHits = 0;
    
    for (const key of keys) {
      const storageKey = CACHE_KEY_PREFIX + key;
      const cachedData = await AsyncStorage.getItem(storageKey);
      
      if (cachedData) {
        const cacheItem: CacheItem = JSON.parse(cachedData);
        
        if (Date.now() - cacheItem.timestamp < CACHE_EXPIRY) {
          totalSize += cacheItem.size;
          totalHits += cacheItem.hitCount;
          validCount++;
        }
      }
    }
    
    return {
      cacheSize: validCount,
      memoryCacheSize: memoryCache.size,
      totalSize: totalSize,
      totalHits: totalHits,
      cacheExpiry: CACHE_EXPIRY,
      batchQueueSize: batchQueue.length,
      maxCacheSize: MAX_CACHE_SIZE
    };
  } catch (error) {
    console.error('❌ Cache stats error:', error);
    return {
      cacheSize: 0,
      memoryCacheSize: memoryCache.size,
      totalSize: 0,
      totalHits: 0,
      cacheExpiry: CACHE_EXPIRY,
      batchQueueSize: batchQueue.length,
      maxCacheSize: MAX_CACHE_SIZE
    };
  }
};

// Cache temizle - AsyncStorage ile
export const clearCache = async () => {
  try {
    const cacheKeys = await AsyncStorage.getItem(CACHE_KEYS_KEY) || '[]';
    const keys = JSON.parse(cacheKeys);
    
    for (const key of keys) {
      const storageKey = CACHE_KEY_PREFIX + key;
      await AsyncStorage.removeItem(storageKey);
    }
    
    await AsyncStorage.removeItem(CACHE_KEYS_KEY);
    memoryCache.clear();
    
    console.log('🧹 Cache cleared');
  } catch (error) {
    console.error('❌ Cache clear error:', error);
  }
};

// Cache export/import fonksiyonları
export const exportCache = async () => {
  try {
    const cacheKeys = await AsyncStorage.getItem(CACHE_KEYS_KEY) || '[]';
    const keys = JSON.parse(cacheKeys);
    const cacheData: Record<string, CacheItem> = {};
    
    for (const key of keys) {
      const storageKey = CACHE_KEY_PREFIX + key;
      const cachedData = await AsyncStorage.getItem(storageKey);
      
      if (cachedData) {
        const cacheItem: CacheItem = JSON.parse(cachedData);
        if (Date.now() - cacheItem.timestamp < CACHE_EXPIRY) {
          cacheData[key] = cacheItem;
        }
      }
    }
    
    return cacheData;
  } catch (error) {
    console.error('❌ Cache export error:', error);
    return {};
  }
};

export const importCache = async (cacheData: Record<string, CacheItem>) => {
  try {
    const keys = Object.keys(cacheData);
    
    for (const key of keys) {
      const cacheItem = cacheData[key];
      const storageKey = CACHE_KEY_PREFIX + key;
      
      await AsyncStorage.setItem(storageKey, JSON.stringify(cacheItem));
      memoryCache.set(key, cacheItem);
    }
    
    await AsyncStorage.setItem(CACHE_KEYS_KEY, JSON.stringify(keys));
    console.log('📥 Cache imported:', keys.length, 'items');
  } catch (error) {
    console.error('❌ Cache import error:', error);
  }
}; 