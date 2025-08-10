-- Add attributes column to listings table for category-specific attributes
ALTER TABLE listings ADD COLUMN attributes jsonb DEFAULT '{}'::jsonb;

-- Create GIN index for efficient JSONB queries and filtering
CREATE INDEX idx_listings_attributes ON listings USING GIN (attributes);

-- Create function to update FTS when attributes change
CREATE OR REPLACE FUNCTION update_listing_fts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update FTS vector to include attribute values
  NEW.fts = to_tsvector('turkish', 
    COALESCE(NEW.title, '') || ' ' || 
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '') || ' ' ||
    COALESCE(jsonb_path_query_array(NEW.attributes, 'strict $.*[*]')::text, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update FTS
CREATE TRIGGER trigger_update_listing_fts
  BEFORE INSERT OR UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_fts();

-- Add comment for documentation
COMMENT ON COLUMN listings.attributes IS 'Category-specific attributes stored as JSONB for filtering and search. Format: {"attribute_key": ["value1", "value2"]}'; 