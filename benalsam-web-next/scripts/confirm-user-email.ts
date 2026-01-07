/**
 * Script to confirm user email in Supabase
 * Usage: npx tsx scripts/confirm-user-email.ts <email>
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
  console.log('Kullanım: npx tsx scripts/confirm-user-email.ts <email>');
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

async function confirmUserEmail() {
  console.log(`\n📧 Email doğrulanıyor: ${email}\n`);

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
    console.log(`   Mevcut durum: ${user.email_confirmed_at ? '✅ Doğrulanmış' : '❌ Doğrulanmamış'}`);

    // Confirm email
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        email_confirm: true,
      }
    );

    if (updateError) {
      console.error('❌ Email doğrulanamadı:', updateError.message);
      process.exit(1);
    }

    console.log('✅ Email başarıyla doğrulandı!');
    console.log(`   Yeni durum: ${updatedUser.user.email_confirmed_at ? '✅ Doğrulanmış' : '❌ Doğrulanmamış'}`);
    console.log('\n🎉 Artık login yapabilirsiniz!');

  } catch (error) {
    console.error('❌ Hata:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

confirmUserEmail();

