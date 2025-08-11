#!/bin/bash

echo "🔍 Validating documentation cleanup..."

# Check for old repository references
echo "📋 Checking for old repository references..."
OLD_REPO_REFS=$(grep -r "BenalsamMobil-2025\|BenalsamWeb-2025\|Benalsam-Monorepo" docs/ 2>/dev/null)
if [ -z "$OLD_REPO_REFS" ]; then
    echo "✅ No old repository references found"
else
    echo "❌ Old repository references found:"
    echo "$OLD_REPO_REFS"
fi

# Check for old project structure
echo "📋 Checking for old project structure references..."
OLD_STRUCTURE_REFS=$(grep -r "benalsam-monorepo\|packages/" docs/ 2>/dev/null)
if [ -z "$OLD_STRUCTURE_REFS" ]; then
    echo "✅ No old project structure references found"
else
    echo "❌ Old project structure references found:"
    echo "$OLD_STRUCTURE_REFS"
fi

# Check for old Docker containers
echo "📋 Checking for old Docker container references..."
OLD_DOCKER_REFS=$(grep -r "benalsam-monorepo_redis_1\|benalsam-monorepo_elasticsearch_1" docs/ 2>/dev/null)
if [ -z "$OLD_DOCKER_REFS" ]; then
    echo "✅ No old Docker container references found"
else
    echo "❌ Old Docker container references found:"
    echo "$OLD_DOCKER_REFS"
fi

# Check for new references
echo "📋 Checking for new references..."
NEW_REPO_REFS=$(grep -r "benalsam-standalone" docs/ | wc -l)
echo "✅ Found $NEW_REPO_REFS references to benalsam-standalone"

echo "✅ Documentation validation completed!"
