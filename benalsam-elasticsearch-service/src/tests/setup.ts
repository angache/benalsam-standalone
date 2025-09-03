// Test ortamı için environment variables
process.env.NODE_ENV = 'test';
process.env.ELASTICSEARCH_URL = 'http://localhost:9200';
process.env.RABBITMQ_URL = 'amqp://localhost:5672';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_KEY = 'test-key';

// Jest için global matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});
