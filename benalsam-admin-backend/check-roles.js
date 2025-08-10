const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY environment variables gerekli');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRoles() {
  try {
    console.log('🔍 Admin rolleri kontrol ediliyor...');
    
    // Admin rolleri tablosunu kontrol et
    const { data: roles, error } = await supabase
      .from('admin_roles')
      .select('*')
      .order('level', { ascending: false });

    if (error) {
      console.error('❌ Roller alınamadı:', error.message);
      return;
    }

    console.log(`✅ ${roles.length} rol bulundu:`);
    
    if (roles.length === 0) {
      console.log('❌ Hiç rol yok! Roller oluşturulmalı.');
      return;
    }
    
    roles.forEach((role, index) => {
      console.log(`${index + 1}. ID: ${role.id}`);
      console.log(`   İsim: ${role.name}`);
      console.log(`   Görünen İsim: ${role.display_name}`);
      console.log(`   Açıklama: ${role.description || 'Açıklama yok'}`);
      console.log(`   Seviye: ${role.level}`);
      console.log(`   Aktif: ${role.is_active ? '✅' : '❌'}`);
      console.log(`   Oluşturulma: ${role.created_at}`);
      console.log('---');
    });

  } catch (error) {
    console.error('❌ Hata:', error.message);
  }
}

checkRoles(); 