/**
 * useCategories Hook
 * Fetch and cache categories
 */

import { useQuery } from '@tanstack/react-query'
import { categoryService, Category } from '@/services/categoryService'

export function useCategories() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  })

  return {
    categories: data || [],
    isLoading,
    error,
  }
}

export type { Category }

