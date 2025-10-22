-- Add username column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Update existing users with generated usernames (if any exist)
-- This will generate usernames like: user-123, user-456, etc.
UPDATE profiles 
SET username = 'user-' || EXTRACT(EPOCH FROM created_at)::INTEGER
WHERE username IS NULL;

-- Make username NOT NULL after setting default values
ALTER TABLE profiles ALTER COLUMN username SET NOT NULL;
