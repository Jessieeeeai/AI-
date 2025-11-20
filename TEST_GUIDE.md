# 🧪 VideoAI Pro - 测试指南

## 快速测试步骤

### 1. 登录获取 Token

```bash
# 使用管理员账号登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@videoai.pro","password":"admin123456"}'
```

**预期响应**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 8,
    "email": "admin@videoai.pro",
    "username": "admin",
    "credits": 9999,
    "isAdmin": true
  }
}
```

### 2. 创建视频任务

**注意**: 路由是 `/api/tasks/create` 而不是 `/api/tasks`

```bash
# 保存 token
TOKEN="your_token_here"

# 创建任务
curl -X POST http://localhost:3001/api/tasks/create \
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
  }'
```

**预期响应**:
```json
{
  "success": true,
  "taskId": "abc123",
  "message": "任务创建成功，正在生成中",
  "estimatedTime": "2-3分钟",
  "costBreakdown": {
    "audioCost": 5,
    "videoCost": 25,
    "extraCost": 0,
    "subtotal": 30,
    "total": 30,
    "duration": 15,
    "minutes": 1,
    "segments": 1
  }
}
```

### 3. 查询任务状态

```bash
# 替换 TASK_ID 为上面返回的 taskId
TASK_ID="abc123"

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/tasks/$TASK_ID
```

**任务状态**:
- `pending`: 等待处理
- `processing`: 生成中 (progress: 0-100)
- `completed`: 已完成
- `failed`: 失败 (会自动退款)

### 4. 获取任务列表

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/tasks/list
```

---

## 完整测试脚本

保存以下脚本为 `test_videoai.sh`:

```bash
#!/bin/bash

echo "🧪 VideoAI Pro - 自动化测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. 登录
echo "1️⃣  登录中..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@videoai.pro","password":"admin123456"}')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import json,sys; print(json.load(sys.stdin).get('token',''))")

if [ -z "$TOKEN" ]; then
    echo "❌ 登录失败"
    echo $LOGIN_RESPONSE
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

TASK_ID=$(echo $TASK_RESPONSE | python3 -c "import json,sys; print(json.load(sys.stdin).get('taskId',''))")

if [ -z "$TASK_ID" ]; then
    echo "❌ 任务创建失败"
    exit 1
fi

echo "✅ 任务创建成功: $TASK_ID"
echo ""

# 3. 查询任务状态 (等待5秒)
echo "3️⃣  查询任务状态..."
sleep 5

curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/tasks/$TASK_ID | python3 -m json.tool

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 测试完成！"
echo ""
echo "📝 提示:"
echo "  - Mock 模式会生成测试视频（约2秒）"
echo "  - 真实 GPU 模式生成时间约1-3分钟"
echo "  - 可以继续查询任务状态直到完成"
```

运行测试:
```bash
chmod +x test_videoai.sh
./test_videoai.sh
```

---

## API 端点总结

| 端点 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/auth/login` | POST | ❌ | 登录 |
| `/api/auth/register` | POST | ❌ | 注册 |
| `/api/auth/profile` | GET | ✅ | 获取用户信息 |
| `/api/tasks/create` | POST | ✅ | 创建视频任务 |
| `/api/tasks/list` | GET | ✅ | 获取任务列表 |
| `/api/tasks/:id` | GET | ✅ | 获取任务详情 |
| `/api/tasks/:id` | DELETE | ✅ | 删除任务 |
| `/api/payment/create-checkout` | POST | ✅ | 创建支付 |
| `/api/upload/voice` | POST | ✅ | 上传声音 |
| `/api/upload/template` | POST | ✅ | 上传模板 |
| `/api/admin/stats` | GET | ✅👑 | 管理统计 |

**图例**: ✅ 需要认证 | 👑 需要管理员权限

---

## 常见问题

### Q: 为什么创建任务返回 "Cannot POST /api/tasks"?

A: 正确的端点是 `/api/tasks/create` 而不是 `/api/tasks`

### Q: 如何查看 Mock 生成的视频?

A: Mock 模式生成的视频路径在任务的 `videoUrl` 字段中，例如:
```
http://localhost:3001/public/generated/final_abc123.mp4
```

### Q: 任务一直是 processing 状态?

A: 
1. 检查 Mock 服务是否运行: `ps aux | grep mock`
2. 查看日志: `tail -f /tmp/indextts2_mock.log` 和 `tail -f /tmp/comfyui_mock.log`
3. 重启服务 (参考 DEPLOYMENT_STATUS.md)

### Q: 如何切换到真实 GPU 模式?

A: 
1. 在 GPU 服务器上运行 `deploy_gpu_production.sh`
2. 更新 .env:
   ```
   INDEXTTS2_API_URL=http://gpu-server-ip:5000
   COMFYUI_API_URL=http://gpu-server-ip:8188
   ```
3. 重启后端

---

## 下一步

✅ 完成 API 测试后，您可以:

1. **启动前端**: 
   ```bash
   cd client
   npm run dev
   ```

2. **测试完整流程**: 在前端界面创建视频

3. **准备 GPU 服务器**: 运行 `deploy_gpu_production.sh` 切换到生产模式

4. **部署到生产环境**: 参考 `DEPLOYMENT.md`
