import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.SUPABASE_URL || 'https://dnwreckpeenhbdtapmxr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY bulunamadı!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetAdminPassword() {
  try {
    const email = process.argv[2] || 'admin@benalsam.com';
    const newPassword = process.argv[3] || 'admin123456';

    console.log('🔐 Admin şifresi sıfırlanıyor...');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Yeni şifre: ${newPassword}`);
    console.log('');

    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    console.log('✅ Şifre hash\'lendi');

    // Veritabanında güncelle
    const { data, error } = await supabase
      .from('admin_users')
      .update({ password: hashedPassword })
      .eq('email', email.toLowerCase())
      .select();

    if (error) {
      console.error('❌ Hata:', error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.error(`❌ ${email} adresine sahip admin kullanıcısı bulunamadı!`);
      process.exit(1);
    }

    console.log('');
    console.log('✅ Şifre başarıyla sıfırlandı!');
    console.log('');
    console.log('📋 Giriş Bilgileri:');
    console.log(`   Email: ${email}`);
    console.log(`   Şifre: ${newPassword}`);
    console.log('');
    console.log('⚠️  Bu şifreyi güvenli bir yerde saklayın!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Beklenmeyen hata:', error);
    process.exit(1);
  }
}

resetAdminPassword();
