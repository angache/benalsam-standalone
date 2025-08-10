-- Enhanced Admin Roles and Permissions System
-- Migration: 20250717000001_enhance_admin_roles_permissions.sql

-- 1. Update admin_users table to support new roles
ALTER TABLE admin_users 
DROP CONSTRAINT IF EXISTS admin_users_role_check;

ALTER TABLE admin_users 
ADD CONSTRAINT admin_users_role_check 
CHECK (role IN (
  'SUPER_ADMIN', 
  'ADMIN', 
  'MODERATOR', 
  'SUPPORT', 
  'CATEGORY_MANAGER', 
  'ANALYTICS_MANAGER', 
  'USER_MANAGER', 
  'CONTENT_MANAGER'
));

-- 2. Create admin_permissions table for granular permissions
CREATE TABLE IF NOT EXISTS admin_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(resource, action)
);

-- 3. Create admin_role_permissions table for role-permission mapping
CREATE TABLE IF NOT EXISTS admin_role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role VARCHAR(50) NOT NULL,
  permission_id UUID REFERENCES admin_permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(role, permission_id)
);

-- 4. Create admin_user_permissions table for user-specific permissions
CREATE TABLE IF NOT EXISTS admin_user_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES admin_permissions(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(admin_id, permission_id)
);

-- 5. Create admin_roles table for role definitions
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  level INTEGER NOT NULL DEFAULT 0, -- Hierarchy level (0=lowest, 10=highest)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Insert default roles
INSERT INTO admin_roles (name, display_name, description, level) VALUES
  ('SUPER_ADMIN', 'Süper Admin', 'Tam sistem yetkisi', 10),
  ('ADMIN', 'Admin', 'Genel yönetim yetkisi', 8),
  ('MODERATOR', 'Moderatör', 'İlan moderasyon yetkisi', 6),
  ('SUPPORT', 'Destek', 'Müşteri desteği yetkisi', 4),
  ('CATEGORY_MANAGER', 'Kategori Yöneticisi', 'Kategori yönetim yetkisi', 7),
  ('ANALYTICS_MANAGER', 'Analitik Yöneticisi', 'Analitik ve rapor yetkisi', 6),
  ('USER_MANAGER', 'Kullanıcı Yöneticisi', 'Kullanıcı yönetim yetkisi', 7),
  ('CONTENT_MANAGER', 'İçerik Yöneticisi', 'İçerik yönetim yetkisi', 6)
ON CONFLICT (name) DO NOTHING;

-- 7. Insert default permissions
INSERT INTO admin_permissions (name, resource, action, description) VALUES
  -- Dashboard
  ('dashboard:view', 'dashboard', 'view', 'Dashboard görüntüleme'),
  
  -- Listings
  ('listings:view', 'listings', 'view', 'İlanları görüntüleme'),
  ('listings:moderate', 'listings', 'moderate', 'İlan moderasyonu'),
  ('listings:delete', 'listings', 'delete', 'İlan silme'),
  ('listings:feature', 'listings', 'feature', 'İlan öne çıkarma'),
  ('listings:approve', 'listings', 'approve', 'İlan onaylama'),
  ('listings:reject', 'listings', 'reject', 'İlan reddetme'),
  
  -- Categories
  ('categories:view', 'categories', 'view', 'Kategorileri görüntüleme'),
  ('categories:create', 'categories', 'create', 'Kategori oluşturma'),
  ('categories:edit', 'categories', 'edit', 'Kategori düzenleme'),
  ('categories:delete', 'categories', 'delete', 'Kategori silme'),
  ('categories:attributes', 'categories', 'attributes', 'Kategori özellikleri yönetimi'),
  
  -- Users
  ('users:view', 'users', 'view', 'Kullanıcıları görüntüleme'),
  ('users:manage', 'users', 'manage', 'Kullanıcı yönetimi'),
  ('users:ban', 'users', 'ban', 'Kullanıcı yasaklama'),
  ('users:delete', 'users', 'delete', 'Kullanıcı silme'),
  
  -- Admin Management
  ('admins:view', 'admins', 'view', 'Admin kullanıcıları görüntüleme'),
  ('admins:create', 'admins', 'create', 'Admin kullanıcısı oluşturma'),
  ('admins:edit', 'admins', 'edit', 'Admin kullanıcısı düzenleme'),
  ('admins:delete', 'admins', 'delete', 'Admin kullanıcısı silme'),
  ('admins:roles', 'admins', 'roles', 'Admin rol yönetimi'),
  
  -- Reports
  ('reports:view', 'reports', 'view', 'Raporları görüntüleme'),
  ('reports:resolve', 'reports', 'resolve', 'Rapor çözümleme'),
  ('reports:delete', 'reports', 'delete', 'Rapor silme'),
  
  -- Analytics
  ('analytics:view', 'analytics', 'view', 'Analitik görüntüleme'),
  ('analytics:export', 'analytics', 'export', 'Analitik dışa aktarma'),
  ('analytics:reports', 'analytics', 'reports', 'Analitik raporları'),
  
  -- System Settings
  ('settings:view', 'settings', 'view', 'Sistem ayarlarını görüntüleme'),
  ('settings:edit', 'settings', 'edit', 'Sistem ayarlarını düzenleme'),
  
  -- Activity Logs
  ('logs:view', 'logs', 'view', 'Aktivite loglarını görüntüleme'),
  ('logs:export', 'logs', 'export', 'Aktivite loglarını dışa aktarma')
ON CONFLICT (name) DO NOTHING;

-- 8. Assign permissions to roles
-- SUPER_ADMIN gets all permissions
INSERT INTO admin_role_permissions (role, permission_id)
SELECT 'SUPER_ADMIN', id FROM admin_permissions
ON CONFLICT (role, permission_id) DO NOTHING;

-- ADMIN gets most permissions except admin management
INSERT INTO admin_role_permissions (role, permission_id)
SELECT 'ADMIN', id FROM admin_permissions 
WHERE name NOT IN ('admins:create', 'admins:edit', 'admins:delete', 'admins:roles', 'settings:edit')
ON CONFLICT (role, permission_id) DO NOTHING;

-- MODERATOR gets listing and report permissions
INSERT INTO admin_role_permissions (role, permission_id)
SELECT 'MODERATOR', id FROM admin_permissions 
WHERE name IN ('dashboard:view', 'listings:view', 'listings:moderate', 'listings:approve', 'listings:reject', 'reports:view', 'reports:resolve')
ON CONFLICT (role, permission_id) DO NOTHING;

-- SUPPORT gets basic permissions
INSERT INTO admin_role_permissions (role, permission_id)
SELECT 'SUPPORT', id FROM admin_permissions 
WHERE name IN ('dashboard:view', 'reports:view')
ON CONFLICT (role, permission_id) DO NOTHING;

-- CATEGORY_MANAGER gets category and basic permissions
INSERT INTO admin_role_permissions (role, permission_id)
SELECT 'CATEGORY_MANAGER', id FROM admin_permissions 
WHERE name IN ('dashboard:view', 'categories:view', 'categories:create', 'categories:edit', 'categories:attributes', 'reports:view')
ON CONFLICT (role, permission_id) DO NOTHING;

-- ANALYTICS_MANAGER gets analytics and basic permissions
INSERT INTO admin_role_permissions (role, permission_id)
SELECT 'ANALYTICS_MANAGER', id FROM admin_permissions 
WHERE name IN ('dashboard:view', 'analytics:view', 'analytics:export', 'analytics:reports', 'reports:view')
ON CONFLICT (role, permission_id) DO NOTHING;

-- USER_MANAGER gets user and basic permissions
INSERT INTO admin_role_permissions (role, permission_id)
SELECT 'USER_MANAGER', id FROM admin_permissions 
WHERE name IN ('dashboard:view', 'users:view', 'users:manage', 'users:ban', 'reports:view')
ON CONFLICT (role, permission_id) DO NOTHING;

-- CONTENT_MANAGER gets content and basic permissions
INSERT INTO admin_role_permissions (role, permission_id)
SELECT 'CONTENT_MANAGER', id FROM admin_permissions 
WHERE name IN ('dashboard:view', 'listings:view', 'listings:feature', 'categories:view', 'reports:view')
ON CONFLICT (role, permission_id) DO NOTHING;

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_permissions_resource_action ON admin_permissions(resource, action);
CREATE INDEX IF NOT EXISTS idx_admin_role_permissions_role ON admin_role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_admin_user_permissions_admin_id ON admin_user_permissions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_level ON admin_roles(level);

-- 10. Enable RLS on new tables
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- 11. RLS Policies for admin_permissions
CREATE POLICY "Admins can view all permissions" ON admin_permissions
  FOR SELECT USING (true);

-- 12. RLS Policies for admin_role_permissions
CREATE POLICY "Admins can view role permissions" ON admin_role_permissions
  FOR SELECT USING (true);

-- 13. RLS Policies for admin_user_permissions
CREATE POLICY "Admins can view user permissions" ON admin_user_permissions
  FOR SELECT USING (true);

-- 14. RLS Policies for admin_roles
CREATE POLICY "Admins can view all roles" ON admin_roles
  FOR SELECT USING (true);

-- 15. Create function to get user permissions
CREATE OR REPLACE FUNCTION get_admin_permissions(p_admin_id UUID)
RETURNS TABLE(permission_name VARCHAR(100), resource VARCHAR(50), action VARCHAR(50)) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.name::VARCHAR(100), p.resource::VARCHAR(50), p.action::VARCHAR(50)
  FROM admin_permissions p
  LEFT JOIN admin_role_permissions rp ON p.id = rp.permission_id
  LEFT JOIN admin_user_permissions up ON p.id = up.permission_id
  LEFT JOIN admin_users au ON au.id = p_admin_id
  WHERE (rp.role = au.role OR up.admin_id = p_admin_id)
    AND au.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Create function to check if user has permission
CREATE OR REPLACE FUNCTION has_admin_permission(p_admin_id UUID, p_permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM get_admin_permissions(p_admin_id) 
    WHERE permission_name = p_permission_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17. Add updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 18. Add triggers for updated_at
CREATE TRIGGER update_admin_permissions_updated_at 
  BEFORE UPDATE ON admin_permissions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_roles_updated_at 
  BEFORE UPDATE ON admin_roles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 19. Update existing admin_users to use new role system
-- (This will be handled by the application layer)

-- 20. Add comments for documentation
COMMENT ON TABLE admin_permissions IS 'Admin permission definitions';
COMMENT ON TABLE admin_role_permissions IS 'Role-permission mappings';
COMMENT ON TABLE admin_user_permissions IS 'User-specific permission overrides';
COMMENT ON TABLE admin_roles IS 'Admin role definitions with hierarchy levels';
COMMENT ON FUNCTION get_admin_permissions IS 'Get all permissions for an admin user (role + user-specific)';
COMMENT ON FUNCTION has_admin_permission IS 'Check if admin user has specific permission'; 