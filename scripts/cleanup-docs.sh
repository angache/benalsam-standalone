#!/bin/bash

echo "🧹 Starting documentation cleanup..."
echo "📁 Scanning docs/ directory for old references..."

# Repository URLs
echo "🔄 Replacing repository URLs..."
find docs/ -name "*.md" -exec sed -i 's|github.com:angache/BenalsamMobil-2025|github.com:angache/benalsam-standalone|g' {} \;
find docs/ -name "*.md" -exec sed -i 's|github.com:angache/BenalsamWeb-2025|github.com:angache/benalsam-standalone|g' {} \;
find docs/ -name "*.md" -exec sed -i 's|github.com:angache/Benalsam-Monorepo|github.com:angache/benalsam-standalone|g' {} \;

# Project structure
echo "🔄 Replacing project structure references..."
find docs/ -name "*.md" -exec sed -i 's|benalsam-monorepo/|benalsam-standalone/|g' {} \;
find docs/ -name "*.md" -exec sed -i 's|packages/admin-backend|benalsam-admin-backend|g' {} \;
find docs/ -name "*.md" -exec sed -i 's|packages/admin-ui|benalsam-admin-ui|g' {} \;
find docs/ -name "*.md" -exec sed -i 's|packages/web|benalsam-web|g' {} \;
find docs/ -name "*.md" -exec sed -i 's|packages/mobile|benalsam-mobile|g' {} \;
find docs/ -name "*.md" -exec sed -i 's|packages/shared-types|benalsam-shared-types|g' {} \;

# Docker containers
echo "🔄 Replacing Docker container references..."
find docs/ -name "*.md" -exec sed -i 's|benalsam-monorepo_redis_1|benalsam-infrastructure_redis_1|g' {} \;
find docs/ -name "*.md" -exec sed -i 's|benalsam-monorepo_elasticsearch_1|benalsam-infrastructure_elasticsearch_1|g' {} \;
find docs/ -name "*.md" -exec sed -i 's|benalsam-monorepo_benalsam-network|benalsam-infrastructure_benalsam-network|g' {} \;

# Volume names
echo "🔄 Replacing Docker volume references..."
find docs/ -name "*.md" -exec sed -i 's|benalsam-monorepo_redis_data|benalsam-infrastructure_redis_data|g' {} \;
find docs/ -name "*.md" -exec sed -i 's|benalsam-monorepo_elasticsearch_data|benalsam-infrastructure_elasticsearch_data|g' {} \;

# Path references
echo "🔄 Replacing path references..."
find docs/ -name "*.md" -exec sed -i 's|/benalsam-monorepo/packages/|/benalsam-standalone/|g' {} \;
find docs/ -name "*.md" -exec sed -i 's|benalsam-monorepo/packages/|benalsam-standalone/|g' {} \;

echo "✅ Documentation cleanup completed!"
echo "📊 Summary of changes:"
echo "   - Repository URLs updated"
echo "   - Project structure references updated"
echo "   - Docker container names updated"
echo "   - Volume names updated"
echo "   - Path references updated"
