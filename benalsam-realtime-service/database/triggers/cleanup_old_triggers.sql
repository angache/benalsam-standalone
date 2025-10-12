-- ===========================
-- CLEANUP OLD TRIGGERS AND FUNCTIONS
-- ===========================
-- Eski trigger'ları ve function'ları temizle

-- 1. Eski trigger'ları sil
DROP TRIGGER IF EXISTS "on_listing_status_change" ON "public"."listings";
DROP TRIGGER IF EXISTS "trigger_listing_status_change" ON "public"."listings";
DROP TRIGGER IF EXISTS "listings_status_outbox_trigger" ON "public"."listings";

-- 2. Eski function'ları sil
DROP FUNCTION IF EXISTS "public"."notify_listing_status_change"();
DROP FUNCTION IF EXISTS "public"."trigger_listing_status_outbox"();
DROP FUNCTION IF EXISTS "public"."create_notification_for_listing_status_change"();

-- ===========================
-- VERIFICATION
-- ===========================
-- Temizlik sonrası kontrol sorguları:

-- Function'ları listele
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (routine_name LIKE '%fcm%' OR routine_name LIKE '%listing%' OR routine_name LIKE '%trigger%')
ORDER BY routine_name;

-- Trigger'ları listele
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND (trigger_name LIKE '%fcm%' OR trigger_name LIKE '%listing%' OR trigger_name LIKE '%trigger%')
ORDER BY trigger_name;

-- ===========================
-- DEPLOYMENT NOTES
-- ===========================
-- ✅ Eski trigger'lar silindi
-- ✅ Eski function'lar silindi
-- ✅ Sadece yeni trigger_listing_status_job() ve listing_status_change_trigger kaldı
-- 
-- Bu SQL'i Supabase Dashboard → SQL Editor'de çalıştırın.
