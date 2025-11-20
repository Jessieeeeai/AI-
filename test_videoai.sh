#!/bin/bash

echo "🧪 VideoAI Pro - 自动化测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. 登录
echo "1️⃣  登录中..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@videoai.pro","password":"admin123456"}')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import json,sys; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "❌ 登录失败"
    echo $LOGIN_RESPONSE | python3 -m json.tool
    exit 1
fi

echo "✅ 登录成功"
echo "Token: ${TOKEN:0:50}..."
echo ""

# 2. 创建任务
echo "2️⃣  创建视频任务..."
TASK_RESPONSE=$(curl -s -X POST http://localhost:3001/api/tasks/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "大家好，我是你们的数字分身。今天天气很好，心情也很愉快。",
    "voiceSettings": {
      "happiness": 0.8,
      "sadness": 0.0,
      "anger": 0.0,
      "surprise": 0.2,
      "pitch": 1.0,
      "speed": 1.0
    },
    "templateId": "template_1"
  }')

echo $TASK_RESPONSE | python3 -m json.tool

TASK_ID=$(echo $TASK_RESPONSE | python3 -c "import json,sys; print(json.load(sys.stdin).get('taskId',''))" 2>/dev/null)

if [ -z "$TASK_ID" ]; then
    echo "❌ 任务创建失败"
    exit 1
fi

echo ""
echo "✅ 任务创建成功: $TASK_ID"
echo ""

# 3. 查询任务状态 (等待5秒)
echo "3️⃣  等待5秒后查询任务状态..."
sleep 5

TASK_STATUS=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/tasks/$TASK_ID)

echo $TASK_STATUS | python3 -m json.tool

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 测试完成！"
echo ""
echo "📝 提示:"
echo "  - Mock 模式会生成测试视频（约2-5秒）"
echo "  - 真实 GPU 模式生成时间约1-3分钟"
echo "  - 任务ID: $TASK_ID"
echo "  - 可以继续查询: curl -H \"Authorization: Bearer $TOKEN\" http://localhost:3001/api/tasks/$TASK_ID"
