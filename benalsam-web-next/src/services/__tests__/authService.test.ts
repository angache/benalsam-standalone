import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthService } from '../authService'
import { supabase } from '@/lib/supabase'
import { db } from '@/lib/supabase'

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
    },
  },
  db: {
    profiles: vi.fn(),
  },
}))

vi.mock('@/utils/production-logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock fetch for 2FA verification
global.fetch = vi.fn()

describe('AuthService', () => {
  const mockUserId = 'test-user-id'
  const mockUser = {
    id: mockUserId,
    email: 'test@example.com',
    username: 'testuser',
    name: 'Test User',
    avatar_url: null,
    is_2fa_enabled: false,
    created_at: '2025-01-01T00:00:00Z',
  }

  const mockAuthUser = {
    id: mockUserId,
    email: 'test@example.com',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000'
  })

  describe('signUp', () => {
    it('should sign up a user successfully', async () => {
      const signUpData = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
        name: 'Test User',
      }

      const mockProfiles = {
        insert: vi.fn().mockReturnValue({
          error: null,
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUser,
              error: null,
            }),
          }),
        }),
      }

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: {
          user: mockAuthUser,
          session: null,
        },
        error: null,
      } as any)

      vi.mocked(db.profiles).mockReturnValue(mockProfiles as any)

      const result = await AuthService.signUp(signUpData)

      expect(result.data).toEqual(mockUser)
      expect(result.error).toBeUndefined()
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            username: signUpData.username,
            name: signUpData.name,
          },
        },
      })
    })

    it('should handle auth error during sign up', async () => {
      const signUpData = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      }

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'Email already exists',
          name: 'AuthApiError',
        },
      } as any)

      const result = await AuthService.signUp(signUpData)

      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Email already exists')
      expect(result.error?.code).toBe('AuthApiError')
    })

    it('should handle profile creation error', async () => {
      const signUpData = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
        name: 'Test User',
      }

      const mockProfiles = {
        insert: vi.fn().mockReturnValue({
          error: {
            message: 'Profile creation failed',
            code: 'PGRST301',
          },
        }),
      }

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: {
          user: mockAuthUser,
          session: null,
        },
        error: null,
      } as any)

      vi.mocked(db.profiles).mockReturnValue(mockProfiles as any)

      const result = await AuthService.signUp(signUpData)

      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('PROFILE_CREATION_FAILED')
    })
  })

  describe('signIn', () => {
    it('should sign in a user successfully', async () => {
      const signInData = {
        email: 'test@example.com',
        password: 'password123',
      }

      const mockProfiles = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUser,
              error: null,
            }),
          }),
        }),
      }

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: mockAuthUser,
          session: {
            access_token: 'token',
          },
        },
        error: null,
      } as any)

      vi.mocked(db.profiles).mockReturnValue(mockProfiles as any)

      const result = await AuthService.signIn(signInData)

      expect(result.data).toEqual(mockUser)
      expect(result.error).toBeUndefined()
    })

    it('should require 2FA when enabled', async () => {
      const signInData = {
        email: 'test@example.com',
        password: 'password123',
      }

      const userWith2FA = { ...mockUser, is_2fa_enabled: true }

      const mockProfiles = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: userWith2FA,
              error: null,
            }),
          }),
        }),
      }

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: mockAuthUser,
          session: {
            access_token: 'token',
          },
        },
        error: null,
      } as any)

      vi.mocked(db.profiles).mockReturnValue(mockProfiles as any)

      const result = await AuthService.signIn(signInData)

      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('2FA_REQUIRED')
      expect(result.error?.requires2FA).toBe(true)
    })

    it('should handle auth error during sign in', async () => {
      const signInData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      }

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'Invalid credentials',
          name: 'AuthApiError',
        },
      } as any)

      const result = await AuthService.signIn(signInData)

      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Invalid credentials')
    })
  })

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      } as any)

      const result = await AuthService.signOut()

      expect(result.data).toBeUndefined()
      expect(result.error).toBeUndefined()
      expect(supabase.auth.signOut).toHaveBeenCalled()
    })

    it('should handle sign out error', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: {
          message: 'Sign out failed',
          name: 'AuthApiError',
        },
      } as any)

      const result = await AuthService.signOut()

      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Sign out failed')
    })
  })

  describe('getCurrentSession', () => {
    it('should get current session successfully', async () => {
      const mockProfiles = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUser,
              error: null,
            }),
          }),
        }),
      }

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            user: mockAuthUser,
            access_token: 'token',
          },
        },
        error: null,
      } as any)

      vi.mocked(db.profiles).mockReturnValue(mockProfiles as any)

      const result = await AuthService.getCurrentSession()

      expect(result.data).toEqual(mockUser)
      expect(result.error).toBeUndefined()
    })

    it('should return null when no session', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: null,
        },
        error: null,
      } as any)

      const result = await AuthService.getCurrentSession()

      expect(result.data).toBeNull()
      expect(result.error).toBeUndefined()
    })

    it('should handle session error', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: {
          message: 'Session error',
          name: 'AuthApiError',
        },
      } as any)

      const result = await AuthService.getCurrentSession()

      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Session error')
    })
  })

  describe('getUserProfile', () => {
    it('should get user profile successfully', async () => {
      const mockProfiles = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUser,
              error: null,
            }),
          }),
        }),
      }

      vi.mocked(db.profiles).mockReturnValue(mockProfiles as any)

      const result = await AuthService.getUserProfile(mockUserId)

      expect(result).toEqual(mockUser)
    })

    it('should throw error when profile not found', async () => {
      const mockProfiles = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: {
                message: 'Profile not found',
                code: 'PGRST116',
              },
            }),
          }),
        }),
      }

      vi.mocked(db.profiles).mockReturnValue(mockProfiles as any)

      await expect(AuthService.getUserProfile(mockUserId)).rejects.toThrow('Profil getirilemedi')
    })
  })

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const updates = {
        name: 'Updated Name',
        avatar_url: 'https://example.com/avatar.jpg',
      }

      const updatedUser = { ...mockUser, ...updates }

      const mockProfiles = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: updatedUser,
                error: null,
              }),
            }),
          }),
        }),
      }

      vi.mocked(db.profiles).mockReturnValue(mockProfiles as any)

      const result = await AuthService.updateProfile(mockUserId, updates)

      expect(result.data).toEqual(updatedUser)
      expect(result.error).toBeUndefined()
    })

    it('should handle update error', async () => {
      const updates = {
        name: 'Updated Name',
      }

      const mockProfiles = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: {
                  message: 'Update failed',
                  name: 'PGRST301',
                },
              }),
            }),
          }),
        }),
      }

      vi.mocked(db.profiles).mockReturnValue(mockProfiles as any)

      const result = await AuthService.updateProfile(mockUserId, updates)

      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Update failed')
    })
  })
})

