#!/bin/bash
# Test script for Dragon Ball Giveaway
# Usage: ./test.sh

echo "========================================"
echo "Dragon Ball Giveaway - Test Suite"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:5000"
ADMIN_PASSWORD="admin123"
TEST_NAME="TestCombattant$(date +%s)"

echo "Testing API endpoints..."
echo ""

# Test 1: Health check
echo -e "${YELLOW}Test 1: Health Check${NC}"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
if [ "$STATUS" = "200" ]; then
  echo -e "${GREEN}✓ Server is running${NC}"
else
  echo -e "${RED}✗ Server returned status $STATUS${NC}"
  exit 1
fi
echo ""

# Test 2: Get participants (should be empty)
echo -e "${YELLOW}Test 2: Get Participants${NC}"
RESPONSE=$(curl -s "$BASE_URL/api/participants")
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ GET /api/participants works${NC}"
else
  echo -e "${RED}✗ GET /api/participants failed${NC}"
  echo "Response: $RESPONSE"
  exit 1
fi
echo ""

# Test 3: Add participant
echo -e "${YELLOW}Test 3: Add Participant${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/participants" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$TEST_NAME\"}")

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ POST /api/participants works${NC}"
  PARTICIPANT_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  echo "  Added participant: $TEST_NAME"
else
  echo -e "${RED}✗ POST /api/participants failed${NC}"
  echo "Response: $RESPONSE"
  exit 1
fi
echo ""

# Test 4: Check duplicate prevention (24h limit)
echo -e "${YELLOW}Test 4: Check 24h Limit${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/participants" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"AnotherName\"}")

if echo "$RESPONSE" | grep -q "429\|⏱️"; then
  echo -e "${GREEN}✓ 24h limit is enforced${NC}"
else
  echo -e "${YELLOW}⚠ 24h limit may not be active (status: $(echo $RESPONSE | grep -o '"success":[^,]*'))${NC}"
fi
echo ""

# Test 5: Admin login
echo -e "${YELLOW}Test 5: Admin Login${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/participants/admin/login" \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"$ADMIN_PASSWORD\"}")

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Admin login works${NC}"
  ADMIN_TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  echo "  Token: ${ADMIN_TOKEN:0:20}..."
else
  echo -e "${RED}✗ Admin login failed${NC}"
  echo "Response: $RESPONSE"
  exit 1
fi
echo ""

# Test 6: Get winners
echo -e "${YELLOW}Test 6: Get Winners${NC}"
RESPONSE=$(curl -s "$BASE_URL/api/participants/winners")
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ GET /api/participants/winners works${NC}"
else
  echo -e "${RED}✗ GET /api/participants/winners failed${NC}"
  echo "Response: $RESPONSE"
  exit 1
fi
echo ""

# Test 7: Spin wheel (requires admin)
echo -e "${YELLOW}Test 7: Spin Wheel (Admin Only)${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/participants/roulette" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ POST /api/participants/roulette works${NC}"
  WINNER=$(echo "$RESPONSE" | grep -o '"name":"[^"]*' | cut -d'"' -f4)
  echo "  Winner: $WINNER"
else
  echo -e "${YELLOW}⚠ Wheel spin returned: $(echo $RESPONSE | cut -c1-100)...${NC}"
fi
echo ""

# Test 8: Static files
echo -e "${YELLOW}Test 8: Static Files${NC}"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/index.html")
if [ "$STATUS" = "200" ]; then
  echo -e "${GREEN}✓ index.html is served${NC}"
else
  echo -e "${RED}✗ index.html returned status $STATUS${NC}"
fi

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/style.css")
if [ "$STATUS" = "200" ]; then
  echo -e "${GREEN}✓ style.css is served${NC}"
else
  echo -e "${RED}✗ style.css returned status $STATUS${NC}"
fi

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/app.js")
if [ "$STATUS" = "200" ]; then
  echo -e "${GREEN}✓ app.js is served${NC}"
else
  echo -e "${RED}✗ app.js returned status $STATUS${NC}"
fi
echo ""

echo "========================================"
echo -e "${GREEN}All tests completed!${NC}"
echo "========================================"
