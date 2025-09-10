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

export type QueueMessage = ElasticsearchSyncMessage | StatusChangeMessage;

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
