import cron from 'node-cron';
import logger from '../config/logger';

export interface SimpleSchedule {
  id: string;
  name: string;
  description?: string;
  cronExpression: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  createdAt: string;
  updatedAt: string;
}

export class SimpleSchedulingService {
  private schedules: Map<string, SimpleSchedule> = new Map();
  private tasks: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    logger.info('✅ Simple Scheduling Service initialized');
  }

  async createSchedule(scheduleData: Omit<SimpleSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<SimpleSchedule> {
    const id = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const schedule: SimpleSchedule = {
      ...scheduleData,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.schedules.set(id, schedule);

    if (schedule.enabled) {
      await this.startSchedule(id);
    }

    logger.info('✅ Schedule created', { id, name: schedule.name });
    return schedule;
  }

  async getAllSchedules(): Promise<SimpleSchedule[]> {
    return Array.from(this.schedules.values());
  }

  async getSchedule(id: string): Promise<SimpleSchedule | null> {
    return this.schedules.get(id) || null;
  }

  async updateSchedule(id: string, updates: Partial<SimpleSchedule>): Promise<SimpleSchedule | null> {
    const schedule = this.schedules.get(id);
    if (!schedule) {
      return null;
    }

    const updatedSchedule: SimpleSchedule = {
      ...schedule,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    this.schedules.set(id, updatedSchedule);

    // Restart schedule if cron expression or enabled status changed
    if (updates.cronExpression || updates.enabled !== undefined) {
      await this.stopSchedule(id);
      if (updatedSchedule.enabled) {
        await this.startSchedule(id);
      }
    }

    logger.info('✅ Schedule updated', { id, updates });
    return updatedSchedule;
  }

  async deleteSchedule(id: string): Promise<boolean> {
    const schedule = this.schedules.get(id);
    if (!schedule) {
      return false;
    }

    await this.stopSchedule(id);
    this.schedules.delete(id);

    logger.info('✅ Schedule deleted', { id, name: schedule.name });
    return true;
  }

  async triggerSchedule(id: string): Promise<boolean> {
    const schedule = this.schedules.get(id);
    if (!schedule) {
      return false;
    }

    logger.info('🔄 Manually triggering schedule', { id, name: schedule.name });
    
    // Simulate schedule execution
    await this.executeSchedule(id);
    
    return true;
  }

  async getScheduleStatus(id: string): Promise<{ isRunning: boolean; lastRun?: string; nextRun?: string }> {
    const schedule = this.schedules.get(id);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    const task = this.tasks.get(id);
    const isRunning = task ? true : false; // Simplified check

    return {
      isRunning,
      ...(schedule.lastRun && { lastRun: schedule.lastRun }),
      ...(schedule.nextRun && { nextRun: schedule.nextRun })
    };
  }

  private async startSchedule(id: string): Promise<void> {
    const schedule = this.schedules.get(id);
    if (!schedule) {
      return;
    }

    // Stop existing task if any
    await this.stopSchedule(id);

    try {
      const task = cron.schedule(schedule.cronExpression, async () => {
        await this.executeSchedule(id);
      }, {
        scheduled: false
      });

      this.tasks.set(id, task);
      task.start();

      logger.info('✅ Schedule started', { id, name: schedule.name, cronExpression: schedule.cronExpression });
    } catch (error) {
      logger.error('❌ Failed to start schedule:', { id, error });
    }
  }

  private async stopSchedule(id: string): Promise<void> {
    const task = this.tasks.get(id);
    if (task) {
      task.stop();
      this.tasks.delete(id);
      logger.info('✅ Schedule stopped', { id });
    }
  }

  private async executeSchedule(id: string): Promise<void> {
    const schedule = this.schedules.get(id);
    if (!schedule) {
      return;
    }

    logger.info('🔄 Executing schedule', { id, name: schedule.name });

    try {
      // Update last run time
      schedule.lastRun = new Date().toISOString();
      this.schedules.set(id, schedule);

      // Simulate schedule execution
      await new Promise(resolve => setTimeout(resolve, 1000));

      logger.info('✅ Schedule executed successfully', { id, name: schedule.name });
    } catch (error) {
      logger.error('❌ Schedule execution failed:', { id, name: schedule.name, error });
    }
  }
}

// Export singleton instance
export const simpleSchedulingService = new SimpleSchedulingService();
