

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."auto_deactivate_accepted_listings"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE public.listings 
  SET 
    status = 'inactive',
    deactivation_reason = 'Alışveriş tamamlandı - Otomatik olarak yayından kaldırıldı',
    updated_at = NOW()
  WHERE 
    status = 'in_transaction' 
    AND offer_accepted_at IS NOT NULL 
    AND offer_accepted_at < NOW() - INTERVAL '1 day';
END;
$$;


ALTER FUNCTION "public"."auto_deactivate_accepted_listings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_and_increment_listing_count"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  user_record RECORD;
  current_month_start DATE;
BEGIN
  current_month_start := DATE_TRUNC('month', CURRENT_DATE);
  
  SELECT * INTO user_record 
  FROM profiles 
  WHERE id = user_id;
  
  IF user_record.last_reset_date < current_month_start THEN
    UPDATE profiles 
    SET 
      monthly_listings_count = 0,
      monthly_offers_count = 0,
      last_reset_date = CURRENT_DATE
    WHERE id = user_id;
    user_record.monthly_listings_count := 0;
  END IF;
  
  IF user_record.is_premium = TRUE AND user_record.premium_expires_at > NOW() THEN
    UPDATE profiles 
    SET monthly_listings_count = monthly_listings_count + 1
    WHERE id = user_id;
    RETURN TRUE;
  END IF;
  
  IF user_record.monthly_listings_count >= 3 THEN
    RETURN FALSE;
  END IF;
  
  UPDATE profiles 
  SET monthly_listings_count = monthly_listings_count + 1
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."check_and_increment_listing_count"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_and_increment_message_count"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT * INTO user_record 
  FROM profiles 
  WHERE id = user_id;
  
  IF user_record.last_reset_date < CURRENT_DATE THEN
    UPDATE profiles 
    SET 
      daily_messages_count = 0,
      last_reset_date = CURRENT_DATE
    WHERE id = user_id;
    user_record.daily_messages_count := 0;
  END IF;
  
  IF user_record.is_premium = TRUE AND user_record.premium_expires_at > NOW() THEN
    UPDATE profiles 
    SET daily_messages_count = daily_messages_count + 1
    WHERE id = user_id;
    RETURN TRUE;
  END IF;
  
  IF user_record.daily_messages_count >= 30 THEN
    RETURN FALSE;
  END IF;
  
  UPDATE profiles 
  SET daily_messages_count = daily_messages_count + 1
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."check_and_increment_message_count"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_and_increment_offer_count"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  user_record RECORD;
  current_month_start DATE;
BEGIN
  current_month_start := DATE_TRUNC('month', CURRENT_DATE);
  
  SELECT * INTO user_record 
  FROM profiles 
  WHERE id = user_id;
  
  IF user_record.last_reset_date < current_month_start THEN
    UPDATE profiles 
    SET 
      monthly_listings_count = 0,
      monthly_offers_count = 0,
      last_reset_date = CURRENT_DATE
    WHERE id = user_id;
    user_record.monthly_offers_count := 0;
  END IF;
  
  IF user_record.is_premium = TRUE AND user_record.premium_expires_at > NOW() THEN
    UPDATE profiles 
    SET monthly_offers_count = monthly_offers_count + 1
    WHERE id = user_id;
    RETURN TRUE;
  END IF;
  
  IF user_record.monthly_offers_count >= 5 THEN
    RETURN FALSE;
  END IF;
  
  UPDATE profiles 
  SET monthly_offers_count = monthly_offers_count + 1
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."check_and_increment_offer_count"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_image_limit"("p_user_id" "uuid", "p_image_count" integer) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  is_premium BOOLEAN;
BEGIN
  is_premium := check_user_premium_status(p_user_id);
  
  IF is_premium THEN
    RETURN p_image_count <= 5;
  ELSE
    RETURN p_image_count <= 2;
  END IF;
END;
$$;


ALTER FUNCTION "public"."check_image_limit"("p_user_id" "uuid", "p_image_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_listing_limit"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  user_stats RECORD;
  is_premium BOOLEAN;
BEGIN
  SELECT * INTO user_stats FROM get_user_monthly_stats(p_user_id);
  is_premium := user_stats.is_premium;
  
  IF is_premium THEN
    RETURN true;
  ELSE
    RETURN user_stats.listings_count < 3;
  END IF;
END;
$$;


ALTER FUNCTION "public"."check_listing_limit"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_message_limit"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  user_stats RECORD;
  is_premium BOOLEAN;
BEGIN
  SELECT * INTO user_stats FROM get_user_monthly_stats(p_user_id);
  is_premium := user_stats.is_premium;
  
  IF is_premium THEN
    RETURN true;
  ELSE
    RETURN user_stats.messages_count < 30;
  END IF;
END;
$$;


ALTER FUNCTION "public"."check_message_limit"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_offer_limit"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  user_stats RECORD;
  is_premium BOOLEAN;
BEGIN
  SELECT * INTO user_stats FROM get_user_monthly_stats(p_user_id);
  is_premium := user_stats.is_premium;
  
  IF is_premium THEN
    RETURN true;
  ELSE
    RETURN user_stats.offers_count < 5;
  END IF;
END;
$$;


ALTER FUNCTION "public"."check_offer_limit"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_offer_limit_new"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_plan RECORD;
    user_usage RECORD;
    offer_limit INTEGER;
    current_usage INTEGER;
BEGIN
    -- Kullanıcının planını al
    SELECT * INTO user_plan FROM get_user_active_plan(p_user_id) LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Kullanıcının kullanımını al
    SELECT * INTO user_usage FROM get_or_create_monthly_usage(p_user_id) LIMIT 1;
    
    -- Limit kontrolü
    offer_limit := (user_plan.limits->>'offers_per_month')::INTEGER;
    current_usage := COALESCE(user_usage.offers_count, 0);
    
    -- Sınırsız ise (-1) true döndür
    IF offer_limit = -1 THEN
        RETURN TRUE;
    END IF;
    
    -- Limit kontrolü
    RETURN current_usage < offer_limit;
END;
$$;


ALTER FUNCTION "public"."check_offer_limit_new"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_offer_timing_permission"("p_user_id" "uuid", "p_listing_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_listing_created_at TIMESTAMP WITH TIME ZONE;
  v_user_plan_slug TEXT;
  v_time_diff_minutes INTEGER;
BEGIN
  -- İlan oluşturulma zamanını al
  SELECT created_at INTO v_listing_created_at
  FROM listings
  WHERE id = p_listing_id AND status = 'active';
  
  IF v_listing_created_at IS NULL THEN
    RETURN FALSE; -- İlan bulunamadı veya aktif değil
  END IF;
  
  -- Kullanıcının plan bilgisini al
  SELECT COALESCE(sp.slug, 'basic') INTO v_user_plan_slug
  FROM profiles p
  LEFT JOIN premium_subscriptions ps ON p.id = ps.user_id 
    AND ps.status = 'active' 
    AND ps.expires_at > NOW()
  LEFT JOIN subscription_plans sp ON ps.plan_id = sp.id
  WHERE p.id = p_user_id;
  
  -- Şu anki zaman ile ilan oluşturulma zamanı arasındaki farkı dakika olarak hesapla
  v_time_diff_minutes := EXTRACT(EPOCH FROM (NOW() - v_listing_created_at)) / 60;
  
  -- Kurumsal kullanıcılar: İlk 30 dakika
  IF v_user_plan_slug = 'corporate' THEN
    RETURN TRUE; -- Kurumsal kullanıcılar her zaman teklif verebilir
  END IF;
  
  -- Gelişmiş plan kullanıcıları: 30 dakika sonra
  IF v_user_plan_slug = 'advanced' AND v_time_diff_minutes >= 30 THEN
    RETURN TRUE;
  END IF;
  
  -- Temel plan kullanıcıları: 60 dakika sonra
  IF v_user_plan_slug = 'basic' AND v_time_diff_minutes >= 60 THEN
    RETURN TRUE;
  END IF;
  
  -- Diğer durumlar için false
  RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."check_offer_timing_permission"("p_user_id" "uuid", "p_listing_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_user_ai_usage"("p_user_id" "uuid", "p_month_key" "text" DEFAULT "to_char"("now"(), 'YYYY-MM'::"text")) RETURNS TABLE("can_use" boolean, "attempts_left" integer, "total_attempts" integer, "monthly_limit" integer, "is_premium" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN u.is_premium THEN true
            ELSE u.attempts_used < u.monthly_limit
        END as can_use,
        CASE 
            WHEN u.is_premium THEN -1
            ELSE GREATEST(0, u.monthly_limit - u.attempts_used)
        END as attempts_left,
        u.attempts_used as total_attempts,
        u.monthly_limit,
        u.is_premium
    FROM user_ai_usage u
    WHERE u.user_id = p_user_id 
    AND u.month_key = p_month_key;
    
    -- Eğer kayıt yoksa, yeni kayıt oluştur
    IF NOT FOUND THEN
        INSERT INTO user_ai_usage (user_id, month_key, attempts_used, monthly_limit, is_premium)
        VALUES (p_user_id, p_month_key, 0, 30, false)
        ON CONFLICT (user_id, month_key) DO NOTHING;
        
        RETURN QUERY
        SELECT 
            true as can_use,
            30 as attempts_left,
            0 as total_attempts,
            30 as monthly_limit,
            false as is_premium;
    END IF;
END;
$$;


ALTER FUNCTION "public"."check_user_ai_usage"("p_user_id" "uuid", "p_month_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_user_premium_status"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM premium_subscriptions 
    WHERE user_id = p_user_id 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$;


ALTER FUNCTION "public"."check_user_premium_status"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification_for_listing_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  notification_type TEXT;
  notification_data JSONB;
BEGIN
  -- Check if the status column was actually updated
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Case 1: Listing is approved
    IF NEW.status = 'active' AND OLD.status = 'pending_approval' THEN
      notification_type := 'LISTING_APPROVED';
      notification_data := jsonb_build_object(
        'listingId', NEW.id,
        'listingTitle', NEW.title
      );
    -- Case 2: Listing is rejected
    ELSIF NEW.status = 'rejected' AND OLD.status = 'pending_approval' THEN
      notification_type := 'LISTING_REJECTED';
      notification_data := jsonb_build_object(
        'listingId', NEW.id,
        'listingTitle', NEW.title,
        'rejectionReason', NEW.rejection_reason
      );
    END IF;

    -- If a notification should be sent, insert it
    IF notification_type IS NOT NULL THEN
      INSERT INTO public.notifications (recipient_user_id, type, data, is_read)
      VALUES (
        NEW.user_id,
        notification_type,
        notification_data,
        false
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_notification_for_listing_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification_on_new_message"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  recipient_id UUID;
  sender_name TEXT;
  conversation_id_val UUID;
  message_snippet TEXT;
BEGIN
  SELECT user_id INTO recipient_id
  FROM public.conversation_participants
  WHERE conversation_id = NEW.conversation_id
  AND user_id != NEW.sender_id
  LIMIT 1;

  IF recipient_id IS NOT NULL THEN
    SELECT name INTO sender_name
    FROM public.profiles
    WHERE id = NEW.sender_id;

    conversation_id_val := NEW.conversation_id;
    message_snippet := left(NEW.content, 50);

    INSERT INTO public.notifications (recipient_user_id, type, data, is_read)
    VALUES (
      recipient_id,
      'NEW_MESSAGE',
      jsonb_build_object(
        'conversationId', conversation_id_val,
        'senderId', NEW.sender_id,
        'senderName', COALESCE(sender_name, 'Bir kullanıcı'),
        'messageSnippet', message_snippet,
        'messageId', NEW.id
      ),
      false
    );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_notification_on_new_message"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_follow_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.profiles
    SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0)
    WHERE id = OLD.follower_id;

    UPDATE public.profiles
    SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0)
    WHERE id = OLD.following_id;
    RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."decrement_follow_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_attribute_statistics"("p_category" "text" DEFAULT NULL::"text") RETURNS TABLE("attribute_key" "text", "attribute_values" "jsonb", "usage_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        attr_key,
        jsonb_agg(DISTINCT attr_val) as attribute_values,
        COUNT(*) as usage_count
    FROM (
        SELECT 
            key as attr_key,
            value as attr_val
        FROM listings l,
             jsonb_each_text(l.attributes) as attrs(key, value)
        WHERE l.status = 'active'
          AND l.attributes IS NOT NULL 
          AND l.attributes != 'null'::jsonb
          AND (p_category IS NULL OR l.category = p_category)
    ) attr_data
    GROUP BY attr_key
    ORDER BY usage_count DESC;
END;
$$;


ALTER FUNCTION "public"."get_attribute_statistics"("p_category" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_attribute_statistics"("p_category" "text") IS 'Kategori bazında attribute kullanım istatistiklerini döndürür (düzeltilmiş)';



CREATE OR REPLACE FUNCTION "public"."get_conversation_between_users"("user_id_1" "uuid", "user_id_2" "uuid", "p_offer_id" "uuid" DEFAULT NULL::"uuid", "p_listing_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("conversation_id" "uuid", "is_linked_to_offer" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        (c.offer_id IS NOT NULL AND c.offer_id = p_offer_id) AS is_linked_to_offer
    FROM
        conversations c
    JOIN
        conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = user_id_1
    JOIN
        conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = user_id_2
    WHERE 
      (p_offer_id IS NULL OR c.offer_id = p_offer_id OR c.offer_id IS NULL) AND
      (p_listing_id IS NULL OR c.listing_id = p_listing_id OR c.listing_id IS NULL)
    LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_conversation_between_users"("user_id_1" "uuid", "user_id_2" "uuid", "p_offer_id" "uuid", "p_listing_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_user_role"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
    RETURN user_role;
END;
$$;


ALTER FUNCTION "public"."get_current_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_offer_timing_info"("p_user_id" "uuid", "p_listing_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_listing_created_at TIMESTAMP WITH TIME ZONE;
  v_user_plan_slug TEXT;
  v_time_diff_minutes INTEGER;
  v_can_offer BOOLEAN;
  v_wait_minutes INTEGER;
  v_result JSON;
BEGIN
  -- İlan oluşturulma zamanını al
  SELECT created_at INTO v_listing_created_at
  FROM listings
  WHERE id = p_listing_id AND status = 'active';
  
  IF v_listing_created_at IS NULL THEN
    RETURN json_build_object(
      'can_offer', false,
      'reason', 'listing_not_found',
      'message', 'İlan bulunamadı veya aktif değil'
    );
  END IF;
  
  -- Kullanıcının plan bilgisini al
  SELECT COALESCE(sp.slug, 'basic') INTO v_user_plan_slug
  FROM profiles p
  LEFT JOIN premium_subscriptions ps ON p.id = ps.user_id 
    AND ps.status = 'active' 
    AND ps.expires_at > NOW()
  LEFT JOIN subscription_plans sp ON ps.plan_id = sp.id
  WHERE p.id = p_user_id;
  
  -- Şu anki zaman ile ilan oluşturulma zamanı arasındaki farkı dakika olarak hesapla
  v_time_diff_minutes := EXTRACT(EPOCH FROM (NOW() - v_listing_created_at)) / 60;
  
  -- Kurumsal kullanıcılar: Her zaman teklif verebilir
  IF v_user_plan_slug = 'corporate' THEN
    v_can_offer := TRUE;
    v_wait_minutes := 0;
  -- Gelişmiş plan kullanıcıları: 30 dakika sonra
  ELSIF v_user_plan_slug = 'advanced' THEN
    IF v_time_diff_minutes >= 30 THEN
      v_can_offer := TRUE;
      v_wait_minutes := 0;
    ELSE
      v_can_offer := FALSE;
      v_wait_minutes := 30 - v_time_diff_minutes;
    END IF;
  -- Temel plan kullanıcıları: 60 dakika sonra
  ELSE
    IF v_time_diff_minutes >= 60 THEN
      v_can_offer := TRUE;
      v_wait_minutes := 0;
    ELSE
      v_can_offer := FALSE;
      v_wait_minutes := 60 - v_time_diff_minutes;
    END IF;
  END IF;
  
  RETURN json_build_object(
    'can_offer', v_can_offer,
    'user_plan', v_user_plan_slug,
    'time_passed_minutes', v_time_diff_minutes,
    'wait_minutes', v_wait_minutes,
    'listing_created_at', v_listing_created_at,
    'message', CASE 
      WHEN v_can_offer THEN 'Teklif verebilirsiniz'
      WHEN v_user_plan_slug = 'corporate' THEN 'Kurumsal üyeler hemen teklif verebilir'
      WHEN v_user_plan_slug = 'advanced' THEN 'Gelişmiş plan üyeleri 30 dakika sonra teklif verebilir'
      ELSE 'Temel plan üyeleri 60 dakika sonra teklif verebilir'
    END
  );
END;
$$;


ALTER FUNCTION "public"."get_offer_timing_info"("p_user_id" "uuid", "p_listing_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_offers_with_priority"("p_listing_id" "uuid") RETURNS TABLE("id" "uuid", "listing_id" "uuid", "offering_user_id" "uuid", "offered_item_id" "uuid", "offered_price" numeric, "message" "text", "status" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "conversation_id" "uuid", "user_plan_slug" "text", "user_name" "text", "user_avatar_url" "text", "offered_item_name" "text", "offered_item_image_url" "text", "priority_score" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.listing_id,
    o.offering_user_id,
    o.offered_item_id,
    o.offered_price,
    o.message,
    o.status,
    o.created_at,
    o.updated_at,
    o.conversation_id,
    COALESCE(sp.slug, 'basic') as user_plan_slug,
    p.name as user_name,
    p.avatar_url as user_avatar_url,
    ii.name as offered_item_name,
    COALESCE(ii.main_image_url, ii.image_url) as offered_item_image_url,
    CASE 
      WHEN COALESCE(sp.slug, 'basic') = 'corporate' THEN 3
      WHEN COALESCE(sp.slug, 'basic') = 'advanced' THEN 2
      ELSE 1
    END as priority_score
  FROM offers o
  LEFT JOIN profiles p ON o.offering_user_id = p.id
  LEFT JOIN premium_subscriptions ps ON p.id = ps.user_id 
    AND ps.status = 'active' 
    AND ps.expires_at > NOW()
  LEFT JOIN subscription_plans sp ON ps.plan_id = sp.id
  LEFT JOIN inventory_items ii ON o.offered_item_id = ii.id
  WHERE o.listing_id = p_listing_id
  ORDER BY 
    priority_score DESC,  -- Önce plan önceliği
    o.created_at ASC;     -- Sonra zaman sırası
END;
$$;


ALTER FUNCTION "public"."get_offers_with_priority"("p_listing_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_monthly_usage"("p_user_id" "uuid") RETURNS TABLE("offers_count" integer, "messages_count" integer, "listings_count" integer, "featured_offers_count" integer, "month_year" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_current_month_year TEXT;
    usage_record RECORD;
BEGIN
    v_current_month_year := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Mevcut ay için kullanım kaydını bul
    SELECT * INTO usage_record
    FROM monthly_usage_stats mus
    WHERE mus.user_id = p_user_id 
        AND mus.month_year = v_current_month_year;
    
    -- Eğer kayıt yoksa oluştur
    IF NOT FOUND THEN
        INSERT INTO monthly_usage_stats (
            user_id, 
            month_year, 
            offers_count, 
            messages_count, 
            listings_count, 
            featured_offers_count
        ) VALUES (
            p_user_id, 
            v_current_month_year, 
            0, 
            0, 
            0, 
            0
        );
        
        -- Yeni oluşturulan kaydı al
        SELECT * INTO usage_record
        FROM monthly_usage_stats mus
        WHERE mus.user_id = p_user_id 
            AND mus.month_year = v_current_month_year;
    END IF;
    
    -- Sonucu döndür
    RETURN QUERY
    SELECT 
        usage_record.offers_count,
        usage_record.messages_count,
        usage_record.listings_count,
        usage_record.featured_offers_count,
        usage_record.month_year;
END;
$$;


ALTER FUNCTION "public"."get_or_create_monthly_usage"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_active_plan"("p_user_id" "uuid") RETURNS TABLE("plan_id" "uuid", "plan_name" "text", "plan_slug" "text", "features" "jsonb", "limits" "jsonb", "expires_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id as plan_id,
        sp.name as plan_name,
        sp.slug as plan_slug,
        sp.features,
        sp.limits,
        ps.expires_at
    FROM premium_subscriptions ps
    JOIN subscription_plans sp ON ps.plan_id = sp.id
    WHERE ps.user_id = p_user_id 
        AND ps.status = 'active' 
        AND ps.expires_at > NOW()
    ORDER BY ps.created_at DESC
    LIMIT 1;
    
    -- Eğer aktif abonelik yoksa, temel plan döndür
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            sp.id as plan_id,
            sp.name as plan_name,
            sp.slug as plan_slug,
            sp.features,
            sp.limits,
            NULL::TIMESTAMP WITH TIME ZONE as expires_at
        FROM subscription_plans sp
        WHERE sp.slug = 'basic'
        LIMIT 1;
    END IF;
END;
$$;


ALTER FUNCTION "public"."get_user_active_plan"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_category_stats"("p_user_id" "uuid") RETURNS TABLE("category" "text", "offer_count" integer, "success_count" integer, "success_percentage" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
    offers_column_name TEXT;
BEGIN
    -- Offers tablosunda hangi kolon kullanılıyor kontrol et
    SELECT CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'offers' AND column_name = 'buyer_id'
        ) THEN 'buyer_id'
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'offers' AND column_name = 'user_id'
        ) THEN 'user_id'
        ELSE NULL
    END INTO offers_column_name;
    
    -- Önce user_category_stats tablosundan kontrol et
    IF EXISTS (SELECT 1 FROM user_category_stats WHERE user_id = p_user_id LIMIT 1) THEN
        RETURN QUERY
        SELECT 
            ucs.category,
            ucs.offer_count,
            ucs.success_count,
            CASE 
                WHEN ucs.offer_count > 0 THEN 
                    ROUND((ucs.success_count::DECIMAL / ucs.offer_count::DECIMAL) * 100, 1)
                ELSE 0
            END as success_percentage
        FROM user_category_stats ucs
        WHERE ucs.user_id = p_user_id
        ORDER BY ucs.offer_count DESC;
    ELSE
        -- Gerçek verilerden kategori istatistikleri oluştur
        IF offers_column_name IS NOT NULL THEN
            RETURN QUERY
            EXECUTE format('
                SELECT 
                    l.category,
                    COUNT(o.id)::INTEGER as offer_count,
                    COUNT(CASE WHEN o.status = ''accepted'' THEN 1 END)::INTEGER as success_count,
                    CASE 
                        WHEN COUNT(o.id) > 0 THEN 
                            ROUND((COUNT(CASE WHEN o.status = ''accepted'' THEN 1 END)::DECIMAL / COUNT(o.id)::DECIMAL) * 100, 1)
                        ELSE 0
                    END as success_percentage
                FROM offers o
                JOIN listings l ON o.listing_id = l.id
                WHERE o.%I = $1
                GROUP BY l.category
                HAVING COUNT(o.id) > 0
                ORDER BY COUNT(o.id) DESC', offers_column_name)
            USING p_user_id;
        END IF;
    END IF;
END;
$_$;


ALTER FUNCTION "public"."get_user_category_stats"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_dashboard_stats"("p_user_id" "uuid") RETURNS TABLE("total_offers" integer, "accepted_offers" integer, "rejected_offers" integer, "pending_offers" integer, "total_views" integer, "total_messages_sent" integer, "total_messages_received" integer, "avg_response_time_hours" numeric, "success_rate" numeric, "response_rate" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$DECLARE
    real_offers INTEGER := 1;
    real_accepted INTEGER := 0;
    real_rejected INTEGER := 0;
    real_pending INTEGER := 0;
    real_views INTEGER := 0;
    real_messages_sent INTEGER := 0;
    real_messages_received INTEGER := 0;
BEGIN
    SELECT COUNT(*) INTO real_offers
    FROM offers
    WHERE offering_user_id = p_user_id::uuid;

    SELECT COUNT(*) INTO real_accepted
    FROM offers
    WHERE offering_user_id = p_user_id AND status = 'accepted';

    SELECT COUNT(*) INTO real_rejected
    FROM offers
    WHERE offering_user_id = p_user_id AND status = 'rejected';

    SELECT COUNT(*) INTO real_pending
    FROM offers
    WHERE offering_user_id = p_user_id AND status = 'pending';

    SELECT COALESCE(SUM(views_count), 0) INTO real_views
    FROM listings 
    WHERE user_id = p_user_id;

    SELECT COUNT(*) INTO real_messages_sent
    FROM messages 
    WHERE sender_id = p_user_id;

    SELECT COUNT(*) INTO real_messages_received
    FROM messages
    JOIN conversations ON messages.conversation_id = conversations.id
    JOIN conversation_participants cp ON cp.conversation_id = conversations.id
    WHERE cp.user_id = p_user_id AND messages.sender_id != p_user_id;

    RETURN QUERY
    SELECT 
        real_offers,
        real_accepted,
        real_rejected,
        real_pending,
        real_views,
        real_messages_sent,
        real_messages_received,
        CASE 
            WHEN real_messages_received > 0 THEN 
                ROUND(EXTRACT(EPOCH FROM (NOW() - (
                    SELECT MIN(created_at) FROM messages WHERE sender_id != p_user_id AND conversation_id IN (
                        SELECT conversation_id FROM conversation_participants WHERE user_id = p_user_id
                    )
                ))) / 3600 / real_messages_received, 1)
            ELSE 0
        END::DECIMAL,
        CASE 
            WHEN real_offers > 0 THEN 
                ROUND((real_accepted::DECIMAL / real_offers::DECIMAL) * 100, 1)
            ELSE 0
        END,
        CASE 
            WHEN real_offers > 0 THEN 
                ROUND(((real_accepted + real_rejected)::DECIMAL / real_offers::DECIMAL) * 100, 1)
            ELSE 0
        END;
END;$$;


ALTER FUNCTION "public"."get_user_dashboard_stats"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_monthly_stats"("p_user_id" "uuid") RETURNS TABLE("listings_count" integer, "offers_count" integer, "messages_count" integer, "is_premium" boolean)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  current_stats RECORD;
BEGIN
  SELECT * INTO current_stats 
  FROM user_usage_stats 
  WHERE user_id = p_user_id;
  
  IF current_stats IS NULL THEN
    INSERT INTO user_usage_stats (user_id) VALUES (p_user_id);
    current_stats.monthly_listings_count := 0;
    current_stats.monthly_offers_count := 0;
    current_stats.monthly_messages_count := 0;
  END IF;
  
  IF current_stats.last_reset_date < DATE_TRUNC('month', CURRENT_DATE) THEN
    UPDATE user_usage_stats 
    SET 
      monthly_listings_count = 0,
      monthly_offers_count = 0,
      monthly_messages_count = 0,
      last_reset_date = CURRENT_DATE
    WHERE user_id = p_user_id;
    
    current_stats.monthly_listings_count := 0;
    current_stats.monthly_offers_count := 0;
    current_stats.monthly_messages_count := 0;
  END IF;
  
  RETURN QUERY SELECT 
    current_stats.monthly_listings_count,
    current_stats.monthly_offers_count,
    current_stats.monthly_messages_count,
    check_user_premium_status(p_user_id);
END;
$$;


ALTER FUNCTION "public"."get_user_monthly_stats"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_recent_activities"("p_user_id" "uuid", "p_limit" integer DEFAULT 10) RETURNS TABLE("activity_type" "text", "activity_title" "text", "activity_description" "text", "created_at" timestamp with time zone, "time_ago" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
    offers_column_name TEXT;
BEGIN
    -- Offers tablosunda hangi kolon kullanılıyor kontrol et
    SELECT CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'offers' AND column_name = 'buyer_id'
        ) THEN 'buyer_id'
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'offers' AND column_name = 'user_id'
        ) THEN 'user_id'
        ELSE NULL
    END INTO offers_column_name;
    
    -- Önce user_activities tablosundan kontrol et
    IF EXISTS (SELECT 1 FROM user_activities WHERE user_id = p_user_id LIMIT 1) THEN
        RETURN QUERY
        SELECT 
            ua.activity_type,
            ua.activity_title,
            ua.activity_description,
            ua.created_at,
            CASE 
                WHEN ua.created_at > NOW() - INTERVAL '1 hour' THEN 
                    EXTRACT(EPOCH FROM (NOW() - ua.created_at))::INTEGER / 60 || ' dakika önce'
                WHEN ua.created_at > NOW() - INTERVAL '1 day' THEN 
                    EXTRACT(EPOCH FROM (NOW() - ua.created_at))::INTEGER / 3600 || ' saat önce'
                WHEN ua.created_at > NOW() - INTERVAL '7 days' THEN 
                    EXTRACT(EPOCH FROM (NOW() - ua.created_at))::INTEGER / 86400 || ' gün önce'
                ELSE 
                    TO_CHAR(ua.created_at, 'DD.MM.YYYY')
            END as time_ago
        FROM user_activities ua
        WHERE ua.user_id = p_user_id
        ORDER BY ua.created_at DESC
        LIMIT p_limit;
    ELSE
        -- Gerçek verilerden aktivite oluştur
        IF offers_column_name IS NOT NULL THEN
            RETURN QUERY
            EXECUTE format('
                WITH real_activities AS (
                    -- Son teklifler
                    SELECT 
                        ''offer_sent'' as activity_type,
                        ''Teklif gönderildi: '' || COALESCE(l.title, ''Ürün'') as activity_title,
                        ''Yeni teklif gönderildi'' as activity_description,
                        o.created_at
                    FROM offers o
                    LEFT JOIN listings l ON o.listing_id = l.id
                    WHERE o.%I = $1
                    
                    UNION ALL
                    
                    -- Son ilanlar
                    SELECT 
                        ''listing_created'' as activity_type,
                        ''Yeni ilan oluşturuldu: '' || l.title as activity_title,
                        ''İlan başarıyla yayınlandı'' as activity_description,
                        l.created_at
                    FROM listings l
                    WHERE l.user_id = $1
                    
                    UNION ALL
                    
                    -- Son mesajlar
                    SELECT 
                        ''message_sent'' as activity_type,
                        ''Mesaj gönderildi'' as activity_title,
                        ''Yeni mesaj gönderildi'' as activity_description,
                        m.created_at
                    FROM messages m
                    WHERE m.sender_id = $1
                )
                SELECT 
                    ra.activity_type,
                    ra.activity_title,
                    ra.activity_description,
                    ra.created_at,
                    CASE 
                        WHEN ra.created_at > NOW() - INTERVAL ''1 hour'' THEN 
                            EXTRACT(EPOCH FROM (NOW() - ra.created_at))::INTEGER / 60 || '' dakika önce''
                        WHEN ra.created_at > NOW() - INTERVAL ''1 day'' THEN 
                            EXTRACT(EPOCH FROM (NOW() - ra.created_at))::INTEGER / 3600 || '' saat önce''
                        WHEN ra.created_at > NOW() - INTERVAL ''7 days'' THEN 
                            EXTRACT(EPOCH FROM (NOW() - ra.created_at))::INTEGER / 86400 || '' gün önce''
                        ELSE 
                            TO_CHAR(ra.created_at, ''DD.MM.YYYY'')
                    END as time_ago
                FROM real_activities ra
                ORDER BY ra.created_at DESC
                LIMIT $2', offers_column_name)
            USING p_user_id, p_limit;
        ELSE
            -- Offers tablosu yoksa sadece ilanlar ve mesajlar
            RETURN QUERY
            WITH real_activities AS (
                -- Son ilanlar
                SELECT 
                    'listing_created' as activity_type,
                    'Yeni ilan oluşturuldu: ' || l.title as activity_title,
                    'İlan başarıyla yayınlandı' as activity_description,
                    l.created_at
                FROM listings l
                WHERE l.user_id = p_user_id
                
                UNION ALL
                
                -- Son mesajlar
                SELECT 
                    'message_sent' as activity_type,
                    'Mesaj gönderildi' as activity_title,
                    'Yeni mesaj gönderildi' as activity_description,
                    m.created_at
                FROM messages m
                WHERE m.sender_id = p_user_id
            )
            SELECT 
                ra.activity_type,
                ra.activity_title,
                ra.activity_description,
                ra.created_at,
                CASE 
                    WHEN ra.created_at > NOW() - INTERVAL '1 hour' THEN 
                        EXTRACT(EPOCH FROM (NOW() - ra.created_at))::INTEGER / 60 || ' dakika önce'
                    WHEN ra.created_at > NOW() - INTERVAL '1 day' THEN 
                        EXTRACT(EPOCH FROM (NOW() - ra.created_at))::INTEGER / 3600 || ' saat önce'
                    WHEN ra.created_at > NOW() - INTERVAL '7 days' THEN 
                        EXTRACT(EPOCH FROM (NOW() - ra.created_at))::INTEGER / 86400 || ' gün önce'
                    ELSE 
                        TO_CHAR(ra.created_at, 'DD.MM.YYYY')
                END as time_ago
            FROM real_activities ra
            ORDER BY ra.created_at DESC
            LIMIT p_limit;
        END IF;
    END IF;
END;
$_$;


ALTER FUNCTION "public"."get_user_recent_activities"("p_user_id" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_stats_test"("p_user_id" "uuid") RETURNS TABLE("total_offers" integer, "accepted_offers" integer, "rejected_offers" integer, "pending_offers" integer, "total_views" integer, "total_messages_sent" integer, "total_messages_received" integer, "avg_response_time_hours" numeric, "success_rate" numeric, "response_rate" numeric)
    LANGUAGE "plpgsql"
    AS $$DECLARE
    real_offers INTEGER := 1;
    real_accepted INTEGER := 0;
    real_rejected INTEGER := 0;
    real_pending INTEGER := 0;
    real_views INTEGER := 0;
    real_messages_sent INTEGER := 0;
    real_messages_received INTEGER := 0;
BEGIN
    SELECT COUNT(*) INTO real_offers
    FROM offers
    WHERE offering_user_id = p_user_id::uuid;

    SELECT COUNT(*) INTO real_accepted
    FROM offers
    WHERE offering_user_id = p_user_id AND status = 'accepted';

    SELECT COUNT(*) INTO real_rejected
    FROM offers
    WHERE offering_user_id = p_user_id AND status = 'rejected';

    SELECT COUNT(*) INTO real_pending
    FROM offers
    WHERE offering_user_id = p_user_id AND status = 'pending';

    SELECT COALESCE(SUM(views_count), 0) INTO real_views
    FROM listings 
    WHERE user_id = p_user_id;

    SELECT COUNT(*) INTO real_messages_sent
    FROM messages 
    WHERE sender_id = p_user_id;

    SELECT COUNT(*) INTO real_messages_received
    FROM messages
    JOIN conversations ON messages.conversation_id = conversations.id
    JOIN conversation_participants cp ON cp.conversation_id = conversations.id
    WHERE cp.user_id = p_user_id AND messages.sender_id != p_user_id;

    RETURN QUERY
    SELECT 
        real_offers,
        real_accepted,
        real_rejected,
        real_pending,
        real_views,
        real_messages_sent,
        real_messages_received,
        CASE 
            WHEN real_messages_received > 0 THEN 
                ROUND(EXTRACT(EPOCH FROM (NOW() - (
                    SELECT MIN(created_at) FROM messages WHERE sender_id != p_user_id AND conversation_id IN (
                        SELECT conversation_id FROM conversation_participants WHERE user_id = p_user_id
                    )
                ))) / 3600 / real_messages_received, 1)
            ELSE 0
        END::DECIMAL,
        CASE 
            WHEN real_offers > 0 THEN 
                ROUND((real_accepted::DECIMAL / real_offers::DECIMAL) * 100, 1)
            ELSE 0
        END,
        CASE 
            WHEN real_offers > 0 THEN 
                ROUND(((real_accepted + real_rejected)::DECIMAL / real_offers::DECIMAL) * 100, 1)
            ELSE 0
        END;
END;$$;


ALTER FUNCTION "public"."get_user_stats_test"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, status, listings_count, followers_count, following_count, followed_categories_count, total_ratings, rating_sum, avatar_url, updated_at, created_at)
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
  );
  return new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."immutable_unaccent"("text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE STRICT PARALLEL SAFE
    AS $_$
SELECT public.unaccent($1);
$_$;


ALTER FUNCTION "public"."immutable_unaccent"("text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_follow_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.profiles
    SET following_count = COALESCE(following_count, 0) + 1
    WHERE id = NEW.follower_id;

    UPDATE public.profiles
    SET followers_count = COALESCE(followers_count, 0) + 1
    WHERE id = NEW.following_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."increment_follow_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_offer_count"("row_id" "uuid") RETURNS "void"
    LANGUAGE "sql"
    AS $$
  UPDATE public.listings
  SET offers_count = COALESCE(offers_count, 0) + 1
  WHERE id = row_id;
$$;


ALTER FUNCTION "public"."increment_offer_count"("row_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_profile_view"("user_id_to_increment" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE profiles
  SET profile_views = COALESCE(profile_views, 0) + 1
  WHERE id = user_id_to_increment;
END;
$$;


ALTER FUNCTION "public"."increment_profile_view"("user_id_to_increment" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_profile_view_count"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE profiles
  SET profile_views = COALESCE(profile_views, 0) + 1
  WHERE id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."increment_profile_view_count"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_usage"("p_user_id" "uuid", "p_type" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
    v_current_month_year TEXT;
    v_column_name TEXT;
BEGIN
    v_current_month_year := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Tip'e göre kolon adını belirle
    CASE p_type
        WHEN 'offer' THEN v_column_name := 'offers_count';
        WHEN 'message' THEN v_column_name := 'messages_count';
        WHEN 'listing' THEN v_column_name := 'listings_count';
        WHEN 'featured_offer' THEN v_column_name := 'featured_offers_count';
        ELSE RETURN FALSE;
    END CASE;
    
    -- Önce kayıt var mı kontrol et, yoksa oluştur
    INSERT INTO monthly_usage_stats (user_id, month_year, offers_count, messages_count, listings_count, featured_offers_count)
    VALUES (p_user_id, v_current_month_year, 0, 0, 0, 0)
    ON CONFLICT (user_id, month_year) DO NOTHING;
    
    -- Kullanımı artır
    EXECUTE format('UPDATE monthly_usage_stats SET %I = %I + 1 WHERE user_id = $1 AND month_year = $2', v_column_name, v_column_name)
    USING p_user_id, v_current_month_year;
    
    RETURN TRUE;
END;
$_$;


ALTER FUNCTION "public"."increment_usage"("p_user_id" "uuid", "p_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_user_usage"("p_user_id" "uuid", "p_type" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO user_usage_stats (user_id) 
  VALUES (p_user_id) 
  ON CONFLICT (user_id) DO NOTHING;
  
  IF DATE_TRUNC('month', CURRENT_DATE) > (
    SELECT last_reset_date FROM user_usage_stats WHERE user_id = p_user_id
  ) THEN
    UPDATE user_usage_stats 
    SET 
      monthly_listings_count = 0,
      monthly_offers_count = 0,
      monthly_messages_count = 0,
      last_reset_date = CURRENT_DATE
    WHERE user_id = p_user_id;
  END IF;
  
  CASE p_type
    WHEN 'listing' THEN
      UPDATE user_usage_stats 
      SET monthly_listings_count = monthly_listings_count + 1
      WHERE user_id = p_user_id;
    WHEN 'offer' THEN
      UPDATE user_usage_stats 
      SET monthly_offers_count = monthly_offers_count + 1
      WHERE user_id = p_user_id;
    WHEN 'message' THEN
      UPDATE user_usage_stats 
      SET monthly_messages_count = monthly_messages_count + 1
      WHERE user_id = p_user_id;
  END CASE;
  
  RETURN true;
END;
$$;


ALTER FUNCTION "public"."increment_user_usage"("p_user_id" "uuid", "p_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_view_count"("row_id" "uuid") RETURNS "void"
    LANGUAGE "sql"
    AS $$
  UPDATE public.listings
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = row_id;
$$;


ALTER FUNCTION "public"."increment_view_count"("row_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_messages_as_read"("p_conversation_id" "uuid", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  current_timestamp TIMESTAMP WITH TIME ZONE := now();
BEGIN
    -- Update the messages status to 'read'
    UPDATE public.messages
    SET 
        status = 'read',
        read_at = current_timestamp
    WHERE conversation_id = p_conversation_id
      AND sender_id != p_user_id
      AND status != 'read';

    -- Update the participant's last_read_at timestamp
    UPDATE public.conversation_participants
    SET last_read_at = current_timestamp
    WHERE conversation_id = p_conversation_id
      AND user_id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."mark_messages_as_read"("p_conversation_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_ai_usage"("p_user_id" "uuid", "p_month_key" "text" DEFAULT "to_char"("now"(), 'YYYY-MM'::"text")) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO user_ai_usage (user_id, month_key, attempts_used, monthly_limit, is_premium)
    VALUES (p_user_id, p_month_key, 1, 30, false)
    ON CONFLICT (user_id, month_key) 
    DO UPDATE SET 
        attempts_used = user_ai_usage.attempts_used + 1,
        last_used_at = now(),
        updated_at = now();
END;
$$;


ALTER FUNCTION "public"."record_ai_usage"("p_user_id" "uuid", "p_month_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reset_daily_counters"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE profiles 
  SET daily_messages_count = 0
  WHERE last_reset_date < CURRENT_DATE;
  
  UPDATE profiles 
  SET last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$$;


ALTER FUNCTION "public"."reset_daily_counters"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reset_monthly_counters"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE profiles 
  SET 
    monthly_listings_count = 0,
    monthly_offers_count = 0
  WHERE last_reset_date < DATE_TRUNC('month', CURRENT_DATE);
  
  UPDATE profiles 
  SET last_reset_date = CURRENT_DATE
  WHERE last_reset_date < DATE_TRUNC('month', CURRENT_DATE);
END;
$$;


ALTER FUNCTION "public"."reset_monthly_counters"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_by_attribute_values"("attribute_key" "text", "attribute_values" "text"[]) RETURNS TABLE("id" "uuid", "title" "text", "category" "text", "attributes" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.title,
        l.category,
        l.attributes
    FROM listings l
    WHERE l.status = 'active'
      AND (l.expires_at IS NULL OR l.expires_at > NOW())
      AND l.attributes IS NOT NULL 
      AND l.attributes != 'null'::jsonb
      AND l.attributes ? attribute_key
      AND EXISTS (
          SELECT 1 
          FROM jsonb_array_elements_text(l.attributes->attribute_key) AS attr_val
          WHERE attr_val = ANY(attribute_values)
      );
END;
$$;


ALTER FUNCTION "public"."search_by_attribute_values"("attribute_key" "text", "attribute_values" "text"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."search_by_attribute_values"("attribute_key" "text", "attribute_values" "text"[]) IS 'Belirli attribute değerlerine göre arama yapar (düzeltilmiş)';



CREATE OR REPLACE FUNCTION "public"."search_listings"("search_query" "text", "p_categories" "text"[], "p_location" "text", "p_urgency" "text", "min_price" real, "max_price" real, "p_page" integer, "p_page_size" integer) RETURNS TABLE("id" "uuid", "created_at" timestamp with time zone, "user_id" "uuid", "title" "text", "description" "text", "category" "text", "budget" numeric, "location" "text", "urgency" "text", "main_image_url" "text", "image_url" "text", "additional_image_urls" "text"[], "status" "text", "views_count" integer, "offers_count" integer, "favorites_count" integer, "expires_at" timestamp with time zone, "auto_republish" boolean, "contact_preference" "text", "is_featured" boolean, "is_urgent_premium" boolean, "is_showcase" boolean, "popularity_score" integer, "upped_at" timestamp with time zone, "geolocation" "public"."geometry", "rejection_reason" "text", "has_bold_border" boolean)
    LANGUAGE "plpgsql"
    AS $$DECLARE
  fts_query_str TEXT;
BEGIN
  -- Full-text search query oluştur
  IF search_query IS NOT NULL AND trim(search_query) <> '' THEN
    fts_query_str := array_to_string(
      array(
        SELECT part || ':*'
        FROM unnest(string_to_array(trim(search_query), E'\\s+')) AS part
      ),
      ' & '
    );
  ELSE
    fts_query_str := NULL;
  END IF;

  -- p_urgency normalize edilsin
  p_urgency := LOWER(TRIM(p_urgency));

  RETURN QUERY
  SELECT 
    l.id,
    l.created_at,
    l.user_id,
    l.title,
    l.description,
    l.category,
    l.budget,
    l.location,
    l.urgency,
    l.main_image_url,
    l.image_url,
    l.additional_image_urls,
    l.status,
    l.views_count,
    l.offers_count,
    l.favorites_count,
    l.expires_at,
    l.auto_republish,
    l.contact_preference,
    l.is_featured,
    l.is_urgent_premium,
    l.is_showcase,
    l.popularity_score,
    l.upped_at,
    l.geolocation,
    l.rejection_reason,
    l.has_bold_border
  FROM public.listings AS l
  WHERE 
    l.status = 'active'
    AND (l.expires_at IS NULL OR l.expires_at > now())
    AND (fts_query_str IS NULL OR l.fts @@ to_tsquery('public.turkish_unaccent', fts_query_str))
    AND (p_categories IS NULL OR l.category LIKE ANY(p_categories))
    AND (p_location IS NULL OR p_location = '' OR l.location ILIKE ('%' || p_location || '%'))
    AND (
      p_urgency IS NULL OR p_urgency = 'tümü' OR
      (p_urgency = 'normal' AND (LOWER(TRIM(l.urgency)) = 'normal' OR l.urgency IS NULL)) OR
      (p_urgency NOT IN ('tümü', 'normal') AND LOWER(TRIM(l.urgency)) = p_urgency)
    )
    AND (min_price IS NULL OR l.budget >= min_price)
    AND (max_price IS NULL OR l.budget <= max_price)
  ORDER BY
    l.is_urgent_premium DESC NULLS LAST,
    l.is_featured DESC NULLS LAST,
    l.is_showcase DESC NULLS LAST,
    l.upped_at DESC NULLS LAST,
    l.created_at DESC
  LIMIT p_page_size
  OFFSET (p_page - 1) * p_page_size;
END;$$;


ALTER FUNCTION "public"."search_listings"("search_query" "text", "p_categories" "text"[], "p_location" "text", "p_urgency" "text", "min_price" real, "max_price" real, "p_page" integer, "p_page_size" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_listings_with_attributes"("search_query" "text" DEFAULT NULL::"text", "p_categories" "text"[] DEFAULT NULL::"text"[], "p_location" "text" DEFAULT NULL::"text", "p_urgency" "text" DEFAULT 'Tümü'::"text", "min_price" numeric DEFAULT NULL::numeric, "max_price" numeric DEFAULT NULL::numeric, "p_attributes" "jsonb" DEFAULT NULL::"jsonb", "p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20, "sort_key" "text" DEFAULT 'created_at'::"text", "sort_direction" "text" DEFAULT 'desc'::"text") RETURNS TABLE("id" "uuid", "user_id" "uuid", "title" "text", "description" "text", "category" "text", "location" "text", "budget" numeric, "status" "text", "urgency" "text", "tags" "text"[], "main_image_url" "text", "additional_image_urls" "text"[], "views_count" integer, "offers_count" integer, "favorites_count" integer, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "expires_at" timestamp with time zone, "last_bumped_at" timestamp with time zone, "deactivation_reason" "text", "rejection_reason" "text", "fts" "tsvector", "popularity_score" integer, "is_urgent_premium" boolean, "is_featured" boolean, "is_showcase" boolean, "has_bold_border" boolean, "attributes" "jsonb", "total_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    query_sql TEXT;
    count_sql TEXT;
    total_records BIGINT;
    sort_expression TEXT;
    sanitized_sort_key TEXT;
    sanitized_sort_direction TEXT;
    select_columns TEXT;
    ts_query_txt TEXT;
    attribute_conditions TEXT := '';
    attr_key TEXT;
    attr_value TEXT;
BEGIN
    -- Explicitly list columns including attributes
    select_columns := '
        id, user_id, title, description, category, location, budget, status, urgency, tags,
        main_image_url, additional_image_urls, views_count, offers_count, favorites_count,
        created_at, updated_at, expires_at, last_bumped_at, deactivation_reason,
        rejection_reason, fts, popularity_score, is_urgent_premium, is_featured,
        is_showcase, has_bold_border, attributes
    ';

    -- Sanitize sort_key to prevent SQL injection
    sanitized_sort_key := (
        SELECT key FROM (VALUES
            ('created_at'),
            ('budget'),
            ('views_count'),
            ('popularity_score')
        ) AS valid_keys(key) WHERE key = sort_key
    );
    IF sanitized_sort_key IS NULL THEN
        sanitized_sort_key := 'created_at';
    END IF;

    -- Sanitize sort_direction
    IF lower(sort_direction) = 'asc' THEN
        sanitized_sort_direction := 'ASC';
    ELSE
        sanitized_sort_direction := 'DESC';
    END IF;

    -- Handle NULLS for certain columns to ensure consistent sorting
    IF sanitized_sort_key IN ('budget', 'popularity_score') THEN
        sort_expression := format('%I %s NULLS LAST', sanitized_sort_key, sanitized_sort_direction);
    ELSE
        sort_expression := format('%I %s', sanitized_sort_key, sanitized_sort_direction);
    END IF;

    -- Build the base query
    query_sql := '
        FROM listings
        WHERE status = ''active''
          AND (expires_at IS NULL OR expires_at > NOW())';

    -- Add filters based on parameters
    IF search_query IS NOT NULL AND search_query != '' THEN
        -- Sanitize user input and build a tsquery that performs a prefix search on each word.
        ts_query_txt := regexp_replace(search_query, E'[&|!<>():*]+', '', 'g');
        ts_query_txt := trim(ts_query_txt);
        
        IF ts_query_txt != '' THEN
            ts_query_txt := regexp_replace(ts_query_txt, E'\\s+', ':* & ', 'g') || ':*';
            query_sql := query_sql || format(' AND fts @@ to_tsquery(''turkish'', %L)', ts_query_txt);
        END IF;
    END IF;

    -- FIXED: Kategori araması için tam eşleşme kullan
    IF p_categories IS NOT NULL AND array_length(p_categories, 1) > 0 THEN
        query_sql := query_sql || ' AND (';
        FOR i IN 1..array_length(p_categories, 1) LOOP
            -- Kategori tam eşleşme veya alt kategori kontrolü
            query_sql := query_sql || format('(category = %L OR category LIKE %L)', 
                p_categories[i], 
                p_categories[i] || ' > %'
            );
            IF i < array_length(p_categories, 1) THEN
                query_sql := query_sql || ' OR ';
            END IF;
        END LOOP;
        query_sql := query_sql || ')';
    END IF;

    IF p_location IS NOT NULL AND p_location != '' THEN
        query_sql := query_sql || format(' AND location ILIKE %L', '%' || p_location || '%');
    END IF;

    IF p_urgency IS NOT NULL AND p_urgency != 'Tümü' THEN
        query_sql := query_sql || format(' AND urgency = %L', p_urgency);
    END IF;

    IF min_price IS NOT NULL THEN
        query_sql := query_sql || format(' AND budget >= %s', min_price);
    END IF;

    IF max_price IS NOT NULL THEN
        query_sql := query_sql || format(' AND budget <= %s', max_price);
    END IF;

    -- FIXED: Attribute filtering with null checks
    IF p_attributes IS NOT NULL AND p_attributes != '{}'::jsonb AND p_attributes != 'null'::jsonb THEN
        attribute_conditions := ' AND (';
        FOR attr_key, attr_value IN SELECT * FROM jsonb_each_text(p_attributes) LOOP
            IF attribute_conditions != ' AND (' THEN
                attribute_conditions := attribute_conditions || ' AND ';
            END IF;
            -- Check if the attribute key exists and contains the specified value
            -- Add null checks for attributes column
            attribute_conditions := attribute_conditions || format(
                'attributes IS NOT NULL AND attributes != ''null''::jsonb AND attributes ? %L AND attributes->%L ? %L',
                attr_key, attr_key, attr_value
            );
        END LOOP;
        attribute_conditions := attribute_conditions || ')';
        query_sql := query_sql || attribute_conditions;
    END IF;

    -- Calculate total count of matching records
    count_sql := 'SELECT COUNT(*) ' || query_sql;
    EXECUTE count_sql INTO total_records;

    -- Return the paginated and sorted results with the total count
    RETURN QUERY EXECUTE '
        SELECT ' || select_columns || ', ' || COALESCE(total_records, 0) || '::BIGINT as total_count
        ' || query_sql || '
        ORDER BY
            is_urgent_premium DESC,
            is_featured DESC,
            is_showcase DESC,
            last_bumped_at DESC NULLS LAST,
            ' || sort_expression || '
        LIMIT ' || p_page_size || '
        OFFSET ' || (p_page - 1) * p_page_size;

END;
$$;


ALTER FUNCTION "public"."search_listings_with_attributes"("search_query" "text", "p_categories" "text"[], "p_location" "text", "p_urgency" "text", "min_price" numeric, "max_price" numeric, "p_attributes" "jsonb", "p_page" integer, "p_page_size" integer, "sort_key" "text", "sort_direction" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."search_listings_with_attributes"("search_query" "text", "p_categories" "text"[], "p_location" "text", "p_urgency" "text", "min_price" numeric, "max_price" numeric, "p_attributes" "jsonb", "p_page" integer, "p_page_size" integer, "sort_key" "text", "sort_direction" "text") IS 'Gelişmiş arama fonksiyonu - attribute filtreleme ile birlikte (düzeltilmiş)';



CREATE OR REPLACE FUNCTION "public"."search_listings_with_count"("search_query" "text", "p_categories" "text"[] DEFAULT NULL::"text"[], "p_location" "text" DEFAULT NULL::"text", "p_urgency" "text" DEFAULT 'Tümü'::"text", "min_price" numeric DEFAULT NULL::numeric, "max_price" numeric DEFAULT NULL::numeric, "p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20, "sort_key" "text" DEFAULT 'created_at'::"text", "sort_direction" "text" DEFAULT 'desc'::"text") RETURNS TABLE("id" "uuid", "user_id" "uuid", "title" "text", "description" "text", "category" "text", "location" "text", "budget" numeric, "status" "text", "urgency" "text", "tags" "text"[], "main_image_url" "text", "additional_image_urls" "text"[], "views_count" integer, "offers_count" integer, "favorites_count" integer, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "expires_at" timestamp with time zone, "last_bumped_at" timestamp with time zone, "deactivation_reason" "text", "rejection_reason" "text", "fts" "tsvector", "popularity_score" integer, "is_urgent_premium" boolean, "is_featured" boolean, "is_showcase" boolean, "has_bold_border" boolean, "total_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    query_sql TEXT;
    count_sql TEXT;
    total_records BIGINT;
    sort_expression TEXT;
    sanitized_sort_key TEXT;
    sanitized_sort_direction TEXT;
    select_columns TEXT;
    ts_query_txt TEXT;
BEGIN
    -- Explicitly list columns in the correct order to prevent mismatch errors.
    select_columns := '
        id, user_id, title, description, category, location, budget, status, urgency, tags,
        main_image_url, additional_image_urls, views_count, offers_count, favorites_count,
        created_at, updated_at, expires_at, last_bumped_at, deactivation_reason,
        rejection_reason, fts, popularity_score, is_urgent_premium, is_featured,
        is_showcase, has_bold_border
    ';

    -- Sanitize sort_key to prevent SQL injection
    sanitized_sort_key := (
        SELECT key FROM (VALUES
            ('created_at'),
            ('budget'),
            ('views_count'),
            ('popularity_score')
        ) AS valid_keys(key) WHERE key = sort_key
    );
    IF sanitized_sort_key IS NULL THEN
        sanitized_sort_key := 'created_at';
    END IF;

    -- Sanitize sort_direction
    IF lower(sort_direction) = 'asc' THEN
        sanitized_sort_direction := 'ASC';
    ELSE
        sanitized_sort_direction := 'DESC';
    END IF;

    -- Handle NULLS for certain columns to ensure consistent sorting
    IF sanitized_sort_key IN ('budget', 'popularity_score') THEN
        sort_expression := format('%I %s NULLS LAST', sanitized_sort_key, sanitized_sort_direction);
    ELSE
        sort_expression := format('%I %s', sanitized_sort_key, sanitized_sort_direction);
    END IF;

    -- Build the base query
    query_sql := '
        FROM listings
        WHERE status = ''active''
          AND (expires_at IS NULL OR expires_at > NOW())';

    -- Add filters based on parameters
    IF search_query IS NOT NULL AND search_query != '' THEN
        -- Sanitize user input and build a tsquery that performs a prefix search on each word.
        ts_query_txt := regexp_replace(search_query, E'[&|!<>():*]+', '', 'g');
        ts_query_txt := trim(ts_query_txt);
        
        IF ts_query_txt != '' THEN
            ts_query_txt := regexp_replace(ts_query_txt, E'\\s+', ':* & ', 'g') || ':*';
            query_sql := query_sql || format(' AND fts @@ to_tsquery(''turkish'', %L)', ts_query_txt);
        END IF;
    END IF;

    IF p_categories IS NOT NULL AND array_length(p_categories, 1) > 0 THEN
        query_sql := query_sql || ' AND (';
        FOR i IN 1..array_length(p_categories, 1) LOOP
            query_sql := query_sql || format('category LIKE %L', p_categories[i]);
            IF i < array_length(p_categories, 1) THEN
                query_sql := query_sql || ' OR ';
            END IF;
        END LOOP;
        query_sql := query_sql || ')';
    END IF;

    IF p_location IS NOT NULL AND p_location != '' THEN
        query_sql := query_sql || format(' AND location ILIKE %L', '%' || p_location || '%');
    END IF;

    IF p_urgency IS NOT NULL AND p_urgency != 'Tümü' THEN
        query_sql := query_sql || format(' AND urgency = %L', p_urgency);
    END IF;

    IF min_price IS NOT NULL THEN
        query_sql := query_sql || format(' AND budget >= %s', min_price);
    END IF;

    IF max_price IS NOT NULL THEN
        query_sql := query_sql || format(' AND budget <= %s', max_price);
    END IF;

    -- Calculate total count of matching records
    count_sql := 'SELECT COUNT(*) ' || query_sql;
    EXECUTE count_sql INTO total_records;

    -- Return the paginated and sorted results with the total count
    RETURN QUERY EXECUTE '
        SELECT ' || select_columns || ', ' || COALESCE(total_records, 0) || '::BIGINT as total_count
        ' || query_sql || '
        ORDER BY
            is_urgent_premium DESC,
            is_featured DESC,
            is_showcase DESC,
            last_bumped_at DESC NULLS LAST,
            ' || sort_expression || '
        LIMIT ' || p_page_size || '
        OFFSET ' || (p_page - 1) * p_page_size;

END;
$$;


ALTER FUNCTION "public"."search_listings_with_count"("search_query" "text", "p_categories" "text"[], "p_location" "text", "p_urgency" "text", "min_price" numeric, "max_price" numeric, "p_page" integer, "p_page_size" integer, "sort_key" "text", "sort_direction" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_update_trust_score"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
    user_id_to_update UUID;
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        IF TG_TABLE_NAME = 'profiles' THEN
            user_id_to_update := NEW.id;
        ELSIF TG_TABLE_NAME = 'offers' THEN
            user_id_to_update := NEW.offering_user_id;
        ELSIF TG_TABLE_NAME = 'user_reviews' THEN
            user_id_to_update := NEW.reviewee_id;
        END IF;
    END IF;


    RETURN NEW;
END;$$;


ALTER FUNCTION "public"."trigger_update_trust_score"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_conversation_last_message_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at,
      updated_at = NEW.created_at 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_conversation_last_message_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_listing_favorites_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.listings
        SET favorites_count = COALESCE(favorites_count, 0) + 1
        WHERE id = NEW.listing_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.listings
        SET favorites_count = GREATEST(COALESCE(favorites_count, 0) - 1, 0)
        WHERE id = OLD.listing_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_listing_favorites_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_listing_fts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
  -- Update FTS vector to include attribute values
  NEW.fts = to_tsvector('turkish', 
    COALESCE(NEW.title, '') || ' ' || 
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '') || ' ' ||
    COALESCE(jsonb_path_query_array(NEW.attributes, 'strict $.*[*]')::text, '')
  );
  RETURN NEW;
END;
$_$;


ALTER FUNCTION "public"."update_listing_fts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_listing_offers_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.listings
        SET offers_count = listings.offers_count + 1
        WHERE id = NEW.listing_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.listings
        SET offers_count = GREATEST(listings.offers_count - 1, 0)
        WHERE id = OLD.listing_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_listing_offers_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_popularity_scores"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  seven_days_ago timestamptz;
  top_listing RECORD;
  score INT;
BEGIN
  seven_days_ago := now() - interval '7 days';

  UPDATE public.listings SET popularity_score = 0 WHERE popularity_score > 0;

  score := 10;
  FOR top_listing IN
    SELECT
      lv.listing_id
    FROM
      public.listing_views lv
    WHERE
      lv.created_at >= seven_days_ago
    GROUP BY
      lv.listing_id
    ORDER BY
      count(lv.id) DESC
    LIMIT 10
  LOOP
    UPDATE public.listings
    SET popularity_score = score
    WHERE id = top_listing.listing_id;
    
    score := score - 1;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."update_popularity_scores"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_profile_followed_categories_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.profiles
        SET followed_categories_count = COALESCE(followed_categories_count, 0) + 1
        WHERE id = NEW.user_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.profiles
        SET followed_categories_count = GREATEST(COALESCE(followed_categories_count, 0) - 1, 0)
        WHERE id = OLD.user_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_profile_followed_categories_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_profile_listings_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.profiles
        SET listings_count = listings_count + 1
        WHERE id = NEW.user_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.profiles
        SET listings_count = GREATEST(listings_count - 1, 0)
        WHERE id = OLD.user_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_profile_listings_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_profile_rating_on_review"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.profiles
    SET 
      rating_sum = COALESCE(rating_sum, 0) + NEW.rating,
      total_ratings = COALESCE(total_ratings, 0) + 1,
      rating = (COALESCE(rating_sum, 0) + NEW.rating)::NUMERIC / (COALESCE(total_ratings, 0) + 1)
    WHERE id = NEW.reviewee_id;
  ELSIF (TG_OP = 'UPDATE') THEN
     IF OLD.reviewee_id = NEW.reviewee_id THEN
        UPDATE public.profiles
        SET 
           rating_sum = COALESCE(rating_sum, 0) - OLD.rating + NEW.rating,
           rating = (COALESCE(rating_sum, 0) - OLD.rating + NEW.rating)::NUMERIC / total_ratings 
        WHERE id = NEW.reviewee_id;
     ELSE
        UPDATE public.profiles
        SET 
            rating_sum = COALESCE(rating_sum, 0) - OLD.rating,
            total_ratings = GREATEST(COALESCE(total_ratings, 0) - 1, 0),
            rating = CASE WHEN (COALESCE(total_ratings, 0) - 1) > 0 THEN (COALESCE(rating_sum, 0) - OLD.rating)::NUMERIC / (COALESCE(total_ratings, 0) - 1) ELSE NULL END
        WHERE id = OLD.reviewee_id;
        UPDATE public.profiles
        SET 
            rating_sum = COALESCE(rating_sum, 0) + NEW.rating,
            total_ratings = COALESCE(total_ratings, 0) + 1,
            rating = (COALESCE(rating_sum, 0) + NEW.rating)::NUMERIC / (COALESCE(total_ratings, 0) + 1)
        WHERE id = NEW.reviewee_id;
     END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.profiles
    SET 
      rating_sum = COALESCE(rating_sum, 0) - OLD.rating,
      total_ratings = GREATEST(COALESCE(total_ratings, 0) - 1, 0),
      rating = CASE WHEN (COALESCE(total_ratings, 0) - 1) > 0 THEN (COALESCE(rating_sum, 0) - OLD.rating)::NUMERIC / (COALESCE(total_ratings, 0) - 1) ELSE NULL END
    WHERE id = OLD.reviewee_id;
  END IF;
  RETURN NULL; 
END;
$$;


ALTER FUNCTION "public"."update_profile_rating_on_review"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_premium_status"("p_user_id" "uuid", "p_is_premium" boolean, "p_monthly_limit" integer DEFAULT 30) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE user_ai_usage 
    SET 
        is_premium = p_is_premium,
        monthly_limit = CASE WHEN p_is_premium THEN -1 ELSE p_monthly_limit END,
        updated_at = now()
    WHERE user_id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."update_user_premium_status"("p_user_id" "uuid", "p_is_premium" boolean, "p_monthly_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_profile_on_auth_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$BEGIN
  UPDATE public.profiles
  SET
    name = COALESCE(new.raw_user_meta_data->>'name', old.raw_user_meta_data->>'name', (SELECT name FROM public.profiles WHERE id = new.id)),
    updated_at = timezone('utc'::text, now())
  WHERE id = new.id;
  return new;
END;$$;


ALTER FUNCTION "public"."update_user_profile_on_auth_change"() OWNER TO "postgres";


CREATE TEXT SEARCH CONFIGURATION "public"."turkish_unaccent" (
    PARSER = "pg_catalog"."default" );

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "asciiword" WITH "turkish_stem";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "word" WITH "public"."unaccent", "turkish_stem";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "numword" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "email" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "url" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "host" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "sfloat" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "version" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "hword_numpart" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "hword_part" WITH "public"."unaccent", "turkish_stem";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "hword_asciipart" WITH "turkish_stem";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "numhword" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "asciihword" WITH "turkish_stem";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "hword" WITH "public"."unaccent", "turkish_stem";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "url_path" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "file" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "float" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "int" WITH "simple";

ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent"
    ADD MAPPING FOR "uint" WITH "simple";


ALTER TEXT SEARCH CONFIGURATION "public"."turkish_unaccent" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_activity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid",
    "action" character varying(100) NOT NULL,
    "resource" character varying(100) NOT NULL,
    "resource_id" "uuid",
    "details" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "admin_profile_id" "uuid",
    "performance_score" integer,
    "time_spent_seconds" integer
);


ALTER TABLE "public"."admin_activity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_departments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "permissions" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_departments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_performance_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_profile_id" "uuid",
    "metric_type" "text" NOT NULL,
    "metric_value" numeric,
    "period_start" "date",
    "period_end" "date",
    "target_value" numeric,
    "achieved_percentage" numeric,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_performance_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid" NOT NULL,
    "display_name" "text",
    "avatar_url" "text",
    "bio" "text",
    "department" "text",
    "position" "text",
    "permissions" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "last_activity" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "password" character varying(255) NOT NULL,
    "first_name" character varying(100) NOT NULL,
    "last_name" character varying(100) NOT NULL,
    "role" character varying(20) DEFAULT 'ADMIN'::character varying NOT NULL,
    "permissions" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "last_login" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "admin_users_role_check" CHECK ((("role")::"text" = ANY ((ARRAY['SUPER_ADMIN'::character varying, 'ADMIN'::character varying, 'MODERATOR'::character varying, 'SUPPORT'::character varying])::"text"[])))
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_workflow_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_profile_id" "uuid",
    "workflow_type" "text" NOT NULL,
    "resource_id" "uuid",
    "resource_type" "text",
    "priority" integer DEFAULT 1,
    "status" "text" DEFAULT 'assigned'::"text",
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "notes" "text",
    "performance_rating" integer
);


ALTER TABLE "public"."admin_workflow_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."advertisements" (
    "id" integer NOT NULL,
    "title" "text" NOT NULL,
    "image_url" "text" NOT NULL,
    "link_url" "text" NOT NULL,
    "placement" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "clicks" integer DEFAULT 0,
    "views" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."advertisements" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."advertisements_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."advertisements_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."advertisements_id_seq" OWNED BY "public"."advertisements"."id";



CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "listings_count" integer DEFAULT 0,
    "color" "text",
    "icon" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


ALTER TABLE "public"."categories" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."categories_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."conversation_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_read_at" timestamp with time zone
);


ALTER TABLE "public"."conversation_participants" OWNER TO "postgres";


COMMENT ON TABLE "public"."conversation_participants" IS 'Tracks which users are part of which conversation.';



COMMENT ON COLUMN "public"."conversation_participants"."conversation_id" IS 'The conversation this participant belongs to.';



COMMENT ON COLUMN "public"."conversation_participants"."user_id" IS 'The user who is a participant.';



CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid",
    "offer_id" "uuid",
    "last_message_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user1_id" "uuid",
    "user2_id" "uuid"
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


COMMENT ON TABLE "public"."conversations" IS 'Stores conversation threads between users, potentially related to a listing or an offer.';



COMMENT ON COLUMN "public"."conversations"."listing_id" IS 'Optional link to a specific listing.';



COMMENT ON COLUMN "public"."conversations"."offer_id" IS 'Optional link to a specific offer that initiated the conversation.';



COMMENT ON COLUMN "public"."conversations"."last_message_at" IS 'Timestamp of the last message in this conversation, for sorting.';



CREATE TABLE IF NOT EXISTS "public"."fcm_tokens" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "token" "text" NOT NULL,
    "platform" "text",
    "device_id" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_used" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "fcm_tokens_platform_check" CHECK (("platform" = ANY (ARRAY['ios'::"text", 'android'::"text", 'web'::"text"])))
);


ALTER TABLE "public"."fcm_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text",
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "additional_image_urls" "text"[],
    "main_image_url" "text"
);


ALTER TABLE "public"."inventory_items" OWNER TO "postgres";


COMMENT ON COLUMN "public"."inventory_items"."main_image_url" IS 'vitrin görseli';



CREATE TABLE IF NOT EXISTS "public"."listing_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reporter_id" "uuid" NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "reason" "text" NOT NULL,
    "details" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "listing_reports_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'resolved'::"text", 'dismissed'::"text"])))
);


ALTER TABLE "public"."listing_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."listing_views" (
    "id" bigint NOT NULL,
    "listing_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."listing_views" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."listing_views_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."listing_views_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."listing_views_id_seq" OWNED BY "public"."listing_views"."id";



CREATE TABLE IF NOT EXISTS "public"."listings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" NOT NULL,
    "budget" numeric NOT NULL,
    "location" "text" NOT NULL,
    "urgency" "text" NOT NULL,
    "image_url" "text",
    "offers_count" integer DEFAULT 0 NOT NULL,
    "views_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "additional_image_urls" "text"[],
    "main_image_url" "text",
    "favorites_count" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'pending_approval'::"text" NOT NULL,
    "deactivation_reason" "text",
    "expires_at" timestamp with time zone,
    "auto_republish" boolean DEFAULT false NOT NULL,
    "contact_preference" "text" DEFAULT 'site_message'::"text" NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "rejection_reason" "text",
    "neighborhood" "text",
    "latitude" numeric,
    "longitude" numeric,
    "geolocation" "public"."geometry"(Point,4326),
    "popularity_score" integer DEFAULT 0,
    "is_featured" boolean DEFAULT false,
    "is_urgent_premium" boolean DEFAULT false,
    "is_showcase" boolean DEFAULT false,
    "premium_expires_at" timestamp with time zone,
    "showcase_expires_at" timestamp with time zone,
    "up_to_date" boolean DEFAULT false,
    "upped_at" timestamp with time zone,
    "urgent_expires_at" timestamp with time zone,
    "featured_expires_at" timestamp with time zone,
    "has_bold_border" boolean DEFAULT false,
    "accept_terms" boolean DEFAULT true,
    "offer_accepted_at" timestamp without time zone,
    "accepted_offer_id" "uuid",
    "tags" "text"[],
    "fts" "tsvector",
    "last_bumped_at" timestamp with time zone,
    "condition" "text"[] DEFAULT ARRAY['İkinci El'::"text"],
    "features" "text"[] DEFAULT ARRAY[]::"text"[],
    "attributes" "jsonb",
    CONSTRAINT "listings_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'pending_approval'::"text", 'rejected'::"text", 'sold'::"text", 'published'::"text", 'draft'::"text", 'in_transaction'::"text", 'pending'::"text"])))
);


ALTER TABLE "public"."listings" OWNER TO "postgres";


COMMENT ON COLUMN "public"."listings"."main_image_url" IS 'vitrin görseli';



COMMENT ON COLUMN "public"."listings"."favorites_count" IS 'İlanın kaç kullanıcı tarafından favorilendiğini gösterir.';



COMMENT ON COLUMN "public"."listings"."features" IS 'Array of feature IDs selected for this listing';



COMMENT ON COLUMN "public"."listings"."attributes" IS 'Category-specific attributes stored as JSONB for filtering and search. Format: {"attribute_key": ["value1", "value2"]}';



CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'sent'::"text" NOT NULL,
    "read_at" timestamp with time zone,
    "is_read" boolean DEFAULT false NOT NULL,
    "message_type" "text" DEFAULT 'text'::"text" NOT NULL,
    CONSTRAINT "messages_status_check" CHECK (("status" = ANY (ARRAY['sent'::"text", 'delivered'::"text", 'read'::"text"])))
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."messages" IS 'Stores individual messages within conversations.';



COMMENT ON COLUMN "public"."messages"."conversation_id" IS 'The conversation this message belongs to.';



COMMENT ON COLUMN "public"."messages"."sender_id" IS 'The user who sent this message.';



COMMENT ON COLUMN "public"."messages"."content" IS 'The actual text content of the message.';



COMMENT ON COLUMN "public"."messages"."message_type" IS 'Type of the message (e.g., text, image, offer_update, system)';



CREATE TABLE IF NOT EXISTS "public"."monthly_usage_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "month_year" "text" NOT NULL,
    "offers_count" integer DEFAULT 0,
    "messages_count" integer DEFAULT 0,
    "listings_count" integer DEFAULT 0,
    "featured_offers_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."monthly_usage_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "data" "jsonb",
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'sent'::"text"
);


ALTER TABLE "public"."notification_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "recipient_user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "data" "jsonb",
    "is_read" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offer_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "offer_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "file_type" "text",
    "file_size" bigint,
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."offer_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "offering_user_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "offered_item_id" "uuid",
    "offered_price" numeric,
    "conversation_id" "uuid",
    "is_highlighted" boolean DEFAULT false,
    "is_featured" boolean DEFAULT false,
    "attachments" "jsonb",
    "ai_suggestion" "text"
);


ALTER TABLE "public"."offers" OWNER TO "postgres";


COMMENT ON COLUMN "public"."offers"."offered_item_id" IS 'Teklif edilen envanter ürününün IDsi';



COMMENT ON COLUMN "public"."offers"."offered_price" IS 'Teklif edilen nakit tutar';



COMMENT ON COLUMN "public"."offers"."conversation_id" IS 'Optional link to a conversation related to this offer.';



CREATE TABLE IF NOT EXISTS "public"."premium_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "payment_method" "text" DEFAULT 'stripe'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "premium_subscriptions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'cancelled'::"text", 'expired'::"text", 'pending'::"text"])))
);


ALTER TABLE "public"."premium_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "avatar_url" "text",
    "bio" "text",
    "rating" numeric(2,1) DEFAULT 5.0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "total_ratings" integer DEFAULT 0 NOT NULL,
    "rating_sum" integer DEFAULT 0 NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "username" "text",
    "birth_date" "date",
    "gender" "text",
    "phone_number" "text",
    "phone_verified" boolean DEFAULT false,
    "social_links" "jsonb",
    "notification_preferences" "jsonb" DEFAULT '{"new_offer_push": true, "summary_emails": "weekly", "new_offer_email": true, "new_message_push": true, "new_message_email": true, "review_notifications_push": true, "review_notifications_email": true}'::"jsonb",
    "chat_preferences" "jsonb" DEFAULT '{"read_receipts": true, "show_last_seen": true, "auto_scroll_messages": true}'::"jsonb",
    "platform_preferences" "jsonb" DEFAULT '{"currency": "TRY", "language": "tr", "default_category": null, "default_location_district": null, "default_location_province": null}'::"jsonb",
    "is_2fa_enabled" boolean DEFAULT false,
    "followers_count" integer DEFAULT 0 NOT NULL,
    "following_count" integer DEFAULT 0 NOT NULL,
    "followed_categories_count" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "last_login" timestamp with time zone,
    "listings_count" integer DEFAULT 0 NOT NULL,
    "trust_score" integer DEFAULT 0,
    "trust_score_breakdown" "jsonb",
    "is_premium" boolean DEFAULT false,
    "premium_expires_at" timestamp with time zone,
    "monthly_listings_count" integer DEFAULT 0,
    "monthly_offers_count" integer DEFAULT 0,
    "daily_messages_count" integer DEFAULT 0,
    "last_reset_date" "date" DEFAULT CURRENT_DATE,
    "profile_views" integer DEFAULT 0 NOT NULL,
    "province" "text",
    "district" "text",
    "neighborhood" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."real_offers" (
    "count" bigint
);


ALTER TABLE "public"."real_offers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."settings" (
    "id" integer DEFAULT 1 NOT NULL,
    "data" "jsonb",
    CONSTRAINT "single_row_check" CHECK (("id" = 1))
);


ALTER TABLE "public"."settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "price_monthly" numeric(10,2) DEFAULT 0 NOT NULL,
    "price_yearly" numeric(10,2),
    "features" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "limits" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subscription_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "activity_type" "text" NOT NULL,
    "activity_title" "text" NOT NULL,
    "activity_description" "text",
    "related_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_activities_activity_type_check" CHECK (("activity_type" = ANY (ARRAY['offer_sent'::"text", 'offer_accepted'::"text", 'offer_rejected'::"text", 'message_sent'::"text", 'message_received'::"text", 'listing_created'::"text", 'listing_updated'::"text", 'offer_featured'::"text", 'profile_updated'::"text", 'new_activity_type'::"text"])))
);


ALTER TABLE "public"."user_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_ai_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "month_key" "text" NOT NULL,
    "attempts_used" integer DEFAULT 0 NOT NULL,
    "monthly_limit" integer DEFAULT 30 NOT NULL,
    "is_premium" boolean DEFAULT false NOT NULL,
    "last_used_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_ai_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_category_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "offer_count" integer DEFAULT 0,
    "success_count" integer DEFAULT 0,
    "total_value" numeric(12,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_category_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_events" (
    "id" bigint NOT NULL,
    "user_id" "uuid",
    "session_id" "text",
    "event_type" "text" NOT NULL,
    "event_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_events" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."user_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."user_events_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_events_id_seq" OWNED BY "public"."user_events"."id";



CREATE TABLE IF NOT EXISTS "public"."user_favorites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."user_favorites" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_favorites" IS 'Kullanıcıların favori ilanlarını saklar.';



CREATE TABLE IF NOT EXISTS "public"."user_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "feedback_type" "text" NOT NULL,
    "message" "text" NOT NULL,
    "screenshot_url" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_followed_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."user_followed_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_follows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."user_follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "reviewee_id" "uuid" NOT NULL,
    "offer_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."user_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_statistics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "total_offers" integer DEFAULT 0,
    "accepted_offers" integer DEFAULT 0,
    "rejected_offers" integer DEFAULT 0,
    "pending_offers" integer DEFAULT 0,
    "total_views" integer DEFAULT 0,
    "total_messages_sent" integer DEFAULT 0,
    "total_messages_received" integer DEFAULT 0,
    "avg_response_time_hours" numeric(5,2) DEFAULT 0,
    "success_rate" numeric(5,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_statistics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_usage_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "monthly_listings_count" integer DEFAULT 0,
    "monthly_offers_count" integer DEFAULT 0,
    "monthly_messages_count" integer DEFAULT 0,
    "last_reset_date" "date" DEFAULT CURRENT_DATE,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_usage_stats" OWNER TO "postgres";


ALTER TABLE ONLY "public"."advertisements" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."advertisements_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."listing_views" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."listing_views_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_events" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_events_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."admin_activity_logs"
    ADD CONSTRAINT "admin_activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_departments"
    ADD CONSTRAINT "admin_departments_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."admin_departments"
    ADD CONSTRAINT "admin_departments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_performance_metrics"
    ADD CONSTRAINT "admin_performance_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_profiles"
    ADD CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_workflow_assignments"
    ADD CONSTRAINT "admin_workflow_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advertisements"
    ADD CONSTRAINT "advertisements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fcm_tokens"
    ADD CONSTRAINT "fcm_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_items"
    ADD CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listing_reports"
    ADD CONSTRAINT "listing_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listing_views"
    ADD CONSTRAINT "listing_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monthly_usage_stats"
    ADD CONSTRAINT "monthly_usage_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monthly_usage_stats"
    ADD CONSTRAINT "monthly_usage_stats_user_id_month_year_key" UNIQUE ("user_id", "month_year");



ALTER TABLE ONLY "public"."notification_logs"
    ADD CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offer_attachments"
    ADD CONSTRAINT "offer_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."premium_subscriptions"
    ADD CONSTRAINT "premium_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."user_reviews"
    ADD CONSTRAINT "unique_review_per_offer_reviewer" UNIQUE ("offer_id", "reviewer_id");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "uq_conversation_user" UNIQUE ("conversation_id", "user_id");



ALTER TABLE ONLY "public"."user_activities"
    ADD CONSTRAINT "user_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_ai_usage"
    ADD CONSTRAINT "user_ai_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_ai_usage"
    ADD CONSTRAINT "user_ai_usage_user_id_month_key_key" UNIQUE ("user_id", "month_key");



ALTER TABLE ONLY "public"."user_category_stats"
    ADD CONSTRAINT "user_category_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_category_stats"
    ADD CONSTRAINT "user_category_stats_user_id_category_key" UNIQUE ("user_id", "category");



ALTER TABLE ONLY "public"."user_events"
    ADD CONSTRAINT "user_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_favorites"
    ADD CONSTRAINT "user_favorites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_favorites"
    ADD CONSTRAINT "user_favorites_user_listing_unique" UNIQUE ("user_id", "listing_id");



ALTER TABLE ONLY "public"."user_feedback"
    ADD CONSTRAINT "user_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_followed_categories"
    ADD CONSTRAINT "user_followed_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_followed_categories"
    ADD CONSTRAINT "user_followed_categories_unique_follow" UNIQUE ("user_id", "category_name");



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_unique_follow" UNIQUE ("follower_id", "following_id");



ALTER TABLE ONLY "public"."user_reviews"
    ADD CONSTRAINT "user_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_statistics"
    ADD CONSTRAINT "user_statistics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_statistics"
    ADD CONSTRAINT "user_statistics_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_usage_stats"
    ADD CONSTRAINT "user_usage_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_usage_stats"
    ADD CONSTRAINT "user_usage_stats_user_id_key" UNIQUE ("user_id");



CREATE INDEX "idx_admin_activity_logs_action" ON "public"."admin_activity_logs" USING "btree" ("action");



CREATE INDEX "idx_admin_activity_logs_admin_id" ON "public"."admin_activity_logs" USING "btree" ("admin_id");



CREATE INDEX "idx_admin_activity_logs_created_at" ON "public"."admin_activity_logs" USING "btree" ("created_at");



CREATE INDEX "idx_admin_performance_metrics_admin_profile_id" ON "public"."admin_performance_metrics" USING "btree" ("admin_profile_id");



CREATE INDEX "idx_admin_performance_metrics_metric_type" ON "public"."admin_performance_metrics" USING "btree" ("metric_type");



CREATE INDEX "idx_admin_performance_metrics_period" ON "public"."admin_performance_metrics" USING "btree" ("period_start", "period_end");



CREATE INDEX "idx_admin_profiles_admin_id" ON "public"."admin_profiles" USING "btree" ("admin_id");



CREATE INDEX "idx_admin_profiles_department" ON "public"."admin_profiles" USING "btree" ("department");



CREATE INDEX "idx_admin_profiles_is_active" ON "public"."admin_profiles" USING "btree" ("is_active");



CREATE INDEX "idx_admin_users_active" ON "public"."admin_users" USING "btree" ("is_active");



CREATE INDEX "idx_admin_users_email" ON "public"."admin_users" USING "btree" ("email");



CREATE INDEX "idx_admin_users_role" ON "public"."admin_users" USING "btree" ("role");



CREATE INDEX "idx_admin_workflow_assignments_admin_profile_id" ON "public"."admin_workflow_assignments" USING "btree" ("admin_profile_id");



CREATE INDEX "idx_admin_workflow_assignments_priority" ON "public"."admin_workflow_assignments" USING "btree" ("priority");



CREATE INDEX "idx_admin_workflow_assignments_status" ON "public"."admin_workflow_assignments" USING "btree" ("status");



CREATE INDEX "idx_admin_workflow_assignments_workflow_type" ON "public"."admin_workflow_assignments" USING "btree" ("workflow_type");



CREATE INDEX "idx_conversations_offer_id" ON "public"."conversations" USING "btree" ("offer_id");



CREATE INDEX "idx_conversations_user1_id" ON "public"."conversations" USING "btree" ("user1_id");



CREATE INDEX "idx_conversations_user2_id" ON "public"."conversations" USING "btree" ("user2_id");



CREATE INDEX "idx_fcm_tokens_active" ON "public"."fcm_tokens" USING "btree" ("is_active");



CREATE INDEX "idx_fcm_tokens_token" ON "public"."fcm_tokens" USING "btree" ("token");



CREATE INDEX "idx_fcm_tokens_user_id" ON "public"."fcm_tokens" USING "btree" ("user_id");



CREATE INDEX "idx_listing_views_created_at" ON "public"."listing_views" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_listing_views_listing_id" ON "public"."listing_views" USING "btree" ("listing_id");



CREATE INDEX "idx_listings_attributes" ON "public"."listings" USING "gin" ("attributes");



CREATE INDEX "idx_listings_popularity_score" ON "public"."listings" USING "btree" ("popularity_score" DESC);



CREATE INDEX "idx_messages_is_read" ON "public"."messages" USING "btree" ("is_read");



CREATE INDEX "idx_messages_status" ON "public"."messages" USING "btree" ("status");



CREATE INDEX "idx_monthly_usage_stats_month_year" ON "public"."monthly_usage_stats" USING "btree" ("month_year");



CREATE INDEX "idx_monthly_usage_stats_user_id" ON "public"."monthly_usage_stats" USING "btree" ("user_id");



CREATE INDEX "idx_offer_attachments_offer_id" ON "public"."offer_attachments" USING "btree" ("offer_id");



CREATE INDEX "idx_offer_attachments_uploaded_by" ON "public"."offer_attachments" USING "btree" ("uploaded_by");



CREATE INDEX "idx_offers_ai_suggestion" ON "public"."offers" USING "btree" ("ai_suggestion");



CREATE INDEX "idx_offers_attachments" ON "public"."offers" USING "gin" ("attachments");



CREATE INDEX "idx_premium_subscriptions_expires_at" ON "public"."premium_subscriptions" USING "btree" ("expires_at");



CREATE INDEX "idx_premium_subscriptions_plan_id" ON "public"."premium_subscriptions" USING "btree" ("plan_id");



CREATE INDEX "idx_premium_subscriptions_status" ON "public"."premium_subscriptions" USING "btree" ("status");



CREATE INDEX "idx_premium_subscriptions_user_id" ON "public"."premium_subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_subscription_plans_active" ON "public"."subscription_plans" USING "btree" ("is_active");



CREATE INDEX "idx_subscription_plans_slug" ON "public"."subscription_plans" USING "btree" ("slug");



CREATE INDEX "idx_user_activities_created_at" ON "public"."user_activities" USING "btree" ("created_at");



CREATE INDEX "idx_user_activities_type" ON "public"."user_activities" USING "btree" ("activity_type");



CREATE INDEX "idx_user_activities_user_id" ON "public"."user_activities" USING "btree" ("user_id");



CREATE INDEX "idx_user_ai_usage_month_key" ON "public"."user_ai_usage" USING "btree" ("month_key");



CREATE INDEX "idx_user_ai_usage_user_id" ON "public"."user_ai_usage" USING "btree" ("user_id");



CREATE INDEX "idx_user_ai_usage_user_month" ON "public"."user_ai_usage" USING "btree" ("user_id", "month_key");



CREATE INDEX "idx_user_category_stats_user_id" ON "public"."user_category_stats" USING "btree" ("user_id");



CREATE INDEX "idx_user_events_created_at" ON "public"."user_events" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_user_events_event_type" ON "public"."user_events" USING "btree" ("event_type");



CREATE INDEX "idx_user_events_user_id" ON "public"."user_events" USING "btree" ("user_id");



CREATE INDEX "idx_user_favorites_listing_id" ON "public"."user_favorites" USING "btree" ("listing_id");



CREATE INDEX "idx_user_favorites_user_id" ON "public"."user_favorites" USING "btree" ("user_id");



CREATE INDEX "idx_user_statistics_user_id" ON "public"."user_statistics" USING "btree" ("user_id");



CREATE INDEX "listings_fts_idx" ON "public"."listings" USING "gin" ("fts");



CREATE INDEX "listings_geolocation_idx" ON "public"."listings" USING "gist" ("geolocation");



CREATE OR REPLACE TRIGGER "fts_update" BEFORE INSERT OR UPDATE ON "public"."listings" FOR EACH ROW EXECUTE FUNCTION "public"."update_listing_fts"();



CREATE OR REPLACE TRIGGER "on_offer_insert" AFTER INSERT ON "public"."offers" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_trust_score"();



CREATE OR REPLACE TRIGGER "on_profile_change" AFTER INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_trust_score"();



CREATE OR REPLACE TRIGGER "on_review_insert" AFTER INSERT ON "public"."user_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_trust_score"();



CREATE OR REPLACE TRIGGER "trigger_create_notification_on_new_message" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."create_notification_on_new_message"();



CREATE OR REPLACE TRIGGER "trigger_decrement_follow_counts" AFTER DELETE ON "public"."user_follows" FOR EACH ROW EXECUTE FUNCTION "public"."decrement_follow_counts"();



CREATE OR REPLACE TRIGGER "trigger_increment_follow_counts" AFTER INSERT ON "public"."user_follows" FOR EACH ROW EXECUTE FUNCTION "public"."increment_follow_counts"();



CREATE OR REPLACE TRIGGER "trigger_listing_status_change" AFTER UPDATE OF "status" ON "public"."listings" FOR EACH ROW EXECUTE FUNCTION "public"."create_notification_for_listing_status_change"();



CREATE OR REPLACE TRIGGER "trigger_update_conversation_last_message_at" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_conversation_last_message_at"();



CREATE OR REPLACE TRIGGER "trigger_update_listing_favorites_count" AFTER INSERT OR DELETE ON "public"."user_favorites" FOR EACH ROW EXECUTE FUNCTION "public"."update_listing_favorites_count"();



CREATE OR REPLACE TRIGGER "trigger_update_listing_fts" BEFORE INSERT OR UPDATE ON "public"."listings" FOR EACH ROW EXECUTE FUNCTION "public"."update_listing_fts"();



CREATE OR REPLACE TRIGGER "trigger_update_listing_offers_count" AFTER INSERT OR DELETE ON "public"."offers" FOR EACH ROW EXECUTE FUNCTION "public"."update_listing_offers_count"();



CREATE OR REPLACE TRIGGER "trigger_update_profile_followed_categories_count" AFTER INSERT OR DELETE ON "public"."user_followed_categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_profile_followed_categories_count"();



CREATE OR REPLACE TRIGGER "trigger_update_profile_listings_count" AFTER INSERT OR DELETE ON "public"."listings" FOR EACH ROW EXECUTE FUNCTION "public"."update_profile_listings_count"();



CREATE OR REPLACE TRIGGER "trigger_update_profile_rating" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_profile_rating_on_review"();



CREATE OR REPLACE TRIGGER "update_fcm_tokens_updated_at" BEFORE UPDATE ON "public"."fcm_tokens" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_ai_usage_updated_at" BEFORE UPDATE ON "public"."user_ai_usage" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."admin_activity_logs"
    ADD CONSTRAINT "admin_activity_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_activity_logs"
    ADD CONSTRAINT "admin_activity_logs_admin_profile_id_fkey" FOREIGN KEY ("admin_profile_id") REFERENCES "public"."admin_profiles"("id");



ALTER TABLE ONLY "public"."admin_performance_metrics"
    ADD CONSTRAINT "admin_performance_metrics_admin_profile_id_fkey" FOREIGN KEY ("admin_profile_id") REFERENCES "public"."admin_profiles"("id");



ALTER TABLE ONLY "public"."admin_profiles"
    ADD CONSTRAINT "admin_profiles_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_workflow_assignments"
    ADD CONSTRAINT "admin_workflow_assignments_admin_profile_id_fkey" FOREIGN KEY ("admin_profile_id") REFERENCES "public"."admin_profiles"("id");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."fcm_tokens"
    ADD CONSTRAINT "fcm_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_items"
    ADD CONSTRAINT "inventory_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_reports"
    ADD CONSTRAINT "listing_reports_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_reports"
    ADD CONSTRAINT "listing_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_views"
    ADD CONSTRAINT "listing_views_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."monthly_usage_stats"
    ADD CONSTRAINT "monthly_usage_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_logs"
    ADD CONSTRAINT "notification_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offer_attachments"
    ADD CONSTRAINT "offer_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_offered_item_id_fkey" FOREIGN KEY ("offered_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_offering_user_id_fkey" FOREIGN KEY ("offering_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."premium_subscriptions"
    ADD CONSTRAINT "premium_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."premium_subscriptions"
    ADD CONSTRAINT "premium_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_activities"
    ADD CONSTRAINT "user_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_ai_usage"
    ADD CONSTRAINT "user_ai_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_category_stats"
    ADD CONSTRAINT "user_category_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_events"
    ADD CONSTRAINT "user_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_favorites"
    ADD CONSTRAINT "user_favorites_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_favorites"
    ADD CONSTRAINT "user_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_feedback"
    ADD CONSTRAINT "user_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_followed_categories"
    ADD CONSTRAINT "user_followed_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_reviews"
    ADD CONSTRAINT "user_reviews_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_reviews"
    ADD CONSTRAINT "user_reviews_reviewee_id_fkey" FOREIGN KEY ("reviewee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_reviews"
    ADD CONSTRAINT "user_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_statistics"
    ADD CONSTRAINT "user_statistics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_usage_stats"
    ADD CONSTRAINT "user_usage_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admin can manage categories" ON "public"."categories" USING (true);



CREATE POLICY "Admin can manage settings" ON "public"."settings" USING (true);



CREATE POLICY "Admin can update feedback." ON "public"."user_feedback" FOR UPDATE USING (true);



CREATE POLICY "Admin can view all feedback." ON "public"."user_feedback" FOR SELECT USING (true);



CREATE POLICY "Admin users can view all admin users" ON "public"."admin_users" FOR SELECT USING (true);



CREATE POLICY "Admins can insert activity logs" ON "public"."admin_activity_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Admins can update their own profile" ON "public"."admin_users" FOR UPDATE USING ((("auth"."uid"() = "id") OR (("role")::"text" = 'SUPER_ADMIN'::"text")));



CREATE POLICY "Admins can view all activity logs" ON "public"."admin_activity_logs" FOR SELECT USING (true);



CREATE POLICY "Allow admins to update any listing" ON "public"."listings" FOR UPDATE USING (("public"."get_current_user_role"() = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))) WITH CHECK (("public"."get_current_user_role"() = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])));



CREATE POLICY "Allow insert messages for conversation members" ON "public"."messages" FOR INSERT TO "authenticated" WITH CHECK ((("sender_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."conversation_participants" "cp"
  WHERE (("cp"."conversation_id" = "messages"."conversation_id") AND ("cp"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Allow read access to everyone for joining" ON "public"."inventory_items" FOR SELECT USING (true);



CREATE POLICY "Allow select messages for conversation members" ON "public"."messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversation_participants" "cp"
  WHERE (("cp"."conversation_id" = "messages"."conversation_id") AND ("cp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Allow update for conversation members" ON "public"."conversations" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IN ( SELECT "cp"."user_id"
   FROM "public"."conversation_participants" "cp"
  WHERE ("cp"."conversation_id" = "conversations"."id")))) WITH CHECK (("auth"."uid"() IN ( SELECT "cp"."user_id"
   FROM "public"."conversation_participants" "cp"
  WHERE ("cp"."conversation_id" = "conversations"."id"))));



CREATE POLICY "Allow update messages for conversation members" ON "public"."messages" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."conversation_participants" "cp"
  WHERE (("cp"."conversation_id" = "messages"."conversation_id") AND ("cp"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."conversation_participants" "cp"
  WHERE (("cp"."conversation_id" = "messages"."conversation_id") AND ("cp"."user_id" = "auth"."uid"())))));



CREATE POLICY "Authenticated users can insert notifications" ON "public"."notifications" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can insert offers." ON "public"."offers" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND ("auth"."uid"() = "offering_user_id")));



CREATE POLICY "Authenticated users can insert reports." ON "public"."listing_reports" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND ("auth"."uid"() = "reporter_id")));



CREATE POLICY "Enable Realtime for conversation participants" ON "public"."messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversation_participants"
  WHERE (("conversation_participants"."user_id" = "auth"."uid"()) AND ("conversation_participants"."conversation_id" = "messages"."conversation_id")))));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."user_reviews" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Inventory items are viewable by owner." ON "public"."inventory_items" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Listing owner can update offer status (accept/reject)." ON "public"."offers" FOR UPDATE USING (("auth"."uid"() = ( SELECT "listings"."user_id"
   FROM "public"."listings"
  WHERE ("listings"."id" = "offers"."listing_id")))) WITH CHECK (("auth"."uid"() = ( SELECT "listings"."user_id"
   FROM "public"."listings"
  WHERE ("listings"."id" = "offers"."listing_id"))));



CREATE POLICY "Listings are viewable by everyone." ON "public"."listings" FOR SELECT USING (true);



CREATE POLICY "Offer owner can delete their own offers" ON "public"."offers" FOR DELETE USING (("auth"."uid"() = "offering_user_id"));



CREATE POLICY "Offer owner can update their offers (e.g. retract)." ON "public"."offers" FOR UPDATE USING (("auth"."uid"() = "offering_user_id")) WITH CHECK (("auth"."uid"() = "offering_user_id"));



CREATE POLICY "Offers can be viewed by listing owner and offerer." ON "public"."offers" FOR SELECT USING ((("auth"."uid"() = "offering_user_id") OR ("auth"."uid"() = ( SELECT "listings"."user_id"
   FROM "public"."listings"
  WHERE ("listings"."id" = "offers"."listing_id")))));



CREATE POLICY "Plans are viewable by everyone" ON "public"."subscription_plans" FOR SELECT USING (true);



CREATE POLICY "Public can view favorites data for counts" ON "public"."user_favorites" FOR SELECT USING (true);



CREATE POLICY "Public can view follows data" ON "public"."user_follows" FOR SELECT USING (true);



CREATE POLICY "Public categories are viewable by everyone." ON "public"."categories" FOR SELECT USING (true);



CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Public user_reviews are viewable by everyone." ON "public"."user_reviews" FOR SELECT USING (true);



CREATE POLICY "Super admins can insert admin users" ON "public"."admin_users" FOR INSERT WITH CHECK ((("role")::"text" = 'SUPER_ADMIN'::"text"));



CREATE POLICY "Users can delete own attachments" ON "public"."offer_attachments" FOR DELETE USING (("auth"."uid"() = "uploaded_by"));



CREATE POLICY "Users can delete their own inventory items." ON "public"."inventory_items" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own listings." ON "public"."listings" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own reviews." ON "public"."user_reviews" FOR DELETE USING (("auth"."uid"() = "reviewer_id"));



CREATE POLICY "Users can insert own AI usage" ON "public"."user_ai_usage" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own activities" ON "public"."user_activities" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own attachments" ON "public"."offer_attachments" FOR INSERT WITH CHECK (("auth"."uid"() = "uploaded_by"));



CREATE POLICY "Users can insert own category stats" ON "public"."user_category_stats" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own statistics" ON "public"."user_statistics" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own subscriptions" ON "public"."premium_subscriptions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own usage stats" ON "public"."monthly_usage_stats" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own feedback." ON "public"."user_feedback" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own inventory items." ON "public"."inventory_items" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own listings." ON "public"."listings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can manage their own FCM tokens" ON "public"."fcm_tokens" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own activities" ON "public"."user_activities" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own favorites" ON "public"."user_favorites" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own followed categories" ON "public"."user_followed_categories" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own follows" ON "public"."user_follows" USING (("auth"."uid"() = "follower_id")) WITH CHECK (("auth"."uid"() = "follower_id"));



CREATE POLICY "Users can update own AI usage" ON "public"."user_ai_usage" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own category stats" ON "public"."user_category_stats" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile." ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own statistics" ON "public"."user_statistics" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own subscriptions" ON "public"."premium_subscriptions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own usage stats" ON "public"."monthly_usage_stats" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own inventory items." ON "public"."inventory_items" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own listings." ON "public"."listings" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "recipient_user_id")) WITH CHECK (("auth"."uid"() = "recipient_user_id"));



CREATE POLICY "Users can update their own reviews." ON "public"."user_reviews" FOR UPDATE USING (("auth"."uid"() = "reviewer_id")) WITH CHECK (("auth"."uid"() = "reviewer_id"));



CREATE POLICY "Users can view attachments" ON "public"."offer_attachments" FOR SELECT USING (true);



CREATE POLICY "Users can view own AI usage" ON "public"."user_ai_usage" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own activities" ON "public"."user_activities" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own category stats" ON "public"."user_category_stats" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own statistics" ON "public"."user_statistics" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own subscriptions" ON "public"."premium_subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own usage stats" ON "public"."monthly_usage_stats" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "recipient_user_id"));



ALTER TABLE "public"."admin_activity_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_participants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conversation_participants_insert_authenticated" ON "public"."conversation_participants" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "conversation_participants_select_authenticated" ON "public"."conversation_participants" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conversations_insert_authenticated" ON "public"."conversations" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "conversations_select_authenticated" ON "public"."conversations" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."fcm_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."listing_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."listings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."monthly_usage_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."offer_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."offers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."premium_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_ai_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_category_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_favorites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_followed_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_follows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_statistics" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_deactivate_accepted_listings"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_deactivate_accepted_listings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_deactivate_accepted_listings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_and_increment_listing_count"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_and_increment_listing_count"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_and_increment_listing_count"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_and_increment_message_count"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_and_increment_message_count"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_and_increment_message_count"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_and_increment_offer_count"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_and_increment_offer_count"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_and_increment_offer_count"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_image_limit"("p_user_id" "uuid", "p_image_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."check_image_limit"("p_user_id" "uuid", "p_image_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_image_limit"("p_user_id" "uuid", "p_image_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_listing_limit"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_listing_limit"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_listing_limit"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_message_limit"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_message_limit"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_message_limit"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_offer_limit"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_offer_limit"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_offer_limit"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_offer_limit_new"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_offer_limit_new"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_offer_limit_new"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_offer_timing_permission"("p_user_id" "uuid", "p_listing_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_offer_timing_permission"("p_user_id" "uuid", "p_listing_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_offer_timing_permission"("p_user_id" "uuid", "p_listing_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_user_ai_usage"("p_user_id" "uuid", "p_month_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_ai_usage"("p_user_id" "uuid", "p_month_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_ai_usage"("p_user_id" "uuid", "p_month_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_user_premium_status"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_premium_status"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_premium_status"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification_for_listing_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification_for_listing_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification_for_listing_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification_on_new_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification_on_new_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification_on_new_message"() TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_follow_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_follow_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_follow_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_attribute_statistics"("p_category" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_attribute_statistics"("p_category" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_attribute_statistics"("p_category" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_conversation_between_users"("user_id_1" "uuid", "user_id_2" "uuid", "p_offer_id" "uuid", "p_listing_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_conversation_between_users"("user_id_1" "uuid", "user_id_2" "uuid", "p_offer_id" "uuid", "p_listing_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_conversation_between_users"("user_id_1" "uuid", "user_id_2" "uuid", "p_offer_id" "uuid", "p_listing_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_offer_timing_info"("p_user_id" "uuid", "p_listing_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_offer_timing_info"("p_user_id" "uuid", "p_listing_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_offer_timing_info"("p_user_id" "uuid", "p_listing_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_offers_with_priority"("p_listing_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_offers_with_priority"("p_listing_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_offers_with_priority"("p_listing_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_monthly_usage"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_monthly_usage"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_monthly_usage"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_active_plan"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_active_plan"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_active_plan"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_category_stats"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_category_stats"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_category_stats"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_dashboard_stats"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_dashboard_stats"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_dashboard_stats"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_monthly_stats"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_monthly_stats"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_monthly_stats"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_recent_activities"("p_user_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_recent_activities"("p_user_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_recent_activities"("p_user_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_stats_test"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_stats_test"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_stats_test"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."immutable_unaccent"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."immutable_unaccent"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."immutable_unaccent"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_follow_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_follow_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_follow_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_offer_count"("row_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_offer_count"("row_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_offer_count"("row_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_profile_view"("user_id_to_increment" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_profile_view"("user_id_to_increment" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_profile_view"("user_id_to_increment" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_profile_view_count"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_profile_view_count"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_profile_view_count"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_usage"("p_user_id" "uuid", "p_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_usage"("p_user_id" "uuid", "p_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_usage"("p_user_id" "uuid", "p_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_user_usage"("p_user_id" "uuid", "p_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_user_usage"("p_user_id" "uuid", "p_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_user_usage"("p_user_id" "uuid", "p_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_view_count"("row_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_view_count"("row_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_view_count"("row_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_messages_as_read"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_messages_as_read"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_messages_as_read"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_ai_usage"("p_user_id" "uuid", "p_month_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."record_ai_usage"("p_user_id" "uuid", "p_month_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_ai_usage"("p_user_id" "uuid", "p_month_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_daily_counters"() TO "anon";
GRANT ALL ON FUNCTION "public"."reset_daily_counters"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_daily_counters"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_monthly_counters"() TO "anon";
GRANT ALL ON FUNCTION "public"."reset_monthly_counters"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_monthly_counters"() TO "service_role";



GRANT ALL ON FUNCTION "public"."search_by_attribute_values"("attribute_key" "text", "attribute_values" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."search_by_attribute_values"("attribute_key" "text", "attribute_values" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_by_attribute_values"("attribute_key" "text", "attribute_values" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_listings"("search_query" "text", "p_categories" "text"[], "p_location" "text", "p_urgency" "text", "min_price" real, "max_price" real, "p_page" integer, "p_page_size" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_listings"("search_query" "text", "p_categories" "text"[], "p_location" "text", "p_urgency" "text", "min_price" real, "max_price" real, "p_page" integer, "p_page_size" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_listings"("search_query" "text", "p_categories" "text"[], "p_location" "text", "p_urgency" "text", "min_price" real, "max_price" real, "p_page" integer, "p_page_size" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_listings_with_attributes"("search_query" "text", "p_categories" "text"[], "p_location" "text", "p_urgency" "text", "min_price" numeric, "max_price" numeric, "p_attributes" "jsonb", "p_page" integer, "p_page_size" integer, "sort_key" "text", "sort_direction" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_listings_with_attributes"("search_query" "text", "p_categories" "text"[], "p_location" "text", "p_urgency" "text", "min_price" numeric, "max_price" numeric, "p_attributes" "jsonb", "p_page" integer, "p_page_size" integer, "sort_key" "text", "sort_direction" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_listings_with_attributes"("search_query" "text", "p_categories" "text"[], "p_location" "text", "p_urgency" "text", "min_price" numeric, "max_price" numeric, "p_attributes" "jsonb", "p_page" integer, "p_page_size" integer, "sort_key" "text", "sort_direction" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_listings_with_count"("search_query" "text", "p_categories" "text"[], "p_location" "text", "p_urgency" "text", "min_price" numeric, "max_price" numeric, "p_page" integer, "p_page_size" integer, "sort_key" "text", "sort_direction" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_listings_with_count"("search_query" "text", "p_categories" "text"[], "p_location" "text", "p_urgency" "text", "min_price" numeric, "max_price" numeric, "p_page" integer, "p_page_size" integer, "sort_key" "text", "sort_direction" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_listings_with_count"("search_query" "text", "p_categories" "text"[], "p_location" "text", "p_urgency" "text", "min_price" numeric, "max_price" numeric, "p_page" integer, "p_page_size" integer, "sort_key" "text", "sort_direction" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_update_trust_score"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_update_trust_score"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_update_trust_score"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_conversation_last_message_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_conversation_last_message_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_conversation_last_message_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_listing_favorites_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_listing_favorites_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_listing_favorites_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_listing_fts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_listing_fts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_listing_fts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_listing_offers_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_listing_offers_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_listing_offers_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_popularity_scores"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_popularity_scores"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_popularity_scores"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_profile_followed_categories_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_profile_followed_categories_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_profile_followed_categories_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_profile_listings_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_profile_listings_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_profile_listings_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_profile_rating_on_review"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_profile_rating_on_review"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_profile_rating_on_review"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_premium_status"("p_user_id" "uuid", "p_is_premium" boolean, "p_monthly_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_premium_status"("p_user_id" "uuid", "p_is_premium" boolean, "p_monthly_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_premium_status"("p_user_id" "uuid", "p_is_premium" boolean, "p_monthly_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_profile_on_auth_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_profile_on_auth_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_profile_on_auth_change"() TO "service_role";



GRANT ALL ON TABLE "public"."admin_activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."admin_activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_activity_logs" TO "service_role";



GRANT ALL ON TABLE "public"."admin_departments" TO "anon";
GRANT ALL ON TABLE "public"."admin_departments" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_departments" TO "service_role";



GRANT ALL ON TABLE "public"."admin_performance_metrics" TO "anon";
GRANT ALL ON TABLE "public"."admin_performance_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_performance_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."admin_profiles" TO "anon";
GRANT ALL ON TABLE "public"."admin_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."admin_workflow_assignments" TO "anon";
GRANT ALL ON TABLE "public"."admin_workflow_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_workflow_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."advertisements" TO "anon";
GRANT ALL ON TABLE "public"."advertisements" TO "authenticated";
GRANT ALL ON TABLE "public"."advertisements" TO "service_role";



GRANT ALL ON SEQUENCE "public"."advertisements_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."advertisements_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."advertisements_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."categories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."categories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."categories_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_participants" TO "anon";
GRANT ALL ON TABLE "public"."conversation_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_participants" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."fcm_tokens" TO "anon";
GRANT ALL ON TABLE "public"."fcm_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."fcm_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_items" TO "anon";
GRANT ALL ON TABLE "public"."inventory_items" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_items" TO "service_role";



GRANT ALL ON TABLE "public"."listing_reports" TO "anon";
GRANT ALL ON TABLE "public"."listing_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."listing_reports" TO "service_role";



GRANT ALL ON TABLE "public"."listing_views" TO "anon";
GRANT ALL ON TABLE "public"."listing_views" TO "authenticated";
GRANT ALL ON TABLE "public"."listing_views" TO "service_role";



GRANT ALL ON SEQUENCE "public"."listing_views_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."listing_views_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."listing_views_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."listings" TO "anon";
GRANT ALL ON TABLE "public"."listings" TO "authenticated";
GRANT ALL ON TABLE "public"."listings" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."monthly_usage_stats" TO "anon";
GRANT ALL ON TABLE "public"."monthly_usage_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."monthly_usage_stats" TO "service_role";



GRANT ALL ON TABLE "public"."notification_logs" TO "anon";
GRANT ALL ON TABLE "public"."notification_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_logs" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."offer_attachments" TO "anon";
GRANT ALL ON TABLE "public"."offer_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."offer_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."offers" TO "anon";
GRANT ALL ON TABLE "public"."offers" TO "authenticated";
GRANT ALL ON TABLE "public"."offers" TO "service_role";



GRANT ALL ON TABLE "public"."premium_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."premium_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."premium_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."real_offers" TO "anon";
GRANT ALL ON TABLE "public"."real_offers" TO "authenticated";
GRANT ALL ON TABLE "public"."real_offers" TO "service_role";



GRANT ALL ON TABLE "public"."settings" TO "anon";
GRANT ALL ON TABLE "public"."settings" TO "authenticated";
GRANT ALL ON TABLE "public"."settings" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_plans" TO "anon";
GRANT ALL ON TABLE "public"."subscription_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_plans" TO "service_role";



GRANT ALL ON TABLE "public"."user_activities" TO "anon";
GRANT ALL ON TABLE "public"."user_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activities" TO "service_role";



GRANT ALL ON TABLE "public"."user_ai_usage" TO "anon";
GRANT ALL ON TABLE "public"."user_ai_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."user_ai_usage" TO "service_role";



GRANT ALL ON TABLE "public"."user_category_stats" TO "anon";
GRANT ALL ON TABLE "public"."user_category_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."user_category_stats" TO "service_role";



GRANT ALL ON TABLE "public"."user_events" TO "anon";
GRANT ALL ON TABLE "public"."user_events" TO "authenticated";
GRANT ALL ON TABLE "public"."user_events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_favorites" TO "anon";
GRANT ALL ON TABLE "public"."user_favorites" TO "authenticated";
GRANT ALL ON TABLE "public"."user_favorites" TO "service_role";



GRANT ALL ON TABLE "public"."user_feedback" TO "anon";
GRANT ALL ON TABLE "public"."user_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."user_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."user_followed_categories" TO "anon";
GRANT ALL ON TABLE "public"."user_followed_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."user_followed_categories" TO "service_role";



GRANT ALL ON TABLE "public"."user_follows" TO "anon";
GRANT ALL ON TABLE "public"."user_follows" TO "authenticated";
GRANT ALL ON TABLE "public"."user_follows" TO "service_role";



GRANT ALL ON TABLE "public"."user_reviews" TO "anon";
GRANT ALL ON TABLE "public"."user_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."user_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."user_statistics" TO "anon";
GRANT ALL ON TABLE "public"."user_statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."user_statistics" TO "service_role";



GRANT ALL ON TABLE "public"."user_usage_stats" TO "anon";
GRANT ALL ON TABLE "public"."user_usage_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."user_usage_stats" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






RESET ALL;
