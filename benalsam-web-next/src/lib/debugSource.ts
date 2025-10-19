/**
 * Debug Source Tracker
 * Tracks which data source (Elasticsearch vs Supabase) is being used
 * Only active in development mode
 */

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
    console.log(`📊 Data Source: ${source} (ES: ${sourceCounts.elasticsearch}, Supabase: ${sourceCounts.supabase})`)
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
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugSource = {
    getCounts: getSourceCounts,
    reset: resetSourceCounts,
  }
}

