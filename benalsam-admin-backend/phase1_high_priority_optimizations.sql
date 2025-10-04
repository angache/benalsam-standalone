-- ========================================
-- PHASE 1: HIGH PRIORITY OPTIMIZATIONS
-- ========================================
-- Bu script en kritik performans optimizasyonlarını içerir
-- Risk: DÜŞÜK - Sadece index ekleme
-- Expected Impact: %30-50 query performance improvement
-- ========================================

-- ========================================
-- 1. LISTINGS COMPOSITE INDEXES
-- ========================================

-- 1.1. Status + Created At (Most common query pattern)
CREATE INDEX IF NOT EXISTS idx_listings_status_created_at 
ON listings(status, created_at DESC) 
WHERE status IN ('active', 'pending_approval');

-- 1.2. Category + Status + Created At (Category filtering)
CREATE INDEX IF NOT EXISTS idx_listings_category_status_created 
ON listings(category, status, created_at DESC) 
WHERE status = 'active';

-- 1.3. User + Status + Updated At (User dashboard)
CREATE INDEX IF NOT EXISTS idx_listings_user_status_updated 
ON listings(user_id, status, updated_at DESC);

-- 1.4. Popularity + Featured (Homepage sorting)
CREATE INDEX IF NOT EXISTS idx_listings_popularity_featured_created 
ON listings(popularity_score DESC, is_featured, created_at DESC) 
WHERE status = 'active';

-- ========================================
-- 2. OFFERS PERFORMANCE INDEXES
-- ========================================

-- 2.1. Listing + Status + Created At (Offer management)
CREATE INDEX IF NOT EXISTS idx_offers_listing_status_created 
ON offers(listing_id, status, created_at DESC);

-- 2.2. User + Status (User offer history)
CREATE INDEX IF NOT EXISTS idx_offers_user_status 
ON offers(offering_user_id, status) 
WHERE status IN ('pending', 'accepted', 'rejected');

-- 2.3. Price Range (Offer filtering)
CREATE INDEX IF NOT EXISTS idx_offers_price_range 
ON offers(offered_price) 
WHERE status = 'pending';

-- ========================================
-- 3. MESSAGES PERFORMANCE
-- ========================================

-- 3.1. Conversation + Unread + Created At (Chat interface)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_unread 
ON messages(conversation_id, is_read, created_at DESC) 
WHERE is_read = false;

-- 3.2. User + Unread (Notification count)
CREATE INDEX IF NOT EXISTS idx_messages_user_unread 
ON messages(sender_id, is_read) 
WHERE is_read = false;

-- ========================================
-- 4. NOTIFICATIONS OPTIMIZATION
-- ========================================

-- 4.1. User + Unread + Created At (Notification feed)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(recipient_user_id, is_read, created_at DESC) 
WHERE is_read = false;

-- ========================================
-- 5. USER STATISTICS OPTIMIZATION
-- ========================================

-- 5.1. User + Created At (Statistics dashboard)
CREATE INDEX IF NOT EXISTS idx_user_statistics_user_created 
ON user_statistics(user_id, created_at DESC);

-- ========================================
-- 6. VERIFICATION QUERIES
-- ========================================

-- 6.1. Check if indexes were created successfully
SELECT 
    'INDEX CREATION VERIFICATION' as status,
    COUNT(*) as total_indexes_created
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
AND indexname IN (
    'idx_listings_status_created_at',
    'idx_listings_category_status_created',
    'idx_listings_user_status_updated',
    'idx_listings_popularity_featured_created',
    'idx_offers_listing_status_created',
    'idx_offers_user_status',
    'idx_offers_price_range',
    'idx_messages_conversation_unread',
    'idx_messages_user_unread',
    'idx_notifications_user_unread',
    'idx_user_statistics_user_created'
);

-- ========================================
-- 7. PERFORMANCE IMPACT ESTIMATION
-- ========================================

SELECT 
    'PHASE 1 COMPLETED' as status,
    'High priority indexes created' as action_1,
    'Expected query performance improvement: 30-50%' as action_2,
    'Risk level: LOW (index addition only)' as action_3,
    'Next: Monitor query performance' as action_4,
    'Ready for Phase 2 optimizations' as result;
