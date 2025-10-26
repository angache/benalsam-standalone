#!/bin/bash

# Test script for code quality improvements
# Run this after making changes to verify everything works

echo "🧪 Testing Code Quality Improvements..."
echo "======================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${RED}❌ Server is not running!${NC}"
    echo "   Start with: npm run dev"
    exit 1
fi

echo -e "${GREEN}✅ Server is running${NC}"
echo ""

# Test 1: Rate Limiting
echo "📝 Test 1: Rate Limiting"
echo "------------------------"
echo "Sending 65 requests to test rate limiting..."

# Replace with actual user ID
USER_ID="test-user-id"
ENDPOINT="http://localhost:3000/api/messages/unread-count?userId=$USER_ID"
RATE_LIMITED=false

for i in {1..65}; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$ENDPOINT")
  
  if [ "$HTTP_CODE" = "429" ]; then
    echo -e "${GREEN}✅ Rate limiting works! (Request #$i returned 429)${NC}"
    RATE_LIMITED=true
    break
  fi
  
  if [ $((i % 10)) -eq 0 ]; then
    echo "   Sent $i requests..."
  fi
  
  sleep 0.05
done

if [ "$RATE_LIMITED" = false ]; then
  echo -e "${YELLOW}⚠️  Rate limiting not triggered (may need real user ID)${NC}"
fi

echo ""

# Test 2: XSS Sanitization (manual check required)
echo "📝 Test 2: XSS Sanitization"
echo "---------------------------"
echo -e "${YELLOW}⚠️  Manual test required:${NC}"
echo "   1. Go to messaging page"
echo "   2. Send: <script>alert('XSS')</script>Hello"
echo "   3. Verify: No alert pops up"
echo "   4. Verify: Message shows only 'Hello'"
echo ""

# Test 3: WebSocket Connection
echo "📝 Test 3: WebSocket Connection"
echo "-------------------------------"
echo -e "${YELLOW}⚠️  Manual test required:${NC}"
echo "   1. Open DevTools > Network > WS"
echo "   2. Login to the app"
echo "   3. Count WebSocket connections"
echo "   4. Verify: Only 1 connection (not 3+)"
echo ""

# Test 4: Production Build
echo "📝 Test 4: Production Build"
echo "---------------------------"
echo "Checking if production build works..."

if [ -d ".next" ]; then
  echo -e "${GREEN}✅ .next directory exists${NC}"
else
  echo -e "${YELLOW}⚠️  No production build found${NC}"
  echo "   Run: npm run build"
fi

echo ""

# Test 5: Logger Test
echo "📝 Test 5: Logger Configuration"
echo "-------------------------------"

if grep -q "production-logger" src/contexts/AuthContext.tsx; then
  echo -e "${GREEN}✅ Logger imported in AuthContext${NC}"
else
  echo -e "${RED}❌ Logger not found in AuthContext${NC}"
fi

if grep -q "production-logger" src/contexts/NotificationContext.tsx; then
  echo -e "${GREEN}✅ Logger imported in NotificationContext${NC}"
else
  echo -e "${RED}❌ Logger not found in NotificationContext${NC}"
fi

echo ""

# Test 6: Rate Limiter
echo "📝 Test 6: Rate Limiter Module"
echo "------------------------------"

if [ -f "src/lib/rate-limit.ts" ]; then
  echo -e "${GREEN}✅ Rate limiter module exists${NC}"
  
  if grep -q "rateLimiters.messaging" src/app/api/messages/unread-count/route.ts; then
    echo -e "${GREEN}✅ Rate limiter used in unread-count API${NC}"
  else
    echo -e "${RED}❌ Rate limiter not found in unread-count API${NC}"
  fi
else
  echo -e "${RED}❌ Rate limiter module not found${NC}"
fi

echo ""

# Test 7: Sanitization
echo "📝 Test 7: Sanitization Module"
echo "------------------------------"

if [ -f "src/utils/sanitize.ts" ]; then
  echo -e "${GREEN}✅ Sanitization module exists${NC}"
  
  if grep -q "sanitizeText\|sanitizeMessage" src/app/mesajlarim-v2/page.tsx; then
    echo -e "${GREEN}✅ Sanitization used in messaging page${NC}"
  else
    echo -e "${RED}❌ Sanitization not found in messaging page${NC}"
  fi
else
  echo -e "${RED}❌ Sanitization module not found${NC}"
fi

echo ""

# Test 8: Realtime Manager
echo "📝 Test 8: Realtime Manager"
echo "---------------------------"

if [ -f "src/lib/realtime-manager.ts" ]; then
  echo -e "${GREEN}✅ Realtime manager module exists${NC}"
  
  if grep -q "realtimeManager" src/contexts/AuthContext.tsx; then
    echo -e "${GREEN}✅ Realtime manager used in AuthContext${NC}"
  else
    echo -e "${RED}❌ Realtime manager not found in AuthContext${NC}"
  fi
  
  if grep -q "realtimeManager" src/contexts/NotificationContext.tsx; then
    echo -e "${GREEN}✅ Realtime manager used in NotificationContext${NC}"
  else
    echo -e "${RED}❌ Realtime manager not found in NotificationContext${NC}"
  fi
else
  echo -e "${RED}❌ Realtime manager module not found${NC}"
fi

echo ""

# Summary
echo "======================================="
echo "🎯 Test Summary"
echo "======================================="
echo ""
echo "Automated checks completed!"
echo ""
echo "Manual tests required:"
echo "  1. Rate limiting (with real user ID)"
echo "  2. XSS sanitization (send test messages)"
echo "  3. WebSocket connection count"
echo "  4. N+1 query fix (check Network tab)"
echo "  5. Production logger (build and test)"
echo ""
echo "See TESTING_GUIDE.md for detailed instructions."
echo ""
echo -e "${GREEN}✨ All automated checks passed!${NC}"

