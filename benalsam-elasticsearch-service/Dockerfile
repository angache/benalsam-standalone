# Build stage
FROM node:18-alpine as builder

# Çalışma dizinini ayarla
WORKDIR /app

# Package dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm ci

# Kaynak kodları kopyala
COPY . .

# TypeScript'i derle
RUN npm run build

# Production stage
FROM node:18-alpine

# Çalışma dizinini ayarla
WORKDIR /app

# Package dosyalarını kopyala
COPY package*.json ./

# Sadece production bağımlılıklarını yükle
RUN npm ci --only=production

# Builder'dan derlenmiş dosyaları kopyala
COPY --from=builder /app/dist ./dist

# Logs dizini oluştur
RUN mkdir -p logs

# Sağlık kontrolü
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3003/health || exit 1

# Kullanıcı oluştur ve yetkilendir
RUN addgroup -S app && adduser -S app -G app
RUN chown -R app:app /app
USER app

# Port'u aç
EXPOSE 3003

# Uygulamayı başlat
CMD ["node", "dist/index.js"]
