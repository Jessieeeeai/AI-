#!/bin/bash

# VideoAI Pro - RunPod 一键部署脚本
# 作者：GenSpark AI
# 日期：2025-11-20

set -e  # 遇到错误立即退出

echo "======================================"
echo "🚀 VideoAI Pro - RunPod 部署脚本"
echo "======================================"
echo ""

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ 请使用root用户运行此脚本${NC}"
    exit 1
fi

# 步骤1：更新系统
echo -e "${GREEN}[1/12] 更新系统...${NC}"
apt-get update
apt-get install -y curl wget git build-essential

# 步骤2：安装Node.js 18
echo -e "${GREEN}[2/12] 安装Node.js 18...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi
node -v
npm -v

# 步骤3：安装PM2
echo -e "${GREEN}[3/12] 安装PM2...${NC}"
npm install -g pm2

# 步骤4：验证Python和CUDA
echo -e "${GREEN}[4/12] 验证Python和CUDA环境...${NC}"
python3 --version
pip3 --version
nvidia-smi

# 步骤5：安装Python依赖
echo -e "${GREEN}[5/12] 安装Python依赖...${NC}"
pip3 install --upgrade pip
pip3 install flask torch torchaudio numpy scipy
pip3 install transformers accelerate requests pillow

# 步骤6：克隆项目代码
echo -e "${GREEN}[6/12] 克隆项目代码...${NC}"
cd /workspace
if [ -d "videoai-webapp" ]; then
    echo -e "${YELLOW}⚠️  项目目录已存在，跳过克隆${NC}"
    cd videoai-webapp
    git pull
else
    echo -e "${YELLOW}请输入您的Git仓库地址（如果没有，输入 'skip' 跳过）:${NC}"
    read -r GIT_REPO
    if [ "$GIT_REPO" != "skip" ]; then
        git clone "$GIT_REPO" videoai-webapp
        cd videoai-webapp
    else
        echo -e "${RED}❌ 需要项目代码才能继续。请先将代码推送到Git仓库。${NC}"
        exit 1
    fi
fi

# 步骤7：安装项目依赖
echo -e "${GREEN}[7/12] 安装项目依赖...${NC}"
npm install

cd client
npm install
npm run build
cd ..

# 步骤8：下载AI模型
echo -e "${GREEN}[8/12] 下载AI模型...${NC}"
mkdir -p /workspace/models

# 下载IndexTTS2（简化版，实际需要真实模型）
echo -e "${YELLOW}ℹ️  模型下载需要较长时间，请耐心等待...${NC}"
cd /workspace/models

# Wav2Vec中文模型
if [ ! -d "chinese-wav2vec2-base" ]; then
    echo "下载Wav2Vec模型..."
    git lfs install
    git clone https://huggingface.co/TencentGameMate/chinese-wav2vec2-base
fi

# 步骤9：配置环境变量
echo -e "${GREEN}[9/12] 配置环境变量...${NC}"
cd /workspace/videoai-webapp

cat > .env << 'EOF'
NODE_ENV=production
PORT=3001

# 数据库配置
DATABASE_PATH=/workspace/videoai-webapp/database/videoai.db

# 文件上传配置
UPLOAD_DIR=/workspace/videoai-webapp/public/uploads

# TTS服务地址
INDEXTTS2_API_URL=http://localhost:5000

# ComfyUI服务地址
COMFYUI_API_URL=http://localhost:8188

# JWT密钥
JWT_SECRET=runpod-videoai-secret-key-$(date +%s)

# 模型路径
WAV2VEC_MODEL_PATH=/workspace/models/chinese-wav2vec2-base
EOF

# 步骤10：初始化数据库
echo -e "${GREEN}[10/12] 初始化数据库...${NC}"
mkdir -p database public/uploads/voices public/uploads/templates public/uploads/videos

# 如果没有初始化脚本，创建一个简单的
if [ ! -f "server/scripts/init_database.js" ]; then
    echo -e "${YELLOW}⚠️  数据库初始化脚本不存在，将在首次启动时自动创建${NC}"
else
    node server/scripts/init_database.js
fi

# 步骤11：创建PM2配置
echo -e "${GREEN}[11/12] 配置PM2...${NC}"
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: 'videoai-backend',
      script: './server/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    {
      name: 'mock-indextts2',
      script: './server/services/mock_indextts2_server.py',
      interpreter: 'python3',
      autorestart: true,
      max_memory_restart: '4G',
      env: {
        PORT: 5000
      },
      error_file: './logs/tts-error.log',
      out_file: './logs/tts-out.log'
    },
    {
      name: 'mock-comfyui',
      script: './server/services/mock_comfyui_server.py',
      interpreter: 'python3',
      autorestart: true,
      max_memory_restart: '8G',
      env: {
        PORT: 8188
      },
      error_file: './logs/comfyui-error.log',
      out_file: './logs/comfyui-out.log'
    }
  ]
};
EOF

mkdir -p logs

# 步骤12：启动服务
echo -e "${GREEN}[12/12] 启动服务...${NC}"
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

# 显示状态
echo ""
echo "======================================"
echo -e "${GREEN}✅ 部署完成！${NC}"
echo "======================================"
echo ""
pm2 status
echo ""
echo -e "${GREEN}📊 查看日志：${NC}"
echo "  pm2 logs"
echo ""
echo -e "${GREEN}🌐 访问地址：${NC}"
echo "  后端API: http://localhost:3001"
echo "  RunPod公网地址: 在RunPod面板查看"
echo ""
echo -e "${GREEN}📝 测试账号：${NC}"
echo "  查看: cat TEST_ACCOUNTS.md"
echo ""
echo -e "${GREEN}🔄 更新代码：${NC}"
echo "  cd /workspace/videoai-webapp"
echo "  git pull"
echo "  pm2 restart all"
echo ""
echo -e "${YELLOW}⚠️  注意：当前使用Mock服务，需要真实TTS和ComfyUI模型才能正常生成${NC}"
echo ""
