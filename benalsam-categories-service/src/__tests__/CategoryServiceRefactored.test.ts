import { CategoryServiceRefactored } from '../services/CategoryServiceRefactored';
import { 
  IDatabaseService, 
  ICacheService, 
  ILogger,
  Category,
  CategoryAttribute,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateAttributeRequest,
  CategoryFilters,
  PaginationParams
} from '../interfaces/ICategoryService';

// Mock implementations
const mockDatabaseService: jest.Mocked<IDatabaseService> = {
  query: jest.fn(),
  healthCheck: jest.fn()
};

const mockCacheService: jest.Mocked<ICacheService> = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  healthCheck: jest.fn()
};

const mockLogger: jest.Mocked<ILogger> = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

// Mock Supabase
jest.mock('../config/database', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            single: jest.fn(),
            range: jest.fn(),
            or: jest.fn()
          }))
        })),
        order: jest.fn(() => ({
          single: jest.fn(),
          range: jest.fn()
        })),
        range: jest.fn(() => ({
          order: jest.fn()
        })),
        or: jest.fn(() => ({
          eq: jest.fn(() => ({
            range: jest.fn(() => ({
              order: jest.fn()
            }))
          }))
        })),
        single: jest.fn(),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn()
            }))
          }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn()
        }))
      }))
    }))
  }
}));

describe('CategoryServiceRefactored', () => {
  let categoryService: CategoryServiceRefactored;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockDatabaseService.healthCheck.mockResolvedValue({ 
      status: 'healthy', 
      responseTime: 100 
    });
    mockCacheService.healthCheck.mockResolvedValue({ 
      status: 'healthy', 
      responseTime: 50 
    });
    
    // Create new instance
    categoryService = new CategoryServiceRefactored(
      mockDatabaseService,
      mockCacheService,
      mockLogger
    );
  });

  describe('getCategories', () => {
    it('should return categories from cache when available', async () => {
      // Arrange
      const cachedCategories: Category[] = [
        {
          id: '1',
          name: 'Electronics',
          slug: 'electronics',
          level: 0,
          path: 'electronics',
          is_active: true,
          sort_order: 1,
          attributes: [],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        }
      ];
      
      mockCacheService.get.mockResolvedValue(JSON.stringify(cachedCategories));

      // Act
      const result = await categoryService.getCategories();

      // Assert
      expect(mockCacheService.get).toHaveBeenCalledWith('categories:all');
      expect(result).toEqual(cachedCategories);
      expect(mockLogger.info).toHaveBeenCalledWith('Cache hit for categories');
    });

    it('should fetch categories from database when cache miss', async () => {
      // Arrange
      const mockCategories = [
        {
          id: '1',
          name: 'Electronics',
          slug: 'electronics',
          level: 0,
          path: 'electronics',
          is_active: true,
          sort_order: 1,
          attributes: []
        }
      ];
      
      mockCacheService.get.mockResolvedValue(null);
      
      // Mock Supabase response
      const mockSupabaseResponse = {
        data: mockCategories,
        error: null
      };
      
      const mockSupabaseChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue(mockSupabaseResponse)
          })
        })
      };
      
      const { supabase } = require('../config/database');
      supabase.from.mockReturnValue(mockSupabaseChain);

      // Act
      const result = await categoryService.getCategories();

      // Assert
      expect(mockCacheService.get).toHaveBeenCalledWith('categories:all');
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'categories:all',
        expect.any(String),
        300
      );
      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('Electronics');
    });

    it('should handle database errors', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(null);
      
      const mockSupabaseResponse = {
        data: null,
        error: { message: 'Database connection failed' }
      };
      
      const mockSupabaseChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue(mockSupabaseResponse)
          })
        })
      };
      
      const { supabase } = require('../config/database');
      supabase.from.mockReturnValue(mockSupabaseChain);

      // Act & Assert
      await expect(categoryService.getCategories()).rejects.toThrow('Failed to fetch categories: Database connection failed');
    });
  });

  describe('getCategoriesFlat', () => {
    it('should return paginated categories with filters', async () => {
      // Arrange
      const filters: CategoryFilters = {
        search: 'electronics',
        is_active: true
      };
      
      const pagination: PaginationParams = {
        page: 1,
        pageSize: 10,
        sortBy: 'name',
        sortOrder: 'asc'
      };

      const mockResponse = {
        data: [
          {
            id: '1',
            name: 'Electronics',
            slug: 'electronics',
            level: 0,
            path: 'electronics',
            is_active: true,
            sort_order: 1,
            attributes: []
          }
        ],
        error: null,
        count: 1
      };

      const mockSupabaseChain = {
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              range: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue(mockResponse)
              })
            })
          })
        })
      };

      const { supabase } = require('../config/database');
      supabase.from.mockReturnValue(mockSupabaseChain);

      // Act
      const result = await categoryService.getCategoriesFlat(filters, pagination);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('getCategoryById', () => {
    it('should return category when found', async () => {
      // Arrange
      const mockCategory: Category = {
        id: '1',
        name: 'Electronics',
        slug: 'electronics',
        level: 0,
        path: 'electronics',
        is_active: true,
        sort_order: 1,
        attributes: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      const mockResponse = {
        data: mockCategory,
        error: null
      };

      const mockSupabaseChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue(mockResponse)
          })
        })
      };

      const { supabase } = require('../config/database');
      supabase.from.mockReturnValue(mockSupabaseChain);

      // Act
      const result = await categoryService.getCategoryById('1');

      // Assert
      expect(result).toEqual(mockCategory);
    });

    it('should return null when category not found', async () => {
      // Arrange
      const mockResponse = {
        data: null,
        error: { code: 'PGRST116' }
      };

      const mockSupabaseChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue(mockResponse)
          })
        })
      };

      const { supabase } = require('../config/database');
      supabase.from.mockReturnValue(mockSupabaseChain);

      // Act
      const result = await categoryService.getCategoryById('999');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('createCategory', () => {
    it('should create category successfully', async () => {
      // Arrange
      const createData: CreateCategoryRequest = {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices',
        is_active: true,
        sort_order: 1
      };

      const mockCreatedCategory: Category = {
        id: '1',
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices',
        level: 0,
        path: 'electronics',
        is_active: true,
        sort_order: 1,
        attributes: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      const mockResponse = {
        data: mockCreatedCategory,
        error: null
      };

      const mockSupabaseChain = {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue(mockResponse)
          })
        })
      };

      const { supabase } = require('../config/database');
      supabase.from.mockReturnValue(mockSupabaseChain);

      // Act
      const result = await categoryService.createCategory(createData);

      // Assert
      expect(result).toEqual(mockCreatedCategory);
      expect(mockCacheService.del).toHaveBeenCalledWith('categories:all');
    });
  });

  describe('updateCategory', () => {
    it('should update category successfully', async () => {
      // Arrange
      const updateData: UpdateCategoryRequest = {
        name: 'Updated Electronics',
        description: 'Updated description'
      };

      const mockUpdatedCategory: Category = {
        id: '1',
        name: 'Updated Electronics',
        slug: 'electronics',
        description: 'Updated description',
        level: 0,
        path: 'electronics',
        is_active: true,
        sort_order: 1,
        attributes: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      const mockResponse = {
        data: mockUpdatedCategory,
        error: null
      };

      const mockSupabaseChain = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue(mockResponse)
            })
          })
        })
      };

      const { supabase } = require('../config/database');
      supabase.from.mockReturnValue(mockSupabaseChain);

      // Act
      const result = await categoryService.updateCategory('1', updateData);

      // Assert
      expect(result).toEqual(mockUpdatedCategory);
      expect(mockCacheService.del).toHaveBeenCalledWith('categories:all');
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      // Arrange
      const mockResponse = {
        error: null
      };

      const mockSupabaseChain = {
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue(mockResponse)
        })
      };

      const { supabase } = require('../config/database');
      supabase.from.mockReturnValue(mockSupabaseChain);

      // Act
      await categoryService.deleteCategory('1');

      // Assert
      expect(mockCacheService.del).toHaveBeenCalledWith('categories:all');
    });
  });

  describe('createAttribute', () => {
    it('should create attribute successfully', async () => {
      // Arrange
      const createData: CreateAttributeRequest = {
        name: 'Color',
        type: 'select',
        is_required: true,
        is_filterable: true,
        options: ['Red', 'Blue', 'Green']
      };

      const mockCreatedAttribute: CategoryAttribute = {
        id: '1',
        category_id: '1',
        name: 'Color',
        type: 'select',
        is_required: true,
        is_filterable: true,
        is_searchable: false,
        options: ['Red', 'Blue', 'Green'],
        sort_order: 1,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      const mockResponse = {
        data: mockCreatedAttribute,
        error: null
      };

      const mockSupabaseChain = {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue(mockResponse)
          })
        })
      };

      const { supabase } = require('../config/database');
      supabase.from.mockReturnValue(mockSupabaseChain);

      // Act
      const result = await categoryService.createAttribute('1', createData);

      // Assert
      expect(result).toEqual(mockCreatedAttribute);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when all services are healthy', async () => {
      // Act
      const health = await categoryService.healthCheck();

      // Assert
      expect(health.status).toBe('healthy');
      expect(health.database.status).toBe('healthy');
      expect(health.cache.status).toBe('healthy');
    });

    it('should return degraded status when one service is unhealthy', async () => {
      // Arrange
      mockDatabaseService.healthCheck.mockResolvedValue({ 
        status: 'unhealthy', 
        responseTime: 0 
      });

      // Act
      const health = await categoryService.healthCheck();

      // Assert
      expect(health.status).toBe('degraded');
      expect(health.database.status).toBe('unhealthy');
    });

    it('should handle health check failure', async () => {
      // Arrange
      mockDatabaseService.healthCheck.mockRejectedValue(new Error('Health check failed'));

      // Act
      const health = await categoryService.healthCheck();

      // Assert
      expect(health.status).toBe('unhealthy');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Health check failed:', 
        expect.any(Error)
      );
    });
  });
});
