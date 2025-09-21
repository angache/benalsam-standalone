const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestJob() {
  try {
    console.log('🧪 Creating test job in elasticsearch_sync_queue...');
    
    const testJob = {
      table_name: 'listings',
      record_id: 'test-123',
      operation: 'INSERT',
      change_data: {
        id: 'test-123',
        title: 'Test Listing',
        description: 'Test Description',
        price: 100,
        status: 'active'
      },
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('elasticsearch_sync_queue')
      .insert([testJob])
      .select();
    
    if (error) {
      console.error('❌ Error creating test job:', error);
      return;
    }
    
    console.log('✅ Test job created:', data[0]);
    console.log('📊 Job ID:', data[0].id);
    console.log('⏰ Created at:', data[0].created_at);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestJob();
