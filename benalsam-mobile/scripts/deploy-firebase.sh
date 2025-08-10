#!/bin/bash

# Firebase App Distribution Deployment Script
# Usage: ./scripts/deploy-firebase.sh [android|ios] [preview|production]

set -e

PLATFORM=${1:-android}
BUILD_TYPE=${2:-preview}

echo "🚀 Starting Firebase App Distribution deployment..."
echo "Platform: $PLATFORM"
echo "Build Type: $BUILD_TYPE"

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI is not installed. Installing..."
    npm install -g @expo/cli eas-cli
fi

# Login to EAS if not already logged in
echo "🔐 Checking EAS login status..."
if ! eas whoami &> /dev/null; then
    echo "Please login to EAS:"
    eas login
fi

# Run tests before building
echo "🧪 Running tests..."
npm run test:ci

# Build the app
echo "🏗️ Building $PLATFORM app for $BUILD_TYPE..."
if [ "$BUILD_TYPE" = "production" ]; then
    npm run build:$PLATFORM:production
else
    npm run build:$PLATFORM
fi

echo "✅ Build completed successfully!"

# Get the latest build
echo "📱 Getting latest build info..."
BUILD_ID=$(eas build:list --platform $PLATFORM --limit 1 --json | jq -r '.[0].id')

if [ "$BUILD_ID" = "null" ] || [ -z "$BUILD_ID" ]; then
    echo "❌ No build found!"
    exit 1
fi

echo "📦 Build ID: $BUILD_ID"

# Download the build artifact
echo "⬇️ Downloading build artifact..."
eas build:download --platform $PLATFORM --id $BUILD_ID

# Upload to Firebase App Distribution
echo "🔥 Uploading to Firebase App Distribution..."
if [ "$PLATFORM" = "android" ]; then
    # For Android, upload APK
    firebase appdistribution:distribute "builds/$BUILD_ID.apk" \
        --app "$FIREBASE_APP_ID" \
        --groups "testers" \
        --release-notes "Build $BUILD_ID - $BUILD_TYPE"
else
    # For iOS, upload IPA
    firebase appdistribution:distribute "builds/$BUILD_ID.ipa" \
        --app "$FIREBASE_APP_ID" \
        --groups "testers" \
        --release-notes "Build $BUILD_ID - $BUILD_TYPE"
fi

echo "🎉 Deployment completed successfully!"
echo "📱 Testers will receive an email with download instructions."
echo "🔗 Firebase Console: https://console.firebase.google.com/project/$FIREBASE_PROJECT_ID/appdistribution" 