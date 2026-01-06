import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ProtectedRoute } from '../ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

// Mock dependencies
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}))

describe('ProtectedRoute', () => {
  const mockPush = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    } as ReturnType<typeof useRouter>)
  })

  it('should render children when authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'user-1', name: 'Test User' },
    } as ReturnType<typeof useAuth>)

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should show loading spinner while checking authentication', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    } as ReturnType<typeof useAuth>)

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Yükleniyor...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should redirect to login when not authenticated', async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    } as ReturnType<typeof useAuth>)

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should not redirect when requireAuth is false', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    } as ReturnType<typeof useAuth>)

    render(
      <ProtectedRoute requireAuth={false}>
        <div>Public Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Public Content')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should redirect when user is not admin and requireAdmin is true', async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'user-1', name: 'Test User', role: 'user' },
    } as ReturnType<typeof useAuth>)

    render(
      <ProtectedRoute requireAdmin={true}>
        <div>Admin Content</div>
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/')
    })

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })

  it('should render children when user is admin and requireAdmin is true', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'user-1', name: 'Admin User', role: 'admin' },
    } as ReturnType<typeof useAuth>)

    render(
      <ProtectedRoute requireAdmin={true}>
        <div>Admin Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Admin Content')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should render children when user is moderator and requireAdmin is true', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'user-1', name: 'Moderator User', role: 'moderator' },
    } as ReturnType<typeof useAuth>)

    render(
      <ProtectedRoute requireAdmin={true}>
        <div>Moderator Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Moderator Content')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should not redirect while loading even if not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    } as ReturnType<typeof useAuth>)

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(mockPush).not.toHaveBeenCalled()
    expect(screen.getByText('Yükleniyor...')).toBeInTheDocument()
  })

  it('should handle require2FA prop (currently skipped)', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'user-1', name: 'Test User', is_2fa_enabled: true },
    } as ReturnType<typeof useAuth>)

    render(
      <ProtectedRoute require2FA={true}>
        <div>2FA Protected Content</div>
      </ProtectedRoute>
    )

    // Currently 2FA check is skipped, so content should render
    expect(screen.getByText('2FA Protected Content')).toBeInTheDocument()
  })
})

