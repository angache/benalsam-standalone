import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useFavorites, useRemoveFavorite } from '../useFavorites'
import { fetchUserFavoriteListings, removeFavorite } from '@/services/favoriteService'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/use-toast'

// Mock dependencies
vi.mock('@/services/favoriteService', () => ({
  fetchUserFavoriteListings: vi.fn(),
  removeFavorite: vi.fn(),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/components/ui/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}))

describe('useFavorites', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  }

  const mockListings = [
    {
      id: 'listing-1',
      title: 'Test Listing 1',
      price: 100,
    },
    {
      id: 'listing-2',
      title: 'Test Listing 2',
      price: 200,
    },
  ]

  it('should fetch favorites when user is authenticated', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isLoading: false,
    } as ReturnType<typeof useAuth>)

    vi.mocked(fetchUserFavoriteListings).mockResolvedValue(mockListings as never)

    const { result } = renderHook(() => useFavorites(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockListings)
    expect(fetchUserFavoriteListings).toHaveBeenCalledWith(mockUser.id)
  })

  it('should not fetch favorites when user is not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
    } as ReturnType<typeof useAuth>)

    const { result } = renderHook(() => useFavorites(), { wrapper })

    expect(result.current.isEnabled).toBe(false)
    expect(fetchUserFavoriteListings).not.toHaveBeenCalled()
  })

  it('should return empty array when user is not authenticated', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
    } as ReturnType<typeof useAuth>)

    const { result } = renderHook(() => useFavorites(), { wrapper })

    await waitFor(() => {
      expect(result.current.data).toEqual([])
    })
  })

  it('should handle fetch errors', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isLoading: false,
    } as ReturnType<typeof useAuth>)

    const error = new Error('Failed to fetch favorites')
    vi.mocked(fetchUserFavoriteListings).mockRejectedValue(error)

    const { result } = renderHook(() => useFavorites(), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toEqual(error)
  })
})

describe('useRemoveFavorite', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  }

  it('should remove favorite successfully', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isLoading: false,
    } as ReturnType<typeof useAuth>)

    const mockToast = vi.fn()
    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
    })

    vi.mocked(removeFavorite).mockResolvedValue({ success: true } as never)

    const { result } = renderHook(() => useRemoveFavorite(), { wrapper })

    await result.current.mutateAsync('listing-1')

    expect(removeFavorite).toHaveBeenCalledWith(mockUser.id, 'listing-1')
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Favorilerden Kaldırıldı',
      description: 'İlan favorilerinizden kaldırıldı.',
    })
  })

  it('should throw error when user is not authenticated', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
    } as ReturnType<typeof useAuth>)

    const { result } = renderHook(() => useRemoveFavorite(), { wrapper })

    await expect(result.current.mutateAsync('listing-1')).rejects.toThrow(
      'User not authenticated'
    )
  })

  it('should handle remove favorite errors', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isLoading: false,
    } as ReturnType<typeof useAuth>)

    const mockToast = vi.fn()
    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
    })

    const error = new Error('Failed to remove favorite')
    vi.mocked(removeFavorite).mockRejectedValue(error)

    const { result } = renderHook(() => useRemoveFavorite(), { wrapper })

    await expect(result.current.mutateAsync('listing-1')).rejects.toThrow()

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Hata',
      description: 'Favori kaldırılırken bir hata oluştu.',
      variant: 'destructive',
    })
  })

  it('should invalidate queries after successful removal', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isLoading: false,
    } as ReturnType<typeof useAuth>)

    vi.mocked(removeFavorite).mockResolvedValue({ success: true } as never)

    // Set initial query data
    queryClient.setQueryData(['favorites', mockUser.id], [
      { id: 'listing-1' },
      { id: 'listing-2' },
    ])

    const { result } = renderHook(() => useRemoveFavorite(), { wrapper })

    await result.current.mutateAsync('listing-1')

    // Check that queries were invalidated
    const favoritesData = queryClient.getQueryData(['favorites', mockUser.id])
    expect(favoritesData).toBeUndefined()
  })
})

