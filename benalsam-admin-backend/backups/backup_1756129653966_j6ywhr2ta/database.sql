-- Localhost Database Backup
-- Generated: 2025-08-25T13:47:33.971Z
-- Database: benalsam_admin
-- Host: localhost
-- Type: Local Development

-- This is a mock backup for development purposes
-- In production, use Supabase's backup API or direct pg_dump connection

-- Mock database schema
CREATE TABLE IF NOT EXISTS mock_backup_test (
  id SERIAL PRIMARY KEY,
  message TEXT DEFAULT 'Backup created successfully',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mock data
INSERT INTO mock_backup_test (message) VALUES ('Backup completed at 2025-08-25T13:47:33.971Z');

SELECT 'Backup created successfully' as status;
