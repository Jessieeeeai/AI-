# IndexTTS2 部署指南

本文档说明如何在 RunPod H100 上部署真正的 IndexTTS2 服务，替换 Mock 服务以实现真实的声音克隆功能。

## 🎯 功能

- ✅ 真实的 Text-to-Speech (TTS) 生成
- ✅ 声音克隆（从用户上传的音频提取声音特征）
- ✅ 情感控制（快乐度、悲伤度、惊讶度等）
- ✅ 自定义声音管理
- ✅ RESTful API 接口

## 📋 前置要求

- RunPod H100 GPU 实例
- CUDA 12.1+
- Python 3.10+
- 至少 30GB 磁盘空间（用于模型）

## 🚀 部署步骤

### 1. 在 RunPod 服务器上停止 Mock 服务

```bash
# 找到 Mock IndexTTS2 进程
ps aux | grep mock_indextts2_server.py

# 停止进程（替换 PID）
kill <PID>

# 验证端口 5000 已释放
lsof -i :5000
```

### 2. 执行部署脚本

```bash
# 上传部署脚本到服务器
cd /workspace/videoai-pro

# 复制部署脚本
# deploy_indextts2.sh 应该在项目根目录

# 赋予执行权限
chmod +x deploy_indextts2.sh

# 执行部署（需要 15-30 分钟）
./deploy_indextts2.sh
```

部署脚本会自动完成：
- 克隆 IndexTTS2 仓库
- 创建 Python 虚拟环境
- 安装 PyTorch 和依赖
- 从 Hugging Face 下载模型（约 15GB）
- 创建 API 服务包装器
- 配置启动脚本

### 3. 启动 IndexTTS2 服务

```bash
# 方式1：使用 PM2（推荐）
cd /workspace/index-tts
pm2 start start_service.sh --name indextts2 --interpreter bash

# 方式2：前台运行（测试用）
cd /workspace/index-tts
./start_service.sh
```

### 4. 验证服务状态

```bash
# 检查健康状态
curl http://localhost:5000/health

# 预期输出：
# {
#   "status": "healthy",
#   "mode": "production",
#   "device": "cuda:0",
#   "model_loaded": true,
#   "custom_voices": 0
# }

# 测试 TTS 生成
curl -X POST http://localhost:5000/api/v1/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"你好，这是测试","voiceId":"default"}' \
  -o test.wav

# 播放测试文件
# ffplay test.wav
```

### 5. 运行数据库迁移

```bash
cd /workspace/videoai-pro

# 执行迁移（添加 processed_at 和 error_message 字段）
node server/migrations/run.js
```

### 6. 重启后端服务

```bash
cd /workspace/videoai-pro

# 重启 Node.js 后端
pm2 restart backend

# 查看日志
pm2 logs backend --lines 50
```

## 🔧 API 接口说明

### 1. TTS 生成

**端点**: `POST /api/v1/tts`

**请求体**:
```json
{
  "text": "要合成的文本",
  "voiceId": "default",
  "emoVector": [0.7, 0.0, 0.1, 0.0, 0.0, 0.0, 0.3, 0.3],
  "emoAlpha": 0.8
}
```

**情感向量** (emoVector):
- [0] happiness (快乐度)
- [1] anger (愤怒度)
- [2] sadness (悲伤度)
- [3] afraid (恐惧度)
- [4] disgusted (厌恶度)
- [5] melancholic (忧郁度)
- [6] surprise (惊讶度)
- [7] calm (平静度)

**响应**: 音频文件 (audio/wav)

### 2. 声音克隆

**端点**: `POST /api/v1/clone`

**请求体** (multipart/form-data):
```
voiceId: "用户的声音ID"
audioFile: <音频文件>
```

或 (JSON):
```json
{
  "voiceId": "用户的声音ID",
  "audioPath": "/workspace/videoai-pro/public/uploads/voices/xxx.m4a"
}
```

**响应**:
```json
{
  "success": true,
  "voiceId": "xxx",
  "message": "声音克隆成功"
}
```

### 3. 健康检查

**端点**: `GET /health`

**响应**:
```json
{
  "status": "healthy",
  "mode": "production",
  "device": "cuda:0",
  "model_loaded": true,
  "custom_voices": 5
}
```

### 4. 列出声音

**端点**: `GET /api/v1/voices`

**响应**:
```json
{
  "success": true,
  "voices": {
    "system": ["default"],
    "custom": ["voice-id-1", "voice-id-2"]
  }
}
```

## 🔄 后端集成

后端已自动集成声音克隆功能：

1. **上传声音文件** → `POST /api/upload/voice`
   - 文件保存到 `/public/uploads/voices/`
   - 数据库状态设为 `processing`
   - 自动触发声音克隆任务

2. **声音克隆处理** → `voiceCloneService.processUserVoice()`
   - 调用 IndexTTS2 的 `/api/v1/clone` 接口
   - 成功后更新状态为 `ready`
   - 失败则更新状态为 `failed` 并记录错误

3. **预览声音** → `POST /api/preview/tts`
   - 使用克隆的声音生成 TTS
   - 支持情感参数调整
   - 返回音频文件供前端播放

## 🧪 测试流程

### 1. 上传声音文件

```bash
# 使用前端界面上传音频文件
# 或使用 API 测试：

curl -X POST http://<RUNPOD_URL>/api/upload/voice \
  -H "Authorization: Bearer <TOKEN>" \
  -F "audio=@test_voice.m4a"
```

### 2. 检查处理状态

```bash
# 查询用户声音列表
curl http://<RUNPOD_URL>/api/upload/voices \
  -H "Authorization: Bearer <TOKEN>"

# 响应示例：
# {
#   "success": true,
#   "voices": [
#     {
#       "id": "voice-id-123",
#       "status": "ready",
#       "processed_at": "2025-11-21 10:30:00"
#     }
#   ]
# }
```

### 3. 测试声音预览

```bash
curl -X POST http://<RUNPOD_URL>/api/preview/tts \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "这是我克隆的声音测试",
    "voiceId": "voice-id-123",
    "voiceSettings": {
      "happiness": 0.7,
      "sadness": 0.1,
      "surprise": 0.3
    }
  }' \
  -o preview.wav

# 播放预览
# ffplay preview.wav
```

## 📊 监控和日志

### PM2 监控

```bash
# 查看服务状态
pm2 status

# 查看 IndexTTS2 日志
pm2 logs indextts2 --lines 100

# 查看后端日志
pm2 logs backend --lines 100

# 监控资源使用
pm2 monit
```

### GPU 监控

```bash
# 实时监控 GPU
nvidia-smi -l 1

# 查看 GPU 进程
nvidia-smi pmon

# 查看 GPU 内存
nvidia-smi --query-gpu=memory.used,memory.total --format=csv
```

## ⚠️ 故障排查

### 问题 1: 模型加载失败

**症状**: `model_loaded: false` 或启动报错

**解决**:
```bash
# 检查模型文件
ls -lh /workspace/index-tts/checkpoints/

# 重新下载模型
cd /workspace/index-tts
python3 -c "from huggingface_hub import snapshot_download; \
  snapshot_download('IndexTeam/IndexTTS-2', local_dir='checkpoints')"
```

### 问题 2: CUDA 内存不足

**症状**: `CUDA out of memory`

**解决**:
```bash
# 查看 GPU 使用情况
nvidia-smi

# 停止其他 GPU 进程
pm2 stop comfyui

# 重启 IndexTTS2
pm2 restart indextts2
```

### 问题 3: 声音克隆一直处于 processing 状态

**症状**: 上传后状态不更新

**解决**:
```bash
# 查看后端日志
pm2 logs backend | grep "声音克隆"

# 手动触发处理队列
cd /workspace/videoai-pro
node -e "
const service = require('./server/services/voiceCloneService.js').default;
service.processQueue().then(() => console.log('Done'));
"

# 检查数据库状态
node -e "
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./database/videoai.db');
db.all('SELECT id, status, error_message FROM user_voices WHERE status = \"processing\"', (err, rows) => {
  console.log(rows);
  db.close();
});
"
```

### 问题 4: 端口冲突

**症状**: `Address already in use`

**解决**:
```bash
# 查找占用 5000 端口的进程
lsof -i :5000

# 停止旧进程
kill <PID>

# 重启服务
pm2 restart indextts2
```

## 🎉 完成

部署完成后，你应该能够：

1. ✅ 在前端上传音频文件
2. ✅ 看到 "上传成功，正在处理中" 提示
3. ✅ 等待 10-30 秒后状态更新为 "ready"
4. ✅ 点击"试听"按钮听到你克隆的声音
5. ✅ 调整情感参数并实时预览效果

## 📚 相关文件

- `/workspace/videoai-pro/deploy_indextts2.sh` - 部署脚本
- `/workspace/index-tts/api_server.py` - IndexTTS2 API 服务
- `/workspace/videoai-pro/server/services/voiceCloneService.js` - 声音克隆服务
- `/workspace/videoai-pro/server/controllers/uploadController.js` - 上传控制器
- `/workspace/videoai-pro/server/routes/preview.js` - 预览路由

## 🔗 参考链接

- [IndexTTS2 GitHub](https://github.com/AnyaCoder/IndexTTS-2)
- [Hugging Face Model](https://huggingface.co/IndexTeam/IndexTTS-2)
- [PM2 文档](https://pm2.keymetrics.io/docs/)
