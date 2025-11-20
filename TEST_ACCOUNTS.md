# VideoAI Pro - 测试账号信息

## 📝 可用测试账号

以下账号已创建并可直接使用：

### 1. 💎 VIP测试账号（推荐 - 1000积分）
```
邮箱: vip@videoai.com
密码: vip123456
用户名: VIP测试用户
积分: 1000 ⭐
```
**适合：** 大量测试、长视频生成、自定义模板测试

### 2. 测试账号
```
邮箱: test@videoai.com
密码: test123456
用户名: 测试用户
初始积分: 20
```

### 3. 管理员账号
```
邮箱: admin@videoai.com
密码: admin123456
用户名: 管理员
初始积分: 20
```

### 4. 演示账号
```
邮箱: demo@videoai.com
密码: demo123456
用户名: 演示账号
初始积分: 20
```

### 5. 普通用户账号
```
邮箱: user@videoai.com
密码: user123456
用户名: 普通用户
初始积分: 20
```

---

## 🚀 如何登录

### 方法1: 通过前端页面

1. 访问前端地址（需要配置Web服务器）
2. 点击"登录"按钮
3. 输入上述任一账号的邮箱和密码
4. 点击"登录"

### 方法2: 通过API直接登录（测试用）

```bash
# 登录并获取token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@videoai.com",
    "password": "test123456"
  }'

# 返回示例：
{
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 9,
    "email": "test@videoai.com",
    "username": "测试用户",
    "credits": 20,
    "level": 1
  }
}
```

---

## 🔑 Token使用

登录后会返回JWT token，在后续API请求中需要携带：

```bash
# 使用token访问受保护的API
TOKEN="your_token_here"

# 获取用户信息
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/auth/profile

# 创建视频任务
curl -X POST http://localhost:3001/api/tasks/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "你好，这是一段测试文本",
    "voiceId": "default",
    "templateId": "template_1"
  }'
```

---

## 📋 完整测试流程

### 1. 登录
```bash
# 登录获取token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@videoai.com","password":"test123456"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"
```

### 2. 查看用户信息
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/auth/profile
```

### 3. 上传声音文件（可选）
```bash
curl -X POST http://localhost:3001/api/upload/voice \
  -H "Authorization: Bearer $TOKEN" \
  -F "audio=@/path/to/your/audio.mp3"
```

### 4. 创建视频任务
```bash
curl -X POST http://localhost:3001/api/tasks/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "大家好，欢迎来到VideoAI Pro！这是一个使用人工智能技术生成数字人视频的平台。",
    "voiceSettings": {
      "happiness": 0.8,
      "anger": 0.0,
      "sadness": 0.1,
      "surprise": 0.3
    },
    "templateId": "template_1",
    "isCustomTemplate": false
  }'
```

### 5. 查看任务状态
```bash
# 假设返回的任务ID是 task_abc123
TASK_ID="task_abc123"

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/tasks/$TASK_ID
```

### 6. 查看任务列表
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/tasks/list?status=all&limit=20
```

---

## 🎨 前端登录页面

前端已经实现了完整的登录/注册UI：

1. **访问地址：** 需要配置Web服务器托管 `client/dist/`
2. **注册新账号：** 点击"注册"按钮，填写邮箱、密码、用户名
3. **登录：** 输入邮箱和密码即可登录
4. **记住登录状态：** Token会保存在 localStorage 中

---

## 💡 提示

### 密码要求
- 最小长度: 6位
- 建议使用字母+数字组合

### 初始积分
- 每个新注册用户赠送: **20积分**
- 生成视频消耗积分（根据时长和自定义模板）
- 积分不足时需要充值

### 测试环境特性
- 使用Mock服务，生成速度快
- 生成的是测试视频（非真实AI生成）
- 适合测试完整流程和UI交互

---

## 💰 积分管理工具

如需修改用户积分（测试环境）：

```bash
# 使用积分更新脚本
node update_credits.js <用户ID> <积分数量>

# 示例：给用户ID为13的用户设置1000积分
node update_credits.js 13 1000

# 示例：给用户ID为9的用户设置500积分
node update_credits.js 9 500
```

### 查找用户ID

```bash
# 方法1：登录时返回的用户信息中包含ID
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@videoai.com","password":"test123456"}'

# 方法2：登录后查询个人信息
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/auth/profile
```

---

## 🔄 重置密码（如果忘记）

如果忘记密码，可以通过API直接修改数据库：

```bash
# 方法1: 注册新账号
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@test.com",
    "password": "newpassword123",
    "username": "新用户"
  }'

# 方法2: 联系管理员重置（生产环境）
```

---

## 📞 需要帮助？

如果遇到登录问题：

1. 检查服务是否运行: `pm2 status`
2. 查看后端日志: `pm2 logs videoai-backend`
3. 测试API健康: `curl http://localhost:3001/health`
4. 参考文档: `TEST_GUIDE.md`

---

**祝您测试愉快！** 🎉
