export type Operation = 'INSERT' | 'UPDATE' | 'DELETE';
export type MessageType = 'ELASTICSEARCH_SYNC';

export interface BaseQueueMessage {
  messageId?: string;
  timestamp?: string;
  traceId?: string;
}

export interface ElasticsearchSyncMessage extends BaseQueueMessage {
  type: MessageType;
  operation: Operation;
  table: string;
  recordId: string;
  changeData: any;
}

export interface StatusChangeMessage extends BaseQueueMessage {
  listingId: string;
  status: string;
}

export interface FirebaseEventMessage extends BaseQueueMessage {
  id: string; // Firebase job ID
  type: string; // 'status_change' | 'listing_change'
  action: string; // 'update' | 'insert' | 'delete'
  recordId: string; // Listing ID
  source: string; // 'firebase_realtime' | 'supabase'
  data: {
    listingId: string;
    jobId: string;
    change: {
      field: string;
      newValue: any;
      oldValue?: any;
      changedAt: string;
    };
    source: {
      database: string;
      table: string;
      id: string;
    };
  };
}

export type QueueMessage = ElasticsearchSyncMessage | StatusChangeMessage | FirebaseEventMessage;

export interface MessageOptions {
  messageId: string;
  timestamp?: string;
  priority?: number;
  headers?: Record<string, string>;
}

export interface PublishResult {
  success: boolean;
  messageId: string;
  error?: string;
}

export interface ConsumeResult {
  success: boolean;
  messageId: string;
  error?: string;
  retryCount?: number;
}
