export type Operation = 'INSERT' | 'UPDATE' | 'DELETE';
export type MessageType = 'ELASTICSEARCH_SYNC';

export interface QueueMessage {
  type: MessageType;
  operation: Operation;
  table: string;
  recordId: string;
  changeData: any;
  messageId: string;
  timestamp: string;
}

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
