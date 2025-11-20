# 🚀 视频生成功能快速启动指南

## ✅ 当前状态

**已完成的集成工作**:
- ✅ IndexTTS2 API 封装服务器 (`indextts2_server.py`)
- ✅ ComfyUI 工作流适配器 (基于用户提供的真实工作流)
- ✅ 视频生成服务 (`videoGenerationService.js`)
- ✅ 任务队列集成 (`taskController.js`)
- ✅ 情感向量映射 (4维 → 8维)
- ✅ 智能文本分段 (300字符/60秒)
- ✅ 预扣费和自动退款机制
- ✅ 视频片段合并 (FFmpeg)

## 📋 前置条件检查清单

### 1. GPU 服务器环境
- [ ] NVIDIA GPU (建议 24GB+ 显存)
- [ ] CUDA 11.8+
- [ ] Python 3.10+
- [ ] Ubuntu 20.04+ 或 CentOS 7+

### 2. 已安装服务
- [ ] IndexTTS2 (克隆并配置完成)
- [ ] ComfyUI (克隆并配置完成)
- [ ] 所需模型文件 (Wan2.1, InfiniteTalk, VAE, T5, etc.)

### 3. Node.js 后端
- [ ] 已更新 `.env` 配置
- [ ] FFmpeg 已安装 (`ffmpeg -version`)

## 🎯 三步快速启动

### Step 1: 启动 GPU 服务 (在 GPU 服务器上)

#### 启动 IndexTTS2 HTTP API

```bash
# 进入 IndexTTS2 目录
cd /path/to/index-tts

# 激活虚拟环境
source .venv/bin/activate

# 复制 API 服务器脚本
cp /home/user/webapp/server/services/indextts2_server.py ./

# 安装额外依赖
pip install flask flask-cors

# 配置环境变量
export INDEXTTS2_CONFIG="checkpoints/config.yaml"
export INDEXTTS2_MODEL_DIR="checkpoints"
export INDEXTTS2_FP16="true"
export PORT="5000"

# 启动服务 (后台运行)
nohup python indextts2_server.py > indextts2.log 2>&1 &

# 验证服务
curl http://localhost:5000/health
# 预期输出: {"status":"healthy","model_loaded":true}
```

#### 启动 ComfyUI

```bash
# 进入 ComfyUI 目录
cd /path/to/ComfyUI

# 上传工作流文件
cp /home/user/uploaded_files/数字分身对口型：wan2.1搭配infinitetalk\(1\).json.txt \
   workflows/wan_infinitetalk.json

# 启动 ComfyUI (后台运行)
nohup python main.py --listen 0.0.0.0 --port 8188 > comfyui.log 2>&1 &

# 验证服务
curl http://localhost:8188/system_stats
```

### Step 2: 配置 Node.js 后端 (在应用服务器上)

```bash
cd /home/user/webapp

# 编辑 .env 文件
nano .env
```

添加或更新以下配置:

```env
# 如果 GPU 服务在同一台机器
INDEXTTS2_API_URL=http://localhost:5000
COMFYUI_API_URL=http://localhost:8188

# 如果 GPU 服务在不同机器
INDEXTTS2_API_URL=http://192.168.1.100:5000  # 替换为实际 IP
COMFYUI_API_URL=http://192.168.1.100:8188
```

### Step 3: 重启 Node.js 后端

```bash
cd /home/user/webapp

# 停止现有进程
pkill -f "node server/index.js"

# 重新启动
nohup node server/index.js > server.log 2>&1 &

# 检查日志
tail -f server.log
```

## 🧪 测试集成

### 测试 1: IndexTTS2 音频生成

```bash
curl -X POST http://localhost:5000/api/v1/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "你好，这是一个测试",
    "emo_vector": [0.7, 0.0, 0.1, 0.0, 0.0, 0.0, 0.3, 0.3],
    "emo_alpha": 0.8,
    "use_random": false
  }' \
  --output test_audio.wav

# 播放测试
ffplay test_audio.wav
```

### 测试 2: ComfyUI 可用性

```bash
# 访问 ComfyUI Web 界面
# 浏览器打开: http://your-gpu-server:8188

# 加载工作流
# 点击 "Load" -> 选择 "wan_infinitetalk.json"

# 运行一次测试确保所有节点正常
```

### 测试 3: 完整视频生成流程

```bash
# 获取 JWT token (先登录)
TOKEN="your_jwt_token_here"

# 创建测试任务
curl -X POST http://localhost:3001/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "大家好，我是你们的数字分身。今天天气很好，心情也很愉快。让我们一起来创造美好的未来吧！",
    "voiceSettings": {
      "happiness": 0.8,
      "sadness": 0.0,
      "anger": 0.0,
      "surprise": 0.2,
      "pitch": 1.0,
      "speed": 1.0
    },
    "templateId": "template_1"
  }' | jq

# 响应示例:
# {
#   "success": true,
#   "taskId": "abc123",
#   "message": "任务创建成功，正在生成中",
#   "estimatedTime": "2-3分钟",
#   "costBreakdown": {...}
# }

# 查询任务状态
TASK_ID="abc123"  # 替换为实际 task ID
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/tasks/$TASK_ID | jq

# 状态流转:
# pending -> processing (10-100%) -> completed
#                                  -> failed (自动退款)
```

## 📊 监控和日志

### 查看各服务日志

```bash
# IndexTTS2 日志
tail -f /path/to/index-tts/indextts2.log

# ComfyUI 日志
tail -f /path/to/ComfyUI/comfyui.log

# Node.js 后端日志
tail -f /home/user/webapp/server.log

# GPU 使用情况
watch -n 1 nvidia-smi
```

### 关键日志指标

**成功生成**:
```
🎬 开始生成视频: task_123
📝 文本已分为 1 段
🎵 处理第 1/1 段...
🎤 调用 IndexTTS2 生成音频...
✅ 音频生成成功: audio_1234567890_0.wav
🎬 调用 ComfyUI 生成视频...
📤 任务已提交到 ComfyUI: prompt_abc
✅ 视频生成成功: video_1234567890_0.mp4
🎞️ 合并视频片段...
✅ 视频合并完成: final_task_123.mp4
✅ 视频生成完成: task_123
```

**失败并退款**:
```
❌ 视频生成失败: task_123
💰 已退还 30 积分给用户 user_456
```

## 🔧 常见问题

### Q1: IndexTTS2 连接拒绝

**症状**: `无法连接到 IndexTTS2 服务 (http://localhost:5000)`

**解决**:
```bash
# 检查服务是否运行
ps aux | grep indextts2_server.py

# 检查端口占用
lsof -i :5000

# 重启服务
pkill -f indextts2_server.py
nohup python indextts2_server.py > indextts2.log 2>&1 &
```

### Q2: ComfyUI 工作流节点缺失

**症状**: ComfyUI 报错 `Node type 'MultiTalkModelLoader' not found`

**解决**:
```bash
cd ComfyUI/custom_nodes
git clone https://github.com/kijai/ComfyUI-WanVideoWrapper.git
cd ComfyUI-WanVideoWrapper
pip install -r requirements.txt
# 重启 ComfyUI
```

### Q3: 显存不足 (OOM)

**症状**: CUDA out of memory

**解决**:
- 已启用 FP8 量化 (工作流默认配置)
- 已启用 CPU offload (`offload_device`)
- 已启用 Block Swap (节省 40% 显存)
- 如仍不够,考虑升级 GPU 或减少并发任务

### Q4: 视频生成超时

**症状**: `ComfyUI 视频生成超时`

**解决**:
- 检查 ComfyUI 日志是否有错误
- 确认模型文件完整 (`ls -lh ComfyUI/models/`)
- 增加超时时间 (`videoGenerationService.js` 第 195 行)

## 📈 性能优化建议

### 推荐硬件配置

| 显存  | 并发任务 | 生成速度        | 成本/小时 (AWS) |
|------|---------|----------------|----------------|
| 24GB | 1       | ~2分钟/视频     | ~$1.00         |
| 40GB | 2-3     | ~1.5分钟/视频   | ~$2.50         |
| 80GB | 4-6     | ~1分钟/视频     | ~$4.00         |

### 软件优化

1. **启用 Torch Compile** (已配置)
2. **使用量化模型** (FP8, 已配置)
3. **启用 VAE Tiling** (已配置)
4. **使用 SageAttention** (已配置)

## 🎉 下一步

集成完成后,您可以:

1. **前端测试**: 登录 VideoAI Pro → 创建视频 → 查看生成进度
2. **监控仪表板**: 管理后台查看任务统计和系统状态
3. **生产部署**: 参考 `DEPLOYMENT.md` 部署到云服务器
4. **性能调优**: 根据实际负载调整并发数和资源分配

## 📚 参考文档

- 完整部署指南: `INDEXTTS2_COMFYUI_SETUP.md`
- 项目文档: `README.md`
- 部署文档: `DEPLOYMENT.md`
- 进度追踪: `PROGRESS.md`

## 💡 技术支持

如遇到问题:
1. 查看日志文件
2. 检查服务状态 (`curl /health`)
3. 验证网络连接 (`ping`, `telnet`)
4. 参考 GitHub Issues

---

**祝您部署顺利！🎊**
