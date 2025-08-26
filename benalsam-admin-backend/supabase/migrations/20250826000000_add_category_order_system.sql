-- Category Order System Migration
-- 2025-08-26

-- 1. Add order management columns to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS display_priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS order_updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS order_updated_by UUID;

-- 2. Create index for efficient ordering
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order DESC, display_priority DESC, name ASC);
CREATE INDEX IF NOT EXISTS idx_categories_featured ON categories(is_featured DESC, sort_order DESC);

-- 3. Create order history table
CREATE TABLE IF NOT EXISTS category_order_history (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    old_sort_order INTEGER,
    new_sort_order INTEGER,
    old_display_priority INTEGER,
    new_display_priority INTEGER,
    old_is_featured BOOLEAN,
    new_is_featured BOOLEAN,
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    change_reason TEXT
);

-- 4. Create index for order history
CREATE INDEX IF NOT EXISTS idx_category_order_history_category_id ON category_order_history(category_id);
CREATE INDEX IF NOT EXISTS idx_category_order_history_changed_at ON category_order_history(changed_at DESC);

-- 5. Create function to log order changes
CREATE OR REPLACE FUNCTION log_category_order_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.sort_order IS DISTINCT FROM NEW.sort_order OR 
       OLD.display_priority IS DISTINCT FROM NEW.display_priority OR
       OLD.is_featured IS DISTINCT FROM NEW.is_featured THEN
        
        INSERT INTO category_order_history (
            category_id,
            old_sort_order,
            new_sort_order,
            old_display_priority,
            new_display_priority,
            old_is_featured,
            new_is_featured,
            changed_by,
            change_reason
        ) VALUES (
            NEW.id,
            OLD.sort_order,
            NEW.sort_order,
            OLD.display_priority,
            NEW.display_priority,
            OLD.is_featured,
            NEW.is_featured,
            NEW.order_updated_by,
            'Manual update via Admin UI'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for order change logging
DROP TRIGGER IF EXISTS trigger_log_category_order_change ON categories;
CREATE TRIGGER trigger_log_category_order_change
    AFTER UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION log_category_order_change();

-- 7. Initialize sort_order for ALL existing categories (not just main categories)
UPDATE categories 
SET sort_order = id * 10,
    display_priority = 0,
    is_featured = false;

-- 8. Grant permissions
GRANT SELECT, INSERT, UPDATE ON category_order_history TO authenticated;
GRANT SELECT, INSERT, UPDATE ON category_order_history TO service_role;
