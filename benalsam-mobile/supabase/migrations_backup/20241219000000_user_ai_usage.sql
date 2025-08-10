-- AI kullanım takibi tablosu
CREATE TABLE IF NOT EXISTS user_ai_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month_key text NOT NULL, -- YYYY-MM format (2024-12)
    attempts_used integer NOT NULL DEFAULT 0,
    monthly_limit integer NOT NULL DEFAULT 30, -- Ücretsiz kullanıcılar için 30, premium için -1
    is_premium boolean NOT NULL DEFAULT false,
    last_used_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Her kullanıcı için aylık tek kayıt
    UNIQUE(user_id, month_key)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_user_ai_usage_user_id ON user_ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_usage_month_key ON user_ai_usage(month_key);
CREATE INDEX IF NOT EXISTS idx_user_ai_usage_user_month ON user_ai_usage(user_id, month_key);

-- RLS (Row Level Security) politikaları
ALTER TABLE user_ai_usage ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi kullanım verilerini görebilir
CREATE POLICY "Users can view own AI usage" ON user_ai_usage
    FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcılar sadece kendi kullanım verilerini güncelleyebilir
CREATE POLICY "Users can update own AI usage" ON user_ai_usage
    FOR UPDATE USING (auth.uid() = user_id);

-- Kullanıcılar sadece kendi kullanım verilerini ekleyebilir
CREATE POLICY "Users can insert own AI usage" ON user_ai_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger: updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_ai_usage_updated_at 
    BEFORE UPDATE ON user_ai_usage 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Fonksiyon: Kullanıcının AI kullanımını kontrol et
CREATE OR REPLACE FUNCTION check_user_ai_usage(
    p_user_id uuid,
    p_month_key text DEFAULT to_char(now(), 'YYYY-MM')
)
RETURNS TABLE(
    can_use boolean,
    attempts_left integer,
    total_attempts integer,
    monthly_limit integer,
    is_premium boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN u.is_premium THEN true
            ELSE u.attempts_used < u.monthly_limit
        END as can_use,
        CASE 
            WHEN u.is_premium THEN -1
            ELSE GREATEST(0, u.monthly_limit - u.attempts_used)
        END as attempts_left,
        u.attempts_used as total_attempts,
        u.monthly_limit,
        u.is_premium
    FROM user_ai_usage u
    WHERE u.user_id = p_user_id 
    AND u.month_key = p_month_key;
    
    -- Eğer kayıt yoksa, yeni kayıt oluştur
    IF NOT FOUND THEN
        INSERT INTO user_ai_usage (user_id, month_key, attempts_used, monthly_limit, is_premium)
        VALUES (p_user_id, p_month_key, 0, 30, false)
        ON CONFLICT (user_id, month_key) DO NOTHING;
        
        RETURN QUERY
        SELECT 
            true as can_use,
            30 as attempts_left,
            0 as total_attempts,
            30 as monthly_limit,
            false as is_premium;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonksiyon: AI kullanımını kaydet
CREATE OR REPLACE FUNCTION record_ai_usage(
    p_user_id uuid,
    p_month_key text DEFAULT to_char(now(), 'YYYY-MM')
)
RETURNS void AS $$
BEGIN
    INSERT INTO user_ai_usage (user_id, month_key, attempts_used, monthly_limit, is_premium)
    VALUES (p_user_id, p_month_key, 1, 30, false)
    ON CONFLICT (user_id, month_key) 
    DO UPDATE SET 
        attempts_used = user_ai_usage.attempts_used + 1,
        last_used_at = now(),
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonksiyon: Premium durumunu güncelle
CREATE OR REPLACE FUNCTION update_user_premium_status(
    p_user_id uuid,
    p_is_premium boolean,
    p_monthly_limit integer DEFAULT 30
)
RETURNS void AS $$
BEGIN
    UPDATE user_ai_usage 
    SET 
        is_premium = p_is_premium,
        monthly_limit = CASE WHEN p_is_premium THEN -1 ELSE p_monthly_limit END,
        updated_at = now()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 