import { useQuery } from '@tanstack/react-query';
import { searchListings } from '@/services/searchService';

interface UseListingsParams {
  query?: string;
  categoryId?: number;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  sortBy?: 'created_at' | 'price' | 'title';
  sortOrder?: 'asc' | 'desc';
  enabled?: boolean;
}

export function useListings(params: UseListingsParams = {}) {
  const { enabled = true, ...searchParams } = params;

  return useQuery({
    queryKey: ['listings', searchParams],
    queryFn: () => searchListings(searchParams),
    enabled,
  });
}

