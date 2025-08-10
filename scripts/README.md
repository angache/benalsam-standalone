# 📁 Scripts Klasörü

## **🎯 Güncel Scriptler (Aktif)**

### **Environment Yönetimi:**
- `setup-env.sh` - Merkezi environment setup
- `copy-env-to-packages.sh` - Environment'ı paketlere kopyala

### **Development:**
- `dev-start.sh` - Local development workflow
- `docker-dev.sh` - Docker development

### **Deployment:**
- `deploy-vps.sh` - Full VPS deployment
- `deploy-vps-minimal.sh` - Minimal VPS deployment (4GB RAM)

### **Testing:**
- `docker-build-test.sh` - Docker build testleri
- `docker-compose-test.sh` - Docker compose testleri
- `integration-test.sh` - Integration testleri
- `run-all-tests.sh` - Tüm testleri çalıştır

### **Performance & Security:**
- `cache-performance.sh` - Cache performance testleri
- `security-scan.sh` - Security scanning

## **📋 Kullanım Sırası:**

### **1. İlk Kurulum:**
```bash
# Environment setup
./scripts/setup-env.sh

# Dependencies install
pnpm install

# Environment'ı paketlere kopyala
./scripts/copy-env-to-packages.sh
```

### **2. Development:**
```bash
# Local development
./scripts/dev-start.sh

# Veya Docker ile
./scripts/docker-dev.sh
```

### **3. Production:**
```bash
# Minimal VPS (4GB RAM)
./scripts/deploy-vps-minimal.sh

# Veya full deployment
./scripts/deploy-vps.sh
```

### **4. Testing:**
```bash
# Tüm testleri çalıştır
./scripts/run-all-tests.sh

# Docker testleri
./scripts/docker-build-test.sh
```

## **🗂️ Deprecated Scriptler**

Eski scriptler `deprecated/scripts/` klasöründe bulunuyor:

- `start-admin-all.sh` - Eski npm tabanlı admin başlatma
- `stop-admin-all.sh` - Eski npm tabanlı admin durdurma
- `deploy.sh` - Eski deployment script
- `copy-env-to-vps.sh` - Eski VPS env kopyalama
- `admin-status.sh` - Eski admin durum kontrolü

## **🔧 Script Detayları**

### **setup-env.sh**
- Root .env dosyası oluşturur
- Tüm paketler için env dosyaları oluşturur
- Template değerlerle başlar

### **copy-env-to-packages.sh**
- Root .env'yi tüm paketlere kopyalar
- .gitignore güncellemeleri yapar

### **dev-start.sh**
- Local development için tüm servisleri başlatır
- Background process'ler yönetir

### **docker-dev.sh**
- Docker ile development
- Hot reload desteği

### **deploy-vps.sh**
- Production deployment
- Health check'ler
- Resource monitoring

## **🚀 Quick Start**

```bash
# 1. Environment setup
./scripts/setup-env.sh

# 2. Dependencies
pnpm install

# 3. Environment'ı paketlere kopyala
./scripts/copy-env-to-packages.sh

# 4. Development başlat
./scripts/dev-start.sh
```

## **📊 Monitoring**

### **Health Checks:**
```bash
# Admin Backend
curl http://localhost:3002/health

# Admin UI
curl http://localhost:3003/

# Web
curl http://localhost:5173/
```

### **Logs:**
```bash
# Docker logs
docker-compose logs -f admin-backend
docker-compose logs -f admin-ui
docker-compose logs -f web
``` 