import { useState, useEffect, useCallback } from 'react';
import { listingServiceClient } from '@/services/listingServiceClient';

interface JobStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
}

interface UseJobStatusOptions {
  jobId: string | null;
  userId: string | null;
  autoPoll?: boolean;
  pollInterval?: number;
  maxAttempts?: number;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

export const useJobStatus = ({
  jobId,
  userId,
  autoPoll = true,
  pollInterval = 2000,
  maxAttempts = 30,
  onComplete,
  onError,
  onProgress
}: UseJobStatusOptions) => {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const pollJobStatus = useCallback(async () => {
    if (!jobId || !userId || isPolling) return;

    setIsPolling(true);
    setAttempts(0);

    const poll = async (): Promise<void> => {
      try {
        setAttempts(prev => prev + 1);
        
        const status = await listingServiceClient.getJobStatus(jobId, userId);
        
        setJobStatus({
          status: status.status as any,
          progress: status.progress,
          result: status.result,
          error: status.error
        });

        if (onProgress) {
          onProgress(status.progress);
        }

        if (status.status === 'completed') {
          setIsPolling(false);
          if (onComplete) {
            onComplete(status.result);
          }
          return;
        }

        if (status.status === 'failed') {
          setIsPolling(false);
          if (onError) {
            onError(status.error || 'Job failed');
          }
          return;
        }

        if (attempts >= maxAttempts) {
          setIsPolling(false);
          if (onError) {
            onError('Job timeout - maximum attempts reached');
          }
          return;
        }

        // Continue polling
        setTimeout(poll, pollInterval);
        
      } catch (error) {
        setIsPolling(false);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (onError) {
          onError(errorMessage);
        }
      }
    };

    poll();
  }, [jobId, userId, isPolling, pollInterval, maxAttempts, onComplete, onError, onProgress, attempts]);

  const cancelJob = useCallback(async () => {
    if (!jobId || !userId) return false;

    try {
      const result = await listingServiceClient.cancelJob(jobId, userId);
      setIsPolling(false);
      return result.success;
    } catch (error) {
      console.error('Failed to cancel job:', error);
      return false;
    }
  }, [jobId, userId]);

  const refreshStatus = useCallback(async () => {
    if (!jobId || !userId) return;

    try {
      const status = await listingServiceClient.getJobStatus(jobId, userId);
      setJobStatus({
        status: status.status as any,
        progress: status.progress,
        result: status.result,
        error: status.error
      });
    } catch (error) {
      console.error('Failed to refresh job status:', error);
    }
  }, [jobId, userId]);

  // Auto-poll when jobId changes
  useEffect(() => {
    if (autoPoll && jobId && userId && !isPolling) {
      pollJobStatus();
    }
  }, [autoPoll, jobId, userId, isPolling, pollJobStatus]);

  return {
    jobStatus,
    isPolling,
    attempts,
    pollJobStatus,
    cancelJob,
    refreshStatus
  };
};
