/**
 * Jest Test Setup
 * Test ortamı için gerekli konfigürasyon
 */

import 'dotenv/config';

// Mock external services
jest.mock('../config/elasticsearch', () => ({
  elasticsearchConfig: {
    getClient: jest.fn(),
    isConnected: jest.fn().mockReturnValue(true),
    getClusterHealth: jest.fn().mockResolvedValue({ status: 'yellow' })
  }
}));

jest.mock('../config/rabbitmq', () => ({
  rabbitmqConfig: {
    getChannel: jest.fn(),
    isConnected: jest.fn().mockReturnValue(true)
  }
}));

jest.mock('../config/supabase', () => ({
  supabaseConfig: {
    getClient: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      })
    })
  }
}));

jest.mock('../services/dlqService', () => ({
  dlqService: {
    sendToDLQ: jest.fn().mockResolvedValue(undefined),
    getHealthStatus: jest.fn().mockResolvedValue({ healthy: true })
  }
}));

jest.mock('../services/retryService', () => ({
  retryService: {
    executeWithRetry: jest.fn().mockResolvedValue({
      success: true,
      attempts: 1,
      totalDelay: 0
    })
  }
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.ELASTICSEARCH_URL = 'http://localhost:9200';
process.env.RABBITMQ_URL = 'amqp://localhost:5672';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';