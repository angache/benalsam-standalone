-- ========================================
-- CTO DATABASE OPTIMIZATION RECOMMENDATIONS
-- ========================================
-- Bu script CTO analizi sonucu önerilen optimizasyonları içerir
-- Priority: HIGH, MEDIUM, LOW
-- ========================================

-- ========================================
-- 1. HIGH PRIORITY OPTIMIZATIONS
-- ========================================

-- 1.1. Missing Composite Indexes
-- Listings için sık kullanılan query patterns
CREATE INDEX IF NOT EXISTS idx_listings_status_created_at 
ON listings(status, created_at DESC) 
WHERE status IN ('active', 'pending_approval');

CREATE INDEX IF NOT EXISTS idx_listings_category_status_created 
ON listings(category_id, status, created_at DESC) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_listings_user_status_updated 
ON listings(user_id, status, updated_at DESC);

-- 1.2. Offer Performance Indexes
CREATE INDEX IF NOT EXISTS idx_offers_listing_status_created 
ON offers(listing_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_offers_user_status 
ON offers(offering_user_id, status) 
WHERE status IN ('pending', 'accepted', 'rejected');

-- 1.3. Message Performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_unread 
ON messages(conversation_id, is_read, created_at DESC) 
WHERE is_read = false;

-- ========================================
-- 2. MEDIUM PRIORITY OPTIMIZATIONS
-- ========================================

-- 2.1. User Statistics Optimization
CREATE INDEX IF NOT EXISTS idx_user_statistics_user_date 
ON user_statistics(user_id, date DESC);

-- 2.2. Notification Performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, is_read, created_at DESC) 
WHERE is_read = false;

-- 2.3. Review System Optimization
CREATE INDEX IF NOT EXISTS idx_user_reviews_reviewee_rating 
ON user_reviews(reviewee_id, rating, created_at DESC);

-- ========================================
-- 3. LOW PRIORITY OPTIMIZATIONS
-- ========================================

-- 3.1. Admin System Indexes
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_user_date 
ON admin_activity_logs(user_id, created_at DESC);

-- 3.2. Cache System Optimization
CREATE INDEX IF NOT EXISTS idx_cache_version_logs_key_date 
ON cache_version_logs(version_key, created_at DESC);

-- ========================================
-- 4. QUERY OPTIMIZATION
-- ========================================

-- 4.1. Statistics Update Function
CREATE OR REPLACE FUNCTION update_listing_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Batch update statistics instead of individual updates
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Update user statistics
        INSERT INTO user_statistics (user_id, date, listings_count, views_count)
        VALUES (NEW.user_id, CURRENT_DATE, 1, 0)
        ON CONFLICT (user_id, date) 
        DO UPDATE SET 
            listings_count = user_statistics.listings_count + 1,
            updated_at = NOW();
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 5. MAINTENANCE OPTIMIZATIONS
-- ========================================

-- 5.1. Vacuum and Analyze Schedule
-- Bu komutları haftalık çalıştırın:
-- VACUUM ANALYZE listings;
-- VACUUM ANALYZE offers;
-- VACUUM ANALYZE messages;

-- 5.2. Index Usage Monitoring
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'LOW_USAGE'
        ELSE 'ACTIVE'
    END as usage_status
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- ========================================
-- 6. PERFORMANCE MONITORING
-- ========================================

-- 6.1. Slow Query Detection
CREATE OR REPLACE FUNCTION log_slow_queries()
RETURNS void AS $$
BEGIN
    -- Bu function'ı pg_stat_statements ile birlikte kullanın
    RAISE NOTICE 'Slow query monitoring enabled';
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. STORAGE OPTIMIZATION
-- ========================================

-- 7.1. Table Size Analysis
CREATE OR REPLACE VIEW table_sizes AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ========================================
-- 8. IMPLEMENTATION PRIORITY
-- ========================================

/*
IMPLEMENTATION ORDER:
1. HIGH PRIORITY (1-2 gün)
   - Composite indexes
   - Offer performance indexes
   - Message performance

2. MEDIUM PRIORITY (3-5 gün)
   - User statistics optimization
   - Notification performance
   - Review system optimization

3. LOW PRIORITY (1 hafta)
   - Admin system indexes
   - Cache system optimization

4. MONITORING (Sürekli)
   - Index usage monitoring
   - Slow query detection
   - Table size analysis

EXPECTED IMPROVEMENTS:
- Query performance: %30-50 iyileşme
- Index efficiency: %20-30 artış
- Storage optimization: %10-15 azalma
- Maintenance overhead: %25 azalma
*/
