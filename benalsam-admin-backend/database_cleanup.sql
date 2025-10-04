-- ========================================
-- DATABASE CLEANUP SCRIPT
-- ========================================
-- Bu script legacy queue sistemini temizler
-- Firebase Enterprise sistemine geçiş sonrası gereksiz tabloları kaldırır
-- 
-- Çalıştırmadan önce:
-- 1. Database backup alın
-- 2. Production'da test edin
-- 3. Rollback planı hazırlayın
-- ========================================

-- ========================================
-- 1. BACKUP CHECKPOINT
-- ========================================
-- Bu noktada backup alınmış olmalı
-- SELECT 'BACKUP CHECKPOINT - Cleanup başlıyor' as status;

-- ========================================
-- 2. LEGACY QUEUE SYSTEM CLEANUP
-- ========================================

-- 2.1. Legacy queue tablosunu kaldır
-- Bu tablo artık Firebase Enterprise sistemi tarafından değiştirildi
DROP TABLE IF EXISTS public.elasticsearch_sync_queue CASCADE;

-- 2.2. Legacy queue function'ını kaldır
-- Bu function artık kullanılmıyor
DROP FUNCTION IF EXISTS public.add_to_sync_queue() CASCADE;

-- 2.3. Legacy queue helper function'larını kaldır
DROP FUNCTION IF EXISTS public.get_next_elasticsearch_job() CASCADE;
DROP FUNCTION IF EXISTS public.update_elasticsearch_job_status(INTEGER, VARCHAR(20), TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_old_elasticsearch_jobs() CASCADE;
DROP FUNCTION IF EXISTS public.get_elasticsearch_queue_stats() CASCADE;

-- ========================================
-- 3. AI SUGGESTION TABLES - KEEP (ACTIVE FEATURE)
-- ========================================

-- 3.1. AI suggestions usage logs - KEEP (Active AI feature)
-- DROP TABLE IF EXISTS public.ai_suggestions_usage_logs CASCADE; -- REMOVED: This is an active AI feature!

-- 3.2. Category AI suggestions - KEEP (Active AI feature)
-- DROP TABLE IF EXISTS public.category_ai_suggestions CASCADE; -- REMOVED: This is an active AI feature!

-- ========================================
-- 4. INVENTORY TABLES - KEEP (ACTIVE FEATURE)
-- ========================================

-- 4.1. Inventory items - KEEP (Active feature used by mobile app)
-- DROP TABLE IF EXISTS public.inventory_items CASCADE; -- REMOVED: This is an active feature!

-- ========================================
-- 5. LEGACY TRIGGER FUNCTIONS CLEANUP
-- ========================================

-- 5.1. Legacy elasticsearch sync function (pg_notify based)
DROP FUNCTION IF EXISTS public.log_elasticsearch_change() CASCADE;

-- ========================================
-- 6. VERIFICATION QUERIES
-- ========================================

-- 6.1. Temizlenen tabloların kontrolü
SELECT 
    'CLEANUP VERIFICATION' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'elasticsearch_sync_queue') 
        THEN 'FAILED - elasticsearch_sync_queue still exists'
        ELSE 'SUCCESS - elasticsearch_sync_queue removed'
    END as elasticsearch_queue_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_suggestions_usage_logs') 
        THEN 'SUCCESS - ai_suggestions_usage_logs kept (active AI feature)'
        ELSE 'FAILED - ai_suggestions_usage_logs missing (should exist)'
    END as ai_suggestions_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'category_ai_suggestions') 
        THEN 'SUCCESS - category_ai_suggestions kept (active AI feature)'
        ELSE 'FAILED - category_ai_suggestions missing (should exist)'
    END as category_ai_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_items') 
        THEN 'SUCCESS - inventory_items kept (active feature)'
        ELSE 'FAILED - inventory_items missing (should exist)'
    END as inventory_status;

-- 6.2. Active system verification
SELECT 
    'ACTIVE SYSTEM VERIFICATION' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'listings') 
        THEN 'SUCCESS - listings table exists'
        ELSE 'FAILED - listings table missing'
    END as listings_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
        THEN 'SUCCESS - profiles table exists'
        ELSE 'FAILED - profiles table missing'
    END as profiles_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') 
        THEN 'SUCCESS - categories table exists'
        ELSE 'FAILED - categories table missing'
    END as categories_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'notify_fcm_listing_changes_simple') 
        THEN 'SUCCESS - Firebase trigger function exists'
        ELSE 'FAILED - Firebase trigger function missing'
    END as firebase_trigger_status;

-- ========================================
-- 7. CLEANUP SUMMARY
-- ========================================

SELECT 
    'CLEANUP COMPLETED' as status,
    'Legacy queue system removed' as action_1,
    'AI suggestion system kept (active feature)' as action_2,
    'Inventory system kept (active feature)' as action_3,
    'Legacy trigger functions removed' as action_4,
    'Firebase Enterprise system remains active' as action_5,
    'Database is now clean and optimized' as result;

-- ========================================
-- 8. ROLLBACK INSTRUCTIONS (EMERGENCY)
-- ========================================
/*
Eğer rollback gerekirse:

1. Database backup'ından restore edin
2. Veya aşağıdaki komutları çalıştırın:

-- Rollback: elasticsearch_sync_queue tablosunu geri oluştur
CREATE TABLE IF NOT EXISTS public.elasticsearch_sync_queue (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(20) NOT NULL,
    record_id UUID NOT NULL,
    change_data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Rollback: add_to_sync_queue function'ını geri oluştur
CREATE OR REPLACE FUNCTION public.add_to_sync_queue()
RETURNS TRIGGER AS $$
-- Function body buraya gelecek
$$ LANGUAGE plpgsql;
*/

-- ========================================
-- END OF CLEANUP SCRIPT
-- ========================================
