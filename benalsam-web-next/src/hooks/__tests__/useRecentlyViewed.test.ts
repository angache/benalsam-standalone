import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRecentlyViewed, type RecentlyViewedItem } from '../useRecentlyViewed'
import { logger } from '@/utils/production-logger'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

vi.mock('@/utils/production-logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('useRecentlyViewed', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  it('should initialize with empty array when no stored data', () => {
    const { result } = renderHook(() => useRecentlyViewed())

    expect(result.current.items).toEqual([])
  })

  it('should load items from localStorage on mount', () => {
    const storedItems: RecentlyViewedItem[] = [
      {
        id: 'item-1',
        title: 'Test Item 1',
        price: 100,
        image_url: 'https://example.com/image1.jpg',
        viewedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: 'item-2',
        title: 'Test Item 2',
        price: 200,
        image_url: 'https://example.com/image2.jpg',
        viewedAt: '2025-01-02T00:00:00Z',
      },
    ]

    localStorageMock.setItem('benalsam_recently_viewed', JSON.stringify(storedItems))

    const { result } = renderHook(() => useRecentlyViewed())

    expect(result.current.items).toEqual(storedItems)
  })

  it('should add item to recently viewed', () => {
    const { result } = renderHook(() => useRecentlyViewed())

    act(() => {
      result.current.addItem({
        id: 'item-1',
        title: 'Test Item',
        price: 100,
        image_url: 'https://example.com/image.jpg',
      })
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0]).toMatchObject({
      id: 'item-1',
      title: 'Test Item',
      price: 100,
      image_url: 'https://example.com/image.jpg',
    })
    expect(result.current.items[0].viewedAt).toBeDefined()

    // Check localStorage
    const stored = JSON.parse(
      localStorageMock.getItem('benalsam_recently_viewed') || '[]'
    )
    expect(stored).toHaveLength(1)
  })

  it('should move existing item to top when added again', () => {
    const { result } = renderHook(() => useRecentlyViewed())

    act(() => {
      result.current.addItem({
        id: 'item-1',
        title: 'Item 1',
        price: 100,
        image_url: 'https://example.com/image1.jpg',
      })
    })

    act(() => {
      result.current.addItem({
        id: 'item-2',
        title: 'Item 2',
        price: 200,
        image_url: 'https://example.com/image2.jpg',
      })
    })

    act(() => {
      result.current.addItem({
        id: 'item-1',
        title: 'Item 1 Updated',
        price: 150,
        image_url: 'https://example.com/image1-updated.jpg',
      })
    })

    expect(result.current.items).toHaveLength(2)
    expect(result.current.items[0].id).toBe('item-1')
    expect(result.current.items[0].title).toBe('Item 1 Updated')
    expect(result.current.items[1].id).toBe('item-2')
  })

  it('should limit items to MAX_ITEMS (20)', () => {
    const { result } = renderHook(() => useRecentlyViewed())

    act(() => {
      // Add 25 items
      for (let i = 1; i <= 25; i++) {
        result.current.addItem({
          id: `item-${i}`,
          title: `Item ${i}`,
          price: i * 10,
          image_url: `https://example.com/image${i}.jpg`,
        })
      }
    })

    expect(result.current.items).toHaveLength(20)
    expect(result.current.items[0].id).toBe('item-25')
    expect(result.current.items[19].id).toBe('item-6')
  })

  it('should clear all items', () => {
    const { result } = renderHook(() => useRecentlyViewed())

    act(() => {
      result.current.addItem({
        id: 'item-1',
        title: 'Test Item',
        price: 100,
        image_url: 'https://example.com/image.jpg',
      })
    })

    expect(result.current.items).toHaveLength(1)

    act(() => {
      result.current.clearAll()
    })

    expect(result.current.items).toEqual([])
    expect(localStorageMock.getItem('benalsam_recently_viewed')).toBeNull()
  })

  it('should handle localStorage errors gracefully when loading', () => {
    // Mock localStorage.getItem to throw error
    const originalGetItem = localStorageMock.getItem
    localStorageMock.getItem = vi.fn(() => {
      throw new Error('Storage error')
    })

    const { result } = renderHook(() => useRecentlyViewed())

    expect(result.current.items).toEqual([])
    expect(logger.error).toHaveBeenCalledWith(
      '[useRecentlyViewed] Error loading recently viewed',
      expect.objectContaining({ error: expect.any(Error) })
    )

    // Restore
    localStorageMock.getItem = originalGetItem
  })

  it('should handle localStorage errors gracefully when saving', () => {
    const { result } = renderHook(() => useRecentlyViewed())

    // Mock localStorage.setItem to throw error
    const originalSetItem = localStorageMock.setItem
    localStorageMock.setItem = vi.fn(() => {
      throw new Error('Storage error')
    })

    act(() => {
      result.current.addItem({
        id: 'item-1',
        title: 'Test Item',
        price: 100,
        image_url: 'https://example.com/image.jpg',
      })
    })

    expect(logger.error).toHaveBeenCalledWith(
      '[useRecentlyViewed] Error saving recently viewed',
      expect.objectContaining({ error: expect.any(Error) })
    )

    // Restore
    localStorageMock.setItem = originalSetItem
  })

  it('should handle localStorage errors gracefully when clearing', () => {
    const { result } = renderHook(() => useRecentlyViewed())

    act(() => {
      result.current.addItem({
        id: 'item-1',
        title: 'Test Item',
        price: 100,
        image_url: 'https://example.com/image.jpg',
      })
    })

    // Mock localStorage.removeItem to throw error
    const originalRemoveItem = localStorageMock.removeItem
    localStorageMock.removeItem = vi.fn(() => {
      throw new Error('Storage error')
    })

    act(() => {
      result.current.clearAll()
    })

    expect(logger.error).toHaveBeenCalledWith(
      '[useRecentlyViewed] Error clearing recently viewed',
      expect.objectContaining({ error: expect.any(Error) })
    )

    // Restore
    localStorageMock.removeItem = originalRemoveItem
  })

  it('should add viewedAt timestamp when adding item', () => {
    const { result } = renderHook(() => useRecentlyViewed())

    const beforeTime = new Date().toISOString()

    act(() => {
      result.current.addItem({
        id: 'item-1',
        title: 'Test Item',
        price: 100,
        image_url: 'https://example.com/image.jpg',
      })
    })

    const afterTime = new Date().toISOString()

    expect(result.current.items[0].viewedAt).toBeDefined()
    expect(result.current.items[0].viewedAt).toBeGreaterThanOrEqual(beforeTime)
    expect(result.current.items[0].viewedAt).toBeLessThanOrEqual(afterTime)
  })

  it('should handle invalid JSON in localStorage', () => {
    localStorageMock.setItem('benalsam_recently_viewed', 'invalid json')

    const { result } = renderHook(() => useRecentlyViewed())

    // Should default to empty array
    expect(result.current.items).toEqual([])
  })
})

