-- ===========================
-- UPDATE FCM TRIGGER URL
-- ===========================
-- Mevcut fcm-notify trigger'ını listing-status-change olarak güncelle

-- Mevcut function'ı güncelle
CREATE OR REPLACE FUNCTION "public"."notify_fcm_listing_changes_simple"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    payload JSON;
    edge_function_url TEXT;
    auth_token TEXT;
    response_status INTEGER;
    response_content TEXT;
BEGIN
    -- Supabase Edge Function URL (GÜNCELLENDİ)
    edge_function_url := 'https://dnwreckpeenhbdtapmxr.supabase.co/functions/v1/listing-status-change';
    
    -- Doğru auth token (çalışan token)
    auth_token := 'd73a1ab1f2f8dd10efaca107899a2ec4ca06afcdc2ded4d7c4623fe206333a13';
    
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
    
    -- HTTP POST ile Edge Function'ı çağır (token ile)
    BEGIN
        SELECT status, content INTO response_status, response_content
        FROM http((
            'POST',
            edge_function_url,
            ARRAY[
                http_header('Content-Type', 'application/json'),
                http_header('Authorization', 'Bearer benalsam_super_secret_2025')
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

-- ===========================
-- DEPLOYMENT NOTES
-- ===========================
-- ✅ URL güncellendi: fcm-notify → listing-status-change
-- ✅ Authorization header eklendi: Bearer benalsam_super_secret_2025
-- ✅ Content-Type header eklendi
-- ✅ Log mesajları güncellendi
-- 
-- Bu SQL'i Supabase Dashboard → SQL Editor'de çalıştırın.
