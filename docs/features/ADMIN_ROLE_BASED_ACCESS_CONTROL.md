# Admin Rol Tabanlı Erişim Sistemi (RBAC)

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Sistem Mimarisi](#sistem-mimarisi)
3. [Rol Hiyerarşisi](#rol-hiyerarşisi)
4. [Permission Sistemi](#permission-sistemi)
5. [Veritabanı Şeması](#veritabanı-şeması)
6. [API Endpoints](#api-endpoints)
7. [Frontend Entegrasyonu](#frontend-entegrasyonu)
8. [Kullanım Kılavuzu](#kullanım-kılavuzu)
9. [Güvenlik Özellikleri](#güvenlik-özellikleri)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Genel Bakış

Benalsam Admin Panel'inde **Rol Tabanlı Erişim Kontrolü (RBAC)** sistemi kurulmuştur. Bu sistem, farklı yetki seviyelerindeki admin kullanıcılarının sadece kendi sorumluluk alanlarına erişmesini sağlar.

### 🎯 Amaçlar

- **Güvenlik**: Her admin sadece gerekli yetkilere sahip olur
- **Esneklik**: Yeni roller ve permission'lar kolayca eklenebilir
- **Ölçeklenebilirlik**: Büyüyen ekip için uygun yapı
- **Audit Trail**: Tüm işlemler loglanır

### 🔧 Teknik Özellikler

- **8 farklı rol** seviyesi
- **30+ permission** kategorisi
- **Role-based** ve **user-specific** permission override
- **Hierarchical** rol sistemi
- **Real-time** permission checking

---

## 🏗️ Sistem Mimarisi

### Backend Mimarisi

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Auth Layer    │    │ Permission      │    │   Database      │
│                 │    │   Service       │    │                 │
│ • JWT Auth      │◄──►│ • Role Check    │◄──►│ • admin_users   │
│ • Middleware    │    │ • Permission    │    │ • admin_roles   │
│ • Route Guard   │    │   Matrix        │    │ • permissions   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Controllers   │    │   API Routes    │    │   RLS Policies  │
│                 │    │                 │    │                 │
│ • Admin Mgmt    │    │ • /admin-       │    │ • Row Level     │
│ • User Mgmt     │    │   management    │    │   Security      │
│ • Role Mgmt     │    │ • /auth         │    │ • Permission    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Frontend Mimarisi

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Auth Store    │    │ Permission      │    │   Components    │
│                 │    │   Hooks         │    │                 │
│ • User State    │◄──►│ • usePermissions│◄──►│ • Route Guard   │
│ • Token Mgmt    │    │ • Menu Filter   │    │ • UI Elements   │
│ • Login/Logout  │    │ • Permission    │    │ • Buttons       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Service   │    │   Layout        │    │   Pages         │
│                 │    │   Components    │    │                 │
│ • HTTP Client   │    │ • Sidebar       │    │ • Admin Mgmt    │
│ • Endpoints     │    │ • Header        │    │ • Categories    │
│ • Error Handle  │    │ • Navigation    │    │ • Listings      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 👥 Rol Hiyerarşisi

### Rol Seviyeleri (0-10)

| Seviye | Rol | Türkçe Adı | Açıklama |
|--------|-----|------------|----------|
| 10 | `SUPER_ADMIN` | Süper Admin | Tam sistem yetkisi |
| 8 | `ADMIN` | Admin | Genel yönetim yetkisi |
| 7 | `USER_MANAGER` | Kullanıcı Yöneticisi | Kullanıcı yönetim yetkisi |
| 7 | `CATEGORY_MANAGER` | Kategori Yöneticisi | Kategori yönetim yetkisi |
| 6 | `ANALYTICS_MANAGER` | Analitik Yöneticisi | Analitik ve rapor yetkisi |
| 6 | `CONTENT_MANAGER` | İçerik Yöneticisi | İçerik yönetim yetkisi |
| 2 | `MODERATOR` | Moderatör | İlan moderasyon yetkisi |
| 1 | `SUPPORT` | Destek | Müşteri desteği yetkisi |

### Rol Özellikleri

#### SUPER_ADMIN
- ✅ Tüm sistemlere erişim
- ✅ Admin kullanıcıları yönetimi
- ✅ Rol ve permission yönetimi
- ✅ Sistem ayarları
- ✅ Audit logları

#### ADMIN
- ✅ Çoğu sisteme erişim
- ❌ Admin yönetimi (sadece görüntüleme)
- ❌ Sistem ayarları
- ✅ Kullanıcı yönetimi
- ✅ İçerik moderasyonu

#### CATEGORY_MANAGER
- ✅ Kategori yönetimi
- ✅ Kategori özellikleri
- ✅ Rapor görüntüleme
- ❌ Kullanıcı yönetimi
- ❌ İlan moderasyonu

#### MODERATOR
- ✅ İlan moderasyonu
- ✅ Rapor çözümleme
- ✅ Dashboard erişimi
- ❌ Kategori yönetimi
- ❌ Kullanıcı yönetimi

#### SUPPORT
- ✅ Rapor görüntüleme
- ✅ Dashboard erişimi
- ❌ İçerik yönetimi
- ❌ Kullanıcı yönetimi

---

## 🔐 Permission Sistemi

### Permission Format

```
{resource}:{action}
```

### Örnekler

```typescript
// Dashboard
'dashboard:view'           // Dashboard görüntüleme

// Listings
'listings:view'           // İlanları görüntüleme
'listings:moderate'       // İlan moderasyonu
'listings:delete'         // İlan silme
'listings:feature'        // İlan öne çıkarma
'listings:approve'        // İlan onaylama
'listings:reject'         // İlan reddetme

// Categories
'categories:view'         // Kategorileri görüntüleme
'categories:create'       // Kategori oluşturma
'categories:edit'         // Kategori düzenleme
'categories:delete'       // Kategori silme
'categories:attributes'   // Kategori özellikleri

// Users
'users:view'             // Kullanıcıları görüntüleme
'users:manage'           // Kullanıcı yönetimi
'users:ban'              // Kullanıcı yasaklama
'users:delete'           // Kullanıcı silme

// Admin Management
'admins:view'            // Admin kullanıcıları görüntüleme
'admins:create'          // Admin kullanıcısı oluşturma
'admins:edit'            // Admin kullanıcısı düzenleme
'admins:delete'          // Admin kullanıcısı silme
'admins:roles'           // Admin rol yönetimi

// Reports
'reports:view'           // Raporları görüntüleme
'reports:resolve'        // Rapor çözümleme
'reports:delete'         // Rapor silme

// Analytics
'analytics:view'         // Analitik görüntüleme
'analytics:export'       // Analitik dışa aktarma
'analytics:reports'      // Analitik raporları

// System Settings
'settings:view'          // Sistem ayarlarını görüntüleme
'settings:edit'          // Sistem ayarlarını düzenleme

// Activity Logs
'logs:view'              // Aktivite loglarını görüntüleme
'logs:export'            // Aktivite loglarını dışa aktarma
```

### Permission Matrix

| Rol | Dashboard | Listings | Categories | Users | Admin Mgmt | Reports | Analytics | Settings |
|-----|-----------|----------|------------|-------|------------|---------|-----------|----------|
| SUPER_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ADMIN | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| USER_MANAGER | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| CATEGORY_MANAGER | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| ANALYTICS_MANAGER | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| CONTENT_MANAGER | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| MODERATOR | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| SUPPORT | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

---

## 🗄️ Veritabanı Şeması

### Ana Tablolar

#### `admin_users`
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN (
    'SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT', 
    'CATEGORY_MANAGER', 'ANALYTICS_MANAGER', 
    'USER_MANAGER', 'CONTENT_MANAGER'
  )),
  permissions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `admin_roles`
```sql
CREATE TABLE admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  level INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `admin_permissions`
```sql
CREATE TABLE admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(resource, action)
);
```

#### `admin_role_permissions`
```sql
CREATE TABLE admin_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(50) NOT NULL,
  permission_id UUID REFERENCES admin_permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role, permission_id)
);
```

#### `admin_user_permissions`
```sql
CREATE TABLE admin_user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES admin_permissions(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(admin_id, permission_id)
);
```

### Yardımcı Fonksiyonlar

#### `get_admin_permissions(p_admin_id UUID)`
```sql
CREATE OR REPLACE FUNCTION get_admin_permissions(p_admin_id UUID)
RETURNS TABLE(permission_name TEXT, resource TEXT, action TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.name, p.resource, p.action
  FROM admin_permissions p
  LEFT JOIN admin_role_permissions rp ON p.id = rp.permission_id
  LEFT JOIN admin_user_permissions up ON p.id = up.permission_id
  LEFT JOIN admin_users au ON au.id = p_admin_id
  WHERE (rp.role = au.role OR up.admin_id = p_admin_id)
    AND au.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### `has_admin_permission(p_admin_id UUID, p_permission_name TEXT)`
```sql
CREATE OR REPLACE FUNCTION has_admin_permission(p_admin_id UUID, p_permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM get_admin_permissions(p_admin_id) 
    WHERE permission_name = p_permission_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🌐 API Endpoints

### Admin Management Endpoints

#### Admin Users
```typescript
// Get all admin users (with pagination and filters)
GET /api/v1/admin-management/users
Query params: page, limit, search, role, isActive

// Get single admin user
GET /api/v1/admin-management/users/:id

// Create new admin user
POST /api/v1/admin-management/users
Body: {
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: string,
  permissions?: string[]
}

// Update admin user
PUT /api/v1/admin-management/users/:id
Body: {
  firstName?: string,
  lastName?: string,
  role?: string,
  isActive?: boolean,
  permissions?: string[]
}

// Delete admin user
DELETE /api/v1/admin-management/users/:id
```

#### Roles
```typescript
// Get all roles
GET /api/v1/admin-management/roles

// Get role details with permissions
GET /api/v1/admin-management/roles/:role

// Update role permissions
PUT /api/v1/admin-management/roles/:role/permissions
Body: {
  permissionIds: string[]
}
```

#### Permissions
```typescript
// Get all permissions
GET /api/v1/admin-management/permissions
Query params: resource

// Get permission matrix
GET /api/v1/admin-management/permissions/matrix

// Get current user permissions
GET /api/v1/admin-management/permissions/current
```

### Authentication Endpoints

```typescript
// Login
POST /api/v1/auth/login
Body: {
  email: string,
  password: string
}

// Logout
POST /api/v1/auth/logout

// Get profile
GET /api/v1/auth/profile
```

### Response Format

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}
```

---

## 🎨 Frontend Entegrasyonu

### Permission Hooks

#### `usePermissions()`
```typescript
import { usePermissions } from '../hooks/usePermissions';

const MyComponent = () => {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    getMenuItems,
    getRoleDisplayName 
  } = usePermissions();

  // Tek permission kontrolü
  if (hasPermission('categories:create')) {
    return <CreateCategoryButton />;
  }

  // Birden fazla permission kontrolü (herhangi biri)
  if (hasAnyPermission(['categories:edit', 'categories:delete'])) {
    return <CategoryActions />;
  }

  // Tüm permission'lar gerekli
  if (hasAllPermissions(['users:view', 'users:manage'])) {
    return <UserManagementPanel />;
  }

  return null;
};
```

#### `usePermission(permission)`
```typescript
import { usePermission } from '../hooks/usePermissions';

const MyComponent = () => {
  const canCreateCategory = usePermission('categories:create');
  const canDeleteUser = usePermission('users:delete');

  return (
    <div>
      {canCreateCategory && <CreateCategoryButton />}
      {canDeleteUser && <DeleteUserButton />}
    </div>
  );
};
```

#### `useResourcePermission(resource, action)`
```typescript
import { useResourcePermission } from '../hooks/usePermissions';

const MyComponent = () => {
  const canViewListings = useResourcePermission('listings', 'view');
  const canModerateListings = useResourcePermission('listings', 'moderate');

  return (
    <div>
      {canViewListings && <ListingsTable />}
      {canModerateListings && <ModerationPanel />}
    </div>
  );
};
```

### Menu Filtering

```typescript
import { usePermissions } from '../hooks/usePermissions';

const Sidebar = () => {
  const { getMenuItems } = usePermissions();
  const menuItems = getMenuItems();

  return (
    <nav>
      {menuItems.map(item => (
        <MenuItem 
          key={item.path}
          name={item.name}
          path={item.path}
          icon={item.icon}
        />
      ))}
    </nav>
  );
};
```

### Route Protection

```typescript
import { usePermission } from '../hooks/usePermissions';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ 
  children, 
  requiredPermission 
}: { 
  children: React.ReactNode;
  requiredPermission: string;
}) => {
  const hasPermission = usePermission(requiredPermission);

  if (!hasPermission) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Kullanım
<Route 
  path="/admin-management" 
  element={
    <ProtectedRoute requiredPermission="admins:view">
      <AdminManagementPage />
    </ProtectedRoute>
  } 
/>
```

### Component-Level Protection

```typescript
import { usePermission } from '../hooks/usePermissions';

const PermissionGuard = ({ 
  children, 
  permission 
}: { 
  children: React.ReactNode;
  permission: string;
}) => {
  const hasPermission = usePermission(permission);

  if (!hasPermission) {
    return null;
  }

  return <>{children}</>;
};

// Kullanım
<PermissionGuard permission="categories:create">
  <CreateCategoryButton />
</PermissionGuard>
```

---

## 📖 Kullanım Kılavuzu

### Yeni Admin Ekleme

#### 1. SUPER_ADMIN ile Giriş
```bash
# Admin panel'e giriş yap
http://localhost:3003
Email: admin@benalsam.com
Password: admin123456
```

#### 2. Admin Management Sayfasına Git
- Sol menüden "Admin Management" seç
- "Admin Kullanıcıları" tab'ına tıkla

#### 3. Yeni Admin Ekle
- "Yeni Admin Ekle" butonuna tıkla
- Form'u doldur:
  ```
  E-posta: kategori.yoneticisi@benalsam.com
  Şifre: GüvenliŞifre123!
  Ad: Kategori
  Soyad: Yöneticisi
  Rol: CATEGORY_MANAGER
  ```
- "Oluştur" butonuna tıkla

#### 4. Doğrulama
- Yeni admin listede görünmeli
- Rol "Kategori Yöneticisi" olarak gösterilmeli
- Sadece kategori sayfalarına erişebilmeli

### Rol Yönetimi

#### 1. Roller Tab'ına Git
- Admin Management > Roller

#### 2. Rol Detaylarını Görüntüle
- İstediğin rolü seç
- "Yetkileri Düzenle" butonuna tıkla

#### 3. Permission'ları Düzenle
- Mevcut permission'ları gör
- Yeni permission'lar ekle
- Gereksiz permission'ları çıkar
- "Kaydet" butonuna tıkla

### Permission Override

#### 1. Admin Detaylarına Git
- Admin listesinden admin'i seç
- "Düzenle" butonuna tıkla

#### 2. User-Specific Permissions
- "Permissions" bölümünde
- Rol permission'larına ek olarak
- Özel permission'lar ekle/çıkar

#### 3. Kaydet
- Değişiklikler anında aktif olur

### Test Senaryoları

#### Senaryo 1: CATEGORY_MANAGER Test
```bash
# 1. CATEGORY_MANAGER ile giriş yap
# 2. Sadece şu sayfalara erişebilmeli:
#    - Dashboard ✅
#    - Categories ✅
#    - Reports ✅
#    - Admin Management ❌
#    - Users ❌
#    - Analytics ❌
```

#### Senaryo 2: Permission Override Test
```bash
# 1. CATEGORY_MANAGER'a 'users:view' permission'ı ekle
# 2. Users sayfasına erişebilmeli ✅
# 3. Ama sadece görüntüleme, yönetim değil ❌
```

#### Senaryo 3: Role Hierarchy Test
```bash
# 1. ADMIN ile giriş yap
# 2. CATEGORY_MANAGER'ı düzenleyebilmeli ✅
# 3. SUPER_ADMIN'ı düzenleyememeli ❌
# 4. Kendini silememeli ❌
```

---

## 🔒 Güvenlik Özellikleri

### 1. Role Hierarchy
- Yüksek seviye roller düşük seviye rolleri yönetebilir
- Kendi seviyesindeki veya üstündeki rolleri yönetemez
- Self-deletion engellenir

### 2. Permission Validation
- Backend'de her request permission kontrolü
- Frontend'de UI elementleri permission'a göre gizlenir
- Route-level protection

### 3. Audit Logging
- Tüm admin işlemleri loglanır
- Permission değişiklikleri takip edilir
- User activity monitoring

### 4. Session Management
- JWT token tabanlı authentication
- Token expiration handling
- Automatic logout on permission change

### 5. Data Protection
- Row Level Security (RLS) policies
- SQL injection protection
- XSS prevention

### Güvenlik Checklist

- [ ] Role hierarchy doğru çalışıyor
- [ ] Permission override güvenli
- [ ] Self-deletion engellenmiş
- [ ] Audit logs tutuluyor
- [ ] Session timeout aktif
- [ ] RLS policies aktif
- [ ] Input validation yapılıyor
- [ ] Error messages güvenli

---

## 🛠️ Troubleshooting

### Yaygın Sorunlar

#### 1. Permission Hatası
```
Error: "Insufficient permissions"
```

**Çözüm:**
```bash
# 1. Kullanıcının rolünü kontrol et
SELECT role FROM admin_users WHERE id = 'user_id';

# 2. Rol permission'larını kontrol et
SELECT * FROM admin_role_permissions WHERE role = 'USER_ROLE';

# 3. User-specific permission'ları kontrol et
SELECT * FROM admin_user_permissions WHERE admin_id = 'user_id';
```

#### 2. Menu Item Görünmüyor
```typescript
// Sorun: Menu item görünmüyor
const menuItems = getMenuItems(); // Boş array dönüyor
```

**Çözüm:**
```typescript
// 1. User permissions'ı kontrol et
console.log('User permissions:', userPermissions);

// 2. Menu structure'ı kontrol et
console.log('Menu structure:', MENU_STRUCTURE[user.role]);

// 3. Permission check'i debug et
const hasPermission = usePermission('required:permission');
console.log('Has permission:', hasPermission);
```

#### 3. API 403 Hatası
```
HTTP 403: Forbidden
```

**Çözüm:**
```bash
# 1. Token'ı kontrol et
curl -H "Authorization: Bearer TOKEN" /api/v1/auth/profile

# 2. Permission'ı kontrol et
SELECT has_admin_permission('user_id', 'required:permission');

# 3. Role hierarchy'yi kontrol et
SELECT level FROM admin_roles WHERE name = 'USER_ROLE';
```

#### 4. Database Migration Hatası
```
Error: role check constraint violation
```

**Çözüm:**
```sql
-- 1. Mevcut constraint'i kaldır
ALTER TABLE admin_users DROP CONSTRAINT admin_users_role_check;

-- 2. Yeni constraint ekle
ALTER TABLE admin_users 
ADD CONSTRAINT admin_users_role_check 
CHECK (role IN (
  'SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT', 
  'CATEGORY_MANAGER', 'ANALYTICS_MANAGER', 
  'USER_MANAGER', 'CONTENT_MANAGER'
));
```

### Debug Komutları

#### Backend Debug
```bash
# Permission check debug
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3002/api/v1/admin-management/permissions/current"

# Role details debug
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3002/api/v1/admin-management/roles/SUPER_ADMIN"

# User permissions debug
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3002/api/v1/admin-management/users/USER_ID"
```

#### Frontend Debug
```typescript
// Browser console'da debug
const { userPermissions, hasPermission } = usePermissions();
console.log('User permissions:', userPermissions);
console.log('Has categories:create:', hasPermission('categories:create'));

// LocalStorage'da token kontrolü
console.log('Token:', localStorage.getItem('admin-auth-storage'));
```

### Performance Optimization

#### 1. Permission Caching
```typescript
// Permission'ları cache'le
const cachedPermissions = useMemo(() => {
  return userPermissions;
}, [userPermissions]);
```

#### 2. Database Indexes
```sql
-- Performance için index'ler
CREATE INDEX idx_admin_role_permissions_role ON admin_role_permissions(role);
CREATE INDEX idx_admin_user_permissions_admin_id ON admin_user_permissions(admin_id);
CREATE INDEX idx_admin_permissions_resource_action ON admin_permissions(resource, action);
```

#### 3. Batch Permission Check
```typescript
// Tek seferde birden fazla permission kontrol et
const { hasAnyPermission } = usePermissions();
const canManageContent = hasAnyPermission([
  'categories:edit',
  'listings:moderate',
  'content:manage'
]);
```

---

## 📚 Ek Kaynaklar

### Dokümantasyon
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [React Permission Patterns](https://reactpatterns.com/#conditional-rendering)
- [RBAC Best Practices](https://en.wikipedia.org/wiki/Role-based_access_control)

### Kod Örnekleri
- [Permission Hook Examples](./examples/permission-hooks.md)
- [API Integration Examples](./examples/api-integration.md)
- [Component Patterns](./examples/component-patterns.md)

### Test Senaryoları
- [Unit Tests](./tests/unit-tests.md)
- [Integration Tests](./tests/integration-tests.md)
- [E2E Tests](./tests/e2e-tests.md)

---

## 📞 Destek

### Teknik Destek
- **Backend Issues**: Backend repository'de issue aç
- **Frontend Issues**: Frontend repository'de issue aç
- **Database Issues**: Supabase dashboard'dan kontrol et

### İletişim
- **Email**: tech@benalsam.com
- **Slack**: #admin-panel-support
- **Documentation**: Bu dokümantasyonu güncel tut

### Katkıda Bulunma
1. Fork yap
2. Feature branch oluştur
3. Değişiklikleri commit et
4. Pull request aç
5. Code review bekle

---

**Son Güncelleme**: 17 Temmuz 2025  
**Versiyon**: 1.0.0  
**Yazar**: Benalsam Development Team 