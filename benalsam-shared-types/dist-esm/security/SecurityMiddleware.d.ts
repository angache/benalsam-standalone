/**
 * Security Middleware for Microservices
 * Tüm servisler için standardize edilmiş güvenlik katmanı
 */
import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
/**
 * Security Configuration Interface
 */
export interface SecurityConfig {
    rateLimit: {
        windowMs: number;
        max: number;
        message: string;
        standardHeaders: boolean;
        legacyHeaders: boolean;
    };
    cors: {
        origin: string | string[];
        credentials: boolean;
        methods: string[];
        allowedHeaders: string[];
    };
    helmet: {
        contentSecurityPolicy: boolean;
        crossOriginEmbedderPolicy: boolean;
        hsts: boolean;
    };
}
/**
 * Default Security Configuration
 */
export declare const DEFAULT_SECURITY_CONFIG: SecurityConfig;
/**
 * Security Middleware Class
 */
export declare class SecurityMiddleware {
    private config;
    private rateLimitInstance;
    constructor(config?: SecurityConfig);
    /**
     * Rate Limiting Middleware
     */
    getRateLimit(): any;
    /**
     * CORS Middleware
     */
    getCors(): (req: cors.CorsRequest, res: {
        statusCode?: number | undefined;
        setHeader(key: string, value: string): any;
        end(): any;
    }, next: (err?: any) => any) => void;
    /**
     * Helmet Security Middleware
     */
    getHelmet(): (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
    /**
     * API Key Validation Middleware
     */
    getApiKeyValidation(): (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
    /**
     * Request Size Limiter
     */
    getRequestSizeLimit(): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    /**
     * IP Whitelist Middleware
     */
    getIpWhitelist(allowedIPs: string[]): (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
    /**
     * Request Logging Middleware
     */
    getRequestLogger(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Security Headers Middleware
     */
    getSecurityHeaders(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Health Check Bypass Middleware
     */
    getHealthCheckBypass(): (req: Request, res: Response, next: NextFunction) => any;
    /**
     * Get all security middleware as array
     */
    getAllMiddleware(): (((req: cors.CorsRequest, res: {
        statusCode?: number | undefined;
        setHeader(key: string, value: string): any;
        end(): any;
    }, next: (err?: any) => any) => void) | ((req: Request, res: Response, next: NextFunction) => void))[];
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<SecurityConfig>): void;
}
/**
 * Factory function to create security middleware
 */
export declare function createSecurityMiddleware(config?: Partial<SecurityConfig>): SecurityMiddleware;
/**
 * Environment-specific security configurations
 */
export declare const SECURITY_CONFIGS: {
    development: {
        rateLimit: {
            windowMs: number;
            max: number;
            message: string;
            standardHeaders: boolean;
            legacyHeaders: boolean;
        };
        cors: {
            origin: boolean;
            credentials: boolean;
            methods: string[];
            allowedHeaders: string[];
        };
    };
    production: {
        rateLimit: {
            windowMs: number;
            max: number;
            message: string;
            standardHeaders: boolean;
            legacyHeaders: boolean;
        };
        cors: {
            origin: string[];
            credentials: boolean;
            methods: string[];
            allowedHeaders: string[];
        };
    };
};
//# sourceMappingURL=SecurityMiddleware.d.ts.map