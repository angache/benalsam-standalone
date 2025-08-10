-- Create profiles for existing admin users
-- This ensures foreign key constraint works for admin moderation

-- Insert profiles for existing admin users
INSERT INTO profiles (id, email, name, avatar_url, is_admin)
SELECT 
    au.id,
    au.email,
    CONCAT(au.first_name, ' ', au.last_name) as name,
    NULL as avatar_url,
    true as is_admin
FROM admin_users au
WHERE NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = au.id
);

-- Add is_admin column to profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;
    END IF;
END $$; 