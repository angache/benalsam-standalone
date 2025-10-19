import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'

interface ApiClientConfig {
  baseURL: string
  timeout?: number
  headers?: Record<string, string>
}

class ApiClient {
  private client: AxiosInstance

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
      (response) => response,
      (error) => {
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

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config)
    return response.data
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config)
    return response.data
  }
}

// API Clients
export const adminBackendClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_ADMIN_BACKEND_URL || 'http://localhost:3002',
})

export const categoriesServiceClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_CATEGORIES_SERVICE_URL || 'http://localhost:3015',
})

export const searchServiceClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_SEARCH_SERVICE_URL || 'http://localhost:3016',
})

export const listingServiceClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_LISTING_SERVICE_URL || 'http://localhost:3008/api/v1',
})

export const uploadServiceClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_UPLOAD_SERVICE_URL || 'http://localhost:3007/api/v1',
})

export default ApiClient

