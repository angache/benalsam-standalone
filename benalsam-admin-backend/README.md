# Benalsam Admin Backend

## ⚠️ **DANGEROUS DEBUG ENDPOINTS**

**⚠️ WARNING: The following endpoints are for development use only and will permanently delete data:**

- `POST /api/v1/elasticsearch/debug/clear-all-listings` - Deletes ALL listings and related data
- `POST /api/v1/elasticsearch/debug/clear-cache` - Clears all search cache

**These endpoints are automatically disabled in production environment.**

**Use with extreme caution!**

---

## Overview

Modern ve güçlü bir admin backend API'si. React Native/Expo mobil uygulaması için kapsamlı yönetim sistemi.

## 🚀 Özellikler

### 🔐 Authentication & Authorization
- JWT tabanlı authentication
- Role-based access control (RBAC)
- Permission-based authorization
- Refresh token sistemi
- Activity logging

### 👥 User Management
- Kullanıcı listesi ve detayları
- Kullanıcı durumu yönetimi
- Trust score yönetimi
- Premium üyelik kontrolü
- Aktivite logları

### 📋 Listing Management
- İlan listesi ve detayları
- İlan onaylama/reddetme
- Kategori yönetimi
- Doping yönetimi
- Moderation sistemi

### 🚨 Reports & Moderation
- Kullanıcı raporları
- Otomatik ve manuel moderation
- Ban/unban sistemi
- Appeal yönetimi

### 📊 Analytics & Reporting
- Dashboard istatistikleri
- Kullanıcı analitikleri
- Gelir raporları
- Export sistemi

### ⚙️ System Management
- Site ayarları
- Email templates
- Cache yönetimi
- Backup sistemi

## 🛠️ Teknoloji Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT + bcrypt
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston
- **File Upload**: Multer + Sharp
- **Email**: Nodemailer
- **Payment**: Stripe
- **Storage**: AWS S3 / Supabase Storage

## 📦 Kurulum

### Gereksinimler
- Node.js 18+
- PostgreSQL 12+
- Redis (opsiyonel)

### 1. Dependencies Yükleme
```bash
npm install
```

### 2. Environment Variables
```bash
cp env.example .env
```

`.env` dosyasını düzenleyin:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/benalsam_admin"

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Other settings...
```

### 3. Database Setup
```bash
# Prisma client generate
npm run db:generate

# Database migration
npm run db:migrate

# Seed database
npm run db:seed
```

### 4. Development Server
```bash
npm run dev
```

## 📚 API Endpoints

### Authentication
```
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh-token
GET    /api/v1/auth/profile
PUT    /api/v1/auth/profile
POST   /api/v1/auth/logout
POST   /api/v1/auth/create-admin (Super Admin only)
```

### Health Check
```
GET    /health
GET    /api/v1/health
```

## 🔧 Scripts

```bash
# Development
npm run dev          # Development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database

# Testing
npm run test         # Run tests
npm run test:watch   # Watch mode

# Code Quality
npm run lint         # ESLint check
npm run lint:fix     # ESLint fix
npm run format       # Prettier format
```

## 🏗️ Proje Yapısı

```
src/
├── config/          # Konfigürasyon dosyaları
├── controllers/     # Route controllers
├── middleware/      # Express middleware
├── models/          # Data models
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
├── types/           # TypeScript types
├── database/        # Database scripts
└── index.ts         # Ana uygulama
```

## 🔒 Güvenlik

- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API koruması
- **Input Validation**: Girdi doğrulama
- **SQL Injection Protection**: Prisma ORM
- **XSS Protection**: Content Security Policy

## 📊 Monitoring

- **Winston**: Structured logging
- **Morgan**: HTTP request logging
- **Health Checks**: Sistem sağlığı
- **Error Tracking**: Hata izleme

## 🚀 Deployment

### Docker
```bash
# Build image
docker build -t benalsam-admin-backend .

# Run container
docker run -p 3001:3001 benalsam-admin-backend
```

### Environment Variables
Production için gerekli environment variables:
- `DATABASE_URL`
- `JWT_SECRET`
- `NODE_ENV=production`
- `PORT`
- `CORS_ORIGIN`

## 📝 API Documentation

Swagger/OpenAPI documentation:
```
GET /api/v1/docs
```

## 🔄 Development Workflow

1. **Feature Branch**: `git checkout -b feature/new-feature`
2. **Development**: Kod yazma ve test
3. **Testing**: `npm run test`
4. **Linting**: `npm run lint`
5. **Commit**: Conventional commits
6. **PR**: Pull request oluşturma
7. **Review**: Code review
8. **Merge**: Main branch'e merge

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Documentation**: [API Docs](./docs)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Email**: admin@benalsam.com

---

**Benalsam Admin Backend** - Modern ve güçlü yönetim sistemi 🚀 