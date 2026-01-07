# Integration Tests

Integration tests test the complete flow from API routes through service layers to database operations. Unlike unit tests that test individual functions in isolation, integration tests verify that all components work together correctly.

## Test Structure

```
__tests__/integration/
├── setup.ts                          # Test utilities and mock helpers
├── listing-creation.integration.test.ts
├── favorite-toggle.integration.test.ts
├── messaging.integration.test.ts
└── README.md
```

## Running Integration Tests

### Prerequisites

1. **Install dependencies** (if not already installed):
```bash
cd benalsam-web-next
npm install
```

2. **Environment Variables** (optional for integration tests):
Integration tests use mocks, so environment variables are not strictly required. However, if you want to test with real services, create a `.env.test` file.

### Running Tests

#### Option 1: Run All Integration Tests
```bash
cd benalsam-web-next
npm run test -- src/__tests__/integration
```

#### Option 2: Run Specific Integration Test
```bash
# Listing creation flow
npm run test -- src/__tests__/integration/listing-creation.integration.test.ts

# Favorite toggle flow
npm run test -- src/__tests__/integration/favorite-toggle.integration.test.ts

# Messaging flow
npm run test -- src/__tests__/integration/messaging.integration.test.ts
```

#### Option 3: Run with Watch Mode
```bash
npm run test -- src/__tests__/integration --watch
```

#### Option 4: Run with UI (Interactive)
```bash
npm run test:ui -- src/__tests__/integration
```

#### Option 5: Run with Coverage
```bash
npm run test:coverage -- src/__tests__/integration
```

#### Option 6: Run Once (CI Mode)
```bash
npm run test -- src/__tests__/integration --run
```

### Troubleshooting

#### Error: EPERM: operation not permitted, open '.env.local'
This is a permission issue. Solutions:
1. **Skip .env files** (recommended for tests):
   - Tests use mocks, so .env files are not needed
   - The error is harmless if tests use mocks

2. **Fix permissions**:
```bash
chmod 644 .env.local
```

3. **Use test environment**:
```bash
NODE_ENV=test npm run test -- src/__tests__/integration
```

#### Error: Cannot find module '@/...'
Make sure you're in the `benalsam-web-next` directory:
```bash
cd benalsam-web-next
npm run test -- src/__tests__/integration
```

#### Tests are slow
Integration tests may be slower than unit tests. This is normal. To speed up:
- Use `--run` flag to disable watch mode
- Run specific test files instead of all tests
- Use `--threads=false` to disable parallel execution if needed

## Test Coverage

### ✅ Listing Creation Flow
- **File**: `listing-creation.integration.test.ts`
- **Tests**: 5 test cases
- **Coverage**:
  - ✅ Successful listing creation
  - ✅ Validation error handling
  - ✅ Authentication error handling
  - ✅ Rate limiting
  - ✅ Database error handling

### ✅ Favorite Toggle Flow
- **File**: `favorite-toggle.integration.test.ts`
- **Tests**: 4 test cases
- **Coverage**:
  - ✅ Add favorite flow
  - ✅ Remove favorite flow (if already exists)
  - ✅ Validation error handling
  - ✅ Authentication error handling

### ✅ Messaging Flow
- **File**: `messaging.integration.test.ts`
- **Tests**: 4 test cases
- **Coverage**:
  - ✅ Send message flow
  - ✅ Participant validation
  - ✅ Conversation not found handling
  - ✅ Rate limiting

## Test Utilities

### `setup.ts`

Provides common utilities for integration tests:

- **`mockUser`**: Mock authenticated user
- **`mockAdminUser`**: Mock admin user
- **`createMockRequest()`**: Creates NextRequest for testing
- **`createMockSupabaseResponse()`**: Creates mock Supabase response
- **`createMockSupabaseQueryBuilder()`**: Creates mock Supabase query builder chain
- **`wait()`**: Async wait helper
- **`cleanupTestData()`**: Test data cleanup helper

## Writing New Integration Tests

1. Import test utilities from `setup.ts`
2. Mock all external dependencies (Supabase, rate limiters, etc.)
3. Test the complete flow: API → Service → Database
4. Verify all steps in the flow are called correctly
5. Test error scenarios (validation, auth, rate limiting, database errors)

### Example

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '@/app/api/your-route/route'
import { createMockRequest, mockUser } from '../integration/setup'
import { getServerUser } from '@/lib/supabase-server'

vi.mock('@/lib/supabase-server')

describe('Integration: Your Feature Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getServerUser).mockResolvedValue(mockUser)
  })

  it('should complete the flow successfully', async () => {
    // Setup mocks
    // Create request
    // Execute API route
    // Assert results
  })
})
```

## Best Practices

1. **Test Complete Flows**: Integration tests should test the entire flow from API to database
2. **Mock External Dependencies**: Mock Supabase, rate limiters, and other external services
3. **Test Error Scenarios**: Include tests for validation errors, auth errors, rate limiting, and database errors
4. **Verify All Steps**: Assert that all steps in the flow are called (validation, rate limiting, database operations)
5. **Clean Up**: Use `cleanupTestData()` to clean up test data after tests

## Differences from Unit Tests

| Aspect | Unit Tests | Integration Tests |
|--------|-----------|-------------------|
| **Scope** | Individual functions | Complete flows |
| **Dependencies** | Fully mocked | Partially mocked |
| **Database** | Not tested | Mocked but verified |
| **API Routes** | Not tested | Fully tested |
| **Service Layer** | Tested in isolation | Tested as part of flow |

## Future Improvements

- [ ] Add E2E tests (Playwright/Cypress)
- [ ] Add real database integration tests (test database)
- [ ] Add performance tests
- [ ] Add load tests

