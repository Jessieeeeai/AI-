# IndexTTS2 快速部署指南

## 🚀 在 RunPod 服务器上执行以下命令

### 第一步：拉取最新代码
```bash
cd /workspace/videoai-pro
git pull origin main
```

### 第二步：执行部署脚本
```bash
chmod +x deploy_indextts2.sh
./deploy_indextts2.sh
```

**预计时间**: 15-30 分钟（取决于网络速度）

部署过程包括：
1. ✅ 安装 `uv` 包管理器
2. ✅ 克隆 IndexTTS2 官方仓库
3. ✅ 安装 Python 依赖（PyTorch, torchaudio 等）
4. ✅ 下载 IndexTTS2 模型（约 15GB）
5. ✅ 创建 Flask API 服务器
6. ✅ 创建启动脚本

### 第三步：启动服务
```bash
cd /workspace/index-tts
pm2 start start_service.sh --name indextts2 --interpreter bash
```

### 第四步：验证服务
```bash
# 等待 2-3 分钟让模型加载到 GPU
sleep 120

# 检查健康状态
curl http://localhost:5000/health

# 预期输出:
# {
#   "status": "healthy",
#   "mode": "production",
#   "device": "cuda:0",
#   "model_loaded": true,
#   "custom_voices": 0
# }
```

### 第五步：测试 TTS
```bash
curl -X POST http://localhost:5000/api/v1/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "你好，这是 IndexTTS2 测试",
    "voiceId": "default"
  }' \
  -o test_tts.wav

# 检查文件大小（应该 > 0）
ls -lh test_tts.wav
```

### 第六步：运行数据库迁移
```bash
cd /workspace/videoai-pro
node server/migrations/run.js
```

### 第七步：重启后端
```bash
pm2 restart backend
pm2 logs backend --lines 50 --nostream
```

---

## ✅ 完成检查清单

- [ ] IndexTTS2 仓库克隆成功
- [ ] 模型下载完成（checkpoints 目录约 15GB）
- [ ] API 服务启动成功（PM2 状态显示 online）
- [ ] 健康检查返回 `model_loaded: true`
- [ ] 测试 TTS 生成音频文件
- [ ] 数据库迁移执行成功
- [ ] 后端服务重启完成

---

## 📊 监控命令

```bash
# 查看服务状态
pm2 status

# 查看 IndexTTS2 日志
pm2 logs indextts2 --lines 100

# 查看后端日志
pm2 logs backend --lines 100

# 实时监控 GPU
nvidia-smi -l 1

# 查看 GPU 内存使用
nvidia-smi --query-gpu=memory.used,memory.total --format=csv
```

---

## ⚠️ 常见问题

### 问题 1: uv 命令找不到
```bash
# 重新加载环境变量
export PATH="$HOME/.cargo/bin:$PATH"
source ~/.bashrc
```

### 问题 2: 模型下载失败
```bash
# 使用镜像加速
export HF_ENDPOINT="https://hf-mirror.com"

# 重新下载
cd /workspace/index-tts
hf download IndexTeam/IndexTTS-2 --local-dir=checkpoints
```

### 问题 3: CUDA 内存不足
```bash
# 停止其他 GPU 进程
pm2 stop comfyui

# 重启 IndexTTS2
pm2 restart indextts2
```

### 问题 4: 模型加载失败
```bash
# 查看详细日志
pm2 logs indextts2 --lines 200

# 检查 PyTorch 是否识别 GPU
cd /workspace/index-tts
uv run python3 -c "import torch; print('CUDA:', torch.cuda.is_available())"
```

---

## 🎉 测试声音克隆

部署完成后，在网站上：

1. **上传声音文件** - 选择一个清晰的音频文件（3-10秒）
2. **等待处理** - 约 10-30 秒后状态变为 "ready"
3. **点击试听** - 输入测试文本，点击"试听"按钮
4. **听到克隆的声音** - 应该能听到你上传的声音特征

---

## 📖 完整文档

详细的 API 文档和故障排查请查看：
👉 **DEPLOY_INDEXTTS2.md**
