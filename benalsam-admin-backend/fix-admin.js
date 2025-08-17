const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAdmin() {
  try {
    console.log('🔧 Admin kullanıcısı düzeltiliyor...');
    
    // Admin kullanıcısını SUPER_ADMIN yap ve 2FA'yı kaldır
    const { data, error } = await supabase
      .from('admin_users')
      .update({ 
        role: 'SUPER_ADMIN',
        is_2fa_enabled: false,
        totp_secret: null,
        backup_codes: null
      })
      .eq('email', 'admin@benalsam.com')
      .select();

    if (error) {
      console.error('❌ Hata:', error);
      return;
    }

    console.log('✅ Admin kullanıcısı güncellendi:');
    console.log('Email:', data[0].email);
    console.log('Rol:', data[0].role);
    console.log('2FA:', data[0].is_2fa_enabled ? 'Aktif' : 'Devre dışı');
    
    console.log('\n🎉 Artık şu credentials ile login olabilirsin:');
    console.log('Email: admin@benalsam.com');
    console.log('Password: admin123456');
    console.log('2FA: Gerekmiyor');
    
  } catch (error) {
    console.error('❌ Beklenmeyen hata:', error);
  }
}

fixAdmin();
