-- Add missing columns to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES categories(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add missing columns to category_attributes table
ALTER TABLE category_attributes 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_path ON categories(path);
CREATE INDEX IF NOT EXISTS idx_categories_level ON categories(level);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_category_attributes_category_id ON category_attributes(category_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers if they don't exist
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_category_attributes_updated_at ON category_attributes;
CREATE TRIGGER update_category_attributes_updated_at 
    BEFORE UPDATE ON category_attributes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS if not already enabled
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_attributes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Categories are insertable by authenticated users" ON categories;
DROP POLICY IF EXISTS "Categories are updatable by authenticated users" ON categories;
DROP POLICY IF EXISTS "Categories are deletable by authenticated users" ON categories;

DROP POLICY IF EXISTS "Category attributes are viewable by everyone" ON category_attributes;
DROP POLICY IF EXISTS "Category attributes are insertable by authenticated users" ON category_attributes;
DROP POLICY IF EXISTS "Category attributes are updatable by authenticated users" ON category_attributes;
DROP POLICY IF EXISTS "Category attributes are deletable by authenticated users" ON category_attributes;

-- Create policies for categories
CREATE POLICY "Categories are viewable by everyone" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Categories are insertable by authenticated users" ON categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Categories are updatable by authenticated users" ON categories
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Categories are deletable by authenticated users" ON categories
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for category_attributes
CREATE POLICY "Category attributes are viewable by everyone" ON category_attributes
    FOR SELECT USING (true);

CREATE POLICY "Category attributes are insertable by authenticated users" ON category_attributes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Category attributes are updatable by authenticated users" ON category_attributes
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Category attributes are deletable by authenticated users" ON category_attributes
    FOR DELETE USING (auth.role() = 'authenticated'); 