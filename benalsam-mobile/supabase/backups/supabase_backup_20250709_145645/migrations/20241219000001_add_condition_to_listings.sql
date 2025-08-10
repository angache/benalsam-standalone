-- Listings tablosuna condition alanını ekle
-- Bu alan ürünün durumunu çoklu seçim olarak saklayacak

-- Condition alanını ekle (başlangıçta text array olarak)
ALTER TABLE listings 
ADD COLUMN condition text[] DEFAULT ARRAY['İkinci El'];

-- Mevcut kayıtlar için default değer ata
UPDATE listings 
SET condition = ARRAY['İkinci El'] 
WHERE condition IS NULL;

-- Index ekle (array arama için)
CREATE INDEX idx_listings_condition ON listings USING GIN (condition);

-- Açıklama ekle
COMMENT ON COLUMN listings.condition IS 'Ürün durumu - çoklu seçim (Sıfır, Yeni, Az Kullanılmış, İkinci El, Yenilenmiş, Hasarlı, Parça)';

-- RLS (Row Level Security) için policy ekle (eğer RLS aktifse)
-- Bu kısım projenizin RLS yapılandırmasına göre değişebilir 