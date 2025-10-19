import { categoriesServiceClient } from '@/lib/apiClient'
import { categoryCacheService } from './categoryCacheService'

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
      const response = await categoriesServiceClient.get<{ success: boolean; data: Category[] }>('/api/v1/categories')
      return response.data || []
    })
  }

  /**
   * Get categories in a tree structure
   */
  async getCategoryTree(): Promise<CategoryTree[]> {
    try {
      const response = await categoriesServiceClient.get<{ data: CategoryTree[] }>('/api/v1/categories/tree')
      return response.data || []
    } catch (error) {
      console.error('Error fetching category tree:', error)
      return []
    }
  }

  /**
   * Get a single category by ID
   */
  async getCategoryById(id: string): Promise<Category | null> {
    try {
      const response = await categoriesServiceClient.get<{ data: Category }>(`/api/v1/categories/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching category ${id}:`, error)
      return null
    }
  }

  /**
   * Get a category by slug
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const response = await categoriesServiceClient.get<{ data: Category }>(`/api/v1/categories/slug/${slug}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching category by slug ${slug}:`, error)
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
      console.log('🔍 All categories fetched:', allCategories.length)
      
      // Sadece level 0 kategorileri filtrele ve ilk N tanesini al
      // NOT: listing_count backend'den gelmiyor, frontend'de useCategoryCounts hook'u ile ekleniyor
      const topLevelCategories = allCategories
        .filter(cat => cat.level === 0)
        .slice(0, limit)
      
      console.log('✅ Popular categories:', topLevelCategories.map(c => ({ name: c.name, id: c.id })))
      return topLevelCategories
    } catch (error) {
      console.error('Error fetching popular categories:', error)
      return []
    }
  }

  /**
   * Search categories by name
   */
  async searchCategories(query: string): Promise<Category[]> {
    try {
      const response = await categoriesServiceClient.get<{ data: Category[] }>(`/api/v1/categories/search`, {
        params: { q: query },
      })
      return response.data || []
    } catch (error) {
      console.error('Error searching categories:', error)
      return []
    }
  }

  /**
   * Get children of a category
   */
  async getCategoryChildren(parentId: string): Promise<Category[]> {
    try {
      const response = await categoriesServiceClient.get<{ data: Category[] }>(`/api/v1/categories/${parentId}/children`)
      return response.data || []
    } catch (error) {
      console.error(`Error fetching children for category ${parentId}:`, error)
      return []
    }
  }
}

export const categoryService = new CategoryService()
export default categoryService

