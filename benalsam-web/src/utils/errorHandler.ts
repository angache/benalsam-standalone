/**
 * Unified Error Handling for Listing Service Integration
 */

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export class ListingServiceError extends Error {
  public code: string;
  public details?: any;
  public timestamp: string;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'ListingServiceError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export const handleListingServiceError = (error: any): ServiceError => {
  console.error('Listing Service Error:', error);

  // Network/Connection errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return {
      code: 'SERVICE_UNAVAILABLE',
      message: 'Listing Service şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
      details: { originalError: error.message },
      timestamp: new Date().toISOString()
    };
  }

  // Timeout errors
  if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
    return {
      code: 'SERVICE_TIMEOUT',
      message: 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.',
      details: { originalError: error.message },
      timestamp: new Date().toISOString()
    };
  }

  // HTTP status errors
  if (error.response?.status) {
    switch (error.response.status) {
      case 503:
        return {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Listing Service geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
          details: { status: error.response.status, data: error.response.data },
          timestamp: new Date().toISOString()
        };
      case 429:
        return {
          code: 'RATE_LIMITED',
          message: 'Çok fazla istek gönderildi. Lütfen bir süre bekleyin.',
          details: { status: error.response.status },
          timestamp: new Date().toISOString()
        };
      case 400:
        return {
          code: 'BAD_REQUEST',
          message: error.response.data?.message || 'Geçersiz istek. Lütfen bilgilerinizi kontrol edin.',
          details: { status: error.response.status, data: error.response.data },
          timestamp: new Date().toISOString()
        };
      case 401:
        return {
          code: 'UNAUTHORIZED',
          message: 'Yetkilendirme hatası. Lütfen tekrar giriş yapın.',
          details: { status: error.response.status },
          timestamp: new Date().toISOString()
        };
      case 500:
        return {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
          details: { status: error.response.status },
          timestamp: new Date().toISOString()
        };
      default:
        return {
          code: 'HTTP_ERROR',
          message: `HTTP Hatası (${error.response.status}). Lütfen daha sonra tekrar deneyin.`,
          details: { status: error.response.status, data: error.response.data },
          timestamp: new Date().toISOString()
        };
    }
  }

  // Generic error
  return {
    code: 'UNKNOWN_ERROR',
    message: 'Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
    details: { originalError: error.message },
    timestamp: new Date().toISOString()
  };
};

export const getUserFriendlyMessage = (error: ServiceError): string => {
  return error.message;
};

export const shouldRetry = (error: ServiceError): boolean => {
  const retryableCodes = [
    'SERVICE_UNAVAILABLE',
    'SERVICE_TIMEOUT',
    'RATE_LIMITED',
    'INTERNAL_SERVER_ERROR'
  ];
  
  return retryableCodes.includes(error.code);
};
