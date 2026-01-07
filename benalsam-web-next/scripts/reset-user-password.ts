/**
 * Script to reset user password in Supabase
 * Usage: npx tsx scripts/reset-user-password.ts <email> <new-password>
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
const envPath = resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error('❌ Email ve yeni şifre gerekli!');
  console.log('Kullanım: npx tsx scripts/reset-user-password.ts <email> <new-password>');
  console.log('\nÖrnek:');
  console.log('  npx tsx scripts/reset-user-password.ts angache@gmail.com YeniSifre123!');
  process.exit(1);
}

// Validate password strength
if (newPassword.length < 8) {
  console.error('❌ Şifre en az 8 karakter olmalıdır!');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Supabase credentials bulunamadı!');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function resetUserPassword() {
  console.log(`\n🔐 Şifre sıfırlanıyor: ${email}\n`);

  try {
    // Find user by email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Kullanıcı listesi alınamadı:', listError.message);
      process.exit(1);
    }

    const user = users?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      console.error('❌ Kullanıcı bulunamadı!');
      process.exit(1);
    }

    console.log(`✅ Kullanıcı bulundu: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Email Doğrulandı: ${user.email_confirmed_at ? '✅ Evet' : '❌ Hayır'}`);

    // Reset password
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        password: newPassword,
      }
    );

    if (updateError) {
      console.error('❌ Şifre sıfırlanamadı:', updateError.message);
      console.error('   Hata detayları:', JSON.stringify(updateError, null, 2));
      process.exit(1);
    }

    console.log('✅ Şifre başarıyla sıfırlandı!');
    console.log('\n🎉 Artık yeni şifre ile login yapabilirsiniz!');
    console.log(`   Email: ${email}`);
    console.log(`   Yeni Şifre: ${newPassword}`);

  } catch (error) {
    console.error('❌ Hata:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

resetUserPassword();

