#!/bin/bash

BASE_URL="http://localhost:3001/api"

echo "=== Testing VideoAI Pro API ==="
echo ""

# Test 1: Register a test user
echo "1. Testing user registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "username": "测试用户"
  }')

echo "Response: $REGISTER_RESPONSE"
echo ""

# Test 2: Login
echo "2. Testing user login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token: $TOKEN"
echo ""

# Test 3: Get profile
echo "3. Testing get profile..."
PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/profile" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $PROFILE_RESPONSE"
echo ""

# Test 4: Create a task (should fail with insufficient credits if text too long)
echo "4. Testing task creation..."
TASK_RESPONSE=$(curl -s -X POST "$BASE_URL/tasks/create" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "大家好，我是AI视频创作助手。今天给大家介绍一下如何使用VideoAI Pro平台快速生成专业的口播视频。",
    "voiceSettings": {
      "happiness": 0.7,
      "sadness": 0.1,
      "anger": 0.0,
      "surprise": 0.3,
      "pitch": 1.0,
      "speed": 1.0,
      "volume": 1.0
    },
    "voiceId": null,
    "templateId": "template_1",
    "isCustomTemplate": false
  }')

echo "Response: $TASK_RESPONSE"
echo ""

# Test 5: Get task list
echo "5. Testing task list retrieval..."
TASKS_RESPONSE=$(curl -s -X GET "$BASE_URL/tasks/list" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $TASKS_RESPONSE"
echo ""

echo "=== API Tests Complete ==="
