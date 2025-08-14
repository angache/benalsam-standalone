-- Database Schema Backup
-- Generated: 2025-08-14T19:57:14.826Z
-- Method: Prisma Schema Analysis
-- Database: Supabase PostgreSQL

-- This file contains the current database schema
-- Generated from Prisma schema file


-- AdminUser Table
CREATE TABLE IF NOT EXISTS _admin_user (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  isActive BOOLEAN NOT NULL,
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL
);


-- AdminActivityLog Table
CREATE TABLE IF NOT EXISTS _admin_activity_log (
  id TEXT PRIMARY KEY,
  createdAt TIMESTAMP NOT NULL,
  admin TEXT NOT NULL
);


-- ModerationDecision Table
CREATE TABLE IF NOT EXISTS _moderation_decision (
  id TEXT PRIMARY KEY,
  createdAt TIMESTAMP NOT NULL,
  admin TEXT NOT NULL
);


-- SystemSetting Table
CREATE TABLE IF NOT EXISTS _system_setting (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  updatedAt TIMESTAMP NOT NULL,
  admin TEXT NOT NULL
);


-- DailyStat Table
CREATE TABLE IF NOT EXISTS _daily_stat (
  id TEXT PRIMARY KEY,
  date TIMESTAMP UNIQUE NOT NULL,
  totalUsers INTEGER NOT NULL,
  newUsers INTEGER NOT NULL,
  activeUsers INTEGER NOT NULL,
  totalListings INTEGER NOT NULL,
  newListings INTEGER NOT NULL,
  activeListings INTEGER NOT NULL,
  totalRevenue DECIMAL(10,2) NOT NULL,
  premiumSubscriptions INTEGER NOT NULL,
  reportsCount INTEGER NOT NULL,
  resolvedReports INTEGER NOT NULL,
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL
);


-- UserActivity Table
CREATE TABLE IF NOT EXISTS _user_activity (
  id TEXT PRIMARY KEY,
  createdAt TIMESTAMP NOT NULL
);


-- Listing Table
CREATE TABLE IF NOT EXISTS _listing (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  views INTEGER NOT NULL,
  favorites INTEGER NOT NULL,
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL,
  user TEXT NOT NULL
);


-- ListingImage Table
CREATE TABLE IF NOT EXISTS _listing_image (
  id TEXT PRIMARY KEY,
  order INTEGER NOT NULL,
  createdAt TIMESTAMP NOT NULL,
  listing TEXT NOT NULL
);


-- ListingLocation Table
CREATE TABLE IF NOT EXISTS _listing_location (
  id TEXT PRIMARY KEY,
  listingId TEXT UNIQUE NOT NULL,
  createdAt TIMESTAMP NOT NULL,
  listing TEXT NOT NULL
);


-- User Table
CREATE TABLE IF NOT EXISTS _user (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,
  trustScore INTEGER NOT NULL,
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL,
  buyerConversations TEXT NOT NULL,
  sellerConversations TEXT NOT NULL
);


-- Report Table
CREATE TABLE IF NOT EXISTS _report (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  createdAt TIMESTAMP NOT NULL,
  listing TEXT NOT NULL,
  reporter TEXT NOT NULL
);


-- Offer Table
CREATE TABLE IF NOT EXISTS _offer (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL,
  listing TEXT NOT NULL,
  buyer TEXT NOT NULL
);


-- Conversation Table
CREATE TABLE IF NOT EXISTS _conversation (
  id TEXT PRIMARY KEY,
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL,
  listing TEXT NOT NULL,
  buyer TEXT NOT NULL,
  seller TEXT NOT NULL
);



-- Backup completion
SELECT 'Schema backup completed successfully' as status;
SELECT 'Generated from Prisma schema' as method;
SELECT '2025-08-14T19:57:14.826Z' as generated_at;
