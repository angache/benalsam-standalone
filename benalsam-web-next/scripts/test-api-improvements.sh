#!/bin/bash

# API Improvements Test Script
# Bu script, yapılan iyileştirmeleri test eder

set -e

echo "🧪 API Improvements Test Script"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="${BASE_URL:-http://localhost:3000}"
TEST_USER_ID="${TEST_USER_ID:-test-user-id}"

# Test counter
PASSED=0
FAILED=0

# Helper function
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local expected_status=$5
    local description=$6
    
    echo -n "Testing: $name... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$url" \
            -H "Content-Type: application/json" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$url" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Status: $http_code)"
        PASSED=$((PASSED + 1))
        
        # Check response format for error responses
        if [ "$http_code" -ge 400 ]; then
            # Check for standardized error format (api-errors.ts format)
            if echo "$body" | grep -q '"success":\s*false' && \
               echo "$body" | grep -q '"error"' && \
               echo "$body" | grep -q '"code"'; then
                echo "  ✓ Error response format is correct (standardized)"
            # Check for validation error format (api-validation.ts format)
            elif echo "$body" | grep -q '"success":\s*false' && \
                 echo "$body" | grep -q '"error"' && \
                 echo "$body" | grep -q '"errors"'; then
                echo "  ✓ Validation error format is correct"
            else
                echo -e "  ${YELLOW}⚠ Warning: Error response format might be incorrect${NC}"
                echo "  Body preview: $(echo "$body" | head -c 100)..."
            fi
        fi
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $http_code)"
        echo "  Response: $body"
        FAILED=$((FAILED + 1))
    fi
    echo ""
}

echo "1️⃣ TypeScript Build Test"
echo "----------------------"
cd "$(dirname "$0")/.."
echo -e "${YELLOW}⚠ Skipping build test (requires full permissions)${NC}"
echo "  To test manually: npm run build"
echo ""

echo "2️⃣ API Validation Tests"
echo "----------------------"
echo -e "${YELLOW}Note: Auth-protected endpoints return 401 before validation${NC}"
echo "  This is correct security behavior - auth check happens first"
echo ""

# Test 1: Invalid UUID in route (no auth required)
test_endpoint \
    "Get listing - Invalid UUID" \
    "GET" \
    "/api/listings/invalid-uuid" \
    "" \
    400 \
    "Should return validation error for invalid UUID"

# Test 2: Auth-protected endpoint (will return 401, not 400)
# This is expected - auth check happens before validation
test_endpoint \
    "Listing creation - Auth required (401 expected)" \
    "POST" \
    "/api/listings/create" \
    '{"title":"ab","description":"short"}' \
    401 \
    "Should return unauthorized (auth check before validation)"

echo "3️⃣ Error Handling Tests"
echo "----------------------"

# Test 4: Unauthorized request
test_endpoint \
    "Unauthorized request" \
    "POST" \
    "/api/listings/create" \
    '{"title":"Test","description":"Test description","category":1,"location":"Test","acceptTerms":true}' \
    401 \
    "Should return unauthorized error"

# Test 5: Not found
test_endpoint \
    "Listing not found" \
    "GET" \
    "/api/listings/00000000-0000-0000-0000-000000000000" \
    "" \
    404 \
    "Should return not found error"

# Test 6: Invalid favorite listing ID (auth required, will return 401)
test_endpoint \
    "Add favorite - Auth required (401 expected)" \
    "POST" \
    "/api/favorites" \
    '{"listingId":"invalid"}' \
    401 \
    "Should return unauthorized (auth check before validation)"

echo "4️⃣ Success Response Format Test"
echo "----------------------"
echo -e "${YELLOW}⚠ Skipping (requires authentication)${NC}"
echo "  To test manually:"
echo "  1. Login in browser"
echo "  2. Create a listing with valid data"
echo "  3. Check Network tab for success response format"
echo "  4. Should see: { success: true, data: {...} }"
echo ""

echo "5️⃣ Additional Manual Tests"
echo "----------------------"
echo "Recommended manual tests:"
echo "  ✓ Browser: Listing creation form with invalid data"
echo "  ✓ Browser: Network tab - check error response format"
echo "  ✓ Browser: Console - check logger output (dev vs prod)"
echo "  ✓ Terminal: npm run build (TypeScript strict mode)"
echo ""

echo "6️⃣ Summary"
echo "----------------------"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All automated tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi

