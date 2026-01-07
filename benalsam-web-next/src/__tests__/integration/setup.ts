/**
 * Integration Test Setup
 * 
 * Provides utilities and mocks for integration testing.
 * Integration tests test the full flow: API → Service → Database/External Services
 */

import { vi } from 'vitest'
import { NextRequest } from 'next/server'

/**
 * Mock user for testing
 */
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user' as const,
  is_2fa_enabled: false,
}

/**
 * Mock authenticated user (admin)
 */
export const mockAdminUser = {
  id: 'admin-user-id',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin' as const,
  is_2fa_enabled: false,
}

/**
 * Creates a mock NextRequest for testing
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string
    body?: unknown
    headers?: Record<string, string>
    cookies?: Record<string, string>
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {}, cookies = {} } = options

  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (body) {
    requestInit.body = JSON.stringify(body)
  }

  const request = new NextRequest(url, requestInit)

  // Add cookies if provided
  if (Object.keys(cookies).length > 0) {
    const cookieHeader = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ')
    request.headers.set('Cookie', cookieHeader)
  }

  return request
}

/**
 * Mock Supabase response helper
 */
export function createMockSupabaseResponse<T>(data: T, error: unknown = null) {
  return {
    data,
    error,
    status: error ? 400 : 200,
    statusText: error ? 'Bad Request' : 'OK',
  }
}

/**
 * Mock Supabase query builder chain
 */
export function createMockSupabaseQueryBuilder<T>(data: T[] = [], error: unknown = null) {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(createMockSupabaseResponse(data[0] || null, error)),
    maybeSingle: vi.fn().mockResolvedValue(createMockSupabaseResponse(data[0] || null, error)),
    then: vi.fn().mockResolvedValue(createMockSupabaseResponse(data, error)),
  }

  return mockChain
}

/**
 * Wait helper for async operations
 */
export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Test database cleanup helper
 */
export async function cleanupTestData(testIds: string[]): Promise<void> {
  // In a real integration test, this would clean up test data
  // For now, it's a placeholder
  console.log('[Test] Cleaning up test data:', testIds)
}

