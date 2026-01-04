#!/bin/bash

# Comprehensive Test Suite
# Tüm testleri çalıştırır ve sonuçları raporlar

set -e

echo "🧪 Comprehensive Test Suite"
echo "============================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test counter helper
test_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $1 -eq 0 ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "${GREEN}✓ PASSED${NC}"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "${RED}✗ FAILED${NC}"
    fi
}

echo "1️⃣ TypeScript Type Checking"
echo "---------------------------"
echo -n "Checking TypeScript types... "
if npx tsc --noEmit > /dev/null 2>&1; then
    test_result 0
else
    test_result 1
    echo "  Run 'npx tsc --noEmit' to see errors"
fi
echo ""

echo "2️⃣ ESLint Check"
echo "---------------"
echo -n "Running ESLint... "
if npm run lint > /dev/null 2>&1; then
    test_result 0
else
    test_result 1
    echo "  Run 'npm run lint' to see errors"
fi
echo ""

echo "3️⃣ API Route Tests"
echo "------------------"
if [ -f "scripts/test-api-improvements.sh" ]; then
    echo "Running API tests..."
    if bash scripts/test-api-improvements.sh > /tmp/api-test-output.log 2>&1; then
        test_result 0
        echo "  See /tmp/api-test-output.log for details"
    else
        test_result 1
        echo "  See /tmp/api-test-output.log for details"
        tail -20 /tmp/api-test-output.log
    fi
else
    echo -e "${YELLOW}⚠ API test script not found${NC}"
fi
echo ""

echo "4️⃣ File Structure Check"
echo "-----------------------"
echo -n "Checking required files... "
MISSING_FILES=0

REQUIRED_FILES=(
    "src/lib/api-validation.ts"
    "src/lib/api-errors.ts"
    "src/utils/production-logger.ts"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "\n  ${RED}✗ Missing: $file${NC}"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

if [ $MISSING_FILES -eq 0 ]; then
    test_result 0
else
    test_result 1
fi
echo ""

echo "5️⃣ Import Check"
echo "---------------"
echo -n "Checking for console.log in API routes... "
CONSOLE_LOGS=$(find src/app/api -name "*.ts" -type f -exec grep -l "console\.\(log\|error\|warn\)" {} \; 2>/dev/null | wc -l | tr -d ' ')

if [ "$CONSOLE_LOGS" -eq 0 ]; then
    test_result 0
else
    test_result 1
    echo "  Found console.log/error/warn in $CONSOLE_LOGS file(s)"
    echo "  Files:"
    find src/app/api -name "*.ts" -type f -exec grep -l "console\.\(log\|error\|warn\)" {} \; 2>/dev/null | sed 's/^/    - /'
fi
echo ""

echo "6️⃣ Summary"
echo "=========="
echo -e "${BLUE}Total Tests: $TOTAL_TESTS${NC}"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi

