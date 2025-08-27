-- Cache Version System Migration
-- Tarih: 2025-08-27
-- Amaç: Kategori değişikliklerini otomatik algılayıp cache'i temizlemek

-- system_settings tablosu oluştur
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES admin_users(id)
);

-- İlk kayıt - categories_version
INSERT INTO system_settings (key, value, description) 
VALUES ('categories_version', '1', 'Kategori cache version numarası')
ON CONFLICT (key) DO NOTHING;

-- Trigger fonksiyonu
CREATE OR REPLACE FUNCTION update_categories_version()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE system_settings 
  SET value = (CAST(value AS INTEGER) + 1)::TEXT,
      updated_at = now()
  WHERE key = 'categories_version';
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger oluştur (eğer yoksa)
DROP TRIGGER IF EXISTS trigger_update_categories_version ON categories;
CREATE TRIGGER trigger_update_categories_version
  AFTER UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_version();

-- Index ekle (performance için)
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- Log tablosu oluştur (opsiyonel - debugging için)
CREATE TABLE IF NOT EXISTS cache_version_logs (
  id SERIAL PRIMARY KEY,
  version_key VARCHAR(100) NOT NULL,
  old_version INTEGER,
  new_version INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES admin_users(id),
  reason TEXT
);

-- Log fonksiyonu
CREATE OR REPLACE FUNCTION log_cache_version_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO cache_version_logs (version_key, old_version, new_version, reason)
  VALUES (
    'categories_version',
    CAST(OLD.value AS INTEGER),
    CAST(NEW.value AS INTEGER),
    'Kategori güncellendi'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Log trigger
DROP TRIGGER IF EXISTS trigger_log_cache_version ON system_settings;
CREATE TRIGGER trigger_log_cache_version
  AFTER UPDATE ON system_settings
  FOR EACH ROW
  WHEN (OLD.key = 'categories_version')
  EXECUTE FUNCTION log_cache_version_change();
