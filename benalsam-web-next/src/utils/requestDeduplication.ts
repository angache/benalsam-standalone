/**
 * Request Deduplication Utility
 * 
 * Prevents duplicate API calls by batching identical requests
 * Useful for scenarios where multiple components request the same data simultaneously
 */

interface PendingRequest<T> {
  promise: Promise<T>
  timestamp: number
}

class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest<any>>()
  private readonly REQUEST_TIMEOUT = 5000 // 5 seconds

  /**
   * Deduplicate a request by key
   * If a request with the same key is already pending, return the existing promise
   * 
   * @param key - Unique key for the request
   * @param requestFn - Function that returns a promise
   * @returns Promise that resolves to the request result
   */
  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Check if there's a pending request
    const pending = this.pendingRequests.get(key)

    if (pending) {
      // Check if request is still valid (not too old)
      const age = Date.now() - pending.timestamp
      if (age < this.REQUEST_TIMEOUT) {
        console.log(`🔄 [Deduplication] Reusing pending request: ${key}`)
        return pending.promise
      } else {
        // Request is too old, remove it
        this.pendingRequests.delete(key)
      }
    }

    // Create new request
    const promise = requestFn()
      .then((result) => {
        // Remove from pending after completion
        this.pendingRequests.delete(key)
        return result
      })
      .catch((error) => {
        // Remove from pending on error
        this.pendingRequests.delete(key)
        throw error
      })

    // Store pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    })

    return promise
  }

  /**
   * Clear all pending requests
   */
  clear() {
    this.pendingRequests.clear()
  }

  /**
   * Clear old pending requests (older than timeout)
   */
  clearStale() {
    const now = Date.now()
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.REQUEST_TIMEOUT) {
        this.pendingRequests.delete(key)
      }
    }
  }

  /**
   * Get number of pending requests
   */
  getPendingCount(): number {
    return this.pendingRequests.size
  }
}

// Singleton instance
export const requestDeduplicator = new RequestDeduplicator()

/**
 * Create a deduplicated request function
 * 
 * @example
 * ```tsx
 * const fetchData = createDeduplicatedRequest(
 *   (id: string) => `data-${id}`,
 *   async (id: string) => {
 *     return await api.getData(id)
 *   }
 * )
 * 
 * // Multiple calls with same id will be deduplicated
 * const data1 = await fetchData('123')
 * const data2 = await fetchData('123') // Uses same request as data1
 * ```
 */
export function createDeduplicatedRequest<TArgs extends any[], TReturn>(
  keyFn: (...args: TArgs) => string,
  requestFn: (...args: TArgs) => Promise<TReturn>
): (...args: TArgs) => Promise<TReturn> {
  return (...args: TArgs) => {
    const key = keyFn(...args)
    return requestDeduplicator.deduplicate(key, () => requestFn(...args))
  }
}

/**
 * Cleanup stale requests periodically
 * Returns cleanup function to stop the interval
 */
let staleCleanupInterval: NodeJS.Timeout | null = null

export function startStaleCleanup(): void {
  if (typeof window === 'undefined') return
  if (staleCleanupInterval) return // Already started

  // Cleanup stale requests every minute
  staleCleanupInterval = setInterval(() => {
    requestDeduplicator.clearStale()
  }, 60 * 1000)
}

export function stopStaleCleanup(): void {
  if (staleCleanupInterval) {
    clearInterval(staleCleanupInterval)
    staleCleanupInterval = null
  }
}

// Auto-start cleanup in browser environment
if (typeof window !== 'undefined') {
  startStaleCleanup()
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    stopStaleCleanup()
  })
}

