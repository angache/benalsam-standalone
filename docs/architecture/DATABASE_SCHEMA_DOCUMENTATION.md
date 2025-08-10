# 🗄️ Database Schema Documentation - Benalsam

## 📋 Genel Bakış
Bu döküman, Benalsam uygulamasının veritabanı şemasını, tablo yapılarını, ilişkileri ve veri modellerini detaylandırır.

## 🏗️ Veritabanı Mimarisi

### Teknoloji Stack
- **Database:** PostgreSQL 15+
- **ORM:** Prisma
- **Migration Tool:** Prisma Migrate
- **Seeding:** Prisma Seed
- **Connection Pool:** PgBouncer (production)

### Veritabanı Bağlantısı
```typescript
// Database URL Format
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"

// Production
DATABASE_URL="postgresql://benalsam_user:secure_password@localhost:5432/benalsam_prod"

// Development
DATABASE_URL="postgresql://benalsam_dev:dev_password@localhost:5432/benalsam_dev"
```

## 📊 Tablo Yapıları

### 👥 Users Tablosu
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role USER_ROLE DEFAULT 'user',
  status USER_STATUS DEFAULT 'active',
  email_verified BOOLEAN DEFAULT false,
  phone VARCHAR(20),
  avatar_url TEXT,
  location JSONB,
  preferences JSONB DEFAULT '{}',
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### 🏷️ Categories Tablosu
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_active ON categories(active);
CREATE INDEX idx_categories_level ON categories(level);
```

### 📋 Listings Tablosu
```sql
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'TRY',
  status LISTING_STATUS DEFAULT 'active',
  condition CONDITION_TYPE,
  location JSONB NOT NULL,
  images JSONB DEFAULT '[]',
  attributes JSONB DEFAULT '{}',
  views_count INTEGER DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_category_id ON listings(category_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_created_at ON listings(created_at);
CREATE INDEX idx_listings_location ON listings USING GIN(location);
```

### 🖼️ Images Tablosu
```sql
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  filename VARCHAR(255),
  mime_type VARCHAR(100),
  size INTEGER,
  width INTEGER,
  height INTEGER,
  is_main BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  storage_provider VARCHAR(50) DEFAULT 'supabase',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_images_listing_id ON images(listing_id);
CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_is_main ON images(is_main);
```

### 💬 Messages Tablosu
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type MESSAGE_TYPE DEFAULT 'text',
  metadata JSONB DEFAULT '{}',
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

### 💭 Conversations Tablosu
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  participant1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(participant1_id, participant2_id, listing_id)
);

-- Indexes
CREATE INDEX idx_conversations_participant1 ON conversations(participant1_id);
CREATE INDEX idx_conversations_participant2 ON conversations(participant2_id);
CREATE INDEX idx_conversations_listing_id ON conversations(listing_id);
```

### ⭐ Reviews Tablosu
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewed_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  response TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewed_user_id ON reviews(reviewed_user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
```

### 🔖 Favorites Tablosu
```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, listing_id)
);

-- Indexes
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_listing_id ON favorites(listing_id);
```

### 🚫 Blocked_Users Tablosu
```sql
CREATE TABLE blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(blocker_id, blocked_id)
);

-- Indexes
CREATE INDEX idx_blocked_users_blocker_id ON blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked_id ON blocked_users(blocked_id);
```

### 📊 Analytics Tablosu
```sql
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_analytics_event_type ON analytics(event_type);
CREATE INDEX idx_analytics_user_id ON analytics(user_id);
CREATE INDEX idx_analytics_created_at ON analytics(created_at);
```

## 🔧 Enum Types

### User Role Enum
```sql
CREATE TYPE user_role AS ENUM (
  'user',
  'moderator',
  'admin',
  'super_admin'
);
```

### User Status Enum
```sql
CREATE TYPE user_status AS ENUM (
  'active',
  'inactive',
  'suspended',
  'banned'
);
```

### Listing Status Enum
```sql
CREATE TYPE listing_status AS ENUM (
  'draft',
  'active',
  'sold',
  'expired',
  'removed'
);
```

### Condition Type Enum
```sql
CREATE TYPE condition_type AS ENUM (
  'new',
  'like_new',
  'good',
  'fair',
  'poor'
);
```

### Message Type Enum
```sql
CREATE TYPE message_type AS ENUM (
  'text',
  'image',
  'file',
  'system'
);
```

## 🔗 İlişki Diyagramı

```mermaid
erDiagram
    USERS ||--o{ LISTINGS : creates
    USERS ||--o{ IMAGES : uploads
    USERS ||--o{ MESSAGES : sends
    USERS ||--o{ REVIEWS : writes
    USERS ||--o{ FAVORITES : adds
    USERS ||--o{ BLOCKED_USERS : blocks
    
    CATEGORIES ||--o{ LISTINGS : contains
    CATEGORIES ||--o{ CATEGORIES : has_parent
    
    LISTINGS ||--o{ IMAGES : has
    LISTINGS ||--o{ MESSAGES : discussed_in
    LISTINGS ||--o{ REVIEWS : reviewed
    LISTINGS ||--o{ FAVORITES : favorited
    LISTINGS ||--o{ CONVERSATIONS : discussed_in
    
    CONVERSATIONS ||--o{ MESSAGES : contains
    
    ANALYTICS }o--|| USERS : tracks
    ANALYTICS }o--|| LISTINGS : tracks
    ANALYTICS }o--|| CATEGORIES : tracks
```

## 📈 Index Stratejisi

### Primary Indexes
```sql
-- Users
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
CREATE INDEX idx_users_role_status ON users(role, status);

-- Listings
CREATE INDEX idx_listings_status_created ON listings(status, created_at DESC);
CREATE INDEX idx_listings_category_status ON listings(category_id, status);
CREATE INDEX idx_listings_price_range ON listings(price) WHERE status = 'active';

-- Categories
CREATE INDEX idx_categories_hierarchy ON categories(parent_id, level, order_index);
CREATE INDEX idx_categories_active_slug ON categories(active, slug);
```

### Composite Indexes
```sql
-- Search optimization
CREATE INDEX idx_listings_search ON listings 
USING GIN(to_tsvector('turkish', title || ' ' || COALESCE(description, '')));

-- Location-based search
CREATE INDEX idx_listings_location_gist ON listings 
USING GIST((location->>'coordinates')::point);

-- Analytics queries
CREATE INDEX idx_analytics_event_date ON analytics(event_type, DATE(created_at));
```

## 🔄 Migration Stratejisi

### Migration Dosya Yapısı
```
prisma/
├── migrations/
│   ├── 20250101000000_initial_schema/
│   │   ├── migration.sql
│   │   └── README.md
│   ├── 20250102000000_add_analytics/
│   │   ├── migration.sql
│   │   └── README.md
│   └── migration_lock.toml
├── schema.prisma
└── seed.ts
```

### Migration Komutları
```bash
# Migration oluştur
npx prisma migrate dev --name add_new_feature

# Production migration
npx prisma migrate deploy

# Migration reset (development)
npx prisma migrate reset

# Migration status
npx prisma migrate status
```

## 🌱 Seeding Stratejisi

### Seed Dosyası
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Super admin oluştur
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@benalsam.com' },
    update: {},
    create: {
      email: 'admin@benalsam.com',
      password_hash: await hash('admin123', 10),
      name: 'Super Admin',
      role: 'super_admin',
      email_verified: true
    }
  });

  // Ana kategoriler oluştur
  const electronics = await prisma.category.create({
    data: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
      icon: '📱',
      level: 1,
      order_index: 1
    }
  });

  // Alt kategoriler
  await prisma.category.create({
    data: {
      name: 'Smartphones',
      slug: 'smartphones',
      parent_id: electronics.id,
      level: 2,
      order_index: 1
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## 🔍 Query Optimizasyonu

### Performanslı Sorgular
```sql
-- Kullanıcı listesi (pagination ile)
SELECT 
  u.id, u.email, u.name, u.role, u.status,
  COUNT(l.id) as total_listings,
  MAX(l.created_at) as last_listing_date
FROM users u
LEFT JOIN listings l ON u.id = l.user_id
WHERE u.status = 'active'
GROUP BY u.id
ORDER BY u.created_at DESC
LIMIT 20 OFFSET 0;

-- İlan arama (full-text search)
SELECT 
  l.*, c.name as category_name, u.name as user_name
FROM listings l
JOIN categories c ON l.category_id = c.id
JOIN users u ON l.user_id = u.id
WHERE l.status = 'active'
  AND to_tsvector('turkish', l.title || ' ' || COALESCE(l.description, '')) 
      @@ plainto_tsquery('turkish', 'iphone')
ORDER BY l.created_at DESC;

-- Kategori istatistikleri
SELECT 
  c.id, c.name, c.slug,
  COUNT(l.id) as total_listings,
  COUNT(CASE WHEN l.status = 'active' THEN 1 END) as active_listings,
  AVG(l.price) as avg_price
FROM categories c
LEFT JOIN listings l ON c.id = l.category_id
WHERE c.active = true
GROUP BY c.id, c.name, c.slug
ORDER BY total_listings DESC;
```

## 🔐 Güvenlik

### Row Level Security (RLS)
```sql
-- Users tablosu için RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Listings tablosu için RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active listings" ON listings
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can manage their own listings" ON listings
  FOR ALL USING (auth.uid() = user_id);
```

### Data Encryption
```sql
-- Hassas veriler için encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Password hash için
UPDATE users SET password_hash = crypt(password_hash, gen_salt('bf'));

-- Phone number encryption
ALTER TABLE users ADD COLUMN phone_encrypted BYTEA;
UPDATE users SET phone_encrypted = pgp_sym_encrypt(phone, 'encryption_key');
```

## 📊 Backup Stratejisi

### Backup Script
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/database"
DB_NAME="benalsam_prod"

# Full backup
pg_dump -h localhost -U benalsam_user -d $DB_NAME > $BACKUP_DIR/full_backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/full_backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "full_backup_*.sql.gz" -mtime +7 -delete

# Log backup
echo "Backup completed: full_backup_$DATE.sql.gz" >> $BACKUP_DIR/backup.log
```

### Restore Script
```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1
DB_NAME="benalsam_prod"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore.sh backup_file.sql.gz"
  exit 1
fi

# Restore from backup
gunzip -c $BACKUP_FILE | psql -h localhost -U benalsam_user -d $DB_NAME

echo "Restore completed from $BACKUP_FILE"
```

## 🔍 Monitoring

### Performance Queries
```sql
-- Slow queries
SELECT 
  query, 
  calls, 
  total_time, 
  mean_time,
  rows
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT 
  indexrelname,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
ORDER BY idx_tup_read DESC;
```

---

**Son Güncelleme:** 22 Temmuz 2025  
**Versiyon:** 1.0  
**Database Version:** PostgreSQL 15+  
**Status:** Production Ready ✅ 