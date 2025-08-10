import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, get, update, remove, increment, orderByChild, limitToLast, query, push } from 'firebase/database';
import { firebaseConfig } from '../config/firebase';

// Firebase Realtime Database servisi
export class FirebaseService {
  private app;
  public db;

  constructor() {
    try {
      // Firebase yapılandırmasını kontrol et
      if (!firebaseConfig.web.databaseURL) {
        console.warn('⚠️ Firebase databaseURL is missing');
        throw new Error('Firebase databaseURL is required');
      }

      // Mevcut app'i kontrol et
      const apps = getApps();
      if (apps.length > 0) {
        // Mevcut app'i kullan
        this.app = apps[0];
        this.db = getDatabase(this.app);
        console.log('✅ Firebase service using existing app');
      } else {
        // Yeni app başlat
        this.app = initializeApp(firebaseConfig.web);
        this.db = getDatabase(this.app);
        console.log('✅ Firebase service initialized with new app');
      }
      
      console.log('✅ Firebase service ready');
    } catch (error) {
      console.error('❌ Firebase service initialization error:', error);
      throw error;
    }
  }

  // Kategori özelliklerini getir
  async getCategoryFeatures(categoryPath: string) {
    try {
      const categoryRef = ref(this.db, `category_features/${categoryPath}`);
      const snapshot = await get(categoryRef);
      
      return snapshot.val();
    } catch (error) {
      console.error('Firebase getCategoryFeatures error:', error);
      return null;
    }
  }

  // Kategori özelliklerini güncelle
  async updateCategoryFeatures(categoryPath: string, features: any) {
    try {
      const categoryRef = ref(this.db, `category_features/${categoryPath}`);
      await set(categoryRef, features);
      
      return true;
    } catch (error) {
      console.error('Firebase updateCategoryFeatures error:', error);
      return false;
    }
  }

  // AI önerilerini kaydet
  async saveAISuggestion(userInput: string, suggestions: any) {
    try {
      const key = userInput.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const suggestionRef = ref(this.db, `ai_suggestions/${key}`);
      
      await set(suggestionRef, {
        ...suggestions,
        timestamp: Date.now(),
        usage_count: 1
      });
      
      return true;
    } catch (error) {
      console.error('Firebase saveAISuggestion error:', error);
      return false;
    }
  }

  // AI önerilerini kaydet ve analiz et
  async saveAISuggestionWithAnalytics(userInput: string, suggestions: any, selectedFeatures: string[], selectedTags: string[]) {
    try {
      const key = userInput.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const suggestionRef = ref(this.db, `ai_suggestions/${key}`);
      
      // Başarı oranını hesapla
      const suggestedFeatures = suggestions.features || [];
      const suggestedTags = suggestions.tags || [];
      
      const featureSuccessRate = suggestedFeatures.length > 0 
        ? selectedFeatures.filter(f => suggestedFeatures.includes(f)).length / suggestedFeatures.length 
        : 0;
      
      const tagSuccessRate = suggestedTags.length > 0 
        ? selectedTags.filter(t => suggestedTags.includes(t)).length / suggestedTags.length 
        : 0;
      
      const overallSuccessRate = (featureSuccessRate + tagSuccessRate) / 2;
      
      await set(suggestionRef, {
        ...suggestions,
        timestamp: Date.now(),
        usage_count: increment(1),
        success_rate: overallSuccessRate,
        selected_features: selectedFeatures,
        selected_tags: selectedTags,
        feature_success_rate: featureSuccessRate,
        tag_success_rate: tagSuccessRate
      });
      
      return true;
    } catch (error) {
      console.error('Firebase saveAISuggestionWithAnalytics error:', error);
      return false;
    }
  }

  // Akıllı duplikasyon kontrolü
  async findSimilarFeature(categoryPath: string, featureName: string): Promise<string | null> {
    try {
      const categoryRef = ref(this.db, `category_features/${categoryPath}/features`);
      const snapshot = await get(categoryRef);
      const features = snapshot.val();
      
      if (!features) return null;
      
      const normalizedName = this.normalizeText(featureName);
      
      for (const [featureId, feature] of Object.entries(features)) {
        const normalizedFeatureName = this.normalizeText((feature as any).name);
        
        // Benzerlik kontrolü (basit string benzerliği)
        if (this.calculateSimilarity(normalizedName, normalizedFeatureName) > 0.8) {
          return featureId;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Firebase findSimilarFeature error:', error);
      return null;
    }
  }

  // Akıllı duplikasyon kontrolü - etiketler için
  async findSimilarTag(categoryPath: string, tagName: string): Promise<string | null> {
    try {
      const categoryRef = ref(this.db, `category_features/${categoryPath}/tags`);
      const snapshot = await get(categoryRef);
      const tags = snapshot.val();
      
      if (!tags) return null;
      
      const normalizedName = this.normalizeText(tagName);
      
      for (const [tagId, tag] of Object.entries(tags)) {
        const normalizedTagName = this.normalizeText((tag as any).name);
        
        // Benzerlik kontrolü
        if (this.calculateSimilarity(normalizedName, normalizedTagName) > 0.8) {
          return tagId;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Firebase findSimilarTag error:', error);
      return null;
    }
  }

  // Metin normalizasyonu
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[çğıöşü]/g, (match) => {
        const map: { [key: string]: string } = {
          'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u'
        };
        return map[match] || match;
      })
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
  }

  // Benzerlik hesaplama (Levenshtein distance tabanlı)
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  // Levenshtein distance hesaplama
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Kullanıcı oluşturulan özelliği kaydet (akıllı duplikasyon kontrolü ile)
  async saveUserFeature(categoryPath: string, featureName: string, userId: string) {
    try {
      // Önce benzer özellik var mı kontrol et
      const similarFeatureId = await this.findSimilarFeature(categoryPath, featureName);
      
      if (similarFeatureId) {
        // Benzer özellik varsa, onun kullanım sayısını artır
        await this.incrementFeatureUsage(categoryPath, similarFeatureId);
        return similarFeatureId;
      }
      
      // Yeni özellik oluştur
      const featureId = `custom_${Date.now()}`;
      const featureRef = ref(this.db, `category_features/${categoryPath}/features/${featureId}`);
      
      await set(featureRef, {
        name: featureName,
        usage_count: 1,
        ai_suggested: false,
        user_created: true,
        created_by: userId,
        created_at: Date.now(),
        last_used: Date.now(),
        status: 'pending_approval' // Moderasyon için
      });
      
      return featureId;
    } catch (error) {
      console.error('Firebase saveUserFeature error:', error);
      return null;
    }
  }

  // Kullanıcı oluşturulan etiketi kaydet (akıllı duplikasyon kontrolü ile)
  async saveUserTag(categoryPath: string, tagName: string, userId: string) {
    try {
      // Önce benzer etiket var mı kontrol et
      const similarTagId = await this.findSimilarTag(categoryPath, tagName);
      
      if (similarTagId) {
        // Benzer etiket varsa, onun kullanım sayısını artır
        await this.incrementTagUsage(categoryPath, similarTagId);
        return similarTagId;
      }
      
      // Yeni etiket oluştur
      const tagId = `custom_${Date.now()}`;
      const tagRef = ref(this.db, `category_features/${categoryPath}/tags/${tagId}`);
      
      await set(tagRef, {
        name: tagName,
        usage_count: 1,
        ai_suggested: false,
        user_created: true,
        created_by: userId,
        created_at: Date.now(),
        last_used: Date.now(),
        status: 'pending_approval' // Moderasyon için
      });
      
      return tagId;
    } catch (error) {
      console.error('Firebase saveUserTag error:', error);
      return null;
    }
  }

  // Özellik kullanım sayısını artır
  async incrementFeatureUsage(categoryPath: string, featureId: string) {
    try {
      const featureRef = ref(this.db, `category_features/${categoryPath}/features/${featureId}`);
      
      await update(featureRef, {
        usage_count: increment(1),
        last_used: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Firebase incrementFeatureUsage error:', error);
      return false;
    }
  }

  // Etiket kullanım sayısını artır
  async incrementTagUsage(categoryPath: string, tagId: string) {
    try {
      const tagRef = ref(this.db, `category_features/${categoryPath}/tags/${tagId}`);
      
      await update(tagRef, {
        usage_count: increment(1),
        last_used: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Firebase incrementTagUsage error:', error);
      return false;
    }
  }

  // Moderasyon: Özellik/etiket durumunu güncelle
  async updateFeatureStatus(categoryPath: string, featureId: string, status: 'approved' | 'rejected' | 'pending_approval') {
    try {
      const featureRef = ref(this.db, `category_features/${categoryPath}/features/${featureId}`);
      
      await update(featureRef, {
        status,
        moderated_at: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Firebase updateFeatureStatus error:', error);
      return false;
    }
  }

  async updateTagStatus(categoryPath: string, tagId: string, status: 'approved' | 'rejected' | 'pending_approval') {
    try {
      const tagRef = ref(this.db, `category_features/${categoryPath}/tags/${tagId}`);
      
      await update(tagRef, {
        status,
        moderated_at: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Firebase updateTagStatus error:', error);
      return false;
    }
  }

  // Gelişmiş analitik: Popüler özellikler
  async getPopularFeatures(categoryPath: string, limit: number = 10) {
    try {
      const featuresRef = ref(this.db, `category_features/${categoryPath}/features`);
      const analyticsQuery = query(
        featuresRef,
        orderByChild('usage_count'),
        limitToLast(limit)
      );
      const snapshot = await get(analyticsQuery);
      
      return snapshot.val();
    } catch (error) {
      console.error('Firebase getPopularFeatures error:', error);
      return null;
    }
  }

  // Gelişmiş analitik: Popüler etiketler
  async getPopularTags(categoryPath: string, limit: number = 10) {
    try {
      const tagsRef = ref(this.db, `category_features/${categoryPath}/tags`);
      const analyticsQuery = query(
        tagsRef,
        orderByChild('usage_count'),
        limitToLast(limit)
      );
      const snapshot = await get(analyticsQuery);
      
      return snapshot.val();
    } catch (error) {
      console.error('Firebase getPopularTags error:', error);
      return null;
    }
  }

  // Gelişmiş analitik: AI başarı oranları
  async getAISuccessRates() {
    try {
      const suggestionsRef = ref(this.db, 'ai_suggestions');
      const analyticsQuery = query(
        suggestionsRef,
        orderByChild('success_rate'),
        limitToLast(20)
      );
      const snapshot = await get(analyticsQuery);
      
      return snapshot.val();
    } catch (error) {
      console.error('Firebase getAISuccessRates error:', error);
      return null;
    }
  }

  // Tüm kategorileri getir
  async getAllCategories() {
    try {
      const categoriesRef = ref(this.db, 'category_features');
      const snapshot = await get(categoriesRef);
      
      return snapshot.val();
    } catch (error) {
      console.error('Firebase getAllCategories error:', error);
      return null;
    }
  }

  // Analitik verileri getir
  async getAnalytics() {
    try {
      const suggestionsRef = ref(this.db, 'ai_suggestions');
      const analyticsQuery = query(
        suggestionsRef,
        orderByChild('usage_count'),
        limitToLast(10)
      );
      const snapshot = await get(analyticsQuery);
      
      return snapshot.val();
    } catch (error) {
      console.error('Firebase getAnalytics error:', error);
      return null;
    }
  }

  // Moderasyon bekleyen öğeleri getir
  async getPendingModeration() {
    try {
      const categoriesRef = ref(this.db, 'category_features');
      const snapshot = await get(categoriesRef);
      const categories = snapshot.val();
      
      const pendingItems: any[] = [];
      
      for (const [categoryPath, category] of Object.entries(categories)) {
        const features = (category as any).features || {};
        const tags = (category as any).tags || {};
        
        // Bekleyen özellikler
        for (const [featureId, feature] of Object.entries(features)) {
          if ((feature as any).status === 'pending_approval') {
            pendingItems.push({
              type: 'feature',
              categoryPath,
              id: featureId,
              name: (feature as any).name,
              created_by: (feature as any).created_by,
              created_at: (feature as any).created_at
            });
          }
        }
        
        // Bekleyen etiketler
        for (const [tagId, tag] of Object.entries(tags)) {
          if ((tag as any).status === 'pending_approval') {
            pendingItems.push({
              type: 'tag',
              categoryPath,
              id: tagId,
              name: (tag as any).name,
              created_by: (tag as any).created_by,
              created_at: (tag as any).created_at
            });
          }
        }
      }
      
      return pendingItems;
    } catch (error) {
      console.error('Firebase getPendingModeration error:', error);
      return [];
    }
  }
}

// Singleton instance
export const firebaseService = new FirebaseService(); 