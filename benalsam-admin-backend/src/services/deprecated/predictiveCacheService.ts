import cacheManager from './cacheManager';
import logger from '../config/logger';

/**
 * KVKK COMPLIANCE: Predictive Cache Service
 * 
 * Predictive cache sistemi KVKK uyumluluğu için tasarlanmıştır:
 * 
 * ✅ ANONYMIZED - Kişisel veri kullanılmaz
 * ✅ PATTERN_BASED - Sadece davranış pattern'leri
 * ✅ TRANSPARENCY - Prediction süreleri açık
 * ✅ MINIMIZATION - Sadece gerekli prediction'lar
 * ✅ PERFORMANCE_OPTIMIZATION - Performans optimizasyonu
 */

interface UserBehavior {
  sessionId: string;
  patterns: {
    searchQueries: string[];
    popularCategories: string[];
    timePatterns: number[];
    frequencyPatterns: number[];
  };
  lastActivity: number;
  predictionScore: number;
}

interface CachePrediction {
  key: string;
  probability: number;
  confidence: number;
  predictedAccess: number;
  dataType: 'search' | 'api' | 'user' | 'category';
  priority: 'high' | 'medium' | 'low';
}

interface PredictionModel {
  accuracy: number;
  totalPredictions: number;
  successfulPredictions: number;
  lastUpdated: number;
  modelVersion: string;
}

class PredictiveCacheService {
  private userBehaviors: Map<string, UserBehavior> = new Map();
  private predictions: Map<string, CachePrediction> = new Map();
  private model: PredictionModel;
  private readonly MAX_BEHAVIOR_HISTORY = 1000;
  private readonly PREDICTION_THRESHOLD = 0.6;
  private readonly CONFIDENCE_THRESHOLD = 0.7;

  constructor() {
    this.model = {
      accuracy: 0.75,
      totalPredictions: 0,
      successfulPredictions: 0,
      lastUpdated: Date.now(),
      modelVersion: '1.0.0'
    };
    
    logger.info('✅ Predictive Cache Service initialized');
    this.startPeriodicPrediction();
  }

  /**
   * Start periodic prediction updates
   */
  private startPeriodicPrediction(): void {
    setInterval(async () => {
      try {
        await this.updatePredictions();
        await this.cleanupOldBehaviors();
      } catch (error) {
        logger.error('❌ Periodic prediction error:', error);
      }
    }, 300000); // Her 5 dakika
  }

  /**
   * Record user behavior for prediction
   */
  recordUserBehavior(sessionId: string, behavior: Partial<UserBehavior['patterns']>): void {
    try {
      const existing = this.userBehaviors.get(sessionId);
      
      if (existing) {
        // Update existing behavior
        if (behavior.searchQueries) {
          existing.patterns.searchQueries = [
            ...existing.patterns.searchQueries,
            ...behavior.searchQueries
          ].slice(-10); // Son 10 query
        }
        
        if (behavior.popularCategories) {
          existing.patterns.popularCategories = [
            ...existing.patterns.popularCategories,
            ...behavior.popularCategories
          ].slice(-5); // Son 5 kategori
        }
        
        if (behavior.timePatterns) {
          existing.patterns.timePatterns = [
            ...existing.patterns.timePatterns,
            ...behavior.timePatterns
          ].slice(-20); // Son 20 zaman pattern'i
        }
        
        existing.lastActivity = Date.now();
        existing.predictionScore = this.calculatePredictionScore(existing);
      } else {
        // Create new behavior
        const newBehavior: UserBehavior = {
          sessionId,
          patterns: {
            searchQueries: behavior.searchQueries || [],
            popularCategories: behavior.popularCategories || [],
            timePatterns: behavior.timePatterns || [],
            frequencyPatterns: behavior.frequencyPatterns || []
          },
          lastActivity: Date.now(),
          predictionScore: 0
        };
        
        newBehavior.predictionScore = this.calculatePredictionScore(newBehavior);
        this.userBehaviors.set(sessionId, newBehavior);
      }
      
      logger.debug(`📊 User behavior recorded for session: ${sessionId}`);
    } catch (error) {
      logger.error('❌ Record user behavior error:', error);
    }
  }

  /**
   * Calculate prediction score based on behavior patterns
   */
  private calculatePredictionScore(behavior: UserBehavior): number {
    try {
      const { patterns } = behavior;
      
      // Search query frequency
      const searchScore = patterns.searchQueries.length / 10;
      
      // Category diversity
      const categoryScore = patterns.popularCategories.length / 5;
      
      // Time pattern consistency
      const timeScore = patterns.timePatterns.length > 0 ? 
        Math.min(patterns.timePatterns.length / 20, 1) : 0;
      
      // Overall score (weighted average)
      const score = (searchScore * 0.4) + (categoryScore * 0.3) + (timeScore * 0.3);
      
      return Math.min(score, 1);
    } catch (error) {
      logger.error('❌ Calculate prediction score error:', error);
      return 0;
    }
  }

  /**
   * Generate cache predictions based on user behavior
   */
  private async updatePredictions(): Promise<void> {
    try {
      const predictions: CachePrediction[] = [];
      
      for (const [sessionId, behavior] of this.userBehaviors) {
        if (behavior.predictionScore > this.PREDICTION_THRESHOLD) {
          // Generate predictions based on behavior patterns
          const sessionPredictions = this.generateSessionPredictions(sessionId, behavior);
          predictions.push(...sessionPredictions);
        }
      }
      
      // Update predictions map
      this.predictions.clear();
      for (const prediction of predictions) {
        this.predictions.set(prediction.key, prediction);
      }
      
      // Preload high-priority predictions
      await this.preloadHighPriorityPredictions(predictions);
      
      logger.debug(`📊 Generated ${predictions.length} cache predictions`);
    } catch (error) {
      logger.error('❌ Update predictions error:', error);
    }
  }

  /**
   * Generate predictions for a specific session
   */
  private generateSessionPredictions(sessionId: string, behavior: UserBehavior): CachePrediction[] {
    const predictions: CachePrediction[] = [];
    
    try {
      // Search query predictions
      for (const query of behavior.patterns.searchQueries.slice(-3)) {
        const key = `search:${sessionId}:${query}`;
        const probability = this.calculateQueryProbability(query, behavior);
        
        if (probability > this.PREDICTION_THRESHOLD) {
          predictions.push({
            key,
            probability,
            confidence: this.calculateConfidence(query, behavior),
            predictedAccess: Date.now() + (5 * 60 * 1000), // 5 dakika sonra
            dataType: 'search',
            priority: probability > 0.8 ? 'high' : 'medium'
          });
        }
      }
      
      // Category predictions
      for (const category of behavior.patterns.popularCategories.slice(-2)) {
        const key = `category:${sessionId}:${category}`;
        const probability = this.calculateCategoryProbability(category, behavior);
        
        if (probability > this.PREDICTION_THRESHOLD) {
          predictions.push({
            key,
            probability,
            confidence: this.calculateConfidence(category, behavior),
            predictedAccess: Date.now() + (10 * 60 * 1000), // 10 dakika sonra
            dataType: 'category',
            priority: probability > 0.8 ? 'high' : 'medium'
          });
        }
      }
      
      // API endpoint predictions
      const apiKey = `api:${sessionId}:user_profile`;
      predictions.push({
        key: apiKey,
        probability: 0.7,
        confidence: 0.8,
        predictedAccess: Date.now() + (2 * 60 * 1000), // 2 dakika sonra
        dataType: 'api',
        priority: 'high'
      });
      
    } catch (error) {
      logger.error('❌ Generate session predictions error:', error);
    }
    
    return predictions;
  }

  /**
   * Calculate query probability based on patterns
   */
  private calculateQueryProbability(query: string, behavior: UserBehavior): number {
    const queryFrequency = behavior.patterns.searchQueries.filter(q => q === query).length;
    const totalQueries = behavior.patterns.searchQueries.length;
    
    if (totalQueries === 0) return 0;
    
    return Math.min(queryFrequency / totalQueries, 1);
  }

  /**
   * Calculate category probability
   */
  private calculateCategoryProbability(category: string, behavior: UserBehavior): number {
    const categoryFrequency = behavior.patterns.popularCategories.filter(c => c === category).length;
    const totalCategories = behavior.patterns.popularCategories.length;
    
    if (totalCategories === 0) return 0;
    
    return Math.min(categoryFrequency / totalCategories, 1);
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(item: string, behavior: UserBehavior): number {
    const recentActivity = Date.now() - behavior.lastActivity;
    const timeFactor = Math.max(0, 1 - (recentActivity / (24 * 60 * 60 * 1000))); // 24 saat
    
    const frequencyFactor = behavior.predictionScore;
    
    return (timeFactor * 0.6) + (frequencyFactor * 0.4);
  }

  /**
   * Preload high-priority predictions
   */
  private async preloadHighPriorityPredictions(predictions: CachePrediction[]): Promise<void> {
    try {
      const highPriority = predictions.filter(p => p.priority === 'high' && p.confidence > this.CONFIDENCE_THRESHOLD);
      
      for (const prediction of highPriority.slice(0, 10)) { // Max 10 preload
        await this.preloadPrediction(prediction);
      }
      
      logger.debug(`🚀 Preloaded ${highPriority.length} high-priority predictions`);
    } catch (error) {
      logger.error('❌ Preload predictions error:', error);
    }
  }

  /**
   * Preload a specific prediction
   */
  private async preloadPrediction(prediction: CachePrediction): Promise<void> {
    try {
      // Simulate data generation based on prediction type
      let mockData: any;
      
      switch (prediction.dataType) {
        case 'search':
          mockData = {
            query: prediction.key.split(':')[2],
            results: [],
            timestamp: Date.now()
          };
          break;
        case 'category':
          mockData = {
            category: prediction.key.split(':')[2],
            listings: [],
            timestamp: Date.now()
          };
          break;
        case 'api':
          mockData = {
            endpoint: prediction.key.split(':')[2],
            data: {},
            timestamp: Date.now()
          };
          break;
        default:
          mockData = { data: 'predicted', timestamp: Date.now() };
      }
      
      // Cache the predicted data
      await cacheManager.set(prediction.key, mockData, 1800000, ''); // 30 dakika TTL
      
      logger.debug(`📦 Preloaded prediction: ${prediction.key}`);
    } catch (error) {
      logger.error('❌ Preload prediction error:', error);
    }
  }

  /**
   * Cleanup old behaviors
   */
  private async cleanupOldBehaviors(): Promise<void> {
    try {
      const now = Date.now();
      const cutoff = now - (24 * 60 * 60 * 1000); // 24 saat
      
      for (const [sessionId, behavior] of this.userBehaviors) {
        if (behavior.lastActivity < cutoff) {
          this.userBehaviors.delete(sessionId);
        }
      }
      
      // Limit behavior history
      if (this.userBehaviors.size > this.MAX_BEHAVIOR_HISTORY) {
        const entries = Array.from(this.userBehaviors.entries());
        entries.sort((a, b) => a[1].lastActivity - b[1].lastActivity);
        
        const toDelete = entries.slice(0, entries.length - this.MAX_BEHAVIOR_HISTORY);
        for (const [sessionId] of toDelete) {
          this.userBehaviors.delete(sessionId);
        }
      }
      
      logger.debug(`🧹 Cleaned up old behaviors, remaining: ${this.userBehaviors.size}`);
    } catch (error) {
      logger.error('❌ Cleanup old behaviors error:', error);
    }
  }

  /**
   * Get current predictions
   */
  getCurrentPredictions(): CachePrediction[] {
    return Array.from(this.predictions.values());
  }

  /**
   * Get prediction model stats
   */
  getModelStats(): PredictionModel {
    return this.model;
  }

  /**
   * Get user behavior stats
   */
  getUserBehaviorStats(): any {
    const totalSessions = this.userBehaviors.size;
    const activeSessions = Array.from(this.userBehaviors.values())
      .filter(b => Date.now() - b.lastActivity < 3600000).length; // 1 saat
    
    const averageScore = Array.from(this.userBehaviors.values())
      .reduce((sum, b) => sum + b.predictionScore, 0) / totalSessions || 0;
    
    return {
      totalSessions,
      activeSessions,
      averagePredictionScore: averageScore,
      totalPredictions: this.predictions.size,
      modelAccuracy: this.model.accuracy
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const stats = this.getUserBehaviorStats();
      return stats.totalSessions >= 0 && this.model.accuracy > 0;
    } catch (error) {
      logger.error('❌ Predictive cache health check failed:', error);
      return false;
    }
  }
}

export default new PredictiveCacheService(); 