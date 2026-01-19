import { categoriesServiceClient } from '@/lib/apiClient'
import { categoryCacheService } from './categoryCacheService'
import { logger } from '@/utils/production-logger'

// VPS mode flag - when true, service URLs already contain the full path
const useVpsServices = process.env.NEXT_PUBLIC_USE_VPS_SERVICES === 'true'

export interface CategoryAttribute {
  id: number
  key: string
  type: string
  label: string
  options?: string // JSON string
  required: boolean
  created_at: string
  updated_at: string
  sort_order: number
  ai_enhanced: boolean
  category_id: number
  ai_suggestions?: Record<string, any>
}

export interface Category {
  id: number | string
  name: string
  slug?: string
  description?: string
  parent_id?: number | string | null
  level: number
  icon?: string
  color?: string
  path?: string
  listing_count?: number
  is_active: boolean
  created_at: string
  updated_at: string
  children?: Category[]
  category_attributes?: CategoryAttribute[]
}

export interface CategoryTree extends Category {
  children: CategoryTree[]
}

class CategoryService {
  /**
   * Get all categories in a flat list (with cache)
   */
  async getCategories(): Promise<Category[]> {
    return categoryCacheService.getCategories(async () => {
      // VPS mode: URL already contains /api/v1/categories, so use '/'
      // Local mode: Need full path /api/v1/categories
      const endpoint = useVpsServices ? '/' : '/api/v1/categories'
      const response = await categoriesServiceClient.get<{ success: boolean; data: Category[] }>(endpoint)
      return response.data || []
    })
  }

  /**
   * Get categories in a tree structure
   */
  async getCategoryTree(): Promise<CategoryTree[]> {
    try {
      const endpoint = useVpsServices ? '/tree' : '/api/v1/categories/tree'
      const response = await categoriesServiceClient.get<{ data: CategoryTree[] }>(endpoint)
      return response.data || []
    } catch (error) {
      logger.error('[CategoryService] Error fetching category tree', { error })
      return []
    }
  }

  /**
   * Get a single category by ID
   */
  async getCategoryById(id: string): Promise<Category | null> {
    try {
      const endpoint = useVpsServices ? `/${id}` : `/api/v1/categories/${id}`
      const response = await categoriesServiceClient.get<{ data: Category }>(endpoint)
      return response.data
    } catch (error) {
      logger.error(`[CategoryService] Error fetching category ${id}`, { error, categoryId: id })
      return null
    }
  }

  /**
   * Get a category by slug
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const endpoint = useVpsServices ? `/slug/${slug}` : `/api/v1/categories/slug/${slug}`
      const response = await categoriesServiceClient.get<{ data: Category }>(endpoint)
      return response.data
    } catch (error) {
      logger.error(`[CategoryService] Error fetching category by slug ${slug}`, { error, slug })
      return null
    }
  }

  /**
   * Get popular categories (top N by listing count)
   */
  async getPopularCategories(limit: number = 6): Promise<Category[]> {
    try {
      // Tüm kategorileri çek
      const allCategories = await this.getCategories()
      logger.debug('[CategoryService] All categories fetched', { count: allCategories.length })
      
      // Sadece level 0 kategorileri filtrele ve ilk N tanesini al
      // NOT: listing_count backend'den gelmiyor, frontend'de useCategoryCounts hook'u ile ekleniyor
      const topLevelCategories = allCategories
        .filter(cat => cat.level === 0)
        .slice(0, limit)
      
      logger.debug('[CategoryService] Popular categories', { categories: topLevelCategories.map(c => ({ name: c.name, id: c.id })) })
      return topLevelCategories
    } catch (error) {
      logger.error('[CategoryService] Error fetching popular categories', { error })
      return []
    }
  }

  /**
   * Search categories by name
   */
  async searchCategories(query: string): Promise<Category[]> {
    try {
      const endpoint = useVpsServices ? '/search' : '/api/v1/categories/search'
      const response = await categoriesServiceClient.get<{ data: Category[] }>(endpoint, {
        params: { q: query },
      })
      return response.data || []
    } catch (error) {
      logger.error('[CategoryService] Error searching categories', { error })
      return []
    }
  }

  /**
   * Get children of a category
   */
  async getCategoryChildren(parentId: string): Promise<Category[]> {
    try {
      const endpoint = useVpsServices ? `/${parentId}/children` : `/api/v1/categories/${parentId}/children`
      const response = await categoriesServiceClient.get<{ data: Category[] }>(endpoint)
      return response.data || []
    } catch (error) {
      logger.error(`[CategoryService] Error fetching children for category ${parentId}`, { error, parentId })
      return []
    }
  }
}

export const categoryService = new CategoryService()
export default categoryService

