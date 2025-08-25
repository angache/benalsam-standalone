-- Drop existing function first
DROP FUNCTION IF EXISTS get_elasticsearch_queue_stats();

-- Queue stats RPC function
CREATE OR REPLACE FUNCTION get_elasticsearch_queue_stats()
RETURNS TABLE (
  total_jobs BIGINT,
  pending_jobs BIGINT,
  processing_jobs BIGINT,
  completed_jobs BIGINT,
  failed_jobs BIGINT,
  avg_processing_time NUMERIC,
  last_processed_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_jobs,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_jobs,
    COUNT(*) FILTER (WHERE status = 'processing') as processing_jobs,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_jobs,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_jobs,
    COALESCE(
      AVG(
        EXTRACT(EPOCH FROM (processed_at - created_at)) * 1000
      ) FILTER (WHERE status IN ('completed', 'failed') AND processed_at IS NOT NULL),
      0
    ) as avg_processing_time,
    MAX(processed_at) FILTER (WHERE status IN ('completed', 'failed')) as last_processed_at
  FROM elasticsearch_sync_queue;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_elasticsearch_queue_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_elasticsearch_queue_stats() TO service_role;
