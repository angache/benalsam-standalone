const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY environment variables gerekli');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAllAdmins() {
  try {
    console.log('🔍 Tüm admin kullanıcıları aranıyor...');
    
    // Tüm admin kullanıcılarını bul
    const { data: admins, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Admin kullanıcıları bulunamadı:', error.message);
      return;
    }

    console.log(`✅ ${admins.length} admin kullanıcısı bulundu:`);
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ID: ${admin.id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   İsim: ${admin.first_name} ${admin.last_name}`);
      console.log(`   Rol: ${admin.role}`);
      console.log(`   Aktif: ${admin.is_active ? '✅' : '❌'}`);
      console.log(`   Oluşturulma: ${admin.created_at}`);
      console.log('---');
    });

  } catch (error) {
    console.error('❌ Hata:', error.message);
  }
}

listAllAdmins(); 