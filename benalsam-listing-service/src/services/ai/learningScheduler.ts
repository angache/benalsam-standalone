/**
 * Learning Scheduler Service
 * 
 * @fileoverview Scheduled tasks for AI learning system
 * - Analyze successful listings and learn patterns
 * - Clean up old/low-quality patterns
 * 
 * @author Benalsam Team
 * @version 1.0.0
 */

import { logger } from '../../config/logger';
import { supabase } from '../../config/database';
import { learningService } from './learningService';

export class LearningScheduler {
  private static instance: LearningScheduler;
  private analysisInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  static getInstance(): LearningScheduler {
    if (!LearningScheduler.instance) {
      LearningScheduler.instance = new LearningScheduler();
    }
    return LearningScheduler.instance;
  }

  /**
   * Start scheduled learning tasks
   */
  start(): void {
    logger.info('📚 AI Learning Scheduler: Starting...');

    // Analyze successful listings every 6 hours
    this.analysisInterval = setInterval(() => {
      this.analyzeSuccessfulListings().catch(error => {
        logger.error('❌ AI Learning Scheduler: Error analyzing listings', error);
      });
    }, 6 * 60 * 60 * 1000); // 6 hours

    // Cleanup old patterns daily at 2 AM
    this.cleanupInterval = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 2 && now.getMinutes() === 0) {
        this.cleanupOldPatterns().catch(error => {
          logger.error('❌ AI Learning Scheduler: Error cleaning up patterns', error);
        });
      }
    }, 60 * 60 * 1000); // Check every hour

    // Run initial analysis after 5 minutes (to let server start)
    setTimeout(() => {
      this.analyzeSuccessfulListings().catch(error => {
        logger.error('❌ AI Learning Scheduler: Error in initial analysis', error);
      });
    }, 5 * 60 * 1000);

    logger.info('✅ AI Learning Scheduler: Started');
  }

  /**
   * Stop scheduled tasks
   */
  stop(): void {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    logger.info('🛑 AI Learning Scheduler: Stopped');
  }

  /**
   * Analyze successful listings and learn patterns
   */
  async analyzeSuccessfulListings(): Promise<void> {
    try {
      logger.info('📚 AI Learning Scheduler: Analyzing successful listings...');

      // Get listings from last 7 days that have good engagement
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: listings, error } = await supabase
        .from('listings')
        .select('id, title, description, category, view_count, created_at, status')
        .gte('created_at', sevenDaysAgo.toISOString())
        .eq('status', 'active') // Only active listings
        .order('view_count', { ascending: false })
        .limit(100); // Top 100 by views

      if (error) {
        logger.error('❌ AI Learning Scheduler: Error fetching listings', error);
        return;
      }

      if (!listings || listings.length === 0) {
        logger.info('📚 AI Learning Scheduler: No listings to analyze');
        return;
      }

      let learnedCount = 0;

      // Analyze each listing
      for (const listing of listings) {
        try {
          // Calculate success score
          const successScore = this.calculateSuccessScore({
            view_count: listing.view_count || 0,
            response_count: 0, // TODO: Get from messages/responses table
            created_at: listing.created_at
          });

          // Only learn from successful listings (score >= 60)
          if (successScore >= 60) {
            await learningService.learnFromListing({
              id: listing.id,
              title: listing.title,
              description: listing.description || '',
              category: listing.category,
              view_count: listing.view_count || 0,
              response_count: 0, // TODO: Get actual response count
              created_at: listing.created_at
            });
            learnedCount++;
          }
        } catch (error) {
          logger.error('❌ AI Learning Scheduler: Error learning from listing', {
            listingId: listing.id,
            error
          });
        }
      }

      logger.info('✅ AI Learning Scheduler: Analysis complete', {
        totalListings: listings.length,
        learnedCount,
        successRate: `${((learnedCount / listings.length) * 100).toFixed(1)}%`
      });
    } catch (error) {
      logger.error('❌ AI Learning Scheduler: Error in analysis', error);
      throw error;
    }
  }

  /**
   * Clean up old/low-quality patterns
   */
  async cleanupOldPatterns(): Promise<void> {
    try {
      logger.info('🧹 AI Learning Scheduler: Cleaning up old patterns...');
      await learningService.cleanupOldPatterns();
      logger.info('✅ AI Learning Scheduler: Cleanup complete');
    } catch (error) {
      logger.error('❌ AI Learning Scheduler: Error in cleanup', error);
      throw error;
    }
  }

  /**
   * Calculate success score (same logic as learningService)
   */
  private calculateSuccessScore(listing: {
    view_count: number;
    response_count: number;
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
   * Manually trigger analysis (for testing/admin)
   */
  async triggerAnalysis(): Promise<void> {
    logger.info('📚 AI Learning Scheduler: Manual trigger');
    await this.analyzeSuccessfulListings();
  }

  /**
   * Manually trigger cleanup (for testing/admin)
   */
  async triggerCleanup(): Promise<void> {
    logger.info('🧹 AI Learning Scheduler: Manual cleanup trigger');
    await this.cleanupOldPatterns();
  }
}

export const learningScheduler = LearningScheduler.getInstance();

