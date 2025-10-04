-- ========================================
-- PHASE 2: MEDIUM PRIORITY OPTIMIZATIONS
-- ========================================
-- Bu script orta öncelikli performans optimizasyonlarını içerir
-- Risk: DÜŞÜK - Index ve function optimizasyonları
-- Expected Impact: %20-30 additional performance improvement
-- ========================================

-- ========================================
-- 1. REVIEW SYSTEM OPTIMIZATION
-- ========================================

-- 1.1. User Reviews Performance
CREATE INDEX IF NOT EXISTS idx_user_reviews_reviewee_rating 
ON user_reviews(reviewee_id, rating, created_at DESC);

-- 1.2. Review Statistics
CREATE INDEX IF NOT EXISTS idx_user_reviews_reviewer_created 
ON user_reviews(reviewer_id, created_at DESC);

-- ========================================
-- 2. ADMIN SYSTEM OPTIMIZATION
-- ========================================

-- 2.1. Admin Activity Logs
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_date 
ON admin_activity_logs(admin_id, created_at DESC);

-- 2.2. Admin Performance Metrics
CREATE INDEX IF NOT EXISTS idx_admin_performance_metrics_date 
ON admin_performance_metrics(created_at DESC);

-- ========================================
-- 3. CACHE SYSTEM OPTIMIZATION
-- ========================================

-- 3.1. Cache Version Logs
CREATE INDEX IF NOT EXISTS idx_cache_version_logs_key_date 
ON cache_version_logs(version_key, updated_at DESC);

-- 3.2. Category Cache
CREATE INDEX IF NOT EXISTS idx_category_cache_created 
ON category_cache(created_at DESC);

-- ========================================
-- 4. AI SUGGESTIONS OPTIMIZATION
-- ========================================

-- 4.1. AI Suggestions Usage Logs
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_usage_logs_user_date 
ON ai_suggestions_usage_logs(user_id, clicked_at DESC);

-- 4.2. AI Suggestions Analytics
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_analytics_date 
ON ai_suggestions_analytics(date DESC);

-- ========================================
-- 5. CONVERSATION SYSTEM OPTIMIZATION
-- ========================================

-- 5.1. Conversation Participants
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user 
ON conversation_participants(user_id, created_at DESC);

-- 5.2. Conversations Last Message
CREATE INDEX IF NOT EXISTS idx_conversations_last_message 
ON conversations(last_message_at DESC) 
WHERE last_message_at IS NOT NULL;

-- ========================================
-- 6. LISTING REPORTS OPTIMIZATION
-- ========================================

-- 6.1. Listing Reports Status
CREATE INDEX IF NOT EXISTS idx_listing_reports_status_created 
ON listing_reports(status, created_at DESC);

-- 6.2. Listing Reports Reporter
CREATE INDEX IF NOT EXISTS idx_listing_reports_reporter 
ON listing_reports(reporter_id, created_at DESC);

-- ========================================
-- 7. USER BEHAVIOR OPTIMIZATION
-- ========================================

-- 7.1. User Events
CREATE INDEX IF NOT EXISTS idx_user_events_user_type 
ON user_events(user_id, event_type, created_at DESC);

-- 7.2. User Behavior Logs
CREATE INDEX IF NOT EXISTS idx_user_behavior_logs_user_date 
ON user_behavior_logs(user_id, created_at DESC);

-- ========================================
-- 8. QUERY OPTIMIZATION FUNCTIONS
-- ========================================

-- 8.1. Optimized Listing Search Function
CREATE OR REPLACE FUNCTION search_listings_optimized(
    search_query TEXT DEFAULT NULL,
    category_filter TEXT DEFAULT NULL,
    status_filter TEXT DEFAULT 'active',
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    category TEXT,
    budget NUMERIC,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    popularity_score INTEGER,
    is_featured BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.title,
        l.description,
        l.category,
        l.budget,
        l.location,
        l.created_at,
        l.popularity_score,
        l.is_featured
    FROM listings l
    WHERE 
        (search_query IS NULL OR l.title ILIKE '%' || search_query || '%' OR l.description ILIKE '%' || search_query || '%')
        AND (category_filter IS NULL OR l.category = category_filter)
        AND l.status = status_filter
    ORDER BY 
        l.is_featured DESC,
        l.popularity_score DESC,
        l.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 9. PERFORMANCE MONITORING VIEWS
-- ========================================

-- 9.1. Index Usage Statistics
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'LOW_USAGE'
        WHEN idx_scan < 1000 THEN 'MEDIUM_USAGE'
        ELSE 'HIGH_USAGE'
    END as usage_status
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- 9.2. Table Size Analysis
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
-- 10. VERIFICATION QUERIES
-- ========================================

-- 10.1. Check Phase 2 indexes
SELECT 
    'PHASE 2 INDEX VERIFICATION' as status,
    COUNT(*) as total_indexes_created
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
AND indexname IN (
    'idx_user_reviews_reviewee_rating',
    'idx_user_reviews_reviewer_created',
    'idx_admin_activity_logs_admin_date',
    'idx_admin_performance_metrics_date',
    'idx_cache_version_logs_key_date',
    'idx_category_cache_created',
    'idx_ai_suggestions_usage_logs_user_date',
    'idx_ai_suggestions_analytics_date',
    'idx_conversation_participants_user',
    'idx_conversations_last_message',
    'idx_listing_reports_status_created',
    'idx_listing_reports_reporter',
    'idx_user_events_user_type',
    'idx_user_behavior_logs_user_date'
);

-- ========================================
-- 11. PERFORMANCE IMPACT ESTIMATION
-- ========================================

SELECT 
    'PHASE 2 COMPLETED' as status,
    'Medium priority indexes created' as action_1,
    'Query optimization functions added' as action_2,
    'Performance monitoring views created' as action_3,
    'Expected additional improvement: 20-30%' as action_4,
    'Ready for Phase 3 monitoring setup' as result;
