# 🧪 Testing Dokümantasyonu

Bu klasör, Benalsam monorepo'su için testing rehberleri ve best practices içerir.

## 📋 İçerik

### 🧪 **Testing Stratejileri**
- Unit testing rehberleri
- Integration testing yaklaşımları
- E2E testing stratejileri
- Performance testing metodları

### 🛠️ **Testing Araçları**
- **Vitest**: Unit testing framework
- **React Testing Library**: Component testing
- **Playwright**: E2E testing
- **Jest**: Legacy testing (gerekirse)

## 🚀 **Hızlı Başlangıç**

### **Web Admin Testing**
```bash
# Web paketinde test çalıştırma
cd benalsam-web
npm run test:run        # Tüm testleri çalıştır
npm run test:coverage   # Coverage raporu
npm run test:ui         # Test UI
```

### **Admin Backend Testing**
```bash
# Admin backend testleri
cd benalsam-admin-backend
npm test               # Unit tests
npm run test:e2e       # E2E tests
```

### **Shared-Types Testing**
```bash
# Shared-types testleri
cd benalsam-shared-types
npm test               # Type checking
npm run test:build     # Build test
```

## 📊 **Test Coverage Hedefleri**

| Paket | Unit Tests | Integration | E2E | Coverage |
|-------|------------|-------------|-----|----------|
| **Web** | ✅ 26 tests | ✅ API tests | 🔄 Planlanıyor | 100% |
| **Admin Backend** | ✅ 15 tests | ✅ DB tests | 🔄 Planlanıyor | 85% |
| **Shared-Types** | ✅ Type tests | ✅ Build tests | ❌ Gerekli değil | 100% |
| **Mobile** | 🔄 Planlanıyor | 🔄 Planlanıyor | 🔄 Planlanıyor | 0% |

## 🧪 **Test Türleri**

### **1. Unit Tests**
- **Amaç**: Tekil fonksiyon ve component testleri
- **Araç**: Vitest + React Testing Library
- **Hedef**: %90+ coverage

### **2. Integration Tests**
- **Amaç**: API ve servis entegrasyon testleri
- **Araç**: Vitest + MSW (Mock Service Worker)
- **Hedef**: Kritik user journey'ler

### **3. E2E Tests**
- **Amaç**: Tam kullanıcı senaryoları
- **Araç**: Playwright
- **Hedef**: Ana user flow'lar

### **4. Performance Tests**
- **Amaç**: Performans ve load testing
- **Araç**: Lighthouse CI
- **Hedef**: Core Web Vitals

## 📝 **Test Yazma Rehberleri**

### **Unit Test Örneği**
```typescript
// src/services/__tests__/adminAuthService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminAuthService } from '../adminAuthService';
import { apiClient } from '../../lib/apiClient';

vi.mock('../../lib/apiClient');

describe('adminAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('başarılı login sonrası kullanıcıyı set eder', async () => {
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

### **Integration Test Örneği**
```typescript
// src/lib/__tests__/apiClient.test.ts
import { describe, it, expect } from 'vitest';
import { apiClient } from '../apiClient';

describe('apiClient', () => {
  it('health check endpoint çalışır', async () => {
    const result = await apiClient.get('/health');
    expect(result.status).toBe('ok');
  });
});
```

## 🔧 **Test Konfigürasyonu**

### **Vitest Config**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
```

### **Test Setup**
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global mocks
global.fetch = vi.fn();
```

## 📊 **Test Metrikleri**

### **Web Admin Integration**
- ✅ **26 Unit Tests** - %100 coverage
- ✅ **API Client Tests** - Tam kapsam
- ✅ **Service Layer Tests** - Tam kapsam
- ✅ **Component Tests** - Temel kapsam

### **Test Sonuçları**
```
Test Files  5 passed (5)
     Tests  26 passed (26)
  Start at  22:56:21
  Duration  1.61s
```

## 🚨 **Test Best Practices**

### **1. Test İsimlendirme**
```typescript
// ✅ İyi
it('başarılı login sonrası kullanıcıyı set eder', async () => {});

// ❌ Kötü
it('test1', async () => {});
```

### **2. Mock Kullanımı**
```typescript
// ✅ İyi - Mock API calls
vi.mock('../../lib/apiClient');

// ✅ İyi - Clear mocks
beforeEach(() => {
  vi.clearAllMocks();
});
```

### **3. Assertion Stratejisi**
```typescript
// ✅ İyi - Specific assertions
expect(result.success).toBe(true);
expect(apiClient.post).toHaveBeenCalledWith('/auth/login', credentials);

// ❌ Kötü - Generic assertions
expect(result).toBeTruthy();
```

## 🔄 **CI/CD Integration**

### **GitHub Actions**
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:coverage
```

## 📞 **Destek**

Testing ile ilgili sorularınız için:
- **GitHub Issues**: Test sorunları ve öneriler
- **Pull Request**: Test iyileştirmeleri
- **Slack**: #benalsam-testing

---

**Son Güncelleme**: 2024-01-XX  
**Durum**: Aktif Geliştirme 🚧 