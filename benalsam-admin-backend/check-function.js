const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFunction() {
  try {
    console.log('🔍 Checking add_to_elasticsearch_queue function...');
    
    // Fonksiyon tanımını al
    const { data: funcData, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_definition')
      .eq('routine_name', 'add_to_elasticsearch_queue')
      .eq('routine_schema', 'public');
    
    if (funcError) {
      console.error('❌ Error getting function definition:', funcError);
      return;
    }
    
    if (funcData && funcData.length > 0) {
      console.log('📋 Function Definition:');
      console.log(funcData[0].routine_definition);
    } else {
      console.log('❌ Function not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkFunction();
