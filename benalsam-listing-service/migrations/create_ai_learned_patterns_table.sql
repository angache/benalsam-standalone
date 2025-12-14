-- AI Learned Patterns Table
-- Stores successful patterns learned from high-performing listings

CREATE TABLE IF NOT EXISTS ai_learned_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL,
  pattern_type VARCHAR(20) NOT NULL CHECK (pattern_type IN ('title', 'description')),
  pattern TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  usage_count INTEGER NOT NULL DEFAULT 1,
  success_count INTEGER NOT NULL DEFAULT 1,
  success_rate DECIMAL(5,2) NOT NULL DEFAULT 100.00 CHECK (success_rate >= 0 AND success_rate <= 100),
  last_used TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Indexes for fast lookups
  CONSTRAINT unique_category_pattern UNIQUE (category, pattern_type, pattern)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_learned_patterns_category ON ai_learned_patterns(category);
CREATE INDEX IF NOT EXISTS idx_ai_learned_patterns_type ON ai_learned_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_ai_learned_patterns_score ON ai_learned_patterns(score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_learned_patterns_success_rate ON ai_learned_patterns(success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_ai_learned_patterns_last_used ON ai_learned_patterns(last_used DESC);

-- Comments
COMMENT ON TABLE ai_learned_patterns IS 'Stores AI-learned patterns from successful listings';
COMMENT ON COLUMN ai_learned_patterns.category IS 'Category name (normalized)';
COMMENT ON COLUMN ai_learned_patterns.pattern_type IS 'Type: title or description';
COMMENT ON COLUMN ai_learned_patterns.pattern IS 'The learned pattern (may contain placeholders)';
COMMENT ON COLUMN ai_learned_patterns.score IS 'Success score (0-100) based on views, responses, etc.';
COMMENT ON COLUMN ai_learned_patterns.usage_count IS 'How many times this pattern was used';
COMMENT ON COLUMN ai_learned_patterns.success_count IS 'How many times this pattern was successful';
COMMENT ON COLUMN ai_learned_patterns.success_rate IS 'Success rate percentage (success_count / usage_count * 100)';
COMMENT ON COLUMN ai_learned_patterns.last_used IS 'Last time this pattern was used';

