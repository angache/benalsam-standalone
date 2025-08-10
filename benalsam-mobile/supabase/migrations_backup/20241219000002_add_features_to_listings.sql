-- Add features column to listings table
ALTER TABLE listings ADD COLUMN features text[] NULL DEFAULT ARRAY[]::text[];

-- Add comment for documentation
COMMENT ON COLUMN listings.features IS 'Array of feature IDs selected for this listing'; 