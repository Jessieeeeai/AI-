# 🎉 VideoAI Pro - 本地试用指南

> **目标**: 5分钟内启动完整应用，立即体验所有功能！

---

## 🚀 快速启动 (3步开始)

### 步骤1: 克隆代码 (如果还没克隆)

```bash
# 如果您已经在 /home/user/webapp，跳过此步
cd /home/user
git clone https://github.com/Jessieeeeai/AI-.git webapp
cd webapp
```

### 步骤2: 安装依赖

```bash
npm install
```

### 步骤3: 启动应用 (Mock模式)

```bash
# 一键启动所有服务
npm run dev:mock
```

**启动成功标志**:
```
🎭 Mock IndexTTS2 Service Started
🎭 Mock ComfyUI Service Started  
🎭 Mock Text Optimization Service Started
🎬 VideoAI Pro 后端服务 - http://localhost:3001
➜ Local: http://localhost:5173/
```

---

## 🌐 访问应用

打开浏览器访问: **http://localhost:5173**

---

## ✨ 可体验的功能

### 1. 用户注册/登录 ✅

**操作**:
1. 点击「注册」按钮
2. 填写信息: 
   - 用户名: `testuser`
   - 邮箱: `test@example.com`
   - 密码: `Test123456`
3. 注册成功后自动登录

**预期**:
- ✅ 注册成功
- ✅ 获得1000初始积分
- ✅ 跳转到主页

---

### 2. 声音上传与克隆 ✅

**操作**:
1. 进入「我的声音」页面
2. 点击「上传声音」
3. 选择音频文件 (支持 MP3, WAV, M4A)
4. 输入声音名称: `我的声音1`
5. 提交上传

**预期**:
- ✅ 文件上传成功
- ✅ 自动触发克隆 (Mock模式秒完成)
- ✅ 状态变为「就绪」
- ✅ 可在列表中看到

**提示**: Mock模式下会立即完成，真实GPU环境需要2-3分钟

---

### 3. 文本优化 ✅

**操作**:
1. 在任意文本输入框输入:
   ```
   大家好，欢迎来到我的频道。。今天我们要讨论AI技术，，
   它正在改变我们的生活方式  
   ```
2. 选择语气: `专业`
3. 选择风格: `清晰`
4. 点击「优化文本」

**预期**:
```
优化结果:
大家好，欢迎来到我的频道。今天我们要讨论AI技术，它正在改变我们的生活方式。

改进建议:
- 修复重复句号
- 修复重复逗号
- 去除多余空格
- 调整语气为专业风格
```

---

### 4. TTS语音试听 ✅

**操作**:
1. 进入「TTS试听」页面
2. 输入文本:
   ```
   这是一段测试文本，用于验证TTS功能是否正常工作。
   ```
3. 选择声音: `default` 或您上传的声音
4. 点击「试听」

**预期**:
- ✅ 生成音频 (Mock模式返回测试音频)
- ✅ 显示音频播放器
- ✅ 可以播放试听

---

### 5. 保存草稿 ✅

**操作**:
1. 在文本编辑器输入内容
2. 点击「保存为草稿」
3. 输入标题: `我的第一个草稿`
4. 保存

**预期**:
- ✅ 草稿保存成功
- ✅ 在「我的草稿」列表显示
- ✅ 可以加载和编辑

---

### 6. 创建视频项目 ✅

**操作**:
1. 进入「创建视频」页面
2. 选择模板 (例如: `商务男性`)
3. 输入文本:
   ```
   大家好，欢迎来到VideoAI Pro演示。
   今天我们将展示如何使用AI技术快速生成口播视频。
   这是一个革命性的工具，让视频制作变得简单高效。
   ```
4. 选择声音: 选择之前上传的声音或`default`
5. 点击「生成视频」

**预期**:
- ✅ 项目创建成功
- ✅ 状态显示「处理中」
- ✅ Mock模式下约10秒后完成
- ✅ 在「我的项目」中查看
- ✅ 可以下载视频 (Mock生成的测试视频)

---

### 7. 查看项目列表 ✅

**操作**:
1. 进入「我的项目」页面

**预期**:
- ✅ 显示所有项目
- ✅ 状态标识 (pending/processing/completed/failed)
- ✅ 可以筛选和搜索
- ✅ 分页功能正常

---

### 8. 模板浏览 ✅

**操作**:
1. 进入「模板库」页面

**预期**:
- ✅ 显示预置的5个模板
  - 商务男性
  - 商务女性
  - 活力青年
  - 知性教师
  - 亲和主播
- ✅ 可以查看详情
- ✅ 可以选择用于创建项目

---

## 🧪 测试API接口

### 使用curl测试

```bash
# 1. 注册用户
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "apitest",
    "email": "apitest@example.com",
    "password": "Test123456"
  }'

# 2. 登录获取token
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "apitest@example.com",
    "password": "Test123456"
  }' | jq -r '.token')

# 3. 获取模板列表
curl -X GET "http://localhost:3001/api/templates" \
  -H "Authorization: Bearer $TOKEN"

# 4. 文本优化
curl -X POST http://localhost:3001/api/text-optimization/optimize \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "这是测试文本。。需要优化",
    "tone": "professional",
    "style": "clear"
  }'

# 5. 创建草稿
curl -X POST http://localhost:3001/api/drafts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API测试草稿",
    "textContent": "这是通过API创建的草稿内容"
  }'

# 6. 获取我的草稿
curl -X GET "http://localhost:3001/api/drafts" \
  -H "Authorization: Bearer $TOKEN"

# 7. TTS试听
curl -X POST http://localhost:3001/api/preview/tts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "这是API测试的TTS音频",
    "voiceId": "default"
  }' \
  --output api_test.wav
```

---

## 📊 Mock服务验证

### 检查所有Mock服务

```bash
# IndexTTS2
curl http://localhost:5000/health

# ComfyUI
curl http://localhost:8188/system_stats

# 文本优化
curl http://localhost:5001/health
```

**预期响应**: 所有服务返回健康状态 + `"mode": "MOCK"`

---

## 🐛 故障排查

### 问题1: 端口占用

**症状**: `EADDRINUSE: address already in use`

**解决**:
```bash
# 查找并结束占用端口的进程
lsof -ti:5000 | xargs kill -9
lsof -ti:5001 | xargs kill -9
lsof -ti:8188 | xargs kill -9
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# 重新启动
npm run dev:mock
```

### 问题2: 数据库错误

**症状**: `SQLITE_ERROR: no such table`

**解决**:
```bash
# 重新运行迁移
cd server/migrations
node run.js

# 初始化模板数据
node server/seeds/templates.js
```

### 问题3: 前端连接后端失败

**症状**: API请求返回404或CORS错误

**解决**:
```bash
# 确认后端运行
curl http://localhost:3001/health

# 检查前端配置
cat .env.development
# 应该有: VITE_API_URL=http://localhost:3001
```

### 问题4: Mock服务无响应

**症状**: TTS或视频生成一直loading

**解决**:
```bash
# 重启Mock服务
pkill -f "mock"
npm run mock:services

# 等待5秒后检查
curl http://localhost:5000/health
curl http://localhost:8188/system_stats
curl http://localhost:5001/health
```

---

## 📁 目录结构

```
/home/user/webapp/
├── client/              # React前端源码
├── server/              # Node.js后端源码
│   ├── config/          # 配置 (数据库、AI服务)
│   ├── routes/          # API路由
│   ├── services/        # 业务逻辑服务
│   ├── mocks/           # Mock服务
│   ├── migrations/      # 数据库迁移
│   └── seeds/           # 数据初始化
├── tests/               # 测试脚本
├── database/            # SQLite数据库文件
├── uploads/             # 用户上传文件
├── outputs/             # 生成的音频/视频
└── dist/                # 前端构建产物
```

---

## 🎯 核心功能验证清单

完整体验后，确认以下功能:

- [ ] ✅ 用户注册/登录正常
- [ ] ✅ 声音上传和克隆成功
- [ ] ✅ 文本优化返回结果
- [ ] ✅ TTS试听可以播放
- [ ] ✅ 保存草稿成功
- [ ] ✅ 加载草稿正常
- [ ] ✅ 模板列表显示
- [ ] ✅ 创建视频项目成功
- [ ] ✅ 项目状态更新 (pending → processing → completed)
- [ ] ✅ 视频文件可下载 (Mock视频)

---

## 💡 Mock vs 真实环境对比

| 功能 | Mock环境 | GPU环境 |
|------|---------|---------|
| **TTS生成** | 测试音频 (0.5秒) | 真实语音 (2-5秒) |
| **语音克隆** | 即时完成 | 2-3分钟 |
| **视频生成** | 测试视频 (10秒) | 真实视频 (2-5分钟) |
| **文本优化** | 规则引擎 | GPT-4/GLM-4 |
| **成本** | 免费 | GPU租用费 |
| **适用** | 开发测试 | 生产部署 |

---

## 🚀 下一步

完成本地试用后:

1. ✅ **代码验证通过** - 所有功能在CPU环境正常
2. 📋 **完成部署检查清单** - 参考 `DEPLOYMENT_CHECKLIST.md`
3. 🚀 **部署到GPU** - 参考 `CPU_DEVELOPMENT_GUIDE.md`
4. ⚙️ **切换到生产配置** - 修改 `.env.production`
5. 🎉 **启用真实AI服务** - IndexTTS2 + ComfyUI

---

## 📞 需要帮助?

- 📖 **开发指南**: `CPU_DEVELOPMENT_GUIDE.md`
- 📋 **部署清单**: `DEPLOYMENT_CHECKLIST.md`
- 📝 **文本优化**: `docs/TEXT_OPTIMIZATION_GUIDE.md`
- 🧪 **运行测试**: `npm test`

---

## 🎉 开始体验!

```bash
# 现在就启动吧!
npm run dev:mock
```

然后访问: **http://localhost:5173**

祝您体验愉快! 🚀✨
