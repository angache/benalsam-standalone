-- Attribute filtreleme ile gelişmiş arama fonksiyonu (düzeltilmiş)
CREATE OR REPLACE FUNCTION search_listings_with_attributes(
    search_query text DEFAULT NULL,
    p_categories text[] DEFAULT NULL,
    p_location text DEFAULT NULL,
    p_urgency text DEFAULT 'Tümü',
    min_price numeric DEFAULT NULL,
    max_price numeric DEFAULT NULL,
    p_attributes jsonb DEFAULT NULL,
    p_page integer DEFAULT 1,
    p_page_size integer DEFAULT 20,
    sort_key text DEFAULT 'created_at',
    sort_direction text DEFAULT 'desc'
) RETURNS TABLE(
    id uuid,
    user_id uuid,
    title text,
    description text,
    category text,
    location text,
    budget numeric,
    status text,
    urgency text,
    tags text[],
    main_image_url text,
    additional_image_urls text[],
    views_count integer,
    offers_count integer,
    favorites_count integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    expires_at timestamp with time zone,
    last_bumped_at timestamp with time zone,
    deactivation_reason text,
    rejection_reason text,
    fts tsvector,
    popularity_score integer,
    is_urgent_premium boolean,
    is_featured boolean,
    is_showcase boolean,
    has_bold_border boolean,
    attributes jsonb,
    total_count bigint
) LANGUAGE plpgsql AS $$
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

-- Fonksiyon için yorum ekle
COMMENT ON FUNCTION search_listings_with_attributes IS 'Gelişmiş arama fonksiyonu - attribute filtreleme ile birlikte (düzeltilmiş)';

-- Attribute arama için yardımcı fonksiyon (düzeltilmiş)
CREATE OR REPLACE FUNCTION search_by_attribute_values(
    attribute_key text,
    attribute_values text[]
) RETURNS TABLE(
    id uuid,
    title text,
    category text,
    attributes jsonb
) LANGUAGE plpgsql AS $$
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

-- Fonksiyon için yorum ekle
COMMENT ON FUNCTION search_by_attribute_values IS 'Belirli attribute değerlerine göre arama yapar (düzeltilmiş)';

-- Attribute istatistikleri için fonksiyon (düzeltilmiş)
CREATE OR REPLACE FUNCTION get_attribute_statistics(
    p_category text DEFAULT NULL
) RETURNS TABLE(
    attribute_key text,
    attribute_values jsonb,
    usage_count bigint
) LANGUAGE plpgsql AS $$
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

-- Fonksiyon için yorum ekle
COMMENT ON FUNCTION get_attribute_statistics IS 'Kategori bazında attribute kullanım istatistiklerini döndürür (düzeltilmiş)'; 