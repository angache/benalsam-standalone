import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useJobStatus } from '../useJobStatus'
import { listingServiceClient } from '@/services/listingServiceClient'
import { logger } from '@/utils/production-logger'

// Mock dependencies
vi.mock('@/services/listingServiceClient', () => ({
  listingServiceClient: {
    getJobStatus: vi.fn(),
    cancelJob: vi.fn(),
  },
}))

vi.mock('@/utils/production-logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

// Mock timers
vi.useFakeTimers()

describe('useJobStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with null job status', () => {
    const { result } = renderHook(() =>
      useJobStatus({
        jobId: null,
        userId: null,
        autoPoll: false,
      })
    )

    expect(result.current.jobStatus).toBeNull()
    expect(result.current.isPolling).toBe(false)
    expect(result.current.attempts).toBe(0)
  })

  it('should start polling when jobId and userId are provided', async () => {
    const mockStatus = {
      status: 'processing',
      progress: 50,
      result: null,
      error: null,
    }

    vi.mocked(listingServiceClient.getJobStatus).mockResolvedValue(mockStatus)

    const { result } = renderHook(() =>
      useJobStatus({
        jobId: 'job-1',
        userId: 'user-1',
        autoPoll: true,
        pollInterval: 1000,
      })
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    await waitFor(() => {
      expect(listingServiceClient.getJobStatus).toHaveBeenCalled()
    })

    expect(result.current.jobStatus).toEqual({
      status: 'processing',
      progress: 50,
      result: null,
      error: null,
    })
    expect(result.current.isPolling).toBe(true)
  })

  it('should stop polling when job is completed', async () => {
    const mockStatus = {
      status: 'completed',
      progress: 100,
      result: { listingId: 'listing-1' },
      error: null,
    }

    vi.mocked(listingServiceClient.getJobStatus).mockResolvedValue(mockStatus)

    const onComplete = vi.fn()

    const { result } = renderHook(() =>
      useJobStatus({
        jobId: 'job-1',
        userId: 'user-1',
        autoPoll: true,
        pollInterval: 1000,
        onComplete,
      })
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    await waitFor(() => {
      expect(result.current.jobStatus?.status).toBe('completed')
    })

    expect(result.current.isPolling).toBe(false)
    expect(onComplete).toHaveBeenCalledWith({ listingId: 'listing-1' })
  })

  it('should stop polling when job fails', async () => {
    const mockStatus = {
      status: 'failed',
      progress: 0,
      result: null,
      error: 'Job failed',
    }

    vi.mocked(listingServiceClient.getJobStatus).mockResolvedValue(mockStatus)

    const onError = vi.fn()

    const { result } = renderHook(() =>
      useJobStatus({
        jobId: 'job-1',
        userId: 'user-1',
        autoPoll: true,
        pollInterval: 1000,
        onError,
      })
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    await waitFor(() => {
      expect(result.current.jobStatus?.status).toBe('failed')
    })

    expect(result.current.isPolling).toBe(false)
    expect(onError).toHaveBeenCalledWith('Job failed')
  })

  it('should call onProgress callback when progress updates', async () => {
    const mockStatus = {
      status: 'processing',
      progress: 75,
      result: null,
      error: null,
    }

    vi.mocked(listingServiceClient.getJobStatus).mockResolvedValue(mockStatus)

    const onProgress = vi.fn()

    renderHook(() =>
      useJobStatus({
        jobId: 'job-1',
        userId: 'user-1',
        autoPoll: true,
        pollInterval: 1000,
        onProgress,
      })
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    await waitFor(() => {
      expect(onProgress).toHaveBeenCalledWith(75)
    })
  })

  it('should stop polling after max attempts', async () => {
    const mockStatus = {
      status: 'processing',
      progress: 50,
      result: null,
      error: null,
    }

    vi.mocked(listingServiceClient.getJobStatus).mockResolvedValue(mockStatus)

    const onError = vi.fn()

    const { result } = renderHook(() =>
      useJobStatus({
        jobId: 'job-1',
        userId: 'user-1',
        autoPoll: true,
        pollInterval: 100,
        maxAttempts: 3,
        onError,
      })
    )

    // Advance timers to trigger multiple polls
    await act(async () => {
      for (let i = 0; i < 5; i++) {
        await vi.advanceTimersByTimeAsync(100)
      }
    })

    await waitFor(() => {
      expect(result.current.attempts).toBeGreaterThanOrEqual(3)
    })

    // Should stop after max attempts
    expect(result.current.isPolling).toBe(false)
    expect(onError).toHaveBeenCalledWith('Job timeout - maximum attempts reached')
  })

  it('should continue polling while status is pending or processing', async () => {
    const mockStatuses = [
      { status: 'pending', progress: 0, result: null, error: null },
      { status: 'processing', progress: 50, result: null, error: null },
      { status: 'completed', progress: 100, result: { id: 'listing-1' }, error: null },
    ]

    let callCount = 0
    vi.mocked(listingServiceClient.getJobStatus).mockImplementation(() => {
      return Promise.resolve(mockStatuses[callCount++] || mockStatuses[mockStatuses.length - 1])
    })

    const { result } = renderHook(() =>
      useJobStatus({
        jobId: 'job-1',
        userId: 'user-1',
        autoPoll: true,
        pollInterval: 100,
      })
    )

    // First poll
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    await waitFor(() => {
      expect(result.current.jobStatus?.status).toBe('pending')
    })

    // Second poll
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    await waitFor(() => {
      expect(result.current.jobStatus?.status).toBe('processing')
    })

    // Third poll - should complete
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    await waitFor(() => {
      expect(result.current.jobStatus?.status).toBe('completed')
    })

    expect(result.current.isPolling).toBe(false)
  })

  it('should cancel job successfully', async () => {
    vi.mocked(listingServiceClient.cancelJob).mockResolvedValue({ success: true })

    const { result } = renderHook(() =>
      useJobStatus({
        jobId: 'job-1',
        userId: 'user-1',
        autoPoll: false,
      })
    )

    let cancelResult: boolean | undefined
    await act(async () => {
      cancelResult = await result.current.cancelJob()
    })

    expect(cancelResult).toBe(true)
    expect(listingServiceClient.cancelJob).toHaveBeenCalledWith('job-1', 'user-1')
    expect(result.current.isPolling).toBe(false)
  })

  it('should handle cancel job error', async () => {
    vi.mocked(listingServiceClient.cancelJob).mockRejectedValue(new Error('Cancel failed'))

    const { result } = renderHook(() =>
      useJobStatus({
        jobId: 'job-1',
        userId: 'user-1',
        autoPoll: false,
      })
    )

    let cancelResult: boolean | undefined
    await act(async () => {
      cancelResult = await result.current.cancelJob()
    })

    expect(cancelResult).toBe(false)
    expect(logger.error).toHaveBeenCalledWith(
      '[useJobStatus] Failed to cancel job',
      expect.objectContaining({ error: expect.any(Error) })
    )
  })

  it('should refresh job status manually', async () => {
    const mockStatus = {
      status: 'processing',
      progress: 60,
      result: null,
      error: null,
    }

    vi.mocked(listingServiceClient.getJobStatus).mockResolvedValue(mockStatus)

    const { result } = renderHook(() =>
      useJobStatus({
        jobId: 'job-1',
        userId: 'user-1',
        autoPoll: false,
      })
    )

    await act(async () => {
      await result.current.refreshStatus()
    })

    expect(listingServiceClient.getJobStatus).toHaveBeenCalledWith('job-1', 'user-1')
    expect(result.current.jobStatus).toEqual({
      status: 'processing',
      progress: 60,
      result: null,
      error: null,
    })
  })

  it('should handle refresh status error', async () => {
    vi.mocked(listingServiceClient.getJobStatus).mockRejectedValue(new Error('Refresh failed'))

    const { result } = renderHook(() =>
      useJobStatus({
        jobId: 'job-1',
        userId: 'user-1',
        autoPoll: false,
      })
    )

    await act(async () => {
      await result.current.refreshStatus()
    })

    expect(logger.error).toHaveBeenCalledWith(
      '[useJobStatus] Failed to refresh job status',
      expect.objectContaining({ error: expect.any(Error) })
    )
  })

  it('should not poll when autoPoll is false', async () => {
    renderHook(() =>
      useJobStatus({
        jobId: 'job-1',
        userId: 'user-1',
        autoPoll: false,
      })
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })

    expect(listingServiceClient.getJobStatus).not.toHaveBeenCalled()
  })

  it('should not poll when jobId is null', async () => {
    renderHook(() =>
      useJobStatus({
        jobId: null,
        userId: 'user-1',
        autoPoll: true,
      })
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })

    expect(listingServiceClient.getJobStatus).not.toHaveBeenCalled()
  })

  it('should not poll when userId is null', async () => {
    renderHook(() =>
      useJobStatus({
        jobId: 'job-1',
        userId: null,
        autoPoll: true,
      })
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })

    expect(listingServiceClient.getJobStatus).not.toHaveBeenCalled()
  })

  it('should handle polling errors gracefully', async () => {
    const onError = vi.fn()
    vi.mocked(listingServiceClient.getJobStatus).mockRejectedValue(new Error('Poll failed'))

    const { result } = renderHook(() =>
      useJobStatus({
        jobId: 'job-1',
        userId: 'user-1',
        autoPoll: true,
        pollInterval: 100,
        onError,
      })
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    await waitFor(() => {
      expect(result.current.isPolling).toBe(false)
    })

    expect(onError).toHaveBeenCalledWith('Poll failed')
  })
})

