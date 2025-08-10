import { config } from '../config/environment';

const API_BASE_URL = config.apiUrl;

export interface CacheStats {
  memoryCache: {
    totalItems: number;
    totalSize: number;
    hitRate: number;
    averageResponseTime: number;
    evictionCount: number;
  };
  redisCache: {
    totalKeys: number;
    totalSize: number;
    hitRate: number;
    connected: boolean;
  };
  searchCache: {
    totalSearches: number;
    cacheHits: number;
    cacheMisses: number;
    hitRate: number;
    averageResponseTime: number;
    popularQueries: string[];
  };
  apiCache: {
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    hitRate: number;
    averageResponseTime: number;
    popularEndpoints: string[];
  };
  overall: {
    totalRequests: number;
    totalHits: number;
    totalMisses: number;
    overallHitRate: number;
    averageResponseTime: number;
    memoryUsage: number;
    costSavings: number;
  };
}

export interface CacheAnalytics {
  current: CacheStats;
  alerts: any[];
  costAnalysis: any;
  trends: any;
  summary: any;
}

export interface GeographicStats {
  totalRegions: number;
  activeRegions: number;
  totalEdgeNodes: number;
  activeEdgeNodes: number;
  averageLatency: number;
  cacheHitRate: number;
  regionalDistribution: any;
}

export interface PredictiveStats {
  totalSessions: number;
  activeSessions: number;
  averagePredictionScore: number;
  totalPredictions: number;
  modelAccuracy: number;
}

export interface CompressionStats {
  totalCompressed: number;
  totalDecompressed: number;
  totalBytesSaved: number;
  averageCompressionRatio: number;
  compressionSpeed: number;
  decompressionSpeed: number;
  algorithms: any;
}

class CacheService {
  private baseUrl = `${API_BASE_URL}/cache`;

  async getCacheStats(): Promise<CacheStats> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Cache stats alınamadı');
      }
      
      return data.data;
    } catch (error) {
      console.error('Cache stats error:', error);
      throw error;
    }
  }

  async getCacheAnalytics(): Promise<CacheAnalytics> {
    try {
      const response = await fetch(`${API_BASE_URL}/cache-analytics/dashboard`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Cache analytics alınamadı');
      }
      
      return data.data;
    } catch (error) {
      console.error('Cache analytics error:', error);
      throw error;
    }
  }

  async getGeographicStats(): Promise<GeographicStats> {
    try {
      const response = await fetch(`${API_BASE_URL}/geographic-cache/stats`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Geographic stats alınamadı');
      }
      
      return data.data;
    } catch (error) {
      console.error('Geographic stats error:', error);
      throw error;
    }
  }

  async getPredictiveStats(): Promise<PredictiveStats> {
    try {
      const response = await fetch(`${API_BASE_URL}/predictive-cache/behavior-stats`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Predictive stats alınamadı');
      }
      
      return data.data;
    } catch (error) {
      console.error('Predictive stats error:', error);
      throw error;
    }
  }

  async getCompressionStats(): Promise<CompressionStats> {
    try {
      const response = await fetch(`${API_BASE_URL}/cache-compression/stats`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Compression stats alınamadı');
      }
      
      return data.data;
    } catch (error) {
      console.error('Compression stats error:', error);
      throw error;
    }
  }

  async clearCache(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/clear`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Cache temizlenemedi');
      }
    } catch (error) {
      console.error('Clear cache error:', error);
      throw error;
    }
  }

  async getCacheHealth(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Cache health check başarısız');
      }
      
      return data.data;
    } catch (error) {
      console.error('Cache health error:', error);
      throw error;
    }
  }

  async getMemoryCacheStats(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/memory/stats`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Memory cache stats alınamadı');
      }
      
      return data.data;
    } catch (error) {
      console.error('Memory cache stats error:', error);
      throw error;
    }
  }

  async getManagerStats(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/manager/stats`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Manager stats alınamadı');
      }
      
      return data.data;
    } catch (error) {
      console.error('Manager stats error:', error);
      throw error;
    }
  }

  async warmCache(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/warm`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Cache warming başarısız');
      }
    } catch (error) {
      console.error('Cache warming error:', error);
      throw error;
    }
  }

  async getCacheKeys(pattern?: string): Promise<string[]> {
    try {
      const url = pattern 
        ? `${this.baseUrl}/keys?pattern=${encodeURIComponent(pattern)}`
        : `${this.baseUrl}/keys`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Cache keys alınamadı');
      }
      
      return data.data;
    } catch (error) {
      console.error('Get cache keys error:', error);
      throw error;
    }
  }

  async deleteCacheKey(key: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key }),
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Cache key silinemedi');
      }
    } catch (error) {
      console.error('Delete cache key error:', error);
      throw error;
    }
  }

  async getCacheValue(key: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key }),
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Cache value alınamadı');
      }
      
      return data.data;
    } catch (error) {
      console.error('Get cache value error:', error);
      throw error;
    }
  }

  async setCacheValue(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/set`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value, ttl }),
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Cache value set edilemedi');
      }
    } catch (error) {
      console.error('Set cache value error:', error);
      throw error;
    }
  }
}

export default new CacheService(); 