revoke delete on table "public"."spatial_ref_sys" from "anon";

revoke insert on table "public"."spatial_ref_sys" from "anon";

revoke references on table "public"."spatial_ref_sys" from "anon";

revoke select on table "public"."spatial_ref_sys" from "anon";

revoke trigger on table "public"."spatial_ref_sys" from "anon";

revoke truncate on table "public"."spatial_ref_sys" from "anon";

revoke update on table "public"."spatial_ref_sys" from "anon";

revoke delete on table "public"."spatial_ref_sys" from "authenticated";

revoke insert on table "public"."spatial_ref_sys" from "authenticated";

revoke references on table "public"."spatial_ref_sys" from "authenticated";

revoke select on table "public"."spatial_ref_sys" from "authenticated";

revoke trigger on table "public"."spatial_ref_sys" from "authenticated";

revoke truncate on table "public"."spatial_ref_sys" from "authenticated";

revoke update on table "public"."spatial_ref_sys" from "authenticated";

revoke delete on table "public"."spatial_ref_sys" from "postgres";

revoke insert on table "public"."spatial_ref_sys" from "postgres";

revoke references on table "public"."spatial_ref_sys" from "postgres";

revoke select on table "public"."spatial_ref_sys" from "postgres";

revoke trigger on table "public"."spatial_ref_sys" from "postgres";

revoke truncate on table "public"."spatial_ref_sys" from "postgres";

revoke update on table "public"."spatial_ref_sys" from "postgres";

revoke delete on table "public"."spatial_ref_sys" from "service_role";

revoke insert on table "public"."spatial_ref_sys" from "service_role";

revoke references on table "public"."spatial_ref_sys" from "service_role";

revoke select on table "public"."spatial_ref_sys" from "service_role";

revoke trigger on table "public"."spatial_ref_sys" from "service_role";

revoke truncate on table "public"."spatial_ref_sys" from "service_role";

revoke update on table "public"."spatial_ref_sys" from "service_role";

alter table "public"."admin_users" drop constraint "admin_users_role_check";

alter table "public"."fcm_tokens" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."notification_logs" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."admin_users" add constraint "admin_users_role_check" CHECK (((role)::text = ANY ((ARRAY['SUPER_ADMIN'::character varying, 'ADMIN'::character varying, 'MODERATOR'::character varying, 'SUPPORT'::character varying, 'CATEGORY_MANAGER'::character varying, 'ANALYTICS_MANAGER'::character varying, 'USER_MANAGER'::character varying, 'CONTENT_MANAGER'::character varying])::text[]))) not valid;

alter table "public"."admin_users" validate constraint "admin_users_role_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_to_elasticsearch_queue()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    record_id UUID;
BEGIN
    -- Record ID'yi belirle
    IF TG_OP = 'DELETE' THEN
        record_id := OLD.id;
    ELSE
        record_id := NEW.id;
    END IF;

    -- Queue'ya ekle
    INSERT INTO elasticsearch_sync_queue (
        table_name,
        operation,
        record_id,
        change_data
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        record_id,
        CASE 
            WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
            WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
            WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
        END
    );

    RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.auto_deactivate_accepted_listings()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.check_and_increment_listing_count(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.check_and_increment_message_count(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.check_and_increment_offer_count(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.check_image_limit(p_user_id uuid, p_image_count integer)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.check_listing_limit(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.check_message_limit(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.check_offer_limit(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.check_offer_limit_new(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.check_offer_timing_permission(p_user_id uuid, p_listing_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.check_rate_limit(user_uuid uuid, attempt_type text, time_window interval DEFAULT '00:15:00'::interval)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    attempt_count integer;
    max_attempts integer := 5;
BEGIN
    -- Son X dakikada kaç deneme yapılmış
    SELECT COUNT(*) INTO attempt_count
    FROM public.auth_attempts
    WHERE user_id = user_uuid 
    AND type = attempt_type 
    AND created_at > NOW() - time_window;
    
    -- Eğer max_attempts'ten az deneme varsa izin ver
    RETURN attempt_count < max_attempts;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_user_ai_usage(p_user_id uuid, p_month_key text DEFAULT to_char(now(), 'YYYY-MM'::text))
 RETURNS TABLE(can_use boolean, attempts_left integer, total_attempts integer, monthly_limit integer, is_premium boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.check_user_premium_status(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM premium_subscriptions 
    WHERE user_id = p_user_id 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_old_auth_attempts()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    DELETE FROM public.auth_attempts 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_old_sessions()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- 24 saatten eski aktif session'ları terminate et
  UPDATE public.user_session_logs 
  SET 
    status = 'terminated',
    session_end = NOW(),
    session_duration = (NOW() - session_start)::interval,
    updated_at = NOW()
  WHERE status = 'active' 
    AND last_activity < NOW() - INTERVAL '24 hours';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_notification_for_listing_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_notification_on_new_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.decrement_follow_counts()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.profiles
    SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0)
    WHERE id = OLD.follower_id;

    UPDATE public.profiles
    SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0)
    WHERE id = OLD.following_id;
    RETURN OLD;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.disable_2fa(user_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.profiles 
    SET 
        totp_secret = NULL,
        backup_codes = NULL,
        is_2fa_enabled = false,
        updated_at = NOW()
    WHERE id = user_uuid;
    
    RETURN FOUND;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_2fa_status(user_uuid uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'is_enabled', p.is_2fa_enabled,
        'is_verified', p.totp_secret IS NOT NULL,
        'last_used', p.last_2fa_used,
        'has_backup_codes', p.backup_codes IS NOT NULL AND jsonb_array_length(p.backup_codes) > 0
    ) INTO result
    FROM public.profiles p
    WHERE p.id = user_uuid;
    
    RETURN COALESCE(result, '{}'::json);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_admin_permissions(p_admin_id uuid)
 RETURNS TABLE(permission_name text, resource text, action text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.name, p.resource, p.action
  FROM admin_permissions p
  LEFT JOIN admin_role_permissions rp ON p.id = rp.permission_id
  LEFT JOIN admin_user_permissions up ON p.id = up.permission_id
  LEFT JOIN admin_users au ON au.id = p_admin_id
  WHERE (rp.role = au.role OR up.admin_id = p_admin_id)
    AND au.is_active = true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_attribute_statistics(p_category text DEFAULT NULL::text)
 RETURNS TABLE(attribute_key text, attribute_values jsonb, usage_count bigint)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_conversation_between_users(user_id_1 uuid, user_id_2 uuid, p_offer_id uuid DEFAULT NULL::uuid, p_listing_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(conversation_id uuid, is_linked_to_offer boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
    RETURN user_role;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_elasticsearch_queue_stats()
 RETURNS TABLE(total_jobs integer, pending_jobs integer, processing_jobs integer, completed_jobs integer, failed_jobs integer, avg_processing_time interval)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_jobs,
        COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending_jobs,
        COUNT(*) FILTER (WHERE status = 'processing')::INTEGER as processing_jobs,
        COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed_jobs,
        COUNT(*) FILTER (WHERE status = 'failed')::INTEGER as failed_jobs,
        AVG(processed_at - created_at) FILTER (WHERE processed_at IS NOT NULL) as avg_processing_time
    FROM elasticsearch_sync_queue;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_legal_session_report(p_user_id uuid DEFAULT NULL::uuid, p_start_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_end_date timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS TABLE(user_id uuid, session_id uuid, ip_address text, country_code text, city text, session_start timestamp with time zone, session_end timestamp with time zone, session_duration interval, user_agent text, suspicious_activity boolean, risk_score integer)
 LANGUAGE plpgsql
AS $function$
begin
  return query
  select 
    usl.user_id,
    usl.session_id,
    usl.ip_address,
    usl.country_code,
    usl.city,
    usl.session_start,
    usl.session_end,
    usl.session_duration,
    usl.user_agent,
    usl.suspicious_activity,
    usl.risk_score
  from public.user_session_logs usl
  where (p_user_id is null or usl.user_id = p_user_id)
    and (p_start_date is null or usl.created_at >= p_start_date)
    and (p_end_date is null or usl.created_at <= p_end_date)
  order by usl.created_at desc;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_next_elasticsearch_job()
 RETURNS TABLE(id integer, table_name character varying, operation character varying, record_id uuid, change_data jsonb)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        eq.id,
        eq.table_name,
        eq.operation,
        eq.record_id,
        eq.change_data
    FROM elasticsearch_sync_queue eq
    WHERE eq.status = 'pending'
    ORDER BY eq.created_at ASC
    LIMIT 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_offer_timing_info(p_user_id uuid, p_listing_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_offers_with_priority(p_listing_id uuid)
 RETURNS TABLE(id uuid, listing_id uuid, offering_user_id uuid, offered_item_id uuid, offered_price numeric, message text, status text, created_at timestamp with time zone, updated_at timestamp with time zone, conversation_id uuid, user_plan_slug text, user_name text, user_avatar_url text, offered_item_name text, offered_item_image_url text, priority_score integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_or_create_monthly_usage(p_user_id uuid)
 RETURNS TABLE(offers_count integer, messages_count integer, listings_count integer, featured_offers_count integer, month_year text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_session_stats()
 RETURNS TABLE(active_sessions bigint, terminated_sessions bigint, total_sessions bigint)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE status = 'active') as active_sessions,
    COUNT(*) FILTER (WHERE status = 'terminated') as terminated_sessions,
    COUNT(*) as total_sessions
  FROM public.user_session_logs;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_active_plan(p_user_id uuid)
 RETURNS TABLE(plan_id uuid, plan_name text, plan_slug text, features jsonb, limits jsonb, expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_behavior_stats(user_uuid uuid)
 RETURNS TABLE(total_views integer, total_favorites integer, total_offers integer, total_contacts integer, favorite_categories text[], avg_price numeric, activity_level text)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE action = 'view') as views,
      COUNT(*) FILTER (WHERE action = 'favorite') as favorites,
      COUNT(*) FILTER (WHERE action = 'offer') as offers,
      COUNT(*) FILTER (WHERE action = 'contact') as contacts,
      AVG(price) FILTER (WHERE price IS NOT NULL) as avg_price,
      COUNT(*) as total_actions
    FROM user_behaviors 
    WHERE user_id = user_uuid
      AND created_at >= NOW() - INTERVAL '30 days'
  ),
  categories AS (
    SELECT array_agg(category) as cats
    FROM (
      SELECT category, COUNT(*) as cnt
      FROM user_behaviors 
      WHERE user_id = user_uuid 
        AND category IS NOT NULL
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY category
      ORDER BY cnt DESC
      LIMIT 5
    ) cat_stats
  )
  SELECT 
    s.views::INTEGER,
    s.favorites::INTEGER,
    s.offers::INTEGER,
    s.contacts::INTEGER,
    c.cats,
    s.avg_price,
    CASE 
      WHEN s.total_actions < 10 THEN 'low'
      WHEN s.total_actions < 50 THEN 'medium'
      ELSE 'high'
    END::TEXT
  FROM stats s, categories c;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_category_stats(p_user_id uuid)
 RETURNS TABLE(category text, offer_count integer, success_count integer, success_percentage numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_dashboard_stats(p_user_id uuid)
 RETURNS TABLE(total_offers integer, accepted_offers integer, rejected_offers integer, pending_offers integer, total_views integer, total_messages_sent integer, total_messages_received integer, avg_response_time_hours numeric, success_rate numeric, response_rate numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$DECLARE
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
END;$function$
;

CREATE OR REPLACE FUNCTION public.get_user_monthly_stats(p_user_id uuid)
 RETURNS TABLE(listings_count integer, offers_count integer, messages_count integer, is_premium boolean)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_recent_activities(p_user_id uuid, p_limit integer DEFAULT 10)
 RETURNS TABLE(activity_type text, activity_title text, activity_description text, created_at timestamp with time zone, time_ago text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_stats_test(p_user_id uuid)
 RETURNS TABLE(total_offers integer, accepted_offers integer, rejected_offers integer, pending_offers integer, total_views integer, total_messages_sent integer, total_messages_received integer, avg_response_time_hours numeric, success_rate numeric, response_rate numeric)
 LANGUAGE plpgsql
AS $function$DECLARE
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
END;$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.has_admin_permission(p_admin_id uuid, p_permission_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM get_admin_permissions(p_admin_id) 
    WHERE permission_name = p_permission_name
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT
AS $function$
SELECT public.unaccent($1);
$function$
;

CREATE OR REPLACE FUNCTION public.increment_follow_counts()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.profiles
    SET following_count = COALESCE(following_count, 0) + 1
    WHERE id = NEW.follower_id;

    UPDATE public.profiles
    SET followers_count = COALESCE(followers_count, 0) + 1
    WHERE id = NEW.following_id;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_offer_count(row_id uuid)
 RETURNS void
 LANGUAGE sql
AS $function$
  UPDATE public.listings
  SET offers_count = COALESCE(offers_count, 0) + 1
  WHERE id = row_id;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_profile_view(user_id_to_increment uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE profiles
  SET profile_views = COALESCE(profile_views, 0) + 1
  WHERE id = user_id_to_increment;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_profile_view_count(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE profiles
  SET profile_views = COALESCE(profile_views, 0) + 1
  WHERE id = p_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id uuid, p_type text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.increment_user_usage(p_user_id uuid, p_type text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.increment_view_count(row_id uuid)
 RETURNS void
 LANGUAGE sql
AS $function$
  UPDATE public.listings
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = row_id;
$function$
;

CREATE OR REPLACE FUNCTION public.log_failed_attempt(user_uuid uuid, attempt_type text, ip_addr text DEFAULT NULL::text, user_agent_text text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO public.auth_attempts (user_id, type, success, ip_address, user_agent)
    VALUES (user_uuid, attempt_type, false, ip_addr, user_agent_text);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_session_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  begin
    if (tg_op = 'INSERT') then
      insert into public.user_session_logs (
        session_id,
        user_id,
        session_start,
        status,
        legal_basis
      ) values (
        new.id,
        new.user_id,
        new.created_at,
        'active',
        'hukuki_yukumluluk'
      );
      
    elsif (tg_op = 'DELETE') then
      update public.user_session_logs 
      set 
        session_end = now(),
        session_duration = now() - session_start,
        status = 'terminated',
        updated_at = now()
      where session_id = old.id and status = 'active';
    end if;
    
  exception
    when insufficient_privilege then
      raise log 'Permission denied for user_session_logs: %', sqlerrm;
      -- Ana işlemi engelleme, sadece logla
    when others then
      raise log 'Session logging error: %', sqlerrm;
  end;
  
  return case when tg_op = 'DELETE' then old else new end;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.log_successful_attempt(user_uuid uuid, attempt_type text, ip_addr text DEFAULT NULL::text, user_agent_text text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO public.auth_attempts (user_id, type, success, ip_address, user_agent)
    VALUES (user_uuid, attempt_type, true, ip_addr, user_agent_text);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.mark_messages_as_read(p_conversation_id uuid, p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.record_ai_usage(p_user_id uuid, p_month_key text DEFAULT to_char(now(), 'YYYY-MM'::text))
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO user_ai_usage (user_id, month_key, attempts_used, monthly_limit, is_premium)
    VALUES (p_user_id, p_month_key, 1, 30, false)
    ON CONFLICT (user_id, month_key) 
    DO UPDATE SET 
        attempts_used = user_ai_usage.attempts_used + 1,
        last_used_at = now(),
        updated_at = now();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.regenerate_backup_codes(user_uuid uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    new_backup_codes jsonb;
    i integer;
    code text;
BEGIN
    -- 10 adet 8 haneli backup code oluştur
    new_backup_codes := '[]'::jsonb;
    
    FOR i IN 1..10 LOOP
        -- 8 haneli rastgele kod oluştur
        code := lpad(floor(random() * 100000000)::text, 8, '0');
        new_backup_codes := new_backup_codes || to_jsonb(code);
    END LOOP;
    
    -- Backup codes'u güncelle
    UPDATE public.profiles 
    SET 
        backup_codes = new_backup_codes,
        updated_at = NOW()
    WHERE id = user_uuid;
    
    RETURN new_backup_codes;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reset_daily_counters()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE profiles 
  SET daily_messages_count = 0
  WHERE last_reset_date < CURRENT_DATE;
  
  UPDATE profiles 
  SET last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reset_monthly_counters()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.search_by_attribute_values(attribute_key text, attribute_values text[])
 RETURNS TABLE(id uuid, title text, category text, attributes jsonb)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.search_listings(search_query text, p_categories text[], p_location text, p_urgency text, min_price real, max_price real, p_page integer, p_page_size integer)
 RETURNS TABLE(id uuid, created_at timestamp with time zone, user_id uuid, title text, description text, category text, budget numeric, location text, urgency text, main_image_url text, image_url text, additional_image_urls text[], status text, views_count integer, offers_count integer, favorites_count integer, expires_at timestamp with time zone, auto_republish boolean, contact_preference text, is_featured boolean, is_urgent_premium boolean, is_showcase boolean, popularity_score integer, upped_at timestamp with time zone, geolocation geometry, rejection_reason text, has_bold_border boolean)
 LANGUAGE plpgsql
AS $function$DECLARE
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
END;$function$
;

CREATE OR REPLACE FUNCTION public.search_listings_with_attributes(search_query text DEFAULT NULL::text, p_categories text[] DEFAULT NULL::text[], p_location text DEFAULT NULL::text, p_urgency text DEFAULT 'Tümü'::text, min_price numeric DEFAULT NULL::numeric, max_price numeric DEFAULT NULL::numeric, p_attributes jsonb DEFAULT NULL::jsonb, p_page integer DEFAULT 1, p_page_size integer DEFAULT 20, sort_key text DEFAULT 'created_at'::text, sort_direction text DEFAULT 'desc'::text)
 RETURNS TABLE(id uuid, user_id uuid, title text, description text, category text, location text, budget numeric, status text, urgency text, tags text[], main_image_url text, additional_image_urls text[], views_count integer, offers_count integer, favorites_count integer, created_at timestamp with time zone, updated_at timestamp with time zone, expires_at timestamp with time zone, last_bumped_at timestamp with time zone, deactivation_reason text, rejection_reason text, fts tsvector, popularity_score integer, is_urgent_premium boolean, is_featured boolean, is_showcase boolean, has_bold_border boolean, attributes jsonb, total_count bigint)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.search_listings_with_count(search_query text, p_categories text[] DEFAULT NULL::text[], p_location text DEFAULT NULL::text, p_urgency text DEFAULT 'Tümü'::text, min_price numeric DEFAULT NULL::numeric, max_price numeric DEFAULT NULL::numeric, p_page integer DEFAULT 1, p_page_size integer DEFAULT 20, sort_key text DEFAULT 'created_at'::text, sort_direction text DEFAULT 'desc'::text)
 RETURNS TABLE(id uuid, user_id uuid, title text, description text, category text, location text, budget numeric, status text, urgency text, tags text[], main_image_url text, additional_image_urls text[], views_count integer, offers_count integer, favorites_count integer, created_at timestamp with time zone, updated_at timestamp with time zone, expires_at timestamp with time zone, last_bumped_at timestamp with time zone, deactivation_reason text, rejection_reason text, fts tsvector, popularity_score integer, is_urgent_premium boolean, is_featured boolean, is_showcase boolean, has_bold_border boolean, total_count bigint)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_update_trust_score()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$DECLARE
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
END;$function$
;

CREATE OR REPLACE FUNCTION public.update_2fa_secret(user_uuid uuid, new_secret text, new_backup_codes jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.profiles 
    SET 
        totp_secret = new_secret,
        backup_codes = new_backup_codes,
        is_2fa_enabled = true,
        updated_at = NOW()
    WHERE id = user_uuid;
    
    RETURN FOUND;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_conversation_last_message_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at,
      updated_at = NEW.created_at 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_elasticsearch_job_status(job_id integer, new_status character varying, error_msg text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE elasticsearch_sync_queue
    SET 
        status = new_status,
        processed_at = CASE WHEN new_status IN ('completed', 'failed') THEN now() ELSE processed_at END,
        error_message = error_msg,
        retry_count = CASE WHEN new_status = 'failed' THEN retry_count + 1 ELSE retry_count END
    WHERE id = job_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_listing_favorites_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_listing_fts()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_listing_offers_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_popularity_scores()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_profile_followed_categories_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_profile_listings_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_profile_rating_on_review()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_behaviors_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_premium_status(p_user_id uuid, p_is_premium boolean, p_monthly_limit integer DEFAULT 30)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE user_ai_usage 
    SET 
        is_premium = p_is_premium,
        monthly_limit = CASE WHEN p_is_premium THEN -1 ELSE p_monthly_limit END,
        updated_at = now()
    WHERE user_id = p_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_profile_on_auth_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$BEGIN
  UPDATE public.profiles
  SET
    name = COALESCE(new.raw_user_meta_data->>'name', old.raw_user_meta_data->>'name', (SELECT name FROM public.profiles WHERE id = new.id)),
    updated_at = timezone('utc'::text, now())
  WHERE id = new.id;
  return new;
END;$function$
;

CREATE OR REPLACE FUNCTION public.verify_backup_code(user_uuid uuid, backup_code text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    user_backup_codes jsonb;
    updated_codes jsonb;
BEGIN
    -- Backup codes'u al
    SELECT backup_codes INTO user_backup_codes
    FROM public.profiles
    WHERE id = user_uuid;
    
    -- Backup codes yoksa false döndür
    IF user_backup_codes IS NULL THEN
        RETURN false;
    END IF;
    
    -- Backup code'u kontrol et
    IF user_backup_codes ? backup_code THEN
        -- Kullanılan backup code'u kaldır
        updated_codes := user_backup_codes - backup_code;
        
        -- Güncelle
        UPDATE public.profiles 
        SET 
            backup_codes = updated_codes,
            last_2fa_used = NOW(),
            updated_at = NOW()
        WHERE id = user_uuid;
        
        RETURN true;
    END IF;
    
    RETURN false;
END;
$function$
;


