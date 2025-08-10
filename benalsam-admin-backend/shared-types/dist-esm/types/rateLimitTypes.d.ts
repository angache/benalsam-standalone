export interface RateLimitData {
    email: string;
    attempts: number;
    first_attempt: string;
    last_attempt: string;
    blocked: boolean;
    block_expiry?: string;
    platform: 'web' | 'mobile' | 'both';
    created_at: string;
    updated_at: string;
}
export interface RateLimitResult {
    allowed: boolean;
    error?: 'PROGRESSIVE_DELAY' | 'TOO_MANY_ATTEMPTS' | 'ACCOUNT_LOCKED';
    timeRemaining: number;
    message?: string;
    attempts: number;
    resetTime?: string;
}
export interface RateLimitConfig {
    maxAttemptsPerWindow: number;
    windowMinutes: number;
    progressiveDelaySeconds: number;
    tempBlockMinutes: number;
    accountLockHours: number;
}
//# sourceMappingURL=rateLimitTypes.d.ts.map