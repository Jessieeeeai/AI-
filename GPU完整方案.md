# 🎮 VideoAI Pro - 完整GPU方案

## 🎯 技术架构

### 组件清单
1. **IndexTTS2** - 文字转语音（TTS）
2. **ComfyUI + MuseTalk/SadTalker** - 数字人视频生成
3. **FFmpeg** - 视频处理和合并
4. **Redis** - 任务队列
5. **Node.js后端** - 任务调度和API
6. **SQLite** - 数据存储

---

## 📦 服务器配置要求

### GPU服务器
- **GPU**: RTX 3090 (24GB) 或更高
- **CPU**: 8核+
- **内存**: 32GB+
- **存储**: 200GB+
- **系统**: Ubuntu 20.04/22.04

### 推荐平台
- **AutoDL**: ¥2.5/小时，国内访问快
- **RunPod**: $0.34/小时，国际访问
- **腾讯云GPU**: 稳定但贵

---

## 🚀 部署步骤

### 第1步：租GPU并基础配置（30分钟）

#### 1.1 创建GPU实例
```bash
# AutoDL控制台
# 选择：RTX 3090 + PyTorch 2.1.0镜像
# 存储：100GB
```

#### 1.2 连接服务器
```bash
# SSH连接
ssh root@你的服务器IP
```

#### 1.3 安装基础依赖
```bash
# 更新系统
apt update && apt upgrade -y

# 安装必要工具
apt install -y git curl wget vim htop nvidia-smi

# 安装Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 安装FFmpeg
apt install -y ffmpeg

# 安装Redis
apt install -y redis-server
systemctl start redis
systemctl enable redis

# 验证安装
node -v  # 应该显示v20.x
npm -v
ffmpeg -version
redis-cli ping  # 应该返回PONG
nvidia-smi  # 查看GPU信息
```

---

### 第2步：部署IndexTTS2（1小时）

#### 2.1 克隆IndexTTS2
```bash
cd /workspace
git clone https://github.com/Jessieeeeai/IndexTTS2.git
cd IndexTTS2
```

#### 2.2 创建Python环境
```bash
# 创建虚拟环境
conda create -n indextts2 python=3.10 -y
conda activate indextts2

# 安装依赖
pip install -r requirements.txt
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

#### 2.3 下载模型
```bash
# 下载预训练模型（约2GB）
python scripts/download_models.py
```

#### 2.4 配置HTTP API
```bash
# 编辑配置文件
cat > config.yaml << EOF
server:
  host: 0.0.0.0
  port: 5000
  workers: 2

model:
  checkpoint_path: ./checkpoints/indextts2_base.pth
  device: cuda
  max_batch_size: 4

audio:
  sample_rate: 16000
  format: wav
EOF
```

#### 2.5 启动服务（使用PM2）
```bash
# 安装PM2
npm install -g pm2

# 创建启动脚本
cat > start_tts.sh << 'EOF'
#!/bin/bash
cd /workspace/IndexTTS2
conda activate indextts2
python api_server.py
EOF

chmod +x start_tts.sh

# 用PM2启动
pm2 start start_tts.sh --name indextts2 --interpreter bash
pm2 save
```

#### 2.6 测试TTS服务
```bash
# 测试API
curl -X POST http://localhost:5000/api/v1/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "你好，这是测试",
    "voiceId": "default",
    "emoVector": [0.7, 0.0, 0.1, 0.0, 0.0, 0.0, 0.3, 0.3]
  }' \
  --output test.wav

# 如果生成了test.wav文件，说明成功！
ls -lh test.wav
```

---

### 第3步：部署ComfyUI + 数字人模型（2小时）

#### 3.1 安装ComfyUI
```bash
cd /workspace
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

# 安装依赖
pip install -r requirements.txt
pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu118
```

#### 3.2 安装MuseTalk（推荐）
```bash
cd /workspace/ComfyUI/custom_nodes

# 克隆MuseTalk
git clone https://github.com/TMElyralab/MuseTalk.git
cd MuseTalk

# 安装依赖
pip install -r requirements.txt

# 下载模型（约8GB）
mkdir -p models
cd models
wget https://huggingface.co/TMElyralab/MuseTalk/resolve/main/musetalk.pth
wget https://huggingface.co/TMElyralab/MuseTalk/resolve/main/dwpose.pth
```

#### 3.3 配置ComfyUI API
```bash
cd /workspace/ComfyUI

# 创建配置
cat > extra_model_paths.yaml << EOF
comfyui:
  base_path: /workspace/ComfyUI/
  checkpoints: models/checkpoints
  vae: models/vae
  loras: models/loras
  upscale_models: models/upscale_models
  embeddings: models/embeddings
  controlnet: models/controlnet
EOF
```

#### 3.4 启动ComfyUI
```bash
# 创建启动脚本
cat > /workspace/start_comfyui.sh << 'EOF'
#!/bin/bash
cd /workspace/ComfyUI
python main.py --listen 0.0.0.0 --port 8188
EOF

chmod +x /workspace/start_comfyui.sh

# 用PM2启动
pm2 start /workspace/start_comfyui.sh --name comfyui --interpreter bash
pm2 save
```

#### 3.5 测试ComfyUI
```bash
# 访问Web界面
# http://你的服务器IP:8188

# 或测试API
curl http://localhost:8188/system_stats
```

---

### 第4步：部署VideoAI Pro后端（30分钟）

#### 4.1 克隆项目
```bash
cd /workspace
git clone https://github.com/你的用户名/videoai-pro.git
cd videoai-pro
```

#### 4.2 安装依赖
```bash
npm install
```

#### 4.3 配置环境变量
```bash
# 创建.env文件
cat > .env << EOF
# 服务器配置
PORT=3001
NODE_ENV=production

# JWT密钥
JWT_SECRET=$(openssl rand -base64 32)

# TTS服务
INDEXTTS2_API_URL=http://localhost:5000

# ComfyUI服务
COMFYUI_API_URL=http://localhost:8188

# Redis
REDIS_URL=redis://localhost:6379

# 文件存储路径
UPLOAD_DIR=/workspace/videoai-pro/public/uploads
GENERATED_DIR=/workspace/videoai-pro/public/generated
EOF
```

#### 4.4 初始化数据库
```bash
# 运行数据库迁移
npm run migrate
```

#### 4.5 构建前端
```bash
npm run build
```

#### 4.6 启动服务
```bash
# 用PM2启动
pm2 start npm --name videoai-backend -- run start
pm2 save
```

---

### 第5步：配置Nginx反向代理（15分钟）

#### 5.1 安装Nginx
```bash
apt install -y nginx
```

#### 5.2 配置站点
```bash
cat > /etc/nginx/sites-available/videoai << 'EOF'
server {
    listen 80;
    server_name 你的域名或IP;

    client_max_body_size 100M;

    # 前端静态文件
    location / {
        root /workspace/videoai-pro/dist;
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 静态资源
    location /public {
        alias /workspace/videoai-pro/public;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 启用站点
ln -s /etc/nginx/sites-available/videoai /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# 测试配置
nginx -t

# 重启Nginx
systemctl restart nginx
systemctl enable nginx
```

---

### 第6步：创建视频生成Worker（核心）

现在我帮你写完整的视频生成逻辑！

这是最重要的部分，我马上开始写代码...

---

## 📊 服务状态检查

```bash
# 查看所有服务
pm2 status

# 应该看到：
# - indextts2 (running)
# - comfyui (running)
# - videoai-backend (running)

# 查看GPU使用
nvidia-smi

# 查看Redis
redis-cli ping

# 查看Nginx
systemctl status nginx
```

---

## 💰 成本估算

### GPU服务器（AutoDL）
- RTX 3090: ¥2.5/小时
- 24小时运行: ¥60/天 = ¥1800/月

### 优化建议
1. **按需启动**: 有任务时开机，闲时关机 → 省50%
2. **夜间低价时段**: 凌晨使用更便宜
3. **预付费**: 充值送代金券

---

接下来我写核心的Worker代码！
