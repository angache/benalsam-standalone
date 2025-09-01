-- ===========================
-- ELASTICSEARCH SYNC TRIGGERS
-- ===========================
-- Bu dosya PostgreSQL trigger'larını içerir
-- Elasticsearch ile real-time sync için kullanılır

-- ===========================
-- HELPER FUNCTIONS
-- ===========================

-- Change data capture için JSON formatında değişiklik kaydet
CREATE OR REPLACE FUNCTION log_elasticsearch_change()
RETURNS TRIGGER AS $$
DECLARE
    change_data JSONB;
    operation TEXT;
BEGIN
    -- Operation type belirle
    IF TG_OP = 'INSERT' THEN
        operation := 'INSERT';
        change_data := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        operation := 'UPDATE';
        change_data := jsonb_build_object(
            'old', to_jsonb(OLD),
            'new', to_jsonb(NEW)
        );
    ELSIF TG_OP = 'DELETE' THEN
        operation := 'DELETE';
        change_data := to_jsonb(OLD);
    END IF;

    -- pg_notify ile message queue'ya gönder
    PERFORM pg_notify(
        'elasticsearch_changes',
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', operation,
            'data', change_data,
            'timestamp', now()
        )::text
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- LISTINGS TABLE TRIGGERS
-- ===========================

-- Listings tablosu için trigger oluştur
DROP TRIGGER IF EXISTS listings_elasticsearch_sync ON listings;

CREATE TRIGGER listings_elasticsearch_sync
    AFTER INSERT OR UPDATE OR DELETE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION log_elasticsearch_change();

-- ===========================
-- PROFILES TABLE TRIGGERS
-- ===========================

-- Profiles tablosu için trigger oluştur
DROP TRIGGER IF EXISTS profiles_elasticsearch_sync ON profiles;

CREATE TRIGGER profiles_elasticsearch_sync
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION log_elasticsearch_change();

-- ===========================
-- CATEGORIES TABLE TRIGGERS
-- ===========================

-- Categories tablosu için trigger oluştur
DROP TRIGGER IF EXISTS categories_elasticsearch_sync ON categories;

CREATE TRIGGER categories_elasticsearch_sync
    AFTER INSERT OR UPDATE OR DELETE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION log_elasticsearch_change();

-- ===========================
-- MESSAGE QUEUE TABLE
-- ===========================

-- Elasticsearch sync için message queue tablosu
CREATE TABLE IF NOT EXISTS elasticsearch_sync_queue (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    record_id UUID NOT NULL,
    change_data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE,
    INDEX idx_status_created (status, created_at),
    INDEX idx_table_record (table_name, record_id)
);

-- ===========================
-- QUEUE MANAGEMENT FUNCTIONS
-- ===========================

-- Queue'ya mesaj ekle
CREATE OR REPLACE FUNCTION add_to_sync_queue()
RETURNS TRIGGER AS $$
DECLARE
    record_id UUID;
    old_status TEXT;
    new_status TEXT;
BEGIN
    -- Record ID'yi belirle
    IF TG_OP = 'DELETE' THEN
        record_id := OLD.id;
    ELSE
        record_id := NEW.id;
    END IF;

    -- Status değişikliklerini kontrol et
    IF TG_OP = 'UPDATE' THEN
        old_status := OLD.status;
        new_status := NEW.status;
    ELSIF TG_OP = 'INSERT' THEN
        new_status := NEW.status;
        old_status := NULL;
    ELSE
        old_status := NULL;
        new_status := NULL;
    END IF;

    -- Job oluşturma koşulları:
    -- 1. INSERT: Sadece status = 'active' için
    -- 2. UPDATE: Sadece status değişimi olanlarda
    -- 3. DELETE: Her zaman
    IF (TG_OP = 'INSERT' AND new_status = 'active') OR
       (TG_OP = 'UPDATE' AND old_status IS DISTINCT FROM new_status) OR
       (TG_OP = 'DELETE') THEN
        
        -- Queue'ya ekle
        INSERT INTO elasticsearch_sync_queue (
            table_name,
            operation,
            record_id,
            change_data
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            record_id,
            CASE 
                WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
                WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
                WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
            END
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- QUEUE TRIGGERS
-- ===========================

-- Listings için queue trigger (sadece bu tablo Elasticsearch'e index ediliyor)
DROP TRIGGER IF EXISTS listings_queue_sync ON listings;

CREATE TRIGGER listings_queue_sync
    AFTER INSERT OR UPDATE OR DELETE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION add_to_sync_queue();

-- Profiles için queue trigger - KALDIRILDI (Elasticsearch'te index yok)
-- DROP TRIGGER IF EXISTS profiles_queue_sync ON profiles;
-- CREATE TRIGGER profiles_queue_sync
--     AFTER INSERT OR UPDATE OR DELETE ON profiles
--     FOR EACH ROW
--     EXECUTE FUNCTION add_to_sync_queue();

-- Categories için queue trigger - KALDIRILDI (Elasticsearch'te index yok)
-- DROP TRIGGER IF EXISTS categories_queue_sync ON categories;
-- CREATE TRIGGER categories_queue_sync
--     AFTER INSERT OR UPDATE OR DELETE ON categories
--     FOR EACH ROW
--     EXECUTE FUNCTION add_to_sync_queue();

-- ===========================
-- INVENTORY ITEMS TABLE TRIGGERS
-- ===========================

-- Inventory items için queue trigger - KALDIRILDI (Elasticsearch'te index yok)
-- DROP TRIGGER IF EXISTS inventory_items_queue_sync ON inventory_items;
-- CREATE TRIGGER inventory_items_queue_sync
--     AFTER INSERT OR UPDATE OR DELETE ON inventory_items
--     FOR EACH ROW
--     EXECUTE FUNCTION add_to_sync_queue();

-- ===========================
-- QUEUE MANAGEMENT FUNCTIONS
-- ===========================

-- Queue'dan mesaj al
CREATE OR REPLACE FUNCTION get_next_elasticsearch_job()
RETURNS TABLE (
    id INTEGER,
    table_name VARCHAR(100),
    operation VARCHAR(20),
    record_id UUID,
    change_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        eq.id,
        eq.table_name,
        eq.operation,
        eq.record_id,
        eq.change_data
    FROM elasticsearch_sync_queue eq
    WHERE eq.status = 'pending'
    ORDER BY eq.created_at ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Job status güncelle
CREATE OR REPLACE FUNCTION update_elasticsearch_job_status(
    job_id INTEGER,
    new_status VARCHAR(20),
    error_msg TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE elasticsearch_sync_queue
    SET 
        status = new_status,
        processed_at = CASE WHEN new_status IN ('completed', 'failed') THEN now() ELSE processed_at END,
        error_message = error_msg,
        retry_count = CASE WHEN new_status = 'failed' THEN retry_count + 1 ELSE retry_count END
    WHERE id = job_id;
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- CLEANUP FUNCTIONS
-- ===========================

-- Eski completed job'ları temizle (30 günden eski)
CREATE OR REPLACE FUNCTION cleanup_old_elasticsearch_jobs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM elasticsearch_sync_queue
    WHERE status = 'completed' 
    AND created_at < now() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- MONITORING FUNCTIONS
-- ===========================

-- Queue durumunu kontrol et
CREATE OR REPLACE FUNCTION get_elasticsearch_queue_stats()
RETURNS TABLE (
    total_jobs INTEGER,
    pending_jobs INTEGER,
    processing_jobs INTEGER,
    completed_jobs INTEGER,
    failed_jobs INTEGER,
    avg_processing_time INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_jobs,
        COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending_jobs,
        COUNT(*) FILTER (WHERE status = 'processing')::INTEGER as processing_jobs,
        COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed_jobs,
        COUNT(*) FILTER (WHERE status = 'failed')::INTEGER as failed_jobs,
        AVG(processed_at - created_at) FILTER (WHERE status = 'completed') as avg_processing_time
    FROM elasticsearch_sync_queue;
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- INDEXES
-- ===========================

-- Performance için index'ler
CREATE INDEX IF NOT EXISTS idx_elasticsearch_sync_queue_status_created 
ON elasticsearch_sync_queue(status, created_at);

CREATE INDEX IF NOT EXISTS idx_elasticsearch_sync_queue_table_record 
ON elasticsearch_sync_queue(table_name, record_id);

CREATE INDEX IF NOT EXISTS idx_elasticsearch_sync_queue_retry_count 
ON elasticsearch_sync_queue(retry_count) WHERE retry_count > 0;

-- ===========================
-- COMMENTS
-- ===========================

COMMENT ON TABLE elasticsearch_sync_queue IS 'Elasticsearch sync için message queue tablosu';
COMMENT ON FUNCTION log_elasticsearch_change() IS 'PostgreSQL notify ile real-time sync';
COMMENT ON FUNCTION add_to_sync_queue() IS 'Queue tablosuna mesaj ekle';
COMMENT ON FUNCTION get_next_elasticsearch_job() IS 'Queue''dan sıradaki job''ı al';
COMMENT ON FUNCTION update_elasticsearch_job_status() IS 'Job status güncelle';
COMMENT ON FUNCTION cleanup_old_elasticsearch_jobs() IS 'Eski job''ları temizle';
COMMENT ON FUNCTION get_elasticsearch_queue_stats() IS 'Queue istatistiklerini al'; 