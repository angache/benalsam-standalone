# 🌐 Web Admin Backend Entegrasyonu Dokümantasyonu

## 📋 İçindekiler

1. [Proje Genel Bakış](#proje-genel-bakış)
2. [Mimari Yapı](#mimari-yapı)
3. [Kurulum ve Geliştirme](#kurulum-ve-geliştirme)
4. [API Entegrasyonu](#api-entegrasyonu)
5. [Servis Katmanı](#servis-katmanı)
6. [Test Stratejisi](#test-stratejisi)
7. [Production Deployment](#production-deployment)
8. [Monitoring ve Güvenlik](#monitoring-ve-güvenlik)
9. [Troubleshooting](#troubleshooting)
10. [API Referansı](#api-referansı)

---

## 🎯 Proje Genel Bakış

### Amaç
Web admin panelini admin-backend (a-b) ile tam entegre hale getirmek, modern web teknolojileri kullanarak production-ready bir sistem oluşturmak.

### Teknoloji Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express (admin-backend)
- **State Management**: React Query + Zustand
- **Testing**: Vitest + React Testing Library
- **Build Tool**: Vite
- **Monitoring**: Sentry + Performance Monitoring
- **CI/CD**: GitHub Actions

### Proje Yapısı
```
packages/web/
├── src/
│   ├── components/          # React bileşenleri
│   ├── services/           # API servisleri
│   ├── lib/               # Utility kütüphaneleri
│   ├── config/            # Konfigürasyon dosyaları
│   ├── types/             # TypeScript tipleri
│   └── __tests__/         # Test dosyaları
├── scripts/               # Build ve utility scriptleri
├── vite.config.ts         # Vite konfigürasyonu
├── package.json           # Bağımlılıklar ve scriptler
└── tsconfig.json          # TypeScript konfigürasyonu
```

---

## 🏗️ Mimari Yapı

### Katmanlı Mimari
```
┌─────────────────────────────────────┐
│           UI Layer                  │
│  (React Components + Pages)         │
├─────────────────────────────────────┤
│         Service Layer               │
│  (API Services + Business Logic)    │
├─────────────────────────────────────┤
│         API Layer                   │
│  (HTTP Client + Authentication)     │
├─────────────────────────────────────┤
│         Backend API                 │
│  (admin-backend / a-b)              │
└─────────────────────────────────────┘
```

### Veri Akışı
1. **UI Layer**: Kullanıcı etkileşimleri
2. **Service Layer**: İş mantığı ve API çağrıları
3. **API Layer**: HTTP istekleri ve authentication
4. **Backend**: Veri işleme ve veritabanı işlemleri

---

## 🚀 Kurulum ve Geliştirme

### Gereksinimler
- Node.js 18+
- npm veya yarn
- Git

### Kurulum
```bash
# Monorepo root'unda
cd benalsam-monorepo/packages/web

# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

### Geliştirme Komutları
```bash
# Geliştirme sunucusu
npm run dev

# Production build
npm run build

# Test çalıştırma
npm run test:run

# Test coverage
npm run test:coverage

# Linting
npm run lint

# Type checking
npm run type-check

# Security audit
npm run security-audit
```

### Environment Variables
```bash
# .env.local (geliştirme için)
VITE_ADMIN_API_URL=http://localhost:3002/api/v1
VITE_ADMIN_WS_URL=ws://localhost:3002
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ADMIN_FEATURES=true
VITE_SENTRY_DSN=your-sentry-dsn
```

---

## 🔌 API Entegrasyonu

### API Client Yapısı
```typescript
// src/lib/apiClient.ts
export class ApiClient {
  private baseURL: string;
  private token: string | null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = null;
  }

  // HTTP metodları
  async get<T>(endpoint: string, params?: any): Promise<ApiResponse<T>>
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>>
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>>
  async delete<T>(endpoint: string): Promise<ApiResponse<T>>

  // Authentication
  setToken(token: string): void
  getToken(): string | null
  clearAuth(): void
}
```

### Authentication Flow
```typescript
// Login işlemi
const response = await adminAuthService.login({
  email: 'admin@example.com',
  password: 'password'
});

if (response.success) {
  // Token otomatik olarak set edilir
  // Kullanıcı bilgileri cache'lenir
}
```

### Error Handling
```typescript
// Global error handling
try {
  const result = await apiClient.get('/admin/users');
  if (!result.success) {
    throw new Error(result.error?.message);
  }
} catch (error) {
  // Error boundary veya toast notification
  console.error('API Error:', error);
}
```

---

## 🔧 Servis Katmanı

### Admin Authentication Service
```typescript
// src/services/adminAuthService.ts
export class AdminAuthService {
  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse>
  
  // Logout
  async logout(): Promise<void>
  
  // Token refresh
  async refreshToken(): Promise<AuthResponse>
  
  // State management
  isAuthenticated(): boolean
  getCurrentUser(): AdminUser | null
}
```

### Admin Management Service
```typescript
// src/services/adminManagementService.ts
export class AdminManagementService {
  // User management
  static async getAdminUsers(filters?: UserFilters): Promise<ApiResponse<AdminUsersResponse>>
  static async getAdminUser(id: string): Promise<ApiResponse<AdminUser>>
  static async createAdminUser(userData: CreateAdminUserData): Promise<ApiResponse<AdminUser>>
  static async updateAdminUser(id: string, updates: Partial<AdminUser>): Promise<ApiResponse<AdminUser>>
  static async deleteAdminUser(id: string): Promise<ApiResponse<void>>
  
  // Statistics
  static async getAdminUserStats(): Promise<ApiResponse<AdminStats>>
}
```

### Listing Management Service
```typescript
// src/services/listingService/adminFetchers.ts
export class AdminListingFetchers {
  // Listing operations
  static async fetchAdminListings(filters?: ListingFilters): Promise<ApiResponse<ListingsResponse>>
  static async fetchAdminListing(id: string): Promise<ApiResponse<AdminListing>>
  static async updateAdminListing(id: string, updates: Partial<AdminListing>): Promise<ApiResponse<AdminListing>>
  static async deleteAdminListing(id: string): Promise<ApiResponse<void>>
  
  // Moderation
  static async moderateListing(id: string, action: ModerationAction): Promise<ApiResponse<void>>
  static async bulkModerateListings(ids: string[], action: ModerationAction): Promise<ApiResponse<void>>
  
  // Analytics
  static async getListingAnalytics(): Promise<ApiResponse<ListingAnalytics>>
}
```

---

## 🧪 Test Stratejisi

### Test Piramidi
```
        E2E Tests (2%)
    ┌─────────────────┐
    │ Integration     │
    │ Tests (18%)     │
    └─────────────────┘
┌─────────────────────────┐
│   Unit Tests (80%)      │
└─────────────────────────┘
```

### Unit Test Örnekleri
```typescript
// src/services/__tests__/adminAuthService.test.ts
describe('adminAuthService', () => {
  it('başarılı login sonrası kullanıcıyı ve tokenı set eder', async () => {
    // Mock API response
    (apiClient.post as any).mockResolvedValue({
      success: true,
      data: { user: mockUser, token: 'mock-token' }
    });

    const result = await adminAuthService.login(credentials);
    
    expect(result.success).toBe(true);
    expect(adminAuthService.isAuthenticated()).toBe(true);
  });
});
```

### Test Coverage Hedefleri
- **Unit Tests**: %90+
- **Integration Tests**: %80+
- **E2E Tests**: Kritik user journey'ler

### Test Komutları
```bash
# Tüm testleri çalıştır
npm run test:run

# Watch mode
npm run test

# Coverage raporu
npm run test:coverage

# UI test runner
npm run test:ui
```

---

## 🚀 Production Deployment

### Build Optimizasyonları
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          admin: ['@/services/adminAuthService'],
          charts: ['recharts'],
        },
      },
    },
  },
});
```

### Environment Configuration
```typescript
// src/config/environment.ts
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const isProduction = import.meta.env.PROD;
  const isStaging = import.meta.env.VITE_STAGING === 'true';
  
  return {
    adminApi: {
      url: isProduction 
        ? 'https://your-domain.com/api/v1'
        : 'http://localhost:3002/api/v1',
    },
    features: {
      enableAnalytics: isProduction,
      enableAdminFeatures: true,
    },
    monitoring: {
      enableErrorTracking: isProduction,
      sentryDsn: import.meta.env.VITE_SENTRY_DSN,
    },
  };
};
```

### CI/CD Pipeline
```yaml
# .github/workflows/web-deploy.yml
name: Web Admin Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:run
      - run: npm run type-check

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build:prod
      - uses: actions/upload-artifact@v3
        with:
          name: web-build
          path: dist/

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: web-build
      - name: Deploy to production
        run: echo "Deploy to production server"
```

---

## 🔍 Monitoring ve Güvenlik

### Monitoring Service
```typescript
// src/lib/monitoring.ts
export class MonitoringService {
  // Performance monitoring
  recordPerformanceMetric(metric: PerformanceMetric): void
  
  // Error tracking
  recordError(error: ErrorEvent): void
  
  // Analytics
  recordAnalyticsEvent(event: AnalyticsEvent): void
}
```

### Security Audit
```bash
# Security audit çalıştır
npm run security-audit

# Dependency vulnerabilities
npm audit

# Custom security checks
node scripts/security-audit.cjs
```

### Security Checklist
- [ ] Sensitive data kontrolü
- [ ] Dependency vulnerabilities
- [ ] Environment variables
- [ ] CORS configuration
- [ ] Input validation
- [ ] HTTPS usage
- [ ] Rate limiting
- [ ] Authentication/Authorization

---

## 🔧 Troubleshooting

### Yaygın Sorunlar

#### 1. TypeScript Hataları
```bash
# Type check bypass (geçici çözüm)
npm run build  # tsc && vite build yerine sadece vite build

# Type errors düzeltme
npm run type-check
```

#### 2. API Connection Issues
```typescript
// Environment kontrolü
console.log('API URL:', env.adminApi.url);
console.log('Environment:', env.isDevelopment ? 'dev' : 'prod');
```

#### 3. Authentication Problems
```typescript
// Token kontrolü
console.log('Token:', apiClient.getToken());
console.log('Auth status:', adminAuthService.isAuthenticated());
```

#### 4. Build Failures
```bash
# Clean build
rm -rf node_modules dist
npm install
npm run build
```

### Debug Modu
```typescript
// Debug logging aktifleştir
localStorage.setItem('debug', 'true');

// API debug mode
apiClient.setDebugMode(true);
```

---

## 📚 API Referansı

### Authentication Endpoints

#### POST /api/v1/auth/login
```typescript
// Request
{
  email: string;
  password: string;
}

// Response
{
  success: boolean;
  data?: {
    user: AdminUser;
    token: string;
    refreshToken: string;
    expiresIn: number;
  };
  error?: {
    code: string;
    message: string;
  };
}
```

#### POST /api/v1/auth/logout
```typescript
// Response
{
  success: boolean;
  data?: {
    message: string;
  };
}
```

### User Management Endpoints

#### GET /api/v1/admin/users
```typescript
// Query Parameters
{
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Response
{
  success: boolean;
  data?: {
    users: AdminUser[];
    total: number;
    page: number;
    limit: number;
  };
}
```

#### POST /api/v1/admin/users
```typescript
// Request
{
  email: string;
  password: string;
  role: 'admin' | 'moderator' | 'super_admin';
  name: string;
  permissions?: string[];
}

// Response
{
  success: boolean;
  data?: AdminUser;
}
```

### Listing Management Endpoints

#### GET /api/v1/admin/listings
```typescript
// Query Parameters
{
  status?: 'active' | 'pending' | 'rejected';
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Response
{
  success: boolean;
  data?: {
    listings: AdminListing[];
    total: number;
    page: number;
    limit: number;
  };
}
```

#### PUT /api/v1/admin/listings/:id
```typescript
// Request
{
  status?: 'active' | 'pending' | 'rejected';
  is_featured?: boolean;
  moderation_notes?: string;
}

// Response
{
  success: boolean;
  data?: AdminListing;
}
```

### Analytics Endpoints

#### GET /api/v1/analytics/listings
```typescript
// Response
{
  success: boolean;
  data?: {
    totalListings: number;
    activeListings: number;
    pendingListings: number;
    rejectedListings: number;
    featuredListings: number;
    recentActivity: ActivityItem[];
  };
}
```

---

## 📝 Changelog

### v1.0.0 (2024-01-XX)
- ✅ Initial web admin backend integration
- ✅ Complete authentication system
- ✅ User management functionality
- ✅ Listing management and moderation
- ✅ Analytics dashboard
- ✅ Comprehensive testing suite
- ✅ Production deployment pipeline
- ✅ Monitoring and security audit
- ✅ Performance optimizations

---

## 🤝 Katkıda Bulunma

### Geliştirme Süreci
1. Feature branch oluştur
2. Kod yaz ve test et
3. Pull request aç
4. Code review bekle
5. Merge et

### Kod Standartları
- TypeScript strict mode
- ESLint + Prettier
- Conventional commits
- Test coverage %90+

### Commit Mesajları
```
feat: yeni özellik eklendi
fix: hata düzeltildi
docs: dokümantasyon güncellendi
test: test eklendi
refactor: kod refactor edildi
```

---

## 📞 Destek

### İletişim
- **Teknik Sorunlar**: GitHub Issues
- **Acil Durumlar**: Slack #web-admin
- **Dokümantasyon**: Bu dosya

### Faydalı Linkler
- [Admin Backend API Docs](../admin-backend/README.md)
- [Vite Documentation](https://vitejs.dev/)
- [React Query Docs](https://tanstack.com/query/latest)
- [Vitest Documentation](https://vitest.dev/)

---

**Son Güncelleme**: 2024-01-XX  
**Versiyon**: 1.0.0  
**Durum**: Production Ready ✅ 