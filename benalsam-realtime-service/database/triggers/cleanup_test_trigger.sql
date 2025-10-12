-- ===========================
-- CLEANUP TEST TRIGGER
-- ===========================
-- Test trigger'ını sil

-- Test trigger'ını sil
DROP TRIGGER IF EXISTS "test_trigger" ON "public"."listings";

-- Test function'ını sil (varsa)
DROP FUNCTION IF EXISTS "public"."test_trigger"();

-- ===========================
-- DEPLOYMENT NOTES
-- ===========================
-- ✅ Test trigger silindi
-- ✅ Test function silindi
-- 
-- Bu SQL'i Supabase Dashboard → SQL Editor'de çalıştırın.
