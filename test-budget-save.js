#!/bin/bash

# Test script to reproduce the "Save Budget" button issue
echo "🧪 Testing Budget Creation API..."
echo ""

# Test data that mimics a complete budget creation flow
TEST_DATA='{
  "name": "Test Budget",
  "province": "ON",
  "lifeSituation": "single",
  "ageRange": "25-34",
  "workStatus": "employed",
  "housingSituation": "rent",
  "primaryGoal": "save-money",
  "budgetItems": [
    {
      "type": "INCOME",
      "category": "Employment",
      "subcategory": "Salary",
      "name": "Full-time Job",
      "amount": 5000,
      "frequency": "MONTHLY"
    },
    {
      "type": "EXPENSE",
      "category": "Housing",
      "subcategory": "Rent",
      "name": "Monthly Rent",
      "amount": 1500,
      "frequency": "MONTHLY"
    }
  ]
}'

echo "1️⃣ Testing guest budget creation..."
echo ""

# Test API endpoint with complete data
response=$(curl -s -w "HTTPSTATUS:%{http_code}\nHEADERS:%{response_headers}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA" \
  http://localhost:3000/api/budgets 2>/dev/null)

# Extract HTTP status
http_status=$(echo "$response" | grep "HTTPSTATUS:" | cut -d: -f2)

# Extract response body
response_body=$(echo "$response" | sed '/HTTPSTATUS:/d' | sed '/HEADERS:/d')

echo "HTTP Status: $http_status"
echo ""

if [ "$http_status" = "200" ] || [ "$http_status" = "201" ]; then
  echo "✅ Budget creation API working correctly"
  echo "Response:"
  echo "$response_body" | jq . 2>/dev/null || echo "$response_body"
else
  echo "❌ Budget creation API failed"
  echo "Response:"
  echo "$response_body"
fi

echo ""
echo "=================================================="
echo ""

echo "2️⃣ Testing server health (GET /api/budgets)..."
health_response=$(curl -s -w "HTTPSTATUS:%{http_code}" http://localhost:3000/api/budgets 2>/dev/null)
health_status=$(echo "$health_response" | grep "HTTPSTATUS:" | cut -d: -f2)
health_body=$(echo "$health_response" | sed '/HTTPSTATUS:/d')

echo "GET Status: $health_status"
if [ "$health_status" = "200" ]; then
  echo "✅ Server responding correctly"
else
  echo "❌ Server health check failed"
fi

echo ""
echo "=================================================="
echo ""

echo "3️⃣ Testing direct curl to see what exactly happens..."
echo ""

# More detailed curl test
curl -v -X POST \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA" \
  http://localhost:3000/api/budgets
