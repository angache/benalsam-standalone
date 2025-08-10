const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY environment variables gerekli');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function activateSuperAdmin() {
  try {
    console.log('🔍 Super-admin kullanıcısı aranıyor...');
    
    // Super-admin kullanıcısını bul
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('role', 'super-admin')
      .single();

    if (error) {
      console.error('❌ Super-admin bulunamadı:', error.message);
      return;
    }

    console.log('✅ Super-admin bulundu:', {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      is_active: admin.is_active
    });

    if (admin.is_active) {
      console.log('✅ Super-admin zaten aktif');
      return;
    }

    // Super-admin'i aktif hale getir
    const { data: updatedAdmin, error: updateError } = await supabase
      .from('admin_users')
      .update({ is_active: true })
      .eq('id', admin.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Super-admin aktif hale getirilemedi:', updateError.message);
      return;
    }

    console.log('✅ Super-admin başarıyla aktif hale getirildi:', {
      id: updatedAdmin.id,
      email: updatedAdmin.email,
      role: updatedAdmin.role,
      is_active: updatedAdmin.is_active
    });

  } catch (error) {
    console.error('❌ Hata:', error.message);
  }
}

activateSuperAdmin(); 