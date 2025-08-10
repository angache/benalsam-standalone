-- Temporarily disable reviewed_by foreign key constraint for admin moderation
-- This allows admin users from auth.users to be stored in reviewed_by field
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_reviewed_by_fkey; 