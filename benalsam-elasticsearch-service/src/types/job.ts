export type JobStatus = 'pending' | 'processing' | 'sent' | 'completed' | 'failed';

export interface Job {
  id: number;
  table_name: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  record_id: string;
  change_data: any;
  status: JobStatus;
  error_message?: string;
  retry_count: number;
  created_at: string;
  processed_at?: string;
  trace_id?: string;
}

export interface JobUpdateParams {
  status: JobStatus;
  error_message?: string;
  retry_count?: number;
  processed_at?: string;
  trace_id?: string;
}

export interface JobMetrics {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  avgProcessingTime: number;
  errorRate: number;
}
