-- ===========================
-- INVENTORY ITEMS QUEUE TRIGGERS
-- ===========================
-- Inventory items tablosu için queue trigger'ları ekle
-- Bu trigger'lar inventory değişikliklerini queue'ya ekler

-- Inventory items için queue trigger
DROP TRIGGER IF EXISTS inventory_items_queue_sync ON inventory_items;

CREATE TRIGGER inventory_items_queue_sync
    AFTER INSERT OR UPDATE OR DELETE ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION add_to_sync_queue();

-- ===========================
-- COMMENTS
-- ===========================

COMMENT ON TRIGGER inventory_items_queue_sync ON inventory_items IS 'Inventory items değişikliklerini queue''ya ekle';
