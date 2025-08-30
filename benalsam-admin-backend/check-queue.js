const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkQueue() {
  try {
    console.log('🔍 Checking elasticsearch_sync_queue...');
    
    // Queue stats
    const { data: stats, error: statsError } = await supabase
      .rpc('get_elasticsearch_queue_stats');
    
    if (statsError) {
      console.error('❌ Error getting queue stats:', statsError);
      return;
    }
    
    console.log('📊 Queue Stats:', stats);
    
    // Pending jobs
    const { data: pendingJobs, error: pendingError } = await supabase
      .from('elasticsearch_sync_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (pendingError) {
      console.error('❌ Error getting pending jobs:', pendingError);
      return;
    }
    
    console.log(`\n⏳ Pending Jobs: ${pendingJobs.length}`);
    pendingJobs.forEach(job => {
      console.log(`  - Job ${job.id}: ${job.operation} on ${job.table_name}:${job.record_id}`);
    });
    
    // Failed jobs
    const { data: failedJobs, error: failedError } = await supabase
      .from('elasticsearch_sync_queue')
      .select('*')
      .eq('status', 'failed')
      .order('created_at', { ascending: true });
    
    if (failedError) {
      console.error('❌ Error getting failed jobs:', failedError);
      return;
    }
    
    console.log(`\n❌ Failed Jobs: ${failedJobs.length}`);
    failedJobs.forEach(job => {
      console.log(`  - Job ${job.id}: ${job.operation} on ${job.table_name}:${job.record_id}`);
      console.log(`    Error: ${job.error_message}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkQueue();
