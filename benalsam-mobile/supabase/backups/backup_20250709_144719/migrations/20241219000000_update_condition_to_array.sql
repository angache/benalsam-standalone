-- Condition alanını array olarak güncelle
-- Önce mevcut string değerleri array'e çevir
UPDATE listings 
SET condition = ARRAY[condition] 
WHERE condition IS NOT NULL AND condition != '';

-- Sonra alan tipini değiştir
ALTER TABLE listings 
ALTER COLUMN condition TYPE text[] USING condition::text[];

-- Default değer ekle
ALTER TABLE listings 
ALTER COLUMN condition SET DEFAULT ARRAY['İkinci El'];

-- Index ekle (array arama için)
CREATE INDEX idx_listings_condition ON listings USING GIN (condition);

-- Açıklama ekle
COMMENT ON COLUMN listings.condition IS 'Ürün durumu - çoklu seçim (Sıfır, Yeni, Az Kullanılmış, İkinci El, Yenilenmiş, Hasarlı, Parça)'; 