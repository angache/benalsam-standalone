import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useBackgroundRefetch } from '../useBackgroundRefetch'
import { logger } from '@/utils/production-logger'

// Mock dependencies
vi.mock('@/utils/production-logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock timers
vi.useFakeTimers()

describe('useBackgroundRefetch', () => {
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
    vi.clearAllTimers()

    // Mock document.hidden
    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: false,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should refetch queries at interval', async () => {
    const refetchQueriesSpy = vi.spyOn(queryClient, 'refetchQueries')

    renderHook(
      () =>
        useBackgroundRefetch({
          queryKeys: [['test-query']],
          interval: 1000,
        }),
      { wrapper }
    )

    // Fast-forward time
    await vi.advanceTimersByTimeAsync(1000)

    await waitFor(() => {
      expect(refetchQueriesSpy).toHaveBeenCalled()
    })

    expect(refetchQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['test-query'],
      type: 'active',
    })
  })

  it('should refetch multiple query keys', async () => {
    const refetchQueriesSpy = vi.spyOn(queryClient, 'refetchQueries')

    renderHook(
      () =>
        useBackgroundRefetch({
          queryKeys: [['query-1'], ['query-2']],
          interval: 1000,
        }),
      { wrapper }
    )

    await vi.advanceTimersByTimeAsync(1000)

    await waitFor(() => {
      expect(refetchQueriesSpy).toHaveBeenCalledTimes(2)
    })

    expect(refetchQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['query-1'],
      type: 'active',
    })
    expect(refetchQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['query-2'],
      type: 'active',
    })
  })

  it('should not refetch when tab is hidden and onlyWhenVisible is true', async () => {
    const refetchQueriesSpy = vi.spyOn(queryClient, 'refetchQueries')

    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: true,
    })

    renderHook(
      () =>
        useBackgroundRefetch({
          queryKeys: [['test-query']],
          interval: 1000,
          onlyWhenVisible: true,
        }),
      { wrapper }
    )

    await vi.advanceTimersByTimeAsync(1000)

    // Should not refetch when hidden
    expect(refetchQueriesSpy).not.toHaveBeenCalled()
  })

  it('should refetch when tab is hidden if onlyWhenVisible is false', async () => {
    const refetchQueriesSpy = vi.spyOn(queryClient, 'refetchQueries')

    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: true,
    })

    renderHook(
      () =>
        useBackgroundRefetch({
          queryKeys: [['test-query']],
          interval: 1000,
          onlyWhenVisible: false,
        }),
      { wrapper }
    )

    await vi.advanceTimersByTimeAsync(1000)

    await waitFor(() => {
      expect(refetchQueriesSpy).toHaveBeenCalled()
    })
  })

  it('should not refetch when enabled is false', async () => {
    const refetchQueriesSpy = vi.spyOn(queryClient, 'refetchQueries')

    renderHook(
      () =>
        useBackgroundRefetch({
          queryKeys: [['test-query']],
          interval: 1000,
          enabled: false,
        }),
      { wrapper }
    )

    await vi.advanceTimersByTimeAsync(1000)

    expect(refetchQueriesSpy).not.toHaveBeenCalled()
  })

  it('should use default interval of 30 seconds', async () => {
    const refetchQueriesSpy = vi.spyOn(queryClient, 'refetchQueries')

    renderHook(
      () =>
        useBackgroundRefetch({
          queryKeys: [['test-query']],
        }),
      { wrapper }
    )

    // Default is 30000ms
    await vi.advanceTimersByTimeAsync(30000)

    await waitFor(() => {
      expect(refetchQueriesSpy).toHaveBeenCalled()
    })
  })

  it('should cleanup interval on unmount', async () => {
    const refetchQueriesSpy = vi.spyOn(queryClient, 'refetchQueries')

    const { unmount } = renderHook(
      () =>
        useBackgroundRefetch({
          queryKeys: [['test-query']],
          interval: 1000,
        }),
      { wrapper }
    )

    unmount()

    await vi.advanceTimersByTimeAsync(2000)

    // Should not refetch after unmount
    expect(refetchQueriesSpy).not.toHaveBeenCalled()
  })

  it('should cleanup visibility change listener on unmount', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener')
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

    const { unmount } = renderHook(
      () =>
        useBackgroundRefetch({
          queryKeys: [['test-query']],
          interval: 1000,
        }),
      { wrapper }
    )

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    )

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    )
  })

  it('should provide manual refetch function', async () => {
    const refetchQueriesSpy = vi.spyOn(queryClient, 'refetchQueries')

    const { result } = renderHook(
      () =>
        useBackgroundRefetch({
          queryKeys: [['test-query']],
          interval: 1000,
        }),
      { wrapper }
    )

    // Manual refetch
    result.current.refetch()

    await waitFor(() => {
      expect(refetchQueriesSpy).toHaveBeenCalled()
    })

    expect(refetchQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['test-query'],
    })
  })

  it('should log debug messages when refetching', async () => {
    const refetchQueriesSpy = vi.spyOn(queryClient, 'refetchQueries')

    renderHook(
      () =>
        useBackgroundRefetch({
          queryKeys: [['test-query']],
          interval: 1000,
        }),
      { wrapper }
    )

    await vi.advanceTimersByTimeAsync(1000)

    await waitFor(() => {
      expect(logger.debug).toHaveBeenCalled()
    })

    expect(logger.debug).toHaveBeenCalledWith(
      '[BackgroundRefetch] Refetching queries',
      expect.objectContaining({
        queryKeys: expect.any(Array),
      })
    )
  })

  it('should handle array query keys', async () => {
    const refetchQueriesSpy = vi.spyOn(queryClient, 'refetchQueries')

    renderHook(
      () =>
        useBackgroundRefetch({
          queryKeys: [['query', 'param1', 'param2']],
          interval: 1000,
        }),
      { wrapper }
    )

    await vi.advanceTimersByTimeAsync(1000)

    await waitFor(() => {
      expect(refetchQueriesSpy).toHaveBeenCalled()
    })

    expect(refetchQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['query', 'param1', 'param2'],
      type: 'active',
    })
  })

  it('should handle string query keys', async () => {
    const refetchQueriesSpy = vi.spyOn(queryClient, 'refetchQueries')

    renderHook(
      () =>
        useBackgroundRefetch({
          queryKeys: ['simple-query'],
          interval: 1000,
        }),
      { wrapper }
    )

    await vi.advanceTimersByTimeAsync(1000)

    await waitFor(() => {
      expect(refetchQueriesSpy).toHaveBeenCalled()
    })

    expect(refetchQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['simple-query'],
      type: 'active',
    })
  })
})

