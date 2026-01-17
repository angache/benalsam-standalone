import { categoriesServiceClient } from '@/lib/apiClient'
import { categoryCacheService } from './categoryCacheService'
import { logger } from '@/utils/production-logger'

// VPS veya local kullanımı kontrolü
const useVpsServices = process.env.USE_VPS_SERVICES === 'true' || 
                       process.env.NEXT_PUBLIC_USE_VPS_SERVICES === 'true' ||
                       (process.env.NODE_ENV === 'production' && process.env.USE_VPS_SERVICES !== 'false');

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
  ai_suggestions?: Record<string, unknown>
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
      try {
        // baseURL: https://api.benalsam.com/api/v1/categories (VPS) veya http://localhost:3015/api/v1 (local)
        // Categories Service route: /api/v1/categories -> getCategories()
        // VPS'de: baseURL /api/v1/categories, endpoint '/' -> Final: /api/v1/categories/ -> Nginx proxy (no rewrite) ✅
        // Local'de: baseURL /api/v1, endpoint '/categories' -> Final: http://localhost:3015/api/v1/categories ✅
        const endpoint = useVpsServices ? '/' : '/categories'
        const response = await categoriesServiceClient.get<{ success: boolean; data: Category[] }>(endpoint)
        return response.data || []
      } catch (error) {
        logger.error('[CategoryService] Error fetching categories from API', {
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
          } : error,
          errorString: String(error),
          baseURL: categoriesServiceClient['client'].defaults?.baseURL || 'unknown'
        })
        throw error
      }
    })
  }

  /**
   * Get categories in a tree structure
   */
  async getCategoryTree(): Promise<CategoryTree[]> {
    try {
      // Categories Service'de /tree route'u yok, getCategories() zaten tree structure döndürüyor
      // VPS'de: baseURL /api/v1/categories, endpoint '/' -> Final: /api/v1/categories/ -> Nginx proxy (no rewrite) ✅
      // Local'de: baseURL /api/v1, endpoint '/categories' -> Final: http://localhost:3015/api/v1/categories ✅
      const endpoint = useVpsServices ? '/' : '/categories'
      const response = await categoriesServiceClient.get<{ success: boolean; data: CategoryTree[] }>(endpoint)
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
      // VPS'de: baseURL /api/v1/categories, endpoint `/${id}` -> Final: /api/v1/categories/${id} -> Nginx proxy (no rewrite) ✅
      // Local'de: baseURL /api/v1, endpoint `/categories/${id}` -> Final: http://localhost:3015/api/v1/categories/${id} ✅
      const endpoint = useVpsServices ? `/${id}` : `/categories/${id}`
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
      // Categories Service'de /:id(*) route'u hem ID hem slug/path kabul ediyor
      // VPS'de: baseURL /api/v1/categories, endpoint `/${slug}` -> Final: /api/v1/categories/${slug} -> Nginx proxy (no rewrite) ✅
      // Local'de: baseURL /api/v1, endpoint `/categories/${slug}` -> Final: http://localhost:3015/api/v1/categories/${slug} ✅
      const endpoint = useVpsServices ? `/${slug}` : `/categories/${slug}`
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
      // Categories Service'de /all route'u search query parametresi ile kullanılıyor
      // VPS'de: baseURL /api/v1/categories, endpoint `/all` -> Final: /api/v1/categories/all -> Nginx proxy (no rewrite) ✅
      // Local'de: baseURL /api/v1, endpoint `/categories/all` -> Final: http://localhost:3015/api/v1/categories/all ✅
      const endpoint = useVpsServices ? '/all' : '/categories/all'
      const response = await categoriesServiceClient.get<{ data: Category[] }>(endpoint, {
        params: { search: query },
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
      // Categories Service'de /children route'u yok, /all route'u parent_id query parametresi ile kullanılıyor
      // VPS'de: baseURL /api/v1/categories, endpoint `/all` -> Final: /api/v1/categories/all -> Nginx proxy (no rewrite) ✅
      // Local'de: baseURL /api/v1, endpoint `/categories/all` -> Final: http://localhost:3015/api/v1/categories/all ✅
      const endpoint = useVpsServices ? '/all' : '/categories/all'
      const response = await categoriesServiceClient.get<{ data: Category[] }>(endpoint, {
        params: { parent_id: parentId },
      })
      return response.data || []
    } catch (error) {
      logger.error(`[CategoryService] Error fetching children for category ${parentId}`, { error, parentId })
      return []
    }
  }
}

export const categoryService = new CategoryService()
export default categoryService

