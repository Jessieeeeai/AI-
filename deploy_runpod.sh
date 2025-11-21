#!/bin/bash
# VideoAI Pro - RunPod 专用部署脚本
# 针对RunPod环境优化

set -e

echo "🚀 VideoAI Pro - RunPod 部署脚本"
echo "================================================"
echo ""

# 显示系统信息
echo "📊 系统信息："
echo "  操作系统: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "  Python版本: $(python3 --version)"
echo "  CUDA版本: $(nvidia-smi | grep "CUDA Version" | awk '{print $9}')"
echo "  GPU型号: $(nvidia-smi --query-gpu=name --format=csv,noheader)"
echo ""

# 检测工作目录
if [ -d "/workspace" ]; then
    WORK_DIR="/workspace"
    echo "✅ 检测到 /workspace 目录"
else
    WORK_DIR="$HOME"
    echo "⚠️  使用 $HOME 作为工作目录"
fi

echo "工作目录: $WORK_DIR"
echo ""

# 询问是否继续
read -p "是否继续部署？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "取消部署"
    exit 1
fi

# 1. 更新系统
echo ""
echo "📦 [1/9] 更新系统..."
apt update
apt upgrade -y

# 2. 安装基础工具
echo ""
echo "🔧 [2/9] 安装基础工具..."
apt install -y git curl wget vim htop build-essential unzip

# 3. 安装Node.js 20
echo ""
echo "📗 [3/9] 安装Node.js 20..."
if ! command -v node &> /dev/null; then
    echo "安装Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
else
    echo "Node.js已安装: $(node -v)"
fi

# 4. 安装Redis
echo ""
echo "💾 [4/9] 安装Redis..."
if ! command -v redis-server &> /dev/null; then
    apt install -y redis-server
    # 启动Redis
    redis-server --daemonize yes --bind 127.0.0.1 --port 6379
    echo "✅ Redis已启动"
else
    echo "Redis已安装"
    redis-cli ping > /dev/null 2>&1 || redis-server --daemonize yes --bind 127.0.0.1 --port 6379
fi

# 5. 安装FFmpeg
echo ""
echo "🎬 [5/9] 安装FFmpeg..."
apt install -y ffmpeg
echo "FFmpeg版本: $(ffmpeg -version | head -n 1)"

# 6. 安装PM2
echo ""
echo "⚙️  [6/9] 安装PM2..."
npm install -g pm2

# 7. 克隆VideoAI Pro项目
echo ""
echo "📥 [7/9] 克隆VideoAI Pro项目..."
cd "$WORK_DIR"

if [ ! -d "videoai-pro" ]; then
    echo ""
    echo "❓ 请输入你的Git仓库地址："
    echo "   格式: https://github.com/你的用户名/videoai-pro.git"
    read -p "Git URL: " GIT_URL
    
    if [ -z "$GIT_URL" ]; then
        echo "❌ Git URL不能为空"
        exit 1
    fi
    
    git clone "$GIT_URL" videoai-pro
    cd videoai-pro
else
    echo "⏭️  videoai-pro已存在，跳过克隆"
    cd videoai-pro
    git pull
fi

# 8. 部署后端
echo ""
echo "🌐 [8/9] 部署VideoAI Pro后端..."

# 安装依赖
echo "安装Node.js依赖..."
npm install

# 创建必要目录
mkdir -p data public/uploads public/generated public/voices

# 创建.env文件
if [ ! -f ".env" ]; then
    echo "创建.env配置..."
    cat > .env << EOF
# 服务器配置
PORT=3001
NODE_ENV=production

# JWT密钥（随机生成）
JWT_SECRET=$(openssl rand -base64 32)

# AI服务（后续配置）
INDEXTTS2_API_URL=http://localhost:9880
COMFYUI_API_URL=http://localhost:8188

# OpenAI（可选，用于文本优化）
OPENAI_API_KEY=

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# 文件路径
UPLOAD_DIR=./public/uploads
GENERATED_DIR=./public/generated
VOICES_DIR=./public/voices

# 数据库
DATABASE_PATH=./data/database.sqlite
EOF
    echo "✅ .env文件已创建"
else
    echo "⏭️  .env文件已存在"
fi

# 运行数据库迁移
echo "初始化数据库..."
node server/migrations/run.js

# 构建前端
echo "构建前端..."
cd client
npm install
npm run build
cd ..

# 复制前端构建产物
rm -rf dist
cp -r client/dist ./dist

# 启动后端
echo "启动后端服务..."
pm2 delete videoai 2>/dev/null || true
pm2 start server/index.js --name videoai --node-args="--max-old-space-size=4096"

# 9. 配置Nginx
echo ""
echo "🌍 [9/9] 配置Nginx..."

if ! command -v nginx &> /dev/null; then
    apt install -y nginx
fi

# 创建Nginx配置
cat > /etc/nginx/sites-available/videoai << 'NGINX_EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name _;
    
    client_max_body_size 100M;
    
    # 前端
    location / {
        root WORK_DIR_PLACEHOLDER/videoai-pro/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }
    
    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
    
    # 静态文件（上传的音频、生成的视频）
    location /public {
        alias WORK_DIR_PLACEHOLDER/videoai-pro/public;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_EOF

# 替换工作目录占位符
sed -i "s|WORK_DIR_PLACEHOLDER|$WORK_DIR|g" /etc/nginx/sites-available/videoai

# 启用站点
ln -sf /etc/nginx/sites-available/videoai /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试并重启Nginx
nginx -t && systemctl restart nginx

# 保存PM2配置
pm2 save

# 完成
echo ""
echo "================================================"
echo "✅ VideoAI Pro 部署完成！"
echo "================================================"
echo ""

# 获取公网IP
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "未知")

echo "🎉 服务已启动！"
echo ""
echo "📊 服务状态："
pm2 status
echo ""
echo "🌐 访问地址："
echo "   http://$PUBLIC_IP"
echo ""
echo "⚠️  注意事项："
echo "   1. RunPod默认开放80端口，可以直接访问"
echo "   2. 如果需要HTTPS，请配置Cloudflare Tunnel"
echo "   3. 请稍后手动部署IndexTTS2和ComfyUI（见下方说明）"
echo ""
echo "📝 常用命令："
echo "   查看后端日志: pm2 logs videoai"
echo "   重启后端: pm2 restart videoai"
echo "   查看所有服务: pm2 status"
echo "   查看GPU状态: nvidia-smi"
echo "   查看Redis: redis-cli ping"
echo ""
echo "🎤 下一步：部署AI服务"
echo "   1. IndexTTS2（语音生成）"
echo "   2. ComfyUI（视频生成）"
echo "   运行: bash deploy_ai_services.sh"
echo ""
