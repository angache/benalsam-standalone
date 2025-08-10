#!/bin/bash

# ===== MERKEZI ENVIRONMENT YONETIMI =====
# Kullanım: ./scripts/copy-env-to-packages.sh

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

echo "🔍 Root .env dosyası aranıyor: $ENV_FILE"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ HATA: $ENV_FILE bulunamadı!"
  echo "📝 Lütfen önce ./scripts/setup-env.sh çalıştırın."
  exit 1
fi

echo "✅ Root .env dosyası bulundu"

PACKAGES=(
  "packages/admin-backend"
  "packages/admin-ui" 
  "packages/web"
  "packages/mobile"
)

echo "📦 Paketlere .env dosyası kopyalanıyor..."

for pkg in "${PACKAGES[@]}"; do
  TARGET="$ROOT_DIR/$pkg/.env"
  
  # .env dosyasını kopyala
  cp "$ENV_FILE" "$TARGET"
  echo "✅ $ENV_FILE -> $TARGET"
  
  # .gitignore'a .env ekle (eğer yoksa)
  GITIGNORE_FILE="$ROOT_DIR/$pkg/.gitignore"
  if [ -f "$GITIGNORE_FILE" ]; then
    if ! grep -q '^.env$' "$GITIGNORE_FILE"; then
      echo ".env" >> "$GITIGNORE_FILE"
      echo "📝 $pkg/.gitignore güncellendi (.env eklendi)"
    else
      echo "ℹ️  $pkg/.gitignore zaten .env içeriyor"
    fi
  else
    echo ".env" > "$GITIGNORE_FILE"
    echo "📝 $pkg/.gitignore oluşturuldu"
  fi
done

echo ""
echo "🎉 Tüm paketlere .env dosyası başarıyla kopyalandı!"
echo "📋 Kopyalanan paketler:"
for pkg in "${PACKAGES[@]}"; do
  echo "   - $pkg/.env"
done
echo ""
echo "💡 Not: .env dosyaları .gitignore'a eklendi, Git'e gönderilmeyecek." 