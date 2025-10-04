-- ===========================
-- AI SUGGESTIONS ELASTICSEARCH SYNC
-- ===========================
-- Bu migration AI suggestions için Elasticsearch sync trigger'ını oluşturur

-- ===========================
-- AI SUGGESTIONS QUEUE TRIGGER
-- ===========================

-- AI suggestions için queue trigger - DISABLED (legacy queue system removed)
-- DROP TRIGGER IF EXISTS category_ai_suggestions_queue_sync ON category_ai_suggestions;
-- CREATE TRIGGER category_ai_suggestions_queue_sync
--     AFTER INSERT OR UPDATE OR DELETE ON category_ai_suggestions
--     FOR EACH ROW
--     EXECUTE FUNCTION add_to_elasticsearch_queue();

-- ===========================
-- AI SUGGESTIONS SYNC FUNCTION
-- ===========================

-- AI suggestions için özel sync fonksiyonu
CREATE OR REPLACE FUNCTION sync_ai_suggestion_to_elasticsearch()
RETURNS TRIGGER AS $$
DECLARE
    record_id INTEGER;
    category_data JSONB;
    suggestion_doc JSONB;
BEGIN
    -- Record ID'yi belirle
    IF TG_OP = 'DELETE' THEN
        record_id := OLD.id;
    ELSE
        record_id := NEW.id;
    END IF;

    -- Kategori bilgilerini al
    SELECT jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'path', c.path,
        'level', c.level
    ) INTO category_data
    FROM categories c
    WHERE c.id = COALESCE(NEW.category_id, OLD.category_id);

    -- AI suggestion dokümanını hazırla
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        suggestion_doc := jsonb_build_object(
            'id', NEW.id,
            'category_id', NEW.category_id,
            'category_name', category_data->>'name',
            'category_path', category_data->>'path',
            'suggestion_type', NEW.suggestion_type,
            'suggestion_data', NEW.suggestion_data,
            'confidence_score', NEW.confidence_score,
            'is_approved', NEW.is_approved,
            'created_at', NEW.created_at,
            'updated_at', NEW.updated_at,
            'search_boost', COALESCE(NEW.search_boost, 1.0),
            'usage_count', COALESCE(NEW.usage_count, 0),
            'last_used_at', NEW.last_used_at
        );
    END IF;

    -- Queue'ya ekle - DISABLED (legacy queue system removed)
    -- INSERT INTO elasticsearch_sync_queue (
    --     table_name,
    --     operation,
    --     record_id,
    --     change_data
    -- ) VALUES (
    --     TG_TABLE_NAME,
    --     TG_OP,
    --     record_id::UUID,
    --     CASE 
    --         WHEN TG_OP = 'INSERT' THEN suggestion_doc
    --         WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
    --             'old', jsonb_build_object(
    --                 'id', OLD.id,
    --                 'category_id', OLD.category_id,
    --                 'category_name', category_data->>'name',
    --                 'category_path', category_data->>'path',
    --                 'suggestion_type', OLD.suggestion_type,
    --                 'suggestion_data', OLD.suggestion_data,
    --                 'confidence_score', OLD.confidence_score,
    --                 'is_approved', OLD.is_approved,
    --                 'created_at', OLD.created_at,
    --                 'updated_at', OLD.updated_at,
    --                 'search_boost', COALESCE(OLD.search_boost, 1.0),
    --                 'usage_count', COALESCE(OLD.usage_count, 0),
    --                 'last_used_at', OLD.last_used_at
    --             ),
    --             'new', suggestion_doc
    --         )
    --         WHEN TG_OP = 'DELETE' THEN jsonb_build_object(
    --             'id', OLD.id,
    --             'category_id', OLD.category_id,
    --             'category_name', category_data->>'name',
    --             'category_path', category_data->>'path',
    --             'suggestion_type', OLD.suggestion_type,
    --             'suggestion_data', OLD.suggestion_data,
    --             'confidence_score', OLD.confidence_score,
    --             'is_approved', OLD.is_approved,
    --             'created_at', OLD.created_at,
    --             'updated_at', OLD.updated_at,
    --             'search_boost', COALESCE(OLD.search_boost, 1.0),
    --             'usage_count', COALESCE(OLD.usage_count, 0),
    --             'last_used_at', OLD.last_used_at
    --         )
    --     END
    -- );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- AI SUGGESTIONS TRIGGER
-- ===========================

-- AI suggestions için özel trigger (queue yerine direkt sync)
DROP TRIGGER IF EXISTS category_ai_suggestions_elasticsearch_sync ON category_ai_suggestions;

CREATE TRIGGER category_ai_suggestions_elasticsearch_sync
    AFTER INSERT OR UPDATE OR DELETE ON category_ai_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION sync_ai_suggestion_to_elasticsearch();

-- ===========================
-- INDEXES FOR PERFORMANCE
-- ===========================

-- AI suggestions için performans index'leri
CREATE INDEX IF NOT EXISTS idx_category_ai_suggestions_category_id 
ON category_ai_suggestions(category_id);

CREATE INDEX IF NOT EXISTS idx_category_ai_suggestions_is_approved 
ON category_ai_suggestions(is_approved);

CREATE INDEX IF NOT EXISTS idx_category_ai_suggestions_confidence_score 
ON category_ai_suggestions(confidence_score DESC);

CREATE INDEX IF NOT EXISTS idx_category_ai_suggestions_created_at 
ON category_ai_suggestions(created_at DESC);

-- ===========================
-- COMMENTS
-- ===========================

COMMENT ON FUNCTION sync_ai_suggestion_to_elasticsearch() IS 
'AI suggestions için Elasticsearch sync fonksiyonu. Kategori bilgilerini de dahil eder.';

COMMENT ON TRIGGER category_ai_suggestions_elasticsearch_sync ON category_ai_suggestions IS 
'AI suggestions tablosu için Elasticsearch sync trigger. INSERT/UPDATE/DELETE işlemlerini yakalar.';
