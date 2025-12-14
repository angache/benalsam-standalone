'use client';

import { useQuery } from '@tanstack/react-query';
import { listingService } from '@/services/listingService';
import { ListingCard } from '@/components/ListingCard';
import { TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { Listing } from '@/types';

interface PopularListingsProps {
  /**
   * Pre-fetched listings from batch API
   * If provided, component won't make its own API call
   */
  listings?: Listing[];
  /**
   * Loading state from batch API
   */
  isLoading?: boolean;
}

export function PopularListings({ listings: propListings, isLoading: propIsLoading }: PopularListingsProps = {}) {
  // Use batch data if provided, otherwise fetch independently (backward compatibility)
  const { data: queryListings, isLoading: queryIsLoading } = useQuery({
    queryKey: ['popular-listings'],
    queryFn: async () => {
      console.log('🔥 [PopularListings] Fetching popular listings...');
      
      // Fetch listings sorted by view_count
      const result = await listingService.getListingsWithFilters(
        {
          sortBy: 'view_count',
          sortOrder: 'desc',
        },
        {
          page: 1,
          pageSize: 12,
        }
      );
      
      console.log('🔥 [PopularListings] Loaded', { count: result.listings.length });
      return result.listings;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - popular listings don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    enabled: !propListings, // Only fetch if no prop data provided
  });

  const listings = propListings || queryListings;
  const isLoading = propIsLoading !== undefined ? propIsLoading : queryIsLoading;

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-orange-500" />
              <h2 className="text-3xl font-bold">Popüler İlanlar</h2>
            </div>
          </div>
          
          {/* Loading Skeletons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-64"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!listings || listings.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gray-50 dark:bg-gray-900/30">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Popüler İlanlar</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                En çok görüntülenen ilanlar
              </p>
            </div>
          </div>
          
          <Link 
            href="/?sortBy=view_count" 
            className="flex items-center gap-2 text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
          >
            Tümünü Gör
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <div 
              key={listing.id} 
              className="animate-fadeInUp hover-lift"
              style={{ animationDelay: `${listings.indexOf(listing) * 50}ms` }}
            >
              <ListingCard listing={listing} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

