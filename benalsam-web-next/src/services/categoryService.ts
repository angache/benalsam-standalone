import { categoriesServiceClient } from '@/lib/apiClient'
import { categoryCacheService } from './categoryCacheService'
import { logger } from '@/utils/production-logger'

// VPS mode flag - when true, service URLs already contain the full path
const useVpsServices = process.env.NEXT_PUBLIC_USE_VPS_SERVICES === 'true'

// #region agent log
if (process.env.NODE_ENV !== 'production') {
  fetch('http://127.0.0.1:7242/ingest/51cb1d3f-6077-4466-a5e9-831f71f53a28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'categoryService.ts:6',message:'useVpsServices flag check',data:{useVpsServices, envValue: process.env.NEXT_PUBLIC_USE_VPS_SERVICES},timestamp:Date.now(),sessionId:'debug-session',runId:'initial'})}).catch(()=>{});
}
// #endregion

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
    // #region agent log
    if (process.env.NODE_ENV !== 'production') {
      fetch('http://127.0.0.1:7242/ingest/51cb1d3f-6077-4466-a5e9-831f71f53a28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'categoryService.ts:49',message:'getCategories called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial'})}).catch(()=>{});
    }
    // #endregion

    return categoryCacheService.getCategories(async () => {
      // VPS mode (production): Service URL already includes base path, so use '/api/v1/categories'
      // Local development with proxy: Also need full path '/api/v1/categories'
      // True local mode: Need full path /api/v1/categories
      
      // Local development detection
      const isLocalDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
      const endpoint = (useVpsServices && !isLocalDevelopment) ? '/api/v1/categories' : '/api/v1/categories'

      // #region agent log
      if (process.env.NODE_ENV !== 'production') {
        fetch('http://127.0.0.1:7242/ingest/51cb1d3f-6077-4466-a5e9-831f71f53a28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'categoryService.ts:52',message:'endpoint construction',data:{endpoint, useVpsServices},timestamp:Date.now(),sessionId:'debug-session',runId:'initial'})}).catch(()=>{});
      }
      // #endregion

      try {
        // #region agent log
        if (process.env.NODE_ENV !== 'production') {
          fetch('http://127.0.0.1:7242/ingest/51cb1d3f-6077-4466-a5e9-831f71f53a28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'categoryService.ts:55',message:'API call starting',data:{endpoint},timestamp:Date.now(),sessionId:'debug-session',runId:'initial'})}).catch(()=>{});
        }
        // #endregion

        const response = await categoriesServiceClient.get<{ success: boolean; data: Category[] }>(endpoint)

        // #region agent log
        if (process.env.NODE_ENV !== 'production') {
          fetch('http://127.0.0.1:7242/ingest/51cb1d3f-6077-4466-a5e9-831f71f53a28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'categoryService.ts:58',message:'API call success',data:{responseStatus: response?.status, hasData: !!response?.data, dataLength: response?.data?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'initial'})}).catch(()=>{});
        }
        // #endregion

        return response.data || []
      } catch (error) {
        // #region agent log
        if (process.env.NODE_ENV !== 'production') {
          fetch('http://127.0.0.1:7242/ingest/51cb1d3f-6077-4466-a5e9-831f71f53a28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'categoryService.ts:63',message:'API call failed',data:{error: error?.message, endpoint},timestamp:Date.now(),sessionId:'debug-session',runId:'initial'})}).catch(()=>{});
        }
        // #endregion
        throw error
      }
    })
  }

  /**
   * Get categories in a tree structure
   */
  async getCategoryTree(): Promise<CategoryTree[]> {
    try {
      // Local development detection
      const isLocalDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
      const endpoint = (useVpsServices && !isLocalDevelopment) ? '/api/v1/categories/tree' : '/api/v1/categories/tree'
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
      // Local development detection
      const isLocalDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
      const endpoint = (useVpsServices && !isLocalDevelopment) ? `/api/v1/categories/${id}` : `/api/v1/categories/${id}`
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
      // Local development detection
      const isLocalDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
      const endpoint = (useVpsServices && !isLocalDevelopment) ? `/api/v1/categories/slug/${slug}` : `/api/v1/categories/slug/${slug}`
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
      // Local development detection
      const isLocalDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
      const endpoint = (useVpsServices && !isLocalDevelopment) ? '/api/v1/categories/search' : '/api/v1/categories/search'
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
      // Local development detection
      const isLocalDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
      const endpoint = (useVpsServices && !isLocalDevelopment) ? `/api/v1/categories/${parentId}/children` : `/api/v1/categories/${parentId}/children`
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

