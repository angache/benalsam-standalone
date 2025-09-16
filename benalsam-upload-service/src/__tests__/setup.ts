// Test setup file
import { config } from 'dotenv';

// Load environment variables for testing
config({ path: '.env.test' });

// Mock external services
jest.mock('../config/cloudinary', () => ({
  cloudinary: {
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn(),
      rename: jest.fn(),
    },
    api: {
      ping: jest.fn(),
      usage: jest.fn(),
    },
  },
}));

jest.mock('../config/redis', () => ({
  connectRedis: jest.fn(),
  getClient: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    ping: jest.fn(),
  })),
}));

jest.mock('../config/rabbitmq', () => ({
  connectRabbitMQ: jest.fn(),
  getChannel: jest.fn(() => ({
    assertQueue: jest.fn(),
    assertExchange: jest.fn(),
    publish: jest.fn(),
    consume: jest.fn(),
  })),
}));

// Global test timeout
jest.setTimeout(10000);
