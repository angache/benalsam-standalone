#!/bin/bash

echo "🔧 BenAlsam Admin Backend Environment Setup"
echo "=========================================="

# Check if service role key is provided
if [ -z "$1" ]; then
    echo "❌ Error: Service role key is required"
    echo "Usage: ./setup-env.sh YOUR_SERVICE_ROLE_KEY"
    echo ""
    echo "To get your service role key:"
    echo "1. Go to https://supabase.com/dashboard"
    echo "2. Select your project: dnwreckpeenhbdtapmxr"
    echo "3. Go to Settings > API"
    echo "4. Copy the 'service_role' key"
    exit 1
fi

SERVICE_ROLE_KEY=$1

echo "✅ Setting up environment variables..."

# Export environment variables
export SUPABASE_URL="https://dnwreckpeenhbdtapmxr.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRud3JlY2twZWVuaGJkdGFwbXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5OTgwNzAsImV4cCI6MjA2NTU3NDA3MH0.2lzsxTj4hoKTcZeoCGMsUC3Cmsm1pgcqXP-3j_GV_Ys"
export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
export JWT_SECRET="your-super-secret-jwt-key-change-in-production"
export JWT_EXPIRES_IN="24h"
export JWT_REFRESH_EXPIRES_IN="7d"
export CORS_ORIGIN="http://localhost:3003"
export PORT="3002"
export NODE_ENV="development"

echo "✅ Environment variables set successfully!"
echo ""
echo "🚀 Starting backend server..."
echo "📊 Backend will be available at: http://localhost:3002"
echo "🔗 Health check: http://localhost:3002/health"
echo ""

# Start the backend
npm run dev 