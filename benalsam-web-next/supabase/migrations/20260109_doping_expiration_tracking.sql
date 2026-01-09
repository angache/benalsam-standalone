-- Migration: Doping Expiration Tracking System
-- Created: 2026-01-09
-- Description: Adds indexes and function for doping expiration tracking
-- Note: notifications table already exists with different schema (recipient_user_id, data jsonb, is_read)

-- Create indexes for better query performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_user_id ON notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Create index for doping expiration queries
CREATE INDEX IF NOT EXISTS idx_listings_showcase_expires_at ON listings(showcase_expires_at) WHERE is_showcase = true AND showcase_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_urgent_expires_at ON listings(urgent_expires_at) WHERE is_urgent_premium = true AND urgent_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_featured_expires_at ON listings(featured_expires_at) WHERE is_featured = true AND featured_expires_at IS NOT NULL;

-- Note: RLS policies and triggers should already exist on notifications table
-- If they don't exist, they will be created by the application

-- Function to check and expire dopings (can be called by cron job)
CREATE OR REPLACE FUNCTION check_doping_expiration()
RETURNS TABLE (
  expired_count INTEGER,
  notifications_sent INTEGER
) AS $$
DECLARE
  showcase_count INTEGER := 0;
  urgent_count INTEGER := 0;
  featured_count INTEGER := 0;
  total_notifications INTEGER := 0;
  expired_listing_id UUID;
  expired_listing_user_id UUID;
  expired_listing_title TEXT;
BEGIN
  -- Expire showcase dopings
  -- Loop through expired listings and process them one by one
  FOR expired_listing_id, expired_listing_user_id, expired_listing_title IN
    SELECT id, user_id, title
    FROM listings
    WHERE 
      is_showcase = true
      AND showcase_expires_at IS NOT NULL
      AND showcase_expires_at < NOW()
  LOOP
    -- Update the listing
    UPDATE listings
    SET 
      is_showcase = false,
      showcase_expires_at = NULL,
      updated_at = NOW()
    WHERE id = expired_listing_id;
    
    showcase_count := showcase_count + 1;
    
    -- Create notification (using existing schema: recipient_user_id, data jsonb, is_read)
    INSERT INTO notifications (recipient_user_id, type, data, is_read)
    VALUES (
      expired_listing_user_id,
      'doping_expired',
      jsonb_build_object(
        'title', 'Doping Süresi Doldu',
        'message', expired_listing_title || ' ilanınızın Kategori Vitrini doping süresi doldu.',
        'listingId', expired_listing_id,
        'dopingType', 'showcase'
      ),
      false
    );
  END LOOP;

  -- Expire urgent dopings
  FOR expired_listing_id, expired_listing_user_id, expired_listing_title IN
    SELECT id, user_id, title
    FROM listings
    WHERE 
      is_urgent_premium = true
      AND urgent_expires_at IS NOT NULL
      AND urgent_expires_at < NOW()
  LOOP
    -- Update the listing
    UPDATE listings
    SET 
      is_urgent_premium = false,
      urgent_expires_at = NULL,
      updated_at = NOW()
    WHERE id = expired_listing_id;
    
    urgent_count := urgent_count + 1;
    
    -- Create notification (using existing schema: recipient_user_id, data jsonb, is_read)
    INSERT INTO notifications (recipient_user_id, type, data, is_read)
    VALUES (
      expired_listing_user_id,
      'doping_expired',
      jsonb_build_object(
        'title', 'Doping Süresi Doldu',
        'message', expired_listing_title || ' ilanınızın Acil İlan doping süresi doldu.',
        'listingId', expired_listing_id,
        'dopingType', 'urgent'
      ),
      false
    );
  END LOOP;

  -- Expire featured dopings
  FOR expired_listing_id, expired_listing_user_id, expired_listing_title IN
    SELECT id, user_id, title
    FROM listings
    WHERE 
      is_featured = true
      AND featured_expires_at IS NOT NULL
      AND featured_expires_at < NOW()
  LOOP
    -- Update the listing
    UPDATE listings
    SET 
      is_featured = false,
      featured_expires_at = NULL,
      updated_at = NOW()
    WHERE id = expired_listing_id;
    
    featured_count := featured_count + 1;
    
    -- Create notification (using existing schema: recipient_user_id, data jsonb, is_read)
    INSERT INTO notifications (recipient_user_id, type, data, is_read)
    VALUES (
      expired_listing_user_id,
      'doping_expired',
      jsonb_build_object(
        'title', 'Doping Süresi Doldu',
        'message', expired_listing_title || ' ilanınızın Öne Çıkan İlan doping süresi doldu.',
        'listingId', expired_listing_id,
        'dopingType', 'featured'
      ),
      false
    );
  END LOOP;

  total_notifications := showcase_count + urgent_count + featured_count;

  RETURN QUERY SELECT 
    (showcase_count + urgent_count + featured_count)::INTEGER AS expired_count,
    total_notifications::INTEGER AS notifications_sent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (for API calls)
GRANT EXECUTE ON FUNCTION check_doping_expiration() TO authenticated;
GRANT EXECUTE ON FUNCTION check_doping_expiration() TO service_role;

-- Comment
COMMENT ON FUNCTION check_doping_expiration() IS 'Checks and expires doping features that have passed their expiration date. Returns count of expired dopings and notifications sent.';

