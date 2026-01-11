-- Fix handle_new_user trigger to handle errors gracefully
-- This migration updates the trigger function to catch and log errors
-- instead of failing the entire user creation

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Try to insert profile, but don't fail if it already exists
  INSERT INTO public.profiles (
    id, 
    name, 
    role, 
    status, 
    listings_count, 
    followers_count, 
    following_count, 
    followed_categories_count, 
    total_ratings, 
    rating_sum, 
    avatar_url, 
    updated_at, 
    created_at
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'Yeni Kullanıcı'),
    CASE
      WHEN new.email = 'superadmin@benalsam.com' THEN 'super_admin'
      ELSE COALESCE(new.raw_user_meta_data->>'role', 'user')
    END,
    'active',
    0,
    0,
    0,
    0,
    0,
    0,
    new.raw_user_meta_data->>'avatar_url',
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING; -- If profile already exists, do nothing
  
  return new;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail user creation
    -- This allows the API route to handle profile creation manually
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    return new; -- Still return new to allow user creation to succeed
END;
$$;

