/**
 * AI Learning Service
 * 
 * @fileoverview Persistent learning system for AI suggestions
 * - Redis: Fast cache for learned patterns (24h TTL)
 * - PostgreSQL: Permanent storage for successful patterns
 * - Learning Strategy: Analyze successful listings and extract patterns
 * 
 * @author Benalsam Team
 * @version 1.0.0
 */

import { redisClient } from '../../config/redis';
import { supabase } from '../../config/database';
import { logger } from '../../config/logger';

export interface LearnedPattern {
  category: string;
  patternType: 'title' | 'description';
  pattern: string;
  score: number; // Success score (0-100)
  usageCount: number;
  successRate: number; // Percentage of successful uses
  lastUsed: Date;
  createdAt: Date;
}

export interface CategoryPatterns {
  category: string;
  titlePatterns: LearnedPattern[];
  descriptionHints: LearnedPattern[];
  lastUpdated: Date;
}

export class LearningService {
  private static instance: LearningService;
  private readonly CACHE_TTL = 24 * 60 * 60; // 24 hours
  private readonly MIN_SUCCESS_SCORE = 60; // Minimum score to save pattern
  private readonly MIN_USAGE_COUNT = 3; // Minimum uses before considering pattern successful

  static getInstance(): LearningService {
    if (!LearningService.instance) {
      LearningService.instance = new LearningService();
    }
    return LearningService.instance;
  }

  /**
   * Get learned patterns for a category (from cache or DB)
   */
  async getLearnedPatterns(category: string): Promise<CategoryPatterns | null> {
    try {
      // 1. Try Redis cache first
      const cacheKey = `ai:learned:${category.toLowerCase()}`;
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        logger.debug('📚 AI: Loaded patterns from cache', { category });
        return JSON.parse(cached);
      }

      // 2. Load from database
      const patterns = await this.loadFromDatabase(category);
      
      if (patterns) {
        // Cache for next time
        await redisClient.setEx(
          cacheKey,
          this.CACHE_TTL,
          JSON.stringify(patterns)
        );
        logger.debug('📚 AI: Loaded patterns from database', { category });
        return patterns;
      }

      return null;
    } catch (error) {
      logger.error('❌ AI: Error getting learned patterns', error);
      return null;
    }
  }

  /**
   * Learn from a successful listing
   * Called when a listing gets good engagement (views, responses, etc.)
   */
  async learnFromListing(listing: {
    id: string;
    title: string;
    description: string;
    category: string;
    view_count?: number;
    response_count?: number;
    created_at: string;
  }): Promise<void> {
    try {
      const successScore = this.calculateSuccessScore(listing);
      
      // Only learn from successful listings
      if (successScore < this.MIN_SUCCESS_SCORE) {
        logger.debug('📚 AI: Listing not successful enough to learn from', {
          listingId: listing.id,
          score: successScore
        });
        return;
      }

      // Extract patterns
      const titlePattern = this.extractTitlePattern(listing.title, listing.category);
      const descriptionHint = this.extractDescriptionHint(listing.description);

      // Save patterns
      if (titlePattern) {
        await this.savePattern({
          category: listing.category,
          patternType: 'title',
          pattern: titlePattern,
          score: successScore,
          usageCount: 1,
          successRate: 100,
          lastUsed: new Date(),
          createdAt: new Date()
        });
      }

      if (descriptionHint) {
        await this.savePattern({
          category: listing.category,
          patternType: 'description',
          pattern: descriptionHint,
          score: successScore,
          usageCount: 1,
          successRate: 100,
          lastUsed: new Date(),
          createdAt: new Date()
        });
      }

      // Invalidate cache
      await this.invalidateCache(listing.category);

      logger.info('📚 AI: Learned from successful listing', {
        listingId: listing.id,
        category: listing.category,
        score: successScore
      });
    } catch (error) {
      logger.error('❌ AI: Error learning from listing', error);
    }
  }

  /**
   * Update pattern success rate when used
   */
  async recordPatternUsage(
    category: string,
    patternType: 'title' | 'description',
    pattern: string,
    wasSuccessful: boolean
  ): Promise<void> {
    try {
      // Find existing pattern
      const { data: existing } = await supabase
        .from('ai_learned_patterns')
        .select('*')
        .eq('category', category)
        .eq('pattern_type', patternType)
        .eq('pattern', pattern)
        .single();

      if (existing) {
        // Update existing pattern
        const newUsageCount = existing.usage_count + 1;
        const newSuccessCount = wasSuccessful 
          ? (existing.success_count || 0) + 1 
          : (existing.success_count || 0);
        const newSuccessRate = (newSuccessCount / newUsageCount) * 100;

        await supabase
          .from('ai_learned_patterns')
          .update({
            usage_count: newUsageCount,
            success_count: newSuccessCount,
            success_rate: newSuccessRate,
            last_used: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        // Invalidate cache
        await this.invalidateCache(category);
      }
    } catch (error) {
      logger.error('❌ AI: Error recording pattern usage', error);
    }
  }

  /**
   * Calculate success score for a listing
   */
  private calculateSuccessScore(listing: {
    view_count?: number;
    response_count?: number;
    created_at: string;
  }): number {
    let score = 0;

    // Views (max 40 points)
    if (listing.view_count) {
      if (listing.view_count > 100) score += 40;
      else if (listing.view_count > 50) score += 30;
      else if (listing.view_count > 20) score += 20;
      else if (listing.view_count > 10) score += 10;
    }

    // Responses (max 40 points)
    if (listing.response_count) {
      if (listing.response_count > 10) score += 40;
      else if (listing.response_count > 5) score += 30;
      else if (listing.response_count > 2) score += 20;
      else if (listing.response_count > 0) score += 10;
    }

    // Recency bonus (max 20 points)
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceCreation < 7) score += 20;
    else if (daysSinceCreation < 30) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Extract title pattern from successful listing
   */
  private extractTitlePattern(title: string, _category: string): string | null {
    // Normalize: remove specific values, keep structure
    let pattern = title;

    // Remove specific brands/models (replace with placeholders)
    pattern = pattern.replace(/\b(iPhone|Samsung|Apple|BMW|Mercedes|Audi)\s+\w+/gi, '{brand} {model}');
    pattern = pattern.replace(/\b\d+\+?\d*\s*(GB|TB|m²|km|yıl)\b/gi, '{number} {unit}');
    pattern = pattern.replace(/\b\d{4}\b/g, '{year}');

    // Keep structure but make it generic
    if (pattern.length < 10 || pattern.length > 100) {
      return null; // Too short or too long
    }

    // Must contain "Arıyorum" or "İstiyorum" for wanted listings
    if (!pattern.toLowerCase().includes('arıyorum') && 
        !pattern.toLowerCase().includes('istiyorum')) {
      return null;
    }

    return pattern;
  }

  /**
   * Extract description hint from successful listing
   */
  private extractDescriptionHint(description: string): string | null {
    // Get first meaningful sentence
    const sentences = description.split(/[.!?]\s+/);
    const firstSentence = sentences[0]?.trim();

    if (!firstSentence || firstSentence.length < 15 || firstSentence.length > 150) {
      return null;
    }

    // Must be in "wanted" format
    if (firstSentence.toLowerCase().includes('satıyorum') || 
        firstSentence.toLowerCase().includes('satılık')) {
      return null; // Wrong format
    }

    return firstSentence;
  }

  /**
   * Save pattern to database
   */
  private async savePattern(pattern: LearnedPattern): Promise<void> {
    try {
      // Check if pattern already exists
      const { data: existing } = await supabase
        .from('ai_learned_patterns')
        .select('*')
        .eq('category', pattern.category)
        .eq('pattern_type', pattern.patternType)
        .eq('pattern', pattern.pattern)
        .single();

      if (existing) {
        // Update existing pattern
        const newUsageCount = existing.usage_count + 1;
        const newSuccessCount = existing.success_count + 1;
        const newSuccessRate = (newSuccessCount / newUsageCount) * 100;
        const newScore = Math.max(existing.score, pattern.score); // Keep highest score

        await supabase
          .from('ai_learned_patterns')
          .update({
            score: newScore,
            usage_count: newUsageCount,
            success_count: newSuccessCount,
            success_rate: newSuccessRate,
            last_used: pattern.lastUsed.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Insert new pattern
        await supabase
          .from('ai_learned_patterns')
          .insert({
            category: pattern.category,
            pattern_type: pattern.patternType,
            pattern: pattern.pattern,
            score: pattern.score,
            usage_count: pattern.usageCount,
            success_count: pattern.usageCount, // First use = success
            success_rate: pattern.successRate,
            last_used: pattern.lastUsed.toISOString(),
            created_at: pattern.createdAt.toISOString(),
            updated_at: pattern.createdAt.toISOString()
          });
      }
    } catch (error) {
      logger.error('❌ AI: Error saving pattern', error);
      throw error;
    }
  }

  /**
   * Load patterns from database
   */
  private async loadFromDatabase(category: string): Promise<CategoryPatterns | null> {
    try {
      const { data: patterns, error } = await supabase
        .from('ai_learned_patterns')
        .select('*')
        .eq('category', category)
        .gte('score', this.MIN_SUCCESS_SCORE)
        .gte('usage_count', this.MIN_USAGE_COUNT)
        .order('score', { ascending: false })
        .order('success_rate', { ascending: false })
        .limit(20);

      if (error) {
        logger.error('❌ AI: Error loading patterns from database', error);
        return null;
      }

      if (!patterns || patterns.length === 0) {
        return null;
      }

      const titlePatterns: LearnedPattern[] = [];
      const descriptionHints: LearnedPattern[] = [];

      for (const p of patterns) {
        const pattern: LearnedPattern = {
          category: p.category,
          patternType: p.pattern_type,
          pattern: p.pattern,
          score: p.score,
          usageCount: p.usage_count,
          successRate: p.success_rate,
          lastUsed: new Date(p.last_used),
          createdAt: new Date(p.created_at)
        };

        if (p.pattern_type === 'title') {
          titlePatterns.push(pattern);
        } else {
          descriptionHints.push(pattern);
        }
      }

      return {
        category,
        titlePatterns: titlePatterns.slice(0, 10), // Top 10
        descriptionHints: descriptionHints.slice(0, 10), // Top 10
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('❌ AI: Error loading from database', error);
      return null;
    }
  }

  /**
   * Invalidate cache for a category
   */
  private async invalidateCache(category: string): Promise<void> {
    try {
      const cacheKey = `ai:learned:${category.toLowerCase()}`;
      await redisClient.del(cacheKey);
      logger.debug('📚 AI: Cache invalidated', { category });
    } catch (error) {
      logger.error('❌ AI: Error invalidating cache', error);
    }
  }

  /**
   * Clean up old/low-quality patterns
   * Should be run periodically (e.g., daily cron job)
   */
  async cleanupOldPatterns(): Promise<void> {
    try {
      // Delete patterns that:
      // 1. Haven't been used in 90 days AND
      // 2. Have low success rate (< 30%) OR
      // 3. Have been used less than MIN_USAGE_COUNT times
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);

      const { error } = await supabase
        .from('ai_learned_patterns')
        .delete()
        .lt('last_used', cutoffDate.toISOString())
        .or(`success_rate.lt.30,usage_count.lt.${this.MIN_USAGE_COUNT}`);

      if (error) {
        logger.error('❌ AI: Error cleaning up patterns', error);
      } else {
        logger.info('📚 AI: Cleaned up old patterns');
      }
    } catch (error) {
      logger.error('❌ AI: Error in cleanup', error);
    }
  }
}

export const learningService = LearningService.getInstance();

