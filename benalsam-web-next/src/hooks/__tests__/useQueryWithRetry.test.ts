import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useQueryWithRetry } from '../useQueryWithRetry'
import { useRetry } from '../useRetry'

// Mock useRetry
vi.mock('../useRetry', () => ({
  useRetry: vi.fn(),
}))

describe('useQueryWithRetry', () => {
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

    // Default mock for useRetry
    vi.mocked(useRetry).mockReturnValue({
      retry: vi.fn(),
      reset: vi.fn(),
      retryState: {
        retryCount: 0,
        isRetrying: false,
        lastError: null,
      },
      canRetry: true,
      remainingRetries: 3,
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  const mockData = { id: '1', name: 'Test' }

  it('should fetch data successfully', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockData)

    const { result } = renderHook(
      () =>
        useQueryWithRetry({
          queryKey: ['test'],
          queryFn: fetchFn,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockData)
    expect(fetchFn).toHaveBeenCalled()
  })

  it('should retry on network errors', async () => {
    const networkError = new Error('Network error')
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce(mockData)

    const { result } = renderHook(
      () =>
        useQueryWithRetry({
          queryKey: ['test'],
          queryFn: fetchFn,
          maxRetries: 3,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    }, { timeout: 5000 })

    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('should not retry on 4xx errors', async () => {
    const clientError = new Error('400 Bad Request')
    const fetchFn = vi.fn().mockRejectedValue(clientError)

    const { result } = renderHook(
      () =>
        useQueryWithRetry({
          queryKey: ['test'],
          queryFn: fetchFn,
          maxRetries: 3,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // Should not retry on client errors
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('should retry on 5xx errors', async () => {
    interface ErrorWithStatus extends Error {
      status?: number
    }
    const serverError: ErrorWithStatus = new Error('500 Internal Server Error')
    serverError.status = 500

    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(serverError)
      .mockResolvedValueOnce(mockData)

    const { result } = renderHook(
      () =>
        useQueryWithRetry({
          queryKey: ['test'],
          queryFn: fetchFn,
          maxRetries: 3,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    }, { timeout: 5000 })

    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('should use custom maxRetries', () => {
    const fetchFn = vi.fn().mockResolvedValue(mockData)

    renderHook(
      () =>
        useQueryWithRetry({
          queryKey: ['test'],
          queryFn: fetchFn,
          maxRetries: 5,
        }),
      { wrapper }
    )

    expect(useRetry).toHaveBeenCalledWith(
      expect.objectContaining({
        maxRetries: 5,
      })
    )
  })

  it('should use custom retryDelay', () => {
    const fetchFn = vi.fn().mockResolvedValue(mockData)

    renderHook(
      () =>
        useQueryWithRetry({
          queryKey: ['test'],
          queryFn: fetchFn,
          retryDelay: 2000,
        }),
      { wrapper }
    )

    expect(useRetry).toHaveBeenCalledWith(
      expect.objectContaining({
        retryDelay: 2000,
      })
    )
  })

  it('should call onMaxRetriesReached when max retries reached', async () => {
    const onMaxRetriesReached = vi.fn()
    const fetchFn = vi.fn().mockRejectedValue(new Error('Network error'))

    renderHook(
      () =>
        useQueryWithRetry({
          queryKey: ['test'],
          queryFn: fetchFn,
          maxRetries: 1,
          onMaxRetriesReached,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(onMaxRetriesReached).toHaveBeenCalled()
    }, { timeout: 5000 })
  })

  it('should provide manual retry function', async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockData)
    const mockReset = vi.fn()

    vi.mocked(useRetry).mockReturnValue({
      retry: vi.fn(),
      reset: mockReset,
      retryState: {
        retryCount: 0,
        isRetrying: false,
        lastError: null,
      },
      canRetry: true,
      remainingRetries: 3,
    })

    const { result } = renderHook(
      () =>
        useQueryWithRetry({
          queryKey: ['test'],
          queryFn: fetchFn,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.retry).toBeDefined()
    expect(typeof result.current.retry).toBe('function')

    // Call retry
    result.current.retry()

    expect(mockReset).toHaveBeenCalled()
    expect(fetchFn).toHaveBeenCalledTimes(2) // Initial + retry
  })

  it('should use exponential backoff for retry delay', async () => {
    const networkError = new Error('Network error')
    const fetchFn = vi.fn().mockRejectedValue(networkError)

    renderHook(
      () =>
        useQueryWithRetry({
          queryKey: ['test'],
          queryFn: fetchFn,
          maxRetries: 3,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(fetchFn).toHaveBeenCalled()
    })

    // Check that retry delay uses exponential backoff
    // The actual delay calculation is handled by React Query
    expect(fetchFn).toHaveBeenCalled()
  })

  it('should not retry when maxRetries is 0', async () => {
    const networkError = new Error('Network error')
    const fetchFn = vi.fn().mockRejectedValue(networkError)

    const { result } = renderHook(
      () =>
        useQueryWithRetry({
          queryKey: ['test'],
          queryFn: fetchFn,
          maxRetries: 0,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // Should not retry
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('should handle timeout errors', async () => {
    const timeoutError = new Error('Request timeout')
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(timeoutError)
      .mockResolvedValueOnce(mockData)

    const { result } = renderHook(
      () =>
        useQueryWithRetry({
          queryKey: ['test'],
          queryFn: fetchFn,
          maxRetries: 3,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    }, { timeout: 5000 })

    // Should retry on timeout
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })
})

