# 📊 Benalsam Test Coverage

Bu klasör, Benalsam microservices'lerinin test coverage raporlarını yönetir ve analiz eder.

## 📋 İçerik

### Konfigürasyon
- `jest.config.js` - Tüm servisler için coverage konfigürasyonu
- `package.json` - Coverage scripts ve dependencies

### Scripts
- `scripts/generate-coverage-report.js` - Kapsamlı coverage raporu oluşturur
- `scripts/generate-coverage-badge.js` - Coverage badge'i oluşturur

## 🚀 Kullanım

### Coverage Raporu Oluşturma

```bash
# Tüm servislerin coverage'ını çalıştır
npm run test:coverage

# HTML raporu oluştur
npm run test:coverage:html

# JSON raporu oluştur
npm run test:coverage:json

# CI için optimize edilmiş rapor
npm run test:coverage:ci
```

### Coverage Analizi

```bash
# Kapsamlı rapor oluştur
npm run coverage:report

# Coverage badge oluştur
npm run coverage:badge

# HTML raporunu serve et
npm run coverage:serve
```

### Temizlik

```bash
# Coverage dosyalarını temizle
npm run coverage:clean
```

## 📊 Coverage Metrikleri

### Thresholds (Eşikler)
- **Lines:** 80%
- **Functions:** 80%
- **Branches:** 80%
- **Statements:** 80%

### Kapsanan Servisler
- ✅ Queue Service
- ✅ Search Service
- ✅ Categories Service
- ✅ Upload Service
- ✅ Shared Types

## 🎯 Coverage Raporu Örneği

```
🎯 BENALSAM COVERAGE REPORT
==================================================
📅 Generated: 2025-09-21T21:58:00.000Z

📊 OVERALL SUMMARY:
   Lines:      85.2% (1,234/1,448)
   Functions:  88.7% (234/264)
   Branches:   82.1% (456/555)
   Statements: 86.3% (1,456/1,687)

🔧 SERVICE BREAKDOWN:
   benalsam-queue-service:
     Lines:      87.5% (234/267)
     Functions:  90.2% (45/50)
     Branches:   85.1% (123/145)
     Statements: 88.9% (267/300)
   
   benalsam-search-service:
     Lines:      84.1% (345/410)
     Functions:  87.3% (67/77)
     Branches:   80.2% (156/195)
     Statements: 85.6% (410/479)
   
   benalsam-categories-service:
     Lines:      83.7% (234/279)
     Functions:  86.4% (38/44)
     Branches:   79.8% (89/112)
     Statements: 84.2% (279/331)
   
   benalsam-upload-service:
     Lines:      85.9% (321/374)
     Functions:  89.1% (49/55)
     Branches:   83.2% (67/81)
     Statements: 86.8% (374/431)
   
   benalsam-shared-types:
     Lines:      86.8% (100/115)
     Functions:  90.0% (35/39)
     Branches:   85.7% (21/25)
     Statements: 87.8% (126/146)

🎯 COVERAGE THRESHOLDS:
   LINES: ✅ 85.2% (threshold: 80%)
   FUNCTIONS: ✅ 88.7% (threshold: 80%)
   BRANCHES: ✅ 82.1% (threshold: 80%)
   STATEMENTS: ✅ 86.3% (threshold: 80%)

🎉 All coverage thresholds passed!
==================================================
```

## 🔧 Konfigürasyon

### Jest Configuration
```javascript
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  collectCoverageFrom: [
    '**/src/**/*.ts',
    '!**/src/**/*.d.ts',
    '!**/src/**/*.test.ts',
    '!**/src/**/*.spec.ts',
    '!**/src/**/__tests__/**',
    '!**/src/**/index.ts'
  ]
};
```

### Coverage Reporters
- **text** - Console output
- **text-summary** - Özet bilgi
- **lcov** - LCOV format (CI/CD için)
- **html** - HTML raporu
- **json** - JSON format
- **json-summary** - JSON özet

## 📈 CI/CD Integration

### GitHub Actions
```yaml
- name: Run Tests with Coverage
  run: |
    cd test-coverage
    npm install
    npm run test:coverage:ci

- name: Generate Coverage Report
  run: |
    cd test-coverage
    npm run coverage:report
    npm run coverage:badge

- name: Upload Coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    file: ./test-coverage/coverage/lcov.info
```

### Coverage Badge
```markdown
![Coverage](https://img.shields.io/badge/coverage-85.2%25-brightgreen)
```

## 🎯 Best Practices

### Test Coverage Stratejisi
1. **Unit Tests** - Individual functions ve methods
2. **Integration Tests** - Service interactions
3. **E2E Tests** - Complete workflows
4. **Error Scenarios** - Exception handling
5. **Edge Cases** - Boundary conditions

### Coverage Artırma
1. **Uncovered Lines** - Eksik test case'leri ekle
2. **Uncovered Branches** - Conditional logic'i test et
3. **Uncovered Functions** - Public method'ları test et
4. **Dead Code** - Kullanılmayan kod'u temizle

### Quality Gates
- Minimum 80% coverage
- Critical path'ler %100 coverage
- New code %90+ coverage
- Regression test'ler

## 🔍 Coverage Analizi

### Düşük Coverage Nedenleri
1. **Complex Logic** - Karmaşık business logic
2. **Error Handling** - Exception scenarios
3. **Integration Points** - External service calls
4. **Legacy Code** - Eski, test edilmemiş kod

### Coverage Artırma Teknikleri
1. **Mocking** - External dependencies
2. **Stubbing** - Complex operations
3. **Test Data** - Realistic test scenarios
4. **Parameterized Tests** - Multiple inputs

## 📊 Monitoring

### Coverage Trends
- Günlük coverage raporları
- Haftalık trend analizi
- Release öncesi coverage check
- PR coverage validation

### Alerts
- Coverage düşüşü
- Threshold violation
- New uncovered code
- Critical path coverage

## 🎯 Gelecek Geliştirmeler

- [ ] Coverage trend dashboard
- [ ] Automated coverage reports
- [ ] Coverage-based PR reviews
- [ ] Coverage history tracking
- [ ] Performance impact analysis
