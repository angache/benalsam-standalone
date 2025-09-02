-- ===========================
-- UPDATE ELASTICSEARCH SYNC TRIGGER
-- ===========================

-- Queue'ya mesaj ekle fonksiyonunu güncelle
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
        
        -- Queue'ya ekle (status = 'pending' olarak)
        INSERT INTO elasticsearch_sync_queue (
            table_name,
            operation,
            record_id,
            change_data,
            status  -- Yeni eklendi
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            record_id,
            CASE 
                WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
                WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
                WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
            END,
            'pending'  -- Yeni eklendi
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı yeniden oluştur
DROP TRIGGER IF EXISTS listings_queue_sync ON listings;

CREATE TRIGGER listings_queue_sync
    AFTER INSERT OR UPDATE OR DELETE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION add_to_sync_queue();
