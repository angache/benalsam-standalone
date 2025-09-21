/**
 * Test Setup Configuration
 * Jest test environment setup for Search Service
 */

// Mock console methods to reduce noise in tests
const originalConsole = global.console;

beforeAll(() => {
  global.console = {
    ...originalConsole,
    // Suppress console.log in tests unless explicitly needed
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
});

afterAll(() => {
  global.console = originalConsole;
});

// Global test timeout
jest.setTimeout(10000);

// Mock environment variables
process.env['NODE_ENV'] = 'test';
process.env['PORT'] = '3016';
process.env['SERVICE_NAME'] = 'search-service-test';
process.env['ELASTICSEARCH_DEFAULT_INDEX'] = 'listings';
process.env['SUPABASE_URL'] = 'https://test.supabase.co';
process.env['SUPABASE_SERVICE_ROLE_KEY'] = 'test-key';

// Dummy test to satisfy Jest requirement
describe('Test Setup', () => {
  it('should setup test environment', () => {
    expect(true).toBe(true);
  });
});
