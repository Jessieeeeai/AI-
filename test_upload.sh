#!/bin/bash

echo "=== Testing Voice Upload Fix ==="
echo ""

# 1. Login
echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token obtained: ${TOKEN:0:50}..."
echo ""

# 2. Create test audio file
echo "2. Creating test audio file..."
echo "Test audio content for upload" > /tmp/test_voice.mp3
echo "File created: /tmp/test_voice.mp3"
echo ""

# 3. Upload file
echo "3. Uploading file..."
UPLOAD_RESPONSE=$(curl -s -X POST "http://localhost:3001/api/upload/voice" \
  -H "Authorization: Bearer $TOKEN" \
  -F "audio=@/tmp/test_voice.mp3")

echo "Response:"
echo $UPLOAD_RESPONSE | python3 -m json.tool 2>/dev/null || echo $UPLOAD_RESPONSE
echo ""

if echo $UPLOAD_RESPONSE | grep -q "success"; then
    echo "✅ Upload successful!"
else
    echo "❌ Upload failed"
fi
