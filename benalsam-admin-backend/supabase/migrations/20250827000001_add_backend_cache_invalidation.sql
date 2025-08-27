-- Backend Cache Invalidation Migration
-- Tarih: 2025-08-27
-- Amaç: Backend cache'ini otomatik temizlemek için HTTP endpoint çağrısı

-- Backend cache temizleme fonksiyonu
CREATE OR REPLACE FUNCTION invalidate_backend_cache()
RETURNS void AS $$
DECLARE
  result text;
BEGIN
  -- Backend'e HTTP isteği gönder (cache temizleme için)
  -- Not: Bu fonksiyon sadece backend aynı sunucuda çalışıyorsa çalışır
  -- Production'da daha güvenli bir yöntem kullanılmalı
  
  -- Şimdilik sadece log yazalım
  INSERT INTO cache_version_logs (version_key, old_version, new_version, reason)
  VALUES (
    'backend_cache_invalidation',
    0,
    0,
    'Backend cache temizleme gerekiyor - manuel kontrol edin'
  );
  
  RAISE NOTICE 'Backend cache temizleme gerekiyor - manuel kontrol edin';
END;
$$ LANGUAGE plpgsql;

-- Cache version değiştiğinde backend cache'ini de temizle
CREATE OR REPLACE FUNCTION update_categories_version_with_cache_invalidation()
RETURNS TRIGGER AS $$
BEGIN
  -- Version'ı artır
  UPDATE system_settings 
  SET value = (CAST(value AS INTEGER) + 1)::TEXT,
      updated_at = now()
  WHERE key = 'categories_version';
  
  -- Backend cache temizleme işaretini koy
  PERFORM invalidate_backend_cache();
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Eski trigger'ı kaldır ve yenisini ekle
DROP TRIGGER IF EXISTS trigger_update_categories_version ON categories;
CREATE TRIGGER trigger_update_categories_version
  AFTER UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_version_with_cache_invalidation();

-- Cache temizleme durumu için yeni tablo
CREATE TABLE IF NOT EXISTS cache_invalidation_status (
  id SERIAL PRIMARY KEY,
  cache_type VARCHAR(50) NOT NULL, -- 'frontend', 'backend', 'all'
  status VARCHAR(20) NOT NULL, -- 'pending', 'completed', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Cache temizleme durumu ekle
INSERT INTO cache_invalidation_status (cache_type, status)
VALUES ('backend', 'pending')
ON CONFLICT DO NOTHING;
