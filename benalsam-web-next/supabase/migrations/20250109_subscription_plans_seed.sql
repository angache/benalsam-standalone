-- Seed data for subscription_plans table
-- This migration creates the basic, advanced, and corporate plans

-- First, ensure slug is unique (if not already)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscription_plans_slug_unique'
  ) THEN
    ALTER TABLE subscription_plans ADD CONSTRAINT subscription_plans_slug_unique UNIQUE (slug);
  END IF;
END $$;

-- Insert Basic Plan (Free) - only if it doesn't exist
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, features, limits, is_active)
SELECT 
  'Temel Plan',
  'basic',
  'Ücretsiz temel plan - sınırlı özellikler',
  0,
  0,
  '{
    "offers_per_month": true,
    "messages": true,
    "basic_support": true
  }'::jsonb,
  '{
    "offers_per_month": 10,
    "messages_per_month": 50,
    "images_per_offer": 1,
    "featured_offers_per_day": 0,
    "files_per_offer": 0,
    "listings_per_month": -1
  }'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_plans WHERE slug = 'basic'
);

-- Insert Advanced Plan - only if it doesn't exist
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, features, limits, is_active)
SELECT 
  'Gelişmiş Plan',
  'advanced',
  'Gelişmiş özellikler ve daha fazla limit',
  99,
  990,
  '{
    "offers_per_month": true,
    "messages": true,
    "featured_offers": true,
    "priority_access": true,
    "basic_analytics": true,
    "fast_support": true,
    "multiple_images": true
  }'::jsonb,
  '{
    "offers_per_month": 100,
    "messages_per_month": 200,
    "images_per_offer": 3,
    "featured_offers_per_day": 1,
    "files_per_offer": 0,
    "listings_per_month": -1
  }'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_plans WHERE slug = 'advanced'
);

-- Insert Corporate Plan - only if it doesn't exist
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, features, limits, is_active)
SELECT 
  'Kurumsal Plan',
  'corporate',
  'Tüm özellikler ve sınırsız limitler',
  249,
  2490,
  '{
    "unlimited_offers": true,
    "unlimited_messages": true,
    "featured_offers": true,
    "showcase_listings": true,
    "priority_access": true,
    "advanced_analytics": true,
    "ai_suggestions": true,
    "direct_contact": true,
    "corporate_badge": true,
    "premium_support": true,
    "file_attachments": true,
    "api_access": true
  }'::jsonb,
  '{
    "offers_per_month": -1,
    "messages_per_month": -1,
    "images_per_offer": 5,
    "featured_offers_per_day": 5,
    "files_per_offer": 3,
    "listings_per_month": -1
  }'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_plans WHERE slug = 'corporate'
);

