import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'
import speakeasy from 'speakeasy'

// Mock dependencies
vi.mock('@/lib/supabase-server', () => ({
  getServerUser: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimiters: {
    strict: {
      check: vi.fn(),
    },
  },
  getClientIdentifier: vi.fn(() => 'test-identifier'),
  rateLimitExceeded: vi.fn(() => new Response(JSON.stringify({ success: false, error: { code: 'SRV_005' } }), { status: 429 })),
}))

vi.mock('@/utils/production-logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/lib/api-validation', async () => {
  const actual = await vi.importActual('@/lib/api-validation')
  return {
    ...actual,
    validateBody: vi.fn(),
  }
})

vi.mock('speakeasy', () => ({
  default: {
    totp: {
      verify: vi.fn(),
    },
  },
}))

import { getServerUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { rateLimiters } from '@/lib/rate-limit'
import { validateBody } from '@/lib/api-validation'

describe('POST /api/2fa/verify', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  }

  const mockProfile = {
    id: 'test-user-id',
    totp_secret: 'JBSWY3DPEHPK3PXP',
    backup_codes: ['123456', '789012'],
    is_2fa_enabled: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getServerUser).mockResolvedValue(mockUser)
    vi.mocked(rateLimiters.strict.check).mockResolvedValue(true)
    vi.mocked(speakeasy.totp.verify).mockReturnValue(true)
    // Mock validateBody to return success by default
    vi.mocked(validateBody).mockResolvedValue({
      success: true,
      data: { code: '123456', userId: mockUser.id },
    })
  })

  it('should verify valid TOTP code', async () => {
    // Mock profile without backup codes to ensure TOTP verification path
    const profileWithoutBackupCodes = {
      ...mockProfile,
      backup_codes: [],
    }

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: profileWithoutBackupCodes,
          error: null,
        }),
      }),
    })

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    })

    vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: mockSelect,
          update: mockUpdate,
        } as unknown as ReturnType<typeof supabaseAdmin.from>
      }
      return {} as unknown as ReturnType<typeof supabaseAdmin.from>
    })

    const request = new NextRequest('http://localhost:3000/api/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({
        code: '123456',
        userId: mockUser.id,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    // createSuccessResponse wraps data in data field
    expect(data.data?.message || data.message).toBe('Kod doğrulandı')
  })

  it('should return 429 if rate limit is exceeded', async () => {
    vi.mocked(rateLimiters.strict.check).mockResolvedValue(false)

    const request = new NextRequest('http://localhost:3000/api/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({
        code: '123456',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('SRV_005')
  })

  it('should return 400 for invalid code format', async () => {
    // Mock validateBody to return validation error
    vi.mocked(validateBody).mockResolvedValue({
      success: false,
      response: new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Validation failed',
            errors: [
              { field: 'code', message: 'Kod 6 haneli olmalıdır', code: 'too_small' },
            ],
          },
        }),
        { status: 400 }
      ),
    })

    const request = new NextRequest('http://localhost:3000/api/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({
        code: '12345', // Too short
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VAL_001')
  })

  it('should return 401 for invalid TOTP code', async () => {
    vi.mocked(speakeasy.totp.verify).mockReturnValue(false)

    // Mock profile without backup codes to ensure TOTP verification path
    const profileWithoutBackupCodes = {
      ...mockProfile,
      backup_codes: [],
    }

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: profileWithoutBackupCodes,
          error: null,
        }),
      }),
    })

    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: mockSelect,
    } as unknown as ReturnType<typeof supabaseAdmin.from>)

    const request = new NextRequest('http://localhost:3000/api/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({
        code: '000000',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('AUTH_001')
  })

  it('should accept backup codes', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      }),
    })

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    })

    vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: mockSelect,
          update: mockUpdate,
        } as unknown as ReturnType<typeof supabaseAdmin.from>
      }
      return {} as unknown as ReturnType<typeof supabaseAdmin.from>
    })

    const request = new NextRequest('http://localhost:3000/api/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({
        code: '123456', // Backup code
        userId: mockUser.id,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message || data.data?.message).toBe('Backup kod doğrulandı')
    if (data.remainingBackupCodes !== undefined) {
      expect(data.remainingBackupCodes).toBe(1) // One code used
    } else if (data.data?.remainingBackupCodes !== undefined) {
      expect(data.data.remainingBackupCodes).toBe(1)
    }
  })

  it('should return 404 if user not found', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'User not found' },
        }),
      }),
    })

    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: mockSelect,
    } as unknown as ReturnType<typeof supabaseAdmin.from>)

    const request = new NextRequest('http://localhost:3000/api/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({
        code: '123456',
        userId: 'non-existent-user',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('RES_001')
  })
})

