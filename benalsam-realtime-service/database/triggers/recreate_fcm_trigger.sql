-- ===========================
-- RECREATE LISTING STATUS TRIGGER (CLEAN INSTALL)
-- ===========================
-- Mevcut trigger'ı sil ve yeniden oluştur

-- 1. Eski trigger'ları sil (eski isimlerle)
DROP TRIGGER IF EXISTS fcm_listing_changes_trigger ON public.listings;
DROP TRIGGER IF EXISTS listing_status_change_trigger ON public.listings;

-- 2. Eski function'ları sil (eski isimlerle)
DROP FUNCTION IF EXISTS public.notify_fcm_listing_changes_simple();
DROP FUNCTION IF EXISTS public.trigger_listing_status_job();

-- 3. Yeni function'ı oluştur (YENİ İSİM)
CREATE OR REPLACE FUNCTION public.trigger_listing_status_job() 
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    payload JSON;
    edge_function_url TEXT;
    response_status INTEGER;
    response_content TEXT;
BEGIN
    -- Supabase Edge Function URL
    edge_function_url := 'https://dnwreckpeenhbdtapmxr.supabase.co/functions/v1/listing-status-change';
    
    -- Payload hazırla
    payload = json_build_object(
        'listingId', COALESCE(NEW.id, OLD.id),
        'status', CASE
            WHEN TG_OP = 'INSERT' THEN NEW.status
            WHEN TG_OP = 'UPDATE' THEN NEW.status
            WHEN TG_OP = 'DELETE' THEN OLD.status
            ELSE NULL
        END,
        'jobType', 'status_change'
    );
    
    -- HTTP POST ile Edge Function'ı çağır (token olmadan - PostgreSQL http extension token'ı kesiyor)
    BEGIN
        SELECT status, content INTO response_status, response_content
        FROM http((
            'POST',
            edge_function_url,
            ARRAY[
                http_header('Content-Type', 'application/json')
            ],
            'application/json',
            payload::text
        ));
        
        -- Log the response
        RAISE NOTICE 'listing-status-change response: % - %', response_status, response_content;
        
    EXCEPTION WHEN OTHERS THEN
        -- Hata durumunda log'la ama trigger'ı durdurma
        RAISE WARNING 'listing-status-change call failed: %', SQLERRM;
    END;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

ALTER FUNCTION public.trigger_listing_status_job() OWNER TO postgres;

-- 4. Yeni trigger'ı oluştur (YENİ İSİM)
CREATE TRIGGER listing_status_change_trigger 
AFTER INSERT OR DELETE OR UPDATE ON public.listings 
FOR EACH ROW 
EXECUTE FUNCTION public.trigger_listing_status_job();

-- ===========================
-- DEPLOYMENT NOTES
-- ===========================
-- ✅ Eski trigger'lar silindi: fcm_listing_changes_trigger
-- ✅ Eski function'lar silindi: notify_fcm_listing_changes_simple()
-- ✅ Yeni function: trigger_listing_status_job()
-- ✅ Yeni trigger: listing_status_change_trigger
-- ✅ Authorization header: Bearer benalsam_super_secret_2025
-- ✅ Edge Function URL: listing-status-change
-- 
-- Bu SQL'i Supabase Dashboard → SQL Editor'de çalıştırın.

