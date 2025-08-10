-- 2FA (İki Aşamalı Doğrulama) Alanları Ekleme
-- Migration: 20250125_add_2fa_fields.sql

-- Profiles tablosuna 2FA alanları ekleme
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS totp_secret text,
ADD COLUMN IF NOT EXISTS backup_codes jsonb,
ADD COLUMN IF NOT EXISTS last_2fa_used timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_2fa_enabled boolean DEFAULT false;

-- Auth attempts tablosu oluşturma (rate limiting için)
CREATE TABLE IF NOT EXISTS public.auth_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('login', '2fa', 'password_reset')),
    success boolean NOT NULL DEFAULT false,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Auth attempts için indexler
CREATE INDEX IF NOT EXISTS idx_auth_attempts_user_id ON public.auth_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_type ON public.auth_attempts(type);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_created_at ON public.auth_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_user_type_time ON public.auth_attempts(user_id, type, created_at);

-- RLS policy'leri
ALTER TABLE public.auth_attempts ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi auth attempt'lerini görebilir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'auth_attempts' AND policyname = 'Users can view their own auth attempts') THEN
        CREATE POLICY "Users can view their own auth attempts" ON public.auth_attempts
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- Auth attempt'ler sadece sistem tarafından eklenebilir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'auth_attempts' AND policyname = 'System can insert auth attempts') THEN
        CREATE POLICY "System can insert auth attempts" ON public.auth_attempts
            FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- Eski auth attempt'leri temizleme fonksiyonu (30 günden eski)
CREATE OR REPLACE FUNCTION cleanup_old_auth_attempts()
RETURNS void AS $$
BEGIN
    DELETE FROM public.auth_attempts 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2FA durumu kontrol fonksiyonu
CREATE OR REPLACE FUNCTION get_2fa_status(user_uuid uuid)
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'is_enabled', p.is_2fa_enabled,
        'is_verified', p.totp_secret IS NOT NULL,
        'last_used', p.last_2fa_used,
        'has_backup_codes', p.backup_codes IS NOT NULL AND jsonb_array_length(p.backup_codes) > 0
    ) INTO result
    FROM public.profiles p
    WHERE p.id = user_uuid;
    
    RETURN COALESCE(result, '{}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rate limiting kontrol fonksiyonu
CREATE OR REPLACE FUNCTION check_rate_limit(user_uuid uuid, attempt_type text, time_window interval DEFAULT '15 minutes'::interval)
RETURNS boolean AS $$
DECLARE
    attempt_count integer;
    max_attempts integer := 5;
BEGIN
    -- Son X dakikada kaç deneme yapılmış
    SELECT COUNT(*) INTO attempt_count
    FROM public.auth_attempts
    WHERE user_id = user_uuid 
    AND type = attempt_type 
    AND created_at > NOW() - time_window;
    
    -- Eğer max_attempts'ten az deneme varsa izin ver
    RETURN attempt_count < max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Başarısız deneme kaydetme fonksiyonu
CREATE OR REPLACE FUNCTION log_failed_attempt(user_uuid uuid, attempt_type text, ip_addr text DEFAULT NULL, user_agent_text text DEFAULT NULL)
RETURNS void AS $$
BEGIN
    INSERT INTO public.auth_attempts (user_id, type, success, ip_address, user_agent)
    VALUES (user_uuid, attempt_type, false, ip_addr, user_agent_text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Başarılı deneme kaydetme fonksiyonu
CREATE OR REPLACE FUNCTION log_successful_attempt(user_uuid uuid, attempt_type text, ip_addr text DEFAULT NULL, user_agent_text text DEFAULT NULL)
RETURNS void AS $$
BEGIN
    INSERT INTO public.auth_attempts (user_id, type, success, ip_address, user_agent)
    VALUES (user_uuid, attempt_type, true, ip_addr, user_agent_text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2FA secret'ı güvenli şekilde güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_2fa_secret(user_uuid uuid, new_secret text, new_backup_codes jsonb)
RETURNS boolean AS $$
BEGIN
    UPDATE public.profiles 
    SET 
        totp_secret = new_secret,
        backup_codes = new_backup_codes,
        is_2fa_enabled = true,
        updated_at = NOW()
    WHERE id = user_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2FA'yı devre dışı bırakma fonksiyonu
CREATE OR REPLACE FUNCTION disable_2fa(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
    UPDATE public.profiles 
    SET 
        totp_secret = NULL,
        backup_codes = NULL,
        is_2fa_enabled = false,
        updated_at = NOW()
    WHERE id = user_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backup code doğrulama fonksiyonu
CREATE OR REPLACE FUNCTION verify_backup_code(user_uuid uuid, backup_code text)
RETURNS boolean AS $$
DECLARE
    user_backup_codes jsonb;
    updated_codes jsonb;
BEGIN
    -- Backup codes'u al
    SELECT backup_codes INTO user_backup_codes
    FROM public.profiles
    WHERE id = user_uuid;
    
    -- Backup codes yoksa false döndür
    IF user_backup_codes IS NULL THEN
        RETURN false;
    END IF;
    
    -- Backup code'u kontrol et
    IF user_backup_codes ? backup_code THEN
        -- Kullanılan backup code'u kaldır
        updated_codes := user_backup_codes - backup_code;
        
        -- Güncelle
        UPDATE public.profiles 
        SET 
            backup_codes = updated_codes,
            last_2fa_used = NOW(),
            updated_at = NOW()
        WHERE id = user_uuid;
        
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backup codes yenileme fonksiyonu
CREATE OR REPLACE FUNCTION regenerate_backup_codes(user_uuid uuid)
RETURNS jsonb AS $$
DECLARE
    new_backup_codes jsonb;
    i integer;
    code text;
BEGIN
    -- 10 adet 8 haneli backup code oluştur
    new_backup_codes := '[]'::jsonb;
    
    FOR i IN 1..10 LOOP
        -- 8 haneli rastgele kod oluştur
        code := lpad(floor(random() * 100000000)::text, 8, '0');
        new_backup_codes := new_backup_codes || to_jsonb(code);
    END LOOP;
    
    -- Backup codes'u güncelle
    UPDATE public.profiles 
    SET 
        backup_codes = new_backup_codes,
        updated_at = NOW()
    WHERE id = user_uuid;
    
    RETURN new_backup_codes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Yorumlar
COMMENT ON TABLE public.auth_attempts IS 'Kullanıcı kimlik doğrulama denemeleri (rate limiting için)';
COMMENT ON COLUMN public.profiles.totp_secret IS 'TOTP secret key (şifrelenmiş olmalı)';
COMMENT ON COLUMN public.profiles.backup_codes IS 'Yedek kodlar (JSON array)';
COMMENT ON COLUMN public.profiles.last_2fa_used IS 'Son 2FA kullanım zamanı';
COMMENT ON FUNCTION get_2fa_status(uuid) IS 'Kullanıcının 2FA durumunu döndürür';
COMMENT ON FUNCTION check_rate_limit(uuid, text, interval) IS 'Rate limiting kontrolü yapar';
COMMENT ON FUNCTION log_failed_attempt(uuid, text, text, text) IS 'Başarısız deneme kaydeder';
COMMENT ON FUNCTION log_successful_attempt(uuid, text, text, text) IS 'Başarılı deneme kaydeder';
COMMENT ON FUNCTION update_2fa_secret(uuid, text, jsonb) IS '2FA secret ve backup codes günceller';
COMMENT ON FUNCTION disable_2fa(uuid) IS '2FA''yı devre dışı bırakır';
COMMENT ON FUNCTION verify_backup_code(uuid, text) IS 'Backup code doğrular ve kullanılan kodu kaldırır';
COMMENT ON FUNCTION regenerate_backup_codes(uuid) IS 'Yeni backup codes oluşturur'; 