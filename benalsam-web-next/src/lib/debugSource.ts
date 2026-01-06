/**
 * Debug Source Tracker
 * Tracks which data source (Elasticsearch vs Supabase) is being used
 * Only active in development mode
 */

import { logger } from '@/utils/production-logger';

interface SourceCounts {
  elasticsearch: number
  supabase: number
}

let sourceCounts: SourceCounts = {
  elasticsearch: 0,
  supabase: 0,
}

export function incrementSourceCount(source: 'elasticsearch' | 'supabase'): void {
  if (process.env.NODE_ENV === 'development') {
    sourceCounts[source]++
    logger.debug('[DebugSource] Data source used', { 
      source, 
      elasticsearch: sourceCounts.elasticsearch, 
      supabase: sourceCounts.supabase 
    })
  }
}

export function getSourceCounts(): SourceCounts {
  return { ...sourceCounts }
}

export function resetSourceCounts(): void {
  sourceCounts = {
    elasticsearch: 0,
    supabase: 0,
  }
}

// Export for debugging in browser console
interface WindowWithDebugSource extends Window {
  debugSource?: {
    getCounts: () => SourceCounts
    reset: () => void
  }
}

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as WindowWithDebugSource).debugSource = {
    getCounts: getSourceCounts,
    reset: resetSourceCounts,
  }
}

