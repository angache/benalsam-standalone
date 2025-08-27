// ===========================
// USE HOME DATA HOOK
// ===========================

import { useMemo } from 'react';
import { 
  useListings, 
  usePopularListings, 
  useTodaysDeals, 
  useMostOfferedListings 
} from '../../../hooks/queries/useListings';
import { useFollowedCategoryListings } from '../../../hooks/queries/useCategories';
import { useSmartRecommendations, useTrackView, useSellerRecommendations } from '../../../hooks/queries/useRecommendations';
import { useRecentViews } from '../../../hooks/queries/useRecentViews';
import { useSimilarListingsByCategory } from '../../../hooks/queries/useSimilarListings';
import { HomeData } from '../types';

const useHomeData = () => {
  // Fetch all data using React Query hooks
  const {
    data: listings,
    isLoading: listingsLoading,
    error: listingsError
  } = useListings();

  const {
    data: popularListings,
    isLoading: popularLoading,
    error: popularError
  } = usePopularListings();

  const {
    data: todaysDeals,
    isLoading: dealsLoading,
    error: dealsError
  } = useTodaysDeals();

  const {
    data: mostOfferedListings,
    isLoading: mostOfferedLoading,
    error: mostOfferedError
  } = useMostOfferedListings();

  const {
    data: followedCategoryListings,
    isLoading: categoriesLoading,
    error: categoriesError
  } = useFollowedCategoryListings();

  const {
    data: recentViews,
    isLoading: recentViewsLoading,
    error: recentViewsError
  } = useRecentViews();

  const {
    data: similarListings,
    isLoading: similarLoading,
    error: similarError
  } = useSimilarListingsByCategory();

  const {
    data: recommendations,
    isLoading: recommendationsLoading,
    error: recommendationsError
  } = useSmartRecommendations();

  // Memoize the combined data
  const homeData: HomeData = useMemo(() => ({
    listings: listings || [],
    popularListings: popularListings || [],
    todaysDeals: todaysDeals || [],
    mostOfferedListings: mostOfferedListings || [],
    followedCategoryListings: followedCategoryListings || [],
    recentViews: recentViews || [],
    similarListings: similarListings || [],
    recommendations: recommendations || []
  }), [
    listings,
    popularListings,
    todaysDeals,
    mostOfferedListings,
    followedCategoryListings,
    recentViews,
    similarListings,
    recommendations
  ]);

  // Combined loading state
  const isLoading = useMemo(() => 
    listingsLoading ||
    popularLoading ||
    dealsLoading ||
    mostOfferedLoading ||
    categoriesLoading ||
    recentViewsLoading ||
    similarLoading ||
    recommendationsLoading,
    [
      listingsLoading,
      popularLoading,
      dealsLoading,
      mostOfferedLoading,
      categoriesLoading,
      recentViewsLoading,
      similarLoading,
      recommendationsLoading
    ]
  );

  // Combined error state
  const error = useMemo(() => {
    const errors = [
      listingsError,
      popularError,
      dealsError,
      mostOfferedError,
      categoriesError,
      recentViewsError,
      similarError,
      recommendationsError
    ].filter(Boolean);

    return errors.length > 0 ? errors[0] : null;
  }, [
    listingsError,
    popularError,
    dealsError,
    mostOfferedError,
    categoriesError,
    recentViewsError,
    similarError,
    recommendationsError
  ]);

  return {
    data: homeData,
    isLoading,
    error,
    // Individual loading states for granular control
    loadingStates: {
      listings: listingsLoading,
      popular: popularLoading,
      deals: dealsLoading,
      mostOffered: mostOfferedLoading,
      categories: categoriesLoading,
      recentViews: recentViewsLoading,
      similar: similarLoading,
      recommendations: recommendationsLoading
    },
    // Individual error states for granular control
    errorStates: {
      listings: listingsError,
      popular: popularError,
      deals: dealsError,
      mostOffered: mostOfferedError,
      categories: categoriesError,
      recentViews: recentViewsError,
      similar: similarError,
      recommendations: recommendationsError
    }
  };
};

export default useHomeData;
