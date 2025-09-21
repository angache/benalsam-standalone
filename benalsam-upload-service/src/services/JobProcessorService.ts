import { v4 as uuidv4 } from 'uuid';
import { 
  IJobProcessorService, 
  Job, 
  JobType, 
  JobStatus, 
  JobPriority, 
  JobMetrics,
  JobProgress 
} from '../interfaces/IUploadService';
// import { supabase } from '../config/database';
import logger from '../config/logger';

/**
 * Job Processor Service Implementation
 * Job processing için abstraction
 */
export class JobProcessorService implements IJobProcessorService {
  private activeJobs = new Map<string, Job>();
  private jobMetrics: JobMetrics = {
    totalJobs: 0,
    pendingJobs: 0,
    processingJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    retryingJobs: 0,
    averageProcessingTime: 0,
    successRate: 0,
    errorRate: 0
  };

  async createJob(jobData: Partial<Job>): Promise<Job> {
    try {
      const job: Job = {
        id: jobData.id || uuidv4(),
        type: jobData.type || JobType.IMAGE_UPLOAD_REQUESTED,
        status: jobData.status || JobStatus.PENDING,
        priority: jobData.priority || JobPriority.NORMAL,
        data: jobData.data || {},
        retryCount: jobData.retryCount || 0,
        maxRetries: jobData.maxRetries || 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        progress: jobData.progress
      };

      logger.info('Creating job', { jobId: job.id, type: job.type });

      // Store job in database (mock for now)
      // const { error } = await supabase
      //   .from('upload_jobs')
      //   .insert({
      //     id: job.id,
      //     type: job.type,
      //     status: job.status,
      //     priority: job.priority,
      //     data: job.data,
      //     retry_count: job.retryCount,
      //     max_retries: job.maxRetries,
      //     created_at: job.createdAt,
      //     updated_at: job.updatedAt,
      //     progress: job.progress
      //   });

      // if (error) {
      //   logger.error('Error creating job:', error);
      //   throw new Error(`Failed to create job: ${error.message}`);
      // }

      // Store in memory
      this.activeJobs.set(job.id, job);
      this.updateMetrics();

      logger.info('Job created successfully', { jobId: job.id });
      return job;
    } catch (error) {
      logger.error('Job creation failed:', error);
      throw error;
    }
  }

  async processJob(jobId: string): Promise<void> {
    try {
      const job = this.activeJobs.get(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      logger.info('Processing job', { jobId, type: job.type });

      // Update job status to processing
      await this.updateJobStatus(jobId, JobStatus.PROCESSING, {
        startedAt: new Date().toISOString()
      });

      // Simulate job processing
      await this.simulateJobProcessing(job);

      // Update job status to completed
      await this.updateJobStatus(jobId, JobStatus.COMPLETED, {
        completedAt: new Date().toISOString(),
        result: { message: 'Job completed successfully' }
      });

      logger.info('Job processed successfully', { jobId });
    } catch (error) {
      logger.error('Job processing failed:', error);
      
      // Update job status to failed
      await this.updateJobStatus(jobId, JobStatus.FAILED, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  async getJob(jobId: string): Promise<Job | null> {
    try {
      // Try to get from memory first
      const memoryJob = this.activeJobs.get(jobId);
      if (memoryJob) {
        return memoryJob;
      }

      // Get from database (mock for now)
      // const { data: job, error } = await supabase
      //   .from('upload_jobs')
      //   .select('*')
      //   .eq('id', jobId)
      //   .single();

      // if (error) {
      //   if (error.code === 'PGRST116') {
      //     return null; // Not found
      //   }
      //   logger.error('Error fetching job:', error);
      //   throw new Error(`Failed to fetch job: ${error.message}`);
      // }

      return null; // Mock: no job found
    } catch (error) {
      logger.error('Get job failed:', error);
      throw error;
    }
  }

  async getJobMetrics(): Promise<JobMetrics> {
    try {
      // Get metrics from database (mock for now)
      // const { data: jobs, error } = await supabase
      //   .from('upload_jobs')
      //   .select('status, created_at, completed_at');

      // if (error) {
      //   logger.error('Error fetching job metrics:', error);
      //   throw new Error(`Failed to fetch job metrics: ${error.message}`);
      // }

      const jobs: any[] = []; // Mock: empty jobs array

      // Calculate metrics
      const totalJobs = jobs?.length || 0;
      const completedJobs = jobs?.filter((j: any) => j.status === JobStatus.COMPLETED).length || 0;
      const failedJobs = jobs?.filter((j: any) => j.status === JobStatus.FAILED).length || 0;
      const pendingJobs = jobs?.filter((j: any) => j.status === JobStatus.PENDING).length || 0;
      const processingJobs = jobs?.filter((j: any) => j.status === JobStatus.PROCESSING).length || 0;
      const retryingJobs = jobs?.filter((j: any) => j.status === JobStatus.RETRYING).length || 0;

      // Calculate average processing time
      const completedJobsWithTime = jobs?.filter((j: any) => 
        j.status === JobStatus.COMPLETED && j.completed_at && j.created_at
      ) || [];

      const totalProcessingTime = completedJobsWithTime.reduce((total: number, job: any) => {
        const start = new Date(job.created_at).getTime();
        const end = new Date(job.completed_at).getTime();
        return total + (end - start);
      }, 0);

      const averageProcessingTime = completedJobsWithTime.length > 0 
        ? totalProcessingTime / completedJobsWithTime.length 
        : 0;

      const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
      const errorRate = totalJobs > 0 ? (failedJobs / totalJobs) * 100 : 0;

      this.jobMetrics = {
        totalJobs,
        pendingJobs,
        processingJobs,
        completedJobs,
        failedJobs,
        retryingJobs,
        averageProcessingTime,
        successRate,
        errorRate
      };

      return this.jobMetrics;
    } catch (error) {
      logger.error('Get job metrics failed:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: string; responseTime: number }> {
    const startTime = Date.now();
    
    try {
      // Simple query to test connection (mock for now)
      // const { error } = await supabase
      //   .from('upload_jobs')
      //   .select('id')
      //   .limit(1);
      
      const responseTime = Date.now() - startTime;
      
      // Mock: always healthy
      return { status: 'healthy', responseTime };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Job processor health check failed:', error);
      return { status: 'unhealthy', responseTime };
    }
  }

  private async updateJobStatus(
    jobId: string, 
    status: JobStatus, 
    updates: Partial<Job> = {}
  ): Promise<void> {
    try {
      const job = this.activeJobs.get(jobId);
      if (job) {
        Object.assign(job, updates, { status, updatedAt: new Date().toISOString() });
        this.activeJobs.set(jobId, job);
      }

      // Update in database (mock for now)
      // const { error } = await supabase
      //   .from('upload_jobs')
      //   .update({
      //     status,
      //     updated_at: new Date().toISOString(),
      //     ...updates
      //   })
      //   .eq('id', jobId);

      // if (error) {
      //   logger.error('Error updating job status:', error);
      //   throw new Error(`Failed to update job status: ${error.message}`);
      // }

      this.updateMetrics();
    } catch (error) {
      logger.error('Update job status failed:', error);
      throw error;
    }
  }

  private async simulateJobProcessing(job: Job): Promise<void> {
    // Simulate processing time
    const processingTime = Math.random() * 2000 + 500; // 500-2500ms
    
    // Update progress
    if (job.progress) {
      job.progress.current = 0;
      job.progress.total = 100;
      job.progress.percentage = 0;
      job.progress.message = 'Processing...';
    }

    // Simulate progress updates
    for (let i = 0; i <= 100; i += 20) {
      await new Promise(resolve => setTimeout(resolve, processingTime / 5));
      
      if (job.progress) {
        job.progress.current = i;
        job.progress.percentage = i;
        job.progress.message = `Processing... ${i}%`;
      }
    }

    // Simulate occasional failures
    if (Math.random() < 0.1) { // 10% failure rate
      throw new Error('Simulated processing failure');
    }
  }

  private updateMetrics(): void {
    const jobs = Array.from(this.activeJobs.values());
    
    this.jobMetrics.totalJobs = jobs.length;
    this.jobMetrics.pendingJobs = jobs.filter(j => j.status === JobStatus.PENDING).length;
    this.jobMetrics.processingJobs = jobs.filter(j => j.status === JobStatus.PROCESSING).length;
    this.jobMetrics.completedJobs = jobs.filter(j => j.status === JobStatus.COMPLETED).length;
    this.jobMetrics.failedJobs = jobs.filter(j => j.status === JobStatus.FAILED).length;
    this.jobMetrics.retryingJobs = jobs.filter(j => j.status === JobStatus.RETRYING).length;
    
    if (this.jobMetrics.totalJobs > 0) {
      this.jobMetrics.successRate = (this.jobMetrics.completedJobs / this.jobMetrics.totalJobs) * 100;
      this.jobMetrics.errorRate = (this.jobMetrics.failedJobs / this.jobMetrics.totalJobs) * 100;
    }
  }
}
