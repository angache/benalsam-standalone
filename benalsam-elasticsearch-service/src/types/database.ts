import { JobStatus } from './job';

export interface Database {
  public: {
    Tables: {
      elasticsearch_sync_queue: {
        Row: {
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
        };
        Insert: {
          id?: number;
          table_name: string;
          operation: 'INSERT' | 'UPDATE' | 'DELETE';
          record_id: string;
          change_data: any;
          status: JobStatus;
          error_message?: string;
          retry_count?: number;
          created_at?: string;
          processed_at?: string;
          trace_id?: string;
        };
        Update: {
          id?: number;
          table_name?: string;
          operation?: 'INSERT' | 'UPDATE' | 'DELETE';
          record_id?: string;
          change_data?: any;
          status?: JobStatus;
          error_message?: string;
          retry_count?: number;
          created_at?: string;
          processed_at?: string;
          trace_id?: string;
        };
      };
    };
  };
}
