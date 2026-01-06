import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useInfiniteScroll } from '../useInfiniteScroll'

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()

  constructor(
    public callback: IntersectionObserverCallback,
    public options?: IntersectionObserverInit
  ) {}
}

describe('useInfiniteScroll', () => {
  let mockObserver: MockIntersectionObserver
  let originalIntersectionObserver: typeof IntersectionObserver

  beforeEach(() => {
    originalIntersectionObserver = global.IntersectionObserver
    global.IntersectionObserver = vi.fn((callback, options) => {
      mockObserver = new MockIntersectionObserver(callback, options)
      return mockObserver as unknown as IntersectionObserver
    }) as unknown as typeof IntersectionObserver

    // Mock document.querySelector
    vi.spyOn(document, 'querySelector').mockReturnValue(
      document.createElement('div')
    )
  })

  afterEach(() => {
    global.IntersectionObserver = originalIntersectionObserver
    vi.clearAllMocks()
  })

  it('should return ref and inView', () => {
    const fetchNextPage = vi.fn()
    const { result } = renderHook(() =>
      useInfiniteScroll({
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage,
        itemCount: 10,
      })
    )

    expect(result.current).toHaveProperty('ref')
    expect(result.current).toHaveProperty('inView')
    expect(typeof result.current.ref).toBe('function')
    expect(typeof result.current.inView).toBe('boolean')
  })

  it('should call fetchNextPage when inView and hasNextPage', () => {
    const fetchNextPage = vi.fn()
    renderHook(() =>
      useInfiniteScroll({
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage,
        itemCount: 10,
      })
    )

    // Simulate intersection
    if (mockObserver.callback) {
      mockObserver.callback(
        [
          {
            isIntersecting: true,
            target: document.createElement('div'),
          } as IntersectionObserverEntry,
        ],
        mockObserver as unknown as IntersectionObserver
      )
    }

    // Wait for useEffect to run
    setTimeout(() => {
      expect(fetchNextPage).toHaveBeenCalled()
    }, 0)
  })

  it('should not call fetchNextPage when isFetchingNextPage is true', () => {
    const fetchNextPage = vi.fn()
    renderHook(() =>
      useInfiniteScroll({
        hasNextPage: true,
        isFetchingNextPage: true,
        fetchNextPage,
        itemCount: 10,
      })
    )

    // Simulate intersection
    if (mockObserver.callback) {
      mockObserver.callback(
        [
          {
            isIntersecting: true,
            target: document.createElement('div'),
          } as IntersectionObserverEntry,
        ],
        mockObserver as unknown as IntersectionObserver
      )
    }

    // Wait for useEffect to run
    setTimeout(() => {
      expect(fetchNextPage).not.toHaveBeenCalled()
    }, 0)
  })

  it('should not call fetchNextPage when hasNextPage is false', () => {
    const fetchNextPage = vi.fn()
    renderHook(() =>
      useInfiniteScroll({
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage,
        itemCount: 10,
      })
    )

    // Simulate intersection
    if (mockObserver.callback) {
      mockObserver.callback(
        [
          {
            isIntersecting: true,
            target: document.createElement('div'),
          } as IntersectionObserverEntry,
        ],
        mockObserver as unknown as IntersectionObserver
      )
    }

    // Wait for useEffect to run
    setTimeout(() => {
      expect(fetchNextPage).not.toHaveBeenCalled()
    }, 0)
  })

  it('should use custom prefetchThreshold', () => {
    const fetchNextPage = vi.fn()
    const querySelectorSpy = vi.spyOn(document, 'querySelector')

    renderHook(() =>
      useInfiniteScroll({
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage,
        itemCount: 20,
        prefetchThreshold: 5,
      })
    )

    // Should query for item at index 15 (20 - 5)
    expect(querySelectorSpy).toHaveBeenCalledWith(
      '[data-listing-index="15"]'
    )
  })

  it('should use custom prefetchRootMargin', () => {
    const fetchNextPage = vi.fn()
    renderHook(() =>
      useInfiniteScroll({
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage,
        itemCount: 10,
        prefetchRootMargin: '200px',
      })
    )

    // Check that IntersectionObserver was created with custom rootMargin
    expect(global.IntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { rootMargin: '200px' }
    )
  })

  it('should cleanup observer on unmount', () => {
    const fetchNextPage = vi.fn()
    const { unmount } = renderHook(() =>
      useInfiniteScroll({
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage,
        itemCount: 10,
      })
    )

    unmount()

    expect(mockObserver.disconnect).toHaveBeenCalled()
  })

  it('should not setup prefetch observer when hasNextPage is false', () => {
    const fetchNextPage = vi.fn()
    renderHook(() =>
      useInfiniteScroll({
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage,
        itemCount: 10,
      })
    )

    // Prefetch observer should not be created
    expect(mockObserver.observe).not.toHaveBeenCalled()
  })

  it('should not setup prefetch observer when trigger element is not found', () => {
    const fetchNextPage = vi.fn()
    vi.spyOn(document, 'querySelector').mockReturnValue(null)

    renderHook(() =>
      useInfiniteScroll({
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage,
        itemCount: 10,
      })
    )

    // Prefetch observer should not be created
    expect(mockObserver.observe).not.toHaveBeenCalled()
  })
})

