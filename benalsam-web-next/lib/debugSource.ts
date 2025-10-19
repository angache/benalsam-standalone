// Dev-only helper to track data source of listings
type SrcKey = 'E' | 'S';

declare global {
  interface Window { __srcStats?: Record<SrcKey, number>; }
}

export function incrementSourceCount(key: SrcKey, amount = 1) {
  if (process.env.NODE_ENV === 'production') return;
  if (!window.__srcStats) window.__srcStats = { E: 0, S: 0 } as Record<SrcKey, number>;
  window.__srcStats[key] = (window.__srcStats[key] || 0) + amount;
}

export function getSourceStats(): Record<SrcKey, number> {
  if (!window.__srcStats) return { E: 0, S: 0 } as Record<SrcKey, number>;
  return window.__srcStats;
}

export function resetSourceStats() {
  if (process.env.NODE_ENV === 'production') return;
  window.__srcStats = { E: 0, S: 0 } as Record<SrcKey, number>;
}


