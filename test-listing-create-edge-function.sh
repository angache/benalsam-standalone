#!/bin/bash

# Test Listing-Create Edge Function
# Bu script edge function'ı manuel olarak test eder

echo "🧪 Testing Listing-Create Edge Function..."
echo ""

# Configuration
SUPABASE_PROJECT_URL="YOUR_SUPABASE_PROJECT_URL"  # Örn: https://xxxxx.supabase.co
FIREBASE_SECRET="YOUR_FIREBASE_SECRET"
EDGE_FUNCTION_URL="${SUPABASE_PROJECT_URL}/functions/v1/listing-create"

# Test Data
TEST_LISTING_ID="test_$(date +%s)"
TEST_USER_ID="test-user-123"

echo "📋 Test Configuration:"
echo "   Edge Function URL: ${EDGE_FUNCTION_URL}"
echo "   Listing ID: ${TEST_LISTING_ID}"
echo "   User ID: ${TEST_USER_ID}"
echo ""

# Test Request
echo "📤 Sending test request..."
curl -X POST "${EDGE_FUNCTION_URL}" \
  -H "Authorization: Bearer ${FIREBASE_SECRET}" \
  -H "Content-Type: application/json" \
  -d "{
    \"listingId\": \"${TEST_LISTING_ID}\",
    \"userId\": \"${TEST_USER_ID}\",
    \"listingData\": {
      \"title\": \"Test Listing from Edge Function\",
      \"description\": \"This is a test listing created via edge function\",
      \"category\": \"Electronics\",
      \"budget\": 1000,
      \"status\": \"pending\",
      \"user_id\": \"${TEST_USER_ID}\"
    }
  }" | jq .

echo ""
echo "✅ Test request sent!"
echo ""
echo "📊 Next steps:"
echo "   1. Check Firebase Console: https://console.firebase.google.com/project/benalsam-2025/database/data/jobs"
echo "   2. Check Realtime Service logs: cd benalsam-realtime-service && npm run dev"
echo "   3. Check RabbitMQ Management: http://localhost:15672/#/queues (listing.jobs queue)"

