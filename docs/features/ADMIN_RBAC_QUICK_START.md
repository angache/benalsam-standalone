# Admin RBAC - Hızlı Başlangıç Kılavuzu

## 🚀 Hızlı Kurulum

### 1. Migration Çalıştır
```bash
cd packages/mobile
npx supabase db push --include-all
```

### 2. Backend Başlat
```bash
cd packages/admin-backend
npm run dev
```

### 3. Frontend Başlat
```bash
cd packages/admin-ui
npm run dev
```

## 👥 Roller ve Yetkiler

### Rol Hiyerarşisi
```
SUPER_ADMIN (8) > ADMIN (7) > USER_MANAGER (6) > CATEGORY_MANAGER (5) > 
ANALYTICS_MANAGER (4) > CONTENT_MANAGER (3) > MODERATOR (2) > SUPPORT (1)
```

### Varsayılan Giriş
```
Email: admin@benalsam.com
Password: admin123456
Role: SUPER_ADMIN
```

## 🔐 Permission Kullanımı

### Frontend'de Permission Kontrolü
```typescript
import { usePermission, usePermissions } from '../hooks/usePermissions';

// Tek permission kontrolü
const MyComponent = () => {
  const canCreateCategory = usePermission('categories:create');
  
  return (
    <div>
      {canCreateCategory && <CreateCategoryButton />}
    </div>
  );
};

// Birden fazla permission kontrolü
const MyComponent = () => {
  const { hasAnyPermission } = usePermissions();
  
  const canManageContent = hasAnyPermission([
    'categories:edit',
    'listings:moderate'
  ]);
  
  return (
    <div>
      {canManageContent && <ContentManagementPanel />}
    </div>
  );
};
```

### Backend'de Permission Kontrolü
```typescript
import { authMiddleware } from '../middleware/auth';

// Route protection
router.get('/categories', 
  authMiddleware({ requiredPermissions: ['categories:view'] }), 
  categoriesController.getAll
);

// Component protection
router.post('/categories', 
  authMiddleware({ requiredPermissions: ['categories:create'] }), 
  categoriesController.create
);
```

## 📋 Yaygın Kullanım Senaryoları

### 1. Yeni Admin Ekleme
```bash
# 1. SUPER_ADMIN ile giriş yap
# 2. Admin Management > Admin Kullanıcıları
# 3. "Yeni Admin Ekle" butonuna tıkla
# 4. Form'u doldur:
#    - Email: kategori.yoneticisi@benalsam.com
#    - Password: GüvenliŞifre123!
#    - Ad: Kategori
#    - Soyad: Yöneticisi
#    - Rol: CATEGORY_MANAGER
# 5. "Oluştur" butonuna tıkla
```

### 2. Rol Yetkilerini Düzenleme
```bash
# 1. Admin Management > Roller
# 2. İstediğin rolü seç
# 3. "Yetkileri Düzenle" butonuna tıkla
# 4. Permission'ları ekle/çıkar
# 5. "Kaydet" butonuna tıkla
```

### 3. User-Specific Permission Ekleme
```bash
# 1. Admin listesinden admin'i seç
# 2. "Düzenle" butonuna tıkla
# 3. "Permissions" bölümünde özel yetkiler ekle
# 4. "Güncelle" butonuna tıkla
```

## 🎯 Permission Listesi

### Dashboard
- `dashboard:view` - Dashboard görüntüleme

### Listings
- `listings:view` - İlanları görüntüleme
- `listings:moderate` - İlan moderasyonu
- `listings:delete` - İlan silme
- `listings:feature` - İlan öne çıkarma
- `listings:approve` - İlan onaylama
- `listings:reject` - İlan reddetme

### Categories
- `categories:view` - Kategorileri görüntüleme
- `categories:create` - Kategori oluşturma
- `categories:edit` - Kategori düzenleme
- `categories:delete` - Kategori silme
- `categories:attributes` - Kategori özellikleri

### Users
- `users:view` - Kullanıcıları görüntüleme
- `users:manage` - Kullanıcı yönetimi
- `users:ban` - Kullanıcı yasaklama
- `users:delete` - Kullanıcı silme

### Admin Management
- `admins:view` - Admin kullanıcıları görüntüleme
- `admins:create` - Admin kullanıcısı oluşturma
- `admins:edit` - Admin kullanıcısı düzenleme
- `admins:delete` - Admin kullanıcısı silme
- `admins:roles` - Admin rol yönetimi

### Reports
- `reports:view` - Raporları görüntüleme
- `reports:resolve` - Rapor çözümleme
- `reports:delete` - Rapor silme

### Analytics
- `analytics:view` - Analitik görüntüleme
- `analytics:export` - Analitik dışa aktarma
- `analytics:reports` - Analitik raporları

### System Settings
- `settings:view` - Sistem ayarlarını görüntüleme
- `settings:edit` - Sistem ayarlarını düzenleme

### Activity Logs
- `logs:view` - Aktivite loglarını görüntüleme
- `logs:export` - Aktivite loglarını dışa aktarma

## 🛠️ API Endpoints

### Admin Management
```bash
# Admin kullanıcıları listele
GET /api/v1/admin-management/users

# Admin kullanıcısı oluştur
POST /api/v1/admin-management/users

# Admin kullanıcısı güncelle
PUT /api/v1/admin-management/users/:id

# Admin kullanıcısı sil
DELETE /api/v1/admin-management/users/:id

# Rolleri listele
GET /api/v1/admin-management/roles

# Rol yetkilerini güncelle
PUT /api/v1/admin-management/roles/:role/permissions

# Yetkileri listele
GET /api/v1/admin-management/permissions

# Mevcut kullanıcı yetkilerini al
GET /api/v1/admin-management/permissions/current
```

## 🔍 Debug ve Test

### Permission Debug
```typescript
// Browser console'da
const { userPermissions, hasPermission } = usePermissions();
console.log('User permissions:', userPermissions);
console.log('Can create category:', hasPermission('categories:create'));
```

### API Test
```bash
# Permission kontrolü
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3002/api/v1/admin-management/permissions/current"

# Admin listesi
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3002/api/v1/admin-management/users"
```

### Database Sorguları
```sql
-- Kullanıcı yetkilerini kontrol et
SELECT * FROM get_admin_permissions('user_id');

-- Belirli yetkiyi kontrol et
SELECT has_admin_permission('user_id', 'categories:create');

-- Rol yetkilerini görüntüle
SELECT * FROM admin_role_permissions WHERE role = 'CATEGORY_MANAGER';
```

## ⚠️ Yaygın Sorunlar

### 1. "Insufficient permissions" Hatası
**Çözüm:** Kullanıcının rolünü ve yetkilerini kontrol et

### 2. Menu Item Görünmüyor
**Çözüm:** Permission hook'larını debug et

### 3. API 403 Hatası
**Çözüm:** Token'ı ve permission'ları kontrol et

### 4. Migration Hatası
**Çözüm:** `--include-all` flag'i ile migration çalıştır

## 📞 Destek

- **Teknik Sorunlar**: Repository'de issue aç
- **Kullanım Soruları**: Bu dokümantasyonu kontrol et
- **Acil Durumlar**: tech@benalsam.com

---

**Versiyon**: 1.0.0  
**Son Güncelleme**: 17 Temmuz 2025 