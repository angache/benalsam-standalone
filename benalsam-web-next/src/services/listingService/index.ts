/**
 * Listing Service API
 * Main service wrapper for all listing operations
 */

import * as fetchers from './fetchers'
import * as core from './core'

export const listingService = {
  // Core fetching functions
  getListings: fetchers.fetchListings, // ES + Supabase fallback
  getFilteredListings: fetchers.fetchFilteredListings, // Advanced Supabase RPC search
  getSingleListing: fetchers.fetchSingleListing,
  getPopularListings: fetchers.fetchPopularListings,
  getMostOfferedListings: fetchers.fetchMostOfferedListings,
  getTodaysDeals: fetchers.fetchTodaysDeals,
  getRecentlyViewed: fetchers.fetchRecentlyViewedListings,
  getMatchingLastSearch: fetchers.fetchListingsMatchingLastSearch,
  getMyListings: fetchers.fetchMyListings,
  
  // Attribute operations
  getAttributeStatistics: fetchers.fetchAttributeStatistics,
  searchByAttributeValues: fetchers.searchByAttributeValues,
  
  // Core utilities
  processFetchedListings: core.processFetchedListings,
  addPremiumSorting: core.addPremiumSorting,
}

export default listingService

// Re-export all individual functions for backward compatibility
export * from './fetchers'
export * from './core'
