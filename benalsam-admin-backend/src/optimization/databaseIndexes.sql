-- ===========================
-- DATABASE PERFORMANCE INDEXES
-- Generated for Supabase PostgreSQL
-- Based on actual column names (snake_case)
-- ===========================

-- AdminUser Table Indexes (mapped to admin_users)
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_created_at ON admin_users(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- Listing Table Indexes (mapped to listings)
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at);
CREATE INDEX IF NOT EXISTS idx_listings_updated_at ON listings(updated_at);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_category_id ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_views_count ON listings(views_count);
CREATE INDEX IF NOT EXISTS idx_listings_favorites_count ON listings(favorites_count);
CREATE INDEX IF NOT EXISTS idx_listings_offers_count ON listings(offers_count);
CREATE INDEX IF NOT EXISTS idx_listings_is_featured ON listings(is_featured);
CREATE INDEX IF NOT EXISTS idx_listings_is_urgent_premium ON listings(is_urgent_premium);
CREATE INDEX IF NOT EXISTS idx_listings_popularity_score ON listings(popularity_score);

-- Offer Table Indexes (mapped to offers)
CREATE INDEX IF NOT EXISTS idx_offers_listing_id ON offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_offering_user_id ON offers(offering_user_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_created_at ON offers(created_at);
CREATE INDEX IF NOT EXISTS idx_offers_updated_at ON offers(updated_at);
CREATE INDEX IF NOT EXISTS idx_offers_offered_price ON offers(offered_price);
CREATE INDEX IF NOT EXISTS idx_offers_is_highlighted ON offers(is_highlighted);
CREATE INDEX IF NOT EXISTS idx_offers_is_featured ON offers(is_featured);

-- Conversation Table Indexes (mapped to conversations)
CREATE INDEX IF NOT EXISTS idx_conversations_listing_id ON conversations(listing_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user1_id ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2_id ON conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at);

-- ===========================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ===========================

-- Listings by user and status
CREATE INDEX IF NOT EXISTS idx_listings_user_status ON listings(user_id, status);

-- Listings by category and status
CREATE INDEX IF NOT EXISTS idx_listings_category_status ON listings(category, status);

-- Listings by popularity and featured status
CREATE INDEX IF NOT EXISTS idx_listings_popularity_featured ON listings(popularity_score, is_featured);

-- Offers by listing and status
CREATE INDEX IF NOT EXISTS idx_offers_listing_status ON offers(listing_id, status);

-- Offers by user and status
CREATE INDEX IF NOT EXISTS idx_offers_user_status ON offers(offering_user_id, status);

-- Conversations by listing and participants
CREATE INDEX IF NOT EXISTS idx_conversations_listing_users ON conversations(listing_id, user1_id, user2_id);

-- ===========================
-- PARTIAL INDEXES FOR ACTIVE RECORDS
-- ===========================

-- Active admin users
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(id) WHERE is_active = true;

-- Active listings (assuming 'active' status)
CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(id) WHERE status = 'active';

-- Featured listings
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(id) WHERE is_featured = true;

-- Urgent premium listings
CREATE INDEX IF NOT EXISTS idx_listings_urgent_premium ON listings(id) WHERE is_urgent_premium = true;

-- ===========================
-- FULL-TEXT SEARCH INDEXES
-- ===========================

-- Full-text search for listings
CREATE INDEX IF NOT EXISTS idx_listings_fts ON listings USING gin(fts);

-- ===========================
-- QUERY OPTIMIZATION HINTS
-- ===========================

-- ANALYZE tables for better query planning
ANALYZE admin_users;
ANALYZE listings;
ANALYZE offers;
ANALYZE conversations;

-- ===========================
-- PERFORMANCE MONITORING
-- ===========================

-- Create a function to monitor slow queries
CREATE OR REPLACE FUNCTION log_slow_query(query_text TEXT, execution_time INTERVAL)
RETURNS VOID AS $$
BEGIN
  -- Log to a dedicated table if it exists, otherwise just log
  RAISE NOTICE 'Slow query detected: % (Duration: %)', query_text, execution_time;
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- INDEX USAGE STATISTICS
-- ===========================

-- Check index usage (run this after some time to see which indexes are used)
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- ORDER BY idx_scan DESC;
