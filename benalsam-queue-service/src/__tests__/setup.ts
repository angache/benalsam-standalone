/**
 * Test Setup Configuration
 * Jest test environment setup for unit and integration tests
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

// Global test timeout (will be overridden by project-specific timeouts)
jest.setTimeout(30000);

// Mock environment variables
process.env['NODE_ENV'] = 'test';
process.env['PORT'] = '3012';
process.env['SERVICE_NAME'] = 'queue-service-test';

// Testcontainers configuration
process.env['TESTCONTAINERS_HOST_OVERRIDE'] = 'localhost';
process.env['TESTCONTAINERS_WAIT_STRATEGY_TIMEOUT'] = '120000';

// Dummy test to satisfy Jest requirement
describe('Test Setup', () => {
  it('should setup test environment', () => {
    expect(true).toBe(true);
  });
});
