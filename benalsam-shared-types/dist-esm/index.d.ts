export * from './types/index';
export * from './errors/ServiceError';
export * from './middleware/ErrorHandler';
export { SecurityMiddleware, createSecurityMiddleware, SECURITY_CONFIGS, type SecurityConfig } from './security/SecurityMiddleware';
export { ValidationMiddleware, createValidationMiddleware, COMMON_SCHEMAS, type ValidationError, type ValidationResult, type ValidationSchema } from './security/ValidationMiddleware';
export * from './testing/MockFactory';
export * from './testing/TestHelpers';
export declare const formatPrice: (price: number) => string;
export declare const formatDate: (date: string | Date) => string;
export declare const formatRelativeTime: (date: string | Date) => string;
export declare const validateEmail: (email: string) => boolean;
export declare const getInitials: (name: string) => string;
export declare const truncateText: (text: string, maxLength: number) => string;
export declare const getAvatarUrl: (avatarUrl?: string | null, userId?: string) => string;
export declare const isPremiumUser: (user?: {
    is_premium?: boolean;
    premium_expires_at?: string;
}) => boolean;
export declare const getTrustLevel: (trustScore: number) => "bronze" | "silver" | "gold" | "platinum";
export declare const getTrustLevelColor: (level: "bronze" | "silver" | "gold" | "platinum") => string;
export declare const formatPhoneNumber: (phone: string) => string;
//# sourceMappingURL=index.d.ts.map