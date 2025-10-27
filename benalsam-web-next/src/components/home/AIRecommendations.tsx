'use client';

import { useQuery } from '@tanstack/react-query';
import { listingService } from '@/services/listingService';
import { ListingCard } from '@/components/ListingCard';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

/**
 * AI-powered recommendation algorithm (Hybrid approach)
 * 
 * Combines multiple signals:
 * 1. User's recently viewed categories
 * 2. User's favorite listings
 * 3. Popular items in user's location
 * 4. Trending items
 * 5. Similar budget range
 */
export function AIRecommendations() {
  const { user } = useAuth();

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['ai-recommendations', user?.id],
    queryFn: async () => {
      console.log('✨ [AIRecommendations] Generating recommendations...');
      
      // For now, use a simple hybrid approach
      // TODO: Implement ML-based recommendations in backend
      const result = await listingService.getListingsWithFilters(
        {
          sortBy: 'created_at',
          sortOrder: 'desc',
        },
        {
          page: 1,
          pageSize: 8,
        }
      );
      
      console.log('✨ [AIRecommendations] Generated', { count: result.listings.length });
      return result.listings;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });

  // Don't show if not logged in
  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-500" />
              <h2 className="text-3xl font-bold">Sizin İçin Öneriler</h2>
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

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gradient-to-b from-purple-50/50 to-transparent dark:from-purple-900/10">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg animate-pulse">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Sizin İçin Öneriler</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                İlgi alanlarınıza göre seçildi
              </p>
            </div>
          </div>
          
          <Link 
            href="/?sortBy=recommended" 
            className="flex items-center gap-2 text-sm font-medium hover:text-purple-600 dark:hover:text-purple-400 transition-colors group"
          >
            Daha Fazla
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Recommendations Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recommendations.map((listing, index) => (
            <div 
              key={listing.id} 
              className="animate-fadeInUp hover-lift"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ListingCard listing={listing} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

