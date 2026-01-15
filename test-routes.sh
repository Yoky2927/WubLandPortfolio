#!/bin/bash

echo "Testing Available Routes"
echo "========================"

# Get admin token
echo "1. Getting admin token..."
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "yokabd_admin", "password": "123456"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
if [ "$TOKEN" = "null" ]; then
    echo "Failed to get token"
    echo $LOGIN_RESPONSE
    exit 1
fi

echo "✅ Admin token obtained"

# Test user routes
echo -e "\n2. Testing /api/users endpoint..."
curl -s -X GET "http://localhost:5000/api/users" \
  -H "Authorization: Bearer $TOKEN" | head -c 200

echo -e "\n\n3. Testing /api/users/pending-verifications..."
curl -s -X GET "http://localhost:5000/api/users/pending-verifications" \
  -H "Authorization: Bearer $TOKEN" | head -c 200

echo -e "\n\n4. Testing /api/users/verification-stats..."
curl -s -X GET "http://localhost:5000/api/users/verification-stats" \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n\n5. Testing /api/users/23/documents..."
curl -s -X GET "http://localhost:5000/api/users/23/documents" \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n\n6. Testing /api/users/23/verify (PUT)..."
curl -s -X PUT "http://localhost:5000/api/users/23/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status": "approved", "reason": "Test"}'

echo -e "\n\n7. Testing communication service..."
curl -s "http://localhost:5001/health"

echo -e "\n\n✅ Route tests completed"
