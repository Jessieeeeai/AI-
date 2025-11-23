# VideoAI Pro - CPU开发验证指南

> 🎯 **目标**: 在没有GPU的环境下完整验证所有功能，确保代码逻辑正确后再部署到GPU

---

## 📋 目录

1. [环境切换策略](#环境切换策略)
2. [Mock服务架构](#mock服务架构)
3. [本地验证步骤](#本地验证步骤)
4. [测试清单](#测试清单)
5. [部署到GPU](#部署到gpu)
6. [故障排查](#故障排查)

---

## 🔄 环境切换策略

### 开发环境 (CPU - Mock模式)

```bash
# 使用开发环境配置
export NODE_ENV=development

# 或者直接在 .env.development 中设置
USE_MOCK_AI_SERVICES=true
```

**特点**:
- ✅ 无需GPU
- ✅ 无需下载大型模型
- ✅ 快速启动和测试
- ✅ 完整的业务逻辑验证
- ⚠️  生成的音频/视频是模拟数据

### 生产环境 (GPU - Real模式)

```bash
# 使用生产环境配置
export NODE_ENV=production

# 或者直接在 .env.production 中设置
USE_MOCK_AI_SERVICES=false
```

**特点**:
- 🚀 使用真实GPU服务
- 🎨 生成真实的高质量音频/视频
- ⚡ 需要H100 GPU (RunPod)
- 📦 需要下载IndexTTS2和ComfyUI模型

---

## 🏗️ Mock服务架构

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP Requests
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Node.js Backend (Express)                  │
│  ┌────────────────────────────────────────────────┐    │
│  │        Business Logic Services                 │    │
│  │  • voiceCloneService.js                        │    │
│  │  • videoGenerationService.js                   │    │
│  │  • textOptimizationService.js                  │    │
│  └────────┬────────────────────────────────┬──────┘    │
└───────────┼────────────────────────────────┼───────────┘
            │                                │
            ▼                                ▼
 ┌──────────────────────┐        ┌─────────────────────┐
 │ Mock IndexTTS2       │        │ Mock ComfyUI        │
 │ (Port 5000)          │        │ (Port 8188)         │
 │                      │        │                     │
 │ • TTS生成模拟        │        │ • 工作流执行模拟    │
 │ • 语音克隆模拟       │        │ • 视频生成模拟      │
 │ • 返回测试音频       │        │ • 返回测试视频      │
 └──────────────────────┘        └─────────────────────┘
```

---

## 🚀 本地验证步骤

### 步骤1: 安装依赖

```bash
cd /home/user/webapp
npm install
```

### 步骤2: 配置环境

```bash
# 确认开发环境配置
cat .env.development

# 应该看到:
# USE_MOCK_AI_SERVICES=true
# MOCK_INDEXTTS2_PORT=5000
# MOCK_COMFYUI_PORT=8188
```

### 步骤3: 启动Mock服务

```bash
# 方式1: 单独启动Mock服务
npm run mock:services

# 方式2: 同时启动Mock + 后端 + 前端
npm run dev:mock
```

**预期输出**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 Mock IndexTTS2 Service Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 服务地址: http://localhost:5000
🔧 模式: CPU模拟模式 (无GPU依赖)
✨ 功能: TTS生成、语音克隆模拟
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 Mock ComfyUI Service Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 服务地址: http://localhost:8188
🔧 模式: CPU模拟模式 (无GPU依赖)
✨ 功能: 视频生成工作流模拟
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 步骤4: 运行测试套件

```bash
# 测试Mock服务是否正常
node tests/test-mock-services.js

# 测试视频生成流程
node tests/test-video-generation.js
```

**预期结果**:
```
✅ 所有测试通过！Mock服务运行正常
✨ 您可以开始开发和测试视频生成功能
```

### 步骤5: 手动功能测试

1. **注册/登录**
   ```bash
   # 访问前端
   http://localhost:5173
   
   # 注册新账户
   # 登录系统
   ```

2. **上传声音**
   ```bash
   # 上传音频文件 (支持 .mp3, .wav, .m4a)
   # 查看克隆状态
   ```

3. **TTS试听**
   ```bash
   # 输入文本
   # 选择声音
   # 点击试听 (会调用Mock IndexTTS2)
   ```

4. **创建视频项目**
   ```bash
   # 选择模板
   # 输入文本
   # 选择声音
   # 生成视频 (会调用Mock ComfyUI)
   ```

---

## ✅ 测试清单

### Phase 1: Mock服务验证

- [ ] Mock IndexTTS2启动成功
- [ ] Mock ComfyUI启动成功
- [ ] 健康检查接口正常
- [ ] TTS生成返回音频数据
- [ ] ComfyUI工作流提交成功

### Phase 2: 业务逻辑验证

- [ ] 用户注册/登录
- [ ] 积分系统计算正确
- [ ] 声音上传成功
- [ ] 声音克隆状态更新
- [ ] 文本分段逻辑正确
- [ ] TTS音频生成正常
- [ ] 音频合并功能正常
- [ ] ComfyUI工作流构建正确
- [ ] 任务状态轮询正常
- [ ] 视频生成流程完整

### Phase 3: 数据库验证

- [ ] 用户表数据正确
- [ ] 声音表状态更新
- [ ] 草稿表保存正常
- [ ] 项目表记录完整
- [ ] 积分交易记录准确

### Phase 4: API接口验证

- [ ] `/api/auth/register` - 注册
- [ ] `/api/auth/login` - 登录
- [ ] `/api/upload/audio` - 声音上传
- [ ] `/api/voices/mine` - 我的声音列表
- [ ] `/api/preview/tts` - TTS试听
- [ ] `/api/drafts` - 草稿管理
- [ ] `/api/projects` - 项目管理
- [ ] `/api/templates` - 模板管理

### Phase 5: 错误处理验证

- [ ] 文件类型错误提示
- [ ] 文件大小超限提示
- [ ] 积分不足提示
- [ ] 服务不可用提示
- [ ] 超时重试机制
- [ ] 数据库错误处理

---

## 🚀 部署到GPU

当CPU环境所有测试通过后，部署到GPU只需简单配置切换：

### 步骤1: 切换环境变量

```bash
# RunPod H100环境
export NODE_ENV=production

# 或修改 .env.production
USE_MOCK_AI_SERVICES=false
INDEXTTS2_API_URL=http://localhost:5001  # 真实IndexTTS2端口
COMFYUI_API_URL=http://localhost:8188    # 真实ComfyUI端口
```

### 步骤2: 部署真实AI服务

```bash
# 部署IndexTTS2
bash deploy_indextts2.sh

# 安装ComfyUI (如果需要)
bash install_comfyui.sh

# 启动所有服务
pm2 start ecosystem.config.js
```

### 步骤3: 验证真实服务

```bash
# 健康检查
curl http://localhost:5001/health
curl http://localhost:8188/system_stats

# 测试TTS
curl -X POST http://localhost:5001/api/v1/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"测试文本","voiceId":"default"}' \
  --output test.wav
```

### 步骤4: 重启后端服务

```bash
pm2 restart videoai-backend
pm2 logs videoai-backend
```

**预期输出**:
```
⚙️  AI服务配置
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 模式: 🚀 Real (GPU生产)
📡 IndexTTS2: http://localhost:5001
🎬 ComfyUI: http://localhost:8188
✨ 文本优化: openai
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔧 故障排查

### 问题1: Mock服务启动失败

**症状**: `EADDRINUSE` 端口占用错误

**解决**:
```bash
# 查找占用端口的进程
lsof -ti:5000 | xargs kill -9
lsof -ti:8188 | xargs kill -9

# 重新启动
npm run mock:services
```

### 问题2: 测试脚本连接超时

**症状**: `ECONNREFUSED` 或 `ETIMEDOUT`

**解决**:
```bash
# 确认Mock服务运行
ps aux | grep "mockIndexTTS2\|mockComfyUI"

# 检查端口监听
netstat -tuln | grep "5000\|8188"

# 重启Mock服务
npm run mock:services
```

### 问题3: TTS返回空音频

**症状**: 音频文件大小为0或很小

**解决**:
```bash
# 检查Mock服务日志
# 应该看到TTS请求日志

# 手动测试
curl -X POST http://localhost:5000/api/v1/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"测试","voiceId":"default"}' \
  --output test.wav

# 检查文件大小
ls -lh test.wav
```

### 问题4: GPU部署后服务不可用

**症状**: 切换到production后API报错

**解决**:
```bash
# 确认真实服务运行
pm2 status

# 检查端口
curl http://localhost:5001/health
curl http://localhost:8188/system_stats

# 查看日志
pm2 logs indextts2 --lines 50
pm2 logs comfyui --lines 50

# 重新部署
bash clean_and_deploy.sh
```

---

## 📊 开发 vs 生产对比

| 功能 | 开发环境 (CPU Mock) | 生产环境 (GPU Real) |
|------|-------------------|-------------------|
| **启动时间** | < 10秒 | 2-5分钟 (模型加载) |
| **GPU需求** | ❌ 不需要 | ✅ H100 80GB |
| **模型下载** | ❌ 不需要 | ✅ 需要 (~20GB) |
| **TTS质量** | 模拟音频 | 真实高质量音频 |
| **视频质量** | 模拟视频 | 真实高质量视频 |
| **处理速度** | 即时返回 | 取决于GPU性能 |
| **成本** | 💰 免费 | 💰💰💰 GPU租用费用 |
| **适用场景** | 开发、测试、逻辑验证 | 生产、用户使用 |

---

## 🎯 总结

通过这套CPU开发验证方案，您可以:

1. ✅ **无GPU完整开发**: 在本地CPU环境完成所有业务逻辑开发
2. ✅ **快速迭代测试**: 无需等待模型加载，快速测试功能
3. ✅ **逻辑正确性保证**: 通过Mock服务验证所有业务流程
4. ✅ **平滑过渡到GPU**: 只需切换配置文件，无需修改代码
5. ✅ **降低开发成本**: 开发阶段无需租用昂贵的GPU

**下一步**: 完成所有CPU测试后，将代码部署到RunPod H100，切换到生产模式即可！

---

## 📞 需要帮助?

如果遇到问题:
1. 检查Mock服务日志
2. 运行测试脚本诊断
3. 查看本文档的故障排查部分
4. 联系技术支持

祝开发顺利! 🚀
