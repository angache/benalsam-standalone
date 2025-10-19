import { useQuery } from '@tanstack/react-query';
import { getCategoryTree, getPopularCategories } from '@/services/categoryService';

export function useCategoryTree() {
  return useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: getCategoryTree,
    staleTime: 1000 * 60 * 30, // 30 minutes - categories don't change often
  });
}

export function usePopularCategories(limit = 6) {
  return useQuery({
    queryKey: ['categories', 'popular', limit],
    queryFn: () => getPopularCategories(limit),
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

