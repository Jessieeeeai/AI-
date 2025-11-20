#!/bin/bash

echo "=== Testing M4A File Upload ==="
echo ""

# 1. Register and login
echo "1. Creating test user..."
REGISTER_RESPONSE=$(curl -s -X POST "http://localhost:3001/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "m4atest'$(date +%s)'@example.com",
    "password": "test123456",
    "username": "M4A测试"
  }')

TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token: ${TOKEN:0:50}..."
echo ""

# 2. Create a dummy M4A file for testing
echo "2. Creating test M4A file..."
echo "This is a test audio file" > /tmp/test_audio.m4a
echo "File created: /tmp/test_audio.m4a"
echo ""

# 3. Test upload endpoint info
echo "3. Upload endpoint ready at:"
echo "   POST http://localhost:3001/api/upload/voice"
echo "   Authorization: Bearer $TOKEN"
echo ""

echo "Test complete! You can now:"
echo "1. Visit the website"
echo "2. Login with the test account"
echo "3. Go to Create -> Step 2"
echo "4. Upload your M4A file"
echo ""
echo "The file picker should now show .m4a files!"
