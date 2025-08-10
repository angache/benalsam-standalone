#!/bin/bash

# Admin Backend Standalone Start Script
# Bu script admin-backend'i pm2 olmadan standalone çalıştırır

echo "🚀 Admin Backend başlatılıyor..."
echo "📁 Directory: packages/admin-backend"
echo "🔧 Environment: Development"
echo "🌐 Port: 3002"
echo ""

# Redis Ayarları
echo "🔴 Redis Ayarları:"
echo "   Host: 209.227.228.96"
echo "   Port: 6379"
echo "   Password: (yok)"
echo ""

# Admin backend dizinine git
cd packages/admin-backend

# Environment variables ile admin backend'i başlat
REDIS_HOST=209.227.228.96 \
REDIS_PORT=6379 \
REDIS_PASSWORD= \
ELASTICSEARCH_URL=http://209.227.228.96:9200 \
ELASTICSEARCH_INDEX=benalsam_listings \
SUPABASE_URL=https://dnwreckpeenhbdtapmxr.supabase.co \
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRud3JlY2twZWVuaGJkdGFwbXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5OTgwNzAsImV4cCI6MjA2NTU3NDA3MH0.2lzsxTj4 \
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRud3JlY2twZWVuaGJkdGFwbXhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTk5ODA3MCwiZXhwIjoyMDY1NTc0MDcwfQ.b6UNsncrPKXYB-17oyOEx8xY_hbofAx7ObwzKsyhsm4 \
ADMIN_JWT_SECRET=your-admin-jwt-secret-key-here \
PORT=3002 \
NODE_ENV=development \
npm run dev 