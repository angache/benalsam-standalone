-- Fix Corporate plan listings_per_month limit
-- Database'de Corporate plan'ın listings_per_month değeri -1 olarak kayıtlı
-- Ama 50 olmalı (Corporate plan'da listings sınırsız değil, 50 adet)

UPDATE subscription_plans
SET limits = jsonb_set(
  limits,
  '{listings_per_month}',
  '50'::jsonb
)
WHERE slug = 'corporate'
AND (limits->>'listings_per_month')::integer = -1;

-- Kontrol sorgusu: Corporate plan'ın limits değerlerini göster
-- SELECT slug, name, limits FROM subscription_plans WHERE slug = 'corporate';

