import { database } from '../config/firebase';
import logger from '../config/logger';
import { Database } from 'firebase-admin/database';

export interface FirebaseEvent {
  id: string;
  type: string;
  data: any;
  timestamp: string;
  source: string;
}

export class FirebaseService {
  private db: Database = database;

  /**
   * Write data to Firebase Realtime Database
   */
  async writeData(path: string, data: any): Promise<void> {
    try {
      const ref = this.db.ref(path);
      await ref.set(data);
      logger.info(`✅ Data written to Firebase: ${path}`, { data });
    } catch (error) {
      logger.error(`❌ Firebase write error: ${path}`, error);
      throw error;
    }
  }

  /**
   * Read data from Firebase Realtime Database
   */
  async readData(path: string): Promise<any> {
    try {
      const ref = this.db.ref(path);
      const snapshot = await ref.once('value');
      const data = snapshot.val();
      logger.info(`✅ Data read from Firebase: ${path}`, { data });
      return data;
    } catch (error) {
      logger.error(`❌ Firebase read error: ${path}`, error);
      throw error;
    }
  }

  /**
   * Create a job in Firebase Realtime Database
   */
  async createJob(jobData: any): Promise<void> {
    try {
      const jobPath = `jobs/${jobData.id}`;
      await this.writeData(jobPath, jobData);
      logger.info(`✅ Job created in Firebase: ${jobData.id}`, { jobData });
    } catch (error) {
      logger.error(`❌ Failed to create job in Firebase: ${jobData.id}`, error);
      throw error;
    }
  }

  /**
   * Update data in Firebase Realtime Database
   */
  async updateData(path: string, data: any): Promise<void> {
    try {
      const ref = this.db.ref(path);
      await ref.update(data);
      logger.info(`✅ Data updated in Firebase: ${path}`, { data });
    } catch (error) {
      logger.error(`❌ Firebase update error: ${path}`, error);
      throw error;
    }
  }

  /**
   * Delete data from Firebase Realtime Database
   */
  async deleteData(path: string): Promise<void> {
    try {
      const ref = this.db.ref(path);
      await ref.remove();
      logger.info(`✅ Data deleted from Firebase: ${path}`);
    } catch (error) {
      logger.error(`❌ Firebase delete error: ${path}`, error);
      throw error;
    }
  }

  /**
   * Listen to real-time changes in Firebase
   */
  listenToChanges(path: string, callback: (data: any) => void): () => void {
    try {
      const ref = this.db.ref(path);
      
      const listener = ref.on('value', (snapshot: any) => {
        const data = snapshot.val();
        logger.info(`📡 Firebase real-time update: ${path}`, { data });
        callback(data);
      });

      // Return cleanup function
      return () => {
        ref.off('value', listener);
        logger.info(`🔇 Firebase listener removed: ${path}`);
      };
    } catch (error) {
      logger.error(`❌ Firebase listener error: ${path}`, error);
      throw error;
    }
  }

  /**
   * Create a queue event in Firebase
   */
  async createQueueEvent(event: Omit<FirebaseEvent, 'id' | 'timestamp'>): Promise<string> {
    try {
      const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fullEvent: FirebaseEvent = {
        ...event,
        id: eventId,
        timestamp: new Date().toISOString()
      };

      const path = `queue/events/${eventId}`;
      await this.writeData(path, fullEvent);
      
      logger.info(`✅ Queue event created: ${eventId}`, { event: fullEvent });
      return eventId;
    } catch (error) {
      logger.error('❌ Queue event creation failed:', error);
      throw error;
    }
  }

  /**
   * Get all pending queue events
   */
  async getPendingEvents(): Promise<FirebaseEvent[]> {
    try {
      const data = await this.readData('queue/events');
      if (!data) return [];

      const events = Object.values(data) as FirebaseEvent[];
      return events.filter(event => event.type === 'pending');
    } catch (error) {
      logger.error('❌ Get pending events failed:', error);
      throw error;
    }
  }

  /**
   * Update job in Firebase
   */
  async updateJob(jobId: string, updates: Record<string, any>): Promise<void> {
    try {
      const path = `jobs/${jobId}`;
      await this.updateData(path, updates);
      logger.info(`✅ Job updated: ${jobId}`, { updates });
    } catch (error) {
      logger.error(`❌ Job update failed: ${jobId}`, error);
      throw error;
    }
  }

  /**
   * Delete old completed jobs (older than specified days)
   */
  async deleteOldJobs(olderThanDays: number = 7): Promise<number> {
    try {
      const jobs = await this.readData('jobs');
      if (!jobs) return 0;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      const cutoffTimestamp = cutoffDate.toISOString();

      let deletedCount = 0;

      for (const [jobId, jobData] of Object.entries(jobs)) {
        const job = jobData as any;
        
        // Delete if completed and older than cutoff date
        if (job.status === 'completed' && job.completedAt && job.completedAt < cutoffTimestamp) {
          await this.deleteData(`jobs/${jobId}`);
          deletedCount++;
          logger.info(`🗑️ Deleted old job: ${jobId}`);
        }
      }

      logger.info(`✅ Deleted ${deletedCount} old jobs (older than ${olderThanDays} days)`);
      return deletedCount;
    } catch (error) {
      logger.error('❌ Delete old jobs failed:', error);
      throw error;
    }
  }
}

export default new FirebaseService();
