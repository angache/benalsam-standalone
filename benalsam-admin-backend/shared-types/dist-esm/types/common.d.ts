export interface ApiResponse<T> {
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}
export type ID = string;
export interface Pagination {
    page: number;
    limit: number;
    total?: number;
}
export interface QueryFilters {
    search?: string;
    category?: string;
    location?: string;
    minBudget?: number;
    maxBudget?: number;
    urgency?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    attributes?: Record<string, string[]>;
}
export interface ServerConfig {
    port: number;
    nodeEnv: string;
    apiVersion: string;
}
export interface JwtConfig {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
}
export interface SecurityConfig {
    bcryptRounds: number;
    corsOrigin: string;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
}
export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface GetListingsParams {
    page?: number;
    limit?: number;
    search?: string;
    filters?: {
        status?: string;
        category?: string;
        userId?: string;
    };
    sort?: {
        field: string;
        order: 'asc' | 'desc';
    };
}
export interface AppError {
    code: string;
    message: string;
    details?: any;
}
export interface District {
    code: string;
    name: string;
}
export interface Province {
    code: string;
    name: string;
    districts: District[];
}
export interface Currency {
    code: string;
    name: string;
    symbol: string;
}
export interface Language {
    code: string;
    name: string;
    nativeName: string;
}
export interface Category {
    code: string;
    name: string;
    icon: any;
}
//# sourceMappingURL=common.d.ts.map