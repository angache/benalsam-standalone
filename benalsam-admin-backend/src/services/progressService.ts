import { createClient } from 'redis';
import { logger } from '../utils/logger';

export interface OperationProgress {
  id: string;
  operationType: 'backup' | 'restore' | 'validation' | 'scheduled_backup';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  currentStep: string;
  totalSteps: number;
  currentStepNumber: number;
  startedAt: Date;
  estimatedCompletion?: Date;
  completedAt?: Date;
  error?: string;
  metadata?: any;
}

class ProgressService {
  private redis: any;
  private isInitialized = false;

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      this.redis = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      await this.redis.connect();
      logger.info('Progress service Redis connected');
      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize progress service Redis', { error });
    }
  }

  async createProgress(operationType: OperationProgress['operationType'], metadata?: any): Promise<OperationProgress> {
    const progress: OperationProgress = {
      id: this.generateId(),
      operationType,
      status: 'pending',
      progress: 0,
      currentStep: 'Initializing...',
      totalSteps: this.getTotalSteps(operationType),
      currentStepNumber: 0,
      startedAt: new Date(),
      metadata
    };

    await this.saveProgress(progress);
    logger.info('Created progress tracking', { progressId: progress.id, operationType });
    return progress;
  }

  async updateProgress(id: string, updates: Partial<OperationProgress>): Promise<OperationProgress | null> {
    const progress = await this.getProgress(id);
    if (!progress) {
      return null;
    }

    const updatedProgress: OperationProgress = {
      ...progress,
      ...updates,
      progress: Math.min(100, Math.max(0, updates.progress ?? progress.progress))
    };

    // Calculate estimated completion if progress is updated
    if (updates.progress && updates.progress > 0) {
      const elapsed = Date.now() - progress.startedAt.getTime();
      const estimatedTotal = (elapsed / updates.progress) * 100;
      const estimatedRemaining = estimatedTotal - elapsed;
      updatedProgress.estimatedCompletion = new Date(Date.now() + estimatedRemaining);
    }

    await this.saveProgress(updatedProgress);
    
    // Log significant progress updates
    if (updates.progress && updates.progress % 25 === 0) {
      logger.info('Progress update', { 
        progressId: id, 
        progress: updates.progress, 
        currentStep: updates.currentStep 
      });
    }

    return updatedProgress;
  }

  async setStep(id: string, step: string, stepNumber?: number): Promise<OperationProgress | null> {
    const progress = await this.getProgress(id);
    if (!progress) {
      return null;
    }

    const currentStepNumber = stepNumber ?? progress.currentStepNumber + 1;
    const progressPercentage = Math.round((currentStepNumber / progress.totalSteps) * 100);

    return this.updateProgress(id, {
      currentStep: step,
      currentStepNumber,
      progress: progressPercentage
    });
  }

  async completeProgress(id: string, success: boolean = true, error?: string): Promise<OperationProgress | null> {
    const updates: Partial<OperationProgress> = {
      status: success ? 'completed' : 'failed',
      progress: 100,
      completedAt: new Date()
    };

    if (error) {
      updates.error = error;
    }

    const result = await this.updateProgress(id, updates);
    
    if (result) {
      logger.info('Progress completed', { 
        progressId: id, 
        status: result.status, 
        duration: result.completedAt!.getTime() - result.startedAt.getTime() 
      });
    }

    return result;
  }

  async cancelProgress(id: string): Promise<OperationProgress | null> {
    return this.updateProgress(id, {
      status: 'cancelled',
      completedAt: new Date()
    });
  }

  async getProgress(id: string): Promise<OperationProgress | null> {
    try {
      const progressData = await this.redis.get(`progress:${id}`);
      if (!progressData) {
        return null;
      }

      const progress = JSON.parse(progressData);
      return {
        ...progress,
        startedAt: new Date(progress.startedAt),
        completedAt: progress.completedAt ? new Date(progress.completedAt) : undefined,
        estimatedCompletion: progress.estimatedCompletion ? new Date(progress.estimatedCompletion) : undefined
      };
    } catch (error) {
      logger.error('Failed to get progress', { progressId: id, error });
      return null;
    }
  }

  async getAllProgress(operationType?: OperationProgress['operationType']): Promise<OperationProgress[]> {
    try {
      const pattern = operationType ? `progress:${operationType}:*` : 'progress:*';
      const progressKeys = await this.redis.keys(pattern);
      const progressList: OperationProgress[] = [];

      for (const key of progressKeys) {
        const progressData = await this.redis.get(key);
        if (progressData) {
          const progress = JSON.parse(progressData);
          progressList.push({
            ...progress,
            startedAt: new Date(progress.startedAt),
            completedAt: progress.completedAt ? new Date(progress.completedAt) : undefined,
            estimatedCompletion: progress.estimatedCompletion ? new Date(progress.estimatedCompletion) : undefined
          });
        }
      }

      return progressList.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    } catch (error) {
      logger.error('Failed to get all progress', { error });
      return [];
    }
  }

  async cleanupOldProgress(daysToKeep: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - (daysToKeep * 24 * 60 * 60 * 1000));
      const allProgress = await this.getAllProgress();
      let deletedCount = 0;

      for (const progress of allProgress) {
        if (progress.startedAt < cutoffDate && progress.status !== 'running') {
          await this.redis.del(`progress:${progress.id}`);
          deletedCount++;
        }
      }

      logger.info('Cleaned up old progress records', { deletedCount, daysToKeep });
      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old progress', { error });
      return 0;
    }
  }

  private async saveProgress(progress: OperationProgress) {
    await this.redis.set(`progress:${progress.id}`, JSON.stringify(progress));
    // Set expiration for completed/failed/cancelled progress (7 days)
    if (progress.status !== 'running' && progress.status !== 'pending') {
      await this.redis.expire(`progress:${progress.id}`, 7 * 24 * 60 * 60);
    }
  }

  private getTotalSteps(operationType: OperationProgress['operationType']): number {
    switch (operationType) {
      case 'backup':
        return 6; // Initialize, Database, Functions, Migrations, Compress, Finalize
      case 'restore':
        return 5; // Validate, Extract, Database, Functions, Migrations
      case 'validation':
        return 4; // Initialize, Checksum, Integrity, Finalize
      case 'scheduled_backup':
        return 7; // Schedule, Initialize, Database, Functions, Migrations, Compress, Finalize
      default:
        return 5;
    }
  }

  private generateId(): string {
    return `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      logger.error('Progress service health check failed', { error });
      return false;
    }
  }

  async shutdown() {
    if (this.redis) {
      await this.redis.quit();
    }
    logger.info('Progress service shutdown completed');
  }
}

export const progressService = new ProgressService();
