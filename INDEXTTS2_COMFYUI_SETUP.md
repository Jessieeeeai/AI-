# IndexTTS2 + ComfyUI 集成部署指南

## 📋 概述

本文档说明如何部署 IndexTTS2 和 ComfyUI 服务以支持视频生成功能。

## 🏗️ 架构图

```
用户请求 → Node.js 后端 → IndexTTS2 HTTP API (Python) → 生成音频
                       ↓
                    ComfyUI API → Wan2.1 + InfiniteTalk → 生成视频
                       ↓
                    返回视频URL
```

## 📦 准备工作

### 1. GPU 服务器要求

- **显存**: 至少 24GB (推荐 40GB+)
- **CUDA**: 11.8 或更高
- **Python**: 3.10+
- **操作系统**: Ubuntu 20.04/22.04 或 CentOS 7+

### 2. 所需模型文件

#### IndexTTS2 模型
- 下载地址: https://huggingface.co/IndexTeam/Index-1.9B-Chat
- 模型文件:
  - `config.yaml`
  - `model.safetensors`
  - `pinyin.vocab`

#### Wan2.1 模型
- 模型: `Wan2_1-I2V-14B-480p_fp8_e4m3fn_scaled_KJ.safetensors`
- VAE: `wan_2.1_vae.safetensors`
- T5 文本编码器: `umt5_xxl_fp16.safetensors`
- CLIP Vision: `clip_vision_h.safetensors`

#### InfiniteTalk 模型
- 模型路径: `InfiniteTalk/Wan2_1-InfiniTetalk-Single_fp16.safetensors`

#### Wav2Vec 模型
- 模型: `TencentGameMate/chinese-wav2vec2-base`

#### LoRA (可选)
- `lightx2v_I2V_14B_480p_cfg_step_distill_rank128_bf16.safetensors`

## 🚀 部署步骤

### Step 1: 安装 IndexTTS2

```bash
# 克隆仓库
git clone https://github.com/index-tts/index-tts.git
cd index-tts

# 安装依赖 (使用 uv 包管理器)
pip install uv
uv venv
source .venv/bin/activate  # Linux
# 或 .venv\Scripts\activate  # Windows

uv pip install -e .

# 下载模型到 checkpoints 目录
mkdir -p checkpoints
cd checkpoints
huggingface-cli download IndexTeam/Index-1.9B-Chat --local-dir .

# 或使用 modelscope (中国用户)
pip install modelscope
modelscope download --model IndexTeam/Index-1.9B-Chat --local_dir .
```

### Step 2: 启动 IndexTTS2 HTTP API 服务

```bash
# 复制我们的 API 服务器脚本
cp /path/to/indextts2_server.py ./

# 安装额外依赖
pip install flask flask-cors

# 配置环境变量
export INDEXTTS2_CONFIG="checkpoints/config.yaml"
export INDEXTTS2_MODEL_DIR="checkpoints"
export INDEXTTS2_FP16="true"  # 节省显存
export PORT="5000"

# 启动服务 (使用 nohup 后台运行)
nohup python indextts2_server.py > indextts2.log 2>&1 &

# 检查日志
tail -f indextts2.log

# 测试健康检查
curl http://localhost:5000/health
```

### Step 3: 安装 ComfyUI

```bash
# 克隆 ComfyUI
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

# 安装依赖
pip install -r requirements.txt

# 安装自定义节点
cd custom_nodes

# Wan Video Wrapper
git clone https://github.com/kijai/ComfyUI-WanVideoWrapper.git
cd ComfyUI-WanVideoWrapper
pip install -r requirements.txt
cd ..

# Video Helper Suite (用于视频处理)
git clone https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite.git
cd ComfyUI-VideoHelperSuite
pip install -r requirements.txt
cd ..

# MTB Nodes (用于音频处理)
git clone https://github.com/melMass/comfy_mtb.git
cd comfy_mtb
pip install -r requirements.txt
cd ..

cd ../..  # 回到 ComfyUI 根目录
```

### Step 4: 下载并放置模型文件

```bash
# ComfyUI 模型目录结构
ComfyUI/
├── models/
│   ├── checkpoints/
│   │   └── Wan2_1-I2V-14B-480p_fp8_e4m3fn_scaled_KJ.safetensors
│   ├── vae/
│   │   └── wan_2.1_vae.safetensors
│   ├── clip_vision/
│   │   └── clip_vision_h.safetensors
│   ├── umt5/
│   │   └── umt5_xxl_fp16.safetensors
│   ├── loras/
│   │   └── lightx2v_I2V_14B_480p_cfg_step_distill_rank128_bf16.safetensors
│   └── multitalk/
│       └── InfiniteTalk/
│           └── Wan2_1-InfiniTetalk-Single_fp16.safetensors

# 下载模型 (示例)
cd models/checkpoints
# 从 Hugging Face 或其他源下载模型文件
```

### Step 5: 上传工作流到 ComfyUI

```bash
# 将用户提供的工作流文件复制到 ComfyUI
cp /home/user/uploaded_files/数字分身对口型：wan2.1搭配infinitetalk\(1\).json.txt \
   ComfyUI/workflows/wan_infinitetalk.json

# 或通过 ComfyUI Web 界面上传
```

### Step 6: 启动 ComfyUI

```bash
# 启动 ComfyUI API 服务器
cd ComfyUI
nohup python main.py --listen 0.0.0.0 --port 8188 > comfyui.log 2>&1 &

# 检查日志
tail -f comfyui.log

# 测试 ComfyUI API
curl http://localhost:8188/system_stats
```

### Step 7: 配置 Node.js 后端

在 `/home/user/webapp/.env` 文件中添加:

```env
# IndexTTS2 配置
INDEXTTS2_API_URL=http://your-gpu-server:5000

# ComfyUI 配置
COMFYUI_API_URL=http://your-gpu-server:8188
```

如果在同一台服务器:
```env
INDEXTTS2_API_URL=http://localhost:5000
COMFYUI_API_URL=http://localhost:8188
```

## 🧪 测试集成

### 1. 测试 IndexTTS2

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

### 2. 测试 ComfyUI

```bash
# 通过 Web 界面测试: http://your-gpu-server:8188
# 加载工作流: wan_infinitetalk.json
# 手动运行一次确保所有节点正常工作
```

### 3. 测试完整流程

在 VideoAI Pro 后端:

```bash
# 创建一个测试任务
curl -X POST http://localhost:3001/api/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
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

# 查看任务状态
curl http://localhost:3001/api/tasks/TASK_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔧 故障排查

### IndexTTS2 服务无法启动

1. **检查 CUDA 环境**:
```bash
nvidia-smi
python -c "import torch; print(torch.cuda.is_available())"
```

2. **检查模型文件**:
```bash
ls -lh checkpoints/
# 应该看到 config.yaml 和模型文件
```

3. **查看日志**:
```bash
tail -n 100 indextts2.log
```

### ComfyUI 节点缺失

```bash
cd ComfyUI/custom_nodes
ls -la

# 重新安装缺失的节点
git clone [missing_node_repo]
cd [node_directory]
pip install -r requirements.txt
```

### 显存不足 (OOM)

1. **启用 FP16**:
```bash
export INDEXTTS2_FP16="true"
```

2. **减少 batch size** (在工作流中调整)

3. **使用 CPU offload** (已在工作流中配置):
   - `offload_device` 模式
   - Block swap 功能

### 生成速度慢

1. **使用量化模型**:
   - FP8: `fp8_e4m3fn_scaled`
   - 已在工作流中配置

2. **启用 Torch Compile**:
   - 已在工作流中配置 (Node 99)

3. **检查 GPU 利用率**:
```bash
watch -n 1 nvidia-smi
```

## 📊 性能优化

### 推荐配置

| 显存  | IndexTTS2 | ComfyUI (Wan2.1) | 并发数 |
|------|-----------|------------------|--------|
| 24GB | FP16      | FP8              | 1      |
| 40GB | FP16      | FP16             | 2      |
| 80GB | FP16      | FP16             | 4      |

### 生成时间预估

- **音频生成** (IndexTTS2): ~2-5秒/句
- **视频生成** (Wan2.1 + InfiniteTalk): ~30-60秒/段 (根据长度)
- **总时间**: ~1-2分钟/分钟视频

## 🔐 安全建议

1. **内网部署**: IndexTTS2 和 ComfyUI 不应暴露到公网
2. **使用防火墙**: 只允许 Node.js 后端访问
3. **API 认证**: 考虑添加 API key 认证
4. **速率限制**: 防止滥用

## 📚 相关资源

- IndexTTS2 GitHub: https://github.com/index-tts/index-tts
- ComfyUI GitHub: https://github.com/comfyanonymous/ComfyUI
- Wan Video Wrapper: https://github.com/kijai/ComfyUI-WanVideoWrapper
- VideoAI Pro 项目文档: `/home/user/webapp/README.md`

## 💬 需要帮助?

如果遇到问题:
1. 检查日志文件
2. 确认模型文件完整
3. 验证 GPU 环境
4. 查看相关 GitHub Issues
