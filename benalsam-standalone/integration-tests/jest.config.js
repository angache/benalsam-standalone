module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 120000, // 2 minutes for integration tests
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  // Global fetch polyfill for Node.js
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
};
