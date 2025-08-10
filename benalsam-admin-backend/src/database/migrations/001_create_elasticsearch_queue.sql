-- ===========================
-- ELASTICSEARCH SYNC QUEUE TABLE
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
    processed_at TIMESTAMP WITH TIME ZONE
);

-- ===========================
-- INDEXES
-- ===========================

CREATE INDEX IF NOT EXISTS idx_elasticsearch_sync_queue_status_created 
ON elasticsearch_sync_queue(status, created_at);

CREATE INDEX IF NOT EXISTS idx_elasticsearch_sync_queue_table_record 
ON elasticsearch_sync_queue(table_name, record_id);

CREATE INDEX IF NOT EXISTS idx_elasticsearch_sync_queue_retry_count 
ON elasticsearch_sync_queue(retry_count) WHERE status = 'failed';

-- ===========================
-- QUEUE MANAGEMENT FUNCTIONS
-- ===========================

-- Queue'ya mesaj ekle
CREATE OR REPLACE FUNCTION add_to_elasticsearch_queue()
RETURNS TRIGGER AS $$
DECLARE
    record_id UUID;
BEGIN
    -- Record ID'yi belirle
    IF TG_OP = 'DELETE' THEN
        record_id := OLD.id;
    ELSE
        record_id := NEW.id;
    END IF;

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

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- QUEUE TRIGGERS
-- ===========================

-- Listings için queue trigger
DROP TRIGGER IF EXISTS listings_queue_sync ON listings;

CREATE TRIGGER listings_queue_sync
    AFTER INSERT OR UPDATE OR DELETE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION add_to_elasticsearch_queue();

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
        AVG(processed_at - created_at) FILTER (WHERE processed_at IS NOT NULL) as avg_processing_time
    FROM elasticsearch_sync_queue;
END;
$$ LANGUAGE plpgsql; 