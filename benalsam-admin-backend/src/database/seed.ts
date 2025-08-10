import { supabase } from '../config/supabase';
import bcrypt from 'bcryptjs';
import { AdminRole } from '../types/admin-types';

async function seedAdminUser() {
  try {
    console.log('🌱 Seeding admin user...');

    // Check if admin user already exists
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', 'admin@benalsam.com')
      .single();

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123456', 12);

    // Create admin user
    const { data: admin, error } = await supabase
      .from('admin_users')
      .insert({
        email: 'admin@benalsam.com',
        password: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
        role: AdminRole.SUPER_ADMIN,
        permissions: [
          { resource: 'listings', action: 'read' },
          { resource: 'listings', action: 'write' },
          { resource: 'listings', action: 'delete' },
          { resource: 'listings', action: 'moderate' },
          { resource: 'users', action: 'read' },
          { resource: 'users', action: 'write' },
          { resource: 'users', action: 'delete' },
          { resource: 'admin_users', action: 'read' },
          { resource: 'admin_users', action: 'write' },
          { resource: 'admin_users', action: 'delete' },
        ],
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating admin user:', error);
      return;
    }

    console.log('✅ Admin user created successfully:', admin.email);
    console.log('🔑 Login credentials:');
    console.log('   Email: admin@benalsam.com');
    console.log('   Password: admin123456');
  } catch (error) {
    console.error('❌ Seed error:', error);
  }
}

// Run seed
seedAdminUser(); 