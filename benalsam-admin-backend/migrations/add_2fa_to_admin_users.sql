-- Add 2FA columns to admin_users table
-- Migration: add_2fa_to_admin_users.sql

-- Add 2FA related columns
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS is_2fa_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS totp_secret TEXT,
ADD COLUMN IF NOT EXISTS backup_codes TEXT[],
ADD COLUMN IF NOT EXISTS last_2fa_used TIMESTAMP;

-- Add index for 2FA enabled users
CREATE INDEX IF NOT EXISTS idx_admin_users_2fa_enabled ON admin_users(is_2fa_enabled);

-- Add comment
COMMENT ON COLUMN admin_users.is_2fa_enabled IS 'Whether 2FA is enabled for this admin user';
COMMENT ON COLUMN admin_users.totp_secret IS 'TOTP secret for 2FA authentication';
COMMENT ON COLUMN admin_users.backup_codes IS 'Backup codes for 2FA recovery';
COMMENT ON COLUMN admin_users.last_2fa_used IS 'Last time 2FA was used';
