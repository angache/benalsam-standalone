import cron from 'node-cron';
import { createClient } from 'redis';
import { logger } from '../utils/logger';
import BackupService from './backupService';

export interface BackupSchedule {
  id: string;
  name: string;
  description?: string;
  cronExpression: string;
  backupOptions: {
    includeDatabase: boolean;
    includeEdgeFunctions: boolean;
    includeMigrations: boolean;
    compression: boolean;
  };
  timezone: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleExecution {
  id: string;
  scheduleId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  backupId?: string;
  progress?: number;
}

class SchedulingService {
  private redis: any;
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();
  private isInitialized = false;
  private backupService: BackupService;

  constructor() {
    this.backupService = new BackupService();
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      this.redis = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      await this.redis.connect();
      logger.info('Scheduling service Redis connected');

      // Load existing schedules from Redis
      await this.loadSchedules();
      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize scheduling service Redis', { error });
    }
  }

  private async loadSchedules() {
    try {
      const scheduleKeys = await this.redis.keys('backup_schedule:*');
      
      for (const key of scheduleKeys) {
        const scheduleData = await this.redis.get(key);
        if (scheduleData) {
          const schedule: BackupSchedule = JSON.parse(scheduleData);
          if (schedule.enabled) {
            await this.startSchedule(schedule);
          }
        }
      }
      
      logger.info(`Loaded ${scheduleKeys.length} backup schedules`);
    } catch (error) {
      logger.error('Failed to load schedules from Redis', { error });
    }
  }

  async createSchedule(scheduleData: Omit<BackupSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<BackupSchedule> {
    const schedule: BackupSchedule = {
      ...scheduleData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.saveSchedule(schedule);
    
    if (schedule.enabled) {
      await this.startSchedule(schedule);
    }

    logger.info('Created backup schedule', { scheduleId: schedule.id, name: schedule.name });
    return schedule;
  }

  async updateSchedule(id: string, updates: Partial<BackupSchedule>): Promise<BackupSchedule | null> {
    const schedule = await this.getSchedule(id);
    if (!schedule) {
      return null;
    }

    const updatedSchedule: BackupSchedule = {
      ...schedule,
      ...updates,
      updatedAt: new Date()
    };

    await this.saveSchedule(updatedSchedule);
    
    // Restart schedule if enabled status changed
    if (schedule.enabled !== updatedSchedule.enabled) {
      if (updatedSchedule.enabled) {
        await this.startSchedule(updatedSchedule);
      } else {
        await this.stopSchedule(id);
      }
    } else if (updatedSchedule.enabled) {
      // Restart if cron expression changed
      if (schedule.cronExpression !== updatedSchedule.cronExpression) {
        await this.stopSchedule(id);
        await this.startSchedule(updatedSchedule);
      }
    }

    logger.info('Updated backup schedule', { scheduleId: id, name: updatedSchedule.name });
    return updatedSchedule;
  }

  async deleteSchedule(id: string): Promise<boolean> {
    const schedule = await this.getSchedule(id);
    if (!schedule) {
      return false;
    }

    await this.stopSchedule(id);
    await this.redis.del(`backup_schedule:${id}`);
    await this.redis.del(`schedule_execution:${id}`);

    logger.info('Deleted backup schedule', { scheduleId: id, name: schedule.name });
    return true;
  }

  async getSchedule(id: string): Promise<BackupSchedule | null> {
    try {
      const scheduleData = await this.redis.get(`backup_schedule:${id}`);
      return scheduleData ? JSON.parse(scheduleData) : null;
    } catch (error) {
      logger.error('Failed to get schedule', { scheduleId: id, error });
      return null;
    }
  }

  async getAllSchedules(): Promise<BackupSchedule[]> {
    try {
      logger.info('Attempting to retrieve all schedules from Redis', { service: 'admin-backend' });
      const scheduleKeys = await this.redis.keys('backup_schedule:*');
      logger.info(`Found ${scheduleKeys.length} schedule keys in Redis`, { keys: scheduleKeys, service: 'admin-backend' });

      const schedules: BackupSchedule[] = [];
      for (const key of scheduleKeys) {
        const scheduleData = await this.redis.get(key);
        if (scheduleData) {
          try {
            const schedule = JSON.parse(scheduleData);
            // Tarih alanlarını Date objesine dönüştür
            schedule.createdAt = new Date(schedule.createdAt);
            schedule.updatedAt = new Date(schedule.updatedAt);
            if (schedule.lastRun) schedule.lastRun = new Date(schedule.lastRun);
            if (schedule.nextRun) schedule.nextRun = new Date(schedule.nextRun);
            schedules.push(schedule);
            logger.debug(`Successfully parsed schedule: ${key}`, { scheduleId: schedule.id, service: 'admin-backend' });
          } catch (parseError) {
            logger.error(`Failed to parse schedule data for key: ${key}`, { data: scheduleData, parseError: parseError instanceof Error ? parseError.message : parseError, service: 'admin-backend' });
          }
        }
      }
      logger.info(`Successfully retrieved and parsed ${schedules.length} schedules`, { service: 'admin-backend' });
      return schedules;
    } catch (error) {
      logger.error('Failed to get all schedules from Redis', { error: error instanceof Error ? error.message : error, stack: error instanceof Error ? error.stack : 'N/A', service: 'admin-backend' });
      throw error; // Hatayı tekrar fırlat ki API katmanı da yakalayabilsin
    }
  }

  async triggerSchedule(id: string): Promise<boolean> {
    const schedule = await this.getSchedule(id);
    if (!schedule) {
      return false;
    }

    await this.executeBackup(schedule);
    return true;
  }

  async getScheduleStatus(id: string): Promise<ScheduleExecution | null> {
    try {
      const executionData = await this.redis.get(`schedule_execution:${id}`);
      return executionData ? JSON.parse(executionData) : null;
    } catch (error) {
      logger.error('Failed to get schedule status', { scheduleId: id, error });
      return null;
    }
  }

  private async startSchedule(schedule: BackupSchedule) {
    try {
      // Stop existing job if running
      await this.stopSchedule(schedule.id);

      // Create new cron job
      const job = cron.schedule(schedule.cronExpression, async () => {
        await this.executeBackup(schedule);
      }, {
        scheduled: true,
        timezone: schedule.timezone
      });

      this.cronJobs.set(schedule.id, job);
      
      // Calculate next run time
      const nextRun = this.calculateNextRun(schedule.cronExpression, schedule.timezone);
      if (nextRun) {
        await this.updateSchedule(schedule.id, { nextRun });
      }

      logger.info('Started backup schedule', { 
        scheduleId: schedule.id, 
        name: schedule.name, 
        nextRun: nextRun?.toISOString() 
      });
    } catch (error) {
      logger.error('Failed to start schedule', { scheduleId: schedule.id, error });
    }
  }

  private async stopSchedule(id: string) {
    const job = this.cronJobs.get(id);
    if (job) {
      job.stop();
      this.cronJobs.delete(id);
      logger.info('Stopped backup schedule', { scheduleId: id });
    }
  }

  private async executeBackup(schedule: BackupSchedule) {
    const executionId = this.generateId();
    const execution: ScheduleExecution = {
      id: executionId,
      scheduleId: schedule.id,
      status: 'pending',
      startedAt: new Date()
    };

    try {
      // Save execution status
      await this.redis.set(`schedule_execution:${schedule.id}`, JSON.stringify(execution));
      
      // Update schedule last run
      await this.updateSchedule(schedule.id, { lastRun: new Date() });

      // Update execution status to running
      execution.status = 'running';
      await this.redis.set(`schedule_execution:${schedule.id}`, JSON.stringify(execution));

      logger.info('Starting scheduled backup', { 
        scheduleId: schedule.id, 
        executionId, 
        name: schedule.name 
      });

      // Execute backup
      const backupResult = await this.backupService.createBackup(
        `Scheduled backup: ${schedule.name}`,
        ['scheduled', schedule.name]
      );

      // Update execution status to completed
      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.backupId = backupResult.id;
      execution.progress = 100;
      await this.redis.set(`schedule_execution:${schedule.id}`, JSON.stringify(execution));

      logger.info('Completed scheduled backup', { 
        scheduleId: schedule.id, 
        executionId, 
        backupId: backupResult.id 
      });

    } catch (error) {
      // Update execution status to failed
      execution.status = 'failed';
      execution.completedAt = new Date();
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      await this.redis.set(`schedule_execution:${schedule.id}`, JSON.stringify(execution));

      logger.error('Failed scheduled backup', { 
        scheduleId: schedule.id, 
        executionId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  private async saveSchedule(schedule: BackupSchedule) {
    await this.redis.set(`backup_schedule:${schedule.id}`, JSON.stringify(schedule));
  }

  private calculateNextRun(cronExpression: string, timezone: string): Date | null {
    try {
      // Simple calculation for next run time
      // For now, we'll use a basic approach
      // In a production environment, you might want to use a more sophisticated library
      const now = new Date();
      const nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to 24 hours from now
      return nextRun;
    } catch (error) {
      logger.error('Failed to calculate next run time', { cronExpression, timezone, error });
      return null;
    }
  }

  private generateId(): string {
    return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getExecutionHistory(scheduleId: string, limit: number = 10): Promise<ScheduleExecution[]> {
    try {
      // For now, we'll store only the latest execution
      // In a full implementation, you might want to store execution history in a separate collection
      const executionData = await this.redis.get(`schedule_execution:${scheduleId}`);
      return executionData ? [JSON.parse(executionData)] : [];
    } catch (error) {
      logger.error('Failed to get execution history', { scheduleId, error });
      return [];
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      logger.error('Scheduling service health check failed', { error });
      return false;
    }
  }

  async shutdown() {
    // Stop all cron jobs
    for (const [id, job] of this.cronJobs) {
      job.stop();
    }
    this.cronJobs.clear();

    // Close Redis connection
    if (this.redis) {
      await this.redis.quit();
    }

    logger.info('Scheduling service shutdown completed');
  }
}

export const schedulingService = new SchedulingService();
