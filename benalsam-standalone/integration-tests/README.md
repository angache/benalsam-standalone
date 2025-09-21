# 🧪 Benalsam Integration Tests

Bu klasör, Benalsam microservices'lerinin birlikte çalışmasını test eden integration testlerini içerir.

## 📋 İçerik

### Test Dosyaları
- `setup.ts` - Test ortamı kurulumu ve yardımcı fonksiyonlar
- `service-registry.test.ts` - Service Registry entegrasyon testleri
- `end-to-end.test.ts` - End-to-end workflow testleri

### Konfigürasyon
- `jest.config.js` - Jest test konfigürasyonu
- `package.json` - Test dependencies ve scripts

## 🚀 Kullanım

### Önkoşullar
Tüm microservices'lerin çalışır durumda olması gerekir:

```bash
# Terminal 1: Admin Backend
cd benalsam-admin-backend && npm run dev

# Terminal 2: Queue Service
cd benalsam-queue-service && npm run dev

# Terminal 3: Search Service
cd benalsam-search-service && npm run dev

# Terminal 4: Categories Service
cd benalsam-categories-service && npm run dev

# Terminal 5: Cache Service
cd benalsam-cache-service && npm run dev

# Terminal 6: Backup Service
cd benalsam-backup-service && npm run dev

# Terminal 7: Upload Service
cd benalsam-upload-service && npm run dev
```

### Test Çalıştırma

```bash
# Tüm integration testleri çalıştır
npm test

# Service Registry testleri
npm run test:services

# End-to-end testleri
npm run test:e2e

# Coverage raporu ile
npm run test:coverage

# Watch mode
npm run test:watch
```

## 🧪 Test Kategorileri

### 1. Service Registry Tests
- Service health checks
- Service communication
- Service metrics
- Error handling

### 2. End-to-End Tests
- Complete workflow tests
- Service intercommunication
- Error handling and resilience
- Performance and monitoring

## ⚙️ Konfigürasyon

### Environment Variables
Testler aşağıdaki environment variable'ları kullanır:

```bash
# Service URLs (default values)
ADMIN_BACKEND_URL=http://localhost:3002
QUEUE_SERVICE_URL=http://localhost:3012
SEARCH_SERVICE_URL=http://localhost:3016
CATEGORIES_SERVICE_URL=http://localhost:3015
CACHE_SERVICE_URL=http://localhost:3014
BACKUP_SERVICE_URL=http://localhost:3013
UPLOAD_SERVICE_URL=http://localhost:3007
```

### Test Timeouts
- Service startup timeout: 30 saniye
- Request timeout: 10 saniye
- Health check interval: 2 saniye
- Test timeout: 2 dakika

## 📊 Test Sonuçları

### Başarılı Test Örneği
```
✅ Service Registry Integration Tests
  ✅ Service Registry Health Checks
    ✅ should return overall system health
    ✅ should return individual service health
    ✅ should list all registered services
  ✅ Service Communication
    ✅ should proxy search requests to Search Service
    ✅ should proxy category requests to Categories Service
    ✅ should handle service failures gracefully

✅ End-to-End Integration Tests
  ✅ Complete Workflow Tests
    ✅ should handle complete listing creation workflow
    ✅ should handle file upload workflow
    ✅ should handle search and cache integration
  ✅ Service Intercommunication
    ✅ should handle Admin Backend to Search Service communication
    ✅ should handle Admin Backend to Categories Service communication
    ✅ should handle cross-service data consistency
```

## 🔧 Troubleshooting

### Servisler Başlamıyor
```bash
# Port kontrolü
lsof -i :3002  # Admin Backend
lsof -i :3012  # Queue Service
lsof -i :3016  # Search Service
lsof -i :3015  # Categories Service
lsof -i :3014  # Cache Service
lsof -i :3013  # Backup Service
lsof -i :3007  # Upload Service
```

### Test Timeout
- Servislerin tam olarak başladığından emin olun
- Environment variable'ları kontrol edin
- Network bağlantısını kontrol edin

### Health Check Failures
- Her servisin `/api/v1/health` endpoint'ini kontrol edin
- Log dosyalarını inceleyin
- Database bağlantılarını kontrol edin

## 📈 Performance Metrics

Testler aşağıdaki performance metriklerini ölçer:
- Response time
- Service availability
- Error rates
- Throughput

## 🔄 CI/CD Integration

Bu testler CI/CD pipeline'ında şu şekilde kullanılabilir:

```yaml
# GitHub Actions örneği
- name: Run Integration Tests
  run: |
    cd integration-tests
    npm install
    npm test
```

## 📝 Test Yazma Rehberi

### Yeni Test Ekleme
1. Test dosyasını `*.test.ts` formatında oluşturun
2. `setup.ts`'den yardımcı fonksiyonları kullanın
3. `TEST_CONFIG`'den service URL'lerini alın
4. Proper error handling ekleyin
5. Timeout'ları ayarlayın

### Best Practices
- Her test bağımsız olmalı
- Cleanup işlemlerini unutmayın
- Realistic test data kullanın
- Error scenarios'ları test edin
- Performance assertions ekleyin

## 🎯 Gelecek Geliştirmeler

- [ ] Load testing integration
- [ ] Chaos engineering tests
- [ ] Security testing
- [ ] Database migration tests
- [ ] API versioning tests
