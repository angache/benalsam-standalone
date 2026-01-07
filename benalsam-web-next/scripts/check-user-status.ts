/**
 * Script to check user status in Supabase
 * Usage: npx tsx scripts/check-user-status.ts <email>
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
const envPath = resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const email = process.argv[2];

if (!email) {
  console.error('❌ Email adresi gerekli!');
  console.log('Kullanım: npx tsx scripts/check-user-status.ts <email>');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Supabase credentials bulunamadı!');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅' : '❌');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function checkUserStatus() {
  console.log(`\n🔍 Kullanıcı durumu kontrol ediliyor: ${email}\n`);

  try {
    // List all users and find the one with matching email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Kullanıcı listesi alınamadı:', listError.message);
      process.exit(1);
    }

    const user = users?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      console.log('❌ Kullanıcı bulunamadı!');
      console.log('\n💡 Çözüm:');
      console.log('   1. Kullanıcıyı Supabase Dashboard\'dan oluşturun');
      console.log('   2. Veya /auth/register sayfasından kayıt olun');
      process.exit(1);
    }

    console.log('✅ Kullanıcı bulundu!');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Email Doğrulandı: ${user.email_confirmed_at ? '✅ Evet' : '❌ Hayır'}`);
    console.log(`   Oluşturulma: ${user.created_at ? new Date(user.created_at).toLocaleString('tr-TR') : 'Bilinmiyor'}`);
    console.log(`   Son Giriş: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('tr-TR') : 'Hiç giriş yapılmamış'}`);

    // Check profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.log(`\n⚠️  Profil bulunamadı: ${profileError.message}`);
    } else {
      console.log(`\n✅ Profil bulundu:`);
      console.log(`   Username: ${profile.username || 'Yok'}`);
      console.log(`   Name: ${profile.name || 'Yok'}`);
      console.log(`   Status: ${profile.status || 'Bilinmiyor'}`);
      console.log(`   2FA: ${profile.is_2fa_enabled ? '✅ Aktif' : '❌ Pasif'}`);
    }

    // Check if email is confirmed
    if (!user.email_confirmed_at) {
      console.log('\n⚠️  EMAIL DOĞRULANMAMIŞ!');
      console.log('\n💡 Çözüm:');
      console.log('   1. Email doğrulama linkini kontrol edin');
      console.log('   2. Veya aşağıdaki komutu çalıştırarak email\'i manuel olarak doğrulayın:');
      console.log(`\n   npx tsx scripts/confirm-user-email.ts ${email}`);
      
      // Ask if user wants to confirm email now
      console.log('\n📧 Email\'i şimdi doğrulamak ister misiniz? (y/n)');
    } else {
      console.log('\n✅ Email doğrulandı - Login yapılabilir olmalı!');
      console.log('\n🔍 Eğer hala login yapamıyorsanız:');
      console.log('   1. Şifrenin doğru olduğundan emin olun');
      console.log('   2. Browser console\'daki hata mesajlarını kontrol edin');
      console.log('   3. Supabase Dashboard > Authentication > Users\'dan kullanıcıyı kontrol edin');
    }

  } catch (error) {
    console.error('❌ Hata:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

checkUserStatus();

