import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { logger } from '@/utils/production-logger'

interface ApiClientConfig {
  baseURL: string
  timeout?: number
  headers?: Record<string, string>
}

/**
 * HTTP client wrapper with automatic authentication, performance tracking,
 * and error handling. Uses Axios under the hood with interceptors for
 * request/response processing.
 * 
 * Features:
 * - Automatic JWT token injection from localStorage
 * - Performance tracking for all requests
 * - Automatic 401 handling (token removal)
 * - Request/response interceptors
 * 
 * @example
 * ```typescript
 * const client = new ApiClient({
 *   baseURL: 'https://api.example.com',
 *   timeout: 30000
 * })
 * 
 * const data = await client.get<User>('/users/123')
 * ```
 */
class ApiClient {
  private client: AxiosInstance

  /**
   * Tracks API performance metrics for monitoring and diagnostics.
   * Logs request duration, status, and success/failure.
   * 
   * @param params - Performance tracking parameters
   * @param params.url - Request URL
   * @param params.method - HTTP method
   * @param params.durationMs - Request duration in milliseconds
   * @param params.status - HTTP status code
   * @param params.success - Whether request succeeded
   * @private
   */
  private trackApiPerformance(params: {
    url?: string
    method?: string
    durationMs?: number
    status?: number
    success: boolean
  }) {
    const { url, method, durationMs, status, success } = params

    // logger zaten prod/test ortamında sessiz; burada sadece yapılandırılmış log basıyoruz
    logger.debug('[API Performance] Request finished', {
      url,
      method,
      durationMs,
      status,
      success,
    })
  }

  /**
   * Creates a new ApiClient instance.
   * Sets up Axios client with interceptors for auth, performance tracking, and error handling.
   * 
   * @param config - Client configuration
   * @param config.baseURL - Base URL for all requests
   * @param config.timeout - Request timeout in milliseconds (default: 30000)
   * @param config.headers - Additional headers to include in all requests
   */
  constructor(config: ApiClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    })

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Basit süre ölçümü için başlangıç zamanını metadata olarak ekle
        if (typeof window !== 'undefined' && typeof performance !== 'undefined') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cfg = config as AxiosRequestConfig & { metadata?: Record<string, unknown> }
          cfg.metadata = {
            ...(cfg.metadata || {}),
            startTime: performance.now(),
          }
        }

        // Add auth token if exists
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        try {
          // Süre ölçümü (başarılı istek)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cfg = response.config as AxiosRequestConfig & { metadata?: Record<string, unknown> }
          const startTime = cfg.metadata?.startTime as number | undefined
          const durationMs =
            typeof window !== 'undefined' && typeof performance !== 'undefined' && typeof startTime === 'number'
              ? performance.now() - startTime
              : undefined

          this.trackApiPerformance({
            url: cfg.url,
            method: cfg.method,
            durationMs,
            status: response.status,
            success: true,
          })
        } catch {
          // Performans log'unda hata olsa bile ana response akışını bozmuyoruz
        }

        return response
      },
      (error) => {
        try {
          // Süre ölçümü (hatalı istek)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cfg = (error.config || {}) as AxiosRequestConfig & { metadata?: Record<string, unknown> }
          const startTime = cfg.metadata?.startTime as number | undefined
          const durationMs =
            typeof window !== 'undefined' && typeof performance !== 'undefined' && typeof startTime === 'number'
              ? performance.now() - startTime
              : undefined

          this.trackApiPerformance({
            url: cfg.url,
            method: cfg.method,
            durationMs,
            status: error.response?.status,
            success: false,
          })
        } catch {
          // Sessizce yut
        }

        if (error.response?.status === 401) {
          // Handle unauthorized
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token')
            // window.location.href = '/login'
          }
        }
        return Promise.reject(error)
      }
    )
  }

  /**
   * Performs a GET request.
   * 
   * @param url - Request URL (relative to baseURL)
   * @param config - Optional Axios request configuration
   * @returns Promise resolving to response data
   * @template T - Response data type
   * 
   * @example
   * ```typescript
   * const user = await client.get<User>('/users/123')
   * ```
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  /**
   * Performs a POST request.
   * 
   * @param url - Request URL (relative to baseURL)
   * @param data - Request body data
   * @param config - Optional Axios request configuration
   * @returns Promise resolving to response data
   * @template T - Response data type
   * 
   * @example
   * ```typescript
   * const newUser = await client.post<User>('/users', { name: 'John' })
   * ```
   */
  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config)
    return response.data
  }

  /**
   * Performs a PUT request.
   * 
   * @param url - Request URL (relative to baseURL)
   * @param data - Request body data
   * @param config - Optional Axios request configuration
   * @returns Promise resolving to response data
   * @template T - Response data type
   */
  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config)
    return response.data
  }

  /**
   * Performs a PATCH request.
   * 
   * @param url - Request URL (relative to baseURL)
   * @param data - Request body data
   * @param config - Optional Axios request configuration
   * @returns Promise resolving to response data
   * @template T - Response data type
   */
  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config)
    return response.data
  }

  /**
   * Performs a DELETE request.
   * 
   * @param url - Request URL (relative to baseURL)
   * @param config - Optional Axios request configuration
   * @returns Promise resolving to response data
   * @template T - Response data type
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config)
    return response.data
  }
}

// VPS veya local kullanımı kontrolü
const useVpsServices = process.env.USE_VPS_SERVICES === 'true' || 
                       process.env.NEXT_PUBLIC_USE_VPS_SERVICES === 'true' ||
                       (process.env.NODE_ENV === 'production' && process.env.USE_VPS_SERVICES !== 'false');

// API Clients
export const adminBackendClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_ADMIN_BACKEND_URL || 
    (useVpsServices
      ? 'https://api.benalsam.com/api/v1/admin'
      : 'http://localhost:3002'),
})

export const categoriesServiceClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_CATEGORIES_SERVICE_URL || 
    (useVpsServices
      ? 'https://api.benalsam.com/api/v1/categories' // Nginx rewrite: /api/v1/categories/(.*) -> /api/v1/$1
      : 'http://localhost:3015/api/v1'), // Local'de direkt servis endpoint'i
})

export const searchServiceClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_SEARCH_SERVICE_URL || 
    (useVpsServices
      ? 'https://api.benalsam.com/api/v1/search' // Nginx rewrite: /api/v1/search/(.*) -> /api/v1/$1
      : 'http://localhost:3016/api/v1'), // Local'de direkt servis endpoint'i
})

export const listingServiceClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_LISTING_SERVICE_URL || 
    (useVpsServices
      ? 'https://api.benalsam.com/api/v1/listings'
      : 'http://localhost:3008/api/v1'),
})

export const uploadServiceClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_UPLOAD_SERVICE_URL || 'http://localhost:3007/api/v1',
})

export default ApiClient

