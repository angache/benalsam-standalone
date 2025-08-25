-- AI Suggestions Usage Tracking System
-- Bu migration, AI önerilerinin kullanım istatistiklerini takip etmek için gerekli tabloları oluşturur

-- 1. AI Suggestions Usage Logs tablosu
CREATE TABLE IF NOT EXISTS ai_suggestions_usage_logs (
  id SERIAL PRIMARY KEY,
  suggestion_id INTEGER REFERENCES category_ai_suggestions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  query TEXT NOT NULL,
  clicked_at TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  category_id INTEGER REFERENCES categories(id),
  search_type VARCHAR(50) DEFAULT 'ai_suggestion', -- 'ai_suggestion', 'direct_search', 'category_browse'
  result_position INTEGER, -- Kaçıncı sırada tıklandı
  dwell_time INTEGER, -- Milisaniye cinsinden sayfada kalma süresi
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. AI Suggestions Analytics tablosu (aggregated data)
CREATE TABLE IF NOT EXISTS ai_suggestions_analytics (
  id SERIAL PRIMARY KEY,
  suggestion_id INTEGER REFERENCES category_ai_suggestions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_clicks INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  click_through_rate DECIMAL(5,4) DEFAULT 0.0,
  avg_dwell_time INTEGER DEFAULT 0,
  search_queries JSONB DEFAULT '[]', -- Hangi aramalarla geldi
  user_segments JSONB DEFAULT '{}', -- Kullanıcı segmentasyonu
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(suggestion_id, date)
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_usage_logs_suggestion_id ON ai_suggestions_usage_logs(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_usage_logs_date ON ai_suggestions_usage_logs(clicked_at);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_usage_logs_query ON ai_suggestions_usage_logs(query);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_analytics_suggestion_id ON ai_suggestions_analytics(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_analytics_date ON ai_suggestions_analytics(date);

-- 4. RLS Policies
ALTER TABLE ai_suggestions_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions_analytics ENABLE ROW LEVEL SECURITY;

-- Admin can read all usage logs
CREATE POLICY "Admin can read usage logs" ON ai_suggestions_usage_logs
  FOR SELECT USING (auth.role() = 'admin');

-- Anyone can insert usage logs (for tracking)
CREATE POLICY "Anyone can insert usage logs" ON ai_suggestions_usage_logs
  FOR INSERT WITH CHECK (true);

-- Admin can read analytics
CREATE POLICY "Admin can read analytics" ON ai_suggestions_analytics
  FOR SELECT USING (auth.role() = 'admin');

-- System can update analytics
CREATE POLICY "System can update analytics" ON ai_suggestions_analytics
  FOR UPDATE USING (auth.role() = 'admin');

-- 5. Functions for usage tracking

-- Log AI suggestion click
CREATE OR REPLACE FUNCTION log_ai_suggestion_click(
  p_suggestion_id INTEGER,
  p_query TEXT,
  p_session_id VARCHAR(255) DEFAULT NULL,
  p_result_position INTEGER DEFAULT NULL,
  p_search_type VARCHAR(50) DEFAULT 'ai_suggestion'
) RETURNS VOID AS $$
BEGIN
  INSERT INTO ai_suggestions_usage_logs (
    suggestion_id,
    user_id,
    session_id,
    query,
    ip_address,
    user_agent,
    category_id,
    search_type,
    result_position
  ) VALUES (
    p_suggestion_id,
    auth.uid(),
    p_session_id,
    p_query,
    inet_client_addr(),
    current_setting('request.headers')::json->>'user-agent',
    (SELECT category_id FROM category_ai_suggestions WHERE id = p_suggestion_id),
    p_search_type,
    p_result_position
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update suggestion usage count
CREATE OR REPLACE FUNCTION update_suggestion_usage_count(p_suggestion_id INTEGER) RETURNS VOID AS $$
BEGIN
  UPDATE category_ai_suggestions 
  SET usage_count = usage_count + 1,
      last_used_at = NOW()
  WHERE id = p_suggestion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get trending suggestions based on usage
CREATE OR REPLACE FUNCTION get_trending_suggestions_by_usage(
  p_days INTEGER DEFAULT 7,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  suggestion_id INTEGER,
  total_clicks INTEGER,
  click_through_rate DECIMAL(5,4),
  avg_dwell_time INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.suggestion_id,
    a.total_clicks,
    a.click_through_rate,
    a.avg_dwell_time
  FROM ai_suggestions_analytics a
  WHERE a.date >= CURRENT_DATE - p_days
  ORDER BY a.total_clicks DESC, a.click_through_rate DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger to update analytics daily
CREATE OR REPLACE FUNCTION update_ai_suggestions_analytics() RETURNS TRIGGER AS $$
DECLARE
  v_date DATE := CURRENT_DATE;
  v_suggestion_id INTEGER;
  v_total_clicks INTEGER;
  v_unique_clicks INTEGER;
  v_total_impressions INTEGER;
  v_click_through_rate DECIMAL(5,4);
  v_avg_dwell_time INTEGER;
  v_search_queries JSONB;
  v_user_segments JSONB;
BEGIN
  -- Get analytics data for the suggestion
  SELECT 
    suggestion_id,
    COUNT(*) as total_clicks,
    COUNT(DISTINCT session_id) as unique_clicks,
    AVG(dwell_time) as avg_dwell_time,
    jsonb_agg(DISTINCT query) as search_queries
  INTO 
    v_suggestion_id,
    v_total_clicks,
    v_unique_clicks,
    v_avg_dwell_time,
    v_search_queries
  FROM ai_suggestions_usage_logs
  WHERE suggestion_id = NEW.suggestion_id
    AND DATE(clicked_at) = v_date
  GROUP BY suggestion_id;

  -- Calculate click-through rate (simplified)
  v_click_through_rate := CASE 
    WHEN v_total_impressions > 0 THEN v_total_clicks::DECIMAL / v_total_impressions
    ELSE 0.0
  END;

  -- Insert or update analytics
  INSERT INTO ai_suggestions_analytics (
    suggestion_id,
    date,
    total_clicks,
    unique_clicks,
    total_impressions,
    click_through_rate,
    avg_dwell_time,
    search_queries,
    user_segments,
    updated_at
  ) VALUES (
    v_suggestion_id,
    v_date,
    v_total_clicks,
    v_unique_clicks,
    v_total_impressions,
    v_click_through_rate,
    v_avg_dwell_time,
    v_search_queries,
    v_user_segments,
    NOW()
  )
  ON CONFLICT (suggestion_id, date)
  DO UPDATE SET
    total_clicks = EXCLUDED.total_clicks,
    unique_clicks = EXCLUDED.unique_clicks,
    total_impressions = EXCLUDED.total_impressions,
    click_through_rate = EXCLUDED.click_through_rate,
    avg_dwell_time = EXCLUDED.avg_dwell_time,
    search_queries = EXCLUDED.search_queries,
    user_segments = EXCLUDED.user_segments,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for analytics update
DROP TRIGGER IF EXISTS trigger_update_ai_suggestions_analytics ON ai_suggestions_usage_logs;
CREATE TRIGGER trigger_update_ai_suggestions_analytics
  AFTER INSERT ON ai_suggestions_usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_suggestions_analytics();

-- 7. Add usage tracking columns to category_ai_suggestions if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'category_ai_suggestions' 
                 AND column_name = 'usage_count') THEN
    ALTER TABLE category_ai_suggestions ADD COLUMN usage_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'category_ai_suggestions' 
                 AND column_name = 'last_used_at') THEN
    ALTER TABLE category_ai_suggestions ADD COLUMN last_used_at TIMESTAMP;
  END IF;
END $$;

-- 8. Update existing suggestions with default usage data
UPDATE category_ai_suggestions 
SET usage_count = COALESCE(usage_count, 0),
    last_used_at = COALESCE(last_used_at, created_at)
WHERE usage_count IS NULL OR last_used_at IS NULL;

COMMENT ON TABLE ai_suggestions_usage_logs IS 'AI suggestions kullanım logları';
COMMENT ON TABLE ai_suggestions_analytics IS 'AI suggestions analitik verileri (günlük aggregated)';
COMMENT ON FUNCTION log_ai_suggestion_click IS 'AI suggestion tıklamasını logla';
COMMENT ON FUNCTION get_trending_suggestions_by_usage IS 'Kullanım bazında trending suggestions getir';
