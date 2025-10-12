-- ===========================
-- FIX: Trigger'ı fcm-notify URL'sine geri döndür
-- ===========================

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
    -- ESKİ ÇALIŞAN URL: fcm-notify
    edge_function_url := 'https://dnwreckpeenhbdtapmxr.supabase.co/functions/v1/fcm-notify';
    
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
    
    -- HTTP POST (token olmadan - fcm-notify kendi secret'ını kullanıyor)
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
        RAISE NOTICE 'fcm-notify response: % - %', response_status, response_content;
        
    EXCEPTION WHEN OTHERS THEN
        -- Hata durumunda log'la ama trigger'ı durdurma
        RAISE WARNING 'fcm-notify call failed: %', SQLERRM;
    END;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- ===========================
-- DEPLOYMENT NOTES
-- ===========================
-- ✅ URL'i eski çalışan fcm-notify'a döndürdük
-- ✅ Token kaldırıldı (fcm-notify kendi FIREBASE_SECRET'ını kullanıyor)
-- 
-- Bu SQL'i Supabase Dashboard → SQL Editor'de çalıştırın.

