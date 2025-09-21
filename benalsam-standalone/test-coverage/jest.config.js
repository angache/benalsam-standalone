module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/../'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/src/**/*.ts',
    '!**/src/**/*.d.ts',
    '!**/src/**/*.test.ts',
    '!**/src/**/*.spec.ts',
    '!**/src/**/__tests__/**',
    '!**/src/**/index.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json',
    'json-summary'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testTimeout: 30000,
  verbose: true,
  projects: [
    {
      displayName: 'Queue Service',
      testMatch: ['<rootDir>/../benalsam-queue-service/src/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/../benalsam-queue-service/src/__tests__/setup.ts']
    },
    {
      displayName: 'Search Service',
      testMatch: ['<rootDir>/../benalsam-search-service/src/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/../benalsam-search-service/src/__tests__/setup.ts']
    },
    {
      displayName: 'Categories Service',
      testMatch: ['<rootDir>/../benalsam-categories-service/src/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/../benalsam-categories-service/src/__tests__/setup.ts']
    },
    {
      displayName: 'Upload Service',
      testMatch: ['<rootDir>/../benalsam-upload-service/src/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/../benalsam-upload-service/src/__tests__/setup.ts']
    },
    {
      displayName: 'Shared Types',
      testMatch: ['<rootDir>/../benalsam-shared-types/src/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/../benalsam-shared-types/src/__tests__/setup.ts']
    }
  ]
};
