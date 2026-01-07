import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useRetry } from '../useRetry'

describe('useRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    vi.clearAllTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return retry function and state', () => {
    const { result } = renderHook(() => useRetry())

    expect(result.current.retry).toBeDefined()
    expect(typeof result.current.retry).toBe('function')
    expect(result.current.reset).toBeDefined()
    expect(result.current.retryState).toBeDefined()
    expect(result.current.canRetry).toBe(true)
    expect(result.current.remainingRetries).toBe(3) // Default maxRetries
  })

  it('should execute function successfully on first try', async () => {
    const { result } = renderHook(() => useRetry())
    const mockFn = vi.fn().mockResolvedValue('success')

    await act(async () => {
      const value = await result.current.retry(mockFn)
      expect(value).toBe('success')
    })

    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(result.current.retryState.retryCount).toBe(0)
    expect(result.current.retryState.isRetrying).toBe(false)
  })

  it('should retry on failure', async () => {
    const { result } = renderHook(() => useRetry({ maxRetries: 3 }))
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('First attempt failed'))
      .mockResolvedValueOnce('success')

    const retryPromise = act(async () => {
      return await result.current.retry(mockFn)
    })

    // Fast-forward timers to skip delay
    await act(async () => {
      vi.advanceTimersByTime(1000) // Default retryDelay
    })

    await act(async () => {
      const value = await retryPromise
      expect(value).toBe('success')
    })

    expect(mockFn).toHaveBeenCalledTimes(2)
    expect(result.current.retryState.retryCount).toBe(0) // Reset after success
  })

  it('should use exponential backoff', async () => {
    const { result } = renderHook(() =>
      useRetry({ maxRetries: 3, retryDelay: 1000, backoffMultiplier: 2 })
    )

    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('First attempt'))
      .mockRejectedValueOnce(new Error('Second attempt'))
      .mockResolvedValueOnce('success')

    const retryPromise = act(async () => {
      return await result.current.retry(mockFn)
    })

    // First retry delay: 1000 * 2^0 = 1000ms
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    // Second retry delay: 1000 * 2^1 = 2000ms
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    await act(async () => {
      const value = await retryPromise
      expect(value).toBe('success')
    })

    expect(mockFn).toHaveBeenCalledTimes(3)
  })

  it('should throw error when max retries reached', async () => {
    const onMaxRetriesReached = vi.fn()
    const { result } = renderHook(() =>
      useRetry({
        maxRetries: 2,
        onMaxRetriesReached,
      })
    )

    const mockFn = vi.fn().mockRejectedValue(new Error('Always fails'))

    await act(async () => {
      try {
        await result.current.retry(mockFn)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    // Fast-forward through retries
    await act(async () => {
      vi.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledTimes(2) // Initial + 1 retry
      expect(onMaxRetriesReached).toHaveBeenCalled()
      expect(result.current.retryState.retryCount).toBe(2)
      expect(result.current.canRetry).toBe(false)
    })
  })

  it('should reset retry state', async () => {
    const { result } = renderHook(() => useRetry())
    const mockFn = vi.fn().mockRejectedValue(new Error('Test error'))

    // Trigger a retry to set retry count
    await act(async () => {
      try {
        await result.current.retry(mockFn)
      } catch (e) {
        // Expected to throw
      }
    })

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    // Wait for state to update
    await waitFor(() => {
      expect(result.current.retryState.retryCount).toBeGreaterThan(0)
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.retryState.retryCount).toBe(0)
    expect(result.current.retryState.isRetrying).toBe(false)
    expect(result.current.retryState.lastError).toBe(null)
  })

  it('should use custom maxRetries', () => {
    const { result } = renderHook(() => useRetry({ maxRetries: 5 }))

    expect(result.current.remainingRetries).toBe(5)
  })

  it('should use custom retryDelay', async () => {
    const { result } = renderHook(() =>
      useRetry({ maxRetries: 2, retryDelay: 500 })
    )

    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('First attempt'))
      .mockResolvedValueOnce('success')

    const retryPromise = act(async () => {
      return await result.current.retry(mockFn)
    })

    // Custom delay: 500ms
    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    await act(async () => {
      const value = await retryPromise
      expect(value).toBe('success')
    })

    expect(mockFn).toHaveBeenCalledTimes(2)
  })

  it('should update isRetrying state during retry', async () => {
    const { result } = renderHook(() => useRetry({ maxRetries: 2 }))

    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('First attempt'))
      .mockResolvedValueOnce('success')

    const retryPromise = act(async () => {
      return await result.current.retry(mockFn)
    })

    // Check that isRetrying is true during retry
    expect(result.current.retryState.isRetrying).toBe(true)

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    await act(async () => {
      await retryPromise
    })

    // After success, isRetrying should be false
    expect(result.current.retryState.isRetrying).toBe(false)
  })

  it('should store last error when max retries reached', async () => {
    const { result } = renderHook(() => useRetry({ maxRetries: 1 }))

    const error = new Error('Test error')
    const mockFn = vi.fn().mockRejectedValue(error)

    await act(async () => {
      try {
        await result.current.retry(mockFn)
      } catch (e) {
        // Expected to throw
      }
    })

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    await waitFor(() => {
      expect(result.current.retryState.lastError).toEqual(error)
    })
  })

  it('should calculate remaining retries correctly', async () => {
    const { result } = renderHook(() => useRetry({ maxRetries: 5 }))

    expect(result.current.remainingRetries).toBe(5)

    // Simulate retries by calling retry with failing function
    const mockFn = vi.fn().mockRejectedValue(new Error('Test error'))
    
    await act(async () => {
      try {
        await result.current.retry(mockFn)
      } catch (e) {
        // Expected to throw
      }
    })

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    await waitFor(() => {
      expect(result.current.retryState.retryCount).toBeGreaterThan(0)
    })

    // remainingRetries should be calculated correctly
    expect(result.current.remainingRetries).toBe(5 - result.current.retryState.retryCount)
    expect(result.current.canRetry).toBe(true)
  })
})

