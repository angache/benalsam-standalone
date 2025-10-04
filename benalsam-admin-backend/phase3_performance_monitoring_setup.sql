-- ========================================
-- PHASE 3: PERFORMANCE MONITORING SETUP
-- ========================================
-- Bu script performans monitoring ve analytics setup'ını içerir
-- Risk: DÜŞÜK - Monitoring ve analytics ekleme
-- Expected Impact: Real-time performance insights ve proactive optimization
-- ========================================

-- ========================================
-- 1. PERFORMANCE MONITORING TABLES
-- ========================================

-- 1.1. Query Performance Logs
CREATE TABLE IF NOT EXISTS query_performance_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query_hash VARCHAR(64) NOT NULL,
    query_text TEXT NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    rows_returned INTEGER,
    rows_examined INTEGER,
    index_used VARCHAR(255),
    table_name VARCHAR(100),
    user_id UUID,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 1.2. Database Performance Metrics
CREATE TABLE IF NOT EXISTS database_performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_type VARCHAR(50) NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit VARCHAR(20),
    table_name VARCHAR(100),
    index_name VARCHAR(255),
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 1.3. System Health Checks
CREATE TABLE IF NOT EXISTS system_health_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    check_type VARCHAR(50) NOT NULL,
    check_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    response_time_ms INTEGER,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ========================================
-- 2. PERFORMANCE MONITORING INDEXES
-- ========================================

-- 2.1. Query Performance Logs Indexes
CREATE INDEX IF NOT EXISTS idx_query_performance_logs_hash_time 
ON query_performance_logs(query_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_query_performance_logs_execution_time 
ON query_performance_logs(execution_time_ms DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_query_performance_logs_table_time 
ON query_performance_logs(table_name, created_at DESC);

-- 2.2. Database Performance Metrics Indexes
CREATE INDEX IF NOT EXISTS idx_db_performance_metrics_type_time 
ON database_performance_metrics(metric_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_db_performance_metrics_table_time 
ON database_performance_metrics(table_name, created_at DESC);

-- 2.3. System Health Checks Indexes
CREATE INDEX IF NOT EXISTS idx_system_health_checks_type_status 
ON system_health_checks(check_type, status, created_at DESC);

-- ========================================
-- 3. PERFORMANCE MONITORING FUNCTIONS
-- ========================================

-- 3.1. Query Performance Analyzer
CREATE OR REPLACE FUNCTION analyze_query_performance(
    time_window_hours INTEGER DEFAULT 24,
    min_execution_time_ms INTEGER DEFAULT 1000
)
RETURNS TABLE (
    query_hash VARCHAR(64),
    query_text TEXT,
    avg_execution_time_ms NUMERIC,
    max_execution_time_ms INTEGER,
    execution_count BIGINT,
    total_rows_returned BIGINT,
    avg_rows_returned NUMERIC,
    most_used_index VARCHAR(255),
    performance_rating VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        qpl.query_hash,
        qpl.query_text,
        ROUND(AVG(qpl.execution_time_ms), 2) as avg_execution_time_ms,
        MAX(qpl.execution_time_ms) as max_execution_time_ms,
        COUNT(*) as execution_count,
        SUM(qpl.rows_returned) as total_rows_returned,
        ROUND(AVG(qpl.rows_returned), 2) as avg_rows_returned,
        MODE() WITHIN GROUP (ORDER BY qpl.index_used) as most_used_index,
        CASE 
            WHEN AVG(qpl.execution_time_ms) < 100 THEN 'EXCELLENT'
            WHEN AVG(qpl.execution_time_ms) < 500 THEN 'GOOD'
            WHEN AVG(qpl.execution_time_ms) < 1000 THEN 'FAIR'
            WHEN AVG(qpl.execution_time_ms) < 5000 THEN 'POOR'
            ELSE 'CRITICAL'
        END as performance_rating
    FROM query_performance_logs qpl
    WHERE qpl.created_at >= now() - INTERVAL '1 hour' * time_window_hours
        AND qpl.execution_time_ms >= min_execution_time_ms
    GROUP BY qpl.query_hash, qpl.query_text
    HAVING COUNT(*) > 0
    ORDER BY avg_execution_time_ms DESC;
END;
$$ LANGUAGE plpgsql;

-- 3.2. Index Usage Analyzer
CREATE OR REPLACE FUNCTION analyze_index_usage(
    time_window_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    table_name VARCHAR(100),
    index_name VARCHAR(255),
    total_scans BIGINT,
    avg_scans_per_day NUMERIC,
    total_tuples_read BIGINT,
    total_tuples_fetched BIGINT,
    efficiency_ratio NUMERIC,
    usage_status VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ius.tablename::VARCHAR(100),
        ius.indexname::VARCHAR(255),
        ius.idx_scan as total_scans,
        ROUND(ius.idx_scan::NUMERIC / time_window_days, 2) as avg_scans_per_day,
        ius.idx_tup_read as total_tuples_read,
        ius.idx_tup_fetch as total_tuples_fetched,
        CASE 
            WHEN ius.idx_tup_read > 0 THEN ROUND((ius.idx_tup_fetch::NUMERIC / ius.idx_tup_read) * 100, 2)
            ELSE 0
        END as efficiency_ratio,
        ius.usage_status
    FROM index_usage_stats ius
    WHERE ius.total_scans > 0
    ORDER BY ius.total_scans DESC;
END;
$$ LANGUAGE plpgsql;

-- 3.3. System Health Checker
CREATE OR REPLACE FUNCTION perform_system_health_check()
RETURNS TABLE (
    check_name VARCHAR(100),
    status VARCHAR(20),
    response_time_ms INTEGER,
    details TEXT
) AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    check_result RECORD;
BEGIN
    -- Check 1: Database Connection
    start_time := clock_timestamp();
    PERFORM 1;
    end_time := clock_timestamp();
    
    INSERT INTO system_health_checks (check_type, check_name, status, response_time_ms, metadata)
    VALUES ('connectivity', 'database_connection', 'healthy', 
            EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER,
            '{"test": "basic_connection"}');
    
    -- Check 2: Index Usage
    start_time := clock_timestamp();
    SELECT COUNT(*) INTO check_result FROM index_usage_stats WHERE usage_status = 'UNUSED';
    end_time := clock_timestamp();
    
    INSERT INTO system_health_checks (check_type, check_name, status, response_time_ms, metadata)
    VALUES ('indexes', 'unused_indexes_check', 
            CASE WHEN check_result.count > 10 THEN 'warning' ELSE 'healthy' END,
            EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER,
            json_build_object('unused_count', check_result.count));
    
    -- Check 3: Table Sizes
    start_time := clock_timestamp();
    SELECT COUNT(*) INTO check_result FROM table_sizes WHERE size_bytes > 1000000000; -- 1GB
    end_time := clock_timestamp();
    
    INSERT INTO system_health_checks (check_type, check_name, status, response_time_ms, metadata)
    VALUES ('storage', 'large_tables_check', 
            CASE WHEN check_result.count > 5 THEN 'warning' ELSE 'healthy' END,
            EXTRACT(milliseconds FROM (end_time - start_time))::INTEGER,
            json_build_object('large_table_count', check_result.count));
    
    -- Return results
    RETURN QUERY
    SELECT 
        shc.check_name,
        shc.status,
        shc.response_time_ms,
        shc.metadata::TEXT as details
    FROM system_health_checks shc
    WHERE shc.created_at >= now() - INTERVAL '1 minute'
    ORDER BY shc.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 4. PERFORMANCE MONITORING VIEWS
-- ========================================

-- 4.1. Real-time Performance Dashboard
CREATE OR REPLACE VIEW performance_dashboard AS
SELECT 
    'query_performance' as metric_category,
    COUNT(*) as total_queries,
    AVG(execution_time_ms) as avg_execution_time,
    MAX(execution_time_ms) as max_execution_time,
    COUNT(*) FILTER (WHERE execution_time_ms > 1000) as slow_queries,
    now() as last_updated
FROM query_performance_logs
WHERE created_at >= now() - INTERVAL '1 hour'

UNION ALL

SELECT 
    'index_usage' as metric_category,
    COUNT(*) as total_indexes,
    AVG(idx_scan) as avg_scans,
    MAX(idx_scan) as max_scans,
    COUNT(*) FILTER (WHERE usage_status = 'UNUSED') as unused_indexes,
    now() as last_updated
FROM index_usage_stats

UNION ALL

SELECT 
    'system_health' as metric_category,
    COUNT(*) as total_checks,
    AVG(response_time_ms) as avg_response_time,
    MAX(response_time_ms) as max_response_time,
    COUNT(*) FILTER (WHERE status != 'healthy') as failed_checks,
    now() as last_updated
FROM system_health_checks
WHERE created_at >= now() - INTERVAL '1 hour';

-- 4.2. Performance Trends
CREATE OR REPLACE VIEW performance_trends AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as query_count,
    AVG(execution_time_ms) as avg_execution_time,
    MAX(execution_time_ms) as max_execution_time,
    COUNT(*) FILTER (WHERE execution_time_ms > 1000) as slow_query_count
FROM query_performance_logs
WHERE created_at >= now() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- ========================================
-- 5. AUTOMATED CLEANUP FUNCTIONS
-- ========================================

-- 5.1. Cleanup Old Performance Logs
CREATE OR REPLACE FUNCTION cleanup_old_performance_logs(
    retention_days INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM query_performance_logs 
    WHERE created_at < now() - INTERVAL '1 day' * retention_days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    INSERT INTO system_health_checks (check_type, check_name, status, metadata)
    VALUES ('maintenance', 'cleanup_performance_logs', 'completed', 
            json_build_object('deleted_count', deleted_count, 'retention_days', retention_days));
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 6. VERIFICATION QUERIES
-- ========================================

-- 6.1. Check monitoring tables
SELECT 
    'MONITORING TABLES VERIFICATION' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'query_performance_logs') 
        THEN 'SUCCESS - query_performance_logs created'
        ELSE 'FAILED - query_performance_logs missing'
    END as query_logs_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'database_performance_metrics') 
        THEN 'SUCCESS - database_performance_metrics created'
        ELSE 'FAILED - database_performance_metrics missing'
    END as metrics_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_health_checks') 
        THEN 'SUCCESS - system_health_checks created'
        ELSE 'FAILED - system_health_checks missing'
    END as health_checks_status;

-- 6.2. Check monitoring functions
SELECT 
    'MONITORING FUNCTIONS VERIFICATION' as status,
    COUNT(*) as total_functions_created
FROM information_schema.routines 
WHERE routine_name IN (
    'analyze_query_performance',
    'analyze_index_usage', 
    'perform_system_health_check',
    'cleanup_old_performance_logs'
);

-- 6.3. Check monitoring views
SELECT 
    'MONITORING VIEWS VERIFICATION' as status,
    COUNT(*) as total_views_created
FROM information_schema.views 
WHERE table_name IN (
    'performance_dashboard',
    'performance_trends'
);

-- ========================================
-- 7. PERFORMANCE IMPACT ESTIMATION
-- ========================================

SELECT 
    'PHASE 3 COMPLETED' as status,
    'Performance monitoring tables created' as action_1,
    'Analytics functions implemented' as action_2,
    'Real-time dashboard views ready' as action_3,
    'Automated cleanup functions added' as action_4,
    'System ready for proactive optimization' as result;
