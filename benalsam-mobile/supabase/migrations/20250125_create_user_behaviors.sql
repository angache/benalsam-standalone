-- Create user_behaviors table for smart recommendations
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

-- 1. Tablo oluştur
CREATE TABLE IF NOT EXISTS user_behaviors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('view', 'favorite', 'offer', 'contact', 'share')),
  category TEXT,
  price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Indexler oluştur (performance için)
CREATE INDEX IF NOT EXISTS idx_user_behaviors_user_id ON user_behaviors(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_listing_id ON user_behaviors(listing_id);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_action ON user_behaviors(action);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_category ON user_behaviors(category);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_created_at ON user_behaviors(created_at);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_user_action ON user_behaviors(user_id, action);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_user_category ON user_behaviors(user_id, category);

-- 3. RLS aktifleştir
ALTER TABLE user_behaviors ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies oluştur
CREATE POLICY "Users can view their own behaviors" ON user_behaviors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own behaviors" ON user_behaviors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own behaviors" ON user_behaviors
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. updated_at trigger fonksiyonu
CREATE OR REPLACE FUNCTION update_user_behaviors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. updated_at trigger oluştur
CREATE TRIGGER update_user_behaviors_updated_at
  BEFORE UPDATE ON user_behaviors
  FOR EACH ROW
  EXECUTE FUNCTION update_user_behaviors_updated_at();

-- 7. Kullanıcı davranış istatistikleri fonksiyonu
CREATE OR REPLACE FUNCTION get_user_behavior_stats(user_uuid UUID)
RETURNS TABLE (
  total_views INTEGER,
  total_favorites INTEGER,
  total_offers INTEGER,
  total_contacts INTEGER,
  favorite_categories TEXT[],
  avg_price DECIMAL(10,2),
  activity_level TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE action = 'view') as views,
      COUNT(*) FILTER (WHERE action = 'favorite') as favorites,
      COUNT(*) FILTER (WHERE action = 'offer') as offers,
      COUNT(*) FILTER (WHERE action = 'contact') as contacts,
      AVG(price) FILTER (WHERE price IS NOT NULL) as avg_price,
      COUNT(*) as total_actions
    FROM user_behaviors 
    WHERE user_id = user_uuid
      AND created_at >= NOW() - INTERVAL '30 days'
  ),
  categories AS (
    SELECT array_agg(category) as cats
    FROM (
      SELECT category, COUNT(*) as cnt
      FROM user_behaviors 
      WHERE user_id = user_uuid 
        AND category IS NOT NULL
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY category
      ORDER BY cnt DESC
      LIMIT 5
    ) cat_stats
  )
  SELECT 
    s.views::INTEGER,
    s.favorites::INTEGER,
    s.offers::INTEGER,
    s.contacts::INTEGER,
    c.cats,
    s.avg_price,
    CASE 
      WHEN s.total_actions < 10 THEN 'low'
      WHEN s.total_actions < 50 THEN 'medium'
      ELSE 'high'
    END::TEXT
  FROM stats s, categories c;
END;
$$ LANGUAGE plpgsql;

-- 8. İzinler ver
GRANT SELECT, INSERT, UPDATE ON user_behaviors TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_behavior_stats(UUID) TO authenticated;

-- 9. Tablo yorumu ekle
COMMENT ON TABLE user_behaviors IS 'Smart recommendations için kullanıcı davranış takibi';
COMMENT ON COLUMN user_behaviors.action IS 'Kullanıcı eylemi: view, favorite, offer, contact, share';
COMMENT ON COLUMN user_behaviors.category IS 'İlan kategorisi (analytics için)';
COMMENT ON COLUMN user_behaviors.price IS 'İlan fiyatı (analytics için)'; 